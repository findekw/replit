import { Property } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Bed, Bath, Maximize2, MapPin, Building2, Heart, Clock, Eye, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";

interface PropertyCardProps {
  property: Property;
  /** "list" lays the card out as a horizontal row on wider screens so the
      image doesn't blow up to full width. Defaults to the vertical grid card. */
  layout?: "grid" | "list";
}

const STATUS_BG: Record<string, string> = {
  "للإيجار": "#667EEA",
  "للبيع":   "#111827",
  "للبدل":   "#EA580C",
};

const SAVED_KEY = "finde_saved";

function readSaved(): number[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

export function PropertyCard({ property, layout = "grid" }: PropertyCardProps) {
  const location = [property.governorateName, property.areaName].filter(Boolean).join("، ");
  const isNew = !!property.createdAt && Date.now() - new Date(property.createdAt).getTime() < 24 * 60 * 60 * 1000;

  const [saved, setSaved] = useState<boolean>(() => readSaved().includes(property.id));

  // Gallery: the list endpoint may send a full `images` array; fall back to the
  // single primaryImage. One image → no arrows; more than one → carousel arrows.
  const gallery: string[] = (() => {
    const imgs = (property as { images?: (string | { url?: string })[] }).images;
    const urls = Array.isArray(imgs)
      ? imgs.map((i) => (typeof i === "string" ? i : i?.url)).filter((u): u is string => !!u)
      : [];
    if (urls.length) return urls;
    return property.primaryImage ? [property.primaryImage] : [];
  })();
  const [imgIndex, setImgIndex] = useState(0);
  const hasCarousel = gallery.length > 1;

  function step(e: React.MouseEvent, dir: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i + dir + gallery.length) % gallery.length);
  }

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list = readSaved();
    const next = list.includes(property.id) ? list.filter((i) => i !== property.id) : [...list, property.id];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
    setSaved(next.includes(property.id));
  }

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${property.id}`;
    try {
      if (navigator.share) await navigator.share({ title: property.titleAr, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* user dismissed the share sheet — ignore */ }
  }

  return (
    <Link href={`/properties/${property.id}`} className="block">
      <article className={`property-card${layout === "list" ? " property-card--list" : ""}`}>
        {/* Media */}
        <div className="property-media">
          {gallery.length ? (
            <img className="property-img" src={gallery[imgIndex]} alt={property.titleAr} loading="lazy" />
          ) : (
            <div className="property-img-fallback">
              <Building2 className="h-9 w-9" style={{ color: "rgba(255,255,255,0.45)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{property.type}</span>
            </div>
          )}

          <div className="property-badges">
            <span className="property-badge" style={{ background: STATUS_BG[property.status] ?? "#475569" }}>{property.status}</span>
            {isNew && <span className="property-badge" style={{ background: "#059669" }}>جديد</span>}
          </div>

          {/* Save + share, grouped top-start */}
          <div className="property-actions">
            <button type="button" className={`property-iconbtn${saved ? " on" : ""}`} onClick={toggleSave} aria-label="حفظ" title={saved ? "إزالة من المحفوظات" : "حفظ"}>
              <Heart className="h-[18px] w-[18px]" style={{ fill: saved ? "#EF4444" : "transparent" }} />
            </button>
            <button type="button" className="property-iconbtn" onClick={share} aria-label="مشاركة" title="مشاركة">
              <Share2 className="h-[17px] w-[17px]" />
            </button>
          </div>

          {/* Carousel arrows — only when there's more than one image */}
          {hasCarousel && (
            <>
              <button type="button" className="property-nav property-nav-prev" onClick={(e) => step(e, -1)} aria-label="السابق">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button type="button" className="property-nav property-nav-next" onClick={(e) => step(e, 1)} aria-label="التالي">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="property-dots">
                {gallery.map((_, i) => <span key={i} className={i === imgIndex ? "on" : ""} />)}
              </div>
            </>
          )}
        </div>

        {/* Body — title, then location, specs, price, and posted-time + views */}
        <div className="property-body">
          <h3 className="property-title">{property.titleAr}</h3>

          {location && (
            <div className="property-loc">
              <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span className="property-loc-txt">{location}</span>
            </div>
          )}

          {(property.bedrooms || property.bathrooms || property.area) && (
            <div className="property-specs">
              {property.bedrooms ? <span className="property-spec"><Bed className="w-4 h-4" />{property.bedrooms}</span> : null}
              {property.bathrooms ? <span className="property-spec"><Bath className="w-4 h-4" />{property.bathrooms}</span> : null}
              {property.area ? <span className="property-spec"><Maximize2 className="w-4 h-4" />{property.area} م²</span> : null}
            </div>
          )}

          <div className="property-price">
            {property.price.toLocaleString("en-US")}<span className="property-cur">د.ك{property.status === "للإيجار" ? " / شهري" : ""}</span>
          </div>

          {/* Posted-time + views */}
          <div className="property-meta">
            {property.createdAt && (
              <span className="property-meta-item">
                <Clock style={{ width: 13, height: 13 }} />
                {timeAgo(property.createdAt)}
              </span>
            )}
            <span className="property-meta-item">
              <Eye style={{ width: 13, height: 13 }} />
              {((property as { views?: number }).views ?? 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
