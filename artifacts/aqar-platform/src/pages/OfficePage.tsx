import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trackInteraction } from "@/lib/trackInteraction";
import { PropertyCard } from "@/components/PropertyCard";
import type { Property as ApiProperty } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Phone, MessageCircle, MapPin, Building2,
  ShieldCheck, Star, Mail,
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
  landingTemplate?: string | null;
}

/* ═══════════════════════════════════════════
   THEMES — applied via CSS variables on the root
═══════════════════════════════════════════ */
type ThemeKey = "classic" | "dark" | "minimal";

interface ThemeVars {
  heroBg: string;
  heroText: string;
  heroNameText: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  scrim: string;
  logoBorder: string;
  heroBorder: string;
  nameShadow: string;
}

const THEMES: Record<ThemeKey, ThemeVars> = {
  classic: {
    heroBg: "linear-gradient(135deg,#1F2A44 0%,#3F5BD8 100%)",
    heroText: "#ffffff",
    heroNameText: "#ffffff",
    accent: "#3F5BD8",
    accentHover: "#3550c4",
    accentContrast: "#ffffff",
    badgeBg: "rgba(255,255,255,0.16)",
    badgeBorder: "rgba(255,255,255,0.22)",
    badgeText: "#ffffff",
    scrim: "linear-gradient(180deg, rgba(31,42,68,0.55) 0%, rgba(31,42,68,0.78) 100%)",
    logoBorder: "#ffffff",
    heroBorder: "none",
    nameShadow: "0 2px 12px rgba(0,0,0,0.35)",
  },
  dark: {
    heroBg: "linear-gradient(135deg,#0B1220 0%,#1A2238 100%)",
    heroText: "#ffffff",
    heroNameText: "#ffffff",
    accent: "#C9A227",
    accentHover: "#b08e1f",
    accentContrast: "#1F2A44",
    badgeBg: "rgba(201,162,39,0.16)",
    badgeBorder: "rgba(201,162,39,0.45)",
    badgeText: "#ffffff",
    scrim: "linear-gradient(180deg, rgba(11,18,32,0.60) 0%, rgba(11,18,32,0.85) 100%)",
    logoBorder: "#C9A227",
    heroBorder: "none",
    nameShadow: "0 2px 12px rgba(0,0,0,0.45)",
  },
  minimal: {
    heroBg: "#FFFFFF",
    heroText: "#1F2A44",
    heroNameText: "#1F2A44",
    accent: "#0E9F6E",
    accentHover: "#0c8a5f",
    accentContrast: "#ffffff",
    badgeBg: "#F1F5F9",
    badgeBorder: "#E2E8F0",
    badgeText: "#1F2A44",
    scrim: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.75) 100%)",
    logoBorder: "#E2E8F0",
    heroBorder: "1px solid #E2E8F0",
    nameShadow: "none",
  },
};

function resolveTheme(t: string | null | undefined): ThemeKey {
  if (t === "dark" || t === "minimal") return t;
  return "classic";
}

