-- =====================================================================
-- HaqqReason — INSTALLATION COMPLÈTE EN UNE FOIS (fichiers 001 à 008 réunis)
-- Pour une NOUVELLE base Supabase uniquement. Si tu as déjà exécuté certains
-- fichiers, exécute seulement les suivants, un par un, dans l'ordre.
-- =====================================================================

-- >>> 001_socle.sql
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

-- >>> 002_structure.sql
-- =====================================================================
-- HaqqReason — Migration 002 : structure du contenu
-- (déplacements, corbeille, compteurs, fil d'Ariane, étiquettes)
-- À exécuter UNE SEULE FOIS, après 001_socle.sql :
-- Supabase > SQL Editor > New query > coller ce fichier > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les adresses des pages utilisent l'identifiant : un titre identique
--    dans deux endroits (ou dans la corbeille) n'est donc plus un conflit.
-- ---------------------------------------------------------------------
drop index if exists public.categories_slug_unique;
alter table public.articles drop constraint if exists articles_categorie_id_slug_key;

alter table public.categories
  add constraint categories_icone_format check (icone ~ '^[a-z-]{1,30}$');

create index if not exists categories_corbeille_idx on public.categories (supprime_le) where supprime_le is not null;
create index if not exists articles_corbeille_idx   on public.articles (supprime_le)   where supprime_le is not null;
create index if not exists articles_recents_idx     on public.articles (updated_at desc);

-- ---------------------------------------------------------------------
-- 2. Une catégorie ne peut jamais être rangée dans l'une de ses propres
--    sous-catégories (ce qui créerait une boucle sans fin).
-- ---------------------------------------------------------------------
create or replace function public.categories_coherence() returns trigger
language plpgsql set search_path = '' as $$
declare
  parent_bloc uuid;
  courant     uuid;
  pas         integer := 0;
begin
  if new.parent_id is not null then
    select c.bloc_id into parent_bloc from public.categories c where c.id = new.parent_id;
    if parent_bloc is null then
      raise exception 'Catégorie parente introuvable.';
    end if;
    if parent_bloc is distinct from new.bloc_id then
      raise exception 'Une sous-catégorie doit rester dans le bloc de sa catégorie parente.';
    end if;
    if tg_op = 'UPDATE' and new.parent_id is distinct from old.parent_id then
      courant := new.parent_id;
      while courant is not null loop
        if courant = new.id then
          raise exception 'Une catégorie ne peut pas être rangée dans l''une de ses propres sous-catégories.';
        end if;
        select c.parent_id into courant from public.categories c where c.id = courant;
        pas := pas + 1;
        if pas > 200 then
          raise exception 'Arborescence trop profonde.';
        end if;
      end loop;
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Déplacer une catégorie (avec tout son contenu), y compris vers un autre bloc.
-- ---------------------------------------------------------------------
create function public.deplacer_categorie(p_categorie uuid, p_parent uuid, p_bloc uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cible_bloc uuid;
  prochain   integer;
  ligne      record;
begin
  if not exists (select 1 from public.categories where id = p_categorie and supprime_le is null) then
    raise exception 'Catégorie introuvable.';
  end if;

  if p_parent is not null then
    select bloc_id into cible_bloc from public.categories where id = p_parent and supprime_le is null;
    if cible_bloc is null then
      raise exception 'Catégorie de destination introuvable.';
    end if;
  else
    select id into cible_bloc from public.blocs where id = p_bloc;
    if cible_bloc is null then
      raise exception 'Bloc de destination introuvable.';
    end if;
  end if;

  select coalesce(max(ordre), 0) + 1 into prochain
    from public.categories
   where bloc_id = cible_bloc and parent_id is not distinct from p_parent and supprime_le is null;

  update public.categories
     set parent_id = p_parent, bloc_id = cible_bloc, ordre = prochain
   where id = p_categorie;

  -- Les sous-catégories suivent, niveau par niveau (le parent est toujours mis à jour avant l'enfant).
  for ligne in
    with recursive descendants as (
      select c.id, 1 as niveau from public.categories c where c.parent_id = p_categorie
      union all
      select c.id, d.niveau + 1 from public.categories c join descendants d on c.parent_id = d.id where d.niveau < 200
    )
    select id from descendants order by niveau
  loop
    update public.categories set bloc_id = cible_bloc where id = ligne.id;
  end loop;

  -- Les articles suivent leur catégorie (le déclencheur recalcule leur bloc).
  update public.articles a
     set bloc_id = cible_bloc
   where a.categorie_id in (
     with recursive sous_arbre as (
       select p_categorie as id
       union all
       select c.id from public.categories c join sous_arbre s on c.parent_id = s.id
     )
     select id from sous_arbre
   );
end $$;

-- ---------------------------------------------------------------------
-- 4. Suppression définitive d'une catégorie qui est dans la corbeille,
--    avec toutes ses sous-catégories et tous ses articles.
-- ---------------------------------------------------------------------
create function public.supprimer_categorie_definitivement(p_categorie uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare ligne record;
begin
  if not exists (select 1 from public.categories where id = p_categorie and supprime_le is not null) then
    raise exception 'Seule une catégorie placée dans la corbeille peut être supprimée définitivement.';
  end if;

  delete from public.articles a
   where a.categorie_id in (
     with recursive sous_arbre as (
       select p_categorie as id
       union all
       select c.id from public.categories c join sous_arbre s on c.parent_id = s.id
     )
     select id from sous_arbre
   );

  for ligne in
    with recursive sous_arbre as (
      select p_categorie as id, 0 as niveau
      union all
      select c.id, s.niveau + 1 from public.categories c join sous_arbre s on c.parent_id = s.id where s.niveau < 200
    )
    select id from sous_arbre order by niveau desc
  loop
    delete from public.categories where id = ligne.id;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Fonctions de lecture. « security invoker » : elles respectent RLS,
--    donc un lecteur ne compte et ne voit que le contenu publié.
-- ---------------------------------------------------------------------

-- Nombre de sous-catégories et d'articles (hors corbeille) pour chaque catégorie demandée.
create function public.compter_contenus(p_categories uuid[])
returns table (categorie_id uuid, sous_categories bigint, articles bigint)
language sql stable security invoker set search_path = '' as $$
  select x.id,
         (select count(*) from public.categories c where c.parent_id = x.id and c.supprime_le is null),
         (select count(*) from public.articles a where a.categorie_id = x.id and a.supprime_le is null)
    from unnest(p_categories) as x(id);
$$;

-- Fil d'Ariane : la catégorie et tous ses parents, du plus haut au plus bas.
create function public.ancetres_categorie(p_categorie uuid)
returns table (id uuid, titre text, supprime_le timestamptz, niveau integer)
language sql stable security invoker set search_path = '' as $$
  with recursive chaine as (
    select c.id, c.titre, c.parent_id, c.supprime_le, 0 as niveau from public.categories c where c.id = p_categorie
    union all
    select p.id, p.titre, p.parent_id, p.supprime_le, chaine.niveau + 1
      from public.categories p join chaine on p.id = chaine.parent_id
     where chaine.niveau < 200
  )
  select id, titre, supprime_le, niveau from chaine order by niveau desc;
$$;

-- Taille de tout ce que contient une catégorie (pour prévenir avant une suppression définitive).
create function public.taille_sous_arbre(p_categorie uuid)
returns table (categories bigint, articles bigint)
language sql stable security invoker set search_path = '' as $$
  with recursive sous_arbre as (
    select p_categorie as id, 0 as niveau
    union all
    select c.id, s.niveau + 1 from public.categories c join sous_arbre s on c.parent_id = s.id where s.niveau < 200
  )
  select (select count(*) - 1 from sous_arbre),
         (select count(*) from public.articles a where a.categorie_id in (select id from sous_arbre));
$$;

create function public.article_visible(p_article uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.articles a
     where a.id = p_article and a.statut = 'publie' and a.supprime_le is null
       and public.categorie_visible(a.categorie_id)
  );
$$;

-- ---------------------------------------------------------------------
-- 6. Étiquettes (mots-clés libres attachés aux articles)
-- ---------------------------------------------------------------------
create table public.etiquettes (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null check (char_length(nom) between 1 and 60),
  cle        text not null unique check (char_length(cle) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.articles_etiquettes (
  article_id   uuid not null references public.articles (id) on delete cascade,
  etiquette_id uuid not null references public.etiquettes (id) on delete cascade,
  primary key (article_id, etiquette_id)
);
create index articles_etiquettes_etiquette_idx on public.articles_etiquettes (etiquette_id);

alter table public.etiquettes          enable row level security;
alter table public.articles_etiquettes enable row level security;

-- Une étiquette n'est visible du public que si elle est attachée à au moins un article visible.
create policy "lecture publique des étiquettes utilisées" on public.etiquettes
  for select to anon, authenticated
  using (exists (
    select 1 from public.articles_etiquettes ae
     where ae.etiquette_id = etiquettes.id and public.article_visible(ae.article_id)
  ));

create policy "lecture publique des liens d'étiquettes" on public.articles_etiquettes
  for select to anon, authenticated
  using (public.article_visible(article_id));

-- Retire les étiquettes qui ne sont plus attachées à aucun article.
create function public.nettoyer_etiquettes() returns void
language sql security definer set search_path = '' as $$
  delete from public.etiquettes e
   where not exists (select 1 from public.articles_etiquettes ae where ae.etiquette_id = e.id);
$$;

-- ---------------------------------------------------------------------
-- 7. Droits. Supabase accorde par défaut des droits aux nouvelles tables et
--    fonctions : on les retire, puis on ne rend que le strict nécessaire.
-- ---------------------------------------------------------------------
revoke all on public.etiquettes, public.articles_etiquettes from anon, authenticated;
grant select on public.etiquettes, public.articles_etiquettes to anon, authenticated;
grant all on public.etiquettes, public.articles_etiquettes to service_role;

revoke execute on function public.deplacer_categorie(uuid, uuid, uuid)          from public, anon, authenticated;
revoke execute on function public.supprimer_categorie_definitivement(uuid)      from public, anon, authenticated;
revoke execute on function public.taille_sous_arbre(uuid)                       from public, anon, authenticated;
revoke execute on function public.nettoyer_etiquettes()                         from public, anon, authenticated;
grant  execute on function public.nettoyer_etiquettes()                         to service_role;
grant  execute on function public.deplacer_categorie(uuid, uuid, uuid)          to service_role;
grant  execute on function public.supprimer_categorie_definitivement(uuid)      to service_role;
grant  execute on function public.taille_sous_arbre(uuid)                       to service_role;

grant execute on function public.compter_contenus(uuid[])   to anon, authenticated, service_role;
grant execute on function public.ancetres_categorie(uuid)   to anon, authenticated, service_role;
grant execute on function public.article_visible(uuid)      to anon, authenticated, service_role;

-- Fonctions internes des déclencheurs : elles n'ont pas à être appelables directement.
revoke execute on function public.touch_updated_at()      from public, anon, authenticated;
revoke execute on function public.categories_coherence()  from public, anon, authenticated;
revoke execute on function public.articles_coherence()    from public, anon, authenticated;

-- >>> 003_editeur.sql
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

-- >>> 004_fichiers.sql
-- =====================================================================
-- HaqqReason — Migration 004 : fichiers (PDF, images, documents)
-- À exécuter UNE SEULE FOIS, après 003_editeur.sql :
-- Supabase > SQL Editor > New query > coller ce fichier > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Espace de stockage PRIVÉ : aucun fichier n'est accessible directement.
--    L'application délivre des liens temporaires (10 minutes), uniquement
--    pour les fichiers rattachés à un contenu publié.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fichiers', 'fichiers', false, 52428800,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text', 'application/epub+zip', 'text/plain'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 2. Les fichiers, rattachés à un article OU à une catégorie
-- ---------------------------------------------------------------------
create table public.fichiers (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid references public.articles (id) on delete cascade,
  categorie_id uuid references public.categories (id) on delete cascade,
  nom          text not null check (char_length(nom) between 1 and 200),
  chemin       text not null unique,
  type_mime    text not null,
  taille       bigint not null default 0 check (taille >= 0),
  pages        integer check (pages is null or pages >= 0),
  -- 'envoi' tant que le fichier n'est pas vérifié ; seul 'pret' peut être montré.
  etat         text not null default 'envoi' check (etat in ('envoi', 'pret')),
  -- Texte du PDF : en attente, extrait, scanné (pages sans texte), reconnu par OCR, ou sans objet.
  statut_texte text not null default 'en_attente' check (statut_texte in ('en_attente', 'extrait', 'scanne', 'ocr', 'non_applicable')),
  -- Faux pour une image insérée dans le texte d'un article (elle n'apparaît pas dans « Documents joints »).
  dans_liste   boolean not null default true,
  ordre        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((article_id is null) <> (categorie_id is null))
);
create index fichiers_article_idx   on public.fichiers (article_id, ordre) where article_id is not null;
create index fichiers_categorie_idx on public.fichiers (categorie_id, ordre) where categorie_id is not null;
create trigger fichiers_touch before update on public.fichiers for each row execute function public.touch_updated_at();

-- Texte de chaque page d'un PDF (pour la recherche et l'accès direct à la page).
create table public.pages_fichiers (
  fichier_id uuid not null references public.fichiers (id) on delete cascade,
  numero     integer not null check (numero >= 1),
  texte      text not null default '' check (char_length(texte) <= 200000),
  ocr        boolean not null default false,
  primary key (fichier_id, numero)
);

-- Annotations du créateur sur un PDF : surlignages et notes, visibles ou non par les lecteurs.
create table public.annotations (
  id         uuid primary key default gen_random_uuid(),
  fichier_id uuid not null references public.fichiers (id) on delete cascade,
  page       integer not null check (page >= 1),
  type       text not null check (type in ('surlignage', 'note')),
  -- Position relative à la page (0 à 1), indépendante du zoom.
  x          real not null check (x between 0 and 1),
  y          real not null check (y between 0 and 1),
  largeur    real not null default 0 check (largeur between 0 and 1),
  hauteur    real not null default 0 check (hauteur between 0 and 1),
  couleur    text not null default 'jaune' check (couleur in ('jaune', 'bleu', 'vert', 'rose', 'orange', 'violet', 'rouge', 'turquoise')),
  texte      text not null default '' check (char_length(texte) <= 4000),
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);
create index annotations_fichier_idx on public.annotations (fichier_id, page);

-- ---------------------------------------------------------------------
-- 3. Visibilité : un fichier est visible si son article ou sa catégorie l'est.
-- ---------------------------------------------------------------------
create function public.fichier_visible(p_fichier uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.fichiers f
     where f.id = p_fichier and f.etat = 'pret'
       and (
         (f.article_id is not null and public.article_visible(f.article_id))
         or (f.categorie_id is not null and public.categorie_visible(f.categorie_id))
       )
  );
$$;

-- Vrai si la catégorie et tous ses parents sont hors corbeille (publiés ou non).
create function public.chaine_active(p_categorie uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive chaine as (
    select c.id, c.parent_id, c.supprime_le, 1 as niveau from public.categories c where c.id = p_categorie
    union all
    select p.id, p.parent_id, p.supprime_le, chaine.niveau + 1
      from public.categories p join chaine on p.id = chaine.parent_id
     where chaine.niveau < 200
  )
  select count(*) > 0 and bool_and(supprime_le is null) from chaine;
$$;

-- Chemins de stockage de tous les fichiers d'une catégorie et de son contenu (avant suppression définitive).
create function public.chemins_sous_arbre(p_categorie uuid) returns setof text
language sql stable security definer set search_path = '' as $$
  with recursive sous_arbre as (
    select p_categorie as id, 0 as niveau
    union all
    select c.id, s.niveau + 1 from public.categories c join sous_arbre s on c.parent_id = s.id where s.niveau < 200
  )
  select f.chemin from public.fichiers f
   where f.categorie_id in (select id from sous_arbre)
      or f.article_id in (select a.id from public.articles a where a.categorie_id in (select id from sous_arbre));
$$;

alter table public.fichiers       enable row level security;
alter table public.pages_fichiers enable row level security;
alter table public.annotations    enable row level security;

create policy "lecture publique des fichiers visibles" on public.fichiers
  for select to anon, authenticated using (public.fichier_visible(id));
create policy "lecture publique du texte des fichiers visibles" on public.pages_fichiers
  for select to anon, authenticated using (public.fichier_visible(fichier_id));
create policy "lecture publique des annotations visibles" on public.annotations
  for select to anon, authenticated using (visible and public.fichier_visible(fichier_id));

-- ---------------------------------------------------------------------
-- 4. Droits
-- ---------------------------------------------------------------------
revoke all on public.fichiers, public.pages_fichiers, public.annotations from public, anon, authenticated;
grant select on public.fichiers, public.pages_fichiers, public.annotations to anon, authenticated;
grant all on public.fichiers, public.pages_fichiers, public.annotations to service_role;

revoke execute on function public.chemins_sous_arbre(uuid) from public, anon, authenticated;
grant  execute on function public.chemins_sous_arbre(uuid) to service_role;
grant  execute on function public.fichier_visible(uuid) to anon, authenticated, service_role;
grant  execute on function public.chaine_active(uuid)   to anon, authenticated, service_role;

-- >>> 005_recherche.sql
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

-- >>> 006_innovations.sql
-- =====================================================================
-- HaqqReason — Phase 6 : liens entre articles, statistiques anonymes,
-- appareils connus, double authentification, sauvegardes automatiques.
-- À exécuter UNE fois, après 005_recherche.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Liens entre articles : [[Titre d'un article]]
-- ---------------------------------------------------------------------
-- On garde le titre visé (normalisé) plutôt que l'identifiant : un lien vers un article
-- pas encore écrit se « répare » tout seul le jour où l'article est créé.
create table public.liens_articles (
  source_id   uuid not null references public.articles (id) on delete cascade,
  cible_norm  text not null check (char_length(cible_norm) between 1 and 300),
  cible_texte text not null check (char_length(cible_texte) between 1 and 300),
  primary key (source_id, cible_norm)
);
create index liens_articles_cible_idx on public.liens_articles (cible_norm);
create index articles_titre_norm_idx on public.articles (public.normaliser(titre));

alter table public.liens_articles enable row level security;
create policy "lecture publique des liens des articles visibles" on public.liens_articles
  for select to anon, authenticated using (public.article_visible(source_id));

-- Liens d'un article, avec l'article visé quand il existe (et que l'appelant a le droit de le voir).
create function public.liens_resolus(p_source uuid)
returns table (cible_norm text, cible_texte text, id uuid, titre text)
language sql stable security invoker set search_path = '' as $$
  select l.cible_norm, l.cible_texte, a.id, a.titre
  from public.liens_articles l
  left join lateral (
    select x.id, x.titre from public.articles x
    where public.normaliser(x.titre) = l.cible_norm and x.supprime_le is null
    order by (x.statut = 'publie') desc, x.created_at
    limit 1
  ) a on true
  where l.source_id = p_source;
$$;

-- Remplace la liste des liens d'un article (appelé par le serveur à chaque enregistrement).
create function public.enregistrer_liens(p_source uuid, p_cibles text[]) returns void
language sql security definer set search_path = '' as $$
  delete from public.liens_articles where source_id = p_source;
  insert into public.liens_articles (source_id, cible_norm, cible_texte)
  select distinct on (public.normaliser(btrim(c))) p_source, public.normaliser(btrim(c)), btrim(c)
  from unnest(coalesce(p_cibles, '{}')) as c
  where char_length(btrim(c)) between 1 and 300 and char_length(public.normaliser(btrim(c))) >= 1
  on conflict do nothing;
$$;

-- Articles qui citent celui-ci.
create function public.retroliens(p_article uuid)
returns table (id uuid, titre text, resume text)
language sql stable security invoker set search_path = '' as $$
  select distinct a.id, a.titre, a.resume
  from public.articles cible
  join public.liens_articles l on l.cible_norm = public.normaliser(cible.titre)
  join public.articles a on a.id = l.source_id
  where cible.id = p_article and a.id <> p_article and a.supprime_le is null
  order by a.titre;
$$;

-- Liens entre articles pour le graphe de connaissances (seulement entre articles visibles par l'appelant).
create function public.graphe_liens()
returns table (source_id uuid, cible_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct l.source_id, c.id
  from public.liens_articles l
  join public.articles c on public.normaliser(c.titre) = l.cible_norm and c.supprime_le is null
  where c.id <> l.source_id;
$$;

-- Liens qui ne mènent à aucun article (pour le tableau de bord du créateur).
create function public.liens_casses()
returns table (source_id uuid, source_titre text, cible_texte text)
language sql stable security invoker set search_path = '' as $$
  select s.id, s.titre, l.cible_texte
  from public.liens_articles l
  join public.articles s on s.id = l.source_id and s.supprime_le is null
  where not exists (
    select 1 from public.articles x
    where public.normaliser(x.titre) = l.cible_norm and x.supprime_le is null
  )
  order by s.titre, l.cible_texte;
$$;

-- ---------------------------------------------------------------------
-- 2. Statistiques anonymes (aucune adresse IP, aucun identifiant de lecteur)
-- ---------------------------------------------------------------------
create table public.vues_articles (
  article_id uuid not null references public.articles (id) on delete cascade,
  jour       date not null default current_date,
  nombre     integer not null default 0 check (nombre >= 0),
  primary key (article_id, jour)
);

create table public.recherches_vides (
  terme  text not null check (char_length(terme) between 1 and 100),
  jour   date not null default current_date,
  nombre integer not null default 0 check (nombre >= 0),
  primary key (terme, jour)
);

alter table public.vues_articles    enable row level security;
alter table public.recherches_vides enable row level security;
-- Aucune règle publique : seul le serveur (clé secrète) lit et écrit ces tables.

create function public.compter_vue(p_article uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.vues_articles (article_id, jour, nombre)
  select p_article, current_date, 1
  where public.article_visible(p_article)
  on conflict (article_id, jour) do update set nombre = public.vues_articles.nombre + 1;
$$;

create function public.noter_recherche_vide(p_terme text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t text := left(btrim(public.normaliser(coalesce(p_terme, ''))), 100);
begin
  if char_length(t) < 2 then return; end if;
  insert into public.recherches_vides (terme, jour, nombre) values (t, current_date, 1)
  on conflict (terme, jour) do update set nombre = public.recherches_vides.nombre + 1;
  -- On ne garde qu'une année d'historique.
  delete from public.recherches_vides where jour < current_date - 366;
  delete from public.vues_articles   where jour < current_date - 366;
end;
$$;

create function public.articles_les_plus_lus(p_jours integer, p_limite integer)
returns table (id uuid, titre text, vues bigint)
language sql stable security invoker set search_path = '' as $$
  select a.id, a.titre, sum(v.nombre)::bigint as vues
  from public.vues_articles v join public.articles a on a.id = v.article_id
  where v.jour >= current_date - greatest(p_jours, 1)
  group by a.id, a.titre
  order by vues desc, a.titre
  limit least(greatest(p_limite, 1), 100);
$$;

create function public.recherches_sans_resultat(p_jours integer, p_limite integer)
returns table (terme text, nombre bigint)
language sql stable security invoker set search_path = '' as $$
  select r.terme, sum(r.nombre)::bigint as nombre
  from public.recherches_vides r
  where r.jour >= current_date - greatest(p_jours, 1)
  group by r.terme
  order by nombre desc, r.terme
  limit least(greatest(p_limite, 1), 100);
$$;

-- ---------------------------------------------------------------------
-- 3. Sécurité du compte créateur
-- ---------------------------------------------------------------------
-- Double authentification (TOTP, type Google Authenticator). Le secret est chiffré par le serveur.
alter table public.creator_auth
  add column totp_secret     text,
  add column totp_actif      boolean not null default false,
  add column totp_dernier_pas bigint not null default 0;

-- Appareils déjà utilisés par le créateur. L'empreinte est un hachage d'un identifiant aléatoire
-- conservé dans un cookie de l'appareil : rien ne permet de remonter à la personne.
create table public.appareils_connus (
  empreinte           text primary key check (char_length(empreinte) = 64),
  libelle             text not null default '',
  premiere_connexion  timestamptz not null default now(),
  derniere_connexion  timestamptz not null default now(),
  confirme            boolean not null default false
);
alter table public.appareils_connus enable row level security;

alter table public.auth_attempts drop constraint if exists auth_attempts_kind_check;
alter table public.auth_attempts add constraint auth_attempts_kind_check
  check (kind in ('connexion', 'recuperation', 'configuration', 'double_authentification'));

-- ---------------------------------------------------------------------
-- 4. Sauvegardes automatiques : espace de stockage privé
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sauvegardes', 'sauvegardes', false, 52428800, array['application/json'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 5. Droits
-- ---------------------------------------------------------------------
revoke all on public.liens_articles, public.vues_articles, public.recherches_vides, public.appareils_connus
  from public, anon, authenticated;
grant select on public.liens_articles to anon, authenticated;
grant all on public.liens_articles, public.vues_articles, public.recherches_vides, public.appareils_connus to service_role;

grant execute on function public.liens_resolus(uuid) to anon, authenticated, service_role;
grant execute on function public.retroliens(uuid)    to anon, authenticated, service_role;
grant execute on function public.graphe_liens()      to anon, authenticated, service_role;

revoke execute on function public.enregistrer_liens(uuid, text[])         from public, anon, authenticated;
grant  execute on function public.enregistrer_liens(uuid, text[])         to service_role;
revoke execute on function public.liens_casses()                         from public, anon, authenticated;
revoke execute on function public.compter_vue(uuid)                      from public, anon, authenticated;
revoke execute on function public.noter_recherche_vide(text)             from public, anon, authenticated;
revoke execute on function public.articles_les_plus_lus(integer, integer) from public, anon, authenticated;
revoke execute on function public.recherches_sans_resultat(integer, integer) from public, anon, authenticated;
grant  execute on function public.liens_casses()                         to service_role;
grant  execute on function public.compter_vue(uuid)                      to service_role;
grant  execute on function public.noter_recherche_vide(text)             to service_role;
grant  execute on function public.articles_les_plus_lus(integer, integer) to service_role;
grant  execute on function public.recherches_sans_resultat(integer, integer) to service_role;

-- >>> 007_sources_navigation.sql
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

-- >>> 008_reglages.sql
-- =====================================================================
-- HaqqReason — Migration 008 : réglages du site (page « Paramètres »)
-- À exécuter UNE SEULE FOIS dans Supabase : SQL Editor > New query > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Réglages, sous forme de clé / valeur
--    Seul le serveur (clé secrète) peut les lire et les écrire : ils ne
--    concernent que le créateur et ne doivent jamais atteindre le public.
-- ---------------------------------------------------------------------
create table public.reglages (
  cle        text primary key check (cle ~ '^[a-z][a-z0-9_]{1,48}$'),
  valeur     jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.reglages enable row level security;

-- Aucune politique pour anon/authenticated : la table leur est invisible.
revoke all on table public.reglages from anon, authenticated;
-- Seul le serveur (clé secrète) lit et écrit les réglages.
grant all on table public.reglages to service_role;

create trigger reglages_touch
  before update on public.reglages
  for each row execute function public.touch_updated_at();

comment on table public.reglages is
  'Réglages du créateur (durée de déconnexion automatique, taille maximale des fichiers…). Lecture et écriture réservées au serveur.';

-- ---------------------------------------------------------------------
-- 2. Valeurs de départ
--    Elles reprennent exactement le comportement des phases précédentes,
--    pour qu'une mise à jour ne change rien tant que rien n'est modifié.
-- ---------------------------------------------------------------------
insert into public.reglages (cle, valeur) values
  ('inactivite_minutes',     '30'::jsonb),
  ('session_max_heures',     '12'::jsonb),
  ('lier_appareil',          'true'::jsonb),
  ('taille_max_mo',          '50'::jsonb)
on conflict (cle) do nothing;
