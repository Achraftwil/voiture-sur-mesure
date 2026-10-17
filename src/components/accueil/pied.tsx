import Link from "next/link";

const colonnes = [
  {
    titre: "Entreprise",
    liens: [
      { href: "/#a-propos", label: "À propos" },
      { href: "/#engagements", label: "Nos engagements" },
      { href: "/#faq", label: "Questions fréquentes" },
    ],
  },
  {
    titre: "Service",
    liens: [
      { href: "/demande", label: "Faire une demande" },
      { href: "/mes-recherches", label: "Mes recherches" },
      { href: "/#parcours", label: "Comment ça marche ?" },
      { href: "/#livraison", label: "Livraison" },
      { href: "/garanties", label: "Garanties" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    titre: "Légal",
    liens: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cgv", label: "Conditions générales de vente" },
      { href: "/politique-confidentialite", label: "Politique de confidentialité" },
      { href: "/cookies", label: "Politique cookies" },
      { href: "/reclamation", label: "Réclamations" },
      { href: "/mediation", label: "Médiation de la consommation" },
    ],
  },
];

export function Pied() {
  return (
    <footer className="bg-[#1c1915] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        {colonnes.map((colonne) => (
          <div key={colonne.titre}>
            <p className="text-sm font-medium text-white">{colonne.titre}</p>
            <ul className="mt-4 space-y-2.5">
              {colonne.liens.map((lien) => (
                <li key={lien.href + lien.label}>
                  <Link href={lien.href} className="text-sm text-[#d6d0c8] hover:text-white">
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-medium text-white">Contact</p>
          <p className="mt-4 text-sm leading-6 text-[#d6d0c8]">
            Le téléphone, l’e-mail et l’adresse du professionnel figurent sur chaque offre et dans les
            documents de vente.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-5 text-sm text-[#a39c93] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Recherche voiture. Tous droits réservés.</p>
          <Link href="/demandes" className="hover:text-white">
            Demandes reçues
          </Link>
        </div>
      </div>
    </footer>
  );
}
