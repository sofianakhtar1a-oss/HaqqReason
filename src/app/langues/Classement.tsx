"use client";

import { Crown, Flame, LogIn, Trophy, UserRound } from "lucide-react";
import { animate, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Classement as DonneesClassement, LigneClassement, Moi } from "@/lib/langues/classement-serveur";
import { pluieDeLettres } from "@/lib/langues/feux";
import { BASES, PALIERS, PLAFOND_JOUR } from "@/lib/langues/points";
import { surEvenement, synchroniser } from "@/lib/langues/points-client";

/*
 * Le classement du vocabulaire : les 10 meilleurs apprenants et ta place.
 *   • « Cette semaine » (depuis lundi) ou « Depuis toujours ».
 *   • Mis à jour toutes les 20 secondes quand la page est visible, et juste après tes propres points.
 *   • Les lignes glissent à leur nouvelle place ; quand tu montes, des lettres jaillissent de ta ligne.
 *   • On n'y apparaît qu'après l'avoir rejoint (prénom, initiale du nom et photo Google).
 */

type Periode = "semaine" | "toujours";
type Etat = "chargement" | "ok" | "deconnecte" | "indisponible";

const RAFRAICHIR_MS = 20_000;
const rangLisible = (r: number) => (r === 1 ? "1er" : `${r}e`);
const nombre = (n: number) => n.toLocaleString("fr-FR");

