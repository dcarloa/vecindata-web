import { loadPlacesLibrary } from "./googlePlaces";

export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lon: number;
}

/**
 * Geocodes through the Maps JavaScript SDK (`google.maps.Geocoder`), NOT the
 * Geocoding REST web service. Our API key is restricted by HTTP referrer, and
 * Google rejects referrer-restricted keys on the REST web services — only
 * browser-loaded SDK calls are authorized. Keeping the referrer restriction is
 * non-negotiable (dropping it caused a secret-exposure incident before).
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    await loadPlacesLibrary();

    if (!window.google?.maps?.Geocoder) return null;

    const geocoder = new window.google.maps.Geocoder();
    // `componentRestrictions` is a hard restriction (unlike the old REST
    // `region` parameter, which only biased results) — Colombian addresses
    // have resolved to Mexico in production without it.
    const response = await geocoder.geocode({
      address,
      componentRestrictions: { country: "CO" },
    });

    const first = response?.results?.[0];
    if (!first) return null;

    return {
      formattedAddress: first.formatted_address,
      // Geocoder returns a classic LatLng: coordinates are methods, not fields.
      lat: first.geometry.location.lat(),
      lon: first.geometry.location.lng(),
    };
  } catch {
    // Covers a failed SDK load, OVER_QUERY_LIMIT / ZERO_RESULTS rejections and
    // any malformed payload — callers only ever need "no match".
    return null;
  }
}
