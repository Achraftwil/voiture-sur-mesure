alter table public.demandes
  add column statut text not null default 'nouvelle';

alter table public.demandes
  add constraint demandes_statut_known check (
    statut in (
      'nouvelle',
      'en-recherche',
      'offres-envoyees',
      'en-discussion',
      'conclue',
      'sans-suite'
    )
  );

create index demandes_statut_idx on public.demandes (statut);

create or replace function public.definir_statut(clef text, demande_id uuid, nouveau text)
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

  if nouveau not in (
    'nouvelle',
    'en-recherche',
    'offres-envoyees',
    'en-discussion',
    'conclue',
    'sans-suite'
  ) then
    raise exception 'statut inconnu' using errcode = '22023';
  end if;

  update public.demandes
  set statut = nouveau
  where id = demande_id;

  if not found then
    raise exception 'demande introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.definir_statut(text, uuid, text) from public, anon, authenticated;
grant execute on function public.definir_statut(text, uuid, text) to anon;

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
