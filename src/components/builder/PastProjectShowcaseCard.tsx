import { cn } from "@/lib/utils";
import {
  placeholderGradientForIndex,
  projectHeaderCaption,
  projectMetaLine,
  projectTitle,
  projectYearLabel,
  type ComparisonRecentProject,
} from "./builderComparisonUtils";

type PastProjectShowcaseCardProps = {
  project: ComparisonRecentProject;
  index?: number;
  className?: string;
};

export function PastProjectShowcaseCard({ project, index = 0, className }: PastProjectShowcaseCardProps) {
  const imageUrl = project.image_urls?.find(Boolean);
  const title = projectTitle(project, index);
  const caption = projectHeaderCaption(project);
  const meta = projectMetaLine(project);
  const year = projectYearLabel(project, index);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      <div
        className="relative h-[88px] overflow-hidden"
        style={
          imageUrl
            ? undefined
            : { background: placeholderGradientForIndex(index) }
        }
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <span className="absolute right-2 top-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {year}
        </span>
        <p className="absolute bottom-2 left-2 right-2 text-[11px] font-medium leading-snug text-white drop-shadow-sm">
          {caption}
        </p>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <h4 className="text-sm font-bold leading-tight text-[#111827]">{title}</h4>
        <p className="text-[11px] leading-relaxed text-[#6b7280]">{meta}</p>
      </div>
    </article>
  );
}
