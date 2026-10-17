import { writeFileSync } from "node:fs";

function isUsableModelName(name) {
  if (!name || name.length > 28) return false;
  if (/[^\p{L}\p{N}\s.'’+\-/&]/u.test(name)) return false;
  if (/(hybr|blueh|talla|nuevo)$/i.test(name)) return false;
  if (/\b(nuevo|blueh|hybr|talla|átalla|clase)\b/i.test(name)) return false;
  const last = name.split(" ").pop() ?? "";
  if (/\s/.test(name) && last.length <= 3 && /[a-z]/.test(last) && !/^[ivx]+$/i.test(last)) return false;
  return true;
}

const sourceUrl = "https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/dist/vehicles.json";
const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Téléchargement impossible (${response.status})`);
}

const data = await response.json();
const makes = [];

for (const make of data.makes ?? []) {
  const seen = new Set();
  const models = [];
  for (const model of make.models ?? []) {
    if (model.kind !== "car") continue;
    const name = String(model.name ?? "").trim();
    if (!isUsableModelName(name)) continue;
    const key = name.toLocaleLowerCase("fr");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    models.push({
      name,
      rank: typeof model.global_decile === "number" ? model.global_decile : 99,
    });
  }
  if (!models.length) continue;
  models.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "fr"));
  makes.push({ name: String(make.name).trim(), models });
}

makes.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

const catalog = {
  source: "VehiclesDB",
  version: data.version ?? null,
  license: "CC-BY-4.0",
  makes,
};

writeFileSync(new URL("../src/data/cars.json", import.meta.url), JSON.stringify(catalog));
console.log(`${makes.length} marques, ${makes.reduce((sum, make) => sum + make.models.length, 0)} modèles`);
