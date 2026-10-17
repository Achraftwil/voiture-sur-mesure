import { lireCriteres, pourcentage } from "@/lib/criteres";
import { formatPrice } from "@/lib/offres";
import type { ReactNode } from "react";

type OffreVisible = {
  vehicle: string;
  year: number | null;
  mileage: number | null;
  price: number;
  place: string;
  comment: string;
};

export function CorrespondanceClient({
  criteres,
  offre,
  children,
}: {
  criteres: unknown;
  offre: OffreVisible;
  children: ReactNode;
}) {
  const lignes = lireCriteres(criteres);
  const score = pourcentage(lignes);
  if (!score) {
    return (
      <div>
        <div className="px-5 pt-5">{children}</div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="h-2.5 bg-[#e6dfd4]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score.pourcent}
        aria-label="Correspondance des critères"
      >
        <div className="h-full bg-[#1f8a4c]" style={{ width: `${score.pourcent}%` }} />
      </div>
      <p className="px-5 pt-4 text-[15px] font-medium text-[#1c1b17]">{score.pourcent} % de correspondances des critères</p>
      <div className="px-5">
        <div className="mt-4">{children}</div>
        <div className="mt-4 border-y border-[#e3dcd0]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.5rem] gap-x-4 py-2 text-sm text-[#5f5a52]">
            <p>Vos critères</p>
            <p>Notre offre</p>
          </div>
          <ul className="divide-y divide-[#e3dcd0] border-t border-[#e3dcd0]">
            {lignes.filter((critere) => critere.cle !== "comment").map((critere) => (
              <li key={critere.cle} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-x-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#5f5a52]">{critere.libelle}</p>
                  <p className="text-[15px] text-[#1c1b17]">{critere.valeur}</p>
                </div>
                <p className="min-w-0 text-[15px] text-[#1c1b17]">{texteOffre(critere, offre)}</p>
                {critere.compte === false ? <span /> : critere.correspond ? <CaseCochee /> : <Croix />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function texteOffre(critere: { cle: string; proposition?: string }, offre: OffreVisible) {
  const proposition = critere.proposition?.trim() ?? "";
  if (proposition) return proposition;
  return valeurOffre(critere.cle, offre);
}

function valeurOffre(cle: string, offre: OffreVisible) {
  if (cle === "brand" || cle === "model") return offre.vehicle;
  if (cle === "year" && offre.year) return String(offre.year);
  if (cle === "mileage" && offre.mileage) return `${offre.mileage.toLocaleString("fr-FR")} km`;
  if (cle === "budget") return formatPrice(offre.price);
  if (cle === "pickup") return offre.place.trim();
  if (cle === "comment") return offre.comment.trim();
  return "";
}

function CaseCochee() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center bg-[#1f8a4c]" aria-label="Correspond">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Croix() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-label="Ne correspond pas">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M4 4 12 12M12 4 4 12" stroke="#d12b2b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
