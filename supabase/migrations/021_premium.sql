-- =====================================================================
-- 021 · L'offre Premium (paiement par Stripe)
--   • abonnements_premium : l'abonnement de chaque compte, recopié depuis
--     Stripe, qui fait foi. Aucun numéro de carte ici : Stripe les garde
--     chez lui, le site ne les voit jamais.
--   • usages_premium : les compteurs des parties gratuites limitées
--     (par exemple trois dictées par semaine), tenus par le serveur.
--   • evenements_stripe : les avis reçus de Stripe, pour ne pas traiter
--     deux fois le même et montrer au créateur que le lien fonctionne.
--   • premium_consommer : compte une utilisation d'un seul coup, sans
--     jamais dépasser la limite, même si deux appareils demandent en même temps.
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script peut être relancé sans risque.
-- =====================================================================

-- 1. Les abonnements -----------------------------------------------------
create table if not exists public.abonnements_premium (
  compte                  uuid primary key references public.utilisateurs (id) on delete cascade,
  -- Identifiants chez Stripe (client « cus_… », abonnement « sub_… »).
  stripe_client           text unique check (stripe_client is null or stripe_client ~ '^cus_[A-Za-z0-9]{1,250}$'),
  stripe_abonnement       text unique check (stripe_abonnement is null or stripe_abonnement ~ '^sub_[A-Za-z0-9]{1,250}$'),
  -- « aucun », ou l'état donné par Stripe : active, trialing, past_due, canceled, unpaid…
  statut                  text not null default 'aucun' check (statut ~ '^[a-z_]{1,40}$'),
  formule                 text check (formule is null or formule in ('mois', 'annee')),
  -- Fin de la période déjà payée : l'accès court jusque-là.
  fin_periode             timestamptz,
  -- L'abonné a résilié : l'accès reste jusqu'à la fin de la période, puis s'arrête.
  resiliation_fin_periode boolean not null default false,
  -- Prix payé (centimes), pour les chiffres du créateur.
  montant                 integer check (montant is null or montant between 0 and 10000000),
  -- Les cases cochées avant le paiement (CGV, accès immédiat), avec leur date et leur version.
  consentement            jsonb,
  -- Dernière vérification auprès de Stripe (le site revérifie si un avis s'est perdu).
  verifie_le              timestamptz,
  maj                     timestamptz not null default now(),
  cree_le                 timestamptz not null default now()
);

create index if not exists abonnements_premium_statut_idx on public.abonnements_premium (statut);

-- 2. Les compteurs des parties limitées ------------------------------------
--   periode : « j-2026-11-23 », « s-2026-W48 », « m-2026-11 » ou « total ».
--   element : vide pour un simple compteur ; sinon l'objet ouvert (une histoire,
--             un niveau…), compté une seule fois : le rouvrir ne coûte rien.
create table if not exists public.usages_premium (
  compte   uuid not null references public.utilisateurs (id) on delete cascade,
  fonction text not null check (fonction ~ '^[a-z][a-z0-9.-]{0,59}$'),
  periode  text not null check (periode ~ '^[a-z0-9-]{1,20}$'),
  element  text not null default '' check (char_length(element) <= 120),
  nombre   integer not null default 0 check (nombre >= 0),
  quand    timestamptz not null default now(),
  primary key (compte, fonction, periode, element)
);

-- 3. Les avis reçus de Stripe -----------------------------------------------
create table if not exists public.evenements_stripe (
  id      text primary key check (id ~ '^evt_[A-Za-z0-9]{1,250}$'),
  type    text not null check (char_length(type) <= 100),
  recu_le timestamptz not null default now()
);

create index if not exists evenements_stripe_recu_idx on public.evenements_stripe (recu_le desc);

alter table public.abonnements_premium enable row level security;
alter table public.usages_premium enable row level security;
alter table public.evenements_stripe enable row level security;
revoke all on table public.abonnements_premium, public.usages_premium, public.evenements_stripe from anon, authenticated;
grant all on table public.abonnements_premium, public.usages_premium, public.evenements_stripe to service_role;
comment on table public.abonnements_premium is
  'Abonnements Premium (recopiés depuis Stripe, qui fait foi). Réservée au serveur.';
comment on table public.usages_premium is
  'Compteurs des parties gratuites limitées. Réservée au serveur.';
comment on table public.evenements_stripe is
  'Avis reçus de Stripe (anti-doublon et journal). Réservée au serveur.';

-- 4. Compter une utilisation, sans course ni dépassement ---------------------
--   Renvoie { ok, utilise, deja } :
--     ok      faux si la limite est atteinte (rien n'est compté) ;
--     utilise le nombre d'utilisations de la période, celle-ci comprise ;
--     deja    vrai si l'objet avait déjà été ouvert dans la période (gratuit).
create or replace function public.premium_consommer(p_compte uuid, p_fonction text, p_periode text, p_limite integer, p_element text default '')
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_element text := coalesce(p_element, '');
  v_n integer;
begin
  if p_compte is null or p_limite is null or p_limite <= 0 or p_limite > 100000 then
    return jsonb_build_object('ok', false, 'utilise', 0, 'deja', false);
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_compte) then
    return jsonb_build_object('ok', false, 'utilise', 0, 'deja', false);
  end if;
  -- Un seul calcul à la fois par compte et par fonction : deux onglets ne passent pas ensemble.
  perform pg_advisory_xact_lock(hashtextextended(p_compte::text || ':' || p_fonction, 21));
  -- Les périodes passées ne servent plus : on les efface au passage.
  delete from public.usages_premium
   where compte = p_compte and fonction = p_fonction and periode <> p_periode;

  if v_element <> '' then
    select count(*) into v_n from public.usages_premium
     where compte = p_compte and fonction = p_fonction and periode = p_periode and element <> '';
    if exists (select 1 from public.usages_premium
                where compte = p_compte and fonction = p_fonction and periode = p_periode and element = v_element) then
      return jsonb_build_object('ok', true, 'utilise', v_n, 'deja', true);
    end if;
    if v_n >= p_limite then
      return jsonb_build_object('ok', false, 'utilise', v_n, 'deja', false);
    end if;
    insert into public.usages_premium (compte, fonction, periode, element, nombre)
    values (p_compte, p_fonction, p_periode, v_element, 1);
    return jsonb_build_object('ok', true, 'utilise', v_n + 1, 'deja', false);
  end if;

  select nombre into v_n from public.usages_premium
   where compte = p_compte and fonction = p_fonction and periode = p_periode and element = '';
  v_n := coalesce(v_n, 0);
  if v_n >= p_limite then
    return jsonb_build_object('ok', false, 'utilise', v_n, 'deja', false);
  end if;
  insert into public.usages_premium (compte, fonction, periode, element, nombre)
  values (p_compte, p_fonction, p_periode, '', 1)
  on conflict (compte, fonction, periode, element)
  do update set nombre = public.usages_premium.nombre + 1, quand = now();
  return jsonb_build_object('ok', true, 'utilise', v_n + 1, 'deja', false);
end;
$$;

revoke all on function public.premium_consommer(uuid, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.premium_consommer(uuid, text, text, integer, text) to service_role;
