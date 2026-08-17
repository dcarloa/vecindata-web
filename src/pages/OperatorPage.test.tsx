import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OperatorPage } from "./OperatorPage";
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
const ACCESS_KEY = "test-access-key";

describe("OperatorPage", () => {
  beforeEach(() => {
    mockedGenerateReport.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("submits the form with the access key, triggers a real download, and shows the ready state", async () => {
    const pdfBlob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "application/pdf",
    });
    mockedGenerateReport.mockResolvedValue(pdfBlob);
    const user = userEvent.setup();
    render(<OperatorPage accessKey={ACCESS_KEY} onAccessDenied={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/calle 100/i),
      "Calle 100 # 15-20, Bogotá"
    );
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(
      await screen.findByText(/se descargó automáticamente/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reporte-calle-100-15-20-bogota\.pdf/)
    ).toBeInTheDocument();
    expect(mockedGenerateReport).toHaveBeenCalledWith(
      expect.objectContaining({ address: "Calle 100 # 15-20, Bogotá" }),
      ACCESS_KEY,
      expect.anything()
    );
  });

  it("shows the error state with the backend's message and lets the operator retry without losing their input", async () => {
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("No se encontraron coordenadas para la dirección: xyz")
    );
    const user = userEvent.setup();
    render(<OperatorPage accessKey={ACCESS_KEY} onAccessDenied={vi.fn()} />);

    const addressInput = screen.getByPlaceholderText(/calle 100/i);
    await user.type(addressInput, "xyz");
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(
      await screen.findByText(/no se encontraron coordenadas/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeEnabled();
    expect(addressInput).toHaveValue("xyz");
  });

  it("calls onAccessDenied instead of showing the error state when the access key is rejected", async () => {
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("Clave de acceso inválida.", 401)
    );
    const onAccessDenied = vi.fn();
    const user = userEvent.setup();
    render(<OperatorPage accessKey={ACCESS_KEY} onAccessDenied={onAccessDenied} />);

    await user.type(screen.getByPlaceholderText(/calle 100/i), "Calle 100");
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    await waitFor(() => {
      expect(onAccessDenied).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText(/clave de acceso inválida/i)).not.toBeInTheDocument();
  });
});
