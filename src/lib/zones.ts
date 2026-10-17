export const serviceAreaLabel = "Île-de-France";

export const pickupAreas = [
  { value: "idf", label: "Toute l'Île-de-France" },
  { value: "75", label: "Paris" },
  { value: "92", label: "Hauts-de-Seine" },
  { value: "93", label: "Seine-Saint-Denis" },
  { value: "94", label: "Val-de-Marne" },
  { value: "91", label: "Essonne" },
  { value: "78", label: "Yvelines" },
  { value: "95", label: "Val-d'Oise" },
  { value: "77", label: "Seine-et-Marne" },
] as const;

export function pickupAreaLabel(value: string) {
  return pickupAreas.find((area) => area.value === value)?.label ?? value;
}
