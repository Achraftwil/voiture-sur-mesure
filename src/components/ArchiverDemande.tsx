"use client";

import { useActionState } from "react";
import { archiverDemande } from "@/app/demandes/actions";

const initial = { error: "" };

export function ArchiverDemande({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(archiverDemande, initial);

  return (
    <form
      action={action}
      className="mt-4"
      onSubmit={(event) => {
        const confirme = window.confirm(
          `Archiver la demande de ${name} ?\n\nLes photos des offres seront supprimées. Le client, les offres envoyées et les statuts sont conservés.`,
        );
        if (!confirme) event.preventDefault();
      }}
    >
      <input type="hidden" name="demandeId" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-[#5f5a52] underline decoration-[#cfc6b8] underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Archivage…" : "Archiver"}
      </button>
      {state.error ? <p className="mt-2 text-[15px] text-[#8a3a2a]">{state.error}</p> : null}
    </form>
  );
}
