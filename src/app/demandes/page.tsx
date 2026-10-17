import type { Metadata } from "next";
import { cookies } from "next/headers";
import { lockDemandes, retirerPhotoOffre, unlockDemandes } from "@/app/demandes/actions";
import { AjoutPhotos } from "@/components/AjoutPhotos";
import { ArchiverDemande } from "@/components/ArchiverDemande";
import { RenvoiMail } from "@/components/RenvoiMail";
import { Logo } from "@/components/accueil/logo";
import { FilMessages } from "@/components/FilMessages";
import { PreparationOffre } from "@/components/PreparationOffre";
import { ReponseQuestion } from "@/components/ReponseQuestion";
import { StatutControl } from "@/components/StatutControl";
import { isAdminSession, adminCookieName } from "@/lib/admin-session";
import { brevoReady } from "@/lib/brevo";
import { lireCriteres, pourcentage, textePourcentage } from "@/lib/criteres";
import { formatDemandeDate, listDemandes } from "@/lib/demandes";
import { DECISIONS, formatPrice, infosComplementaires, listOffres, questionEnAttente, type Offre } from "@/lib/offres";
import { photosVisibles } from "@/lib/photos";
import { lirePropositions, type Proposition } from "@/lib/propositions";
import { isStatut, STATUTS, statutOf } from "@/lib/statuts";

