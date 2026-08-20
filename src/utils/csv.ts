import Papa from "papaparse";

export const MAX_CSV_ROWS = 200;

export interface CsvParseResult {
  addresses: string[];
  error?: string;
}

const ADDRESS_HEADER_PATTERN = /^(direccion|address)$/i;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function parseAddressCsv(csvText: string): CsvParseResult {
  const trimmed = csvText.trim();
  if (trimmed.length === 0) {
    return { addresses: [], error: "El CSV está vacío." };
  }

  const parsed = Papa.parse<string[]>(trimmed, { skipEmptyLines: true, delimiter: "\x00" });
  const rows = parsed.data;

  const firstCell = stripAccents((rows[0]?.[0] ?? "").trim().toLowerCase());
  const hasHeader = ADDRESS_HEADER_PATTERN.test(firstCell);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const addresses = dataRows
    .map((row) => (row[0] ?? "").trim())
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
