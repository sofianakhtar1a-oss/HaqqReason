-- =====================================================================
-- 017 · Le Portulan : expérience (XP), classement et duels
--   • Chaque bonne réponse d'une partie rapporte de l'XP. Le navigateur n'envoie
--     que ses RÉPONSES : le serveur du site les juge (lib/monde/quiz.ts → juger)
--     puis appelle portulan_repondre, qui compte l'XP ici, dans une seule
--     transaction verrouillée. Personne ne peut écrire son score.
--   • Règles (les mêmes que lib/monde/points.ts, vérifiées par les tests) :
--       - XP de base selon la méthode : 10 (4 choix), 12 (6 choix), 15 (écrire, situer) ;
--       - « presque » (petite faute d'orthographe) : la moitié ;
--       - un même pays, pour une même méthode, ne rapporte qu'une fois par jour ;
--       - 500 ms au moins entre deux envois, 3 000 XP et 3 000 réponses par jour au plus.
--   • Les duels : deux comptes, les mêmes dix questions (tirées d'une graine que le
--     serveur garde), chacun à son rythme. Le serveur juge chaque réponse ; la base
--     additionne les points, clôt le duel et donne les trophées (20 au gagnant, 8 à
--     chacun en cas d'égalité). Un duel en attente expire au bout de 3 minutes, un
--     duel commencé au bout de 4 minutes.
--   • Le classement ne montre que les comptes qui l'ont rejoint (même case que celui
--     du vocabulaire, migration 015) : prénom, initiale du nom et photo Google.
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script peut être relancé sans risque (014 et 015 doivent avoir été lancés avant).
-- =====================================================================

-- 1. Le score de chaque compte -------------------------------------------
create table if not exists public.portulan_scores (
  utilisateur_id   uuid primary key references public.utilisateurs (id) on delete cascade,
  xp               bigint  not null default 0 check (xp >= 0),
  bonnes           integer not null default 0 check (bonnes >= 0),
  reponses         integer not null default 0 check (reponses >= 0),
  trophees         integer not null default 0 check (trophees >= 0),
  duels            integer not null default 0 check (duels >= 0),
  victoires        integer not null default 0 check (victoires >= 0),
  derniere_reponse timestamptz,
  maj              timestamptz not null default now()
);
create index if not exists portulan_scores_xp_idx on public.portulan_scores (xp desc);
create index if not exists portulan_scores_trophees_idx on public.portulan_scores (trophees desc);

-- 2. L'XP de chaque jour (classements du jour et de la semaine, plafond du jour) --
create table if not exists public.portulan_jour (
  utilisateur_id uuid    not null references public.utilisateurs (id) on delete cascade,
  jour           date    not null,
  xp             integer not null default 0 check (xp >= 0),
  reponses       integer not null default 0 check (reponses >= 0),
  primary key (utilisateur_id, jour)
);
create index if not exists portulan_jour_jour_idx on public.portulan_jour (jour);

-- 3. Ce qui a déjà rapporté aujourd'hui (« méthode:pays ») ----------------
create table if not exists public.portulan_vus (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  jour           date not null,
  cle            text not null check (char_length(cle) between 3 and 40),
  primary key (utilisateur_id, jour, cle)
);

-- 4. Les duels ------------------------------------------------------------
create table if not exists public.portulan_duels (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  createur    uuid not null references public.utilisateurs (id) on delete cascade,
  adversaire  uuid references public.utilisateurs (id) on delete cascade,
  public      boolean not null default false,
  mode        text not null check (mode in ('drapeaux', 'capitales', 'cartes', 'continents', 'monnaies', 'melange')),
  graine      bigint not null check (graine between 0 and 4294967295),
  etat        text not null default 'attente' check (etat in ('attente', 'en_cours', 'fini', 'expire', 'abandon')),
  cree        timestamptz not null default now(),
  debut       timestamptz,
  fin         timestamptz,
  points_a    integer not null default 0 check (points_a >= 0),
  points_b    integer not null default 0 check (points_b >= 0),
  -- Une entrée par question : { "i": rang, "j": juste ?, "p": points }.
  reponses_a  jsonb not null default '[]'::jsonb,
  reponses_b  jsonb not null default '[]'::jsonb,
  trophees_a  integer not null default 0,
  trophees_b  integer not null default 0,
  gagnant     uuid,
  check (adversaire is null or adversaire <> createur)
);
create index if not exists portulan_duels_attente_idx on public.portulan_duels (etat, public, mode, cree);
create index if not exists portulan_duels_createur_idx on public.portulan_duels (createur, cree desc);
create index if not exists portulan_duels_adversaire_idx on public.portulan_duels (adversaire, cree desc);

alter table public.portulan_scores enable row level security;
alter table public.portulan_jour enable row level security;
alter table public.portulan_vus enable row level security;
alter table public.portulan_duels enable row level security;
revoke all on table public.portulan_scores, public.portulan_jour, public.portulan_vus, public.portulan_duels from anon, authenticated;
grant all on table public.portulan_scores, public.portulan_jour, public.portulan_vus, public.portulan_duels to service_role;
comment on table public.portulan_scores is 'XP et trophées du Portulan, calculés par portulan_repondre et les duels. Réservée au serveur.';
comment on table public.portulan_jour is 'XP gagnée chaque jour (classements du jour et de la semaine, plafond). Réservée au serveur.';
comment on table public.portulan_vus is 'Méthodes et pays déjà récompensés aujourd''hui. Réservée au serveur.';
comment on table public.portulan_duels is 'Duels du Portulan entre deux comptes. Réservée au serveur.';

-- 5. Compter les réponses jugées par le serveur ----------------------------
-- p_reponses : [{ "cle": "drapeau-nom:fr", "resultat": "juste|presque|faux", "base": 10 }, …] (12 au plus)
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
  v_details jsonb := '[]'::jsonb;
begin
  if p_reponses is null or jsonb_typeof(p_reponses) <> 'array' or jsonb_array_length(p_reponses) not between 1 and 12 then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;

  insert into public.portulan_scores (utilisateur_id) values (p_utilisateur) on conflict do nothing;
  -- Le verrou : deux onglets qui envoient en même temps passent l'un après l'autre.
  select * into s from public.portulan_scores where utilisateur_id = p_utilisateur for update;
  if s.derniere_reponse is not null and v_maintenant - s.derniere_reponse < c_intervalle then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;

  insert into public.portulan_jour (utilisateur_id, jour) values (p_utilisateur, v_jour) on conflict do nothing;
  select pj.xp, pj.reponses into v_jour_xp, v_jour_reponses
    from public.portulan_jour pj where pj.utilisateur_id = p_utilisateur and pj.jour = v_jour for update;
  delete from public.portulan_vus v where v.utilisateur_id = p_utilisateur and v.jour < v_jour - 1;

  for r in select value from jsonb_array_elements(p_reponses) loop
    v_cle := r ->> 'cle';
    v_resultat := r ->> 'resultat';
    v_base := least(15, greatest(0, coalesce(nullif(r ->> 'base', '')::integer, 0)));
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
    'details', v_details
  );
