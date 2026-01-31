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
  X,
  ChevronDown,
  Building2,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "super-admin" | "admin" | "member";
  /** Override group name in sidebar when super admin views a specific group */
  groupNameOverride?: string;
}

const superAdminNav = [
  { icon: LayoutDashboard, label: "Overview", href: "/super-admin" },
  { icon: Building2, label: "All Groups", href: "/super-admin/groups" },
  { icon: Users, label: "Admins", href: "/super-admin/admins" },
  { icon: Bell, label: "Announcements", href: "/super-admin/announcements" },
  { icon: TrendingUp, label: "Analytics", href: "/super-admin/analytics" },
  { icon: Settings, label: "Settings", href: "/super-admin/settings" },
];

const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Members", href: "/dashboard/members" },
  { icon: Wallet, label: "Contributions", href: "/dashboard/contributions" },
  { icon: TrendingUp, label: "Loans", href: "/dashboard/loans" },
  { icon: History, label: "History", href: "/dashboard/history" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: Bell, label: "Announcements", href: "/dashboard/announcements" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const memberNav = [
  { icon: LayoutDashboard, label: "My Dashboard", href: "/member" },
  { icon: Wallet, label: "My Contributions", href: "/member/contributions" },
  { icon: TrendingUp, label: "My Loans", href: "/member/loans" },
  { icon: History, label: "History", href: "/member/history" },
  { icon: Bell, label: "Announcements", href: "/member/announcements" },
  { icon: Settings, label: "Settings", href: "/member/settings" },
];

export function DashboardLayout({ children, role, groupNameOverride }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, groupMembership, signOut } = useAuth();

  const navItems = role === "super-admin" 
    ? superAdminNav 
    : role === "admin" 
    ? adminNav 
    : memberNav;

  const roleLabels = {
    "super-admin": "Super Admin",
    "admin": "Group Admin",
    "member": "Member"
  };

  const groupName = groupNameOverride || groupMembership?.group_name || (role === "super-admin" ? "System Overview" : "No Group");
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
              Sign Out
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
