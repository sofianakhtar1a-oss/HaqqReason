-- =====================================================================
-- 018 · Le Portulan : défis, records en ligne, double XP, amis, duels à
--       distance, salons, classes et notifications
--   • Défis du jour et de la semaine : les mêmes questions pour tout le monde
--     (tirées de la date), une seule tentative, jugée par le serveur du site.
--   • Records en ligne de l'éclair, du sans-faute et du marathon.
--   • Double XP : dix minutes, une fois par jour.
--   • Duels : à distance (24 heures pour jouer), réglables (5, 10 ou 15 questions,
--     temps par question), cote de type Elo pour trouver un adversaire de son
--     niveau, réactions rapides.
--   • Amis : un code ami à partager, demandes, face-à-face.
--   • Salons de 3 à 8 joueurs (classique ou à élimination).
--   • Classes : un enseignant crée une classe, ses élèves la rejoignent avec un code.
--   • Abonnements aux notifications du téléphone (web push).
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script ne fait qu'ajouter (colonnes, tables, fonctions) et peut être relancé.
-- 017 doit avoir été lancé avant.
-- =====================================================================

-- 1. De nouvelles colonnes ----------------------------------------------------
alter table public.portulan_scores add column if not exists elo integer not null default 1200;
alter table public.portulan_scores add column if not exists double_jusqua timestamptz;
alter table public.portulan_scores add column if not exists double_jour date;
alter table public.portulan_scores add column if not exists code_ami text;
create unique index if not exists portulan_scores_code_ami_idx on public.portulan_scores (code_ami) where code_ami is not null;
create index if not exists portulan_scores_elo_idx on public.portulan_scores (elo);

alter table public.portulan_duels add column if not exists asynchrone boolean not null default false;
alter table public.portulan_duels add column if not exists nombre integer not null default 10;
alter table public.portulan_duels add column if not exists duree integer not null default 15000;
alter table public.portulan_duels add column if not exists rejoint timestamptz;
alter table public.portulan_duels add column if not exists reactions jsonb not null default '{}'::jsonb;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portulan_duels_nombre_check') then
    alter table public.portulan_duels add constraint portulan_duels_nombre_check check (nombre in (5, 10, 15));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'portulan_duels_duree_check') then
    alter table public.portulan_duels add constraint portulan_duels_duree_check check (duree between 5000 and 30000);
  end if;
end $$;

-- 2. Les nouvelles tables ------------------------------------------------------
create table if not exists public.portulan_records (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  mode           text not null check (mode in ('eclair', 'survie', 'marathon')),
  score          integer not null check (score between 0 and 5000),
  maj            timestamptz not null default now(),
  primary key (utilisateur_id, mode)
);
create index if not exists portulan_records_mode_idx on public.portulan_records (mode, score desc);

create table if not exists public.portulan_defis (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  sorte          text not null check (sorte in ('jour', 'semaine')),
  jour           date not null,
  score          integer not null check (score between 0 and 30),
  ms             integer not null default 0 check (ms >= 0),
  cree           timestamptz not null default now(),
  primary key (utilisateur_id, sorte, jour)
);
create index if not exists portulan_defis_jour_idx on public.portulan_defis (sorte, jour, score desc, ms);

create table if not exists public.portulan_amis (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  ami_id         uuid not null references public.utilisateurs (id) on delete cascade,
  etat           text not null check (etat in ('demande', 'ami')),
  cree           timestamptz not null default now(),
  primary key (utilisateur_id, ami_id),
  check (utilisateur_id <> ami_id)
);
create index if not exists portulan_amis_ami_idx on public.portulan_amis (ami_id);

create table if not exists public.portulan_salons (
  id        uuid primary key default gen_random_uuid(),
  code      text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  createur  uuid not null references public.utilisateurs (id) on delete cascade,
  mode      text not null check (mode in ('drapeaux', 'capitales', 'cartes', 'continents', 'monnaies', 'melange')),
  formule   text not null default 'classique' check (formule in ('classique', 'elimination')),
  nombre    integer not null default 10 check (nombre between 6 and 15),
  taille    integer not null default 8 check (taille between 3 and 8),
  graine    bigint not null check (graine between 0 and 4294967295),
  etat      text not null default 'attente' check (etat in ('attente', 'en_cours', 'fini', 'expire')),
  cree      timestamptz not null default now(),
  debut     timestamptz,
  fin       timestamptz
);
create index if not exists portulan_salons_createur_idx on public.portulan_salons (createur, cree desc);

create table if not exists public.portulan_salon_joueurs (
  salon_id       uuid not null references public.portulan_salons (id) on delete cascade,
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  rejoint        timestamptz not null default now(),
  points         integer not null default 0 check (points >= 0),
  reponses       jsonb not null default '[]'::jsonb,
  elimine_a      integer,
  rang           integer,
  primary key (salon_id, utilisateur_id)
);
create index if not exists portulan_salon_joueurs_utilisateur_idx on public.portulan_salon_joueurs (utilisateur_id);

create table if not exists public.portulan_classes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  nom          text not null check (char_length(nom) between 2 and 60),
  proprietaire uuid not null references public.utilisateurs (id) on delete cascade,
  cree         timestamptz not null default now()
);
create index if not exists portulan_classes_proprietaire_idx on public.portulan_classes (proprietaire);

create table if not exists public.portulan_classe_membres (
  classe_id      uuid not null references public.portulan_classes (id) on delete cascade,
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  rejoint        timestamptz not null default now(),
  primary key (classe_id, utilisateur_id)
);
create index if not exists portulan_classe_membres_utilisateur_idx on public.portulan_classe_membres (utilisateur_id);

create table if not exists public.portulan_abonnements (
  endpoint       text primary key check (char_length(endpoint) between 10 and 1000),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  cles           jsonb not null,
  cree           timestamptz not null default now()
);
create index if not exists portulan_abonnements_utilisateur_idx on public.portulan_abonnements (utilisateur_id);

alter table public.portulan_records enable row level security;
alter table public.portulan_defis enable row level security;
alter table public.portulan_amis enable row level security;
alter table public.portulan_salons enable row level security;
alter table public.portulan_salon_joueurs enable row level security;
alter table public.portulan_classes enable row level security;
alter table public.portulan_classe_membres enable row level security;
alter table public.portulan_abonnements enable row level security;
revoke all on table public.portulan_records, public.portulan_defis, public.portulan_amis, public.portulan_salons,
  public.portulan_salon_joueurs, public.portulan_classes, public.portulan_classe_membres, public.portulan_abonnements from anon, authenticated;
