import { useState } from "react";
import { useListLeads, useUpdateLead, getListLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, MessageCircle, Phone, FileText } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const LEAD_STATUSES = ["جديد", "مهتم", "تم التواصل", "غير جاد", "مغلق"];

const STATUS_COLORS: Record<string, string> = {
  "جديد": "bg-blue-100 text-blue-800 border-blue-200",
  "مهتم": "bg-blue-50 text-blue-700 border-blue-200",
  "تم التواصل": "bg-blue-100 text-blue-800 border-blue-200",
  "غير جاد": "bg-gray-100 text-gray-600 border-gray-200",
  "مغلق": "bg-red-100 text-red-800 border-red-200",
};

const INTERACTION_COLORS: Record<string, string> = {
  "واتساب": "bg-green-100 text-green-800 border-green-200",
  "اتصال": "bg-blue-100 text-blue-800 border-blue-200",
  "استفسار": "bg-purple-100 text-purple-800 border-purple-200",
};

const SOURCE_LABELS: Record<string, string> = {
  "property_page": "صفحة العقار",
  "office_page": "صفحة المكتب",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-KW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardLeads() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const officeId = user?.officeId ?? 0;

  const params: Record<string, string | number> = { officeId };
  if (filterStatus) params.status = filterStatus;

  const { data: leads, isLoading: leadsLoading } = useListLeads(params as Record<string, string>, {
    query: { enabled: officeId > 0 },
  });

  const isLoading = authLoading || leadsLoading;
  const updateLead = useUpdateLead();

  const allLeads = leads ?? [];
  const filtered = filterType
    ? allLeads.filter((l) => l.inquiryType === filterType)
    : allLeads;

  const totalLeads = allLeads.length;
  const waCount = allLeads.filter((l) => l.inquiryType === "واتساب").length;
  const callCount = allLeads.filter((l) => l.inquiryType === "اتصال").length;
  const formCount = allLeads.filter(
    (l) => l.inquiryType !== "واتساب" && l.inquiryType !== "اتصال"
  ).length;

  const handleStatusChange = (leadId: number, newStatus: string) => {
    updateLead.mutate(
      { id: leadId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
          toast({ title: "تم تحديث الحالة" });
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">العملاء المحتملون</h1>
          <p className="text-sm text-muted-foreground mt-1">
            كل تفاعل على عقاراتك أو صفحة مكتبك يُسجَّل هنا تلقائياً
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">إجمالي العملاء</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : totalLeads}
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">واتساب</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : waCount}
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground">اتصالات</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : callCount}
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-muted-foreground">استفسارات</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : formCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44" data-testid="filter-lead-status">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44" data-testid="filter-lead-type">
              <SelectValue placeholder="كل الأنواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="واتساب">واتساب</SelectItem>
              <SelectItem value="اتصال">اتصال</SelectItem>
              <SelectItem value="استفسار">استفسار</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">لا يوجد عملاء</p>
              <p className="text-sm mt-1">
                ستظهر هنا نقرات واتساب والاتصال على عقاراتك تلقائياً
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-3 bg-secondary/40 text-xs font-semibold text-muted-foreground border-b">
                <span>العقار</span>
                <span>نوع التفاعل</span>
                <span>المصدر</span>
                <span>التاريخ</span>
                <span>الحالة</span>
              </div>
              <div className="divide-y">
                {filtered.map((lead) => {
                  const sourceLabel =
                    SOURCE_LABELS[lead.sourcePage ?? ""] ?? (lead.sourcePage || "—");
                  const isAnonymous =
                    lead.customerName === "زائر" || lead.phone === "—";

                  return (
                    <div
                      key={lead.id}
                      className="px-5 py-4 hover:bg-secondary/20 transition-colors"
                      data-testid={`lead-row-${lead.id}`}
                    >
                      {/* Mobile layout */}
                      <div className="lg:hidden space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${INTERACTION_COLORS[lead.inquiryType] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {lead.inquiryType === "واتساب" && (
                                <MessageCircle className="h-3 w-3 ml-1" />
                              )}
                              {lead.inquiryType === "اتصال" && (
                                <Phone className="h-3 w-3 ml-1" />
                              )}
                              {lead.inquiryType}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {lead.status}
                            </Badge>
                          </div>
                          <Select
                            value={lead.status}
                            onValueChange={(v) => handleStatusChange(lead.id, v)}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs" data-testid={`lead-status-select-${lead.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-sm">
                          {lead.propertyTitle ? (
                            <span className="font-medium text-primary">{lead.propertyTitle}</span>
                          ) : (
                            <span className="text-muted-foreground">صفحة المكتب</span>
                          )}
                        </div>
                        {!isAnonymous && (
                          <div className="text-sm text-muted-foreground">
                            {lead.customerName} · {lead.phone}
                          </div>
                        )}
                        {lead.message && (
                          <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                            {lead.message}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {sourceLabel} · {formatDate(lead.createdAt)}
                        </div>
                      </div>

                      {/* Desktop grid row */}
                      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] gap-4 items-center">
                        {/* العقار */}
                        <div className="min-w-0">
                          {lead.propertyTitle ? (
                            <div>
                              <p className="font-medium text-sm text-foreground truncate">
                                {lead.propertyTitle}
                              </p>
                              {lead.propertyRef && (
                                <p className="text-xs text-muted-foreground">{lead.propertyRef}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">صفحة المكتب</span>
                          )}
                          {!isAnonymous && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {lead.customerName} · {lead.phone}
                            </p>
                          )}
                        </div>

                        {/* نوع التفاعل */}
                        <div>
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1 ${INTERACTION_COLORS[lead.inquiryType] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {lead.inquiryType === "واتساب" && (
                              <MessageCircle className="h-3 w-3" />
                            )}
                            {lead.inquiryType === "اتصال" && (
                              <Phone className="h-3 w-3" />
                            )}
                            {lead.inquiryType}
                          </Badge>
                        </div>

                        {/* المصدر */}
                        <div className="text-sm text-muted-foreground">
                          {sourceLabel}
                        </div>

                        {/* التاريخ */}
                        <div className="text-sm text-muted-foreground">
                          {formatDate(lead.createdAt)}
                        </div>

                        {/* الحالة */}
                        <div>
                          <Select
                            value={lead.status}
                            onValueChange={(v) => handleStatusChange(lead.id, v)}
                          >
                            <SelectTrigger className="w-36 h-8 text-sm" data-testid={`lead-status-select-${lead.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
