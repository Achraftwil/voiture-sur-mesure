"use client";

import { useMemo, useState } from "react";
import { SearchSelect, type SelectOption } from "@/components/SearchSelect";
import { findMake, modelsForMake, orderedMakes } from "@/lib/vehicles";
import { pickupAreaLabel, pickupAreas } from "@/lib/zones";

const FUELS = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "hybride", label: "Hybride" },
  { value: "hybride-rechargeable", label: "Hybride rechargeable" },
  { value: "electrique", label: "Électrique" },
  { value: "gpl", label: "GPL" },
  { value: "peu-importe", label: "Peu importe" },
];

const GEARBOXES = [
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
  { value: "peu-importe", label: "Peu importe" },
];

const ANY = "Peu importe";

const ORIGINS = [
  { value: "francaise", label: "Voiture française" },
  { value: "peu-importe", label: "Peu importe" },
];

const CONDITIONS = [
  { value: "excellent", label: "Excellent état" },
  { value: "tres-bon", label: "Très bon état" },
  { value: "bon", label: "Bon état" },
  { value: "correct", label: "État correct" },
  { value: "peu-importe", label: "Peu importe" },
];

const DEADLINES = [
  { value: "des-que-possible", label: "Je suis pressé", detail: "Dès qu'une voiture correspond." },
  { value: "2-semaines", label: "Sous 2 semaines" },
  { value: "1-mois", label: "Sous 1 mois" },
  { value: "3-mois", label: "Sous 3 mois" },
  { value: "pas-presse", label: "Je ne suis pas pressé", detail: "Ce délai laisse le temps de chercher le meilleur prix." },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, index) => String(CURRENT_YEAR - index));

