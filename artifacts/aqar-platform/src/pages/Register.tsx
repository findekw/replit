import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye, EyeOff, CheckCircle,
  Loader2, Link2, Check, X, Home, MailCheck,
} from "lucide-react";
import { authApi } from "@/lib/auth";
import { useOfficeAuth } from "@/lib/AuthContext";

type Role = "user" | "office";
type FormState = "idle" | "loading" | "verify" | "verifying" | "success" | "error";
type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

// Arabic → English transliteration map
const AR_EN: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "a",
  "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh",
  "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d",
  "ط": "t", "ظ": "z", "ع": "a", "غ": "gh",
  "ف": "f", "ق": "q", "ك": "k", "ل": "l",
  "م": "m", "ن": "n", "ه": "h", "و": "w",
  "ي": "y", "ى": "a", "ة": "a", "ء": "",
  "ئ": "y", "ؤ": "w", " ": "-",
};

// Generic office/company type words to exclude — NOT brand or location names
const STOP_WORDS = new Set([
  "مكتب", "عقاري", "العقاري", "العقارية", "للعقارات", "للعقار",
  "عقارات", "العقارات", "شركة", "مؤسسة", "مجموعة", "خدمات",
  "مكاتب", "وساطة", "استشارات",
  "office", "company", "realestate", "real", "estate", "group", "services",
]);

const RESERVED = new Set([
  "properties", "offices", "admin", "login", "register",
  "plans", "dashboard", "api", "health", "by-slug",
]);

const KuwaitFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 900 600"
    style={{ width: 22, height: 15, display: "block", borderRadius: 2, flexShrink: 0 }}
    aria-label="علم الكويت"
  >
    <rect width="900" height="200" fill="#007a3d" />
    <rect y="200" width="900" height="200" fill="#ffffff" />
    <rect y="400" width="900" height="200" fill="#ce1126" />
    <polygon points="0,0 300,300 0,600" fill="#000000" />
  </svg>
);

const PHONE_COUNTRIES = [
  { code: "KW", dialCode: "965", maxDigits: 8 },
] as const;

const DEFAULT_COUNTRY = PHONE_COUNTRIES[0];

const SLUG_MIN = 3;
const SLUG_MAX = 15;

function transliterateWord(word: string): string {
  return word.split("").map((c) => AR_EN[c] ?? "").join("").replace(/[^a-z]/g, "");
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "").slice(0, SLUG_MAX);
}

function suggestSlugs(officeName: string): string[] {
  if (!officeName.trim()) return [];
  const words = officeName.trim().split(/\s+/);

  // Keep only brand/name words — filter out generic office-type words
  const brandWords = words.filter(
    (w) => !STOP_WORDS.has(w) && !STOP_WORDS.has(w.toLowerCase()),
  );

  // If every word was a stop word, fall back to only the first word (better than all of them)
  const target = brandWords.length > 0 ? brandWords : [words[0]].filter(Boolean);
  if (target.length === 0) return [];

  const suggestions: string[] = [];

  // First brand word transliterated alone (most readable)
  const first = slugify(transliterateWord(target[0]));
  if (first.length >= SLUG_MIN) {
    suggestions.push(first);
    // Variant without "al" / "el" prefix  (e.g. "alkuwait" → "kuwai")
    if ((first.startsWith("al") || first.startsWith("el")) && first.slice(2).length >= SLUG_MIN) {
      const noPrefix = first.slice(2);
      if (!suggestions.includes(noPrefix)) suggestions.push(noPrefix);
    }
  }

  // Full brand words joined (only if more than one brand word and result differs)
  if (target.length > 1) {
    const full = slugify(target.map(transliterateWord).filter(Boolean).join(""));
    if (full.length >= SLUG_MIN && !suggestions.includes(full)) {
      suggestions.push(full);
    }
  }

  return suggestions
    .filter((s) => /^[a-z]{3,15}$/.test(s) && !RESERVED.has(s))
    .slice(0, 3);
}

