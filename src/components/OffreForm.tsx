"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { envoyerOffre } from "@/app/demandes/actions";
import { SearchSelect } from "@/components/SearchSelect";
import { SelecteurPhotos } from "@/components/SelecteurPhotos";
import { ZONES_ENDOMMAGEES } from "@/lib/photos";
import {
  criteresActifs,
  evaluerOffre,
  pourcentage,
  saisieOffre,
  textePourcentage,
  type CritereDemande,
} from "@/lib/criteres";
import { findMake, modelsForMake, orderedMakes } from "@/lib/vehicles";
import { pickupAreas } from "@/lib/zones";

const initial = { error: "", sent: false };

const CARBURANTS = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "hybride", label: "Hybride" },
  { value: "hybride-rechargeable", label: "Hybride rechargeable" },
  { value: "electrique", label: "Électrique" },
  { value: "gpl", label: "GPL" },
];

const BOITES = [
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
];

const ORIGINES = [
  { value: "francaise", label: "Voiture française" },
  { value: "autre", label: "Autre origine" },
];

const ETATS = [
  { value: "excellent", label: "Excellent état" },
  { value: "tres-bon", label: "Très bon état" },
  { value: "bon", label: "Bon état" },
  { value: "correct", label: "État correct" },
];

const DELAIS = [
  { value: "des-que-possible", label: "Je suis pressé" },
  { value: "2-semaines", label: "Sous 2 semaines" },
  { value: "1-mois", label: "Sous 1 mois" },
  { value: "3-mois", label: "Sous 3 mois" },
  { value: "pas-presse", label: "Je ne suis pas pressé" },
];

const ANNEES = Array.from({ length: new Date().getFullYear() - 1989 }, (_, index) => String(new Date().getFullYear() - index));

const VIDE = {
  brand: "",
  model: "",
  origin: "",
  year: "",
  mileage: "",
  fuel: "",
  gearbox: "",
  condition: "",
  price: "",
  marketPrice: "",
  deadline: "",
  pickup: "",
  comment: "",
  vehicle: "",
  puissance: "",
  carrosserie: "",
  proprietaires: "",
  places: "",
  couleur: "",
  sellerie: "",
  portes: "",
};

export type RepriseOffre = {
  reference: string;
  vehicle: string;
  brand: string;
  model: string;
  origin: string;
  year: string;
  mileage: string;
  fuel: string;
  gearbox: string;
  puissance: string;
  carrosserie: string;
  proprietaires: string;
  places: string;
  couleur: string;
  sellerie: string;
  portes: string;
};

