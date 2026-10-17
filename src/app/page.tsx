import type { Metadata } from "next";
import { Accueil } from "@/components/accueil/accueil";

export const metadata: Metadata = {
  title: "Recherche de voiture sur mesure | Recherche voiture",
  description:
    "Vous recherchez une voiture selon votre budget et vos critères ? Décrivez-nous votre besoin. Nous recherchons pour vous des véhicules et vous proposons des offres personnalisées auprès d'un professionnel automobile.",
};

export default function HomePage() {
  return <Accueil />;
}
