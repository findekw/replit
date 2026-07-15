import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2, Eye, EyeOff, Home } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();

/** Landing page for the emailed reset link: /office/reset?token=…&id=… */
export default function ResetPassword() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  const id = params.get("id") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين"); return; }

    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/office/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "تعذّر تعيين كلمة المرور"); return; }
      setDone(true);
    } catch {
      setError("تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت");
    } finally {
      setBusy(false);
    }
  }

  const shell = (children: React.ReactNode) => (
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
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}>
        {children}
      </div>
    </div>
  );

  if (!token || !id) {
    return shell(
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>الرابط غير صالح</h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.9, margin: "0 0 18px" }}>
          افتح الرابط من رسالة البريد الإلكتروني كما هو، أو اطلب رابطاً جديداً.
        </p>
        <Button onClick={() => navigate("/office/forgot")} style={{ width: "100%", height: 46, fontWeight: 700, borderRadius: 12, background: "#667EEA", color: "#fff" }}>
          طلب رابط جديد
        </Button>
      </div>,
    );
  }

  if (done) {
    return shell(
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: "#059669" }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>تم تغيير كلمة المرور</h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.9, margin: "0 0 18px" }}>
          يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
        </p>
        <Button onClick={() => navigate("/login")} style={{ width: "100%", height: 46, fontWeight: 700, borderRadius: 12, background: "#667EEA", color: "#fff" }}>
          تسجيل الدخول
        </Button>
      </div>,
    );
  }

  return shell(
    <>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <KeyRound className="h-7 w-7" style={{ color: "#fff" }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>كلمة مرور جديدة</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "8px 0 0", lineHeight: 1.8 }}>اختر كلمة مرور جديدة لحسابك (8 أحرف على الأقل).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <div style={{ position: "relative" }}>
            <Input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="mt-1"
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-30%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            className="mt-1"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 12px", margin: 0 }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} style={{ width: "100%", height: 48, fontWeight: 700, borderRadius: 12, background: "#667EEA", color: "#fff" }}>
          {busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </Button>
      </form>

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
    </>,
  );
}
