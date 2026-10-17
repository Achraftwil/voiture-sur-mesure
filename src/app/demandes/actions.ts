"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, adminSessionToken, isAdminSession, passwordMatches } from "@/lib/admin-session";
import { sendOfferEmail, sendReponseAuClient } from "@/lib/brevo";
import { lancerRecherche } from "@/lib/propositions";
import { evaluerOffre, lireCriteres, pourcentage, saisieOffre, type CritereDemande } from "@/lib/criteres";
import { pickupAreaLabel } from "@/lib/zones";
import { offerLink, type Offre, type OffreCreee } from "@/lib/offres";
import { MAX_PHOTOS, lirePhotos, type ImageEnregistree } from "@/lib/photos";
import { cheminValide, photosDeposees, rattacherPhotos, signerDepots, supprimerFichiers } from "@/lib/photos-depot";
import { getSupabase } from "@/lib/supabase";
import { isStatut } from "@/lib/statuts";

export async function unlockDemandes(formData: FormData) {
  const password = String(formData.get("code") ?? "");
  if (!passwordMatches(password)) redirect("/demandes?erreur=1");

  const jar = await cookies();
  jar.set(adminCookieName(), adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/demandes");
}

export async function lockDemandes() {
  const jar = await cookies();
  jar.delete(adminCookieName());
  redirect("/demandes");
}

export async function archiverDemande(_prev: { error: string }, formData: FormData) {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const demandeId = String(formData.get("demandeId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(demandeId)) return { error: "La demande est introuvable." };

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "La demande n'a pas pu être archivée." };

  const { data, error } = await supabase.rpc("archiver_demande", { clef: secret, demande_id: demandeId });
  if (error || !data || typeof data !== "object") {
    console.error("archiver_demande", error?.code);
    return { error: "La demande n'a pas pu être archivée." };
  }

  const resultat = data as { chemins?: unknown; token?: unknown };
  const chemins = Array.isArray(resultat.chemins) ? resultat.chemins.filter((item): item is string => typeof item === "string" && cheminValide(item)) : [];
  const supprimees = await supprimerFichiers(chemins);
  revalidatePath("/demandes");
  if (typeof resultat.token === "string" && resultat.token) revalidatePath(`/suivi/${resultat.token}`);
  if (!supprimees) {
    return { error: "La demande est archivée, mais certaines photos n'ont pas pu être supprimées." };
  }
  return { error: "" };
}

export async function setDemandeStatut(id: string, statut: string) {
  const jar = await cookies();
  if (!isAdminSession(jar.get(adminCookieName())?.value)) {
    return { error: "L'accès a expiré. Entrez de nouveau le code." };
  }
  if (!isStatut(statut)) return { error: "Ce statut n'existe pas." };

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "Le statut n'a pas pu être enregistré." };

  const { error } = await supabase.rpc("definir_statut", {
    clef: secret,
    demande_id: id,
    nouveau: statut,
  });
  if (error) {
    console.error("definir_statut", error.code);
    return { error: "Le statut n'a pas pu être enregistré." };
  }

  revalidatePath("/demandes");
  return {};
}

export async function envoyerOffre(_prev: { error: string; sent: boolean }, formData: FormData) {
  const demandeId = String(formData.get("demandeId") ?? "");
  const saisie = saisieOffre(lireChamps(formData));
  const vehicle = [saisie.brand, saisie.model].filter(Boolean).join(" ") || String(formData.get("vehicle") ?? "").trim();
  const place = saisie.pickup ? pickupAreaLabel(saisie.pickup).slice(0, 80) : "";

  const denied = await requireAdmin();
  if (denied) return { error: denied, sent: false };
  if (vehicle.length < 2 || !saisie.price) return { error: "Indiquez le véhicule et le prix.", sent: false };
  const photos = photosDeposees(formData);
  const dommages = photosDeposees(formData, "dommages");
  if (photos.error) return { error: photos.error, sent: false };
  if (dommages.error) return { error: dommages.error, sent: false };

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "L'offre n'a pas pu être enregistrée.", sent: false };

  const demandes = await supabase.rpc("lire_demandes", { clef: secret });
  const demande = (demandes.data as Array<CritereDemande & { id?: string; email_confirme_at?: string | null; annulee_at?: string | null }> | null)?.find(
    (item) => item.id === demandeId,
  );
  if (!demande) return { error: "La demande est introuvable.", sent: false };
  if (!demande.email_confirme_at) return { error: "Le client n'a pas encore confirmé son e-mail.", sent: false };
  if (demande.annulee_at) return { error: "Le client a annulé cette recherche.", sent: false };
  const evaluation = evaluerOffre(demande, saisie);
  if (!evaluation.complet) return { error: "Renseignez chaque critère du client.", sent: false };
  const criteres = evaluation.lignes;
  const infos = lireInfos(formData);
  if (infos.error) return { error: infos.error, sent: false };

  const { data, error } = await supabase.rpc("creer_offre", {
    clef: secret,
    demande_id: demandeId,
    vehicle,
    year: saisie.year,
    mileage: saisie.mileage,
    price: saisie.price,
    place,
    comment: saisie.comment,
    criteres,
    prix_marche: prixMarche(formData.get("marketPrice")),
    ...infos.valeurs,
    reference_interne: referenceInterne(formData.get("referenceInterne")),
  });
  if (error || !data) {
    console.error("creer_offre", error?.code);
    return { error: "L'offre n'a pas pu être enregistrée.", sent: false };
  }

  const created = data as OffreCreee;
  const photoError = await enregistrerPhotos(supabase, secret, created.id, photos.photos, "images");
  const dommageError = await enregistrerPhotos(supabase, secret, created.id, dommages.photos, "dommages");
  const mail = await sendOfferEmail({
    toEmail: created.contact_email,
    toName: created.contact_name,
    vehicle,
    price: saisie.price,
    link: offerLink(created.access_token),
    pourcent: pourcentage(criteres)?.pourcent ?? null,
  });
  if (mail.error) {
    revalidatePath("/demandes");
    return { error: mail.error, sent: false };
  }

  const marked = await supabase.rpc("marquer_offre_envoyee", { clef: secret, offre_id: created.id });
  if (marked.error) console.error("marquer_offre_envoyee", marked.error.code);
  revalidatePath("/demandes");
  revalidatePath(`/suivi/${created.access_token}`);
  const pieces = [photoError, dommageError].filter(Boolean);
  if (pieces.length > 0) return { error: `L'e-mail est parti. ${pieces.join(" ")}`, sent: false };
  return { error: "", sent: true };
}

