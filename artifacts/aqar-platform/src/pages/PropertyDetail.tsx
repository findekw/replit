import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProperty, useGetSimilarProperties } from "@workspace/api-client-react";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, Phone, MessageCircle, Check, Share2, Flag, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { getGetPropertyQueryKey } from "@workspace/api-client-react";
import { trackInteraction } from "@/lib/trackInteraction";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const STATUS_COLORS: Record<string, string> = {
  "للإيجار": "bg-blue-100 text-blue-800",
  "للبيع": "bg-blue-100 text-blue-800",
  "للبدل": "bg-orange-100 text-orange-800",
};

function buildWhatsAppUrl(whatsapp: string, title: string, propertyUrl: string) {
  const msg = `السلام عليكم،\nاستفسار عن هذا الإعلان:\n\n${title}\n\nFinde:\n${propertyUrl}`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
}

export default function PropertyDetail() {
  const [, params] = useRoute("/properties/:id");
  const id = parseInt(params?.id ?? "0");
  const [, navigate] = useLocation();

  const [searchIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem("aqar_search_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const currentIndex = searchIds.indexOf(id);
  const hasSearchContext = currentIndex !== -1;
  const prevId = hasSearchContext && currentIndex > 0 ? searchIds[currentIndex - 1] : null;
  const nextId = hasSearchContext && currentIndex < searchIds.length - 1 ? searchIds[currentIndex + 1] : null;

  const { data: property, isLoading } = useGetProperty(id, {
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id) },
  });
  const { data: similar } = useGetSimilarProperties(id, {
    query: { enabled: !!id },
  });

  const [imgIndex, setImgIndex] = useState(0);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const officeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = officeCardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFloatingBtn(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [property]);

  if (isLoading) {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          <p className="text-2xl">العقار غير موجود</p>
        </div>
      </MainLayout>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images.map((img) => img.url)
    : property.primaryImage
    ? [property.primaryImage]
    : [];

  const propertyUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <MainLayout>
      <div dir="rtl" className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <a href="/properties" className="hover:text-primary">العقارات</a>
          <span>/</span>
          <span>{property.titleAr}</span>
        </div>

        {/* Search navigation */}
        {hasSearchContext && (
          <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-2.5 mb-6">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevId}
              onClick={() => prevId && navigate(`/properties/${prevId}`)}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {searchIds.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextId}
              onClick={() => nextId && navigate(`/properties/${nextId}`)}
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[imgIndex]}
                    alt={property.titleAr}
                    className="w-full h-full object-cover"
                    data-testid="property-image"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                        onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                        onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            className={`w-2 h-2 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                            onClick={() => setImgIndex(i)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">لا توجد صور</div>
              )}
              {/* Status + Featured badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge className={STATUS_COLORS[property.status] ?? "bg-gray-100 text-gray-800"}>
                  {property.status}
                </Badge>
                {property.featured && (
                  <Badge className="bg-accent text-accent-foreground">مميز</Badge>
                )}
              </div>
            </div>

            {/* Title & Price */}
            <div className="bg-card border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{property.titleAr}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{[property.governorateName, property.areaName].filter(Boolean).join(" - ")}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-3xl font-black text-primary whitespace-nowrap" data-testid="property-price">
                    {property.price.toLocaleString("en-US")} د.ك
                  </div>
                  {property.status === "للإيجار" && (
                    <span className="text-sm text-muted-foreground">/ شهرياً</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-4">رقم المرجع: {property.referenceId}</div>

              {/* Property facts */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-primary" />
                    <span className="text-sm">{property.bedrooms} غرف نوم</span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-primary" />
                    <span className="text-sm">{property.bathrooms} حمامات</span>
                  </div>
                )}
                {property.area != null && (
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-primary" />
                    <span className="text-sm">{property.area} م²</span>
                  </div>
                )}
                {property.furnished && (
                  <div className="flex items-center gap-2 col-span-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{property.furnished}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.descriptionAr && (
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-3">وصف العقار</h2>
                <p className="text-muted-foreground leading-relaxed">{property.descriptionAr}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4">المميزات والخدمات</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#3F5BD8]" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المعلن — Advertiser block */}
            {property.office && (
              <a href={`${BASE}/${property.office.slug}`} className="block group">
                <div
                  className="rounded-2xl p-4 transition-all duration-200 cursor-pointer"
                  style={{ background: "#f9fafb", border: "1px solid #f0f0f0" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">المعلن</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {property.office.logo ? (
                        <img
                          src={property.office.logo}
                          alt={property.office.nameAr}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, hsl(221,54%,22%) 0%, hsl(221,54%,36%) 100%)" }}
                        >
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="font-bold text-gray-900 truncate group-hover:text-[hsl(221,54%,28%)] transition-colors">
                        {property.office.nameAr}
                      </span>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </a>
            )}

            {/* Similar — shown only when user did not come from search */}
            {!hasSearchContext && (similar ?? []).length > 0 && (
              <div>
                <h2 className="font-bold text-xl mb-4">عقارات مشابهة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {(similar ?? []).map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">
            {/* Office Card */}
            {property.office && (
              <div ref={officeCardRef} className="bg-card border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {property.office.logo ? (
                    <img src={property.office.logo} alt={property.office.nameAr} className="w-12 h-12 rounded-full object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {property.office.nameAr.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground">{property.office.nameAr}</div>
                    {property.office.governorateName && (
                      <div className="text-xs text-muted-foreground mt-0.5">{property.office.governorateName}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {property.office.whatsapp && (
                    <button
                      onClick={() => {
                        trackInteraction(property.officeId!, property.id, "whatsapp", "property_page");
                        window.open(buildWhatsAppUrl(property.office!.whatsapp!, property.titleAr, propertyUrl), "_blank");
                      }}
                      data-testid="button-whatsapp"
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
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}
                    >
                      <MessageCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                      واتساب
                    </button>
                  )}
                  {property.office.phone && (
                    <button
                      onClick={() => {
                        trackInteraction(property.officeId!, property.id, "call", "property_page");
                        window.open(`tel:${property.office!.phone}`, "_blank");
                      }}
                      data-testid="button-call"
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
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                    >
                      <Phone style={{ width: 18, height: 18, flexShrink: 0 }} />
                      اتصال
                    </button>
                  )}
                  <a href={`/${property.office.slug}`}>
                    <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                      عرض صفحة المكتب
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Share */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigator.share?.({ url: window.location.href, title: property.titleAr })}
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4 ml-2" />
                مشاركة
              </Button>
              <Button variant="outline" size="icon" data-testid="button-report">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating contact button — mobile only, appears when office card scrolls out of view */}
      {property.office?.whatsapp && showFloatingBtn && (
        <button
          className="lg:hidden fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: "#25D366" }}
          onClick={() => {
            trackInteraction(property.officeId!, property.id, "whatsapp", "property_page");
            window.open(buildWhatsAppUrl(property.office!.whatsapp!, property.titleAr, propertyUrl), "_blank");
          }}
          aria-label="تواصل عبر واتساب"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}
      {property.office?.phone && !property.office?.whatsapp && showFloatingBtn && (
        <button
          className="lg:hidden fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: "#1F2A44" }}
          onClick={() => {
            trackInteraction(property.officeId!, property.id, "call", "property_page");
            window.open(`tel:${property.office!.phone}`, "_blank");
          }}
          aria-label="اتصال"
        >
          <Phone className="h-6 w-6 text-white" />
        </button>
      )}
    </MainLayout>
  );
}
