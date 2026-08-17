import type { ReportFormValues } from "../components/ReportForm/ReportForm";

const DEFAULT_API_URL = "http://localhost:8000";

export class ReportApiError extends Error {}

export async function generateReport(
  values: ReportFormValues,
  signal: AbortSignal
): Promise<Blob> {
  const baseUrl = import.meta.env.VITE_REPORT_API_URL ?? DEFAULT_API_URL;

  const body: Record<string, string> = { address: values.address };
  if (values.logoUrl.trim().length > 0) {
    body.logo_url = values.logoUrl.trim();
  }
  if (values.brandColor.trim().length > 0) {
    body.brand_color = values.brandColor.trim();
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ReportApiError("La solicitud tardó demasiado. Intenta de nuevo.");
    }
    throw new ReportApiError("No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      const payload = await response.json();
      detail = payload.detail;
    } catch {
      detail = undefined;
    }

    if (typeof detail === "string") {
      throw new ReportApiError(detail);
    }
    throw new ReportApiError("Verifica los datos del formulario.");
  }

  return response.blob();
}
