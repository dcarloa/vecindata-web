import Papa from "papaparse";

export const MAX_CSV_ROWS = 200;

export interface CsvParseResult {
  addresses: string[];
  error?: string;
}

const ADDRESS_HEADER_PATTERN = /^(direccion|address)$/i;

const AMBIGUOUS_COLUMNS_ERROR =
  "El CSV parece tener varias columnas. Agrega un encabezado 'direccion' en la primera fila para indicar cuál usar.";
const RAGGED_ROW_ERROR =
  "El CSV tiene filas con más columnas que el encabezado. Revisa que las direcciones con comas estén entre comillas.";

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function filledCount(row: string[]): number {
  return row.filter((cell) => (cell ?? "").trim().length > 0).length;
}

export function parseAddressCsv(csvText: string): CsvParseResult {
  const trimmed = csvText.trim();
  if (trimmed.length === 0) {
    return { addresses: [], error: "El CSV está vacío." };
  }

  const parsed = Papa.parse<string[]>(trimmed, { skipEmptyLines: true });

  // A single-column CSV always reports `UndetectableDelimiter` (papaparse just
  // defaults to a comma, which is what we want anyway) — that one is benign.
  // Anything else, e.g. an unterminated quote, means we cannot trust the data.
  const realError = parsed.errors.find((error) => error.code !== "UndetectableDelimiter");
  if (realError) {
    return { addresses: [], error: `No se pudo leer el CSV: ${realError.message}` };
  }

  const rows = parsed.data;
  const headerRow = rows[0] ?? [];
  const headerIndex = headerRow.findIndex((cell) =>
    ADDRESS_HEADER_PATTERN.test(stripAccents((cell ?? "").trim().toLowerCase()))
  );
  const hasHeader = headerIndex >= 0;
  const addressIndex = hasHeader ? headerIndex : 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (!hasHeader && rows.some((row) => filledCount(row) > 1)) {
    return { addresses: [], error: AMBIGUOUS_COLUMNS_ERROR };
  }
  if (hasHeader && dataRows.some((row) => filledCount(row) > filledCount(headerRow))) {
    return { addresses: [], error: RAGGED_ROW_ERROR };
  }

  const addresses = dataRows
    .map((row) => (row[addressIndex] ?? "").trim())
    .filter((address) => address.length > 0);

  if (addresses.length === 0) {
    return { addresses: [], error: "El CSV no tiene direcciones válidas." };
  }
  if (addresses.length > MAX_CSV_ROWS) {
    return {
      addresses: [],
      error: `El CSV tiene ${addresses.length} filas; el máximo permitido es ${MAX_CSV_ROWS}.`,
    };
  }

  return { addresses };
}
