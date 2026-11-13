-- =====================================================================
-- HaqqReason — Migration 009 : recherche par le sens
-- À exécuter UNE SEULE FOIS dans Supabase : SQL Editor > New query > Run.
--
-- Chaque article est découpé en morceaux ; chaque morceau est transformé
-- en une liste de nombres (« vecteur ») par un service d'intelligence
-- artificielle. Comparer deux vecteurs revient à comparer deux sens :
-- « les preuves que Muhammad était prophète » retrouve alors un article
-- intitulé « Les signes de la prophétie », sans aucun mot en commun.
--
-- Les vecteurs sont stockés en tableaux de nombres ordinaires (real[]) et
-- comparés par une petite fonction SQL : aucune extension à installer, et
-- la base reste lisible et sauvegardable comme le reste. Pour une
-- bibliothèque personnelle (quelques centaines à quelques milliers
-- d'articles), c'est largement assez rapide.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les vecteurs, un par morceau d'article
-- ---------------------------------------------------------------------
create table public.vecteurs_articles (
  article_id  uuid not null references public.articles(id) on delete cascade,
  morceau     smallint not null check (morceau >= 0 and morceau < 64),
  -- Le texte réellement envoyé au service : sert à l'extrait et au contrôle.
  texte       text not null,
  vecteur     real[] not null check (array_length(vecteur, 1) between 8 and 3072),
  -- Modèle et empreinte du texte : permettent de ne recalculer que l'utile.
  modele      text not null,
  empreinte   text not null check (empreinte ~ '^[0-9a-f]{64}$'),
  updated_at  timestamptz not null default now(),
  primary key (article_id, morceau)
);

create index vecteurs_articles_article on public.vecteurs_articles (article_id);

alter table public.vecteurs_articles enable row level security;

-- Le public n'a aucun besoin de lire les vecteurs : la recherche passe par
-- une fonction, qui ne renvoie que des articles visibles.
revoke all on table public.vecteurs_articles from anon, authenticated;
grant all on table public.vecteurs_articles to service_role;

comment on table public.vecteurs_articles is
  'Représentation numérique du sens de chaque morceau d''article, pour la recherche par le sens. Écriture et lecture réservées au serveur.';

-- ---------------------------------------------------------------------
-- 2. Comparaison de deux vecteurs
--    Les vecteurs sont normalisés (longueur 1) avant d'être enregistrés :
--    le produit scalaire vaut alors exactement le cosinus, entre -1 et 1.
-- ---------------------------------------------------------------------
create function public.similarite(a real[], b real[]) returns real
language sql immutable parallel safe
set search_path = ''
as $$
  select case
    when array_length(a, 1) is distinct from array_length(b, 1) then 0::real
    else coalesce((select sum(x::double precision * y::double precision) from unnest(a, b) as t(x, y)), 0)::real
  end;
$$;

comment on function public.similarite(real[], real[]) is
  'Proximité de sens entre deux vecteurs normalisés : 1 = même sens, 0 = sans rapport.';

-- ---------------------------------------------------------------------
-- 3. La recherche elle-même
--    Exécutée avec les droits de l'appelant : le public ne peut pas
--    remonter un brouillon ni un article à la corbeille, exactement
--    comme pour la recherche par mots.
-- ---------------------------------------------------------------------
create function public.rechercher_sens(
  p_vecteur real[],
  p_limite  integer default 8,
  p_minimum real default 0.2
)
returns table (id uuid, titre text, resume text, score real, extrait text)
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with meilleurs as (
    select v.article_id,
           public.similarite(p_vecteur, v.vecteur) as score,
           v.texte,
           row_number() over (partition by v.article_id order by public.similarite(p_vecteur, v.vecteur) desc) as rang
    from public.vecteurs_articles v
    join public.articles a on a.id = v.article_id
  )
  select a.id,
         a.titre,
         a.resume,
         m.score,
         left(m.texte, 300) as extrait
  from meilleurs m
  join public.articles a on a.id = m.article_id
  where m.rang = 1
    and m.score >= coalesce(p_minimum, 0.2)
  order by m.score desc
  limit least(greatest(coalesce(p_limite, 8), 1), 50);
$$;

comment on function public.rechercher_sens(real[], integer, real) is
  'Articles les plus proches par le sens. Respecte les droits de l''appelant : un brouillon ne remonte jamais au public.';

grant execute on function public.similarite(real[], real[])                    to anon, authenticated, service_role;
grant execute on function public.rechercher_sens(real[], integer, real)         to anon, authenticated, service_role;

-- Le public doit pouvoir joindre la table pour que la fonction s'exécute
-- avec ses droits ; la politique ci-dessous ne lui laisse voir que les
-- vecteurs des articles qu'il a déjà le droit de lire.
create policy "vecteurs des articles visibles" on public.vecteurs_articles
  for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
grant select on table public.vecteurs_articles to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. État de l'indexation, pour la page Outils
-- ---------------------------------------------------------------------
create function public.etat_indexation()
returns table (articles_total bigint, articles_publies bigint, articles_indexes bigint, morceaux bigint)
language sql stable security definer
set search_path = ''
as $$
  -- Les brouillons sont indexés eux aussi : le créateur doit pouvoir les retrouver
  -- par le sens depuis son espace, alors que le public ne les voit jamais.
  select (select count(*) from public.articles where supprime_le is null),
         (select count(*) from public.articles where statut = 'publie' and supprime_le is null),
         (select count(distinct article_id) from public.vecteurs_articles),
         (select count(*) from public.vecteurs_articles);
$$;

revoke execute on function public.etat_indexation() from public, anon, authenticated;
grant  execute on function public.etat_indexation() to service_role;

-- ---------------------------------------------------------------------
-- 5. Nouveaux réglages
-- ---------------------------------------------------------------------
insert into public.reglages (cle, valeur) values
  ('recherche_sens', 'true'::jsonb)
on conflict (cle) do nothing;
