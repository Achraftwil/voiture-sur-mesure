"use client";

import { useState } from "react";
import { useActionState } from "react";
import { repondreOffre } from "@/app/suivi/actions";

export function ReponseForm({ token, offreId, choice }: { token: string; offreId: string; choice: string }) {
  const [state, action, pending] = useActionState(repondreOffre.bind(null, token), { error: "", sent: false });
  const [choix, setChoix] = useState(choice);
  const retenue = choix === "retenue";
  const refusee = choix === "refusee";

  return (
    <form
      action={action}
      className="mt-5"
      onSubmit={(event) => {
        const submitter = event.nativeEvent.submitter;
        if (submitter instanceof HTMLButtonElement && (submitter.value === "retenue" || submitter.value === "refusee")) {
          setChoix(submitter.value);
        }
      }}
    >
      <input type="hidden" name="offreId" value={offreId} />
      {state.error ? <p className="mt-3 text-[15px] text-[#8a3a2a]">{state.error}</p> : null}
      {state.sent ? <p className="mt-3 text-[15px] text-[#1e3a34]">Votre réponse est enregistrée.</p> : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          name="choix"
          value="retenue"
          disabled={pending || retenue}
          className="h-11 bg-[#1e3a34] px-5 text-[15px] font-medium text-[#f6f3ec] disabled:cursor-not-allowed disabled:bg-[#d9d3c8] disabled:text-[#6f6a62]"
        >
          {retenue ? "Voiture retenue" : "Retenir cette voiture"}
        </button>
        <button
          type="submit"
          name="choix"
          value="refusee"
          disabled={pending || refusee}
          className="h-11 border border-[#1e3a34] px-5 text-[15px] text-[#1e3a34] disabled:cursor-not-allowed disabled:border-[#d9d3c8] disabled:bg-[#d9d3c8] disabled:text-[#6f6a62]"
        >
          {refusee ? "Voiture écartée" : "Pas celle-ci"}
        </button>
      </div>
    </form>
  );
}
