import type { Metadata } from "next";
import { Entete } from "@/components/accueil/entete";
import { Pied } from "@/components/accueil/pied";
import { VehicleSearchForm } from "@/components/VehicleSearchForm";
import { serviceAreaLabel } from "@/lib/zones";

export const metadata: Metadata = {
  title: "Trouver ma voiture | Recherche voiture",
  description:
    "Décrivez la voiture d'occasion que vous cherchez en Île-de-France : budget, délai et critères. La demande est gratuite et sans engagement.",
};

export default function DemandePage() {
  return (
    <div className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Entete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold text-[#ff5000]">
          Demande gratuite · sans engagement
        </p>
        <h1 className="mt-3 text-[2.4rem] leading-[1.05] font-bold tracking-tight sm:text-5xl">
          Décrivez la voiture que vous recherchez.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-[#5c5c5c]">
          Budget, délai et critères. Nous cherchons en {serviceAreaLabel}, puis nous vous envoyons les
          offres. Cette demande ne vous engage pas à acheter.
        </p>
        <div className="mt-8">
          <VehicleSearchForm />
        </div>
        <p className="mt-6 text-sm text-[#5c5c5c]">
          Marques et modèles :{" "}
          <a href="https://vehiclesdb.com" className="underline decoration-[#d9d9d9] underline-offset-2">
            Vehicle data by VehiclesDB
          </a>
        </p>
      </main>
      <Pied />
    </div>
  );
}
