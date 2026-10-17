"use client";

import { useActionState } from "react";
import { repondreQuestion } from "@/app/demandes/actions";

export function ReponseQuestion({ offreId }: { offreId: string }) {
  const [state, action, pending] = useActionState(repondreQuestion, { error: "", sent: false });

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="offreId" value={offreId} />
      <label className="block text-sm text-[#5f5a52]" htmlFor={`reponse-${offreId}`}>
        Répondre au client
        <textarea
          id={`reponse-${offreId}`}
          name="message"
          rows={3}
          maxLength={2000}
          className="mt-1.5 w-full border border-[#d7d0c4] bg-white px-3 py-2 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
        />
      </label>
      {state.error ? <p className="mt-2 text-sm text-[#8a3a2a]">{state.error}</p> : null}
      {state.sent && !state.error ? <p className="mt-2 text-sm text-[#1e3a34]">Réponse envoyée.</p> : null}
      <button type="submit" disabled={pending} className="mt-2 h-10 bg-[#1e3a34] px-4 text-sm text-[#f6f3ec] disabled:opacity-70">
        {pending ? "Envoi…" : "Envoyer la réponse"}
      </button>
    </form>
  );
}
