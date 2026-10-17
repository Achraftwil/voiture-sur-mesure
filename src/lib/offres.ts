import { getSupabase } from "@/lib/supabase";

export type Offre = {
  id: string;
  demande_id: string;
  created_at: string;
  vehicle: string;
  year: number | null;
  mileage: number | null;
  price: number;
  place: string;
  comment: string;
  prix_marche: number | null;
  puissance: string;
  carrosserie: string;
  proprietaires: number | null;
  places: number | null;
  couleur: string;
  sellerie: string;
  portes: number | null;
  reference_interne: string;
  choice: string;
  client_note: string;
  emailed_at: string | null;
  criteres: unknown;
  images?: unknown;
  dommages?: unknown;
  messages?: MessageOffre[];
};

export type OffreCreee = {
  id: string;
  access_token: string;
  contact_name: string;
  contact_email: string;
};

export type Suivi = {
  contact_name: string;
  brand: string;
  model: string;
  budget: number;
  deadline: string;
  offres: Array<{
    id: string;
    created_at: string;
    vehicle: string;
    year: number | null;
    mileage: number | null;
    price: number;
    place: string;
    comment: string;
    prix_marche?: number | null;
    puissance?: string | null;
    carrosserie?: string | null;
    proprietaires?: number | null;
    places?: number | null;
    couleur?: string | null;
    sellerie?: string | null;
    portes?: number | null;
    choice: string;
    client_note: string;
    criteres: unknown;
    images?: unknown;
    dommages?: unknown;
    messages?: MessageOffre[];
  }>;
};

export type MessageOffre = {
  id: string;
  offre_id?: string;
  auteur: "client" | "proprietaire";
  corps: string;
  created_at: string;
};

export function questionEnAttente(messages: { auteur: string }[] | undefined) {
  const dernier = messages?.[messages.length - 1];
  return dernier?.auteur === "client";
}

export const DECISIONS = [
  {
    value: "retenue",
    label: "Retenue",
    chip: "border-[#b7d7b8] bg-[#e5f2e4] text-[#1d4d32]",
  },
  {
    value: "en-attente",
    label: "En attente",
    chip: "border-[#e2c98a] bg-[#f4ead2] text-[#6a4b12]",
  },
  {
    value: "refusee",
    label: "Refusée",
    chip: "border-[#e4cbb8] bg-[#f6ebe3] text-[#6b3a22]",
  },
] as const;

export function infosComplementaires(offre: {
  puissance?: string | null;
  carrosserie?: string | null;
  proprietaires?: number | null;
  places?: number | null;
  couleur?: string | null;
  sellerie?: string | null;
  portes?: number | null;
}) {
  const lignes: { label: string; value: string }[] = [];
  const texte = (label: string, value: string | null | undefined) => {
    const propre = value?.trim();
    if (propre) lignes.push({ label, value: propre });
  };
  const nombre = (label: string, value: number | null | undefined) => {
    if (typeof value !== "number") return;
    lignes.push({ label, value: String(value) });
  };
  texte("Puissance", offre.puissance);
  texte("Carrosserie", offre.carrosserie);
  nombre("Nombre total de propriétaires", offre.proprietaires);
  nombre("Nombre de places", offre.places);
  texte("Couleur", offre.couleur);
  texte("Sellerie", offre.sellerie);
  nombre("Nombre de portes", offre.portes);
  return lignes;
}

export function choiceLabel(value: string) {
  if (value === "en-attente") return "En attente de réponse";
  return DECISIONS.find((decision) => decision.value === value)?.label ?? value;
}

export async function listOffres() {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { rows: [] as Offre[], error: "Les offres n'ont pas pu être chargées." };

  const [offres, messages] = await Promise.all([
    supabase.rpc("lire_offres", { clef: secret }),
    supabase.rpc("lire_messages_offres", { clef: secret }),
  ]);
  if (offres.error) {
    console.error("lire_offres", offres.error.code);
    return { rows: [] as Offre[], error: "Les offres n'ont pas pu être chargées." };
  }
  if (messages.error) console.error("lire_messages_offres", messages.error.code);
  const parOffre = new Map<string, MessageOffre[]>();
  const lignes = Array.isArray(messages.data) ? (messages.data as MessageOffre[]) : [];
  for (const message of lignes) {
    if (!message.offre_id) continue;
    const liste = parOffre.get(message.offre_id) ?? [];
    liste.push(message);
    parOffre.set(message.offre_id, liste);
  }
  const rows = ((offres.data ?? []) as Offre[]).map((offre) => ({
    ...offre,
    messages: (parOffre.get(offre.id) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
  return { rows, error: "" };
}

export async function readSuivi(token: string) {
  const supabase = getSupabase();
  if (!supabase || !/^[a-f0-9]{48}$/.test(token)) return null;
  const { data, error } = await supabase.rpc("lire_suivi", { token });
  if (error || !data) return null;
  return data as Suivi;
}

export function offerLink(token: string) {
  const site = (process.env.SITE_URL || "http://localhost:3010").replace(/\/$/, "");
  return `${site}/suivi/${token}`;
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}
