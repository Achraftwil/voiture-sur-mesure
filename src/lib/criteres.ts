import { searchLabel } from "@/lib/demandes";
import { pickupAreaLabel } from "@/lib/zones";

export type CritereDemande = {
  brand: string;
  model: string;
  origin: string;
  condition: string;
  year_from: number | null;
  year_to: number | null;
  mileage_max: number | null;
  fuel: string;
  gearbox: string;
  budget: number;
  deadline: string;
  pickup_area: string;
  comment: string;
};

export type CritereActif = {
  cle: string;
  libelle: string;
  valeur: string;
};

export type CritereEnregistre = CritereActif & {
  correspond: boolean;
  proposition: string;
  compte: boolean;
};

export type OffreSaisie = {
  brand: string;
  model: string;
  origin: string;
  year: number | null;
  mileage: number | null;
  fuel: string;
  gearbox: string;
  condition: string;
  price: number | null;
  deadline: string;
  pickup: string;
  comment: string;
};

const ANY = "Peu importe";

function choisi(value: string) {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== ANY && trimmed !== "peu-importe";
}

const DEFINITIONS: {
  cle: string;
  libelle: string;
  actif: (demande: CritereDemande) => boolean;
  valeur: (demande: CritereDemande) => string;
}[] = [
  { cle: "brand", libelle: "Marque", actif: (demande) => choisi(demande.brand), valeur: (demande) => demande.brand },
  { cle: "model", libelle: "Modèle", actif: (demande) => choisi(demande.model), valeur: (demande) => demande.model },
  { cle: "origin", libelle: "Origine", actif: (demande) => choisi(demande.origin), valeur: (demande) => searchLabel(demande.origin) },
  { cle: "year", libelle: "Année", actif: (demande) => Boolean(demande.year_from || demande.year_to), valeur: annee },
  {
    cle: "mileage",
    libelle: "Kilométrage",
    actif: (demande) => Boolean(demande.mileage_max),
    valeur: (demande) => `${Number(demande.mileage_max).toLocaleString("fr-FR")} km maximum`,
  },
  { cle: "fuel", libelle: "Carburant", actif: (demande) => choisi(demande.fuel), valeur: (demande) => searchLabel(demande.fuel) },
  { cle: "gearbox", libelle: "Boîte", actif: (demande) => choisi(demande.gearbox), valeur: (demande) => searchLabel(demande.gearbox) },
  {
    cle: "condition",
    libelle: "État",
    actif: (demande) => choisi(demande.condition),
    valeur: (demande) => searchLabel(demande.condition),
  },
  {
    cle: "budget",
    libelle: "Budget",
    actif: (demande) => Number(demande.budget) > 0,
    valeur: (demande) => `${Number(demande.budget).toLocaleString("fr-FR")} € maximum`,
  },
  {
    cle: "deadline",
    libelle: "Délai",
    actif: (demande) => choisi(demande.deadline),
    valeur: (demande) => searchLabel(demande.deadline),
  },
  {
    cle: "pickup",
    libelle: "Récupération",
    actif: (demande) => demande.pickup_area.trim() !== "",
    valeur: (demande) => pickupAreaLabel(demande.pickup_area),
  },
  {
    cle: "comment",
    libelle: "Précisions",
    actif: (demande) => demande.comment.trim() !== "",
    valeur: (demande) => demande.comment.trim(),
  },
];

export function criteresActifs(demande: CritereDemande) {
  return DEFINITIONS.filter((definition) => definition.actif(demande)).map((definition) => ({
    cle: definition.cle,
    libelle: definition.libelle,
    valeur: definition.valeur(demande),
  }));
}

export function pourcentage(criteres: { correspond: boolean; compte?: boolean }[]) {
  const comptes = criteres.filter((critere) => critere.compte !== false);
  if (comptes.length === 0) return null;
  const correspondants = comptes.filter((critere) => critere.correspond).length;
  return {
    correspondants,
    total: comptes.length,
    pourcent: Math.round((correspondants / comptes.length) * 100),
  };
}

const DELAIS = ["des-que-possible", "2-semaines", "1-mois", "3-mois", "pas-presse"];
const ETATS = ["correct", "bon", "tres-bon", "excellent"];

export function saisieOffre(valeurs: Record<string, string>): OffreSaisie {
  return {
    brand: (valeurs.brand ?? "").trim(),
    model: (valeurs.model ?? "").trim(),
    origin: (valeurs.origin ?? "").trim(),
    year: entier(valeurs.year, 4),
    mileage: entier(valeurs.mileage, 7),
    fuel: (valeurs.fuel ?? "").trim(),
    gearbox: (valeurs.gearbox ?? "").trim(),
    condition: (valeurs.condition ?? "").trim(),
    price: entier(valeurs.price, 7),
    deadline: (valeurs.deadline ?? "").trim(),
    pickup: (valeurs.pickup ?? "").trim(),
    comment: (valeurs.comment ?? "").trim().slice(0, 2000),
  };
}

