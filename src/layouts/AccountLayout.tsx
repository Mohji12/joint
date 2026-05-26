import { NavLink, Outlet } from "react-router-dom";
import { Building2, CreditCard, FolderOpen, Images, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountLayoutVariant = "builder" | "landowner";

type AccountLayoutProps = {
  variant: AccountLayoutVariant;
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors whitespace-nowrap",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
  );

export default function AccountLayout({ variant }: AccountLayoutProps) {
  const prefix = variant === "builder" ? "/builder/account" : "/landowner/account";

  const tabs =
    variant === "builder"
      ? [
          { to: `${prefix}/profile`, label: "Profile", icon: User },
          { to: `${prefix}/projects`, label: "Projects", icon: FolderOpen },
          { to: `${prefix}/portfolio`, label: "Portfolio", icon: Images },
          { to: `${prefix}/payments`, label: "Your payments", icon: CreditCard },
        ]
      : [
          { to: `${prefix}/profile`, label: "Profile", icon: User },
          { to: `${prefix}/properties`, label: "Properties", icon: Building2 },
          { to: `${prefix}/payments`, label: "Your payments", icon: CreditCard },
        ];

  return (
    <div className="max-w-7xl mx-auto w-full pb-10 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile
          {variant === "builder" ? ", projects," : ", properties,"} and payment history.
        </p>
      </div>

      <div
        className="flex gap-2 border-b border-border/60 pb-3 mb-6 overflow-x-auto overscroll-contain scrollbar-none -mx-1 px-1"
        role="tablist"
        aria-label="Account sections"
      >
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={(props) => cn(tabClass(props), "shrink-0")}
            end
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
