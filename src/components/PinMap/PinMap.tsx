import { useEffect, useRef, useState } from "react";
import { createDraggableMarkerMap, type DraggableMarkerMap, type MapPosition } from "../../api/googleMap";
import styles from "./PinMap.module.css";

interface PinMapProps {
  lat: number;
  lon: number;
  onPositionChange: (position: MapPosition) => void;
  adjustButtonLabel: string;
}

/**
 * A real Google Map costs a paid map load and a lot of rendering, so it
 * mounts only once the operator asks to adjust the pin — not on every
 * render of every address shown on screen.
 */
export function PinMap({ lat, lon, onPositionChange, adjustButtonLabel }: PinMapProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DraggableMarkerMap | null>(null);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    createDraggableMarkerMap(container, { lat, lon }, onPositionChange)
      .then((map) => {
        if (cancelled) {
          map.destroy();
          return;
        }
        mapRef.current = map;
      })
      .catch(() => {
        // createDraggableMarkerMap throws by design when the Maps library
        // isn't ready. Surface it instead of leaving a blank box.
        if (cancelled) return;
        setFailed(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // Mounts once per "open" — the initial lat/lon is a starting position,
    // not a controlled value the map should re-center on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.adjustButton}
        onClick={() => setOpen(true)}
        aria-label={adjustButtonLabel}
      >
        Ajustar pin
      </button>
    );
  }

  return (
    <>
      <div ref={containerRef} className={styles.map} />
      {failed && <p className={styles.warning}>No se pudo cargar el mapa.</p>}
    </>
  );
}
