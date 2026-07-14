import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useOfficeAuth } from "@/lib/AuthContext";
import { BarChart2, Building, TrendingUp, Eye, MessageCircle, Phone } from "lucide-react";

const CARD_STYLE: React.CSSProperties = {
  background: "#fff", border: "1px solid #EEF1F5", borderRadius: 16,
  boxShadow: "0 4px 16px rgba(15,23,42,0.05)", padding: 22,
};
const CHART_TOOLTIP = {
  contentStyle: { borderRadius: 12, border: "1px solid #EEF1F5", boxShadow: "0 4px 16px rgba(15,23,42,0.08)", fontFamily: "'Cairo',sans-serif", fontSize: 13 },
};

export default function DashboardAnalytics() {
  const { officeId: oid } = useOfficeAuth();
  const officeId = oid ?? 0;

  const { data: stats, isLoading } = useGetDashboardStats(officeId, {
    query: {
      queryKey: getGetDashboardStatsQueryKey(officeId),
      enabled: officeId > 0,
    },
  });

  // Simple, real numbers only — no simulated/monthly charts, no leads or
  // featured metrics (they don't apply to offices).
  const tiles = stats
    ? [
        { label: "إجمالي الإعلانات", value: stats.totalListings, icon: Building, fg: "#667EEA", bg: "#EEF2FE" },
        { label: "الإعلانات النشطة", value: stats.activeListings, icon: TrendingUp, fg: "#059669", bg: "#ECFDF5" },
        { label: "إجمالي المشاهدات", value: stats.totalViews, icon: Eye, fg: "#667EEA", bg: "#EEF2FE" },
        { label: "نقرات واتساب", value: stats.whatsappClicks, icon: MessageCircle, fg: "#059669", bg: "#ECFDF5" },
        { label: "نقرات الاتصال", value: stats.callClicks, icon: Phone, fg: "#667EEA", bg: "#EEF2FE" },
      ]
    : [];

  const engagementData = stats
    ? [
        { name: "المشاهدات", value: stats.totalViews },
        { name: "واتساب", value: stats.whatsappClicks },
        { name: "اتصالات", value: stats.callClicks },
      ]
    : [];

  if (!officeId) {
    return (
      <DashboardLayout>
        <div dir="rtl" className="flex flex-col items-center justify-center py-24 text-center">
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#F5F7FA", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BarChart2 className="h-9 w-9" style={{ color: "#94A3B8" }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>لا يوجد مكتب مرتبط</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div dir="rtl">
        <div className="mb-6">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>الإحصائيات</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>أرقام إعلاناتك وتفاعل العملاء معها</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Stat tiles — plain numbers, always visible (no chart to disappear on mobile) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
              {tiles.map((t) => (
                <div key={t.label} style={{ ...CARD_STYLE, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: t.bg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <t.icon style={{ width: 19, height: 19, color: t.fg }} />
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{(t.value ?? 0).toLocaleString("en-US")}</div>
                  <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* Engagement bar chart */}
            <div style={CARD_STYLE}>
              <div className="flex items-center gap-2.5 mb-5">
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "#EEF2FE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart2 style={{ width: 18, height: 18, color: "#667EEA" }} />
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>تفاعل العملاء مع إعلاناتك</h2>
              </div>
              {engagementData.every((d) => d.value === 0) ? (
                <div className="text-center py-12">
                  <BarChart2 className="h-9 w-9 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                  <p style={{ fontSize: 14, color: "#64748B" }}>لا توجد مشاهدات أو تفاعل بعد. أضف إعلانات لتبدأ في جمع الأرقام.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "rgba(63,91,216,0.06)" }} />
                    <Bar dataKey="value" fill="#667EEA" radius={[6, 6, 0, 0]} maxBarSize={64} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
