import { useState } from "react";
import { ReportForm, ReportFormValues } from "../components/ReportForm/ReportForm";
import {
  ReportPreviewCard,
  ReportStatus,
} from "../components/ReportPreviewCard/ReportPreviewCard";
import styles from "./OperatorPage.module.css";

const SIMULATED_GENERATION_DELAY_MS = 1200;

export function OperatorPage() {
  const [status, setStatus] = useState<ReportStatus>("idle");

  function handleSubmit(_values: ReportFormValues) {
    setStatus("loading");
    window.setTimeout(() => {
      setStatus("ready");
    }, SIMULATED_GENERATION_DELAY_MS);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Generar reporte de ubicación</h1>
      <p className={styles.intro}>
        Ingresa la dirección del inmueble. Por ahora te mostramos un reporte
        de ejemplo — pronto quedará conectado a datos reales.
      </p>
      <div className={styles.layout}>
        <ReportForm onSubmit={handleSubmit} isSubmitting={status === "loading"} />
        <ReportPreviewCard status={status} />
      </div>
    </main>
  );
}
