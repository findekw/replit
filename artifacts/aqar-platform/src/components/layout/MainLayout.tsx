import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth, useOfficeAuth } from "@/lib/AuthContext";
import { Shield, Menu, X, Instagram, Mail } from "lucide-react";

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.054 23.446a.5.5 0 0 0 .614.614l5.595-1.48A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.031-1.373l-.36-.214-3.733.987.997-3.63-.234-.374A9.86 9.86 0 0 1 2.1 12C2.1 6.534 6.534 2.1 12 2.1c5.467 0 9.9 4.434 9.9 9.9 0 5.467-4.433 9.9-9.9 9.9z"/>
  </svg>
);

const BLUE = "#1F2A44";
const ACCENT = "#3F5BD8";
const HEADER_BG = "#ffffff";
const HEADER_TEXT = "#0f172a";


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading: aL } = useAdminAuth();
  const { officeId, isLoading: oL } = useOfficeAuth();
  const isLoading = aL || oL;
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navLinks = [
    { href: "/",           label: "الرئيسية" },
    { href: "/properties", label: "العقارات" },
    { href: "/plans",      label: "الاشتراك" },
  ];

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => { closeMobile(); }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Overlay ── */}
      <div
        className={`fixed inset-0 z-[998] bg-black/50 transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobile}
      />

      {/* ── Side drawer (slides from right / RTL) ── */}
      <div
        dir="rtl"
        className={`fixed top-0 right-0 h-full w-[78%] max-w-[320px] z-[999] flex flex-col transition-transform duration-300 ease-in-out md:hidden`}
        style={{ background: HEADER_BG, transform: mobileOpen ? "translateX(0)" : "translateX(100%)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e4e6ea" }}>
          <img src="/logo.png" alt="Finde" className="site-logo" />
          <button
            onClick={closeMobile}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: HEADER_TEXT }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-4 py-4 gap-1 flex-1 overflow-y-auto">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-3.5 rounded-xl text-base transition-all duration-200 ${
                location === href
                  ? "text-[#0f172a] font-semibold bg-slate-100"
                  : "text-[#0f172a] font-medium hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="border-t my-3" style={{ borderColor: "#e4e6ea" }} />

          {/* Auth */}
          {!isLoading && (
            <>
              {admin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-base font-medium transition-colors hover:bg-black/5"
                  style={{ color: HEADER_TEXT }}
                >
                  <Shield className="h-4 w-4" style={{ color: HEADER_TEXT, opacity: 0.5 }} />
                  لوحة الإدارة
                </Link>
              ) : officeId ? (
                <Link
                  href="/dashboard"
                  className="mt-1 px-4 py-3.5 rounded-xl text-base font-bold text-center text-white transition-colors"
                  style={{ background: ACCENT }}
                >
                  لوحة التحكم
                </Link>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1">
                  <Link
                    href="/register"
                    className="register-btn text-base font-semibold text-center transition-all"
                    style={{ borderRadius: 10, padding: "14px 20px", width: "100%", display: "block", fontSize: 16 }}
                  >
                    أضف مكتبك مجانًا
                  </Link>
                  <Link
                    href="/login"
                    className="text-base font-semibold text-center"
                    style={{ borderRadius: 10, padding: "12px 20px", width: "100%", display: "block", border: "1.5px solid #e4e6ea", color: HEADER_TEXT }}
                  >
                    دخول المكاتب
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Contact + Social */}
          <div className="border-t mt-2 pt-4 px-1" style={{ borderColor: "#e4e6ea" }}>
            <Link
              href="/contact"
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-base font-medium transition-colors hover:bg-slate-50"
              style={{ color: "#0f172a" }}
              onClick={closeMobile}
            >
              تواصل معنا
            </Link>
            <a
              href="https://www.instagram.com/finde.kw?utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3.5 rounded-xl transition-colors hover:bg-slate-50"
              style={{ color: "#0f172a" }}
            >
              <Instagram className="h-5 w-5" style={{ color: "#E1306C" }} />
            </a>
          </div>
        </nav>
      </div>

      {/* ── Nav + Register button CSS ── */}
      <style>{`
        nav a, .menu a, .nav-link {
          font-size: 16px !important;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          nav a, .menu a, .nav-link {
            font-size: 17px !important;
          }
        }
        .register-btn,
        a.register-btn,
        button.register-btn {
          background: #3F5BD8 !important;
          color: #fff !important;
          border: none !important;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.2s ease !important;
        }
        .register-btn:hover,
        a.register-btn:hover {
          background: #2d4cc0 !important;
        }
        .register-btn:active,
        a.register-btn:active {
          background: #1F2A44 !important;
        }
        .site-logo {
          width: 100px;
          max-width: 100px;
          height: auto;
          object-fit: contain;
          display: block;
          background: transparent;
        }
        @media (min-width: 768px) {
          .site-logo { width: 115px; max-width: 115px; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50" style={{ background: HEADER_BG, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} dir="rtl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">

          {/* Right cluster: logo + nav */}
          <div className="flex items-center gap-9 h-full">
            <Link href="/" className="md:static absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto" style={{ lineHeight: 0, background: "transparent" }}>
              <img
                src="/logo.png"
                alt="Finde"
                className="site-logo"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1 items-center h-full">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[15px] px-4 h-full flex items-center transition-all duration-200 relative ${
                    location === href
                      ? "font-bold text-[#1F2A44] after:absolute after:bottom-0 after:right-3 after:left-3 after:h-[3px] after:rounded-t-full after:bg-[#3F5BD8]"
                      : "font-semibold text-[#475569] hover:text-[#1F2A44]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex gap-2.5 items-center">
            {!isLoading && (
              <>
                {admin ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:text-[#0f172a] hover:bg-slate-200 transition-all duration-200"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    لوحة الإدارة
                  </Link>
                ) : officeId ? (
                  <Link
                    href="/dashboard"
                    className="text-sm font-bold text-white px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                    style={{ background: ACCENT }}
                  >
                    لوحة التحكم
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100"
                      style={{ color: HEADER_TEXT, border: "1.5px solid #e4e6ea" }}
                    >
                      دخول المكاتب
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all duration-200 hover:opacity-90"
                      style={{ background: ACCENT }}
                    >
                      أضف مكتبك مجانًا
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-[#0f172a] hover:bg-slate-100 transition-all duration-200"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1">{children}</main>


      {/* ── Footer ── */}
      <footer dir="rtl" style={{ background: "#002b46", color: "#fff" }}>
        <style>{`
          .ft-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 18px;
            text-align: center;
          }
          .ft-col h3 {
            font-weight: 700;
            color: #ffffff;
            opacity: 1;
            margin: 0 0 10px;
            letter-spacing: 0.01em;
          }
          .ft-link {
            display: block;
            color: #D1D5DB;
            text-decoration: none;
            line-height: 1.8;
            margin-bottom: 6px;
            transition: color 0.15s;
          }
          .ft-link:hover { color: #fff; }
          @media (min-width: 1024px) {
            .ft-col h3 { font-size: 20px; font-weight: 800; }
            .ft-link    { font-size: 15px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .ft-col h3 { font-size: 20px; font-weight: 800; }
            .ft-link    { font-size: 14.5px; }
          }
          @media (max-width: 767px) {
            .ft-col h3 { font-size: 18px; font-weight: 800; }
            .ft-link    { font-size: 14px; }
          }
          .ft-social {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 12px;
          }
          .ft-social-btn {
            display: flex; align-items: center; justify-content: center;
            width: 34px; height: 34px;
            background: rgba(255,255,255,0.12);
            border-radius: 8px; color: #fff; transition: opacity 0.2s;
          }
          .ft-social-btn:hover { opacity: 0.7; }
          .ft-brand-col img { display: block; margin: 0 auto 10px; }
          .ft-divider {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin: 18px 0 14px;
          }
          @media (min-width: 640px) and (max-width: 1023px) {
            .ft-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 22px;
              text-align: right;
            }
            .ft-brand-col { grid-column: 1 / -1; text-align: right; }
            .ft-brand-col img { margin: 0 0 10px auto; }
            .ft-social { justify-content: flex-start; }
          }
          @media (min-width: 1024px) {
            .ft-grid {
              grid-template-columns: 1.4fr 1fr 1.1fr;
              gap: 36px;
              align-items: start;
              text-align: right;
            }
            .ft-brand-col { grid-column: auto; }
            .ft-brand-col img { margin: 0 0 10px auto; }
            .ft-social { justify-content: flex-start; }
          }
        `}</style>

        <div style={{ maxWidth: 1080, marginInline: "auto", padding: "36px 24px 0" }}>
          <div className="ft-grid">

            {/* Col 1 — Brand */}
            <div className="ft-col ft-brand-col">
              <img src="/logo-white.png" alt="Finde" className="site-logo" style={{ marginBottom: 10 }} />
              <p style={{ color: "#D1D5DB", fontSize: 15, lineHeight: 1.8, margin: 0 }}>
                فايند يجمع لك عقارات المكاتب في مكان واحد.
              </p>
            </div>

            {/* Col 2 — Platform */}
            <div className="ft-col">
              <h3>المنصة</h3>
              {[
                { href: "/",           label: "الرئيسية"         },
                { href: "/properties", label: "العقارات"         },
                { href: "/plans",      label: "الاشتراك"         },
                { href: "/login",      label: "تسجيل الدخول"    },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="ft-link">{label}</Link>
              ))}
            </div>

            {/* Col 3 — Important links + social */}
            <div className="ft-col">
              <h3>روابط مهمة</h3>
              {[
                { href: "/terms",      label: "الشروط والأحكام"  },
                { href: "/privacy",    label: "سياسة الخصوصية"  },
                { href: "/disclaimer", label: "إخلاء المسؤولية" },
                { href: "/contact",    label: "تواصل معنا"       },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="ft-link">{label}</Link>
              ))}
              <div className="ft-social">
                <a href="https://wa.me/96595005151" target="_blank" rel="noopener noreferrer"
                  aria-label="WhatsApp" className="ft-social-btn" title="واتساب"
                >
                  <WhatsAppIcon />
                </a>
                <a href="mailto:info@finde.co"
                  aria-label="Email" className="ft-social-btn" title="البريد الإلكتروني"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com/finde.kw?utm_source=qr" target="_blank" rel="noopener noreferrer"
                  aria-label="Instagram" className="ft-social-btn" title="إنستقرام"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://x.com/yourusername" target="_blank" rel="noopener noreferrer"
                  aria-label="X (Twitter)" className="ft-social-btn" title="X"
                >
                  <XIcon />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ maxWidth: 1080, marginInline: "auto", padding: "0 24px 18px" }}>
          <hr className="ft-divider" />
          <p dir="ltr" style={{ textAlign: "center", fontSize: 12, color: "#D1D5DB", margin: 0 }}>
            © {new Date().getFullYear()} Finde | All Rights Reserved
          </p>
        </div>

      </footer>
    </div>
  );
}
