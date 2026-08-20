import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodeAddress } from "./geocoding";
import { loadPlacesLibrary } from "./googlePlaces";

vi.mock("./googlePlaces", () => ({
  loadPlacesLibrary: vi.fn(),
}));

/** Classic `LatLng`: coordinates are methods, not plain fields. */
function fakeLatLng(lat: number, lng: number) {
  return { lat: () => lat, lng: () => lng };
}

describe("geocodeAddress", () => {
  let geocode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
    geocode = vi.fn();
    window.google = {
      maps: {
        places: {} as never,
        Geocoder: vi.fn().mockImplementation(() => ({ geocode })),
      },
    } as never;
  });

  it("returns the first result on a successful match", async () => {
    geocode.mockResolvedValue({
      results: [
        {
          formatted_address: "Calle 100 #15-20, Bogotá, Colombia",
          geometry: { location: fakeLatLng(4.68, -74.05) },
        },
      ],
    });

    const result = await geocodeAddress("Calle 100 # 15-20, Bogotá");

    expect(result).toEqual({
      formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
      lat: 4.68,
      lon: -74.05,
    });
  });

  it("restricts results to Colombia instead of merely biasing them", async () => {
    geocode.mockResolvedValue({ results: [] });

    await geocodeAddress("Calle 100");

    expect(geocode).toHaveBeenCalledWith({
      address: "Calle 100",
      componentRestrictions: { country: "CO" },
    });
  });

  it("returns null when Google reports no results", async () => {
    geocode.mockResolvedValue({ results: [] });

    expect(await geocodeAddress("dirección inexistente")).toBeNull();
  });

  it("returns null when the geocode call rejects instead of throwing", async () => {
    geocode.mockRejectedValue(new Error("OVER_QUERY_LIMIT"));

    expect(await geocodeAddress("Calle 100")).toBeNull();
  });

  it("returns null when the Maps SDK never loaded", async () => {
    vi.mocked(loadPlacesLibrary).mockRejectedValue(new Error("no se pudo cargar"));

    expect(await geocodeAddress("Calle 100")).toBeNull();
  });

  it("returns null when the Geocoder class is missing", async () => {
    window.google = { maps: { places: {} } } as never;

    expect(await geocodeAddress("Calle 100")).toBeNull();
  });
});
