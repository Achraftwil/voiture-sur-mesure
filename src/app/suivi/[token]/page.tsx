import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/app/suivi/[token]/question-form";
import { ReponseForm } from "@/app/suivi/[token]/reponse-form";
import { Logo } from "@/components/accueil/logo";
import { FilMessages } from "@/components/FilMessages";
import { CorrespondanceClient } from "@/components/CorrespondanceClient";
import { GalerieVoiture } from "@/components/GalerieVoiture";
import { lireCriteres } from "@/lib/criteres";
import { searchLabel } from "@/lib/demandes";
import { choiceLabel, formatPrice, infosComplementaires, readSuivi } from "@/lib/offres";
import { photosVisibles } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Vos propositions",
  robots: { index: false, follow: false },
};

export default async function SuiviPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const suivi = await readSuivi(token);
  if (!suivi) notFound();

  const vehicle = [suivi.brand, suivi.model].filter(Boolean).join(" ");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[#e3dcd0]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="inline-flex items-center" aria-label="voiture-sur-mesure.fr, accueil">
            <Logo variante="clair" className="text-[18px]" />
          </a>
          <a href="/mes-recherches" className="text-sm text-[#3f3b34] underline decoration-[#cfc6b8] underline-offset-2">
            Mes recherches
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        <p className="text-sm font-medium tracking-[0.14em] text-[#5f5a52] uppercase">Vos propositions</p>
        <h1 className="mt-2 font-serif text-4xl text-[#1c1b17]">Bonjour {suivi.contact_name}.</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#3f3b34]">
          Voici les voitures que nous vous proposons
          {vehicle ? ` pour votre recherche ${vehicle}` : ""}, dans un budget de {formatPrice(suivi.budget)} maximum
          {suivi.deadline ? `, ${searchLabel(suivi.deadline).toLowerCase()}` : ""}.
        </p>

        {suivi.offres.length === 0 ? (
          <p className="mt-8 border border-[#e3dcd0] bg-[#fffcf7] px-5 py-8 text-[15px] text-[#3f3b34]">
            Aucune proposition pour le moment. Nous vous écrivons dès qu'une voiture correspond.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {suivi.offres.map((offre) => {
              const compare = lireCriteres(offre.criteres).length > 0;
              const photos = photosVisibles(offre.images);
              const dommages = photosVisibles(offre.dommages);
              return (
              <li key={offre.id} className="overflow-hidden border border-[#e3dcd0] bg-[#fffcf7]">
                <CorrespondanceClient criteres={offre.criteres} offre={offre}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="font-serif text-2xl text-[#1c1b17]">{offre.vehicle}</h2>
                    <PrixOffre price={offre.price} marche={offre.prix_marche ?? null} />
                  </div>
                </CorrespondanceClient>
                <div className="px-5 pb-5">
                  {compare ? null : (
                    <dl className="mt-4 divide-y divide-[#e3dcd0] border-y border-[#e3dcd0]">
                      {offre.year ? <Row label="Année" value={String(offre.year)} /> : null}
                      {offre.mileage ? <Row label="Kilométrage" value={`${offre.mileage.toLocaleString("fr-FR")} km`} /> : null}
                      {offre.place ? <Row label="Lieu" value={offre.place} /> : null}
                    </dl>
                  )}
                  {offre.comment.trim() ? (
                    <p className="mt-4 text-[15px] leading-6 text-[#3f3b34]">{offre.comment}</p>
                  ) : null}
                  <InfosComplementaires offre={offre} />
                  <ZoneImages titre="Images" photos={photos} />
                  <ZoneImages titre="Zones endommagées" photos={dommages} />
                  <p className="mt-4 text-sm text-[#5f5a52]">
                    Votre réponse · <span className="text-[15px] text-[#1c1b17]">{choiceLabel(offre.choice)}</span>
                  </p>
                  {offre.client_note ? <p className="mt-3 text-[15px] text-[#5f5a52]">Avec la décision : {offre.client_note}</p> : null}
                  <FilMessages messages={offre.messages} vous="client" />
                  <QuestionForm token={token} offreId={offre.id} />
                  <ReponseForm token={token} offreId={offre.id} choice={offre.choice} />
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function PrixOffre({ price, marche }: { price: number; marche: number | null }) {
  if (!marche) return <p className="text-lg text-[#1c1b17]">{formatPrice(price)}</p>;
  const economie = marche - price;
  return (
    <div className="text-right">
      <div className="flex items-baseline justify-end gap-4">
        <p>
          <span className="block text-sm text-[#5f5a52]">Prix du marché</span>
          <span className="text-lg font-bold text-[#d12b2b]">{formatPrice(marche)}</span>
        </p>
        <p>
          <span className="block text-sm text-[#5f5a52]">Notre prix</span>
          <span className="text-lg font-bold text-[#1f8a4c]">{formatPrice(price)}</span>
        </p>
      </div>
      {economie > 0 ? <p className="mt-1 text-[15px] font-medium text-[#1f8a4c]">Vous économisez {formatPrice(economie)}</p> : null}
    </div>
  );
}

function ZoneImages({ titre, photos }: { titre: string; photos: ReturnType<typeof photosVisibles> }) {
  if (photos.length === 0) return null;
  return (
    <section className="mt-6">
      <p className="text-[15px] font-medium text-[#1c1b17]">{titre}</p>
      <div className="-mx-5 mt-3">
        <GalerieVoiture images={photos} />
      </div>
    </section>
  );
}

function InfosComplementaires({ offre }: { offre: Parameters<typeof infosComplementaires>[0] }) {
  const lignes = infosComplementaires(offre);
  if (lignes.length === 0) return null;
  return (
    <dl className="mt-4 divide-y divide-[#e3dcd0] border-y border-[#e3dcd0]">
      {lignes.map((ligne) => (
        <Row key={ligne.label} label={ligne.label} value={ligne.value} />
      ))}
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-[#5f5a52]">{label}</dt>
      <dd className="text-[15px] text-[#1c1b17]">{value}</dd>
    </div>
  );
}
