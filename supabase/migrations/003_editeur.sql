-- =====================================================================
-- HaqqReason — Migration 003 : éditeur riche
-- (historique des versions, modèles d'articles)
-- À exécuter UNE SEULE FOIS, après 002_structure.sql :
-- Supabase > SQL Editor > New query > coller ce fichier > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Historique des versions de chaque article
-- ---------------------------------------------------------------------
create table public.versions_articles (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references public.articles (id) on delete cascade,
  titre         text not null,
  resume        text not null default '',
  contenu       jsonb not null,
  contenu_texte text not null default '',
  motif         text not null check (motif in ('automatique', 'enregistrement', 'publication', 'avant-restauration', 'creation')),
  created_at    timestamptz not null default now()
);
create index versions_articles_recentes_idx on public.versions_articles (article_id, created_at desc);

-- Ne garde que les « p_garder » versions les plus récentes d'un article.
create function public.elaguer_versions(p_article uuid, p_garder integer) returns void
language sql security definer set search_path = '' as $$
  delete from public.versions_articles v
   where v.article_id = p_article
     and v.id not in (
       select id from public.versions_articles
        where article_id = p_article
        order by created_at desc
        limit greatest(p_garder, 1)
     );
$$;

-- ---------------------------------------------------------------------
-- 2. Modèles d'articles enregistrés par le créateur
-- ---------------------------------------------------------------------
create table public.modeles (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null check (char_length(nom) between 1 and 120),
  description text not null default '' check (char_length(description) <= 400),
  contenu     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger modeles_touch before update on public.modeles for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. Sécurité : ces deux tables sont strictement privées.
--    RLS activé sans aucune règle = aucun accès pour le public.
-- ---------------------------------------------------------------------
alter table public.versions_articles enable row level security;
alter table public.modeles           enable row level security;

revoke all on public.versions_articles, public.modeles from public, anon, authenticated;
grant all on public.versions_articles, public.modeles to service_role;

revoke execute on function public.elaguer_versions(uuid, integer) from public, anon, authenticated;
grant  execute on function public.elaguer_versions(uuid, integer) to service_role;
