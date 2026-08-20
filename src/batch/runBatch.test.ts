import { describe, it, expect, vi, beforeEach } from "vitest";
import { runBatch, type BatchRow } from "./runBatch";
import { generateReport, ReportApiError } from "../api/reportApi";

vi.mock("../api/reportApi", () => ({
  generateReport: vi.fn(),
  ReportApiError: class ReportApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
}));

const mockedGenerateReport = vi.mocked(generateReport);

let nextRowId = 0;

function makeRow(address: string): BatchRow {
  const row: BatchRow = {
    id: String(nextRowId),
    values: { address, lat: 4.6, lon: -74.0, logoUrl: "", brandColor: "" },
  };
  nextRowId += 1;
  return row;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("runBatch", () => {
  beforeEach(() => {
    mockedGenerateReport.mockReset();
    nextRowId = 0;
  });

  it("never runs more than `concurrency` requests at the same time", async () => {
    const rows = [makeRow("A"), makeRow("B"), makeRow("C"), makeRow("D")];
    const gates = rows.map(() => deferred<Blob>());
    let started = 0;
    mockedGenerateReport.mockImplementation(() => {
      const gate = gates[started];
      started += 1;
      return gate.promise;
    });

    const outcomePromise = runBatch(rows, "key", { concurrency: 2 });

    await vi.waitFor(() => expect(started).toBe(2));
    gates[0].resolve(new Blob());
    await vi.waitFor(() => expect(started).toBe(3));
    gates[1].resolve(new Blob());
    gates[2].resolve(new Blob());
    await vi.waitFor(() => expect(started).toBe(4));
    gates[3].resolve(new Blob());

    const outcome = await outcomePromise;
    expect(outcome.results).toHaveLength(4);
    expect(outcome.accessDenied).toBe(false);
  });

  it("records a per-row error and keeps going when a row fails without a 401", async () => {
    const rows = [makeRow("A"), makeRow("B")];
    mockedGenerateReport
      .mockRejectedValueOnce(new ReportApiError("Dirección inválida."))
      .mockResolvedValueOnce(new Blob());

    const outcome = await runBatch(rows, "key", { concurrency: 2 });

    expect(outcome.accessDenied).toBe(false);
    expect(outcome.results).toEqual(
      expect.arrayContaining([
        { id: "0", address: "A", status: "error", message: "Dirección inválida." },
        expect.objectContaining({ id: "1", address: "B", status: "success" }),
      ])
    );
  });

  it("stops scheduling new rows after a 401 and reports accessDenied", async () => {
    const rows = [makeRow("A"), makeRow("B"), makeRow("C")];
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("Clave de acceso inválida.", 401)
    );

    const outcome = await runBatch(rows, "key", { concurrency: 1 });

    expect(outcome.accessDenied).toBe(true);
    expect(mockedGenerateReport).toHaveBeenCalledTimes(1);
  });

  it("calls onRowStart and onRowComplete as each row is processed", async () => {
    const rows = [makeRow("A")];
    mockedGenerateReport.mockResolvedValue(new Blob());
    const onRowStart = vi.fn();
    const onRowComplete = vi.fn();

    await runBatch(rows, "key", { onRowStart, onRowComplete });

    expect(onRowStart).toHaveBeenCalledWith("0");
    expect(onRowComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "0",
        address: "A",
        status: "success",
        fileName: "reporte-1-a.pdf",
      })
    );
  });

  it("gives two rows with the same address distinct ids and filenames", async () => {
    const rows = [makeRow("Calle 100"), makeRow("Calle 100")];
    mockedGenerateReport.mockResolvedValue(new Blob());

    const outcome = await runBatch(rows, "key", { concurrency: 1 });

    expect(outcome.results).toEqual([
      expect.objectContaining({ id: "0", fileName: "reporte-1-calle-100.pdf" }),
      expect.objectContaining({ id: "1", fileName: "reporte-2-calle-100.pdf" }),
    ]);
  });
});
