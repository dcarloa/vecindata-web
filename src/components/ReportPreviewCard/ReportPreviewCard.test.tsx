import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("sets time expectations during loading so a real 20-30s wait doesn't look frozen", () => {
    render(<ReportPreviewCard status="loading" />);
    expect(screen.getByText(/20.*30 segundos/i)).toBeInTheDocument();
  });

  it("shows a ready confirmation naming the downloaded file", () => {
    render(<ReportPreviewCard status="ready" fileName="reporte-calle-100.pdf" />);
    expect(screen.getByText(/tu reporte está listo/i)).toBeInTheDocument();
    expect(screen.getByText(/reporte-calle-100\.pdf/)).toBeInTheDocument();
  });

  it("shows the error message and calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ReportPreviewCard
        status="error"
        errorMessage="No se encontraron coordenadas para la dirección: xyz"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText(/no se encontraron coordenadas/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
