export interface GooglePlace {
  formattedAddress: string | null;
  location: { lat(): number; lng(): number } | null;
  fetchFields(options: { fields: string[] }): Promise<void>;
}

export interface PlaceSelectEvent extends Event {
  placePrediction: { toPlace(): GooglePlace };
}

export interface PlaceAutocompleteElement extends HTMLElement {
  placeholder: string;
}

/**
 * Geocoder results use the classic `LatLng` object, whose coordinates are
 * *methods* (`lat()`/`lng()`) — unlike `AdvancedMarkerElement.position`, which
 * is a plain `{ lat, lng }` literal. Do not confuse the two.
 */
export interface GeocoderLatLng {
  lat(): number;
  lng(): number;
}

export interface GeocoderResult {
  formatted_address: string;
  geometry: { location: GeocoderLatLng };
}

export interface GeocoderRequest {
  address: string;
  componentRestrictions?: { country: string };
}

export interface GeocoderResponse {
  results: GeocoderResult[];
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          PlaceAutocompleteElement: new (options?: {
            includedRegionCodes?: string[];
          }) => PlaceAutocompleteElement;
        };
        Map: new (
          container: HTMLElement,
          options: { center: { lat: number; lng: number }; zoom: number; mapId?: string }
        ) => {
          setCenter(position: { lat: number; lng: number }): void;
        };
        Geocoder: new () => {
          geocode(request: GeocoderRequest): Promise<GeocoderResponse>;
        };
        marker: {
          AdvancedMarkerElement: new (options: {
            map: unknown;
            position: { lat: number; lng: number };
            gmpDraggable?: boolean;
          }) => {
            position: { lat: number; lng: number } | null;
            map: unknown;
          };
        };
        event: {
          addListener(
            instance: object,
            eventName: "dragend",
            handler: () => void
          ): { remove(): void };
        };
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadPlacesLibrary(): Promise<void> {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_GOOGLE_PLACES_API_KEY no está configurada.")
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=es&region=CO`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("No se pudo cargar el buscador de direcciones de Google."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function createColombiaPlaceAutocompleteElement(): PlaceAutocompleteElement {
  if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
    throw new Error("El buscador de direcciones de Google todavía no está listo.");
  }
  const element = new window.google.maps.places.PlaceAutocompleteElement({
    includedRegionCodes: ["co"],
  });
  element.placeholder = "Calle 100 No. 15-20, Bogotá";
  return element;
}

const MAP_ZOOM = 16;

export interface DraggableMarkerMap {
  destroy(): void;
}

export function createDraggableMarkerMap(
  container: HTMLElement,
  position: { lat: number; lon: number },
  onPositionChange: (position: { lat: number; lon: number }) => void
): DraggableMarkerMap {
  if (!window.google?.maps?.Map || !window.google?.maps?.marker?.AdvancedMarkerElement) {
    throw new Error("El mapa de Google todavía no está listo.");
  }
  const map = new window.google.maps.Map(container, {
    center: { lat: position.lat, lng: position.lon },
    zoom: MAP_ZOOM,
    mapId: "DEMO_MAP_ID",
    streetViewControl: false,
    fullscreenControl: false,
  });
  const marker = new window.google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat: position.lat, lng: position.lon },
    gmpDraggable: true,
  });
  const handleDragEnd = () => {
    const newPosition = marker.position;
    if (newPosition) {
      onPositionChange({
        lat: resolveLatLike(newPosition.lat),
        lon: resolveLatLike(newPosition.lng),
      });
    }
  };
  // AdvancedMarkerElement's "dragend" is not reliably delivered through the
  // native DOM addEventListener; Google's own event system (addListener) is
  // the documented, working path.
  const listener = window.google.maps.event.addListener(marker, "dragend", handleDragEnd);

  return {
    destroy() {
      listener.remove();
      marker.map = null;
    },
  };
}

export function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  if (!window.google?.maps?.Geocoder) {
    return Promise.resolve(null);
  }
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        resolve(results[0].formatted_address);
      } else {
        resolve(null);
      }
    });
  });
}
