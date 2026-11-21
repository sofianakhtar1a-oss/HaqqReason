"use client";

import { Check, CircleCheck, CircleX, Eraser, Eye, Lightbulb, ListChecks, RotateCcw, Sparkles, Star, ThumbsUp, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Choix, type Corriger, type Ecrire, type Exercice, type Ordre, type Toucher, typeExercice } from "@/lib/regles/types";
import { bonneReponse, differences, motsAToucher, normaliser, ordreJuste, phraseOrdre, verdictEcrit } from "@/lib/regles/verifier";

/*
 * Les exercices de l'entraînement, du carnet d'erreurs et des examens : les cinq types (choix, écrire,
 * toucher, remettre dans l'ordre, corriger la phrase), une série, et son bilan avec la correction complète.
 * Deux façons de jouer : guidée (une erreur allume un indice, la deuxième montre la correction) ou
 * examen (une seule réponse, la correction arrive à la fin).
 */

export type Item = { ref: string; exercice: Exercice; origine?: string };
export type Reponse = { ref: string; juste: boolean; essais: number; donnee?: string; auto?: boolean };
export type Mode = "guide" | "examen";

const BRAVO = ["Bravo !", "Exactement !", "Tu as l'œil !", "Dans le mille !", "Parfait !", "Impeccable !", "Quel flair !", "Juste !"];
const PISTE = ["Bonne piste : ton erreur nous donne un indice.", "Presque ! Ton erreur montre où regarder.", "Chaque essai te rapproche. Voici l'indice :"];
const au = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export function melanger<T>(l: T[]) {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Les points d'un exercice : du premier coup, avec l'indice, ou appris grâce à la correction. */
export const pointsDe = (r: Reponse, mode: Mode) => (!r.juste ? (mode === "guide" ? 1 : 0) : r.essais <= 1 ? 10 : 5);

export const NOMS_TYPES: Record<ReturnType<typeof typeExercice>, string> = {
  choix: "Choisis",
  ecrire: "Écris",
  toucher: "Touche",
  ordre: "Remets dans l'ordre",
  corriger: "Corrige",
};

/** L'énoncé, avec le trou « ___ » dessiné comme une case à remplir. */
export function Enonce({ texte }: { texte: string }) {
  const parts = texte.split("___");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="rg-trou" aria-label="mot à trouver" />}
        </span>
      ))}
    </>
  );
}

type Statut = "attente" | "piste" | "reussi" | "revele" | "note";

type PropsExercice = {
  item: Item;
  mode: Mode;
  derniere: boolean;
  libelleFin?: string;
  onSuite: (r: Reponse) => void;
};