export function Classement() {
  const [periode, setPeriode] = useState<Periode>("semaine");
  const [donnees, setDonnees] = useState<DonneesClassement | null>(null);
  const [etat, setEtat] = useState<Etat>("chargement");
  const [occupe, setOccupe] = useState(false);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const periodeRef = useRef(periode);
  const rangs = useRef<Partial<Record<Periode, number | null>>>({});
  const ligneMoi = useRef<HTMLLIElement | null>(null);

  const charger = useCallback(async (p: Periode = periodeRef.current) => {
    try {
      const r = await fetch(`/api/langues/classement?periode=${p}`, { credentials: "same-origin", cache: "no-store" });
      if (p !== periodeRef.current) return;
      if (r.status === 401) {
        setEtat("deconnecte");
        synchroniser(null, false);
        return;
      }
      if (!r.ok) {
        setEtat("indisponible");
        return;
      }
      const d = (await r.json()) as DonneesClassement;
      setDonnees(d);
      setEtat("ok");
      synchroniser(d.moi, true);
      // Une place gagnée se fête (une fois la nouvelle ligne en place).
      const avant = rangs.current[p];
      const apres = d.moi?.rang ?? null;
      if (avant != null && apres != null && apres < avant) {
        setAnnonce(apres === 1 ? "Tu prends la tête du classement !" : `Tu passes ${rangLisible(apres)} !`);
        setTimeout(() => pluieDeLettres(ligneMoi.current, apres <= 3 ? "ambre" : "azur"), 420);
      }
      rangs.current[p] = apres;
    } catch {
      if (p === periodeRef.current) setEtat((e) => (e === "ok" ? e : "indisponible"));
    }
  }, []);

  // Au changement de période, puis toutes les 20 secondes tant que la page est visible.
  useEffect(() => {
    periodeRef.current = periode;
    const premier = setTimeout(() => void charger(periode), 0);
    const minuteur = setInterval(() => document.visibilityState === "visible" && void charger(), RAFRAICHIR_MS);
    const revenir = () => document.visibilityState === "visible" && void charger();
    document.addEventListener("visibilitychange", revenir);
    return () => {
      clearTimeout(premier);
      clearInterval(minuteur);
      document.removeEventListener("visibilitychange", revenir);
    };
  }, [periode, charger]);

  // Juste après tes propres points.
  useEffect(() => {
    let attente: ReturnType<typeof setTimeout> | null = null;
    const stop = surEvenement((e) => {
      if (e.type !== "gain") return;
      if (attente) clearTimeout(attente);
      attente = setTimeout(() => void charger(), 1200);
    });
    return () => {
      stop();
      if (attente) clearTimeout(attente);
    };
  }, [charger]);

  useEffect(() => {
    if (!annonce) return;
    const m = setTimeout(() => setAnnonce(null), 4200);
    return () => clearTimeout(m);
  }, [annonce]);

  const rejoindre = async (visible: boolean) => {
    setOccupe(true);
    try {
      const r = await fetch("/api/langues/classement", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visible }), credentials: "same-origin" });
      if (r.ok) {
        rangs.current = {};
        await charger();
        if (visible) setTimeout(() => pluieDeLettres(ligneMoi.current, "ambre", "welcome"), 450);
      }
    } finally {
      setOccupe(false);
    }
  };

  const moi = donnees?.moi ?? null;
  const top = donnees?.top ?? [];
  const horsTop = moi?.classement && moi.rang !== null && !top.some((l) => l.moi);

  return (
    <section className="lg-classement" aria-labelledby="titre-classement">
      <div className="lg-classement-tete">
        <h3 id="titre-classement" className="lg-classement-titre">
          <Trophy className="size-5" aria-hidden="true" />
          Classement
        </h3>
        <div className="lg-classement-periodes" role="tablist" aria-label="Période du classement">
          {(
            [
              ["semaine", "Cette semaine"],
              ["toujours", "Depuis toujours"],
            ] as const
          ).map(([valeur, nom]) => (
            <button key={valeur} type="button" role="tab" aria-selected={periode === valeur} className="lg-filtre" onClick={() => setPeriode(valeur)}>
              {nom}
            </button>
          ))}
        </div>
      </div>

      {annonce && (
        <p className="lg-classement-annonce" role="status">
          <Crown className="size-4" aria-hidden="true" />
          {annonce}
        </p>
      )}

      {etat === "chargement" && (
        <ol className="lg-classement-liste" aria-hidden="true">
          {[0, 1, 2, 3].map((k) => (
            <li key={k} className="lg-classement-ligne lg-classement-squelette" />
          ))}
        </ol>
      )}

      {etat === "deconnecte" && (
        <div className="lg-classement-vide">
          <p>Connecte-toi avec ton compte Google pour gagner des points à chaque bonne réponse et entrer au classement.</p>
          <Link href={`/connexion?retour=${encodeURIComponent("/langues#vocabulaire")}`} className="bouton bouton-principal">
            <LogIn className="size-4" aria-hidden="true" />
            Me connecter
          </Link>
        </div>
      )}

      {etat === "indisponible" && <p className="lg-classement-vide">Le classement n&apos;est pas disponible pour l&apos;instant. Tes séances continuent normalement ; réessaie dans un moment.</p>}

      {etat === "ok" && donnees && (
        <>
          {moi && !moi.classement && <Invitation moi={moi} occupe={occupe} onRejoindre={() => void rejoindre(true)} />}

          {top.length === 0 ? (
            <p className="lg-classement-vide">{periode === "semaine" ? "Personne n'a encore de points cette semaine : les premiers points te placeront en tête." : "Personne n'a encore rejoint le classement."}</p>
          ) : (
            <LayoutGroup id={`classement-${periode}`}>
              <ol className="lg-classement-liste" aria-label={`Les ${top.length} premiers, ${periode === "semaine" ? "cette semaine" : "depuis toujours"}`}>
                {top.map((l) => (
                  <Ligne key={l.cle} l={l} refMoi={l.moi ? ligneMoi : undefined} />
                ))}
                {horsTop && moi && moi.rang !== null && (
                  <>
                    <li className="lg-classement-ellipse" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </li>
                    <Ligne l={{ rang: moi.rang, cle: "moi", nom: moi.nom, avatar: moi.avatar, points: moi.points, serie: moi.serie, jours: moi.jours, moi: true }} refMoi={ligneMoi} />
                  </>
                )}
              </ol>
            </LayoutGroup>
          )}

          {moi && (
            <dl className="lg-classement-moi">
              <div>
                <dt>Ta place</dt>
                <dd>{moi.classement ? (moi.rang ? `${rangLisible(moi.rang)} sur ${nombre(donnees.participants)}` : "pas encore classé") : "hors classement"}</dd>
              </div>
              <div>
                <dt>Cette semaine</dt>
                <dd>{nombre(moi.semaine)} pts</dd>
              </div>
              <div>
                <dt>Au total</dt>
                <dd>{nombre(moi.total)} pts</dd>
              </div>
              <div>
                <dt>
                  <Flame className="inline size-3.5" aria-hidden="true" /> Jours d&apos;affilée
                </dt>
                <dd>{moi.jours}</dd>
              </div>
              <div>
                <dt>Meilleure série</dt>
                <dd>{moi.meilleure_serie}</dd>
              </div>
            </dl>
          )}

          <details className="lg-classement-regles">
            <summary>Comment gagner des points ?</summary>
            <ul>
              <li>
                Bonne réponse : <strong>{BASES.qcm} points</strong> pour un choix, {BASES.ecoute} pour l&apos;écoute ou le texte à trous, {BASES.ecriture} pour écrire le mot ({BASES.paires} par paire, {BASES.carte} par carte mémoire).
              </li>
              <li>
                Série de bonnes réponses : {PALIERS.slice(1)
                  .map((p) => `×${String(p.mult).replace(".", ",")} dès ${p.des} (${p.nom})`)
                  .join(", ")}
                .
              </li>
              <li>Une petite faute (« presque ») : la moitié des points, et la série continue. Une erreur : 0 point, jamais de malus, mais la série repart de zéro.</li>
              <li>Chaque jour d&apos;affilée : la première bonne réponse du jour rapporte 5 points par jour de suite (50 au plus).</li>
              <li>
                Un même mot ne rapporte qu&apos;une fois par jour, et {nombre(PLAFOND_JOUR)} points par jour au plus. Les mots de ton dictionnaire personnel ne comptent pas.
              </li>
            </ul>
            {moi?.classement && (
              <button type="button" className="lg-retour-lien" disabled={occupe} onClick={() => void rejoindre(false)}>
                Quitter le classement
              </button>
            )}
          </details>
        </>
      )}
    </section>
  );
}