grant all on table public.portulan_records, public.portulan_defis, public.portulan_amis, public.portulan_salons,
  public.portulan_salon_joueurs, public.portulan_classes, public.portulan_classe_membres, public.portulan_abonnements to service_role;

-- Un instant, en millisecondes depuis 1970 (ce que le navigateur sait lire).
create or replace function public.portulan_ms(p timestamptz)
returns bigint
language sql
immutable
as $$ select case when p is null then null else (extract(epoch from p) * 1000)::bigint end $$;

-- 3. L'XP : la même règle qu'en 017, et le double pendant dix minutes ------------
create or replace function public.portulan_repondre(p_utilisateur uuid, p_reponses jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  c_plafond_xp       constant integer := 3000;
  c_plafond_reponses constant integer := 3000;
  c_intervalle       constant interval := interval '500 milliseconds';
  v_maintenant timestamptz := clock_timestamp();
  v_jour date := (v_maintenant at time zone 'Europe/Paris')::date;
  s public.portulan_scores%rowtype;
  v_jour_xp integer;
  v_jour_reponses integer;
  r jsonb;
  v_cle text;
  v_resultat text;
  v_base integer;
  v_lignes integer;
  v_gain integer;
  v_gains integer := 0;
  v_double boolean;
  v_details jsonb := '[]'::jsonb;
begin
  if p_reponses is null or jsonb_typeof(p_reponses) <> 'array' or jsonb_array_length(p_reponses) not between 1 and 12 then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;

  insert into public.portulan_scores (utilisateur_id) values (p_utilisateur) on conflict do nothing;
  select * into s from public.portulan_scores where utilisateur_id = p_utilisateur for update;
  if s.derniere_reponse is not null and v_maintenant - s.derniere_reponse < c_intervalle then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;
  v_double := s.double_jusqua is not null and v_maintenant < s.double_jusqua;

  insert into public.portulan_jour (utilisateur_id, jour) values (p_utilisateur, v_jour) on conflict do nothing;
  select pj.xp, pj.reponses into v_jour_xp, v_jour_reponses
    from public.portulan_jour pj where pj.utilisateur_id = p_utilisateur and pj.jour = v_jour for update;
  delete from public.portulan_vus v where v.utilisateur_id = p_utilisateur and v.jour < v_jour - 1;

  for r in select value from jsonb_array_elements(p_reponses) loop
    v_cle := r ->> 'cle';
    v_resultat := r ->> 'resultat';
    v_base := least(15, greatest(0, coalesce(nullif(r ->> 'base', '')::integer, 0)));
    if v_double then
      v_base := v_base * 2;
    end if;
    if v_cle is null or char_length(v_cle) not between 3 and 40 or v_resultat is null or v_resultat not in ('juste', 'presque', 'faux') then
      continue;
    end if;
    v_gain := 0;
    s.reponses := s.reponses + 1;
    v_jour_reponses := v_jour_reponses + 1;
    if v_resultat <> 'faux' then
      if v_resultat = 'juste' then
        s.bonnes := s.bonnes + 1;
      end if;
      insert into public.portulan_vus (utilisateur_id, jour, cle) values (p_utilisateur, v_jour, v_cle) on conflict do nothing;
      get diagnostics v_lignes = row_count;
      if v_lignes > 0 then
        v_gain := case when v_resultat = 'juste' then v_base else ceil(v_base / 2.0)::integer end;
      end if;
    end if;
    if v_jour_reponses > c_plafond_reponses then
      v_gain := 0;
    end if;
    v_gain := least(v_gain, greatest(0, c_plafond_xp - v_jour_xp - v_gains));
    v_gains := v_gains + v_gain;
    v_details := v_details || jsonb_build_object('cle', v_cle, 'resultat', v_resultat, 'gain', v_gain);
  end loop;

  update public.portulan_scores set
    xp = s.xp + v_gains,
    bonnes = s.bonnes,
    reponses = s.reponses,
    derniere_reponse = v_maintenant,
    maj = case when v_gains > 0 then v_maintenant else maj end
  where utilisateur_id = p_utilisateur;
  update public.portulan_jour set xp = v_jour_xp + v_gains, reponses = v_jour_reponses
  where utilisateur_id = p_utilisateur and jour = v_jour;

  return jsonb_build_object(
    'gain', v_gains,
    'xp', s.xp + v_gains,
    'aujourdhui', v_jour_xp + v_gains,
    'trophees', s.trophees,
    'plafond', (v_jour_xp + v_gains) >= c_plafond_xp,
    'double', case when v_double then public.portulan_ms(s.double_jusqua) else null end,
    'details', v_details
  );
end $$;

-- Dix minutes d'XP double, une fois par jour.
create or replace function public.portulan_double(p_utilisateur uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_jour date := (now() at time zone 'Europe/Paris')::date;
  s public.portulan_scores%rowtype;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  insert into public.portulan_scores (utilisateur_id) values (p_utilisateur) on conflict do nothing;
  select * into s from public.portulan_scores where utilisateur_id = p_utilisateur for update;
  if s.double_jour = v_jour then
    return jsonb_build_object('erreur', 'deja', 'jusqua', public.portulan_ms(s.double_jusqua));
  end if;
  update public.portulan_scores set double_jusqua = now() + interval '10 minutes', double_jour = v_jour where utilisateur_id = p_utilisateur;
  return jsonb_build_object('jusqua', public.portulan_ms(now() + interval '10 minutes'));
end $$;

-- 4. Les records en ligne ---------------------------------------------------------
create or replace function public.portulan_record_envoyer(p_utilisateur uuid, p_mode text, p_score integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  -- Un plafond par mode : l'éclair dure 60 secondes, le sans-faute et le marathon ont leurs limites.
  v_plafond integer := case p_mode when 'eclair' then 90 when 'survie' then 1500 when 'marathon' then 3000 else 0 end;
  v_avant integer;
begin
  if v_plafond = 0 or p_score is null or p_score < 0 then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  select score into v_avant from public.portulan_records where utilisateur_id = p_utilisateur and mode = p_mode;
  insert into public.portulan_records (utilisateur_id, mode, score) values (p_utilisateur, p_mode, least(p_score, v_plafond))
  on conflict (utilisateur_id, mode) do update set score = greatest(public.portulan_records.score, excluded.score),
    maj = case when excluded.score > public.portulan_records.score then now() else public.portulan_records.maj end;
  return jsonb_build_object('record', greatest(coalesce(v_avant, 0), least(p_score, v_plafond)), 'nouveau', least(p_score, v_plafond) > coalesce(v_avant, -1));
end $$;

create or replace function public.portulan_records_lire(p_utilisateur uuid, p_mode text)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_resultat jsonb;
begin
  with classes as (
    select r.utilisateur_id, r.score, r.maj, u.nom, u.avatar, rank() over (order by r.score desc) as rang
    from public.portulan_records r
    join public.utilisateurs u on u.id = r.utilisateur_id
    where r.mode = p_mode and u.classement and r.score > 0
  )
  select jsonb_build_object(
    'mode', p_mode,
    'top', coalesce((select jsonb_agg(jsonb_build_object('rang', c.rang, 'id', c.utilisateur_id, 'nom', c.nom, 'avatar', c.avatar, 'points', c.score) order by c.rang, c.maj)
      from (select * from classes order by rang, maj limit 20) c), '[]'::jsonb),
    'moi', (select jsonb_build_object('rang', c.rang, 'points', c.score) from classes c where c.utilisateur_id = p_utilisateur),
    'mien', (select r.score from public.portulan_records r where r.utilisateur_id = p_utilisateur and r.mode = p_mode)
  ) into v_resultat;
  return v_resultat;
end $$;

-- 5. Les défis du jour et de la semaine ---------------------------------------------
create or replace function public.portulan_defi_envoyer(p_utilisateur uuid, p_sorte text, p_score integer, p_ms integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_aujourdhui date := (now() at time zone 'Europe/Paris')::date;
  v_jour date := case when p_sorte = 'semaine' then date_trunc('week', v_aujourdhui)::date else v_aujourdhui end;
  v_lignes integer;
  v_score integer;
begin
  if p_sorte not in ('jour', 'semaine') or p_score is null or p_score not between 0 and 30 then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  insert into public.portulan_defis (utilisateur_id, sorte, jour, score, ms)
  values (p_utilisateur, p_sorte, v_jour, p_score, greatest(0, coalesce(p_ms, 0)))
  on conflict do nothing;
  get diagnostics v_lignes = row_count;
  select score into v_score from public.portulan_defis where utilisateur_id = p_utilisateur and sorte = p_sorte and jour = v_jour;
  return jsonb_build_object('jour', v_jour, 'score', v_score, 'deja', v_lignes = 0);
end $$;

create or replace function public.portulan_defi_lire(p_utilisateur uuid, p_sorte text)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_aujourdhui date := (now() at time zone 'Europe/Paris')::date;
  v_jour date := case when p_sorte = 'semaine' then date_trunc('week', v_aujourdhui)::date else v_aujourdhui end;
  v_resultat jsonb;
begin
  with classes as (
    select d.utilisateur_id, d.score, d.ms, u.nom, u.avatar, u.classement,
      rank() over (order by d.score desc, d.ms) as rang
    from public.portulan_defis d
    join public.utilisateurs u on u.id = d.utilisateur_id
    where d.sorte = p_sorte and d.jour = v_jour
  )
  select jsonb_build_object(
    'sorte', p_sorte,
    'jour', v_jour,
    'participants', (select count(*) from classes),
    'top', coalesce((select jsonb_agg(jsonb_build_object('rang', c.rang, 'id', c.utilisateur_id, 'nom', c.nom, 'avatar', c.avatar, 'points', c.score, 'ms', c.ms) order by c.rang)
      from (select * from classes where classement order by rang limit 20) c), '[]'::jsonb),
    'moi', (select jsonb_build_object('rang', c.rang, 'points', c.score, 'ms', c.ms) from classes c where c.utilisateur_id = p_utilisateur)
  ) into v_resultat;
  return v_resultat;
end $$;

-- 6. Les duels : à distance, réglables, avec une cote et des réactions ---------------

-- La fin d'un duel : trophées et cote (Elo, K = 32) ; à distance comme en direct.
create or replace function public.portulan_duel_clore(p_id uuid, p_abandon uuid default null)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
  v_gagnant uuid;
  v_ta integer := 0;
  v_tb integer := 0;
  v_ea integer;
  v_eb integer;
  v_attendu numeric;
  v_sa numeric;
  v_delta integer;
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or d.etat <> 'en_cours' or d.adversaire is null then
    return;
  end if;
  if p_abandon is not null then
    v_gagnant := case when p_abandon = d.createur then d.adversaire else d.createur end;
  elsif d.points_a > d.points_b then
    v_gagnant := d.createur;
  elsif d.points_b > d.points_a then
    v_gagnant := d.adversaire;
  end if;
  if v_gagnant is null then
    v_ta := 8;
    v_tb := 8;
  elsif v_gagnant = d.createur then
    v_ta := 20;
  else
    v_tb := 20;
  end if;
  update public.portulan_duels set
    etat = case when p_abandon is null then 'fini' else 'abandon' end,
    fin = now(), gagnant = v_gagnant, trophees_a = v_ta, trophees_b = v_tb
  where id = p_id;
  insert into public.portulan_scores (utilisateur_id) values (d.createur), (d.adversaire) on conflict do nothing;
  select elo into v_ea from public.portulan_scores where utilisateur_id = d.createur;
  select elo into v_eb from public.portulan_scores where utilisateur_id = d.adversaire;
  v_attendu := 1 / (1 + power(10::numeric, (v_eb - v_ea) / 400.0));
  v_sa := case when v_gagnant is null then 0.5 when v_gagnant = d.createur then 1 else 0 end;
  v_delta := round(32 * (v_sa - v_attendu));
  update public.portulan_scores set trophees = trophees + v_ta, duels = duels + 1,
    victoires = victoires + case when v_gagnant = d.createur then 1 else 0 end,
    elo = greatest(100, elo + v_delta), maj = now()
  where utilisateur_id = d.createur;
  update public.portulan_scores set trophees = trophees + v_tb, duels = duels + 1,
    victoires = victoires + case when v_gagnant = d.adversaire then 1 else 0 end,
    elo = greatest(100, elo - v_delta), maj = now()
  where utilisateur_id = d.adversaire;
end $$;

-- La fenêtre d'un duel en direct : le temps des questions, et une marge.
create or replace function public.portulan_duel_fenetre(d public.portulan_duels)
returns interval
language sql
immutable
as $$ select greatest(interval '4 minutes', make_interval(secs => (d.nombre * d.duree / 1000.0 * 1.6 + 30)::double precision)) $$;

create or replace function public.portulan_duel_lire(p_utilisateur uuid, p_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
  v_moi_a boolean;
  v_autre uuid;
  u public.utilisateurs%rowtype;
  v_elo integer;
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if d.etat = 'attente' and d.cree < now() - (case when d.asynchrone then interval '24 hours' else interval '3 minutes' end) then
    update public.portulan_duels set etat = 'expire', fin = now() where id = d.id;
    d.etat := 'expire';
  elsif d.etat = 'en_cours' and (
        (not d.asynchrone and now() > d.debut + public.portulan_duel_fenetre(d))
        or (d.asynchrone and now() > coalesce(d.rejoint, d.debut) + interval '24 hours')
        or (jsonb_array_length(d.reponses_a) >= d.nombre and jsonb_array_length(d.reponses_b) >= d.nombre)) then
    perform public.portulan_duel_clore(d.id);
    select * into d from public.portulan_duels where id = p_id;
  end if;
  v_moi_a := d.createur = p_utilisateur;
  v_autre := case when v_moi_a then d.adversaire else d.createur end;
  if v_autre is not null then
    select * into u from public.utilisateurs where id = v_autre;
    select elo into v_elo from public.portulan_scores where utilisateur_id = v_autre;
  end if;
  return jsonb_build_object(
    'id', d.id, 'code', d.code, 'mode', d.mode, 'graine', d.graine, 'etat', d.etat, 'public', d.public,
    'asynchrone', d.asynchrone, 'nombre', d.nombre, 'duree', d.duree,
    'debut', public.portulan_ms(d.debut),
    'cree', public.portulan_ms(d.cree),
    'rejoint', public.portulan_ms(d.rejoint),
    'maintenant', public.portulan_ms(clock_timestamp()),
    'moi', jsonb_build_object(
      'points', case when v_moi_a then d.points_a else d.points_b end,
      'reponses', case when v_moi_a then d.reponses_a else d.reponses_b end,
      'trophees', case when v_moi_a then d.trophees_a else d.trophees_b end,
      'elo', (select elo from public.portulan_scores where utilisateur_id = p_utilisateur)
    ),
    'adversaire', case when v_autre is null then null else jsonb_build_object(
      'id', v_autre, 'nom', u.nom, 'avatar', u.avatar, 'classement', u.classement, 'elo', coalesce(v_elo, 1200),
      'points', case when v_moi_a then d.points_b else d.points_a end,
      'nombre', jsonb_array_length(case when v_moi_a then d.reponses_b else d.reponses_a end),
      'justes', (select count(*) from jsonb_array_elements(case when v_moi_a then d.reponses_b else d.reponses_a end) x where (x ->> 'j')::boolean),
      'reaction', d.reactions -> (case when v_moi_a then 'b' else 'a' end)
    ) end,
    'resultat', case
      when d.etat not in ('fini', 'abandon') then null
      when d.gagnant is null then 'nul'
      when d.gagnant = p_utilisateur then 'victoire'
      else 'defaite' end
  );
end $$;

-- Ouvrir un duel réglé : à distance ou en direct, 5 à 15 questions, un temps par question.
create or replace function public.portulan_duel_ouvrir(p_utilisateur uuid, p_code text, p_mode text, p_graine bigint, p_public boolean, p_asynchrone boolean, p_nombre integer, p_duree integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  perform 1 from public.portulan_duels where createur = p_utilisateur and cree > now() - interval '2 seconds';
  if found then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;
  -- Au plus vingt duels à distance en attente ; un seul duel en direct en attente.
  if coalesce(p_asynchrone, false) then
    if (select count(*) from public.portulan_duels where createur = p_utilisateur and etat in ('attente', 'en_cours') and asynchrone) >= 20 then
      return jsonb_build_object('erreur', 'trop_vite');
    end if;
  else
    update public.portulan_duels set etat = 'expire', fin = now() where createur = p_utilisateur and etat = 'attente' and not asynchrone;
  end if;
  insert into public.portulan_duels (code, createur, mode, graine, public, asynchrone, nombre, duree, debut)
  values (p_code, p_utilisateur, p_mode, p_graine, coalesce(p_public, false), coalesce(p_asynchrone, false), coalesce(p_nombre, 10), coalesce(p_duree, 15000),
    case when coalesce(p_asynchrone, false) then now() else null end)
  returning id into v_id;
  return public.portulan_duel_lire(p_utilisateur, v_id);
exception
  when unique_violation then
    return jsonb_build_object('erreur', 'code_pris');
  when check_violation then
    return jsonb_build_object('erreur', 'illisible');
end $$;

-- Rejoindre : en direct, le duel commence 4 secondes plus tard ; à distance, tout de suite.
create or replace function public.portulan_duel_rejoindre(p_utilisateur uuid, p_code text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
begin
  select * into d from public.portulan_duels where code = upper(p_code) for update;
  if not found then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if d.createur = p_utilisateur or d.adversaire = p_utilisateur then
    return public.portulan_duel_lire(p_utilisateur, d.id);
  end if;
  if d.etat <> 'attente' or d.cree < now() - (case when d.asynchrone then interval '24 hours' else interval '3 minutes' end) then
    return jsonb_build_object('erreur', 'ferme');
  end if;
  if d.asynchrone then
    update public.portulan_duels set adversaire = p_utilisateur, etat = 'en_cours', rejoint = now() where id = d.id;
  else
    update public.portulan_duels set adversaire = p_utilisateur, etat = 'en_cours', debut = now() + interval '4 seconds', rejoint = now() where id = d.id;
  end if;
  return public.portulan_duel_lire(p_utilisateur, d.id);
end $$;

-- Un adversaire au hasard, de préférence de sa cote (à 200 points près).
create or replace function public.portulan_duel_hasard(p_utilisateur uuid, p_code text, p_mode text, p_graine bigint)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_elo integer;
begin
  update public.portulan_duels set etat = 'expire', fin = now() where createur = p_utilisateur and etat = 'attente' and not asynchrone;
  select coalesce((select elo from public.portulan_scores where utilisateur_id = p_utilisateur), 1200) into v_elo;
  select d.id into v_id from public.portulan_duels d
    left join public.portulan_scores s on s.utilisateur_id = d.createur
    where d.etat = 'attente' and d.public and not d.asynchrone and d.mode = p_mode and d.createur <> p_utilisateur and d.cree > now() - interval '60 seconds'
    order by abs(coalesce(s.elo, 1200) - v_elo) > 200, d.cree
    limit 1
    for update of d skip locked;
  if v_id is not null then
    update public.portulan_duels set adversaire = p_utilisateur, etat = 'en_cours', debut = now() + interval '4 seconds', rejoint = now() where id = v_id;
    return public.portulan_duel_lire(p_utilisateur, v_id);
  end if;
  return public.portulan_duel_ouvrir(p_utilisateur, p_code, p_mode, p_graine, true, false, 10, 15000);
end $$;

-- Une réponse : à distance, le créateur joue dès l'ouverture ; l'adversaire a 24 heures.
create or replace function public.portulan_duel_repondre(p_utilisateur uuid, p_id uuid, p_index integer, p_juste boolean, p_points integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
  v_moi_a boolean;
  v_miennes jsonb;
  v_points integer := case when coalesce(p_juste, false) then least(150, greatest(0, coalesce(p_points, 0))) else 0 end;
  v_ouvert boolean;
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  v_moi_a := d.createur = p_utilisateur;
  if d.asynchrone then
    v_ouvert := (d.etat = 'attente' and v_moi_a and d.cree > now() - interval '24 hours')
      or (d.etat = 'en_cours' and now() <= coalesce(d.rejoint, d.debut) + interval '24 hours');
  else
    v_ouvert := d.etat = 'en_cours' and now() >= d.debut - interval '1 second' and now() <= d.debut + public.portulan_duel_fenetre(d);
  end if;
  if not v_ouvert then
    return public.portulan_duel_lire(p_utilisateur, p_id);
  end if;
  v_miennes := case when v_moi_a then d.reponses_a else d.reponses_b end;
  if p_index <> jsonb_array_length(v_miennes) or p_index < 0 or p_index >= d.nombre then
    return public.portulan_duel_lire(p_utilisateur, p_id);
  end if;
  -- L'heure de la réponse (au serveur) : le temps de la suivante se vérifie à partir d'elle.
  v_miennes := v_miennes || jsonb_build_object('i', p_index, 'j', coalesce(p_juste, false), 'p', v_points, 't', public.portulan_ms(clock_timestamp()));
  if v_moi_a then
    update public.portulan_duels set reponses_a = v_miennes, points_a = points_a + v_points where id = p_id;
  else
    update public.portulan_duels set reponses_b = v_miennes, points_b = points_b + v_points where id = p_id;
  end if;
  return public.portulan_duel_lire(p_utilisateur, p_id);
end $$;

-- Une réaction rapide, montrée à l'adversaire.
create or replace function public.portulan_duel_reagir(p_utilisateur uuid, p_id uuid, p_reaction text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
begin
  if p_reaction not in ('bravo', 'oups', 'vite', 'bien-joue', 'salam', 'revanche') then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  update public.portulan_duels set reactions = reactions || jsonb_build_object(case when d.createur = p_utilisateur then 'a' else 'b' end,
    jsonb_build_object('r', p_reaction, 't', public.portulan_ms(clock_timestamp())))
  where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- Mes duels à distance : ceux qui attendent mon tour, et les derniers résultats.
create or replace function public.portulan_duels_mes(p_utilisateur uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_liste jsonb := '[]'::jsonb;
begin
  for v_id in
    select d.id from public.portulan_duels d
    where (d.createur = p_utilisateur or d.adversaire = p_utilisateur) and d.asynchrone and d.cree > now() - interval '8 days'
    order by d.cree desc
    limit 30
  loop
    v_liste := v_liste || public.portulan_duel_lire(p_utilisateur, v_id);
  end loop;
  return jsonb_build_object('duels', v_liste);
end $$;

-- 7. Les amis ------------------------------------------------------------------------
create or replace function public.portulan_ami_code(p_utilisateur uuid, p_propose text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  insert into public.portulan_scores (utilisateur_id) values (p_utilisateur) on conflict do nothing;
  select code_ami into v_code from public.portulan_scores where utilisateur_id = p_utilisateur for update;
  if v_code is null then
    if p_propose is null or p_propose !~ '^[A-Z2-9]{8}$' then
      return jsonb_build_object('erreur', 'illisible');
    end if;
    update public.portulan_scores set code_ami = p_propose where utilisateur_id = p_utilisateur;
    v_code := p_propose;
  end if;
  return jsonb_build_object('code', v_code);
exception
  when unique_violation then
    return jsonb_build_object('erreur', 'code_pris');
end $$;

create or replace function public.portulan_ami_ajouter(p_utilisateur uuid, p_code text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_autre uuid;
begin
  select utilisateur_id into v_autre from public.portulan_scores where code_ami = upper(p_code);
  if v_autre is null then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if v_autre = p_utilisateur then
    return jsonb_build_object('erreur', 'soi');
  end if;
  if exists (select 1 from public.portulan_amis where utilisateur_id = p_utilisateur and ami_id = v_autre and etat = 'ami') then
    return jsonb_build_object('etat', 'ami');
  end if;
  if (select count(*) from public.portulan_amis where utilisateur_id = p_utilisateur) >= 200 then
    return jsonb_build_object('erreur', 'trop');
  end if;
  -- L'autre m'avait déjà demandé : nous voilà amis.
  if exists (select 1 from public.portulan_amis where utilisateur_id = v_autre and ami_id = p_utilisateur and etat = 'demande') then
    update public.portulan_amis set etat = 'ami' where utilisateur_id = v_autre and ami_id = p_utilisateur;
    insert into public.portulan_amis (utilisateur_id, ami_id, etat) values (p_utilisateur, v_autre, 'ami')
      on conflict (utilisateur_id, ami_id) do update set etat = 'ami';
    return jsonb_build_object('etat', 'ami', 'id', v_autre);
  end if;
  insert into public.portulan_amis (utilisateur_id, ami_id, etat) values (p_utilisateur, v_autre, 'demande') on conflict do nothing;
  return jsonb_build_object('etat', 'demande', 'id', v_autre);
end $$;

create or replace function public.portulan_ami_repondre(p_utilisateur uuid, p_autre uuid, p_accepte boolean)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.portulan_amis where utilisateur_id = p_autre and ami_id = p_utilisateur and etat = 'demande') then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if coalesce(p_accepte, false) then
    update public.portulan_amis set etat = 'ami' where utilisateur_id = p_autre and ami_id = p_utilisateur;
    insert into public.portulan_amis (utilisateur_id, ami_id, etat) values (p_utilisateur, p_autre, 'ami')
      on conflict (utilisateur_id, ami_id) do update set etat = 'ami';
  else
    delete from public.portulan_amis where utilisateur_id = p_autre and ami_id = p_utilisateur;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.portulan_ami_retirer(p_utilisateur uuid, p_autre uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
begin
  delete from public.portulan_amis where (utilisateur_id = p_utilisateur and ami_id = p_autre) or (utilisateur_id = p_autre and ami_id = p_utilisateur);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.portulan_amis_lire(p_utilisateur uuid)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_lundi date := date_trunc('week', (now() at time zone 'Europe/Paris')::date)::date;
begin
  return jsonb_build_object(
    'code', (select code_ami from public.portulan_scores where utilisateur_id = p_utilisateur),
    'amis', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'nom', u.nom, 'avatar', u.avatar,
        'xp', coalesce(s.xp, 0), 'trophees', coalesce(s.trophees, 0), 'elo', coalesce(s.elo, 1200),
        'semaine', coalesce((select sum(pj.xp) from public.portulan_jour pj where pj.utilisateur_id = u.id and pj.jour >= v_lundi), 0),
        'victoires', (select count(*) from public.portulan_duels d where d.etat in ('fini', 'abandon') and d.gagnant = p_utilisateur
          and ((d.createur = p_utilisateur and d.adversaire = u.id) or (d.adversaire = p_utilisateur and d.createur = u.id))),
        'defaites', (select count(*) from public.portulan_duels d where d.etat in ('fini', 'abandon') and d.gagnant = u.id
          and ((d.createur = p_utilisateur and d.adversaire = u.id) or (d.adversaire = p_utilisateur and d.createur = u.id))),
        'nuls', (select count(*) from public.portulan_duels d where d.etat = 'fini' and d.gagnant is null
          and ((d.createur = p_utilisateur and d.adversaire = u.id) or (d.adversaire = p_utilisateur and d.createur = u.id)))
      ) order by u.nom)
      from public.portulan_amis a
      join public.utilisateurs u on u.id = a.ami_id
      left join public.portulan_scores s on s.utilisateur_id = u.id
      where a.utilisateur_id = p_utilisateur and a.etat = 'ami'
    ), '[]'::jsonb),
    'recues', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'nom', u.nom, 'avatar', u.avatar) order by a.cree desc)
      from public.portulan_amis a join public.utilisateurs u on u.id = a.utilisateur_id
      where a.ami_id = p_utilisateur and a.etat = 'demande'
    ), '[]'::jsonb),
    'envoyees', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'nom', u.nom, 'avatar', u.avatar) order by a.cree desc)
      from public.portulan_amis a join public.utilisateurs u on u.id = a.ami_id
      where a.utilisateur_id = p_utilisateur and a.etat = 'demande'
    ), '[]'::jsonb)
  );
