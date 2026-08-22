import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonalizationFields } from "./PersonalizationFields";
import { vi } from "vitest";

function renderFields(overrides: Partial<Parameters<typeof PersonalizationFields>[0]> = {}) {
  const props = {
    logoUrl: "",
    onLogoUrlChange: vi.fn(),
    brandColor: "",
    onBrandColorChange: vi.fn(),
    advisorInfo: { advisorName: "", advisorWhatsapp: "", advisorEmail: "", tagline: "" },
    onAdvisorInfoChange: vi.fn(),
    radiusM: 1000 as const,
    onRadiusMChange: vi.fn(),
    visibleCategories: ["educacion", "salud", "transporte", "comercio", "restaurantes", "parques", "bancos"],
    onVisibleCategoriesChange: vi.fn(),
    showScore: true,
    onShowScoreChange: vi.fn(),
    ...overrides,
  };
  render(<PersonalizationFields {...props} />);
  return props;
}

describe("PersonalizationFields", () => {
  it("is collapsed by default", () => {
    renderFields();
    expect(screen.queryByLabelText(/logo de tu inmobiliaria/i)).not.toBeVisible();
  });

  it("expands to show every field when opened", async () => {
    renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));

    expect(screen.getByLabelText(/logo de tu inmobiliaria/i)).toBeVisible();
    expect(screen.getByLabelText(/color de marca/i)).toBeVisible();
    expect(screen.getByLabelText(/nombre del asesor/i)).toBeVisible();
    expect(screen.getByLabelText(/whatsapp del asesor/i)).toBeVisible();
    expect(screen.getByLabelText(/email del asesor/i)).toBeVisible();
    expect(screen.getByLabelText(/frase personalizada/i)).toBeVisible();
    expect(screen.getByLabelText(/radio de búsqueda/i)).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Parques" })).toBeVisible();
  });

  it("all 7 category checkboxes are checked by default", async () => {
    renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));

    for (const label of ["Educación", "Salud", "Transporte", "Comercio", "Restaurantes", "Parques", "Bancos"]) {
      expect(screen.getByRole("checkbox", { name: label })).toBeChecked();
    }
  });

  it("unchecking a category removes it from visibleCategories", async () => {
    const props = renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));
    await user.click(screen.getByRole("checkbox", { name: "Bancos" }));

    expect(props.onVisibleCategoriesChange).toHaveBeenCalledWith([
      "educacion", "salud", "transporte", "comercio", "restaurantes", "parques",
    ]);
  });

  it("checking a previously-unchecked category adds it back", async () => {
    const props = renderFields({ visibleCategories: ["educacion"] });
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));
    await user.click(screen.getByRole("checkbox", { name: "Salud" }));

    expect(props.onVisibleCategoriesChange).toHaveBeenCalledWith(["educacion", "salud"]);
  });

  it("does not uncheck the last remaining category", async () => {
    const props = renderFields({ visibleCategories: ["educacion"] });
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));
    const checkbox = screen.getByRole("checkbox", { name: "Educación" });
    await user.click(checkbox);

    expect(props.onVisibleCategoriesChange).not.toHaveBeenCalled();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it("calls onRadiusMChange with a number when the radius select changes", async () => {
    const props = renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));
    await user.selectOptions(screen.getByLabelText(/radio de búsqueda/i), "500");

    expect(props.onRadiusMChange).toHaveBeenCalledWith(500);
  });

  it("the omit-score checkbox is unchecked by default when showScore is true", async () => {
    renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));

    expect(screen.getByRole("checkbox", { name: /omitir puntaje de zona/i })).not.toBeChecked();
  });

  it("checking the omit-score checkbox calls onShowScoreChange with false", async () => {
    const props = renderFields();
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));
    await user.click(screen.getByRole("checkbox", { name: /omitir puntaje de zona/i }));

    expect(props.onShowScoreChange).toHaveBeenCalledWith(false);
  });

  it("shows the omit-score checkbox as checked when showScore is false", async () => {
    renderFields({ showScore: false });
    const user = userEvent.setup();
    await user.click(screen.getByText(/personalización \(opcional\)/i));

    expect(screen.getByRole("checkbox", { name: /omitir puntaje de zona/i })).toBeChecked();
  });
});
