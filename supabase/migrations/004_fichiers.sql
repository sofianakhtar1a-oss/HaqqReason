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
