import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trackInteraction } from "@/lib/trackInteraction";
import MainLayout from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Phone, MessageCircle, MapPin, Building2,
  Bed, Bath, Square,
  ChevronLeft, ChevronRight,
} from "lucide-react";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

interface OfficeData {
  id: number;
  nameAr: string;
  slug: string;
  descriptionAr: string | null;
  logo: string | null;
  coverImage: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  governorateName: string | null;
  verified: boolean;
  featured: boolean;
  active: boolean;
  totalListings: number;
  activeListings: number;
}

interface Property {
  id: number;
  titleAr: string;
  status: string;
  type: string;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  featured: boolean;
  active: boolean;
  primaryImage: string | null;
  governorateName: string | null;
  areaName: string | null;
  officeName: string | null;
  officeLogo: string | null;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS = ["الكل", "للبيع", "للإيجار", "للبدل"] as const;

const STATUS_META: Record<string, { color: string; dot: string }> = {
  "للإيجار": { color: "bg-blue-500",   dot: "bg-blue-400" },
  "للبيع":   { color: "bg-emerald-500", dot: "bg-emerald-400" },
  "للبدل":   { color: "bg-orange-500",  dot: "bg-orange-400" },
};

/* ═══════════════════════════════════════════
   PROPERTY CARD
═══════════════════════════════════════════ */
function OfficePropertyCard({ property }: { property: Property }) {
  const locationText = [property.governorateName, property.areaName].filter(Boolean).join("، ");
  const meta = STATUS_META[property.status] ?? { color: "bg-gray-500", dot: "bg-gray-400" };
  const priceLabel =
    property.status === "للإيجار"
      ? `${property.price.toLocaleString("en-US")} KWD / شهرياً`
      : `${property.price.toLocaleString("en-US")} KWD`;

  const hasSpecs = property.bedrooms != null || property.bathrooms != null || property.area != null;

  return (
    <Link href={`${BASE}/properties/${property.id}`} className="block group focus:outline-none">
      <article
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 ease-out"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLElement).style.borderColor = "#E0E7FF";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLElement).style.borderColor = "";
        }}
      >
        {/* ── Image ── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
          {property.primaryImage ? (
            <img
              src={property.primaryImage}
              alt={property.titleAr}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1F2A44 0%, #3F5BD8 100%)" }}
            >
              <Building2 className="h-10 w-10 text-white/30" />
              <span className="text-white/40 text-xs font-medium">{property.type}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap">
            <span className={`${meta.color} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm`}>
              {property.status}
            </span>
            {property.featured && (
              <span
                className="text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm"
                style={{ background: "#3F5BD8" }}
              >
                مميز ★
              </span>
            )}
          </div>

          {/* Price gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-10 pb-3 px-4">
            <p className="text-white font-black text-base tracking-tight leading-none">{priceLabel}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-4">
          {/* Type tag */}
          <span className="inline-block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            {property.type}
          </span>

