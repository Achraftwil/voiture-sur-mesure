import { getSupabase } from "@/lib/supabase";
import { pickupAreaLabel } from "@/lib/zones";

export type Demande = {
  id: string;
  created_at: string;
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
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  statut: string;
  access_token: string;
  archived_at: string | null;
  photos_retirees: number | null;
  email_confirme_at: string | null;
  annulee_at: string | null;
  updated_at: string | null;
  recherche_le: string | null;
  recherche_erreur: string | null;
};

const LABELS: Record<string, string> = {
  essence: "Essence",
  diesel: "Diesel",
  hybride: "Hybride",
  "hybride-rechargeable": "Hybride rechargeable",
  electrique: "Électrique",
  gpl: "GPL",
  manuelle: "Manuelle",
  automatique: "Automatique",
  francaise: "Voiture française",
  excellent: "Excellent état",
  "tres-bon": "Très bon état",
  bon: "Bon état",
  correct: "État correct",
  "peu-importe": "Peu importe",
  autre: "Autre origine",
  "des-que-possible": "Je suis pressé",
  "2-semaines": "Sous 2 semaines",
  "1-mois": "Sous 1 mois",
  "3-mois": "Sous 3 mois",
  "pas-presse": "Je ne suis pas pressé",
};

export async function listDemandes() {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) {
    return { rows: [] as Demande[], error: "La lecture des demandes est indisponible." };
  }

  const { data, error } = await supabase.rpc("lire_demandes", { clef: secret });
  if (error) {
    console.error("lire_demandes", error.code);
    return { rows: [] as Demande[], error: "Les demandes n'ont pas pu être chargées." };
  }

  return { rows: (data ?? []) as Demande[], error: "" };
}

export function demandeDetails(demande: Pick<Demande, "brand" | "model" | "origin" | "year_from" | "year_to" | "mileage_max" | "fuel" | "gearbox" | "condition" | "budget" | "deadline" | "pickup_area">) {
  const vehicle = [demande.brand, demande.model].filter(Boolean).join(" ");
  const years =
    demande.year_from && demande.year_to
      ? `${demande.year_from} – ${demande.year_to}`
      : demande.year_from
        ? `À partir de ${demande.year_from}`
        : demande.year_to
          ? `Jusqu'en ${demande.year_to}`
          : "";

  const rows = [
    vehicle ? { label: "Véhicule", value: vehicle } : null,
    label(demande.origin) ? { label: "Origine", value: label(demande.origin) } : null,
    years ? { label: "Année", value: years } : null,
    demande.mileage_max
      ? { label: "Kilométrage", value: `${formatNumber(demande.mileage_max)} km maximum` }
      : null,
    label(demande.fuel) ? { label: "Carburant", value: label(demande.fuel) } : null,
    label(demande.gearbox) ? { label: "Boîte", value: label(demande.gearbox) } : null,
    label(demande.condition) ? { label: "État", value: label(demande.condition) } : null,
    { label: "Budget", value: `${formatNumber(demande.budget)} € maximum` },
    { label: "Délai", value: label(demande.deadline) || demande.deadline },
    demande.pickup_area
      ? { label: "Récupération", value: pickupAreaLabel(demande.pickup_area) }
      : null,
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row));
}

export function formatDemandeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export function searchLabel(value: string) {
  return label(value);
}

function label(value: string) {
  if (!value) return "";
  return LABELS[value] ?? value;
}

function formatNumber(value: number) {
  return value.toLocaleString("fr-FR");
}
