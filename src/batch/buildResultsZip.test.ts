import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { buildResultsZip } from "./buildResultsZip";
import type { BatchRowResult } from "./runBatch";

describe("buildResultsZip", () => {
  it("includes one file per successful row and a summary of failures", async () => {
    const results: BatchRowResult[] = [
      {
        id: "0",
        address: "Calle 1",
        status: "success",
        blob: new Blob(["pdf-a"]),
        fileName: "reporte-1-calle-1.pdf",
      },
      {
        id: "1",
        address: "Calle 2",
        status: "error",
        message: "No se encontraron coordenadas.",
      },
    ];

    const zipBlob = await buildResultsZip(results);
    const zip = await JSZip.loadAsync(zipBlob);

    expect(Object.keys(zip.files).sort()).toEqual(["reporte-1-calle-1.pdf", "resumen.txt"]);
    const summary = await zip.files["resumen.txt"].async("string");
    expect(summary).toContain("Calle 2: No se encontraron coordenadas.");
  });

  it("writes a success summary when every row succeeded", async () => {
    const results: BatchRowResult[] = [
      {
        id: "0",
        address: "Calle 1",
        status: "success",
        blob: new Blob(["pdf-a"]),
        fileName: "reporte-1-calle-1.pdf",
      },
    ];

    const zip = await JSZip.loadAsync(await buildResultsZip(results));
    const summary = await zip.files["resumen.txt"].async("string");

    expect(summary).toMatch(/todas las direcciones se generaron correctamente/i);
  });

  it("keeps both PDFs when two rows share the same address", async () => {
    const results: BatchRowResult[] = [
      {
        id: "0",
        address: "Calle 100",
        status: "success",
        blob: new Blob(["pdf-a"]),
        fileName: "reporte-1-calle-100.pdf",
      },
      {
        id: "1",
        address: "Calle 100",
        status: "success",
        blob: new Blob(["pdf-b"]),
        fileName: "reporte-2-calle-100.pdf",
      },
    ];

    const zip = await JSZip.loadAsync(await buildResultsZip(results));

    // Same filename for both would silently overwrite one on extraction.
    expect(Object.keys(zip.files).sort()).toEqual([
      "reporte-1-calle-100.pdf",
      "reporte-2-calle-100.pdf",
      "resumen.txt",
    ]);
    expect(await zip.files["reporte-1-calle-100.pdf"].async("string")).toBe("pdf-a");
    expect(await zip.files["reporte-2-calle-100.pdf"].async("string")).toBe("pdf-b");
  });
});
