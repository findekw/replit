import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProperty, useGetSimilarProperties } from "@workspace/api-client-react";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { LogoImg } from "@/components/LogoImg";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Map, Bed, Bath, Square, Phone, MessageCircle, Check, Share2, Flag, ChevronLeft, ChevronRight, Building2, Home } from "lucide-react";
import { getGetPropertyQueryKey } from "@workspace/api-client-react";
import { trackInteraction } from "@/lib/trackInteraction";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const STATUS_COLORS: Record<string, string> = {
  "للإيجار": "#667EEA",
  "للبيع": "#667EEA",
  "للبدل": "#f97316",
};

function buildWhatsAppUrl(whatsapp: string, title: string, propertyUrl: string) {
  const msg = `السلام عليكم، ممكن ترسل تفاصيل هذا الإعلان في فايند وشكراً\n${title}\n${propertyUrl}`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
}

const styles = `
.pd-page { background: #F5F7FA; min-height: 100vh; font-family: 'Cairo', sans-serif; }
.pd-container { max-width: 1200px; margin: 0 auto; padding: 20px 16px 96px; }
.pd-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; margin-bottom: 16px; flex-wrap: wrap; }
.pd-breadcrumb a { color: #64748B; text-decoration: none; transition: color .15s; display: inline-flex; align-items: center; gap: 4px; }
.pd-breadcrumb a:hover { color: #667EEA; }
.pd-breadcrumb .pd-bc-sep { color: #CBD5E1; }
.pd-breadcrumb .pd-bc-current { color: #111827; font-weight: 600; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pd-searchnav { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #EEF1F5; border-radius: 14px; padding: 8px 12px; margin-bottom: 20px; box-shadow: 0 6px 20px rgba(15,23,42,0.04); }
.pd-navbtn { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #E2E8F0; color: #111827; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
.pd-navbtn:hover:not(:disabled) { border-color: #667EEA; color: #667EEA; }
.pd-navbtn:disabled { opacity: .4; cursor: not-allowed; }
.pd-navcount { font-size: 13px; color: #64748B; font-weight: 600; }

.pd-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 1024px) { .pd-grid { grid-template-columns: 1fr 360px; align-items: start; } }

.pd-card { background: #fff; border: 1px solid #EEF1F5; border-radius: 18px; box-shadow: 0 6px 20px rgba(15,23,42,0.06); }

/* Gallery */
.pd-gallery { position: relative; border-radius: 18px; overflow: hidden; background: #111827; aspect-ratio: 16/10; }
.pd-gallery-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-gallery-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #111827 0%, #2d3c5e 100%); }
.pd-gnav { position: absolute; top: 50%; transform: translateY(-50%); width: 42px; height: 42px; border-radius: 50%; border: none; background: rgba(15,23,42,0.55); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: background .15s; }
.pd-gnav:hover { background: rgba(15,23,42,0.8); }
.pd-gnav-prev { right: 14px; }
.pd-gnav-next { left: 14px; }
.pd-gcount { position: absolute; bottom: 14px; left: 14px; background: rgba(15,23,42,0.6); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; backdrop-filter: blur(4px); }
.pd-badges { position: absolute; top: 14px; right: 14px; display: flex; gap: 8px; }
.pd-badge { color: #fff; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; box-shadow: 0 2px 8px rgba(15,23,42,0.2); }
.pd-badge-featured { background: #f59e0b; }

.pd-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 4px; }
.pd-thumb { flex: 0 0 auto; width: 92px; height: 64px; border-radius: 12px; overflow: hidden; border: 2px solid transparent; cursor: pointer; padding: 0; background: #111827; transition: border-color .15s; }
.pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-thumb.active { border-color: #667EEA; }
.pd-video { margin-top: 14px; border-radius: 16px; overflow: hidden; background: #0F172A; border: 1px solid #EEF1F5; }
.pd-video video { width: 100%; max-height: 460px; display: block; background: #0F172A; }

/* Header card */
.pd-head { padding: 24px; }
.pd-head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pd-price { font-size: 30px; font-weight: 900; color: #111827; white-space: nowrap; line-height: 1.1; }
.pd-price .pd-cur { font-size: 18px; font-weight: 700; color: #667EEA; margin-right: 4px; }
.pd-price-sub { font-size: 13px; color: #64748B; font-weight: 600; }
.pd-title { font-size: 22px; font-weight: 800; color: #111827; margin: 14px 0 8px; line-height: 1.4; }
.pd-loc { display: flex; align-items: center; gap: 6px; color: #64748B; font-size: 14px; }
.pd-ref { font-size: 12px; color: #94A3B8; margin-top: 10px; }

.pd-maplink { display: inline-flex; align-items: center; gap: 8px; margin-top: 14px; background: #F5F7FA; border: 1px solid #EEF1F5; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 700; color: #667EEA; text-decoration: none; font-family: inherit; transition: all .15s; }
.pd-maplink:hover { background: #667EEA; border-color: #667EEA; color: #fff; }
.pd-maplink svg { flex-shrink: 0; }

.pd-specs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid #EEF1F5; }
.pd-spec { display: flex; align-items: center; gap: 7px; background: #F5F7FA; border: 1px solid #EEF1F5; border-radius: 12px; padding: 9px 14px; font-size: 14px; font-weight: 600; color: #111827; }
.pd-spec svg { color: #667EEA; }

.pd-sec { padding: 24px; }
.pd-sec-title { font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 14px; }
.pd-desc { color: #475569; line-height: 2; font-size: 15px; white-space: pre-line; }

.pd-amen { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (min-width: 640px) { .pd-amen { grid-template-columns: 1fr 1fr 1fr; } }
.pd-amen-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #111827; font-weight: 500; }
.pd-amen-check { width: 22px; height: 22px; border-radius: 7px; background: rgba(5,150,105,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pd-amen-check svg { color: #059669; }

/* Sidebar / office */
.pd-side { display: flex; flex-direction: column; gap: 18px; }
@media (min-width: 1024px) { .pd-side { position: sticky; top: 20px; } }
.pd-office { padding: 20px; }
.pd-office-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.pd-office-logo { width: 54px; height: 54px; border-radius: 14px; object-fit: cover; border: 1px solid #EEF1F5; flex-shrink: 0; }
.pd-office-logo-ph { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, #111827 0%, #2d3c5e 100%); }
.pd-office-name { font-size: 16px; font-weight: 800; color: #111827; }
.pd-office-gov { font-size: 12px; color: #64748B; margin-top: 2px; }
.pd-office-link { display: block; text-align: center; font-size: 13px; color: #667EEA; font-weight: 700; text-decoration: none; padding: 10px; border-radius: 10px; transition: background .15s; }
.pd-office-link:hover { background: #F5F7FA; }

.pd-cta { width: 100%; height: 50px; border-radius: 12px; border: none; font-weight: 700; font-size: 15px; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all .15s; }
.pd-cta-wa { background: #25D366; color: #fff; }
.pd-cta-wa:hover { background: #1eb858; }
.pd-cta-call { background: #fff; color: #111827; border: 1.5px solid #111827; }
.pd-cta-call:hover { background: #111827; color: #fff; }
.pd-cta-stack { display: flex; flex-direction: column; gap: 10px; }

.pd-share { display: flex; gap: 10px; }
.pd-share-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid #E2E8F0; color: #475569; border-radius: 12px; padding: 11px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
.pd-share-btn:hover { border-color: #667EEA; color: #667EEA; }
.pd-share-icon { flex: 0 0 auto; width: 46px; }

/* Similar */
.pd-similar { margin-top: 8px; }
.pd-similar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (min-width: 768px) { .pd-similar-grid { grid-template-columns: 1fr 1fr 1fr; } }

/* Mobile sticky contact bar */
.pd-mobilebar { display: none; }
@media (max-width: 1023px) {
  .pd-mobilebar { display: flex; gap: 10px; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: #fff; border-top: 1px solid #EEF1F5; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); box-shadow: 0 -6px 20px rgba(15,23,42,0.08); }
}
.pd-mobilebar .pd-cta { height: 48px; }
`;

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

  // ── Report listing ──
  const REPORT_REASONS = ["معلومات غير صحيحة", "إعلان مكرر", "العقار غير متاح / مباع", "سعر غير صحيح", "صور مضللة", "احتيال أو نصب", "أخرى"];
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportState, setReportState] = useState<"idle" | "sending" | "done" | "error">("idle");

  function openReport() { setReportReason(""); setReportNote(""); setReportState("idle"); setReportOpen(true); }
  async function submitReport() {
    if (!reportReason) return;
    setReportState("sending");
    try {
      const res = await fetch(`${BASE}/api/properties/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, note: reportNote }),
      });
      if (!res.ok) throw new Error();
      setReportState("done");
    } catch { setReportState("error"); }
  }

  // Dynamic page title + meta description for SEO / sharing
  useEffect(() => {
    if (!property) return;

    const DEFAULT_TITLE = "فايند - منصة العقارات";
    const titlePart = property.titleAr || "عقار";
    const pricePart = property.price != null
      ? ` - ${property.price.toLocaleString("en-US")} د.ك`
      : "";
    document.title = `${titlePart}${pricePart} | فايند`;

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    let createdMeta = false;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
      createdMeta = true;
    }
    const prevDesc = metaDesc.getAttribute("content") ?? "";
    if (property.descriptionAr) {
      const raw = property.descriptionAr.replace(/\s+/g, " ").trim();
      const desc = raw.length > 150 ? raw.slice(0, 150).trimEnd() + "…" : raw;
      metaDesc.setAttribute("content", desc);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (createdMeta) {
        metaDesc?.parentNode?.removeChild(metaDesc);
      } else if (metaDesc) {
        metaDesc.setAttribute("content", prevDesc);
      }
    };
  }, [property]);

  if (isLoading) {
    return (
      <MainLayout>
        <style>{styles}</style>
        <div dir="rtl" className="pd-page">
          <div className="pd-container space-y-6">
            <Skeleton className="rounded-2xl" style={{ height: 400 }} />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <style>{styles}</style>
        <div dir="rtl" className="pd-page">
          <div className="pd-container" style={{ textAlign: "center", padding: "96px 16px", color: "#64748B" }}>
            <p style={{ fontSize: 24 }}>العقار غير موجود</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images.map((img) => img.url)
    : property.primaryImage
    ? [property.primaryImage]
    : [];
  const videoUrl = (property as unknown as { videoUrl?: string | null }).videoUrl ?? null;

  const propertyUrl = typeof window !== "undefined" ? window.location.href : "";
  const statusColor = STATUS_COLORS[property.status] ?? "#64748B";

  const handleWhatsApp = () => {
    trackInteraction(property.officeId!, property.id, "whatsapp", "property_page");
    window.open(buildWhatsAppUrl(property.office!.whatsapp!, property.titleAr, propertyUrl), "_blank");
  };
  const handleCall = () => {
    trackInteraction(property.officeId!, property.id, "call", "property_page");
    window.open(`tel:${property.office!.phone}`, "_blank");
  };

  return (
    <MainLayout>
      <style>{styles}</style>
      <div dir="rtl" className="pd-page">
        <div className="pd-container">
          {/* Breadcrumb */}
          <nav className="pd-breadcrumb">
            <a href={`${BASE}/`}><Home size={14} /> الرئيسية</a>
            <span className="pd-bc-sep">/</span>
            <a href="/properties">العقارات</a>
            <span className="pd-bc-sep">/</span>
            <span className="pd-bc-current">{property.titleAr}</span>
          </nav>

          {/* Search navigation */}
          {hasSearchContext && (
            <div className="pd-searchnav">
              <button className="pd-navbtn" disabled={!prevId} onClick={() => prevId && navigate(`/properties/${prevId}`)}>
                <ChevronRight size={16} />
                السابق
              </button>
              <span className="pd-navcount">{currentIndex + 1} / {searchIds.length}</span>
              <button className="pd-navbtn" disabled={!nextId} onClick={() => nextId && navigate(`/properties/${nextId}`)}>
                التالي
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          <div className="pd-grid">
            {/* Main column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Gallery */}
              <div>
                <div className="pd-gallery">
                  {images.length > 0 ? (
                    <>
                      <img src={images[imgIndex]} alt={property.titleAr} className="pd-gallery-img" data-testid="property-image" />
                      {images.length > 1 && (
                        <>
                          <button className="pd-gnav pd-gnav-prev" aria-label="السابق"
                            onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}>
                            <ChevronRight size={20} />
                          </button>
                          <button className="pd-gnav pd-gnav-next" aria-label="التالي"
                            onClick={() => setImgIndex((i) => (i + 1) % images.length)}>
                            <ChevronLeft size={20} />
                          </button>
                          <div className="pd-gcount">{imgIndex + 1} / {images.length}</div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="pd-gallery-ph">
                      <Building2 size={64} color="rgba(255,255,255,0.35)" />
                    </div>
                  )}
                  <div className="pd-badges">
                    <span className="pd-badge" style={{ background: statusColor }}>{property.status}</span>
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="pd-thumbs">
                    {images.map((src, i) => (
                      <button key={i} className={`pd-thumb${i === imgIndex ? " active" : ""}`} onClick={() => setImgIndex(i)} aria-label={`صورة ${i + 1}`}>
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
                {videoUrl && (
                  <div className="pd-video">
                    <video src={videoUrl} controls preload="metadata" />
                  </div>
                )}
              </div>

              {/* Header: price, title, location, specs */}
              <div className="pd-card pd-head">
                <div className="pd-head-top">
                  <div style={{ minWidth: 0 }}>
                    <span className="pd-badge" style={{ background: statusColor, display: "inline-block" }}>{property.status}</span>
                    {property.type && <span style={{ marginRight: 8, fontSize: 13, fontWeight: 600, color: "#64748B" }}>{property.type}</span>}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div className="pd-price" data-testid="property-price">
                      {property.price.toLocaleString("en-US")}<span className="pd-cur">د.ك</span>
                    </div>
                    {property.status === "للإيجار" && <span className="pd-price-sub">/ شهرياً</span>}
                  </div>
                </div>

                <h1 className="pd-title">{property.titleAr}</h1>
                <div className="pd-loc">
                  <MapPin size={16} color="#667EEA" />
                  <span>{[property.governorateName, property.areaName].filter(Boolean).join("، ")}</span>
                </div>

                {(property.areaName || property.governorateName) && (
                  <a
                    className="pd-maplink"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [property.areaName, property.governorateName, "الكويت"].filter(Boolean).join("، ")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Map size={16} />
                    الموقع على الخريطة
                  </a>
                )}

                <div className="pd-specs">
                  {property.bedrooms != null && (
                    <div className="pd-spec"><Bed size={17} /> {property.bedrooms} غرف</div>
                  )}
                  {property.bathrooms != null && (
                    <div className="pd-spec"><Bath size={17} /> {property.bathrooms} حمامات</div>
                  )}
                  {property.area != null && (
                    <div className="pd-spec"><Square size={17} /> {property.area} م²</div>
                  )}
                  {property.type && (
                    <div className="pd-spec"><Home size={17} /> {property.type}</div>
                  )}
                  {property.furnished && (
                    <div className="pd-spec"><Check size={17} /> {property.furnished}</div>
                  )}
                </div>

                {property.referenceId && (
                  <div className="pd-ref">رقم المرجع: {property.referenceId}</div>
                )}
              </div>

              {/* Description */}
              {property.descriptionAr && (
                <div className="pd-card pd-sec">
                  <h2 className="pd-sec-title">الوصف</h2>
                  <p className="pd-desc">{property.descriptionAr}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="pd-card pd-sec">
                  <h2 className="pd-sec-title">المميزات</h2>
                  <div className="pd-amen">
                    {property.amenities.map((amenity, i) => (
                      <div key={i} className="pd-amen-item">
                        <span className="pd-amen-check"><Check size={14} /></span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar — only when not in search context */}
              {!hasSearchContext && (similar ?? []).length > 0 && (
                <div className="pd-similar">
                  <h2 className="pd-sec-title">عقارات مشابهة</h2>
                  <div className="pd-similar-grid">
                    {(similar ?? []).map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="pd-side">
              {property.office && (
                <div className="pd-card pd-office">
                  <a href={`/${property.office.slug}`} style={{ textDecoration: "none" }}>
                    <div className="pd-office-head">
                      <LogoImg
                        src={property.office.logo}
                        alt={property.office.nameAr}
                        className="pd-office-logo"
                        fallback={<div className="pd-office-logo-ph"><Building2 size={26} color="#fff" /></div>}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="pd-office-name">{property.office.nameAr}</div>
                        {property.office.governorateName && (
                          <div className="pd-office-gov">{property.office.governorateName}</div>
                        )}
                      </div>
                    </div>
                  </a>

                  <div className="pd-cta-stack">
                    {property.office.phone && (
                      <button className="pd-cta pd-cta-call" data-testid="button-call" onClick={handleCall}>
                        <Phone size={18} /> اتصال
                      </button>
                    )}
                    {property.office.whatsapp && (
                      <button className="pd-cta pd-cta-wa" data-testid="button-whatsapp" onClick={handleWhatsApp}>
                        <MessageCircle size={18} /> واتساب
                      </button>
                    )}
                    <a href={`/${property.office.slug}`} className="pd-office-link">عرض كل عقارات المكتب</a>
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="pd-share">
                <button className="pd-share-btn" data-testid="button-share"
                  onClick={() => navigator.share?.({ url: window.location.href, title: property.titleAr })}>
                  <Share2 size={16} /> مشاركة
                </button>
                <button className="pd-share-btn pd-share-icon" data-testid="button-report" aria-label="إبلاغ" onClick={openReport}>
                  <Flag size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky contact bar */}
      {property.office && (property.office.phone || property.office.whatsapp) && (
        <div className="pd-mobilebar" dir="rtl">
          {property.office.phone && (
            <button className="pd-cta pd-cta-call" style={{ flex: 1 }} onClick={handleCall} aria-label="اتصال">
              <Phone size={18} /> اتصال
            </button>
          )}
          {property.office.whatsapp && (
            <button className="pd-cta pd-cta-wa" style={{ flex: 1 }} onClick={handleWhatsApp} aria-label="واتساب">
              <MessageCircle size={18} /> واتساب
            </button>
          )}
        </div>
      )}

      {/* Report dialog */}
      {reportOpen && (
        <div
          dir="rtl"
          onClick={() => setReportOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Cairo', sans-serif" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, padding: 22, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(15,23,42,0.3)", maxHeight: "90vh", overflowY: "auto" }}
          >
            {reportState === "done" ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Check size={28} style={{ color: "#059669" }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>تم استلام بلاغك</h3>
                <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 18px", lineHeight: 1.7 }}>شكرًا لك، سيقوم فريق المنصة بمراجعة البلاغ.</p>
                <button onClick={() => setReportOpen(false)} style={{ background: "#667EEA", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>تم</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Flag size={18} style={{ color: "#EF4444" }} />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>الإبلاغ عن الإعلان</h3>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px", lineHeight: 1.7 }}>اختر سبب الإبلاغ وسيصل إلى فريق المنصة للمراجعة.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      style={{
                        textAlign: "right", padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${reportReason === r ? "#667EEA" : "#E2E8F0"}`,
                        background: reportReason === r ? "#EEF2FE" : "#fff",
                        color: reportReason === r ? "#3730A3" : "#334155",
                        fontWeight: reportReason === r ? 700 : 600, fontSize: 14, fontFamily: "inherit", transition: "all .12s",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="تفاصيل إضافية (اختياري)"
                  rows={3}
                  maxLength={500}
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", resize: "vertical", outline: "none", marginBottom: 14, color: "#111827" }}
                />
                {reportState === "error" && (
                  <p style={{ color: "#EF4444", fontSize: 13, margin: "0 0 12px" }}>حدث خطأ، حاول مرة أخرى.</p>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={submitReport}
                    disabled={!reportReason || reportState === "sending"}
                    style={{ flex: 1, background: !reportReason ? "#C7D2FE" : "#EF4444", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14.5, cursor: !reportReason || reportState === "sending" ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    {reportState === "sending" ? "جارٍ الإرسال..." : "إرسال البلاغ"}
                  </button>
                  <button
                    onClick={() => setReportOpen(false)}
                    style={{ background: "#fff", color: "#64748B", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 18px", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
