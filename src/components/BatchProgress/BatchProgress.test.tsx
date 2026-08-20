import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BatchProgress, type RowProgress } from "./BatchProgress";

describe("BatchProgress", () => {
  it("shows a status label per row and hides the download button until complete", () => {
    const rows: RowProgress[] = [
      { id: "0", address: "Calle 1", status: "success" },
      { id: "1", address: "Calle 2", status: "generating" },
    ];
    render(<BatchProgress rows={rows} isComplete={false} onDownload={vi.fn()} />);

    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(screen.getByText("Generando…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /descargar todo/i })).not.toBeInTheDocument();
  });

  it("shows the error message and the download button once complete", async () => {
    const onDownload = vi.fn();
    const user = userEvent.setup();
    const rows: RowProgress[] = [
      { id: "0", address: "Calle 1", status: "error", message: "Dirección inválida." },
    ];
    render(<BatchProgress rows={rows} isComplete onDownload={onDownload} />);

    expect(screen.getByText("Dirección inválida.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /descargar todo/i }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("tracks two rows with the same address independently", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const rows: RowProgress[] = [
      { id: "0", address: "Calle 100", status: "success" },
      { id: "1", address: "Calle 100", status: "error", message: "Falló." },
    ];
    render(<BatchProgress rows={rows} isComplete onDownload={vi.fn()} />);

    expect(screen.getAllByText("Calle 100")).toHaveLength(2);
    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    // Duplicate React keys would warn here — the synthetic ids prevent that.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
