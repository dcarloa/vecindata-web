import { motion, AnimatePresence } from "framer-motion";
import styles from "./ReportPreviewCard.module.css";

export type ReportStatus = "idle" | "loading" | "ready" | "error";

interface ReportPreviewCardProps {
  status: ReportStatus;
  fileName?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ReportPreviewCard({
  status,
  fileName,
  errorMessage,
  onRetry,
}: ReportPreviewCardProps) {
  return (
    <div className={styles.card}>
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.p
            key="idle"
            className={styles.idle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Completa el formulario para generar tu reporte.
          </motion.p>
        )}

        {status === "loading" && (
          <motion.div
            key="loading"
            className={styles.loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className={styles.spinner} aria-hidden="true" />
            <p>Generando tu reporte...</p>
          </motion.div>
        )}

        {status === "ready" && (
          <motion.div
            key="ready"
            className={styles.ready}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className={styles.badge}>Reporte generado</span>
            <h3 className={styles.readyTitle}>¡Tu reporte está listo!</h3>
            <p className={styles.readyDescription}>
              Se descargó automáticamente como {fileName}.
            </p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            className={styles.errorState}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h3 className={styles.errorTitle}>No se pudo generar el reporte</h3>
            <p className={styles.errorDescription}>{errorMessage}</p>
            <button type="button" onClick={onRetry} className={styles.retryButton}>
              Reintentar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
