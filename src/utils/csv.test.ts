import { describe, it, expect } from "vitest";
import { parseAddressCsv, MAX_CSV_ROWS } from "./csv";

describe("parseAddressCsv", () => {
  it("uses the first column when the header says 'direccion' or 'address'", () => {
    const result = parseAddressCsv(
      "direccion\nCalle 100 # 15-20, Bogotá\nCarrera 7 # 22-10, Bogotá"
    );
    expect(result.error).toBeUndefined();
    expect(result.addresses).toEqual([
      "Calle 100 # 15-20, Bogotá",
      "Carrera 7 # 22-10, Bogotá",
    ]);
  });

  it("treats every row as an address when there is no recognizable header", () => {
    const result = parseAddressCsv("Calle 100 # 15-20, Bogotá\nCarrera 7 # 22-10, Bogotá");
    expect(result.addresses).toEqual([
      "Calle 100 # 15-20, Bogotá",
      "Carrera 7 # 22-10, Bogotá",
    ]);
  });

  it("trims whitespace and skips blank lines", () => {
    const result = parseAddressCsv("direccion\n  Calle 100  \n\n\nCarrera 7\n");
    expect(result.addresses).toEqual(["Calle 100", "Carrera 7"]);
  });

  it("returns an error for an empty CSV", () => {
    const result = parseAddressCsv("");
    expect(result.error).toMatch(/vacío/i);
    expect(result.addresses).toEqual([]);
  });

  it("returns an error when every row is blank", () => {
    const result = parseAddressCsv("direccion\n\n\n");
    expect(result.error).toMatch(/no tiene direcciones válidas/i);
  });

  it("returns an error when the row count exceeds MAX_CSV_ROWS", () => {
    const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, (_, i) => `Calle ${i}`);
    const result = parseAddressCsv(`direccion\n${rows.join("\n")}`);
    expect(result.error).toMatch(new RegExp(`máximo permitido es ${MAX_CSV_ROWS}`));
    expect(result.addresses).toEqual([]);
  });
});
