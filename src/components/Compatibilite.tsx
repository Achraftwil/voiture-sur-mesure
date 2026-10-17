import { lireCriteres, pourcentage, textePourcentage } from "@/lib/criteres";

export function Compatibilite({ criteres }: { criteres: unknown }) {
  const lignes = lireCriteres(criteres);
  const score = pourcentage(lignes);
  if (!score) return null;

  return (
    <div className="mt-3">
      <p className="font-serif text-2xl text-[#1c1b17]">{textePourcentage(score)}</p>
      <ul className="mt-2 space-y-1">
        {lignes.map((critere) => (
          <li key={critere.cle} className="text-sm text-[#3f3b34]">
            <span className={critere.correspond ? "text-[#1e3a34]" : "text-[#8a4b2f]"}>
              {critere.correspond ? "Correspond" : "Ne correspond pas"}
            </span>
            {" · "}
            {critere.libelle}
            {critere.valeur ? ` : ${critere.valeur}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
