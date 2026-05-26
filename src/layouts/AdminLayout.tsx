import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  FileText,
  Link2,
  LifeBuoy,
  CreditCard,
  Home,
  ChevronRight,
  LogOut,
  Shield,
  Menu,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/landowners", label: "Landowners", icon: UserCircle },
  { path: "/admin/professionals", label: "Professionals", icon: Briefcase },
  { path: "/admin/form-submissions", label: "Form submissions", icon: FileText },
  { path: "/admin/connections", label: "Connections", icon: Link2 },
  { path: "/admin/support-tickets", label: "Support tickets", icon: LifeBuoy },
  { path: "/admin/payments-cases", label: "Payments cases", icon: CreditCard },
];

const accountNavItems = [
  { path: "/admin/settings", label: "Change password", icon: Settings },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed inset-0 z-[1] flex items-stretch w-full m-0 p-0 bg-background overflow-hidden">
      <aside className="w-72 shrink-0 bg-slate-50 hidden lg:flex flex-col border-r border-slate-200 min-h-0 overflow-y-auto">
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-slate-600" />
            <span className="font-semibold text-slate-900">Admin</span>
          </div>
          <UserProfileDropdown variant="admin" triggerClassName="text-slate-800 hover:text-slate-900" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Manage
          </div>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                  active
                    ? "bg-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    active ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 text-slate-700" />}
              </Link>
            );
          })}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4 pt-4 border-t border-border/40">
            Account
          </div>
          {accountNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                  active
                    ? "bg-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    active ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 text-slate-700" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all group"
          >
            <Home className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
            <span>Back to site</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden">
        <header className="lg:hidden shrink-0 border-b border-border/40 bg-background z-50 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 min-h-[52px]">
            <div className="flex items-center gap-2 min-w-0">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-10 w-10 touch-target text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                    aria-label="Open admin menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(20rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] max-w-[100vw] p-0 flex flex-col gap-0 bg-background border-border/40 overflow-hidden [&>button]:text-foreground/90 [&>button]:hover:bg-secondary/70"
                >
                  <SheetHeader className="p-4 border-b border-border/40 text-left space-y-0 shrink-0">
                    <SheetTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5 text-foreground/60" />
                      Admin menu
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[48px] group",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 shrink-0",
                              active ? "text-primary" : "text-foreground/60 group-hover:text-foreground/90"
                            )}
                          />
                          {item.label}
                          {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
                        </Link>
                      );
                    })}
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-4 pt-4 border-t border-border/40">
                      Account
                    </div>
                    {accountNavItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[48px] group",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 shrink-0",
                              active ? "text-primary" : "text-foreground/60 group-hover:text-foreground/90"
                            )}
                          />
                          {item.label}
                          {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
                        </Link>
                      );
                    })}
                    <div className="pt-4 mt-2 border-t border-border/40 space-y-1">
                      <Link
                        to="/"
                        onClick={() => setMobileNavOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground/90 hover:bg-secondary/70 min-h-[48px] group"
                      >
                        <Home className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
                        Back to site
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNavOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground/90 hover:bg-red-50 hover:text-red-600 min-h-[48px] text-left group"
                      >
                        <LogOut className="w-5 h-5 text-foreground/60 group-hover:text-red-600" />
                        Logout
                      </button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
              <span className="font-semibold text-foreground truncate">Admin</span>
            </div>
            <UserProfileDropdown variant="admin" triggerClassName="text-foreground/90 shrink-0" />
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
