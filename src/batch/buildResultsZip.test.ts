import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildResultsZip } from "./buildResultsZip";
import type { BatchRowResult } from "./runBatch";

describe("buildResultsZip", () => {
  it("includes one file per successful row and a summary of failures", async () => {
    const results: BatchRowResult[] = [
      {
        id: "Calle 1",
        status: "success",
        blob: new Blob(["pdf-a"]),
        fileName: "reporte-a.pdf",
      },
      { id: "Calle 2", status: "error", message: "No se encontraron coordenadas." },
    ];

    const zipBlob = await buildResultsZip(results);
    const zip = await JSZip.loadAsync(zipBlob);

    expect(Object.keys(zip.files).sort()).toEqual(["reporte-a.pdf", "resumen.txt"]);
    const summary = await zip.files["resumen.txt"].async("string");
    expect(summary).toContain("Calle 2: No se encontraron coordenadas.");
  });

  it("writes a success summary when every row succeeded", async () => {
    const results: BatchRowResult[] = [
      { id: "Calle 1", status: "success", blob: new Blob(["pdf-a"]), fileName: "reporte-a.pdf" },
    ];

    const zip = await JSZip.loadAsync(await buildResultsZip(results));
    const summary = await zip.files["resumen.txt"].async("string");

    expect(summary).toMatch(/todas las direcciones se generaron correctamente/i);
  });
});
