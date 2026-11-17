-- =====================================================================
-- 014 · Comptes des utilisateurs (connexion avec Google)
--   • Un compte par personne, reconnu par son identifiant Google.
--     On ne garde que le nom et l'adresse e-mail : jamais de mot de passe.
--   • Ses données personnelles (documents du Calame, progression des
--     leçons, dictionnaire, favoris…) sont rangées par compte : elles la
--     suivent d'un appareil à l'autre.
--   • Les images et les PDF de ses documents vont dans un espace de
--     stockage privé, « comptes ».
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script peut être relancé sans risque.
-- =====================================================================

-- 1. Les comptes --------------------------------------------------------
create table if not exists public.utilisateurs (
  id              uuid primary key default gen_random_uuid(),
  google_sub      text not null unique check (char_length(google_sub) between 1 and 255),
  email           text not null default '' check (char_length(email) <= 320),
  nom             text not null default '' check (char_length(nom) <= 200),
  -- Incrémentée pour fermer toutes les sessions du compte.
  session_version integer not null default 1,
  cree_le         timestamptz not null default now(),
  vu_le           timestamptz not null default now()
);

alter table public.utilisateurs enable row level security;
revoke all on table public.utilisateurs from anon, authenticated;
grant all on table public.utilisateurs to service_role;
comment on table public.utilisateurs is
  'Comptes du mode utilisateur (connexion Google). Réservée au serveur.';

-- 2. Les données de chaque compte ----------------------------------------
-- Une ligne par objet : un document, une leçon, un mot du dictionnaire…
--   quand : l'heure (en millisecondes) de la dernière modification, donnée par l'appareil ;
--           entre deux appareils, c'est la modification la plus récente qui l'emporte.
--   maj   : numéro d'ordre donné par la base ; un appareil demande « tout ce qui a changé depuis ».
--   valeur nulle : l'objet a été supprimé (on garde la trace pour prévenir les autres appareils).
create sequence if not exists public.donnees_utilisateur_maj;

create table if not exists public.donnees_utilisateur (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  magasin        text not null check (magasin ~ '^[a-z][a-z0-9-]{0,39}$'),
  cle            text not null check (char_length(cle) between 1 and 200),
  valeur         jsonb,
  quand          bigint not null,
  maj            bigint not null default nextval('public.donnees_utilisateur_maj'),
  taille         integer not null default 0,
  primary key (utilisateur_id, magasin, cle)
);

create index if not exists donnees_utilisateur_maj_idx on public.donnees_utilisateur (utilisateur_id, maj);

alter table public.donnees_utilisateur enable row level security;
revoke all on table public.donnees_utilisateur from anon, authenticated;
grant all on table public.donnees_utilisateur to service_role;
revoke all on sequence public.donnees_utilisateur_maj from anon, authenticated;
grant usage, select on sequence public.donnees_utilisateur_maj to service_role;
comment on table public.donnees_utilisateur is
  'Données personnelles d''un compte (documents, progression…). Réservée au serveur.';

-- 3. Les fichiers joints (images et PDF des documents) -------------------
create table if not exists public.fichiers_utilisateur (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  id             text not null check (id ~ '^[A-Za-z0-9_-]{1,80}$'),
  type           text not null default 'application/octet-stream' check (char_length(type) <= 120),
  taille         bigint not null check (taille >= 0),
  cree_le        timestamptz not null default now(),
  primary key (utilisateur_id, id)
);

alter table public.fichiers_utilisateur enable row level security;
revoke all on table public.fichiers_utilisateur from anon, authenticated;
grant all on table public.fichiers_utilisateur to service_role;
comment on table public.fichiers_utilisateur is
  'Fichiers joints aux documents d''un compte (espace de stockage « comptes »). Réservée au serveur.';

-- L'espace de stockage privé : 20 Mo par fichier, aucun accès public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comptes', 'comptes', false, 20971520, null)
on conflict (id) do update set public = false, file_size_limit = 20971520;

-- 4. Ouvrir (ou créer) un compte à la connexion ---------------------------
create or replace function public.compte_ouvrir(p_sub text, p_email text, p_nom text)
returns table (id uuid, nom text, email text, session_version integer, nouveau boolean)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v public.utilisateurs%rowtype;
  v_nouveau boolean := false;
begin
  select * into v from public.utilisateurs u where u.google_sub = p_sub;
  if not found then
    insert into public.utilisateurs (google_sub, email, nom)
    values (p_sub, left(coalesce(p_email, ''), 320), left(coalesce(p_nom, ''), 200))
    on conflict (google_sub) do update set vu_le = now()
    returning * into v;
    v_nouveau := true;
  else
    update public.utilisateurs u
       set email = left(coalesce(p_email, ''), 320), nom = left(coalesce(p_nom, ''), 200), vu_le = now()
     where u.id = v.id
    returning * into v;
  end if;
  return query select v.id, v.nom, v.email, v.session_version, v_nouveau;