function themeVars(theme: ThemeVars): React.CSSProperties {
  return {
    ["--op-hero-bg" as any]: theme.heroBg,
    ["--op-hero-text" as any]: theme.heroText,
    ["--op-hero-name-text" as any]: theme.heroNameText,
    ["--op-accent" as any]: theme.accent,
    ["--op-accent-hover" as any]: theme.accentHover,
    ["--op-accent-contrast" as any]: theme.accentContrast,
    ["--op-badge-bg" as any]: theme.badgeBg,
    ["--op-badge-border" as any]: theme.badgeBorder,
    ["--op-badge-text" as any]: theme.badgeText,
    ["--op-hero-scrim" as any]: theme.scrim,
    ["--op-logo-border" as any]: theme.logoBorder,
    ["--op-hero-border" as any]: theme.heroBorder,
    ["--op-name-shadow" as any]: theme.nameShadow,
  };
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

/* ═══════════════════════════════════════════
   STYLES — scoped with `op-` prefix
═══════════════════════════════════════════ */
const STYLES = `
.op-root { font-family: 'Cairo', sans-serif; background: #F5F7FA; min-height: 100vh; }
.op-root * { box-sizing: border-box; }

/* ── HERO ── */
.op-hero { position: relative; width: 100%; overflow: hidden; border-bottom: var(--op-hero-border, none); }
.op-hero-bg { position: absolute; inset: 0; background: var(--op-hero-bg, linear-gradient(135deg,#1F2A44,#3F5BD8)); }
.op-hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.op-hero-scrim { position: absolute; inset: 0; background: var(--op-hero-scrim, linear-gradient(180deg, rgba(31,42,68,0.55) 0%, rgba(31,42,68,0.78) 100%)); }
.op-hero-inner {
  position: relative; max-width: 1120px; margin: 0 auto;
  padding: 64px 20px 40px; display: flex; align-items: flex-end; gap: 22px; flex-wrap: wrap;
}
.op-logo-tile {
  width: 112px; height: 112px; border-radius: 22px; background: #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 12px 32px rgba(15,23,42,0.30); overflow: hidden; border: 4px solid var(--op-logo-border, #fff);
}
.op-logo-tile img { width: 100%; height: 100%; object-fit: cover; }
.op-hero-text { flex: 1; min-width: 220px; color: var(--op-hero-text, #fff); }
.op-hero-name { font-size: clamp(24px, 4vw, 36px); font-weight: 800; line-height: 1.15; margin: 0 0 12px; color: var(--op-hero-name-text, #ffffff) !important; text-shadow: var(--op-name-shadow, 0 2px 12px rgba(0,0,0,0.35)); }
.op-badges { display: flex; flex-wrap: wrap; gap: 8px; }
.op-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px;
  border-radius: 999px; font-size: 13px; font-weight: 700;
  background: var(--op-badge-bg, rgba(255,255,255,0.16)); color: var(--op-badge-text, #fff); backdrop-filter: blur(6px);
  border: 1px solid var(--op-badge-border, rgba(255,255,255,0.22));
}
.op-badge-verified { background: rgba(37,211,102,0.20); border-color: rgba(37,211,102,0.45); }
.op-badge-featured { background: var(--op-badge-bg, rgba(63,91,216,0.30)); border-color: var(--op-badge-border, rgba(255,255,255,0.30)); }

/* ── CONTACT BAR ── */
.op-contactbar {
  max-width: 1120px; margin: -28px auto 0; padding: 0 20px; position: relative; z-index: 5;
}
.op-contactbar-card {
  background: #fff; border: 1px solid #EEF1F5; border-radius: 18px;
  box-shadow: 0 6px 20px rgba(15,23,42,0.06); padding: 16px;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.op-cta {
  height: 50px; padding: 0 22px; border-radius: 12px; border: none;
  font-weight: 700; font-size: 15px; cursor: pointer; flex: 1; min-width: 150px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  font-family: 'Cairo', sans-serif; transition: filter .15s, background .15s;
}
.op-cta-wa { background: #25D366; color: #fff; }
.op-cta-wa:hover { background: #1ebe5a; }
.op-cta-call { background: var(--op-accent, #3F5BD8); color: var(--op-accent-contrast, #fff); }
.op-cta-call:hover { background: var(--op-accent-hover, #3550c4); }
.op-iconbtns { display: flex; gap: 10px; }
.op-iconbtn {
  width: 50px; height: 50px; border-radius: 12px; border: 1px solid #E2E8F0;
  background: #fff; color: #1F2A44; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.op-iconbtn:hover { background: #F5F7FA; border-color: var(--op-accent, #3F5BD8); color: var(--op-accent, #3F5BD8); }

/* ── LAYOUT ── */
.op-main { max-width: 1120px; margin: 0 auto; padding: 28px 20px 56px; }

.op-card {
  background: #fff; border: 1px solid #EEF1F5; border-radius: 18px;
  box-shadow: 0 6px 20px rgba(15,23,42,0.06);
}
.op-section-title { font-size: 19px; font-weight: 800; color: #1F2A44; margin: 0; }

/* ── STATS ── */
.op-stats { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
.op-stat {
  flex: 1; min-width: 150px; padding: 18px 20px; border-radius: 16px; background: #fff;
  border: 1px solid #EEF1F5; box-shadow: 0 6px 20px rgba(15,23,42,0.06);
}
.op-stat-num { font-size: 28px; font-weight: 800; color: #1F2A44; line-height: 1; }
.op-stat-label { font-size: 13px; color: #64748B; margin-top: 7px; font-weight: 600; }

/* ── ABOUT ── */
.op-about { padding: 22px 24px; margin-bottom: 24px; }
.op-about p { color: #64748B; line-height: 1.9; font-size: 15px; margin: 12px 0 0; }

/* ── TABS ── */
.op-listings-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; margin-bottom: 18px;
}
.op-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.op-tab {
  padding: 9px 18px; border-radius: 999px; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s;
  background: #fff; color: #64748B; border: 1px solid #E2E8F0;
}
.op-tab:hover { border-color: var(--op-accent, #3F5BD8); color: var(--op-accent, #3F5BD8); }
.op-tab-active { background: #1F2A44; color: #fff; border-color: #1F2A44; }
.op-tab-active:hover { color: #fff; }

/* ── GRID ── */
.op-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
@media (min-width: 900px) { .op-grid { grid-template-columns: repeat(3, 1fr); } }

.op-empty { text-align: center; padding: 70px 20px; }
.op-empty p { color: #64748B; font-weight: 700; font-size: 16px; margin: 14px 0 0; }
.op-empty span { color: #94a3b8; font-size: 14px; display: block; margin-top: 6px; }

.op-pagination { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 32px; }
.op-page-info { font-size: 14px; color: #64748B; font-weight: 600; }

/* ── FOOTER ── */
.op-footer { text-align: center; padding: 30px 20px 40px; color: #94a3b8; font-size: 14px; }
.op-footer a { color: var(--op-accent, #3F5BD8); font-weight: 700; text-decoration: none; }
.op-footer a:hover { text-decoration: underline; }
`;

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

  const themeKey = resolveTheme(office?.landingTemplate);
  const theme = THEMES[themeKey];
  const rootThemeStyle = themeVars(theme);

  /* ── Not found ── */
  if (notFound) {
    return (
      <div dir="rtl" className="op-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px" }}>
        <style>{STYLES}</style>
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#1F2A44" }}>الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-6">لم يتم العثور على هذا المكتب على المنصة</p>
        <Button onClick={() => navigate("/offices")}>تصفح جميع المكاتب</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="op-root" style={rootThemeStyle}>
      <style>{STYLES}</style>

      {/* ════════ COVER HERO ════════ */}
      <section className="op-hero">
        <div className="op-hero-bg">
          {office?.coverImage && <img src={office.coverImage} alt={office.nameAr} />}
        </div>
        <div className="op-hero-scrim" />
        <div className="op-hero-inner">
          {/* Logo tile */}
          {loadingOffice ? (
            <Skeleton className="op-logo-tile" />
          ) : (
            <div className="op-logo-tile">
              {office?.logo ? (
                <img src={office.logo} alt={office.nameAr} />
              ) : (
                <Building2 className="h-12 w-12" style={{ color: "#1F2A44" }} />
              )}
            </div>
          )}

          {/* Name + badges */}
          <div className="op-hero-text">
            {loadingOffice ? (
              <Skeleton className="h-9 w-64 rounded-lg" style={{ marginBottom: 12 }} />
            ) : (
              <h1 className="op-hero-name">{office?.nameAr}</h1>
            )}
            {office && (
              <div className="op-badges">
                {office.verified && (
                  <span className="op-badge op-badge-verified">
                    <ShieldCheck style={{ width: 16, height: 16 }} /> موثّق
                  </span>
                )}
                {office.featured && (
                  <span className="op-badge op-badge-featured">
                    <Star style={{ width: 16, height: 16 }} /> مميز
                  </span>
                )}
                {office.governorateName && (
                  <span className="op-badge">
                    <MapPin style={{ width: 16, height: 16 }} /> {office.governorateName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════ CONTACT BAR ════════ */}
      {office && (hasWA || hasPhone || office.email) && (
        <div className="op-contactbar">
          <div className="op-contactbar-card">
            {hasWA && (
              <button className="op-cta op-cta-wa" onClick={handleWhatsApp}>
                <MessageCircle style={{ width: 20, height: 20 }} /> واتساب
              </button>
            )}
            {hasPhone && (
              <button className="op-cta op-cta-call" onClick={handleCall}>
                <Phone style={{ width: 20, height: 20 }} /> اتصال
              </button>
            )}
            {office.email && (
              <div className="op-iconbtns">
                <a className="op-iconbtn" href={`mailto:${office.email}`} aria-label="البريد الإلكتروني" title="البريد الإلكتروني">
                  <Mail style={{ width: 20, height: 20 }} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="op-main">
        {/* ════════ STATS ════════ */}
        {office && (
          <div className="op-stats">
            <div className="op-stat">
              <div className="op-stat-num">{office.activeListings}</div>
              <div className="op-stat-label">عقار متاح</div>
            </div>
            <div className="op-stat">
              <div className="op-stat-num">{office.totalListings}</div>
              <div className="op-stat-label">إجمالي العقارات</div>
            </div>
          </div>
        )}

        {/* ════════ ABOUT ════════ */}
        {office?.descriptionAr && (
          <div className="op-card op-about">
            <h2 className="op-section-title">نبذة عن المكتب</h2>
            <p>{office.descriptionAr}</p>
          </div>
        )}

        {/* ════════ LISTINGS ════════ */}
        <div className="op-listings-head">
          <h2 className="op-section-title">عقارات المكتب</h2>
          <div className="op-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`op-tab ${activeTab === tab ? "op-tab-active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loadingProps || loadingOffice ? (
          <div className="op-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="op-card op-empty">
            <Building2 className="h-14 w-14 mx-auto text-gray-200" />
            <p>{activeTab === "الكل" ? "لا توجد عقارات منشورة حالياً" : `لا توجد عقارات ${activeTab}`}</p>
            <span>سيتم نشر العقارات قريباً</span>
          </div>
        ) : (
          <>
            <div className="op-grid">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p as unknown as ApiProperty} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="op-pagination">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="gap-1">
                  <ChevronRight className="h-4 w-4" /> السابق
                </Button>
                <span className="op-page-info">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="gap-1">
                  التالي <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="op-footer">
        مدعوم من <Link href="/">فايند</Link>
      </footer>

      {/* ── Mobile sticky bottom contact bar ── */}
      {office && (hasWA || hasPhone) && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex gap-3 px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid #EEF1F5",
            boxShadow: "0 -4px 20px rgba(15,23,42,0.08)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {hasWA && (
            <button className="op-cta op-cta-wa" onClick={handleWhatsApp} style={{ height: 48 }}>
              <MessageCircle style={{ width: 20, height: 20 }} /> واتساب
            </button>
          )}
          {hasPhone && (
            <button className="op-cta op-cta-call" onClick={handleCall} style={{ height: 48 }}>
              <Phone style={{ width: 20, height: 20 }} /> اتصال
            </button>
          )}
        </div>
      )}
      {office && (hasWA || hasPhone) && <div className="lg:hidden" style={{ height: 80 }} />}
    </div>
  );
}
