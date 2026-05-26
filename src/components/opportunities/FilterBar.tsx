import type { ClientFilterState, IntentFilterValue, RoadBucket } from "./opportunityDerivations";
import styles from "./FilterBar.module.css";
import "./theme.css";

export interface FilterBarProps {
  availableTypes: string[] | null;
  constructionTypeFilter: string;
  onConstructionTypeChange: (value: string) => void;
  clientFilters: ClientFilterState;
  onClientFiltersChange: (next: ClientFilterState) => void;
  onClear: () => void;
  disabledConstruction?: boolean;
}

const INTENT_OPTIONS: { value: IntentFilterValue; label: string }[] = [
  { value: "all", label: "All intents" },
  { value: "CONTRACT_CONSTRUCTION", label: "Self Construction" },
  { value: "JV_JD", label: "JD" },
  { value: "RECONSTRUCTION", label: "Reconstruction" },
  { value: "INTERIOR", label: "Interiors" },
];

const ROAD_OPTIONS: { value: RoadBucket | "any"; label: string }[] = [
  { value: "any", label: "Any width" },
  { value: "lt20", label: "Under 20 ft" },
  { value: "20_30", label: "20–30 ft" },
  { value: "30plus", label: "30+ ft" },
];

const MATCH_LEVEL_OPTIONS: { value: ClientFilterState["matchLevel"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "medium_high", label: "Medium + High" },
  { value: "high", label: "High" },
];

export function FilterBar({
  availableTypes,
  constructionTypeFilter,
  onConstructionTypeChange,
  clientFilters,
  onClientFiltersChange,
  onClear,
  disabledConstruction,
}: FilterBarProps) {
  const patch = (p: Partial<ClientFilterState>) => onClientFiltersChange({ ...clientFilters, ...p });

  return (
    <div className={`${styles.bar} opportunitiesTheme`}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="opp-type">
          Type
        </label>
        <select
          id="opp-type"
          className={styles.select}
          value={constructionTypeFilter}
          onChange={(e) => onConstructionTypeChange(e.target.value)}
          disabled={disabledConstruction || (availableTypes !== null && availableTypes.length === 0)}
        >
          {availableTypes === null ? (
            <option value="">Loading…</option>
          ) : availableTypes.length === 0 ? (
            <option value="">Submit a profile to unlock</option>
          ) : (
            <option value="">All types</option>
          )}
          {availableTypes?.includes("CONTRACT_CONSTRUCTION") && (
            <option value="CONTRACT_CONSTRUCTION">Contract construction</option>
          )}
          {availableTypes?.includes("JV_JD") && <option value="JV_JD">JV / JD</option>}
          {availableTypes?.includes("INTERIOR") && <option value="INTERIOR">Interior</option>}
          {availableTypes?.includes("RECONSTRUCTION") && (
            <option value="RECONSTRUCTION">Renovation / Repaint</option>
          )}
        </select>
      </div>

      <div className={styles.fieldGrow}>
        <label className={styles.label}>
          Size range (sq ft): {Math.round(clientFilters.sizeMin).toLocaleString()} –{" "}
          {Math.round(clientFilters.sizeMax).toLocaleString()}
        </label>
        <div className={styles.rangeRow}>
          <input
            type="range"
            className={styles.range}
            min={500}
            max={10000}
            step={100}
            value={clientFilters.sizeMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              patch({ sizeMin: Math.min(v, clientFilters.sizeMax) });
            }}
          />
          <input
            type="range"
            className={styles.range}
            min={500}
            max={10000}
            step={100}
            value={clientFilters.sizeMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              patch({ sizeMax: Math.max(v, clientFilters.sizeMin) });
            }}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="opp-road">
          Road width
        </label>
        <select
          id="opp-road"
          className={styles.select}
          value={clientFilters.roadBucket}
          onChange={(e) => patch({ roadBucket: e.target.value as RoadBucket | "any" })}
        >
          {ROAD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="opp-intent">
          Intent
        </label>
        <select
          id="opp-intent"
          className={styles.select}
          value={clientFilters.intent}
          onChange={(e) => patch({ intent: e.target.value as IntentFilterValue })}
        >
          {INTENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="opp-match">
          Match level
        </label>
        <select
          id="opp-match"
          className={styles.select}
          value={clientFilters.matchLevel}
          onChange={(e) =>
            patch({ matchLevel: e.target.value as ClientFilterState["matchLevel"] })
          }
        >
          {MATCH_LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldEnd}>
        <span className={styles.labelSpacer} aria-hidden>
          &nbsp;
        </span>
        <button type="button" className={styles.clearBtn} onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  );
}
