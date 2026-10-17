"use client";

import { retirerRecherche } from "@/app/mes-recherches/actions";

export function RetraitRecherche({ id, avecOffres }: { id: string; avecOffres: boolean }) {
  return (
    <form
      action={retirerRecherche}
      onSubmit={(event) => {
        const message = avecOffres
          ? "Annuler cette recherche ? Les offres déjà envoyées restent enregistrées de notre côté."
          : "Supprimer cette recherche ? Cette action est définitive.";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="demandeId" value={id} />
      <button type="submit" className="text-[15px] text-[#8a3a2a] underline underline-offset-2">
        {avecOffres ? "Annuler la recherche" : "Supprimer la recherche"}
      </button>
    </form>
  );
}
