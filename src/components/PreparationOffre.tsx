"use client";

import { useState, type ReactNode } from "react";
import { relancerRecherche } from "@/app/demandes/actions";
import { OffreForm, type RepriseOffre } from "@/components/OffreForm";
import { searchLabel } from "@/lib/demandes";
import { formatPrice } from "@/lib/offres";
import type { Proposition } from "@/lib/propositions";
import type { CritereDemande } from "@/lib/criteres";

const PAYS: Record<string, string> = { FR: "France", DE: "Allemagne", BE: "Belgique", NL: "Pays-Bas" };

export function PreparationOffre({
  demandeId,
  demande,
  brevoReady,
  propositions,
  rechercheLe,
  rechercheErreur,
  children,
}: {
  demandeId: string;
  demande: CritereDemande;
  brevoReady: boolean;
  propositions: Proposition[];
  rechercheLe: string | null;
  rechercheErreur: string | null;
  children?: ReactNode;
}) {
  const [reprise, setReprise] = useState<RepriseOffre | null>(null);
  const [choix, setChoix] = useState(0);

  return (
    <OffreForm
      key={choix}
      demandeId={demandeId}
      demande={demande}
      brevoReady={brevoReady}
      reprise={reprise}
      avantFormulaire={
        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-medium text-[#1c1b17]">Propositions</p>
            <form action={relancerRecherche.bind(null, demandeId)}>
              <button type="submit" className="text-sm text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2">
                Relancer
              </button>
            </form>
          </div>
          {rechercheErreur ? <p className="mt-2 text-sm text-[#8a3a2a]">{rechercheErreur}</p> : null}
          {!rechercheErreur && propositions.length === 0 ? (
            <p className="mt-2 text-sm text-[#5f5a52]">
              {rechercheLe ? "Aucune voiture ne correspond." : "Aucune proposition pour le moment."}
            </p>
          ) : null}
          {propositions.length > 0 ? (
            <ul className="mt-3 grid gap-3 lg:grid-cols-3">
              {propositions.map((proposition) => (
                <Carte
                  key={proposition.id}
                  proposition={proposition}
                  onChoisir={(valeur) => {
                    setReprise(valeur);
                    setChoix((courant) => courant + 1);
                  }}
                />
              ))}
            </ul>
          ) : null}
        </section>
      }
    >
      {children}
    </OffreForm>
  );
}

function Carte({ proposition, onChoisir }: { proposition: Proposition; onChoisir: (reprise: RepriseOffre) => void }) {
  const [exclus, setExclus] = useState<Set<string>>(new Set());
  const [photosEcartees, setPhotosEcartees] = useState<Set<number>>(new Set());
  const lignes = infos(proposition).filter((ligne) => ligne.valeur);

  function basculer(cle: string) {
    setExclus((courant) => {
      const suivant = new Set(courant);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  }

  return (
    <li className="border border-[#e3dcd0] bg-white px-3 py-3">
      <p className="text-sm text-[#5f5a52]">N° interne · {proposition.reference_interne}</p>
      <p className="mt-1 text-[15px] text-[#1c1b17]">
        {[proposition.brand, proposition.model].filter(Boolean).join(" ") || "Voiture"}
      </p>
      <p className="mt-1 text-[15px] font-medium text-[#1c1b17]">{formatPrice(proposition.prix)}</p>
      {proposition.photos.length > 0 ? (
        <>
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {proposition.photos.map((photo, index) => {
            const ecartee = photosEcartees.has(index);
            return (
              <li key={photo}>
                <button
                  type="button"
                  aria-pressed={!ecartee}
                  onClick={() =>
                    setPhotosEcartees((courant) => {
                      const suivant = new Set(courant);
                      if (suivant.has(index)) suivant.delete(index);
                      else suivant.add(index);
                      return suivant;
                    })
                  }
                  aria-label={ecartee ? "Remettre la photo" : "Retirer la photo"}
                className={`block h-16 w-20 border ${ecartee ? "border-[#d7d0c4] opacity-35" : "border-[#1e3a34]"}`}
                >
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-xs text-[#5f5a52]">Déposez les photos gardées dans Photos.</p>
        </>
      ) : null}
      <ul className="mt-3 space-y-1">
        {lignes.map((ligne) => (
          <li key={ligne.cle}>
            <label className="flex items-start gap-2 text-sm text-[#3f3b34]">
              <input type="checkbox" checked={!exclus.has(ligne.cle)} onChange={() => basculer(ligne.cle)} />
              <span>
                {ligne.libelle} · {ligne.valeur}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChoisir(repriseDepuis(proposition, exclus))}
        className="mt-3 h-10 w-full bg-[#1e3a34] px-3 text-sm text-[#f6f3ec]"
      >
        Choisir cette proposition
      </button>
    </li>
  );
}

function infos(proposition: Proposition) {
  return [
    { cle: "year", libelle: "Année", valeur: proposition.year ? String(proposition.year) : "" },
    { cle: "mileage", libelle: "Kilométrage", valeur: proposition.mileage ? `${proposition.mileage.toLocaleString("fr-FR")} km` : "" },
    { cle: "fuel", libelle: "Carburant", valeur: proposition.fuel ? searchLabel(proposition.fuel) : "" },
    { cle: "gearbox", libelle: "Boîte", valeur: proposition.gearbox ? searchLabel(proposition.gearbox) : "" },
    { cle: "pays", libelle: "Pays", valeur: PAYS[proposition.pays] ?? "" },
    { cle: "puissance", libelle: "Puissance", valeur: proposition.puissance },
    { cle: "carrosserie", libelle: "Carrosserie", valeur: proposition.carrosserie },
    { cle: "proprietaires", libelle: "Nombre total de propriétaires", valeur: proposition.proprietaires ? String(proposition.proprietaires) : "" },
    { cle: "places", libelle: "Nombre de places", valeur: proposition.places ? String(proposition.places) : "" },
    { cle: "couleur", libelle: "Couleur", valeur: proposition.couleur },
    { cle: "sellerie", libelle: "Sellerie", valeur: proposition.sellerie },
    { cle: "portes", libelle: "Nombre de portes", valeur: proposition.portes ? String(proposition.portes) : "" },
  ];
}

const CARBURANTS = new Set(["essence", "diesel", "hybride", "hybride-rechargeable", "electrique", "gpl"]);
const BOITES = new Set(["manuelle", "automatique"]);

function anneeSaisie(year: number | null) {
  if (!year) return "";
  const maintenant = new Date().getFullYear();
  if (year < 1990 || year > maintenant) return "";
  return String(year);
}

function repriseDepuis(proposition: Proposition, exclus: Set<string>): RepriseOffre {
  const garder = (cle: string, valeur: string) => (exclus.has(cle) ? "" : valeur);
  return {
    reference: proposition.reference_interne,
    brand: proposition.brand,
    model: proposition.model,
    vehicle: [proposition.brand, proposition.model].filter(Boolean).join(" "),
    origin: garder("pays", proposition.pays === "FR" ? "francaise" : proposition.pays ? "autre" : ""),
    year: garder("year", anneeSaisie(proposition.year)),
    mileage: garder("mileage", proposition.mileage ? String(proposition.mileage) : ""),
    fuel: garder("fuel", CARBURANTS.has(proposition.fuel) ? proposition.fuel : ""),
    gearbox: garder("gearbox", BOITES.has(proposition.gearbox) ? proposition.gearbox : ""),
    puissance: garder("puissance", proposition.puissance),
    carrosserie: garder("carrosserie", proposition.carrosserie),
    proprietaires: garder("proprietaires", proposition.proprietaires ? String(proposition.proprietaires) : ""),
    places: garder("places", proposition.places ? String(proposition.places) : ""),
    couleur: garder("couleur", proposition.couleur),
    sellerie: garder("sellerie", proposition.sellerie),
    portes: garder("portes", proposition.portes ? String(proposition.portes) : ""),
  };
}
