import { motion, AnimatePresence } from "framer-motion";
import styles from "./ReportPreviewCard.module.css";

export type ReportStatus = "idle" | "loading" | "ready";

interface ReportPreviewCardProps {
  status: ReportStatus;
}

export function ReportPreviewCard({ status }: ReportPreviewCardProps) {
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
            Completa el formulario para ver un reporte de ejemplo.
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
            <span className={styles.badge}>Vista previa de ejemplo</span>
            <h3 className={styles.readyTitle}>¡Tu reporte está listo!</h3>
            <p className={styles.readyDescription}>
              Este es un reporte de ejemplo — pronto se conectará a los datos
              reales de tu propiedad.
            </p>
            <a href="/example-report.pdf" download className={styles.downloadLink}>
              Descargar PDF de ejemplo
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
