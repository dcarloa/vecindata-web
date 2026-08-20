import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportForm } from "./ReportForm";
import { createColombiaPlaceAutocompleteElement, loadPlacesLibrary } from "../../api/googlePlaces";
import { dispatchPlaceSelection, type FakePlace } from "../../test/googlePlacesTestUtils";

vi.mock("../../api/googlePlaces", () => ({
  loadPlacesLibrary: vi.fn(),
  createColombiaPlaceAutocompleteElement: vi.fn(),
}));

async function renderFormAndSelectPlace(
  onSubmit = vi.fn(),
  place: FakePlace = { address: "Calle 71 Bis #91-72, Bogotá, Colombia", lat: 4.6973, lon: -74.1116 }
) {
  const fakeElement = document.createElement("div");
  vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
  vi.mocked(createColombiaPlaceAutocompleteElement).mockReturnValue(
    fakeElement as never
  );

  render(<ReportForm onSubmit={onSubmit} isSubmitting={false} />);
  await waitFor(() => expect(fakeElement.isConnected).toBe(true));
  dispatchPlaceSelection(fakeElement, place);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeEnabled()
  );

  return { onSubmit, fakeElement, place };
}

describe("ReportForm", () => {
  beforeEach(() => {
    vi.mocked(loadPlacesLibrary).mockReset();
    vi.mocked(createColombiaPlaceAutocompleteElement).mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("keeps the submit button disabled until a place is selected from the autocomplete", async () => {
    const fakeElement = document.createElement("div");
    vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
    vi.mocked(createColombiaPlaceAutocompleteElement).mockReturnValue(
      fakeElement as never
    );

    render(<ReportForm onSubmit={vi.fn()} isSubmitting={false} />);
    await waitFor(() => expect(fakeElement.isConnected).toBe(true));

    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeDisabled();

    dispatchPlaceSelection(fakeElement, {
      address: "Calle 71 Bis #91-72, Bogotá, Colombia",
      lat: 4.6973,
      lon: -74.1116,
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /generar reporte/i })).toBeEnabled()
    );
  });

  it("calls onSubmit with the address and coordinates resolved by Google Places", async () => {
    const { onSubmit, place } = await renderFormAndSelectPlace();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      address: place.address,
      lat: place.lat,
      lon: place.lon,
      logoUrl: "",
      brandColor: "",
      advisorName: "",
      advisorWhatsapp: "",
      advisorEmail: "",
      tagline: "",
    });
  });

  it("includes advisor contact info and tagline in the submitted values", async () => {
    const { onSubmit } = await renderFormAndSelectPlace();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Ana Torres"), "Ana Torres");
    await user.type(screen.getByPlaceholderText("+57 300 123 4567"), "+57 300 123 4567");
    await user.type(screen.getByPlaceholderText("ana@tuinmobiliaria.com"), "ana@example.com");
    await user.type(
      screen.getByPlaceholderText("Presentado por Inmobiliaria XYZ"),
      "Presentado por Inmobiliaria XYZ"
    );
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        advisorName: "Ana Torres",
        advisorWhatsapp: "+57 300 123 4567",
        advisorEmail: "ana@example.com",
        tagline: "Presentado por Inmobiliaria XYZ",
      })
    );
  });

  it("remembers advisor contact info across mounts via localStorage", async () => {
    localStorage.setItem(
      "vecindata_advisor_info",
      JSON.stringify({
        advisorName: "Ana Torres",
        advisorWhatsapp: "",
        advisorEmail: "",
        tagline: "",
      })
    );

    await renderFormAndSelectPlace();

    expect(screen.getByPlaceholderText("Ana Torres")).toHaveValue("Ana Torres");
  });

  it("shows a validation error for a malformed brand color and does not submit", async () => {
    const { onSubmit } = await renderFormAndSelectPlace();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("#4f46e5"), "not-a-color");
    await user.click(screen.getByRole("button", { name: /generar reporte/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/hexadecimal válido/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error and does not submit if the form is submitted without a selected place", async () => {
    const onSubmit = vi.fn();
    const fakeElement = document.createElement("div");
    vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
    vi.mocked(createColombiaPlaceAutocompleteElement).mockReturnValue(
      fakeElement as never
    );

    const { container } = render(<ReportForm onSubmit={onSubmit} isSubmitting={false} />);
    await waitFor(() => expect(fakeElement.isConnected).toBe(true));

    // The submit button is disabled at this point, but the guard clause in
    // handleSubmit is what actually protects against a native form submit
    // (e.g. pressing Enter in another field) bypassing the disabled button.
    const form = container.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.getByRole("alert")).toHaveTextContent(/selecciona una dirección/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a hint and keeps submit disabled when the Google Places script fails to load", async () => {
    vi.mocked(loadPlacesLibrary).mockRejectedValue(new Error("network error"));

    render(<ReportForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(
      await screen.findByText(/no se pudo cargar el buscador de direcciones/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generar reporte/i })).toBeDisabled();
  });

  it("disables the submit button and shows a loading label while submitting", () => {
    vi.mocked(loadPlacesLibrary).mockReturnValue(new Promise(() => {}));
    render(<ReportForm onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /generando/i })).toBeDisabled();
  });
});
