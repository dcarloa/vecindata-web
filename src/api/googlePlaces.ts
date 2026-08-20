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
        marker: {
          AdvancedMarkerElement: new (options: {
            map: unknown;
            position: { lat: number; lng: number };
            gmpDraggable?: boolean;
          }) => {
            position: { lat: number; lng: number } | null;
            map: unknown;
            addEventListener(type: string, listener: () => void): void;
          };
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
