import { Property } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Bed, Bath, Square, MapPin, Building2 } from "lucide-react";

interface PropertyCardProps {
  property: Property;
}

const STATUS_BG: Record<string, string> = {
  "للإيجار": "#4f6fad",
  "للبيع":   "#3F5BD8",
  "للبدل":   "#f97316",
};

export function PropertyCard({ property }: PropertyCardProps) {
  const location = [property.governorateName, property.areaName].filter(Boolean).join("، ");

  const isNew =
    !!property.createdAt &&
    Date.now() - new Date(property.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <Link href={`/properties/${property.id}`} className="block">
      <div
        className="property-card"
        style={property.featured ? { border: "1.5px solid #bfdbfe" } : undefined}
      >
        {/* Image */}
        <div className="property-image">
          {property.primaryImage ? (
            <img src={property.primaryImage} alt={property.titleAr} loading="lazy" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1F2A44 0%, #3F5BD8 100%)" }}
            >
              <Building2 className="h-10 w-10 text-white/40" />
              <span className="text-xs text-white/50">{property.type}</span>
            </div>
          )}

          {/* Badges — top left */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, zIndex: 2 }}>
            <span className="property-badge" style={{ background: STATUS_BG[property.status] ?? "#6b7280" }}>
              {property.status}
            </span>
            {property.featured && (
              <span className="property-badge" style={{ background: "#3F5BD8" }}>مميز</span>
            )}
            {isNew && !property.featured && (
              <span className="property-badge" style={{ background: "#10b981" }}>جديد</span>
            )}
          </div>

          {/* Price pill — bottom right */}
          <div className="property-price">
            {property.price.toLocaleString("en-US")} <span style={{ fontSize: 11, fontWeight: 500 }}>KWD</span>
          </div>
        </div>

        {/* Content */}
        <div className="property-content">
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: 500 }}>{property.type}</div>
          <h3 className="property-title">{property.titleAr}</h3>

          {location && (
            <div className="property-location">
              <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
            </div>
          )}

          {(property.bedrooms || property.bathrooms || property.area) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t text-sm text-muted-foreground">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">{property.bathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">{property.area}</span>
                  <span className="text-xs">م²</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
