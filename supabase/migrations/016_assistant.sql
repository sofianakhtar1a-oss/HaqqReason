-- =====================================================================
-- 016 · L'Assistant (Claude) : chat général et ChatPDF
--   • Chaque compte relie SA clé API de la console Anthropic : toute la
--     consommation de jetons est facturée sur SON compte Anthropic, jamais
--     sur celui du site. La clé est chiffrée (AES-256-GCM) par le serveur
--     avant d'arriver ici, liée au compte (elle ne se déchiffre pour aucun
--     autre), et n'est jamais renvoyée au navigateur.
--   • Les conversations, les messages et le texte des PDF importés sont
--     rangés par compte. Supprimer le compte efface tout.
--   • Chaque réponse note les jetons consommés (entrée, sortie, cache) et
--     une estimation du coût, pour que l'utilisateur suive sa dépense.
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script peut être relancé sans risque (014_comptes.sql doit avoir été lancé avant).
-- =====================================================================

-- 1. La clé API de chaque compte, et ses réglages ----------------------
create table if not exists public.assistant_cles (
  utilisateur_id      uuid primary key references public.utilisateurs (id) on delete cascade,
  -- « v1. » + base64(iv | étiquette | texte chiffré) : illisible sans le secret du serveur.
  cle_chiffree        text not null check (cle_chiffree ~ '^v1\.[A-Za-z0-9+/=]+$' and char_length(cle_chiffree) <= 1200),
  -- Ce que l'utilisateur voit de sa clé : « sk-ant-…a1B2 ».
  apercu              text not null check (char_length(apercu) <= 40),
  modele              text not null default 'claude-sonnet-5-5' check (modele ~ '^claude-[a-z0-9-]{3,60}$'),
  effort              text not null default 'medium' check (effort in ('low', 'medium', 'high')),
  -- Plafond mensuel facultatif (estimation en dollars) : au-delà, le site refuse d'envoyer.
  plafond_mensuel_usd numeric(10, 2) check (plafond_mensuel_usd is null or plafond_mensuel_usd between 0 and 100000),
  statut              text not null default 'valide' check (statut in ('valide', 'invalide')),
  verifiee_le         timestamptz not null default now(),
  cree_le             timestamptz not null default now(),
  maj                 timestamptz not null default now()
);

-- 2. Les conversations ---------------------------------------------------
create table if not exists public.assistant_conversations (
  id             uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  espace         text not null check (espace in ('general', 'pdf')),
  titre          text not null default '' check (char_length(titre) <= 200),
  -- Lecture intégrale des PDF (plus précise, plus coûteuse) ou extraits pertinents.
  lecture        text not null default 'auto' check (lecture in ('auto', 'integrale')),
  -- Dernier numéro donné à un PDF de la conversation (voir assistant_documents.numero).
  dernier_numero integer not null default 0 check (dernier_numero >= 0),
  cree_le        timestamptz not null default now(),
  maj            timestamptz not null default now()
);
create index if not exists assistant_conversations_compte_idx on public.assistant_conversations (utilisateur_id, espace, maj desc);

-- 3. Les messages ---------------------------------------------------------
create table if not exists public.assistant_messages (
  id                    uuid primary key default gen_random_uuid(),
  conversation_id       uuid not null references public.assistant_conversations (id) on delete cascade,
  utilisateur_id        uuid not null references public.utilisateurs (id) on delete cascade,
  role                  text not null check (role in ('user', 'assistant')),
  contenu               text not null check (char_length(contenu) <= 400000),
  modele                text not null default '' check (char_length(modele) <= 80),
  etat                  text not null default 'complet' check (etat in ('complet', 'interrompu', 'erreur')),
  jetons_entree         integer not null default 0 check (jetons_entree >= 0),
  jetons_sortie         integer not null default 0 check (jetons_sortie >= 0),
  jetons_cache_ecriture integer not null default 0 check (jetons_cache_ecriture >= 0),
  jetons_cache_lecture  integer not null default 0 check (jetons_cache_lecture >= 0),
  cout_usd              numeric(12, 6) not null default 0 check (cout_usd >= 0),
  cree_le               timestamptz not null default now()
);
create index if not exists assistant_messages_conversation_idx on public.assistant_messages (conversation_id, cree_le);

