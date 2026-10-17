import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Entete } from "@/components/accueil/entete";
import { Pied } from "@/components/accueil/pied";
import { VehicleSearchForm, type FormState } from "@/components/VehicleSearchForm";
import { clientCookieName, emailFromClientSession } from "@/lib/client-session";
import { lireEspaceClient, type DemandeClient } from "@/lib/espace-client";

export const metadata: Metadata = {
  title: "Modifier la recherche | Recherche voiture",
  robots: { index: false, follow: false },
};

export default async function ModifierRecherchePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const email = emailFromClientSession(jar.get(clientCookieName())?.value);
  if (!email) redirect("/mes-recherches");

  const espace = await lireEspaceClient(email);
  const demande = espace.rows.find((item) => item.id === id);
  if (!demande) notFound();
  const retenue = demande.offres.some((offre) => offre.choice === "retenue");
  if (!demande.email_confirme_at || demande.annulee_at || demande.archived_at || retenue) {
    redirect(`/mes-recherches/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Entete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Modifier la recherche</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#5c5c5c]">
          L&apos;adresse e-mail reste celle qui a été confirmée. Les autres critères peuvent changer tant qu&apos;aucune offre n&apos;est retenue.
        </p>
        <div className="mt-8">
          <VehicleSearchForm initial={formulaire(demande)} demandeId={demande.id} />
        </div>
      </main>
      <Pied />
    </div>
  );
}

function formulaire(demande: DemandeClient): FormState {
  return {
    brand: demande.brand,
    model: demande.model,
    origin: demande.origin,
    condition: demande.condition,
    yearFrom: demande.year_from ? String(demande.year_from) : "",
    yearTo: demande.year_to ? String(demande.year_to) : "",
    mileageMax: demande.mileage_max ? String(demande.mileage_max) : "",
    fuel: demande.fuel,
    gearbox: demande.gearbox,
    budget: String(demande.budget),
    deadline: demande.deadline,
    pickupArea: demande.pickup_area || "idf",
    comment: demande.comment,
    contactName: demande.contact_name,
    contactPhone: demande.contact_phone,
    contactEmail: demande.contact_email,
  };
}
