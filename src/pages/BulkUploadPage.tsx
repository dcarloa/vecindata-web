import { useState } from "react";
import { CsvUpload } from "../components/CsvUpload/CsvUpload";
import { BatchReviewTable, type ReviewRow } from "../components/BatchReviewTable/BatchReviewTable";
import { BatchProgress, type RowProgress } from "../components/BatchProgress/BatchProgress";
import { geocodeAddress } from "../api/geocoding";
import { runBatch, type BatchRow, type BatchRowResult } from "../batch/runBatch";
import { buildResultsZip } from "../batch/buildResultsZip";
import { triggerDownload } from "../utils/download";
import { HEX_COLOR_PATTERN } from "../components/ReportForm/ReportForm";
import styles from "./BulkUploadPage.module.css";

type Stage = "upload" | "geocoding" | "review" | "generating" | "done";

interface BulkUploadPageProps {
  accessKey: string;
  onAccessDenied: () => void;
}

const FALLBACK_LAT = 4.6842;
const FALLBACK_LON = -74.0559;

export function BulkUploadPage({ accessKey, onAccessDenied }: BulkUploadPageProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [brandError, setBrandError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RowProgress[]>([]);
  const [results, setResults] = useState<BatchRowResult[]>([]);

  async function handleParsed(addresses: string[]) {
    setStage("geocoding");
    const geocoded = await Promise.all(
      addresses.map(async (address): Promise<ReviewRow> => {
        const result = await geocodeAddress(address);
        return {
          id: address,
          formattedAddress: result?.formattedAddress ?? "",
          lat: result?.lat ?? FALLBACK_LAT,
          lon: result?.lon ?? FALLBACK_LON,
          geocoded: result !== null,
          excluded: false,
        };
      })
    );
    setRows(geocoded);
    setStage("review");
  }

  function handleRowChange(
    id: string,
    changes: Partial<Pick<ReviewRow, "lat" | "lon" | "excluded">>
  ) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));
  }

  async function handleGenerateAll() {
    if (brandColor.length > 0 && !HEX_COLOR_PATTERN.test(brandColor)) {
      setBrandError("El color de marca debe ser un hexadecimal válido, ej. #4f46e5.");
      return;
    }
    setBrandError(null);

    const batchRows: BatchRow[] = rows
      .filter((row) => !row.excluded)
      .map((row) => ({
        id: row.id,
        values: {
          address: row.formattedAddress || row.id,
          lat: row.lat,
          lon: row.lon,
          logoUrl: logoUrl.trim(),
          brandColor,
        },
      }));

    setStage("generating");
    setProgress(batchRows.map((row) => ({ id: row.id, status: "pending" })));

    const outcome = await runBatch(batchRows, accessKey, {
      onRowStart: (id) =>
        setProgress((current) =>
          current.map((row) => (row.id === id ? { ...row, status: "generating" } : row))
        ),
      onRowComplete: (result) =>
        setProgress((current) =>
          current.map((row) =>
            row.id === result.id
              ? {
                  id: result.id,
                  status: result.status,
                  message: result.status === "error" ? result.message : undefined,
                }
              : row
          )
        ),
    });

    if (outcome.accessDenied) {
      onAccessDenied();
      return;
    }

    setResults(outcome.results);
    setStage("done");
  }

  async function handleDownloadZip() {
    const zipBlob = await buildResultsZip(results);
    triggerDownload(zipBlob, "reportes-vecindata.zip");
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Generar reportes en lote</h1>
      <p className={styles.intro}>
        Sube un CSV con una dirección por fila para generar varios reportes a la vez.
      </p>

      {stage === "upload" && <CsvUpload onParsed={handleParsed} />}
      {stage === "geocoding" && <p>Buscando coordenadas…</p>}

      {(stage === "review" || stage === "generating" || stage === "done") && (
        <>
          <div className={styles.brandFields}>
            <label className={styles.field}>
              <span>Logo (URL, opcional)</span>
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Color de marca (opcional)</span>
              <input value={brandColor} onChange={(event) => setBrandColor(event.target.value)} />
            </label>
            {brandError && (
              <p role="alert" className={styles.error}>
                {brandError}
              </p>
            )}
          </div>
          {stage === "review" && (
            <>
              <BatchReviewTable rows={rows} onRowChange={handleRowChange} />
              <button type="button" onClick={handleGenerateAll} className={styles.generateButton}>
                Generar todos
              </button>
            </>
          )}
          {(stage === "generating" || stage === "done") && (
            <BatchProgress
              rows={progress}
              isComplete={stage === "done"}
              onDownload={handleDownloadZip}
            />
          )}
        </>
      )}
    </main>
  );
}
