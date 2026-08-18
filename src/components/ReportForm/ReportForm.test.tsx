import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportForm } from "./ReportForm";

describe("ReportForm", () => {
  it("shows a validation error and does not submit when address is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ReportForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /dirección es obligatoria/i
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation error for a malformed brand color and does not submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ReportForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(
      screen.getByPlaceholderText(/calle 100/i),
      "Calle 100 # 15-20, Bogotá"
    );
    await user.type(screen.getByPlaceholderText("#4f46e5"), "not-a-color");
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /hexadecimal válido/i
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed values when the form is valid", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ReportForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(
      screen.getByPlaceholderText(/calle 100/i),
      "  Calle 100 # 15-20, Bogotá  "
    );
    await user.type(screen.getByPlaceholderText("#4f46e5"), "#4f46e5");
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      address: "Calle 100 # 15-20, Bogotá",
      logoUrl: "",
      brandColor: "#4f46e5",
    });
  });

  it("shows a precision hint only when the address looks cadastral (contains #)", async () => {
    const user = userEvent.setup();
    render(<ReportForm onSubmit={vi.fn()} isSubmitting={false} />);
    const addressInput = screen.getByPlaceholderText(/calle 100/i);

    expect(screen.queryByText(/formato catastral/i)).not.toBeInTheDocument();

    await user.type(addressInput, "Calle 100 # 15-20, Bogotá");
    expect(screen.getByText(/formato catastral/i)).toBeInTheDocument();

    await user.clear(addressInput);
    await user.type(addressInput, "Avenida Siempre Viva 123");
    expect(screen.queryByText(/formato catastral/i)).not.toBeInTheDocument();
  });

  it("disables the submit button and shows a loading label while submitting", () => {
    render(<ReportForm onSubmit={vi.fn()} isSubmitting={true} />);
    const button = screen.getByRole("button", { name: /generando/i });
    expect(button).toBeDisabled();
  });
});