end $$;

-- 6. Le classement --------------------------------------------------------
-- p_periode : « jour », « semaine » (depuis lundi, heure de Paris), « toujours » (XP) ou « trophees ».
create or replace function public.portulan_classement(p_utilisateur uuid, p_periode text default 'semaine', p_limite integer default 50)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_jour date := (now() at time zone 'Europe/Paris')::date;
  v_lundi date := date_trunc('week', v_jour)::date;
  v_periode text := case when p_periode in ('jour', 'semaine', 'toujours', 'trophees') then p_periode else 'semaine' end;
  v_resultat jsonb;
begin
  with periode as (
    select pj.utilisateur_id, sum(pj.xp)::bigint as xp
    from public.portulan_jour pj
    where pj.jour >= case when v_periode = 'jour' then v_jour else v_lundi end
    group by pj.utilisateur_id
  ),
  base as (
    select
      u.id, u.nom, u.avatar, u.classement,
      case v_periode
        when 'trophees' then s.trophees::bigint
        when 'toujours' then s.xp
        else coalesce(pe.xp, 0)
      end as points,
      s.xp as total, s.trophees, s.victoires, s.duels, s.bonnes, s.reponses, s.maj
    from public.portulan_scores s
    join public.utilisateurs u on u.id = s.utilisateur_id
    left join periode pe on pe.utilisateur_id = s.utilisateur_id
  ),
  classes as (
    select b.*, rank() over (order by b.points desc) as rang
    from base b
    where b.classement and b.points > 0
  )
  select jsonb_build_object(
    'periode', v_periode,
    'depuis', case when v_periode = 'jour' then v_jour else v_lundi end,
    'participants', (select count(*) from classes),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('rang', t.rang, 'id', t.id, 'nom', t.nom, 'avatar', t.avatar, 'points', t.points, 'victoires', t.victoires) order by t.rang, t.maj)
      from (select * from classes order by rang, maj limit least(greatest(coalesce(p_limite, 50), 1), 100)) t
    ), '[]'::jsonb),
    -- Sa propre ligne, même sans aucune réponse encore (pour pouvoir rejoindre les classements).
    'moi', (
      select jsonb_build_object(
        'rang', (select c.rang from classes c where c.id = u.id),
        'nom', u.nom, 'avatar', u.avatar, 'classement', u.classement,
        'points', coalesce(b.points, 0), 'xp', coalesce(b.total, 0), 'trophees', coalesce(b.trophees, 0),
        'victoires', coalesce(b.victoires, 0), 'duels', coalesce(b.duels, 0),
        'bonnes', coalesce(b.bonnes, 0), 'reponses', coalesce(b.reponses, 0)
      )
      from public.utilisateurs u
      left join base b on b.id = u.id
      where u.id = p_utilisateur
    )
  ) into v_resultat;
  return v_resultat;
