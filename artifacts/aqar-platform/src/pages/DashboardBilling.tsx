import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetOffice } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown, Receipt, Wallet, Building2, Mail, Phone, ExternalLink,
  CheckCircle2, Clock, XCircle, FileText, Sparkles, Rocket, RefreshCw, ArrowLeft,
} from "lucide-react";
import { useOfficeAuth } from "@/lib/AuthContext";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();

interface PaymentRow {
  id: number;
  orderRef: string;
  amountFils: number;
  currency: string;
  status: string; // pending | paid | failed
  createdAt: string | null;
  paidAt: string | null;
  planId: number | null;
  planNameAr: string | null;
  planDurationDays: number | null;
}

const kwd = (fils: number) => (Number(fils || 0) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 });
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ar-KW-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }) : "—";

const PAY_STATUS: Record<string, { text: string; cls: string; icon: JSX.Element }> = {
  paid: { text: "مدفوع", cls: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  pending: { text: "قيد الانتظار", cls: "bg-amber-100 text-amber-800", icon: <Clock className="h-3.5 w-3.5" /> },
  failed: { text: "فشل", cls: "bg-red-100 text-red-800", icon: <XCircle className="h-3.5 w-3.5" /> },
};

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

/**
 * Expressive, state-aware welcome banner — the "you're subscribed 🎉 / your
 * trial is running / renew now" hero at the top of the account page. Its tone
 * and call-to-action change with the office's real subscription state so it
 * never contradicts itself (e.g. never shows "subscribe" to an active member).
 */
function WelcomeHero({ subStatus, subDetail }: { subStatus: string; subDetail: Record<string, any> | null }) {
  const d = subDetail ?? {};
  const isFree = d.isFreePlan ?? (subStatus === "trial");
  const planName: string | null = d.planNameAr ?? null;
  const daysLeft: number | null = (d.daysLeft as number | null | undefined) ?? null;
  const maxL: number | null = d.planMaxListings ?? null;
  const daysTxt = daysLeft !== null ? `${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}` : null;

  type Hero = {
    grad: string; fg: string; sub: string; chipBg: string; chipFg: string;
    icon: JSX.Element; title: string; msg: string;
    perks?: string[];
    cta?: { label: string; href: string; icon: JSX.Element };
  };

  let h: Hero;
  if (subStatus === "active" && !isFree) {
    h = {
      grad: "linear-gradient(135deg,#4B66E0 0%,#667EEA 55%,#8B5CF6 120%)",
      fg: "#fff", sub: "rgba(255,255,255,0.88)", chipBg: "rgba(255,255,255,0.16)", chipFg: "#fff",
      icon: <Sparkles className="h-6 w-6" />,
      title: `أنت مشترك في ${planName ?? "باقتك"} 🎉`,
      msg: `اشتراكك نشط${daysTxt ? ` ومتبقّي ${daysTxt}` : ""} — كل مميزات باقتك مفتوحة أمامك. انشر إعلاناتك ووصّلها لآلاف الباحثين عن عقار في الكويت.`,
      perks: [maxL ? `حتى ${maxL} إعلان` : "إعلانات غير محدودة", "ظهور مميّز في نتائج البحث", "لوحة تحكم وإحصائيات كاملة"],
      cta: { label: "إدارة إعلاناتي", href: "/dashboard/listings", icon: <ArrowLeft className="h-4 w-4" /> },
    };
  } else if (subStatus === "trial") {
    h = {
      grad: "linear-gradient(135deg,#243150 0%,#334d8f 60%,#667EEA 130%)",
      fg: "#fff", sub: "rgba(255,255,255,0.85)", chipBg: "rgba(255,255,255,0.14)", chipFg: "#fff",
      icon: <Rocket className="h-6 w-6" />,
      title: "أنت على التجربة المجانية ✨",
      msg: `${daysTxt ? `متبقّي ${daysTxt} على تجربتك. ` : ""}اشترك في إحدى الباقات لتستمر مميزاتك بدون انقطاع وتوصل لعملاء أكثر.`,
      perks: maxL ? [`حتى ${maxL} إعلان في التجربة`] : undefined,
      cta: { label: "شوف الباقات واشترك", href: "/dashboard/subscribe", icon: <Crown className="h-4 w-4" /> },
    };
  } else if (subStatus === "pending_payment") {
    h = {
      grad: "linear-gradient(135deg,#B45309 0%,#D97706 70%,#F59E0B 130%)",
      fg: "#fff", sub: "rgba(255,255,255,0.9)", chipBg: "rgba(255,255,255,0.16)", chipFg: "#fff",
      icon: <Clock className="h-6 w-6" />,
      title: "طلب اشتراكك قيد المراجعة ⏳",
      msg: "استلمنا طلبك — هنفعّل اشتراكك بمجرد تأكيد الدفع. تواصل معنا لو محتاج أي مساعدة في إتمام العملية.",
    };
  } else {
    // expired / inactive
    h = {
      grad: "linear-gradient(135deg,#7F1D1D 0%,#B91C1C 65%,#EF4444 130%)",
      fg: "#fff", sub: "rgba(255,255,255,0.9)", chipBg: "rgba(255,255,255,0.16)", chipFg: "#fff",
      icon: <RefreshCw className="h-6 w-6" />,
      title: "انتهى اشتراكك",
      msg: `${!isFree && planName ? `باقة ${planName} انتهت. ` : "تجربتك المجانية انتهت. "}جدّد الآن لإرجاع ظهور إعلاناتك أمام الباحثين عن عقار.`,
      cta: { label: "اشترك الآن", href: "/dashboard/subscribe", icon: <Crown className="h-4 w-4" /> },
    };
  }

  return (
    <div
      style={{
        background: h.grad, color: h.fg, borderRadius: 20, padding: "22px 24px", marginBottom: 26,
        boxShadow: "0 14px 34px rgba(63,91,216,0.24)", position: "relative", overflow: "hidden",
      }}
    >
      {/* soft decorative glow */}
      <div style={{ position: "absolute", insetInlineStart: -40, top: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
      <div style={{ position: "relative", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(255,255,255,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {h.icon}
        </span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.35 }}>{h.title}</h2>
          <p style={{ fontSize: 14.5, color: h.sub, margin: "7px 0 0", lineHeight: 1.7, maxWidth: 620 }}>{h.msg}</p>

          {h.perks && h.perks.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {h.perks.map((p, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: h.chipBg, color: h.chipFg, fontSize: 12.5, fontWeight: 700, padding: "6px 12px", borderRadius: 999 }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />{p}
                </span>
              ))}
            </div>
          )}

          {h.cta && (
            <div style={{ marginTop: 18 }}>
              <Link href={h.cta.href}>
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 13,
                    border: "none", cursor: "pointer", background: "#fff", color: "#1e293b", fontWeight: 800, fontSize: 14.5,
                    fontFamily: "inherit", boxShadow: "0 8px 20px rgba(0,0,0,0.16)",
                  }}
                >
                  {h.cta.icon}{h.cta.label}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardBilling() {
  const { officeId: oid, officeUser } = useOfficeAuth();
  const officeId = oid ?? 0;

  const { data: office } = useGetOffice(officeId, { query: { enabled: officeId > 0 } } as any);

  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subDetail, setSubDetail] = useState<Record<string, any> | null>(null);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payLoading, setPayLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/api/subscription/status`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setSubStatus(d.subscriptionStatus ?? null);
        setSubDetail(d);
        setTrialStartedAt(d.trialStartedAt ?? null);
      })
      .catch(() => {})
      .finally(() => alive && setSubLoading(false));

    fetch(`${BASE}/api/subscription/payments`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && setPayments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => alive && setPayLoading(false));

    return () => { alive = false; };
  }, []);

  const o = (office as any) ?? {};
  const officeName = o.nameAr || o.name || officeUser?.name || "—";
  const slug = o.slug as string | undefined;
  const email = o.email || officeUser?.email || "—";
  const phone = o.phone || o.whatsapp || "—";

  const AccountRow = ({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) => (
    <div className="flex items-center gap-3" style={{ padding: "11px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: "#F1F5FF", color: "#667EEA", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{label}</p>
        <p className="font-semibold" style={{ fontSize: 14, color: "#0f172a", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr", textAlign: "right", unicodeBidi: "plaintext" }}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div dir="rtl" style={{ maxWidth: 1000, fontFamily: "'Cairo', sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet className="h-6 w-6" style={{ color: "#667EEA" }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>حساب المكتب</h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748B", margin: "6px 0 0" }}>
            اشتراكك، فواتيرك ومدفوعاتك، وبيانات حساب مكتبك — كلها في مكان واحد.
          </p>
        </div>

        {/* ─── Expressive welcome / status hero ─── */}
        {!subLoading && subStatus && <WelcomeHero subStatus={subStatus} subDetail={subDetail} />}

        {/* ─── Subscription ─── */}
        <SectionTitle icon={<Crown className="h-[18px] w-[18px]" />} title="الاشتراك الحالي" subtitle="باقتك ومدتها واستهلاك إعلاناتك" />
        {subLoading ? (
          <Skeleton className="h-64 rounded-2xl mb-8" />
        ) : subStatus ? (
          <div className="mb-8">
            <SubscriptionCard subStatus={subStatus} subDetail={subDetail} trialStartedAt={trialStartedAt} />
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-5 mb-8 text-center" style={{ color: "#64748B" }}>
            لا توجد بيانات اشتراك متاحة حالياً.
          </div>
        )}

        {/* ─── Payments / Invoices ─── */}
        <SectionTitle icon={<Receipt className="h-[18px] w-[18px]" />} title="المدفوعات والفواتير" subtitle="سجلّ عمليات الدفع عبر بوابة الدفع" />
        <div className="bg-card border rounded-2xl mb-8" style={{ overflow: "hidden" }}>
          {payLoading ? (
            <div className="p-5"><Skeleton className="h-40 rounded-xl" /></div>
          ) : payments.length === 0 ? (
            (() => {
              // Context-aware empty state — never tells an already-subscribed
              // office to "subscribe". On a paid/active plan with no recorded
              // charges (admin-granted or trial-converted) we explain that
              // instead; only a free/trial/ended account gets a subscribe CTA.
              const onPaidPlan = subDetail?.isFreePlan === false;
              return (
                <div className="flex flex-col items-center justify-center text-center" style={{ padding: "48px 20px" }}>
                  <span style={{ width: 56, height: 56, borderRadius: 16, background: "#F1F5FF", color: "#667EEA", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <FileText className="h-7 w-7" />
                  </span>
                  <p className="font-bold" style={{ fontSize: 15, color: "#111827" }}>
                    {onPaidPlan ? "لا توجد فواتير مسجّلة بعد" : "لا توجد مدفوعات بعد"}
                  </p>
                  <p style={{ fontSize: 13.5, color: "#64748B", margin: "6px 0 16px", maxWidth: 360, lineHeight: 1.7 }}>
                    {onPaidPlan
                      ? "باقتك الحالية مفعّلة على حسابك. الفواتير هتظهر هنا تلقائياً عند أول عملية دفع أو تجديد عبر بوابة الدفع."
                      : "عند اشتراكك في إحدى الباقات ستظهر فواتيرك ومدفوعاتك هنا."}
                  </p>
                  {!onPaidPlan && (
                    <Link href="/dashboard/subscribe">
                      <Button className="gap-2 bg-[#667EEA] hover:bg-indigo-700 text-white">
                        <Crown className="h-4 w-4" /> اشترك الآن
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })()
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "right" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>التاريخ</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>الباقة</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>المبلغ</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>الحالة</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>رقم العملية</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const st = PAY_STATUS[p.status] ?? { text: p.status, cls: "bg-gray-100 text-gray-700", icon: <Clock className="h-3.5 w-3.5" /> };
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid #F1F5F9", color: "#0f172a" }}>
                        <td style={{ padding: "13px 16px" }}>{fmtDate(p.paidAt ?? p.createdAt)}</td>
                        <td style={{ padding: "13px 16px" }}>
                          {p.planNameAr ?? "—"}
                          {p.planDurationDays ? <span style={{ color: "#94A3B8" }}>{` · ${p.planDurationDays} يوم`}</span> : null}
                        </td>
                        <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                          {kwd(p.amountFils)} <span style={{ color: "#94A3B8", fontWeight: 400 }}>{p.currency === "KWD" ? "د.ك" : p.currency}</span>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                            {st.icon}{st.text}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", color: "#94A3B8", fontFamily: "monospace", fontSize: 12, direction: "ltr" }}>{p.orderRef}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Account info ─── */}
        <SectionTitle icon={<Building2 className="h-[18px] w-[18px]" />} title="بيانات حساب المكتب" subtitle="معلومات مكتبك الأساسية" />
        <div className="grid gap-5 mb-2" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
          <div className="bg-card border rounded-2xl p-5">
            <AccountRow icon={<Building2 className="h-[17px] w-[17px]" />} label="اسم المكتب" value={officeName} />
            <AccountRow icon={<Mail className="h-[17px] w-[17px]" />} label="البريد الإلكتروني" value={email} />
            <AccountRow icon={<Phone className="h-[17px] w-[17px]" />} label="رقم التواصل" value={phone} />
            {slug && (
              <div className="flex items-center gap-3" style={{ padding: "11px 0" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "#F1F5FF", color: "#667EEA", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ExternalLink className="h-[17px] w-[17px]" />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>صفحة المكتب العامة</p>
                  <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ fontSize: 14, color: "#667EEA", margin: "1px 0 0", display: "inline-block" }}>
                    finde.co/{slug}
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3" style={{ marginTop: 16 }}>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" /> تعديل بيانات المكتب
                </Button>
              </Link>
              <Link href="/dashboard/subscribe">
                <Button className="gap-2 bg-[#667EEA] hover:bg-indigo-700 text-white">
                  <Crown className="h-4 w-4" /> الباقات والاشتراك
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
