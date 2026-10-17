export const ANGLES = [
  "Face avant",
  "Côté avant droit",
  "Côté droit",
  "Côté arrière droit",
  "Face arrière",
  "Côté arrière gauche",
  "Côté gauche",
  "Côté avant gauche",
  "Intérieur",
  "Tableau de bord",
  "Compteur",
  "Coffre",
  "Moteur",
  "Jante",
] as const;

export const ZONES_ENDOMMAGEES = [
  "Pare-choc avant",
  "Capot",
  "Aile avant gauche",
  "Aile avant droite",
  "Portière avant gauche",
  "Portière avant droite",
  "Bas de caisse gauche",
  "Bas de caisse droit",
  "Portière arrière gauche",
  "Portière arrière droite",
  "Aile arrière gauche",
  "Aile arrière droite",
  "Pare-choc arrière",
  "Coffre",
  "Toit",
  "Rétroviseur",
  "Jante",
] as const;

export const MAX_PHOTOS = 20;
export const MAX_OCTETS = 5 * 1024 * 1024;
export const BUCKET_PHOTOS = "offre-photos";

const MIMES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ImageEnregistree = {
  chemin: string;
  legende: string;
};

export type PhotoVisible = ImageEnregistree & {
  url: string;
};

export function extensionPhoto(type: string) {
  return MIMES.get(type) ?? "";
}

export function lirePhotos(value: unknown): ImageEnregistree[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const chemin = "chemin" in item && typeof item.chemin === "string" ? item.chemin : "";
    const legende = "legende" in item && typeof item.legende === "string" ? item.legende.trim() : "";
    if (!chemin) return [];
    return [{ chemin, legende: legende.slice(0, 80) }];
  });
}

export function urlPhoto(chemin: string) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base || !chemin) return "";
  const segments = chemin.split("/").map((segment) => encodeURIComponent(segment));
  return `${base}/storage/v1/object/public/${BUCKET_PHOTOS}/${segments.join("/")}`;
}

export function photosVisibles(images: unknown): PhotoVisible[] {
  return lirePhotos(images).flatMap((photo) => {
    const url = urlPhoto(photo.chemin);
    if (!url) return [];
    return [{ ...photo, url }];
  });
}
