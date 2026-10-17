import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Politique cookies | Recherche voiture",
  description: "Cookies utilisés par le site de recherche automobile.",
};

export default function CookiesPage() {
  return (
    <PageCadre titre="Politique cookies">
      <p>
        Le site public ne dépose pas de cookie de mesure d’audience ni de traceur publicitaire. Aucun
        bandeau de consentement n’est affiché tant que ce type de traceur n’est pas utilisé.
      </p>
      <p>
        Un cookie technique peut être déposé uniquement pour l’accès à l’espace des demandes reçues,
        réservé au professionnel.
      </p>
    </PageCadre>
  );
}
