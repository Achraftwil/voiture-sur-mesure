import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Réclamations | Recherche voiture",
  description: "Comment adresser une réclamation au sujet d'une recherche ou d'une vente.",
};

export default function ReclamationPage() {
  return (
    <PageCadre titre="Réclamations">
      <p>
        Une réclamation concernant une recherche, une offre ou une vente s’adresse d’abord au
        professionnel indiqué sur l’offre et les documents de vente, par les coordonnées qui y figurent.
      </p>
      <p>
        Le message doit décrire la demande, le véhicule concerné et ce qui est attendu. Une réponse est
        apportée par le même canal.
      </p>
      <p>
        Si le différend n’est pas résolu, le recours à la médiation de la consommation est indiqué sur
        la page dédiée et dans le contrat.
      </p>
    </PageCadre>
  );
}