end $$;

-- 8. Les salons (3 à 8 joueurs) ------------------------------------------------------

-- Les éliminations (toutes les trois questions, le dernier sort) et la fin du salon.
create or replace function public.portulan_salon_avancer(p_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
  v_c integer;
  v_actifs integer;
  v_prets boolean;
  v_dernier uuid;
  v_fin timestamptz;
  v_tous boolean;
begin
  select * into s from public.portulan_salons where id = p_id for update;
  if not found or s.etat <> 'en_cours' then
    return;
  end if;
  v_fin := s.debut + make_interval(secs => s.nombre * 25 + 30);
  if s.formule = 'elimination' then
    v_c := 3;
    while v_c < s.nombre loop
      select count(*) into v_actifs from public.portulan_salon_joueurs where salon_id = p_id and elimine_a is null;
      exit when v_actifs <= 1;
      if not exists (select 1 from public.portulan_salon_joueurs where salon_id = p_id and elimine_a = v_c) then
        select bool_and(jsonb_array_length(j.reponses) >= v_c) into v_prets from public.portulan_salon_joueurs j where j.salon_id = p_id and j.elimine_a is null;
        exit when not (coalesce(v_prets, false) or now() > s.debut + make_interval(secs => v_c * 25 + 10));
        select j.utilisateur_id into v_dernier
        from public.portulan_salon_joueurs j
        where j.salon_id = p_id and j.elimine_a is null
        order by (select coalesce(sum((x ->> 'p')::integer), 0) from jsonb_array_elements(j.reponses) x where (x ->> 'i')::integer < v_c),
          (select count(*) from jsonb_array_elements(j.reponses) x where (x ->> 'i')::integer < v_c and (x ->> 'j')::boolean),
          j.rejoint desc
        limit 1;
        update public.portulan_salon_joueurs set elimine_a = v_c where salon_id = p_id and utilisateur_id = v_dernier;
      end if;
      v_c := v_c + 3;
    end loop;
  end if;
  select count(*) into v_actifs from public.portulan_salon_joueurs where salon_id = p_id and elimine_a is null;
  select bool_and(jsonb_array_length(j.reponses) >= s.nombre) into v_tous from public.portulan_salon_joueurs j where j.salon_id = p_id and j.elimine_a is null;
  if now() > v_fin or coalesce(v_tous, false) or (s.formule = 'elimination' and v_actifs <= 1) then
    with classement as (
      select j.utilisateur_id, rank() over (order by coalesce(j.elimine_a, 1000) desc, j.points desc) as rang
      from public.portulan_salon_joueurs j where j.salon_id = p_id
    )
    update public.portulan_salon_joueurs j set rang = c.rang from classement c where j.salon_id = p_id and j.utilisateur_id = c.utilisateur_id;
    update public.portulan_salons set etat = 'fini', fin = now() where id = p_id;
    insert into public.portulan_scores (utilisateur_id) select j.utilisateur_id from public.portulan_salon_joueurs j where j.salon_id = p_id on conflict do nothing;
    -- Des trophées aux trois premiers : 15, 8 et 4.
    update public.portulan_scores sc set trophees = sc.trophees + case j.rang when 1 then 15 when 2 then 8 when 3 then 4 else 0 end, maj = now()
    from public.portulan_salon_joueurs j where j.salon_id = p_id and j.utilisateur_id = sc.utilisateur_id and j.rang <= 3;
  end if;
end $$;

create or replace function public.portulan_salon_lire(p_utilisateur uuid, p_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
begin
  if not exists (select 1 from public.portulan_salon_joueurs where salon_id = p_id and utilisateur_id = p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  select * into s from public.portulan_salons where id = p_id;
  if s.etat = 'attente' and s.cree < now() - interval '30 minutes' then
    update public.portulan_salons set etat = 'expire', fin = now() where id = p_id;
  elsif s.etat = 'en_cours' then
    perform public.portulan_salon_avancer(p_id);
  end if;
  select * into s from public.portulan_salons where id = p_id;
  return jsonb_build_object(
    'id', s.id, 'code', s.code, 'mode', s.mode, 'formule', s.formule, 'nombre', s.nombre, 'taille', s.taille,
    'graine', s.graine, 'etat', s.etat, 'createur', s.createur = p_utilisateur,
    'debut', public.portulan_ms(s.debut), 'maintenant', public.portulan_ms(clock_timestamp()),
    'joueurs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'nom', u.nom, 'avatar', u.avatar, 'moi', u.id = p_utilisateur, 'hote', u.id = s.createur,
        'points', j.points, 'nombre', jsonb_array_length(j.reponses),
        'justes', (select count(*) from jsonb_array_elements(j.reponses) x where (x ->> 'j')::boolean),
        'elimine', j.elimine_a, 'rang', j.rang,
        'reponses', case when u.id = p_utilisateur then j.reponses else null end
      ) order by coalesce(j.rang, 99), j.points desc, j.rejoint)
      from public.portulan_salon_joueurs j join public.utilisateurs u on u.id = j.utilisateur_id
      where j.salon_id = p_id
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.portulan_salon_creer(p_utilisateur uuid, p_code text, p_mode text, p_graine bigint, p_formule text, p_nombre integer, p_taille integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  perform 1 from public.portulan_salons where createur = p_utilisateur and cree > now() - interval '3 seconds';
  if found then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;
  update public.portulan_salons set etat = 'expire', fin = now() where createur = p_utilisateur and etat = 'attente';
  insert into public.portulan_salons (code, createur, mode, graine, formule, nombre, taille)
  values (p_code, p_utilisateur, p_mode, p_graine, coalesce(p_formule, 'classique'), coalesce(p_nombre, 10), coalesce(p_taille, 8))
  returning id into v_id;
  insert into public.portulan_salon_joueurs (salon_id, utilisateur_id) values (v_id, p_utilisateur);
  return public.portulan_salon_lire(p_utilisateur, v_id);
exception
  when unique_violation then
    return jsonb_build_object('erreur', 'code_pris');
  when check_violation then
    return jsonb_build_object('erreur', 'illisible');
end $$;

create or replace function public.portulan_salon_rejoindre(p_utilisateur uuid, p_code text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
begin
  select * into s from public.portulan_salons where code = upper(p_code) for update;
  if not found then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if exists (select 1 from public.portulan_salon_joueurs where salon_id = s.id and utilisateur_id = p_utilisateur) then
    return public.portulan_salon_lire(p_utilisateur, s.id);
  end if;
  if s.etat <> 'attente' or s.cree < now() - interval '30 minutes' then
    return jsonb_build_object('erreur', 'ferme');
  end if;
  if (select count(*) from public.portulan_salon_joueurs where salon_id = s.id) >= s.taille then
    return jsonb_build_object('erreur', 'complet');
  end if;
  insert into public.portulan_salon_joueurs (salon_id, utilisateur_id) values (s.id, p_utilisateur);
  return public.portulan_salon_lire(p_utilisateur, s.id);
end $$;

create or replace function public.portulan_salon_lancer(p_utilisateur uuid, p_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
begin
  select * into s from public.portulan_salons where id = p_id for update;
  if not found or s.createur <> p_utilisateur then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if s.etat = 'attente' then
    if (select count(*) from public.portulan_salon_joueurs where salon_id = p_id) < 3 then
      return jsonb_build_object('erreur', 'pas_assez');
    end if;
    update public.portulan_salons set etat = 'en_cours', debut = now() + interval '5 seconds' where id = p_id;
  end if;
  return public.portulan_salon_lire(p_utilisateur, p_id);
end $$;

create or replace function public.portulan_salon_repondre(p_utilisateur uuid, p_id uuid, p_index integer, p_juste boolean, p_points integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
  j public.portulan_salon_joueurs%rowtype;
  v_points integer := case when coalesce(p_juste, false) then least(150, greatest(0, coalesce(p_points, 0))) else 0 end;
begin
  select * into s from public.portulan_salons where id = p_id;
  select * into j from public.portulan_salon_joueurs where salon_id = p_id and utilisateur_id = p_utilisateur for update;
  if s.id is null or j.salon_id is null then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if s.etat = 'en_cours' and now() >= s.debut - interval '1 second' and now() <= s.debut + make_interval(secs => s.nombre * 25 + 30)
     and p_index = jsonb_array_length(j.reponses) and p_index between 0 and s.nombre - 1
     and (j.elimine_a is null or p_index < j.elimine_a) then
    update public.portulan_salon_joueurs set reponses = reponses || jsonb_build_object('i', p_index, 'j', coalesce(p_juste, false), 'p', v_points, 't', public.portulan_ms(clock_timestamp())),
      points = points + v_points
    where salon_id = p_id and utilisateur_id = p_utilisateur;
  end if;
  return public.portulan_salon_lire(p_utilisateur, p_id);
end $$;

create or replace function public.portulan_salon_quitter(p_utilisateur uuid, p_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  s public.portulan_salons%rowtype;
begin
  select * into s from public.portulan_salons where id = p_id for update;
  if not found then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if s.etat = 'attente' then
    if s.createur = p_utilisateur then
      update public.portulan_salons set etat = 'expire', fin = now() where id = p_id;
    else
      delete from public.portulan_salon_joueurs where salon_id = p_id and utilisateur_id = p_utilisateur;
    end if;
  elsif s.etat = 'en_cours' then
    -- Partir en cours de route : on est éliminé tout de suite.
    update public.portulan_salon_joueurs set elimine_a = 0 where salon_id = p_id and utilisateur_id = p_utilisateur and elimine_a is null;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- 9. Les classes ---------------------------------------------------------------------
create or replace function public.portulan_classe_lire(p_utilisateur uuid, p_classe uuid)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  c public.portulan_classes%rowtype;
  v_lundi date := date_trunc('week', (now() at time zone 'Europe/Paris')::date)::date;
begin
  select * into c from public.portulan_classes where id = p_classe;
  if not found or (c.proprietaire <> p_utilisateur and not exists (select 1 from public.portulan_classe_membres m where m.classe_id = p_classe and m.utilisateur_id = p_utilisateur)) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  return jsonb_build_object(
    'id', c.id, 'code', c.code, 'nom', c.nom, 'proprietaire', c.proprietaire = p_utilisateur,
    'enseignant', (select jsonb_build_object('nom', u.nom, 'avatar', u.avatar) from public.utilisateurs u where u.id = c.proprietaire),
    'membres', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'nom', u.nom, 'avatar', u.avatar, 'moi', u.id = p_utilisateur,
        'xp', coalesce(s.xp, 0), 'bonnes', coalesce(s.bonnes, 0), 'reponses', coalesce(s.reponses, 0),
        'semaine', coalesce((select sum(pj.xp) from public.portulan_jour pj where pj.utilisateur_id = u.id and pj.jour >= v_lundi), 0),
        'actif', public.portulan_ms(s.derniere_reponse)
      ) order by coalesce(s.xp, 0) desc)
      from public.portulan_classe_membres m
      join public.utilisateurs u on u.id = m.utilisateur_id
      left join public.portulan_scores s on s.utilisateur_id = u.id
      where m.classe_id = p_classe
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.portulan_classes_mes(p_utilisateur uuid)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  return jsonb_build_object(
    'miennes', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code, 'nom', c.nom,
        'membres', (select count(*) from public.portulan_classe_membres m where m.classe_id = c.id)) order by c.cree)
      from public.portulan_classes c where c.proprietaire = p_utilisateur), '[]'::jsonb),
    'suivies', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom,
        'enseignant', (select u.nom from public.utilisateurs u where u.id = c.proprietaire)) order by m.rejoint)
      from public.portulan_classe_membres m join public.portulan_classes c on c.id = m.classe_id
      where m.utilisateur_id = p_utilisateur), '[]'::jsonb)
  );
