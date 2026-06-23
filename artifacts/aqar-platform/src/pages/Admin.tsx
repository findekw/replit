import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, CheckCircle, XCircle, ClipboardList,
  Users, Shield, LogOut, RefreshCw, LayoutDashboard,
  Home, MapPin, CalendarDays, ExternalLink, ImageOff, BarChart2,
} from "lucide-react";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();
const BLUE = "hsl(221,54%,23%)";

interface PendingOffice {
  userId: number;
  userName: string;
  userEmail: string;
  userStatus: string;
  officeId: number;
  officeName: string;
  officeSlug: string;
  officePhone: string | null;
  officeActive: boolean;
  createdAt: string;
}

interface PendingListing {
  id: number;
  titleAr: string;
  status: string;
  type: string;
  price: number;
  approvalStatus: string;
  active: boolean;
  createdAt: string;
  officeId: number | null;
  officeName: string | null;
  imageUrl: string | null;
  areaName: string | null;
  governorateName: string | null;
}

interface ConfirmState {
  type: "office" | "listing";
  id: number;
  name: string;
  action: "approve" | "reject";
}

async function adminFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function adminPost(path: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "خطأ" }));
    throw new Error((data as { error: string }).error ?? "خطأ");
  }
  return res.json() as Promise<{ message: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-KW", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function typeLabel(status: string): { text: string; color: string } {
  if (status === "للبيع")   return { text: "للبيع",  color: "#2563eb" };
  if (status === "للبدل")   return { text: "للبدل",  color: "#7c3aed" };
  return { text: "للإيجار", color: "#059669" };
}

