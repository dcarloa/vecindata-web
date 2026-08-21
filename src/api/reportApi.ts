import type { ReportFormValues } from "../components/ReportForm/ReportForm";

const DEFAULT_API_URL = "http://localhost:8000";

export class ReportApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function generateReport(
  values: ReportFormValues,
  accessKey: string,
  signal: AbortSignal
): Promise<Blob> {
  const baseUrl = import.meta.env.VITE_REPORT_API_URL || DEFAULT_API_URL;

  const body: Record<string, string | number | string[]> = {
    address: values.address,
    lat: values.lat,
    lon: values.lon,
  };
  if (values.logoUrl.trim().length > 0) {
    body.logo_url = values.logoUrl.trim();
  }
  if (values.brandColor.trim().length > 0) {
    body.brand_color = values.brandColor.trim();
  }
  body.radius_m = values.radiusM;
  body.visible_categories = values.visibleCategories;
  if (values.advisorName.trim().length > 0) {
    body.advisor_name = values.advisorName.trim();
  }
  if (values.advisorWhatsapp.trim().length > 0) {
    body.advisor_whatsapp = values.advisorWhatsapp.trim();
  }
  if (values.advisorEmail.trim().length > 0) {
    body.advisor_email = values.advisorEmail.trim();
  }
  if (values.tagline.trim().length > 0) {
    body.tagline = values.tagline.trim();
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Operator-Key": accessKey,
      },
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
      throw new ReportApiError(detail, response.status);
    }
    if (Array.isArray(detail)) {
      throw new ReportApiError("Verifica los datos del formulario.", response.status);
    }
    throw new ReportApiError(
      "Ocurrió un error inesperado en el servidor. Intenta de nuevo.",
      response.status
    );
  }

  return response.blob();
}
