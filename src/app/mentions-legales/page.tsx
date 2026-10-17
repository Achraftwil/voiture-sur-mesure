import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Mentions légales | Recherche voiture",
  description: "Informations légales du service de recherche automobile.",
};

export default function MentionsLegalesPage() {
  return (
    <PageCadre titre="Mentions légales">
      <p>
        Cette page publiera la dénomination, la forme juridique, le SIREN, le SIRET, le RCS, le numéro
        de TVA, l’adresse du siège, le directeur de la publication et l’hébergeur.
      </p>
      <p>
        Ces informations ne sont pas encore confirmées. Elles figurent dès maintenant sur chaque offre
        et dans les documents de vente remis avant un engagement.
      </p>
      <p>Le service recherche des voitures d’occasion en Île-de-France pour le compte de particuliers.</p>
    </PageCadre>
  );
}
