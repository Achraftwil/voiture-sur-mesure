"use server";

import { revalidatePath } from "next/cache";
import { sendQuestionAuProprio } from "@/lib/brevo";
import { getSupabase } from "@/lib/supabase";

export async function repondreOffre(token: string, _prev: { error: string; sent: boolean }, formData: FormData) {
  const choix = String(formData.get("choix") ?? "");
  const offreId = String(formData.get("offreId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  if (choix !== "retenue" && choix !== "refusee") {
    return { error: "Indiquez si vous retenez cette voiture.", sent: false };
  }
  if (!/^[a-f0-9]{48}$/.test(token)) return { error: "Ce lien n'est pas valable.", sent: false };

  const supabase = getSupabase();
  if (!supabase) return { error: "La réponse n'a pas pu être enregistrée.", sent: false };

  const { error } = await supabase.rpc("choisir_offre", {
    token,
    offre_id: offreId,
    choix,
    message,
  });
  if (error) {
    console.error("choisir_offre", error.code);
    return { error: "La réponse n'a pas pu être enregistrée.", sent: false };
  }

  revalidatePath(`/suivi/${token}`);
  revalidatePath("/demandes");
  return { error: "", sent: true };
}

export async function poserQuestion(token: string, _prev: { error: string; sent: boolean }, formData: FormData) {
  const offreId = String(formData.get("offreId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  if (message.length < 2) return { error: "Écrivez votre message.", sent: false };
  if (!/^[a-f0-9]{48}$/.test(token) || !/^[0-9a-f-]{36}$/.test(offreId)) {
    return { error: "Ce lien n'est pas valable.", sent: false };
  }

  const supabase = getSupabase();
  if (!supabase) return { error: "La question n'a pas pu être enregistrée.", sent: false };

  const { data, error } = await supabase.rpc("poser_question", { token, offre_id: offreId, message });
  if (error || !data || typeof data !== "object") {
    console.error("poser_question", error?.code);
    const trop = error?.code === "22023" && message.length >= 2;
    return { error: trop ? "Trop de questions pour le moment. Réessayez dans une heure." : "La question n'a pas pu être enregistrée.", sent: false };
  }

  const info = data as { vehicle?: string; contact_name?: string };
  const site = (process.env.SITE_URL || "http://localhost:3010").replace(/\/$/, "");
  const mail = await sendQuestionAuProprio({
    clientName: info.contact_name || "",
    vehicle: info.vehicle || "votre recherche",
    message,
    link: `${site}/demandes?vue=reponses`,
  });
  revalidatePath(`/suivi/${token}`);
  revalidatePath("/demandes");
  revalidatePath("/mes-recherches");
  if (mail.error) console.error("question mail");
  return { error: "", sent: true };
}
