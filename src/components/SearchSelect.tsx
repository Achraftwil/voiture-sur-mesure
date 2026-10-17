"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fold } from "@/lib/vehicles";

export type SelectOption = { value: string; label: string };

const VISIBLE_LIMIT = 80;

type SearchSelectProps = {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  searchPlaceholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  allowCustom?: boolean;
};

export function SearchSelect({
  id,
  label,
  hint,
  placeholder,
  searchPlaceholder,
  value,
  options,
  onChange,
  disabled = false,
  allowCustom = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const valueId = useId();
  const listId = useId();

  const filtered = filterOptions(options, query);
  const shown = filtered.slice(0, VISIBLE_LIMIT);
  const hiddenCount = filtered.length - shown.length;
  const trimmed = query.trim();
  const hasExactMatch = filtered.some(
    (option) => fold(option.label) === fold(trimmed) || fold(option.value) === fold(trimmed),
  );
  const showCustom = allowCustom && trimmed.length >= 2 && !hasExactMatch;
  const selectableCount = shown.length + (showCustom ? 1 : 0);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector('[data-active="true"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(next: string) {
    onChange(next);
    close();
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(selectableCount - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (showCustom && active === shown.length) {
        choose(trimmed);
        return;
      }
      if (shown[active]) choose(shown[active].value);
    }
  }

  const selected = options.find((option) => option.value === value);
  const display = selected?.label || value;

  return (
    <div ref={rootRef} className="relative">
      <span id={labelId} className="mb-1.5 block text-[15px] font-medium text-[#1a1a1a]">
        {label}
      </span>
      {hint ? <p className="mb-2 text-sm leading-5 text-[#5c5c5c]">{hint}</p> : null}
      <div
        className={`flex h-12 items-stretch rounded-xl border bg-white ${
          disabled ? "border-[#ececec] bg-[#f4f4f4]" : "border-[#d9d9d9]"
        } ${open ? "border-[#ff5000] ring-2 ring-[#ff5000]/20" : ""}`}
      >
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (disabled) return;
            setOpen((current) => !current);
            setQuery("");
          }}
          className="flex min-w-0 flex-1 items-center px-3 text-left text-[15px] outline-none disabled:cursor-not-allowed disabled:text-[#8a8a8a]"
        >
          <span id={valueId} className={`truncate ${display ? "text-[#1a1a1a]" : "text-[#8a8a8a]"}`}>
            {display || placeholder}
          </span>
        </button>
        {value && !disabled ? (
          <button
            type="button"
            aria-label={`Effacer ${label.toLowerCase()}`}
            onClick={() => {
              onChange("");
              close();
            }}
            className="px-3 text-sm text-[#5c5c5c] hover:text-[#1a1a1a]"
          >
            Effacer
          </button>
        ) : (
          <span className="pointer-events-none flex items-center pr-3 text-[#5c5c5c]" aria-hidden>
            <Chevron />
          </span>
        )}
      </div>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#d9d9d9] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <input
            autoFocus
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            spellCheck={false}
            autoComplete="off"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            className="w-full border-b border-[#ececec] px-3 py-3 text-[15px] outline-none placeholder:text-[#8a8a8a]"
          />
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 && !showCustom ? (
              <li className="px-3 py-3 text-sm text-[#5c5c5c]">Aucun résultat pour « {trimmed} ».</li>
            ) : null}
            {shown.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === active;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={isActive ? "true" : "false"}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option.value)}
                    className={`w-full px-3 py-2.5 text-left text-[15px] ${
                      isSelected
                        ? "bg-[#fff4ee] font-medium text-[#ff5000]"
                        : isActive
                          ? "bg-[#f6f6f6] text-[#1a1a1a]"
                          : "text-[#1a1a1a]"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
            {showCustom ? (
              <li role="presentation">
                <button
                  type="button"
                  data-active={active === shown.length ? "true" : "false"}
                  onMouseEnter={() => setActive(shown.length)}
                  onClick={() => choose(trimmed)}
                  className={`w-full px-3 py-2.5 text-left text-[15px] ${
                    active === shown.length ? "bg-[#f6f6f6]" : ""
                  }`}
                >
                  Utiliser « {trimmed} »
                </button>
              </li>
            ) : null}
            {hiddenCount > 0 ? (
              <li className="px-3 py-2 text-sm text-[#5c5c5c]">
                {hiddenCount.toLocaleString("fr-FR")}{" "}
                {hiddenCount > 1 ? "autres" : "autre"} — précisez la recherche.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function filterOptions(options: SelectOption[], query: string) {
  const needle = fold(query);
  const matched = !needle
    ? [...options]
    : options
        .filter((option) => fold(option.label).includes(needle) || fold(option.value).includes(needle))
        .sort((a, b) => {
          const aStarts = fold(a.label).startsWith(needle) ? 0 : 1;
          const bStarts = fold(b.label).startsWith(needle) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return a.label.localeCompare(b.label, "fr");
        });
  const anyIndex = matched.findIndex((option) => option.value === "Peu importe");
  if (anyIndex > 0) {
    const [anyOption] = matched.splice(anyIndex, 1);
    matched.unshift(anyOption);
  }
  return matched;
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
