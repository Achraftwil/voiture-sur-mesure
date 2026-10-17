import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recherche d'une voiture d'occasion",
  description:
    "Décrivez la voiture d'occasion que vous cherchez en Île-de-France : modèle, budget et délai. Nous cherchons chez nos fournisseurs et nous vous transmettons les offres.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${sourceSerif.variable} h-full`}>
      <body className="min-h-full bg-[#f3f0e8] font-sans text-[#1c1b17] antialiased">{children}</body>
    </html>
  );
}
