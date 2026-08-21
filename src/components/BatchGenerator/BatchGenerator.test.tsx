import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchGenerator } from "./BatchGenerator";
import { geocodeAddress } from "../../api/geocoding";
import { runBatch } from "../../batch/runBatch";
import { buildResultsZip } from "../../batch/buildResultsZip";
import { triggerDownload } from "../../utils/download";
import { createDraggableMarkerMap } from "../../api/googleMap";

vi.mock("../../api/geocoding", () => ({ geocodeAddress: vi.fn() }));
vi.mock("../../batch/runBatch", () => ({ runBatch: vi.fn() }));
vi.mock("../../batch/buildResultsZip", () => ({ buildResultsZip: vi.fn() }));
vi.mock("../../api/googleMap", () => ({ createDraggableMarkerMap: vi.fn() }));
vi.mock("../../utils/download", () => ({
  triggerDownload: vi.fn(),
  slugifyAddress: vi.fn((address: string) => address),
}));

const mockedGeocodeAddress = vi.mocked(geocodeAddress);
const mockedRunBatch = vi.mocked(runBatch);
const mockedBuildResultsZip = vi.mocked(buildResultsZip);
const mockedTriggerDownload = vi.mocked(triggerDownload);
const mockedCreateMap = vi.mocked(createDraggableMarkerMap);

const GEOCODED = {
  formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
  lat: 4.68,
  lon: -74.05,
};

function makeCsvFile(content: string) {
  return new File([content], "direcciones.csv", { type: "text/csv" });
}

function csvOf(addresses: string[]) {
  return makeCsvFile(["direccion", ...addresses].join("\n"));
}

