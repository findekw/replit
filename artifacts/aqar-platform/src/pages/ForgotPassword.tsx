import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, MessageCircle, Home, CheckCircle2 } from "lucide-react";

const SUPPORT_WHATSAPP = "https://wa.me/96595005151";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Email sending is not wired yet — this only acknowledges the request locally.
    setSubmitted(true);
  };

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
        <div style={{ textAlign: "center", marginBottom: 20 }}>
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>
            استعادة كلمة المرور
          </h1>
        </div>

        <div
          style={{
            background: "#F5F7FA",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.9, margin: 0 }}>
            لإعادة تعيين كلمة المرور الخاصة بك، يرجى التواصل مع فريق الدعم وسيقوم مسؤول
            <span style={{ fontWeight: 700, color: "#111827" }}> Finde </span>
            بإعادة تعيينها لك. خدمة إرسال رابط الاستعادة عبر البريد الإلكتروني غير متاحة حاليًا.
          </p>
        </div>

        <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <Button
            type="button"
            style={{
              width: "100%",
              height: 48,
              fontWeight: 700,
              borderRadius: 12,
              background: "#25D366",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MessageCircle className="h-5 w-5" />
            تواصل مع الدعم
          </Button>
        </a>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
          {submitted ? (
            <div
              className="flex items-center gap-2"
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#059669" }} />
              <p style={{ fontSize: 14, color: "#065f46", margin: 0 }}>
                تم استلام طلبك، سنتواصل معك قريبًا
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                style={{ width: "100%", height: 46, fontWeight: 700, borderRadius: 12 }}
              >
                إرسال طلب
              </Button>
            </form>
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: "#667EEA", fontSize: 14 }}
          >
            تسجيل الدخول
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