export function OffreForm({
  demandeId,
  demande,
  brevoReady,
  reprise,
  avantFormulaire,
  children,
}: {
  demandeId: string;
  demande: CritereDemande;
  brevoReady: boolean;
  reprise?: RepriseOffre | null;
  avantFormulaire?: ReactNode;
  children?: ReactNode;
}) {
  const [state, action, pending] = useActionState(envoyerOffre, initial);
  const [champs, setChamps] = useState<typeof VIDE>(() => {
    if (!reprise) return VIDE;
    return {
      ...VIDE,
      vehicle: reprise.vehicle,
      brand: reprise.brand,
      model: reprise.model,
      origin: reprise.origin,
      year: reprise.year,
      mileage: reprise.mileage,
      fuel: reprise.fuel,
      gearbox: reprise.gearbox,
      puissance: reprise.puissance,
      carrosserie: reprise.carrosserie,
      proprietaires: reprise.proprietaires,
      places: reprise.places,
      couleur: reprise.couleur,
      sellerie: reprise.sellerie,
      portes: reprise.portes,
    };
  });
  const [localError, setLocalError] = useState("");
  const messageRef = useRef<HTMLParagraphElement>(null);
  const criteres = criteresActifs(demande);
  const cles = new Set(criteres.map((critere) => critere.cle));
  const demandeMarque = cles.has("brand");
  const demandeModele = cles.has("model");
  const evaluation = evaluerOffre(demande, saisieOffre(champs));
  const score = evaluation.complet ? pourcentage(evaluation.lignes) : null;

  const marques = useMemo(
    () => orderedMakes().map((make) => ({ value: make.name, label: make.name })),
    [],
  );
  const modeles = useMemo(() => {
    if (!findMake(champs.brand)) return [];
    return modelsForMake(champs.brand).map((model) => ({ value: model.name, label: model.name }));
  }, [champs.brand]);

  useEffect(() => {
    if (!localError && !state.error) return;
    messageRef.current?.scrollIntoView({ block: "center" });
  }, [localError, state.error]);

  function changer(cle: keyof typeof VIDE, valeur: string) {
    setLocalError("");
    setChamps((current) => ({ ...current, [cle]: valeur }));
  }

  function changerMarque(brand: string) {
    setLocalError("");
    setChamps((current) => ({
      ...current,
      brand,
      model: brand === current.brand ? current.model : "",
    }));
  }

  return (
    <>
      {criteres.length > 0 ? (
        <div className="mt-4 divide-y divide-[#e3dcd0] border-y border-[#e3dcd0]">
          {criteres.map((critere) => (
            <p key={critere.cle} className="py-2 text-[15px] text-[#1c1b17]">
              <span className="text-[#5f5a52]">{critere.libelle}</span>
              <span> · {critere.valeur}</span>
            </p>
          ))}
        </div>
      ) : null}
      {children}
      {avantFormulaire}
      <form
        action={action}
        noValidate
        className="mt-5 border-t border-[#e3dcd0] pt-5"
        onSubmit={(event) => {
          if (evaluation.complet) return;
          event.preventDefault();
          setLocalError("Renseignez chaque critère du client.");
        }}
      >
        <input type="hidden" name="demandeId" value={demandeId} />
        <input type="hidden" name="referenceInterne" value={reprise?.reference ?? ""} />
        <p className="text-[15px] font-medium text-[#1c1b17]">Envoyer une offre</p>
        <p className="mt-1 text-sm text-[#5f5a52]">La correspondance se calcule à partir de ces informations.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {demandeMarque || demandeModele ? (
            <div className="sm:col-span-2">
              <SearchSelect
                id={`marque-${demandeId}`}
                label="Marque"
                hint={demandeMarque && hint(criteres, "brand") ? `Demandé : ${hint(criteres, "brand")}` : undefined}
                placeholder="Choisir une marque"
                searchPlaceholder="Rechercher une marque"
                value={champs.brand}
                options={marques}
                allowCustom
                onChange={changerMarque}
              />
              <input type="hidden" name="brand" value={champs.brand} />
            </div>
          ) : (
            <Field label="Véhicule" name="vehicle" required placeholder="Peugeot 308" value={champs.vehicle} onChange={(valeur) => changer("vehicle", valeur)} />
          )}
          {demandeModele ? (
            <div className="sm:col-span-2">
              <SearchSelect
                id={`modele-${demandeId}`}
                label="Modèle"
                hint={hint(criteres, "model") ? `Demandé : ${hint(criteres, "model")}` : undefined}
                placeholder={champs.brand ? "Choisir un modèle" : "Choisissez d'abord la marque"}
                searchPlaceholder="Rechercher un modèle"
                value={champs.model}
                options={modeles}
                allowCustom
                disabled={!champs.brand}
                onChange={(valeur) => changer("model", valeur)}
              />
              <input type="hidden" name="model" value={champs.model} />
            </div>
          ) : demandeMarque && champs.model ? (
            <input type="hidden" name="model" value={champs.model} />
          ) : null}
          <Field label="Prix" name="price" required inputMode="numeric" suffix="€" hint={hint(criteres, "budget")} value={champs.price} onChange={(valeur) => changer("price", valeur)} />
          <Field label="Prix du marché" name="marketPrice" inputMode="numeric" suffix="€" hint="Cote, par exemple La Centrale" value={champs.marketPrice} onChange={(valeur) => changer("marketPrice", valeur)} />
          {cles.has("year") ? (
            <Choix label="Année" name="year" hint={hint(criteres, "year")} value={champs.year} options={ANNEES.map((annee) => ({ value: annee, label: annee }))} onChange={(valeur) => changer("year", valeur)} />
          ) : null}
          {cles.has("mileage") ? (
            <Field label="Kilométrage" name="mileage" required inputMode="numeric" suffix="km" hint={hint(criteres, "mileage")} value={champs.mileage} onChange={(valeur) => changer("mileage", valeur)} />
          ) : null}
          {cles.has("fuel") ? (
            <Choix label="Carburant" name="fuel" hint={hint(criteres, "fuel")} value={champs.fuel} options={CARBURANTS} onChange={(valeur) => changer("fuel", valeur)} />
          ) : null}
          {cles.has("gearbox") ? (
            <Choix label="Boîte" name="gearbox" hint={hint(criteres, "gearbox")} value={champs.gearbox} options={BOITES} onChange={(valeur) => changer("gearbox", valeur)} />
          ) : null}
          {cles.has("origin") ? (
            <Choix label="Origine" name="origin" hint={hint(criteres, "origin")} value={champs.origin} options={ORIGINES} onChange={(valeur) => changer("origin", valeur)} />
          ) : null}
          {cles.has("condition") ? (
            <Choix label="État" name="condition" hint={hint(criteres, "condition")} value={champs.condition} options={ETATS} onChange={(valeur) => changer("condition", valeur)} />
          ) : null}
          {cles.has("deadline") ? (
            <Choix label="Délai" name="deadline" hint={hint(criteres, "deadline")} value={champs.deadline} options={DELAIS} onChange={(valeur) => changer("deadline", valeur)} />
          ) : null}
          {cles.has("pickup") ? (
            <Choix label="Récupération" name="pickup" hint={hint(criteres, "pickup")} value={champs.pickup} options={pickupAreas.map((area) => ({ value: area.value, label: area.label }))} onChange={(valeur) => changer("pickup", valeur)} />
          ) : null}
        </div>
        <p className="mt-5 text-[15px] font-medium text-[#1c1b17]">Informations complémentaires</p>
        <p className="mt-1 text-sm text-[#5f5a52]">Facultatives. Le client ne voit que celles que vous remplissez.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Puissance" name="puissance" placeholder="120 ch" value={champs.puissance} onChange={(valeur) => changer("puissance", valeur)} />
          <Field label="Carrosserie" name="carrosserie" placeholder="SUV" value={champs.carrosserie} onChange={(valeur) => changer("carrosserie", valeur)} />
          <Field label="Nombre total de propriétaires" name="proprietaires" inputMode="numeric" value={champs.proprietaires} onChange={(valeur) => changer("proprietaires", valeur)} />
          <Field label="Nombre de places" name="places" inputMode="numeric" value={champs.places} onChange={(valeur) => changer("places", valeur)} />
          <Field label="Couleur" name="couleur" placeholder="Gris" value={champs.couleur} onChange={(valeur) => changer("couleur", valeur)} />
          <Field label="Sellerie" name="sellerie" placeholder="Tissu" value={champs.sellerie} onChange={(valeur) => changer("sellerie", valeur)} />
          <Field label="Nombre de portes" name="portes" inputMode="numeric" value={champs.portes} onChange={(valeur) => changer("portes", valeur)} />
        </div>
        <label className="mt-3 block text-sm text-[#5f5a52]" htmlFor={`commentaire-${demandeId}`}>
          Commentaire
          <span className="text-[#8a847a]"> · facultatif{cles.has("comment") ? ` · ${hint(criteres, "comment")}` : ""}</span>
          <textarea
            id={`commentaire-${demandeId}`}
            name="comment"
            rows={3}
            maxLength={2000}
            value={champs.comment}
            onChange={(event) => changer("comment", event.target.value)}
            placeholder="Informations complémentaires pour le client"
            className="mt-1.5 w-full border border-[#d7d0c4] bg-white px-3 py-2 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
          />
        </label>
        <SelecteurPhotos inputId={`photos-${demandeId}`} />
        <div className="mt-4">
          <SelecteurPhotos
            inputId={`dommages-${demandeId}`}
            fichierNom="dommages"
            choix={ZONES_ENDOMMAGEES}
            titre="Zones endommagées"
            aide="Ajoutez les photos des parties abîmées. L'endroit s'affiche sur l'image pour le client."
            etiquette="Endroit"
          />
        </div>
        {score ? <p className="mt-3 text-sm text-[#1e3a34]">{textePourcentage(score)}</p> : null}
        {localError || state.error ? (
          <p ref={messageRef} className="mt-3 text-[15px] text-[#8a3a2a]">
            {localError || state.error}
          </p>
        ) : null}
        {state.sent ? <p className="mt-3 text-[15px] text-[#1e3a34]">L'e-mail est parti.</p> : null}
        {!brevoReady ? (
          <p className="mt-3 text-sm leading-5 text-[#5f5a52]">
            Brevo n&apos;est pas encore relié. L&apos;offre sera enregistrée, et l&apos;e-mail partira dès que la clé sera en place.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-11 touch-manipulation bg-[#1e3a34] px-5 text-[15px] font-medium text-[#f6f3ec] disabled:opacity-70"
        >
          {pending ? "Envoi…" : "Envoyer l'offre"}
        </button>
      </form>
    </>
  );
}

function hint(criteres: { cle: string; valeur: string }[], cle: string) {
  return criteres.find((critere) => critere.cle === cle)?.valeur;
}

function Choix({
  label,
  name,
  hint: demande,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (valeur: string) => void;
}) {
  return (
    <label className="block text-sm text-[#5f5a52]">
      {label}
      {demande ? <span className="text-[#8a847a]"> · {demande}</span> : null}
      <select
        name={name}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full border border-[#d7d0c4] bg-white px-3 text-[15px] text-[#1c1b17] outline-none focus:border-[#1e3a34]"
      >
        <option value="">Choisir</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  inputMode,
  suffix,
  hint: demande,
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric";
  suffix?: string;
  hint?: string;
  value: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <label className="block text-sm text-[#5f5a52]">
      {label}
      {demande ? <span className="text-[#8a847a]"> · {demande}</span> : null}
      <span className="mt-1.5 flex h-11 items-center border border-[#d7d0c4] bg-white focus-within:border-[#1e3a34]">
        <input
          name={name}
          required={required}
          placeholder={placeholder}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#1c1b17] outline-none"
        />
        {suffix ? <span className="pr-3 text-sm text-[#5f5a52]">{suffix}</span> : null}
      </span>
    </label>
  );
}
