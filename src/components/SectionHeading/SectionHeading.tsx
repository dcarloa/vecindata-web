import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  number: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  number,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div className={`${styles.heading} ${align === "left" ? styles.left : styles.center}`}>
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
