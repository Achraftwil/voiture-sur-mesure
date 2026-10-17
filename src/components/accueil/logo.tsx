import Image from "next/image";

type Variante = "sombre" | "clair";

/**
 * Logo « voiture-sur-mesure.fr » : symbole voiture + texte rendu en HTML.
 * La taille suit la taille de police du parent (`text-[18px]`, etc.).
 */
export function Logo({ variante = "sombre", className = "" }: { variante?: Variante; className?: string }) {
  const couleurTexte = variante === "sombre" ? "text-white" : "text-[#1a1a1a]";
  return (
    <span
      className={`inline-flex items-center gap-[0.45em] font-[Arial,Helvetica,sans-serif] leading-none font-bold tracking-[-0.02em] ${couleurTexte} ${className}`}
    >
      <Image
        src="/logo/symbole.png"
        alt=""
        width={220}
        height={149}
        aria-hidden="true"
        className="h-[1.45em] w-auto shrink-0"
      />
      <span className="whitespace-nowrap">
        voiture-sur-mesure<span className="text-[#ff5000]">.fr</span>
      </span>
    </span>
  );
}