-- 4. Le texte des PDF importés (extrait dans le navigateur) ---------------
create table if not exists public.assistant_documents (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.assistant_conversations (id) on delete cascade,
  utilisateur_id   uuid not null references public.utilisateurs (id) on delete cascade,
  -- Numéro du document dans sa conversation (« Doc 3 ») : donné à l'import, il ne change plus,
  -- même si un autre document est retiré. Les références des anciennes réponses restent justes.
  numero           integer not null default 0 check (numero >= 0),
  nom              text not null check (char_length(nom) between 1 and 300),
  pages            integer not null check (pages between 1 and 5000),
  pages_vides      integer not null default 0 check (pages_vides >= 0),
  caracteres       integer not null check (caracteres >= 0),
  jetons_estimes   integer not null check (jetons_estimes >= 0),
  -- Empreinte SHA-256 du fichier : le même PDF n'est pas importé deux fois dans une conversation.
  empreinte        text not null check (empreinte ~ '^[0-9a-f]{64}$'),
  -- Le texte, page par page, sous la forme « [Page N] … ».
  texte            text not null check (char_length(texte) <= 3000000),
  actif            boolean not null default true,
  cree_le          timestamptz not null default now(),
  unique (conversation_id, empreinte),
  unique (conversation_id, numero)
);
create index if not exists assistant_documents_compte_idx on public.assistant_documents (utilisateur_id);

create or replace function public.assistant_documents_numero()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Le compteur de la conversation : la ligne verrouillée met deux imports simultanés à la file.
  update public.assistant_conversations c
     set dernier_numero = c.dernier_numero + 1
   where c.id = new.conversation_id
  returning c.dernier_numero into new.numero;
  return new;
end
$$;
drop trigger if exists assistant_documents_numero on public.assistant_documents;
create trigger assistant_documents_numero before insert on public.assistant_documents
  for each row execute function public.assistant_documents_numero();
revoke all on function public.assistant_documents_numero() from public, anon, authenticated;

-- 5. Le journal de consommation (une ligne par appel à Claude) ------------
create table if not exists public.assistant_usage (
  id                    bigint generated always as identity primary key,
  utilisateur_id        uuid not null references public.utilisateurs (id) on delete cascade,
  conversation_id       uuid references public.assistant_conversations (id) on delete set null,
  modele                text not null check (char_length(modele) <= 80),
  jetons_entree         integer not null default 0 check (jetons_entree >= 0),
  jetons_sortie         integer not null default 0 check (jetons_sortie >= 0),
  jetons_cache_ecriture integer not null default 0 check (jetons_cache_ecriture >= 0),
  jetons_cache_lecture  integer not null default 0 check (jetons_cache_lecture >= 0),
  cout_usd              numeric(12, 6) not null default 0 check (cout_usd >= 0),
  statut                text not null check (statut in ('ok', 'interrompu', 'erreur')),
  cree_le               timestamptz not null default now()
);
create index if not exists assistant_usage_compte_idx on public.assistant_usage (utilisateur_id, cree_le desc);

-- 6. Les vérifications de clé (une par essai) --------------------------------
-- Le site ne doit pas servir à tester en masse des clés volées : peu d'essais par heure et par compte.
create table if not exists public.assistant_verifications (
  id             bigint generated always as identity primary key,
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  reussie        boolean not null,
  cree_le        timestamptz not null default now()
);
create index if not exists assistant_verifications_compte_idx on public.assistant_verifications (utilisateur_id, cree_le desc);

-- 7. Réservé au serveur -----------------------------------------------------
alter table public.assistant_cles enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_documents enable row level security;
alter table public.assistant_usage enable row level security;
alter table public.assistant_verifications enable row level security;
revoke all on table public.assistant_cles, public.assistant_conversations, public.assistant_messages,
  public.assistant_documents, public.assistant_usage, public.assistant_verifications from anon, authenticated;
