import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  TrendingUp, 
  FileText, 
  Settings,
  Bell,
  LogOut,
  Menu,
  ChevronDown,
  Building2,
  History,
  Megaphone,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "super-admin" | "admin" | "member";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, groupMembership, signOut } = useAuth();
  const { t } = useTranslation();

  const superAdminNav = [
    { icon: LayoutDashboard, label: t('dashboard.overview'), href: "/super-admin" },
    { icon: Building2, label: t('dashboard.allGroups'), href: "/super-admin/groups" },
    { icon: Users, label: t('dashboard.admins'), href: "/super-admin/admins" },
    { icon: Bell, label: t('dashboard.announcements'), href: "/super-admin/announcements" },
    { icon: Settings, label: t('dashboard.settings'), href: "/super-admin/settings" },
  ];

  const adminNav = [
    { icon: LayoutDashboard, label: t('dashboard.title'), href: "/dashboard" },
    { icon: Users, label: t('dashboard.members'), href: "/dashboard/members" },
    { icon: Wallet, label: t('dashboard.contributions'), href: "/dashboard/contributions" },
    { icon: TrendingUp, label: t('dashboard.loans'), href: "/dashboard/loans" },
    { icon: History, label: t('dashboard.history'), href: "/dashboard/history" },
    { icon: FileText, label: t('dashboard.reports'), href: "/dashboard/reports" },
    { icon: Bell, label: t('dashboard.announcements'), href: "/dashboard/announcements" },
    { icon: Megaphone, label: t('dashboard.systemNotices'), href: "/system-notices" },
    { icon: Settings, label: t('dashboard.settings'), href: "/dashboard/settings" },
  ];

  const memberNav = [
    { icon: LayoutDashboard, label: t('dashboard.myDashboard'), href: "/member" },
    { icon: Wallet, label: t('dashboard.myContributions'), href: "/member/contributions" },
    { icon: TrendingUp, label: t('dashboard.myLoans'), href: "/member/loans" },
    { icon: History, label: t('dashboard.history'), href: "/member/history" },
    { icon: Bell, label: t('dashboard.announcements'), href: "/member/announcements" },
    { icon: Megaphone, label: t('dashboard.systemNotices'), href: "/system-notices" },
    { icon: Settings, label: t('dashboard.settings'), href: "/member/settings" },
  ];

  const navItems = role === "super-admin" 
    ? superAdminNav 
    : role === "admin" 
    ? adminNav 
    : memberNav;

  const roleLabels = {
    "super-admin": t('dashboard.superAdmin'),
    "admin": t('dashboard.groupAdmin'),
    "member": t('dashboard.member')
  };

  const groupName = groupMembership?.group_name || (role === "super-admin" ? t('dashboard.systemOverview') : t('dashboard.noGroup'));
  const displayName = profile?.full_name || "User";
  const displayEmail = profile?.email || "";
  const initials = displayName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-lg">e</span>
              </div>
              <span className="text-xl font-bold">Kimina</span>
            </Link>
          </div>

          {/* Group/Role Info */}
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{groupName}</p>
            <Badge variant="gold" className="mt-2">{roleLabels[role]}</Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-manipulation ${
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground active:bg-sidebar-accent"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Language Switcher in Sidebar */}
            <div className="pt-2 border-t border-sidebar-border mt-2">
              <LanguageSwitcher variant="sidebar" />
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-sidebar-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{displayEmail}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 flex-shrink-0" />
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent h-11"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
