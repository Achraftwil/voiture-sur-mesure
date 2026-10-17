"use client";

import { useState, useTransition } from "react";
import { setDemandeStatut } from "@/app/demandes/actions";
import { STATUTS, statutOf, type Statut } from "@/lib/statuts";

export function StatutControl({ id, statut, name }: { id: string; statut: string; name: string }) {
  const current = statutOf(statut);
  const [value, setValue] = useState<Statut>(current.value);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const tone = statutOf(value);

  function onChange(next: string) {
    const statut = STATUTS.find((item) => item.value === next);
    if (!statut) return;
    const previous = value;
    setValue(statut.value);
    setError("");
    startTransition(async () => {
      const result = await setDemandeStatut(id, statut.value);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-3">
      <label className="block text-sm text-[#5f5a52]" htmlFor={`statut-${id}`}>
        Statut
      </label>
      <select
        id={`statut-${id}`}
        value={value}
        disabled={pending}
        aria-label={`Statut de ${name}`}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-10 border px-3 text-sm font-medium outline-none disabled:opacity-70 ${tone.chip}`}
      >
        {STATUTS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-sm text-[#8a3a2a]">{error}</p> : null}
    </div>
  );
}
