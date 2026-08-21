export const REQUEST_TIMEOUT_MS = 60_000;

export type RadiusM = 500 | 1000 | 2000;

export const DEFAULT_RADIUS_M: RadiusM = 1000;

export const RADIUS_OPTIONS: { value: RadiusM; label: string }[] = [
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
];

export const POI_CATEGORIES: { value: string; label: string }[] = [
  { value: "educacion", label: "Educación" },
  { value: "salud", label: "Salud" },
  { value: "transporte", label: "Transporte" },
  { value: "comercio", label: "Comercio" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "parques", label: "Parques" },
  { value: "bancos", label: "Bancos" },
];

export const ALL_CATEGORY_VALUES: string[] = POI_CATEGORIES.map((c) => c.value);
