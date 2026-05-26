import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type PortfolioTypeSummaryStatus = "saved" | "empty";

type PortfolioTypeSummaryCardProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  status: PortfolioTypeSummaryStatus;
  lines: [string, string][];
  /** When omitted, the card is non-interactive (use action buttons outside the tile). */
  onClick?: () => void;
  /** Footer CTA (builder portfolio uses "Open editable details"; landowner marketplace uses "View full profile"). */
  footerLabel?: string;
  className?: string;
};

/**
 * Summary card matching the builder Portfolio "type" tiles (contract / JV / interior / renovation).
 */
export function PortfolioTypeSummaryCard({
  icon: Icon,
  title,
  status,
  lines,
  onClick,
  footerLabel,
  className,
}: PortfolioTypeSummaryCardProps) {
  const footer =
    footerLabel ??
    (onClick
      ? status === "saved"
        ? "Open editable details"
        : "Open profile form"
      : "At a glance");

  const shellClass = cn(
    "w-full overflow-hidden rounded-2xl border border-[#ddd7ca] bg-[#f8f7f3] text-left shadow-[0_2px_10px_rgba(16,24,40,0.05)]",
    onClick &&
      "transition hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,24,40,0.08)] cursor-pointer",
    !onClick && "cursor-default",
    className
  );

  const inner = (
    <>
      <div className="flex items-center justify-between border-b border-[#e8e2d6] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4.5 w-4.5 shrink-0 text-[#1f4a36]" />
          <h3 className="text-sm font-semibold text-[#1a2e22] truncate">{title}</h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            status === "saved" ? "bg-[#dcefe3] text-[#1f4a36]" : "bg-[#efe8d8] text-[#7a6231]"
          )}
        >
          {status === "saved" ? "Saved" : "Empty"}
        </span>
      </div>
      <div className="space-y-2 px-4 py-3">
        {lines.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[96px_1fr] items-start gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-[#6a766d]">{label}</span>
            <span className="break-words font-medium text-[#22372b]">{value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#e8e2d6] px-4 py-2.5">
        <span className={cn("text-xs font-semibold", onClick ? "text-[#1f4a36]" : "text-[#6a766d]")}>{footer}</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shellClass}>
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
