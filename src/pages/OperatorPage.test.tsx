import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OperatorPage } from "./OperatorPage";
import { generateReport, ReportApiError } from "../api/reportApi";
import { createColombiaPlaceAutocompleteElement, loadPlacesLibrary } from "../api/googlePlaces";
import { dispatchPlaceSelection } from "../test/googlePlacesTestUtils";

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

vi.mock("../api/googlePlaces", () => ({
  loadPlacesLibrary: vi.fn(),
  createColombiaPlaceAutocompleteElement: vi.fn(),
}));

const mockedGenerateReport = vi.mocked(generateReport);
const ACCESS_KEY = "test-access-key";
const SELECTED_PLACE = {
  address: "Calle 100 No. 15-20, Bogotá, Colombia",
  lat: 4.6842,
  lon: -74.0559,
};

async function renderAndSelectAddress(props: Parameters<typeof OperatorPage>[0]) {
  const fakeElement = document.createElement("div");
  vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
  vi.mocked(createColombiaPlaceAutocompleteElement).mockReturnValue(
    fakeElement as never
  );

  render(<OperatorPage {...props} />);
  await waitFor(() => expect(fakeElement.isConnected).toBe(true));
  dispatchPlaceSelection(fakeElement, SELECTED_PLACE);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeEnabled()
  );
}

describe("OperatorPage", () => {
  beforeEach(() => {
    mockedGenerateReport.mockReset();
    vi.mocked(loadPlacesLibrary).mockReset();
    vi.mocked(createColombiaPlaceAutocompleteElement).mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("submits the form with the access key, triggers a real download, and shows the ready state", async () => {
    const pdfBlob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "application/pdf",
    });
    mockedGenerateReport.mockResolvedValue(pdfBlob);
    const user = userEvent.setup();
    await renderAndSelectAddress({ accessKey: ACCESS_KEY, onAccessDenied: vi.fn() });

    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(
      await screen.findByText(/se descargó automáticamente/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reporte-calle-100-no-15-20-bogota-colombia\.pdf/)
    ).toBeInTheDocument();
    expect(mockedGenerateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        address: SELECTED_PLACE.address,
        lat: SELECTED_PLACE.lat,
        lon: SELECTED_PLACE.lon,
      }),
      ACCESS_KEY,
      expect.anything()
    );
  });

  it("shows the error state with the backend's message and lets the operator retry", async () => {
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("No se encontraron coordenadas para la dirección: xyz")
    );
    const user = userEvent.setup();
    await renderAndSelectAddress({ accessKey: ACCESS_KEY, onAccessDenied: vi.fn() });

    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(
      await screen.findByText(/no se encontraron coordenadas/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeEnabled();
  });

  it("calls onAccessDenied instead of showing the error state when the access key is rejected", async () => {
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("Clave de acceso inválida.", 401)
    );
    const onAccessDenied = vi.fn();
    const user = userEvent.setup();
    await renderAndSelectAddress({ accessKey: ACCESS_KEY, onAccessDenied });

    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    await waitFor(() => {
      expect(onAccessDenied).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText(/clave de acceso inválida/i)).not.toBeInTheDocument();
  });
});
