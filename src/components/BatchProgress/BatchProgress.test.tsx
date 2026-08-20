import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BatchProgress, type RowProgress } from "./BatchProgress";

describe("BatchProgress", () => {
  it("shows a status label per row and hides the download button until complete", () => {
    const rows: RowProgress[] = [
      { id: "Calle 1", status: "success" },
      { id: "Calle 2", status: "generating" },
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
      { id: "Calle 1", status: "error", message: "Dirección inválida." },
    ];
    render(<BatchProgress rows={rows} isComplete onDownload={onDownload} />);

    expect(screen.getByText("Dirección inválida.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /descargar todo/i }));
    expect(onDownload).toHaveBeenCalledOnce();
  });
});
