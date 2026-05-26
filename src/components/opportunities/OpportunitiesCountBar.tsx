import styles from "./OpportunitiesCountBar.module.css";
import "./theme.css";

export interface OpportunitiesCountBarProps {
  /** Currently shown (filtered / sorted) count */
  totalShown: number;
  /** Optional: total rows from last API fetch before client filters */
  totalLoaded?: number;
  tierHigh: number;
  tierMedium: number;
  tierLow: number;
  className?: string;
}

export function OpportunitiesCountBar({
  totalShown,
  totalLoaded,
  tierHigh,
  tierMedium,
  tierLow,
  className,
}: OpportunitiesCountBarProps) {
  return (
    <div className={`${styles.bar} opportunitiesTheme ${className ?? ""}`.trim()}>
      <div className={styles.countBlock}>
        <span className={styles.countValue}>{totalShown}</span>
        <span className={styles.countLabel}>
          opportunit{totalShown === 1 ? "y" : "ies"}
          {totalLoaded != null && totalLoaded !== totalShown ? (
            <span className={styles.countHint}> · {totalLoaded} loaded</span>
          ) : null}
        </span>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Match level</span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchHigh}`} aria-hidden />
          High ({tierHigh})
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchMedium}`} aria-hidden />
          Medium ({tierMedium})
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchLow}`} aria-hidden />
          Low ({tierLow})
        </span>
      </div>
    </div>
  );
}
