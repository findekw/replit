import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trackInteraction } from "@/lib/trackInteraction";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { getApiBase } from "@/lib/apiBase";
import { resolveTemplateKey, type OfficeData, type OfficeProperty, type TemplateProps } from "./office-templates/types";
import ModernTemplate from "./office-templates/ModernTemplate";
import LuxuryTemplate from "./office-templates/LuxuryTemplate";
import MinimalTemplate from "./office-templates/MinimalTemplate";
import ClassicTemplate from "./office-templates/ClassicTemplate";

const BASE = getApiBase();
const STATUS_TABS = ["الكل", "للبيع", "للإيجار", "للبدل", "طلب"] as const;
// Common property types offered as a quick filter on the office page.
const PROPERTY_TYPES = ["شقة", "بيت", "دور", "ارض", "عمارة", "محل", "مكتب", "مخزن", "شاليه", "مزرعة", "قسيمة"] as const;

const TEMPLATES = {
  modern: ModernTemplate,
  luxury: LuxuryTemplate,
  minimal: MinimalTemplate,
  classic: ClassicTemplate,
} as const;

export default function OfficePage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug ?? "";

  const [office, setOffice] = useState<OfficeData | null>(null);
  const [properties, setProperties] = useState<OfficeProperty[]>([]);
  const [loadingOffice, setLoadingOffice] = useState(true);
  const [loadingProps, setLoadingProps] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("الكل");
  const [activeType, setActiveType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoadingOffice(true);
    setNotFound(false);
    fetch(`${BASE}/api/offices/by-slug/${encodeURIComponent(slug)}`, { credentials: "include" })
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((data: OfficeData | null) => { if (data) setOffice(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingOffice(false));
  }, [slug]);

  useEffect(() => {
    if (!office) return;
    setLoadingProps(true);
    const statusParam = activeTab !== "الكل" ? `&status=${encodeURIComponent(activeTab)}` : "";
    const typeParam = activeType ? `&type=${encodeURIComponent(activeType)}` : "";
    fetch(`${BASE}/api/offices/${office.id}/properties?page=${page}&limit=12${statusParam}${typeParam}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { properties: OfficeProperty[]; totalPages: number }) => {
        setProperties(data.properties ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoadingProps(false));
  }, [office, activeTab, activeType, page]);

  useEffect(() => { setPage(1); }, [activeTab, activeType]);

  // Store the visible listing IDs so the property page can offer السابق/التالي navigation.
  useEffect(() => {
    if (properties.length > 0) {
      try { localStorage.setItem("aqar_search_ids", JSON.stringify(properties.map((p) => p.id))); } catch {}
    }
  }, [properties]);

  // Document title for SEO / sharing
  useEffect(() => {
    if (office) {
      document.title = `${office.nameAr} | فايند`;
      return () => { document.title = "فايند - منصة العقارات"; };
    }
  }, [office]);

  function onWhatsApp() {
    const number = office?.whatsapp ?? office?.phone ?? "";
    const clean = number.replace(/\D/g, "");
    if (clean && office) { trackInteraction(office.id, null, "whatsapp", "office_page"); window.open(`https://wa.me/${clean}`, "_blank"); }
  }
  function onCall() {
    if (office?.phone) { trackInteraction(office.id, null, "call", "office_page"); window.location.href = `tel:${office.phone}`; }
  }

  if (notFound) {
    return (
      <MainLayout>
        <div dir="rtl" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 16px", fontFamily: "'Cairo', sans-serif", background: "#F6F8FC" }}>
          <Building2 className="h-16 w-16" style={{ color: "#cbd5e1", marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8 }}>الصفحة غير موجودة</h1>
          <p style={{ color: "#64748B", marginBottom: 24 }}>لم يتم العثور على هذا المكتب على المنصة</p>
          <Button onClick={() => navigate("/offices")}>تصفّح جميع المكاتب</Button>
        </div>
      </MainLayout>
    );
  }

  if (loadingOffice || !office) {
    return (
      <MainLayout>
        <div dir="rtl" style={{ minHeight: "60vh", background: "#F6F8FC", fontFamily: "'Cairo', sans-serif" }}>
          <div style={{ height: 300, background: "linear-gradient(135deg,#16203a,#667EEA)" }} />
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ flex: "1 1 280px", height: 280, background: "#e9eef5", borderRadius: 18 }} />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const hasPhone = !!office.phone;
  const hasWA = !!(office.whatsapp || office.phone);
  const Template = TEMPLATES[resolveTemplateKey(office.landingTemplate)] ?? ModernTemplate;

  const props: TemplateProps = {
    office, properties, loadingProps, activeTab, setActiveTab,
    activeType, setActiveType, propertyTypes: PROPERTY_TYPES,
    page, totalPages, setPage,
    onWhatsApp, onCall, statusTabs: STATUS_TABS, hasWA, hasPhone,
  };

  return (
    <MainLayout>
      <Template {...props} />
    </MainLayout>
  );
}
