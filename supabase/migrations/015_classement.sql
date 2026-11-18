-- =====================================================================
-- 015 · Le Truchement : points du vocabulaire et classement
--   • Chaque bonne réponse d'une séance de vocabulaire rapporte des points.
--     Le navigateur n'envoie que ses RÉPONSES : le serveur du site les vérifie
--     (lib/langues/points.ts) puis appelle vocabulaire_repondre, qui calcule
--     les points ici, dans une seule transaction verrouillée. Personne ne peut
--     écrire son score.
--   • Règles (les mêmes que lib/langues/points.ts, vérifiées par les tests) :
--       - points de base selon l'exercice (10 pour un choix, 15 pour écrire…) ;
--       - série de bonnes réponses : ×1,5 dès 5, ×2 dès 10, ×2,5 dès 20, ×3 dès 40 ;
--       - « presque » (petite faute) : la moitié de la base, la série tient ;
--       - erreur : 0 point (jamais de malus), la série repart de zéro ;
--       - jours d'affilée : la 1re bonne réponse du jour ajoute 5 × jours (50 au plus) ;
--       - un même mot ne rapporte qu'une fois par jour (il compte quand même dans la série) ;
--       - 600 ms au moins entre deux envois, 2 500 points et 2 000 réponses par jour au plus.
--   • Le classement ne montre que les comptes qui l'ont rejoint (case à cocher) :
--     prénom, initiale du nom et photo Google. Les autres gardent leurs points pour eux.
-- Tout est réservé au serveur : le navigateur ne lit jamais ces tables.
-- Le script peut être relancé sans risque (014_comptes.sql doit avoir été lancé avant).
-- =====================================================================

-- 1. La photo Google et le choix d'apparaître au classement -------------
alter table public.utilisateurs
  add column if not exists avatar text not null default ''
  check (avatar = '' or (char_length(avatar) <= 500 and avatar ~ '^https://lh[3-6]\.googleusercontent\.com/[A-Za-z0-9._~/=+%-]+$'));
alter table public.utilisateurs
  add column if not exists classement boolean not null default false;

-- 2. Le score de chaque compte -------------------------------------------
create table if not exists public.scores_vocabulaire (
  utilisateur_id   uuid primary key references public.utilisateurs (id) on delete cascade,
  points           bigint  not null default 0 check (points >= 0),
  -- Bonnes réponses d'affilée (toutes séances confondues).
  serie            integer not null default 0 check (serie >= 0),
  meilleure_serie  integer not null default 0 check (meilleure_serie >= 0),
  -- Jours d'affilée avec au moins une bonne réponse (heure de Paris).
  jours            integer not null default 0 check (jours >= 0),
  dernier_jour     date,
  bonnes           integer not null default 0 check (bonnes >= 0),
  reponses         integer not null default 0 check (reponses >= 0),
  derniere_reponse timestamptz,
  maj              timestamptz not null default now()
);
create index if not exists scores_vocabulaire_points_idx on public.scores_vocabulaire (points desc);

-- 3. Les points de chaque jour (classement de la semaine, plafond du jour) --
create table if not exists public.points_jour (
  utilisateur_id uuid    not null references public.utilisateurs (id) on delete cascade,
  jour           date    not null,
  points         integer not null default 0 check (points >= 0),
  reponses       integer not null default 0 check (reponses >= 0),
  primary key (utilisateur_id, jour)
);
create index if not exists points_jour_jour_idx on public.points_jour (jour);

-- 4. Les mots déjà récompensés aujourd'hui (un mot ne paie qu'une fois par jour) --
create table if not exists public.mots_du_jour (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  jour           date not null,
  mot            text not null check (char_length(mot) between 1 and 200),
  primary key (utilisateur_id, jour, mot)
);

alter table public.scores_vocabulaire enable row level security;
alter table public.points_jour enable row level security;
alter table public.mots_du_jour enable row level security;
revoke all on table public.scores_vocabulaire, public.points_jour, public.mots_du_jour from anon, authenticated;
grant all on table public.scores_vocabulaire, public.points_jour, public.mots_du_jour to service_role;
comment on table public.scores_vocabulaire is 'Points du vocabulaire (Le Truchement), calculés par vocabulaire_repondre. Réservée au serveur.';
comment on table public.points_jour is 'Points gagnés chaque jour, pour le classement de la semaine et le plafond quotidien. Réservée au serveur.';
comment on table public.mots_du_jour is 'Mots déjà récompensés aujourd''hui (anti-répétition). Réservée au serveur.';

