import { useEffect, useRef, useState } from "react";
import { ReportForm, type ReportFormValues } from "../components/ReportForm/ReportForm";
import {
  ReportPreviewCard,
  type ReportStatus,
} from "../components/ReportPreviewCard/ReportPreviewCard";
import { BatchGenerator } from "../components/BatchGenerator/BatchGenerator";
import { generateReport, ReportApiError } from "../api/reportApi";
import { slugifyAddress, triggerDownload } from "../utils/download";
import { REQUEST_TIMEOUT_MS } from "../utils/constants";
import styles from "./OperatorPage.module.css";

interface OperatorPageProps {
  accessKey: string;
  onAccessDenied: () => void;
}

type Mode = "single" | "batch";

const TABS: { id: Mode; label: string }[] = [
  { id: "single", label: "Una dirección" },
  { id: "batch", label: "Varias (CSV)" },
];

export function OperatorPage({ accessKey, onAccessDenied }: OperatorPageProps) {
  const [mode, setMode] = useState<Mode>("single");
  const [status, setStatus] = useState<ReportStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handleSubmit(values: ReportFormValues) {
    setStatus("loading");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const pdfBlob = await generateReport(values, accessKey, controller.signal);
      window.clearTimeout(timeoutId);
      const generatedFileName = `reporte-${slugifyAddress(values.address)}.pdf`;
      triggerDownload(pdfBlob, generatedFileName);
      setFileName(generatedFileName);
      setStatus("ready");
    } catch (err) {
      window.clearTimeout(timeoutId);
      if (!isMountedRef.current) {
        return;
      }
      if (err instanceof ReportApiError && err.status === 401) {
        onAccessDenied();
        return;
      }
      const message =
        err instanceof ReportApiError
          ? err.message
          : "No se pudo conectar con el servidor. Intenta de nuevo.";
      setErrorMessage(message);
      setStatus("error");
    }
  }

  function handleRetry() {
    setStatus("idle");
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Generar reporte de ubicación</h1>
      <p className={styles.intro}>
        Ingresa la dirección del inmueble para generar su reporte de ubicación.
      </p>

      <div className={styles.tabs} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            className={mode === tab.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <div className={styles.layout}>
          <ReportForm onSubmit={handleSubmit} isSubmitting={status === "loading"} />
          <ReportPreviewCard
            status={status}
            fileName={fileName}
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        </div>
      )}

      {mode === "batch" && (
        <BatchGenerator accessKey={accessKey} onAccessDenied={onAccessDenied} />
      )}
    </main>
  );
}
