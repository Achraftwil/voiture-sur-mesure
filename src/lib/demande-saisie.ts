export type DemandeSaisie = {
  brand: string;
  model: string;
  origin: string;
  condition: string;
  yearFrom: number | null;
  yearTo: number | null;
  mileageMax: number | null;
  fuel: string;
  gearbox: string;
  budget: number;
  deadline: string;
  pickupArea: string;
  comment: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

const DELAIS = new Set(["des-que-possible", "2-semaines", "1-mois", "3-mois", "pas-presse"]);

export function lireDemandeSaisie(input: Record<string, unknown>): { saisie: DemandeSaisie | null; error: string } {
  const record = {
    brand: text(input.brand),
    model: text(input.model),
    origin: text(input.origin, 40),
    condition: text(input.condition, 40),
    yearFrom: entier(input.yearFrom, 4),
    yearTo: entier(input.yearTo, 4),
    mileageMax: entier(input.mileageMax, 7),
    fuel: text(input.fuel, 40),
    gearbox: text(input.gearbox, 40),
    budget: entier(input.budget, 7),
    deadline: text(input.deadline, 40),
    pickupArea: text(input.pickupArea, 80),
    comment: text(input.comment, 2000),
    contactName: text(input.contactName, 80),
    contactPhone: text(input.contactPhone, 30),
    contactEmail: text(input.contactEmail, 120).toLowerCase(),
  };

  const missing: string[] = [];
  if (!record.budget || record.budget <= 0) missing.push("le budget");
  if (!DELAIS.has(record.deadline)) missing.push("le délai souhaité");
  if (record.contactName.length < 2) missing.push("le prénom");
  if (record.contactPhone.replace(/\D/g, "").length < 10) missing.push("le téléphone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contactEmail)) missing.push("l'e-mail");

  if (missing.length > 0) {
    const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} et ${missing[missing.length - 1]}`;
    return { saisie: null, error: `Pour envoyer la recherche, indiquez ${list}.` };
  }

  if (record.yearFrom && record.yearTo && record.yearFrom > record.yearTo) {
    [record.yearFrom, record.yearTo] = [record.yearTo, record.yearFrom];
  }

  const budget = record.budget;
  if (budget == null) return { saisie: null, error: "Pour envoyer la recherche, indiquez le budget." };

  return { saisie: { ...record, budget }, error: "" };
}

export function saisiePourBase(saisie: DemandeSaisie) {
  return {
    brand: saisie.brand,
    model: saisie.model,
    origin: saisie.origin,
    condition: saisie.condition,
    year_from: saisie.yearFrom,
    year_to: saisie.yearTo,
    mileage_max: saisie.mileageMax,
    fuel: saisie.fuel,
    gearbox: saisie.gearbox,
    budget: saisie.budget,
    deadline: saisie.deadline,
    pickup_area: saisie.pickupArea,
    comment: saisie.comment,
    contact_name: saisie.contactName,
    contact_phone: saisie.contactPhone,
  };
}

function text(value: unknown, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function entier(value: unknown, maxDigits: number) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/\D/g, "").slice(0, maxDigits);
  if (!digits) return null;
  const number = Number(digits);
  return Number.isInteger(number) ? number : null;
}
