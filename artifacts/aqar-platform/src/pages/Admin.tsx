import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/lib/AuthContext";
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
  Settings, Trash2, KeyRound, UserPlus,
} from "lucide-react";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

/* ── Finde design system tokens ── */
const NAVY = "#1F2A44";
const BLUE = "#3F5BD8";
const BODY = "#64748B";
const BORDER = "#EEF1F5";
const PAGE_BG = "#F5F7FA";
const GREEN = "#059669";
const RED = "#DC2626";
const AMBER = "#D97706";
const CARD_SHADOW = "0 4px 16px rgba(15,23,42,0.05)";

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

interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface AllOffice {
  officeId: number;
  officeName: string;
  userEmail: string;
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
  const { admin: user, isLoading: authLoading, logout } = useAdminAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [offices, setOffices]             = useState<PendingOffice[]>([]);
  const [listings, setListings]           = useState<PendingListing[]>([]);
  const [loadingOffices, setLoadingOffices]   = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"offices" | "listings" | "tools">("offices");
  const [confirm, setConfirm]             = useState<ConfirmState | null>(null);

  /* ── Tools tab state ── */
  const [admins, setAdmins]               = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [allOffices, setAllOffices]       = useState<AllOffice[]>([]);
  const [toolsBusy, setToolsBusy]         = useState<string | null>(null);
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);
  const [newAdmin, setNewAdmin]           = useState({ name: "", email: "", password: "" });
  const [resetOfficeId, setResetOfficeId] = useState("");
  const [resetPassword, setResetPassword] = useState("");

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

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const data = await adminFetch<{ admins: AdminUser[] }>("/api/admin/admins");
      setAdmins(data.admins ?? []);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل قائمة المسؤولين", variant: "destructive" });
    } finally {
      setLoadingAdmins(false);
    }
  }, [toast]);

  const loadAllOffices = useCallback(async () => {
    try {
      const data = await adminFetch<{ offices: AllOffice[] }>("/api/admin/all-offices");
      setAllOffices(data.offices ?? []);
    } catch {
      /* silent — dropdown just stays empty */
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/admin/login"); return; }
      loadOffices();
      loadListings();
    }
  }, [authLoading, user, navigate, loadOffices, loadListings]);

  // Load tools data when the tools tab is opened
  useEffect(() => {
    if (activeTab === "tools" && user) {
      loadAdmins();
      loadAllOffices();
    }
  }, [activeTab, user, loadAdmins, loadAllOffices]);

  async function clearDemoData() {
    setConfirmClearDemo(false);
    setToolsBusy("clear-demo");
    try {
      const res = await fetch(`${BASE}/api/admin/demo-data/clear`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "فشل مسح البيانات");
      toast({ title: "تم", description: (data as { message?: string }).message ?? "تم مسح البيانات التجريبية" });
      await loadListings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setToolsBusy(null);
    }
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast({ title: "خطأ", description: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }
    setToolsBusy("add-admin");
    try {
      const res = await fetch(`${BASE}/api/admin/admins`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "فشل إضافة المسؤول");
      toast({ title: "تم", description: (data as { message?: string }).message ?? "تمت إضافة المسؤول" });
      setNewAdmin({ name: "", email: "", password: "" });
      await loadAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setToolsBusy(null);
    }
  }

  async function resetOfficePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetOfficeId || !resetPassword) {
      toast({ title: "خطأ", description: "اختر المكتب وأدخل كلمة المرور الجديدة", variant: "destructive" });
      return;
    }
    setToolsBusy("reset-password");
    try {
      const res = await fetch(`${BASE}/api/admin/offices/${resetOfficeId}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "فشل إعادة التعيين");
      toast({ title: "تم", description: (data as { message?: string }).message ?? "تمت إعادة تعيين كلمة المرور" });
      setResetPassword("");
      setResetOfficeId("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setToolsBusy(null);
    }
  }

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

  if (!user) return null;

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

  const activeListings = listings.filter(l => l.active).length;
  const blockedListings = listings.filter(l => !l.active).length;

  return (
    <div className="adm-root" style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <style>{`
        .adm-root * { font-family: 'Cairo', sans-serif; }
        .adm-card { background:#fff; border-radius:16px; border:1px solid ${BORDER}; box-shadow:${CARD_SHADOW}; }
        .adm-kpi { background:#fff; border-radius:16px; border:1px solid ${BORDER}; box-shadow:${CARD_SHADOW}; padding:18px 20px; display:flex; align-items:center; gap:14px; transition:transform .15s ease, box-shadow .15s ease; }
        .adm-kpi:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,0.08); }
        .adm-kpi-icon { width:46px; height:46px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .adm-kpi-val { font-size:30px; font-weight:800; line-height:1; color:${NAVY}; }
        .adm-kpi-lbl { font-size:13px; color:${BODY}; margin-top:5px; font-weight:600; }
        .adm-tab { padding:11px 18px; border:none; background:transparent; cursor:pointer; font-size:14px; font-weight:700; color:${BODY}; border-radius:10px; display:flex; align-items:center; gap:8px; transition:all .15s ease; }
        .adm-tab--active { background:${BLUE}; color:#fff; box-shadow:0 4px 12px rgba(63,91,216,0.25); }
        .adm-tab:not(.adm-tab--active):hover { background:#EEF1F5; color:${NAVY}; }
        .adm-tab-count { font-size:11px; font-weight:800; border-radius:999px; padding:1px 8px; line-height:1.6; }
        .adm-table { width:100%; border-collapse:collapse; font-size:13.5px; }
        .adm-table thead th { padding:12px 16px; text-align:right; font-size:12px; font-weight:700; color:${BODY}; background:#F8FAFC; border-bottom:1px solid ${BORDER}; white-space:nowrap; }
        .adm-table tbody td { padding:14px 16px; border-bottom:1px solid #F1F5F9; color:#334155; vertical-align:middle; }
        .adm-table tbody tr:last-child td { border-bottom:none; }
        .adm-table tbody tr:hover { background:#FAFBFE; }
        .adm-chip { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:4px 11px; border-radius:999px; white-space:nowrap; }
        .adm-btn { height:38px; padding:0 16px; border-radius:10px; font-weight:700; font-size:13.5px; display:inline-flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; border:none; transition:filter .15s ease, opacity .15s ease; }
        .adm-btn:hover:not(:disabled) { filter:brightness(0.95); }
        .adm-btn:disabled { opacity:.55; cursor:not-allowed; }
        .adm-btn--approve { background:${GREEN}; color:#fff; }
        .adm-btn--reject { background:#fff; color:${RED}; border:1px solid #FCA5A5; }
        .adm-btn--blue { background:${BLUE}; color:#fff; }
        .adm-input { height:40px; padding:0 14px; border-radius:10px; border:1px solid ${BORDER}; background:#fff; font-size:13.5px; color:${NAVY}; outline:none; width:100%; transition:border-color .15s ease, box-shadow .15s ease; }
        .adm-input:focus { border-color:${BLUE}; box-shadow:0 0 0 3px rgba(63,91,216,0.12); }
        .adm-input::placeholder { color:#94a3b8; }
      `}</style>

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
                background: confirm?.action === "reject" ? RED : GREEN,
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

      {/* Clear demo data confirm dialog */}
      <AlertDialog open={confirmClearDemo} onOpenChange={(o) => !o && setConfirmClearDemo(false)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>مسح البيانات التجريبية</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العقارات التجريبية FN-D* وصورها وعملائها نهائياً. لا يؤثر على حسابات المكاتب. هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={clearDemoData} style={{ background: RED, color: "#fff" }}>
              مسح البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: NAVY, boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: BLUE }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-base font-bold leading-tight text-white">لوحة الإدارة</h1>
              <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>منصة Finde الكويت</p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm hidden sm:block ml-2" style={{ color: "rgba(255,255,255,0.6)" }}>{user.name}</span>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-sm" onClick={() => navigate("/")}>
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">العودة للموقع</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-sm" onClick={() => navigate("/admin/analytics")}>
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">التحليلات والتقارير</span>
            </Button>
            <Button size="sm" className="gap-1.5 text-sm text-white border-0" style={{ background: RED }} onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold" style={{ color: NAVY }}>نظرة عامة على المنصة</h2>
          <p className="text-sm mt-1" style={{ color: BODY }}>تابع وأدِر طلبات المكاتب والإعلانات من مكان واحد</p>
        </div>

        {/* KPI row — big picture */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {([
            { icon: Users,        label: "مكاتب قيد المراجعة",  value: offices.length,    color: AMBER, bg: "#FEF6E7" },
            { icon: Building2,     label: "إعلانات منشورة",       value: activeListings,    color: GREEN, bg: "#E7F6F0" },
            { icon: XCircle,       label: "إعلانات محظورة",       value: blockedListings,   color: RED,   bg: "#FEECEC" },
            { icon: ClipboardList, label: "إجمالي الإعلانات",      value: listings.length,   color: BLUE,  bg: "#ECEFFB" },
          ]).map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="adm-kpi">
              <div className="adm-kpi-icon" style={{ background: bg }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <div>
                <div className="adm-kpi-val" style={{ color }}>{value.toLocaleString("en-US")}</div>
                <div className="adm-kpi-lbl">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "offices"  as const, icon: Users,     label: "طلبات تسجيل المكاتب", count: offices.length },
            { key: "listings" as const, icon: Building2, label: "مراقبة الإعلانات",     count: blockedListings || undefined },
            { key: "tools"    as const, icon: Settings,  label: "أدوات",               count: undefined },
          ]).map(({ key, icon: Icon, label, count }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`adm-tab ${active ? "adm-tab--active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {count ? (
                  <span
                    className="adm-tab-count"
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#FEF6E7",
                      color: active ? "#fff" : AMBER,
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ═══════════════ OFFICES TAB ═══════════════ */}
        {activeTab === "offices" && (
          <div className="adm-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5" style={{ color: NAVY }} />
                <h3 className="text-base font-bold" style={{ color: NAVY }}>طلبات تسجيل المكاتب</h3>
                {offices.length > 0 && (
                  <span className="adm-chip" style={{ background: "#FEF6E7", color: AMBER }}>{offices.length} بانتظار المراجعة</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={loadOffices} className="gap-1.5" style={{ color: BODY }}>
                <RefreshCw className="h-3.5 w-3.5" />تحديث
              </Button>
            </div>

            {loadingOffices ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : offices.length === 0 ? (
              <div className="text-center py-20" style={{ color: BODY }}>
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E7F6F0" }}>
                  <CheckCircle className="h-7 w-7" style={{ color: GREEN }} />
                </div>
                <p className="font-bold" style={{ color: NAVY }}>لا توجد طلبات قيد المراجعة</p>
                <p className="text-sm mt-1">جميع طلبات تسجيل المكاتب تمت مراجعتها</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>المكتب</th>
                      <th>البريد الإلكتروني</th>
                      <th>الرابط</th>
                      <th>تاريخ الطلب</th>
                      <th>الحالة</th>
                      <th style={{ textAlign: "center" }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offices.map((office) => (
                      <tr key={office.officeId} data-testid={`office-row-${office.officeId}`}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#ECEFFB" }}>
                              <Building2 className="h-5 w-5" style={{ color: BLUE }} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold" style={{ color: NAVY }}>{office.officeName}</div>
                              {office.officePhone && (
                                <div className="text-xs" style={{ color: BODY }} dir="ltr">{office.officePhone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: BODY }}>{office.userEmail}</td>
                        <td><span className="text-xs font-mono" style={{ color: BLUE }}>finde.co/{office.officeSlug}</span></td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: BODY }}>
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(office.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span className="adm-chip" style={{ background: "#FEF6E7", color: AMBER }}>قيد المراجعة</span>
                        </td>
                        <td>
                          <div className="flex gap-2 justify-center">
                            <button
                              disabled={!!actionLoading}
                              onClick={() => setConfirm({ type: "office", id: office.officeId, name: office.officeName, action: "approve" })}
                              data-testid={`approve-office-${office.officeId}`}
                              className="adm-btn adm-btn--approve"
                            >
                              <CheckCircle style={{ width: 16, height: 16 }} />
                              قبول
                            </button>
                            <button
                              disabled={!!actionLoading}
                              onClick={() => setConfirm({ type: "office", id: office.officeId, name: office.officeName, action: "reject" })}
                              data-testid={`reject-office-${office.officeId}`}
                              className="adm-btn adm-btn--reject"
                            >
                              <XCircle style={{ width: 16, height: 16 }} />
                              رفض
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ LISTINGS TAB ═══════════════ */}
        {activeTab === "listings" && (
          <div className="adm-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5" style={{ color: NAVY }} />
                  <h3 className="text-base font-bold" style={{ color: NAVY }}>مراقبة الإعلانات المنشورة</h3>
                </div>
                <p className="text-sm mt-1" style={{ color: BODY }}>الإعلانات تُنشر تلقائياً — احظر المحتوى المخالف فقط</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadListings} className="gap-1.5" style={{ color: BODY }}>
                <RefreshCw className="h-3.5 w-3.5" />تحديث
              </Button>
            </div>

            {loadingListings ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-5">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20" style={{ color: BODY }}>
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E7F6F0" }}>
                  <CheckCircle className="h-7 w-7" style={{ color: GREEN }} />
                </div>
                <p className="font-bold" style={{ color: NAVY }}>لا توجد إعلانات حتى الآن</p>
                <p className="text-sm mt-1">ستظهر الإعلانات هنا فور نشرها من المكاتب</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-5">
                {listings.map((listing) => {
                  const lbl = typeLabel(listing.status);
                  const location = [listing.areaName, listing.governorateName?.replace(/^محافظة\s*/, "")].filter(Boolean).join("، ");
                  return (
                    <div
                      key={listing.id}
                      className="overflow-hidden flex flex-col"
                      style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: CARD_SHADOW }}
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
                        <p className="font-bold text-sm leading-snug line-clamp-2" style={{ color: NAVY }}>{listing.titleAr}</p>

                        <p className="text-lg font-black" style={{ color: NAVY }}>
                          {listing.price.toLocaleString("en-US")} <span className="text-sm font-bold">د.ك</span>
                        </p>

                        <div className="flex flex-col gap-1 text-xs" style={{ color: BODY }}>
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
                                borderRadius: "10px",
                                background: "#fff",
                                color: RED,
                                border: "1px solid #FCA5A5",
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
                                borderRadius: "10px",
                                background: GREEN,
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

        {/* ═══════════════ TOOLS TAB ═══════════════ */}
        {activeTab === "tools" && (
          <div className="grid gap-5 lg:grid-cols-2">

            {/* 1 — Clear demo data */}
            <div className="adm-card" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4.5 w-4.5" style={{ color: RED }} />
                <h3 className="text-base font-bold" style={{ color: NAVY }}>مسح البيانات التجريبية</h3>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: BODY }}>
                يحذف العقارات التجريبية التجريبية FN-D* وصورها وعملائها. لا يؤثر على حسابات المكاتب.
              </p>
              <button
                disabled={toolsBusy === "clear-demo"}
                onClick={() => setConfirmClearDemo(true)}
                className="adm-btn"
                style={{ background: RED, color: "#fff", opacity: toolsBusy === "clear-demo" ? 0.6 : 1 }}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                مسح البيانات التجريبية
              </button>
            </div>

            {/* 3 — Reset office password */}
            <div className="adm-card" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4.5 w-4.5" style={{ color: BLUE }} />
                <h3 className="text-base font-bold" style={{ color: NAVY }}>إعادة تعيين كلمة مرور مكتب</h3>
              </div>
              <form onSubmit={resetOfficePassword} className="flex flex-col gap-3 mt-2">
                <select
                  value={resetOfficeId}
                  onChange={(e) => setResetOfficeId(e.target.value)}
                  className="adm-input"
                >
                  <option value="">— اختر المكتب —</option>
                  {allOffices.map((o) => (
                    <option key={o.officeId} value={o.officeId}>
                      {o.officeName} ({o.userEmail})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className="adm-input"
                />
                <button
                  type="submit"
                  disabled={toolsBusy === "reset-password"}
                  className="adm-btn adm-btn--blue"
                  style={{ opacity: toolsBusy === "reset-password" ? 0.6 : 1 }}
                >
                  <KeyRound style={{ width: 16, height: 16 }} />
                  إعادة التعيين
                </button>
              </form>
              <p className="text-xs mt-3" style={{ color: BODY }}>
                ملاحظة: شارِك كلمة المرور الجديدة مع المكتب يدوياً — لم يتم ربط البريد الإلكتروني بعد.
              </p>
            </div>

            {/* 2 — Manage admins (full width) */}
            <div className="adm-card lg:col-span-2" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4.5 w-4.5" style={{ color: NAVY }} />
                <h3 className="text-base font-bold" style={{ color: NAVY }}>إدارة المسؤولين</h3>
              </div>

              {loadingAdmins ? (
                <div className="space-y-2 my-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : admins.length === 0 ? (
                <p className="text-sm my-3" style={{ color: BODY }}>لا يوجد مسؤولون.</p>
              ) : (
                <div className="flex flex-col gap-2 my-3">
                  {admins.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 12 }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm" style={{ color: NAVY }}>{a.name}</div>
                        <div className="text-xs" style={{ color: BODY }} dir="ltr">{a.email}</div>
                      </div>
                      <span
                        className="adm-chip"
                        style={{
                          background: a.status === "active" ? "#E7F6F0" : "#FEF6E7",
                          color: a.status === "active" ? GREEN : AMBER,
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={addAdmin} className="grid gap-3 sm:grid-cols-3 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, name: e.target.value }))}
                  placeholder="الاسم"
                  className="adm-input"
                />
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
                  placeholder="البريد الإلكتروني"
                  className="adm-input"
                  dir="ltr"
                />
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
                  placeholder="كلمة المرور"
                  className="adm-input"
                />
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={toolsBusy === "add-admin"}
                    className="adm-btn adm-btn--blue"
                    style={{ opacity: toolsBusy === "add-admin" ? 0.6 : 1 }}
                  >
                    <UserPlus style={{ width: 16, height: 16 }} />
                    إضافة مسؤول
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
