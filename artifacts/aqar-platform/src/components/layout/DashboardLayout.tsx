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
        .dsh-root { min-height:100vh; display:flex; background:#F5F7FA; font-family:'Cairo',system-ui,sans-serif; }
        .dsh-sidebar {
          position:fixed; inset-block:0; inset-inline-end:0; z-index:50; width:264px;
          background:#1F2A44; display:flex; flex-direction:column;
          transform:translateX(100%); transition:transform .3s ease;
          box-shadow:-4px 0 24px rgba(15,23,42,0.12);
        }
        .dsh-sidebar.open { transform:translateX(0); }
        @media (min-width:768px){ .dsh-sidebar{ position:static; transform:none; box-shadow:none; } }
        .dsh-logo-wrap { height:72px; display:flex; align-items:center; padding:0 22px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .dsh-office {
          margin:16px 14px 4px; padding:14px; border-radius:14px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
        }
        .dsh-avatar {
          width:42px; height:42px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#3F5BD8,#5B73E0); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-weight:800; font-size:18px; box-shadow:0 4px 12px rgba(63,91,216,0.4);
        }
        .dsh-office-name { font-size:14px; font-weight:700; color:#fff; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dsh-office-email { font-size:12px; color:#9FB0CE; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dsh-pending {
          display:inline-flex; align-items:center; gap:5px; margin-top:10px;
          font-size:11px; font-weight:700; color:#FCD34D; background:rgba(217,119,6,0.18);
          padding:4px 10px; border-radius:999px; border:1px solid rgba(217,119,6,0.3);
        }
        .dsh-navlabel { font-size:11px; font-weight:700; color:#6B7B9C; padding:0 14px; margin:18px 0 8px; letter-spacing:.08em; }
        .dsh-navlist { list-style:none; margin:0; padding:0 12px; display:flex; flex-direction:column; gap:4px; }
        .dsh-navlink {
          display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px;
          font-size:14px; font-weight:600; color:#C3CEE2; text-decoration:none; position:relative;
          transition:background .18s, color .18s;
        }
        .dsh-navlink:hover { background:rgba(255,255,255,0.07); color:#fff; }
        .dsh-navlink.active { background:#3F5BD8; color:#fff; font-weight:700; box-shadow:0 6px 16px rgba(63,91,216,0.35); }
        .dsh-navlink .dsh-ico { width:19px; height:19px; flex-shrink:0; }
        .dsh-bottom { margin-top:auto; padding:14px 12px; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:4px; }
        .dsh-botlink {
          display:flex; align-items:center; gap:12px; width:100%; padding:11px 14px; border-radius:12px;
          font-size:14px; font-weight:600; color:#C3CEE2; text-decoration:none; background:none; border:none; cursor:pointer;
          transition:background .18s, color .18s; text-align:start;
        }
        .dsh-botlink:hover { background:rgba(255,255,255,0.07); color:#fff; }
        .dsh-logout { color:#FCA5A5; }
        .dsh-logout:hover { background:rgba(220,38,38,0.18); color:#FECACA; }
        .dsh-topbar {
          height:64px; background:#fff; border-bottom:1px solid #EEF1F5;
          display:flex; align-items:center; gap:12px; padding:0 18px;
          position:sticky; top:0; z-index:30;
        }
        .dsh-pagetitle { font-size:17px; font-weight:800; color:#1F2A44; }
        .dsh-pending-banner {
          background:linear-gradient(90deg,#EFF4FF,#F5F7FA); border-bottom:1px solid #DBE4FF;
          padding:14px 24px; display:flex; align-items:center; gap:12px;
        }
        .dsh-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); z-index:40; }
        @media (min-width:768px){ .dsh-overlay{ display:none; } }
      `}</style>

      {/* Sidebar */}
      <aside className={`dsh-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="dsh-logo-wrap">
          <Link href="/"><img src="/logo.png" alt="Finde" className="h-8 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} /></Link>
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
          <div className="dsh-pagetitle">{pageTitle}</div>

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
          <Link href="/dashboard/listings/new" data-testid="header-add-listing-icon">
            <Button
              className="gap-2 h-9 px-4 rounded-xl font-bold"
              style={{ background: "#3F5BD8" }}
              title="إضافة إعلان جديد"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">إضافة إعلان</span>
            </Button>
          </Link>
        </header>

        {/* Pending Banner */}
        {isPending && (
          <div className="dsh-pending-banner" data-testid="pending-banner">
            <Clock className="h-5 w-5 flex-shrink-0" style={{ color: "#3F5BD8" }} />
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
