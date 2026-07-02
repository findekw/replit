import { Link } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MessageCircle, MapPin, Building2, ShieldCheck, Star,
  ChevronLeft, ChevronRight, Home as HomeIcon,
} from "lucide-react";
import type { TemplateProps, CardProperty } from "./types";
import { emptyMessage } from "./types";
import { TypeFilter } from "./TypeFilter";

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
            {office.logo ? <img src={office.logo} alt={office.nameAr} /> : <Building2 size={46} style={{ color: "#111827" }} />}
          </div>
          <div className="tm-hero-text">
            <h1 className="tm-name">{office.nameAr}</h1>
            <div className="tm-badges">
              {office.verified && <span className="tm-badge tm-badge-ok"><ShieldCheck size={15} /> موثّق</span>}
              {office.featured && <span className="tm-badge tm-badge-feat"><Star size={15} /> مميز</span>}
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
        {/* Stats */}
        <div className="tm-stats">
          <div className="tm-stat"><div className="tm-stat-n">{office.activeListings}</div><div className="tm-stat-l">عقار متاح</div></div>
          <div className="tm-stat"><div className="tm-stat-n">{office.totalListings}</div><div className="tm-stat-l">إجمالي العقارات</div></div>
          {office.governorateName && <div className="tm-stat"><div className="tm-stat-n" style={{ fontSize: 20 }}>{office.governorateName}</div><div className="tm-stat-l">الموقع</div></div>}
        </div>

        {/* About */}
        {office.descriptionAr && (
          <section className="tm-card tm-about">
            <h2 className="tm-h2">نبذة عن المكتب</h2>
            <p>{office.descriptionAr}</p>
          </section>
        )}

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
        <HomeIcon size={14} style={{ verticalAlign: "middle", marginLeft: 4 }} />
        مدعوم من <Link href="/">فايند</Link>
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
.tm-hero { position: relative; min-height: 300px; overflow: hidden; background: linear-gradient(135deg,#16203a 0%,#243056 45%,#667EEA 120%); }
.tm-hero-bg { position: absolute; inset: 0; }
.tm-hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.tm-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,22,40,0.55), rgba(16,22,40,0.82)); }
.tm-hero-inner { position: relative; max-width: 1180px; margin: 0 auto; padding: 70px 22px 56px; display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.tm-logo { width: 120px; height: 120px; border-radius: 26px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 5px solid #fff; box-shadow: 0 20px 45px rgba(0,0,0,0.3); }
.tm-logo img { width: 100%; height: 100%; object-fit: cover; }
.tm-hero-text { flex: 1; min-width: 220px; }
.tm-name { font-size: clamp(28px,4.2vw,42px); font-weight: 800; color: #fff !important; margin: 0 0 14px; letter-spacing: -0.5px; text-shadow: 0 2px 16px rgba(0,0,0,0.4); line-height: 1.15; }
.tm-badges { display: flex; flex-wrap: wrap; gap: 9px; }
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
.tm-h2 { font-size: 22px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; }
.tm-listhead { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.tm-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tm-tab { padding: 10px 20px; border-radius: 999px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s; background: #fff; color: #64748B; border: 1px solid #E2E8F0; }
.tm-tab:hover { border-color: #667EEA; color: #667EEA; }
.tm-tab-on { background: #111827; color: #fff; border-color: #111827; }
.tm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
@media (min-width:980px){ .tm-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tm-empty { text-align: center; padding: 64px 20px; }
.tm-empty p { color: #64748B; font-weight: 700; font-size: 16px; margin: 16px 0 0; }
.tm-pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 32px; }
.tm-pgbtn { display: inline-flex; align-items: center; gap: 5px; padding: 9px 16px; border-radius: 12px; border: 1px solid #E2E8F0; background: #fff; color: #111827; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; }
.tm-pgbtn:disabled { opacity: .45; cursor: not-allowed; }
.tm-pginfo { font-size: 14px; color: #64748B; font-weight: 600; }
.tm-footer { text-align: center; padding: 40px 20px 48px; color: #94a3b8; font-size: 14px; }
.tm-footer a { color: #667EEA; font-weight: 800; text-decoration: none; }
.tm-sticky { position: fixed; bottom: 0; inset-inline: 0; z-index: 40; display: flex; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border-top: 1px solid #EEF1F5; box-shadow: 0 -4px 20px rgba(15,23,42,0.08); }
.tm-sticky-spacer { height: 80px; }
@media (min-width: 1024px){ .tm-sticky, .tm-sticky-spacer { display: none; } }
`;