          {/* Title */}
          <h3
            className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-1 mb-2 transition-colors duration-150 group-hover:text-[#1F2A44]"
          >
            {property.titleAr}
          </h3>

          {/* Location */}
          {locationText && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          {/* Specs */}
          {hasSpecs && (
            <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Bed className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-800">{property.bedrooms}</span>
                  <span>غرف</span>
                </span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Bath className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-800">{property.bathrooms}</span>
                  <span>حمام</span>
                </span>
              )}
              {property.area != null && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Square className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-800">{property.area}</span>
                  <span>م²</span>
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   OFFICE SIDEBAR CARD
═══════════════════════════════════════════ */
function OfficeSidebarCard({
  office,
  onWhatsApp,
  onCall,
  hasPhone,
  hasWA,
  hideCta = false,
}: {
  office: OfficeData;
  onWhatsApp: () => void;
  onCall: () => void;
  hasPhone: boolean;
  hasWA: boolean;
  hideCta?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Accent top stripe */}
      <div
        className="h-1"
        style={{ background: "linear-gradient(90deg, #1F2A44 0%, #3F5BD8 100%)" }}
      />

      <div className="p-5">
        {/* ── Logo + name + status ── */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="flex-shrink-0">
            {office.logo ? (
              <img
                src={office.logo}
                alt={office.nameAr}
                className="w-14 h-14 rounded-xl object-cover"
                style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1F2A44 0%, #3F5BD8 100%)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <Building2 className="h-7 w-7 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h1 className="font-black text-gray-900 text-base leading-tight truncate">
              {office.nameAr}
            </h1>
          </div>
        </div>

        {/* ── Description ── */}
        {office.descriptionAr && (
          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
            {office.descriptionAr}
          </p>
        )}

        {/* ── CTA buttons ── */}
        {!hideCta && <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hasWA && (
            <button
              onClick={onWhatsApp}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                border: "none",
                background: "#22c55e",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}
            >
              <MessageCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
              واتساب
            </button>
          )}
          {hasPhone && (
            <button
              onClick={onCall}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontWeight: 600,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
            >
              <Phone style={{ width: 18, height: 18, flexShrink: 0 }} />
              اتصال
            </button>
          )}
        </div>}

      </div>
    </div>
  );
}

/* ─── Skeleton sidebar ─── */
function SidebarSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
      <div className="flex gap-3">
        <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-3.5 w-1/2 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="h-11 rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function OfficePage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug ?? "";

  const [office, setOffice] = useState<OfficeData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingOffice, setLoadingOffice] = useState(true);
  const [loadingProps, setLoadingProps] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("الكل");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoadingOffice(true);
    setNotFound(false);
    fetch(`${BASE}/api/offices/by-slug/${encodeURIComponent(slug)}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data: OfficeData | null) => { if (data) setOffice(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingOffice(false));
  }, [slug]);

  useEffect(() => {
    if (!office) return;
    setLoadingProps(true);
    const statusParam = activeTab !== "الكل" ? `&status=${encodeURIComponent(activeTab)}` : "";
    fetch(`${BASE}/api/offices/${office.id}/properties?page=${page}&limit=12${statusParam}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { properties: Property[]; totalPages: number }) => {
        setProperties(data.properties ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoadingProps(false));
  }, [office, activeTab, page]);

  useEffect(() => { setPage(1); }, [activeTab]);

  function handleWhatsApp() {
    const number = office?.whatsapp ?? office?.phone ?? "";
    const clean = number.replace(/\D/g, "");
    if (clean) {
      trackInteraction(office!.id, null, "whatsapp", "office_page");
      window.open(`https://wa.me/${clean}`, "_blank");
    }
  }
  function handleCall() {
    if (office?.phone) {
      trackInteraction(office!.id, null, "call", "office_page");
      window.location.href = `tel:${office.phone}`;
    }
  }

  const hasPhone = !!office?.phone;
  const hasWA = !!(office?.whatsapp || office?.phone);

  if (notFound) {
    return (
      <MainLayout>
        <div dir="rtl" className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <Building2 className="h-16 w-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
          <p className="text-gray-500 mb-6">لم يتم العثور على هذا المكتب على المنصة</p>
          <Button onClick={() => navigate("/offices")}>تصفح جميع المكاتب</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div dir="rtl" style={{ minHeight: "100vh", background: "#F5F7FA" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {/* ════════════════════════════════════════════
              TWO-COLUMN GRID
              Desktop: [listings 1fr] [sidebar 300px]
              Mobile:  stacked (sidebar first, then listings)
          ════════════════════════════════════════════ */}

          {/* Mobile sidebar (above listings — no CTA, those are in sticky bar) */}
          <div className="lg:hidden mb-5">
            {loadingOffice ? (
              <SidebarSkeleton />
            ) : office ? (
              <OfficeSidebarCard
                office={office}
                onWhatsApp={handleWhatsApp}
                onCall={handleCall}
                hasPhone={hasPhone}
                hasWA={hasWA}
                hideCta={true}
              />
            ) : null}
          </div>

          {/* Desktop: true CSS grid — no empty gap */}
          <div
            className="hidden lg:grid gap-6 items-start"
            style={{ gridTemplateColumns: "1fr 300px" }}
          >
            {/* ── Listings panel ── */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                <div>
                  <h2 className="text-base font-black text-gray-900">إعلانات المكتب</h2>
                  {office && (
                    <p className="text-xs text-gray-400 mt-0.5">{office.activeListings} عقار متاح</p>
                  )}
                </div>
                {/* Filter tabs */}
                <div className="flex gap-1.5">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                      style={
                        activeTab === tab
                          ? { background: "#1F2A44", color: "#fff", border: "1px solid transparent" }
                          : { background: "#f8f8f8", color: "#666", border: "1px solid #e5e5e5" }
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="p-6">
                {loadingProps || loadingOffice ? (
                  <div className="grid grid-cols-2 gap-5">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-20">
                    <Building2 className="h-14 w-14 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-500 text-base">
                      {activeTab === "الكل" ? "لا توجد إعلانات منشورة حالياً" : `لا توجد إعلانات ${activeTab}`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1.5">سيتم نشر الإعلانات قريباً</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                      {properties.map((p) => (
                        <OfficePropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-3 mt-8">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="gap-1">
                          <ChevronRight className="h-4 w-4" />السابق
                        </Button>
                        <span className="text-sm text-gray-400">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="gap-1">
                          التالي<ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Sticky sidebar ── */}
            <div style={{ position: "sticky", top: "80px" }}>
              {loadingOffice ? (
                <SidebarSkeleton />
              ) : office ? (
                <OfficeSidebarCard
                  office={office}
                  onWhatsApp={handleWhatsApp}
                  onCall={handleCall}
                  hasPhone={hasPhone}
                  hasWA={hasWA}
                />
              ) : null}
            </div>
          </div>

          {/* Mobile: listings panel (below sidebar) */}
          <div className="lg:hidden">
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {/* Panel header */}
              <div className="flex flex-col gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-gray-900">إعلانات المكتب</h2>
                  {office && (
                    <span className="text-xs text-gray-400">{office.activeListings} عقار</span>
                  )}
                </div>
                {/* Filter tabs — scrollable row */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                      style={
                        activeTab === tab
                          ? { background: "#1F2A44", color: "#fff", border: "1px solid transparent" }
                          : { background: "#f8f8f8", color: "#666", border: "1px solid #e5e5e5" }
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {loadingProps || loadingOffice ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-14">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-500">
                      {activeTab === "الكل" ? "لا توجد إعلانات منشورة حالياً" : `لا توجد إعلانات ${activeTab}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      {properties.map((p) => (
                        <OfficePropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-3 mt-6">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="gap-1">
                          <ChevronRight className="h-4 w-4" />السابق
                        </Button>
                        <span className="text-sm text-gray-400">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="gap-1">
                          التالي<ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {office && (hasWA || hasPhone) && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex gap-3 px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {hasWA && (
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1,
                height: "48px",
                borderRadius: "12px",
                border: "none",
                background: "#22c55e",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <MessageCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
              واتساب
            </button>
          )}
          {hasPhone && (
            <button
              onClick={handleCall}
              style={{
                flex: 1,
                height: "48px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontWeight: 700,
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <Phone style={{ width: 20, height: 20, flexShrink: 0 }} />
              اتصال
            </button>
          )}
        </div>
      )}

      {/* Spacer so last card isn't hidden behind sticky bar on mobile */}
      {office && (hasWA || hasPhone) && (
        <div className="lg:hidden h-20" />
      )}
    </MainLayout>
  );
}
