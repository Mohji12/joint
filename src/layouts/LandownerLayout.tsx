import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Hammer,
  Handshake,
  Palette,
  Wrench,
  Home,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  Building2,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const LANDOWNER_ACCOUNT_PREFIX = "/landowner/account";

const navItems = [
  { path: "/landowner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/landowner/matches", label: "Your matches", icon: Users },
  { path: "/landowner/marketplace", label: "Opportunities", icon: Store },
];

const projectItems = [
  { path: "/landowner/contract-construction", label: "Contract construction", icon: Hammer },
  { path: "/landowner/joint-venture", label: "Joint venture", icon: Handshake },
  { path: "/landowner/interior", label: "Interior architecture", icon: Palette },
  { path: "/landowner/reconstruction", label: "Renovation / repaint", icon: Wrench },
];

const LandownerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(() =>
    location.pathname.startsWith(LANDOWNER_ACCOUNT_PREFIX)
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith(LANDOWNER_ACCOUNT_PREFIX)) setAccountOpen(true);
  }, [location.pathname]);

  const pathOnly = location.pathname.split("?")[0];

  const isMainNavActive = (path: string) => {
    if (pathOnly.startsWith(LANDOWNER_ACCOUNT_PREFIX)) return false;
    if (path === "/landowner/dashboard") return pathOnly === "/landowner/dashboard";
    return pathOnly === path || pathOnly.startsWith(`${path}/`);
  };

  const isProjectNavActive = (path: string) => {
    if (pathOnly.startsWith(LANDOWNER_ACCOUNT_PREFIX)) return false;
    return pathOnly === path || pathOnly.startsWith(`${path}/`);
  };

  const accountSectionActive = pathOnly.startsWith(LANDOWNER_ACCOUNT_PREFIX);

  const accountSubLinks = [
    { to: `${LANDOWNER_ACCOUNT_PREFIX}/profile`, label: "Profile", icon: User },
    { to: `${LANDOWNER_ACCOUNT_PREFIX}/properties`, label: "Properties", icon: Building2 },
    { to: `${LANDOWNER_ACCOUNT_PREFIX}/payments`, label: "Your payments", icon: CreditCard },
  ] as const;

  const mobileLinkClass =
    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[48px] text-foreground/90 hover:bg-secondary/70";

  return (
    <div className="fixed inset-0 z-[1] flex items-stretch w-full m-0 p-0 bg-background overflow-hidden">
      {/* Modern Sidebar */}
      <aside className="w-72 shrink-0 bg-background hidden lg:flex flex-col min-h-0 overflow-y-auto scrollbar-none">
        <div className="px-6 pt-8 pb-5">
          <UserProfileDropdown variant="landowner" />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="mb-4">
            <div className="text-xs font-semibold text-foreground/55 uppercase tracking-wider mb-2 px-3">
              Main
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const active = isMainNavActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                        active
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "text-foreground/60 group-hover:text-foreground/90")} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4 text-primary" />}
                    </Link>
                  );
                })}
              </div>

              <Collapsible open={accountOpen} onOpenChange={setAccountOpen} className="space-y-1">
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  accountSectionActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <User
                  className={cn(
                    "w-5 h-5 shrink-0",
                    accountSectionActive ? "text-primary" : "text-foreground/60"
                  )}
                />
                <span className="flex-1 text-left">Account</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform text-foreground/60",
                    accountOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1 pl-2">
                {accountSubLinks.map((sub) => {
                  const subActive = pathOnly === sub.to || pathOnly.startsWith(`${sub.to}/`);
                  return (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg py-2 pl-7 pr-3 text-sm font-medium transition-all",
                        subActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/75 hover:bg-secondary/70 hover:text-foreground"
                      )}
                    >
                      <sub.icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          subActive ? "text-primary" : "text-foreground/60"
                        )}
                      />
                      <span className="flex-1">{sub.label}</span>
                      {subActive && <ChevronRight className="w-4 h-4 text-primary" />}
                    </Link>
                  );
                })}
              </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          <div className="pt-6 mt-1">
            <div className="text-xs font-semibold text-foreground/55 uppercase tracking-wider mb-2 px-3">
              Projects
            </div>
            <div className="space-y-3">
            {projectItems.map((item) => {
              const active = isProjectNavActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-foreground/90 hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "text-foreground/60 group-hover:text-foreground/90")} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-primary" />}
                </Link>
              );
            })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 pt-6 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90 hover:bg-secondary/70 hover:text-foreground transition-all group"
          >
            <Home className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90" />
            <span>Back to home</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 text-foreground/60 group-hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden">
        {/* Mobile header — slide-out menu (avoids overflow on narrow screens) */}
        <header className="lg:hidden shrink-0 border-b border-border/40 bg-background z-50 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 min-h-[52px]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10 touch-target"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(20rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] max-w-[100vw] p-0 flex flex-col gap-0 overflow-hidden [&>button]:top-3"
                >
                  <SheetHeader className="p-4 border-b text-left space-y-0 shrink-0">
                    <SheetTitle className="text-base font-semibold">Landowner menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6">
                    <div>
                      <div className="text-xs font-semibold text-foreground/55 uppercase tracking-wider mb-2 px-1">
                        Main
                      </div>
                      <div className="space-y-1">
                        {navItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileNavOpen(false)}
                            className={mobileLinkClass}
                          >
                            <item.icon className="w-5 h-5 shrink-0 text-foreground/60" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/55 uppercase tracking-wider mb-2 px-1">
                        Account
                      </div>
                      <div className="space-y-1">
                        {accountSubLinks.map((sub) => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setMobileNavOpen(false)}
                            className={mobileLinkClass}
                          >
                            <sub.icon className="w-5 h-5 shrink-0 text-foreground/60" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/55 uppercase tracking-wider mb-2 px-1">
                        New project
                      </div>
                      <div className="space-y-1">
                        {projectItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileNavOpen(false)}
                            className={mobileLinkClass}
                          >
                            <item.icon className="w-5 h-5 shrink-0 text-foreground/60" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-border">
                      <Link
                        to="/"
                        onClick={() => setMobileNavOpen(false)}
                        className={mobileLinkClass}
                      >
                        <Home className="w-5 h-5 shrink-0 text-foreground/60" />
                        Back to home
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNavOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className={cn(mobileLinkClass, "w-full text-left hover:text-red-600 hover:bg-red-50")}
                      >
                        <LogOut className="w-5 h-5 shrink-0" />
                        Logout
                      </button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
              <Link
                to="/landowner/dashboard"
                className="font-semibold text-foreground truncate"
                onClick={() => setMobileNavOpen(false)}
              >
                Landowner
              </Link>
            </div>
            <UserProfileDropdown variant="landowner" triggerClassName="p-0 shrink-0" />
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pt-4 sm:pt-6 pb-[max(5rem,env(safe-area-inset-bottom))] lg:pb-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandownerLayout;