function Invitation({ moi, occupe, onRejoindre }: { moi: Moi; occupe: boolean; onRejoindre: () => void }) {
  return (
    <div className="lg-classement-invitation">
      <Avatar nom={moi.nom} avatar={moi.avatar} cle="moi" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {moi.total > 0 ? `Tu as déjà ${nombre(moi.total)} points.` : "Chaque bonne réponse te rapporte des points."} Rejoins le classement pour te mesurer aux autres.
        </p>
        <p className="lg-legende">
          Les autres apprenants verront « {moi.nom} », ta photo Google et tes points. Tu peux le quitter quand tu veux.
        </p>
      </div>
      <button type="button" className="bouton bouton-principal" disabled={occupe} onClick={onRejoindre}>
        <Trophy className="size-4" aria-hidden="true" />
        Rejoindre
      </button>
    </div>
  );
}

function Ligne({ l, refMoi }: { l: LigneClassement; refMoi?: React.RefObject<HTMLLIElement | null> }) {
  const reduit = useReducedMotion();
  return (
    <motion.li
      ref={refMoi}
      layout={reduit ? false : "position"}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="lg-classement-ligne"
      data-podium={l.rang <= 3 ? l.rang : undefined}
      data-moi={l.moi || undefined}
      aria-current={l.moi ? "true" : undefined}
    >
      <span className="lg-classement-rang" aria-label={`${rangLisible(l.rang)}`}>
        {l.rang === 1 ? <Crown className="size-4" aria-hidden="true" /> : l.rang}
      </span>
      <Avatar nom={l.nom} avatar={l.avatar} cle={l.cle} />
      <span className="lg-classement-nom">
        {l.nom}
        {l.moi && <span className="lg-badge">toi</span>}
      </span>
      {l.jours > 1 && (
        <span className="lg-classement-jours" title={`${l.jours} jours d'affilée`}>
          <Flame className="size-3.5" aria-hidden="true" />
          {l.jours}
        </span>
      )}
      <span className="lg-classement-points">
        <Compteur valeur={l.points} /> <small>pts</small>
      </span>
    </motion.li>
  );
}

/** Le nombre de points défile jusqu'à sa nouvelle valeur. */
function Compteur({ valeur }: { valeur: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const precedent = useRef(valeur);
  const reduit = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    const depart = precedent.current;
    precedent.current = valeur;
    if (!el) return;
    if (reduit || depart === valeur) {
      el.textContent = nombre(valeur);
      return;
    }
    const a = animate(depart, valeur, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => (el.textContent = nombre(Math.round(v))) });
    return () => a.stop();
  }, [valeur, reduit]);
  return <span ref={ref}>{nombre(valeur)}</span>;
}

/** La photo Google, ou une initiale sur une teinte tirée du compte. */
function Avatar({ nom, avatar, cle }: { nom: string; avatar: string; cle: string }) {
  const [casse, setCasse] = useState(false);
  const teinte = [...cle].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  if (avatar && !casse) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="lg-avatar" src={avatar} alt="" width={36} height={36} loading="lazy" referrerPolicy="no-referrer" onError={() => setCasse(true)} />;
  }
  return (
    <span className="lg-avatar lg-avatar-initiale" style={{ ["--teinte-avatar" as string]: `${teinte}` }} aria-hidden="true">
      {nom.trim().charAt(0).toUpperCase() || <UserRound className="size-4" />}
    </span>
  );
}
