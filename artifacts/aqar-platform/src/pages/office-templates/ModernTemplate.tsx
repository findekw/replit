import { Link } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MessageCircle, MapPin, Building2,
  ChevronLeft, ChevronRight, Home as HomeIcon,
  ShieldCheck, BadgeCheck,
} from "lucide-react";
import type { TemplateProps, CardProperty } from "./types";
import { emptyMessage } from "./types";
import { TypeFilter } from "./TypeFilter";
import { LogoImg } from "@/components/LogoImg";

/**
 * MODERN — bold marketplace look: deep navy→indigo gradient hero, big logo tile,
 * floating glass contact bar, generous spacing. The flagship default template.
 */
export default function ModernTemplate(p: TemplateProps) {
  const { office, properties, loadingProps, activeTab, setActiveTab, activeType, setActiveType, propertyTypes, page, totalPages, setPage, onWhatsApp, onCall, statusTabs, hasWA, hasPhone } = p;

  return (
    <div dir="rtl" className="tm-root">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="tm-hero">
        <div className="tm-hero-bg">{office.coverImage && <img src={office.coverImage} alt={office.nameAr} />}</div>
        <div className="tm-hero-scrim" />
        <div className="tm-hero-inner">
          <div className="tm-logo">
            <LogoImg src={office.logo} alt={office.nameAr} fallback={<Building2 size={46} style={{ color: "#111827" }} />} />
          </div>
          <div className="tm-hero-text">
            <h1 className="tm-name">{office.nameAr}</h1>
            <div className="tm-badges">
              {office.governorateName && <span className="tm-badge"><MapPin size={15} /> {office.governorateName}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Floating contact bar */}
      {(hasWA || hasPhone) && (
        <div className="tm-contact-wrap">
          <div className="tm-contact">
            {hasWA && <button className="tm-btn tm-btn-wa" onClick={onWhatsApp}><MessageCircle size={20} /> تواصل واتساب</button>}
            {hasPhone && <button className="tm-btn tm-btn-call" onClick={onCall}><Phone size={20} /> اتصال</button>}
          </div>
        </div>
      )}

      <main className="tm-main">
        {/* About + address + legal identifiers — kept at the top (client preference).
            Order per client: نبذة → عنوان → الترخيص/السجل. */}
        {(office.descriptionAr || office.addressAr || office.licenseNumber || office.commercialReg) && (
          <section className="tm-card tm-about">
            {office.descriptionAr && (
              <>
                <h2 className="tm-h2">نبذة عن المكتب</h2>
                <p>{office.descriptionAr}</p>
              </>
            )}
            {office.addressAr && (
              <div className="tm-addr"><MapPin size={17} style={{ flexShrink: 0, marginTop: 3, color: "#667EEA" }} /> {office.addressAr}</div>
            )}
            {/* Credentials read as verification badges rather than a line of
                text — they exist to signal the office is licensed, so they
                should look official. Each appears only if filled in. */}
            {(office.licenseNumber || office.commercialReg) && (
              <div className="tm-legal">
                {office.licenseNumber && (
                  <div className="tm-cred">
                    <span className="tm-cred-ic"><ShieldCheck size={18} /></span>
                    <span className="tm-cred-body">
                      <span className="tm-cred-label">رقم الترخيص</span>
                      <span className="tm-cred-val" dir="ltr">{office.licenseNumber}</span>
                    </span>
                  </div>
                )}
                {office.commercialReg && (
                  <div className="tm-cred">
                    <span className="tm-cred-ic"><BadgeCheck size={18} /></span>
                    <span className="tm-cred-body">
                      <span className="tm-cred-label">السجل التجاري</span>
                      <span className="tm-cred-val" dir="ltr">{office.commercialReg}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Stats */}
        <div className="tm-stats">
          <div className="tm-stat"><div className="tm-stat-n">{office.activeListings}</div><div className="tm-stat-l">عقار متاح</div></div>
          <div className="tm-stat"><div className="tm-stat-n">{office.totalListings}</div><div className="tm-stat-l">إجمالي العقارات</div></div>
          {office.governorateName && <div className="tm-stat"><div className="tm-stat-n" style={{ fontSize: 20 }}>{office.governorateName}</div><div className="tm-stat-l">الموقع</div></div>}
        </div>

        {/* Listings */}
        <div className="tm-listhead">
          <h2 className="tm-h2">عقارات المكتب</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="tm-tabs">
              {statusTabs.map((t) => (
                <button key={t} className={`tm-tab ${activeTab === t ? "tm-tab-on" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
              ))}
            </div>
            <TypeFilter value={activeType} onChange={setActiveType} types={propertyTypes} accent="#667EEA" />
          </div>
        </div>

        {loadingProps ? (
          <div className="tm-grid">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
        ) : properties.length === 0 ? (
          <div className="tm-card tm-empty">
            <Building2 size={52} style={{ color: "#cbd5e1", margin: "0 auto" }} />
            <p>{emptyMessage(activeTab, activeType)}</p>
          </div>
        ) : (
          <>
            <div className="tm-grid">
              {properties.map((pr) => <PropertyCard key={pr.id} property={pr as unknown as CardProperty} />)}
            </div>
            {totalPages > 1 && (
              <div className="tm-pager">
                <button className="tm-pgbtn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronRight size={16} /> السابق</button>
                <span className="tm-pginfo">{page} / {totalPages}</span>
                <button className="tm-pgbtn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي <ChevronLeft size={16} /></button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="tm-footer">
        <Link href="/" className="tm-footer-badge">مدعوم من <b>فايند</b></Link>
      </footer>

      {/* Mobile sticky */}
      {(hasWA || hasPhone) && (
        <>
          <div className="tm-sticky">
            {hasWA && <button className="tm-btn tm-btn-wa" onClick={onWhatsApp} style={{ height: 48 }}><MessageCircle size={20} /> واتساب</button>}
            {hasPhone && <button className="tm-btn tm-btn-call" onClick={onCall} style={{ height: 48 }}><Phone size={20} /> اتصال</button>}
          </div>
          <div className="tm-sticky-spacer" />
        </>
      )}
    </div>
  );
}

const CSS = `
.tm-root { font-family: 'Cairo', sans-serif; background: #F6F8FC; min-height: 100vh; }
.tm-root * { box-sizing: border-box; }
.tm-hero { position: relative; overflow: hidden; background: linear-gradient(160deg,#1B2440 0%,#243056 55%,#3B4884 100%); }
.tm-hero-bg { position: absolute; inset: 0; }
.tm-hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.tm-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,22,40,0.55), rgba(16,22,40,0.82)); }
/* Logo centred above the name, tight spacing (client: "اللوقو بالوسط وتصغر المسافة"). */
.tm-hero-inner { position: relative; max-width: 1180px; margin: 0 auto; padding: 38px 22px 34px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; }
.tm-logo { width: 104px; height: 104px; border-radius: 24px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 4px solid #fff; box-shadow: 0 14px 34px rgba(0,0,0,0.28); }
.tm-logo img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.tm-hero-text { width: 100%; }
.tm-name { font-size: clamp(24px,3.6vw,36px); font-weight: 800; color: #fff !important; margin: 0 0 10px; letter-spacing: -0.5px; text-shadow: 0 2px 16px rgba(0,0,0,0.4); line-height: 1.2; }
.tm-badges { display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; }
.tm-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #fff; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); backdrop-filter: blur(8px); }
.tm-badge-ok { background: rgba(16,185,129,0.22); border-color: rgba(16,185,129,0.5); }
.tm-badge-feat { background: rgba(245,158,11,0.22); border-color: rgba(245,158,11,0.5); }

.tm-contact-wrap { max-width: 1180px; margin: -32px auto 0; padding: 0 22px; position: relative; z-index: 5; }
.tm-contact { background: rgba(255,255,255,0.85); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.7); border-radius: 20px; box-shadow: 0 18px 50px rgba(15,23,42,0.16); padding: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.tm-btn { height: 52px; padding: 0 26px; border-radius: 14px; border: none; font-weight: 700; font-size: 15px; cursor: pointer; flex: 1; min-width: 150px; display: flex; align-items: center; justify-content: center; gap: 9px; font-family: 'Cairo', sans-serif; transition: transform .12s, filter .15s; }
.tm-btn:hover { transform: translateY(-1px); filter: brightness(0.97); }
.tm-btn-wa { background: #25D366; color: #fff; box-shadow: 0 8px 20px rgba(37,211,102,0.3); }
.tm-btn-call { background: #667EEA; color: #fff; box-shadow: 0 8px 20px rgba(63,91,216,0.3); }
.tm-iconbtn { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #E2E8F0; color: #111827; flex-shrink: 0; }
.tm-iconbtn:hover { border-color: #667EEA; color: #667EEA; }

.tm-main { max-width: 1180px; margin: 0 auto; padding: 30px 22px 0; }
.tm-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 26px; }
@media (min-width:700px){ .tm-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tm-stat { background: #fff; border: 1px solid #EEF1F5; border-radius: 18px; padding: 22px 16px; text-align: center; box-shadow: 0 6px 22px rgba(15,23,42,0.05); }
.tm-stat-n { font-size: 30px; font-weight: 800; color: #111827; line-height: 1; }
.tm-stat-l { font-size: 13px; color: #64748B; margin-top: 8px; font-weight: 600; }
.tm-card { background: #fff; border: 1px solid #EEF1F5; border-radius: 20px; box-shadow: 0 6px 22px rgba(15,23,42,0.05); }
.tm-about { padding: 26px 28px; margin-bottom: 28px; }
.tm-about p { color: #475569; line-height: 2; font-size: 15.5px; margin: 14px 0 0; }
.tm-addr { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; color: #475569; font-size: 14.5px; font-weight: 600; line-height: 1.8; }
.tm-addr:first-child { margin-top: 0; }
.tm-legal { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #EEF1F5; }
@media (min-width:560px){ .tm-legal { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.tm-legal:first-child { margin-top: 0; padding-top: 0; border-top: none; }
/* Credential badge */
.tm-cred { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 13px; background: #F7F9FE; border: 1px solid #E6ECFB; }
.tm-cred-ic { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: #fff; color: #667EEA; border: 1px solid #E0E8FA; box-shadow: 0 2px 6px rgba(63,91,216,0.10); }
.tm-cred-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tm-cred-label { font-size: 12px; font-weight: 700; color: #64748B; letter-spacing: 0.01em; }
.tm-cred-val { font-size: 15px; font-weight: 800; color: #111827; letter-spacing: 0.02em; overflow-wrap: anywhere; }
.tm-h2 { font-size: 22px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; }
.tm-listhead { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.tm-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tm-tab { padding: 10px 20px; border-radius: 999px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s; background: #fff; color: #64748B; border: 1px solid #E2E8F0; }
/* Never restyle the selected tab on hover: ':hover' outranks '.tm-tab-on', and
   touch devices keep :hover stuck on the last tap — which painted the active
   tab's label #667EEA on its own #667EEA pill (invisible). */
@media (hover: hover) {
  .tm-tab:not(.tm-tab-on):hover { border-color: #667EEA; color: #667EEA; }
}
.tm-tab-on { background: #667EEA; color: #fff; border-color: #667EEA; }
.tm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
@media (min-width:980px){ .tm-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tm-empty { text-align: center; padding: 64px 20px; }
.tm-empty p { color: #64748B; font-weight: 700; font-size: 16px; margin: 16px 0 0; }
.tm-pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 32px; }
.tm-pgbtn { display: inline-flex; align-items: center; gap: 5px; padding: 9px 16px; border-radius: 12px; border: 1px solid #E2E8F0; background: #fff; color: #111827; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; }
.tm-pgbtn:disabled { opacity: .45; cursor: not-allowed; }
.tm-pginfo { font-size: 14px; color: #64748B; font-weight: 600; }
.tm-footer { text-align: center; padding: 40px 20px 48px; }
.tm-footer-badge { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 999px; background: #EEF2FF; border: 1px solid #DBE4FF; color: #475569; font-size: 13.5px; font-weight: 600; text-decoration: none; transition: background .18s; box-shadow: 0 2px 10px rgba(63,91,216,0.08); }
.tm-footer-badge:hover { background: #E0E7FF; }
.tm-footer-badge b { color: #667EEA; font-weight: 800; }
.tm-sticky { position: fixed; bottom: 0; inset-inline: 0; z-index: 40; display: flex; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border-top: 1px solid #EEF1F5; box-shadow: 0 -4px 20px rgba(15,23,42,0.08); }
.tm-sticky-spacer { height: 80px; }
@media (min-width: 1024px){ .tm-sticky, .tm-sticky-spacer { display: none; } }
/* Mobile: the floating contact bar is hidden (sticky bottom bar covers it), so
   also collapse the gap it left between the hero and the first card. */
@media (max-width: 1023px){ .tm-contact-wrap { display: none; } .tm-main { padding-top: 14px; } .tm-hero-inner { padding-bottom: 24px; } }
`;
