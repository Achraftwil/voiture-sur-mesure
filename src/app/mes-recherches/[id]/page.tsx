import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Entete } from "@/components/accueil/entete";
import { Pied } from "@/components/accueil/pied";
import { RetraitRecherche } from "@/components/mes-recherches/RetraitRecherche";
import { clientCookieName, emailFromClientSession } from "@/lib/client-session";
import { demandeDetails, formatDemandeDate } from "@/lib/demandes";
import { lireEspaceClient, type DemandeClient } from "@/lib/espace-client";
import { choiceLabel, formatPrice } from "@/lib/offres";

export const metadata: Metadata = {
  title: "Recherche | Recherche voiture",
  robots: { index: false, follow: false },
};

export default async function RecherchePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const jar = await cookies();
  const email = emailFromClientSession(jar.get(clientCookieName())?.value);
  if (!email) redirect("/mes-recherches");

  const espace = await lireEspaceClient(email);
  const demande = espace.rows.find((item) => item.id === id);
  if (!demande) notFound();

  const retenue = demande.offres.some((offre) => offre.choice === "retenue");
  const modifiable = Boolean(demande.email_confirme_at) && !demande.annulee_at && !demande.archived_at && !retenue;
  const retirable = !demande.annulee_at && !demande.archived_at;

  return (
    <div className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Entete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/mes-recherches" className="text-sm text-[#5c5c5c] underline underline-offset-2">
          Toutes les recherches
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          {[demande.brand, demande.model].filter(Boolean).join(" ") || "Votre recherche"}
        </h1>
        <p className="mt-3 text-[15px] text-[#5c5c5c]">Envoyée le {formatDemandeDate(demande.created_at)}</p>
        {query.erreur ? <p className="mt-4 text-[15px] text-[#8a3a2a]">L&apos;action n&apos;a pas abouti. Réessayez.</p> : null}

        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {demandeDetails(demande).map((row) => (
            <div key={row.label}>
              <dt className="text-sm text-[#5c5c5c]">{row.label}</dt>
              <dd className="text-[15px]">{row.value}</dd>
            </div>
          ))}
        </dl>
        {demande.comment.trim() ? <p className="mt-6 text-[15px] leading-6">{demande.comment}</p> : null}

        <h2 className="mt-10 text-2xl font-bold">Historique</h2>
        <ol className="mt-4 space-y-3">
          {historique(demande).map((ligne) => (
            <li key={ligne.cle} className="rounded-xl border border-[#ececec] px-4 py-3">
              <p className="text-sm text-[#5c5c5c]">{formatDemandeDate(ligne.at)}</p>
              <p className="mt-1 text-[15px]">{ligne.texte}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          {modifiable ? (
            <Link href={`/mes-recherches/${demande.id}/modifier`} className="inline-flex h-12 items-center rounded-xl bg-[#1a1a1a] px-5 text-[15px] font-semibold text-white">
              Modifier la recherche
            </Link>
          ) : null}
          {retirable ? <RetraitRecherche id={demande.id} avecOffres={demande.offres.length > 0} /> : null}
        </div>
      </main>
      <Pied />
    </div>
  );
}

function historique(demande: DemandeClient) {
  const lignes: { cle: string; at: string; texte: string }[] = [
    { cle: "creee", at: demande.created_at, texte: "Recherche enregistrée." },
  ];
  if (demande.email_confirme_at) {
    lignes.push({ cle: "confirmee", at: demande.email_confirme_at, texte: "Adresse e-mail confirmée." });
  }
  if (demande.updated_at) {
    lignes.push({ cle: "modifiee", at: demande.updated_at, texte: "Critères modifiés." });
  }
  for (const offre of demande.offres) {
    const moment = offre.emailed_at || offre.created_at;
    const decision = offre.choice === "en-attente" ? "en attente de votre décision" : choiceLabel(offre.choice).toLowerCase();
    lignes.push({
      cle: offre.id,
      at: moment,
      texte: `Offre ${offre.vehicle} à ${formatPrice(offre.price)} : ${decision}.${offre.client_note.trim() ? ` Votre message : ${offre.client_note.trim()}` : ""}`,
    });
    for (const message of offre.messages ?? []) {
      lignes.push({
        cle: message.id,
        at: message.created_at,
        texte: message.auteur === "client" ? `Votre question sur ${offre.vehicle} : ${message.corps}` : `Réponse sur ${offre.vehicle} : ${message.corps}`,
      });
    }
  }
  if (demande.annulee_at) {
    lignes.push({ cle: "annulee", at: demande.annulee_at, texte: "Recherche annulée." });
  }
  return lignes.sort((a, b) => a.at.localeCompare(b.at));
}
