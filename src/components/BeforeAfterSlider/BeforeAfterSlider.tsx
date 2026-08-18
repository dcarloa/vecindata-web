import { ReactNode, useState } from "react";
import styles from "./BeforeAfterSlider.module.css";

interface BeforeAfterSliderProps {
  before: ReactNode;
  after: ReactNode;
  beforeLabel: string;
  afterLabel: string;
}

export function BeforeAfterSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>{before}</div>
      <div
        className={styles.panel}
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        {after}
      </div>
      <div className={styles.divider} style={{ left: `${position}%` }} />
      <span className={`${styles.label} ${styles.labelBefore}`}>{beforeLabel}</span>
      <span className={`${styles.label} ${styles.labelAfter}`}>{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className={styles.range}
        aria-label="Arrastra para comparar un anuncio sin y con VecinData"
      />
    </div>
  );
}
