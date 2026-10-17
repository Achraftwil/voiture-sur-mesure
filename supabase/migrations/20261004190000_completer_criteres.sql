create or replace function public.completer_criteres(
  clef text,
  offre_id uuid,
  criteres jsonb
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

  if criteres is null or jsonb_typeof(criteres) <> 'array' then
    raise exception 'criteres invalides' using errcode = '22023';
  end if;

  update public.offres
  set criteres = completer_criteres.criteres
  where id = offre_id;

  if not found then
    raise exception 'offre introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.completer_criteres(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.completer_criteres(text, uuid, jsonb) to anon;