end $$;

create or replace function public.portulan_classe_creer(p_utilisateur uuid, p_code text, p_nom text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  if (select count(*) from public.portulan_classes where proprietaire = p_utilisateur) >= 10 then
    return jsonb_build_object('erreur', 'trop');
  end if;
  insert into public.portulan_classes (code, nom, proprietaire) values (p_code, btrim(p_nom), p_utilisateur) returning id into v_id;
  return public.portulan_classe_lire(p_utilisateur, v_id);
exception
  when unique_violation then
    return jsonb_build_object('erreur', 'code_pris');
  when check_violation then
    return jsonb_build_object('erreur', 'illisible');
end $$;

create or replace function public.portulan_classe_rejoindre(p_utilisateur uuid, p_code text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  c public.portulan_classes%rowtype;
begin
  select * into c from public.portulan_classes where code = upper(p_code);
  if not found then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if c.proprietaire <> p_utilisateur then
    if (select count(*) from public.portulan_classe_membres where classe_id = c.id) >= 200 then
      return jsonb_build_object('erreur', 'complet');
    end if;
    insert into public.portulan_classe_membres (classe_id, utilisateur_id) values (c.id, p_utilisateur) on conflict do nothing;
  end if;
  return public.portulan_classe_lire(p_utilisateur, c.id);
end $$;

-- Quitter une classe (élève), retirer un élève ou fermer la classe (enseignant).
create or replace function public.portulan_classe_quitter(p_utilisateur uuid, p_classe uuid, p_membre uuid default null)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  c public.portulan_classes%rowtype;
begin
  select * into c from public.portulan_classes where id = p_classe;
  if not found then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if c.proprietaire = p_utilisateur then
    if p_membre is null then
      delete from public.portulan_classes where id = p_classe;
    else
      delete from public.portulan_classe_membres where classe_id = p_classe and utilisateur_id = p_membre;
    end if;
  else
    delete from public.portulan_classe_membres where classe_id = p_classe and utilisateur_id = p_utilisateur;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- 10. Les notifications du téléphone ------------------------------------------------
create or replace function public.portulan_abonner(p_utilisateur uuid, p_endpoint text, p_cles jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or jsonb_typeof(p_cles) <> 'object' then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  insert into public.portulan_abonnements (endpoint, utilisateur_id, cles) values (p_endpoint, p_utilisateur, p_cles)
  on conflict (endpoint) do update set utilisateur_id = excluded.utilisateur_id, cles = excluded.cles, cree = now();
  -- Au plus dix appareils par compte : les plus anciens s'effacent.
  delete from public.portulan_abonnements a where a.utilisateur_id = p_utilisateur and a.endpoint in (
    select endpoint from public.portulan_abonnements where utilisateur_id = p_utilisateur order by cree desc offset 10);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.portulan_desabonner(p_utilisateur uuid, p_endpoint text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
begin
  delete from public.portulan_abonnements where endpoint = p_endpoint and (utilisateur_id = p_utilisateur or p_utilisateur is null);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.portulan_abonnements_de(p_utilisateur uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'cles', cles)), '[]'::jsonb)
  from public.portulan_abonnements where utilisateur_id = p_utilisateur
$$;

-- 11. Les droits : tout passe par le serveur -----------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.portulan_ms(timestamptz)',
    'public.portulan_repondre(uuid, jsonb)',
    'public.portulan_double(uuid)',
    'public.portulan_record_envoyer(uuid, text, integer)',
    'public.portulan_records_lire(uuid, text)',
    'public.portulan_defi_envoyer(uuid, text, integer, integer)',
    'public.portulan_defi_lire(uuid, text)',
    'public.portulan_duel_clore(uuid, uuid)',
    'public.portulan_duel_fenetre(public.portulan_duels)',
    'public.portulan_duel_lire(uuid, uuid)',
    'public.portulan_duel_ouvrir(uuid, text, text, bigint, boolean, boolean, integer, integer)',
    'public.portulan_duel_rejoindre(uuid, text)',
    'public.portulan_duel_hasard(uuid, text, text, bigint)',
    'public.portulan_duel_repondre(uuid, uuid, integer, boolean, integer)',
    'public.portulan_duel_reagir(uuid, uuid, text)',
    'public.portulan_duels_mes(uuid)',
    'public.portulan_ami_code(uuid, text)',
    'public.portulan_ami_ajouter(uuid, text)',
    'public.portulan_ami_repondre(uuid, uuid, boolean)',
    'public.portulan_ami_retirer(uuid, uuid)',
    'public.portulan_amis_lire(uuid)',
    'public.portulan_salon_avancer(uuid)',
    'public.portulan_salon_lire(uuid, uuid)',
    'public.portulan_salon_creer(uuid, text, text, bigint, text, integer, integer)',
    'public.portulan_salon_rejoindre(uuid, text)',
    'public.portulan_salon_lancer(uuid, uuid)',
    'public.portulan_salon_repondre(uuid, uuid, integer, boolean, integer)',
    'public.portulan_salon_quitter(uuid, uuid)',
    'public.portulan_classe_lire(uuid, uuid)',
    'public.portulan_classes_mes(uuid)',
    'public.portulan_classe_creer(uuid, text, text)',
    'public.portulan_classe_rejoindre(uuid, text)',
    'public.portulan_classe_quitter(uuid, uuid, uuid)',
    'public.portulan_abonner(uuid, text, jsonb)',
    'public.portulan_desabonner(uuid, text)',
    'public.portulan_abonnements_de(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
