"use client";

import { useActionState } from "react";
import { demanderLien } from "@/app/mes-recherches/actions";

export function DemanderLien({ invalide }: { invalide: boolean }) {
  const [state, action, pending] = useActionState(demanderLien, { message: "" });

  return (
    <form action={action} className="mt-8 rounded-2xl border border-[#ececec] bg-[#f6f6f6] px-5 py-6 sm:px-8">
      <label className="block" htmlFor="email">
        <span className="mb-1.5 block text-[15px] font-medium">Adresse e-mail de la recherche</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-xl border border-[#d9d9d9] bg-white px-3 text-[15px] outline-none focus:border-[#ff5000] focus:ring-2 focus:ring-[#ff5000]/20"
        />
      </label>
      {invalide && !state.message ? (
        <p className="mt-3 text-[15px] text-[#8a3a2a]">Ce lien a déjà été utilisé ou il n&apos;est plus valable. Demandez-en un nouveau.</p>
      ) : null}
      {state.message ? <p className="mt-3 text-[15px] leading-6 text-[#1a1a1a]">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-12 rounded-xl bg-[#ff5000] px-6 text-[15px] font-semibold text-white hover:bg-[#e64700] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}
