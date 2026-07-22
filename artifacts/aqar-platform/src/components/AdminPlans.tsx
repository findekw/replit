import { useEffect, useState, type CSSProperties } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, X } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();

interface Plan {
  id: number;
  nameAr: string;
  name: string;
  priceKwd: number;
  durationDays: number;
  maxListings: number;
  featuredListings: number;
  features: string[];
  active: boolean;
}

type Draft = {
  id?: number;
  nameAr: string;
  priceKwd: string;
  durationDays: string;
  maxListings: string;
  featuredListings: string;
  features: string;
  active: boolean;
};

const EMPTY: Draft = { nameAr: "", priceKwd: "", durationDays: "30", maxListings: "10", featuredListings: "0", features: "", active: true };

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Two-tap delete: window.confirm is silently swallowed by mobile in-app
  // browsers (the client tapped 🗑 on iPhone and nothing happened at all).
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/plans`, { credentials: "include" });
      const d = await r.json();
      setPlans(d?.plans ?? []);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setError(""); setDraft({ ...EMPTY }); }
  function openEdit(p: Plan) {
    setError("");
    setDraft({
      id: p.id, nameAr: p.nameAr, priceKwd: String(p.priceKwd),
      durationDays: String(p.durationDays), maxListings: String(p.maxListings),
      featuredListings: String(p.featuredListings), features: (p.features ?? []).join("\n"), active: p.active,
    });
  }

  async function save() {
    if (!draft) return;
    if (draft.nameAr.trim().length < 2) { setError("اسم الباقة مطلوب"); return; }
    if (!isFinite(Number(draft.priceKwd)) || Number(draft.priceKwd) < 0) { setError("سعر غير صالح"); return; }
    setSaving(true); setError("");
    const body = {
      nameAr: draft.nameAr.trim(),
      priceKwd: Number(draft.priceKwd),
      durationDays: Number(draft.durationDays) || 30,
      maxListings: Number(draft.maxListings) || 0,
      featuredListings: Number(draft.featuredListings) || 0,
      features: draft.features.split("\n").map((s) => s.trim()).filter(Boolean),
      active: draft.active,
    };
    try {
      const url = draft.id ? `${BASE}/api/admin/plans/${draft.id}` : `${BASE}/api/admin/plans`;
      const r = await fetch(url, {
        method: draft.id ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d?.error || "تعذّر الحفظ"); setSaving(false); return; }
      setDraft(null);
      await load();
    } catch { setError("تعذّر الاتصال بالخادم"); }
    finally { setSaving(false); }
  }

  async function remove(p: Plan) {
    if (confirmingId !== p.id) {
      setConfirmingId(p.id);
      setTimeout(() => setConfirmingId((c) => (c === p.id ? null : c)), 4000);
      return;
    }
    setConfirmingId(null);
    try {
      const res = await fetch(`${BASE}/api/admin/plans/${p.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "تعذّر حذف الباقة"); return; }
      await load();
    } catch { setError("تعذّر الاتصال بالخادم"); }
  }

  const inputStyle: CSSProperties = { width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #E2E8F0", padding: "0 12px", fontSize: 14, fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", outline: "none" };
  const labelStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 5, display: "block" };

  return (
    <div className="adm-card overflow-hidden" style={{ marginBottom: 18 }} dir="rtl">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EAEEF5" }}>
        <div className="flex items-center gap-2">
          <Package className="h-4.5 w-4.5" style={{ color: "#667EEA" }} />
          <h3 className="text-base font-bold" style={{ color: "#1A2238" }}>باقات الاشتراك</h3>
        </div>
        <button onClick={openNew} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#667EEA,#4B66E0)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
          <Plus className="h-4 w-4" /> إضافة باقة
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#94A3B8" }}><Loader2 className="h-6 w-6 animate-spin" style={{ margin: "0 auto" }} /></div>
      ) : plans.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748B" }}>
          <p style={{ fontWeight: 700, color: "#1A2238" }}>لا توجد باقات بعد</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>أضف باقة لتظهر للمكاتب في صفحة الاشتراك.</p>
        </div>
      ) : (
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
          {plans.map((p) => (
            <div key={p.id} style={{ border: "1px solid #EAEEF5", borderRadius: 14, padding: 16, background: p.active ? "#fff" : "#F8FAFC", opacity: p.active ? 1 : 0.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#1A2238", fontSize: 15 }}>{p.nameAr}</div>
                  <div style={{ color: "#667EEA", fontWeight: 800, fontSize: 20, marginTop: 4 }}>{p.priceKwd} <span style={{ fontSize: 12, color: "#64748B" }}>د.ك / {p.durationDays} يوم</span></div>
                </div>
                {!p.active && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "3px 8px", borderRadius: 999 }}>موقوفة</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 8 }}>حتى {p.maxListings} إعلان · {p.featuredListings} مميز</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => openEdit(p)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, border: "1px solid #E2E8F0", background: "#fff", borderRadius: 9, padding: "7px 0", fontSize: 12.5, fontWeight: 700, color: "#334155", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </button>
                <button
                  onClick={() => remove(p)}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                    border: "1px solid #FECACA", borderRadius: 9, padding: "7px 11px", cursor: "pointer",
                    fontFamily: "'Cairo',sans-serif", fontSize: 12.5, fontWeight: 700,
                    background: confirmingId === p.id ? "#DC2626" : "#FEF2F2",
                    color: confirmingId === p.id ? "#fff" : "#DC2626",
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {confirmingId === p.id && "تأكيد الحذف؟"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {draft && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => !saving && setDraft(null)}>
          <div dir="rtl" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", fontFamily: "'Cairo',sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1A2238", margin: 0 }}>{draft.id ? "تعديل الباقة" : "باقة جديدة"}</h3>
              <button onClick={() => !saving && setDraft(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X className="h-4 w-4" /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>اسم الباقة</label><input style={inputStyle} value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} placeholder="مثال: الباقة الأساسية" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>السعر (د.ك)</label><input style={inputStyle} type="number" step="0.001" min="0" value={draft.priceKwd} onChange={(e) => setDraft({ ...draft, priceKwd: e.target.value })} placeholder="14.5" /></div>
                <div><label style={labelStyle}>المدة (يوم)</label><input style={inputStyle} type="number" min="1" value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: e.target.value })} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>أقصى عدد إعلانات</label><input style={inputStyle} type="number" min="0" value={draft.maxListings} onChange={(e) => setDraft({ ...draft, maxListings: e.target.value })} /></div>
                <div><label style={labelStyle}>إعلانات مميزة</label><input style={inputStyle} type="number" min="0" value={draft.featuredListings} onChange={(e) => setDraft({ ...draft, featuredListings: e.target.value })} /></div>
              </div>
              <div><label style={labelStyle}>المميزات (سطر لكل ميزة)</label><textarea style={{ ...inputStyle, height: 90, padding: "10px 12px", resize: "vertical" }} value={draft.features} onChange={(e) => setDraft({ ...draft, features: e.target.value })} placeholder={"دعم فني عبر واتساب\nظهور مميز في النتائج"} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>الباقة مفعّلة (تظهر للمكاتب)</span>
              </label>
              {error && <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>}
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#667EEA,#4B66E0)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Cairo',sans-serif" }}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {draft.id ? "حفظ التعديلات" : "إضافة الباقة"}
              </button>
              <button onClick={() => setDraft(null)} disabled={saving} style={{ height: 46, borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontWeight: 700, fontSize: 14, padding: "0 20px", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