-- 5. Le multiplicateur de série (même table que PALIERS dans lib/langues/points.ts) --
create or replace function public.vocabulaire_multiplicateur(p_serie integer)
returns numeric
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_serie >= 40 then 3.0
    when p_serie >= 20 then 2.5
    when p_serie >= 10 then 2.0
    when p_serie >= 5 then 1.5
    else 1.0
  end::numeric
$$;

-- 6. Enregistrer des réponses déjà vérifiées par le serveur ---------------
-- p_reponses : [{ "mot": identifiant, "resultat": "juste" | "presque" | "faux", "base": points de base }, …] (6 au plus)
-- Renvoie l'état du compte et le détail des points gagnés, ou { "erreur": … }.
create or replace function public.vocabulaire_repondre(p_utilisateur uuid, p_reponses jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  c_plafond_points   constant integer := 2500;
  c_plafond_reponses constant integer := 2000;
  c_intervalle       constant interval := interval '600 milliseconds';
  v_maintenant timestamptz := clock_timestamp();
  v_jour date := (v_maintenant at time zone 'Europe/Paris')::date;
  s public.scores_vocabulaire%rowtype;
  v_jour_points integer;
  v_jour_reponses integer;
  r jsonb;
  v_mot text;
  v_resultat text;
  v_base integer;
  v_nouveau boolean;
  v_lignes integer;
  v_gain integer;
  v_gains integer := 0;
  v_bonus integer := 0;
  v_details jsonb := '[]'::jsonb;
begin
  if p_reponses is null or jsonb_typeof(p_reponses) <> 'array' or jsonb_array_length(p_reponses) not between 1 and 6 then
    return jsonb_build_object('erreur', 'illisible');
  end if;
  if not exists (select 1 from public.utilisateurs u where u.id = p_utilisateur) then
    return jsonb_build_object('erreur', 'inconnu');
  end if;

  insert into public.scores_vocabulaire (utilisateur_id) values (p_utilisateur) on conflict do nothing;
  -- Le verrou : deux onglets qui envoient en même temps passent l'un après l'autre.
  select * into s from public.scores_vocabulaire where utilisateur_id = p_utilisateur for update;

  if s.derniere_reponse is not null and v_maintenant - s.derniere_reponse < c_intervalle then
    return jsonb_build_object('erreur', 'trop_vite');
  end if;

  insert into public.points_jour (utilisateur_id, jour) values (p_utilisateur, v_jour) on conflict do nothing;
  select pj.points, pj.reponses into v_jour_points, v_jour_reponses
    from public.points_jour pj where pj.utilisateur_id = p_utilisateur and pj.jour = v_jour for update;
  -- Les mots d'avant-hier ne servent plus à rien.
  delete from public.mots_du_jour m where m.utilisateur_id = p_utilisateur and m.jour < v_jour - 1;

  for r in select value from jsonb_array_elements(p_reponses) loop
    v_mot := r ->> 'mot';
    v_resultat := r ->> 'resultat';
    v_base := least(20, greatest(0, coalesce(nullif(r ->> 'base', '')::integer, 0)));
    if v_mot is null or char_length(v_mot) not between 1 and 200 or v_resultat is null or v_resultat not in ('juste', 'presque', 'faux') then
      continue;
    end if;
    v_gain := 0;
    s.reponses := s.reponses + 1;
    v_jour_reponses := v_jour_reponses + 1;

    if v_resultat = 'faux' then
      s.serie := 0;
    else
      insert into public.mots_du_jour (utilisateur_id, jour, mot) values (p_utilisateur, v_jour, v_mot) on conflict do nothing;
      get diagnostics v_lignes = row_count;
      v_nouveau := v_lignes > 0;
      if v_resultat = 'juste' then
        s.bonnes := s.bonnes + 1;
        s.serie := s.serie + 1;
        if v_nouveau then
          v_gain := round(v_base * public.vocabulaire_multiplicateur(s.serie))::integer;
        end if;
        s.meilleure_serie := greatest(s.meilleure_serie, s.serie);
        -- Première bonne réponse du jour : les jours d'affilée avancent (ou repartent à 1).
        if s.dernier_jour is distinct from v_jour then
          s.jours := case when s.dernier_jour = v_jour - 1 then s.jours + 1 else 1 end;
          s.dernier_jour := v_jour;
          v_bonus := 5 * least(s.jours, 10);
        end if;
      elsif v_nouveau then
        v_gain := ceil(v_base / 2.0)::integer;
      end if;
    end if;

    -- Les plafonds du jour.
    if v_jour_reponses > c_plafond_reponses then
      v_gain := 0;
    end if;
    v_gain := least(v_gain, greatest(0, c_plafond_points - v_jour_points - v_gains));
    v_gains := v_gains + v_gain;
    v_details := v_details || jsonb_build_object('mot', v_mot, 'resultat', v_resultat, 'gain', v_gain, 'serie', s.serie);
  end loop;

  v_bonus := least(v_bonus, greatest(0, c_plafond_points - v_jour_points - v_gains));

  update public.scores_vocabulaire set
    points = s.points + v_gains + v_bonus,
    serie = s.serie,
    meilleure_serie = s.meilleure_serie,
    jours = s.jours,
    dernier_jour = s.dernier_jour,
    bonnes = s.bonnes,
    reponses = s.reponses,
    derniere_reponse = v_maintenant,
    maj = case when v_gains + v_bonus > 0 then v_maintenant else maj end
  where utilisateur_id = p_utilisateur;

  update public.points_jour set points = v_jour_points + v_gains + v_bonus, reponses = v_jour_reponses
  where utilisateur_id = p_utilisateur and jour = v_jour;

  return jsonb_build_object(
    'gain', v_gains,
    'bonus', v_bonus,
    'points', s.points + v_gains + v_bonus,
    'aujourdhui', v_jour_points + v_gains + v_bonus,
    'serie', s.serie,
    'meilleure_serie', s.meilleure_serie,
    'jours', s.jours,
    'plafond', (v_jour_points + v_gains + v_bonus) >= c_plafond_points,
    'details', v_details
  );
end $$;

-- 7. Le classement : les 10 premiers et la place du compte -----------------
-- p_periode : « semaine » (depuis lundi, heure de Paris) ou « toujours ».
create or replace function public.vocabulaire_classement(p_utilisateur uuid, p_periode text default 'semaine', p_limite integer default 10)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_jour date := (now() at time zone 'Europe/Paris')::date;
  v_lundi date := date_trunc('week', v_jour)::date;
  v_semaine boolean := coalesce(p_periode, 'semaine') <> 'toujours';
  v_resultat jsonb;
begin
  with semaine as (
    select pj.utilisateur_id, sum(pj.points)::bigint as points
    from public.points_jour pj
    where pj.jour >= v_lundi
    group by pj.utilisateur_id
  ),
  base as (
    select
      u.id,
      u.nom,
      u.avatar,
      u.classement,
      case when v_semaine then coalesce(se.points, 0) else s.points end as points,
      s.points as total,
      coalesce(se.points, 0) as points_semaine,
      s.serie,
      s.meilleure_serie,
      -- Une série de jours non entretenue hier est perdue.
      case when s.dernier_jour >= v_jour - 1 then s.jours else 0 end as jours,
      s.bonnes,
      s.reponses,
      s.maj
    from public.scores_vocabulaire s
    join public.utilisateurs u on u.id = s.utilisateur_id
    left join semaine se on se.utilisateur_id = s.utilisateur_id
  ),
  classes as (
    select b.*, rank() over (order by b.points desc) as rang
    from base b
    where b.classement and b.points > 0
  )
  select jsonb_build_object(
    'periode', case when v_semaine then 'semaine' else 'toujours' end,
    'depuis', v_lundi,
    'participants', (select count(*) from classes),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rang', t.rang, 'id', t.id, 'nom', t.nom, 'avatar', t.avatar, 'points', t.points, 'serie', t.serie, 'jours', t.jours
      ) order by t.rang, t.maj)
      from (select * from classes order by rang, maj limit least(greatest(coalesce(p_limite, 10), 1), 50)) t
    ), '[]'::jsonb),
    'moi', (
      select jsonb_build_object(
        'rang', (select c.rang from classes c where c.id = b.id),
        'nom', b.nom, 'avatar', b.avatar, 'classement', b.classement,
        'points', b.points, 'total', b.total, 'semaine', b.points_semaine,
        'serie', b.serie, 'meilleure_serie', b.meilleure_serie, 'jours', b.jours,
        'bonnes', b.bonnes, 'reponses', b.reponses
      )
      from base b where b.id = p_utilisateur
    )
  ) into v_resultat;
  return v_resultat;
end $$;

revoke all on function public.vocabulaire_multiplicateur(integer) from public, anon, authenticated;
revoke all on function public.vocabulaire_repondre(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.vocabulaire_classement(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.vocabulaire_multiplicateur(integer) to service_role;
grant execute on function public.vocabulaire_repondre(uuid, jsonb) to service_role;
grant execute on function public.vocabulaire_classement(uuid, text, integer) to service_role;
