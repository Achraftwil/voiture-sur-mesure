"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icone } from "@/components/accueil/icones";
import { Logo } from "@/components/accueil/logo";

const liens = [
  { href: "/#parcours", label: "Comment ça marche" },
  { href: "/#pourquoi", label: "Pourquoi nous" },
  { href: "/#engagements", label: "Nos engagements" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#a-propos", label: "À propos" },
];

export function Entete() {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    function fermer(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] text-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="voiture-sur-mesure.fr, accueil">
          <Logo className="text-[17px] sm:text-[19px]" />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {liens.map((lien) => (
            <a key={lien.href} href={lien.href} className="text-sm text-white/80 hover:text-white">
              {lien.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/mes-recherches" className="hidden text-sm text-white/80 hover:text-white md:inline">
            Mes recherches
          </Link>
          <Link
            href="/demande"
            className="hidden h-10 items-center rounded-xl bg-[#ff5000] px-4 text-sm font-semibold text-white hover:bg-[#e64700] md:inline-flex"
          >
            Trouver ma voiture
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            onClick={() => setOuvert((valeur) => !valeur)}
          >
            <span className="sr-only">{ouvert ? "Fermer le menu" : "Ouvrir le menu"}</span>
            <Icone nom={ouvert ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {ouvert ? (
        <nav id="menu-mobile" className="border-t border-white/10 px-5 py-4 lg:hidden" aria-label="Navigation mobile">
          <ul className="space-y-1">
            {liens.map((lien) => (
              <li key={lien.href}>
                <a href={lien.href} className="block py-2.5 text-[16px]" onClick={() => setOuvert(false)}>
                  {lien.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/mes-recherches" className="mt-3 block py-2.5 text-[16px]" onClick={() => setOuvert(false)}>
            Mes recherches
          </Link>
          <Link
            href="/demande"
            className="mt-3 flex h-12 items-center justify-center rounded-xl bg-[#ff5000] text-[15px] font-semibold"
            onClick={() => setOuvert(false)}
          >
            Trouver ma voiture
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
