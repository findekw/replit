import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import { BarChart2 } from "lucide-react";

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const officeId = user?.officeId ?? 0;

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
        <div dir="rtl" className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <BarChart2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">لا يوجد مكتب مرتبط</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div dir="rtl">
        <h1 className="text-2xl font-bold text-foreground mb-6">الإحصائيات والتحليلات</h1>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monthly chart — simulated data */}
            <div className="bg-card border rounded-2xl p-4 md:p-6">
              <div className="flex items-start justify-between mb-5 gap-2">
                <h2 className="font-bold text-lg">المشاهدات والعملاء الشهريين</h2>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full whitespace-nowrap">بيانات توضيحية</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyViews}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221, 54%, 23%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(221, 54%, 23%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="مشاهدات" stroke="hsl(221, 54%, 23%)" fill="url(#viewsGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="عملاء" stroke="#2563EB" fill="url(#leadsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance bar chart */}
            <div className="bg-card border rounded-2xl p-4 md:p-6">
              <h2 className="font-bold text-lg mb-5">نظرة عامة على الأداء</h2>
              {performanceData.every(d => d.value === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد بيانات بعد. أضف إعلانات لتبدأ في جمع الإحصائيات.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(221, 54%, 23%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Engagement chart */}
            <div className="bg-card border rounded-2xl p-4 md:p-6">
              <h2 className="font-bold text-lg mb-5">مؤشرات التفاعل</h2>
              {engagementData.every(d => d.value === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد مشاهدات أو تفاعل بعد.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0B2545" radius={[4, 4, 0, 0]} />
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
