import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  it("renders the landing page at the root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /contexto de la zona/i })
    ).toBeInTheDocument();
  });

  it("navigates to the operator page when the nav CTA is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("link", { name: /generar reporte/i }));
    expect(
      screen.getByRole("heading", { name: /generar reporte de ubicación/i })
    ).toBeInTheDocument();
  });
});
