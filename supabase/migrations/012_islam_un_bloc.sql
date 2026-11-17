-- =====================================================================
-- 012 · « L'Islam authentique » sans blocs prédéfinis
-- Les trois blocs créés par la première version de 011 sont retirés
-- (seulement s'ils sont vides) ; un seul bloc, invisible pour le lecteur,
-- accueille les catégories que le créateur crée lui-même.
-- Le script peut être relancé sans risque.
-- =====================================================================

delete from public.blocs b
where b.slug in ('la-croyance', 'les-actes-d-adoration', 'la-voie-des-pieux-predecesseurs')
  and b.espace = 'islam'
  and not exists (select 1 from public.categories c where c.bloc_id = b.id)
  and not exists (select 1 from public.articles a where a.bloc_id = b.id);

insert into public.blocs (slug, titre, description, accent, ordre, espace) values
  ('islam-authentique', 'L''Islam authentique',
   'Des vidéos qui expliquent l''islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.', 'or', 1, 'islam')
on conflict (slug) do nothing;
