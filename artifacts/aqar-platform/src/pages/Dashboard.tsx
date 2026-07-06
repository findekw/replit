import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building, Eye, Users, Star, Phone, MessageCircle, TrendingUp,
  Plus, Copy, Check, ExternalLink, Camera, Loader2, Edit2,
  Clock, Crown, AlertTriangle, CheckCircle2, Save, X, Lock
} from "lucide-react";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BRAND_DOMAIN } from "@/lib/utils";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const LEAD_STATUS_COLORS: Record<string, string> = {
  "جديد": "bg-indigo-100 text-indigo-800",
  "مهتم": "bg-indigo-50 text-indigo-700",
  "تم التواصل": "bg-indigo-100 text-indigo-800",
  "غير جاد": "bg-gray-100 text-gray-700",
  "مغلق": "bg-red-100 text-red-800",
};

const NAVY = "hsl(221,54%,23%)";

function validatePhone(val: string): string {
  if (!val) return "يرجى إدخال رقم الموبايل";
  if (!/^\d+$/.test(val)) return "رقم الموبايل يجب أن يحتوي على أرقام فقط";
  if (val.length !== 8) return "رقم الموبايل يجب أن يكون 8 أرقام";
  if (!/^[9654]/.test(val)) return "رقم الموبايل يجب أن يبدأ بـ 9 أو 6 أو 5 أو 4";
  return "";
}

function validateWhatsapp(val: string): string {
  if (!val) return "يرجى إدخال رقم واتساب";
  if (!/^\d+$/.test(val)) return "رقم واتساب يجب أن يحتوي على أرقام فقط";
  if (val.length !== 8) return "رقم واتساب يجب أن يكون 8 أرقام";
  if (!/^[9654]/.test(val)) return "رقم واتساب يجب أن يبدأ بـ 9 أو 6 أو 5 أو 4";
  return "";
}

function validateSlug(val: string): string {
  if (!val) return "رابط الصفحة مطلوب";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(val) || val.length < 3)
    return "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط، ولا يبدأ أو ينتهي بشرطة";
  return "";
}

/* ─── Kuwait flag SVG (matches Register.tsx) ─── */
function KuwaitFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"
      style={{ width: 22, height: 15, display: "block", borderRadius: 2, flexShrink: 0 }}
      aria-label="علم الكويت">
      <rect width="900" height="200" fill="#007a3d" />
      <rect y="200" width="900" height="200" fill="#ffffff" />
      <rect y="400" width="900" height="200" fill="#ce1126" />
      <polygon points="0,0 300,300 0,600" fill="#000000" />
    </svg>
  );
}

