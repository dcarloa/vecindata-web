import { useEffect, useRef, useState } from "react";
import { ReportForm, type ReportFormValues } from "../components/ReportForm/ReportForm";
import {
  ReportPreviewCard,
  type ReportStatus,
} from "../components/ReportPreviewCard/ReportPreviewCard";
import { generateReport, ReportApiError } from "../api/reportApi";
import styles from "./OperatorPage.module.css";

const REQUEST_TIMEOUT_MS = 60_000;

function slugifyAddress(address: string): string {
  return address
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface OperatorPageProps {
  accessKey: string;
  onAccessDenied: () => void;
}

export function OperatorPage({ accessKey, onAccessDenied }: OperatorPageProps) {
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
      <div className={styles.layout}>
        <ReportForm onSubmit={handleSubmit} isSubmitting={status === "loading"} />
        <ReportPreviewCard
          status={status}
          fileName={fileName}
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      </div>
    </main>
  );
}
