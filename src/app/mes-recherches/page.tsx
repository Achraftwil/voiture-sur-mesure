import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { fermerSession } from "@/app/mes-recherches/actions";
import { Entete } from "@/components/accueil/entete";
import { Pied } from "@/components/accueil/pied";
import { DemanderLien } from "@/components/mes-recherches/DemanderLien";
import { clientCookieName, emailFromClientSession } from "@/lib/client-session";
import { formatDemandeDate, searchLabel } from "@/lib/demandes";
import { lireEspaceClient } from "@/lib/espace-client";
import { formatPrice } from "@/lib/offres";

export const metadata: Metadata = {
  title: "Mes recherches | Recherche voiture",
  robots: { index: false, follow: false },
};

export default async function MesRecherchesPage({
  searchParams,
}: {
  searchParams: Promise<{ lien?: string }>;
}) {
  const params = await searchParams;
  const jar = await cookies();
  const email = emailFromClientSession(jar.get(clientCookieName())?.value);

  return (
    <div className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Entete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold text-[#ff5000]">Espace client</p>
        <h1 className="mt-3 text-[2.4rem] leading-[1.05] font-bold tracking-tight sm:text-5xl">Mes recherches</h1>
        {email ? <Liste email={email} /> : <Invite invalide={params.lien === "invalide"} />}
      </main>
      <Pied />
    </div>
  );
}

function Invite({ invalide }: { invalide: boolean }) {
  return (
    <>
      <p className="mt-4 text-[17px] leading-7 text-[#5c5c5c]">
        Indiquez l&apos;adresse utilisée pour la recherche. Nous envoyons un lien à usage unique. Sur cet appareil, vous restez ensuite connecté.
      </p>
      <DemanderLien invalide={invalide} />
    </>
  );
}

async function Liste({ email }: { email: string }) {
  const espace = await lireEspaceClient(email);
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[17px] leading-7 text-[#5c5c5c]">Les recherches associées à votre adresse, et ce qui s&apos;est passé pour chacune.</p>
        <form action={fermerSession}>
          <button type="submit" className="text-sm text-[#5c5c5c] underline underline-offset-2">
            Se déconnecter
          </button>
        </form>
      </div>
      {espace.error ? <p className="mt-6 text-[15px] text-[#8a3a2a]">{espace.error}</p> : null}
      {espace.rows.length === 0 && !espace.error ? (
        <p className="mt-8 rounded-2xl border border-[#ececec] bg-[#f6f6f6] px-5 py-8 text-[15px]">
          Aucune recherche pour le moment.{" "}
          <Link href="/demande" className="font-semibold underline underline-offset-2">
            Décrire une voiture
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {espace.rows.map((demande) => {
            const vehicle = [demande.brand, demande.model].filter(Boolean).join(" ") || "Recherche";
            return (
              <li key={demande.id}>
                <Link href={`/mes-recherches/${demande.id}`} className="block rounded-2xl border border-[#ececec] px-5 py-5 hover:border-[#1a1a1a]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-2xl font-bold">{vehicle}</h2>
                    <p className="text-sm text-[#5c5c5c]">{formatDemandeDate(demande.created_at)}</p>
                  </div>
                  <p className="mt-2 text-[15px] text-[#5c5c5c]">
                    {formatPrice(demande.budget)} maximum · {searchLabel(demande.deadline)}
                  </p>
                  <p className="mt-3 text-[15px] font-medium">{etatRecherche(demande)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function etatRecherche(demande: {
  email_confirme_at: string | null;
  annulee_at: string | null;
  archived_at: string | null;
  offres: { choice: string; emailed_at: string | null }[];
}) {
  if (demande.annulee_at) return "Annulée";
  if (!demande.email_confirme_at) return "E-mail à confirmer";
  if (demande.offres.some((offre) => offre.choice === "retenue")) return "Offre retenue";
  const envoyees = demande.offres.filter((offre) => offre.emailed_at).length;
  if (envoyees > 0) return envoyees > 1 ? `${envoyees} offres reçues` : "1 offre reçue";
  if (demande.archived_at) return "Recherche close";
  return "Recherche confirmée";
}
