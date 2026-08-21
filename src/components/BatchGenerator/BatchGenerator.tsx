import { useEffect, useState } from "react";
import { CsvUpload } from "../CsvUpload/CsvUpload";
import { BatchReviewTable, type ReviewRow } from "../BatchReviewTable/BatchReviewTable";
import { BatchProgress, type RowProgress } from "../BatchProgress/BatchProgress";
import { geocodeAddress } from "../../api/geocoding";
import { runBatch, type BatchRow, type BatchRowResult } from "../../batch/runBatch";
import { buildResultsZip } from "../../batch/buildResultsZip";
import { triggerDownload } from "../../utils/download";
import { mapWithConcurrency } from "../../utils/concurrency";
import { HEX_COLOR_PATTERN } from "../ReportForm/ReportForm";
import { useAdvisorInfo } from "../../hooks/useAdvisorInfo";
import { DEFAULT_RADIUS_M, ALL_CATEGORY_VALUES } from "../../utils/constants";
import styles from "./BatchGenerator.module.css";

type Stage = "upload" | "geocoding" | "review" | "generating" | "done" | "error";

interface BatchGeneratorProps {
  accessKey: string;
  onAccessDenied: () => void;
}

const FALLBACK_LAT = 4.6842;
const FALLBACK_LON = -74.0559;

/**
 * Geocoding is a paid, rate-limited API — firing all 200 rows at once trips
 * OVER_QUERY_LIMIT. Same worker-pool shape `runBatch` uses for POST /reports.
 */
const GEOCODING_CONCURRENCY = 10;

const LONG_RUN_NOTICE =
  "Esto puede tardar varios minutos según cuántas direcciones tengas — no cierres esta pestaña.";

