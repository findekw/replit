import { Office } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Building2 } from "lucide-react";

interface OfficeCardProps {
  office: Office;
}

export function OfficeCard({ office }: OfficeCardProps) {
  return (
    <Link href={`/${office.slug}`} className="block h-full">
      <div
        className="h-full flex flex-col bg-white rounded-2xl transition-all duration-200"
        style={{
          border: "1px solid #e8edf2",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          padding: "24px 20px 20px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
          (e.currentTarget as HTMLElement).style.borderColor = "#C7D2FE";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
          (e.currentTarget as HTMLElement).style.borderColor = "";
        }}
      >
        {/* Logo / Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid #e8edf2",
              background: office.logo ? "#fff" : "hsl(221,54%,96%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            }}
          >
            {office.logo ? (
              <img
                src={office.logo}
                alt={office.nameAr}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Building2 style={{ width: 30, height: 30, color: "#111827" }} />
            )}
          </div>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-gray-900 hover:text-primary transition-colors duration-150"
          style={{
            fontSize: "16px",
            lineHeight: "1.35",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          {office.nameAr}
        </h3>

        {/* Description */}
        {office.descriptionAr ? (
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              lineHeight: "1.6",
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flexGrow: 1,
              marginBottom: "16px",
            }}
          >
            {office.descriptionAr}
          </p>
        ) : (
          <div style={{ flexGrow: 1 }} />
        )}

        {/* Footer: property count */}
        {office.activeListings > 0 && (
          <div
            style={{
              borderTop: "1px solid #f0f4f8",
              paddingTop: "14px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#667EEA",
              }}
            >
              {office.activeListings} عقار
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
