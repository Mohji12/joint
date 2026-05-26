import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { MatchResponse, ProjectMarketplaceCard } from "@/lib/api";
import {
  buildMatchReasons,
  deterministicViewingCount,
  effectiveSizeSqft,
  formatIntentLabel,
  getMatchTier,
  timelineFromPayload,
  type MatchTier,
} from "./opportunityDerivations";

export type ScarcityEngagementState = "hot" | "active" | "default";

export interface OpportunityCardViewModel {
  projectId: string;
  cardLoc: { primary: string; sub?: string };
  cardType: { typeLine: string; sizePart: string };
  tier: MatchTier;
  reasons: string[];
  roadWidth: string;
  intent: string;
  pidVerified: string;
  timeline: string;
  scarcity: {
    state: ScarcityEngagementState;
    shortlisted: number;
    /** Shown in hot-state copy ("viewing now") */
    viewingDisplay: number;
    /** Per-card engaged count (0 or 1) for active-state copy */
    engaged: number;
    filledDots: 1 | 2 | 3;
  };
  closingLabel: string;
}

const ACTIVE_STATUSES = new Set([
  "CONNECTED",
  "ACCEPTED",
  "BUILDER_SELECTED_PAID",
  "LANDOWNER_SELECTED",
]);

/** Upper half of pseudo viewing band (6–24): hot listing pulse without making every card hot. */
const HOT_VIEWING_THRESHOLD = 15;

function matchEngagedCount(match: MatchResponse | undefined): number {
  if (!match) return 0;
  if (match.express_interest_builder || match.express_interest_landowner) return 1;
  if (ACTIVE_STATUSES.has(match.status)) return 1;
  return 0;
}

function shortlistedForCity(project: ProjectMarketplaceCard, allProjects: ProjectMarketplaceCard[]): number {
  const sameCity = allProjects.filter((p) => p.city === project.city).length;
  return Math.max(1, sameCity);
}

/**
 * Closing / activity line: prefer match timestamps, then optional project created_at at runtime.
 */
export function formatClosingLabel(
  match: MatchResponse | undefined,
  project: ProjectMarketplaceCard & { created_at?: string }
): string {
  const tryFormat = (iso: string | undefined | null, prefix: string) => {
    if (!iso) return null;
    try {
      const d = parseISO(iso);
      if (!isValid(d)) return null;
      return `${prefix} ${formatDistanceToNow(d, { addSuffix: true })}`;
    } catch {
      return null;
    }
  };

  return (
    tryFormat(match?.updated_at, "Updated") ??
    tryFormat(match?.created_at, "Matched") ??
    tryFormat(project.created_at, "Listed") ??
    "Timing TBD"
  );
}

export function mapOpportunityViewModel(
  project: ProjectMarketplaceCard,
  match: MatchResponse | undefined,
  allProjects: ProjectMarketplaceCard[],
  opts?: { sizeFilterMid?: number }
): OpportunityCardViewModel {
  const city = project.city?.trim() || "Location not specified";
  const sub = [project.ward, project.landmark].filter(Boolean).join(" · ") || undefined;
  const sq = effectiveSizeSqft(project);
  const typeLine = project.project_type.replace(/_/g, " ");
  const sizePart = sq != null ? `${Math.round(sq).toLocaleString()} sq ft` : "Size not specified";

  const roadFt = project.road_width_ft;
  const roadWidth = roadFt != null && !Number.isNaN(roadFt) ? `${roadFt} ft` : "—";

  const intentBase = formatIntentLabel(project);
  const intent =
    project.intent?.trim() && project.intent.trim().length > 0
      ? `${intentBase} · ${project.intent.trim()}`
      : intentBase;

  const pidVerified = project.has_pid_verification ? "Yes" : "No";
  const timeline = timelineFromPayload(project);

  const tier = getMatchTier(match?.match_score);
  const reasons = buildMatchReasons(project, match, { sizeRangeMid: opts?.sizeFilterMid });

  const shortlisted = shortlistedForCity(project, allProjects);
  const viewingDisplay = deterministicViewingCount(project.project_id);
  const engaged = matchEngagedCount(match);

  const isHot = viewingDisplay >= HOT_VIEWING_THRESHOLD;

  let state: ScarcityEngagementState;
  if (isHot) state = "hot";
  else if (engaged > 0) state = "active";
  else state = "default";

  const filledDots: 1 | 2 | 3 = state === "hot" ? 3 : state === "active" ? 2 : 1;

  return {
    projectId: project.project_id,
    cardLoc: { primary: city, sub },
    cardType: { typeLine, sizePart },
    tier,
    reasons,
    roadWidth,
    intent,
    pidVerified,
    timeline,
    scarcity: {
      state,
      shortlisted,
      viewingDisplay,
      engaged,
      filledDots,
    },
    closingLabel: formatClosingLabel(match, project as ProjectMarketplaceCard & { created_at?: string }),
  };
}
