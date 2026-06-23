import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building, Users, BarChart2, LogOut, Menu, X, Clock, Plus, Home } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { label: "إعلاناتي", href: "/dashboard/listings", icon: Building },
  { label: "العملاء", href: "/dashboard/leads", icon: Users },
  { label: "الإحصائيات", href: "/dashboard/analytics", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const isPending = user?.status === "pending";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-slate-200 shadow-sm flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        md:static md:translate-x-0
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link href="/"><img src="/logo.png" alt="Finde" className="h-8 w-auto object-contain" /></Link>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-semibold text-[#0f172a] truncate">{user.name}</p>
            <p className="text-xs text-[#0f172a] truncate">{user.email}</p>
            {isPending && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                <Clock className="h-3 w-3" />
                قيد المراجعة
              </span>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-3">
          <p className="text-[11px] font-semibold text-[#0f172a] px-3 mb-2 uppercase tracking-wider">القائمة</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = location === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 ${
                      active
                        ? "font-bold text-[#0f172a] bg-[#3F5BD8]/[0.07] border-l-[3px] border-[#3F5BD8] rounded-r-lg pl-[calc(0.75rem-3px)]"
                        : "font-semibold text-[#0f172a] hover:bg-slate-100 rounded-lg"
                    }`}
                    data-testid={`nav-${href.replace(/\//g, "-")}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[#3F5BD8]" : "text-[#0f172a]"}`} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-200 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0f172a] hover:bg-slate-100 transition-all duration-200"
          >
            <Home className="h-4 w-4 text-[#0f172a]" />
            العودة للموقع
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-30">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Breadcrumb / title */}
          <div className="text-sm font-semibold text-[#0f172a]">
            {user?.name ?? "لوحة التحكم"}
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0f172a] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <Home className="h-3.5 w-3.5" />
            الموقع
          </Link>
          <Link href="/dashboard/listings/new" data-testid="header-add-listing-icon">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:text-[#0f172a] hover:bg-slate-50"
              title="إضافة إعلان جديد"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </header>

        {/* Pending Banner */}
        {isPending && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center gap-3" data-testid="pending-banner">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-blue-800">حسابك قيد المراجعة</span>
              <span className="text-blue-700 text-sm mr-2">
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
