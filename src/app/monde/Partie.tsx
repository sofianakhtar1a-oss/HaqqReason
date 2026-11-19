"use client";

import { ArrowRight, Check, Hourglass, LocateFixed, Minus, Plus, RotateCcw, Shuffle, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat, pluieDeLettres } from "@/lib/langues/feux";
import { formatPopulation, formatSuperficie, motCapitale, NOM_CONTINENT, pays } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, TYPES, type TypeQuestion } from "@/lib/monde/categories";
import { envoyerReponse } from "@/lib/monde/compte-client";
import { deriver, nouvelleGraine } from "@/lib/monde/hasard";
import { COEURS, grade, NB_NIVEAUX } from "@/lib/monde/niveaux";
import { baseDe, gainDe, type Joker, JOKERS } from "@/lib/monde/points";
import { useRecits } from "@/lib/monde/recits-client";
import { aReviserAvant, battreRecord, type Bilan, depenser, ducats, finirNiveau, noterReponse, revisionsDues, useMonde } from "@/lib/monde/progression";
import { categorieDe, consigne, juger, partieDeNiveau, type Question, questionMelangee, questionSur } from "@/lib/monde/quiz";
import type { Jugement } from "@/lib/monde/texte";
import type { CabinetId, MethodeCabinet } from "@/lib/monde/types";
import { dire, taire } from "@/lib/monde/voix";
import { BoutonVoix, Chrono, Coeurs, Ducats, Etoiles } from "./communs";
import { Drapeau, MiniContinent, Silhouette } from "./figures";
import { bonneReponseAutre, Classement, Coloriage, ContenuOptionAutre, gereInvite, InviteAutre, presqueAutre, Puzzle } from "./formes";
import { Globe, type GlobeRef } from "./Globe";

/*
 * Une partie, en plein écran : une question à la fois, trois cœurs, un chrono qui se vide,
 * des jokers à quelques ducats. Cinq sortes de parties :
 *   • niveau   : les 20 questions d'un niveau d'une catégorie ;
 *   • tour     : le tour du monde, 20 questions de toutes les catégories ;
 *   • eclair   : 60 secondes, le plus de bonnes réponses possible ;
 *   • survie   : jusqu'à la première erreur ;
 *   • revision : les pays que ta mémoire est en train de perdre.
 */

export type Lancement = {
  cle: string;
  /** cabinet : un niveau d'un cabinet (Cabinet.tsx) ; nomme : « Nomme-les tous » (NommeLesTous.tsx). */
  sorte: "niveau" | "tour" | "eclair" | "survie" | "revision" | "cabinet" | "nomme";
  categorie?: CategorieId;
  niveau?: number;
  methode?: TypeQuestion | null;
  cabinet?: CabinetId;
  methodeCabinet?: MethodeCabinet | null;
  /** Pour « Nomme-les tous » : continent:afrique, monde, cabinet:fr-departements… */
  liste?: string;
  titre: string;
};

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const DUREE_ECLAIR = 60_000;

function dureeQuestion(l: Lancement, q: Question): number | null {
  if (l.sorte === "revision" || l.sorte === "eclair") return null;
  const r = TYPES[q.type].reponse;
  const base = l.sorte === "survie" ? 10_000 : l.sorte === "tour" ? 15_000 : (l.niveau ?? 1) <= 5 ? 20_000 : (l.niveau ?? 1) <= 10 ? 15_000 : 12_000;
  return base + (r === "ecrit" ? 10_000 : r === "clic" || r === "placer" ? 6_000 : r === "coloriage" || r === "classer" || r === "puzzle" ? 15_000 : 0);
}

/** Le niveau de difficulté des questions des modes rapides : un peu au-delà de ce que l'on a déjà fait. */
function niveauRapide(niveauxFaits: number): number {
  return Math.min(NB_NIVEAUX, Math.max(3, Math.round(niveauxFaits / 5) + 3));
}

type Rate = { q: Question; reponse: string };

/** Ce que la voix lit : la consigne, ce que montre l'invite quand c'est un mot, puis les choix écrits. */
function texteParle(q: Question): string {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  const montre =
    def.invite === "nom" || def.invite === "coloriage" || def.invite === "puzzle" ? p.nom : def.invite === "capitale" ? (p.capitale ?? "") : def.invite === "monnaie" ? (p.monnaies[0]?.nom ?? "") : def.invite === "texte" ? (q.texte ?? "") : "";
  const textes = q.options.map((o) => o.texte ?? "").filter(Boolean);
  const choix = def.reponse !== "drapeau" && textes.length ? ` Choix : ${textes.join(", ")}.` : "";
  return `${consigne(q)}${montre ? ` ${montre}.` : ""}${choix}`;
}

