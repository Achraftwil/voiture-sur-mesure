create table public.demandes (
  id uuid primary key,
  created_at timestamptz not null default now(),
  brand text not null default '',
  model text not null default '',
  origin text not null default '',
  condition text not null default '',
  year_from smallint,
  year_to smallint,
  mileage_max integer,
  fuel text not null default '',
  gearbox text not null default '',
  budget integer not null,
  deadline text not null,
  pickup_area text not null default '',
  comment text not null default '',
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  constraint demandes_budget_positive check (budget > 0),
  constraint demandes_deadline_known check (
    deadline in ('des-que-possible', '2-semaines', '1-mois', '3-mois', 'pas-presse')
  ),
  constraint demandes_name_present check (char_length(btrim(contact_name)) >= 2),
  constraint demandes_phone_present check (
    char_length(regexp_replace(contact_phone, '\D', '', 'g')) between 10 and 15
  ),
  constraint demandes_email_shape check (
    contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

comment on table public.demandes is 'Recherches de voitures d''occasion envoyées par les clients.';

create index demandes_created_at_idx on public.demandes (created_at desc);

alter table public.demandes enable row level security;

revoke all on table public.demandes from anon, authenticated;
grant insert on table public.demandes to anon;

create policy "Le site peut enregistrer une recherche"
  on public.demandes
  for insert
  to anon
  with check (
    budget > 0
    and deadline in ('des-que-possible', '2-semaines', '1-mois', '3-mois', 'pas-presse')
    and char_length(btrim(contact_name)) >= 2
    and char_length(regexp_replace(contact_phone, '\D', '', 'g')) between 10 and 15
    and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );
