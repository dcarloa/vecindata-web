import type { AdvisorInfo } from "../../hooks/useAdvisorInfo";
import { POI_CATEGORIES, RADIUS_OPTIONS, type RadiusM } from "../../utils/constants";
import styles from "./PersonalizationFields.module.css";

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
            {POI_CATEGORIES.map((category) => (
              <label key={category.value} className={styles.categoryItem}>
                <input
                  type="checkbox"
                  checked={visibleCategories.includes(category.value)}
                  onChange={() => toggleCategory(category.value)}
                />
                {category.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
