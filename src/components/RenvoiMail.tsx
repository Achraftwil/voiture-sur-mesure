"use client";

import { useActionState } from "react";
import { renvoyerOffre, type RenvoiState } from "@/app/demandes/actions";

const initial: RenvoiState = { error: "", sent: false, at: 0 };

export function RenvoiMail({ offreId }: { offreId: string }) {
  const [state, action, pending] = useActionState(renvoyerOffre, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="offreId" value={offreId} />
      <button
        type="submit"
        disabled={pending}
        className="touch-manipulation text-sm text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : "Renvoyer l'e-mail"}
      </button>
      {state.error ? <span className="text-sm text-[#8a3a2a]">{state.error}</span> : null}
      {state.sent && !state.error ? <span className="text-sm text-[#1e3a34]">E-mail envoyé.</span> : null}
    </form>
  );
}
