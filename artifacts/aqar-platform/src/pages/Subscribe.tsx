import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Check, Crown, Loader2, ShieldCheck, MessageCircle, AlertTriangle } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();

interface Plan {
  id: number;
  name: string;
  nameAr: string;
  price: number; // KWD
  currency: string;
  maxListings: number;
  featuredListings: number;
  features: string[];
}

type Banner = { kind: "success" | "cancelled" | "error" | "pending"; text: string } | null;

export default function Subscribe() {
  const [, navigate] = useLocation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<Banner>(null);

  // Load plans.
  useEffect(() => {
    fetch(`${BASE}/api/plans`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : (d?.plans ?? [])))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // Handle the return from UPayments (?payment=success&ref=… / cancelled).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const payment = q.get("payment");
    const ref = q.get("ref");
    if (!payment) return;

    if (payment === "cancelled") {
      setBanner({ kind: "cancelled", text: "تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى." });
      window.history.replaceState({}, "", "/dashboard/subscribe");
      return;
    }
    if (payment === "success" && ref) {
      setBanner({ kind: "pending", text: "جارٍ تأكيد الدفع..." });
      fetch(`${BASE}/api/payments/verify?ref=${encodeURIComponent(ref)}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d?.status === "paid") setBanner({ kind: "success", text: "تم تفعيل اشتراكك بنجاح! 🎉" });
          else setBanner({ kind: "error", text: "لم نتمكن من تأكيد الدفع بعد. إذا تم الخصم سيُفعّل اشتراكك خلال لحظات." });
        })
        .catch(() => setBanner({ kind: "error", text: "تعذّر تأكيد الدفع. حاول تحديث الصفحة." }))
        .finally(() => window.history.replaceState({}, "", "/dashboard/subscribe"));
    }
  }, []);

  async function subscribe(planId: number) {
    setPayingId(planId);
    setBanner(null);
    try {
      const r = await fetch(`${BASE}/api/payments/subscribe`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const d = await r.json();
      if (r.ok && d?.link) {
        window.location.href = d.link; // redirect to UPayments hosted page
        return;
      }
      if (r.status === 401) { navigate("/login"); return; }
      setBanner({ kind: "error", text: d?.error || "تعذّر بدء عملية الدفع." });
    } catch {
      setBanner({ kind: "error", text: "تعذّر الاتصال بالخادم." });
    } finally {
      setPayingId(null);
    }
  }

  const bannerStyle: Record<string, { bg: string; border: string; color: string; icon: JSX.Element }> = {
    success: { bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", icon: <Check className="h-5 w-5" /> },
    pending: { bg: "#EEF2FF", border: "#C7D2FE", color: "#3730A3", icon: <Loader2 className="h-5 w-5 animate-spin" /> },
    cancelled: { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: <AlertTriangle className="h-5 w-5" /> },
    error: { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B", icon: <AlertTriangle className="h-5 w-5" /> },
  };

  return (
    <DashboardLayout>
      <div dir="rtl" style={{ maxWidth: 1000, margin: "0 auto", fontFamily: "'Cairo', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Crown className="h-6 w-6" style={{ color: "#667EEA" }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>اشترك في فايند</h1>
        </div>
        <p style={{ color: "#64748B", fontSize: 14.5, marginBottom: 20 }}>
          اختر الباقة المناسبة لمكتبك وادفع بأمان عبر بوابة الدفع (KNET / بطاقة).
        </p>

        {banner && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderRadius: 14, marginBottom: 20,
            background: bannerStyle[banner.kind].bg, border: `1px solid ${bannerStyle[banner.kind].border}`, color: bannerStyle[banner.kind].color, fontWeight: 700, fontSize: 14,
          }}>
            {bannerStyle[banner.kind].icon}
            {banner.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ margin: "0 auto" }} />
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 18, border: "1px solid #EAEEF5" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>لا توجد باقات متاحة حالياً</p>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>تواصل معنا لتفعيل اشتراكك.</p>
            <a href={`https://wa.me/96595005151?text=${encodeURIComponent("مرحبا، اريد الاشتراك في منصة Finde")}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, background: "#16a34a", color: "#fff", padding: "11px 22px", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>
              <MessageCircle className="h-4 w-4" /> تواصل عبر واتساب
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {plans.map((p) => (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>{p.nameAr}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "12px 0 4px" }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: "#667EEA", lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#64748B" }}>{p.currency === "KWD" ? "د.ك" : p.currency}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 20px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  {p.maxListings > 0 && <Feature text={`حتى ${p.maxListings} إعلان`} />}
                  {p.featuredListings > 0 && <Feature text={`${p.featuredListings} إعلان مميز`} />}
                  {(p.features ?? []).map((f, i) => <Feature key={i} text={f} />)}
                </ul>
                <button
                  onClick={() => subscribe(p.id)}
                  disabled={payingId !== null}
                  style={{
                    width: "100%", height: 48, borderRadius: 13, border: "none", cursor: payingId !== null ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg,#667EEA,#4B66E0)", color: "#fff", fontWeight: 800, fontSize: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: payingId !== null && payingId !== p.id ? 0.6 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  {payingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  {payingId === p.id ? "جارٍ التحويل..." : "اشترك وادفع"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24, color: "#94A3B8", fontSize: 12.5, fontWeight: 600 }}>
          <ShieldCheck className="h-4 w-4" /> دفع آمن عبر UPayments — بياناتك محمية
        </div>
      </div>
    </DashboardLayout>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#334155" }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EEF2FF", color: "#667EEA", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Check className="h-3 w-3" />
      </span>
      {text}
    </li>
  );
}
