import { useEffect, useRef } from "react";
import { createDraggableMarkerMap, type DraggableMarkerMap } from "../../api/googleMap";
import styles from "./BatchReviewTable.module.css";

export interface ReviewRow {
  id: string;
  formattedAddress: string;
  lat: number;
  lon: number;
  geocoded: boolean;
  excluded: boolean;
}

interface BatchReviewTableProps {
  rows: ReviewRow[];
  onRowChange: (
    id: string,
    changes: Partial<Pick<ReviewRow, "lat" | "lon" | "excluded">>
  ) => void;
}

function ReviewRowMap({
  row,
  onRowChange,
}: {
  row: ReviewRow;
  onRowChange: BatchReviewTableProps["onRowChange"];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DraggableMarkerMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    createDraggableMarkerMap(containerRef.current, { lat: row.lat, lon: row.lon }, (position) =>
      onRowChange(row.id, position)
    ).then((map) => {
      if (cancelled) {
        map.destroy();
        return;
      }
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
    };
    // Intentionally re-runs only when the row identity changes, not on every
    // lat/lon update — the map's own drag handling is what drives those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  return <div ref={containerRef} className={styles.map} />;
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
        {rows.map((row) => (
          <tr key={row.id} className={row.geocoded ? undefined : styles.needsReview}>
            <td>
              {row.formattedAddress || row.id}
              {!row.geocoded && (
                <p className={styles.warning}>Sin resultado — ajusta el pin manualmente.</p>
              )}
            </td>
            <td>
              <ReviewRowMap row={row} onRowChange={onRowChange} />
            </td>
            <td>
              {row.lat.toFixed(5)}, {row.lon.toFixed(5)}
            </td>
            <td>
              <input
                type="checkbox"
                checked={row.excluded}
                onChange={(event) => onRowChange(row.id, { excluded: event.target.checked })}
                aria-label={`Excluir ${row.id}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
