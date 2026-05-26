import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus, LogOut, User, LayoutDashboard, ChevronDown } from "lucide-react";
import logoNavbarDark from "@/assets/logo-navbar-dark.svg";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPathForUserType } from "@/lib/api";
import { cn } from "@/lib/utils";

type NavbarProps = {
  variant?: "default" | "hero";
};

const Navbar = ({ variant = "default" }: NavbarProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHero = variant === "hero";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkBaseClass =
    "text-sm px-3 py-2 rounded-md transition-colors duration-200 text-primary-foreground/80 font-normal hover:text-accent hover:bg-primary-foreground/10";
  const navLinkActiveClass = "text-accent font-medium";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md",
        "bg-primary/95 text-primary-foreground border-b border-primary-foreground/20"
      )}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo — compact on small phones */}
          <Link to="/" className="flex items-center shrink-0 min-h-[44px] min-w-[44px]">
            <img
              src={logoNavbarDark}
              alt="Jointlly"
              className="h-9 sm:h-10 md:h-12 w-auto max-w-[140px] sm:max-w-none object-contain object-left"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                <NavigationMenuItem>
                  <Link
                    to="/"
                    className={cn(
                      navLinkBaseClass,
                      location.pathname === "/" && navLinkActiveClass
                    )}
                  >
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "text-sm px-3 py-2 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent text-primary-foreground/80 hover:text-accent",
                      location.pathname.startsWith("/products") && "text-accent font-medium"
                    )}
                  >
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/products/residential"
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">Residential</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Low-rise structures like villas and duplexes
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/products/commercial"
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">Commercial</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Office hubs, hotels, and rental complexes
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/products/industrial"
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">Industrial</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              High-performance structures for machinery
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/products/interior"
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">Interior</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Efficient and visually refined spaces
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/about"
                    className={cn(
                      navLinkBaseClass,
                      location.pathname === "/about" && navLinkActiveClass
                    )}
                  >
                    About Us
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/pricing"
                    className={cn(
                      navLinkBaseClass,
                      location.pathname === "/pricing" && navLinkActiveClass
                    )}
                  >
                    Pricing
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/contact"
                    className={cn(
                      navLinkBaseClass,
                      location.pathname === "/contact" && navLinkActiveClass
                    )}
                  >
                    Contact Us
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/faq"
                    className={cn(
                      navLinkBaseClass,
                      location.pathname === "/faq" && navLinkActiveClass
                    )}
                  >
                    FAQ
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 ml-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        )}
                      >
                        <User className="w-4 h-4 text-primary-foreground" />
                        <span className="text-sm font-medium text-primary-foreground">{user?.name || "User"}</span>
                        <ChevronDown className="w-4 h-4 text-primary-foreground opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link
                          to={user ? dashboardPathForUserType(user.userType) : "/auth"}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/auth", { state: { userType: "builder" } })}
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate("/auth", { state: { userType: "builder" } })}
                    size="sm"
                    className="gap-2 btn-navbar"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 -mr-1 rounded-md text-primary-foreground hover:bg-primary-foreground/15 transition-colors touch-target flex items-center justify-center"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg md:hidden max-h-[85vh] overflow-y-auto"
        >
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              Home
            </Link>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-2">Products</div>
              <Link
                to="/products/residential"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-2 text-sm text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                Residential
              </Link>
              <Link
                to="/products/commercial"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-2 text-sm text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                Commercial
              </Link>
              <Link
                to="/products/industrial"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-2 text-sm text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                Industrial
              </Link>
              <Link
                to="/products/interior"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-2 text-sm text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
              >
                Interior
              </Link>
            </div>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              About Us
            </Link>
            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              Contact Us
            </Link>
            <Link
              to="/faq"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              FAQ
            </Link>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{user?.name || "User"}</span>
                  </div>
                  <Link
                    to={user ? dashboardPathForUserType(user.userType) : "/auth"}
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent min-h-[44px]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      navigate("/auth", { state: { userType: "builder" } });
                      setIsOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 min-h-[44px]"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/auth", { state: { userType: "builder" } });
                      setIsOpen(false);
                    }}
                    size="sm"
                    className="w-full gap-2 btn-navbar min-h-[44px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
