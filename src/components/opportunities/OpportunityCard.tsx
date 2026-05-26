import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import type { MatchResponse, ProjectMarketplaceCard } from "@/lib/api";
import { mapOpportunityViewModel } from "./mapOpportunityViewModel";
import { MatchBadge } from "./MatchBadge";
import { ScarcityStrip } from "./ScarcityStrip";
import styles from "./OpportunityCard.module.css";
import "./theme.css";

export interface OpportunityCardProps {
  project: ProjectMarketplaceCard;
  match?: MatchResponse;
  allProjects: ProjectMarketplaceCard[];
  onEvaluate: () => void;
  ctaDisabled?: boolean;
  ctaLabel?: string;
  sizeFilterMid?: number;
  detailsSlot?: ReactNode;
  className?: string;
}

export function OpportunityCard({
  project,
  match,
  allProjects,
  onEvaluate,
  ctaDisabled,
  ctaLabel,
  sizeFilterMid,
  detailsSlot,
  className,
}: OpportunityCardProps) {
  const vm = mapOpportunityViewModel(project, match, allProjects, { sizeFilterMid });

  const label =
    ctaLabel ?? (match?.express_interest_builder ? "Selected" : "Evaluate opportunity");

  return (
    <article className={`${styles.card} opportunitiesTheme ${className ?? ""}`.trim()}>
      <div className={styles.headerRow}>
        <div className={styles.headerMain}>
          <div className={styles.locationBlock}>
            <MapPin className={styles.pin} aria-hidden />
            <div>
              <div className={styles.city}>{vm.cardLoc.primary}</div>
              {vm.cardLoc.sub ? <div className={styles.sub}>{vm.cardLoc.sub}</div> : null}
            </div>
          </div>
          <div className={styles.typeSize}>
            <span className={styles.type}>{vm.cardType.typeLine}</span>
            <span className={styles.sep} aria-hidden>
              ·
            </span>
            <span className={styles.size}>{vm.cardType.sizePart}</span>
          </div>
        </div>
        <MatchBadge tier={vm.tier} />
      </div>

      <hr className={styles.divider} />

      <section className={styles.aiSection} aria-labelledby={`why-${vm.projectId}`}>
        <h3 id={`why-${vm.projectId}`} className={styles.aiTitle}>
          Why this matches you:
        </h3>
        <ul className={styles.reasonList}>
          {vm.reasons.slice(0, 3).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <div className={styles.coreGrid}>
        <div className={styles.kv}>
          <span className={styles.k}>Road width</span>
          <span className={styles.v}>{vm.roadWidth}</span>
        </div>
        <div className={styles.kv}>
          <span className={styles.k}>Intent</span>
          <span className={styles.v}>{vm.intent}</span>
        </div>
        <div className={styles.kv}>
          <span className={styles.k}>PID verified</span>
          <span className={styles.v}>{vm.pidVerified}</span>
        </div>
        <div className={styles.kv}>
          <span className={styles.k}>Timeline</span>
          <span className={styles.v}>{vm.timeline}</span>
        </div>
      </div>

      {detailsSlot ? (
        <>
          <hr className={styles.divider} />
          <div className={styles.detailsSlot}>{detailsSlot}</div>
        </>
      ) : null}

      <div className={styles.ctaWrap}>
        <button
          type="button"
          className={styles.cta}
          disabled={ctaDisabled}
          onClick={onEvaluate}
        >
          {label}
        </button>
      </div>

      <ScarcityStrip
        state={vm.scarcity.state}
        shortlisted={vm.scarcity.shortlisted}
        viewingDisplay={vm.scarcity.viewingDisplay}
        engaged={vm.scarcity.engaged}
        closingLabel={vm.closingLabel}
        filledDots={vm.scarcity.filledDots}
      />
    </article>
  );
}
