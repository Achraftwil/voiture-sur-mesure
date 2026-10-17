"use client";

import { useActionState } from "react";
import { poserQuestion } from "@/app/suivi/actions";

export function QuestionForm({ token, offreId }: { token: string; offreId: string }) {
  const [state, action, pending] = useActionState(poserQuestion.bind(null, token), { error: "", sent: false });

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="offreId" value={offreId} />
      <label className="block text-sm text-[#5f5a52]" htmlFor={`question-${offreId}`}>
        Votre message
        <textarea
          id={`question-${offreId}`}
          name="message"
          rows={3}
          maxLength={2000}
          required
          className="mt-1.5 w-full border border-[#d7d0c4] bg-white px-3 py-2 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
        />
      </label>
      {state.error ? <p className="mt-3 text-[15px] text-[#8a3a2a]">{state.error}</p> : null}
      {state.sent && !state.error ? <p className="mt-3 text-[15px] text-[#1e3a34]">Votre message est envoyé.</p> : null}
      <button type="submit" disabled={pending} className="mt-3 h-11 border border-[#1e3a34] px-5 text-[15px] text-[#1e3a34] disabled:opacity-70">
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
