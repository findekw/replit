import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Home, CheckCircle2, MessageCircle } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();
const SUPPORT_WHATSAPP = "https://wa.me/96595005151";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("اكتب بريداً إلكترونياً صحيحاً");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/office/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "تعذّر إرسال الرابط، حاول مرة أخرى");
        return;
      }
      setSent(true);
    } catch {
      setError("تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Cairo', sans-serif",
        background: "linear-gradient(135deg, #111827, #667EEA)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <KeyRound className="h-7 w-7" style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>استعادة كلمة المرور</h1>
          {!sent && (
            <p style={{ fontSize: 14, color: "#64748B", margin: "8px 0 0", lineHeight: 1.8 }}>
              اكتب بريدك الإلكتروني المسجّل وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.
            </p>
          )}
        </div>

        {sent ? (
          <>
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                gap: 10,
              }}
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#059669", marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 14, color: "#065f46", margin: 0, fontWeight: 700, lineHeight: 1.8 }}>
                  تم إرسال الرابط
                </p>
                <p style={{ fontSize: 13.5, color: "#065f46", margin: "4px 0 0", lineHeight: 1.9 }}>
                  إذا كان البريد مسجلاً لدينا فستصلك رسالة بها رابط إعادة التعيين خلال دقائق. الرابط صالح لمدة ساعة.
                  لو لم تجدها، راجع مجلد الرسائل غير المرغوب فيها (Spam).
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ width: "100%", height: 44, fontWeight: 700, borderRadius: 12, marginTop: 14 }}
            >
              إرسال الرابط مرة أخرى
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="mt-1"
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 12px", margin: 0 }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              style={{ width: "100%", height: 48, fontWeight: 700, borderRadius: 12, background: "#667EEA", color: "#fff" }}
            >
              {busy ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
            </Button>
          </form>
        )}

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", margin: "0 0 10px", lineHeight: 1.8 }}>
            لم تعد تملك صلاحية الوصول لبريدك؟
          </p>
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Button
              type="button"
              variant="outline"
              style={{ width: "100%", height: 44, fontWeight: 700, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
              تواصل مع الدعم
            </Button>
          </a>
        </div>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#667EEA", fontSize: 14 }}>
            تسجيل الدخول
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
              الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
