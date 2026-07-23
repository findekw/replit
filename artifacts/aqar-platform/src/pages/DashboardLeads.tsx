import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Phone, MessageCircle, Plus, X, Loader2, Trash2,
  Pencil, Save, Building, Globe, Hand,
} from "lucide-react";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useGetOfficeProperties } from "@workspace/api-client-react";
import { toIntlPhone } from "@/lib/phone";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

/**
 * The office CRM: every customer in one place — added by hand from a listing
 * or captured automatically from the "أنا مهتم" form on the property page.
 * Statuses come from the admin-editable catalog (kind: lead_status).
 */

const FALLBACK_STATUSES = ["جديد", "مهتم", "جاد", "متردد", "تم التواصل", "مغلق"];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  "جديد": { bg: "#EEF2FF", fg: "#4338CA" },
  "مهتم": { bg: "#ECFDF5", fg: "#047857" },
  "جاد": { bg: "#D1FAE5", fg: "#065F46" },
  "متردد": { bg: "#FEF3C7", fg: "#92400E" },
  "تم التواصل": { bg: "#E0F2FE", fg: "#0369A1" },
  "مغلق": { bg: "#F1F5F9", fg: "#475569" },
};
const statusStyle = (s: string) => STATUS_STYLE[s] ?? { bg: "#F1F5F9", fg: "#334155" };

const SOURCE_META: Record<string, { label: string; icon: typeof Hand }> = {
  manual: { label: "يدوي", icon: Hand },
  property_form: { label: "من صفحة الإعلان", icon: Globe },
};

