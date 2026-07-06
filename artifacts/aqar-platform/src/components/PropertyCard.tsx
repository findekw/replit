import { Property } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Bed, Bath, Maximize2, MapPin, Building2, Heart } from "lucide-react";

interface PropertyCardProps {
  property: Property;
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

export function PropertyCard({ property }: PropertyCardProps) {
  const location = [property.governorateName, property.areaName].filter(Boolean).join("، ");
  const isNew = !!property.createdAt && Date.now() - new Date(property.createdAt).getTime() < 24 * 60 * 60 * 1000;
  const officeName = (property as { officeName?: string | null }).officeName ?? null;
  const officeLogo = (property as { officeLogo?: string | null }).officeLogo ?? null;

  const [saved, setSaved] = useState<boolean>(() => readSaved().includes(property.id));

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list = readSaved();
    const next = list.includes(property.id) ? list.filter((i) => i !== property.id) : [...list, property.id];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
    setSaved(next.includes(property.id));
  }

  return (
    <Link href={`/properties/${property.id}`} className="block">
      <article className="property-card">
        {/* Media */}
        <div className="property-media">
          {property.primaryImage ? (
            <img className="property-img" src={property.primaryImage} alt={property.titleAr} loading="lazy" />
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

          <button type="button" className={`property-save${saved ? " on" : ""}`} onClick={toggleSave} aria-label="حفظ" title={saved ? "إزالة من المحفوظات" : "حفظ"}>
            <Heart className="h-[18px] w-[18px]" style={{ fill: saved ? "#EF4444" : "transparent" }} />
          </button>
        </div>

        {/* Body */}
        <div className="property-body">
          <div className="property-price">
            {property.price.toLocaleString("en-US")}<span className="property-cur">د.ك{property.status === "للإيجار" ? " / شهري" : ""}</span>
          </div>

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

          {officeName && (
            <div className="property-agency">
              <span className="property-agency-logo">
                {officeLogo ? <img src={officeLogo} alt="" /> : <Building2 className="w-3.5 h-3.5" style={{ color: "#64748B" }} />}
              </span>
              <span className="property-agency-name">{officeName}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
