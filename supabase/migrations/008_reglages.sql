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
