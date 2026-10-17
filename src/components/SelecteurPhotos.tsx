"use client";

import { useEffect, useRef, useState } from "react";
import { preparerDepotPhotos, retirerDepotPhoto } from "@/app/demandes/actions";
import { ANGLES, MAX_OCTETS, MAX_PHOTOS, extensionPhoto } from "@/lib/photos";

type SelecteurPhotosProps = {
  inputId: string;
  /** Identifiant de l'offre si elle existe déjà ; sinon un dossier provisoire est créé. */
  dossier?: string;
  fichierNom?: string;
  choix?: readonly string[];
  titre?: string;
  aide?: string;
  etiquette?: string;
};

type PhotoLocale = {
  id: string;
  chemin: string;
  apercu: string;
  legende: string;
  autre: boolean;
};

export function SelecteurPhotos({
  inputId,
  dossier,
  fichierNom = "photos",
  choix = ANGLES,
  titre = "Photos",
  aide = "Ajoutez les photos de la voiture et indiquez le côté. Il s'affiche sur l'image pour le client.",
  etiquette = "Côté",
}: SelecteurPhotosProps) {
  const [photos, setPhotos] = useState<PhotoLocale[]>([]);
  const [erreur, setErreur] = useState("");
  const [preparation, setPreparation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  const dossierRef = useRef(dossier ?? "");

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.apercu);
    };
  }, []);

  async function ajouter(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    if (inputRef.current) inputRef.current.value = "";
    if (photos.length + incoming.length > MAX_PHOTOS) {
      setErreur(`${MAX_PHOTOS} photos maximum pour une offre.`);
      return;
    }
    setPreparation(true);
    setErreur("");

    const prets: File[] = [];
    for (const file of incoming) {
      if (!extensionPhoto(file.type)) {
        setErreur("Les photos doivent être en JPEG, PNG ou WebP.");
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErreur("Une photo dépasse 20 Mo.");
        continue;
      }
      const prepared = await preparer(file);
      if (prepared.size > MAX_OCTETS) {
        setErreur("Chaque photo doit faire moins de 5 Mo.");
        continue;
      }
      prets.push(prepared);
    }

    if (prets.length > 0) {
      if (!dossierRef.current) dossierRef.current = crypto.randomUUID();
      const depot = await preparerDepotPhotos(
        dossierRef.current,
        prets.map((file) => file.type),
      );
      if (depot.error || depot.cibles.length !== prets.length) {
        setErreur(depot.error || "Le dépôt des photos n'a pas pu être préparé.");
        setPreparation(false);
        return;
      }

      const next = [...photos];
      for (let index = 0; index < prets.length; index += 1) {
        const file = prets[index];
        const cible = depot.cibles[index];
        const ok = await televerser(cible.url, file);
        if (!ok) {
          setErreur("Une photo n'a pas pu être envoyée. Vérifiez la connexion et réessayez.");
          continue;
        }
        const utilisees = new Set(next.map((photo) => photo.legende));
        const legende = choix.find((angle) => !utilisees.has(angle)) ?? "";
        next.push({
          id: crypto.randomUUID(),
          chemin: cible.chemin,
          apercu: URL.createObjectURL(file),
          legende,
          autre: false,
        });
      }
      setPhotos(next);
    }
    setPreparation(false);
  }

  function retirer(id: string) {
    const photo = photos.find((item) => item.id === id);
    if (!photo) return;
    URL.revokeObjectURL(photo.apercu);
    setPhotos((current) => current.filter((item) => item.id !== id));
    void retirerDepotPhoto(photo.chemin);
  }

  function changerLegende(id: string, valeur: string) {
    setPhotos((current) =>
      current.map((photo) => {
        if (photo.id !== id) return photo;
        if (valeur === "__autre__") return { ...photo, autre: true, legende: "" };
        return { ...photo, autre: false, legende: valeur };
      }),
    );
  }

  return (
    <div className="mt-3">
      <p className="text-sm text-[#5f5a52]">{titre}</p>
      <p className="mt-1 text-sm leading-5 text-[#5f5a52]">{aide}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          void ajouter(event.target.files);
        }}
      />
      <input
        type="hidden"
        name={fichierNom}
        value={JSON.stringify(photos.map((photo) => ({ chemin: photo.chemin, legende: photo.legende })))}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={preparation || photos.length >= MAX_PHOTOS}
        className="mt-3 h-11 border border-[#d7d0c4] bg-white px-4 text-[15px] text-[#1c1b17] disabled:opacity-60"
      >
        {preparation ? "Envoi des photos…" : "Choisir des photos"}
      </button>
      {erreur ? <p className="mt-2 text-[15px] text-[#8a3a2a]">{erreur}</p> : null}
      {photos.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="border border-[#e3dcd0] bg-white p-2">
              <img src={photo.apercu} alt="" className="aspect-[16/10] w-full object-cover" />
              <label className="mt-2 block text-sm text-[#5f5a52]">
                {etiquette}
                <select
                  value={photo.autre ? "__autre__" : photo.legende}
                  onChange={(event) => changerLegende(photo.id, event.target.value)}
                  className="mt-1 h-10 w-full border border-[#d7d0c4] bg-white px-2 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
                >
                  <option value="">Sans légende</option>
                  {choix.map((angle) => (
                    <option key={angle} value={angle}>
                      {angle}
                    </option>
                  ))}
                  <option value="__autre__">Autre</option>
                </select>
              </label>
              {photo.autre ? (
                <input
                  value={photo.legende}
                  maxLength={80}
                  placeholder="Ex. seuil de porte"
                  onChange={(event) =>
                    setPhotos((current) =>
                      current.map((item) => (item.id === photo.id ? { ...item, legende: event.target.value } : item)),
                    )
                  }
                  className="mt-2 h-10 w-full border border-[#d7d0c4] px-2 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
                />
              ) : null}
              <button type="button" onClick={() => retirer(photo.id)} className="mt-2 text-sm text-[#5f5a52] underline decoration-[#cfc6b8] underline-offset-2">
                Retirer
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Envoie le fichier directement au stockage, sans transiter par le serveur du site. */
async function televerser(url: string, file: File) {
  try {
    const corps = new FormData();
    corps.append("cacheControl", "3600");
    corps.append("", file);
    const response = await fetch(url, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body: corps,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function preparer(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
