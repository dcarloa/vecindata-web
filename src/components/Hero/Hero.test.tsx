import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders the headline and a CTA link to the operator page", () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /investigación de zona/i })
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /generar un reporte/i });
    expect(cta).toHaveAttribute("href", "/generar");
  });
});