export async function relancerRecherche(demandeId: string) {
  const denied = await requireAdmin();
  if (denied) return;
  if (!/^[0-9a-f-]{36}$/.test(demandeId)) return;
  await lancerRecherche(demandeId);
  revalidatePath("/demandes");
}

export async function repondreQuestion(_prev: { error: string; sent: boolean }, formData: FormData) {
  const denied = await requireAdmin();
  if (denied) return { error: denied, sent: false };
  const offreId = String(formData.get("offreId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  if (!/^[0-9a-f-]{36}$/.test(offreId)) return { error: "L'offre est introuvable.", sent: false };
  if (message.length < 2) return { error: "Écrivez la réponse.", sent: false };

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "La réponse n'a pas pu être enregistrée.", sent: false };

  const { data, error } = await supabase.rpc("repondre_question", { clef: secret, offre_id: offreId, message });
  if (error || !data || typeof data !== "object") {
    console.error("repondre_question", error?.code);
    return { error: "La réponse n'a pas pu être enregistrée.", sent: false };
  }

  const info = data as { contact_email?: string; contact_name?: string; vehicle?: string; access_token?: string };
  if (!info.contact_email || !info.access_token) return { error: "La réponse est enregistrée, mais l'e-mail n'a pas pu partir.", sent: false };
  const mail = await sendReponseAuClient({
    toEmail: info.contact_email,
    toName: info.contact_name || "",
    vehicle: info.vehicle || "la voiture",
    message,
    link: offerLink(info.access_token),
  });
  revalidatePath("/demandes");
  revalidatePath(`/suivi/${info.access_token}`);
  if (mail.error) return { error: "La réponse est enregistrée, mais l'e-mail n'est pas parti.", sent: false };
  return { error: "", sent: true };
}

export async function ajouterPhotosOffre(
  _prev: { error: string; added: boolean; at: number },
  formData: FormData,
) {
  const vide = { error: "", added: false, at: Date.now() };
  const denied = await requireAdmin();
  if (denied) return { ...vide, error: denied };
  const offreId = String(formData.get("offreId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(offreId)) return { ...vide, error: "L'offre est introuvable." };

  const zone = formData.get("zone") === "dommages" ? "dommages" : "images";
  const photos = photosDeposees(formData, zone === "dommages" ? "dommages" : "photos");
  if (photos.error) return { ...vide, error: photos.error };
  if (photos.photos.length === 0) return { ...vide, error: "Choisissez au moins une photo." };

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { ...vide, error: "Les photos n'ont pas pu être enregistrées." };

  const contexte = await contexteOffre(supabase, secret, offreId);
  if (!contexte) return { ...vide, error: "L'offre est introuvable." };
  const deja = lirePhotos(zone === "dommages" ? contexte.offre.dommages : contexte.offre.images).length;
  if (deja + photos.photos.length > MAX_PHOTOS) {
    return { ...vide, error: `${MAX_PHOTOS} photos maximum pour une offre.` };
  }

  const photoError = await enregistrerPhotos(supabase, secret, offreId, photos.photos, zone);
  revalidatePath("/demandes");
  if (contexte.token) revalidatePath(`/suivi/${contexte.token}`);
  if (photoError) return { ...vide, error: photoError };
  return { error: "", added: true, at: Date.now() };
}

/**
 * Donne au navigateur des adresses pour déposer les photos directement dans le stockage.
 * `dossier` est l'identifiant de l'offre quand elle existe déjà, sinon un identifiant provisoire.
 */
export async function preparerDepotPhotos(dossier: string, types: string[]) {
  const denied = await requireAdmin();
  if (denied) return { cibles: [], error: denied };
  if (!Array.isArray(types) || types.some((type) => typeof type !== "string")) {
    return { cibles: [], error: "Les photos doivent être en JPEG, PNG ou WebP." };
  }
  return signerDepots(dossier, types);
}

/** Retire une photo déposée mais pas encore rattachée à une offre. */
export async function retirerDepotPhoto(chemin: string) {
  const denied = await requireAdmin();
  if (denied || typeof chemin !== "string" || !cheminValide(chemin)) return;

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return;

  const dossier = chemin.split("/")[0];
  const { data } = await supabase.rpc("lire_offres", { clef: secret });
  const offre = (data as Offre[] | null)?.find((item) => item.id === dossier);
  if (offre) {
    const rattachee = [...lirePhotos(offre.images), ...lirePhotos(offre.dommages)].some((image) => image.chemin === chemin);
    if (rattachee) return;
  }
  await supprimerFichiers([chemin]);
}

export async function retirerPhotoOffre(formData: FormData) {
  const denied = await requireAdmin();
  if (denied) redirect("/demandes");

  const offreId = String(formData.get("offreId") ?? "");
  const chemin = String(formData.get("chemin") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(offreId) || !new RegExp(`^${offreId}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`).test(chemin)) {
    return;
  }

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return;

  const contexte = await contexteOffre(supabase, secret, offreId);
  const { error } = await supabase.rpc("retirer_image_offre", {
    clef: secret,
    offre_id: offreId,
    chemin,
  });
  if (error) console.error("retirer_image_offre", error.code);
  else await supprimerFichiers([chemin]);

  revalidatePath("/demandes");
  if (contexte?.token) revalidatePath(`/suivi/${contexte.token}`);
}

export type RenvoiState = { error: string; sent: boolean; at: number };

export async function renvoyerOffre(_prev: RenvoiState, formData: FormData): Promise<RenvoiState> {
  const denied = await requireAdmin();
  if (denied) return { error: "L'accès a expiré. Entrez de nouveau le code.", sent: false, at: Date.now() };

  const offreId = String(formData.get("offreId") ?? "");
  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) return { error: "Le service est indisponible pour le moment.", sent: false, at: Date.now() };

  const { data, error } = await supabase.rpc("lire_offres", { clef: secret });
  if (error || !data) return { error: "Impossible de relire l'offre.", sent: false, at: Date.now() };
  const offre = (data as Array<{ id: string; demande_id: string; vehicle: string; price: number; criteres: unknown }>).find(
    (item) => item.id === offreId,
  );
  const demandes = await supabase.rpc("lire_demandes", { clef: secret });
  const demande = (demandes.data as Array<{ id: string; contact_name: string; contact_email: string; access_token: string }> | null)?.find(
    (item) => item.id === offre?.demande_id,
  );
  if (!offre || !demande) return { error: "Offre introuvable.", sent: false, at: Date.now() };

  const mail = await sendOfferEmail({
    toEmail: demande.contact_email,
    toName: demande.contact_name,
    vehicle: offre.vehicle,
    price: offre.price,
    link: offerLink(demande.access_token),
    pourcent: pourcentage(lireCriteres(offre.criteres))?.pourcent ?? null,
  });
  if (mail.error) {
    const texte = mail.error.replace(/^L'offre est enregistrée[.,]?\s*(mais\s+)?/, "");
    return { error: texte.charAt(0).toUpperCase() + texte.slice(1), sent: false, at: Date.now() };
  }

  await supabase.rpc("marquer_offre_envoyee", { clef: secret, offre_id: offre.id });
  revalidatePath("/demandes");
  return { error: "", sent: true, at: Date.now() };
}

async function enregistrerPhotos(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  secret: string,
  offreId: string,
  photos: ImageEnregistree[],
  zone: "images" | "dommages",
) {
  if (photos.length === 0) return "";
  const depot = await rattacherPhotos(offreId, photos);
  if (depot.error || depot.images.length === 0) {
    return "Les photos n'ont pas pu être ajoutées.";
  }
  const rpc = zone === "dommages" ? "ajouter_dommages_offre" : "ajouter_images_offre";
  const { error } = await supabase.rpc(rpc, {
    clef: secret,
    offre_id: offreId,
    nouvelles: depot.images,
  });
  if (error) {
    console.error(rpc, error.code);
    await supprimerFichiers(depot.images.map((image) => image.chemin));
    return error.message.includes("trop") ? `${MAX_PHOTOS} photos maximum pour une offre.` : "Les photos n'ont pas pu être ajoutées.";
  }
  return "";
}

async function contexteOffre(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  secret: string,
  offreId: string,
) {
  const { data, error } = await supabase.rpc("lire_offres", { clef: secret });
  if (error || !data) return null;
  const offre = (data as Offre[]).find((item) => item.id === offreId);
  if (!offre) return null;
  const demandes = await supabase.rpc("lire_demandes", { clef: secret });
  const demande = (demandes.data as { id: string; access_token: string }[] | null)?.find((item) => item.id === offre.demande_id);
  return { offre, token: demande?.access_token ?? "" };
}

function prixMarche(value: FormDataEntryValue | null) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 7);
  if (!digits) return null;
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 ? number : null;
}

async function requireAdmin() {
  const jar = await cookies();
  if (!isAdminSession(jar.get(adminCookieName())?.value)) {
    return "L'accès a expiré. Entrez de nouveau le code.";
  }
  return "";
}

function lireInfos(formData: FormData) {
  const proprietaires = nombreFacultatif(formData.get("proprietaires"), 1, 30);
  const places = nombreFacultatif(formData.get("places"), 1, 9);
  const portes = nombreFacultatif(formData.get("portes"), 2, 7);
  if (proprietaires === false) return { error: "Le nombre de propriétaires doit être entre 1 et 30.", valeurs: infosVides() };
  if (places === false) return { error: "Le nombre de places doit être entre 1 et 9.", valeurs: infosVides() };
  if (portes === false) return { error: "Le nombre de portes doit être entre 2 et 7.", valeurs: infosVides() };
  return {
    error: "",
    valeurs: {
      puissance: texteFacultatif(formData.get("puissance"), 80),
      carrosserie: texteFacultatif(formData.get("carrosserie"), 40),
      proprietaires,
      places,
      couleur: texteFacultatif(formData.get("couleur"), 40),
      sellerie: texteFacultatif(formData.get("sellerie"), 60),
      portes,
    },
  };
}

function infosVides() {
  return {
    puissance: "",
    carrosserie: "",
    proprietaires: null as number | null,
    places: null as number | null,
    couleur: "",
    sellerie: "",
    portes: null as number | null,
  };
}

function referenceInterne(value: FormDataEntryValue | null) {
  const texte = String(value ?? "").trim().slice(0, 40);
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(texte) ? texte : "";
}

function texteFacultatif(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function nombreFacultatif(value: FormDataEntryValue | null, min: number, max: number) {
  const brut = String(value ?? "").trim();
  if (!brut) return null;
  if (!/^\d+$/.test(brut)) return false;
  const nombre = Number(brut);
  if (nombre < min || nombre > max) return false;
  return nombre;
}

function lireChamps(formData: FormData) {
  const champs: Record<string, string> = {};
  for (const cle of ["brand", "model", "origin", "year", "mileage", "fuel", "gearbox", "condition", "price", "deadline", "pickup", "comment"]) {
    champs[cle] = String(formData.get(cle) ?? "");
  }
  return champs;
}
