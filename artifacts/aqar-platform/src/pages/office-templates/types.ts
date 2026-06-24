import type { Property as ApiProperty } from "@workspace/api-client-react";

// The office object returned by GET /api/offices/by-slug/:slug
export interface OfficeData {
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
  landingTemplate?: string | null;
}

// A property row as returned by GET /api/offices/:id/properties
export interface OfficeProperty {
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

// PropertyCard expects the generated API type; templates cast via this helper.
export type CardProperty = ApiProperty;

// Shared props passed from OfficePage to every landing-page template.
export interface TemplateProps {
  office: OfficeData;
  properties: OfficeProperty[];
  loadingProps: boolean;
  activeTab: string;
  setActiveTab: (t: string) => void;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  onWhatsApp: () => void;
  onCall: () => void;
  statusTabs: readonly string[];
  hasWA: boolean;
  hasPhone: boolean;
}

export const TEMPLATE_KEYS = ["modern", "luxury", "minimal", "classic"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export function resolveTemplateKey(t: string | null | undefined): TemplateKey {
  // Back-compat: old "dark" maps to the new "luxury".
  if (t === "dark") return "luxury";
  if (t === "luxury" || t === "minimal" || t === "classic") return t;
  return "modern";
}
