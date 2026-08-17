import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OperatorPage } from "./OperatorPage";
import { generateReport, ReportApiError } from "../api/reportApi";

vi.mock("../api/reportApi", () => ({
  generateReport: vi.fn(),
  ReportApiError: class ReportApiError extends Error {},
}));

const mockedGenerateReport = vi.mocked(generateReport);

describe("OperatorPage", () => {
  beforeEach(() => {
    mockedGenerateReport.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("submits the form, triggers a real download, and shows the ready state", async () => {
    const pdfBlob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "application/pdf",
    });
    mockedGenerateReport.mockResolvedValue(pdfBlob);
    const user = userEvent.setup();
    render(<OperatorPage />);

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
  });

  it("shows the error state with the backend's message and lets the operator retry without losing their input", async () => {
    mockedGenerateReport.mockRejectedValue(
      new ReportApiError("No se encontraron coordenadas para la dirección: xyz")
    );
    const user = userEvent.setup();
    render(<OperatorPage />);

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
});
