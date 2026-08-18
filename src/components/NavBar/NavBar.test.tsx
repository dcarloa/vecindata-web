import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "./NavBar";

describe("NavBar", () => {
  it("renders the brand link to the landing page", () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    const brandLink = screen.getByRole("link", { name: /vecindata/i });
    expect(brandLink).toHaveAttribute("href", "/");
  });

  it("renders a call-to-action link to the operator page", () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );
    const ctaLink = screen.getByRole("link", { name: /generar reporte/i });
    expect(ctaLink).toHaveAttribute("href", "/generar");
  });

  it("renders section anchor links on the landing page", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavBar />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /qué incluye/i })).toHaveAttribute(
      "href",
      "#incluye"
    );
    expect(
      screen.getByRole("link", { name: /cómo funciona/i })
    ).toHaveAttribute("href", "#como-funciona");
  });

  it("hides the section anchor links outside the landing page", () => {
    render(
      <MemoryRouter initialEntries={["/generar"]}>
        <NavBar />
      </MemoryRouter>
    );
    expect(
      screen.queryByRole("link", { name: /qué incluye/i })
    ).not.toBeInTheDocument();
  });
});