end $$;

-- 5. Écrire : la modification la plus récente l'emporte --------------------
-- p_ecritures : [{ "m": magasin, "c": clé, "v": valeur ou null, "q": heure en ms }, …]
-- Renvoie { "maj": dernier numéro d'ordre, "refusees": [{m, c}] (plafond du compte dépassé) }.
create or replace function public.donnees_ecrire(p_utilisateur uuid, p_ecritures jsonb, p_plafond bigint)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  e jsonb;
  v_total bigint;
  v_taille integer;
  v_ancienne integer;
  v_refusees jsonb := '[]'::jsonb;
  v_maj bigint;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    raise exception 'compte inconnu';
  end if;
  select coalesce(sum(d.taille), 0) into v_total from public.donnees_utilisateur d where d.utilisateur_id = p_utilisateur;

  for e in select * from jsonb_array_elements(coalesce(p_ecritures, '[]'::jsonb)) loop
    if jsonb_typeof(e -> 'v') is null or jsonb_typeof(e -> 'v') = 'null' then
      v_taille := 0;
    else
      v_taille := octet_length((e -> 'v')::text);
    end if;
    select d.taille into v_ancienne from public.donnees_utilisateur d
     where d.utilisateur_id = p_utilisateur and d.magasin = e ->> 'm' and d.cle = e ->> 'c';
    v_ancienne := coalesce(v_ancienne, 0);

    if v_taille > v_ancienne and v_total - v_ancienne + v_taille > p_plafond then
      v_refusees := v_refusees || jsonb_build_object('m', e ->> 'm', 'c', e ->> 'c');
      continue;
    end if;

    insert into public.donnees_utilisateur as d (utilisateur_id, magasin, cle, valeur, quand, taille)
    values (
      p_utilisateur, e ->> 'm', e ->> 'c',
      case when v_taille = 0 then null else e -> 'v' end,
      (e ->> 'q')::bigint, v_taille
    )
    on conflict (utilisateur_id, magasin, cle) do update
      set valeur = excluded.valeur, quand = excluded.quand, taille = excluded.taille,
          maj = nextval('public.donnees_utilisateur_maj')
      where excluded.quand > d.quand;
    if found then
      v_total := v_total - v_ancienne + v_taille;
    end if;
  end loop;

  select coalesce(max(d.maj), 0) into v_maj from public.donnees_utilisateur d where d.utilisateur_id = p_utilisateur;
  return jsonb_build_object('maj', v_maj, 'refusees', v_refusees);
end $$;

-- 6. Lire ce qui a changé depuis un numéro d'ordre -------------------------
-- La réponse est bornée en nombre de lignes et en poids : l'appareil redemande la suite.
create or replace function public.donnees_lire(p_utilisateur uuid, p_depuis bigint, p_limite integer, p_octets bigint)
returns table (magasin text, cle text, valeur jsonb, quand bigint, maj bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select t.magasin, t.cle, t.valeur, t.quand, t.maj
  from (
    select d.*, sum(d.taille) over (order by d.maj) as cumul
    from public.donnees_utilisateur d
    where d.utilisateur_id = p_utilisateur and d.maj > p_depuis
  ) t
  where t.cumul - t.taille < p_octets
  order by t.maj
  limit greatest(1, least(p_limite, 500));
$$;

-- 7. La place occupée par un compte ---------------------------------------
create or replace function public.compte_place(p_utilisateur uuid)
returns table (donnees bigint, objets bigint, fichiers bigint, nb_fichiers bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    (select coalesce(sum(d.taille), 0) from public.donnees_utilisateur d where d.utilisateur_id = p_utilisateur)::bigint,
    (select count(*) from public.donnees_utilisateur d where d.utilisateur_id = p_utilisateur and d.valeur is not null)::bigint,
    (select coalesce(sum(f.taille), 0) from public.fichiers_utilisateur f where f.utilisateur_id = p_utilisateur)::bigint,
    (select count(*) from public.fichiers_utilisateur f where f.utilisateur_id = p_utilisateur)::bigint;
$$;

-- Ces fonctions ne sont appelées que par le serveur.
revoke all on function public.compte_ouvrir(text, text, text) from public, anon, authenticated;
revoke all on function public.donnees_ecrire(uuid, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.donnees_lire(uuid, bigint, integer, bigint) from public, anon, authenticated;
revoke all on function public.compte_place(uuid) from public, anon, authenticated;
grant execute on function public.compte_ouvrir(text, text, text) to service_role;
grant execute on function public.donnees_ecrire(uuid, jsonb, bigint) to service_role;
grant execute on function public.donnees_lire(uuid, bigint, integer, bigint) to service_role;
grant execute on function public.compte_place(uuid) to service_role;

-- L'API de Supabase relit la liste des fonctions (sinon elles n'apparaissent qu'au bout d'un moment).
notify pgrst, 'reload schema';
