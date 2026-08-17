import { render, screen } from "@testing-library/react";
import { ReportPreviewCard } from "./ReportPreviewCard";

describe("ReportPreviewCard", () => {
  it("shows a prompt when idle", () => {
    render(<ReportPreviewCard status="idle" />);
    expect(screen.getByText(/completa el formulario/i)).toBeInTheDocument();
  });

  it("shows a loading message while loading", () => {
    render(<ReportPreviewCard status="loading" />);
    expect(screen.getByText(/generando tu reporte/i)).toBeInTheDocument();
  });

  it("shows the example badge and a download link to the static PDF when ready", () => {
    render(<ReportPreviewCard status="ready" />);
    expect(screen.getByText(/vista previa de ejemplo/i)).toBeInTheDocument();
    const downloadLink = screen.getByRole("link", {
      name: /descargar pdf de ejemplo/i,
    });
    expect(downloadLink).toHaveAttribute("href", "/example-report.pdf");
  });
});
