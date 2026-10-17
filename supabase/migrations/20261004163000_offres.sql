alter table public.demandes
  add column access_token text;

update public.demandes
set access_token = encode(extensions.gen_random_bytes(24), 'hex')
where access_token is null;

alter table public.demandes
  alter column access_token set not null;

alter table public.demandes
  alter column access_token set default encode(extensions.gen_random_bytes(24), 'hex');

create unique index demandes_access_token_key on public.demandes (access_token);

create table public.offres (
  id uuid primary key,
  demande_id uuid not null references public.demandes (id) on delete cascade,
  created_at timestamptz not null default now(),
  vehicle text not null,
  year smallint,
  mileage integer,
  price integer not null,
  place text not null default '',
  comment text not null default '',
  choice text not null default 'en-attente',
  client_note text not null default '',
  emailed_at timestamptz,
  constraint offres_price_positive check (price > 0),
  constraint offres_choice_known check (choice in ('en-attente', 'retenue', 'refusee'))
);

create index offres_demande_id_idx on public.offres (demande_id, created_at desc);

revoke all on table public.offres from anon, authenticated;

create or replace function public.creer_offre(
  clef text,
  demande_id uuid,
  vehicle text,
  year integer,
  mileage integer,
  price integer,
  place text,
  comment text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendu text;
  offre_id uuid := gen_random_uuid();
  token text;
  nom text;
  email text;
begin
  select secret into attendu from interne.demandes_access where id = 1;
  if attendu is null or clef is distinct from attendu then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  if char_length(btrim(vehicle)) < 2 or price is null or price <= 0 then
    raise exception 'offre incomplete' using errcode = '22023';
  end if;

  select access_token, contact_name, contact_email
  into token, nom, email
  from public.demandes
  where id = demande_id;

  if token is null then
    raise exception 'demande introuvable' using errcode = 'P0002';
  end if;

  insert into public.offres (id, demande_id, vehicle, year, mileage, price, place, comment)
  values (
    offre_id,
    demande_id,
    btrim(vehicle),
    year,
    mileage,
    price,
    coalesce(btrim(place), ''),
    coalesce(btrim(comment), '')
  );

  return json_build_object(
    'id', offre_id,
    'access_token', token,
    'contact_name', nom,
    'contact_email', email
  );
end;
$$;

create or replace function public.marquer_offre_envoyee(clef text, offre_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendu text;
  cible uuid;
begin
  select secret into attendu from interne.demandes_access where id = 1;
  if attendu is null or clef is distinct from attendu then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  update public.offres
  set emailed_at = now()
  where id = offre_id
  returning demande_id into cible;

  if cible is null then
    raise exception 'offre introuvable' using errcode = 'P0002';
  end if;

  update public.demandes
  set statut = 'offres-envoyees'
  where id = cible;
end;
$$;

create or replace function public.lire_offres(clef text)
returns setof public.offres
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendu text;
begin
  select secret into attendu from interne.demandes_access where id = 1;
  if attendu is null or clef is distinct from attendu then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  return query
    select *
    from public.offres
    order by created_at desc;
end;
$$;

create or replace function public.lire_suivi(token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultat json;
begin
  select json_build_object(
    'contact_name', d.contact_name,
    'brand', d.brand,
    'model', d.model,
    'budget', d.budget,
    'deadline', d.deadline,
    'offres', coalesce((
      select json_agg(
        json_build_object(
          'id', o.id,
          'created_at', o.created_at,
          'vehicle', o.vehicle,
          'year', o.year,
          'mileage', o.mileage,
          'price', o.price,
          'place', o.place,
          'comment', o.comment,
          'choice', o.choice,
          'client_note', o.client_note
        )
        order by o.created_at desc
      )
      from public.offres o
      where o.demande_id = d.id
    ), '[]'::json)
  )
  into resultat
  from public.demandes d
  where d.access_token = token;

  if resultat is null then
    raise exception 'lien invalide' using errcode = '42501';
  end if;

  return resultat;
end;
$$;

create or replace function public.choisir_offre(
  token text,
  offre_id uuid,
  choix text,
  message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cible uuid;
begin
  if choix not in ('retenue', 'refusee') then
    raise exception 'choix inconnu' using errcode = '22023';
  end if;

  update public.offres o
  set
    choice = choix,
    client_note = left(btrim(coalesce(message, '')), 2000)
  from public.demandes d
  where o.id = offre_id
    and o.demande_id = d.id
    and d.access_token = token
  returning o.demande_id into cible;

  if cible is null then
    raise exception 'lien invalide' using errcode = '42501';
  end if;

  update public.demandes
  set statut = 'en-discussion'
  where id = cible;
end;
$$;

revoke all on function public.creer_offre(text, uuid, text, integer, integer, integer, text, text) from public, anon, authenticated;
grant execute on function public.creer_offre(text, uuid, text, integer, integer, integer, text, text) to anon;

revoke all on function public.marquer_offre_envoyee(text, uuid) from public, anon, authenticated;
grant execute on function public.marquer_offre_envoyee(text, uuid) to anon;

revoke all on function public.lire_offres(text) from public, anon, authenticated;
grant execute on function public.lire_offres(text) to anon;

revoke all on function public.lire_suivi(text) from public, anon, authenticated;
grant execute on function public.lire_suivi(text) to anon;

revoke all on function public.choisir_offre(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.choisir_offre(text, uuid, text, text) to anon;

drop function public.lire_demandes(text);

create function public.lire_demandes(clef text)
returns setof public.demandes
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendu text;
begin
  select secret into attendu from interne.demandes_access where id = 1;
  if attendu is null or clef is distinct from attendu then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  return query
    select *
    from public.demandes
    order by created_at desc;
end;
$$;

revoke all on function public.lire_demandes(text) from public, anon, authenticated;
grant execute on function public.lire_demandes(text) to anon;
