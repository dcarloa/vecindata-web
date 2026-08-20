import JSZip from "jszip";
import type { BatchRowResult } from "./runBatch";

export async function buildResultsZip(results: BatchRowResult[]): Promise<Blob> {
  const zip = new JSZip();

  for (const result of results) {
    if (result.status === "success") {
      zip.file(result.fileName, result.blob);
    }
  }

  const failures = results.filter(
    (result): result is Extract<BatchRowResult, { status: "error" }> => result.status === "error"
  );
  const summary =
    failures.length > 0
      ? failures.map((failure) => `${failure.address}: ${failure.message}`).join("\n")
      : "Todas las direcciones se generaron correctamente.";
  zip.file("resumen.txt", summary);

  return zip.generateAsync({ type: "blob" });
}
