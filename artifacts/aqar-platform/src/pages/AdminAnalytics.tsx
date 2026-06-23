import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  Building2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
  Home, LayoutDashboard, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown,
  Eye, MessageCircle, Phone, Star, Clock, Zap, ShieldAlert,
  BarChart2, ExternalLink, Award, Target, Activity, Calendar,
  ChevronDown, ChevronUp,
} from "lucide-react";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();
const NAVY = "#1F2A44";
const BLUE = "#3F5BD8";
const BODY = "#64748B";
const BORDER = "#EEF1F5";
const PAGE_BG = "#F5F7FA";
const CARD_SHADOW = "0 4px 16px rgba(15,23,42,0.05)";

/* ─── number helpers (English digits only) ─── */
function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString("en-US");
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function daysLabel(d: number | null) {
  if (d === null) return "—";
  if (d === 0) return "اليوم";
  if (d === 1) return "أمس";
  return `${d} day`;
}

/* ─── 4-tier classification ─── */
type Tier = "highPerforming" | "active" | "lowPerforming" | "inactive";
const TIER_META: Record<Tier, { label: string; labelShort: string; color: string; bg: string; border: string; icon: any }> = {
  highPerforming: { label: "عالي الأداء",      labelShort: "عالي الأداء",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: Star },
  active:         { label: "مكتب نشط",          labelShort: "نشط",           color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: TrendingUp },
  lowPerforming:  { label: "منخفض الأداء",      labelShort: "منخفض الأداء", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: TrendingDown },
  inactive:       { label: "غير نشط",           labelShort: "غير نشط",       color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: XCircle },
};

function classifyOffice(o: any): Tier {
  const daysSince = o.daysSinceActivity ?? 9999;
  if (
    !o.active ||
    o.subscriptionStatus === "expired" ||
    o.subscriptionStatus === "inactive" ||
    o.subscriptionStatus === "pending_payment" ||
    daysSince > 45
  ) return "inactive";
  if (o.engagementScore >= 50) return "highPerforming";
  if (o.engagementScore >= 20) return "active";
  return "lowPerforming";
}

