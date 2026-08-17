import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OperatorPage } from "./OperatorPage";

describe("OperatorPage", () => {
  it("walks the form through loading to the ready state with the example report", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(<OperatorPage />);

    await user.type(
      screen.getByPlaceholderText(/calle 100/i),
      "Calle 100 # 15-20, Bogotá"
    );
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(await screen.findByText(/generando tu reporte/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(
      await screen.findByRole("link", { name: /descargar pdf de ejemplo/i })
    ).toBeInTheDocument();

    vi.useRealTimers();
  });
});
