import { useEffect, useRef, useState } from "react";
import { createDraggableMarkerMap, type DraggableMarkerMap } from "../../api/googleMap";
import styles from "./BatchReviewTable.module.css";

export interface ReviewRow {
  /**
   * Synthetic unique key (the row's position in the parsed CSV) — NOT the
   * address. A CSV may legitimately list the same address twice (two units in
   * one building), and keying off the address text collapses those rows into
   * one everywhere ids are used: React keys, edit targeting, progress updates,
   * zip filenames.
   */
  id: string;
  /** Original address text from the CSV. */
  address: string;
  /** Address as Google formatted it, or "" when geocoding found no match. */
  formattedAddress: string;
  lat: number;
  lon: number;
  geocoded: boolean;
  /** True once geocoding matched OR the operator adjusted the pin by hand. */
  confirmed: boolean;
  excluded: boolean;
}

interface BatchReviewTableProps {
  rows: ReviewRow[];
  onRowChange: (
    id: string,
    changes: Partial<Pick<ReviewRow, "lat" | "lon" | "excluded">>
  ) => void;
}

function rowLabel(row: ReviewRow): string {
  return row.formattedAddress || row.address;
}

function ReviewRowMap({
  row,
  position,
  onRowChange,
}: {
  row: ReviewRow;
  position: number;
  onRowChange: BatchReviewTableProps["onRowChange"];
}) {
  // A real Google Map per row costs a paid map load and a lot of rendering, so
  // maps mount only for the rows the operator actually chooses to correct —
  // load scales with corrections made, not with CSV size.
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DraggableMarkerMap | null>(null);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    createDraggableMarkerMap(container, { lat: row.lat, lon: row.lon }, (next) =>
      onRowChange(row.id, next)
    )
      .then((map) => {
        if (cancelled) {
          map.destroy();
          return;
        }
        mapRef.current = map;
      })
      .catch(() => {
        // createDraggableMarkerMap throws by design when the Maps library isn't
        // ready. Surface it in the row instead of leaving a blank cell and an
        // unhandled rejection.
        if (cancelled) return;
        setFailed(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // Intentionally re-runs only when the row identity changes, not on every
    // lat/lon update — the map's own drag handling is what drives those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row.id]);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.adjustButton}
        onClick={() => setOpen(true)}
        aria-label={`Ajustar pin de la fila ${position}: ${rowLabel(row)}`}
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

export function BatchReviewTable({ rows, onRowChange }: BatchReviewTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Dirección</th>
          <th>Mapa</th>
          <th>Coordenadas</th>
          <th>Excluir</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id} className={row.confirmed ? undefined : styles.needsReview}>
            <td>
              {rowLabel(row)}
              {!row.confirmed && (
                <p className={styles.warning}>Sin resultado — ajusta el pin manualmente.</p>
              )}
              {!row.geocoded && row.confirmed && (
                <p className={styles.adjusted}>Pin ajustado manualmente.</p>
              )}
            </td>
            <td>
              <ReviewRowMap row={row} position={index + 1} onRowChange={onRowChange} />
            </td>
            <td>
              {row.lat.toFixed(5)}, {row.lon.toFixed(5)}
            </td>
            <td>
              <input
                type="checkbox"
                checked={row.excluded}
                onChange={(event) => onRowChange(row.id, { excluded: event.target.checked })}
                aria-label={`Excluir la fila ${index + 1}: ${rowLabel(row)}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
