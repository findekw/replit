import { useState } from "react";
import { useGetOffice } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  LifeBuoy, Mail, Send, CheckCircle2, HelpCircle, Lightbulb,
  LayoutDashboard, Building2, BarChart3, Wallet, MessageSquare, Loader2,
} from "lucide-react";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();
const SUPPORT_EMAIL = "support@finde.co";

// Kept in sync with the server (routes/support.ts SUPPORT_TYPES / SUPPORT_SECTIONS).
const TYPES = [
  { value: "استفسار", label: "استفسار", desc: "عندك سؤال أو مشكلة محتاج مساعدة فيها", icon: HelpCircle },
  { value: "اقتراح", label: "اقتراح", desc: "عندك فكرة تطوّر المنصة أو تحسّن تجربتك", icon: Lightbulb },
];
const SECTIONS = [
  { value: "لوحة التحكم", icon: LayoutDashboard },
  { value: "إعلاناتي", icon: Building2 },
  { value: "الإحصائيات", icon: BarChart3 },
  { value: "حساب المكتب", icon: Wallet },
  { value: "عام / أخرى", icon: MessageSquare },
];

function SectionTitle({ icon, title, subtitle }: { icon: JSX.Element; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        style={{
          width: 36, height: 36, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#667EEA,#5B73E0)", boxShadow: "0 6px 16px rgba(63,91,216,0.32)", color: "#fff",
        }}
      >
        {icon}
      </span>
      <div>
        <h2 className="font-bold" style={{ fontSize: 17, color: "#111827", letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardSupport() {
  const { officeId: oid, officeUser } = useOfficeAuth();
  const officeId = oid ?? 0;
  const { data: office } = useGetOffice(officeId, { query: { enabled: officeId > 0 } } as any);
  const { toast } = useToast();

  const o = (office as any) ?? {};
  const officeName = o.nameAr || o.name || officeUser?.name || "مكتبك";
  const senderEmail = o.email || officeUser?.email || "";
  const senderPhone = o.phone || o.whatsapp || "";

  const [type, setType] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ type?: string; section?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const e: typeof errors = {};
    if (!type) e.type = "اختر النوع";
    if (!section) e.section = "اختر القسم المتعلّق";
    if (message.trim().length < 5) e.message = "اكتب رسالتك (5 أحرف على الأقل)";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, section, message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.field) setErrors({ [data.field]: data.error });
        else toast({ title: "خطأ", description: data?.error || "تعذّر الإرسال، حاول مرة أخرى", variant: "destructive" });
        return;
      }
      setSent(true);
    } catch {
      toast({ title: "خطأ", description: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setType(""); setSection(""); setMessage(""); setErrors({}); setSent(false);
  }

  const mailtoHref =
    `mailto:${SUPPORT_EMAIL}` +
    `?subject=${encodeURIComponent(`دعم فايند — ${officeName}`)}` +
    `&body=${encodeURIComponent(`\n\n—\nالمكتب: ${officeName}${senderPhone ? `\nالهاتف: ${senderPhone}` : ""}`)}`;

  const inputBase: React.CSSProperties = {
    width: "100%", borderRadius: 12, border: "1.5px solid #E4E7F0", background: "#fff",
    padding: "12px 14px", fontSize: 14.5, color: "#111827", outline: "none", resize: "vertical",
  };

  return (
    <DashboardLayout>
      <div dir="rtl">
        <div className="max-w-[900px] mx-auto">

          {/* Header */}
          <div
            className="mb-6"
            style={{
              background: "linear-gradient(120deg,#1A2238 0%,#26345A 55%,#667EEA 140%)",
              borderRadius: 22, padding: "26px 28px", color: "#fff",
              boxShadow: "0 16px 40px rgba(31,42,68,0.26)", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
                color: "#BFD0F2", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)",
                padding: "4px 12px", borderRadius: 999,
              }}>
                <LifeBuoy style={{ width: 14, height: 14 }} /> الدعم الفني للمكاتب
              </span>
              <h1 style={{ fontSize: 25, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.25, color: "#fff" }}>
                محتاج مساعدة أو عندك اقتراح؟
              </h1>
              <p style={{ fontSize: 14, color: "#C3CEE2", margin: "8px 0 0", maxWidth: "56ch" }}>
                ابعتلنا استفسارك أو فكرتك من النموذج المنظّم عشان نوصلك أسرع، أو راسلنا مباشرةً على بريد الدعم.
              </p>
            </div>
            <div style={{
              position: "absolute", insetInlineStart: -40, bottom: -80, width: 220, height: 220,
              borderRadius: "50%", background: "rgba(91,115,224,0.30)", filter: "blur(26px)", pointerEvents: "none",
            }} />
          </div>

          {/* Structured form card */}
          <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 20, boxShadow: "0 8px 24px rgba(15,23,42,0.06)", padding: "22px 22px 24px", marginBottom: 20 }}>
            {sent ? (
              <div className="text-center" style={{ padding: "26px 10px" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#E7F6F0" }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: "#16A34A" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>وصلتنا رسالتك ✅</h3>
                <p style={{ fontSize: 14, color: "#64748B", margin: "8px 0 18px" }}>
                  شكراً {officeName}. فريق فايند هيراجعها ويتواصل معك قريباً على بريدك{senderEmail ? ` (${senderEmail})` : ""}.
                </p>
                <Button variant="outline" onClick={resetForm} className="gap-2">
                  <Send className="h-4 w-4" /> إرسال رسالة أخرى
                </Button>
              </div>
            ) : (
              <>
                <SectionTitle icon={<Send className="h-[18px] w-[18px]" />} title="أرسل رسالة منظّمة" subtitle="النوع + القسم + رسالتك — واسم مكتبك وأرقامه بتتضاف تلقائياً" />

                {/* Type */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", margin: "6px 0 8px" }}>نوع الرسالة</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {TYPES.map((t) => {
                    const active = type === t.value;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => { setType(t.value); setErrors((p) => ({ ...p, type: undefined })); }}
                        style={{
                          textAlign: "start", borderRadius: 13, padding: "12px 14px", cursor: "pointer",
                          border: `1.5px solid ${active ? "#667EEA" : "#E4E7F0"}`,
                          background: active ? "#EEF2FE" : "#fff",
                          boxShadow: active ? "0 6px 16px rgba(102,126,234,0.16)" : "none",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Icon style={{ width: 17, height: 17, color: active ? "#4B66E0" : "#667EEA" }} />
                          <span style={{ fontSize: 14.5, fontWeight: 800, color: "#111827" }}>{t.label}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.type && <p style={{ color: "#DC2626", fontSize: 12.5, margin: "6px 2px 0" }}>{errors.type}</p>}

                {/* Section */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", margin: "18px 0 8px" }}>القسم المتعلّق</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SECTIONS.map((s) => {
                    const active = section === s.value;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => { setSection(s.value); setErrors((p) => ({ ...p, section: undefined })); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                          borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700,
                          border: `1.5px solid ${active ? "#667EEA" : "#E4E7F0"}`,
                          background: active ? "#667EEA" : "#fff",
                          color: active ? "#fff" : "#374151",
                          transition: "all .15s",
                        }}
                      >
                        <Icon style={{ width: 15, height: 15 }} /> {s.value}
                      </button>
                    );
                  })}
                </div>
                {errors.section && <p style={{ color: "#DC2626", fontSize: 12.5, margin: "6px 2px 0" }}>{errors.section}</p>}

                {/* Message */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", margin: "18px 0 8px" }}>رسالتك</label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors((p) => ({ ...p, message: undefined })); }}
                  placeholder="اكتب استفسارك أو اقتراحك بالتفصيل…"
                  rows={5}
                  maxLength={2000}
                  style={{ ...inputBase, borderColor: errors.message ? "#FCA5A5" : "#E4E7F0" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 2px 0" }}>
                  {errors.message ? <span style={{ color: "#DC2626", fontSize: 12.5 }}>{errors.message}</span> : <span />}
                  <span style={{ fontSize: 11.5, color: "#94A3B8" }}>{message.length}/2000</span>
                </div>

                {/* Sender preview */}
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #EEF2F7" }}>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>هيتبعت باسم:</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                    {officeName}
                    {senderPhone ? <span style={{ color: "#64748B", fontWeight: 600 }}> · <span dir="ltr">{senderPhone}</span></span> : null}
                    {senderEmail ? <span style={{ color: "#64748B", fontWeight: 600 }}> · <span dir="ltr">{senderEmail}</span></span> : null}
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="gap-2 mt-4 h-11 px-7 rounded-xl font-bold w-full sm:w-auto"
                  style={{ background: "#667EEA", color: "#fff" }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "جارٍ الإرسال…" : "إرسال"}
                </Button>
              </>
            )}
          </div>

          {/* Direct email card */}
          <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 20, boxShadow: "0 8px 24px rgba(15,23,42,0.06)", padding: "20px 22px" }}>
            <SectionTitle icon={<Mail className="h-[18px] w-[18px]" />} title="أو راسلنا مباشرةً" subtitle="لو بتفضّل البريد الإلكتروني العادي" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div style={{ fontSize: 14, color: "#334155" }}>
                بريد الدعم الفني للمكاتب:{" "}
                <a href={mailtoHref} style={{ color: "#4B66E0", fontWeight: 700, textDecoration: "none" }} dir="ltr">{SUPPORT_EMAIL}</a>
              </div>
              <a href={mailtoHref}>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" /> فتح البريد
                </Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
