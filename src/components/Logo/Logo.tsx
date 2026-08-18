import styles from "./Logo.module.css";

interface LogoProps {
  variant?: "light" | "dark";
  withWordmark?: boolean;
}

export function Logo({ variant = "light", withWordmark = true }: LogoProps) {
  const mark = (
    <svg
      className={styles.mark}
      viewBox="0 0 40 40"
      role="img"
      aria-label="VecinData"
    >
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <circle cx="20" cy="20" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.65" />
      <circle cx="20" cy="20" r="3.2" fill="var(--color-primary)" />
    </svg>
  );

  return (
    <span className={`${styles.logo} ${variant === "dark" ? styles.dark : styles.light}`}>
      {mark}
      {withWordmark && <span className={styles.wordmark}>VecinData</span>}
    </span>
  );
}