/* ─── Phone input — identical to Register.tsx style ─── */
function PhoneInput({
  value, onChange, placeholder = "12345678", error, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div style={{
        display: "flex", direction: "ltr",
        border: `1px solid ${error ? "#f87171" : "#d1d5db"}`,
        borderRadius: 8, overflow: "hidden",
        background: disabled ? "#f9fafb" : "#fff",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 12px",
          background: "#f3f4f6",
          borderRight: "1px solid #d1d5db",
          whiteSpace: "nowrap", fontSize: 13, fontWeight: 600,
          color: "#374151", userSelect: "none", flexShrink: 0,
        }}>
          <KuwaitFlag />
          <span>+965</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          maxLength={8}
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          disabled={disabled}
          dir="ltr"
          style={{
            flex: 1, padding: "9px 12px", border: "none", outline: "none",
            fontSize: 14, background: "transparent", minWidth: 0,
            color: "#111827", letterSpacing: "0.03em",
          }}
        />
      </div>
      {error && (
        <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

/* ─── View-mode field row ─── */
function ViewField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{
        fontSize: 14, color: value ? "#111827" : "#9ca3af",
        fontFamily: mono ? "monospace" : "inherit",
        fontStyle: value ? "normal" : "italic",
      }}>
        {value || "غير محدد"}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { officeId: oid, officeUser: user, isLoading: authLoading } = useOfficeAuth();
  const { toast } = useToast();
  const officeId = oid ?? 0;

  const [officeNameAr, setOfficeNameAr] = useState<string>("");
  const [officeSlug, setOfficeSlug] = useState<string | null>(null);
  const [officeLogo, setOfficeLogo] = useState<string | null>(null);
  const [slugEdits, setSlugEdits] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  /* draft edit state */
  const [editMode, setEditMode] = useState(false);
  const [draftNameAr, setDraftNameAr] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftWhatsapp, setDraftWhatsapp] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  /* snapshot for cancel */
  const [snapshot, setSnapshot] = useState({ nameAr: "", slug: "", phone: "", whatsapp: "", description: "" });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [officeCover, setOfficeCover] = useState<string | null>(null);

  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [requestingSubscription, setRequestingSubscription] = useState(false);

  /* Load subscription status */
  useEffect(() => {
    if (!officeId) return;
    fetch(`${BASE}/api/subscription/status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { subscriptionStatus?: string; trialDaysLeft?: number | null } | null) => {
        if (data) { setSubStatus(data.subscriptionStatus ?? null); setTrialDaysLeft(data.trialDaysLeft ?? null); }
      })
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [officeId]);

  /* Load office data */
  useEffect(() => {
    if (!officeId) return;
    fetch(`${BASE}/api/offices/${officeId}`, { credentials: "include" })
      .then(r => r.json())
      .then((data: { slug?: string; logo?: string; coverImage?: string | null; nameAr?: string; phone?: string; whatsapp?: string; slugEdits?: number; descriptionAr?: string | null }) => {
        const name = data.nameAr ?? "";
        const slug = data.slug ?? "";
        const rawPhone = data.phone ?? "";
        const phone = rawPhone.startsWith("965") && rawPhone.length > 8 ? rawPhone.slice(3) : rawPhone;
        const rawWa = data.whatsapp ?? "";
        const wa = rawWa.startsWith("965") && rawWa.length > 8 ? rawWa.slice(3) : rawWa;
        const desc = data.descriptionAr ?? "";
        const edits = data.slugEdits ?? 0;
        setOfficeNameAr(name);
        setOfficeSlug(slug || null);
        setOfficeLogo(data.logo ?? null);
        setOfficeCover(data.coverImage ?? null);
        setSlugEdits(edits);
        setDraftNameAr(name);
        setDraftSlug(slug);
        setDraftPhone(phone);
        setDraftWhatsapp(wa);
        setDraftDescription(desc);
        setSnapshot({ nameAr: name, slug, phone, whatsapp: wa, description: desc });
      })
      .catch(() => {});
  }, [officeId]);

  async function requestSubscription() {
    setRequestingSubscription(true);
    try {
      const res = await fetch(`${BASE}/api/subscription/request`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      });
      if (res.ok) { setSubStatus("pending_payment"); toast({ title: "تم استلام طلبك", description: "تواصل معنا لإكمال الدفع" }); }
    } catch { toast({ title: "حدث خطأ", variant: "destructive" }); }
    finally { setRequestingSubscription(false); }
  }

  function copyPageLink() {
    if (!officeSlug) return;
    const link = `${window.location.origin}${BASE}/${officeSlug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast({ title: "تم النسخ", description: "تم نسخ رابط صفحتك بنجاح" });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !officeId) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const uploadRes = await fetch(`${BASE}/api/uploads/images`, {
        method: "POST", credentials: "include", body: form,
      });
      if (!uploadRes.ok) { toast({ title: "فشل رفع الشعار", variant: "destructive" }); return; }
      const { url } = await uploadRes.json();
      const res = await fetch(`${BASE}/api/offices/${officeId}/logo`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ url }),
      });
      if (!res.ok) { toast({ title: "فشل حفظ الشعار", variant: "destructive" }); return; }
      const data = await res.json();
      setOfficeLogo(data.logo);
      toast({ title: "تم تحديث شعار المكتب بنجاح" });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !officeId) return;
    setCoverUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const uploadRes = await fetch(`${BASE}/api/uploads/images`, {
        method: "POST", credentials: "include", body: form,
      });
      if (!uploadRes.ok) { toast({ title: "فشل رفع الغلاف", variant: "destructive" }); return; }
      const { url } = await uploadRes.json();
      const res = await fetch(`${BASE}/api/offices/${officeId}/cover`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ url }),
      });
      if (!res.ok) { toast({ title: "فشل حفظ الغلاف", variant: "destructive" }); return; }
      const data = await res.json();
      setOfficeCover(data.coverImage);
      toast({ title: "تم تحديث صورة الغلاف بنجاح" });
    } finally {
      setCoverUploading(false);
    }
  }

  /* Real-time validation */
  function validate(field?: string) {
    const newErrors: Record<string, string> = {};
    const slugErr = validateSlug(draftSlug);
    if (slugErr) newErrors.slug = slugErr;
    const phoneErr = validatePhone(draftPhone);
    if (phoneErr) newErrors.phone = phoneErr;
    const waErr = validateWhatsapp(draftWhatsapp);
    if (waErr) newErrors.whatsapp = waErr;

    if (field) {
      setErrors(prev => ({ ...prev, [field]: newErrors[field] ?? "" }));
    } else {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  }

  function startEdit() {
    setDraftNameAr(snapshot.nameAr);
    setDraftSlug(snapshot.slug);
    setDraftPhone(snapshot.phone);
    setDraftWhatsapp(snapshot.whatsapp);
    setDraftDescription(snapshot.description);
    setErrors({});
    setEditMode(true);
  }

  function cancelEdit() {
    setDraftNameAr(snapshot.nameAr);
    setDraftSlug(snapshot.slug);
    setDraftPhone(snapshot.phone);
    setDraftWhatsapp(snapshot.whatsapp);
    setDraftDescription(snapshot.description);
    setErrors({});
    setEditMode(false);
  }

  async function saveProfile() {
    if (!validate()) {
      toast({ title: "يرجى تصحيح الأخطاء أولاً", variant: "destructive" });
      return;
    }
    if (!officeId) return;
    setSavingProfile(true);
    try {
      const payload: Record<string, string> = {
        nameAr: draftNameAr.trim(),
        phone: draftPhone,
        whatsapp: draftWhatsapp,
        officeDescription: draftDescription.trim(),
      };
      if (draftSlug !== snapshot.slug) payload.slug = draftSlug;

      const res = await fetch(`${BASE}/api/offices/${officeId}/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) {
          setErrors(prev => ({ ...prev, [data.field]: data.error }));
          toast({ title: "خطأ في البيانات", description: data.error, variant: "destructive" });
        } else {
          toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
        }
        return;
      }
      /* update local state */
      const newSnap = { nameAr: draftNameAr.trim(), slug: draftSlug, phone: draftPhone, whatsapp: draftWhatsapp, description: draftDescription.trim() };
      setSnapshot(newSnap);
      setOfficeNameAr(draftNameAr.trim());
      setOfficeSlug(draftSlug || null);
      setSlugEdits(data.slugEdits ?? slugEdits);
      setEditMode(false);
      toast({ title: "تم حفظ البيانات بنجاح" });
    } catch {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  }

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(officeId, {
    query: {
      queryKey: getGetDashboardStatsQueryKey(officeId),
      enabled: officeId > 0,
    },
  });

  const isLoading = authLoading || statsLoading;

  const statCards = stats ? [
    { label: "إجمالي الإعلانات", value: stats.totalListings, icon: Building, fg: "#667EEA", g2: "#5B73E0", bg: "#EEF2FE" },
    { label: "الإعلانات النشطة", value: stats.activeListings, icon: TrendingUp, fg: "#059669", g2: "#10B981", bg: "#ECFDF5" },
    { label: "الإعلانات المميزة", value: stats.featuredListings, icon: Star, fg: "#667EEA", g2: "#5B73E0", bg: "#EEF2FE" },
    { label: "إجمالي المشاهدات", value: stats.totalViews, icon: Eye, fg: "#667EEA", g2: "#5B73E0", bg: "#EEF2FE" },
    { label: "إجمالي العملاء", value: stats.totalLeads, icon: Users, fg: "#059669", g2: "#10B981", bg: "#ECFDF5" },
    { label: "عملاء جدد", value: stats.newLeads, icon: Users, fg: "#059669", g2: "#10B981", bg: "#ECFDF5" },
    { label: "نقرات واتساب", value: stats.whatsappClicks, icon: MessageCircle, fg: "#059669", g2: "#10B981", bg: "#ECFDF5" },
    { label: "نقرات الاتصال", value: stats.callClicks, icon: Phone, fg: "#667EEA", g2: "#5B73E0", bg: "#EEF2FE" },
  ] : [];

  if (!authLoading && !oid) {
    return (
      <DashboardLayout>
        <div dir="rtl" className="flex flex-col items-center justify-center py-24 text-center">
          <Building className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">لا يوجد مكتب مرتبط</h2>
          <p className="text-muted-foreground">هذا الحساب ليس مرتبطاً بمكتب عقاري.</p>
        </div>
      </DashboardLayout>
    );
  }

  function renderSubscriptionBanner() {
    if (subLoading || !subStatus) return null;
    if (subStatus === "active") return null;
    if (subStatus === "trial") {
      const urgent = trialDaysLeft !== null && trialDaysLeft <= 2;
      return (
        <div className={`mb-5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${urgent ? "bg-orange-50 border-orange-200" : "bg-indigo-50 border-indigo-200"}`}>
          <div className="flex items-start gap-3">
            <Clock className={`h-5 w-5 mt-0.5 flex-shrink-0 ${urgent ? "text-orange-500" : "text-indigo-500"}`} />
            <div>
              <p className="font-semibold" style={{ fontSize: 15, color: urgent ? "#9a3412" : "#1e40af" }}>
                {trialDaysLeft !== null && trialDaysLeft > 0
                  ? `لديك تجربة مجانية متبقي عليها ${trialDaysLeft} ${trialDaysLeft === 1 ? "يوم" : "أيام"}`
                  : "انتهت مدة تجربتك المجانية"}
              </p>
              {urgent && trialDaysLeft !== null && trialDaysLeft > 0 && (
                <p className="mt-0.5" style={{ fontSize: 13, color: "#c2410c" }}>اشترك الآن لتواصل استخدام جميع المميزات</p>
              )}
            </div>
          </div>
          <Button size="sm" className={`gap-2 flex-shrink-0 ${urgent ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white`} onClick={requestSubscription} disabled={requestingSubscription}>
            <Crown className="h-3.5 w-3.5" />اشترك الآن
          </Button>
        </div>
      );
    }
    if (subStatus === "pending_payment") {
      return (
        <div className="mb-5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50 border border-indigo-200">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold text-sm text-indigo-800">طلب اشتراكك قيد المراجعة</p>
              <p className="text-xs text-indigo-600 mt-0.5">تم استلام طلبك. تواصل معنا لإكمال الدفع وتفعيل اشتراكك</p>
            </div>
          </div>
          <a href={`https://wa.me/96595005151?text=${encodeURIComponent("مرحبا، اريد الاشتراك في المنصة وتفعيل حسابي")}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
              <MessageCircle className="h-3.5 w-3.5" />تواصل عبر واتساب
            </Button>
          </a>
        </div>
      );
    }
    if (subStatus === "expired" || subStatus === "inactive") {
      return (
        <div className="mb-5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-sm text-red-800">{subStatus === "expired" ? "انتهت تجربتك المجانية" : "حسابك غير نشط"}</p>
              <p className="text-xs text-red-600 mt-0.5">اشترك الآن لتفعيل إعلاناتك وإضافة إعلانات جديدة</p>
            </div>
          </div>
          <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white flex-shrink-0" onClick={requestSubscription} disabled={requestingSubscription}>
            <Crown className="h-3.5 w-3.5" />اشترك الآن
          </Button>
        </div>
      );
    }
    return null;
  }

  // The slug (username) is chosen once — at registration or first setup — then fixed.
  const slugLocked = !!snapshot.slug;

  return (
    <DashboardLayout>
      <div dir="rtl">
        <div className="max-w-[1200px] mx-auto">

        {renderSubscriptionBanner()}

        {/* Page header — welcome */}
        <div
          className="mb-6"
          style={{
            background: "linear-gradient(120deg,#1A2238 0%,#26345A 52%,#667EEA 135%)",
            borderRadius: 22, padding: "28px 30px", color: "#fff",
            boxShadow: "0 16px 40px rgba(31,42,68,0.26)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap", position: "relative", overflow: "hidden",
          }}
        >
          {/* decorative grid sheen */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
            background: "radial-gradient(120% 120% at 100% 0%, rgba(255,255,255,0.10), transparent 55%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, color: "#BFD0F2",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)",
              padding: "4px 12px", borderRadius: 999, margin: 0,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 0 3px rgba(74,222,128,0.25)" }} />
              لوحة تحكم المكتب
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.22, letterSpacing: "-0.01em", color: "#fff" }}>
              أهلاً، {officeNameAr || user?.name || "بك"} 👋
            </h1>
            <p style={{ fontSize: 14.5, color: "#C3CEE2", margin: "8px 0 0" }}>
              تابع أداء إعلاناتك وعملائك من مكان واحد
            </p>
          </div>
          <Link href="/dashboard/listings/new" style={{ position: "relative", zIndex: 1 }}>
            <Button
              className="gap-2 h-12 px-7 rounded-2xl font-bold"
              style={{ background: "#fff", color: "#111827", boxShadow: "0 10px 24px rgba(0,0,0,0.22)" }}
              data-testid="button-add-listing-dashboard"
            >
              <Plus className="h-[18px] w-[18px]" />إضافة إعلان جديد
            </Button>
          </Link>
          <div style={{
            position: "absolute", insetInlineStart: -50, top: -70, width: 240, height: 240,
            borderRadius: "50%", background: "rgba(63,91,216,0.32)", filter: "blur(18px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", insetInlineEnd: 120, bottom: -90, width: 200, height: 200,
            borderRadius: "50%", background: "rgba(91,115,224,0.28)", filter: "blur(28px)", pointerEvents: "none",
          }} />
        </div>

        {/* ─── Office Profile Card ─── */}
        <div style={{
          background: "#fff", border: "1px solid #EAEEF5",
          borderRadius: 20, marginBottom: 24,
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          overflow: "hidden",
        }}>

          {/* ── Top bar ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 22px", borderBottom: "1px solid #F0F2F7", background: "#FAFBFE",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#111827", letterSpacing: "0.02em" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#EEF2FE" }}>
                <Building style={{ width: 14, height: 14, color: "#667EEA" }} />
              </span>
              ملف المكتب العقاري
            </span>
            {!editMode ? (
              <button
                onClick={startEdit}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 14px", borderRadius: 8, border: "1.5px solid #d1d5db",
                  background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <Edit2 style={{ width: 12, height: 12 }} />
                تعديل الملف
              </button>
            ) : (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "#667EEA",
                background: "#eff6ff", padding: "3px 10px", borderRadius: 20,
              }}>
                وضع التعديل
              </span>
            )}
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Cover banner — real cover-photo editor */}
            <div
              onClick={() => coverInputRef.current?.click()}
              title="تغيير صورة الغلاف"
              className="dsh-cover"
              style={{
                position: "relative", height: 150, borderRadius: 16, cursor: "pointer", overflow: "hidden",
                background: officeCover ? "#0b1220" : `linear-gradient(135deg, ${NAVY} 0%, #2E3E66 50%, #667EEA 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #EAEEF5", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <style>{`
                .dsh-cover .dsh-cover-pill { transition:transform .18s, background .18s; }
                .dsh-cover:hover .dsh-cover-pill { transform:translateY(-1px); background:rgba(0,0,0,0.5); }
                .dsh-cover:hover .dsh-cover-overlay { opacity:1; }
              `}</style>
              {officeCover && <img src={officeCover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              {/* gradient overlay for legibility */}
              <div className="dsh-cover-overlay" style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.42) 100%)",
                opacity: officeCover ? 0.85 : 0.55, transition: "opacity .18s", pointerEvents: "none",
              }} />
              {/* center affordance */}
              <div className="dsh-cover-pill" style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, color: "#fff", background: "rgba(0,0,0,0.4)", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                {coverUploading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Camera style={{ width: 15, height: 15 }} />}
                {officeCover ? "تغيير صورة الغلاف" : "أضف صورة غلاف لصفحتك"}
              </div>
              {/* corner camera badge */}
              <div style={{
                position: "absolute", insetInlineEnd: 12, top: 12, zIndex: 1,
                width: 34, height: 34, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
              }}>
                <Camera style={{ width: 16, height: 16, color: NAVY }} />
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </div>

            {/* Logo + Name row — only the LOGO overlaps the dark cover; the name sits on white for contrast */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 14, position: "relative", zIndex: 1, paddingInlineStart: 8 }}>
              {/* Logo circle */}
              <div style={{ flexShrink: 0, marginTop: -64 }}>
                <div
                  style={{
                    width: 76, height: 76, borderRadius: "50%", overflow: "hidden",
                    background: `linear-gradient(135deg, ${NAVY}, hsl(221,54%,38%))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative",
                    boxShadow: "0 8px 22px rgba(11,37,69,0.32)", border: "4px solid #fff",
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  title="تغيير الشعار"
                >
                  {logoUploading ? (
                    <Loader2 style={{ width: 26, height: 26, color: "#fff" }} className="animate-spin" />
                  ) : officeLogo ? (
                    <img src={officeLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Building style={{ width: 30, height: 30, color: "#fff" }} />
                  )}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity .15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >
                    <Camera style={{ width: 18, height: 18, color: "#fff" }} />
                  </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
              </div>

              {/* Office name — always static */}
              <div style={{ flex: 1, minWidth: 0, alignSelf: "flex-end", paddingBottom: 6 }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: "#111827", lineHeight: 1.25, wordBreak: "break-word" }}>
                  {snapshot.nameAr || (
                    <span style={{ color: "#9ca3af", fontStyle: "italic", fontWeight: 400, fontSize: 15 }}>
                      لم يُحدَّد اسم المكتب
                    </span>
                  )}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11.5, fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "3px 10px", borderRadius: 999 }}>
                  <CheckCircle2 style={{ width: 12, height: 12 }} />
                  مكتب موثّق
                </div>
              </div>
            </div>

            {/* ── Office Description ── */}
            {editMode ? (
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  marginBottom: 7, display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>نبذة المكتب</span>
                  <span style={{ fontSize: 11, color: draftDescription.length >= 220 ? "#d97706" : "#9ca3af", fontWeight: 400 }}>
                    {draftDescription.length}/250
                  </span>
                </div>
                <textarea
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value.slice(0, 250))}
                  placeholder="اكتب نبذة مختصرة عن مكتبك (مثال: مكتب عقاري متخصص في الإيجار والبيع في الكويت منذ 2020...)"
                  rows={3}
                  maxLength={250}
                  style={{
                    width: "100%", resize: "none",
                    padding: "10px 12px", borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14, lineHeight: 1.65,
                    background: "#fff", color: "#111827",
                    outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#d1d5db")}
                />
              </div>
            ) : (
              snapshot.description && (
                <p style={{
                  fontSize: 14, color: "#6b7280", lineHeight: 1.7,
                  margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {snapshot.description}
                </p>
              )
            )}

            {/* ── Link section ── */}
            <div>
              {/* View mode: link + copy + visit */}
              {!editMode && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 9 }}>
                    <ExternalLink style={{ width: 14, height: 14, color: "#667EEA" }} />
                    صفحتك العامة على Finde
                  </div>
                  {snapshot.slug ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "linear-gradient(120deg,#F4F7FF,#EEF2FE)",
                      border: "1px solid #DBE4FF",
                      borderRadius: 14, padding: "14px 16px", flexWrap: "wrap",
                      boxShadow: "0 4px 14px rgba(63,91,216,0.08)",
                    }}>
                      <span style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #DBE4FF", boxShadow: "0 2px 6px rgba(63,91,216,0.12)" }}>
                        <ExternalLink style={{ width: 18, height: 18, color: "#667EEA" }} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 2 }}>الرابط المباشر</div>
                        <a
                          href={`${BASE}/${snapshot.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${BRAND_DOMAIN}/${snapshot.slug}`}
                          style={{
                            minWidth: 0, maxWidth: "100%",
                            direction: "ltr", display: "block",
                            fontSize: 14, fontFamily: "monospace", fontWeight: 700,
                            color: NAVY, textDecoration: "none",
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}
                        >
                          {BRAND_DOMAIN}/{snapshot.slug}
                        </a>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={copyPageLink}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "9px 16px", borderRadius: 10,
                            border: "none", background: copied ? "#059669" : "#667EEA",
                            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                            boxShadow: "0 6px 16px rgba(63,91,216,0.28)", transition: "background .18s",
                          }}
                        >
                          {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                          {copied ? "تم النسخ" : "نسخ"}
                        </button>
                        <a
                          href={`${BASE}/${snapshot.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "9px 16px", borderRadius: 10,
                            border: "1.5px solid #C7D2FE", background: "#fff",
                            color: "#667EEA", fontSize: 13, fontWeight: 700, textDecoration: "none",
                          }}
                        >
                          <ExternalLink style={{ width: 14, height: 14 }} />
                          زيارة
                        </a>
                      </div>
                    </div>
                  ) : null}
                  {snapshot.slug && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11.5, color: "#94a3b8" }}>
                      <Lock style={{ width: 11, height: 11 }} />
                      هذا رابطك الثابت ولا يمكن تغييره
                    </div>
                  )}
                  {!snapshot.slug && (
                    <div style={{
                      background: "#F9FAFB", border: "1px dashed #D1D9E6",
                      borderRadius: 14, padding: "16px",
                      fontSize: 13, color: "#9ca3af", fontStyle: "italic",
                    }}>
                      لم يُحدَّد رابط الصفحة بعد
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode: slug input */}
              {editMode && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>رابط الصفحة</span>
                    {slugLocked ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 6 }}>
                        <Lock style={{ width: 10, height: 10 }} /> ثابت — لا يمكن تغييره
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: 6 }}>
                        اختره بعناية — لا يمكن تغييره لاحقًا
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: "flex", direction: "ltr",
                    border: `1px solid ${errors.slug ? "#f87171" : slugLocked ? "#e5e7eb" : "#3b82f6"}`,
                    borderRadius: 8, overflow: "hidden",
                    background: slugLocked ? "#f9fafb" : "#fff",
                    boxShadow: slugLocked ? "none" : "0 0 0 3px rgba(59,130,246,0.08)",
                  }}>
                    <div style={{
                      padding: "9px 12px", display: "flex", alignItems: "center",
                      background: "#f3f4f6", borderRight: "1px solid #d1d5db",
                      fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0,
                      fontFamily: "monospace", fontWeight: 600,
                    }}>
                      {BRAND_DOMAIN}/
                    </div>
                    <input
                      type="text"
                      value={draftSlug}
                      disabled={slugLocked}
                      onChange={e => {
                        const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setDraftSlug(v);
                        setErrors(prev => ({ ...prev, slug: validateSlug(v) }));
                      }}
                      placeholder="office-name"
                      dir="ltr"
                      autoFocus
                      style={{
                        flex: 1, padding: "9px 12px", border: "none", outline: "none",
                        fontSize: 14, background: "transparent", minWidth: 0,
                        fontFamily: "monospace", fontWeight: 600,
                        color: slugLocked ? "#9ca3af" : "#111827",
                        cursor: slugLocked ? "not-allowed" : "text",
                      }}
                    />
                  </div>
                  {errors.slug && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 5 }}>{errors.slug}</p>}
                  {!errors.slug && !slugLocked && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
                      أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Divider ── */}
            <div style={{ borderTop: "1px solid #f3f4f6" }} />

            {/* ── Phones — stacked vertically, identical boxes ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* رقم الموبايل */}
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Phone style={{ width: 13, height: 13, color: "#6b7280" }} />
                  رقم الموبايل
                </div>
                {editMode ? (
                  <PhoneInput
                    value={draftPhone}
                    onChange={v => { setDraftPhone(v); setErrors(prev => ({ ...prev, phone: validatePhone(v) })); }}
                    error={errors.phone}
                  />
                ) : (
                  <div style={{
                    display: "flex", direction: "ltr",
                    border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden",
                    background: "#fff",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "0 12px",
                      background: "#f3f4f6",
                      borderRight: "1px solid #d1d5db",
                      whiteSpace: "nowrap", userSelect: "none", flexShrink: 0,
                    }}>
                      <KuwaitFlag />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>+965</span>
                    </div>
                    <span style={{
                      padding: "9px 12px",
                      fontSize: 14,
                      fontWeight: snapshot.phone ? 600 : 400,
                      color: snapshot.phone ? "#111827" : "#9ca3af",
                      fontStyle: snapshot.phone ? "normal" : "italic",
                      letterSpacing: snapshot.phone ? "0.03em" : "normal",
                    }}>
                      {snapshot.phone || "غير محدد"}
                    </span>
                  </div>
                )}
              </div>

              {/* رقم واتساب */}
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 5,
                }}>
                  <MessageCircle style={{ width: 13, height: 13, color: "#6b7280" }} />
                  رقم واتساب
                </div>
                {editMode ? (
                  <PhoneInput
                    value={draftWhatsapp}
                    onChange={v => { setDraftWhatsapp(v); setErrors(prev => ({ ...prev, whatsapp: validateWhatsapp(v) })); }}
                    error={errors.whatsapp}
                  />
                ) : (
                  <div style={{
                    display: "flex", direction: "ltr",
                    border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden",
                    background: "#fff",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "0 12px",
                      background: "#f3f4f6",
                      borderRight: "1px solid #d1d5db",
                      whiteSpace: "nowrap", userSelect: "none", flexShrink: 0,
                    }}>
                      <KuwaitFlag />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>+965</span>
                    </div>
                    <span style={{
                      padding: "9px 12px",
                      fontSize: 14,
                      fontWeight: snapshot.whatsapp ? 600 : 400,
                      color: snapshot.whatsapp ? "#111827" : "#9ca3af",
                      fontStyle: snapshot.whatsapp ? "normal" : "italic",
                      letterSpacing: snapshot.whatsapp ? "0.03em" : "normal",
                    }}>
                      {snapshot.whatsapp || "غير محدد"}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* ── Save / Cancel — edit mode only, at bottom ── */}
            {editMode && (
              <div style={{
                paddingTop: 8, borderTop: "1px solid #f3f4f6",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 24px", borderRadius: 10, border: "none",
                    background: NAVY, color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: savingProfile ? "not-allowed" : "pointer", opacity: savingProfile ? 0.7 : 1,
                    boxShadow: "0 2px 6px rgba(11,37,69,0.22)",
                  }}
                >
                  {savingProfile ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <Save style={{ width: 15, height: 15 }} />}
                  حفظ التعديلات
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={savingProfile}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 10, border: "1.5px solid #d1d5db",
                    background: "#fff", color: "#6b7280", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                  إلغاء
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ─── Subscription Status ─── */}
        {!subLoading && subStatus && (
          <div className="bg-card border rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 text-[#0B2545]" />
              <h3 className="font-bold text-sm text-foreground">حالة الاشتراك</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="mb-1" style={{ fontSize: 13, color: "#0f172a" }}>نوع الباقة</p>
                <p className="font-semibold" style={{ fontSize: 15, color: "#0f172a" }}>الباقة الأساسية</p>
                <p style={{ fontSize: 13, color: "#0f172a" }}>10 د.ك / شهرياً</p>
              </div>
              <div>
                <p className="mb-1" style={{ fontSize: 13, color: "#0f172a" }}>حالة الاشتراك</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  subStatus === "active" ? "bg-green-100 text-green-800" :
                  subStatus === "trial" ? "bg-indigo-100 text-indigo-800" :
                  subStatus === "pending_payment" ? "bg-indigo-50 text-indigo-700" :
                  "bg-red-100 text-red-800"
                }`}>
                  {subStatus === "active" && <CheckCircle2 className="h-3 w-3" />}
                  {subStatus === "trial" && <Clock className="h-3 w-3" />}
                  {subStatus === "pending_payment" && <Clock className="h-3 w-3" />}
                  {(subStatus === "expired" || subStatus === "inactive") && <AlertTriangle className="h-3 w-3" />}
                  {{ active: "نشط", trial: "تجريبي", pending_payment: "قيد المراجعة", expired: "منتهي", inactive: "غير نشط" }[subStatus] ?? subStatus}
                </span>
              </div>
              {trialDaysLeft !== null && subStatus === "trial" && (
                <div>
                  <p className="mb-1" style={{ fontSize: 13, color: "#0f172a" }}>المدة المتبقية</p>
                  <p className="font-semibold" style={{ fontSize: 15, color: trialDaysLeft <= 2 ? "#ea580c" : "#0f172a" }}>
                    {trialDaysLeft === 0 ? "منتهية" : `${trialDaysLeft} ${trialDaysLeft === 1 ? "يوم" : "أيام"}`}
                  </p>
                </div>
              )}
            </div>
            {subStatus !== "active" && subStatus !== "pending_payment" && (
              <div className="mt-4 pt-4 border-t">
                <Button size="sm" className="gap-2 bg-[#667EEA] hover:bg-indigo-700 text-white" onClick={requestSubscription} disabled={requestingSubscription}>
                  <Crown className="h-3.5 w-3.5" />
                  {requestingSubscription ? "جارٍ الإرسال..." : "اشترك الآن — 10 د.ك / شهر"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Stats Grid ─── */}
        <div className="flex items-center gap-2.5 mb-4 mt-1">
          <span style={{ width: 34, height: 34, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#667EEA,#5B73E0)", boxShadow: "0 6px 16px rgba(63,91,216,0.32)" }}>
            <TrendingUp className="h-[18px] w-[18px]" style={{ color: "#fff" }} />
          </span>
          <h2 className="font-bold" style={{ fontSize: 17, color: "#111827", letterSpacing: "-0.01em" }}>نظرة سريعة على الأداء</h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {statCards.length === 0 ? (
              <div
                className="col-span-2 lg:col-span-4 text-center"
                style={{ background: "#fff", border: "1px solid #EEF1F5", borderRadius: 16, padding: 32, boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}
              >
                <Building className="h-8 w-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                <p style={{ fontSize: 15, color: "#64748B" }}>لا توجد إحصائيات بعد. ابدأ بإضافة إعلانك الأول!</p>
              </div>
            ) : (
              statCards.map(({ label, value, icon: Icon, fg, g2, bg }) => (
                <div
                  key={label}
                  data-testid={`stat-${label}`}
                  className="dsh-stat"
                  style={{
                    background: `linear-gradient(160deg, #fff 60%, ${bg})`,
                    border: "1px solid #EAEEF5", borderRadius: 18,
                    padding: 20, boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                    display: "flex", flexDirection: "column", gap: 14,
                    position: "relative", overflow: "hidden",
                    transition: "transform .18s, box-shadow .18s",
                  }}
                >
                  <style>{`
                    .dsh-stat:hover { transform:translateY(-3px); box-shadow:0 14px 32px rgba(15,23,42,0.10); }
                  `}</style>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: `linear-gradient(135deg, ${fg}, ${g2})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 2px 6px ${fg}26`,
                  }}>
                    <Icon className="h-[22px] w-[22px]" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.01em" }}>
                      {value.toLocaleString("en-US")}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 6, fontWeight: 600 }}>{label}</div>
                  </div>
                  {/* corner accent */}
                  <div style={{
                    position: "absolute", insetInlineStart: -24, bottom: -24, width: 88, height: 88,
                    borderRadius: "50%", background: bg, opacity: 0.35, pointerEvents: "none",
                  }} />
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Leads + Top Properties ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Leads */}
          <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#059669,#10B981)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(5,150,105,0.3)" }}>
                  <Users className="h-[18px] w-[18px]" style={{ color: "#fff" }} />
                </span>
                <h2 className="font-bold" style={{ fontSize: 16.5, color: "#111827" }}>أحدث العملاء</h2>
              </div>
              <Link href="/dashboard/leads" className="text-sm font-semibold hover:underline" style={{ color: "#667EEA" }}>عرض الكل</Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : (stats?.recentLeads ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                <p style={{ fontSize: 15, color: "#111827", fontWeight: 700 }}>لا توجد عملاء حتى الآن</p>
                <p className="mt-1" style={{ fontSize: 13, color: "#64748B" }}>ستظهر هنا طلبات العملاء على عقاراتك</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(stats?.recentLeads ?? []).map(lead => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: "#F8FAFC", border: "1px solid #EEF1F5" }}
                    data-testid={`lead-${lead.id}`}
                  >
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ECFDF5", color: "#059669", fontWeight: 800, fontSize: 15 }}>
                        {(lead.customerName?.trim()?.[0] ?? "؟").toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="font-bold text-sm" style={{ color: "#111827" }}>{lead.customerName}</div>
                        <div className="text-xs" style={{ color: "#64748B", direction: "ltr", textAlign: "right" }}>{lead.phone}</div>
                      </div>
                    </div>
                    <Badge className={LEAD_STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-700"}>{lead.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Properties */}
          <div style={{ background: "#fff", border: "1px solid #EAEEF5", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#667EEA,#5B73E0)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(63,91,216,0.3)" }}>
                  <TrendingUp className="h-[18px] w-[18px]" style={{ color: "#fff" }} />
                </span>
                <h2 className="font-bold" style={{ fontSize: 16.5, color: "#111827" }}>الإعلانات الأكثر مشاهدة</h2>
              </div>
              <Link href="/dashboard/listings" className="text-sm font-semibold hover:underline" style={{ color: "#667EEA" }}>عرض الكل</Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : (stats?.topProperties ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-8 w-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                <p style={{ fontSize: 15, color: "#111827", fontWeight: 700 }}>لا توجد إعلانات حتى الآن</p>
                <Link href="/dashboard/listings/new">
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <Plus className="h-4 w-4" />إضافة إعلان
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(stats?.topProperties ?? []).map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: "#F8FAFC", border: "1px solid #EEF1F5" }}
                    data-testid={`top-prop-${p.id}`}
                  >
                    {p.primaryImage ? (
                      <img src={p.primaryImage} alt={p.titleAr} className="w-14 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF1F5" }}>
                        <Building className="h-4 w-4" style={{ color: "#94A3B8" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: "#111827" }}>{p.titleAr}</div>
                      <div className="text-xs" style={{ color: "#667EEA", fontWeight: 700 }}>{p.price.toLocaleString("en-US")} KWD</div>
                    </div>
                    <div
                      className="text-xs flex items-center gap-1 flex-shrink-0"
                      style={{ color: "#64748B", fontWeight: 700, background: "#fff", border: "1px solid #EEF1F5", padding: "4px 9px", borderRadius: 999 }}
                    >
                      <Eye className="h-3 w-3" />{p.views}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        </div>{/* end max-w container */}
      </div>
    </DashboardLayout>
  );
}
