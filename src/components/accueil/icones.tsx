import type { ReactNode } from "react";

const traits = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6.5" width="18" height="12" rx="2" />
      <path d="M3 10.5h18" />
      <path d="M16 14.5h2" />
    </>
  ),
  euro: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M15.2 9.4c-.6-.8-1.6-1.3-2.8-1.3-2 0-3.2 1.2-3.2 2.8 0 2.5 6 1.1 6 3.5 0 1.4-1.2 2.6-3.2 2.6-1.3 0-2.3-.5-2.9-1.3" />
      <path d="M8.8 12h6" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3.5 10.5 12 4.5l8.5 6" />
      <path d="M6 10.2V19h12v-8.8" />
      <path d="M10 19v-4.5h4V19" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4.5 10.2v3.6h2.8l6.2 3.6V6.6l-6.2 3.6H4.5Z" />
      <path d="M16.2 9.2a3.4 3.4 0 0 1 0 5.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="2.6" />
      <circle cx="16.2" cy="9.2" r="2.1" />
      <path d="M4.2 18.2c.6-2.4 2.5-3.7 4.8-3.7s4.2 1.3 4.8 3.7" />
      <path d="M13.6 14.7c1.6-.3 3.3.3 4.3 1.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2V12l2.8 1.8" />
    </>
  ),
  check: <path d="M5 12.5 9.4 16.8 19 7.2" />,
  file: (
    <>
      <path d="M7 3.5h7.2L19 8.2V20.5H7Z" />
      <path d="M14 3.5v5h5" />
      <path d="M9.5 13h5.5M9.5 16.5h3.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6.2v5.6c0 3.9-2.6 6.7-7 7.9-4.4-1.2-7-4-7-7.9V6.2Z" />
      <path d="M8.8 12.1 11 14.3 15.4 9.8" />
    </>
  ),
  car: (
    <>
      <path d="M4.5 14.5h15l-1.1-3.1a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.2Z" />
      <path d="M8 10.1 9.7 7.2h4.6L16 10.1" />
      <circle cx="8" cy="16.2" r="1.4" />
      <circle cx="16" cy="16.2" r="1.4" />
    </>
  ),
  truck: (
    <>
      <path d="M3.5 8.5h10v8h-10Z" />
      <path d="M13.5 11h3.2l2.8 3v2.5h-6" />
      <circle cx="7" cy="16.8" r="1.3" />
      <circle cx="16.2" cy="16.8" r="1.3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 20.5s6.2-5.4 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.6 6.2 10 6.2 10Z" />
      <circle cx="12" cy="10.4" r="1.8" />
    </>
  ),
  menu: (
    <>
      <path d="M4.5 7.5h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 16.5h15" />
    </>
  ),
  close: (
    <>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomIcone = keyof typeof traits;

export function Icone({ nom, className = "h-5 w-5" }: { nom: NomIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {traits[nom]}
    </svg>
  );
}
