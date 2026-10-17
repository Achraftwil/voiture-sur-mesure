"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { url: string; legende: string };

export function GalerieVoiture({ images }: { images: Photo[] }) {
  const [index, setIndex] = useState(0);
  const [plein, setPlein] = useState(false);
  const courant = Math.min(index, Math.max(images.length - 1, 0));
  const photo = images[courant];

  useEffect(() => {
    if (!plein) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPlein(false);
      if (event.key === "ArrowLeft") setIndex((current) => decaler(current, -1, images.length));
      if (event.key === "ArrowRight") setIndex((current) => decaler(current, 1, images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [plein, images.length]);

  if (!photo) return null;

  function aller(delta: number) {
    setIndex((current) => decaler(current, delta, images.length));
  }

  return (
    <div>
      <Cadre
        images={images}
        index={courant}
        plein={false}
        onPrecedent={() => aller(-1)}
        onSuivant={() => aller(1)}
        onChoisir={setIndex}
        onAgrandir={() => setPlein(true)}
        onFermer={() => setPlein(false)}
      />
      {plein ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#111] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Photos de la voiture">
          <Cadre
            images={images}
            index={courant}
            plein
            onPrecedent={() => aller(-1)}
            onSuivant={() => aller(1)}
            onChoisir={setIndex}
            onAgrandir={() => setPlein(true)}
            onFermer={() => setPlein(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function Cadre({
  images,
  index,
  plein,
  onPrecedent,
  onSuivant,
  onChoisir,
  onAgrandir,
  onFermer,
}: {
  images: Photo[];
  index: number;
  plein: boolean;
  onPrecedent: () => void;
  onSuivant: () => void;
  onChoisir: (index: number) => void;
  onAgrandir: () => void;
  onFermer: () => void;
}) {
  const photo = images[index];
  const plusieurs = images.length > 1;
  const depart = useRef(0);

  return (
    <div className={plein ? "flex h-full min-h-0 flex-1 flex-col" : "bg-white px-3 py-3 sm:px-4 sm:py-4"}>
      <div className={plein ? "flex min-h-0 flex-1 items-center justify-center" : undefined}>
        <div
          className={plein ? "relative max-h-full max-w-full" : "relative bg-[#f3f3f3] touch-pan-y"}
          onPointerDown={(event) => {
            if (event.target instanceof Element && event.target.closest("button")) return;
            depart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (event.target instanceof Element && event.target.closest("button")) return;
            const delta = event.clientX - depart.current;
            if (delta > 48) onPrecedent();
            else if (delta < -48) onSuivant();
          }}
        >
          <img
            src={photo.url}
            alt={photo.legende || `Photo ${index + 1} de la voiture`}
            draggable={false}
            className={plein ? "max-h-[calc(100vh-8.5rem)] w-auto max-w-full object-contain" : "aspect-[16/10] w-full object-contain"}
          />
          {plusieurs ? (
            <>
              <Fleche label="Photo précédente" sens="gauche" onClick={onPrecedent} />
              <Fleche label="Photo suivante" sens="droite" onClick={onSuivant} />
            </>
          ) : null}
          {photo.legende ? (
            <p className="absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] truncate bg-[#3a3a3a] px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-white uppercase sm:text-xs">
              {photo.legende}
            </p>
          ) : null}
          {plein ? null : (
            <button
              type="button"
              onClick={onAgrandir}
              aria-label="Agrandir la photo"
              className="absolute right-3 bottom-3 p-1 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
            >
              <IconeAgrandir />
            </button>
          )}
        </div>
      </div>
      {plein ? (
        <button type="button" onClick={onFermer} className="absolute top-3 right-3 border border-white/40 px-3 py-1.5 text-sm text-white">
          Fermer
        </button>
      ) : null}
      {plusieurs ? (
        <div className="mt-3 flex gap-2 overflow-x-auto p-0.5">
          {images.map((item, position) => (
            <button
              key={item.url}
              type="button"
              aria-label={item.legende || `Photo ${position + 1}`}
              aria-current={position === index ? "true" : undefined}
              onClick={() => onChoisir(position)}
              className={`h-16 w-[5.5rem] shrink-0 border-2 sm:w-24 ${position === index ? "border-[#2f6fed]" : "border-transparent"}`}
            >
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function decaler(current: number, delta: number, total: number) {
  if (total <= 0) return 0;
  return (current + delta + total) % total;
}

function Fleche({ label, sens, onClick }: { label: string; sens: "gauche" | "droite"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${sens === "gauche" ? "left-1" : "right-1"}`}
    >
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden="true">
        <path
          d={sens === "gauche" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function IconeAgrandir() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}
