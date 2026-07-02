import { Link } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MessageCircle, MapPin, Building2, ShieldCheck, Star,
  ChevronLeft, ChevronRight, Home as HomeIcon, CheckCircle2,
} from "lucide-react";
import type { TemplateProps, CardProperty } from "./types";
import { emptyMessage } from "./types";
import { TypeFilter } from "./TypeFilter";

/**
 * CLASSIC — corporate / trust look: solid navy top bar with logo + trust badges
 * and left-aligned contact buttons, a thin steel-blue info strip, then a
 * TWO-COLUMN body (sticky info sidebar on the right + listings main column).
 * Structured, bordered, divider-heavy. Distinct from the single-column templates.
 */
export default function ClassicTemplate(p: TemplateProps) {
  const { office, properties, loadingProps, activeTab, setActiveTab, activeType, setActiveType, propertyTypes, page, totalPages, setPage, onWhatsApp, onCall, statusTabs, hasWA, hasPhone } = p;

  return (
    <div dir="rtl" className="cl-root">
      <style>{CSS}</style>

      {/* Solid navy corporate top bar */}
      <header className="cl-topbar">
        <div className="cl-topbar-inner">
          <div className="cl-brand">
            <div className="cl-brand-logo">
              {office.logo ? <img src={office.logo} alt={office.nameAr} /> : <Building2 size={34} style={{ color: "#111827" }} />}
            </div>
            <div className="cl-brand-text">
              <h1 className="cl-name">{office.nameAr}</h1>
              <div className="cl-badges">
                {office.verified && <span className="cl-badge cl-badge-ok"><ShieldCheck size={13} /> موثّق</span>}
                {office.featured && <span className="cl-badge cl-badge-feat"><Star size={13} /> مميز</span>}
                {office.governorateName && <span className="cl-badge"><MapPin size={13} /> {office.governorateName}</span>}
              </div>
            </div>
          </div>

          {(hasWA || hasPhone) && (
            <div className="cl-topbar-actions">
              {hasPhone && <button className="cl-btn cl-btn-call" onClick={onCall}><Phone size={18} /> اتصال</button>}
              {hasWA && <button className="cl-btn cl-btn-wa" onClick={onWhatsApp}><MessageCircle size={18} /> واتساب</button>}
            </div>
          )}
        </div>
      </header>

      {/* Thin steel-blue info strip */}
      <div className="cl-strip">
        <div className="cl-strip-inner">
          {office.governorateName && <span className="cl-strip-item"><MapPin size={14} /> {office.governorateName}</span>}
          {office.verified && <><span className="cl-strip-dot">•</span><span className="cl-strip-item"><ShieldCheck size={14} /> مكتب موثّق</span></>}
          <span className="cl-strip-dot">•</span>
          <span className="cl-strip-item"><Building2 size={14} /> {office.activeListings} عقار متاح</span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="cl-body">
        {/* RIGHT SIDEBAR — info card */}
        <aside className="cl-sidebar">
          <div className="cl-card cl-info">
            <div className="cl-info-logo">
              {office.logo ? <img src={office.logo} alt={office.nameAr} /> : <Building2 size={40} style={{ color: "#111827" }} />}
            </div>
            <h2 className="cl-info-name">{office.nameAr}</h2>

            {office.descriptionAr && (
              <>
                <div className="cl-divider" />
                <h3 className="cl-sub">نبذة عن المكتب</h3>
                <p className="cl-desc">{office.descriptionAr}</p>
              </>
            )}

            {(hasPhone || hasWA) && (
              <>
                <div className="cl-divider" />
                <h3 className="cl-sub">بيانات التواصل</h3>
                <ul className="cl-contact-list">
                  {hasPhone && (
                    <li><span className="cl-ci"><Phone size={16} /></span>
                      <button className="cl-contact-row" onClick={onCall}>{office.phone}</button></li>
                  )}
                  {hasWA && (
                    <li><span className="cl-ci cl-ci-wa"><MessageCircle size={16} /></span>
                      <button className="cl-contact-row" onClick={onWhatsApp}>{office.whatsapp || "واتساب"}</button></li>
                  )}
                </ul>
              </>
            )}

            {(office.verified || office.featured) && (
              <>
                <div className="cl-divider" />
                <h3 className="cl-sub">شهادات الثقة</h3>
                <div className="cl-trust">
                  {office.verified && <span className="cl-trust-badge cl-trust-ok"><CheckCircle2 size={15} /> مكتب موثّق</span>}
                  {office.featured && <span className="cl-trust-badge cl-trust-feat"><Star size={15} /> مكتب مميز</span>}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* MAIN COLUMN — listings */}
        <main className="cl-main">
          <div className="cl-listhead">
            <h2 className="cl-h2">عقارات المكتب</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="cl-tabs">
                {statusTabs.map((t) => (
                  <button key={t} className={`cl-tab ${activeTab === t ? "cl-tab-on" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                ))}
              </div>
              <TypeFilter value={activeType} onChange={setActiveType} types={propertyTypes} accent="#111827" />
            </div>
          </div>

          {loadingProps ? (
            <div className="cl-grid">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
          ) : properties.length === 0 ? (
            <div className="cl-card cl-empty">
              <Building2 size={52} style={{ color: "#cbd5e1", margin: "0 auto" }} />
              <p>{emptyMessage(activeTab, activeType)}</p>
            </div>
          ) : (
            <>
              <div className="cl-grid">
                {properties.map((pr) => <PropertyCard key={pr.id} property={pr as unknown as CardProperty} />)}
              </div>
              {totalPages > 1 && (
                <div className="cl-pager">
                  <button className="cl-pgbtn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronRight size={16} /> السابق</button>
                  <span className="cl-pginfo">صفحة {page} من {totalPages}</span>
                  <button className="cl-pgbtn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي <ChevronLeft size={16} /></button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="cl-footer">
        <div className="cl-footer-inner">
          <HomeIcon size={14} style={{ verticalAlign: "middle", marginLeft: 4 }} />
          مدعوم من <Link href="/">فايند</Link>
        </div>
      </footer>

      {/* Mobile sticky contact bar */}
      {(hasWA || hasPhone) && (
        <>
          <div className="cl-sticky">
            {hasPhone && <button className="cl-btn cl-btn-call" onClick={onCall} style={{ height: 48, flex: 1 }}><Phone size={20} /> اتصال</button>}
            {hasWA && <button className="cl-btn cl-btn-wa" onClick={onWhatsApp} style={{ height: 48, flex: 1 }}><MessageCircle size={20} /> واتساب</button>}
          </div>
          <div className="cl-sticky-spacer" />
        </>
      )}
    </div>
  );
}

const CSS = `
.cl-root { font-family: 'Cairo', sans-serif; background: #F1F4F9; min-height: 100vh; }
.cl-root * { box-sizing: border-box; }

/* Top bar */
.cl-topbar { background: #111827; border-bottom: 3px solid #667EEA; }
.cl-topbar-inner { max-width: 1240px; margin: 0 auto; padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
.cl-brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
.cl-brand-logo { width: 62px; height: 62px; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 2px solid rgba(255,255,255,0.15); }
.cl-brand-logo img { width: 100%; height: 100%; object-fit: cover; }
.cl-brand-text { min-width: 0; }
.cl-name { font-size: clamp(20px,2.6vw,27px); font-weight: 800; color: #fff !important; margin: 0 0 8px; letter-spacing: -0.3px; line-height: 1.15; }
.cl-badges { display: flex; flex-wrap: wrap; gap: 7px; }
.cl-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #cbd5e1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); }
.cl-badge-ok { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.4); color: #6ee7b7; }
.cl-badge-feat { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.4); color: #fcd34d; }
.cl-topbar-actions { display: flex; gap: 10px; flex-shrink: 0; }
.cl-btn { height: 46px; padding: 0 22px; border-radius: 10px; border: none; font-weight: 700; font-size: 14.5px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Cairo', sans-serif; transition: filter .15s, transform .12s; white-space: nowrap; }
.cl-btn:hover { filter: brightness(0.94); transform: translateY(-1px); }
.cl-btn-call { background: #667EEA; color: #fff; box-shadow: 0 4px 14px rgba(63,91,216,0.35); }
.cl-btn-wa { background: #25D366; color: #fff; box-shadow: 0 4px 14px rgba(37,211,102,0.3); }

/* Info strip */
.cl-strip { background: #667EEA; }
.cl-strip-inner { max-width: 1240px; margin: 0 auto; padding: 9px 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cl-strip-item { display: inline-flex; align-items: center; gap: 5px; color: #fff; font-size: 13px; font-weight: 600; opacity: 0.95; }
.cl-strip-dot { color: rgba(255,255,255,0.5); font-weight: 700; }

/* Two-column body */
.cl-body { max-width: 1240px; margin: 0 auto; padding: 26px 22px 0; display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 980px) { .cl-body { grid-template-columns: 320px 1fr; align-items: start; } }

/* Sidebar */
.cl-sidebar { min-width: 0; }
@media (min-width: 980px) { .cl-sidebar { position: sticky; top: 22px; } }
.cl-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 4px 16px rgba(15,23,42,0.05); }
.cl-info { padding: 24px 22px; }
.cl-info-logo { width: 76px; height: 76px; border-radius: 12px; background: #fff; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 14px; }
.cl-info-logo img { width: 100%; height: 100%; object-fit: cover; }
.cl-info-name { font-size: 19px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; line-height: 1.3; }
.cl-divider { height: 1px; background: #EBEFF5; margin: 18px 0; }
.cl-sub { font-size: 13px; font-weight: 800; color: #667EEA; margin: 0 0 10px; letter-spacing: 0.2px; }
.cl-desc { color: #475569; line-height: 1.95; font-size: 14px; margin: 0; }
.cl-contact-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.cl-contact-list li { display: flex; align-items: center; gap: 10px; }
.cl-ci { width: 34px; height: 34px; border-radius: 8px; background: #F1F4F9; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #111827; flex-shrink: 0; }
.cl-ci-wa { color: #25D366; }
.cl-contact-row { background: none; border: none; padding: 0; font-family: 'Cairo', sans-serif; font-size: 14px; font-weight: 600; color: #334155; cursor: pointer; text-align: right; text-decoration: none; word-break: break-all; transition: color .15s; }
.cl-contact-row:hover { color: #667EEA; }
.cl-trust { display: flex; flex-wrap: wrap; gap: 8px; }
.cl-trust-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 700; }
.cl-trust-ok { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
.cl-trust-feat { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }

/* Main column */
.cl-main { min-width: 0; }
.cl-listhead { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #E2E8F0; }
.cl-h2 { font-size: 22px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; position: relative; padding-right: 14px; }
.cl-h2::before { content: ""; position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 22px; background: #667EEA; border-radius: 2px; }
.cl-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.cl-tab { padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s; background: #fff; color: #475569; border: 1px solid #D9E0EA; }
.cl-tab:hover { border-color: #667EEA; color: #667EEA; }
.cl-tab-on { background: #111827; color: #fff; border-color: #111827; }
.cl-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 640px) { .cl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.cl-empty { text-align: center; padding: 60px 20px; }
.cl-empty p { color: #64748B; font-weight: 700; font-size: 16px; margin: 16px 0 0; }
.cl-pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 30px; }
.cl-pgbtn { display: inline-flex; align-items: center; gap: 5px; padding: 9px 16px; border-radius: 10px; border: 1px solid #D9E0EA; background: #fff; color: #111827; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all .15s; }
.cl-pgbtn:hover:not(:disabled) { border-color: #667EEA; color: #667EEA; }
.cl-pgbtn:disabled { opacity: .45; cursor: not-allowed; }
.cl-pginfo { font-size: 14px; color: #64748B; font-weight: 600; }

/* Footer */
.cl-footer { background: #111827; margin-top: 48px; }
.cl-footer-inner { max-width: 1240px; margin: 0 auto; padding: 26px 22px; text-align: center; color: #94a3b8; font-size: 14px; }
.cl-footer a { color: #8aa0f0; font-weight: 800; text-decoration: none; }

/* Mobile sticky */
.cl-sticky { position: fixed; bottom: 0; inset-inline: 0; z-index: 40; display: flex; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.97); backdrop-filter: blur(10px); border-top: 1px solid #E2E8F0; box-shadow: 0 -4px 20px rgba(15,23,42,0.1); }
.cl-sticky-spacer { height: 80px; }
@media (min-width: 980px) { .cl-sticky, .cl-sticky-spacer { display: none; } }
`;
