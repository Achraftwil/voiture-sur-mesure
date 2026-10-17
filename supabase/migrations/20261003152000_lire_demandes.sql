create schema if not exists interne;

revoke all on schema interne from public, anon, authenticated;

create table interne.demandes_access (
  id integer primary key,
  secret text not null,
  constraint demandes_access_singleton check (id = 1)
);

revoke all on table interne.demandes_access from public, anon, authenticated;

create or replace function public.lire_demandes(clef text)
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
