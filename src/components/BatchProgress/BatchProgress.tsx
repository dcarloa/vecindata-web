import styles from "./BatchProgress.module.css";

export type RowProgressStatus = "pending" | "generating" | "success" | "error";

export interface RowProgress {
  /** Unique row key (CSV position) — duplicate addresses must not collide. */
  id: string;
  /** Human-readable address shown to the operator. */
  address: string;
  status: RowProgressStatus;
  message?: string;
}

interface BatchProgressProps {
  rows: RowProgress[];
  isComplete: boolean;
  onDownload: () => void;
}

const STATUS_LABEL: Record<RowProgressStatus, string> = {
  pending: "Pendiente",
  generating: "Generando…",
  success: "Listo",
  error: "Error",
};

export function BatchProgress({ rows, isComplete, onDownload }: BatchProgressProps) {
  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.id} className={styles[row.status]}>
            <span className={styles.address}>{row.address}</span>
            <span className={styles.status}>{STATUS_LABEL[row.status]}</span>
            {row.status === "error" && row.message && (
              <span className={styles.message}>{row.message}</span>
            )}
          </li>
        ))}
      </ul>
      {isComplete && (
        <button type="button" className={styles.downloadButton} onClick={onDownload}>
          Descargar todo (.zip)
        </button>
      )}
    </div>
  );
}
