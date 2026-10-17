import type { Metadata } from "next";
import { PageCadre } from "@/components/accueil/page-cadre";

export const metadata: Metadata = {
  title: "Garanties | Recherche voiture",
  description: "Garanties légales applicables à l'achat d'un véhicule auprès d'un professionnel.",
};

export default function GarantiesPage() {
  return (
    <PageCadre titre="Garanties">
      <p>
        Un véhicule d’occasion acheté auprès d’un professionnel est couvert par les garanties légales
        de la vente. Le détail applicable à une transaction figure dans les documents remis avant
        l’engagement.
      </p>
      <h2 className="pt-2 text-xl font-semibold">Garantie légale de conformité</h2>
      <p>
        Elle s’applique aux véhicules d’occasion vendus par un professionnel. L’action se prescrit par
        deux ans à compter de la délivrance du bien. Pour un bien d’occasion, la présomption selon
        laquelle le défaut existait au moment de la délivrance est plus courte que pour un bien neuf.
        Les règles précises sont celles du code de la consommation et des documents de vente.
      </p>
      <h2 className="pt-2 text-xl font-semibold">Garantie légale des vices cachés</h2>
      <p>
        L’acheteur peut agir sur le fondement des vices cachés lorsque le défaut n’était pas apparent,
        qu’il existait au moment de la vente et qu’il rend le véhicule impropre à l’usage auquel on le
        destine, ou en diminue très fortement l’usage. Le délai d’action court à compter de la
        découverte du vice, dans les conditions du code civil.
      </p>
      <h2 className="pt-2 text-xl font-semibold">Garantie commerciale</h2>
      <p>
        Une garantie commerciale complémentaire n’existe que si elle est proposée pour le véhicule, avec
        sa durée, son périmètre et ses exclusions, dans l’offre et le contrat. Elle s’ajoute aux
        garanties légales et ne les remplace pas.
      </p>
    </PageCadre>
  );
}
