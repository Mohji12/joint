import { useMemo, type ReactNode } from "react";
import type { MatchResponse, ProjectMarketplaceCard } from "@/lib/api";
import {
  FilterBar,
  OpportunitiesCountBar,
  OpportunitiesGridSkeleton,
  OpportunitiesTopbar,
  OpportunityCard,
  getMatchTier,
  type ClientFilterState,
  type OpportunitiesSortMode,
} from "@/components/opportunities";

export interface OpportunitiesPageProps {
  projects: ProjectMarketplaceCard[];
  displayProjects: ProjectMarketplaceCard[];
  matchByProjectId: Map<string, MatchResponse>;
  sortMode: OpportunitiesSortMode;
  onSortModeChange: (mode: OpportunitiesSortMode) => void;
  availableTypes: string[] | null;
  constructionTypeFilter: string;
  onConstructionTypeChange: (value: string) => void;
  clientFilters: ClientFilterState;
  onClientFiltersChange: (next: ClientFilterState) => void;
  onClearFilters: () => void;
  disabledConstruction?: boolean;
  loading: boolean;
  /** Length of `projects` from API (before client filters). */
  projectsLength: number;
  /** Length after `applyClientOpportunityFilters` (before sort). */
  visibleProjectsLength: number;
  sizeFilterMid: number;
  isPaying: boolean;
  renderDetailsSlot: (project: ProjectMarketplaceCard) => ReactNode;
  onEvaluate: (projectId: string) => void;
}

export default function OpportunitiesPage({
  projects,
  displayProjects,
  matchByProjectId,
  sortMode,
  onSortModeChange,
  availableTypes,
  constructionTypeFilter,
  onConstructionTypeChange,
  clientFilters,
  onClientFiltersChange,
  onClearFilters,
  disabledConstruction,
  loading,
  projectsLength,
  visibleProjectsLength,
  sizeFilterMid,
  isPaying,
  renderDetailsSlot,
  onEvaluate,
}: OpportunitiesPageProps) {
  const tierCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const p of displayProjects) {
      const t = getMatchTier(matchByProjectId.get(p.project_id)?.match_score);
      if (t === "high") high += 1;
      else if (t === "medium") medium += 1;
      else low += 1;
    }
    return { high, medium, low };
  }, [displayProjects, matchByProjectId]);

  const showCountBar = !loading;

  return (
    <div className="space-y-4 min-w-0 max-w-full overflow-x-hidden">
      <OpportunitiesTopbar sortMode={sortMode} onSortModeChange={onSortModeChange} />

      <FilterBar
        availableTypes={availableTypes}
        constructionTypeFilter={constructionTypeFilter}
        onConstructionTypeChange={onConstructionTypeChange}
        clientFilters={clientFilters}
        onClientFiltersChange={onClientFiltersChange}
        onClear={onClearFilters}
        disabledConstruction={disabledConstruction}
      />

      {showCountBar && (
        <OpportunitiesCountBar
          totalShown={displayProjects.length}
          totalLoaded={visibleProjectsLength < projectsLength ? projectsLength : undefined}
          tierHigh={tierCounts.high}
          tierMedium={tierCounts.medium}
          tierLow={tierCounts.low}
        />
      )}

      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Loading landowner projects…</p>
          <OpportunitiesGridSkeleton count={6} />
        </div>
      )}

      {!loading && displayProjects.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Landowner opportunities
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayProjects.map((project) => {
              const match = matchByProjectId.get(project.project_id);
              const alreadySelected = Boolean(match?.express_interest_builder);
              return (
                <OpportunityCard
                  key={project.project_id}
                  project={project}
                  match={match}
                  allProjects={projects}
                  sizeFilterMid={sizeFilterMid}
                  detailsSlot={renderDetailsSlot(project)}
                  onEvaluate={() => onEvaluate(project.project_id)}
                  ctaDisabled={alreadySelected || isPaying}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
