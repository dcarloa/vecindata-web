import { describe, it, expect } from "vitest";
import { slugifyAddress } from "./download";

describe("slugifyAddress", () => {
  it("lowercases, strips accents, and replaces non-alphanumerics with dashes", () => {
    expect(slugifyAddress("Calle 100 No. 15-20, Bogotá, Colombia")).toBe(
      "calle-100-no-15-20-bogota-colombia"
    );
  });

  it("trims leading and trailing dashes", () => {
    expect(slugifyAddress("  ¡Calle 100!  ")).toBe("calle-100");
  });
});
