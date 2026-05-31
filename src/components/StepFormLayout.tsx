import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type StepFormSection = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type StepFormLayoutProps = {
  sections: StepFormSection[];
  activeSectionId: string;
  onSectionChange?: (id: string) => void;
  children: React.ReactNode;
  /** One section per page: show step indicator and Back/Next/Submit footer when handlers exist */
  onePagePerSection?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  /** Shown on the submit button while `isSubmitting` is true (defaults to "Submitting…"). */
  submittingLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  className?: string;
  /** If true, show the submit button on every step (not only last). */
  alwaysShowSubmit?: boolean;
};

/**
 * Step form: one page per section. Shows step indicator (Step X of Y) and
 * only the active section content. Footer: Back, and Next or Submit.
 */
export function StepFormLayout({
  sections,
  activeSectionId,
  onSectionChange,
  children,
  onePagePerSection = true,
  onPrev,
  onNext,
  onSubmit,
  submitLabel = "Submit",
  submittingLabel = "Submitting…",
  submitDisabled = false,
  isSubmitting = false,
  className,
  alwaysShowSubmit = false,
}: StepFormLayoutProps) {
  const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = sections[currentIndex];
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= sections.length - 1;

  return (
    <div className={cn("flex flex-col min-h-[50vh]", className)}>
      {/* Step indicator: Step X of Y   Section name */}
      <div className="mb-6 flex flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentIndex + 1} of {sections.length}
          </span>
          {activeSection && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                {(() => {
                  const Icon = activeSection.icon;
                  return <Icon className="w-5 h-5 text-primary" />;
                })()}
                {activeSection.label}
              </span>
            </>
          )}
        </div>
        {/* Optional stepper dots for desktop */}
        <div className="flex items-center gap-1">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/50" : "bg-muted"
              )}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* Single section content   full width, one page per section */}
      <div className="flex-1 rounded-xl border border-border bg-card/30 p-5 sm:p-6 md:p-8">
        {children}
      </div>

      {/* Footer: Back + Next or Submit */}
      {onePagePerSection && (onPrev || onNext || onSubmit) && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            {onPrev && (
              <Button type="button" variant="outline" onClick={onPrev} disabled={isSubmitting}>
                Back
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            {!isLast && onNext && (
              <Button type="button" onClick={onNext}>
                Next
              </Button>
            )}
            {onSubmit && (isLast || alwaysShowSubmit) && (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled || isSubmitting}
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
