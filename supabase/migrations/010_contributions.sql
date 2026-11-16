-- =====================================================================
-- HaqqReason — Migration 010 : contributions des lecteurs
--   • « Idées de sujet »    : un lecteur propose un sujet à traiter.
--   • « Renforcer un article » : un lecteur propose un argument de plus.
-- À exécuter UNE SEULE FOIS dans Supabase : SQL Editor > New query > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les contributions
--    Le public ne voit que ce qui est publié, et seulement les colonnes
--    publiques : l'empreinte d'adresse et le motif de refus restent au
--    serveur. Toute écriture passe par le serveur (clé secrète), qui
--    filtre d'abord les grossièretés.
-- ---------------------------------------------------------------------
create table public.contributions (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('idee', 'argument')),
  bloc_id      uuid references public.blocs (id) on delete restrict,
  article_id   uuid references public.articles (id) on delete set null,
  pseudo       text not null default '' check (char_length(pseudo) <= 40),
  titre        text not null check (char_length(titre) between 5 and 160),
  texte        text not null check (char_length(texte) between 20 and 4000),
  statut       text not null default 'en_attente'
                 check (statut in ('en_attente', 'publiee', 'refusee', 'masquee')),
  motif        text not null default '',
  signalements integer not null default 0 check (signalements >= 0),
  ip_hash      text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Une idée de sujet porte toujours sur l'un des trois blocs.
  constraint contributions_idee_a_un_bloc check (type <> 'idee' or bloc_id is not null)
);

create index contributions_publiees_idx on public.contributions (type, created_at desc)
  where statut = 'publiee';
create index contributions_attente_idx  on public.contributions (statut, created_at desc);
create index contributions_article_idx  on public.contributions (article_id)
  where statut = 'publiee';
create index contributions_ip_idx       on public.contributions (ip_hash, created_at desc);

create trigger contributions_touch
  before update on public.contributions
  for each row execute function public.touch_updated_at();

comment on table public.contributions is
  'Idées de sujet et propositions d''arguments envoyées par les lecteurs. Lecture publique limitée aux contributions publiées.';

-- ---------------------------------------------------------------------
-- 2. Signalements : une adresse ne peut signaler qu'une fois la même
--    contribution. La table reste invisible du public.
-- ---------------------------------------------------------------------
create table public.contributions_signalements (
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  ip_hash         text not null,
  created_at      timestamptz not null default now(),
  primary key (contribution_id, ip_hash)
);

alter table public.contributions_signalements enable row level security;
revoke all on table public.contributions_signalements from anon, authenticated;
grant all on table public.contributions_signalements to service_role;

comment on table public.contributions_signalements is
  'Qui a déjà signalé quelle contribution, pour qu''un même visiteur ne la signale pas deux fois. Réservée au serveur.';

-- ---------------------------------------------------------------------
-- 3. Sécurité au niveau des lignes
--    Lecture publique : uniquement les contributions publiées, et
--    uniquement les colonnes qui ne trahissent pas leur auteur.
--    Aucune écriture publique : tout passe par le serveur.
-- ---------------------------------------------------------------------
alter table public.contributions enable row level security;

revoke all on table public.contributions from anon, authenticated;
grant select (id, type, bloc_id, article_id, pseudo, titre, texte, created_at)
  on public.contributions to anon, authenticated;
grant all on table public.contributions to service_role;

create policy "lecture publique des contributions publiées" on public.contributions
  for select to anon, authenticated
  using (statut = 'publiee');

-- ---------------------------------------------------------------------
-- 4. Compteurs, pour la page du créateur
-- ---------------------------------------------------------------------
create function public.etat_contributions()
returns table (
  en_attente bigint,
  publiees   bigint,
  refusees   bigint,
  masquees   bigint,
  signalees  bigint
)
language sql stable security definer set search_path = '' as $$
  select
    count(*) filter (where statut = 'en_attente'),
    count(*) filter (where statut = 'publiee'),
    count(*) filter (where statut = 'refusee'),
    count(*) filter (where statut = 'masquee'),
    count(*) filter (where signalements > 0 and statut = 'publiee')
  from public.contributions;
$$;

revoke all on function public.etat_contributions() from public, anon, authenticated;
grant execute on function public.etat_contributions() to service_role;

-- ---------------------------------------------------------------------
-- 5. Réglages liés aux contributions
--    • contributions_ouvertes : accepter de nouveaux envois.
--    • contributions_validation : attendre la validation du créateur
--      avant toute publication (par défaut non : ce qui est propre
--      paraît aussitôt, le reste attend de toute façon).
-- ---------------------------------------------------------------------
insert into public.reglages (cle, valeur) values
  ('contributions_ouvertes',   'true'::jsonb),
  ('contributions_validation', 'false'::jsonb)
on conflict (cle) do nothing;