type Lead = {
  id: number;
  customerName: string;
  phone: string;
  message: string | null;
  inquiryType: string;
  status: string;
  notes: string | null;
  propertyId: number | null;
  propertyTitle: string | null;
  sourcePage: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-KW", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardLeads() {
  const { toast } = useToast();
  const { officeId: oid, isLoading: authLoading } = useOfficeAuth();
  const officeId = oid ?? 0;

  const urlParams = new URLSearchParams(window.location.search);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<string[]>(FALLBACK_STATUSES);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProperty, setFilterProperty] = useState(urlParams.get("propertyId") ?? "");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ id: number; text: string } | null>(null);

  // Add-client form (opens automatically from the listing row's "عميل+").
  const [addOpen, setAddOpen] = useState(urlParams.get("add") === "1");
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fStatus, setFStatus] = useState("جديد");
  const [fNote, setFNote] = useState("");
  const [fProperty, setFProperty] = useState(urlParams.get("propertyId") ?? "");
  const [saving, setSaving] = useState(false);

  // The office's listings, for the pickers.
  const { data: propsData } = useGetOfficeProperties(
    officeId, { limit: 100 } as any, { query: { enabled: officeId > 0 } },
  );
  const myListings = (propsData?.properties ?? []) as { id: number; titleAr: string }[];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterStatus) qs.set("status", filterStatus);
      if (filterProperty) qs.set("propertyId", filterProperty);
      const res = await fetch(`${BASE}/api/leads?${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      setLeads(await res.json());
    } catch {
      toast({ title: "فشل تحميل العملاء", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterProperty, toast]);

  useEffect(() => { if (officeId > 0) load(); }, [officeId, load]);

  // Admin-editable status list.
  useEffect(() => {
    fetch(`${BASE}/api/catalog?kind=lead_status`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { options?: string[] }) => { if (d.options?.length) setStatuses(d.options); })
      .catch(() => { /* keep fallback */ });
  }, []);

  async function addLead() {
    if (fName.trim().length < 2) { toast({ title: "اكتب اسم العميل", variant: "destructive" }); return; }
    if (!/^[0-9+\s-]{6,20}$/.test(fPhone.trim())) { toast({ title: "رقم الهاتف غير صالح", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/leads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: fName.trim(),
          phone: fPhone.trim(),
          status: fStatus,
          notes: fNote.trim() || undefined,
          propertyId: fProperty ? Number(fProperty) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: data?.error ?? "تعذّرت الإضافة", variant: "destructive" }); return; }
      toast({ title: "تمت إضافة العميل" });
      setFName(""); setFPhone(""); setFNote(""); setFStatus("جديد"); setAddOpen(false);
      await load();
    } catch {
      toast({ title: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function patchLead(id: number, patch: Record<string, unknown>, okMsg?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`${BASE}/api/leads/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: data?.error ?? "تعذّر التحديث", variant: "destructive" }); return false; }
      if (okMsg) toast({ title: okMsg });
      await load();
      return true;
    } catch {
      toast({ title: "تعذّر الاتصال بالخادم", variant: "destructive" });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function deleteLead(id: number) {
    if (confirmDel !== id) {
      setConfirmDel(id);
      setTimeout(() => setConfirmDel((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirmDel(null);
    setBusyId(id);
    try {
      const res = await fetch(`${BASE}/api/leads/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { toast({ title: "تعذّر الحذف", variant: "destructive" }); return; }
      toast({ title: "تم حذف العميل" });
      await load();
    } catch {
      toast({ title: "تعذّر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const counts = statuses.map((s) => ({ s, n: leads.filter((l) => l.status === s).length }));

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #E2E8F0",
    padding: "0 12px", fontSize: 14, fontFamily: "'Cairo',sans-serif", background: "#fff", outline: "none",
  };
  const selStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", fontWeight: 700, color: "#334155" };

  if (authLoading) {
    return <DashboardLayout><div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>عملائي</h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0" }}>
              كل عملائك في مكان واحد — أضفهم يدوياً أو استقبلهم تلقائياً من نموذج «أنا مهتم» في صفحات إعلاناتك
            </p>
          </div>
          <button
            onClick={() => setAddOpen((o) => !o)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 44, padding: "0 22px",
              borderRadius: 12, border: "none", background: addOpen ? "#F1F5F9" : "#667EEA",
              color: addOpen ? "#334155" : "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            {addOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {addOpen ? "إغلاق" : "إضافة عميل"}
          </button>
        </div>

        {/* Add form */}
        {addOpen && (
          <div style={{ background: "#fff", border: "1px solid #DBE4FF", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 6px 20px rgba(63,91,216,0.08)" }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>اسم العميل *</label>
                <input style={inputStyle} value={fName} onChange={(e) => setFName(e.target.value)} placeholder="مثال: أبو محمد" />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>رقم الهاتف *</label>
                <input style={{ ...inputStyle, direction: "ltr", textAlign: "right" }} value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="9XXXXXXX" inputMode="tel" />
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>الحالة</label>
                <select style={selStyle} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>الإعلان (اختياري)</label>
                <select style={selStyle} value={fProperty} onChange={(e) => setFProperty(e.target.value)}>
                  <option value="">بدون إعلان محدد</option>
                  {myListings.map((p) => <option key={p.id} value={String(p.id)}>{p.titleAr}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>ملاحظة (اختياري)</label>
              <input style={inputStyle} value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="مثال: يفضّل التواصل مساءً" />
            </div>
            <button
              onClick={addLead}
              disabled={saving}
              style={{
                marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, height: 44, padding: "0 26px",
                borderRadius: 12, border: "none", background: "#667EEA", color: "#fff", fontWeight: 800, fontSize: 14.5,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "'Cairo',sans-serif",
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ العميل
            </button>
          </div>
        )}

        {/* Status filter chips (counts included) */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button
            onClick={() => setFilterStatus("")}
            style={{
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Cairo',sans-serif", border: "1px solid",
              borderColor: !filterStatus ? "#667EEA" : "#E2E8F0",
              background: !filterStatus ? "#667EEA" : "#fff",
              color: !filterStatus ? "#fff" : "#64748B",
            }}
          >
            الكل ({leads.length})
          </button>
          {counts.map(({ s, n }) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              style={{
                padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Cairo',sans-serif", border: "1px solid",
                borderColor: filterStatus === s ? "#667EEA" : "#E2E8F0",
                background: filterStatus === s ? "#667EEA" : "#fff",
                color: filterStatus === s ? "#fff" : "#64748B",
              }}
            >
              {s}{n > 0 && ` (${n})`}
            </button>
          ))}
        </div>

        {/* Listing filter */}
        <div style={{ marginBottom: 18, maxWidth: 360 }}>
          <select style={selStyle} value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
            <option value="">كل الإعلانات</option>
            {myListings.map((p) => <option key={p.id} value={String(p.id)}>{p.titleAr}</option>)}
          </select>
        </div>

        {/* Leads */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : leads.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #EEF1F5", borderRadius: 16, padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "#F5F7FA", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Users className="h-9 w-9" style={{ color: "#94A3B8" }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>لا يوجد عملاء بعد</p>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
              أضف عميلك الأول بزر «إضافة عميل»، أو انتظر تسجيلات «أنا مهتم» من صفحات إعلاناتك
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {leads.map((l) => {
              const src = SOURCE_META[l.sourcePage ?? ""] ?? { label: l.inquiryType, icon: MessageCircle };
              const SrcIcon = src.icon;
              const st = statusStyle(l.status);
              const intl = toIntlPhone(l.phone);
              return (
                <div key={l.id} style={{ background: "#fff", border: "1px solid #EEF1F5", borderRadius: 16, padding: "16px 18px", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    {/* Identity */}
                    <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15.5, fontWeight: 800, color: "#111827" }}>{l.customerName}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "#64748B", background: "#F8FAFC", border: "1px solid #EEF1F5", borderRadius: 999, padding: "3px 9px" }}>
                          <SrcIcon style={{ width: 11, height: 11 }} /> {src.label}
                        </span>
                      </div>
                      <div dir="ltr" style={{ fontSize: 14, fontWeight: 700, color: "#334155", textAlign: "right", marginTop: 3 }}>{l.phone}</div>
                      {l.propertyTitle && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#667EEA", fontWeight: 600, marginTop: 4 }}>
                          <Building style={{ width: 12, height: 12, flexShrink: 0 }} /> {l.propertyTitle}
                        </div>
                      )}
                      {l.message && <div style={{ fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 1.7 }}>"{l.message}"</div>}
                      <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6 }}>{formatDate(l.createdAt)}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <select
                        value={l.status}
                        disabled={busyId === l.id}
                        onChange={(e) => patchLead(l.id, { status: e.target.value }, "تم تحديث الحالة")}
                        style={{
                          height: 36, borderRadius: 999, border: "none", padding: "0 14px", fontSize: 13, fontWeight: 800,
                          fontFamily: "'Cairo',sans-serif", cursor: "pointer", outline: "none",
                          background: st.bg, color: st.fg,
                        }}
                      >
                        {/* keep the stored value selectable even if the admin later removed it */}
                        {!statuses.includes(l.status) && <option value={l.status}>{l.status}</option>}
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: 6 }}>
                        {intl && (
                          <>
                            <a href={`https://wa.me/${intl}`} target="_blank" rel="noopener noreferrer" title="واتساب"
                              style={{ width: 34, height: 34, borderRadius: 9, background: "#ECFDF5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <MessageCircle style={{ width: 15, height: 15 }} />
                            </a>
                            <a href={`tel:+${intl}`} title="اتصال"
                              style={{ width: 34, height: 34, borderRadius: 9, background: "#EEF2FF", color: "#4338CA", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Phone style={{ width: 15, height: 15 }} />
                            </a>
                          </>
                        )}
                        <button
                          title="ملاحظة"
                          onClick={() => setNoteDraft(noteDraft?.id === l.id ? null : { id: l.id, text: l.notes ?? "" })}
                          style={{ width: 34, height: 34, borderRadius: 9, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#64748B", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Pencil style={{ width: 14, height: 14 }} />
                        </button>
                        <button
                          title={confirmDel === l.id ? "اضغط مرة أخرى للتأكيد" : "حذف"}
                          onClick={() => deleteLead(l.id)}
                          disabled={busyId === l.id}
                          style={{
                            height: 34, minWidth: 34, padding: confirmDel === l.id ? "0 10px" : 0, borderRadius: 9,
                            border: "1px solid #FECACA", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            gap: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Cairo',sans-serif",
                            background: confirmDel === l.id ? "#DC2626" : "#FEF2F2",
                            color: confirmDel === l.id ? "#fff" : "#DC2626",
                          }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                          {confirmDel === l.id && "تأكيد؟"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Existing note + editor */}
                  {noteDraft?.id === l.id ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={noteDraft.text}
                        autoFocus
                        placeholder="اكتب ملاحظتك عن العميل..."
                        onChange={(e) => setNoteDraft({ id: l.id, text: e.target.value })}
                      />
                      <button
                        onClick={async () => { if (await patchLead(l.id, { notes: noteDraft.text }, "تم حفظ الملاحظة")) setNoteDraft(null); }}
                        style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "#667EEA", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                        حفظ
                      </button>
                    </div>
                  ) : l.notes ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: "#475569", background: "#F8FAFC", border: "1px dashed #E2E8F0", borderRadius: 10, padding: "8px 12px" }}>
                      📝 {l.notes}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
