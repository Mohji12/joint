import type { MatchResponse, ProjectMarketplaceCard } from "@/lib/api";

export type MatchTier = "high" | "medium" | "low";

export type RoadBucket = "lt20" | "20_30" | "30plus";

export type MatchLevelFilter = "high" | "medium_high" | "all";

/** UI intent filter keys aligned with project_type */
export type IntentFilterValue =
  | "all"
  | "CONTRACT_CONSTRUCTION"
  | "JV_JD"
  | "INTERIOR"
  | "RECONSTRUCTION";

const TIER_HIGH = 0.7;
const TIER_MEDIUM = 0.4;

export function getMatchTier(score: number | undefined | null): MatchTier {
  if (score == null || Number.isNaN(score)) return "low";
  if (score >= TIER_HIGH) return "high";
  if (score >= TIER_MEDIUM) return "medium";
  return "low";
}

export function getMatchTierLabel(tier: MatchTier): "High Match" | "Medium" | "Low" {
  if (tier === "high") return "High Match";
  if (tier === "medium") return "Medium";
  return "Low";
}

export function effectiveSizeSqft(project: ProjectMarketplaceCard): number | null {
  const p = project.plot_area_sqft;
  if (p != null && !Number.isNaN(p)) return p;
  const b = project.total_buildable_area_sqft;
  if (b != null && !Number.isNaN(b)) return b;
  return null;
}

export function bucketRoadWidth(roadFt: number | null | undefined): RoadBucket | null {
  if (roadFt == null || Number.isNaN(roadFt)) return null;
  if (roadFt < 20) return "lt20";
  if (roadFt <= 30) return "20_30";
  return "30plus";
}

export function roadBucketLabel(bucket: RoadBucket): string {
  const labels: Record<RoadBucket, string> = {
    lt20: "under 20 ft",
    "20_30": "20–30 ft",
    "30plus": "30+ ft",
  };
  return labels[bucket];
}

/** Display label for Intent column / filter */
export function formatIntentLabel(project: ProjectMarketplaceCard): string {
  const map: Record<string, string> = {
    CONTRACT_CONSTRUCTION: "Self Construction",
    JV_JD: "JD",
    INTERIOR: "Interiors",
    RECONSTRUCTION: "Reconstruction",
  };
  return map[project.project_type] ?? project.project_type.replace(/_/g, " ");
}

export function timelineFromPayload(project: ProjectMarketplaceCard): string {
  const t =
    project.timeline?.trim() ||
    (project.landowner_form_payload?.project_intent?.timeline as string | undefined)?.trim();
  return t || "—";
}

/** Deterministic 6–24 from project id for "viewing" scarcity */
export function deterministicViewingCount(projectId: string): number {
  let h = 0;
  for (let i = 0; i < projectId.length; i++) {
    h = (h * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return 6 + (h % 19);
}

export function buildMatchReasons(
  project: ProjectMarketplaceCard,
  match: MatchResponse | undefined,
  opts?: { sizeRangeMid?: number }
): string[] {
  const reasons: string[] = [];
  const city = project.city?.trim();
  const ward = project.ward?.trim();
  if (city) {
    reasons.push(
      ward
        ? `Location match: listing in ${city} (${ward}).`
        : `Location match: listing in ${city}.`
    );
  }
  const sq = effectiveSizeSqft(project);
  if (sq != null) {
    const mid = opts?.sizeRangeMid ?? 5250;
    const delta = Math.abs(sq - mid);
    if (delta < 1500) {
      reasons.push(`Size compatibility: ${Math.round(sq).toLocaleString()} sq ft aligns with typical project scale.`);
    } else {
      reasons.push(`Size compatibility: ${Math.round(sq).toLocaleString()} sq ft on file.`);
    }
  }
  const road = project.road_width_ft;
  const b = bucketRoadWidth(road);
  if (b) {
    reasons.push(`Road width: ${road} ft (${roadBucketLabel(b)}) — suitable for access planning.`);
  }
  if (reasons.length < 2 && match != null) {
    const pct = (match.match_score * 100).toFixed(0);
    reasons.push(`Algorithm score ${pct}% based on your profile and this listing.`);
  }
  return reasons.slice(0, 3);
}

export interface ClientFilterState {
  sizeMin: number;
  sizeMax: number;
  roadBucket: RoadBucket | "any";
  intent: IntentFilterValue;
  matchLevel: MatchLevelFilter;
}

export function defaultClientFilters(): ClientFilterState {
  return {
    sizeMin: 500,
    sizeMax: 10000,
    roadBucket: "any",
    intent: "all",
    matchLevel: "all",
  };
}

function matchPassesLevelFilter(
  match: MatchResponse | undefined,
  matchLevel: MatchLevelFilter
): boolean {
  if (matchLevel === "all") return true;
  const tier = getMatchTier(match?.match_score);
  if (matchLevel === "high") return tier === "high";
  if (matchLevel === "medium_high") return tier === "high" || tier === "medium";
  return true;
}

export function applyClientOpportunityFilters(
  projects: ProjectMarketplaceCard[],
  matchByProjectId: Map<string, MatchResponse>,
  filters: ClientFilterState
): ProjectMarketplaceCard[] {
  return projects.filter((project) => {
    if (filters.intent !== "all" && project.project_type !== filters.intent) {
      return false;
    }
    const sq = effectiveSizeSqft(project);
    if (sq != null) {
      if (sq < filters.sizeMin || sq > filters.sizeMax) return false;
    }
    const rb = bucketRoadWidth(project.road_width_ft);
    if (filters.roadBucket !== "any") {
      if (rb == null) return false;
      if (rb !== filters.roadBucket) return false;
    }
    const match = matchByProjectId.get(project.project_id);
    if (!matchPassesLevelFilter(match, filters.matchLevel)) return false;
    return true;
  });
}
