import { PinMap } from "../PinMap/PinMap";
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
  // Row identity (row.id, via the parent <tr key={row.id}>) already gives
  // this component a stable mount per row, so switching rows can't reuse
  // another row's open/mounted map.
  return (
    <PinMap
      lat={row.lat}
      lon={row.lon}
      onPositionChange={(next) => onRowChange(row.id, next)}
      adjustButtonLabel={`Ajustar pin de la fila ${position}: ${rowLabel(row)}`}
    />
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
