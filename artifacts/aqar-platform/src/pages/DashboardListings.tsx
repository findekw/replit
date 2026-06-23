import { useGetOfficeProperties } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Eye, Pencil, Trash2, Star, Building, Plus, X, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const STATUS_COLORS: Record<string, string> = {
  "للإيجار": "bg-blue-100 text-blue-800",
  "للبيع": "bg-blue-100 text-blue-800",
  "للبدل": "bg-orange-100 text-orange-800",
};

export default function DashboardListings() {
  const [page, setPage] = useState(1);
  const { user, isLoading: authLoading } = useAuth();
  const officeId = user?.officeId ?? 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading: propsLoading, refetch } = useGetOfficeProperties(
    officeId,
    { page, limit: 10 } as any,
    { query: { enabled: officeId > 0 } }
  );

  const isLoading = authLoading || propsLoading;
  const properties = data?.properties ?? [];
  const totalPages = data?.totalPages ?? 1;

  /* ─── Delete confirmation state ─── */
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  function openDeleteDialog(id: number, name: string) {
    setDeleteId(id);
    setDeleteName(name);
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteId(null);
    setDeleteName("");
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE}/api/properties/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "فشل الحذف", description: data.error ?? "حدث خطأ غير متوقع", variant: "destructive" });
        return;
      }
      console.log(`[DashboardListings] Deleted property #${deleteId}`);
      toast({ title: "تم الحذف بنجاح", description: `تم حذف "${deleteName}"` });
      await refetch();
      queryClient.invalidateQueries();
      setDeleteId(null);
      setDeleteName("");
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تحقق من اتصالك وحاول مرة أخرى", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <div dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">إعلاناتي</h1>
          <Link href="/dashboard/listings/new">
            <Button className="gap-2" data-testid="button-add-listing">
              <Plus className="h-4 w-4" />
              إضافة إعلان
            </Button>
          </Link>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">لا توجد إعلانات حتى الآن</p>
              <p className="text-sm mb-6">أضف أول إعلان لمكتبك لبدء جذب العملاء</p>
              <Link href="/dashboard/listings/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary text-sm">
                    <th className="text-right p-4 font-medium text-muted-foreground">العقار</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">الحالة</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">السعر</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">المشاهدات</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/50 transition-colors" data-testid={`listing-row-${p.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.primaryImage ? (
                            <img src={p.primaryImage} alt={p.titleAr} className="w-12 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Building className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm line-clamp-1">{p.titleAr}</div>
                            <div className="text-xs text-muted-foreground">{p.referenceId}</div>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {/* Mobile-only: show status and price */}
                              <span className="text-xs text-muted-foreground md:hidden">{p.status} · {p.price.toLocaleString("en-US")} KWD</span>
                              {p.featured && (
                                <Badge className="text-xs bg-accent/10 text-accent">
                                  <Star className="h-2 w-2 ml-1" />
                                  مميز
                                </Badge>
                              )}
                              {(p as any).approvalStatus === "rejected" ? (
                                <Badge className="text-xs bg-red-100 text-red-700">محظور</Badge>
                              ) : !p.active && (
                                <Badge className="text-xs bg-amber-50 text-amber-700">معلّق</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge className={STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm font-medium">
                        {p.price.toLocaleString("en-US")} KWD
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {p.views}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild data-testid={`button-view-${p.id}`} title="عرض الإعلان">
                            <Link href={`/properties/${p.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${p.id}`}
                            title="تعديل الإعلان"
                            onClick={() => navigate(`/dashboard/listings/${p.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${p.id}`}
                            title="حذف الإعلان"
                            onClick={() => openDeleteDialog(p.id, p.titleAr)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
                  <span className="px-3 py-1 text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteId !== null && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={closeDeleteDialog}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div
            dir="rtl"
            style={{ position: "relative", background: "#fff", borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDeleteDialog}
              style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
              disabled={deleting}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>حذف الإعلان</h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                هل أنت متأكد من حذف<br />
                <strong style={{ color: "#374151" }}>"{deleteName}"</strong>؟<br />
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={closeDeleteDialog}
                disabled={deleting}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e5e7eb",
                  background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1,
                }}
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: deleting ? "#fca5a5" : "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: deleting ? "not-allowed" : "pointer", transition: "background .15s",
                }}
              >
                {deleting ? "جارٍ الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
