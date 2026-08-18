import { render, screen } from "@testing-library/react";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders the number and title", () => {
    render(<SectionHeading number="01" title="Qué incluye" />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Qué incluye" })).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<SectionHeading number="02" title="Título" description="Detalle." />);
    expect(screen.getByText("Detalle.")).toBeInTheDocument();
  });
});