export default function Admin() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [offices, setOffices]             = useState<PendingOffice[]>([]);
  const [listings, setListings]           = useState<PendingListing[]>([]);
  const [loadingOffices, setLoadingOffices]   = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"offices" | "listings">("offices");
  const [confirm, setConfirm]             = useState<ConfirmState | null>(null);

  const loadOffices = useCallback(async () => {
    setLoadingOffices(true);
    try {
      const data = await adminFetch<{ offices: PendingOffice[] }>("/api/admin/pending-offices");
      setOffices(data.offices);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المكاتب المعلقة", variant: "destructive" });
    } finally {
      setLoadingOffices(false);
    }
  }, [toast]);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const data = await adminFetch<{ listings: PendingListing[] }>("/api/admin/pending-listings");
      setListings(data.listings);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الإعلانات المعلقة", variant: "destructive" });
    } finally {
      setLoadingListings(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") { navigate("/"); return; }
      loadOffices();
      loadListings();
    }
  }, [authLoading, user, navigate, loadOffices, loadListings]);

  async function executeAction() {
    if (!confirm) return;
    const { type, id, action } = confirm;
    setConfirm(null);
    const key = `${type}-${id}-${action}`;
    setActionLoading(key);
    try {
      const endpoint = type === "office"
        ? `/api/admin/offices/${id}/${action}`
        : `/api/admin/listings/${id}/${action}`;
      const res = await adminPost(endpoint);
      const isApprove = action === "approve";
      toast({
        title: type === "office"
          ? (isApprove ? "تم تفعيل المكتب ✓" : "تم رفض التسجيل")
          : (isApprove ? "تم إلغاء الحظر ✓" : "تم حظر الإعلان"),
        description: res.message,
        variant: isApprove ? "default" : "destructive",
      });
      if (type === "office") await loadOffices();
      else await loadListings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() { await logout(); navigate("/"); }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const confirmTitle = confirm
    ? confirm.type === "office"
      ? (confirm.action === "approve" ? "قبول المكتب" : "رفض التسجيل")
      : (confirm.action === "approve" ? "إلغاء حظر الإعلان" : "حظر الإعلان")
    : "";

  const confirmDesc = confirm
    ? confirm.type === "office"
      ? confirm.action === "approve"
        ? `هل أنت متأكد من قبول وتفعيل مكتب "${confirm.name}"؟ سيتمكن المكتب من نشر الإعلانات فوراً.`
        : `هل أنت متأكد من رفض تسجيل "${confirm.name}"؟`
      : confirm.action === "approve"
        ? `هل أنت متأكد من إلغاء حظر "${confirm.name}"؟ سيظهر الإعلان للعموم مجدداً.`
        : `هل تريد حظر "${confirm.name}"؟ سيُخفى عن جميع المستخدمين فوراً بسبب انتهاك المحتوى.`
    : "";

  return (
    <div className="min-h-screen bg-[#f4f6fb]" dir="rtl">

      {/* Confirm dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              style={{
                background: confirm?.action === "reject" ? "#ef4444" : "#2563eb",
                color: "#fff",
              }}
            >
              {confirm?.action === "approve"
                ? confirm.type === "office" ? "قبول وتفعيل" : "قبول ونشر"
                : "تأكيد الرفض"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#3F5BD8" }}>
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-base font-bold leading-tight text-gray-900">لوحة تحكم المدير</h1>
              <p className="text-xs text-gray-400 leading-tight">منصة Finde الكويت</p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm text-gray-400 hidden sm:block ml-2">{user.name}</span>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1.5 text-sm" onClick={() => navigate("/")}>
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">العودة للموقع</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1.5 text-sm" onClick={() => navigate("/admin")}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>لوحة التحكم</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1.5 text-sm" onClick={() => navigate("/admin/analytics")}>
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">التحليلات</span>
            </Button>
            <Button size="sm" className="gap-1.5 text-sm text-white border-0" style={{ background: "#ef4444" }} onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ background: "#e8edf7" }}>
                <Users className="h-5 w-5" style={{ color: BLUE }} />
              </div>
              <span className="text-sm text-muted-foreground">مكاتب معلقة</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: BLUE }}>{offices.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground">إعلانات منشورة حديثاً</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{listings.filter(l => l.active).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b bg-transparent">
          {([
            { key: "offices"  as const, icon: Users,    label: "طلبات تسجيل المكاتب",   count: offices.length  },
            { key: "listings" as const, icon: Building2, label: "مراقبة الإعلانات", count: listings.filter(l => !l.active).length || undefined },
          ]).map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-[hsl(221,54%,23%)] text-[hsl(221,54%,23%)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
                {count > 0 && (
                  <span
                    className="text-white text-xs rounded-full px-1.5 py-0.5 leading-none"
                    style={{ background: key === "offices" ? BLUE : "#2563eb" }}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════ OFFICES TAB ═══════════════ */}
        {activeTab === "offices" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">طلبات تسجيل المكاتب</h2>
              <Button variant="ghost" size="sm" onClick={loadOffices} className="gap-1 text-muted-foreground">
                <RefreshCw className="h-3 w-3" />تحديث
              </Button>
            </div>

            {loadingOffices ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
              </div>
            ) : offices.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-white rounded-2xl border">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-60" />
                <p className="font-medium">لا توجد طلبات قيد المراجعة</p>
                <p className="text-sm">جميع طلبات التسجيل تمت مراجعتها</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {offices.map((office) => (
                  <div
                    key={office.officeId}
                    className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4"
                    data-testid={`office-row-${office.officeId}`}
                  >
                    {/* Office info */}
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "#e8edf7" }}
                      >
                        <Building2 className="h-6 w-6" style={{ color: BLUE }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-base leading-tight">{office.officeName}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{office.userEmail}</p>
                        {office.officePhone && (
                          <p className="text-sm text-muted-foreground" dir="ltr">{office.officePhone}</p>
                        )}
                        <p className="text-xs font-mono text-blue-600 mt-1">finde.co/{office.officeSlug}</p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs flex-shrink-0">
                        قيد المراجعة
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(office.createdAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t">
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setConfirm({ type: "office", id: office.officeId, name: office.officeName, action: "approve" })}
                        data-testid={`approve-office-${office.officeId}`}
                        style={{
                          flex: 1,
                          height: "38px",
                          borderRadius: "10px",
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle style={{ width: 16, height: 16 }} />
                        قبول
                      </button>
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setConfirm({ type: "office", id: office.officeId, name: office.officeName, action: "reject" })}
                        data-testid={`reject-office-${office.officeId}`}
                        style={{
                          flex: 1,
                          height: "38px",
                          borderRadius: "10px",
                          background: "#fff",
                          color: "#ef4444",
                          border: "1px solid #fca5a5",
                          fontWeight: 700,
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        <XCircle style={{ width: 16, height: 16 }} />
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ LISTINGS TAB ═══════════════ */}
        {activeTab === "listings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">مراقبة الإعلانات المنشورة</h2>
                <p className="text-sm text-muted-foreground mt-0.5">الإعلانات تُنشر تلقائياً — احظر المحتوى المخالف فقط</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadListings} className="gap-1 text-muted-foreground">
                <RefreshCw className="h-3 w-3" />تحديث
              </Button>
            </div>

            {loadingListings ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-white rounded-2xl border">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-60" />
                <p className="font-medium">لا توجد إعلانات حتى الآن</p>
                <p className="text-sm">ستظهر الإعلانات هنا فور نشرها من المكاتب</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => {
                  const lbl = typeLabel(listing.status);
                  const location = [listing.areaName, listing.governorateName?.replace(/^محافظة\s*/, "")].filter(Boolean).join("، ");
                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col"
                      data-testid={`listing-row-${listing.id}`}
                    >
                      {/* Image */}
                      <div
                        style={{
                          height: "160px",
                          background: "#f1f5f9",
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.titleAr}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                            <ImageOff style={{ width: 32, height: 32, color: "#94a3b8" }} />
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>لا توجد صورة</span>
                          </div>
                        )}
                        {/* Type badge */}
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: lbl.color,
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "20px",
                          }}
                        >
                          {lbl.text}
                        </span>
                        {/* Property type */}
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: "20px",
                          }}
                        >
                          {listing.type}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col flex-1 gap-2">
                        <p className="font-bold text-foreground text-sm leading-snug line-clamp-2">{listing.titleAr}</p>

                        <p className="text-lg font-black" style={{ color: BLUE }}>
                          {listing.price.toLocaleString("en-US")} <span className="text-sm font-bold">د.ك</span>
                        </p>

                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {listing.officeName && (
                            <span className="flex items-center gap-1">
                              <Building2 style={{ width: 12, height: 12, flexShrink: 0 }} />
                              {listing.officeName}
                            </span>
                          )}
                          {location && (
                            <span className="flex items-center gap-1">
                              <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
                              {location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CalendarDays style={{ width: 12, height: 12, flexShrink: 0 }} />
                            {formatDate(listing.createdAt)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t">
                          {/* Blocked badge */}
                          {!listing.active && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                              <XCircle style={{ width: 13, height: 13, color: "#dc2626", flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>محظور — مخالف للمحتوى</span>
                            </div>
                          )}

                          {/* View button */}
                          <button
                            onClick={() => window.open(`${window.location.origin}/properties/${listing.id}`, "_blank")}
                            style={{
                              width: "100%",
                              height: "36px",
                              borderRadius: "8px",
                              background: "#f1f5f9",
                              color: "#374151",
                              border: "1px solid #e2e8f0",
                              fontWeight: 600,
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <ExternalLink style={{ width: 14, height: 14 }} />
                            عرض الإعلان
                          </button>

                          {/* Block / Unblock */}
                          {listing.active ? (
                            <button
                              disabled={!!actionLoading}
                              onClick={() => setConfirm({ type: "listing", id: listing.id, name: listing.titleAr, action: "reject" })}
                              data-testid={`reject-listing-${listing.id}`}
                              style={{
                                width: "100%",
                                height: "36px",
                                borderRadius: "8px",
                                background: "#fff",
                                color: "#ef4444",
                                border: "1px solid #fca5a5",
                                fontWeight: 700,
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                                opacity: actionLoading ? 0.6 : 1,
                              }}
                            >
                              <XCircle style={{ width: 14, height: 14 }} />
                              حظر لمخالفة المحتوى
                            </button>
                          ) : (
                            <button
                              disabled={!!actionLoading}
                              onClick={() => setConfirm({ type: "listing", id: listing.id, name: listing.titleAr, action: "approve" })}
                              data-testid={`approve-listing-${listing.id}`}
                              style={{
                                width: "100%",
                                height: "36px",
                                borderRadius: "8px",
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                fontWeight: 700,
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                                opacity: actionLoading ? 0.6 : 1,
                              }}
                            >
                              <CheckCircle style={{ width: 14, height: 14 }} />
                              إلغاء الحظر
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
