import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CsvUpload } from "./CsvUpload";

function makeCsvFile(content: string) {
  return new File([content], "direcciones.csv", { type: "text/csv" });
}

describe("CsvUpload", () => {
  it("parses a valid CSV and reports the addresses", async () => {
    const onParsed = vi.fn();
    const user = userEvent.setup();
    render(<CsvUpload onParsed={onParsed} />);

    const input = screen.getByLabelText(/sube un csv/i);
    await user.upload(
      input,
      makeCsvFile(
        'direccion\n"Calle 100 # 15-20, Bogotá"\n"Carrera 7 # 22-10, Bogotá"'
      )
    );

    await vi.waitFor(() =>
      expect(onParsed).toHaveBeenCalledWith([
        "Calle 100 # 15-20, Bogotá",
        "Carrera 7 # 22-10, Bogotá",
      ])
    );
  });

  it("shows an error and does not call onParsed for an invalid CSV", async () => {
    const onParsed = vi.fn();
    const user = userEvent.setup();
    render(<CsvUpload onParsed={onParsed} />);

    const input = screen.getByLabelText(/sube un csv/i);
    await user.upload(input, makeCsvFile("\n\n"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/vacío/i);
    expect(onParsed).not.toHaveBeenCalled();
  });
});
