"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clientCookieName, emailFromClientSession, normaliserEmail } from "@/lib/client-session";
import { envoyerLienClient, lireEspaceClient } from "@/lib/espace-client";
import { getSupabase } from "@/lib/supabase";

export async function demanderLien(_prev: { message: string }, formData: FormData) {
  const email = normaliserEmail(String(formData.get("email") ?? ""));
  const neutre = { message: "Si cette adresse a déjà une recherche, un lien vient d'être envoyé." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: "Indiquez une adresse e-mail valable." };
  }

  const espace = await lireEspaceClient(email);
  if (espace.rows.length === 0) return neutre;
  await envoyerLienClient(email, espace.rows[0]?.contact_name ?? "", false);
  return neutre;
}

export async function fermerSession() {
  const jar = await cookies();
  jar.delete(clientCookieName());
  redirect("/mes-recherches");
}

export async function retirerRecherche(formData: FormData) {
  const jar = await cookies();
  const email = emailFromClientSession(jar.get(clientCookieName())?.value);
  const id = String(formData.get("demandeId") ?? "");
  if (!email || !/^[0-9a-f-]{36}$/.test(id)) redirect("/mes-recherches");

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) redirect(`/mes-recherches/${id}?erreur=1`);

  const { data, error } = await supabase.rpc("retirer_demande_client", { clef: secret, email, demande_id: id });
  if (error) redirect(`/mes-recherches/${id}?erreur=1`);
  redirect(data === "supprimee" ? "/mes-recherches" : `/mes-recherches/${id}`);
}
