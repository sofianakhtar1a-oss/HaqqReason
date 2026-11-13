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
