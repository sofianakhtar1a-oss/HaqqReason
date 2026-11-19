"use client";

import { Bot, Check, Copy, Globe2, Link2, LogIn, Search, Share2, Swords, Trophy, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat, pluieDeLettres } from "@/lib/langues/feux";
import { pays } from "@/lib/monde/atlas";
import { adversaire as choisirExplorateur, EXPLORATEURS, type Explorateur, jouerVirtuel } from "@/lib/monde/bots";
import { CATEGORIES, IDS_CATEGORIES, type ModeJeu, TYPES } from "@/lib/monde/categories";
import { lireScore, useCompteMonde } from "@/lib/monde/compte-client";
import { deriver, hasard, nouvelleGraine } from "@/lib/monde/hasard";
import { DUREE_QUESTION_DUEL, pointsDuel } from "@/lib/monde/points";
import { noterReponse, useMonde } from "@/lib/monde/progression";
import { categorieDe, consigne, juger, QUESTIONS_PAR_DUEL, questionsDuel } from "@/lib/monde/quiz";
import type { EtatDuel } from "@/lib/monde/serveur";
import { useTextes } from "@/lib/modules/textes-client";
import { Classement } from "./Classement";
import { Chrono } from "./communs";
import { type GlobeRef } from "./Globe";
import { ContenuOption, Invite } from "./Partie";

/*
 * Les duels : dix questions, les mêmes pour les deux joueurs, chacun à son rythme.
 * Une bonne réponse vaut 100 points, plus jusqu'à 50 pour la rapidité.
 *   • Contre un explorateur virtuel : toujours disponible, simulé sur l'appareil, et présenté comme tel.
 *   • Contre un ami (un code à partager) ou au hasard : en ligne, arbitré par le serveur.
 */

const MODES: { id: ModeJeu; nom: string }[] = [
  { id: "melange", nom: "Tout mélangé" },
  ...IDS_CATEGORIES.map((c) => ({ id: c as ModeJeu, nom: CATEGORIES[c].nom })),
];

export type Rencontre =
  | { sorte: "virtuel"; mode: ModeJeu; graine: number; explorateur: Explorateur }
  | { sorte: "en-ligne"; duel: EtatDuel };

