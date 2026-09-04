import { useEffect, useRef, useState } from "react";
import styles from "./MapPositionPicker.module.css";
import {
  createDraggableMarkerMap,
  loadPlacesLibrary,
  type DraggableMarkerMap,
} from "../../api/googlePlaces";

interface MapPositionPickerProps {
  lat: number;
  lon: number;
  onPositionChange: (position: { lat: number; lon: number }) => void;
  adjustButtonLabel: string;
}

export function MapPositionPicker({
  lat,
  lon,
  onPositionChange,
  adjustButtonLabel,
}: MapPositionPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DraggableMarkerMap | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    loadPlacesLibrary()
      .then(() => {
        if (cancelled || !container) return;
        mapRef.current = createDraggableMarkerMap(container, { lat, lon }, onPositionChange);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // El mapa se inicializa una sola vez al expandirse: no debe reiniciarse
    // cada vez que el pin se arrastra y lat/lon cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        type="button"
        className={styles.adjustButton}
        onClick={() => setExpanded(true)}
        aria-label={adjustButtonLabel}
      >
        Ajustar pin
      </button>
    );
  }

  return (
    <>
      <div ref={containerRef} className={styles.map} />
      {mapError && <p className={styles.warning}>No se pudo cargar el mapa.</p>}
    </>
  );
}