/* ─── sort helper ─── */
type SortDir = "asc" | "desc" | null;
function useSort<T>(data: T[], initial: keyof T) {
  const [key, setKey] = useState<keyof T>(initial);
  const [dir, setDir] = useState<SortDir>("desc");
  const toggle = (k: keyof T) => {
    if (k === key) setDir(d => d === "desc" ? "asc" : d === "asc" ? null : "desc");
    else { setKey(k); setDir("desc"); }
  };
  const sorted = useMemo(() => {
    if (!dir) return data;
    return [...data].sort((a, b) => {
      const va = a[key] as any; const vb = b[key] as any;
      if (va == null) return 1; if (vb == null) return -1;
      return dir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [data, key, dir]);
  return { sorted, key, dir, toggle };
}

/* ─── small KPI card ─── */
function KpiCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", border: `1px solid ${BORDER}`, boxShadow: CARD_SHADOW, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: color + "15", borderRadius: 14, padding: 12, display: "flex", flexShrink: 0 }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: BODY, marginTop: 4, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── alert row ─── */
function AlertRow({ type, icon: Icon, title, body, action, onAction }: {
  type: "danger" | "warn" | "info"; icon: any; title: string; body: string; action: string; onAction?: () => void;
}) {
  const cfg = {
    danger: { border: "#fecaca", bg: "#fff5f5", col: "#dc2626", btn: "#dc2626" },
    warn:   { border: "#fde68a", bg: "#fffef0", col: "#d97706", btn: "#d97706" },
    info:   { border: "#bfdbfe", bg: "#f0f6ff", col: "#2563eb", btn: "#2563eb" },
  }[type];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12 }}>
      <Icon style={{ width: 18, height: 18, color: cfg.col, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{body}</div>
      </div>
      {onAction && (
        <button onClick={onAction} style={{ background: cfg.btn, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ─── sort header ─── */
function Th({ label, col, sortKey, sortDir, onClick }: { label: string; col: string; sortKey: string; sortDir: SortDir; onClick: () => void }) {
  const active = col === sortKey;
  return (
    <th onClick={onClick} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: active ? NAVY : "#6b7280", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", background: active ? "#f0f4ff" : "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
        {label}
        {active && sortDir === "desc" ? <ArrowDown style={{ width: 11, height: 11 }} /> :
         active && sortDir === "asc"  ? <ArrowUp   style={{ width: 11, height: 11 }} /> :
         <ArrowUpDown style={{ width: 10, height: 10, opacity: 0.35 }} />}
      </div>
    </th>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const [, nav] = useLocation();
  const [tab, setTab] = useState<"home" | "detail" | "ads" | "subs" | "insights">("home");
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showAllOffices, setShowAllOffices] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/api/admin/analytics`, { credentials: "include" });
      if (!r.ok) throw new Error("401");
      setData(await r.json());
    } catch { setError("فشل تحميل البيانات — تأكد من تسجيل الدخول كمشرف"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ─── derived ─── */
  const offices: any[] = useMemo(() => (data?.officeStats ?? []).map((o: any) => ({
    ...o, tier: classifyOffice(o),
  })), [data]);

  const tiered = useMemo(() => {
    const g: Record<Tier, any[]> = { highPerforming: [], active: [], lowPerforming: [], inactive: [] };
    offices.forEach(o => g[o.tier as Tier].push(o));
    return g;
  }, [offices]);

  const ov             = data?.overview ?? {};
  const inactiveCount  = tiered.inactive.length;
  const expiringSoon   = offices.filter(o => o.trialDaysLeft !== null && o.trialDaysLeft <= 7 && o.subscriptionStatus === "trial");
  const zeroEngAds: any[] = data?.zeroEngagementAds ?? [];
  const topAds: any[]     = data?.topAds ?? [];
  const subs              = data?.subscriptions ?? {};

  /* office table — sorted by engagementScore */
  const { sorted: sortedOffices, key: sk, dir: sd, toggle: stog } = useSort<any>(offices, "engagementScore");
  const displayedOffices = showAllOffices ? sortedOffices : sortedOffices.slice(0, 10);

  /* chart data */
  const chartData = offices
    .filter(o => o.totalViews > 0 || o.whatsappClicks > 0)
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 8)
    .map(o => ({ name: (o.officeName ?? "").slice(0, 8), views: o.totalViews, wa: o.whatsappClicks }));

  const pieData = (Object.keys(tiered) as Tier[])
    .map(t => ({ name: TIER_META[t].labelShort, value: tiered[t].length, fill: TIER_META[t].color }))
    .filter(x => x.value > 0);

  /* insights */
  const insights: { type: "danger" | "warn" | "info" | "success"; icon: any; title: string; body: string }[] = useMemo(() => {
    if (!data) return [];
    const out: any[] = [];
    tiered.inactive.filter(o => o.daysSinceActivity > 45).slice(0, 3).forEach(o =>
      out.push({ type: "danger", icon: ShieldAlert, title: `${o.officeName} — غير نشط`, body: `آخر نشاط قبل ${o.daysSinceActivity ?? "?"} يوم · تفاعل ${o.engagementScore} نقطة. تواصل معه لإعادة تفعيله.` })
    );
    tiered.highPerforming.slice(0, 2).forEach(o =>
      out.push({ type: "success", icon: Star, title: `${o.officeName} — عالي الأداء`, body: `تفاعل ممتاز (${o.engagementScore} نقطة). مرشح للحصول على خصم أو أولوية عرض.` })
    );
    tiered.lowPerforming.slice(0, 3).forEach(o =>
      out.push({ type: "warn", icon: TrendingDown, title: `${o.officeName} — منخفض الأداء`, body: `${o.adsCount} إعلان بتفاعل ${o.engagementScore} نقطة فقط. أرسل له نصائح لتحسين نشاطه.` })
    );
    expiringSoon.forEach(o =>
      out.push({ type: "warn", icon: Clock, title: `${o.officeName} — التجربة تنتهي قريباً`, body: `متبقي ${o.trialDaysLeft} يوم فقط على انتهاء الفترة التجريبية.` })
    );
    tiered.inactive.filter(o => o.adsCount > 0 && o.subscriptionStatus !== "active").slice(0, 2).forEach(o =>
      out.push({ type: "info", icon: Activity, title: `${o.officeName} — يمكن استعادته`, body: `كان لديه ${o.adsCount} إعلان. تواصل معه لإعادة تفعيل اشتراكه.` })
    );
    return out;
  }, [data, tiered, expiringSoon, ov]);

  /* ─── tabs config ─── */
  const TABS = [
    { id: "home",     label: "الرئيسية",       icon: Home },
    { id: "detail",   label: "التحليلات",       icon: BarChart2 },
    { id: "ads",      label: "الإعلانات",       icon: Eye },
    { id: "subs",     label: "الاشتراكات",      icon: Calendar },
    { id: "insights", label: "توصيات ذكية",    icon: Zap },
  ] as const;

  /* ─── error state ─── */
  if (error) return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", flexDirection: "column", fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <AppHeader loading={false} onRefresh={load} nav={nav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
        <AlertTriangle style={{ width: 40, height: 40, color: "#dc2626" }} />
        <p style={{ color: "#374151", fontSize: 15, textAlign: "center" }}>{error}</p>
        <button onClick={load} style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>إعادة المحاولة</button>
      </div>
    </div>
  );

  return (
    <div className="adm-an-root" style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <style>{`.adm-an-root, .adm-an-root * { font-family: 'Cairo', sans-serif; }`}</style>
      <AppHeader loading={loading} onRefresh={load} nav={nav} />

      {/* ── tab bar ── */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
        <div style={{ display: "flex", maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding: "13px 16px", border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
              color: tab === t.id ? NAVY : "#6b7280",
              borderBottom: `2px solid ${tab === t.id ? NAVY : "transparent"}`,
              whiteSpace: "nowrap", position: "relative",
            }}>
              <t.icon style={{ width: 14, height: 14 }} />
              {t.label}
              {t.id === "insights" && insights.length > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {insights.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>

        {/* loading */}
        {loading && !data && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
            <RefreshCw style={{ width: 28, height: 28, color: NAVY, animation: "spin 1s linear infinite" }} />
            <span style={{ color: "#6b7280", fontSize: 14 }}>جارٍ تحميل البيانات…</span>
          </div>
        )}

        {/* ══ HOME ══ */}
        {tab === "home" && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* 4 KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              <KpiCard label="إجمالي المكاتب" value={fmt(ov.totalOffices)}   icon={Building2}    color={NAVY}     />
              <KpiCard label="مكاتب نشطة"      value={fmt(offices.filter(o => o.active && o.subscriptionStatus !== "expired").length)} icon={CheckCircle2} color="#16a34a" sub="لديها اشتراك فعّال" />
              <KpiCard label="إجمالي الإعلانات" value={fmt(ov.totalAds)}      icon={Activity}     color="#2563eb"  sub={ov.pendingAds > 0 ? `${ov.pendingAds} معلّق` : undefined} />
              <KpiCard label="نقرات واتساب"    value={fmt(ov.totalWhatsapp)} icon={MessageCircle} color="#22c55e" />
            </div>

            {/* Smart Alerts */}
            {(inactiveCount > 0 || expiringSoon.length > 0 || zeroEngAds.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <ShieldAlert style={{ width: 16, height: 16, color: "#dc2626" }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>تنبيهات تتطلب إجراء</span>
                </div>

                {inactiveCount > 0 && (
                  <AlertRow
                    type="danger" icon={ShieldAlert}
                    title={`${inactiveCount} مكتب غير نشط`}
                    body={`${tiered.inactive.map((o: any) => o.officeName).slice(0, 3).join(" · ")}${inactiveCount > 3 ? ` وغيرهم` : ""}`}
                    action="تواصل معها"
                    onAction={() => setTab("subs")}
                  />
                )}
                {expiringSoon.length > 0 && (
                  <AlertRow
                    type="warn" icon={Clock}
                    title={`${expiringSoon.length} اشتراك ينتهي خلال 7 أيام`}
                    body={expiringSoon.map(o => `${o.officeName} (${o.trialDaysLeft} يوم)`).join(" · ")}
                    action="راجع الاشتراكات"
                    onAction={() => setTab("subs")}
                  />
                )}
                {zeroEngAds.length > 0 && (
                  <AlertRow
                    type="warn" icon={Eye}
                    title={`${zeroEngAds.length} إعلان بدون أي تفاعل`}
                    body="هذه الإعلانات لم تحصل على أي مشاهدة أو نقرة منذ نشرها"
                    action="مراجعة الإعلانات"
                    onAction={() => setTab("ads")}
                  />
                )}
              </div>
            )}

            {/* Office performance table */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Building2 style={{ width: 16, height: 16, color: NAVY }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>أداء المكاتب</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>— أعلى {showAllOffices ? offices.length : Math.min(10, offices.length)} مكتب</span>
                </div>
                {offices.length > 10 && (
                  <button onClick={() => setShowAllOffices(v => !v)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
                    {showAllOffices ? <><ChevronUp style={{ width: 13, height: 13 }} /> طيّ</> : <><ChevronDown style={{ width: 13, height: 13 }} /> عرض الكل ({offices.length})</>}
                  </button>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      <Th label="اسم المكتب"    col="officeName"      sortKey={sk} sortDir={sd} onClick={() => stog("officeName")} />
                      <Th label="الإعلانات"     col="adsCount"        sortKey={sk} sortDir={sd} onClick={() => stog("adsCount")} />
                      <Th label="المشاهدات"     col="totalViews"      sortKey={sk} sortDir={sd} onClick={() => stog("totalViews")} />
                      <Th label="واتساب"        col="whatsappClicks"  sortKey={sk} sortDir={sd} onClick={() => stog("whatsappClicks")} />
                      <Th label="التفاعل"       col="engagementScore" sortKey={sk} sortDir={sd} onClick={() => stog("engagementScore")} />
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>الحالة</th>
                      <th style={{ padding: "10px 14px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedOffices.map((o: any, i: number) => {
                      const m = TIER_META[o.tier as Tier];
                      return (
                        <tr key={o.officeId} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "13px 14px", fontWeight: 600, color: "#111827" }}>{o.officeName}</td>
                          <td style={{ padding: "13px 14px", textAlign: "center", color: "#374151" }}>{o.adsCount}</td>
                          <td style={{ padding: "13px 14px", textAlign: "center", color: "#374151" }}>{fmt(o.totalViews)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "center", color: "#374151" }}>{fmt(o.whatsappClicks)}</td>
                          <td style={{ padding: "13px 14px", textAlign: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: o.engagementScore >= 50 ? "#16a34a" : o.engagementScore >= 20 ? "#2563eb" : o.engagementScore >= 5 ? "#d97706" : "#dc2626" }}>
                              {o.engagementScore}
                            </span>
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>
                              {m.labelShort}
                            </span>
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <a href={`${BASE}/office/${o.officeSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", display: "flex", justifyContent: "center" }}>
                              <ExternalLink style={{ width: 14, height: 14 }} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                    {displayedOffices.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>لا يوجد مكاتب</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {displayedOffices.map((o: any, i: number) => {
                  const m = TIER_META[o.tier as Tier];
                  return (
                    <div key={o.officeId} style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{o.officeName}</span>
                        <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{m.labelShort}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                        <span>📋 {o.adsCount} إعلان</span>
                        <span>👁 {fmt(o.totalViews)}</span>
                        <span>💬 {fmt(o.whatsappClicks)}</span>
                        <span style={{ fontWeight: 700, color: o.engagementScore >= 20 ? "#16a34a" : "#d97706" }}>⚡ {o.engagementScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* segment summary strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {(Object.keys(tiered) as Tier[]).map(t => {
                const m = TIER_META[t]; const Icon = m.icon;
                return (
                  <div key={t} onClick={() => setTab("detail")} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${m.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <Icon style={{ width: 16, height: 16, color: m.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: m.color, lineHeight: 1 }}>{tiered[t].length}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{m.labelShort}</div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ══ DETAIL (charts + full breakdown) ══ */}
        {tab === "detail" && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>التحليلات التفصيلية</h2>
              <p style={{ color: "#6b7280", fontSize: 13 }}>بيانات مفصّلة لمساعدتك على اتخاذ قرارات مدروسة</p>
            </div>

            {/* charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {chartData.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 16 }}>أداء أفضل المكاتب</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Tooltip contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 8 }}
                        formatter={(v: any) => v.toLocaleString("en-US")} />
                      <Bar dataKey="views" name="مشاهدات" fill={BLUE} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="wa"    name="واتساب"  fill="#22c55e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {pieData.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 16 }}>توزيع تصنيف المكاتب</h3>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <PieChart width={160} height={160}>
                      <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(Object.keys(tiered) as Tier[]).map(t => (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TIER_META[t].color }} />
                          <span style={{ fontSize: 12, color: "#374151" }}>{TIER_META[t].labelShort}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginRight: "auto", paddingRight: 8 }}>{tiered[t].length}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* full office breakdown by tier */}
            {(Object.keys(tiered) as Tier[]).map(tier => {
              const m = TIER_META[tier]; const list = tiered[tier]; const Icon = m.icon;
              if (list.length === 0) return null;
              return (
                <div key={tier} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${m.border}`, overflow: "hidden" }}>
                  <div style={{ background: m.bg, padding: "14px 20px", borderBottom: `1px solid ${m.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon style={{ width: 17, height: 17, color: m.color }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: m.color }}>{m.label}</span>
                    <span style={{ background: m.color, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700, marginRight: "auto" }}>{list.length}</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {list.map((o: any, i: number) => (
                          <tr key={o.officeId} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{o.officeName}</td>
                            <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{o.subscriptionPlan ?? "—"}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>{o.adsCount} إعلان</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>{fmt(o.totalViews)} مشاهدة</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: m.color }}>{o.engagementScore} نقطة</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>{daysLabel(o.daysSinceActivity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ADS ══ */}
        {tab === "ads" && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>أداء الإعلانات</h2>
              <p style={{ color: "#6b7280", fontSize: 13 }}>أفضل الإعلانات وتلك التي تحتاج إلى متابعة</p>
            </div>

            {/* top ads */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <Award style={{ width: 16, height: 16, color: "#f59e0b" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>أفضل الإعلانات أداءً</span>
                <span style={{ fontSize: 12, color: "#9ca3af", marginRight: "auto" }}>أعلى {topAds.length} إعلان</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      {["#", "الإعلان", "المكتب", "المشاهدات", "واتساب", "اتصالات"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topAds.map((ad: any, i: number) => (
                      <tr key={ad.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "11px 14px", color: "#9ca3af", fontWeight: 700, width: 40 }}>
                          {i < 3 ? (["🥇", "🥈", "🥉"][i]) : i + 1}
                        </td>
                        <td style={{ padding: "11px 14px", maxWidth: 220 }}>
                          <a href={`${BASE}/property/${ad.id}`} target="_blank" rel="noopener noreferrer"
                             style={{ color: NAVY, fontWeight: 600, textDecoration: "none", fontSize: 12 }}>
                            {ad.titleAr ?? `إعلان #${ad.id}`}
                          </a>
                        </td>
                        <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{ad.officeName ?? "—"}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "#2563eb" }}>{fmt(ad.views ?? 0)}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#22c55e" }}>{fmt(ad.whatsappClicks ?? 0)}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#f59e0b" }}>{fmt(ad.callClicks ?? 0)}</td>
                      </tr>
                    ))}
                    {topAds.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>لا توجد إعلانات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* zero engagement */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #fecaca", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #fecaca", background: "#fef2f2", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: "#dc2626" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#991b1b" }}>إعلانات بدون أي تفاعل</span>
                <span style={{ fontSize: 12, color: "#9ca3af", marginRight: "auto" }}>{zeroEngAds.length} إعلان</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                      {["الإعلان", "المكتب", "النوع", "تاريخ النشر"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zeroEngAds.map((ad: any) => (
                      <tr key={ad.id} style={{ borderBottom: "1px solid #fef2f2" }}>
                        <td style={{ padding: "11px 14px" }}>
                          <a href={`${BASE}/property/${ad.id}`} target="_blank" rel="noopener noreferrer"
                             style={{ color: NAVY, fontWeight: 600, textDecoration: "none", fontSize: 12 }}>
                            {ad.titleAr ?? `إعلان #${ad.id}`}
                          </a>
                        </td>
                        <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{ad.officeName ?? "—"}</td>
                        <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{ad.type ?? "—"}</td>
                        <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{fmtDate(ad.createdAt)}</td>
                      </tr>
                    ))}
                    {zeroEngAds.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>لا توجد إعلانات بدون تفاعل 🎉</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ SUBSCRIPTIONS ══ */}
        {tab === "subs" && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>صحة الاشتراكات</h2>
              <p style={{ color: "#6b7280", fontSize: 13 }}>تتبع دورة حياة الاشتراك ومعرفة من يحتاج متابعة</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {[
                { label: "اشتراكات نشطة",   val: subs.active ?? 0,       color: "#16a34a", icon: CheckCircle2 },
                { label: "فترة تجريبية",    val: subs.trial ?? 0,        color: "#2563eb", icon: Clock },
                { label: "تنتهي قريباً",     val: subs.expiringSoon ?? 0, color: "#d97706", icon: AlertTriangle },
                { label: "منتهية",           val: subs.expired ?? 0,      color: "#dc2626", icon: XCircle },
                { label: "غير نشطة",         val: subs.inactive ?? 0,     color: "#6b7280", icon: XCircle },
              ].map(x => (
                <KpiCard key={x.label} label={x.label} value={fmt(x.val)} icon={x.icon} color={x.color} />
              ))}
            </div>

            {([
              {
                title: "تنتهي قريباً (خلال 7 أيام)", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
                list: expiringSoon,
                badge: (o: any) => <span style={{ color: "#d97706", fontWeight: 700, fontSize: 12 }}>متبقي {o.trialDaysLeft} يوم</span>,
              },
              {
                title: "عالية الأداء — مرشحة للدعم والأولوية", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
                list: tiered.highPerforming,
                badge: (o: any) => <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 12 }}>تفاعل {o.engagementScore}</span>,
              },
              {
                title: "غير نشطة — تحتاج متابعة", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb",
                list: tiered.inactive,
                badge: (o: any) => <span style={{ color: "#6b7280", fontSize: 12 }}>{daysLabel(o.daysSinceActivity)} منذ آخر نشاط</span>,
              },
            ] as const).map((sec: any) => (
              <div key={sec.title} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${sec.border}`, overflow: "hidden" }}>
                <div style={{ background: sec.bg, padding: "13px 18px", borderBottom: `1px solid ${sec.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: sec.color }}>{sec.title}</span>
                  <span style={{ background: sec.color, color: "#fff", borderRadius: 20, padding: "2px 10px", fontWeight: 700, fontSize: 12 }}>{sec.list.length}</span>
                </div>
                {sec.list.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>لا يوجد مكاتب في هذه الفئة</div>
                ) : sec.list.map((o: any, i: number) => (
                  <div key={o.officeId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < sec.list.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{o.officeName}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{o.subscriptionPlan ?? "بلا باقة"} · عضو منذ {daysLabel(o.memberDays)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {sec.badge(o)}
                      <a href={`${BASE}/office/${o.officeSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#d1d5db" }}>
                        <ExternalLink style={{ width: 13, height: 13 }} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ══ INSIGHTS ══ */}
        {tab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>توصيات ذكية</h2>
              <p style={{ color: "#6b7280", fontSize: 13 }}>إجراءات موصى بها بناءً على بيانات المنصة — كل توصية تساعدك على قرار واضح</p>
            </div>

            {!data ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>جارٍ التحميل…</div>
            ) : insights.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.05)", padding: 48, textAlign: "center" }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "#16a34a", margin: "0 auto 12px" }} />
                <p style={{ color: "#9ca3af" }}>لا توجد توصيات — المنصة تعمل بشكل ممتاز!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {insights.map((ins: any, i: number) => {
                  const Icon = ins.icon;
                  const cfg = {
                    success: { border: "#bbf7d0", bg: "#f0fdf4", col: "#16a34a", hdr: "#dcfce7" },
                    warn:    { border: "#fde68a", bg: "#fffbeb", col: "#d97706", hdr: "#fef9c3" },
                    danger:  { border: "#fecaca", bg: "#fef2f2", col: "#dc2626", hdr: "#fee2e2" },
                    info:    { border: "#bfdbfe", bg: "#eff6ff", col: "#2563eb", hdr: "#dbeafe" },
                  }[ins.type as string] ?? { border: "#e5e7eb", bg: "#f9fafb", col: "#6b7280", hdr: "#f3f4f6" };
                  return (
                    <div key={i} style={{ background: cfg.bg, borderRadius: 12, border: `1px solid ${cfg.border}`, overflow: "hidden" }}>
                      <div style={{ background: cfg.hdr, padding: "11px 16px", display: "flex", alignItems: "center", gap: 9 }}>
                        <Icon style={{ width: 15, height: 15, color: cfg.col, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: cfg.col }}>{ins.title}</span>
                      </div>
                      <div style={{ padding: "11px 16px", fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{ins.body}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── sub-component: header ─── */
function AppHeader({ loading, onRefresh, nav }: { loading: boolean; onRefresh: () => void; nav: (to: string) => void }) {
  return (
    <div style={{ background: NAVY, color: "#fff", padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BarChart2 style={{ width: 18, height: 18, opacity: 0.8 }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>لوحة SaaS للمشرف</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <NavBtn icon={RefreshCw} label="تحديث" onClick={onRefresh} spin={loading} />
        <NavBtn icon={LayoutDashboard} label="الإدارة" onClick={() => nav("/admin")} />
        <NavBtn icon={Home} label="الموقع" onClick={() => nav("/")} />
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, onClick, spin }: { icon: any; label: string; onClick: () => void; spin?: boolean }) {
  return (
    <button onClick={onClick} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500 }}>
      <Icon style={{ width: 13, height: 13, animation: spin ? "spin 1s linear infinite" : "none" }} />
      <span>{label}</span>
    </button>
  );
}
