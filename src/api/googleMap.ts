import { loadPlacesLibrary } from "./googlePlaces";

export interface MapPosition {
  lat: number;
  lon: number;
}

export interface DraggableMarkerMap {
  setPosition(position: MapPosition): void;
  destroy(): void;
}

const DEFAULT_ZOOM = 16;

export async function createDraggableMarkerMap(
  container: HTMLElement,
  initialPosition: MapPosition,
  onPositionChange: (position: MapPosition) => void
): Promise<DraggableMarkerMap> {
  await loadPlacesLibrary();

  if (!window.google?.maps?.Map || !window.google.maps.marker?.AdvancedMarkerElement) {
    throw new Error("El mapa de Google todavía no está listo.");
  }

  const map = new window.google.maps.Map(container, {
    center: { lat: initialPosition.lat, lng: initialPosition.lon },
    zoom: DEFAULT_ZOOM,
    mapId: "DEMO_MAP_ID",
  });

  const marker = new window.google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat: initialPosition.lat, lng: initialPosition.lon },
    gmpDraggable: true,
  });

  // Kept in a named reference so destroy() can remove it — without that, every
  // map a row mounts and unmounts leaks its retained closure.
  const handleDragEnd = () => {
    const position = marker.position;
    if (!position) return;
    onPositionChange({ lat: position.lat, lon: position.lng });
  };
  marker.addEventListener("dragend", handleDragEnd);

  return {
    setPosition(position: MapPosition) {
      marker.position = { lat: position.lat, lng: position.lon };
      map.setCenter({ lat: position.lat, lng: position.lon });
    },
    destroy() {
      marker.removeEventListener("dragend", handleDragEnd);
      marker.map = null;
    },
  };
}
