import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Recherche voiture",
  description: "Données collectées pour la recherche d'une voiture d'occasion.",
};

export default function ConfidentialitePage() {
  return (
    <PageCadre titre="Politique de confidentialité">
      <p>
        Le formulaire de demande recueille les critères de recherche et les coordonnées nécessaires
        pour y répondre : prénom, téléphone et adresse e-mail.
      </p>
      <p>
        Ces informations servent à étudier la demande, à envoyer les offres et à échanger au sujet du
        véhicule. Elles ne sont pas utilisées pour un autre usage.
      </p>
      <p>
        L’identité du responsable de traitement, la durée de conservation et les modalités d’exercice
        des droits d’accès, de rectification et de suppression seront précisées ici avec les mentions
        légales de l’entreprise.
      </p>
    </PageCadre>
  );
}