grant all on table public.assistant_cles, public.assistant_conversations, public.assistant_messages,
  public.assistant_documents, public.assistant_usage, public.assistant_verifications to service_role;
revoke all on sequence public.assistant_usage_id_seq, public.assistant_verifications_id_seq from anon, authenticated;
grant usage, select on sequence public.assistant_usage_id_seq, public.assistant_verifications_id_seq to service_role;

comment on table public.assistant_cles is 'Clé API Anthropic de chaque compte, chiffrée par le serveur (jamais en clair). Réservée au serveur.';
comment on table public.assistant_conversations is 'Conversations de l''Assistant (chat général ou ChatPDF). Réservée au serveur.';
comment on table public.assistant_messages is 'Messages de l''Assistant, avec les jetons consommés. Réservée au serveur.';
comment on table public.assistant_documents is 'Texte des PDF importés dans une conversation ChatPDF. Réservée au serveur.';
comment on table public.assistant_usage is 'Journal de consommation : un appel à Claude par ligne, facturé sur la clé du compte. Réservée au serveur.';
comment on table public.assistant_verifications is 'Essais de vérification d''une clé API (limités par heure et par compte). Réservée au serveur.';

-- 8. Le bilan d'un compte : rythme d'envoi, dépense du mois, place occupée ----
create or replace function public.assistant_bilan(p_utilisateur uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'dix_minutes', (select count(*) from public.assistant_usage u
                     where u.utilisateur_id = p_utilisateur and u.cree_le > now() - interval '10 minutes'),
    'aujourdhui', (select count(*) from public.assistant_usage u
                    where u.utilisateur_id = p_utilisateur
                      and u.cree_le >= date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'),
    'mois_cout', (select coalesce(sum(u.cout_usd), 0) from public.assistant_usage u
                   where u.utilisateur_id = p_utilisateur
                     and u.cree_le >= date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'),
    'mois_jetons', (select coalesce(sum(u.jetons_entree + u.jetons_sortie + u.jetons_cache_ecriture + u.jetons_cache_lecture), 0)
                     from public.assistant_usage u
                     where u.utilisateur_id = p_utilisateur
                       and u.cree_le >= date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'),
    'mois_appels', (select count(*) from public.assistant_usage u
                     where u.utilisateur_id = p_utilisateur
                       and u.cree_le >= date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'),
    'documents_caracteres', (select coalesce(sum(d.caracteres), 0) from public.assistant_documents d where d.utilisateur_id = p_utilisateur),
    'conversations', (select count(*) from public.assistant_conversations c where c.utilisateur_id = p_utilisateur),
    'verifications_heure', (select count(*) from public.assistant_verifications v
                             where v.utilisateur_id = p_utilisateur and v.cree_le > now() - interval '1 hour')
  )
$$;

revoke all on function public.assistant_bilan(uuid) from public, anon, authenticated;
grant execute on function public.assistant_bilan(uuid) to service_role;

-- 9. Le texte d'une seule page d'un PDF importé (pour vérifier une référence « [Doc 2, p. 14] ») ----
-- Le texte est rangé sous la forme « [Page 1]\n…\n\n[Page 2]\n… » : on renvoie le passage de la page demandée.
create or replace function public.assistant_page(p_utilisateur uuid, p_document uuid, p_page integer)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when d.debut = 0 then null
    else substr(d.texte, d.debut, least(coalesce(nullif(strpos(substr(d.texte, d.debut + 1), E'\n\n[Page '), 0), 60000), 60000))
  end
  from (
    select texte, strpos(texte, '[Page ' || p_page::text || E']\n') as debut
    from public.assistant_documents
    where id = p_document and utilisateur_id = p_utilisateur
  ) d
$$;

revoke all on function public.assistant_page(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.assistant_page(uuid, uuid, integer) to service_role;
