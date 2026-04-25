import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/sessions", label: "Training Sessions", icon: Activity },
  { path: "/avatars", label: "Avatars", icon: Users },
  { path: "/aides", label: "Aides", icon: Brain },
  { path: "/fusion", label: "Fusion Engine", icon: Zap },
  { path: "/burnout", label: "Burnout Monitor", icon: AlertTriangle },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

function NavItem({
  item,
  onClick,
}: {
  item: (typeof navItems)[0];
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === item.path;
  const Icon = item.icon;

  return (
    <Link href={item.path} onClick={onClick}>
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
          isActive
            ? "bg-primary/15 text-primary border border-primary/20"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <Icon
          size={17}
          className={cn(
            "shrink-0 transition-colors",
            isActive
              ? "text-primary"
              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80"
          )}
        />
        <span className="truncate">{item.label}</span>
      </span>
    </Link>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading NeuroLift...</p>
        </div>
      </div>
    );
  }

  const SidebarInner = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Cpu size={15} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground">NeuroLift</p>
          <p className="text-[11px] text-sidebar-foreground/35 tracking-wide uppercase">AI Fusion</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
          Platform
        </p>
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} onClick={onItemClick} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.name ?? "User"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {user?.role === "admin" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                  <Shield size={9} />
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <SidebarInner />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground"
        >
          <X size={18} />
        </button>
        <SidebarInner onItemClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Cpu size={12} className="text-primary" />
            </div>
            <span className="text-sm font-semibold">NeuroLift</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
