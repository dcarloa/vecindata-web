export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lon: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? "";
  const params = new URLSearchParams({ address, region: "co", key: apiKey });

  let response: Response;
  try {
    response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const payload = await response.json();
  if (payload.status !== "OK" || !Array.isArray(payload.results) || payload.results.length === 0) {
    return null;
  }

  const [first] = payload.results;
  return {
    formattedAddress: first.formatted_address,
    lat: first.geometry.location.lat,
    lon: first.geometry.location.lng,
  };
}
