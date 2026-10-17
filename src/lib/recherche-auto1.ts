export type DemandeRecherche = {
  brand: string;
  model: string;
  origin: string;
  year_from: number | null;
  year_to: number | null;
  mileage_max: number | null;
  fuel: string;
  gearbox: string;
  budget: number;
};

export type VoitureSource = {
  reference: string;
  prix: number;
  achatImmediat: boolean;
  essaiSansProbleme: boolean;
  pays: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  fuel: string;
  gearbox: string;
  puissance: string;
  carrosserie: string;
  proprietaires: number | null;
  places: number | null;
  couleur: string;
  sellerie: string;
  portes: number | null;
  photos: string[];
};

const PAYS_LARGES = ["DE", "BE", "NL", "FR"];

export function prixMaxAuto1(budget: number) {
  return budget - 1900;
}

export function paysAutorises(origin: string) {
  return origin === "francaise" ? ["FR"] : PAYS_LARGES;
}

export function filtresAuto1(demande: DemandeRecherche) {
  return {
    achat: "immediat",
    essai: "aucun-resultat-specifique",
    prixMax: prixMaxAuto1(demande.budget),
    pays: paysAutorises(demande.origin),
    marque: critere(demande.brand),
    modele: critere(demande.model),
    anneeMin: demande.year_from,
    anneeMax: demande.year_to,
    kilometrageMax: demande.mileage_max,
    carburant: critere(demande.fuel),
    boite: critere(demande.gearbox),
  };
}

export function choisirTrois(demande: DemandeRecherche, voitures: VoitureSource[]) {
  return voitures
    .filter((voiture) => convient(demande, voiture))
    .sort((gauche, droite) => comparer(demande, gauche, droite))
    .slice(0, 3);
}

function convient(demande: DemandeRecherche, voiture: VoitureSource) {
  if (!voiture.achatImmediat || !voiture.essaiSansProbleme) return false;
  if (!voiture.reference.trim() || voiture.prix <= 0 || voiture.prix > prixMaxAuto1(demande.budget)) return false;
  if (!paysAutorises(demande.origin).includes(voiture.pays)) return false;
  if (critere(demande.brand) && !meme(demande.brand, voiture.brand)) return false;
  if (critere(demande.model) && !meme(demande.model, voiture.model)) return false;
  if ((demande.year_from || demande.year_to) && !anneeConvient(demande, voiture.year)) return false;
  if (demande.mileage_max && (!voiture.mileage || voiture.mileage > demande.mileage_max)) return false;
  if (critere(demande.fuel) && !meme(demande.fuel, voiture.fuel)) return false;
  if (critere(demande.gearbox) && !meme(demande.gearbox, voiture.gearbox)) return false;
  return true;
}

function comparer(demande: DemandeRecherche, gauche: VoitureSource, droite: VoitureSource) {
  if (demande.year_from || demande.year_to) {
    const ecart = (droite.year ?? 0) - (gauche.year ?? 0);
    if (ecart !== 0) return ecart;
  }
  if (demande.mileage_max) {
    const ecart = (gauche.mileage ?? Number.MAX_SAFE_INTEGER) - (droite.mileage ?? Number.MAX_SAFE_INTEGER);
    if (ecart !== 0) return ecart;
  }
  return gauche.prix - droite.prix;
}

function anneeConvient(demande: DemandeRecherche, year: number | null) {
  if (!year) return false;
  if (demande.year_from && year < demande.year_from) return false;
  if (demande.year_to && year > demande.year_to) return false;
  return true;
}

function critere(value: string) {
  const texte = value.trim();
  if (!texte || texte === "Peu importe" || texte === "peu-importe") return "";
  return texte;
}

function meme(attendu: string, recu: string) {
  return critere(attendu).localeCompare(critere(recu), "fr", { sensitivity: "accent" }) === 0;
}
