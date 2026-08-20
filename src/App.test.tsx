import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
  });

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

  it("navigates to the operator page when the nav CTA is clicked, past the access gate", async () => {
    localStorage.setItem("vecindata_operator_key", "test-key");
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

  it("shows the access gate instead of the operator page when no key is stored", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("link", { name: /generar reporte/i }));
    expect(
      screen.getByRole("heading", { name: /acceso al panel operador/i })
    ).toBeInTheDocument();
  });

  it("navigates to the bulk upload page at /generar-lote, past the access gate", async () => {
    localStorage.setItem("vecindata_operator_key", "test-key");
    render(
      <MemoryRouter initialEntries={["/generar-lote"]}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /generar reportes en lote/i })
    ).toBeInTheDocument();
  });
});
