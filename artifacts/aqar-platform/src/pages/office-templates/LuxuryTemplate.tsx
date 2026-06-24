import { Link } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MessageCircle, MapPin, Building2, ShieldCheck, Star, Mail,
  ChevronLeft, ChevronRight, Home as HomeIcon,
} from "lucide-react";
import type { TemplateProps, CardProperty } from "./types";

/**
 * LUXURY — "فخم": dark editorial agency look. Centered full-bleed dark hero with a
 * gold-ringed circular logo, oversized name, gold hairline divider + tagline. Dark
 * end-to-end body (#0E1422) with light text, big gold numerals, gold-accented section
 * labels, and light card wrappers so the (light) PropertyCards sit on the dark canvas.
 */
export default function LuxuryTemplate(p: TemplateProps) {
  const { office, properties, loadingProps, activeTab, setActiveTab, page, totalPages, setPage, onWhatsApp, onCall, statusTabs, hasWA, hasPhone } = p;

  return (
    <div dir="rtl" className="lx-root">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="lx-hero">
        <div className="lx-hero-bg">{office.coverImage && <img src={office.coverImage} alt={office.nameAr} />}</div>
        <div className="lx-hero-scrim" />
        <div className="lx-hero-inner">
          <div className="lx-logo-ring">
            <div className="lx-logo">
              {office.logo ? <img src={office.logo} alt={office.nameAr} /> : <Building2 size={40} style={{ color: "#C9A227" }} />}
            </div>
          </div>

          <h1 className="lx-name">{office.nameAr}</h1>

          <div className="lx-divider" />

          {office.governorateName && (
            <p className="lx-tagline">عقارات راقية بعناية فائقة في {office.governorateName}</p>
          )}

          <div className="lx-badges">
            {office.verified && <span className="lx-badge"><ShieldCheck size={14} /> موثّق</span>}
            {office.featured && <span className="lx-badge"><Star size={14} /> مميز</span>}
            {office.governorateName && <span className="lx-badge"><MapPin size={14} /> {office.governorateName}</span>}
          </div>

          {(hasWA || hasPhone || office.email) && (
            <div className="lx-hero-cta">
              {hasWA && <button className="lx-btn lx-btn-gold" onClick={onWhatsApp}><MessageCircle size={19} /> تواصل واتساب</button>}
              {hasPhone && <button className="lx-btn lx-btn-outline" onClick={onCall}><Phone size={18} /> اتصال</button>}
              {office.email && <a className="lx-iconbtn" href={`mailto:${office.email}`} title="البريد الإلكتروني"><Mail size={19} /></a>}
            </div>
          )}
        </div>
      </section>

      <main className="lx-main">
        {/* Stats */}
        <div className="lx-stats">
          <div className="lx-stat"><div className="lx-stat-n">{office.activeListings}</div><div className="lx-stat-l">AVAILABLE · عقار متاح</div></div>
          <div className="lx-stat"><div className="lx-stat-n">{office.totalListings}</div><div className="lx-stat-l">PORTFOLIO · إجمالي العقارات</div></div>
          {office.governorateName && <div className="lx-stat"><div className="lx-stat-n lx-stat-loc">{office.governorateName}</div><div className="lx-stat-l">LOCATION · الموقع</div></div>}
        </div>

        {/* About */}
        {office.descriptionAr && (
          <section className="lx-about">
            <div className="lx-label"><span className="lx-label-line" /> نبذة عن المكتب</div>
            <p>{office.descriptionAr}</p>
          </section>
        )}

        {/* Listings */}
        <div className="lx-listhead">
          <div className="lx-label"><span className="lx-label-line" /> المعروضات</div>
          <div className="lx-tabs">
            {statusTabs.map((t) => (
              <button key={t} className={`lx-tab ${activeTab === t ? "lx-tab-on" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        {loadingProps ? (
          <div className="lx-grid">{[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="lx-cardwrap"><Skeleton className="h-72 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} /></div>
          ))}</div>
        ) : properties.length === 0 ? (
          <div className="lx-empty">
            <Building2 size={50} style={{ color: "#C9A227", margin: "0 auto", opacity: 0.7 }} />
            <p>{activeTab === "الكل" ? "لا توجد عقارات منشورة حالياً" : `لا توجد عقارات ${activeTab}`}</p>
          </div>
        ) : (
          <>
            <div className="lx-grid">
              {properties.map((pr) => (
                <div key={pr.id} className="lx-cardwrap">
                  <PropertyCard property={pr as unknown as CardProperty} />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="lx-pager">
                <button className="lx-pgbtn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronRight size={16} /> السابق</button>
                <span className="lx-pginfo">{page} / {totalPages}</span>
                <button className="lx-pgbtn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي <ChevronLeft size={16} /></button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="lx-footer">
        <span className="lx-footer-line" />
        <div>
          <HomeIcon size={14} style={{ verticalAlign: "middle", marginLeft: 4 }} />
          مدعوم من <Link href="/">فايند</Link>
        </div>
      </footer>

      {/* Mobile sticky */}
      {(hasWA || hasPhone) && (
        <>
          <div className="lx-sticky">
            {hasWA && <button className="lx-btn lx-btn-gold" onClick={onWhatsApp} style={{ height: 48 }}><MessageCircle size={19} /> واتساب</button>}
            {hasPhone && <button className="lx-btn lx-btn-outline" onClick={onCall} style={{ height: 48 }}><Phone size={18} /> اتصال</button>}
          </div>
          <div className="lx-sticky-spacer" />
        </>
      )}
    </div>
  );
}

const CSS = `
.lx-root { font-family: 'Cairo', sans-serif; background: #0E1422; min-height: 100vh; color: #E7E3D8; }
.lx-root * { box-sizing: border-box; }

/* Hero */
.lx-hero { position: relative; min-height: 520px; overflow: hidden; background: linear-gradient(160deg,#0B0F1A,#16203a); display: flex; align-items: center; justify-content: center; }
.lx-hero-bg { position: absolute; inset: 0; }
.lx-hero-bg img { width: 100%; height: 100%; object-fit: cover; }
.lx-hero-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,11,20,0.72), rgba(8,11,20,0.88) 55%, rgba(14,20,34,0.97)); }
.lx-hero-inner { position: relative; z-index: 2; max-width: 880px; margin: 0 auto; padding: 90px 24px 96px; text-align: center; display: flex; flex-direction: column; align-items: center; }

.lx-logo-ring { width: 124px; height: 124px; border-radius: 50%; padding: 6px; border: 1px solid #C9A227; box-shadow: 0 0 0 1px rgba(201,162,39,0.25), 0 18px 50px rgba(0,0,0,0.5); margin-bottom: 30px; }
.lx-logo { width: 100%; height: 100%; border-radius: 50%; background: #0B0F1A; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.lx-logo img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

.lx-name { font-size: clamp(34px,6vw,64px); font-weight: 900; color: #fff !important; margin: 0; letter-spacing: -1px; line-height: 1.08; text-shadow: 0 2px 30px rgba(0,0,0,0.5); }
.lx-divider { width: 62px; height: 2px; background: #C9A227; margin: 26px auto 22px; }
.lx-tagline { font-size: clamp(15px,2vw,18px); font-weight: 500; color: #C8C2B2; margin: 0 0 28px; letter-spacing: 0.3px; line-height: 1.9; max-width: 540px; }

.lx-badges { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 34px; }
.lx-badge { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 700; color: #E9D9A6; background: rgba(201,162,39,0.06); border: 1px solid rgba(201,162,39,0.4); letter-spacing: 0.3px; }

.lx-hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
.lx-btn { height: 52px; padding: 0 28px; border-radius: 6px; border: none; font-weight: 800; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 9px; font-family: 'Cairo', sans-serif; transition: transform .12s, filter .15s, background .15s; letter-spacing: 0.2px; }
.lx-btn:hover { transform: translateY(-1px); }
.lx-btn-gold { background: #C9A227; color: #0B0F1A; box-shadow: 0 10px 28px rgba(201,162,39,0.28); }
.lx-btn-gold:hover { filter: brightness(1.06); }
.lx-btn-outline { background: transparent; color: #E9D9A6; border: 1px solid rgba(201,162,39,0.55); }
.lx-btn-outline:hover { background: rgba(201,162,39,0.1); }
.lx-iconbtn { width: 52px; height: 52px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 1px solid rgba(201,162,39,0.4); color: #E9D9A6; flex-shrink: 0; transition: background .15s; }
.lx-iconbtn:hover { background: rgba(201,162,39,0.1); }

/* Main */
.lx-main { max-width: 1180px; margin: 0 auto; padding: 64px 24px 0; }

.lx-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: rgba(201,162,39,0.18); border: 1px solid rgba(201,162,39,0.18); border-radius: 14px; overflow: hidden; margin-bottom: 64px; }
@media (min-width:760px){ .lx-stats { grid-template-columns: repeat(3,1fr); } }
.lx-stat { background: #121A2B; padding: 36px 18px; text-align: center; }
.lx-stat-n { font-size: 46px; font-weight: 800; color: #C9A227; line-height: 1; }
.lx-stat-loc { font-size: 24px; padding-top: 10px; }
.lx-stat-l { font-size: 11px; color: #8C93A3; margin-top: 14px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }

/* Section label */
.lx-label { display: flex; align-items: center; gap: 14px; font-size: 13px; font-weight: 800; color: #C9A227; letter-spacing: 2px; text-transform: uppercase; }
.lx-label-line { width: 34px; height: 1px; background: #C9A227; display: inline-block; }

/* About */
.lx-about { margin-bottom: 70px; max-width: 760px; }
.lx-about p { color: #B9B5A8; line-height: 2.15; font-size: 16.5px; font-weight: 400; margin: 22px 0 0; }

/* Listings head */
.lx-listhead { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 34px; }
.lx-tabs { display: flex; gap: 9px; flex-wrap: wrap; }
.lx-tab { padding: 9px 22px; border-radius: 999px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s; background: transparent; color: #A9AEBC; border: 1px solid rgba(255,255,255,0.14); }
.lx-tab:hover { border-color: rgba(201,162,39,0.5); color: #E9D9A6; }
.lx-tab-on { background: #C9A227; color: #0B0F1A; border-color: #C9A227; }

/* Grid + card wrappers */
.lx-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
@media (min-width:980px){ .lx-grid { grid-template-columns: repeat(3,1fr); } }
.lx-cardwrap { background: #fff; border-radius: 18px; padding: 8px; border: 1px solid rgba(201,162,39,0.22); box-shadow: 0 16px 40px rgba(0,0,0,0.32); transition: transform .15s, box-shadow .15s; }
.lx-cardwrap:hover { transform: translateY(-3px); box-shadow: 0 22px 54px rgba(0,0,0,0.42); }

/* Empty */
.lx-empty { text-align: center; padding: 80px 20px; border: 1px dashed rgba(201,162,39,0.3); border-radius: 18px; background: #121A2B; }
.lx-empty p { color: #A9AEBC; font-weight: 700; font-size: 16px; margin: 18px 0 0; }

/* Pager */
.lx-pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 44px; }
.lx-pgbtn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; border: 1px solid rgba(201,162,39,0.4); background: transparent; color: #E9D9A6; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; transition: background .15s; }
.lx-pgbtn:hover:not(:disabled) { background: rgba(201,162,39,0.1); }
.lx-pgbtn:disabled { opacity: .35; cursor: not-allowed; }
.lx-pginfo { font-size: 14px; color: #8C93A3; font-weight: 700; letter-spacing: 1px; }

/* Footer */
.lx-footer { text-align: center; padding: 70px 20px 56px; color: #7E8494; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 26px; }
.lx-footer-line { width: 50px; height: 1px; background: rgba(201,162,39,0.5); display: inline-block; }
.lx-footer a { color: #C9A227; font-weight: 800; text-decoration: none; }
.lx-footer a:hover { text-decoration: underline; }

/* Mobile sticky */
.lx-sticky { position: fixed; bottom: 0; inset-inline: 0; z-index: 40; display: flex; gap: 10px; padding: 12px 16px; background: rgba(11,15,26,0.96); backdrop-filter: blur(10px); border-top: 1px solid rgba(201,162,39,0.3); }
.lx-sticky .lx-btn { flex: 1; }
.lx-sticky-spacer { height: 80px; }
@media (min-width: 1024px){ .lx-sticky, .lx-sticky-spacer { display: none; } }
`;
