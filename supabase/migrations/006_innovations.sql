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
