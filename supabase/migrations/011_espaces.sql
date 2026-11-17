-- =====================================================================
-- 011 · Espaces : « Les preuves » et « L'Islam authentique »
-- Chaque bloc appartient à un espace. Les blocs existants restent dans
-- « preuves » ; un nouveau bloc accueille « L'Islam authentique »
-- (vidéos qui expliquent l'islam selon le Coran, la Sunna et la
-- compréhension des pieux prédécesseurs).
-- Le script peut être relancé sans risque.
-- =====================================================================

alter table public.blocs
  add column if not exists espace text not null default 'preuves';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'blocs_espace_check') then
    alter table public.blocs add constraint blocs_espace_check check (espace in ('preuves', 'islam'));
  end if;
end $$;

create index if not exists blocs_espace_ordre on public.blocs (espace, ordre);

-- « L'Islam authentique » n'a qu'un bloc, invisible pour le lecteur : le créateur y range
-- directement ses catégories (voir 012).
insert into public.blocs (slug, titre, description, accent, ordre, espace) values
  ('islam-authentique', 'L''Islam authentique',
   'Des vidéos qui expliquent l''islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.', 'or', 1, 'islam')
on conflict (slug) do nothing;
