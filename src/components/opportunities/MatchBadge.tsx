import type { MatchTier } from "./opportunityDerivations";
import { getMatchTierLabel } from "./opportunityDerivations";
import styles from "./MatchBadge.module.css";
import "./theme.css";

export interface MatchBadgeProps {
  tier: MatchTier;
  className?: string;
}

export function MatchBadge({ tier, className }: MatchBadgeProps) {
  const label = getMatchTierLabel(tier);
  return (
    <span
      className={`${styles.badge} ${styles[`tier_${tier}`]} ${className ?? ""}`.trim()}
      data-tier={tier}
    >
      {label}
    </span>
  );
}