end $$;

-- 7. Les duels ---------------------------------------------------------------

-- Clôt un duel (une seule fois) : le gagnant, les trophées, les compteurs.
-- p_abandon : le compte qui quitte un duel commencé (il perd).
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
  update public.portulan_scores set trophees = trophees + v_ta, duels = duels + 1,
    victoires = victoires + case when v_gagnant = d.createur then 1 else 0 end, maj = now()
  where utilisateur_id = d.createur;
  update public.portulan_scores set trophees = trophees + v_tb, duels = duels + 1,
    victoires = victoires + case when v_gagnant = d.adversaire then 1 else 0 end, maj = now()
  where utilisateur_id = d.adversaire;
end $$;

-- L'état d'un duel, vu par l'un des deux joueurs (et la clôture s'il le faut).
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
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if d.etat = 'attente' and d.cree < now() - interval '3 minutes' then
    update public.portulan_duels set etat = 'expire', fin = now() where id = d.id;
    d.etat := 'expire';
  elsif d.etat = 'en_cours' and (now() > d.debut + interval '4 minutes'
        or (jsonb_array_length(d.reponses_a) >= 10 and jsonb_array_length(d.reponses_b) >= 10)) then
    perform public.portulan_duel_clore(d.id);
    select * into d from public.portulan_duels where id = p_id;
  end if;
  v_moi_a := d.createur = p_utilisateur;
  v_autre := case when v_moi_a then d.adversaire else d.createur end;
  if v_autre is not null then
    select * into u from public.utilisateurs where id = v_autre;
  end if;
  return jsonb_build_object(
    'id', d.id, 'code', d.code, 'mode', d.mode, 'graine', d.graine, 'etat', d.etat, 'public', d.public,
    'debut', case when d.debut is null then null else (extract(epoch from d.debut) * 1000)::bigint end,
    'maintenant', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'moi', jsonb_build_object(
      'points', case when v_moi_a then d.points_a else d.points_b end,
      'reponses', case when v_moi_a then d.reponses_a else d.reponses_b end,
      'trophees', case when v_moi_a then d.trophees_a else d.trophees_b end
    ),
    'adversaire', case when v_autre is null then null else jsonb_build_object(
      'nom', u.nom, 'avatar', u.avatar, 'classement', u.classement,
      'points', case when v_moi_a then d.points_b else d.points_a end,
      'nombre', jsonb_array_length(case when v_moi_a then d.reponses_b else d.reponses_a end),
      'justes', (select count(*) from jsonb_array_elements(case when v_moi_a then d.reponses_b else d.reponses_a end) x where (x ->> 'j')::boolean)
    ) end,
    'resultat', case
      when d.etat not in ('fini', 'abandon') then null
      when d.gagnant is null then 'nul'
      when d.gagnant = p_utilisateur then 'victoire'
      else 'defaite' end
  );
end $$;

-- Un duel entre amis : un code à partager.
create or replace function public.portulan_duel_creer(p_utilisateur uuid, p_code text, p_mode text, p_graine bigint, p_public boolean default false)
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
  -- Un seul duel en attente par compte ; pas plus d'un nouveau duel toutes les 2 secondes.
  perform 1 from public.portulan_duels where createur = p_utilisateur and cree > now() - interval '2 seconds';
  if found then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;
  update public.portulan_duels set etat = 'expire', fin = now() where createur = p_utilisateur and etat = 'attente';
  insert into public.portulan_duels (code, createur, mode, graine, public)
  values (p_code, p_utilisateur, p_mode, p_graine, coalesce(p_public, false))
  returning id into v_id;
  return public.portulan_duel_lire(p_utilisateur, v_id);
exception
  when unique_violation then
    return jsonb_build_object('erreur', 'code_pris');
  when check_violation then
    return jsonb_build_object('erreur', 'illisible');
end $$;

-- Rejoindre un duel avec son code : il commence 4 secondes plus tard.
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
  if d.createur = p_utilisateur then
    return public.portulan_duel_lire(p_utilisateur, d.id);
  end if;
  if d.adversaire = p_utilisateur then
    return public.portulan_duel_lire(p_utilisateur, d.id);
  end if;
  if d.etat <> 'attente' or d.cree < now() - interval '3 minutes' then
    return jsonb_build_object('erreur', 'ferme');
  end if;
  update public.portulan_duels set adversaire = p_utilisateur, etat = 'en_cours', debut = now() + interval '4 seconds' where id = d.id;
  return public.portulan_duel_lire(p_utilisateur, d.id);