export function BatchGenerator({ accessKey, onAccessDenied }: BatchGeneratorProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [advisorInfo, setAdvisorInfo] = useAdvisorInfo();
  const [brandError, setBrandError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RowProgress[]>([]);
  const [results, setResults] = useState<BatchRowResult[]>([]);

  // A full batch can run for many minutes and there is no server-side job to
  // come back to — closing the tab throws the work away.
  useEffect(() => {
    if (stage !== "generating") return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage]);

  const rowsNeedingReview = rows.filter((row) => !row.excluded && !row.confirmed).length;

  async function handleParsed(addresses: string[]) {
    setStage("geocoding");
    setStageError(null);
    try {
      const geocoded = await mapWithConcurrency(
        addresses,
        GEOCODING_CONCURRENCY,
        async (address, index): Promise<ReviewRow> => {
          const result = await geocodeAddress(address);
          return {
            // Index, not the address: duplicate addresses in one CSV are normal
            // and must stay independently addressable.
            id: String(index),
            address,
            formattedAddress: result?.formattedAddress ?? "",
            lat: result?.lat ?? FALLBACK_LAT,
            lon: result?.lon ?? FALLBACK_LON,
            geocoded: result !== null,
            confirmed: result !== null,
            excluded: false,
          };
        }
      );
      setRows(geocoded);
      setStage("review");
    } catch {
      // Without this the page sits on "Buscando coordenadas…" forever and the
      // only way out is a reload.
      setStageError("No pudimos buscar las coordenadas. Revisa tu conexión e inténtalo de nuevo.");
      setStage("error");
    }
  }

  function handleRetry() {
    setStageError(null);
    setRows([]);
    setStage("upload");
  }

  function handleRowChange(
    id: string,
    changes: Partial<Pick<ReviewRow, "lat" | "lon" | "excluded">>
  ) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        // Moving the pin IS the manual correction the spec requires for rows
        // geocoding couldn't resolve.
        const movedPin = changes.lat !== undefined || changes.lon !== undefined;
        return { ...row, ...changes, confirmed: row.confirmed || movedPin };
      })
    );
  }

  async function downloadZip(batchResults: BatchRowResult[]) {
    const zipBlob = await buildResultsZip(batchResults);
    triggerDownload(zipBlob, "reportes-vecindata.zip");
  }

  async function handleGenerateAll() {
    if (brandColor.length > 0 && !HEX_COLOR_PATTERN.test(brandColor)) {
      setBrandError("El color de marca debe ser un hexadecimal válido, ej. #4f46e5.");
      return;
    }
    // The spec requires every row to be geocoded or manually corrected before
    // generation; the button is disabled, this is the belt-and-braces guard.
    if (rowsNeedingReview > 0) return;
    setBrandError(null);

    const batchRows: BatchRow[] = rows
      .filter((row) => !row.excluded)
      .map((row) => ({
        id: row.id,
        values: {
          address: row.formattedAddress || row.address,
          lat: row.lat,
          lon: row.lon,
          logoUrl: logoUrl.trim(),
          brandColor,
          advisorName: advisorInfo.advisorName,
          advisorWhatsapp: advisorInfo.advisorWhatsapp,
          advisorEmail: advisorInfo.advisorEmail,
          tagline: advisorInfo.tagline,
          radiusM: DEFAULT_RADIUS_M,
          visibleCategories: ALL_CATEGORY_VALUES,
        },
      }));

    setStage("generating");
    setProgress(
      batchRows.map((row) => ({ id: row.id, address: row.values.address, status: "pending" }))
    );

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
                  ...row,
                  status: result.status,
                  message: result.status === "error" ? result.message : undefined,
                }
              : row
          )
        ),
    });

    if (outcome.accessDenied) {
      // Don't throw away reports that already cost money and minutes to make.
      if (outcome.results.length > 0) {
        try {
          await downloadZip(outcome.results);
        } catch {
          // Losing the partial zip must not block the redirect to the gate.
        }
      }
      onAccessDenied();
      return;
    }

    setResults(outcome.results);
    setStage("done");
  }

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Sube un CSV con una dirección por fila para generar varios reportes a la vez.
      </p>

      {stage === "upload" && <CsvUpload onParsed={handleParsed} />}
      {stage === "geocoding" && <p>Buscando coordenadas…</p>}

      {stage === "error" && (
        <div className={styles.errorBox}>
          <p role="alert" className={styles.error}>
            {stageError}
          </p>
          <button type="button" onClick={handleRetry} className={styles.generateButton}>
            Volver a intentar
          </button>
        </div>
      )}

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
            <label className={styles.field}>
              <span>Nombre del asesor (opcional)</span>
              <input
                value={advisorInfo.advisorName}
                onChange={(event) => setAdvisorInfo({ advisorName: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>WhatsApp del asesor (opcional)</span>
              <input
                value={advisorInfo.advisorWhatsapp}
                onChange={(event) => setAdvisorInfo({ advisorWhatsapp: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Email del asesor (opcional)</span>
              <input
                value={advisorInfo.advisorEmail}
                onChange={(event) => setAdvisorInfo({ advisorEmail: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Frase personalizada (opcional)</span>
              <input
                value={advisorInfo.tagline}
                onChange={(event) => setAdvisorInfo({ tagline: event.target.value })}
              />
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
              {rowsNeedingReview > 0 && (
                <p role="status" className={styles.error}>
                  {rowsNeedingReview === 1
                    ? "1 dirección necesita revisión antes de generar."
                    : `${rowsNeedingReview} direcciones necesitan revisión antes de generar.`}
                </p>
              )}
              <p className={styles.notice}>{LONG_RUN_NOTICE}</p>
              <button
                type="button"
                onClick={handleGenerateAll}
                disabled={rowsNeedingReview > 0}
                className={styles.generateButton}
              >
                Generar todos
              </button>
            </>
          )}
          {stage === "generating" && <p className={styles.notice}>{LONG_RUN_NOTICE}</p>}
          {(stage === "generating" || stage === "done") && (
            <BatchProgress
              rows={progress}
              isComplete={stage === "done"}
              onDownload={() => downloadZip(results)}
            />
          )}
        </>
      )}
    </div>
  );
}
