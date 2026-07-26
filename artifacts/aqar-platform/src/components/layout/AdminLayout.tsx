import { useState } from "react";
import { Shield, LogOut, Menu, X, Home, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdminSection {
  key: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}

export interface AdminBottomAction {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface AdminLayoutProps {
  user: { name?: string; email?: string } | null;
  sections: AdminSection[];
  activeKey: string;
  onSelect: (key: string) => void;
  pageTitle: string;
  onLogout: () => void;
  // Extra buttons above "العودة للموقع"/"تسجيل الخروج"; differs per page
  // (main admin: analytics + tour; analytics page: back to admin + refresh).
  bottomActions?: AdminBottomAction[];
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

// Defined at module scope (NOT inside the component) so React never recreates
// the <style> element on re-render. This mirrors DashboardLayout's drawer 1:1
// (translateX(100%) hidden → translateX(0) open). NOTE: the in-app preview
// browser fails to apply the .open transform on transition toggle, so the
// slide can't be verified there — but it works in real browsers, same as the
// office dashboard, which uses the identical CSS.
const ADMIN_LAYOUT_CSS = `
  .adm-root { min-height:100vh; display:flex; background:#F5F7FA; font-family:'Cairo',system-ui,sans-serif; }
  .adm-sidebar {
    position:fixed; top:0; bottom:0; right:0; z-index:50; width:272px; max-width:84vw;
    background:linear-gradient(185deg,#243150 0%,#111827 60%,#1A2238 100%);
    display:flex; flex-direction:column;
    transform:translateX(100%); transition:transform .32s cubic-bezier(.4,0,.2,1);
    box-shadow:-8px 0 32px rgba(15,23,42,0.28);
  }
  .adm-sidebar.open { transform:translateX(0); }
  @media (min-width:768px){ .adm-sidebar{ position:sticky; top:0; height:100vh; align-self:flex-start; transform:none; box-shadow:none; max-width:none; } }
  .adm-logo-wrap { height:78px; display:flex; align-items:center; gap:11px; padding:0 22px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .adm-logo-badge { width:34px; height:34px; border-radius:10px; flex-shrink:0; background:linear-gradient(135deg,#667EEA,#5B73E0); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(63,91,216,0.45); border:none; cursor:pointer; }
  .adm-logo-text { display:flex; flex-direction:column; line-height:1.2; gap:4px; text-align:start; }
  .adm-logo-text b { font-size:16px; font-weight:800; color:#fff; letter-spacing:.01em; }
  .adm-logo-text span { font-size:10.5px; font-weight:600; color:#8295B8; letter-spacing:.06em; }
  .adm-office { margin:18px 14px 6px; padding:15px; border-radius:16px; position:relative; overflow:hidden; background:linear-gradient(145deg,rgba(63,91,216,0.16),rgba(255,255,255,0.04)); border:1px solid rgba(255,255,255,0.1); box-shadow:inset 0 1px 0 rgba(255,255,255,0.06); }
  .adm-avatar { width:44px; height:44px; border-radius:13px; flex-shrink:0; background:linear-gradient(135deg,#667EEA,#5B73E0); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; box-shadow:0 6px 16px rgba(63,91,216,0.5); border:1px solid rgba(255,255,255,0.18); }
  .adm-office-name { font-size:14px; font-weight:700; color:#fff; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .adm-office-email { font-size:11.5px; color:#94A6C8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; }
  .adm-navlabel { font-size:10.5px; font-weight:700; color:#5E6F92; padding:0 18px; margin:22px 0 9px; letter-spacing:.12em; text-transform:uppercase; }
  .adm-navlist { list-style:none; margin:0; padding:0 12px; display:flex; flex-direction:column; gap:3px; overflow-y:auto; }
  .adm-navlink { display:flex; align-items:center; gap:13px; padding:11px 14px; border-radius:13px; font-size:14px; font-weight:600; color:#B6C3DC; background:none; border:none; cursor:pointer; text-decoration:none; position:relative; width:100%; text-align:start; transition:background .18s, color .18s, box-shadow .18s; }
  .adm-navlink:hover { background:rgba(255,255,255,0.06); color:#fff; }
  .adm-navlink.active { background:linear-gradient(135deg,#667EEA,#4B66E0); color:#fff; font-weight:700; box-shadow:0 8px 20px rgba(63,91,216,0.5), inset 0 1px 0 rgba(255,255,255,0.18); }
  .adm-navlink.active::before { content:""; position:absolute; inset-inline-start:-12px; top:50%; transform:translateY(-50%); width:4px; height:22px; border-radius:0 4px 4px 0; background:#fff; opacity:.9; }
  .adm-navlink .adm-ico { width:19px; height:19px; flex-shrink:0; }
  .adm-navcount { margin-inline-start:auto; font-size:11px; font-weight:800; border-radius:999px; padding:1px 8px; line-height:1.6; background:rgba(255,255,255,0.16); color:#fff; }
  .adm-bottom { margin-top:auto; padding:14px 12px; border-top:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:3px; }
  .adm-botlink { display:flex; align-items:center; gap:13px; width:100%; padding:11px 14px; border-radius:13px; font-size:14px; font-weight:600; color:#B6C3DC; text-decoration:none; background:none; border:none; cursor:pointer; transition:background .18s, color .18s; text-align:start; }
  .adm-botlink:hover { background:rgba(255,255,255,0.06); color:#fff; }
  .adm-logout { color:#F2A6A6; }
  .adm-logout:hover { background:rgba(220,38,38,0.16); color:#FECACA; }
  .adm-topbar { height:68px; background:rgba(255,255,255,0.92); backdrop-filter:saturate(180%) blur(10px); border-bottom:1px solid #EAEEF5; display:flex; align-items:center; gap:12px; padding:0 20px; position:sticky; top:0; z-index:30; box-shadow:0 1px 0 rgba(15,23,42,0.02); }
  .adm-pagetitle { font-size:18px; font-weight:800; color:#111827; letter-spacing:-0.01em; }
  .adm-pagetitle small { display:block; font-size:11.5px; font-weight:600; color:#94A3B8; margin-top:1px; letter-spacing:0; }
  .adm-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter:blur(2px); z-index:40; }
  @media (min-width:768px){ .adm-overlay{ display:none; } }
`;

// Mirrors DashboardLayout (the office dashboard): full-height sidebar on the
// right (RTL), content column on the left, and on mobile the sidebar becomes
// an off-canvas drawer opened by the ☰ button in the top bar.
export default function AdminLayout({
  user, sections, activeKey, onSelect, pageTitle, onLogout, bottomActions, onNavigate, children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initial = (user?.name?.trim()?.[0] ?? "أ").toUpperCase();

  return (
    <div dir="rtl" className="adm-root">
      <style>{ADMIN_LAYOUT_CSS}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="adm-logo-wrap">
          <button className="adm-logo-badge" onClick={() => onNavigate("/admin")} aria-label="لوحة الإدارة">
            <Shield className="h-[18px] w-[18px]" style={{ color: "#fff" }} />
          </button>
          <button onClick={() => onNavigate("/admin")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span className="adm-logo-text">
              <b>لوحة الإدارة</b>
              <span>منصة Finde الكويت</span>
            </span>
          </button>
        </div>

        {user && (
          <div className="adm-office">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="adm-avatar">{initial}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="adm-office-name">{user.name}</p>
                <p className="adm-office-email">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <p className="adm-navlabel">الأقسام</p>
          <ul className="adm-navlist">
            {sections.map(({ key, label, icon: Icon, count }) => (
              <li key={key}>
                <button
                  className={`adm-navlink ${activeKey === key ? "active" : ""}`}
                  onClick={() => { onSelect(key); setSidebarOpen(false); }}
                >
                  <Icon className="adm-ico" />
                  {label}
                  {count ? <span className="adm-navcount">{count}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="adm-bottom">
          {bottomActions?.map(({ key, icon: Icon, label, onClick }) => (
            <button key={key} className="adm-botlink" onClick={() => { onClick(); setSidebarOpen(false); }}>
              <Icon className="adm-ico" />
              {label}
            </button>
          ))}
          <button className="adm-botlink" onClick={() => onNavigate("/")}>
            <Home className="adm-ico" />
            العودة للموقع
          </button>
          <button onClick={onLogout} className="adm-botlink adm-logout">
            <LogOut className="adm-ico" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ minWidth: 0 }}>
        <header className="adm-topbar">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0 text-[#111827] hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="adm-pagetitle">
            {pageTitle}
            <small>لوحة تحكم المنصة</small>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
