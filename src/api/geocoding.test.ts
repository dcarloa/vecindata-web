import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeAddress } from "./geocoding";

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first result on a successful match", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            formatted_address: "Calle 100 #15-20, Bogotá, Colombia",
            geometry: { location: { lat: 4.68, lng: -74.05 } },
          },
        ],
      }),
    } as Response);

    const result = await geocodeAddress("Calle 100 # 15-20, Bogotá");

    expect(result).toEqual({
      formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
      lat: 4.68,
      lon: -74.05,
    });
  });

  it("returns null when Google reports no results", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS", results: [] }),
    } as Response);

    expect(await geocodeAddress("dirección inexistente")).toBeNull();
  });

  it("returns null on a network failure instead of throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    expect(await geocodeAddress("Calle 100")).toBeNull();
  });
});
