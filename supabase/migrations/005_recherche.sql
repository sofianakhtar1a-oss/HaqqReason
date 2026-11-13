-- =====================================================================
-- HaqqReason — Migration 005 : recherche avancée
-- (français et arabe, tolérance aux fautes, synonymes, filtres)
-- À exécuter UNE SEULE FOIS, après 004_fichiers.sql :
-- Supabase > SQL Editor > New query > coller ce fichier > Run.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Normalisation : sans accents, sans majuscules, et pour l'arabe sans voyelles
--    (harakat), sans tatweel, avec les variantes de lettres unifiées
--    (alif, ya, ta marbuta, hamza portée).
-- ---------------------------------------------------------------------
create function public.normaliser(p_texte text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select lower(
    translate(
      regexp_replace(
        extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_texte, '')),
        '[ؐ-ًؚ-ٰٟـۖ-ۭ]', '', 'g'
      ),
      'أإآٱىةؤئ', 'اااايهوي'
    )
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Colonnes de recherche des articles
--    (étiquettes et textes par type de bloc, remplis par l'application à chaque enregistrement)
-- ---------------------------------------------------------------------
alter table public.articles
  add column etiquettes_texte text not null default '',
  add column texte_versets    text not null default '',
  add column texte_hadiths    text not null default '',
  add column texte_objections text not null default '';

alter table public.articles add column recherche tsvector generated always as (
  setweight(to_tsvector('french', public.normaliser(titre)), 'A') ||
  setweight(to_tsvector('french', public.normaliser(etiquettes_texte)), 'A') ||
  setweight(to_tsvector('french', public.normaliser(resume)), 'B') ||
  setweight(to_tsvector('french', public.normaliser(contenu_texte)), 'C')
) stored;

-- Texte court (titre, étiquettes, résumé) pour les résultats approchants (fautes de frappe).
alter table public.articles add column recherche_court text generated always as (
  public.normaliser(titre || ' ' || etiquettes_texte || ' ' || resume)
) stored;

create index articles_recherche_idx on public.articles using gin (recherche);
create index articles_recherche_court_idx on public.articles using gin (recherche_court extensions.gin_trgm_ops);

alter table public.categories add column recherche tsvector generated always as (
  setweight(to_tsvector('french', public.normaliser(titre)), 'A') ||
  setweight(to_tsvector('french', public.normaliser(description)), 'B')
) stored;
create index categories_recherche_idx on public.categories using gin (recherche);

alter table public.fichiers add column recherche tsvector generated always as (
  setweight(to_tsvector('french', public.normaliser(nom)), 'A')
) stored;
create index fichiers_recherche_idx on public.fichiers using gin (recherche);

alter table public.pages_fichiers add column recherche tsvector generated always as (
  to_tsvector('french', public.normaliser(texte))
) stored;
create index pages_fichiers_recherche_idx on public.pages_fichiers using gin (recherche);

-- ---------------------------------------------------------------------
-- 3. Synonymes gérés par le créateur (« Trinité », « trinitaire », « trois personnes »…)
-- ---------------------------------------------------------------------
create table public.synonymes (
  id         uuid primary key default gen_random_uuid(),
  termes     text[] not null check (cardinality(termes) between 2 and 20),
  created_at timestamptz not null default now()
);
alter table public.synonymes enable row level security;
revoke all on public.synonymes from public, anon, authenticated;
grant all on public.synonymes to service_role;

-- Règles de réécriture : chaque terme d'un groupe est remplacé par « l'un des termes du groupe ».
create function public.regles_synonymes() returns table (cible tsquery, substitut tsquery)
language plpgsql stable security definer set search_path = '' as $$
declare
  groupe record;
  terme text;
  q tsquery;
  ou tsquery;
begin
  for groupe in select s.termes from public.synonymes s loop
    ou := null;
    foreach terme in array groupe.termes loop
      q := phraseto_tsquery('french', public.normaliser(terme));
      if numnode(q) > 0 then
        ou := case when ou is null then q else ou || q end;
      end if;
    end loop;
    if ou is null then continue; end if;
    foreach terme in array groupe.termes loop
      q := phraseto_tsquery('french', public.normaliser(terme));
      if numnode(q) > 0 then
        cible := q;
        substitut := ou;
        return next;
      end if;
    end loop;
  end loop;
end $$;

create function public.appliquer_synonymes(p_requete tsquery) returns tsquery
language sql stable security definer set search_path = '' as $$
  select coalesce(ts_rewrite(p_requete, 'select cible, substitut from public.regles_synonymes()'), p_requete);
$$;

-- ---------------------------------------------------------------------
-- 4. Outils pour les résultats
-- ---------------------------------------------------------------------

-- Fenêtre du texte d'origine autour du premier mot cherché (l'extrait est mis en forme par l'application).
create function public.fenetre_texte(p_texte text, p_mots text[]) returns text
language plpgsql immutable set search_path = '' as $$
declare
  normalise text := public.normaliser(p_texte);
  mot text;
  pos integer;
  meilleure integer := 0;
begin
  if p_texte is null or p_texte = '' then return ''; end if;
  foreach mot in array coalesce(p_mots, '{}') loop
    if char_length(mot) >= 2 then
      pos := strpos(normalise, left(mot, greatest(4, char_length(mot) - 2)));
      if pos > 0 and (meilleure = 0 or pos < meilleure) then meilleure := pos; end if;
    end if;
  end loop;
  if meilleure = 0 then return left(p_texte, 600); end if;
  return substr(p_texte, greatest(1, meilleure - 250), 1200);
end $$;

-- « Bloc › Catégorie › Sous-catégorie » pour une liste de catégories.
create function public.chemins_categories(p_categories uuid[])
returns table (categorie_id uuid, chemin text)
language sql stable security invoker set search_path = '' as $$
  select x.id,
         (select b.titre from public.blocs b join public.categories c0 on c0.bloc_id = b.id where c0.id = x.id)
         || ' › ' ||
         (select string_agg(a.titre, ' › ' order by a.niveau desc) from public.ancetres_categorie(x.id) a)
    from unnest(p_categories) as x(id);
$$;

-- ---------------------------------------------------------------------
-- 5. La recherche
--    « security invoker » : pour un lecteur, les règles RLS ne laissent passer que le contenu publié.
-- ---------------------------------------------------------------------
create function public.rechercher(
  p_requete    text,
  p_blocs      uuid[]  default null,
  p_categories uuid[]  default null,
  p_types      text[]  default null,
  p_etiquettes text[]  default null,
  p_depuis     date    default null,
  p_jusqua     date    default null,
  p_brouillons boolean default false,
  p_tri        text    default 'pertinence',
  p_limite     integer default 20,
  p_decalage   integer default 0
)
returns table (
  type text, id uuid, page integer, titre text, fenetre text,
  bloc_id uuid, categorie_id uuid, statut text, date timestamptz,
  score real, approchant boolean, total bigint
)
language plpgsql stable security invoker set search_path = '' as $$
declare
  texte_requete text := public.normaliser(left(coalesce(p_requete, ''), 200));
  q tsquery;
  mots text[];
  types text[] := coalesce(nullif(p_types, '{}'), array['article', 'document', 'dossier']);
  avec_articles boolean;
  sous_types boolean;
  filtre_lieu boolean := coalesce(cardinality(p_blocs), 0) + coalesce(cardinality(p_categories), 0) > 0;
  filtre_etiquettes boolean := coalesce(cardinality(p_etiquettes), 0) > 0;
begin
  -- « ou » entre deux mots devient l'opérateur OU ; « - » exclut un mot ; les guillemets cherchent une phrase exacte.
  texte_requete := regexp_replace(texte_requete, '\s+ou\s+', ' or ', 'g');
  if btrim(texte_requete) <> '' then
    q := public.appliquer_synonymes(websearch_to_tsquery('french', texte_requete));
    if numnode(q) = 0 then q := null; end if;
  end if;
  mots := array(
    select m from regexp_split_to_table(regexp_replace(texte_requete, '["()]', ' ', 'g'), '\s+') m
     where char_length(m) >= 2 and left(m, 1) <> '-' and m <> 'or'
  );
  avec_articles := 'article' = any(types);
  sous_types := types && array['verset', 'hadith', 'objection'];

  return query
  with
  articles_filtres as (
    select a.* from public.articles a
     where (avec_articles or sous_types)
       and a.supprime_le is null
       and public.chaine_active(a.categorie_id)
       and (p_brouillons or a.statut = 'publie')
       and (not filtre_lieu or a.bloc_id = any(coalesce(p_blocs, '{}')) or a.categorie_id = any(coalesce(p_categories, '{}')))
       and (p_depuis is null or a.updated_at >= p_depuis)
       and (p_jusqua is null or a.updated_at < p_jusqua + 1)
       and (not filtre_etiquettes or exists (
             select 1 from public.articles_etiquettes ae join public.etiquettes e on e.id = ae.etiquette_id
              where ae.article_id = a.id and e.cle = any(p_etiquettes)))
  ),
  exacts as (
    select case
             when avec_articles then 'article'
             when 'verset' = any(types) and to_tsvector('french', public.normaliser(a.texte_versets)) @@ q then 'verset'
             when 'hadith' = any(types) and to_tsvector('french', public.normaliser(a.texte_hadiths)) @@ q then 'hadith'
             else 'objection'
           end as type,
           a.id, null::integer as page, a.titre, a.bloc_id, a.categorie_id, a.statut, a.updated_at as date,
           (case when q is null then 0 else ts_rank_cd(a.recherche, q) end)::real as score, false as approchant
      from articles_filtres a
     where (q is null and avec_articles)
        or (avec_articles and q is not null and a.recherche @@ q)
        or (not avec_articles and q is not null and (
              ('verset' = any(types) and to_tsvector('french', public.normaliser(a.texte_versets)) @@ q)
           or ('hadith' = any(types) and to_tsvector('french', public.normaliser(a.texte_hadiths)) @@ q)
           or ('objection' = any(types) and to_tsvector('french', public.normaliser(a.texte_objections)) @@ q)))
  ),
  -- Aucun résultat exact : résultats approchants (fautes de frappe) sur le titre, les étiquettes et le résumé.
  proches as (
    select 'article'::text, a.id, null::integer, a.titre, a.bloc_id, a.categorie_id, a.statut, a.updated_at,
           extensions.word_similarity(texte_requete, a.recherche_court)::real, true
      from articles_filtres a
     where avec_articles and btrim(texte_requete) <> ''
       and not exists (select 1 from exacts)
       and extensions.word_similarity(texte_requete, a.recherche_court) >= 0.45
  ),
  -- Documents : nom du fichier et texte des pages (au plus 3 pages par document).
  documents as (
    select d.type, d.id, d.page, d.titre, d.bloc_id, d.categorie_id, 'publie'::text, d.date, d.score, false
      from (
        select case when p.numero is null then 'document' else 'page' end as type,
               f.id, p.numero as page, f.nom as titre,
               coalesce(c.bloc_id, a.bloc_id) as bloc_id,
               coalesce(f.categorie_id, a.categorie_id) as categorie_id,
               f.created_at as date,
               (case when q is null then 0
                     when p.numero is null then ts_rank_cd(f.recherche, q)
                     else ts_rank_cd(p.recherche, q) * 0.8 end)::real as score,
               row_number() over (partition by f.id order by case when q is null or p.numero is null then 0 else ts_rank_cd(p.recherche, q) end desc) as rang
          from public.fichiers f
          left join public.articles a on a.id = f.article_id
          left join public.categories c on c.id = f.categorie_id
          left join public.pages_fichiers p on p.fichier_id = f.id and q is not null and p.recherche @@ q
         where 'document' = any(types) and not filtre_etiquettes
           and f.etat = 'pret' and f.dans_liste
           and (f.article_id is null or (a.supprime_le is null and (p_brouillons or a.statut = 'publie')))
           and public.chaine_active(coalesce(f.categorie_id, a.categorie_id))
           and (p_brouillons or public.fichier_visible(f.id))
           and (not filtre_lieu or coalesce(c.bloc_id, a.bloc_id) = any(coalesce(p_blocs, '{}'))
                or coalesce(f.categorie_id, a.categorie_id) = any(coalesce(p_categories, '{}')))
           and (p_depuis is null or f.created_at >= p_depuis)
           and (p_jusqua is null or f.created_at < p_jusqua + 1)
           and (q is null or p.numero is not null or f.recherche @@ q)
      ) d
     where d.rang <= 3
  ),
  dossiers as (
    select 'dossier'::text, c.id, null::integer, c.titre, c.bloc_id, c.id, c.statut, c.updated_at,
           ts_rank_cd(c.recherche, q)::real, false
      from public.categories c
     where 'dossier' = any(types) and not filtre_etiquettes and q is not null
       and c.supprime_le is null
       and public.chaine_active(c.id)
       and (p_brouillons or c.statut = 'publie')
       and (not filtre_lieu or c.bloc_id = any(coalesce(p_blocs, '{}')) or c.id = any(coalesce(p_categories, '{}')))
       and (p_depuis is null or c.updated_at >= p_depuis)
       and (p_jusqua is null or c.updated_at < p_jusqua + 1)
       and c.recherche @@ q
  ),
  tous as (
    select * from exacts union all select * from proches union all select * from documents union all select * from dossiers
  ),
  -- Une page de résultats ; l'extrait n'est calculé que pour elle.
  selection as (
    select t.*, count(*) over () as total
      from tous t
     order by
       case when p_tri = 'date' then t.date end desc nulls last,
       case when p_tri = 'titre' then t.titre end asc,
       t.score desc, t.date desc
     limit greatest(1, least(coalesce(p_limite, 20), 100)) offset greatest(0, coalesce(p_decalage, 0))
  )
  select s.type, s.id, s.page, s.titre,
         case
           when s.type = 'article' then (select public.fenetre_texte(a.resume || E'\n' || a.contenu_texte, mots) from public.articles a where a.id = s.id)
           when s.type = 'verset' then (select public.fenetre_texte(a.texte_versets, mots) from public.articles a where a.id = s.id)
           when s.type = 'hadith' then (select public.fenetre_texte(a.texte_hadiths, mots) from public.articles a where a.id = s.id)
           when s.type = 'objection' then (select public.fenetre_texte(a.texte_objections, mots) from public.articles a where a.id = s.id)
           when s.type = 'page' then (select public.fenetre_texte(p.texte, mots) from public.pages_fichiers p where p.fichier_id = s.id and p.numero = s.page)
           when s.type = 'dossier' then (select c.description from public.categories c where c.id = s.id)
           else ''
         end,
         s.bloc_id, s.categorie_id, s.statut, s.date, s.score, s.approchant, s.total
    from selection s
   order by
     case when p_tri = 'date' then s.date end desc nulls last,
     case when p_tri = 'titre' then s.titre end asc,
     s.score desc, s.date desc;
end $$;

-- ---------------------------------------------------------------------
-- 6. Droits
-- ---------------------------------------------------------------------
revoke execute on function public.regles_synonymes() from public, anon, authenticated;
grant  execute on function public.regles_synonymes() to service_role;
grant execute on function public.normaliser(text)                    to anon, authenticated, service_role;
grant execute on function public.appliquer_synonymes(tsquery)        to anon, authenticated, service_role;
grant execute on function public.fenetre_texte(text, text[])         to anon, authenticated, service_role;
grant execute on function public.chemins_categories(uuid[])          to anon, authenticated, service_role;
grant execute on function public.rechercher(text, uuid[], uuid[], text[], text[], date, date, boolean, text, integer, integer)
  to anon, authenticated, service_role;
