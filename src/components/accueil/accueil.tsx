import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Entete } from "@/components/accueil/entete";
import { Icone, type NomIcone } from "@/components/accueil/icones";
import { Pied } from "@/components/accueil/pied";

const etapes: { icone: NomIcone; titre: string; texte: string }[] = [
  { icone: "file", titre: "Votre demande", texte: "La voiture, le budget, les critères." },
  { icone: "search", titre: "Notre recherche", texte: "Nous cherchons les occasions qui correspondent." },
  { icone: "car", titre: "Votre offre", texte: "Un véhicule, un prix, les informations disponibles." },
  { icone: "check", titre: "Votre décision", texte: "Vous acceptez ou vous refusez." },
];

const portraits = [
  { src: "/accueil/client-1.png", position: "center 32%" },
  { src: "/accueil/client-2.png", position: "center 28%" },
  { src: "/accueil/client-3.png", position: "center 24%" },
  { src: "/accueil/client-4.png", position: "center 34%" },
  { src: "/accueil/client-5.png", position: "center 30%" },
];

const points: { icone: NomIcone; titre: string }[] = [
  { icone: "search", titre: "Recherche personnalisée" },
  { icone: "euro", titre: "Prix compétitifs" },
  { icone: "file", titre: "Offre détaillée" },
  { icone: "shield", titre: "Achat encadré" },
];

const questions = [
  {
    question: "La demande est-elle gratuite ?",
    reponse: "Oui. Elle est gratuite et sans engagement.",
  },
  {
    question: "Dois-je acheter si vous trouvez une voiture ?",
    reponse: "Non. Vous décidez ensuite, offre par offre.",
  },
  {
    question: "Pourquoi le prix peut-il être compétitif ?",
    reponse:
      "Nous partons de votre demande plutôt que d’un grand stock à financer, à stocker et à commercialiser.",
  },
  {
    question: "Que vois-je avant de m’engager ?",
    reponse: "Le véhicule, le prix, les photos, les informations disponibles et les conditions.",
  },
  {
    question: "Le véhicule est-il garanti ?",
    reponse:
      "Les garanties légales d’un achat auprès d’un professionnel s’appliquent. Une garantie commerciale n’est ajoutée que si elle figure dans l’offre.",
  },
];

