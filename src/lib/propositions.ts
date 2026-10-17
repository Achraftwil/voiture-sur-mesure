import { interrogerAuto1 } from "@/lib/auto1";
import { listDemandes } from "@/lib/demandes";
import { choisirTrois, prixMaxAuto1, type VoitureSource } from "@/lib/recherche-auto1";
import { getSupabase } from "@/lib/supabase";

export type Proposition = {
  id: string;
  demande_id: string;
  rang: number;
  reference_interne: string;
  prix: number;
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
  pays: string;
  photos: string[];
};

export async function lirePropositions() {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { rows: [] as Proposition[], error: "Les propositions n'ont pas pu être chargées." };
  const { data, error } = await supabase.rpc("lire_propositions", { clef: secret });
  if (error || !Array.isArray(data)) {
    console.error("lire_propositions", error?.code);
    return { rows: [] as Proposition[], error: "Les propositions n'ont pas pu être chargées." };
  }
  return {
    rows: data.map((ligne) => ({
      ...(ligne as Proposition),
      photos: Array.isArray((ligne as Proposition).photos) ? (ligne as Proposition).photos : [],
    })),
    error: "",
  };
}

export async function lancerRecherche(demandeId: string) {
  const { rows } = await listDemandes();
  const demande = rows.find((ligne) => ligne.id === demandeId);
  if (!demande || !demande.email_confirme_at || demande.annulee_at || demande.archived_at) return;

  if (prixMaxAuto1(demande.budget) <= 0) {
    await enregistrer(demandeId, [], "Le budget ne couvre pas la recherche.");
    return;
  }

  const stock = await interrogerAuto1(demande);
  if (stock.error) {
    await enregistrer(demandeId, [], stock.error);
    return;
  }
  await enregistrer(demandeId, choisirTrois(demande, stock.voitures), "");
}

export async function lancerRecherchesConfirmees(email: string) {
  const { rows } = await listDemandes();
  const adresse = email.trim().toLowerCase();
  const maintenant = Date.now();
  for (const demande of rows) {
    if (demande.contact_email.trim().toLowerCase() !== adresse) continue;
    if (!demande.email_confirme_at || demande.recherche_le || demande.annulee_at || demande.archived_at) continue;
    if (maintenant - new Date(demande.email_confirme_at).getTime() > 15 * 60 * 1000) continue;
    await lancerRecherche(demande.id);
  }
}

async function enregistrer(demandeId: string, voitures: VoitureSource[], erreur: string) {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return;
  const { error } = await supabase.rpc("enregistrer_recherche", {
    clef: secret,
    demande_id: demandeId,
    lignes: voitures.map(lignePourBase),
    erreur,
  });
  if (error) console.error("enregistrer_recherche", error.code);
}

function lignePourBase(voiture: VoitureSource) {
  return {
    reference: voiture.reference,
    prix: voiture.prix,
    brand: voiture.brand,
    model: voiture.model,
    year: voiture.year,
    mileage: voiture.mileage,
    fuel: voiture.fuel,
    gearbox: voiture.gearbox,
    puissance: voiture.puissance,
    carrosserie: voiture.carrosserie,
    proprietaires: voiture.proprietaires,
    places: voiture.places,
    couleur: voiture.couleur,
    sellerie: voiture.sellerie,
    portes: voiture.portes,
    pays: voiture.pays,
    photos: voiture.photos,
  };
}

