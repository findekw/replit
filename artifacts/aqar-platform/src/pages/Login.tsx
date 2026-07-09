import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Loader2, Home, MailCheck } from "lucide-react";
import { authApi } from "@/lib/auth";
import { useOfficeAuth } from "@/lib/AuthContext";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useOfficeAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    if (ARABIC_RE.test(password)) {
      setError("كلمة المرور لا تقبل أحرفًا عربية");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.office.login({ email: email.trim(), password });
      await refetch();
      navigate("/dashboard");
    } catch (err: any) {
      if (err?.requiresEmailVerification) {
        setNeedsVerification(true);
        setVerificationEmail(err.email ?? email.trim());
        setOtp("");
        setOtpMessage(err?.error ?? "أدخل رمز التفعيل المرسل إلى بريدك الإلكتروني");
        setError("");
      } else {
        setError(err?.error ?? "حدث خطأ غير متوقع، حاول مرة أخرى");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setOtpMessage("أدخل رمز التفعيل المكون من 6 أرقام");
      return;
    }
    setVerifyLoading(true);
    setOtpMessage("");
    try {
      await authApi.office.verifyEmail({ email: verificationEmail, otp });
      await refetch();
      navigate("/dashboard");
    } catch (err: any) {
      setOtpMessage(err?.error ?? "رمز التفعيل غير صحيح، حاول مرة أخرى");
    } finally {
      setVerifyLoading(false);
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

  if (needsVerification) {
    return (
      <>
        <style>{`
          body { background: #111827 !important; }
          .login-submit-btn { width: 100%; height: 50px; font-size: 16px; font-weight: 700; border-radius: 12px; }
        `}</style>
        <div
          dir="rtl"
          style={{
            minHeight: "100svh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "max(18px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom))",
            background: "linear-gradient(135deg, #111827, #667EEA)",
          }}
        >
          <div
            className="login-card"
            style={{
              width: "90%",
              maxWidth: 420,
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              padding: "28px 24px",
            }}
          >
            <div className="text-center" style={{ marginBottom: 24 }}>
              <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>فعّل بريدك الإلكتروني</h1>
              <p style={{ fontSize: 13, color: "#0f172a", marginTop: 8 }}>
                أدخل الرمز المرسل إلى <span dir="ltr" className="font-semibold">{verificationEmail}</span>
              </p>
            </div>

            {otpMessage && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                {otpMessage}
              </div>
            )}

            <form onSubmit={handleVerifyEmail} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="otp">رمز التفعيل</Label>
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
                  className="mt-1 h-14 text-center text-lg font-bold tracking-[0.28em]"
                  disabled={verifyLoading}
                  dir="ltr"
                  data-testid="input-login-otp"
                />
              </div>

              <Button type="submit" className="login-submit-btn" disabled={verifyLoading} data-testid="button-login-verify-email">
                {verifyLoading ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جارٍ التفعيل...</> : "تفعيل الحساب"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-3">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || verifyLoading}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
              >
                {resendLoading ? "جارٍ إرسال رمز جديد..." : "إرسال رمز جديد"}
              </button>
              <br />
              <button
                type="button"
                onClick={() => setNeedsVerification(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        body { overflow: hidden !important; background: #111827 !important; }
        .login-submit-btn { width: 100%; height: 50px; font-size: 16px; font-weight: 700; border-radius: 12px; }
        @media (max-width: 768px) {
          .login-card { padding: 28px 20px !important; }
          .login-submit-btn { height: 52px; font-size: 17px; }
        }
      `}</style>

      <div
        dir="rtl"
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "linear-gradient(135deg, #111827, #667EEA)",
        }}
      >
        {/* Content centered */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "0 16px" }}>
          {/* Card */}
          <div
            className="login-card"
            style={{
              width: "90%",
              maxWidth: 420,
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              padding: "36px 32px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 40px)",
            }}
          >
            {/* Logo */}
            <div className="text-center" style={{ marginBottom: 24 }}>
              <Link href="/" className="inline-block">
                <img src="/logo.png" alt="Finde" className="site-logo" style={{ marginBottom: 10 }} />
              </Link>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>تسجيل دخول المكاتب العقارية</h1>
              <p style={{ fontSize: 13, color: "#0f172a", marginTop: 4 }}>ادخل إلى حسابك لإدارة عقاراتك</p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2"
                data-testid="login-error"
              >
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form" noValidate>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9_.@+\-]/g, ""))}
                  className="mt-1"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  data-testid="input-login-email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Link href="/office/forgot" className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</Link>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(ARABIC_RE, ""))}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    data-testid="input-login-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  6 أحرف على الأقل — يجب أن تحتوي على حروف إنجليزية وأرقام
                </p>
              </div>

              <Button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ الدخول...
                  </>
                ) : "تسجيل الدخول"}
              </Button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#444", marginBottom: 10 }}>
                مكتب عقاري غير مشترك؟{" "}
                <Link href="/plans" className="font-semibold hover:underline" style={{ color: "#667EEA", marginRight: 4 }}>
                  عرض الاشتراك
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
      </div>
    </>
  );
}
