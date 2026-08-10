import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProperty, useGetSimilarProperties } from "@workspace/api-client-react";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { LogoImg } from "@/components/LogoImg";
import PhoneField from "@/components/PhoneField";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, Phone, Check, Share2, Flag, ChevronLeft, ChevronRight, Building2, Home, Clock, X, ImageOff } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { timeAgo } from "@/lib/timeAgo";
import { getGetPropertyQueryKey } from "@workspace/api-client-react";
import { trackInteraction } from "@/lib/trackInteraction";
import { toIntlPhone } from "@/lib/phone";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const STATUS_COLORS: Record<string, string> = {
  "للإيجار": "#667EEA",
  "للبيع": "#667EEA",
  "للبدل": "#f97316",
};

function buildWhatsAppUrl(whatsapp: string, title: string, propertyUrl: string) {
  const msg = `السلام عليكم، ممكن ترسل تفاصيل هذا الإعلان في فايند وشكراً\n${title}\n${propertyUrl}`;
  return `https://wa.me/${toIntlPhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
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

/* minmax(0,1fr), never bare 1fr: a grid item's implicit min-width is its
   content, so the intrinsic width of a large photo blew the column out to
   ~471px on a 375px phone — the whole page (image included) ran past the
   screen edge. That was the client's "أروح يمين" pan and, after overflow-x
   became clip, his cut-off "مش ظاهر كامل" photo. min-width:0 on the items
   guards the same blowout from any future child (tables, long words, videos). */
.pd-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
.pd-grid > * { min-width: 0; }
@media (min-width: 1024px) { .pd-grid { grid-template-columns: minmax(0, 1fr) 360px; align-items: start; } }

.pd-card { background: #fff; border: 1px solid #EEF1F5; border-radius: 18px; box-shadow: 0 6px 20px rgba(15,23,42,0.06); }

/* Gallery */
/* Fixed-frame gallery: every image sits in the same box (so switching between a
   tall and a wide photo never changes the height) and is shown WHOLE via
   object-fit contain — no cropping. A blurred, zoomed copy of the same photo
   fills the leftover space behind it instead of dark bars, which is what used to
   make portrait uploads look tiny. Uniform height + full image + no bars. */
/* aspect-ratio is set inline per image (imgAspect) so the frame fits each photo;
   max-height keeps a very tall portrait from dominating the page. */
.pd-gallery { position: relative; border-radius: 18px; overflow: hidden; background: #111827; aspect-ratio: 16 / 10; max-height: 78vh; }
.pd-gallery-img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-gallery-bg  { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(18px) brightness(0.7); transform: scale(1.15); }
.pd-gallery-ph { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center; background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); }
.pd-gallery-ph-badge { width: 60px; height: 60px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; color: #94A3B8; box-shadow: 0 4px 14px rgba(15,23,42,0.08); }
.pd-gallery-ph span { font-size: 14px; font-weight: 600; color: #94A3B8; }
.pd-gnav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 42px; height: 42px; border-radius: 50%; border: none; background: rgba(15,23,42,0.55); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: background .15s; }
.pd-gnav:hover { background: rgba(15,23,42,0.8); }
.pd-gnav-prev { right: 14px; }
.pd-gnav-next { left: 14px; }
.pd-gcount { position: absolute; bottom: 14px; left: 14px; z-index: 2; background: rgba(15,23,42,0.6); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; backdrop-filter: blur(4px); }
.pd-badges { position: absolute; top: 14px; right: 14px; z-index: 2; display: flex; gap: 8px; }
.pd-badge { color: #fff; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; box-shadow: 0 2px 8px rgba(15,23,42,0.2); }
.pd-badge-featured { background: #f59e0b; }
/* Mobile position indicator — a thin track with a segment that slides to the
   current image. Hidden on desktop (arrows + counter are enough there). */
.pd-progress { display: none; position: absolute; z-index: 2; left: 50%; bottom: 13px; transform: translateX(-50%); direction: ltr; width: 108px; height: 3px; border-radius: 999px; background: rgba(255,255,255,0.28); overflow: hidden; }
.pd-progress > span { display: block; height: 100%; border-radius: 999px; background: #fff; transition: transform .25s ease; }
/* Mobile: a full-screen-style gallery (client ask) — every image shown WHOLE on
   a uniform SOLID dark background (no per-image blurred fill, so there's no
   visible difference between images), with the controls collected into a bottom
   bar: arrows at the corners, counter centered above a position indicator.
   Placed AFTER the base rules above so it wins at equal specificity. */
@media (max-width: 1023px) {
  .pd-gallery { aspect-ratio: 4 / 5; background: #0B1120; }
  .pd-gallery-bg { display: none; }                 /* solid dark instead of blur */
  .pd-gnav { top: auto; bottom: 12px; transform: none; width: 38px; height: 38px; background: rgba(15,23,42,0.72); }
  .pd-gcount { left: 50%; right: auto; bottom: 24px; transform: translateX(-50%); }
  .pd-progress { display: block; }
}

.pd-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 4px; }
.pd-thumb { flex: 0 0 auto; width: 92px; height: 64px; border-radius: 12px; overflow: hidden; border: 2px solid transparent; cursor: pointer; padding: 0; background: #111827; transition: border-color .15s; }
.pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-thumb.active { border-color: #667EEA; }
.pd-video { margin-top: 14px; border-radius: 16px; overflow: hidden; background: #0F172A; border: 1px solid #EEF1F5; }
.pd-video video { width: 100%; max-height: 460px; display: block; background: #0F172A; }

/* Fullscreen image viewer (lightbox) */
.pd-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(3,7,18,0.96); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; animation: pd-lb-in .18s ease; }
@keyframes pd-lb-in { from { opacity: 0; } to { opacity: 1; } }
.pd-lb-close { position: absolute; top: 16px; inset-inline-end: 16px; z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer; background: rgba(255,255,255,0.14); color: #fff; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.pd-lb-close:hover { background: rgba(255,255,255,0.28); }
.pd-lb-stage { position: relative; flex: 1; width: 100%; max-width: 1100px; display: flex; align-items: center; justify-content: center; min-height: 0; }
.pd-lb-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 8px; display: block; user-select: none; }
.pd-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer; background: rgba(255,255,255,0.14); color: #fff; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.pd-lb-nav:hover { background: rgba(255,255,255,0.3); }
.pd-lb-prev { inset-inline-end: 8px; }
.pd-lb-next { inset-inline-start: 8px; }
.pd-lb-count { color: #fff; font-size: 14px; font-weight: 600; margin-top: 12px; letter-spacing: .5px; }
.pd-lb-thumbs { display: flex; gap: 8px; margin-top: 12px; max-width: 100%; overflow-x: auto; padding: 4px; }
.pd-lb-thumb { flex: 0 0 auto; width: 64px; height: 48px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: pointer; padding: 0; background: #111827; opacity: .55; transition: opacity .15s, border-color .15s; }
.pd-lb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-lb-thumb.active { border-color: #fff; opacity: 1; }
@media (max-width: 640px) {
  .pd-lb-nav { width: 40px; height: 40px; }
  .pd-lb-thumb { width: 54px; height: 40px; }
}

/* Header card */
.pd-head { padding: 24px; }
.pd-head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pd-price { font-size: 30px; font-weight: 900; color: #111827; white-space: nowrap; line-height: 1.1; }
.pd-price .pd-cur { font-size: 18px; font-weight: 700; color: #667EEA; margin-right: 4px; }
.pd-price-sub { font-size: 13px; color: #64748B; font-weight: 600; }
.pd-title { font-size: 22px; font-weight: 800; color: #111827; margin: 14px 0 8px; line-height: 1.4; }
.pd-loc { display: flex; align-items: center; gap: 6px; color: #64748B; font-size: 14px; }
.pd-date { display: flex; align-items: center; gap: 6px; color: #94A3B8; font-size: 13px; margin-top: 7px; }
.pd-ref { font-size: 12px; color: #94A3B8; margin-top: 10px; }


.pd-specs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid #EEF1F5; }
.pd-spec { display: flex; align-items: center; gap: 7px; background: #F5F7FA; border: 1px solid #EEF1F5; border-radius: 12px; padding: 9px 14px; font-size: 14px; font-weight: 600; color: #111827; }
.pd-spec svg { color: #667EEA; }

.pd-sec { padding: 24px; }
.pd-sec-title { font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 14px; }
.pd-desc { color: #475569; line-height: 2; font-size: 15px; white-space: pre-line; }

.pd-amen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 640px) { .pd-amen { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
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
.pd-cta-call { background: #667EEA; color: #fff; }
.pd-cta-call:hover { background: #5568d8; }
.pd-cta-stack { display: flex; flex-direction: column; gap: 10px; }

.pd-share { display: flex; gap: 10px; }
.pd-share-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid #E2E8F0; color: #475569; border-radius: 12px; padding: 11px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
.pd-share-btn:hover { border-color: #667EEA; color: #667EEA; }
.pd-share-icon { flex: 0 0 auto; width: 46px; }

/* Similar */
.pd-similar { margin-top: 8px; }
.pd-similar-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (min-width: 768px) { .pd-similar-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

/* Mobile sticky contact bar */
.pd-mobilebar { display: none; }
@media (max-width: 1023px) {
  /* Sticky (not fixed): the bar floats at the viewport bottom while scrolling,
     then rests in its natural place — just above the footer — when the page end
     is reached. Native, smooth, and never overlaps the footer. */
  .pd-mobilebar { display: flex; gap: 10px; position: sticky; bottom: 0; z-index: 50; background: #fff; border-top: 1px solid #EEF1F5; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); box-shadow: 0 -6px 20px rgba(15,23,42,0.08); }
  /* On mobile the sticky bar is the single contact CTA — hide the sidebar's
     call/whatsapp buttons so contact isn't shown twice (top + bottom). */
  .pd-cta-stack .pd-cta { display: none; }
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
  const touchStartX = useRef<number | null>(null); // gallery swipe origin
  // The gallery frame adapts to the current image's shape (clamped) so every
  // image fills it — no letterbox gaps and nothing cropped. Landscape → wide
  // frame, portrait → tall frame.
  const [imgAspect, setImgAspect] = useState(1.6);
  const onGalleryImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget;
    if (im.naturalWidth && im.naturalHeight) {
      const r = im.naturalWidth / im.naturalHeight;
      setImgAspect(Math.min(1.9, Math.max(0.72, r)));
    }
  };
  const [lightboxOpen, setLightboxOpen] = useState(false); // fullscreen viewer

  // While the fullscreen viewer is open, lock the page scroll and let Escape close it.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); };
  }, [lightboxOpen]);

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

  // Touch swipe for the mobile gallery: swipe left → next, swipe right → prev.
  function onGalleryTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onGalleryTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || images.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (dx < -40) setImgIndex((i) => (i + 1) % images.length);
    else if (dx > 40) setImgIndex((i) => (i - 1 + images.length) % images.length);
    touchStartX.current = null;
  }

  const propertyUrl = typeof window !== "undefined" ? window.location.href : "";
  const statusColor = STATUS_COLORS[property.status] ?? "#64748B";

  // Contact numbers prefer the listing's own (set per ad), falling back to the
  // office's numbers for legacy listings created before per-listing contact.
  const contactWhatsapp: string | null = (property as any).whatsapp ?? property.office?.whatsapp ?? null;
  const contactPhone: string | null = (property as any).phone ?? property.office?.phone ?? null;

  const handleWhatsApp = () => {
    trackInteraction(property.officeId!, property.id, "whatsapp", "property_page");
    window.open(buildWhatsAppUrl(contactWhatsapp!, property.titleAr, propertyUrl), "_blank");
  };
  const handleCall = () => {
    trackInteraction(property.officeId!, property.id, "call", "property_page");
    window.open(`tel:+${toIntlPhone(contactPhone)}`, "_blank");
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
                <div className="pd-gallery" style={{ aspectRatio: images.length ? String(imgAspect) : "16 / 7" }} onTouchStart={onGalleryTouchStart} onTouchEnd={onGalleryTouchEnd}>
                  {images.length > 0 ? (
                    <>
                      {/* The frame matches the image's shape (see imgAspect), so the
                          image fills it exactly — no letterbox gaps, nothing cropped. */}
                      <img src={images[imgIndex]} alt={property.titleAr} className="pd-gallery-img" data-testid="property-image" onLoad={onGalleryImgLoad}
                        style={{ cursor: "zoom-in" }} onClick={() => setLightboxOpen(true)} />
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
                          {/* Mobile position indicator (hidden on desktop via CSS) */}
                          <div className="pd-progress" aria-hidden="true">
                            <span style={{ width: `${100 / images.length}%`, transform: `translateX(${imgIndex * 100}%)` }} />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="pd-gallery-ph">
                      <div className="pd-gallery-ph-badge"><ImageOff size={26} strokeWidth={1.75} /></div>
                      <span>لا توجد صورة لهذا الإعلان</span>
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
                {property.createdAt && (
                  <div className="pd-date">
                    <Clock size={15} />
                    <span>{timeAgo(property.createdAt)}</span>
                  </div>
                )}

                <div className="pd-specs">
                  {property.bedrooms != null && (
                    <div className="pd-spec"><Bed size={17} /> {Number(property.bedrooms) >= 6 ? "+5" : property.bedrooms} غرف</div>
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
                    {contactWhatsapp && (
                      <button className="pd-cta pd-cta-wa" data-testid="button-whatsapp" onClick={handleWhatsApp}>
                        <WhatsAppIcon size={18} /> واتساب
                      </button>
                    )}
                    {contactPhone && (
                      <button className="pd-cta pd-cta-call" data-testid="button-call" onClick={handleCall}>
                        <Phone size={18} /> اتصال
                      </button>
                    )}
                    <a href={`/${property.office.slug}`} className="pd-office-link">عرض كل عقارات المكتب</a>
                  </div>
                </div>
              )}

              {/* Interested-visitor capture — feeds the office CRM directly */}
              <InterestForm propertyId={property.id} />

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
      {(contactPhone || contactWhatsapp) && (
        <div className="pd-mobilebar" dir="rtl">
          {contactWhatsapp && (
            <button className="pd-cta pd-cta-wa" style={{ flex: 1 }} onClick={handleWhatsApp} aria-label="واتساب">
              <WhatsAppIcon size={18} /> واتساب
            </button>
          )}
          {contactPhone && (
            <button className="pd-cta pd-cta-call" style={{ flex: 1 }} onClick={handleCall} aria-label="اتصال">
              <Phone size={18} /> اتصال
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

      {/* Fullscreen image viewer (lightbox) — opens on tapping a gallery photo */}
      {lightboxOpen && images.length > 0 && (
        <div className="pd-lb" onClick={() => setLightboxOpen(false)}>
          <button className="pd-lb-close" aria-label="إغلاق" onClick={() => setLightboxOpen(false)}>
            <X size={22} />
          </button>
          <div
            className="pd-lb-stage"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onGalleryTouchStart}
            onTouchEnd={onGalleryTouchEnd}
          >
            <img src={images[imgIndex]} alt={property.titleAr} className="pd-lb-img" />
            {images.length > 1 && (
              <>
                <button className="pd-lb-nav pd-lb-prev" aria-label="السابق"
                  onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}>
                  <ChevronRight size={26} />
                </button>
                <button className="pd-lb-nav pd-lb-next" aria-label="التالي"
                  onClick={() => setImgIndex((i) => (i + 1) % images.length)}>
                  <ChevronLeft size={26} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="pd-lb-count" onClick={(e) => e.stopPropagation()}>{imgIndex + 1} / {images.length}</div>
          )}
          {images.length > 1 && (
            <div className="pd-lb-thumbs" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button key={i} className={`pd-lb-thumb${i === imgIndex ? " active" : ""}`} onClick={() => setImgIndex(i)} aria-label={`صورة ${i + 1}`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}

/**
 * "أنا مهتم" — the visitor leaves name + phone and lands straight in the
 * office's CRM (عملائي) as a lead with source "من صفحة الإعلان". No account
 * needed: asking a buyer to register first is where interest goes to die.
 */
function InterestForm({ propertyId }: { propertyId: number }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("اكتب اسمك"); return; }
    if (phone.trim().length !== 8) { setError("اكتب رقم هاتف صحيح (8 أرقام)"); return; }
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, customerName: name.trim(), phone: phone.trim(), message: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "تعذّر الإرسال، حاول مرة أخرى"); return; }
      setDone(true);
    } catch {
      setError("تعذّر الاتصال، تحقق من الإنترنت");
    } finally {
      setSending(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #E2E8F0",
    padding: "0 12px", fontSize: 14, fontFamily: "'Cairo',sans-serif", outline: "none", background: "#fff",
  };

  return (
    <div className="pd-card" style={{ padding: 18, marginTop: 16 }}>
      {done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <Check size={24} color="#059669" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>تم إرسال طلبك</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>سيتواصل معك المكتب قريباً</div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "#111827", marginBottom: 4 }}>مهتم بهذا العقار؟</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 12 }}>اترك بياناتك وسيتواصل معك المكتب مباشرة</div>
          <div style={{ display: "grid", gap: 9 }}>
            <input style={input} placeholder="اسمك" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
            <PhoneField value={phone} onChange={(v) => { setPhone(v); setError(""); }} />
            <input style={input} placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <div style={{ fontSize: 12.5, color: "#b91c1c", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "7px 11px", marginTop: 9 }}>{error}</div>}
          <button
            type="submit"
            disabled={sending}
            style={{
              width: "100%", height: 44, marginTop: 11, borderRadius: 11, border: "none",
              background: "#667EEA", color: "#fff", fontWeight: 800, fontSize: 14.5,
              cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1, fontFamily: "'Cairo',sans-serif",
            }}
          >
            {sending ? "جارٍ الإرسال..." : "أنا مهتم — تواصلوا معي"}
          </button>
        </form>
      )}
    </div>
  );
}
