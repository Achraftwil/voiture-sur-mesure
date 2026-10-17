import { createHash, randomBytes } from "node:crypto";
import { sendClientLink } from "@/lib/brevo";
import { getSupabase } from "@/lib/supabase";

export type OffreClient = {
  id: string;
  created_at: string;
  vehicle: string;
  price: number;
  choice: string;
  emailed_at: string | null;
  client_note: string;
  messages?: { id: string; auteur: "client" | "proprietaire"; corps: string; created_at: string }[];
};

export type DemandeClient = {
  id: string;
  created_at: string;
  updated_at: string | null;
  email_confirme_at: string | null;
  annulee_at: string | null;
  archived_at: string | null;
  statut: string;
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
  offres: OffreClient[];
};

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3010").replace(/\/$/, "");
}

export async function envoyerLienClient(email: string, name: string, confirmation: boolean) {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "L'e-mail n'a pas pu être envoyé." };

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("creer_lien_client", {
    clef: secret,
    email,
    token_hash: tokenHash,
  });
  if (error) {
    console.error("creer_lien_client", error.code);
    return { error: "L'e-mail n'a pas pu être envoyé." };
  }
  if (data !== true) return { error: "Trop de liens ont été demandés. Réessayez dans une heure." };

  const mail = await sendClientLink({
    toEmail: email,
    toName: name,
    link: `${siteUrl()}/compte/acces/${token}`,
    confirmation,
  });
  return mail.error ? { error: mail.error } : {};
}

export async function consommerLienClient(token: string) {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret || !/^[a-f0-9]{64}$/.test(token)) return "";
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("consommer_lien_client", { clef: secret, token_hash: tokenHash });
  if (error || typeof data !== "string") return "";
  return data;
}

export async function lireEspaceClient(email: string) {
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { rows: [] as DemandeClient[], error: "Vos recherches n'ont pas pu être chargées." };
  const { data, error } = await supabase.rpc("lire_espace_client", { clef: secret, email });
  if (error || !Array.isArray(data)) {
    console.error("lire_espace_client", error?.code);
    return { rows: [] as DemandeClient[], error: "Vos recherches n'ont pas pu être chargées." };
  }
  return { rows: data as DemandeClient[], error: "" };
}
