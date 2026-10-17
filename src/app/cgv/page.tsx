import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Conditions générales de vente | Recherche voiture",
  description: "Conditions applicables avant toute commande de véhicule.",
};

export default function CgvPage() {
  return (
    <PageCadre titre="Conditions générales de vente">
      <p>
        Les conditions générales complètes seront publiées ici avant toute vente à distance. Elles
        préciseront les prix, les frais, la livraison, les modalités de commande et, lorsqu’il est
        applicable, le droit de rétractation.
      </p>
      <p>
        Avant un engagement, l’offre indique déjà le véhicule, le prix total, les frais éventuels, les
        modalités de paiement et les conditions applicables. La somme versée y est qualifiée : acompte,
        arrhes ou autre mécanisme.
      </p>
      <p>La demande de recherche est gratuite et ne constitue pas une commande.</p>
    </PageCadre>
  );
}
