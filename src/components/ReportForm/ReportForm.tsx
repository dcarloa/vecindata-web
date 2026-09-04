import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./ReportForm.module.css";
import {
  createColombiaPlaceAutocompleteElement,
  loadPlacesLibrary,
  reverseGeocode,
  type PlaceSelectEvent,
} from "../../api/googlePlaces";
import { useAdvisorInfo } from "../../hooks/useAdvisorInfo";
import { type RadiusM, DEFAULT_RADIUS_M, ALL_CATEGORY_VALUES } from "../../utils/constants";
import { PersonalizationFields } from "../PersonalizationFields/PersonalizationFields";
import { PinMap } from "../PinMap/PinMap";

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface ReportFormValues {
  address: string;
  lat: number;
  lon: number;
  logoUrl: string;
  brandColor: string;
  advisorName: string;
  advisorWhatsapp: string;
  advisorEmail: string;
  tagline: string;
  radiusM: RadiusM;
  visibleCategories: string[];
  showScore: boolean;
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
  const [selectionId, setSelectionId] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [advisorInfo, setAdvisorInfo] = useAdvisorInfo();
  const [radiusM, setRadiusM] = useState<RadiusM>(DEFAULT_RADIUS_M);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(ALL_CATEGORY_VALUES);
  const [showScore, setShowScore] = useState(true);
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
              setSelectionId((id) => id + 1);
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

  function handlePositionChange(position: { lat: number; lon: number }) {
    setSelectedPlace((prev) => prev && { ...prev, lat: position.lat, lon: position.lon });
    reverseGeocode(position.lat, position.lon).then((address) => {
      if (address) {
        setSelectedPlace((prev) => prev && { ...prev, address });
      }
    });
  }

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
      advisorName: advisorInfo.advisorName,
      advisorWhatsapp: advisorInfo.advisorWhatsapp,
      advisorEmail: advisorInfo.advisorEmail,
      tagline: advisorInfo.tagline,
      radiusM,
      visibleCategories,
      showScore,
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

      {selectedPlace && (
        <div className={styles.field}>
          <span className={styles.label}>Ubicación en el mapa</span>
          <PinMap
            key={selectedPlace.address}
            lat={selectedPlace.lat}
            lon={selectedPlace.lon}
            onPositionChange={({ lat, lon }) =>
              setSelectedPlace((prev) => (prev ? { ...prev, lat, lon } : prev))
            }
            adjustButtonLabel="Ajustar pin de la dirección seleccionada"
          />
          <span className={styles.hint}>
            {selectedPlace.lat.toFixed(5)}, {selectedPlace.lon.toFixed(5)}
          </span>
        </div>
      )}

      <PersonalizationFields
        logoUrl={logoUrl}
        onLogoUrlChange={setLogoUrl}
        brandColor={brandColor}
        onBrandColorChange={setBrandColor}
        advisorInfo={advisorInfo}
        onAdvisorInfoChange={setAdvisorInfo}
        radiusM={radiusM}
        onRadiusMChange={setRadiusM}
        visibleCategories={visibleCategories}
        onVisibleCategoriesChange={setVisibleCategories}
        showScore={showScore}
        onShowScoreChange={setShowScore}
      />

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
