-- =====================================================================
-- HaqqReason — Phase 7 : sources et références, multi-classement,
-- prérequis de lecture, articles liés, détection des doublons de fichiers.
-- À exécuter UNE fois, après 006_innovations.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Auteurs, ouvrages, citations
-- ---------------------------------------------------------------------
create table public.auteurs (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null check (char_length(nom) between 1 and 200),
  nom_original  text not null default '' check (char_length(nom_original) <= 200),
  epoque        text not null default '' check (char_length(epoque) <= 120),
  biographie    text not null default '' check (char_length(biographie) <= 20000),
  notes         text not null default '' check (char_length(notes) <= 20000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.ouvrages (
  id              uuid primary key default gen_random_uuid(),
  titre           text not null check (char_length(titre) between 1 and 400),
  titre_original  text not null default '' check (char_length(titre_original) <= 400),
  auteur_id       uuid references public.auteurs (id) on delete set null,
  auteur_texte    text not null default '' check (char_length(auteur_texte) <= 300),
  editeur         text not null default '' check (char_length(editeur) <= 200),
  edition         text not null default '' check (char_length(edition) <= 200),
  lieu            text not null default '' check (char_length(lieu) <= 120),
  annee           text not null default '' check (char_length(annee) <= 40),
  volumes         text not null default '' check (char_length(volumes) <= 60),
  langue          text not null default '' check (char_length(langue) <= 60),
  isbn            text not null default '' check (char_length(isbn) <= 40),
  lien            text not null default '' check (char_length(lien) <= 2000),
  fichier_id      uuid references public.fichiers (id) on delete set null,
  statut          text not null default 'a-verifier'
                  check (statut in ('a-verifier', 'verifiee', 'citation-verifiee', 'incomplete', 'secondaire', 'contestee')),
  notes           text not null default '' check (char_length(notes) <= 20000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index ouvrages_auteur_idx on public.ouvrages (auteur_id);
create index ouvrages_titre_trgm_idx on public.ouvrages using gin (public.normaliser(titre) extensions.gin_trgm_ops);

create table public.citations (
  id              uuid primary key default gen_random_uuid(),
  ouvrage_id      uuid not null references public.ouvrages (id) on delete cascade,
  texte           text not null check (char_length(texte) between 1 and 10000),
  texte_original  text not null default '' check (char_length(texte_original) <= 10000),
  tome            text not null default '' check (char_length(tome) <= 30),
  page            text not null default '' check (char_length(page) <= 60),
  contexte        text not null default '' check (char_length(contexte) <= 5000),
  statut          text not null default 'a-verifier'
                  check (statut in ('a-verifier', 'verifiee', 'citation-verifiee', 'incomplete', 'secondaire', 'contestee')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index citations_ouvrage_idx on public.citations (ouvrage_id);

create trigger auteurs_touch   before update on public.auteurs   for each row execute function public.touch_updated_at();
create trigger ouvrages_touch  before update on public.ouvrages  for each row execute function public.touch_updated_at();
create trigger citations_touch before update on public.citations for each row execute function public.touch_updated_at();

-- Quels articles citent quels ouvrages (rempli par le serveur à chaque enregistrement d'article).
create table public.references_articles (
  article_id  uuid not null references public.articles (id) on delete cascade,
  ouvrage_id  uuid not null references public.ouvrages (id) on delete cascade,
  citation_id uuid references public.citations (id) on delete cascade,
  page        text not null default '' check (char_length(page) <= 60),
  cle         text not null,
  primary key (article_id, cle)
);
create index references_articles_ouvrage_idx  on public.references_articles (ouvrage_id);
create index references_articles_citation_idx on public.references_articles (citation_id);

-- Un ouvrage (et son auteur, ses citations) n'est visible du public que s'il est cité par un article visible.
create function public.ouvrage_visible(p_ouvrage uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.references_articles r where r.ouvrage_id = p_ouvrage and public.article_visible(r.article_id));
$$;

create function public.enregistrer_references(p_article uuid, p_refs jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.references_articles where article_id = p_article;
  insert into public.references_articles (article_id, ouvrage_id, citation_id, page, cle)
  select distinct on (cle) p_article, o.id, c.id, left(coalesce(r->>'page', ''), 60),
         o.id::text || '|' || coalesce(c.id::text, '') || '|' || left(coalesce(r->>'page', ''), 60) as cle
  from jsonb_array_elements(coalesce(p_refs, '[]'::jsonb)) r
  left join public.citations c on c.id::text = r->>'citation'
  join public.ouvrages o on o.id = coalesce(c.ouvrage_id::text, r->>'ouvrage')::uuid
  limit 2000;
end;
$$;

-- Ouvrages au titre proche (pour éviter les doublons à la saisie).
create function public.ouvrages_semblables(p_titre text)
returns table (id uuid, titre text, auteur_texte text, annee text, ressemblance real)
language sql stable security invoker set search_path = '' as $$
  select o.id, o.titre, o.auteur_texte, o.annee, extensions.similarity(public.normaliser(o.titre), public.normaliser(p_titre)) as r
  from public.ouvrages o
  where extensions.similarity(public.normaliser(o.titre), public.normaliser(p_titre)) > 0.4
  order by r desc
  limit 5;
$$;

-- ---------------------------------------------------------------------
-- 2. Multi-classement et prérequis de lecture
-- ---------------------------------------------------------------------
create table public.articles_categories (
  article_id   uuid not null references public.articles (id) on delete cascade,
  categorie_id uuid not null references public.categories (id) on delete cascade,
  primary key (article_id, categorie_id)
);
create index articles_categories_categorie_idx on public.articles_categories (categorie_id);

create table public.prerequis (
  article_id   uuid not null references public.articles (id) on delete cascade,
  prerequis_id uuid not null references public.articles (id) on delete cascade,
  ordre        integer not null default 0,
  primary key (article_id, prerequis_id),
  check (article_id <> prerequis_id)
);
create index prerequis_prerequis_idx on public.prerequis (prerequis_id);

-- Articles proches : étiquettes communes, liens dans un sens ou dans l'autre, ouvrages cités en commun, même catégorie.
create function public.articles_lies(p_article uuid, p_limite integer)
returns table (id uuid, titre text, resume text, score integer)
language sql stable security invoker set search_path = '' as $$
  with moi as (select a.id, a.titre, a.categorie_id from public.articles a where a.id = p_article),
  candidats as (
    select ae2.article_id as id, 3 as points
      from public.articles_etiquettes ae1 join public.articles_etiquettes ae2 on ae2.etiquette_id = ae1.etiquette_id
     where ae1.article_id = p_article
    union all
    select l.source_id, 4 from public.liens_articles l, moi where l.cible_norm = public.normaliser(moi.titre)
    union all
    select c.id, 4 from public.liens_articles l join public.articles c on public.normaliser(c.titre) = l.cible_norm where l.source_id = p_article
    union all
    select r2.article_id, 2 from public.references_articles r1 join public.references_articles r2 on r2.ouvrage_id = r1.ouvrage_id where r1.article_id = p_article
    union all
    select a.id, 1 from public.articles a, moi where a.categorie_id = moi.categorie_id
  )
  select a.id, a.titre, a.resume, sum(c.points)::integer as score
  from candidats c join public.articles a on a.id = c.id
  where a.id <> p_article and a.supprime_le is null
  group by a.id, a.titre, a.resume
  order by score desc, a.titre
  limit least(greatest(p_limite, 1), 20);
$$;

-- ---------------------------------------------------------------------
-- 3. Doublons de fichiers : empreinte SHA-256 calculée à l'envoi
-- ---------------------------------------------------------------------
alter table public.fichiers add column empreinte text check (empreinte is null or empreinte ~ '^[0-9a-f]{64}$');
create index fichiers_empreinte_idx on public.fichiers (empreinte) where empreinte is not null;

-- ---------------------------------------------------------------------
-- 4. Règles d'accès
-- ---------------------------------------------------------------------
alter table public.auteurs             enable row level security;
alter table public.ouvrages            enable row level security;
alter table public.citations           enable row level security;
alter table public.references_articles enable row level security;
alter table public.articles_categories enable row level security;
alter table public.prerequis           enable row level security;

create policy "lecture publique des ouvrages cités" on public.ouvrages
  for select to anon, authenticated using (public.ouvrage_visible(id));
create policy "lecture publique des auteurs cités" on public.auteurs
  for select to anon, authenticated using (exists (select 1 from public.ouvrages o where o.auteur_id = auteurs.id and public.ouvrage_visible(o.id)));
create policy "lecture publique des citations utilisées" on public.citations
  for select to anon, authenticated using (exists (select 1 from public.references_articles r where r.citation_id = citations.id and public.article_visible(r.article_id)));
create policy "lecture publique des références" on public.references_articles
  for select to anon, authenticated using (public.article_visible(article_id));
create policy "lecture publique du multi-classement" on public.articles_categories
  for select to anon, authenticated using (public.article_visible(article_id) and public.categorie_visible(categorie_id));
create policy "lecture publique des prérequis" on public.prerequis
  for select to anon, authenticated using (public.article_visible(article_id) and public.article_visible(prerequis_id));

revoke all on public.auteurs, public.ouvrages, public.citations, public.references_articles, public.articles_categories, public.prerequis
  from public, anon, authenticated;
-- Les notes personnelles du créateur (colonne « notes ») ne sont jamais lisibles par le public.
grant select (id, nom, nom_original, epoque, biographie, created_at, updated_at) on public.auteurs to anon, authenticated;
grant select (id, titre, titre_original, auteur_id, auteur_texte, editeur, edition, lieu, annee, volumes, langue, isbn, lien, statut, created_at, updated_at) on public.ouvrages to anon, authenticated;
grant select (id, ouvrage_id, texte, texte_original, tome, page, contexte, statut, created_at, updated_at) on public.citations to anon, authenticated;
grant select on public.references_articles, public.articles_categories, public.prerequis to anon, authenticated;
grant all on public.auteurs, public.ouvrages, public.citations, public.references_articles, public.articles_categories, public.prerequis to service_role;

grant  execute on function public.ouvrage_visible(uuid)        to anon, authenticated, service_role;
grant  execute on function public.articles_lies(uuid, integer) to anon, authenticated, service_role;
revoke execute on function public.enregistrer_references(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.ouvrages_semblables(text)          from public, anon, authenticated;
grant  execute on function public.enregistrer_references(uuid, jsonb) to service_role;
grant  execute on function public.ouvrages_semblables(text)          to service_role;