/** Un exercice, quel que soit son type. */
export function ExerciceVue({ item, mode, derniere, libelleFin, onSuite }: PropsExercice) {
  const x = item.exercice;
  const type = typeExercice(x);
  const [statut, setStatut] = useState<Statut>("attente");
  const [essais, setEssais] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [donnee, setDonnee] = useState<string | undefined>(undefined);
  const [auto, setAuto] = useState(false);
  const [bravo] = useState(() => au(BRAVO));
  const [piste] = useState(() => au(PISTE));
  const suite = useRef<HTMLButtonElement>(null);
  const fini = statut === "reussi" || statut === "revele" || statut === "note";
  const [juste, setJuste] = useState(false);

  useEffect(() => {
    if (fini) suite.current?.focus({ preventScroll: true });
  }, [fini]);

  const reussir = (valeur?: string) => {
    const n = essais + 1;
    setEssais(n);
    setDonnee(valeur);
    setJuste(true);
    setStatut(mode === "examen" ? "note" : "reussi");
    setMessage(null);
  };
  /** Une réponse fausse ; « compte » faux : une simple remarque (une lettre à corriger, rien de changé). */
  const rater = (indice: string, valeur?: string, compte = true) => {
    if (!compte) {
      setStatut("piste");
      setMessage(indice);
      return;
    }
    const n = essais + 1;
    setEssais(n);
    setDonnee(valeur);
    if (mode === "examen") {
      setJuste(false);
      setStatut("note");
    } else if (n >= 2) {
      setJuste(false);
      setStatut("revele");
      setMessage(null);
    } else {
      setStatut("piste");
      setMessage(indice);
    }
  };

  const ecrite = type === "ecrire" || type === "corriger";
  return (
    <div className="rg-question" data-statut={statut} data-type={type}>
      <p className="rg-question-type">{NOMS_TYPES[type]}{item.origine ? <span> · {item.origine}</span> : null}</p>
      <p className="rg-question-enonce" lang="fr">
        <Enonce texte={x.q} />
      </p>
      {type === "choix" && <VueChoix x={x as Choix} fini={fini} mode={mode} onReussi={() => reussir()} onRate={(o) => rater((x as Choix).io?.[o] ?? x.i, o)} />}
      {type === "ecrire" && <VueEcrire x={x as Ecrire} fini={fini} revele={statut === "revele"} onReussi={reussir} onRate={rater} />}
      {type === "toucher" && <VueToucher x={x as Toucher} fini={fini} onReussi={() => reussir()} onRate={(v) => rater(x.i, v)} />}
      {type === "ordre" && <VueOrdre x={x as Ordre} fini={fini} revele={statut === "revele"} onReussi={reussir} onRate={(v) => rater(x.i, v)} />}
      {type === "corriger" && <VueCorriger x={x as Corriger} fini={fini} revele={statut === "revele"} onReussi={reussir} onRate={rater} />}

      <div className="rg-retour-question" aria-live="polite">
        {statut === "piste" && message && (
          <p className="rg-indice">
            <Lightbulb className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <strong>{piste}</strong> {message}
            </span>
          </p>
        )}
        {statut === "reussi" && (
          <p className="rg-bravo">
            <Check className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <strong>{auto ? "C'est noté, ta réponse compte." : bravo}</strong> {x.e}
            </span>
          </p>
        )}
        {statut === "revele" && (
          <div className="rg-revele">
            <Eye className="size-5 shrink-0" aria-hidden="true" />
            <div>
              <p>
                <strong>La bonne réponse :</strong>{" "}
                <span lang="en" className="rg-reponse-juste">
                  {bonneReponse(x)}
                </span>
              </p>
              <p className="mt-1">{x.e}</p>
              {ecrite && donnee && (
                <button
                  type="button"
                  className="rg-lien-auto"
                  onClick={() => {
                    setAuto(true);
                    setJuste(true);
                    setStatut("reussi");
                  }}
                >
                  <ThumbsUp className="size-3.5" aria-hidden="true" />
                  Ma réponse était juste aussi
                </button>
              )}
            </div>
          </div>
        )}
        {statut === "note" && <p className="rg-note">Réponse enregistrée. La correction t&apos;attend à la fin.</p>}
      </div>
      {fini && (
        <div className="rg-actions">
          <button ref={suite} type="button" className="bouton bouton-principal" onClick={() => onSuite({ ref: item.ref, juste, essais: Math.max(1, essais), donnee, auto: auto || undefined })}>
            {derniere ? (libelleFin ?? "Voir mon bilan") : "Question suivante"}
          </button>
        </div>
      )}
    </div>
  );
}

