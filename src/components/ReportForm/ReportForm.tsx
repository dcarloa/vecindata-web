import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./ReportForm.module.css";
import {
  createColombiaPlaceAutocompleteElement,
  loadPlacesLibrary,
  type PlaceSelectEvent,
} from "../../api/googlePlaces";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface ReportFormValues {
  address: string;
  lat: number;
  lon: number;
  logoUrl: string;
  brandColor: string;
}

interface ReportFormProps {
  onSubmit: (values: ReportFormValues) => void;
  isSubmitting: boolean;
}

type AutocompleteStatus = "loading" | "ready" | "error";

interface SelectedPlace {
  address: string;
  lat: number;
  lon: number;
}

export function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autocompleteStatus, setAutocompleteStatus] = useState<AutocompleteStatus>("loading");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPlacesLibrary()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const element = createColombiaPlaceAutocompleteElement();
        element.addEventListener("gmp-select", ((event: PlaceSelectEvent) => {
          const place = event.placePrediction.toPlace();
          place
            .fetchFields({ fields: ["formattedAddress", "location"] })
            .then(() => {
              if (cancelled || !place.location) return;
              setSelectedPlace({
                address: place.formattedAddress ?? "",
                lat: place.location.lat(),
                lon: place.location.lng(),
              });
              setError(null);
            });
        }) as EventListener);
        containerRef.current.appendChild(element);
        setAutocompleteStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setAutocompleteStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlace) {
      setError("Selecciona una dirección de la lista de sugerencias.");
      return;
    }
    if (brandColor.length > 0 && !HEX_COLOR_PATTERN.test(brandColor)) {
      setError(
        "El color de marca debe ser un hexadecimal válido, ej. #4f46e5."
      );
      return;
    }

    setError(null);
    onSubmit({
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lon: selectedPlace.lon,
      logoUrl: logoUrl.trim(),
      brandColor,
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Dirección del inmueble</span>
        <div ref={containerRef} className={styles.autocomplete} />
        {autocompleteStatus === "error" && (
          <p className={styles.hint}>
            No se pudo cargar el buscador de direcciones. Recarga la página e
            intenta de nuevo.
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

      <button
        type="submit"
        className={styles.submit}
        disabled={isSubmitting || !selectedPlace}
      >
        {isSubmitting ? "Generando..." : "Generar reporte"}
      </button>
    </form>
  );
}
