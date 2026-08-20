import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BulkUploadPage } from "./BulkUploadPage";
import { geocodeAddress } from "../api/geocoding";
import { runBatch } from "../batch/runBatch";
import { buildResultsZip } from "../batch/buildResultsZip";
import { createDraggableMarkerMap } from "../api/googleMap";

vi.mock("../api/geocoding", () => ({ geocodeAddress: vi.fn() }));
vi.mock("../batch/runBatch", () => ({ runBatch: vi.fn() }));
vi.mock("../batch/buildResultsZip", () => ({ buildResultsZip: vi.fn() }));
vi.mock("../api/googleMap", () => ({ createDraggableMarkerMap: vi.fn() }));

const mockedGeocodeAddress = vi.mocked(geocodeAddress);
const mockedRunBatch = vi.mocked(runBatch);
const mockedBuildResultsZip = vi.mocked(buildResultsZip);

function makeCsvFile(content: string) {
  return new File([content], "direcciones.csv", { type: "text/csv" });
}

describe("BulkUploadPage", () => {
  beforeEach(() => {
    mockedGeocodeAddress.mockReset();
    mockedRunBatch.mockReset();
    mockedBuildResultsZip.mockReset();
    vi.mocked(createDraggableMarkerMap).mockResolvedValue({
      setPosition: vi.fn(),
      destroy: vi.fn(),
    });
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("geocodes uploaded addresses, runs the batch, and offers the zip download", async () => {
    mockedGeocodeAddress.mockResolvedValue({
      formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
      lat: 4.68,
      lon: -74.05,
    });
    mockedRunBatch.mockResolvedValue({
      accessDenied: false,
      results: [
        { id: "Calle 100", status: "success", blob: new Blob(), fileName: "reporte-calle-100.pdf" },
      ],
    });
    mockedBuildResultsZip.mockResolvedValue(new Blob());

    const user = userEvent.setup();
    render(<BulkUploadPage accessKey="test-key" onAccessDenied={vi.fn()} />);

    const input = screen.getByLabelText(/sube un csv/i);
    await user.upload(input, makeCsvFile("direccion\nCalle 100"));

    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    expect(mockedRunBatch).toHaveBeenCalledWith(
      [
        {
          id: "Calle 100",
          values: {
            address: "Calle 100 #15-20, Bogotá, Colombia",
            lat: 4.68,
            lon: -74.05,
            logoUrl: "",
            brandColor: "",
          },
        },
      ],
      "test-key",
      expect.anything()
    );

    const downloadButton = await screen.findByRole("button", { name: /descargar todo/i });
    await user.click(downloadButton);
    expect(mockedBuildResultsZip).toHaveBeenCalled();
  });

  it("sends the operator back to the gate when the batch reports accessDenied", async () => {
    mockedGeocodeAddress.mockResolvedValue({
      formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
      lat: 4.68,
      lon: -74.05,
    });
    mockedRunBatch.mockResolvedValue({ accessDenied: true, results: [] });
    const onAccessDenied = vi.fn();

    const user = userEvent.setup();
    render(<BulkUploadPage accessKey="test-key" onAccessDenied={onAccessDenied} />);

    await user.upload(screen.getByLabelText(/sube un csv/i), makeCsvFile("direccion\nCalle 100"));
    await user.click(await screen.findByRole("button", { name: /generar todos/i }));

    await vi.waitFor(() => expect(onAccessDenied).toHaveBeenCalledOnce());
  });

  it("rejects an invalid brand color before running the batch", async () => {
    mockedGeocodeAddress.mockResolvedValue({
      formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
      lat: 4.68,
      lon: -74.05,
    });

    const user = userEvent.setup();
    render(<BulkUploadPage accessKey="test-key" onAccessDenied={vi.fn()} />);

    await user.upload(
      screen.getByLabelText(/sube un csv/i),
      makeCsvFile("direccion\nCalle 100")
    );
    await screen.findByRole("button", { name: /generar todos/i });
    await user.type(screen.getByLabelText(/color de marca/i), "not-a-color");
    await user.click(screen.getByRole("button", { name: /generar todos/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/hexadecimal válido/i);
    expect(mockedRunBatch).not.toHaveBeenCalled();
  });
});