export type FormState = {
  brand: string;
  model: string;
  origin: string;
  condition: string;
  yearFrom: string;
  yearTo: string;
  mileageMax: string;
  fuel: string;
  gearbox: string;
  budget: string;
  deadline: string;
  pickupArea: string;
  comment: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

type RequiredField = "budget" | "deadline" | "name" | "phone" | "email";

const FIELD_BY_STATE: Partial<Record<keyof FormState, RequiredField>> = {
  budget: "budget",
  deadline: "deadline",
  contactName: "name",
  contactPhone: "phone",
  contactEmail: "email",
};

const DEADLINE_VALUES = new Set(DEADLINES.map((option) => option.value));

function requiredIssues(form: FormState) {
  const issues: { field: RequiredField; label: string }[] = [];
  if (!form.budget || Number(form.budget) <= 0) issues.push({ field: "budget", label: "le budget" });
  if (!DEADLINE_VALUES.has(form.deadline)) issues.push({ field: "deadline", label: "le délai souhaité" });
  if (form.contactName.trim().length < 2) issues.push({ field: "name", label: "le prénom" });
  if (form.contactPhone.replace(/\D/g, "").length < 10) issues.push({ field: "phone", label: "le téléphone" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
    issues.push({ field: "email", label: "l'e-mail" });
  }
  return issues;
}

function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

const EMPTY: FormState = {
  brand: "",
  model: "",
  origin: "",
  condition: "",
  yearFrom: "",
  yearTo: "",
  mileageMax: "",
  fuel: "",
  gearbox: "",
  budget: "",
  deadline: "",
  pickupArea: "idf",
  comment: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
};

export function VehicleSearchForm({
  initial,
  demandeId,
}: {
  initial?: FormState;
  demandeId?: string;
} = {}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<Set<RequiredField>>(new Set());
  const [sent, setSent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const brandOptions = useMemo<SelectOption[]>(
    () => [
      { value: ANY, label: "Peu importe" },
      ...orderedMakes().map((make) => ({ value: make.name, label: make.name })),
    ],
    [],
  );

  const brandIsAny = form.brand === ANY;
  const knownMake = Boolean(findMake(form.brand));
  const modelOptions = useMemo<SelectOption[]>(() => {
    if (form.brand === ANY) return [{ value: ANY, label: "Peu importe" }];
    if (!findMake(form.brand)) return [];
    return [
      { value: ANY, label: "Peu importe" },
      ...modelsForMake(form.brand).map((model) => ({ value: model.name, label: model.name })),
    ];
  }, [form.brand]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    const field = FIELD_BY_STATE[key];
    if (field) {
      setInvalidFields((current) => {
        if (!current.has(field)) return current;
        const next = new Set(current);
        next.delete(field);
        return next;
      });
    }
  }

  function onBrandChange(brand: string) {
    setForm((current) => ({
      ...current,
      brand,
      model: brand === ANY ? ANY : brand === current.brand ? current.model : "",
    }));
    setError("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const issues = requiredIssues(form);
    if (issues.length > 0) {
      setInvalidFields(new Set(issues.map((issue) => issue.field)));
      setError(`Pour envoyer la recherche, indiquez ${joinLabels(issues.map((issue) => issue.label))}.`);
      return;
    }
    setInvalidFields(new Set());

    let yearFrom = form.yearFrom;
    let yearTo = form.yearTo;
    if (yearFrom && yearTo && Number(yearFrom) > Number(yearTo)) {
      [yearFrom, yearTo] = [yearTo, yearFrom];
    }

    setPending(true);
    try {
      const response = await fetch(demandeId ? `/api/mes-recherches/${demandeId}` : "/api/demandes", {
        method: demandeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, yearFrom, yearTo, comment: form.comment.trim() }),
      });
      const payload = (await response.json()) as { error?: string; confirmed?: boolean; emailSent?: boolean };
      if (!response.ok) {
        setError(payload.error || "L'envoi n'a pas abouti. Réessayez.");
        return;
      }
      setForm((current) => ({ ...current, yearFrom, yearTo }));
      setConfirmed(Boolean(demandeId || payload.confirmed));
      setEmailSent(payload.emailSent !== false);
      setSent(true);
    } catch {
      setError("L'envoi n'a pas abouti. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Confirmation form={form} edition={Boolean(demandeId)} confirmed={confirmed} emailSent={emailSent} />
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#ececec] bg-[#f6f6f6] px-5 py-6 sm:px-8 sm:py-8">
      <Section title="Véhicule">
        <SearchSelect
          id="marque"
          label="Marque"
          placeholder="Choisir une marque"
          searchPlaceholder="Rechercher une marque"
          value={form.brand}
          options={brandOptions}
          onChange={onBrandChange}
          allowCustom
        />
        {brandIsAny || knownMake || !form.brand ? (
          <SearchSelect
            id="modele"
            label="Modèle"
            hint={
              brandIsAny
                ? "Sans marque précise, le modèle reste ouvert aussi."
                : form.brand
                  ? undefined
                  : "La liste des modèles s'ouvre une fois la marque choisie."
            }
            placeholder={form.brand ? "Choisir un modèle" : "Choisissez d'abord la marque"}
            searchPlaceholder="Rechercher un modèle"
            value={form.model}
            options={modelOptions}
            onChange={(model) => update("model", model)}
            disabled={!form.brand || brandIsAny}
            allowCustom={!brandIsAny}
          />
        ) : (
          <TextField
            id="modele-libre"
            label="Modèle"
            value={form.model}
            onChange={(model) => update("model", model)}
            placeholder="Saisissez le modèle"
            autoComplete="off"
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            id="annee-min"
            label="Année minimum"
            value={form.yearFrom}
            onChange={(yearFrom) => update("yearFrom", yearFrom)}
            placeholder="Peu importe"
            options={YEARS}
          />
          <SelectField
            id="annee-max"
            label="Année maximum"
            value={form.yearTo}
            onChange={(yearTo) => update("yearTo", yearTo)}
            placeholder="Peu importe"
            options={YEARS}
          />
        </div>
        <AmountField
          id="kilometrage"
          label="Kilométrage maximum"
          value={form.mileageMax}
          onChange={(mileageMax) => update("mileageMax", mileageMax)}
          suffix="km"
          maxDigits={7}
        />
        <ChoicePills
          legend="Carburant"
          name="carburant"
          value={form.fuel}
          options={FUELS}
          onChange={(fuel) => update("fuel", fuel)}
        />
        <ChoicePills
          legend="Boîte"
          name="boite"
          value={form.gearbox}
          options={GEARBOXES}
          onChange={(gearbox) => update("gearbox", gearbox)}
        />
        <ChoicePills
          legend="Origine"
          name="origine"
          value={form.origin}
          options={ORIGINS}
          onChange={(origin) => update("origin", origin)}
        />
        <ChoicePills
          legend="État du véhicule"
          name="etat"
          value={form.condition}
          options={CONDITIONS}
          onChange={(condition) => update("condition", condition)}
        />
      </Section>

      <Section title="Budget et délai">
        <AmountField
          id="budget"
          label="Budget maximum"
          value={form.budget}
          onChange={(budget) => update("budget", budget)}
          suffix="€"
          maxDigits={7}
          required
          invalid={invalidFields.has("budget")}
        />
        <fieldset aria-required="true" aria-invalid={invalidFields.has("deadline")}>
          <legend className="mb-1.5 text-[15px] font-medium text-[#1a1a1a]">
            Délai souhaité
            <RequiredMark />
          </legend>
          <p className="mb-3 text-sm leading-5 text-[#5c5c5c]">
            Indiquez si vous êtes pressé, et sous quel délai vous voulez récupérer la voiture.
          </p>
          <div className="grid gap-2">
            {DEADLINES.map((option) => {
              const selected = form.deadline === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border bg-white px-3 py-3 ${
                    selected
                      ? "border-[#ff5000] bg-[#fff4ee]"
                      : invalidFields.has("deadline")
                        ? "border-[#c2410c]"
                        : "border-[#d9d9d9]"
                  }`}
                >
                  <input
                    type="radio"
                    name="delai"
                    value={option.value}
                    checked={selected}
                    onChange={() => update("deadline", option.value)}
                    className="mt-1 accent-[#ff5000]"
                  />
                  <span>
                    <span className="block text-[15px] text-[#1a1a1a]">{option.label}</span>
                    {option.detail ? (
                      <span className="mt-0.5 block text-sm text-[#5c5c5c]">{option.detail}</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="block" htmlFor="zone">
          <span className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">
            Où récupérer la voiture
          </span>
          <select
            id="zone"
            value={form.pickupArea}
            onChange={(event) => update("pickupArea", event.target.value)}
            className="h-12 w-full rounded-xl border border-[#d9d9d9] bg-white px-3 text-[15px] outline-none focus:border-[#ff5000] focus:ring-2 focus:ring-[#ff5000]/20"
          >
            {pickupAreas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Précisions">
        <label className="block" htmlFor="commentaire">
          <span className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">Commentaire</span>
          <textarea
            id="commentaire"
            value={form.comment}
            onChange={(event) => update("comment", event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Couleur, équipements, ce que vous ne voulez pas, une finition précise…"
            className="w-full resize-y rounded-xl border border-[#d9d9d9] bg-white px-3 py-3 text-[15px] leading-6 outline-none placeholder:text-[#8a8a8a] focus:border-[#ff5000] focus:ring-2 focus:ring-[#ff5000]/20"
          />
        </label>
      </Section>

      <Section title="Pour vous recontacter">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            id="prenom"
            label="Prénom"
            value={form.contactName}
            onChange={(contactName) => update("contactName", contactName)}
            autoComplete="given-name"
            required
            invalid={invalidFields.has("name")}
          />
          <TextField
            id="telephone"
            label="Téléphone"
            value={form.contactPhone}
            onChange={(contactPhone) => update("contactPhone", contactPhone)}
            autoComplete="tel"
            inputMode="tel"
            required
            invalid={invalidFields.has("phone")}
          />
        </div>
        <TextField
          id="email"
          label="E-mail"
          value={form.contactEmail}
          onChange={(contactEmail) => update("contactEmail", contactEmail)}
          autoComplete="email"
          inputMode="email"
          type="email"
          required
          invalid={invalidFields.has("email")}
          disabled={Boolean(demandeId)}
        />
      </Section>

      {error ? <p className="mt-6 text-[15px] text-[#8a3a2a]">{error}</p> : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-[#ff5000] px-6 text-[15px] font-semibold text-white hover:bg-[#e64700] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {pending ? "Envoi…" : demandeId ? "Enregistrer les modifications" : "Envoyer ma recherche"}
        </button>
      </div>
    </form>
  );
}

function Confirmation({
  form,
  edition,
  confirmed,
  emailSent,
}: {
  form: FormState;
  edition: boolean;
  confirmed: boolean;
  emailSent: boolean;
}) {
  const rows = summaryRows(form);
  const message = edition
    ? "La recherche est mise à jour. Les prochaines offres partiront de ces critères."
    : confirmed
      ? "Votre adresse est déjà confirmée. La recherche est visible dans Mes recherches, sur cet appareil."
      : emailSent
        ? `Ouvrez l'e-mail envoyé à ${form.contactEmail.trim()} et confirmez votre adresse. Le lien ouvre vos recherches et vous garde connecté sur cet appareil.`
        : "La recherche est enregistrée, mais l'e-mail de confirmation n'est pas parti. Depuis Mes recherches, demandez un nouveau lien avec la même adresse.";

  return (
    <div className="rounded-2xl border border-[#ececec] bg-[#f6f6f6] px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="text-3xl font-bold text-[#1a1a1a]">{edition ? "Recherche mise à jour" : "Recherche enregistrée"}</h2>
      <p className="mt-3 text-[15px] leading-6 text-[#5c5c5c]">{message}</p>
      <dl className="mt-6 divide-y divide-[#ececec] border-y border-[#ececec]">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-sm text-[#5c5c5c]">{row.label}</dt>
            <dd className="text-[15px] text-[#1a1a1a]">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href="/mes-recherches" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1a1a1a] px-5 text-[15px] font-semibold text-white">
          Mes recherches
        </a>
        <a href="/demande" className="inline-flex h-12 items-center px-5 text-[15px] text-[#5c5c5c]">
          Nouvelle recherche
        </a>
      </div>
    </div>
  );
}

function summaryRows(form: FormState) {
  const rows: { label: string; value: string }[] = [];
  if (form.brand) rows.push({ label: "Marque", value: form.brand });
  if (form.model) rows.push({ label: "Modèle", value: form.model });
  const origin = ORIGINS.find((item) => item.value === form.origin);
  if (origin) rows.push({ label: "Origine", value: origin.label });
  const years = yearSummary(form.yearFrom, form.yearTo);
  if (years) rows.push({ label: "Année", value: years });
  if (form.mileageMax) rows.push({ label: "Kilométrage", value: `${formatAmount(form.mileageMax)} km maximum` });
  const fuel = FUELS.find((item) => item.value === form.fuel);
  if (fuel) rows.push({ label: "Carburant", value: fuel.label });
  const gearbox = GEARBOXES.find((item) => item.value === form.gearbox);
  if (gearbox) rows.push({ label: "Boîte", value: gearbox.label });
  const condition = CONDITIONS.find((item) => item.value === form.condition);
  if (condition) rows.push({ label: "État", value: condition.label });
  if (form.budget) rows.push({ label: "Budget", value: `${formatAmount(form.budget)} € maximum` });
  const deadline = DEADLINES.find((item) => item.value === form.deadline);
  if (deadline) rows.push({ label: "Délai", value: deadline.label });
  if (form.pickupArea) rows.push({ label: "Récupération", value: pickupAreaLabel(form.pickupArea) });
  if (form.comment.trim()) rows.push({ label: "Commentaire", value: form.comment.trim() });
  if (form.contactName.trim()) rows.push({ label: "Prénom", value: form.contactName.trim() });
  if (form.contactPhone.trim()) rows.push({ label: "Téléphone", value: form.contactPhone.trim() });
  if (form.contactEmail.trim()) rows.push({ label: "E-mail", value: form.contactEmail.trim() });
  return rows;
}

function yearSummary(from: string, to: string) {
  if (from && to) return `${from} – ${to}`;
  if (from) return `À partir de ${from}`;
  if (to) return `Jusqu'en ${to}`;
  return "";
}

function formatAmount(digits: string) {
  return Number(digits).toLocaleString("fr-FR");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
        {title}
      </h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ChoicePills({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[15px] font-medium text-[#1a1a1a]">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border px-3 py-2 text-[15px] ${
                selected
                  ? "border-[#ff5000] bg-[#ff5000] text-white"
                  : "border-[#d9d9d9] bg-white text-[#1a1a1a]"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[#d9d9d9] bg-white px-3 text-[15px] outline-none focus:border-[#ff5000] focus:ring-2 focus:ring-[#ff5000]/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AmountField({
  id,
  label,
  value,
  onChange,
  suffix,
  maxDigits,
  required = false,
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  maxDigits: number;
  required?: boolean;
  invalid?: boolean;
}) {
  const display = value ? Number(value).toLocaleString("fr-FR") : "";
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <span
        className={`flex h-12 items-center rounded-xl border bg-white focus-within:border-[#ff5000] focus-within:ring-2 focus-within:ring-[#ff5000]/20 ${
          invalid ? "border-[#8a3a2a]" : "border-[#d9d9d9]"
        }`}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          aria-required={required}
          aria-invalid={invalid}
          value={display}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, maxDigits))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none"
        />
        <span className="pr-3 text-sm text-[#5c5c5c]">{suffix}</span>
      </span>
    </label>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  type = "text",
  required = false,
  invalid = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-required={required}
        aria-invalid={invalid}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full rounded-xl border bg-white px-3 text-[15px] outline-none placeholder:text-[#8a8a8a] focus:border-[#ff5000] focus:ring-2 focus:ring-[#ff5000]/20 ${
          invalid ? "border-[#8a3a2a]" : "border-[#d9d9d9]"
        }`}
      />
    </label>
  );
}

function RequiredMark() {
  return (
    <abbr title="Obligatoire" className="ml-1 text-[#8a3a2a] no-underline">
      *
    </abbr>
  );
}
