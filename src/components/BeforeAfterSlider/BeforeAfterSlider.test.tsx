import { fireEvent, render, screen } from "@testing-library/react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

describe("BeforeAfterSlider", () => {
  it("renders both panels and labels", () => {
    render(
      <BeforeAfterSlider
        before={<p>Anuncio sin contexto</p>}
        after={<p>Anuncio con reporte</p>}
        beforeLabel="Sin VecinData"
        afterLabel="Con VecinData"
      />
    );
    expect(screen.getByText("Anuncio sin contexto")).toBeInTheDocument();
    expect(screen.getByText("Anuncio con reporte")).toBeInTheDocument();
    expect(screen.getByText("Sin VecinData")).toBeInTheDocument();
    expect(screen.getByText("Con VecinData")).toBeInTheDocument();
  });

  it("moves the reveal position when the slider is dragged", () => {
    render(
      <BeforeAfterSlider
        before={<p>Antes</p>}
        after={<p>Después</p>}
        beforeLabel="Antes"
        afterLabel="Después"
      />
    );
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("50");
    fireEvent.change(slider, { target: { value: "80" } });
    expect(slider).toHaveValue("80");
  });
});
