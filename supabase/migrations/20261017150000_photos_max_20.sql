do $$
declare
  def text;
  nom text;
begin
  foreach nom in array array['ajouter_images_offre', 'ajouter_dommages_offre']
  loop
    select pg_get_functiondef(p.oid) into def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = nom;

    def := replace(def, '> 12 then', '> 20 then');
    execute def;
  end loop;
end $$;