end $$;

-- Un adversaire au hasard : on rejoint un duel public qui attend, sinon on en ouvre un.
create or replace function public.portulan_duel_hasard(p_utilisateur uuid, p_code text, p_mode text, p_graine bigint)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  update public.portulan_duels set etat = 'expire', fin = now() where createur = p_utilisateur and etat = 'attente';
  select id into v_id from public.portulan_duels
    where etat = 'attente' and public and mode = p_mode and createur <> p_utilisateur and cree > now() - interval '60 seconds'
    order by cree
    limit 1
    for update skip locked;
  if v_id is not null then
    update public.portulan_duels set adversaire = p_utilisateur, etat = 'en_cours', debut = now() + interval '4 seconds' where id = v_id;
    return public.portulan_duel_lire(p_utilisateur, v_id);
  end if;
  return public.portulan_duel_creer(p_utilisateur, p_code, p_mode, p_graine, true);
end $$;

-- Une réponse jugée par le serveur (dans l'ordre : la question i après la question i - 1).
create or replace function public.portulan_duel_repondre(p_utilisateur uuid, p_id uuid, p_index integer, p_juste boolean, p_points integer)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
  v_moi_a boolean;
  v_miennes jsonb;
  -- Une erreur ne rapporte rien, quoi que l'appel demande ; une bonne réponse, 150 points au plus.
  v_points integer := case when coalesce(p_juste, false) then least(150, greatest(0, coalesce(p_points, 0))) else 0 end;
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if d.etat <> 'en_cours' or now() < d.debut - interval '1 second' or now() > d.debut + interval '4 minutes' then
    return public.portulan_duel_lire(p_utilisateur, p_id);
  end if;
  v_moi_a := d.createur = p_utilisateur;
  v_miennes := case when v_moi_a then d.reponses_a else d.reponses_b end;
  if p_index <> jsonb_array_length(v_miennes) or p_index not between 0 and 9 then
    return public.portulan_duel_lire(p_utilisateur, p_id);
  end if;
  v_miennes := v_miennes || jsonb_build_object('i', p_index, 'j', coalesce(p_juste, false), 'p', v_points);
  if v_moi_a then
    update public.portulan_duels set reponses_a = v_miennes, points_a = points_a + v_points where id = p_id;
  else
    update public.portulan_duels set reponses_b = v_miennes, points_b = points_b + v_points where id = p_id;
  end if;
  return public.portulan_duel_lire(p_utilisateur, p_id);
end $$;

-- Quitter : un duel en attente se ferme ; un duel commencé est perdu.
create or replace function public.portulan_duel_quitter(p_utilisateur uuid, p_id uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  d public.portulan_duels%rowtype;
begin
  select * into d from public.portulan_duels where id = p_id for update;
  if not found or (d.createur <> p_utilisateur and d.adversaire is distinct from p_utilisateur) then
    return jsonb_build_object('erreur', 'introuvable');
  end if;
  if d.etat = 'attente' then
    update public.portulan_duels set etat = 'expire', fin = now() where id = p_id;
  elsif d.etat = 'en_cours' then
    perform public.portulan_duel_clore(p_id, p_utilisateur);
  end if;
  return public.portulan_duel_lire(p_utilisateur, p_id);
end $$;

revoke all on function public.portulan_repondre(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.portulan_classement(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.portulan_duel_clore(uuid, uuid) from public, anon, authenticated;
revoke all on function public.portulan_duel_lire(uuid, uuid) from public, anon, authenticated;
revoke all on function public.portulan_duel_creer(uuid, text, text, bigint, boolean) from public, anon, authenticated;
revoke all on function public.portulan_duel_rejoindre(uuid, text) from public, anon, authenticated;
revoke all on function public.portulan_duel_hasard(uuid, text, text, bigint) from public, anon, authenticated;
revoke all on function public.portulan_duel_repondre(uuid, uuid, integer, boolean, integer) from public, anon, authenticated;
revoke all on function public.portulan_duel_quitter(uuid, uuid) from public, anon, authenticated;
grant execute on function public.portulan_repondre(uuid, jsonb) to service_role;
grant execute on function public.portulan_classement(uuid, text, integer) to service_role;
grant execute on function public.portulan_duel_clore(uuid, uuid) to service_role;
grant execute on function public.portulan_duel_lire(uuid, uuid) to service_role;
grant execute on function public.portulan_duel_creer(uuid, text, text, bigint, boolean) to service_role;
grant execute on function public.portulan_duel_rejoindre(uuid, text) to service_role;
grant execute on function public.portulan_duel_hasard(uuid, text, text, bigint) to service_role;
grant execute on function public.portulan_duel_repondre(uuid, uuid, integer, boolean, integer) to service_role;
grant execute on function public.portulan_duel_quitter(uuid, uuid) to service_role;