export const metadata: Metadata = {
  title: "Demandes reçues",
  robots: { index: false, follow: false },
};

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; statut?: string; vue?: string }>;
}) {
  const jar = await cookies();
  const params = await searchParams;
  const open = isAdminSession(jar.get(adminCookieName())?.value);
  if (!open) {
    return <AccessScreen invalid={params.erreur === "1"} />;
  }

  const [demandesResult, offresResult, propositionsResult] = await Promise.all([listDemandes(), listOffres(), lirePropositions()]);
  const rows = demandesResult.rows;
  const error = demandesResult.error || offresResult.error || propositionsResult.error;
  const propositionsByDemande = new Map<string, Proposition[]>();
  for (const proposition of propositionsResult.rows) {
    const list = propositionsByDemande.get(proposition.demande_id) ?? [];
    list.push(proposition);
    propositionsByDemande.set(proposition.demande_id, list);
  }
  const offresByDemande = new Map<string, Offre[]>();
  for (const offre of offresResult.rows) {
    const list = offresByDemande.get(offre.demande_id) ?? [];
    list.push(offre);
    offresByDemande.set(offre.demande_id, list);
  }
  const archives = params.vue === "archives";
  const confirmation = params.vue === "confirmation";
  const reponses = params.vue === "reponses";
  const aRepondre = new Set(
    offresResult.rows.filter((offre) => questionEnAttente(offre.messages)).map((offre) => offre.demande_id),
  );
  const base = rows.filter((demande) => {
    if (reponses) return aRepondre.has(demande.id);
    if (archives) return Boolean(demande.archived_at);
    if (confirmation) return !demande.archived_at && !demande.email_confirme_at;
    return !demande.archived_at && Boolean(demande.email_confirme_at);
  });
  const active = params.statut && isStatut(params.statut) ? params.statut : "";
  const visible = active ? base.filter((demande) => demande.statut === active) : base;
  const count = countLabel(visible.length, active, archives, confirmation, reponses);
  const lien = (statut = "") => {
    const query = new URLSearchParams();
    if (archives) query.set("vue", "archives");
    if (confirmation) query.set("vue", "confirmation");
    if (reponses) query.set("vue", "reponses");
    if (statut) query.set("statut", statut);
    const texte = query.toString();
    return texte ? `/demandes?${texte}` : "/demandes";
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.14em] text-[#5f5a52] uppercase">Réception</p>
            <h1 className="mt-2 font-serif text-4xl text-[#1c1b17]">Demandes reçues</h1>
            <p className="mt-2 text-[15px] text-[#5f5a52]">{count}</p>
          </div>
          <form action={lockDemandes}>
            <button type="submit" className="text-sm text-[#5f5a52] underline decoration-[#cfc6b8] underline-offset-2">
              Fermer l&apos;accès
            </button>
          </form>
        </div>

        <nav aria-label="Filtrer par statut" className="mt-6 flex flex-wrap gap-2">
          <FilterLink
            href="/demandes"
            active={!active && !archives && !confirmation && !reponses}
            label="Toutes"
            count={rows.filter((demande) => !demande.archived_at && demande.email_confirme_at).length}
          />
          {STATUTS.map((statut) => (
            <FilterLink
              key={statut.value}
              href={lien(statut.value)}
              active={active === statut.value}
              label={statut.label}
              count={base.filter((demande) => demande.statut === statut.value).length}
              chip={statut.chip}
            />
          ))}
          <FilterLink
            href="/demandes?vue=confirmation"
            active={confirmation}
            label="À confirmer"
            count={rows.filter((demande) => !demande.archived_at && !demande.email_confirme_at).length}
            chip="border-[#d7d0c4] bg-[#eeeae4] text-[#5f5a52]"
          />
          <FilterLink
            href="/demandes?vue=reponses"
            active={reponses}
            label="À répondre"
            count={aRepondre.size}
            chip="border-[#e2c98a] bg-[#f4ead2] text-[#6a4b12]"
          />
          <FilterLink
            href="/demandes?vue=archives"
            active={archives}
            label="Archivées"
            count={rows.filter((demande) => demande.archived_at).length}
            chip="border-[#d7d0c4] bg-[#eeeae4] text-[#5f5a52]"
          />
        </nav>

        {error ? <p className="mt-8 text-[15px] text-[#8a3a2a]">{error}</p> : null}

        {visible.length === 0 && !error ? (
          <p className="mt-8 border border-[#e3dcd0] bg-[#fffcf7] px-5 py-8 text-[15px] text-[#3f3b34]">
            {archives
              ? active
                ? "Aucune demande archivée dans ce statut."
                : "Aucune demande archivée."
              : reponses
                ? "Aucune question en attente."
              : confirmation
                ? "Aucune recherche en attente de confirmation."
              : rows.length === 0
                ? "Aucune recherche pour le moment. Celles envoyées depuis le formulaire apparaîtront ici."
                : base.length === 0
                  ? "Aucune demande en cours. Les recherches non confirmées sont dans le filtre À confirmer."
                  : "Aucune demande dans ce statut."}
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {visible.map((demande) => {
              const tone = statutOf(demande.statut);
              return (
              <li
                key={demande.id}
                className={`border border-[#e3dcd0] border-t-[3px] bg-[#fffcf7] px-5 py-5 ${tone.bar}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-2xl text-[#1c1b17]">{demande.contact_name}</h2>
                  <p className="text-sm text-[#5f5a52]">{formatDemandeDate(demande.created_at)}</p>
                </div>
                <StatutControl id={demande.id} statut={demande.statut} name={demande.contact_name} />
                {demande.archived_at ? (
                  <p className="mt-3 text-sm text-[#5f5a52]">
                    Archivée le {formatDemandeDate(demande.archived_at)}
                    {demande.photos_retirees
                      ? ` · ${demande.photos_retirees} ${demande.photos_retirees > 1 ? "photos supprimées" : "photo supprimée"}`
                      : " · aucune photo à supprimer"}
                  </p>
                ) : null}
                {!demande.email_confirme_at && !demande.archived_at ? (
                  <p className="mt-3 text-sm text-[#8a3a2a]">En attente de confirmation de l&apos;e-mail.</p>
                ) : null}
                {demande.annulee_at ? (
                  <p className="mt-3 text-sm text-[#5f5a52]">Annulée par le client le {formatDemandeDate(demande.annulee_at)}.</p>
                ) : null}
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                  <a href={`tel:${demande.contact_phone.replace(/\s/g, "")}`} className="text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2">
                    {demande.contact_phone}
                  </a>
                  <a href={`mailto:${demande.contact_email}`} className="text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2">
                    {demande.contact_email}
                  </a>
                </p>
                {demande.archived_at || demande.annulee_at || !demande.email_confirme_at ? (
                  <Offres token={demande.access_token} offres={offresByDemande.get(demande.id) ?? []} archivee />
                ) : (
                  <>
                    <PreparationOffre
                      demandeId={demande.id}
                      demande={demande}
                      brevoReady={brevoReady()}
                      propositions={propositionsByDemande.get(demande.id) ?? []}
                      rechercheLe={demande.recherche_le}
                      rechercheErreur={demande.recherche_erreur}
                    >
                      <Offres token={demande.access_token} offres={offresByDemande.get(demande.id) ?? []} />
                    </PreparationOffre>
                    <ArchiverDemande id={demande.id} name={demande.contact_name} />
                  </>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function AccessScreen({ invalid }: { invalid: boolean }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-sm font-medium tracking-[0.14em] text-[#5f5a52] uppercase">Réception</p>
        <h1 className="mt-2 font-serif text-4xl text-[#1c1b17]">Demandes reçues</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#3f3b34]">
          Cette page est réservée. Saisissez le code pour voir les recherches envoyées.
        </p>
        <form action={unlockDemandes} className="mt-8 border border-[#e3dcd0] border-t-[3px] border-t-[#1e3a34] bg-[#fffcf7] px-5 py-6">
          <label className="block" htmlFor="code">
            <span className="mb-1.5 block text-[15px] font-medium">Code d&apos;accès</span>
            <input
              id="code"
              name="code"
              type="password"
              autoComplete="current-password"
              className="h-12 w-full border border-[#d7d0c4] bg-white px-3 text-[15px] outline-none focus:border-[#1e3a34] focus:ring-2 focus:ring-[#1e3a34]/15"
            />
          </label>
          {invalid ? <p className="mt-3 text-[15px] text-[#8a3a2a]">Code incorrect.</p> : null}
          <button type="submit" className="mt-5 h-12 bg-[#1e3a34] px-6 text-[15px] font-medium text-[#f6f3ec]">
            Entrer
          </button>
        </form>
      </main>
    </div>
  );
}

function Offres({ token, offres, archivee = false }: { token: string; offres: Offre[]; archivee?: boolean }) {
  if (offres.length === 0) return null;
  const groupes = DECISIONS.map((decision) => ({
    ...decision,
    offres: offres.filter((offre) => offre.choice === decision.value),
  })).filter((groupe) => groupe.offres.length > 0);

  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-[#5f5a52]">Décision du client</p>
      <div className="mt-3 space-y-4">
        {groupes.map((groupe) => (
          <section key={groupe.value}>
            <p className={`inline-flex h-7 items-center gap-2 border px-2.5 text-sm ${groupe.chip}`}>
              <span>{groupe.label}</span>
              <span>{groupe.offres.length}</span>
            </p>
            <div className="mt-2 space-y-2">
              {groupe.offres.map((offre) => (
                <OffreCarte key={offre.id} offre={offre} token={token} archivee={archivee} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OffreCarte({ offre, token, archivee = false }: { offre: Offre; token: string; archivee?: boolean }) {
  const score = pourcentage(lireCriteres(offre.criteres));
  const photos = photosVisibles(offre.images);
  const dommages = photosVisibles(offre.dommages);
  return (
    <div className="border border-[#e3dcd0] bg-white px-3 py-3">
      <p className="text-[15px] text-[#1c1b17]">
        {offre.vehicle} · {formatPrice(offre.price)}
      </p>
      {offre.reference_interne ? <p className="mt-1 text-sm text-[#5f5a52]">N° interne · {offre.reference_interne}</p> : null}
      <p className="mt-1 text-sm text-[#5f5a52]">
        {score ? `${textePourcentage(score)} · ` : ""}
        {offre.emailed_at ? "E-mail envoyé" : "E-mail non envoyé"}
        {photos.length > 0 ? ` · ${photos.length} ${photos.length > 1 ? "photos" : "photo"}` : ""}
        {dommages.length > 0 ? ` · ${dommages.length} ${dommages.length > 1 ? "zones endommagées" : "zone endommagée"}` : ""}
      </p>
      <BandePhotos offreId={offre.id} titre="Images" photos={photos} />
      <BandePhotos offreId={offre.id} titre="Zones endommagées" photos={dommages} />
      {questionEnAttente(offre.messages) ? <p className="mt-2 text-sm text-[#6a4b12]">Question sans réponse</p> : null}
      {infosComplementaires(offre).map((ligne) => (
        <p key={ligne.label} className="mt-1 text-sm text-[#5f5a52]">
          {ligne.label} · {ligne.value}
        </p>
      ))}
      {offre.comment.trim() ? <p className="mt-2 text-[15px] leading-6 text-[#3f3b34]">{offre.comment}</p> : null}
      {offre.client_note ? <p className="mt-2 text-[15px] text-[#3f3b34]">Avec la décision : {offre.client_note}</p> : null}
      <FilMessages messages={offre.messages} vous="proprietaire" />
      <ReponseQuestion offreId={offre.id} />
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <a href={`/suivi/${token}`} className="text-sm text-[#1e3a34] underline decoration-[#c5d5cf] underline-offset-2">
          Page du client
        </a>
        {archivee ? null : (
          <>
            <AjoutPhotos offreId={offre.id} />
            <AjoutPhotos offreId={offre.id} zone="dommages" />
            <RenvoiMail offreId={offre.id} />
          </>
        )}
      </div>
    </div>
  );
}

function BandePhotos({ offreId, titre, photos }: { offreId: string; titre: string; photos: ReturnType<typeof photosVisibles> }) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-sm text-[#5f5a52]">{titre}</p>
      <ul className="mt-2 flex gap-2 overflow-x-auto">
        {photos.map((photo) => (
          <li key={photo.chemin} className="w-20 shrink-0">
            <img src={photo.url} alt={photo.legende || titre} className="h-14 w-20 object-cover" />
            {photo.legende ? <p className="truncate text-[11px] text-[#5f5a52]">{photo.legende}</p> : null}
            <form action={retirerPhotoOffre}>
              <input type="hidden" name="offreId" value={offreId} />
              <input type="hidden" name="chemin" value={photo.chemin} />
              <button type="submit" className="text-[11px] text-[#5f5a52] underline decoration-[#cfc6b8] underline-offset-2">
                Retirer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function countLabel(count: number, statut: string, archives: boolean, confirmation: boolean, reponses: boolean) {
  const noun = count > 1 ? "demandes" : "demande";
  const suffix = [archives ? "archivées" : "", confirmation ? "à confirmer" : "", reponses ? "à répondre" : "", statut ? statutOf(statut).label : ""].filter(Boolean).join(" · ");
  if (count === 0) {
    if (archives) return "Aucune demande archivée";
    if (confirmation) return "Aucune recherche à confirmer";
    if (reponses) return "Aucune question en attente";
    return "Aucune demande";
  }
  return suffix ? `${count} ${noun} · ${suffix}` : `${count} ${noun}`;
}

function FilterLink({
  href,
  active,
  label,
  count,
  chip = "border-[#d7d0c4] bg-white text-[#1c1b17]",
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  chip?: string;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 items-center gap-2 border px-3 text-sm ${chip} ${active ? "ring-2 ring-[#1c1b17]/20" : ""}`}
    >
      <span>{label}</span>
      <span className="text-[#5f5a52]">{count}</span>
    </a>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-[#e3dcd0]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="/" className="inline-flex items-center" aria-label="voiture-sur-mesure.fr, accueil">
          <Logo variante="clair" className="text-[18px]" />
        </a>
      </div>
    </header>
  );
}
