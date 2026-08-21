import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows the FAQ section with every question collapsed by default", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /preguntas frecuentes/i })
    ).toBeInTheDocument();
    const question = screen.getByText(/de dónde salen los datos/i);
    expect(question.closest("details")).not.toHaveAttribute("open");
  });

  it("reveals a FAQ answer when the operator clicks its question", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const question = screen.getByText(/de dónde salen los datos/i);
    await user.click(question);

    expect(question.closest("details")).toHaveAttribute("open");
    expect(
      screen.getByText(/openstreetmap, isócronas caminando reales/i)
    ).toBeInTheDocument();
  });
});
