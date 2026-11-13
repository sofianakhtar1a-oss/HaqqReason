-- =====================================================================
-- HaqqReason — Migration 001 : socle (contenu, sécurité, authentification)
-- À exécuter UNE SEULE FOIS dans Supabase : SQL Editor > New query > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les trois grands blocs
-- ---------------------------------------------------------------------
create table public.blocs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titre       text not null,
  description text not null default '',
  accent      text not null check (accent in ('or', 'emeraude', 'amethyste')),
  ordre       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Catégories et sous-catégories (profondeur illimitée via parent_id)
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  bloc_id     uuid not null references public.blocs (id) on delete restrict,
  parent_id   uuid references public.categories (id) on delete restrict,
  titre       text not null check (char_length(titre) between 1 and 200),
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  icone       text not null default 'dossier',
  ordre       integer not null default 0,
  statut      text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  supprime_le timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create unique index categories_slug_unique
  on public.categories (bloc_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);
create index categories_bloc_idx   on public.categories (bloc_id, ordre);
create index categories_parent_idx on public.categories (parent_id, ordre);

-- ---------------------------------------------------------------------
-- 3. Articles
-- ---------------------------------------------------------------------
create table public.articles (
  id            uuid primary key default gen_random_uuid(),
  bloc_id       uuid not null references public.blocs (id) on delete restrict,
  categorie_id  uuid not null references public.categories (id) on delete restrict,
  titre         text not null check (char_length(titre) between 1 and 300),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  resume        text not null default '',
  contenu       jsonb not null default '{}'::jsonb,
  contenu_texte text not null default '',
  statut        text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  publie_le     timestamptz,
  supprime_le   timestamptz,
  ordre         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (categorie_id, slug)
);

create index articles_categorie_idx on public.articles (categorie_id, ordre);
create index articles_bloc_idx      on public.articles (bloc_id);
create index articles_publies_idx   on public.articles (categorie_id, publie_le desc)
  where statut = 'publie' and supprime_le is null;

-- ---------------------------------------------------------------------
-- 4. Tables privées : authentification du créateur, tentatives, journal
--    (aucun accès public : seul le serveur de l'application peut les lire)
-- ---------------------------------------------------------------------
create table public.creator_auth (
  id                  integer primary key default 1 check (id = 1),  -- un seul créateur, pour toujours
  password_hash       text not null,
  recovery_hash       text not null,
  session_version     integer not null default 1,
  password_changed_at timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.auth_attempts (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('connexion', 'recuperation', 'configuration')),
  ip_hash    text not null,
  success    boolean not null,
  created_at timestamptz not null default now()
);
create index auth_attempts_recent_idx on public.auth_attempts (kind, created_at desc);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  action     text not null,
  details    jsonb not null default '{}'::jsonb,
  ip_hash    text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index audit_log_recent_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------
-- 5. Automatismes
-- ---------------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger blocs_touch        before update on public.blocs        for each row execute function public.touch_updated_at();
create trigger categories_touch   before update on public.categories   for each row execute function public.touch_updated_at();
create trigger articles_touch     before update on public.articles     for each row execute function public.touch_updated_at();
create trigger creator_auth_touch before update on public.creator_auth for each row execute function public.touch_updated_at();

-- Une sous-catégorie appartient forcément au même bloc que sa catégorie parente.
create function public.categories_coherence() returns trigger
language plpgsql set search_path = '' as $$
declare parent_bloc uuid;
begin
  if new.parent_id is not null then
    select c.bloc_id into parent_bloc from public.categories c where c.id = new.parent_id;
    if parent_bloc is distinct from new.bloc_id then
      raise exception 'Une sous-catégorie doit rester dans le bloc de sa catégorie parente.';
    end if;
  end if;
  return new;
end $$;
create trigger categories_coherence before insert or update on public.categories
  for each row execute function public.categories_coherence();

-- Un article hérite automatiquement du bloc de sa catégorie ; la date de publication est posée une fois.
create function public.articles_coherence() returns trigger
language plpgsql set search_path = '' as $$
begin
  select c.bloc_id into new.bloc_id from public.categories c where c.id = new.categorie_id;
  if new.statut = 'publie' and new.publie_le is null then
    new.publie_le := now();
  end if;
  return new;
end $$;
create trigger articles_coherence before insert or update on public.articles
  for each row execute function public.articles_coherence();

-- Une catégorie n'est visible du public que si elle ET tous ses parents sont publiés et non supprimés.
create function public.categorie_visible(cat uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive chaine as (
    select c.id, c.parent_id, c.statut, c.supprime_le, 1 as niveau
      from public.categories c where c.id = cat
    union all
    select p.id, p.parent_id, p.statut, p.supprime_le, chaine.niveau + 1
      from public.categories p join chaine on p.id = chaine.parent_id
     where chaine.niveau < 64
  )
  select count(*) > 0 and bool_and(statut = 'publie' and supprime_le is null) from chaine;
$$;

-- ---------------------------------------------------------------------
-- 6. Sécurité au niveau des lignes (Row Level Security)
--    Public  : LECTURE du contenu publié uniquement.
--    Écriture : aucune règle => impossible pour le public, quoi qu'il tente.
--    Seul le serveur de l'application (clé secrète) peut écrire.
-- ---------------------------------------------------------------------
alter table public.blocs         enable row level security;
alter table public.categories    enable row level security;
alter table public.articles      enable row level security;
alter table public.creator_auth  enable row level security;
alter table public.auth_attempts enable row level security;
alter table public.audit_log     enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.blocs, public.categories, public.articles to anon, authenticated;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on function public.categorie_visible(uuid) to anon, authenticated, service_role;

create policy "lecture publique des blocs" on public.blocs
  for select to anon, authenticated using (true);

create policy "lecture publique des catégories publiées" on public.categories
  for select to anon, authenticated
  using (public.categorie_visible(id));

create policy "lecture publique des articles publiés" on public.articles
  for select to anon, authenticated
  using (statut = 'publie' and supprime_le is null and public.categorie_visible(categorie_id));

-- Aucune règle sur creator_auth, auth_attempts et audit_log : totalement invisibles du public.

-- ---------------------------------------------------------------------
-- 7. Les trois blocs de HaqqReason
-- ---------------------------------------------------------------------
insert into public.blocs (slug, titre, description, accent, ordre) values
  ('veracite-de-l-islam', 'La véracité de l''islam',
   'Les preuves et les arguments qui établissent que l''islam est la vérité.', 'or', 1),
  ('defense-de-l-islam', 'La défense de l''islam',
   'Les réponses détaillées aux objections et aux attaques formulées contre l''islam.', 'emeraude', 2),
  ('refutation-des-autres-croyances', 'La réfutation des autres croyances',
   'L''examen critique des autres religions, idéologies et visions du monde.', 'amethyste', 3);