function VueChoix({ x, fini, mode, onReussi, onRate }: { x: Choix; fini: boolean; mode: Mode; onReussi: () => void; onRate: (o: string) => void }) {
  const [options] = useState(() => melanger(x.o));
  const [pistes, setPistes] = useState<string[]>([]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const bonne = x.o[0];
  return (
    <div className="rg-options" role="group" aria-label="Choisis la bonne réponse">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="rg-option"
          lang="en"
          data-etat={fini && mode === "guide" && o === bonne ? "bonne" : fini && mode === "examen" && o === choisi ? "choisi" : pistes.includes(o) ? "piste" : undefined}
          disabled={fini || pistes.includes(o)}
          onClick={() => {
            setChoisi(o);
            if (o === bonne) onReussi();
            else {
              setPistes((p) => [...p, o]);
              onRate(o);
            }
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function VueEcrire({ x, fini, revele, onReussi, onRate }: { x: Ecrire; fini: boolean; revele: boolean; onReussi: (v: string) => void; onRate: (indice: string, v?: string, compte?: boolean) => void }) {
  const [valeur, setValeur] = useState("");
  const [presque, setPresque] = useState(false);
  const verifier = () => {
    const verdict = verdictEcrit(valeur, x.r);
    if (verdict === "juste") return onReussi(valeur);
    if (verdict === "presque" && !presque) {
      setPresque(true);
      return onRate("Tu y es presque : une seule lettre est à corriger. Regarde bien l'orthographe (une lettre doublée, un e, un y ?).", valeur, false);
    }
    onRate(x.i, valeur);
  };
  return (
    <form
      className="rg-ecrire"
      onSubmit={(e) => {
        e.preventDefault();
        if (normaliser(valeur)) verifier();
      }}
    >
      <input
        type="text"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        disabled={fini}
        lang="en"
        aria-label="Ta réponse"
        placeholder="Écris ta réponse"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        data-etat={fini && !revele ? "bonne" : revele ? "revele" : undefined}
      />
      {!fini && (
        <button type="submit" className="bouton bouton-principal" disabled={!valeur.trim()}>
          Vérifier
        </button>
      )}
    </form>
  );
}

function VueToucher({ x, fini, onReussi, onRate }: { x: Toucher; fini: boolean; onReussi: () => void; onRate: (v: string) => void }) {
  const mots = useMemo(() => motsAToucher(x.p), [x]);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [pistes, setPistes] = useState<number[]>([]);
  const cibles = mots.flatMap((m, i) => (m.cible ? [i] : []));
  const verifier = () => {
    const juste = choisis.length === cibles.length && cibles.every((i) => choisis.includes(i));
    if (juste) return onReussi();
    setPistes(choisis.filter((i) => !cibles.includes(i)));
    setChoisis(choisis.filter((i) => cibles.includes(i)));
    onRate(choisis.map((i) => mots[i].texte).join(", "));
  };
  return (
    <div className="rg-toucher">
      <p className="rg-toucher-phrase" lang="en">
        {mots.map((m, i) => (
          <span key={i}>
            <button
              type="button"
              className="rg-toucher-mot"
              aria-pressed={choisis.includes(i)}
              data-etat={fini && m.cible ? "bonne" : pistes.includes(i) ? "piste" : undefined}
              disabled={fini}
              onClick={() => setChoisis((c) => (c.includes(i) ? c.filter((y) => y !== i) : [...c, i]))}
            >
              {m.texte}
            </button>{" "}
          </span>
        ))}
      </p>
      {!fini && (
        <div className="rg-actions">
          <button type="button" className="bouton bouton-principal" disabled={!choisis.length} onClick={verifier}>
            Vérifier
          </button>
          <span className="rg-compte">{cibles.length > 1 ? `${cibles.length} mots à trouver` : "1 mot à trouver"}</span>
        </div>
      )}
    </div>
  );
}

/** Les morceaux mélangés, jamais dans le bon ordre dès le départ. */
function melangerMorceaux(m: string[]) {
  if (m.length < 2) return m.map((t, i) => ({ t, i }));
  for (let essai = 0; essai < 8; essai++) {
    const l = melanger(m.map((t, i) => ({ t, i })));
    if (l.some((x, k) => x.t !== m[k])) return l;
  }
  return m.map((t, i) => ({ t, i })).reverse();
}

function VueOrdre({ x, fini, revele, onReussi, onRate }: { x: Ordre; fini: boolean; revele: boolean; onReussi: (v: string) => void; onRate: (v: string) => void }) {
  const [banque] = useState(() => melangerMorceaux(x.m));
  const [choisis, setChoisis] = useState<number[]>([]);
  const [faux, setFaux] = useState(false);
  const morceaux = choisis.map((k) => banque[k].t);
  const complet = choisis.length === banque.length;
  const verifier = () => {
    const phrase = phraseOrdre(morceaux, x.fin);
    if (ordreJuste(morceaux, x.m, x.alt)) return onReussi(phrase);
    setFaux(true);
    onRate(phrase);
  };
  const affichee = revele ? x.m : morceaux;
  return (
    <div className="rg-ordre">
      <p className="rg-ordre-ligne" lang="en" data-etat={fini && !revele ? "bonne" : revele ? "revele" : faux ? "piste" : undefined} aria-label="Ta phrase">
        {affichee.length === 0 && <span className="rg-ordre-vide">Touche les morceaux dans l&apos;ordre…</span>}
        {affichee.map((t, k) => {
          const texte = k === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t;
          return revele || fini ? (
            <span key={k} className="rg-morceau" data-pose>
              {texte}
            </span>
          ) : (
            <button
              key={k}
              type="button"
              className="rg-morceau"
              data-pose
              aria-label={`Retirer « ${t} »`}
              onClick={() => {
                setFaux(false);
                setChoisis((c) => c.filter((_, j) => j !== k));
              }}
            >
              {texte}
            </button>
          );
        })}
        {affichee.length > 0 && x.fin && <span className="rg-ordre-fin">{x.fin}</span>}
      </p>
      {!fini && (
        <>
          <div className="rg-ordre-banque" role="group" aria-label="Les morceaux à placer" lang="en">
            {banque.map((b, k) =>
              choisis.includes(k) ? (
                <span key={k} className="rg-morceau" data-vide aria-hidden="true">
                  {b.t}
                </span>
              ) : (
                <button key={k} type="button" className="rg-morceau" onClick={() => setChoisis((c) => [...c, k])}>
                  {b.t}
                </button>
              ),
            )}
          </div>
          <div className="rg-actions">
            <button type="button" className="bouton bouton-principal" disabled={!complet} onClick={verifier}>
              Vérifier
            </button>
            <button type="button" className="bouton" disabled={!choisis.length} onClick={() => (setChoisis([]), setFaux(false))}>
              <Eraser className="size-4" aria-hidden="true" />
              Tout reprendre
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** La phrase corrigée, avec ce qui a changé par rapport à la phrase fautive. */
export function PhraseCorrigee({ fautive, juste }: { fautive: string; juste: string }) {
  const d = differences(fautive, juste).filter((m) => m.etat !== "trop");
  return (
    <span lang="en">
      {d.map((m, k) => (
        <span key={k}>
          {k > 0 && " "}
          {m.etat === "manque" ? <mark className="rg-change">{m.mot}</mark> : m.mot}
        </span>
      ))}
    </span>
  );
}

function VueCorriger({ x, fini, revele, onReussi, onRate }: { x: Corriger; fini: boolean; revele: boolean; onReussi: (v: string) => void; onRate: (indice: string, v?: string, compte?: boolean) => void }) {
  const [valeur, setValeur] = useState(x.f);
  const [presque, setPresque] = useState(false);
  const verifier = () => {
    if (normaliser(valeur) === normaliser(x.f)) return onRate("Tu n'as encore rien changé : trouve l'erreur dans la phrase, puis corrige-la.", undefined, false);
    const verdict = verdictEcrit(valeur, x.r);
    if (verdict === "juste") return onReussi(valeur);
    if (verdict === "presque" && !presque) {
      setPresque(true);
      return onRate("Tu y es presque : une seule lettre est encore à corriger.", valeur, false);
    }
    onRate(x.i, valeur);
  };
  return (
    <div className="rg-corriger">
      <p className="rg-corriger-fautive">
        <span className="rg-corriger-etiquette">La phrase à corriger</span>
        <span lang="en">{x.f}</span>
      </p>
      {revele && (
        <p className="rg-corriger-juste">
          <span className="rg-corriger-etiquette">La phrase corrigée</span>
          <PhraseCorrigee fautive={x.f} juste={x.r[0]} />
        </p>
      )}
      <form
        className="rg-ecrire"
        onSubmit={(e) => {
          e.preventDefault();
          if (valeur.trim()) verifier();
        }}
      >
        <input
          type="text"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          disabled={fini}
          lang="en"
          aria-label="La phrase corrigée"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          data-etat={fini && !revele ? "bonne" : revele ? "revele" : undefined}
        />
        {!fini && (
          <>
            <button type="submit" className="bouton bouton-principal" disabled={!valeur.trim()}>
              Vérifier
            </button>
            <button type="button" className="bouton" onClick={() => setValeur(x.f)} disabled={valeur === x.f} aria-label="Remettre la phrase de départ">
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}

/* ---------- Une série ---------- */

type PropsSerie = {
  items: Item[];
  mode: Mode;
  libelleFin?: string;
  onFini: (reponses: Reponse[]) => void;
};

export function SerieVue({ items, mode, libelleFin, onFini }: PropsSerie) {
  const [n, setN] = useState(0);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const xp = reponses.reduce((s, r) => s + pointsDe(r, mode), 0);
  const item = items[n];
  if (!item) return null;
  return (
    <section className="rg-defi rg-serie" aria-label="La série d'exercices">
      <div className="rg-defi-tete">
        <div className="rg-serie-progres">
          <span>
            Question {n + 1} sur {items.length}
          </span>
          <span className="rg-barre" style={{ "--p": `${(n / items.length) * 100}%` } as React.CSSProperties} aria-hidden="true" />
        </div>
        {mode === "guide" ? (
          <span className="rg-xp" aria-live="polite">
            <Sparkles className="size-4" aria-hidden="true" />
            {xp} XP
          </span>
        ) : (
          <span className="rg-mode-examen">Mode examen</span>
        )}
      </div>
      <ExerciceVue
        key={`${n}-${item.ref}`}
        item={item}
        mode={mode}
        derniere={n === items.length - 1}
        libelleFin={libelleFin}
        onSuite={(r) => {
          const toutes = [...reponses, r];
          setReponses(toutes);
          if (n < items.length - 1) {
            setN(n + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else onFini(toutes);
        }}
      />
    </section>
  );
}

/* ---------- Le bilan et la correction complète ---------- */

export const etoilesSerie = (juste: number, total: number) => {
  const t = juste / Math.max(1, total);
  return t >= 0.9 ? 3 : t >= 0.7 ? 2 : t > 0 ? 1 : 0;
};

type PropsBilan = {
  items: Item[];
  reponses: Reponse[];
  mode: Mode;
  titre?: string;
  phrase?: string;
  onRefaireErreurs?: (items: Item[]) => void;
  onRecommencer: () => void;
  autres?: React.ReactNode;
  /** Un encadré entre les boutons et la correction (les leçons à revoir après un examen, par exemple). */
  complement?: React.ReactNode;
};

export function BilanSerie({ items, reponses, mode, titre, phrase, onRefaireErreurs, onRecommencer, autres, complement }: PropsBilan) {
  const [filtre, setFiltre] = useState<"tout" | "erreurs">("tout");
  const parRef = new Map(reponses.map((r) => [r.ref, r]));
  const justes = reponses.filter((r) => r.juste).length;
  const premierCoup = reponses.filter((r) => r.juste && r.essais <= 1).length;
  const etoiles = etoilesSerie(justes, items.length);
  const xp = reponses.reduce((s, r) => s + pointsDe(r, mode), 0);
  const ratees = items.filter((it) => !parRef.get(it.ref)?.juste || (parRef.get(it.ref)?.essais ?? 1) > 1);
  const montres = filtre === "erreurs" ? ratees : items;
  const pct = Math.round((justes / Math.max(1, items.length)) * 100);
  const message =
    phrase ??
    (pct === 100
      ? "Un sans-faute. Tu maîtrises cette règle."
      : pct >= 80
        ? "Très solide. Relis la correction de tes erreurs : elles ne reviendront plus."
        : pct >= 50
          ? "Bon travail : la moitié du chemin est faite. Tes erreurs sont gardées dans ton carnet pour y revenir."
          : "Chaque erreur corrigée est une règle de plus dans ta tête. Lis la correction, puis refais tes erreurs.");
  return (
    <section className="rg-bilan" aria-label="Le bilan de la série">
      <div className="rg-recompense">
        <p className="rg-etoiles" aria-label={`${etoiles} étoile${etoiles > 1 ? "s" : ""} sur 3`}>
          {[0, 1, 2].map((i) => (
            <Star key={i} className="size-9" data-pleine={i < etoiles || undefined} style={{ "--i": i } as React.CSSProperties} aria-hidden="true" />
          ))}
        </p>
        {titre && <h3 className="rg-bilan-titre">{titre}</h3>}
        <p className="rg-bilan-score">
          <strong>
            {justes} / {items.length}
          </strong>{" "}
          <span>({pct} %)</span>
        </p>
        <p className="rg-recompense-texte">
          {message}
          {mode === "guide" && <span className="rg-recompense-xp"> +{xp} XP</span>}
        </p>
        {mode === "guide" && premierCoup < justes && (
          <p className="rg-bilan-detail">
            {premierCoup} du premier coup, {justes - premierCoup} avec l&apos;indice.
          </p>
        )}
      </div>

      <div className="rg-actions rg-bilan-actions">
        {onRefaireErreurs && ratees.length > 0 && (
          <button type="button" className="bouton bouton-principal" onClick={() => onRefaireErreurs(ratees)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Refaire mes {ratees.length} erreur{ratees.length > 1 ? "s" : ""}
          </button>
        )}
        <button type="button" className={`bouton${onRefaireErreurs && ratees.length ? "" : " bouton-principal"}`} onClick={onRecommencer}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Nouvelle série
        </button>
        {autres}
      </div>

      {complement}

      <div className="rg-correction">
        <div className="rg-correction-tete">
          <h3>
            <ListChecks className="size-5" aria-hidden="true" />
            La correction
          </h3>
          {ratees.length > 0 && ratees.length < items.length && (
            <div className="rg-filtre" role="group" aria-label="Que montrer">
              <button type="button" aria-pressed={filtre === "tout"} onClick={() => setFiltre("tout")}>
                Tout ({items.length})
              </button>
              <button type="button" aria-pressed={filtre === "erreurs"} onClick={() => setFiltre("erreurs")}>
                Mes erreurs ({ratees.length})
              </button>
            </div>
          )}
        </div>
        <ol className="rg-correction-liste">
          {montres.map((it) => {
            const r = parRef.get(it.ref);
            const x = it.exercice;
            const type = typeExercice(x);
            const ok = Boolean(r?.juste);
            const etat = !r ? "vide" : ok && r.essais <= 1 ? "juste" : ok ? "indice" : "faux";
            return (
              <li key={it.ref} className="rg-correction-item" data-etat={etat}>
                <span className="rg-correction-icone" aria-hidden="true">
                  {etat === "faux" ? <CircleX className="size-5" /> : <CircleCheck className="size-5" />}
                </span>
                <div>
                  <p className="rg-correction-statut">
                    {etat === "juste" ? "Juste du premier coup" : etat === "indice" ? (r?.auto ? "Juste (validé par toi)" : "Juste avec l'indice") : etat === "faux" ? "À revoir" : "Pas répondu"}
                    {it.origine && <span> · {it.origine}</span>}
                  </p>
                  <p className="rg-correction-enonce">
                    <Enonce texte={x.q} />
                  </p>
                  {type === "corriger" && (
                    <p className="rg-correction-ligne">
                      <span>Phrase de départ :</span> <span lang="en">{(x as Corriger).f}</span>
                    </p>
                  )}
                  {type === "toucher" && (
                    <p className="rg-correction-ligne" lang="en">
                      {motsAToucher((x as Toucher).p).map((m, k) => (
                        <span key={k}>
                          {k > 0 && " "}
                          {m.cible ? <mark className="rg-change">{m.texte}</mark> : m.texte}
                        </span>
                      ))}
                    </p>
                  )}
                  {r?.donnee && !ok && (
                    <p className="rg-correction-ligne rg-correction-donnee">
                      <span>Ta réponse :</span> <s lang="en">{r.donnee}</s>
                    </p>
                  )}
                  {type !== "toucher" && (
                    <p className="rg-correction-ligne rg-correction-bonne">
                      <span>Bonne réponse :</span>{" "}
                      {type === "corriger" ? <PhraseCorrigee fautive={(x as Corriger).f} juste={(x as Corriger).r[0]} /> : <strong lang="en">{bonneReponse(x)}</strong>}
                    </p>
                  )}
                  {(type === "ecrire" || type === "corriger") && (x as Ecrire).r.length > 1 && (
                    <p className="rg-correction-ligne rg-correction-aussi">
                      <span>Aussi accepté :</span> <span lang="en">{(x as Ecrire).r.slice(1, 4).join(" · ")}</span>
                    </p>
                  )}
                  <p className="rg-correction-pourquoi">{x.e}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