export function Partie({ lancement, onFermer, onRejouer }: { lancement: Lancement; onFermer: () => void; onRejouer: (l: Lancement) => void }) {
  const monde = useMonde();
  const [graine] = useState(nouvelleGraine);
  const niveauxFaits = Object.keys(monde.niveaux).length;
  const coeursMax = lancement.sorte === "survie" ? 1 : lancement.sorte === "niveau" || lancement.sorte === "tour" ? COEURS : Infinity;

  /** Les questions prévues d'avance (niveau, tour, révision) ; les modes rapides en ajoutent au fil de l'eau. */
  const [questions, setQuestions] = useState<Question[]>(() => {
    const g = graine;
    if (lancement.sorte === "niveau" && lancement.categorie && lancement.niveau) {
      // Les pays du niveau, complétés par ceux des niveaux d'avant que la mémoire perd le plus.
      const revision = lancement.niveau > 1 ? aReviserAvant(monde, lancement.categorie, lancement.niveau, 8) : [];
      return partieDeNiveau({ categorie: lancement.categorie, niveau: lancement.niveau, graine: g, methode: lancement.methode, revision });
    }
    if (lancement.sorte === "revision") {
      const dues = revisionsDues(monde).slice(0, 20);
      return dues.map((d, i) => questionSur(deriver(g, i), d.famille, d.code, 6)).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "tour") {
      const n = niveauRapide(niveauxFaits);
      return Array.from({ length: 20 }, (_, i) => questionMelangee(deriver(g, i), n, false)).filter((q): q is Question => q !== null);
    }
    const n = niveauRapide(niveauxFaits);
    return Array.from({ length: 6 }, (_, i) => questionMelangee(deriver(g, i), n, true)).filter((q): q is Question => q !== null);
  });
  const sansFin = lancement.sorte === "eclair" || lancement.sorte === "survie";

  const [phase, setPhase] = useState<"intro" | "question" | "reponse" | "fin">("intro");
  const [index, setIndex] = useState(0);
  const [coeurs, setCoeurs] = useState(coeursMax);
  const [brise, setBrise] = useState<number | null>(null);
  const [bonnes, setBonnes] = useState(0);
  const [fautes, setFautes] = useState(0);
  const [xp, setXp] = useState(0);
  const [choix, setChoix] = useState<string | null>(null);
  const [rates, setRates] = useState<string[]>([]);
  const [jugement, setJugement] = useState<Jugement | null>(null);
  const [ecrit, setEcrit] = useState("");
  const [rateList, setRateList] = useState<Rate[]>([]);
  const [masques, setMasques] = useState<string[]>([]);
  const [seconde, setSeconde] = useState(false);
  const [sablier, setSablier] = useState(false);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [record, setRecord] = useState(false);
  const [finEclair, setFinEclair] = useState<number | null>(null);
  const [toucheGlobe, setToucheGlobe] = useState<string | null>(null);
  const globe = useRef<GlobeRef>(null);
  const zoneChoix = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  const q = questions[index] as Question | undefined;
  const def = q ? TYPES[q.type] : null;
  const duree = q ? dureeQuestion(lancement, q) : null;
  const avecChrono = Boolean(duree && monde.profil.chrono);
  const total = sansFin ? null : questions.length;

  /* ---------- La fin ---------- */
  const terminer = useCallback(
    (r: { bonnes: number; fautes: number; coeurs: number }) => {
      setPhase("fin");
      if (lancement.sorte === "niveau" && lancement.categorie && lancement.niveau) {
        const reussi = r.coeurs > 0;
        const b = finirNiveau(lancement.categorie, lancement.niveau, { bonnes: r.bonnes, fautes: r.fautes, reussi });
        setBilan(b);
        if (reussi && !mouvementReduit()) setTimeout(() => pluieDeLettres(document.querySelector(".pt-fin-titre"), b.etoiles === 3 ? "aurore" : "ambre", grade(lancement.niveau!).nom), 380);
      } else if (lancement.sorte === "eclair" || lancement.sorte === "survie") {
        setRecord(battreRecord(lancement.sorte, r.bonnes));
      }
    },
    [lancement],
  );

  /* ---------- Répondre ---------- */
  const suivant = useCallback(() => {
    setBrise(null);
    if (coeurs <= 0 || (!sansFin && index + 1 >= questions.length) || (lancement.sorte === "eclair" && finEclair !== null && Date.now() >= finEclair)) {
      terminer({ bonnes, fautes, coeurs });
      return;
    }
    // Les modes rapides : toujours quelques questions d'avance.
    if (sansFin && questions.length - (index + 1) <= 4) {
      const n = niveauRapide(niveauxFaits);
      setQuestions((qs) => {
        const ajout: Question[] = [];
        for (let i = qs.length; i < qs.length + 6; i++) {
          const x = questionMelangee(deriver(graine, i), n, true);
          if (x) ajout.push(x);
        }
        return [...qs, ...ajout];
      });
    }
    setIndex((i) => i + 1);
    setChoix(null);
    setRates([]);
    setJugement(null);
    setEcrit("");
    setMasques([]);
    setSeconde(false);
    setSablier(false);
    setToucheGlobe(null);
    setPhase("question");
  }, [bonnes, coeurs, fautes, finEclair, index, lancement.sorte, questions.length, sansFin, terminer, niveauxFaits, graine]);

  const repondre = useCallback(
    (reponse: string, ou?: { x: number; y: number }) => {
      if (!q || phase !== "question") return;
      const j = juger(q.type, q.cible, reponse);
      const juste = j !== "faux";
      // Seconde chance : une erreur ne coûte rien, on peut rejouer (une fois).
      if (!juste && seconde) {
        setSeconde(false);
        setRates((r) => [...r, reponse]);
        if (TYPES[q.type].reponse === "ecrit") setEcrit("");
        return;
      }
      setChoix(reponse);
      setJugement(j);
      setPhase("reponse");
      const base = baseDe(q.type, q.nb);
      const gain = gainDe(j, base);
      const famille = categorieDe(q.type);
      noterReponse(q.cible, famille, juste, gain);
      envoyerReponse({ type: q.type, cible: q.cible, reponse, nb: q.nb });
      if (juste) {
        setBonnes((b) => b + 1);
        setXp((x) => x + gain);
        if (ou && !mouvementReduit()) eclat(ou.x, ou.y, j === "juste" ? "ambre" : "azur", 1.1);
      } else {
        setFautes((f) => f + 1);
        setRateList((l) => [...l, { q, reponse }]);
        if (Number.isFinite(coeursMax)) {
          setBrise(coeurs - 1);
          setCoeurs((c) => c - 1);
        }
      }
    },
    [coeurs, coeursMax, phase, q, seconde],
  );

  // Après une bonne réponse, on passe tout seul ; après une erreur, on laisse le temps de lire.
  useEffect(() => {
    if (phase !== "reponse") return;
    const juste = jugement !== "faux";
    const attente = lancement.sorte === "eclair" ? (juste ? 450 : 1300) : juste ? (jugement === "presque" ? 1700 : 950) : coeurs <= 0 && Number.isFinite(coeursMax) ? 2200 : null;
    if (attente === null) return;
    const t = setTimeout(suivant, attente);
    return () => clearTimeout(t);
  }, [phase, jugement, suivant, lancement.sorte, coeurs, coeursMax]);

  // Le chrono de la question (le dessin est une animation CSS ; ici, seulement l'échéance).
  useEffect(() => {
    if (phase !== "question" || !avecChrono || !duree || sablier) return;
    const t = setTimeout(() => repondre("__temps__"), duree);
    return () => clearTimeout(t);
  }, [phase, avecChrono, duree, sablier, index, repondre]);

  // Le chrono de l'éclair : 60 secondes en tout.
  useEffect(() => {
    if (lancement.sorte !== "eclair" || finEclair === null || phase === "fin") return;
    const t = setTimeout(() => terminer({ bonnes, fautes, coeurs }), Math.max(0, finEclair - Date.now()));
    return () => clearTimeout(t);
  }, [finEclair, lancement.sorte, phase, terminer, bonnes, fautes, coeurs]);

  // Le champ de réponse écrite prend le focus.
  useEffect(() => {
    if (phase === "question" && def?.reponse === "ecrit") champ.current?.focus();
  }, [phase, def, index]);

  // La lecture à voix haute : la consigne, ce qui est montré (s'il se dit), puis les choix.
  useEffect(() => {
    if (phase === "question" && q && monde.profil.voix) void dire(texteParle(q));
  }, [phase, q, monde.profil.voix]);
  useEffect(() => () => taire(), []);

  // Le clavier : 1 à 6 pour choisir, Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onFermer();
      if (phase === "reponse" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        return suivant();
      }
      if (phase !== "question" || !q || !q.options.length || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        const o = q.options[n - 1];
        if (!masques.includes(o.id) && !rates.includes(o.id)) {
          const bouton = zoneChoix.current?.querySelectorAll("button")[n - 1]?.getBoundingClientRect();
          repondre(o.id, bouton ? { x: bouton.left + bouton.width / 2, y: bouton.top + bouton.height / 2 } : undefined);
        }
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [phase, q, masques, rates, repondre, suivant, onFermer]);

  // Pas de défilement de la page derrière la partie.
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  /* ---------- Les jokers ---------- */
  const solde = ducats(monde);
  const jokers: Joker[] = lancement.sorte === "niveau" || lancement.sorte === "tour" || lancement.sorte === "survie" ? ["seconde", "moitie", "sablier", "coeur"] : [];
  const jokerPossible = (j: Joker) => {
    if (!q || phase !== "question" || solde < JOKERS[j].prix) return false;
    if (j === "seconde") return !seconde;
    if (j === "moitie") return q.options.length > 2 && masques.length === 0;
    if (j === "sablier") return avecChrono && !sablier;
    return coeurs < 5 && Number.isFinite(coeursMax);
  };
  const jouerJoker = (j: Joker) => {
    if (!jokerPossible(j) || !q || !depenser(JOKERS[j].prix)) return;
    if (j === "seconde") setSeconde(true);
    if (j === "sablier") setSablier(true);
    if (j === "coeur") setCoeurs((c) => c + 1);
    if (j === "moitie") {
      const faux = q.options.filter((o) => juger(q.type, q.cible, o.id) === "faux" && !rates.includes(o.id));
      const n = Math.floor(q.options.length / 2);
      const h = deriver(graine, index + 1000);
      setMasques(faux.sort((a, b) => ((deriver(h, a.id.charCodeAt(0)) % 97) - (deriver(h, b.id.charCodeAt(0)) % 97))).slice(0, n).map((o) => o.id));
    }
  };

  /* ---------- Démarrer ---------- */
  const commencer = () => {
    if (!questions.length) return;
    if (lancement.sorte === "eclair") setFinEclair(Date.now() + DUREE_ECLAIR);
    setPhase("question");
  };

  const contenu = (
    <div className="pt pt-partie" data-accent="safran" data-phase={phase} role="dialog" aria-modal="true" aria-label={lancement.titre}>
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-partie-tete">
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Quitter la partie">
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pt-partie-route" aria-label={total ? `Question ${Math.min(index + 1, total)} sur ${total}` : `${bonnes} bonnes réponses`}>
          {total ? (
            <>
              <span className="pt-route-trait" aria-hidden="true">
                <span className="pt-route-fait" style={{ transform: `scaleX(${(index + (phase === "reponse" || phase === "fin" ? 1 : 0)) / total})` }} />
              </span>
              <span className="pt-route-compte tabular-nums">
                {Math.min(index + 1, total)}/{total}
              </span>
            </>
          ) : (
            <span className="pt-route-compte tabular-nums">
              {bonnes} bonne{bonnes > 1 ? "s" : ""}
              {lancement.sorte === "eclair" && finEclair !== null && phase !== "fin" && <ChronoGlobal fin={finEclair} />}
            </span>
          )}
        </div>
        <BoutonVoix />
        <Coeurs restants={coeurs} total={coeursMax} brise={brise} />
        {avecChrono && phase === "question" && q && <Chrono key={index} duree={duree!} cle={`${index}`} pause={sablier} />}
      </header>

      {phase === "intro" && <Intro lancement={lancement} nombre={questions.length} coeurs={coeursMax} chrono={monde.profil.chrono} onCommencer={commencer} onFermer={onFermer} />}

      {(phase === "question" || phase === "reponse") && q && def && (
        <div className="pt-question" key={index}>
          <p className="pt-consigne">
            {lancement.sorte !== "niveau" && <span className="pt-consigne-cat">{CATEGORIES[categorieDe(q.type)].nom}</span>}
            {consigne(q)}
          </p>
          <div className="pt-invite" data-sorte={def.invite}>
            <Invite q={q} globe={globe} phase={phase} toucheGlobe={toucheGlobe} choix={choix} onRepondre={(r) => repondre(r)} onToucher={(code) => {
              if (phase !== "question" || !code) return;
              setToucheGlobe(code);
              repondre(code);
            }} />
          </div>

          {def.reponse === "ecrit" ? (
            <form
              className="pt-ecrit"
              onSubmit={(e) => {
                e.preventDefault();
                if (ecrit.trim()) repondre(ecrit.trim());
              }}
            >
              <input
                ref={champ}
                value={ecrit}
                onChange={(e) => setEcrit(e.target.value)}
                disabled={phase !== "question"}
                placeholder={def.ecrit === "capitale" ? "La capitale…" : "Le nom du pays…"}
                aria-label={def.ecrit === "capitale" ? "Écris la capitale" : "Écris le nom du pays"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                data-etat={phase === "reponse" ? (jugement ?? undefined) : rates.length ? "rate" : undefined}
              />
              <button type="submit" className="bouton bouton-principal" disabled={phase !== "question" || !ecrit.trim()}>
                Valider
              </button>
            </form>
          ) : def.reponse === "clic" ? (
            <p className="pt-astuce">Fais tourner le globe et touche le pays. Pince ou utilise la molette pour zoomer.</p>
          ) : def.reponse === "placer" ? (
            <p className="pt-astuce">Fais tourner le globe, zoome, puis touche l&apos;endroit où tu places la capitale. À moins de 300 km, c&apos;est gagné.</p>
          ) : def.reponse === "coloriage" ? (
            <Coloriage key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : def.reponse === "classer" ? (
            <Classement key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : def.reponse === "puzzle" ? (
            <Puzzle key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : (
            <div ref={zoneChoix} className="pt-choix" data-sorte={def.reponse} data-nb={q.options.length}>
              {q.options.map((o, i) => {
                const masque = masques.includes(o.id);
                const deja = rates.includes(o.id);
                const etat = phase === "reponse" ? (o.id === choix ? (jugement === "faux" ? "faux" : "juste") : juger(q.type, q.cible, o.id) !== "faux" ? "attendu" : undefined) : deja ? "faux" : undefined;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="pt-option"
                    data-etat={etat}
                    data-masque={masque || undefined}
                    disabled={phase !== "question" || masque || deja}
                    style={{ "--i": i } as React.CSSProperties}
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      repondre(o.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
                    }}
                  >
                    <span className="pt-option-touche" aria-hidden="true">
                      {i + 1}
                    </span>
                    <ContenuOption q={q} o={o} />
                    {etat === "juste" || etat === "attendu" ? <Check className="pt-option-signe" aria-hidden="true" /> : etat === "faux" ? <X className="pt-option-signe" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          )}

          {phase === "question" && jokers.length > 0 && (
            <div className="pt-jokers" role="group" aria-label="Jokers">
              {jokers.map((j) => (
                <button key={j} type="button" className="pt-joker" data-joker={j} data-actif={(j === "seconde" && seconde) || (j === "sablier" && sablier) || undefined} disabled={!jokerPossible(j)} onClick={() => jouerJoker(j)} title={JOKERS[j].texte}>
                  <IconeJoker j={j} />
                  <span className="pt-joker-nom">{JOKERS[j].nom}</span>
                  <span className="pt-joker-prix tabular-nums">{JOKERS[j].prix}</span>
                </button>
              ))}
              <Ducats n={solde} className="pt-jokers-solde" />
            </div>
          )}

          {phase === "reponse" && <Retour q={q} jugement={jugement} choix={choix} sansCoeur={coeurs <= 0 && Number.isFinite(coeursMax)} gain={jugement && jugement !== "faux" ? gainDe(jugement, baseDe(q.type, q.nb)) : 0} onSuivant={suivant} auto={jugement !== "faux" || lancement.sorte === "eclair"} />}
        </div>
      )}

      {phase === "fin" && (
        <Fin
          lancement={lancement}
          bonnes={bonnes}
          total={sansFin ? null : questions.length}
          fautes={fautes}
          coeurs={coeurs}
          xp={xp}
          bilan={bilan}
          record={record}
          rates={rateList}
          croises={questions.slice(0, index + 1).map((x) => x.cible)}
          onFermer={onFermer}
          onRejouer={onRejouer}
        />
      )}
    </div>
  );
  return createPortal(contenu, document.body);
}

/* ---------- L'éclair : le temps qui reste ---------- */
function ChronoGlobal({ fin }: { fin: number }) {
  const [reste, setReste] = useState(() => Math.max(0, fin - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setReste(Math.max(0, fin - Date.now())), 250);
    return () => clearInterval(t);
  }, [fin]);
  return <span className="pt-eclair-reste" data-presse={reste < 10_000 || undefined}> · {Math.ceil(reste / 1000)} s</span>;
}

/* ---------- Ce qu'on montre ---------- */
export function Invite({
  q,
  globe,
  phase,
  toucheGlobe,
  onToucher,
  choix = null,
  onRepondre = () => undefined,
}: {
  q: Question;
  globe: React.RefObject<GlobeRef | null>;
  phase: string;
  toucheGlobe: string | null;
  onToucher: (code: string | null) => void;
  choix?: string | null;
  onRepondre?: (reponse: string) => void;
}) {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  if (gereInvite(q)) return <InviteAutre q={q} globe={globe} phase={phase} choix={choix} onRepondre={onRepondre} />;
  if (def.reponse === "clic") {
    const teintes: Record<string, "juste" | "faux"> = {};
    if (phase === "reponse") {
      teintes[q.cible] = "juste";
      if (toucheGlobe && toucheGlobe !== q.cible) teintes[toucheGlobe] = "faux";
    }
    return (
      <div className="pt-invite-globe" data-large="">
        {def.invite === "drapeau" ? (
          <Drapeau code={q.cible} nomme={false} className="pt-invite-globe-drapeau" />
        ) : (
          <p className="pt-nom-grand" lang="fr">
            {def.invite === "capitale" ? p.capitale : p.nom}
          </p>
        )}
        <Globe ref={globe} interactif onToucher={onToucher} teintes={teintes} reperes="tous" cible={phase === "reponse" ? q.cible : null} libelle="Globe : touche le pays demandé" vueInitiale={{ lon: 15, lat: 25, zoom: 1 }} />
      </div>
    );
  }
  switch (def.invite) {
    case "drapeau":
      return <Drapeau code={q.cible} nomme={false} grand />;
    case "nom":
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{p.statut === "territoire" ? "Territoire" : "Pays"}</span>
          <span className="pt-nom-grand">{p.nom}</span>
        </div>
      );
    case "capitale":
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{motCapitale(p)}</span>
          <span className="pt-nom-grand">{p.capitale}</span>
        </div>
      );
    case "monnaie": {
      const m = p.monnaies[0];
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">Monnaie</span>
          <span className="pt-nom-grand">{m.nom}</span>
          {m.symbole && <span className="pt-invite-symbole">{m.symbole}</span>}
        </div>
      );
    }
    case "continent":
      return (
        <div className="pt-invite-continent">
          <MiniContinent continent={q.continent ?? p.continent} className="pt-mini-grand" />
          <span className="pt-nom-grand">{NOM_CONTINENT[q.continent ?? p.continent]}</span>
        </div>
      );
    case "silhouette":
      return <Silhouette code={q.cible} />;
    case "silhouette-tournee":
      return <Silhouette code={q.cible} rotation={q.rotation} miroir={q.miroir} />;
    case "carte":
      return <InviteCarte q={q} globe={globe} />;
  }
}

function InviteCarte({ q, globe }: { q: Question; globe: React.RefObject<GlobeRef | null> }) {
  const p = pays(q.cible);
  return (
    <div className="pt-invite-globe">
      <Globe ref={globe} cible={q.cible} libelle="Globe : un pays est allumé" interactif reperes="cible" />
      <div className="pt-globe-outils">
        <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1.6)} aria-label="Voir de plus près">
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(0.5)} aria-label="Voir de plus loin">
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="pt-icone" onClick={() => globe.current?.viser(q.cible)} aria-label="Revenir sur le pays">
          <LocateFixed className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="pt-indices" aria-label="Indices">
        <span>{formatPopulation(p.population)}</span>
        <span>{formatSuperficie(p.superficie)}</span>
      </div>
    </div>
  );
}

