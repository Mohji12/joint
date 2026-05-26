import styles from "./OpportunitiesHeader.module.css";
import "./theme.css";

export interface OpportunitiesHeaderProps {
  /** e.g. "Your Matches" */
  eyebrow: string;
  title: string;
  description: string;
  countLabel?: string;
  className?: string;
}

export function OpportunitiesHeader({
  eyebrow,
  title,
  description,
  countLabel,
  className,
}: OpportunitiesHeaderProps) {
  return (
    <header className={`${styles.wrap} opportunitiesTheme ${className ?? ""}`.trim()}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        {countLabel ? <span className={styles.count}>{countLabel}</span> : null}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  );
}
