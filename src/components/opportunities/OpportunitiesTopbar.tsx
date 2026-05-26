import styles from "./OpportunitiesTopbar.module.css";
import "./theme.css";

export type OpportunitiesSortMode = "recommended" | "score" | "location";

export interface OpportunitiesTopbarProps {
  sortMode: OpportunitiesSortMode;
  onSortModeChange: (mode: OpportunitiesSortMode) => void;
  className?: string;
}

export function OpportunitiesTopbar({
  sortMode,
  onSortModeChange,
  className,
}: OpportunitiesTopbarProps) {
  return (
    <div className={`${styles.wrap} opportunitiesTheme ${className ?? ""}`.trim()}>
      <div className={styles.textBlock}>
        <h1 className={styles.title}>Your Matches</h1>
        <p className={styles.subtitle}>Ranked by project fit, capacity and location</p>
      </div>
      <div className={styles.sortWrap}>
        <label htmlFor="opp-sort" className={styles.sortLabel}>
          Sort
        </label>
        <select
          id="opp-sort"
          className={styles.select}
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value as OpportunitiesSortMode)}
        >
          <option value="recommended">Recommended</option>
          <option value="score">Match score</option>
          <option value="location">Location (A–Z)</option>
        </select>
      </div>
    </div>
  );
}
