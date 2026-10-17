import catalog from "@/data/cars.json";

export type CarModel = { name: string; rank: number };
export type CarMake = { name: string; models: CarModel[] };

export const vehicleDataVersion = catalog.version;
export const carMakes = catalog.makes as CarMake[];

const PINNED_MAKES = [
  "Renault",
  "Peugeot",
  "Citroën",
  "Dacia",
  "Volkswagen",
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Toyota",
  "Hyundai",
  "Kia",
  "Ford",
  "Opel",
  "Fiat",
  "Nissan",
  "SEAT",
  "Škoda",
  "Cupra",
  "DS",
  "Tesla",
  "Volvo",
  "Mini",
  "Suzuki",
  "Honda",
  "Mazda",
  "Mitsubishi",
  "Jeep",
  "Land Rover",
  "Porsche",
  "Alfa Romeo",
  "Lexus",
  "MG",
  "BYD",
  "Smart",
  "Alpine",
];

export function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const EXTRA_MODELS: Record<string, string[]> = {
  Citroën: ["Berlingo"],
  Peugeot: ["Partner", "Rifter"],
  Renault: ["Kangoo"],
  Opel: ["Combo"],
  Volkswagen: ["Caddy"],
  Fiat: ["Doblo"],
};

function withExtraModels(makes: CarMake[]) {
  return makes.map((make) => {
    const extras = EXTRA_MODELS[make.name] ?? [];
    const known = new Set(make.models.map((model) => fold(model.name)));
    const missing = extras
      .filter((name) => !known.has(fold(name)))
      .map((name) => ({ name, rank: 2 }));
    if (!missing.length) return make;
    return {
      ...make,
      models: [...missing, ...make.models].sort(
        (a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "fr"),
      ),
    };
  });
}

const catalogMakes = withExtraModels(carMakes as CarMake[]);
const makesByFold = new Map(catalogMakes.map((make) => [fold(make.name), make]));

export function findMake(name: string) {
  return makesByFold.get(fold(name));
}

export function orderedMakes() {
  const pinned = PINNED_MAKES.map((name) => makesByFold.get(fold(name))).filter(
    (make): make is CarMake => Boolean(make),
  );
  const pinnedNames = new Set(pinned.map((make) => make.name));
  const rest = catalogMakes.filter((make) => !pinnedNames.has(make.name));
  return [...pinned, ...rest];
}

export function modelsForMake(makeName: string) {
  return findMake(makeName)?.models ?? [];
}
