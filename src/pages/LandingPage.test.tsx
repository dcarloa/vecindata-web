import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero, all three how-it-works steps, and the footer disclaimer", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /contexto de la zona/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ingresa la dirección del inmueble/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/recolectamos datos reales del entorno/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/descarga un pdf listo para compartir/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/datos de openstreetmap/i)).toBeInTheDocument();
  });
});
