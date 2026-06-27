import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building, Users, BarChart2, LogOut, Menu, X, Clock, Plus, Home, Palette } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOfficeAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { label: "إعلاناتي", href: "/dashboard/listings", icon: Building },
  { label: "العملاء", href: "/dashboard/leads", icon: Users },
  { label: "الإحصائيات", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "صفحة الهبوط", href: "/dashboard/landing", icon: Palette },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/listings": "إعلاناتي",
  "/dashboard/leads": "العملاء",
  "/dashboard/analytics": "الإحصائيات",
  "/dashboard/landing": "صفحة الهبوط",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { officeUser: user, logout } = useOfficeAuth();

  const isPending = user?.status === "pending";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const pageTitle = PAGE_TITLES[location] ?? "لوحة التحكم";
  const initial = (user?.name?.trim()?.[0] ?? "م").toUpperCase();

  return (
    <div dir="rtl" className="dsh-root">
      <style>{`
        .dsh-root { min-height:100vh; display:flex; background:#F6F8FC; font-family:'Cairo',system-ui,sans-serif; }
        .dsh-sidebar {
          position:fixed; top:0; bottom:0; right:0; z-index:50; width:272px; max-width:84vw;
          background:linear-gradient(185deg,#243150 0%,#1F2A44 60%,#1A2238 100%);
          display:flex; flex-direction:column;
          transform:translateX(100%); transition:transform .32s cubic-bezier(.4,0,.2,1);
          box-shadow:-8px 0 32px rgba(15,23,42,0.28);
        }
        .dsh-sidebar.open { transform:translateX(0); }
        @media (min-width:768px){ .dsh-sidebar{ position:static; transform:none; box-shadow:none; max-width:none; } }
        .dsh-logo-wrap {
          height:78px; display:flex; align-items:center; gap:11px; padding:0 22px;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .dsh-logo-badge {
          width:34px; height:34px; border-radius:10px; flex-shrink:0;
          background:linear-gradient(135deg,#3F5BD8,#5B73E0);
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
          background:linear-gradient(135deg,#3F5BD8,#5B73E0); color:#fff;
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
          background:linear-gradient(135deg,#3F5BD8,#4B66E0); color:#fff; font-weight:700;
          box-shadow:0 8px 20px rgba(63,91,216,0.5), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .dsh-navlink.active::before {
          content:""; position:absolute; inset-inline-start:-12px; top:50%; transform:translateY(-50%);
          width:4px; height:22px; border-radius:0 4px 4px 0; background:#fff; opacity:.9;
        }
        .dsh-navlink .dsh-ico { width:19px; height:19px; flex-shrink:0; }
        .dsh-bottom { margin-top:auto; padding:14px 12px; border-top:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:3px; }
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
        .dsh-pagetitle { font-size:18px; font-weight:800; color:#1F2A44; letter-spacing:-0.01em; }
        .dsh-pagetitle small { display:block; font-size:11.5px; font-weight:600; color:#94A3B8; margin-top:1px; letter-spacing:0; }
        .dsh-cta {
          display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 18px;
          border-radius:13px; font-weight:700; font-size:14px; color:#fff; border:none; cursor:pointer;
          background:linear-gradient(135deg,#3F5BD8,#4B66E0);
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
        {/* Logo */}
        <div className="dsh-logo-wrap">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <span className="dsh-logo-badge">
              <Building className="h-[18px] w-[18px]" style={{ color: "#fff" }} />
            </span>
            <span className="dsh-logo-text">
              <b>Finde</b>
              <span>منصة العقارات</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="dsh-office">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="dsh-avatar">{initial}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="dsh-office-name">{user.name}</p>
                <p className="dsh-office-email">{user.email}</p>
              </div>
            </div>
            {isPending && (
              <span className="dsh-pending">
                <Clock className="h-3 w-3" />
                قيد المراجعة
              </span>
            )}
          </div>
        )}

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
            className="md:hidden flex-shrink-0 text-[#1F2A44] hover:bg-slate-100"
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

        {/* Pending Banner */}
        {isPending && (
          <div className="dsh-pending-banner" data-testid="pending-banner">
            <span style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "rgba(63,91,216,0.12)", border: "1px solid rgba(63,91,216,0.2)",
            }}>
              <Clock className="h-5 w-5" style={{ color: "#3F5BD8" }} />
            </span>
            <div>
              <span className="font-bold" style={{ color: "#1F2A44" }}>حسابك قيد المراجعة</span>
              <span className="text-sm mr-2" style={{ color: "#64748B" }}>
                سيتم تفعيل حسابك خلال 24 ساعة. يمكنك إضافة إعلانات الآن وستُنشر بعد التفعيل.
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
