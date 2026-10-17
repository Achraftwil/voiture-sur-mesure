export const STATUTS = [
  {
    value: "nouvelle",
    label: "Nouvelle",
    chip: "border-[#e2c98a] bg-[#f4ead2] text-[#6a4b12]",
    bar: "border-t-[#c4a15a]",
  },
  {
    value: "en-recherche",
    label: "En recherche",
    chip: "border-[#b7cdc4] bg-[#e7f0ec] text-[#1e3a34]",
    bar: "border-t-[#1e3a34]",
  },
  {
    value: "offres-envoyees",
    label: "Offres envoyées",
    chip: "border-[#b9cbe0] bg-[#e6eef5] text-[#1e3a5f]",
    bar: "border-t-[#1e3a5f]",
  },
  {
    value: "en-discussion",
    label: "En discussion",
    chip: "border-[#e4cbb8] bg-[#f6ebe3] text-[#6b3a22]",
    bar: "border-t-[#8a4b2f]",
  },
  {
    value: "conclue",
    label: "Conclue",
    chip: "border-[#b7d7b8] bg-[#e5f2e4] text-[#1d4d32]",
    bar: "border-t-[#1d4d32]",
  },
  {
    value: "sans-suite",
    label: "Sans suite",
    chip: "border-[#d7d0c4] bg-[#eeeae4] text-[#5f5a52]",
    bar: "border-t-[#8a847a]",
  },
] as const;

export type Statut = (typeof STATUTS)[number]["value"];

export function isStatut(value: string): value is Statut {
  return STATUTS.some((statut) => statut.value === value);
}

export function statutOf(value: string) {
  return STATUTS.find((statut) => statut.value === value) ?? STATUTS[0];
}
