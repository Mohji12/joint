import type { ScarcityEngagementState } from "./mapOpportunityViewModel";
import styles from "./ScarcityStrip.module.css";
import "./theme.css";

export interface ScarcityStripProps {
  state: ScarcityEngagementState;
  shortlisted: number;
  viewingDisplay: number;
  engaged: number;
  closingLabel: string;
  filledDots: 1 | 2 | 3;
  className?: string;
}

export function ScarcityStrip({
  state,
  shortlisted,
  viewingDisplay,
  engaged,
  closingLabel,
  filledDots,
  className,
}: ScarcityStripProps) {
  const s = Math.max(0, Math.round(shortlisted));
  const v = Math.max(0, Math.round(viewingDisplay));
  const e = Math.max(0, Math.round(engaged));

  let mainText: string;
  if (state === "hot") {
    mainText = `${s} shortlisted · ${v} viewing now`;
  } else if (state === "active") {
    mainText = `${s} shortlisted · ${e} engaged`;
  } else {
    mainText = `${s} professionals shortlisted`;
  }

  return (
    <div className={`${styles.row} opportunitiesTheme ${className ?? ""}`.trim()} role="status">
      <div className={styles.left}>
        <span className={styles.main}>{mainText}</span>
      </div>
      <div className={styles.right}>
        <span className={styles.closing}>{closingLabel}</span>
        <span className={styles.dots} aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`${styles.dot} ${i < filledDots ? styles.dotFilled : styles.dotEmpty}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
