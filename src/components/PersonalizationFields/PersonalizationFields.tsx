import type { AdvisorInfo } from "../../hooks/useAdvisorInfo";
import { POI_CATEGORIES, RADIUS_OPTIONS, type RadiusM } from "../../utils/constants";
import styles from "./PersonalizationFields.module.css";

// Same line-icon set (viewBox, stroke width, caps) used for POI categories in
// the generated PDF (report-api's report.html.jinja `poi_icon` macro), so the
// form and the report it produces read as one system.
const CATEGORY_ICON_PATHS: Record<string, React.ReactNode> = {
  educacion: (
    <>
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 9v6" />
    </>
  ),
  salud: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  transporte: (
    <>
      <rect x="3" y="6" width="18" height="11" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <circle cx="7.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
    </>
  ),
  comercio: (
    <>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  restaurantes: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </>
  ),
  parques: (
    <>
      <circle cx="12" cy="8" r="6" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </>
  ),
  bancos: (
    <>
      <path d="M3 10l9-7 9 7" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="5" y1="10" x2="5" y2="21" />
      <line x1="9" y1="10" x2="9" y2="21" />
      <line x1="15" y1="10" x2="15" y2="21" />
      <line x1="19" y1="10" x2="19" y2="21" />
    </>
  ),
};

function CategoryIcon({ category }: { category: string }) {
  return (
    <svg
      className={styles.categoryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CATEGORY_ICON_PATHS[category]}
    </svg>
  );
}

interface PersonalizationFieldsProps {
  logoUrl: string;
  onLogoUrlChange: (value: string) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  advisorInfo: AdvisorInfo;
  onAdvisorInfoChange: (patch: Partial<AdvisorInfo>) => void;
  radiusM: RadiusM;
  onRadiusMChange: (value: RadiusM) => void;
  visibleCategories: string[];
  onVisibleCategoriesChange: (categories: string[]) => void;
}

export function PersonalizationFields({
  logoUrl,
  onLogoUrlChange,
  brandColor,
  onBrandColorChange,
  advisorInfo,
  onAdvisorInfoChange,
  radiusM,
  onRadiusMChange,
  visibleCategories,
  onVisibleCategoriesChange,
}: PersonalizationFieldsProps) {
  function toggleCategory(value: string) {
    if (visibleCategories.includes(value)) {
      if (visibleCategories.length === 1) {
        return;
      }
      onVisibleCategoriesChange(visibleCategories.filter((c) => c !== value));
    } else {
      onVisibleCategoriesChange([...visibleCategories, value]);
    }
  }

  return (
    <details className={styles.accordion}>
      <summary className={styles.summary}>Personalización (opcional)</summary>
      <div className={styles.content}>
        <label className={styles.field}>
          <span className={styles.label}>Logo de tu inmobiliaria (URL, opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="https://tuinmobiliaria.com/logo.png"
            value={logoUrl}
            onChange={(event) => onLogoUrlChange(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Color de marca (opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="#4f46e5"
            value={brandColor}
            onChange={(event) => onBrandColorChange(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Nombre del asesor (opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Ana Torres"
            value={advisorInfo.advisorName}
            onChange={(event) => onAdvisorInfoChange({ advisorName: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>WhatsApp del asesor (opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="+57 300 123 4567"
            value={advisorInfo.advisorWhatsapp}
            onChange={(event) => onAdvisorInfoChange({ advisorWhatsapp: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Email del asesor (opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="ana@tuinmobiliaria.com"
            value={advisorInfo.advisorEmail}
            onChange={(event) => onAdvisorInfoChange({ advisorEmail: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Frase personalizada (opcional)</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Presentado por Inmobiliaria XYZ"
            value={advisorInfo.tagline}
            onChange={(event) => onAdvisorInfoChange({ tagline: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Radio de búsqueda</span>
          <select
            className={styles.input}
            value={radiusM}
            onChange={(event) => onRadiusMChange(Number(event.target.value) as RadiusM)}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={styles.categoryFieldset}>
          <legend className={styles.label}>Categorías a mostrar</legend>
          <div className={styles.categoryList}>
            {POI_CATEGORIES.map((category) => {
              const isChecked = visibleCategories.includes(category.value);
              const isLastChecked = visibleCategories.length === 1 && isChecked;
              return (
                <label
                  key={category.value}
                  className={[
                    styles.categoryChip,
                    isChecked && styles.categoryChipChecked,
                    isLastChecked && styles.categoryChipDisabled,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={isLastChecked ? "Debe quedar al menos una categoría visible" : undefined}
                >
                  <input
                    type="checkbox"
                    className={styles.categoryCheckboxInput}
                    checked={isChecked}
                    disabled={isLastChecked}
                    onChange={() => toggleCategory(category.value)}
                  />
                  <CategoryIcon category={category.value} />
                  {category.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
