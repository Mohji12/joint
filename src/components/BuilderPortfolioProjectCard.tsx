import type { ProfessionalPortfolioItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PastProjectShowcaseCard } from "@/components/builder/PastProjectShowcaseCard";
import type { ComparisonRecentProject } from "@/components/builder/builderComparisonUtils";

type BuilderPortfolioProjectCardProps = {
  project: ProfessionalPortfolioItem;
  className?: string;
};

function toShowcaseProject(project: ProfessionalPortfolioItem): ComparisonRecentProject {
  return {
    name_location: project.project_name,
    location: project.location ?? undefined,
    built_up_sft: project.area_sqft != null ? String(project.area_sqft) : undefined,
    type: project.project_type?.replace(/_/g, " ") ?? undefined,
    image_urls: project.images ?? undefined,
    completion_year: project.completion_date
      ? String(new Date(project.completion_date).getFullYear())
      : undefined,
  };
}

export function BuilderPortfolioProjectCard({ project, className }: BuilderPortfolioProjectCardProps) {
  return (
    <PastProjectShowcaseCard
      project={toShowcaseProject(project)}
      className={cn("h-full", className)}
    />
  );
}