function isValidSlugFormat(slug: string): boolean {
  return /^[a-z]{3,15}$/.test(slug) && !RESERVED.has(slug);
}

function phoneError(phone: string, maxDigits = DEFAULT_COUNTRY.maxDigits): string {
  if (!phone) return "يرجى إدخال رقم الموبايل";
  if (phone.length < maxDigits) return `رقم الموبايل يجب أن يكون ${maxDigits} أرقام`;
  if (phone.length > maxDigits) return `رقم الموبايل يجب أن لا يتجاوز ${maxDigits} أرقام`;
  if (!/^\d+$/.test(phone)) return "يرجى إدخال أرقام فقط";
  return "";
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const SPECIAL_RE = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?`~]/;

function validatePassword(pw: string): string {
  if (ARABIC_RE.test(pw)) return "كلمة المرور لا تقبل أحرفًا عربية";
  if (pw.length < 6 || pw.length > 14) return "كلمة المرور من 6 إلى 14 حرفًا";
  if (!/[a-zA-Z]/.test(pw)) return "يجب أن تحتوي على حرف إنجليزي ورقم ورمز";
  if (!/[0-9]/.test(pw)) return "يجب أن تحتوي على حرف إنجليزي ورقم ورمز";
  if (!SPECIAL_RE.test(pw)) return "يجب أن تحتوي على رمز واحد على الأقل (مثل: !@#$)";
  return "";
}

function PasswordInput({ value, onChange, placeholder, id, hasError, testId, onFocus, onBlur }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
  hasError?: boolean;
  testId?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const val = e.target.value.replace(ARABIC_RE, "");
          onChange(val);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`pl-10 ${hasError ? "border-red-400 focus-visible:ring-red-300" : ""}`}
        data-testid={testId}
        dir="ltr"
        autoComplete="off"
        inputMode="text"
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{msg}</p>;
}

export default function Register() {
  const [, navigate] = useLocation();
  const { refetch } = useOfficeAuth();

  const [role] = useState<Role>("office");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [formState, setFormState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (role === "office" && name) setSuggestions(suggestSlugs(name));
    else setSuggestions([]);
  }, [name, role]);

  useEffect(() => {
    if (role !== "office" || !slug) { setSlugStatus("idle"); return; }
    if (!isValidSlugFormat(slug)) { setSlugStatus("invalid"); return; }
    setSlugStatus("checking");
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/api/slugs/check?slug=${encodeURIComponent(slug)}`, { credentials: "include" });
        const data = await res.json() as { available: boolean };
        setSlugStatus(data.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 500);
  }, [slug, role]);

  function validateAll(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "يرجى إدخال الاسم";
    if (role === "office" && !slug) {
      errs.slug = "يرجى إدخال رابط الصفحة";
    } else if (role === "office" && slug && slug.length < SLUG_MIN) {
      errs.slug = `الرابط يجب أن يكون ${SLUG_MIN} أحرف على الأقل`;
    } else if (role === "office" && slug && !isValidSlugFormat(slug)) {
      errs.slug = "الرابط يقبل الحروف الإنجليزية فقط، بدون أرقام أو رموز";
    } else if (role === "office" && slug && slugStatus === "taken") {
      errs.slug = "هذا الرابط مستخدم بالفعل";
    }
    if (!email.includes("@") || !email.includes(".")) errs.email = "يرجى إدخال بريد إلكتروني صحيح";
    const pErr = phoneError(phone); if (pErr) errs.phone = pErr;
    const pwErr = validatePassword(password);
    if (pwErr) errs.password = pwErr;
    const cpwErr = validatePassword(confirmPassword);
    if (!errs.password && cpwErr) errs.confirmPassword = cpwErr;
    if (!errs.password && !errs.confirmPassword && password !== confirmPassword) errs.confirmPassword = "كلمتا المرور غير متطابقتين";
    if (!agreedToTerms) errs.terms = "يجب الموافقة على الشروط والأحكام للمتابعة";
    return errs;
  }

  function clearError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setFormState("loading");
    const fullPhone = "965" + phone.trim();
    try {
      const result = await authApi.office.register({
        name: name.trim(), email: email.trim(), phone: fullPhone, password,
        ...(slug ? { slug } : {}),
      });
      setVerificationEmail(result.email ?? email.trim());
      setOtp("");
      setOtpMessage("");
      setFormState("verify");
      setMessage(result.message);
    } catch (err: any) {
      if (err?.requiresEmailVerification) {
        setVerificationEmail(err.email ?? email.trim());
        setOtp("");
        setOtpMessage(err?.error ?? "تعذر إرسال الرمز. اطلب إرسال رمز جديد بعد التأكد من إعدادات البريد.");
        setMessage("");
        setFormState("verify");
        return;
      }
      setFormState("error");
      if (err?.details?.length) {
        const errsFromServer: Record<string, string> = {};
        err.details.forEach((d: string) => { errsFromServer.server = d; });
        setFieldErrors(errsFromServer);
      } else {
        setFieldErrors({ server: err?.error ?? "حدث خطأ غير متوقع، حاول مرة أخرى" });
      }
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setOtpMessage("أدخل رمز التفعيل المكون من 6 أرقام");
      return;
    }
    setFormState("verifying");
    setOtpMessage("");
    try {
      const result = await authApi.office.verifyEmail({ email: verificationEmail, otp });
      await refetch();
      setFormState("success");
      setMessage(result.message);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      setFormState("verify");
      setOtpMessage(err?.error ?? "رمز التفعيل غير صحيح، حاول مرة أخرى");
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpMessage("");
    try {
      const result = await authApi.office.resendVerification({ email: verificationEmail });
      setOtp("");
      setOtpMessage(result.message);
    } catch (err: any) {
      setOtpMessage(err?.error ?? "تعذر إرسال رمز جديد، حاول مرة أخرى");
    } finally {
      setResendLoading(false);
    }
  };

  if (formState === "success") {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #111827, #667EEA)" }}>
        <div className="w-full max-w-md rounded-3xl p-10 text-center" style={{ background: "#ffffff", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3">تم بنجاح!</h2>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {role === "office" ? "جارٍ تحويلك للوحة التحكم..." : "جارٍ تحويلك للصفحة الرئيسية..."}
          </p>
        </div>
      </div>
    );
  }

  if (formState === "verify" || formState === "verifying") {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{
          minHeight: "100svh",
          padding: "max(18px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom))",
          background: "linear-gradient(135deg, #111827, #667EEA)",
        }}
      >
        <div
          className="w-full max-w-md"
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}
        >
          <div className="text-center mb-6">
            <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">فعّل بريدك الإلكتروني</h1>
            <p className="text-sm text-muted-foreground mt-2">
              أرسلنا رمز التفعيل إلى <span dir="ltr" className="font-semibold text-foreground">{verificationEmail}</span>
            </p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
              {message}
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="otp" className="mb-1 block">رمز التفعيل</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpMessage("");
                }}
                disabled={formState === "verifying"}
                className="h-14 text-center text-lg font-bold tracking-[0.28em]"
                dir="ltr"
                data-testid="input-register-otp"
              />
              {otpMessage && <p className="text-sm mt-2" style={{ color: otpMessage.includes("تم") || otpMessage.includes("مفعل") ? "#16a34a" : "#ef4444" }}>{otpMessage}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={formState === "verifying"} data-testid="button-verify-email">
              {formState === "verifying"
                ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جارٍ التفعيل...</>
                : "تفعيل الحساب"}
            </Button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || formState === "verifying"}
              className="w-full text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            >
              {resendLoading ? "جارٍ إرسال رمز جديد..." : "إرسال رمز جديد"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              العودة لتسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  const slugIndicator = () => {
    if (!slug) return null;
    if (slugStatus === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (slugStatus === "available") return <Check className="h-4 w-4 text-green-500" />;
    if (slugStatus === "taken" || slugStatus === "invalid") return <X className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "linear-gradient(135deg, #111827, #667EEA)" }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "#ffffff", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Finde" className="site-logo" style={{ marginBottom: 10, margin: "0 auto 10px" }} />
          </Link>
          <h1 className="text-xl font-bold text-foreground">ابدأ تسجيل مكتبك العقاري</h1>
          <p style={{ fontSize: 14, color: "#0f172a" }} className="mt-1.5">اعرض عقاراتك واستقبل طلبات العملاء بسهولة</p>
        </div>

        {/* Feature link */}
        <p className="text-center mb-5" style={{ color: "#667EEA", fontWeight: 500, fontSize: 15 }}>
          🔗 رابط خاص لمكتبك تقدر مشاركته في واتساب، إنستغرام والبزنس كارد
        </p>

        {/* Server-level error */}
        {fieldErrors.server && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {fieldErrors.server}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form" noValidate>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="mb-1 block">
              {role === "office" ? "اسم المكتب" : "الاسم الكامل"}
            </Label>
            <Input
              id="name"
              placeholder={role === "office" ? "مكتب الكويت العقاري" : "أحمد الكويتي"}
              value={name}
              onChange={(e) => {
                const val = role === "office"
                  ? e.target.value.replace(/[a-zA-Z0-9!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~]/g, "")
                  : e.target.value;
                setName(val);
                clearError("name");
              }}
              className={fieldErrors.name ? "border-red-400 focus-visible:ring-red-300" : ""}
              disabled={formState === "loading"}
              data-testid="input-register-name"
            />
            {role === "office" && (
              <p className="text-xs text-muted-foreground mt-1">اسم المكتب بالعربي فقط</p>
            )}
            <FieldError msg={fieldErrors.name} />
          </div>


          {/* Slug — office only */}
          {role === "office" && (
            <div>
              <Label htmlFor="slug" className="mb-1 flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                رابط الصفحة
              </Label>

              {/* Auto-suggest pills */}
              {suggestions.length > 0 && !slug && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {suggestions.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => { setSlug(s); clearError("slug"); }}
                      className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-mono"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* URL input: fixed prefix + editable slug */}
              <div
                style={{
                  display: "flex",
                  direction: "ltr",
                  border:
                    fieldErrors.slug || slugStatus === "taken"
                      ? "1px solid #f87171"
                      : slugStatus === "available"
                      ? "1px solid #22c55e"
                      : "1px solid hsl(var(--input))",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "hsl(var(--background))",
                }}
              >
                {/* Fixed prefix — never editable */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    background: "#F3F4F6",
                    borderRight: "1px solid hsl(var(--border))",
                    whiteSpace: "nowrap",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    userSelect: "none",
                    flexShrink: 0,
                    fontFamily: "monospace",
                    letterSpacing: "0.01em",
                  }}
                >
                  finde.co/
                </div>

                {/* Editable slug part */}
                <input
                  id="slug"
                  placeholder="alkuwait"
                  value={slug}
                  maxLength={SLUG_MAX}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, SLUG_MAX));
                    clearError("slug");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    background: "transparent",
                    outline: "none",
                    color: "hsl(var(--foreground))",
                    direction: "ltr",
                    minWidth: 0,
                  }}
                  disabled={formState === "loading"}
                  data-testid="input-register-slug"
                  dir="ltr"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />

                {/* Status icon */}
                {slug && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingInlineEnd: "10px",
                      flexShrink: 0,
                    }}
                  >
                    {slugIndicator()}
                  </div>
                )}
              </div>

              <div className="mt-1.5 space-y-0.5">
                {slugStatus === "available" && !fieldErrors.slug && (
                  <p className="text-xs font-medium text-green-600">متاح ✓</p>
                )}
                {slugStatus === "taken" && !fieldErrors.slug && (
                  <p className="text-xs font-medium text-red-500">الرابط مستخدم بالفعل</p>
                )}
                <p className="text-xs text-muted-foreground" dir="rtl">
                  مثال رابط مكتبك: <span className="font-mono" style={{ direction: "ltr", unicodeBidi: "embed" }}>finde.co/alkuwait</span>
                </p>
              </div>
              <FieldError msg={fieldErrors.slug} />
            </div>
          )}

          {/* Email */}
          <div>
            <Label htmlFor="email" className="mb-1 block">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.replace(/[^a-zA-Z0-9_.@+\-]/g, ""));
                clearError("email");
              }}
              className={fieldErrors.email ? "border-red-400 focus-visible:ring-red-300" : ""}
              disabled={formState === "loading"}
              data-testid="input-register-email"
              autoComplete="email"
              dir="ltr"
            />
            <FieldError msg={fieldErrors.email} />
          </div>

          {/* Phone — country prefix on left, digits on right */}
          <div>
            <Label htmlFor="phone" className="mb-1 block">رقم الموبايل</Label>
            <div
              style={{
                display: "flex",
                direction: "ltr",
                border: fieldErrors.phone ? "1px solid #f87171" : "1px solid hsl(var(--input))",
                borderRadius: "8px",
                overflow: "hidden",
                background: "hsl(var(--background))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0 12px",
                  background: "hsl(var(--muted))",
                  borderRight: "1px solid hsl(var(--input))",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "hsl(var(--muted-foreground))",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                <KuwaitFlag />
                <span>+{DEFAULT_COUNTRY.dialCode}</span>
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="12345678"
                maxLength={DEFAULT_COUNTRY.maxDigits}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, DEFAULT_COUNTRY.maxDigits));
                  clearError("phone");
                }}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  fontSize: "14px",
                  background: "transparent",
                  outline: "none",
                  color: "hsl(var(--foreground))",
                  direction: "ltr",
                  minWidth: 0,
                }}
                disabled={formState === "loading"}
                data-testid="input-register-phone"
              />
            </div>
            <FieldError msg={fieldErrors.phone} />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="mb-1 block">كلمة المرور</Label>
            <PasswordInput
              id="password"
              placeholder="ادخل كلمة المرور"
              value={password}
              onChange={(v) => { setPassword(v); clearError("password"); }}
              hasError={!!fieldErrors.password}
              testId="input-register-password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {passwordFocused && !fieldErrors.password && validatePassword(password) !== "" && (
              <p className="text-xs text-muted-foreground mt-1">
                من 6 إلى 14 حرفًا، تشمل حروف إنجليزية وأرقام ورمز
              </p>
            )}
            <FieldError msg={fieldErrors.password} />
          </div>

          {/* Confirm password */}
          <div>
            <Label htmlFor="confirmPassword" className="mb-1 block">تأكيد كلمة المرور</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="أعد كتابة كلمة المرور"
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); clearError("confirmPassword"); }}
              hasError={!!fieldErrors.confirmPassword}
              testId="input-register-confirm-password"
            />
            <FieldError msg={fieldErrors.confirmPassword} />
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => { setAgreedToTerms(e.target.checked); clearError("terms"); }}
                  className="sr-only"
                  data-testid="checkbox-terms"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  agreedToTerms ? "bg-primary border-primary" : "border-input bg-background group-hover:border-primary/50"
                }`}>
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-foreground leading-snug">
                أوافق على{" "}
                <Link href="/terms" target="_blank" className="text-primary font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  الشروط والأحكام
                </Link>
              </span>
            </label>
            <FieldError msg={fieldErrors.terms} />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={formState === "loading"}
            data-testid="button-register"
          >
            {formState === "loading"
              ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جارٍ الإنشاء...</>
              : "ابدأ التجربة المجانية"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            تجربة مجانية 14 يومًا — بدون دفع — بدون التزام
          </p>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm" style={{ color: "#666", marginTop: 12 }}>
            لديك حساب؟{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline transition-all"
              style={{ color: "#667EEA" }}
            >
              تسجيل الدخول
            </Link>
          </p>
          <Link
            href="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