export function evaluerOffre(demande: CritereDemande, saisie: OffreSaisie) {
  const lignes: CritereEnregistre[] = [];
  let complet = true;
  for (const critere of criteresActifs(demande)) {
    if (critere.cle === "comment") continue;
    const resultat = juger(critere.cle, demande, saisie);
    if (!resultat) {
      complet = false;
      continue;
    }
    lignes.push({ ...critere, ...resultat });
  }
  return { lignes, complet };
}

export function textePourcentage(score: { correspondants: number; total: number; pourcent: number }) {
  const mot = score.total > 1 ? "critères" : "critère";
  return `${score.pourcent} % · ${score.correspondants} sur ${score.total} ${mot}`;
}

export function lireCriteres(value: unknown): CritereEnregistre[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!estCritere(item)) return [];
    const critere = item as CritereEnregistre;
    return [
      {
        ...critere,
        valeur: typeof critere.valeur === "string" ? critere.valeur : "",
        proposition: typeof critere.proposition === "string" ? critere.proposition : "",
        compte: critere.compte !== false,
      },
    ];
  });
}

function estCritere(value: unknown): value is CritereEnregistre {
  if (!value || typeof value !== "object") return false;
  const critere = value as CritereEnregistre;
  return typeof critere.cle === "string" && typeof critere.libelle === "string" && typeof critere.correspond === "boolean";
}

function juger(cle: string, demande: CritereDemande, saisie: OffreSaisie) {
  if (cle === "brand") return texteEgal(saisie.brand, demande.brand, saisie.brand);
  if (cle === "model") return texteEgal(saisie.model, demande.model, saisie.model);
  if (cle === "origin") return codeEgal(saisie.origin, demande.origin);
  if (cle === "fuel") return codeEgal(saisie.fuel, demande.fuel);
  if (cle === "gearbox") return codeEgal(saisie.gearbox, demande.gearbox);
  if (cle === "condition") return etatCorrespond(saisie.condition, demande.condition);
  if (cle === "year") return anneeCorrespond(saisie.year, demande);
  if (cle === "mileage") return kilometrageCorrespond(saisie.mileage, demande.mileage_max);
  if (cle === "budget") return budgetCorrespond(saisie.price, demande.budget);
  if (cle === "deadline") return delaiCorrespond(saisie.deadline, demande.deadline);
  if (cle === "pickup") return recupCorrespond(saisie.pickup, demande.pickup_area);
  if (cle === "comment") {
    if (!saisie.comment) return null;
    return { proposition: saisie.comment, correspond: false, compte: false };
  }
  return null;
}

function texteEgal(offre: string, demande: string, proposition: string) {
  if (!offre) return null;
  return {
    proposition,
    correspond: offre.localeCompare(demande, "fr", { sensitivity: "accent" }) === 0,
    compte: true,
  };
}

function codeEgal(offre: string, demande: string) {
  if (!offre) return null;
  return { proposition: searchLabel(offre), correspond: offre === demande, compte: true };
}

function etatCorrespond(offre: string, demande: string) {
  const offreRang = ETATS.indexOf(offre);
  const demandeRang = ETATS.indexOf(demande);
  if (offreRang < 0) return null;
  return {
    proposition: searchLabel(offre),
    correspond: demandeRang >= 0 && offreRang >= demandeRang,
    compte: true,
  };
}

function anneeCorrespond(year: number | null, demande: CritereDemande) {
  if (!year) return null;
  const apresDebut = !demande.year_from || year >= demande.year_from;
  const avantFin = !demande.year_to || year <= demande.year_to;
  return { proposition: String(year), correspond: apresDebut && avantFin, compte: true };
}

function kilometrageCorrespond(mileage: number | null, maximum: number | null) {
  if (!mileage || !maximum) return null;
  return {
    proposition: `${mileage.toLocaleString("fr-FR")} km`,
    correspond: mileage <= maximum,
    compte: true,
  };
}

function budgetCorrespond(price: number | null, budget: number) {
  if (!price) return null;
  return {
    proposition: `${price.toLocaleString("fr-FR")} €`,
    correspond: price <= budget,
    compte: true,
  };
}

function delaiCorrespond(offre: string, demande: string) {
  const offreRang = DELAIS.indexOf(offre);
  const demandeRang = DELAIS.indexOf(demande);
  if (offreRang < 0) return null;
  return {
    proposition: searchLabel(offre),
    correspond: demandeRang >= 0 && offreRang <= demandeRang,
    compte: true,
  };
}

function recupCorrespond(offre: string, demande: string) {
  if (!offre) return null;
  const compatible = offre === demande || offre === "idf" || demande === "idf";
  return { proposition: pickupAreaLabel(offre), correspond: compatible, compte: true };
}

function entier(value: string | undefined, maxDigits: number) {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, maxDigits);
  if (!digits) return null;
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function annee(demande: CritereDemande) {
  if (demande.year_from && demande.year_to) return `${demande.year_from} – ${demande.year_to}`;
  if (demande.year_from) return `À partir de ${demande.year_from}`;
  return `Jusqu'en ${demande.year_to}`;
}
