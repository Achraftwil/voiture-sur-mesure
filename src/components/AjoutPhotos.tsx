"use client";

import { useActionState, useEffect, useState } from "react";
import { ajouterPhotosOffre } from "@/app/demandes/actions";
import { SelecteurPhotos } from "@/components/SelecteurPhotos";
import { ZONES_ENDOMMAGEES } from "@/lib/photos";

const initial = { error: "", added: false, at: 0 };

const REGLAGES = {
  images: {
    bouton: "Ajouter des photos",
    note: "Elles apparaissent sur la page du client, sans nouvel e-mail.",
    selecteur: {},
  },
  dommages: {
    bouton: "Ajouter des zones endommagées",
    note: "Elles apparaissent sous les photos de la voiture, sans nouvel e-mail.",
    selecteur: {
      fichierNom: "dommages",
      choix: ZONES_ENDOMMAGEES,
      titre: "Zones endommagées",
      aide: "Ajoutez les photos des parties abîmées. L'endroit s'affiche sur l'image.",
      etiquette: "Endroit",
    },
  },
} as const;

export function AjoutPhotos({ offreId, zone = "images" }: { offreId: string; zone?: "images" | "dommages" }) {
  const [ouvert, setOuvert] = useState(false);
  const [state, action, pending] = useActionState(ajouterPhotosOffre, initial);
  const reglages = REGLAGES[zone];

  useEffect(() => {
    if (state.added) setOuvert(false);
  }, [state.added, state.at]);

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="text-sm text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2">
        {reglages.bouton}
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 border border-[#e3dcd0] bg-[#fffcf7] px-3 py-3">
      <input type="hidden" name="offreId" value={offreId} />
      <input type="hidden" name="zone" value={zone} />
      <SelecteurPhotos inputId={`ajout-${zone}-${offreId}`} dossier={offreId} {...reglages.selecteur} />
      <p className="mt-2 text-sm text-[#5f5a52]">{reglages.note}</p>
      {state.error ? <p className="mt-2 text-[15px] text-[#8a3a2a]">{state.error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-4">
        <button type="submit" disabled={pending} className="h-10 bg-[#1e3a34] px-4 text-sm font-medium text-[#f6f3ec] disabled:opacity-70">
          {pending ? "Enregistrement…" : "Enregistrer les photos"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="text-sm text-[#5f5a52] underline decoration-[#cfc6b8] underline-offset-2">
          Annuler
        </button>
      </div>
    </form>
  );
}
