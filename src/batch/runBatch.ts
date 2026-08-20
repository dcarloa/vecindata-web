import { generateReport, ReportApiError } from "../api/reportApi";
import type { ReportFormValues } from "../components/ReportForm/ReportForm";
import { slugifyAddress } from "../utils/download";
import { REQUEST_TIMEOUT_MS } from "../utils/constants";

export interface BatchRow {
  id: string;
  values: ReportFormValues;
}

export type BatchRowResult =
  | { id: string; status: "success"; blob: Blob; fileName: string }
  | { id: string; status: "error"; message: string };

export interface RunBatchOptions {
  concurrency?: number;
  onRowStart?: (id: string) => void;
  onRowComplete?: (result: BatchRowResult) => void;
}

export interface RunBatchOutcome {
  results: BatchRowResult[];
  accessDenied: boolean;
}

export async function runBatch(
  rows: BatchRow[],
  accessKey: string,
  options: RunBatchOptions = {}
): Promise<RunBatchOutcome> {
  const concurrency = options.concurrency ?? 3;
  const results: BatchRowResult[] = [];
  let accessDenied = false;
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (!accessDenied) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= rows.length) return;

      const row = rows[index];
      options.onRowStart?.(row.id);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const blob = await generateReport(row.values, accessKey, controller.signal);
        clearTimeout(timeoutId);
        const result: BatchRowResult = {
          id: row.id,
          status: "success",
          blob,
          fileName: `reporte-${slugifyAddress(row.values.address)}.pdf`,
        };
        results.push(result);
        options.onRowComplete?.(result);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof ReportApiError && err.status === 401) {
          accessDenied = true;
          return;
        }
        const message =
          err instanceof ReportApiError ? err.message : "No se pudo conectar con el servidor.";
        const result: BatchRowResult = { id: row.id, status: "error", message };
        results.push(result);
        options.onRowComplete?.(result);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, () => worker());
  await Promise.all(workers);

  return { results, accessDenied };
}
