import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useOfficeAuth } from "@/lib/AuthContext";
import { BarChart2, TrendingUp, Activity } from "lucide-react";

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

  const performanceData = stats
    ? [
        { name: "إجمالي الإعلانات", value: stats.totalListings },
        { name: "الإعلانات النشطة", value: stats.activeListings },
        { name: "المميزة", value: stats.featuredListings },
        { name: "إجمالي العملاء", value: stats.totalLeads },
        { name: "عملاء جدد", value: stats.newLeads },
      ]
    : [];

  const engagementData = stats
    ? [
        { name: "المشاهدات", value: stats.totalViews },
        { name: "واتساب", value: stats.whatsappClicks },
        { name: "اتصالات", value: stats.callClicks },
        { name: "عملاء", value: stats.totalLeads },
      ]
    : [];

  const monthlyViews = [
    { month: "يناير", مشاهدات: 420, عملاء: 28 },
    { month: "فبراير", مشاهدات: 580, عملاء: 35 },
    { month: "مارس", مشاهدات: 490, عملاء: 30 },
    { month: "أبريل", مشاهدات: 720, عملاء: 52 },
    { month: "مايو", مشاهدات: 860, عملاء: 64 },
    { month: "يونيو", مشاهدات: 940, عملاء: 71 },
  ];

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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>الإحصائيات والتحليلات</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>تابع تطور المشاهدات والعملاء وأداء إعلاناتك</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monthly chart — simulated data */}
            <div style={CARD_STYLE}>
              <div className="flex items-start justify-between mb-5 gap-2">
                <div className="flex items-center gap-2.5">
                  <span style={{ width: 36, height: 36, borderRadius: 11, background: "#EEF2FE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp style={{ width: 18, height: 18, color: "#667EEA" }} />
                  </span>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>المشاهدات والعملاء الشهريين</h2>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706", background: "#FFFBEB", border: "1px solid #FDE68A", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>بيانات توضيحية</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyViews}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667EEA" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#667EEA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area type="monotone" dataKey="مشاهدات" stroke="#111827" fill="url(#viewsGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="عملاء" stroke="#667EEA" fill="url(#leadsGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance bar chart */}
            <div style={CARD_STYLE}>
              <div className="flex items-center gap-2.5 mb-5">
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "#EEF2FE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart2 style={{ width: 18, height: 18, color: "#667EEA" }} />
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>نظرة عامة على الأداء</h2>
              </div>
              {performanceData.every(d => d.value === 0) ? (
                <div className="text-center py-12">
                  <BarChart2 className="h-9 w-9 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                  <p style={{ fontSize: 14, color: "#64748B" }}>لا توجد بيانات بعد. أضف إعلانات لتبدأ في جمع الإحصائيات.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "rgba(63,91,216,0.06)" }} />
                    <Bar dataKey="value" fill="#667EEA" radius={[6, 6, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Engagement chart */}
            <div style={CARD_STYLE}>
              <div className="flex items-center gap-2.5 mb-5">
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity style={{ width: 18, height: 18, color: "#059669" }} />
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>مؤشرات التفاعل</h2>
              </div>
              {engagementData.every(d => d.value === 0) ? (
                <div className="text-center py-12">
                  <BarChart2 className="h-9 w-9 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                  <p style={{ fontSize: 14, color: "#64748B" }}>لا توجد مشاهدات أو تفاعل بعد.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "rgba(31,42,68,0.05)" }} />
                    <Bar dataKey="value" fill="#111827" radius={[6, 6, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
