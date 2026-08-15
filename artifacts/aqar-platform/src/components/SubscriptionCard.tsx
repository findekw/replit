import { Link } from "wouter";
import { Building, Clock, Crown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysText } from "@/lib/arabicDays";

/**
 * Shared subscription status card — the single source of truth for how an
 * office's current plan is presented. Used on the main dashboard and on the
 * billing / account page so the two never drift apart.
 *
 * All figures come straight from `GET /api/subscription/status` (passed in as
 * `subDetail`), so the dates, the countdown and the progress bars always agree.
 */
export default function SubscriptionCard({
  subStatus,
  subDetail,
  trialStartedAt,
}: {
  subStatus: string | null;
  subDetail: Record<string, any> | null;
  trialStartedAt?: string | null;
}) {
  if (!subStatus) return null;

  const d = subDetail ?? {};
  const isActive = subStatus === "active";
  const isTrial = subStatus === "trial";
  const isFree = d.isFreePlan ?? isTrial;
  const startIso: string | null = (d.periodStartedAt as string | null | undefined) ?? trialStartedAt ?? null;
  const endsIso: string | null = (d.periodEndsAt as string | null | undefined) ?? null;
  const DAY = 86400000;
  const daysLeft: number | null = (d.daysLeft as number | null | undefined) ?? null;
  const totalDays: number | null =
    d.planDurationDays ??
    (startIso && endsIso ? Math.max(1, Math.round((new Date(endsIso).getTime() - new Date(startIso).getTime()) / DAY)) : null);
  const elapsed: number | null =
    totalDays !== null && daysLeft !== null
      ? Math.max(0, Math.min(totalDays, totalDays - daysLeft))
      : startIso
        ? Math.max(0, Math.round((Date.now() - new Date(startIso).getTime()) / DAY))
        : null;
  const durPct = totalDays && elapsed !== null ? Math.min(100, Math.max(2, Math.round((elapsed / totalDays) * 100))) : null;
  const maxL: number | null = d.planMaxListings ?? null;
  const usedL: number = d.listingsUsed ?? 0;
  const listPct = maxL ? Math.min(100, Math.max(2, Math.round((usedL / maxL) * 100))) : null;
  const listingsLeft = maxL !== null ? maxL - usedL : null;
  const kwd = (fils: number) => (Number(fils || 0) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 });
  const planName = d.planNameAr ?? (isTrial ? "تجربة مجانية" : isActive ? "اشتراك مدفوع" : "لا يوجد اشتراك");
  const priceLabel = d.planPriceFils != null && d.planDurationDays != null ? `${kwd(d.planPriceFils)} د.ك / ${d.planDurationDays} يوم` : null;
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-KW-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const nearExpiry = (daysLeft !== null && daysLeft <= 2) || (listingsLeft !== null && listingsLeft <= 5);
  const isEnded = subStatus === "expired" || subStatus === "inactive";
  const showSubscribe = (isFree || isEnded) && subStatus !== "pending_payment";
  const showRenew = !isFree && !isEnded && daysLeft !== null && daysLeft <= 5;
  const statusMeta: Record<string, { text: string; cls: string }> = {
    active: { text: "نشط", cls: "bg-green-100 text-green-800" },
    trial: { text: "تجريبي", cls: "bg-indigo-100 text-indigo-800" },
    pending_payment: { text: "قيد المراجعة", cls: "bg-indigo-50 text-indigo-700" },
    expired: { text: "منتهي", cls: "bg-red-100 text-red-800" },
    inactive: { text: "غير نشط", cls: "bg-red-100 text-red-800" },
  };
  const sm = statusMeta[subStatus] ?? { text: subStatus, cls: "bg-gray-100 text-gray-700" };
  const Bar = ({ pct, color }: { pct: number; color: string }) => (
    <div style={{ height: 8, background: "#EEF1F5", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
  const Tile = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div style={{ background: "#F7F9FC", borderRadius: 12, padding: "10px 14px" }}>
      <p style={{ fontSize: 12, color: "#64748b" }}>{label}</p>
      <p className="font-semibold" style={{ fontSize: 15, marginTop: 3, color: color ?? "#0f172a" }}>{value}</p>
    </div>
  );

  return (
    <div className="bg-card border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap border-b pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#667EEA]" />
            <span className="font-bold" style={{ fontSize: 16, color: "#0f172a" }}>
              {planName}{maxL !== null ? ` · ${maxL} إعلان` : ""}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sm.cls}`}>
              {isActive && <CheckCircle2 className="h-3 w-3" />}
              {(isTrial || subStatus === "pending_payment") && <Clock className="h-3 w-3" />}
              {(subStatus === "expired" || subStatus === "inactive") && <AlertTriangle className="h-3 w-3" />}
              {sm.text}
            </span>
          </div>
          {priceLabel && <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{priceLabel}</p>}
        </div>
        {showSubscribe && (
          <Link href="/dashboard/subscribe">
            <Button size="sm" className="gap-2 bg-[#667EEA] hover:bg-indigo-700 text-white">
              <Crown className="h-3.5 w-3.5" />اشترك الآن
            </Button>
          </Link>
        )}
        {showRenew && (
          <Link href="/dashboard/subscribe">
            <Button size="sm" className="gap-2 bg-[#667EEA] hover:bg-indigo-700 text-white">
              <Crown className="h-3.5 w-3.5" />جدّد الاشتراك
            </Button>
          </Link>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Tile label="تاريخ البدء" value={fmtDate(startIso)} />
        <Tile label="تاريخ الانتهاء" value={fmtDate(endsIso)} />
        <Tile
          label="المدة المتبقية"
          value={daysLeft !== null ? (daysLeft === 0 ? "منتهية" : daysText(daysLeft)) : "—"}
          color={daysLeft !== null && daysLeft <= 2 ? "#ea580c" : undefined}
        />
      </div>

      {/* Progress: duration */}
      {durPct !== null && totalDays !== null && (
        <div className="mb-4">
          <div className="flex justify-between mb-1.5" style={{ fontSize: 12, color: "#64748b" }}>
            <span>مدة الاشتراك</span>
            <span>{Math.min(elapsed ?? 0, totalDays)} من {totalDays} يوم</span>
          </div>
          <Bar pct={durPct} color={daysLeft !== null && daysLeft <= 2 ? "#ea580c" : "#667EEA"} />
        </div>
      )}

      {/* Progress: listings */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5" style={{ fontSize: 12, color: "#64748b" }}>
          <span className="inline-flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> الإعلانات المنشورة</span>
          <span>{maxL !== null ? `${usedL} من ${maxL}` : `${usedL} إعلان`}</span>
        </div>
        {listPct !== null && <Bar pct={listPct} color={listingsLeft !== null && listingsLeft <= 5 ? "#ea580c" : "#667EEA"} />}
      </div>

      {/* Payments — only on real (paid) plans */}
      {!isFree && (
        <div className="grid grid-cols-2 gap-3">
          <Tile label="عدد الاشتراكات" value={String(d.subscriptionsCount ?? d.paymentsCount ?? 0)} />
          <Tile label="إجمالي المدفوع" value={`${kwd(d.paymentsTotalFils ?? 0)} د.ك`} />
        </div>
      )}

      {/* Near-expiry warning */}
      {(isActive || isTrial) && nearExpiry && (
        <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#FFF7ED", color: "#c2410c", fontSize: 12.5 }}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {listingsLeft !== null && listingsLeft <= 5 && !(daysLeft !== null && daysLeft <= 2)
              ? `باقي ${listingsLeft} إعلانات على حد باقتك — جدّد الآن لرفع الحد.`
              : `${isTrial ? "تجربتك المجانية" : "اشتراكك"} ${daysLeft && daysLeft > 0 ? `تنتهي بعد ${daysText(daysLeft)}` : "انتهت"} — ${isTrial ? "اشترك" : "جدّد"} للحفاظ على ظهور إعلاناتك.`}
          </span>
        </div>
      )}
    </div>
  );
}
