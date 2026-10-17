import { filtresAuto1, type VoitureSource } from "@/lib/recherche-auto1";

const PAYS: Record<string, string> = {
  fr: "FR",
  france: "FR",
  de: "DE",
  allemagne: "DE",
  germany: "DE",
  deutschland: "DE",
  be: "BE",
  belgique: "BE",
  belgium: "BE",
  nl: "NL",
  "pays-bas": "NL",
  netherlands: "NL",
  nederland: "NL",
};

const CARBURANTS: Record<string, string> = {
  essence: "essence",
  petrol: "essence",
  gasoline: "essence",
  diesel: "diesel",
  hybride: "hybride",
  hybrid: "hybride",
  "hybride-rechargeable": "hybride-rechargeable",
  electrique: "electrique",
  electric: "electrique",
  gpl: "gpl",
};

const BOITES: Record<string, string> = {
  manuelle: "manuelle",
  manual: "manuelle",
  automatique: "automatique",
  automatic: "automatique",
};

export async function interrogerAuto1(demande: Parameters<typeof filtresAuto1>[0]) {
  const url = process.env.AUTO1_SEARCH_URL;
  const key = process.env.AUTO1_API_KEY;
  if (!url || !key) return { voitures: [] as VoitureSource[], error: "L'accès au stock Auto1 n'est pas encore relié." };

  const filtres = filtresAuto1(demande);
  if (filtres.prixMax <= 0) return { voitures: [] as VoitureSource[], error: "Le budget ne couvre pas la recherche." };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(filtres),
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    console.error("auto1", error instanceof Error ? error.name : "reseau");
    return { voitures: [], error: "La recherche Auto1 n'a pas abouti." };
  }
  if (!response.ok) {
    console.error("auto1", response.status);
    return { voitures: [], error: "La recherche Auto1 n'a pas abouti." };
  }

  const corps = (await response.json().catch(() => null)) as { voitures?: unknown } | null;
  if (!corps || !Array.isArray(corps.voitures)) return { voitures: [], error: "La recherche Auto1 n'a pas abouti." };
  return { voitures: corps.voitures.map(normaliser).filter((voiture): voiture is VoitureSource => Boolean(voiture)), error: "" };
}

function normaliser(valeur: unknown): VoitureSource | null {
  if (!valeur || typeof valeur !== "object") return null;
  const ligne = valeur as Record<string, unknown>;
  const reference = texte(ligne.reference, 40);
  const prix = entier(ligne.prix);
  const pays = PAYS[texte(ligne.pays, 40).toLowerCase()] ?? "";
  if (!reference || !prix || !pays) return null;
  const essai = texte(ligne.essai, 80).toLowerCase();
  return {
    reference,
    prix,
    achatImmediat: ligne.achatImmediat === true,
    essaiSansProbleme: essai === "aucun-resultat-specifique" || essai === "aucun résultat spécifique",
    pays,
    brand: texte(ligne.marque, 80),
    model: texte(ligne.modele, 80),
    year: entier(ligne.annee),
    mileage: entier(ligne.kilometrage),
    fuel: CARBURANTS[texte(ligne.carburant, 40).toLowerCase()] ?? "",
    gearbox: BOITES[texte(ligne.boite, 40).toLowerCase()] ?? "",
    puissance: texte(ligne.puissance, 80),
    carrosserie: texte(ligne.carrosserie, 40),
    proprietaires: entier(ligne.proprietaires),
    places: entier(ligne.places),
    couleur: texte(ligne.couleur, 40),
    sellerie: texte(ligne.sellerie, 60),
    portes: entier(ligne.portes),
    photos: Array.isArray(ligne.photos) ? ligne.photos.filter((photo): photo is string => typeof photo === "string" && photo.startsWith("https://")).slice(0, 12) : [],
  };
}

function texte(valeur: unknown, max: number) {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

function entier(valeur: unknown) {
  const nombre = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isInteger(nombre) && nombre > 0 ? nombre : null;
}
