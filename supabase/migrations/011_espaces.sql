-- =====================================================================
-- 011 · Espaces : « Les preuves » et « L'Islam authentique »
-- Chaque bloc appartient à un espace. Les blocs existants restent dans
-- « preuves » ; trois nouveaux blocs ouvrent « L'Islam authentique »
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

insert into public.blocs (slug, titre, description, accent, ordre, espace) values
  ('la-croyance', 'La croyance',
   'Les fondements de la foi : l''unicité d''Allah, Ses noms et attributs, les anges, les Livres, les messagers, le Jour dernier et le destin.', 'or', 1, 'islam'),
  ('les-actes-d-adoration', 'Les actes d''adoration',
   'La purification, la prière, la zakât, le jeûne, le pèlerinage et les invocations, tels que le Prophète ﷺ les a enseignés.', 'emeraude', 2, 'islam'),
  ('la-voie-des-pieux-predecesseurs', 'La voie des pieux prédécesseurs',
   'Le comportement, la purification de l''âme et la méthode des Compagnons et de ceux qui les ont suivis dans le bien.', 'amethyste', 3, 'islam')
on conflict (slug) do nothing;
