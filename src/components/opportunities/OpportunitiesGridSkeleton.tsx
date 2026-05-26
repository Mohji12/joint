import styles from "./OpportunitiesGridSkeleton.module.css";
import "./theme.css";

export function OpportunitiesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-busy aria-label="Loading opportunities">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${styles.card} opportunitiesTheme`}>
          <div className={styles.shimmer} />
          <div className={styles.line} />
          <div className={styles.lineShort} />
          <div className={styles.line} />
          <div className={styles.twoCol}>
            <div className={styles.block} />
            <div className={styles.block} />
          </div>
        </div>
      ))}
    </div>
  );
}
