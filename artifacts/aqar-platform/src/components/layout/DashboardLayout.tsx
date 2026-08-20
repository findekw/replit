import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building, BarChart2, LogOut, Menu, X, Plus, Home, Users, Wallet, LifeBuoy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useGetOffice } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { label: "إعلاناتي", href: "/dashboard/listings", icon: Building },
  { label: "عملائي", href: "/dashboard/leads", icon: Users },
  { label: "الإحصائيات", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "حساب المكتب", href: "/dashboard/billing", icon: Wallet },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/listings": "إعلاناتي",
  "/dashboard/leads": "عملائي",
  "/dashboard/analytics": "الإحصائيات",
  "/dashboard/billing": "حساب المكتب",
  "/dashboard/support": "الدعم الفني",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Enable the sidebar's slide transition only AFTER the first paint. On mobile
  // Safari the initial layout can briefly evaluate at a desktop width (before the
  // viewport meta applies), which would otherwise animate the drawer out on load.
  const [ready, setReady] = useState(false);
  const { officeUser: user, officeId, logout } = useOfficeAuth();
  // The office logo lives on the office entity (not the office-user account),
  // so fetch it to show the real profile picture in the sidebar.
  const { data: office } = useGetOffice(officeId ?? 0, { query: { enabled: (officeId ?? 0) > 0 } } as any);
  const officeLogo = (office as any)?.logo as string | undefined;
  const officeName = (office as any)?.nameAr || user?.name || "مكتبك";

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const pageTitle = PAGE_TITLES[location] ?? "لوحة التحكم";
  const initial = (user?.name?.trim()?.[0] ?? "م").toUpperCase();

  return (
    <div dir="rtl" className={`dsh-root ${ready ? "dsh-ready" : ""}`}>
      <style>{`
        .dsh-root { min-height:100vh; display:flex; background:#F6F8FC; font-family:'Cairo',system-ui,sans-serif; }
        .dsh-sidebar {
          position:fixed; top:0; bottom:0; right:0; z-index:50; width:272px; max-width:84vw;
          background:linear-gradient(185deg,#243150 0%,#111827 60%,#1A2238 100%);
          display:flex; flex-direction:column;
          transform:translateX(100%);
          box-shadow:-8px 0 32px rgba(15,23,42,0.28);
        }
        .dsh-ready .dsh-sidebar { transition:transform .32s cubic-bezier(.4,0,.2,1); }
        .dsh-sidebar.open { transform:translateX(0); }
        /* Desktop: pin the sidebar to the viewport (sticky, 100vh) instead of
           letting it stretch with a long page — otherwise the bottom menu
           (back-to-site / logout) drifts far below the nav on tall pages like
           the dashboard. Matches the admin panel's static sidebar. */
        @media (min-width:768px){
          .dsh-sidebar{ position:sticky; top:0; height:100vh; align-self:flex-start; transform:none; box-shadow:none; max-width:none; overflow-y:hidden; }
          .dsh-navlist{ flex:1 1 auto; min-height:0; overflow-y:auto; }
        }
        .dsh-logo-wrap {
          height:78px; display:flex; align-items:center; gap:11px; padding:0 22px;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .dsh-logo-badge {
          width:42px; height:42px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#667EEA,#5B73E0);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 6px 16px rgba(63,91,216,0.45);
        }
        .dsh-logo-text { display:flex; flex-direction:column; line-height:1.1; }
        .dsh-logo-text b { font-size:16px; font-weight:800; color:#fff; letter-spacing:.01em; }
        .dsh-logo-text span { font-size:10.5px; font-weight:600; color:#8295B8; letter-spacing:.06em; }
        .dsh-office {
          margin:18px 14px 6px; padding:15px;
          border-radius:16px; position:relative; overflow:hidden;
          background:linear-gradient(145deg,rgba(63,91,216,0.16),rgba(255,255,255,0.04));
          border:1px solid rgba(255,255,255,0.1);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .dsh-avatar {
          width:44px; height:44px; border-radius:13px; flex-shrink:0;
          background:linear-gradient(135deg,#667EEA,#5B73E0); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-weight:800; font-size:18px; box-shadow:0 6px 16px rgba(63,91,216,0.5);
          border:1px solid rgba(255,255,255,0.18);
        }
        .dsh-office-name { font-size:14px; font-weight:700; color:#fff; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dsh-office-email { font-size:11.5px; color:#94A6C8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; }
        .dsh-pending {
          display:inline-flex; align-items:center; gap:5px; margin-top:12px;
          font-size:11px; font-weight:700; color:#FBBF24; background:rgba(217,119,6,0.2);
          padding:5px 11px; border-radius:999px; border:1px solid rgba(251,191,36,0.32);
        }
        .dsh-navlabel { font-size:10.5px; font-weight:700; color:#5E6F92; padding:0 18px; margin:22px 0 9px; letter-spacing:.12em; text-transform:uppercase; }
        .dsh-navlist { list-style:none; margin:0; padding:0 12px; display:flex; flex-direction:column; gap:3px; }
        .dsh-navlink {
          display:flex; align-items:center; gap:13px; padding:11px 14px; border-radius:13px;
          font-size:14px; font-weight:600; color:#B6C3DC; text-decoration:none; position:relative;
          transition:background .18s, color .18s, box-shadow .18s;
        }
        .dsh-navlink:hover { background:rgba(255,255,255,0.06); color:#fff; }
        .dsh-navlink.active {
          background:linear-gradient(135deg,#667EEA,#4B66E0); color:#fff; font-weight:700;
          box-shadow:0 8px 20px rgba(63,91,216,0.5), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .dsh-navlink.active::before {
          content:""; position:absolute; inset-inline-start:-12px; top:50%; transform:translateY(-50%);
          width:4px; height:22px; border-radius:0 4px 4px 0; background:#fff; opacity:.9;
        }
        .dsh-navlink .dsh-ico { width:19px; height:19px; flex-shrink:0; }
        .dsh-bottom { margin-top:auto; padding:14px 12px; border-top:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:3px; }
        /* Support — shown ONLY inside the office dashboard (registered offices);
           support@finde.co is never exposed on public pages (info@ is the public one). */
        .dsh-support {
          display:flex; align-items:center; gap:11px; margin:0 2px 8px; padding:11px 13px;
          border-radius:14px; text-decoration:none; position:relative; overflow:hidden;
          background:linear-gradient(145deg,rgba(63,91,216,0.18),rgba(255,255,255,0.04));
          border:1px solid rgba(255,255,255,0.1); box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);
          transition:border-color .18s, transform .15s;
        }
        .dsh-support:hover { border-color:rgba(102,126,234,0.55); transform:translateY(-1px); }
        .dsh-support-ico {
          width:36px; height:36px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,#667EEA,#5B73E0); color:#fff; box-shadow:0 6px 16px rgba(63,91,216,0.42);
        }
        .dsh-support-txt { display:flex; flex-direction:column; line-height:1.25; min-width:0; }
        .dsh-support-txt b { font-size:13.5px; font-weight:700; color:#fff; }
        .dsh-support-txt span { font-size:11.5px; color:#94A6C8; direction:ltr; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dsh-botlink {
          display:flex; align-items:center; gap:13px; width:100%; padding:11px 14px; border-radius:13px;
          font-size:14px; font-weight:600; color:#B6C3DC; text-decoration:none; background:none; border:none; cursor:pointer;
          transition:background .18s, color .18s; text-align:start;
        }
        .dsh-botlink:hover { background:rgba(255,255,255,0.06); color:#fff; }
        .dsh-logout { color:#F2A6A6; }
        .dsh-logout:hover { background:rgba(220,38,38,0.16); color:#FECACA; }
        .dsh-topbar {
          height:68px; background:rgba(255,255,255,0.92); backdrop-filter:saturate(180%) blur(10px);
          border-bottom:1px solid #EAEEF5;
          display:flex; align-items:center; gap:12px; padding:0 20px;
          position:sticky; top:0; z-index:30;
          box-shadow:0 1px 0 rgba(15,23,42,0.02);
        }
        .dsh-pagetitle { font-size:18px; font-weight:800; color:#111827; letter-spacing:-0.01em; }
        .dsh-pagetitle small { display:block; font-size:11.5px; font-weight:600; color:#94A3B8; margin-top:1px; letter-spacing:0; }
        .dsh-cta {
          display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 18px;
          border-radius:13px; font-weight:700; font-size:14px; color:#fff; border:none; cursor:pointer;
          background:linear-gradient(135deg,#667EEA,#4B66E0);
          box-shadow:0 8px 20px rgba(63,91,216,0.34);
          transition:transform .15s, box-shadow .15s;
        }
        .dsh-cta:hover { transform:translateY(-1px); box-shadow:0 12px 26px rgba(63,91,216,0.44); }
        .dsh-pending-banner {
          background:linear-gradient(90deg,#EEF3FF,#F6F8FC); border-bottom:1px solid #DBE4FF;
          padding:14px 24px; display:flex; align-items:center; gap:12px;
        }
        .dsh-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter:blur(2px); z-index:40; }
        @media (min-width:768px){ .dsh-overlay{ display:none; } }
      `}</style>

      {/* Sidebar */}
      <aside className={`dsh-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Office identity — the office's own logo + name + email (one block;
            the separate Finde-brand header was redundant with this). */}
        <div className="dsh-logo-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, width: "100%" }}>
            <span className="dsh-logo-badge" style={{ overflow: "hidden" }}>
              {officeLogo
                ? <img src={officeLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{initial}</span>}
            </span>
            <span className="dsh-logo-text" style={{ minWidth: 0, flex: 1 }}>
              <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{officeName}</b>
              <span style={{ fontSize: 11, letterSpacing: 0, color: "#94A6C8", direction: "ltr", textAlign: "right", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: "0 0 auto" }}>
          <p className="dsh-navlabel">القائمة الرئيسية</p>
          <ul className="dsh-navlist">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = location === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`dsh-navlink ${active ? "active" : ""}`}
                    data-testid={`nav-${href.replace(/\//g, "-")}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="dsh-ico" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="dsh-bottom">
          {/* Support — offices only. Opens the structured support page (form +
             direct email); support@finde.co stays inside the dashboard. */}
          <Link href="/dashboard/support" className="dsh-support" data-testid="office-support">
            <span className="dsh-support-ico"><LifeBuoy className="h-[19px] w-[19px]" /></span>
            <span className="dsh-support-txt">
              <b>الدعم الفني للمكاتب</b>
              <span style={{ direction: "rtl", textAlign: "right" }}>استفسار · اقتراح · مساعدة</span>
            </span>
          </Link>
          <Link href="/" className="dsh-botlink">
            <Home className="dsh-ico" />
            العودة للموقع
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="dsh-botlink dsh-logout"
              data-testid="button-logout"
            >
              <LogOut className="dsh-ico" />
              تسجيل الخروج
            </button>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="dsh-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ minWidth: 0 }}>
        {/* Top bar */}
        <header className="dsh-topbar">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0 text-[#111827] hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Page title */}
          <div className="dsh-pagetitle">
            {pageTitle}
            <small>لوحة تحكم المكتب العقاري</small>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
            style={{ color: "#64748B" }}
          >
            <Home className="h-3.5 w-3.5" />
            الموقع
          </Link>
          <Link href="/dashboard/listings/new" data-testid="header-add-listing-icon" style={{ textDecoration: "none" }}>
            <button className="dsh-cta" title="إضافة إعلان جديد">
              <Plus className="h-[17px] w-[17px]" />
              <span className="hidden sm:inline">إضافة إعلان</span>
            </button>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