async function appel(corps: Record<string, unknown>): Promise<EtatDuel | { erreur: string }> {
  try {
    const r = await fetch("/api/monde/duel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as EtatDuel | { erreur: string };
    return r.ok ? x : { erreur: "erreur" in x ? x.erreur : "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

const MESSAGES: Record<string, string> = {
  introuvable: "Aucun duel avec ce code. Vérifie les six caractères.",
  ferme: "Ce duel a déjà commencé ou a expiré. Demande un nouveau code.",
  trop_vite: "Un instant : réessaie dans deux secondes.",
  indisponible: "Les duels en ligne ne sont pas disponibles pour le moment.",
  deconnecte: "Connecte-toi avec ton compte Google pour jouer en ligne.",
  reseau: "Pas de réseau : vérifie ta connexion.",
  illisible: "Ce code n'est pas valide.",
};

export function Duels({ sous, onSous }: { sous: string | null; onSous: (id: string | null) => void }) {
  const t = useTextes("monde");
  const compte = useCompteMonde();
  const monde = useMonde();
  const [mode, setMode] = useState<ModeJeu>("melange");
  const [rencontre, setRencontre] = useState<Rencontre | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  const enLigne = compte.connecte !== false && compte.enLigne !== false;
  const faits = Object.values(monde.niveaux).filter((n) => n.f).length;

  // Un lien de duel (#duels/duel=CODE) : on rejoint directement.
  useEffect(() => {
    const m = /^duel=([A-Za-z2-9]{6})$/.exec(sous ?? "");
    if (!m) return;
    void (async () => {
      const r = await appel({ action: "rejoindre", code: m[1] });
      if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
      else setRencontre({ sorte: "en-ligne", duel: r });
      history.replaceState(null, "", "#duels");
    })();
  }, [sous]);

  if (sous === "classement") return <Classement onRetour={() => onSous(null)} />;

  const virtuel = (e: Explorateur) => setRencontre({ sorte: "virtuel", mode, graine: nouvelleGraine(), explorateur: e });
  const creer = async () => {
    setMessage(null);
    const r = await appel({ action: "creer", mode });
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };
  const rejoindre = async () => {
    setMessage(null);
    const r = await appel({ action: "rejoindre", code: code.trim().toUpperCase() });
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };
  const auHasard = async () => {
    setMessage(null);
    setCherche(true);
    const r = await appel({ action: "hasard", mode });
    setCherche(false);
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };

  return (
    <div className="pt-duels">
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("duels.titre")}</h2>
          <p className="pt-chapo">{t("duels.chapo")}</p>
        </div>
        <button type="button" className="bouton bouton-discret" onClick={() => onSous("classement")}>
          <Trophy className="size-4" aria-hidden="true" />
          {t("classement.titre")}
        </button>
      </header>

      <fieldset className="pt-methodes">
        <legend>Les questions</legend>
        {MODES.map((m) => (
          <button key={m.id} type="button" className="pt-puce" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            {m.nom}
          </button>
        ))}
      </fieldset>

      {message && (
        <p className="pt-message" role="alert">
          {message}
        </p>
      )}

      <div className="pt-duel-choix">
        <section className="pt-duel-bloc" aria-labelledby="pt-duel-ami">
          <Users className="pt-duel-icone" aria-hidden="true" />
          <h3 id="pt-duel-ami">Défier un ami</h3>
          <p>Un code à six caractères : ton ami l&apos;entre, le duel commence.</p>
          <button type="button" className="bouton bouton-principal" onClick={creer} disabled={!enLigne}>
            <Link2 className="size-4" aria-hidden="true" />
            Créer un duel
          </button>
          <form
            className="pt-code"
            onSubmit={(e) => {
              e.preventDefault();
              void rejoindre();
            }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="CODE" aria-label="Le code du duel" disabled={!enLigne} autoComplete="off" spellCheck={false} />
            <button type="submit" className="bouton bouton-discret" disabled={!enLigne || code.length !== 6}>
              Rejoindre
            </button>
          </form>
        </section>
        <section className="pt-duel-bloc" aria-labelledby="pt-duel-hasard">
          <Globe2 className="pt-duel-icone" aria-hidden="true" />
          <h3 id="pt-duel-hasard">Adversaire au hasard</h3>
          <p>Un autre joueur connecté, sur les mêmes questions. Personne en vue ? Un explorateur virtuel prend le relais.</p>
          <button type="button" className="bouton bouton-principal" onClick={auHasard} disabled={!enLigne || cherche}>
            <Search className="size-4" aria-hidden="true" />
            {cherche ? "Recherche…" : "Trouver un adversaire"}
          </button>
        </section>
      </div>
      {!enLigne && (
        <p className="pt-astuce">
          {compte.connecte === false ? (
            <>
              <LogIn className="mr-1 inline size-4 align-[-3px]" aria-hidden="true" />
              Les duels en ligne demandent un compte Google connecté.
            </>
          ) : (
            "Les duels en ligne et le classement ouvrent très bientôt. Les explorateurs virtuels, eux, sont déjà là."
          )}
        </p>
      )}

      <section aria-labelledby="pt-explorateurs">
        <h3 id="pt-explorateurs" className="pt-sous-titre">
          <Bot className="mr-2 inline size-5 align-[-4px]" aria-hidden="true" />
          Les explorateurs virtuels
        </h3>
        <p className="pt-chapo">Des adversaires simulés sur ton appareil, qui portent le nom de grands géographes et voyageurs d&apos;autrefois.</p>
        <ul className="pt-explorateurs">
          {EXPLORATEURS.map((e) => (
            <li key={e.id}>
              <button type="button" className="pt-explorateur" onClick={() => virtuel(e)}>
                <span className="pt-explorateur-medaillon" aria-hidden="true">
                  {e.nom
                    .replace(/^Al-/, "")
                    .split(/\s+/)
                    .map((m) => m[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="pt-explorateur-texte">
                  <span className="pt-explorateur-nom">{e.nom}</span>
                  <span className="pt-explorateur-epoque">{e.epoque}</span>
                  <span className="pt-explorateur-bio">{e.bio}</span>
                </span>
                <span className="pt-force" aria-label={`Force ${e.force} sur 5`}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} data-plein={k <= e.force || undefined} />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="bouton bouton-discret" onClick={() => virtuel(choisirExplorateur(faits, hasard(nouvelleGraine())))}>
          <Swords className="size-4" aria-hidden="true" />
          Un adversaire à ma mesure
        </button>
      </section>

      {rencontre && (
        <Duel
          key={rencontre.sorte === "virtuel" ? rencontre.graine : rencontre.duel.id}
          rencontre={rencontre}
          onFermer={() => {
            setRencontre(null);
            void lireScore();
          }}
          onRevanche={() => {
            if (rencontre.sorte === "virtuel") setRencontre({ ...rencontre, graine: nouvelleGraine() });
            else {
              setRencontre(null);
              void creer();
            }
          }}
          onRemplacer={(e) => setRencontre({ sorte: "virtuel", mode: rencontre.sorte === "en-ligne" ? rencontre.duel.mode : rencontre.mode, graine: nouvelleGraine(), explorateur: e ?? choisirExplorateur(faits, hasard(nouvelleGraine())) })}
        />
      )}
    </div>
  );
}

/* =====================================================================
   Le duel lui-même
   ===================================================================== */

type Moi = { index: number; points: number; reponses: { i: number; j: boolean; p: number }[] };

function Duel({ rencontre, onFermer, onRevanche, onRemplacer }: { rencontre: Rencontre; onFermer: () => void; onRevanche: () => void; onRemplacer: (e?: Explorateur) => void }) {
  const virtuel = rencontre.sorte === "virtuel";
  const [duel, setDuel] = useState<EtatDuel | null>(virtuel ? null : rencontre.duel);
  const mode = virtuel ? rencontre.mode : rencontre.duel.mode;
  const graine = virtuel ? rencontre.graine : rencontre.duel.graine;
  // Les questions, et ce que fera l'explorateur virtuel à chacune (tiré d'avance, de la même graine).
  const [{ questions, coups }] = useState(() => {
    const qs = questionsDuel(graine, mode);
    return { questions: qs, coups: rencontre.sorte === "virtuel" ? qs.map((q, i) => jouerVirtuel(rencontre.explorateur, q, hasard(deriver(graine, 500 + i)))) : null };
  });
  // L'heure de départ, sur l'horloge de cet appareil (le serveur donne la sienne : on corrige l'écart).
  const [debut, setDebut] = useState<number | null>(() =>
    rencontre.sorte === "virtuel" ? Date.now() + 3200 : rencontre.duel.etat === "en_cours" && rencontre.duel.debut ? rencontre.duel.debut - (rencontre.duel.maintenant - Date.now()) : null,
  );
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [moi, setMoi] = useState<Moi>({ index: 0, points: 0, reponses: [] });
  const [choix, setChoix] = useState<string | null>(null);
  const [etape, setEtape] = useState<"question" | "reponse" | "fini" | null>(null);
  const [copie, setCopie] = useState(false);
  const debutQuestion = useRef(0);
  const demarre = useRef(false);
  const globe = useRef<GlobeRef>(null);
  const phase = etape ?? (debut ? "compte" : "attente");

  /* ---------- En ligne : relire l'état chaque seconde ---------- */
  const lire = useCallback(async () => {
    if (virtuel || !duel) return;
    try {
      const r = await fetch(`/api/monde/duel?id=${duel.id}`, { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as EtatDuel;
      setDuel(d);
      if (d.etat === "en_cours" && d.debut) setDebut((avant) => avant ?? d.debut! - (d.maintenant - Date.now()));
    } catch {
      // Le réseau reviendra : on relira à la prochaine seconde.
    }
  }, [virtuel, duel]);
  useEffect(() => {
    if (virtuel || !duel || duel.etat === "fini" || duel.etat === "abandon" || duel.etat === "expire") return;
    const t = setInterval(lire, duel.etat === "attente" ? 1500 : 1000);
    return () => clearInterval(t);
  }, [virtuel, duel, lire]);

  // L'horloge de l'écran : le compte à rebours, puis la progression de l'explorateur virtuel.
  useEffect(() => {
    if (etape === "fini" && !virtuel) return;
    const t = setInterval(() => {
      const n = Date.now();
      setMaintenant(n);
      if (debut && n >= debut && !demarre.current) {
        demarre.current = true;
        debutQuestion.current = n;
        setEtape("question");
      }
    }, 200);
    return () => clearInterval(t);
  }, [etape, debut, virtuel]);

  /* ---------- Répondre ---------- */
  const q = questions[moi.index];
  const repondre = useCallback(
    async (reponse: string, ou?: { x: number; y: number }) => {
      if (etape !== "question" || !q) return;
      const ms = Date.now() - debutQuestion.current;
      const j = juger(q.type, q.cible, reponse);
      const juste = j !== "faux";
      const p = pointsDuel(juste, ms);
      setChoix(reponse);
      setEtape("reponse");
      noterReponse(q.cible, categorieDe(q.type), juste);
      if (juste && ou && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) eclat(ou.x, ou.y, "ambre", 1);
      setMoi((m) => ({ index: m.index, points: m.points + p, reponses: [...m.reponses, { i: m.index, j: juste, p }] }));
      if (!virtuel && duel) {
        const r = await appel({ action: "repondre", id: duel.id, index: moi.index, reponse, ms });
        if (!("erreur" in r)) setDuel(r);
      }
    },
    [etape, q, virtuel, duel, moi.index],
  );
  useEffect(() => {
    if (etape !== "reponse") return;
    const t = setTimeout(() => {
      setChoix(null);
      if (moi.index + 1 >= questions.length) {
        setMoi((m) => ({ ...m, index: questions.length }));
        setEtape("fini");
      } else {
        setMoi((m) => ({ ...m, index: m.index + 1 }));
        debutQuestion.current = Date.now();
        setEtape("question");
      }
    }, 1300);
    return () => clearTimeout(t);
  }, [etape, moi.index, questions.length]);
  // Le temps de la question.
  useEffect(() => {
    if (etape !== "question") return;
    const t = setTimeout(() => void repondre("__temps__"), DUREE_QUESTION_DUEL);
    return () => clearTimeout(t);
  }, [etape, moi.index, repondre]);

  /* ---------- L'adversaire ---------- */
  let adv: { nom: string; avatar: string; points: number; nombre: number; virtuel: boolean } | null = null;
  if (rencontre.sorte === "virtuel" && coups && debut) {
    // L'explorateur avance à son rythme : chaque réponse, plus la pause d'après.
    let t = debut;
    let nombre = 0;
    let points = 0;
    for (const c of coups) {
      t += c.ms;
      if (t > maintenant) break;
      nombre++;
      points += c.points;
      t += 1300;
    }
    adv = { nom: rencontre.explorateur.nom, avatar: "", points, nombre, virtuel: true };
  } else if (duel?.adversaire) adv = { ...duel.adversaire, virtuel: false };

  const advFini = adv ? adv.nombre >= QUESTIONS_PAR_DUEL : false;
  const termine = virtuel ? etape === "fini" && advFini : duel ? duel.etat === "fini" || duel.etat === "abandon" : false;
  const expire = duel?.etat === "expire";
  const resultat: "victoire" | "defaite" | "nul" | null = virtuel ? (termine && adv ? (moi.points > adv.points ? "victoire" : moi.points < adv.points ? "defaite" : "nul") : null) : (duel?.resultat ?? null);

  // La fin : une pluie de lettres pour une victoire.
  const celebre = useRef(false);
  useEffect(() => {
    if (termine && resultat === "victoire" && !celebre.current) {
      celebre.current = true;
      setTimeout(() => pluieDeLettres(document.querySelector(".pt-duel-resultat"), "aurore", "VICTOIRE"), 250);
    }
  }, [termine, resultat]);

  // Quitter un duel en ligne en cours : c'est un abandon (on prévient).
  const quitter = async () => {
    if (!virtuel && duel && (duel.etat === "attente" || (duel.etat === "en_cours" && !termine))) {
      if (duel.etat === "en_cours" && !window.confirm("Quitter maintenant, c'est perdre le duel. Quitter quand même ?")) return;
      await appel({ action: "quitter", id: duel.id });
    }
    onFermer();
  };

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  const lien = duel ? `${window.location.origin}/monde#duels/duel=${duel.code}` : "";
  const partager = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Un duel au Portulan", text: `Je te défie au Portulan ! Code : ${duel?.code}`, url: lien });
      else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };

  const contenu = (
    <div className="pt pt-partie pt-duel" data-accent="safran" role="dialog" aria-modal="true" aria-label="Duel">
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-duel-tete">
        <button type="button" className="pt-icone" onClick={quitter} aria-label="Quitter le duel">
          <X className="size-5" aria-hidden="true" />
        </button>
        <Joueur nom="Toi" points={moi.points} nombre={moi.reponses.length} cote="gauche" />
        <span className="pt-duel-contre" aria-hidden="true">
          <Swords className="size-5" />
        </span>
        <Joueur nom={adv?.nom ?? "…"} avatar={adv?.avatar} points={adv?.points ?? 0} nombre={adv?.nombre ?? 0} cote="droite" virtuel={adv?.virtuel} />
      </header>

      {phase === "attente" && duel && !expire && (
        <div className="pt-intro">
          {duel.public ? (
            <>
              <p className="pt-intro-grade">Adversaire au hasard</p>
              <h2 className="pt-intro-titre">On cherche un adversaire…</h2>
              <Attente onTrop={() => onRemplacer()} />
            </>
          ) : (
            <>
              <p className="pt-intro-grade">Duel entre amis : {MODES.find((m) => m.id === duel.mode)?.nom.toLowerCase()}</p>
              <h2 className="pt-intro-titre">Ton code</h2>
              <p className="pt-duel-code" aria-label={`Code : ${duel.code.split("").join(" ")}`}>
                {duel.code}
              </p>
              <p className="pt-intro-regles">Ton ami ouvre Le Portulan, onglet Duels, et entre ce code. Le duel commence dès qu&apos;il arrive.</p>
              <div className="pt-fin-actions">
                <button type="button" className="bouton bouton-principal" onClick={partager}>
                  {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                  {copie ? "Lien copié" : "Partager le lien"}
                </button>
                <button
                  type="button"
                  className="bouton bouton-discret"
                  onClick={() => {
                    void navigator.clipboard?.writeText(duel.code);
                    setCopie(true);
                  }}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copier le code
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {expire && (
        <div className="pt-intro">
          <h2 className="pt-intro-titre">Personne n&apos;est venu</h2>
          <p className="pt-intro-regles">Le duel a expiré. Tu peux affronter un explorateur virtuel en attendant.</p>
          <button type="button" className="bouton bouton-principal" onClick={() => onRemplacer()}>
            <Bot className="size-4" aria-hidden="true" />
            Affronter un explorateur virtuel
          </button>
        </div>
      )}

      {phase === "compte" && debut !== null && (
        <div className="pt-intro">
          {rencontre.sorte === "virtuel" && (
            <>
              <p className="pt-intro-grade">Explorateur virtuel du {rencontre.explorateur.epoque}</p>
              <h2 className="pt-intro-titre">{rencontre.explorateur.nom}</h2>
              <p className="pt-intro-regles">{rencontre.explorateur.bio}</p>
            </>
          )}
          <p className="pt-decompte" key={Math.ceil((debut - maintenant) / 1000)} aria-live="polite">
            {Math.max(1, Math.ceil((debut - maintenant) / 1000))}
          </p>
        </div>
      )}

      {(phase === "question" || phase === "reponse") && q && (
        <div className="pt-question" key={moi.index}>
          <p className="pt-consigne">
            <span className="pt-consigne-cat">
              {CATEGORIES[categorieDe(q.type)].nom}, {moi.index + 1}/{QUESTIONS_PAR_DUEL}
            </span>
            {consigne(q)}
            {phase === "question" && <Chrono key={moi.index} duree={DUREE_QUESTION_DUEL} cle={`d${moi.index}`} />}
          </p>
          <div className="pt-invite" data-sorte={TYPES[q.type].invite}>
            <Invite q={q} globe={globe} phase={phase} toucheGlobe={null} onToucher={() => undefined} />
          </div>
          <div className="pt-choix" data-sorte={TYPES[q.type].reponse} data-nb={q.options.length}>
            {q.options.map((o, i) => {
              const etat = phase === "reponse" ? (o.id === choix ? (juger(q.type, q.cible, o.id) === "faux" ? "faux" : "juste") : juger(q.type, q.cible, o.id) !== "faux" ? "attendu" : undefined) : undefined;
              return (
                <button
                  key={o.id}
                  type="button"
                  className="pt-option"
                  data-etat={etat}
                  disabled={phase !== "question"}
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    void repondre(o.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
                  }}
                >
                  <span className="pt-option-touche" aria-hidden="true">
                    {i + 1}
                  </span>
                  <ContenuOption q={q} o={o} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "fini" && !termine && !expire && (
        <div className="pt-intro">
          <h2 className="pt-intro-titre">Dix réponses données</h2>
          <p className="pt-intro-regles">{adv ? `${adv.nom} termine ses questions…` : "On attend la fin du duel…"}</p>
          <span className="pt-attente-points" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}

      {termine && (
        <div className="pt-fin pt-duel-resultat" data-reussi={resultat === "victoire" || undefined}>
          <h2 className="pt-fin-titre">{resultat === "victoire" ? "Victoire !" : resultat === "nul" ? "Égalité" : "Défaite"}</h2>
          <p className="pt-fin-sous">
            {moi.points} points contre {adv?.points ?? 0}.
            {!virtuel && duel && duel.moi.trophees > 0 ? ` +${duel.moi.trophees} trophées.` : ""}
            {virtuel ? " Un duel d'entraînement : les trophées se gagnent contre d'autres joueurs." : ""}
          </p>
          <ol className="pt-duel-recap" aria-label="Tes réponses">
            {questions.map((x, i) => {
              const r = moi.reponses[i];
              return (
                <li key={i} data-juste={r?.j || undefined}>
                  <span>{pays(x.cible).nom}</span>
                  <span className="tabular-nums">{r ? (r.j ? `+${r.p}` : "0") : "—"}</span>
                </li>
              );
            })}
          </ol>
          <div className="pt-fin-actions">
            <button type="button" className="bouton bouton-principal" onClick={onRevanche}>
              <Swords className="size-4" aria-hidden="true" />
              Revanche
            </button>
            <button type="button" className="bouton bouton-discret" onClick={onFermer}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
  return createPortal(contenu, document.body);
}

function Joueur({ nom, avatar, points, nombre, cote, virtuel }: { nom: string; avatar?: string; points: number; nombre: number; cote: "gauche" | "droite"; virtuel?: boolean }) {
  return (
    <div className="pt-joueur" data-cote={cote}>
      <span className="pt-joueur-avatar" aria-hidden="true">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" />
        ) : virtuel ? (
          <Bot className="size-5" />
        ) : (
          nom.slice(0, 1)
        )}
      </span>
      <span className="pt-joueur-texte">
        <span className="pt-joueur-nom">
          {nom}
          {virtuel && <span className="pt-virtuel">virtuel</span>}
        </span>
        <span className="pt-joueur-points tabular-nums">{points} pts</span>
        <span className="pt-joueur-piste" aria-label={`${nombre} réponses sur ${QUESTIONS_PAR_DUEL}`}>
          {Array.from({ length: QUESTIONS_PAR_DUEL }, (_, i) => (
            <i key={i} data-fait={i < nombre || undefined} />
          ))}
        </span>
      </span>
    </div>
  );
}

/** L'attente d'un adversaire au hasard : au bout de 30 secondes, on propose un explorateur virtuel. */
function Attente({ onTrop }: { onTrop: () => void }) {
  const [depuis] = useState(() => Date.now());
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT(Math.floor((Date.now() - depuis) / 1000)), 500);
    return () => clearInterval(i);
  }, [depuis]);
  return (
    <>
      <span className="pt-attente-points" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p className="pt-intro-regles" aria-live="polite">
        {t < 30 ? `${t} s… Garde cet écran ouvert.` : "Personne pour l'instant."}
      </p>
      {t >= 12 && (
        <button type="button" className="bouton bouton-discret" onClick={onTrop}>
          <Bot className="size-4" aria-hidden="true" />
          Jouer contre un explorateur virtuel
        </button>
      )}
    </>
  );
}
