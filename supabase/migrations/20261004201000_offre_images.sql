alter table public.offres
  add column images jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offre-photos',
  'offre-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "lecture_photos_offres"
on storage.objects
for select
to public
using (bucket_id = 'offre-photos');

create policy "depot_photos_offres"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'offre-photos'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
);

create policy "suppression_photos_offres"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'offre-photos');

create function public.ajouter_images_offre(
  clef text,
  offre_id uuid,
  nouvelles jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendu text;
  ajoutees jsonb;
begin
  select secret into attendu from interne.demandes_access where id = 1;
  if attendu is null or clef is distinct from attendu then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  if nouvelles is null or jsonb_typeof(nouvelles) <> 'array' or jsonb_array_length(nouvelles) < 1 then
    raise exception 'images invalides' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(nouvelles) as elem
    where jsonb_typeof(elem) <> 'object'
      or coalesce(elem->>'chemin', '') !~ ('^' || offre_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
      or char_length(coalesce(elem->>'legende', '')) > 80
  ) then
    raise exception 'images invalides' using errcode = '22023';
  end if;

  if (
    select coalesce(jsonb_array_length(images), 0) + jsonb_array_length(nouvelles)
    from public.offres
    where id = offre_id
  ) > 12 then
    raise exception 'trop de photos' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'chemin', elem->>'chemin',
      'legende', btrim(coalesce(elem->>'legende', ''))
    )
    order by ord
  ), '[]'::jsonb)
  into ajoutees
  from jsonb_array_elements(nouvelles) with ordinality as t(elem, ord);

  update public.offres
  set images = images || ajoutees
  where id = offre_id;

  if not found then
    raise exception 'offre introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.ajouter_images_offre(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ajouter_images_offre(text, uuid, jsonb) to anon;

create function public.retirer_image_offre(
  clef text,
  offre_id uuid,
  chemin text
)
returns void
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

  if chemin !~ ('^' || offre_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
    raise exception 'images invalides' using errcode = '22023';
  end if;

  update public.offres
  set images = coalesce((
    select jsonb_agg(elem order by ord)
    from jsonb_array_elements(images) with ordinality as t(elem, ord)
    where elem->>'chemin' is distinct from chemin
  ), '[]'::jsonb)
  where id = offre_id;

  if not found then
    raise exception 'offre introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.retirer_image_offre(text, uuid, text) from public, anon, authenticated;
grant execute on function public.retirer_image_offre(text, uuid, text) to anon;

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
          'images', o.images
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
