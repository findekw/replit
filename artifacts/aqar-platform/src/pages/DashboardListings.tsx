import { useGetOfficeProperties } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Eye, Pencil, Trash2, Star, Building, Plus, X, AlertTriangle, MessageCircle, Phone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const STATUS_COLORS: Record<string, string> = {
  "للإيجار": "bg-indigo-50 text-indigo-700 border border-indigo-100",
  "للبيع": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "للبدل": "bg-amber-50 text-amber-700 border border-amber-100",
};

export default function DashboardListings() {
  const [page, setPage] = useState(1);
  const { officeId: oid, isLoading: authLoading } = useOfficeAuth();
  const officeId = oid ?? 0;
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
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>إعلاناتي</h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>إدارة كل عقاراتك المعروضة على المنصة</p>
          </div>
          <Link href="/dashboard/listings/new">
            <Button className="gap-2 h-11 px-6 rounded-xl font-bold" style={{ background: "#667EEA" }} data-testid="button-add-listing">
              <Plus className="h-4 w-4" />
              إضافة إعلان
            </Button>
          </Link>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EEF1F5", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}>
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-24">
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "#F5F7FA", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Building className="h-9 w-9" style={{ color: "#94A3B8" }} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>لا توجد إعلانات حتى الآن</p>
              <p style={{ fontSize: 14, color: "#64748B", marginBottom: 22 }}>أضف أول إعلان لمكتبك لبدء جذب العملاء</p>
              <Link href="/dashboard/listings/new">
                <Button className="gap-2 h-11 px-6 rounded-xl font-bold" style={{ background: "#667EEA" }}>
                  <Plus className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #EEF1F5" }}>
                    <th className="text-right p-4" style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>العقار</th>
                    <th className="text-right p-4 hidden md:table-cell" style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>الحالة</th>
                    <th className="text-right p-4 hidden md:table-cell" style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>السعر</th>
                    <th className="text-right p-4 hidden lg:table-cell" style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>التفاعل</th>
                    <th className="text-right p-4" style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#EEF1F5" }}>
                  {properties.map((p) => (
                    <tr key={p.id} className="transition-colors" style={{ }} onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")} onMouseLeave={e => (e.currentTarget.style.background = "")} data-testid={`listing-row-${p.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.primaryImage ? (
                            <img src={p.primaryImage} alt={p.titleAr} className="w-14 h-12 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid #EEF1F5" }} />
                          ) : (
                            <div className="w-14 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F5F7FA" }}>
                              <Building className="h-4 w-4" style={{ color: "#94A3B8" }} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm line-clamp-1" style={{ color: "#111827" }}>{p.titleAr}</div>
                            <div className="text-xs" style={{ color: "#94A3B8" }}>{p.referenceId}</div>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {/* Mobile-only: show status and price */}
                              <span className="text-xs md:hidden" style={{ color: "#64748B" }}>{p.status} · {p.price.toLocaleString("en-US")} KWD</span>
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
                            {/* Per-ad engagement — visible on small screens where the dedicated column is hidden */}
                            <div className="flex items-center gap-3 mt-1 text-xs lg:hidden" style={{ color: "#94A3B8", fontWeight: 600 }}>
                              <span className="flex items-center gap-0.5" title="مشاهدات"><Eye className="h-3 w-3" />{p.views}</span>
                              <span className="flex items-center gap-0.5" title="واتساب"><MessageCircle className="h-3 w-3" />{(p as any).whatsappClicks ?? 0}</span>
                              <span className="flex items-center gap-0.5" title="اتصال"><Phone className="h-3 w-3" />{(p as any).callClicks ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge className={STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm font-bold" style={{ color: "#667EEA" }}>
                        {p.price.toLocaleString("en-US")} KWD
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-3 text-sm" style={{ color: "#64748B", fontWeight: 600 }}>
                          <span className="flex items-center gap-1" title="مشاهدات"><Eye className="h-3.5 w-3.5" />{p.views}</span>
                          <span className="flex items-center gap-1" title="نقرات واتساب" style={{ color: "#16a34a" }}><MessageCircle className="h-3.5 w-3.5" />{(p as any).whatsappClicks ?? 0}</span>
                          <span className="flex items-center gap-1" title="نقرات اتصال" style={{ color: "#667EEA" }}><Phone className="h-3.5 w-3.5" />{(p as any).callClicks ?? 0}</span>
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
                <div className="flex justify-center items-center gap-2 p-4" style={{ borderTop: "1px solid #EEF1F5" }}>
                  <Button variant="outline" size="sm" className="rounded-xl font-semibold" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
                  <span className="px-4 py-1.5 text-sm font-bold rounded-xl" style={{ color: "#111827", background: "#F5F7FA" }}>{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="rounded-xl font-semibold" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي</Button>
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
