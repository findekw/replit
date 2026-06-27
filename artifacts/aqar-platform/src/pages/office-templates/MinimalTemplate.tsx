import { Link } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MapPin, Building2, ShieldCheck, Star, Mail,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { TemplateProps, CardProperty } from "./types";
import { TypeFilter } from "./TypeFilter";

/**
 * MINIMAL — ultra-clean Scandinavian/editorial look: pure white, big bold black
 * typography, an emerald accent underline, hairline dividers instead of cards,
 * tons of whitespace. Deliberately the calmest, most typographic of the four.
 */
export default function MinimalTemplate(p: TemplateProps) {
  const { office, properties, loadingProps, activeTab, setActiveTab, activeType, setActiveType, propertyTypes, page, totalPages, setPage, onWhatsApp, onCall, statusTabs, hasWA, hasPhone } = p;

  return (
    <div dir="rtl" className="mn-root">
      <style>{CSS}</style>

      <main className="mn-wrap">
        {/* Masthead */}
        <header className="mn-head">
          <div className="mn-logo">
            {office.logo ? <img src={office.logo} alt={office.nameAr} /> : <Building2 size={26} strokeWidth={1.5} style={{ color: "#0F172A" }} />}
          </div>

          <div className="mn-head-meta">
            {office.governorateName && (
              <div className="mn-context"><MapPin size={13} strokeWidth={1.75} /> {office.governorateName}</div>
            )}
            {(office.verified || office.featured) && (
              <div className="mn-flags">
                {office.verified && <span className="mn-flag"><ShieldCheck size={13} strokeWidth={1.75} /> موثّق</span>}
                {office.featured && <span className="mn-flag"><Star size={13} strokeWidth={1.75} /> مميز</span>}
              </div>
            )}
          </div>

          <h1 className="mn-name">{office.nameAr}</h1>
          <span className="mn-rule" />

          <div className="mn-contact">
            {hasPhone && <button className="mn-btn mn-btn-call" onClick={onCall}><Phone size={16} strokeWidth={1.75} /> اتصال</button>}
            {hasWA && <button className="mn-btn mn-btn-wa" onClick={onWhatsApp}>واتساب</button>}
            {office.email && <a className="mn-btn mn-btn-mail" href={`mailto:${office.email}`}><Mail size={16} strokeWidth={1.75} /> بريد</a>}
          </div>

          {office.coverImage && (
            <div className="mn-cover"><img src={office.coverImage} alt={office.nameAr} /></div>
          )}
        </header>

        {/* About */}
        {office.descriptionAr && (
          <section className="mn-section">
            <div className="mn-eyebrow">نبذة</div>
            <p className="mn-about">{office.descriptionAr}</p>
          </section>
        )}

        {/* Stats — plain numerals, no boxes */}
        <section className="mn-stats">
          <div className="mn-stat">
            <div className="mn-stat-n">{office.activeListings}</div>
            <div className="mn-stat-l">عقار متاح</div>
          </div>
          <span className="mn-stat-div" />
          <div className="mn-stat">
            <div className="mn-stat-n">{office.totalListings}</div>
            <div className="mn-stat-l">إجمالي العقارات</div>
          </div>
          {office.governorateName && (
            <>
              <span className="mn-stat-div" />
              <div className="mn-stat">
                <div className="mn-stat-n mn-stat-n-sm">{office.governorateName}</div>
                <div className="mn-stat-l">الموقع</div>
              </div>
            </>
          )}
        </section>

        {/* Listings */}
        <section className="mn-section">
          <div className="mn-listhead">
            <div className="mn-eyebrow">العقارات</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="mn-tabs">
                {statusTabs.map((t) => (
                  <button key={t} className={`mn-tab ${activeTab === t ? "mn-tab-on" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                ))}
              </div>
              <TypeFilter value={activeType} onChange={setActiveType} types={propertyTypes} accent="#059669" />
            </div>
          </div>

          {loadingProps ? (
            <div className="mn-grid">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
          ) : properties.length === 0 ? (
            <div className="mn-empty">
              <Building2 size={40} strokeWidth={1.25} style={{ color: "#CBD5E1", margin: "0 auto" }} />
              <p>{activeTab === "الكل" ? "لا توجد عقارات منشورة حالياً" : `لا توجد عقارات ${activeTab}`}</p>
            </div>
          ) : (
            <>
              <div className="mn-grid">
                {properties.map((pr) => <PropertyCard key={pr.id} property={pr as unknown as CardProperty} />)}
              </div>
              {totalPages > 1 && (
                <div className="mn-pager">
                  <button className="mn-pgbtn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronRight size={15} strokeWidth={1.75} /> السابق</button>
                  <span className="mn-pginfo">{page} / {totalPages}</span>
                  <button className="mn-pgbtn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي <ChevronLeft size={15} strokeWidth={1.75} /></button>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="mn-footer">
          مدعوم من <Link href="/">فايند</Link>
        </footer>
      </main>

      {/* Mobile sticky contact */}
      {(hasWA || hasPhone) && (
        <>
          <div className="mn-sticky">
            {hasPhone && <button className="mn-btn mn-btn-call" onClick={onCall} style={{ flex: 1 }}><Phone size={16} strokeWidth={1.75} /> اتصال</button>}
            {hasWA && <button className="mn-btn mn-btn-wa" onClick={onWhatsApp} style={{ flex: 1 }}>واتساب</button>}
          </div>
          <div className="mn-sticky-spacer" />
        </>
      )}
    </div>
  );
}

const CSS = `
.mn-root { font-family: 'Cairo', sans-serif; background: #FFFFFF; min-height: 100vh; color: #0F172A; }
.mn-root * { box-sizing: border-box; }
.mn-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* Masthead */
.mn-head { padding: 64px 0 0; }
.mn-logo { width: 60px; height: 60px; border-radius: 12px; border: 1px solid #ECEFF3; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
.mn-logo img { width: 100%; height: 100%; object-fit: cover; }
.mn-head-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 26px 0 10px; }
.mn-context { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748B; letter-spacing: .02em; }
.mn-flags { display: flex; gap: 10px; }
.mn-flag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #0E9F6E; letter-spacing: .01em; }
.mn-name { font-size: clamp(34px, 6vw, 60px); font-weight: 800; color: #0F172A; margin: 0; line-height: 1.05; letter-spacing: -0.02em; }
.mn-rule { display: block; width: 56px; height: 3px; border-radius: 2px; background: #0E9F6E; margin: 22px 0 0; }

.mn-contact { display: flex; gap: 12px; flex-wrap: wrap; margin: 32px 0 0; }
.mn-btn { height: 46px; padding: 0 24px; border-radius: 10px; font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: transparent; transition: background .15s, color .15s, border-color .15s; text-decoration: none; }
.mn-btn-call { border: 1.5px solid #0F172A; color: #0F172A; }
.mn-btn-call:hover { background: #0F172A; color: #fff; }
.mn-btn-wa { border: 1.5px solid #0E9F6E; color: #0E9F6E; }
.mn-btn-wa:hover { background: #0E9F6E; color: #fff; }
.mn-btn-mail { border: 1.5px solid #ECEFF3; color: #64748B; }
.mn-btn-mail:hover { border-color: #0F172A; color: #0F172A; }

.mn-cover { margin: 48px 0 0; border-radius: 16px; overflow: hidden; border: 1px solid #ECEFF3; aspect-ratio: 16 / 6; }
.mn-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Sections + hairlines */
.mn-section { padding: 56px 0; border-top: 1px solid #ECEFF3; margin-top: 56px; }
.mn-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #94A3B8; margin: 0 0 22px; }
.mn-about { color: #475569; line-height: 2.1; font-size: 16px; max-width: 70ch; margin: 0; font-weight: 500; }

/* Stats — plain numerals, hairline separators, no boxes */
.mn-stats { display: flex; align-items: center; flex-wrap: wrap; gap: 28px; padding: 48px 0; border-top: 1px solid #ECEFF3; margin-top: 56px; }
.mn-stat { display: flex; flex-direction: column; gap: 6px; }
.mn-stat-n { font-size: 42px; font-weight: 800; color: #0F172A; line-height: 1; letter-spacing: -0.02em; }
.mn-stat-n-sm { font-size: 24px; }
.mn-stat-l { font-size: 12px; font-weight: 600; letter-spacing: .04em; color: #94A3B8; }
.mn-stat-div { width: 1px; align-self: stretch; background: #ECEFF3; }

/* Listings */
.mn-listhead { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.mn-listhead .mn-eyebrow { margin: 0; }
.mn-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.mn-tab { padding: 7px 14px; border-radius: 8px; font-family: 'Cairo', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; background: transparent; border: none; color: #94A3B8; transition: color .15s, background .15s; }
.mn-tab:hover { color: #0F172A; }
.mn-tab-on { color: #0F172A; background: #F1F5F9; }

.mn-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
@media (min-width: 980px) { .mn-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.mn-empty { text-align: center; padding: 72px 20px; }
.mn-empty p { color: #94A3B8; font-weight: 600; font-size: 15px; margin: 18px 0 0; }

.mn-pager { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 44px; }
.mn-pgbtn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 4px; background: transparent; border: none; color: #0F172A; font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: color .15s; }
.mn-pgbtn:hover:not(:disabled) { color: #0E9F6E; }
.mn-pgbtn:disabled { opacity: .3; cursor: not-allowed; }
.mn-pginfo { font-size: 13px; color: #94A3B8; font-weight: 600; }

.mn-footer { text-align: center; padding: 48px 20px 64px; border-top: 1px solid #ECEFF3; color: #94A3B8; font-size: 13px; font-weight: 500; }
.mn-footer a { color: #0F172A; font-weight: 700; text-decoration: none; }
.mn-footer a:hover { color: #0E9F6E; }

/* Mobile sticky contact */
.mn-sticky { position: fixed; bottom: 0; inset-inline: 0; z-index: 40; display: flex; gap: 10px; padding: 12px 16px; background: #fff; border-top: 1px solid #ECEFF3; }
.mn-sticky-spacer { height: 76px; }
@media (min-width: 1024px) { .mn-sticky, .mn-sticky-spacer { display: none; } }
`;
