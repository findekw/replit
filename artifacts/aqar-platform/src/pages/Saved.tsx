import { useState, useEffect } from "react";
import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();
const SAVED_KEY = "finde_saved";

function readSaved(): number[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

// The heart in PropertyCard persists saved property ids to localStorage; this
// page reads them back and shows the saved listings so users can find them.
export default function Saved() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = readSaved();
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(
      ids.map((id) =>
        fetch(`${BASE}/api/properties/${id}`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      const props = results
        .filter(Boolean)
        .map((d: any) => ({ ...d, officeName: d.office?.nameAr ?? null, officeLogo: d.office?.logo ?? null }));
      setItems(props);
      setLoading(false);
    });
  }, []);

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 18,
  };

  return (
    <MainLayout>
      <div dir="rtl" style={{ background: "#F6F8FC", minHeight: "70vh", fontFamily: "'Cairo', sans-serif" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: "#FEE2E2", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Heart className="h-5 w-5" style={{ color: "#EF4444", fill: "#EF4444" }} />
            </span>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>عقاراتي المحفوظة</h1>
              <p style={{ fontSize: 14, color: "#64748B", margin: "2px 0 0" }}>العقارات التي حفظتها للرجوع إليها لاحقًا</p>
            </div>
          </div>

          {loading ? (
            <div style={grid}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", background: "#fff", borderRadius: 20, border: "1px solid #EEF1F5" }}>
              <Heart className="h-14 w-14" style={{ color: "#cbd5e1", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>لا توجد عقارات محفوظة بعد</p>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>اضغط على أيقونة القلب ♡ في أي عقار لحفظه هنا</p>
              <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#667EEA", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>
                تصفّح العقارات <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div style={grid}>
              {items.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
