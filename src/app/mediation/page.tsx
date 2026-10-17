import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Médiation de la consommation | Recherche voiture",
  description: "Recours à un médiateur de la consommation en cas de litige non résolu.",
};

export default function MediationPage() {
  return (
    <PageCadre titre="Médiation de la consommation">
      <p>
        En cas de litige de consommation non résolu directement avec le professionnel, le client peut
        saisir gratuitement le médiateur de la consommation compétent.
      </p>
      <p>
        Le nom, le site et l’adresse de ce médiateur seront publiés ici et rappelés dans les documents
        contractuels dès que le médiateur est désigné. Aucun organisme n’est indiqué tant que ce choix
        n’est pas fait.
      </p>
    </PageCadre>
  );
}