describe("BatchGenerator", () => {
  beforeEach(() => {
    mockedGeocodeAddress.mockReset();
    mockedRunBatch.mockReset();
    mockedBuildResultsZip.mockReset();
    mockedTriggerDownload.mockReset();
    mockedCreateMap.mockReset();
    mockedCreateMap.mockResolvedValue({ setPosition: vi.fn(), destroy: vi.fn() });
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    localStorage.clear();
  });

  it("geocodes uploaded addresses, runs the batch, and offers the zip download", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({
      accessDenied: false,
      results: [
        {
          id: "0",
          address: GEOCODED.formattedAddress,
          status: "success",
          blob: new Blob(),
          fileName: "reporte-1-calle-100.pdf",
        },
      ],
    });
    mockedBuildResultsZip.mockResolvedValue(new Blob());

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    const input = screen.getByLabelText(/sube un csv/i);
    await user.upload(input, csvOf(["Calle 100"]));

    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        {
          id: "0",
          values: {
            address: GEOCODED.formattedAddress,
            lat: 4.68,
            lon: -74.05,
            logoUrl: "",
            brandColor: "",
            advisorName: "",
            advisorWhatsapp: "",
            advisorEmail: "",
            tagline: "",
            radiusM: 1000,
            visibleCategories: ["educacion", "salud", "transporte", "comercio", "restaurantes", "parques", "bancos"],
          },
        },
      ],
      "test-key",
      expect.anything()
    );

    const downloadButton = await screen.findByRole("button", { name: /descargar todo/i });
    await user.click(downloadButton);
    expect(mockedBuildResultsZip).toHaveBeenCalled();
    expect(mockedTriggerDownload).toHaveBeenCalledWith(expect.any(Blob), "reportes-vecindata.zip");
  });

  it("includes the advisor contact info stored in localStorage in every batch row", async () => {
    localStorage.setItem(
      "vecindata_advisor_info",
      JSON.stringify({
        advisorName: "Ana Torres",
        advisorWhatsapp: "+57 300 123 4567",
        advisorEmail: "ana@example.com",
        tagline: "Presentado por Inmobiliaria XYZ",
      })
    );
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({ accessDenied: false, results: [] });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          values: expect.objectContaining({
            advisorName: "Ana Torres",
            advisorWhatsapp: "+57 300 123 4567",
            advisorEmail: "ana@example.com",
            tagline: "Presentado por Inmobiliaria XYZ",
          }),
        }),
      ],
      "test-key",
      expect.anything()
    );
  });

  it("does not mount any map until the operator asks to adjust a row", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["A", "B", "C", "D"]));
    await screen.findByRole("button", { name: /generar todos/i });

    expect(screen.getAllByRole("button", { name: /ajustar pin/i })).toHaveLength(4);
    expect(mockedCreateMap).not.toHaveBeenCalled();
  });

  it("warns that a batch takes a while and blocks closing the tab while generating", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    let releaseBatch!: () => void;
    mockedRunBatch.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseBatch = () => resolve({ accessDenied: false, results: [] });
        })
    );

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    expect(
      await screen.findByText(/puede tardar varios minutos.*no cierres esta pestaña/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    const duringBatch = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(duringBatch);
    expect(duringBatch.defaultPrevented).toBe(true);

    await act(async () => {
      releaseBatch();
    });

    await screen.findByRole("button", { name: /descargar todo/i });
    const afterBatch = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(afterBatch);
    expect(afterBatch.defaultPrevented).toBe(false);
  });

  it("caps geocoding concurrency instead of firing every address at once", async () => {
    const total = 25;
    let inFlight = 0;
    let maxInFlight = 0;
    const releases: Array<() => void> = [];
    mockedGeocodeAddress.mockImplementation(() => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise((resolve) => {
        releases.push(() => {
          inFlight -= 1;
          resolve(GEOCODED);
        });
      });
    });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(
      screen.getByLabelText(/sube un csv/i),
      csvOf(Array.from({ length: total }, (_, index) => `Calle ${index}`))
    );

    await vi.waitFor(() => expect(releases.length).toBe(10));
    expect(maxInFlight).toBe(10);

    for (let done = 0; done < total; done += 1) {
      await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0));
      await act(async () => {
        releases.shift()!();
      });
    }

    await screen.findByRole("button", { name: /generar todos/i });
    expect(mockedGeocodeAddress).toHaveBeenCalledTimes(total);
    expect(maxInFlight).toBe(10);
  });

  it("recovers with a retry instead of hanging on 'Buscando coordenadas…' when geocoding throws", async () => {
    mockedGeocodeAddress.mockRejectedValue(new Error("network down"));

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos buscar las coordenadas/i);
    expect(screen.queryByText(/buscando coordenadas/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /volver a intentar/i }));
    expect(screen.getByLabelText(/sube un csv/i)).toBeInTheDocument();
  });

  it("blocks generation until rows without a geocoding match are corrected", async () => {
    mockedGeocodeAddress.mockResolvedValueOnce(GEOCODED).mockResolvedValueOnce(null);
    mockedRunBatch.mockResolvedValue({ accessDenied: false, results: [] });
    let onPositionChange!: (position: { lat: number; lon: number }) => void;
    mockedCreateMap.mockImplementation(async (_el, _pos, callback) => {
      onPositionChange = callback;
      return { setPosition: vi.fn(), destroy: vi.fn() };
    });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100", "Sin resultado"]));

    const generate = await screen.findByRole("button", { name: /generar todos/i });
    expect(generate).toBeDisabled();
    expect(screen.getByText(/1 dirección necesita revisión antes de generar/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /ajustar pin/i })[1]);
    await vi.waitFor(() => expect(onPositionChange).toBeDefined());
    await act(async () => {
      onPositionChange({ lat: 4.7, lon: -74.1 });
    });

    expect(generate).toBeEnabled();
    expect(
      screen.queryByText(/necesita revisión antes de generar/i)
    ).not.toBeInTheDocument();

    await user.click(generate);
    expect(mockedRunBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          values: expect.objectContaining({ address: "Sin resultado", lat: 4.7, lon: -74.1 }),
        }),
      ]),
      "test-key",
      expect.anything()
    );
  });

  it("lets the operator exclude an unmatched row instead of correcting it", async () => {
    mockedGeocodeAddress.mockResolvedValueOnce(GEOCODED).mockResolvedValueOnce(null);
    mockedRunBatch.mockResolvedValue({ accessDenied: false, results: [] });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100", "Sin resultado"]));

    const generate = await screen.findByRole("button", { name: /generar todos/i });
    expect(generate).toBeDisabled();

    await user.click(screen.getByLabelText(/excluir la fila 2/i));

    expect(generate).toBeEnabled();
  });

  it("keeps duplicate addresses separate through review, progress and the zip", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({
      accessDenied: false,
      results: [
        {
          id: "0",
          address: GEOCODED.formattedAddress,
          status: "success",
          blob: new Blob(["pdf-a"]),
          fileName: "reporte-1-calle-100.pdf",
        },
        {
          id: "1",
          address: GEOCODED.formattedAddress,
          status: "success",
          blob: new Blob(["pdf-b"]),
          fileName: "reporte-2-calle-100.pdf",
        },
      ],
    });
    mockedBuildResultsZip.mockResolvedValue(new Blob());

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100", "Calle 100"]));

    // Review: two independent rows, not one collapsed row.
    await screen.findByRole("button", { name: /generar todos/i });
    expect(screen.getAllByLabelText(/excluir la fila/i)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /ajustar pin/i })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    // Batch: distinct synthetic ids for the same address text.
    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        { id: "0", values: expect.objectContaining({ address: GEOCODED.formattedAddress }) },
        { id: "1", values: expect.objectContaining({ address: GEOCODED.formattedAddress }) },
      ],
      "test-key",
      expect.anything()
    );

    // Progress: two entries, both showing the real address.
    const downloadButton = await screen.findByRole("button", { name: /descargar todo/i });
    expect(screen.getAllByText(GEOCODED.formattedAddress)).toHaveLength(2);

    // Zip: two distinct filenames, so neither PDF overwrites the other.
    await user.click(downloadButton);
    expect(mockedBuildResultsZip).toHaveBeenCalledWith([
      expect.objectContaining({ fileName: "reporte-1-calle-100.pdf" }),
      expect.objectContaining({ fileName: "reporte-2-calle-100.pdf" }),
    ]);
  });

  it("updates only the dragged row when two rows share the same address", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({ accessDenied: false, results: [] });
    let onPositionChange!: (position: { lat: number; lon: number }) => void;
    mockedCreateMap.mockImplementation(async (_el, _pos, callback) => {
      onPositionChange = callback;
      return { setPosition: vi.fn(), destroy: vi.fn() };
    });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100", "Calle 100"]));
    await screen.findByRole("button", { name: /generar todos/i });

    await user.click(screen.getAllByRole("button", { name: /ajustar pin/i })[1]);
    await vi.waitFor(() => expect(onPositionChange).toBeDefined());
    await act(async () => {
      onPositionChange({ lat: 4.9, lon: -74.9 });
    });

    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        { id: "0", values: expect.objectContaining({ lat: 4.68, lon: -74.05 }) },
        { id: "1", values: expect.objectContaining({ lat: 4.9, lon: -74.9 }) },
      ],
      "test-key",
      expect.anything()
    );
  });

  it("sends the operator back to the gate when the batch reports accessDenied", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({ accessDenied: true, results: [] });
    const onAccessDenied = vi.fn();

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={onAccessDenied} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    await vi.waitFor(() => expect(onAccessDenied).toHaveBeenCalledOnce());
    expect(mockedBuildResultsZip).not.toHaveBeenCalled();
  });

  it("downloads the reports already generated before a mid-batch 401 sends the operator out", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({
      accessDenied: true,
      results: [
        {
          id: "0",
          address: GEOCODED.formattedAddress,
          status: "success",
          blob: new Blob(["pdf-a"]),
          fileName: "reporte-1-calle-100.pdf",
        },
      ],
    });
    mockedBuildResultsZip.mockResolvedValue(new Blob(["zip"]));
    const onAccessDenied = vi.fn();

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={onAccessDenied} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    await vi.waitFor(() => expect(onAccessDenied).toHaveBeenCalledOnce());
    expect(mockedBuildResultsZip).toHaveBeenCalledWith([
      expect.objectContaining({ fileName: "reporte-1-calle-100.pdf" }),
    ]);
    expect(mockedTriggerDownload).toHaveBeenCalledWith(expect.any(Blob), "reportes-vecindata.zip");
  });

  it("rejects an invalid brand color before running the batch", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    await screen.findByRole("button", { name: /generar todos/i });
    await user.type(screen.getByLabelText(/color de marca/i), "not-a-color");
    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/hexadecimal válido/i);
    expect(mockedRunBatch).not.toHaveBeenCalled();
  });

  it("includes the selected radius and visible categories in every batch row", async () => {
    mockedGeocodeAddress.mockResolvedValue(GEOCODED);
    mockedRunBatch.mockResolvedValue({ accessDenied: false, results: [] });

    const user = userEvent.setup();
    render(<BatchGenerator accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), csvOf(["Calle 100"]));
    await screen.findByRole("button", { name: /generar todos/i });

    await user.click(screen.getByText(/personalización \(opcional\)/i));
    await user.selectOptions(screen.getByLabelText(/radio de búsqueda/i), "2000");
    await user.click(screen.getByRole("checkbox", { name: "Bancos" }));
    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          values: expect.objectContaining({
            radiusM: 2000,
            visibleCategories: ["educacion", "salud", "transporte", "comercio", "restaurantes", "parques"],
          }),
        }),
      ],
      "test-key",
      expect.anything()
    );
  });
});
