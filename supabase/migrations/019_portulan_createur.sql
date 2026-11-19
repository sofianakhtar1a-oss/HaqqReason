-- =====================================================================
-- 019 · Le Portulan : ce que le créateur voit de son atelier
--   • Les signalements d'erreur, envoyés depuis une fiche ou après une question.
--   • Les questions les plus manquées : vues et fautes, par mois, méthode et pays
--     (aucun nom d'élève : seulement des totaux).
--   • La vitesse réelle : les mesures des navigateurs (Web Vitals) rangées en
--     histogrammes par jour, d'où l'on tire le 75e centile.
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script ne fait qu'ajouter (tables, fonctions) et peut être relancé.
-- 017 doit avoir été lancé avant.
-- =====================================================================

-- 1. Les signalements -----------------------------------------------------------
create table if not exists public.portulan_signalements (
  id             uuid        primary key default gen_random_uuid(),
  le             timestamptz not null default now(),
  utilisateur_id uuid        references public.utilisateurs (id) on delete set null,
  code           text        check (code is null or code ~ '^[a-z0-9-]{2,12}$'),
  sujet          text        not null check (char_length(sujet) between 2 and 40),
  texte          text        not null check (char_length(texte) between 3 and 1000),
  contexte       jsonb       not null default '{}'::jsonb,
  traite         boolean     not null default false
);
create index if not exists portulan_signalements_le_idx on public.portulan_signalements (le desc);

-- 2. Les questions manquées -----------------------------------------------------
create table if not exists public.portulan_manques (
  mois   date    not null,
  type   text    not null check (type ~ '^[a-z0-9-]{2,40}$'),
  cible  text    not null check (cible ~ '^[a-z0-9-]{2,12}$'),
  vues   integer not null default 0 check (vues >= 0),
  fautes integer not null default 0 check (fautes >= 0),
  primary key (mois, type, cible)
);

-- 3. La vitesse réelle ----------------------------------------------------------
create table if not exists public.portulan_vitesse (
  jour   date    not null,
  mesure text    not null check (mesure in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
  seau   integer not null check (seau between 0 and 400),
  n      integer not null default 0 check (n >= 0),
  primary key (jour, mesure, seau)
);

alter table public.portulan_signalements enable row level security;
alter table public.portulan_manques enable row level security;
alter table public.portulan_vitesse enable row level security;
revoke all on table public.portulan_signalements, public.portulan_manques, public.portulan_vitesse from anon, authenticated;
grant all on table public.portulan_signalements, public.portulan_manques, public.portulan_vitesse to service_role;

-- 4. Noter des réponses jugées : [{ "type": …, "cible": …, "juste": true }, …] ----
-- Une même question peut revenir deux fois dans un envoi : on additionne d'abord.
create or replace function public.portulan_manques_noter(p_reponses jsonb)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(p_reponses) is distinct from 'array' then
    return;
  end if;
  insert into public.portulan_manques as m (mois, type, cible, vues, fautes)
  select date_trunc('month', (now() at time zone 'Europe/Paris'))::date, x.type, x.cible,
         count(*)::integer, count(*) filter (where not coalesce(x.juste, false))::integer
  from jsonb_to_recordset(p_reponses) as x(type text, cible text, juste boolean)
  where x.type ~ '^[a-z0-9-]{2,40}$' and x.cible ~ '^[a-z0-9-]{2,12}$'
  group by x.type, x.cible
  on conflict (mois, type, cible) do update
    set vues = m.vues + excluded.vues, fautes = m.fautes + excluded.fautes;
end;
$$;

-- 5. Noter une mesure de vitesse ------------------------------------------------
-- Les seaux : 50 ms pour LCP, FCP et TTFB (jusqu'à 20 s), 10 ms pour INP (4 s),
-- un centième pour CLS (4). Au-delà, tout va dans le dernier seau.
create or replace function public.portulan_vitesse_noter(p_mesure text, p_valeur double precision)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_seau integer;
begin
  if p_mesure not in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB') or p_valeur is null or p_valeur < 0 or p_valeur = 'NaN'::double precision then
    return;
  end if;
  v_seau := least(400, floor(case p_mesure when 'CLS' then p_valeur * 100 when 'INP' then p_valeur / 10 else p_valeur / 50 end))::integer;
  insert into public.portulan_vitesse as v (jour, mesure, seau, n)
  values ((now() at time zone 'Europe/Paris')::date, p_mesure, v_seau, 1)
  on conflict (jour, mesure, seau) do update set n = v.n + 1;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.portulan_manques_noter(jsonb)',
    'public.portulan_vitesse_noter(text, double precision)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
