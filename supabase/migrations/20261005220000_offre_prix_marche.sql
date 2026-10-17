alter table public.offres
  add column prix_marche integer;

drop function public.creer_offre(text, uuid, text, integer, integer, integer, text, text, jsonb);

create function public.creer_offre(
  clef text,
  demande_id uuid,
  vehicle text,
  year integer,
  mileage integer,
  price integer,
  place text,
  comment text,
  criteres jsonb,
  prix_marche integer
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

  if criteres is null or jsonb_typeof(criteres) <> 'array' then
    raise exception 'criteres invalides' using errcode = '22023';
  end if;

  if prix_marche is not null and (prix_marche <= 0 or prix_marche > 9999999) then
    raise exception 'prix du marche invalide' using errcode = '22023';
  end if;

  select access_token, contact_name, contact_email
  into token, nom, email
  from public.demandes
  where id = demande_id;

  if token is null then
    raise exception 'demande introuvable' using errcode = 'P0002';
  end if;

  insert into public.offres (id, demande_id, vehicle, year, mileage, price, place, comment, criteres, prix_marche)
  values (
    offre_id,
    demande_id,
    btrim(vehicle),
    year,
    mileage,
    price,
    coalesce(btrim(place), ''),
    coalesce(btrim(comment), ''),
    criteres,
    prix_marche
  );

  return json_build_object(
    'id', offre_id,
    'access_token', token,
    'contact_name', nom,
    'contact_email', email
  );
end;
$$;

revoke all on function public.creer_offre(text, uuid, text, integer, integer, integer, text, text, jsonb, integer) from public, anon, authenticated;
grant execute on function public.creer_offre(text, uuid, text, integer, integer, integer, text, text, jsonb, integer) to anon;

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
          'client_note', o.client_note,
          'criteres', o.criteres,
          'images', o.images,
          'dommages', o.dommages,
          'prix_marche', o.prix_marche
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
