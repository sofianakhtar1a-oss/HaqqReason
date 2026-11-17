-- =====================================================================
-- 013 · Messagerie des contributions et « Amélioration du site »
--   • Nouveau type de contribution « site » : idée de fonctionnalité
--     ou signalement de bug (colonne « nature »).
--   • Une conversation par contribution : le créateur répond, l'auteur
--     voit les réponses et peut répondre à son tour.
--   • L'auteur n'a pas de compte : à l'envoi, son navigateur reçoit un
--     jeton secret. La base n'en garde que l'empreinte (SHA-256).
-- Le script peut être relancé sans risque.
-- =====================================================================

-- 1. Nouveau type, nature, jeton de suivi, suivi de lecture -----------
alter table public.contributions drop constraint if exists contributions_type_check;
alter table public.contributions
  add constraint contributions_type_check check (type in ('idee', 'argument', 'site'));

alter table public.contributions add column if not exists nature text not null default '';
alter table public.contributions drop constraint if exists contributions_nature_check;
alter table public.contributions
  add constraint contributions_nature_check check (
    (type = 'site' and nature in ('fonctionnalite', 'bug')) or (type <> 'site' and nature = '')
  );

alter table public.contributions add column if not exists jeton_hash text not null default '';
-- « lue » : le créateur a ouvert la contribution. À la création de la colonne, ce qui a
-- déjà été traité (publié, masqué, refusé) compte comme lu ; seules les attentes restent neuves.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contributions' and column_name = 'lue'
  ) then
    alter table public.contributions add column lue boolean not null default false;
    update public.contributions set lue = true where statut <> 'en_attente';
  end if;
end $$;
alter table public.contributions add column if not exists derniere_activite timestamptz not null default now();

create index if not exists contributions_jeton_idx on public.contributions (jeton_hash) where jeton_hash <> '';
create index if not exists contributions_activite_idx on public.contributions (derniere_activite desc);

-- Le public lit aussi la nature (bug ou fonctionnalité) des contributions publiées.
grant select (nature) on public.contributions to anon, authenticated;

-- 2. Les messages d'une conversation ------------------------------------
create table if not exists public.contributions_messages (
  id              uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  auteur          text not null check (auteur in ('createur', 'lecteur')),
  texte           text not null check (char_length(texte) between 1 and 4000),
  -- Pour un message du lecteur : le créateur l'a-t-il lu ?
  -- Pour un message du créateur : le lecteur l'a-t-il lu ?
  lu              boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists contributions_messages_fil_idx
  on public.contributions_messages (contribution_id, created_at);
create index if not exists contributions_messages_non_lus_idx
  on public.contributions_messages (auteur) where not lu;

-- Réservée au serveur : un message n'est montré qu'à l'auteur (par son
-- jeton) ou, pour les réponses du créateur, sous une contribution publiée.
alter table public.contributions_messages enable row level security;
revoke all on table public.contributions_messages from anon, authenticated;
grant all on table public.contributions_messages to service_role;

comment on table public.contributions_messages is
  'Conversation entre le créateur et l''auteur d''une contribution. Réservée au serveur.';