export function ContenuOption({ q, o }: { q: Question; o: Question["options"][number] }) {
  const r = TYPES[q.type].reponse;
  const autre = ContenuOptionAutre({ q, o });
  if (autre) return autre;
  if (r === "drapeau" && o.code) return <Drapeau code={o.code} nomme={false} />;
  if (r === "continent" && o.continent)
    return (
      <span className="pt-option-continent">
        <MiniContinent continent={o.continent} />
        <span>{o.texte}</span>
      </span>
    );
  return <span className="pt-option-texte">{o.texte}</span>;
}

function IconeJoker({ j }: { j: Joker }) {
  if (j === "seconde") return <Undo2 className="size-4" aria-hidden="true" />;
  if (j === "moitie") return <Shuffle className="size-4" aria-hidden="true" />;
  if (j === "sablier") return <Hourglass className="size-4" aria-hidden="true" />;
  return <Plus className="size-4" aria-hidden="true" />;
}

/* ---------- Après la réponse : ce qu'il fallait trouver, pour apprendre ---------- */
function Retour({ q, jugement, choix, sansCoeur, gain, onSuivant, auto }: { q: Question; jugement: Jugement | null; choix: string | null; sansCoeur: boolean; gain: number; onSuivant: () => void; auto: boolean }) {
  const p = pays(q.cible);
  const def = TYPES[q.type];
  const temps = choix === "__temps__";
  const bonneReponse =
    bonneReponseAutre(q, choix) ??
    (def.reponse === "capitale" || (def.reponse === "ecrit" && def.ecrit === "capitale")
      ? `${p.capitale} (${p.nom})`
      : def.reponse === "continent"
        ? `${NOM_CONTINENT[p.continent]} (${p.nom})`
        : def.reponse === "monnaie"
          ? `${p.monnaies[0].nom} (${p.nom})`
          : q.type === "continent-pays"
            ? `${p.nom}, en ${NOM_CONTINENT[p.continent]}`
            : p.nom);
  return (
    <div className="pt-retour" data-jugement={jugement ?? "faux"} role="status">
      <div className="pt-retour-texte">
        {jugement === "juste" ? (
          <strong>
            Exact !{q.type === "capitale-placer" ? ` ${bonneReponseAutre(q, choix)}.` : ""}
            {gain ? ` +${gain} XP` : ""}
          </strong>
        ) : jugement === "presque" ? (
          <strong>{presqueAutre(q, choix) ? `Presque ! ${presqueAutre(q, choix)}` : <>Presque ! On écrit « {def.ecrit === "capitale" ? p.capitale : p.nom} »</>}</strong>
        ) : (
          <strong>{temps ? "Temps écoulé." : "Ce n'est pas ça."} C&apos;était : {bonneReponse}</strong>
        )}
        {jugement === "faux" && (
          <span className="pt-retour-fiche">{p.capitale ? `${motCapitale(p)} : ${p.capitale}, en ${NOM_CONTINENT[p.continent]}.` : `En ${NOM_CONTINENT[p.continent]}.`}</span>
        )}
      </div>
      {!auto && (
        <button type="button" className="bouton bouton-principal" onClick={onSuivant} autoFocus>
          {sansCoeur ? "Voir le bilan" : "Continuer"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- L'introduction ---------- */
function Intro({ lancement, nombre, coeurs, chrono, onCommencer, onFermer }: { lancement: Lancement; nombre: number; coeurs: number; chrono: boolean; onCommencer: () => void; onFermer: () => void }) {
  const g = lancement.niveau ? grade(lancement.niveau) : null;
  const regles =
    lancement.sorte === "eclair"
      ? "60 secondes : le plus de bonnes réponses possible."
      : lancement.sorte === "survie"
        ? "Une seule vie : jusqu'à la première erreur."
        : lancement.sorte === "revision"
          ? `${nombre} pays à revoir, sans chrono ni cœurs.`
          : `${nombre} questions, ${coeurs} cœurs${chrono ? " et un chrono pour chaque question" : ""}.`;
  return (
    <div className="pt-intro">
      {g && (
        <p className="pt-intro-grade">
          Niveau {lancement.niveau} : {g.nom}
        </p>
      )}
      <h2 className="pt-intro-titre">{lancement.titre}</h2>
      <p className="pt-intro-regles">{regles}</p>
      {nombre === 0 ? (
        <>
          <p className="pt-intro-regles">Rien à revoir pour l&apos;instant : ta mémoire tient bon. Reviens demain.</p>
          <button type="button" className="bouton bouton-discret" onClick={onFermer}>
            Retour
          </button>
        </>
      ) : (
        <button type="button" className="bouton bouton-principal pt-intro-go" onClick={onCommencer} autoFocus>
          C&apos;est parti
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- Le bilan ---------- */
function Fin({
  lancement,
  bonnes,
  total,
  fautes,
  coeurs,
  xp,
  bilan,
  record,
  rates,
  croises,
  onFermer,
  onRejouer,
}: {
  lancement: Lancement;
  bonnes: number;
  total: number | null;
  fautes: number;
  coeurs: number;
  xp: number;
  bilan: Bilan | null;
  record: boolean;
  rates: Rate[];
  /** Les pays croisés pendant la partie (pour le « Le savais-tu ? »). */
  croises: string[];
  onFermer: () => void;
  onRejouer: (l: Lancement) => void;
}) {
  const recits = useRecits();
  const [tirage] = useState(() => Math.random());
  const niveau = lancement.sorte === "niveau";
  const reussi = niveau ? coeurs > 0 : true;
  const g = lancement.niveau ? grade(lancement.niveau) : null;
  const titre = niveau
    ? reussi
      ? bilan?.premiereFois && g
        ? `Te voilà ${g.nom} !`
        : bilan?.etoiles === 3
          ? "Sans une faute !"
          : "Niveau réussi"
      : "Naufrage…"
    : lancement.sorte === "eclair"
      ? record
        ? "Nouveau record !"
        : "Temps écoulé"
      : lancement.sorte === "survie"
        ? record
          ? "Nouveau record !"
          : "Fin de la traversée"
        : "Terminé";
  const sousTitre = niveau ? (reussi ? (bilan?.premiereFois && g ? g.devise : `${bonnes} bonnes réponses sur ${total}`) : "Les cœurs sont épuisés. Les pays manqués t'attendent ci-dessous : revois-les, puis reprends la mer.") : `${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""}${total ? ` sur ${total}` : ""}`;
  const suivantPossible = niveau && reussi && (lancement.niveau ?? 15) < NB_NIVEAUX;
  const uniques = [...new Map(rates.map((r) => [r.q.cible, r])).values()];
  // Une anecdote sur un pays de la partie : de préférence un pays manqué, pour qu'il reste en mémoire.
  const candidats = [...new Set([...uniques.map((u) => u.q.cible), ...croises])].filter((c) => recits?.[c]?.anecdote);
  const savais = candidats.length ? candidats[uniques.length && recits?.[uniques[0].q.cible]?.anecdote ? 0 : Math.floor(tirage * candidats.length)] : null;
  return (
    <div className="pt-fin" data-reussi={reussi || undefined}>
      {niveau && <Etoiles n={bilan?.etoiles ?? 0} taille="grande" animees />}
      <h2 className="pt-fin-titre">{titre}</h2>
      <p className="pt-fin-sous">{sousTitre}</p>
      <dl className="pt-fin-chiffres">
        <div>
          <dt>Bonnes réponses</dt>
          <dd className="tabular-nums">{bonnes}</dd>
        </div>
        <div>
          <dt>Erreurs</dt>
          <dd className="tabular-nums">{fautes}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd className="tabular-nums">+{xp}</dd>
        </div>
        {bilan && bilan.ducats > 0 && (
          <div>
            <dt>Ducats</dt>
            <dd className="tabular-nums">+{bilan.ducats}</dd>
          </div>
        )}
        {bilan && bilan.jours > 1 && (
          <div>
            <dt>Jours d&apos;affilée</dt>
            <dd className="tabular-nums">{bilan.jours}</dd>
          </div>
        )}
      </dl>
      {savais && (
        <aside className="pt-fiche-savais pt-fin-savais" aria-label="Le savais-tu ?">
          <p className="pt-fiche-savais-titre">
            Le savais-tu ? <span>{pays(savais).nom}</span>
          </p>
          <p>{recits?.[savais]?.anecdote}</p>
        </aside>
      )}
      <div className="pt-fin-actions">
        {suivantPossible && (
          <button type="button" className="bouton bouton-principal" onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}`, niveau: lancement.niveau! + 1, titre: `${CATEGORIES[lancement.categorie!].nom} · niveau ${lancement.niveau! + 1}` })}>
            Niveau suivant
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" className={`bouton ${suivantPossible ? "bouton-discret" : "bouton-principal"}`} onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}` })}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Rejouer
        </button>
        <button type="button" className="bouton bouton-discret" onClick={onFermer}>
          Fermer
        </button>
      </div>
      {uniques.length > 0 && (
        <section className="pt-fin-rates" aria-label="À revoir">
          <h3>À revoir</h3>
          <ul>
            {uniques.map(({ q }) => {
              const p = pays(q.cible);
              return (
                <li key={q.cible}>
                  <Drapeau code={p.code} />
                  <span>
                    <strong>{p.nom}</strong>
                    <span>
                      {p.capitale ? `${motCapitale(p)} : ${p.capitale}` : NOM_CONTINENT[p.continent]}
                      {categorieDe(q.type) === "monnaies" ? `, monnaie : ${p.monnaies[0]?.nom}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function useLancer() {
  return useMemo(
    () => ({
      niveau: (categorie: CategorieId, niveau: number, methode: TypeQuestion | null = null): Lancement => ({ cle: `${Date.now()}`, sorte: "niveau", categorie, niveau, methode, titre: `${CATEGORIES[categorie].nom} · niveau ${niveau}` }),
      rapide: (sorte: "tour" | "eclair" | "survie" | "revision"): Lancement => ({
        cle: `${Date.now()}`,
        sorte,
        titre: sorte === "tour" ? "Le tour du monde" : sorte === "eclair" ? "L'éclair" : sorte === "survie" ? "Sans faute" : "Révisions du jour",
      }),
    }),
    [],
  );
}
