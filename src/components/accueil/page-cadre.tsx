import type { ReactNode } from "react";
import { Entete } from "@/components/accueil/entete";
import { Pied } from "@/components/accueil/pied";

export function PageCadre({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Entete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight sm:text-4xl">{titre}</h1>
        <div className="mt-6 space-y-4 text-[17px] leading-7 text-[#5c5c5c]">{children}</div>
      </main>
      <Pied />
    </div>
  );
}