export function Accueil() {
  return (
    <div className="bg-white pb-24 font-[Arial,Helvetica,sans-serif] text-[#1a1a1a] md:pb-0">
      <Entete />
      <main>
        <section className="relative overflow-hidden bg-[#111] lg:h-[min(calc(100vw*438/1024),calc(100svh-4rem))] lg:min-h-[30rem]">
          <div className="relative lg:absolute lg:inset-0">
            <ImageHero />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#111] lg:bg-gradient-to-r lg:from-black/55 lg:via-black/15 lg:to-transparent" />
          </div>
          <div className="relative z-10 mx-auto -mt-10 max-w-[1200px] px-5 pb-8 sm:-mt-16 sm:px-8 lg:flex lg:h-full lg:items-center lg:py-0">
            <div className="mx-auto w-full max-w-[25rem] rounded-2xl bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] sm:p-6 lg:mx-0">
              <p className="text-[1.65rem] leading-tight font-bold">Dites-nous quelle voiture vous cherchez.</p>
              <p className="mt-2 text-[15px] leading-6 text-[#5c5c5c]">
                Budget et critères. Nous cherchons, puis nous vous montrons l’offre.
              </p>
              <div className="mt-5">
                <LienPrincipal href="/demande">Trouver ma voiture</LienPrincipal>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-[#5c5c5c]">
                {["Demande gratuite", "Sans engagement", "Offre avant décision"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Icone nom="check" className="h-4 w-4 text-[#ff5000]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[#ececec]">
          <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-5 sm:px-8">
            <div className="flex -space-x-2" aria-hidden="true">
              {portraits.map((portrait) => (
                <span key={portrait.src} className="rounded-full bg-[#ff5000]/35 p-0.5">
                  <Image
                    src={portrait.src}
                    alt=""
                    width={96}
                    height={96}
                    className="h-12 w-12 rounded-full border-2 border-white object-cover"
                    style={{ objectPosition: portrait.position }}
                  />
                </span>
              ))}
            </div>
            <p className="text-[15px] font-semibold">+ de 5000 clients satisfaits</p>
          </div>
        </section>

        <section className="border-b border-[#ececec]">
          <ul className="mx-auto grid max-w-[1200px] gap-5 px-5 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {points.map((point) => (
              <li key={point.titre} className="flex items-center gap-3 text-[15px] font-semibold">
                <Icone nom={point.icone} className="h-5 w-5 text-[#ff5000]" />
                {point.titre}
              </li>
            ))}
          </ul>
        </section>

        <section id="a-propos" className="scroll-mt-20">
          <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
            <h1 className="max-w-4xl text-[2.6rem] leading-[0.98] font-bold tracking-tight sm:text-6xl">
              Votre prochaine voiture. Nous la recherchons pour vous.
            </h1>
            <p id="pourquoi" className="mt-5 max-w-xl scroll-mt-20 text-[17px] leading-7 text-[#5c5c5c]">
              Les concessionnaires vendent leur stock. Nous partons de votre demande.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <CarteImage
                src="/accueil/conseiller-tablette-dos.jpg"
                alt="Conseiller automobile tenant une tablette"
                titre="Nous cherchons votre voiture."
                texte="Vous décrivez le besoin. Nous identifions les occasions qui correspondent."
                href="/demande"
                lien="Trouver ma voiture"
              />
              <CarteImage
                src="/accueil/budget-voiture.jpg"
                alt="Clé de voiture et véhicule blanc sur un décor anthracite"
                titre="Votre budget va à la voiture."
                texte="Moins de stock à financer. Plus de liberté pour chercher le bon véhicule."
                href="#parcours"
                lien="Comment ça marche"
              />
              <CarteImage
                id="engagements"
                contenuId="livraison"
                src="/accueil/offre-detaillee.jpg"
                alt="Offre automobile détaillée consultée sur un smartphone"
                titre="Vous voyez l’offre avant de vous engager."
                texte="Véhicule, prix, photos et défauts connus. Livraison ou retrait selon l’offre."
                href="/garanties"
                lien="Les garanties"
              />
            </div>
          </div>
        </section>

        <section id="parcours" className="scroll-mt-20 bg-[#f6f6f6]">
          <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
            <p className="text-sm font-semibold text-[#ff5000]">Le parcours</p>
            <h2 className="mt-2 max-w-xl text-[2rem] leading-tight font-bold tracking-tight sm:text-4xl">
              Quatre étapes.
            </h2>
            <ol className="mt-16 flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-0">
              {etapes.flatMap((etape, index) => {
                const carte = (
                  <li key={etape.titre} className="relative min-w-0 flex-1">
                    <article className="group relative flex h-full flex-col rounded-2xl bg-white px-5 pt-10 pb-5 text-[#1a1a1a] transition-colors duration-200 hover:bg-[#ff5000]">
                      <div className="absolute top-0 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff5000] text-sm font-bold text-white transition-colors duration-200 group-hover:bg-[#1a1a1a]">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icone
                          nom={etape.icone}
                          className="h-5 w-5 shrink-0 text-[#ff5000] transition-colors duration-200 group-hover:text-[#1a1a1a]"
                        />
                        <h3 className="text-lg font-bold">{etape.titre}</h3>
                      </div>
                      <p className="mt-1 text-[15px] leading-6 text-[#5c5c5c] transition-colors duration-200 group-hover:text-[#1a1a1a]/80">
                        {etape.texte}
                      </p>
                    </article>
                  </li>
                );
                if (index === 0) return [carte];
                return [
                  <li
                    key={`${etape.titre}-fleche`}
                    aria-hidden="true"
                    className="flex items-center justify-center text-[#ff5000] lg:px-2"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </li>,
                  carte,
                ];
              })}
            </ol>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8 lg:py-20">
            <h2 className="text-[2rem] leading-tight font-bold tracking-tight">Questions fréquentes</h2>
            <div className="mt-6 divide-y divide-[#ececec] border-y border-[#ececec]">
              {questions.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span className="text-2xl leading-none font-normal text-[#ff5000] group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[16px] leading-7 text-[#5c5c5c]">{item.reponse}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8">
          <div className="mx-auto max-w-[1200px] rounded-2xl bg-[#ff5000] px-6 py-12 sm:px-12 sm:py-16">
            <h2 className="max-w-xl text-[2rem] leading-tight font-bold tracking-tight sm:text-5xl">
              Dites-nous quelle voiture vous cherchez.
            </h2>
            <div className="mt-8">
              <Link
                href="/demande"
                className="inline-flex h-12 items-center rounded-xl bg-[#1a1a1a] px-6 text-[15px] font-semibold text-white hover:bg-black"
              >
                Trouver ma voiture
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Pied />
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden">
        <Link
          href="/demande"
          className="flex h-12 items-center justify-center rounded-xl bg-[#ff5000] text-[15px] font-semibold text-white"
        >
          Trouver ma voiture
        </Link>
      </div>
    </div>
  );
}

/**
 * Photo du hero : cadrage large sur ordinateur, recadrage serré (voiture + conseiller)
 * sur mobile et tablette. Next.js génère les tailles ; le navigateur choisit.
 */
function ImageHero() {
  const commun = {
    alt: "Berline blanche et un conseiller en costume",
    sizes: "100vw",
    quality: 90,
    preload: true,
  };
  const {
    props: { srcSet: bureau },
  } = getImageProps({ ...commun, src: "/accueil/hero.webp", width: 2048, height: 876 });
  const {
    props: { srcSet: mobile, ...reste },
  } = getImageProps({ ...commun, src: "/accueil/hero-mobile.webp", width: 1340, height: 876 });

  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={bureau} />
      <img
        {...reste}
        alt={commun.alt}
        srcSet={mobile}
        className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover lg:object-[70%_center]"
      />
    </picture>
  );
}

function LienPrincipal({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ff5000] text-[15px] font-semibold text-white hover:bg-[#e64700]"
    >
      {children}
    </Link>
  );
}

function CarteImage({
  id,
  contenuId,
  src,
  alt,
  titre,
  texte,
  href,
  lien,
}: {
  id?: string;
  contenuId?: string;
  src: string;
  alt: string;
  titre: string;
  texte: string;
  href: string;
  lien: string;
}) {
  return (
    <article id={id} className="scroll-mt-20 overflow-hidden rounded-2xl bg-[#f4f4f4]">
      <Image
        src={src}
        alt={alt}
        width={1024}
        height={768}
        sizes="(max-width: 767px) 100vw, 33vw"
        className="h-52 w-full object-cover"
      />
      <div className="p-5">
        <h2 className="text-[1.35rem] leading-tight font-bold">{titre}</h2>
        <p id={contenuId} className="mt-2 scroll-mt-20 text-[15px] leading-6 text-[#5c5c5c]">
          {texte}
        </p>
        <a href={href} className="mt-4 inline-flex text-[15px] font-semibold text-[#ff5000]">
          {lien}
        </a>
      </div>
    </article>
  );
}
