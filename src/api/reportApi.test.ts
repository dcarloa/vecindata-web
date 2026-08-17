import { generateReport, ReportApiError } from "./reportApi";
import type { ReportFormValues } from "../components/ReportForm/ReportForm";

const BASE_VALUES: ReportFormValues = {
  address: "Calle 100 # 15-20, Bogotá",
  logoUrl: "",
  brandColor: "",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateReport", () => {
  it("resolves with the PDF blob on success", async () => {
    const pdfBlob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "application/pdf",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => pdfBlob })
    );

    const result = await generateReport(BASE_VALUES, new AbortController().signal);

    expect(result).toBe(pdfBlob);
  });

  it("omits blank optional fields and maps camelCase to snake_case in the request body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: async () => new Blob() });
    vi.stubGlobal("fetch", fetchMock);

    await generateReport(
      {
        address: "Calle 100",
        logoUrl: "  https://x.com/logo.png  ",
        brandColor: "#4f46e5",
      },
      new AbortController().signal
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8000/reports");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      address: "Calle 100",
      logo_url: "https://x.com/logo.png",
      brand_color: "#4f46e5",
    });
  });

  it("sends no logo_url/brand_color keys at all when both fields are blank", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: async () => new Blob() });
    vi.stubGlobal("fetch", fetchMock);

    await generateReport(BASE_VALUES, new AbortController().signal);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ address: "Calle 100 # 15-20, Bogotá" });
  });

  it("rejects with the backend's message on a 422 with a string detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: "No se encontraron coordenadas para la dirección: xyz",
        }),
      })
    );

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("No se encontraron coordenadas para la dirección: xyz");
  });

  it("rejects with a generic message on a 422 with a list detail (native Pydantic validation)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [{ loc: ["body", "brand_color"], msg: "invalid" }],
        }),
      })
    );

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("Verifica los datos del formulario.");
  });

  it("rejects with the backend's message on a 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({
          detail: "Error al consultar un proveedor de datos externo.",
        }),
      })
    );

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("Error al consultar un proveedor de datos externo.");
  });

  it("rejects with a connection message when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("No se pudo conectar con el servidor. Intenta de nuevo.");
  });

  it("rejects with a timeout message when the request is aborted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"))
    );

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("La solicitud tardó demasiado. Intenta de nuevo.");
  });

  it("rejects with an unexpected-error message when the response body can't be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toThrow("Ocurrió un error inesperado en el servidor. Intenta de nuevo.");
  });

  it("every rejection is a ReportApiError instance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(
      generateReport(BASE_VALUES, new AbortController().signal)
    ).rejects.toBeInstanceOf(ReportApiError);
  });
});
