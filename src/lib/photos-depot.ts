import { BUCKET_PHOTOS, MAX_PHOTOS, extensionPhoto, type ImageEnregistree } from "@/lib/photos";
import { getSupabase } from "@/lib/supabase";

const CHEMIN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/;
const DOSSIER = /^[0-9a-f-]{36}$/;

export function cheminValide(chemin: string) {
  return CHEMIN.test(chemin);
}

/**
 * Lit la liste des photos déjà déposées dans le stockage par le navigateur :
 * un JSON `[{ chemin, legende }]` dans le champ `nom`.
 */
export function photosDeposees(formData: FormData, nom = "photos") {
  const brut = formData.get(nom);
  if (typeof brut !== "string" || !brut) return { photos: [] as ImageEnregistree[], error: "" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(brut);
  } catch {
    return { photos: [], error: "Les photos n'ont pas pu être lues." };
  }
  if (!Array.isArray(parsed)) return { photos: [], error: "Les photos n'ont pas pu être lues." };
  if (parsed.length > MAX_PHOTOS) return { photos: [], error: `${MAX_PHOTOS} photos maximum pour une offre.` };

  const photos: ImageEnregistree[] = [];
  for (const item of parsed) {
    const chemin = typeof item?.chemin === "string" ? item.chemin : "";
    const legende = typeof item?.legende === "string" ? item.legende.trim().slice(0, 80) : "";
    if (!cheminValide(chemin)) return { photos: [], error: "Les photos n'ont pas pu être lues." };
    photos.push({ chemin, legende });
  }
  return { photos, error: "" };
}

/**
 * Prépare des adresses de dépôt direct (navigateur → stockage), sans passer par le serveur.
 */
export async function signerDepots(dossier: string, types: string[]) {
  const supabase = getSupabase();
  if (!supabase) return { cibles: [] as { chemin: string; url: string }[], error: "Le stockage est indisponible." };
  if (!DOSSIER.test(dossier)) return { cibles: [], error: "Dossier invalide." };
  if (types.length === 0 || types.length > MAX_PHOTOS) return { cibles: [], error: `${MAX_PHOTOS} photos maximum pour une offre.` };

  const cibles: { chemin: string; url: string }[] = [];
  for (const type of types) {
    const extension = extensionPhoto(type);
    if (!extension) return { cibles: [], error: "Les photos doivent être en JPEG, PNG ou WebP." };
    const chemin = `${dossier}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET_PHOTOS).createSignedUploadUrl(chemin);
    if (error || !data) {
      console.error("signature depot", error?.message);
      return { cibles: [], error: "Le dépôt des photos n'a pas pu être préparé." };
    }
    cibles.push({ chemin, url: data.signedUrl });
  }
  return { cibles, error: "" };
}

/**
 * Déplace les photos déposées dans un dossier provisoire vers le dossier de l'offre.
 * Les photos déjà dans le bon dossier sont laissées en place.
 */
export async function rattacherPhotos(offreId: string, photos: ImageEnregistree[]) {
  const supabase = getSupabase();
  if (!supabase) return { images: [] as ImageEnregistree[], error: "Les photos n'ont pas pu être enregistrées." };

  const images: ImageEnregistree[] = [];
  const deplacees: string[] = [];
  for (const photo of photos) {
    const [dossier, fichier] = photo.chemin.split("/");
    if (dossier === offreId) {
      images.push(photo);
      continue;
    }
    const cible = `${offreId}/${fichier}`;
    const { error } = await supabase.storage.from(BUCKET_PHOTOS).move(photo.chemin, cible);
    if (error) {
      console.error("deplacement photo", error.message);
      await supprimerFichiers(deplacees);
      return { images: [], error: "Les photos n'ont pas pu être enregistrées." };
    }
    deplacees.push(cible);
    images.push({ chemin: cible, legende: photo.legende });
  }
  return { images, error: "" };
}

export async function supprimerFichiers(chemins: string[]) {
  const supabase = getSupabase();
  if (!supabase || chemins.length === 0) return true;
  const { error } = await supabase.storage.from(BUCKET_PHOTOS).remove(chemins);
  if (error) {
    console.error("suppression photo", error.message);
    return false;
  }
  return true;
}
