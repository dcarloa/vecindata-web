import { FormEvent, useState } from "react";
import styles from "./ReportForm.module.css";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface ReportFormValues {
  address: string;
  logoUrl: string;
  brandColor: string;
}

interface ReportFormProps {
  onSubmit: (values: ReportFormValues) => void;
  isSubmitting: boolean;
}

export function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const looksCadastral = address.includes("#");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (address.trim().length === 0) {
      setError("La dirección es obligatoria.");
      return;
    }
    if (brandColor.length > 0 && !HEX_COLOR_PATTERN.test(brandColor)) {
      setError(
        "El color de marca debe ser un hexadecimal válido, ej. #4f46e5."
      );
      return;
    }

    setError(null);
    onSubmit({ address: address.trim(), logoUrl: logoUrl.trim(), brandColor });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Dirección del inmueble</span>
        <input
          type="text"
          className={styles.input}
          placeholder="Calle 100 # 15-20, Bogotá"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        {looksCadastral && (
          <p className={styles.hint}>
            Las direcciones con "#" (formato catastral colombiano) a veces
            ubican el reporte de forma aproximada, no exacta — verifica el
            mapa antes de compartirlo.
          </p>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Logo de tu inmobiliaria (URL, opcional)
        </span>
        <input
          type="text"
          className={styles.input}
          placeholder="https://tuinmobiliaria.com/logo.png"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Color de marca (opcional)</span>
        <input
          type="text"
          className={styles.input}
          placeholder="#4f46e5"
          value={brandColor}
          onChange={(event) => setBrandColor(event.target.value)}
        />
      </label>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Generando..." : "Generar reporte"}
      </button>
    </form>
  );
}
