"use client";

import { ArrowLeft, Check, Eye, KeyRound, Lightbulb, RotateCcw, Sparkles, Star, Swords, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { enregistrerLecon, useProgression } from "@/lib/regles/progression";
import { type Choix, type Ecrire, estChoix, estEcrire, type Lecon, type Question, type Section, type Toucher } from "@/lib/regles/types";
import { Machine } from "./Machine";
import { codesDe, Legende, Phrase } from "./Phrase";

/*
 * Une leçon, en quatre étapes : le déclic, la démonstration, le défi, le secret d'expert.
 * Dans le défi, une erreur n'est jamais une sanction : elle allume un indice.
 */

type Etape = "declic" | "demo" | "defi" | "secret";
const ETAPES: { id: Etape; nom: string; Icone: typeof Lightbulb }[] = [
  { id: "declic", nom: "Le déclic", Icone: Lightbulb },
  { id: "demo", nom: "La démonstration", Icone: Wand2 },
  { id: "defi", nom: "Le défi", Icone: Swords },
  { id: "secret", nom: "Le secret d'expert", Icone: KeyRound },
];

const BRAVO = ["Bravo !", "Exactement !", "Tu as l'œil !", "Dans le mille !", "Parfait !", "Génial, c'est ça !", "Impeccable !", "Quel flair !"];
const PISTE = ["Bonne piste : ton erreur nous donne un indice.", "Presque ! Ton erreur montre où regarder.", "Chaque essai te rapproche. Voici l'indice :"];
const au = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
function melanger<T>(l: T[]) {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export const etoilesDe = (erreurs: number) => (erreurs <= 1 ? 3 : erreurs <= 4 ? 2 : 1);

type Props = { section: Section; lecon: Lecon; onRetour: () => void; onOuvrir: (id: string) => void };

export function LeconVue({ section, lecon, onRetour, onOuvrir }: Props) {
  const [etape, setEtape] = useState<Etape>("declic");
  const [bilan, setBilan] = useState<{ erreurs: number; xp: number } | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const index = section.lecons.findIndex((l) => l.id === lecon.id);
  const suivante = section.lecons[index + 1];
  const { lecons } = useProgression();
  const deja = lecons[lecon.id];

  useEffect(() => {
    titre.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etape]);

  const aller = (e: Etape) => setEtape(e);
  const ouverte = (e: Etape) => e !== "secret" || Boolean(bilan) || Boolean(deja);

  return (
    <article className="rg-lecon" data-section={section.id}>
      <header className="rg-lecon-tete">
        <button type="button" className="rg-retour" onClick={onRetour}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {section.nom}
        </button>
        <nav className="rg-etapes" aria-label="Les étapes de la leçon">
          <ol>
            {ETAPES.map(({ id, nom, Icone }, i) => (
              <li key={id}>
                <button
                  type="button"
                  className="rg-etape"
                  aria-current={etape === id ? "step" : undefined}
                  data-faite={ETAPES.findIndex((x) => x.id === etape) > i || undefined}
                  disabled={!ouverte(id)}
                  onClick={() => aller(id)}
                >
                  <Icone className="size-4" aria-hidden="true" />
                  <span>{nom}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <div className="rg-lecon-titre">
        <span className="rg-heros" aria-hidden="true">
          {lecon.heros}
        </span>
        <div>
          <p className="rg-lecon-niveau">
            {lecon.niveau} · {section.univers}
          </p>
          <h2 ref={titre} tabIndex={-1} className="rg-lecon-nom">
            {lecon.titre}
          </h2>
          <p className="rg-lecon-notion">Dans ton cahier : {lecon.notion.charAt(0).toLowerCase() + lecon.notion.slice(1)}</p>
        </div>
      </div>

      {etape === "declic" && <Declic lecon={lecon} onSuite={() => aller("demo")} />}
      {etape === "demo" && <Demo lecon={lecon} onSuite={() => aller("defi")} />}
      {etape === "defi" && (
        <Defi
          key={lecon.id}
          questions={lecon.defi}
          onFini={(b) => {
            setBilan(b);
            enregistrerLecon(lecon.id, { etoiles: etoilesDe(b.erreurs), xp: b.xp });
            aller("secret");
          }}
        />
      )}
      {etape === "secret" && (
        <Secret
          lecon={lecon}
          bilan={bilan}
          meilleur={deja?.etoiles ?? 0}
          suivante={suivante}
          onRefaire={() => {
            setBilan(null);
            aller("defi");
          }}
          onSuivante={() => suivante && onOuvrir(suivante.id)}
          onRetour={onRetour}
        />
      )}
    </article>
  );
}

/* ---------- 1. Le déclic ---------- */

function Declic({ lecon, onSuite }: { lecon: Lecon; onSuite: () => void }) {
  const morceaux = lecon.declic.scene.split(/\s+/).filter(Boolean);
  return (
    <section className="rg-declic" aria-label="Le déclic">
      <p className="rg-scene" aria-hidden="true">
        {morceaux.map((m, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {m}
          </span>
        ))}
      </p>
      <p className="rg-declic-image">{lecon.declic.image}</p>
      <p className="rg-declic-sens">{lecon.declic.sens}</p>
      <div className="rg-actions">
        <button type="button" className="bouton bouton-principal" onClick={onSuite}>
          <Wand2 className="size-4" aria-hidden="true" />
          Voir comment ça marche
        </button>
      </div>
    </section>
  );
}

/* ---------- 2. La démonstration ---------- */

function Demo({ lecon, onSuite }: { lecon: Lecon; onSuite: () => void }) {
  const [vues, setVues] = useState(1);
  const etapes = lecon.demo.etapes;
  const toutes = vues >= etapes.length;
  const codes = codesDe(etapes.map((e) => e.p));
  return (
    <section className="rg-demo" aria-label="La démonstration">
      <Legende codes={codes} libelles={lecon.demo.legende} />
      <ol className="rg-demo-etapes">
        {etapes.slice(0, vues).map((e, i) => (
          <li key={i} className="rg-demo-etape" data-derniere={i === vues - 1 || undefined}>
            <p className="rg-demo-phrase" lang="en">
              <Phrase p={e.p} anime={i === vues - 1} />
            </p>
            <p className="rg-demo-note">{e.n}</p>
          </li>
        ))}
      </ol>
      {!toutes ? (
        <div className="rg-actions">
          <button type="button" className="bouton bouton-principal" onClick={() => setVues((v) => v + 1)}>
            <Sparkles className="size-4" aria-hidden="true" />
            Étape suivante
          </button>
          <span className="rg-compte">
            {vues} / {etapes.length}
          </span>
        </div>
      ) : (
        <>
          {lecon.demo.machine && (
            <div className="rg-demo-machine">
              <p className="rg-demo-machine-titre">À toi de piloter : change de verbe, de passager, de temps, et passe à la négation ou à la question.</p>
              <Machine temps={lecon.demo.machine.temps} verbes={lecon.demo.machine.verbes} mode={lecon.demo.machine.mode} />
            </div>
          )}
          <div className="rg-actions">
            <button type="button" className="bouton bouton-principal" onClick={onSuite}>
              <Swords className="size-4" aria-hidden="true" />
              Relever le défi
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------- 3. Le défi ---------- */

function Defi({ questions, onFini }: { questions: Question[]; onFini: (b: { erreurs: number; xp: number }) => void }) {
  const [n, setN] = useState(0);
  const [erreurs, setErreurs] = useState(0);
  const [xp, setXp] = useState(0);
  const q = questions[n];
  return (
    <section className="rg-defi" aria-label="Le défi">
      <div className="rg-defi-tete">
        <ol className="rg-points" aria-label={`Question ${n + 1} sur ${questions.length}`}>
          {questions.map((_, i) => (
            <li key={i} data-etat={i < n ? "fait" : i === n ? "ici" : undefined} />
          ))}
        </ol>
        <span className="rg-xp" aria-live="polite">
          <Sparkles className="size-4" aria-hidden="true" />
          {xp} XP
        </span>
      </div>
      <QuestionVue
        key={n}
        question={q}
        derniere={n === questions.length - 1}
        onResultat={(r) => {
          setErreurs((e) => e + r.erreurs);
          setXp((x) => x + r.xp);
        }}
        onSuite={() => {
          if (n < questions.length - 1) setN(n + 1);
          else onFini({ erreurs, xp });
        }}
      />
    </section>
  );
}

type Statut = "attente" | "piste" | "reussi" | "revele";

/** Les contractions courantes, pour accepter « don't » comme « do not ». */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "cannot"],
  [/\bshan't\b/g, "shall not"],
  [/\blet's\b/g, "let us"],
  [/n't\b/g, " not"],
  [/'m\b/g, " am"],
  [/'re\b/g, " are"],
  [/'ve\b/g, " have"],
  [/'ll\b/g, " will"],
];
const normaliser = (s: string) => {
  let t = s
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/[.!?…]+$/g, "")
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  for (const [re, par] of CONTRACTIONS) t = t.replace(re, par);
  return t.replace(/\bcan not\b/g, "cannot").replace(/\s+/g, " ").trim();
};
/** Le nombre de lettres à changer pour passer d'un mot à l'autre. */
function ecart(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function QuestionVue({ question, derniere, onResultat, onSuite }: { question: Question; derniere: boolean; onResultat: (r: { erreurs: number; xp: number }) => void; onSuite: () => void }) {
  const [statut, setStatut] = useState<Statut>("attente");
  const [essais, setEssais] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [bravo] = useState(() => au(BRAVO));
  const [piste] = useState(() => au(PISTE));
  const suite = useRef<HTMLButtonElement>(null);
  const fini = statut === "reussi" || statut === "revele";

  useEffect(() => {
    if (fini) suite.current?.focus({ preventScroll: true });
  }, [fini]);

  const reussir = () => {
    setStatut("reussi");
    setMessage(null);
    onResultat({ erreurs: essais, xp: essais === 0 ? 10 : essais === 1 ? 5 : 2 });
  };
  const rater = (indice: string, compte = true) => {
    const n = compte ? essais + 1 : essais;
    setEssais(n);
    if (n >= 2) {
      setStatut("revele");
      setMessage(null);
      onResultat({ erreurs: n, xp: 1 });
    } else {
      setStatut("piste");
      setMessage(indice);
    }
  };

  return (
    <div className="rg-question" data-statut={statut}>
      <p className="rg-question-enonce" lang="fr">
        <Enonce texte={question.q} />
      </p>
      {estChoix(question) ? (
        <VueChoix question={question} statut={statut} onReussi={reussir} onRate={(opt) => rater(question.io?.[opt] ?? question.i)} />
      ) : estEcrire(question) ? (
        <VueEcrire question={question} statut={statut} onReussi={reussir} onRate={rater} />
      ) : (
        <VueToucher question={question as Toucher} statut={statut} onReussi={reussir} onRate={() => rater(question.i)} />
      )}

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
              <strong>{bravo}</strong> {question.e}
            </span>
          </p>
        )}
        {statut === "revele" && (
          <p className="rg-revele">
            <Eye className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <strong>Voici la réponse, et surtout pourquoi :</strong> {question.e} Maintenant, tu sais : c&apos;est exactement comme ça qu&apos;on devient fort.
            </span>
          </p>
        )}
      </div>
      {fini && (
        <div className="rg-actions">
          <button ref={suite} type="button" className="bouton bouton-principal" onClick={onSuite}>
            {derniere ? (
              <>
                <KeyRound className="size-4" aria-hidden="true" />
                Découvrir le secret d&apos;expert
              </>
            ) : (
              "Question suivante"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** L'énoncé, avec le trou « ___ » dessiné comme une case à remplir. */
function Enonce({ texte }: { texte: string }) {
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

function VueChoix({ question, statut, onReussi, onRate }: { question: Choix; statut: Statut; onReussi: () => void; onRate: (opt: string) => void }) {
  // Mélangées une fois pour toutes (la bonne réponse est la première dans les données).
  const [options] = useState(() => melanger(question.o));
  const [pistes, setPistes] = useState<string[]>([]);
  const bonne = question.o[0];
  const fini = statut === "reussi" || statut === "revele";
  return (
    <div className="rg-options" role="group" aria-label="Choisis la bonne réponse">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="rg-option"
          lang="en"
          data-etat={fini && o === bonne ? "bonne" : pistes.includes(o) ? "piste" : undefined}
          disabled={fini || pistes.includes(o)}
          onClick={() => {
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

function VueEcrire({ question, statut, onReussi, onRate }: { question: Ecrire; statut: Statut; onReussi: () => void; onRate: (indice: string, compte?: boolean) => void }) {
  const [valeur, setValeur] = useState("");
  const [presque, setPresque] = useState(false);
  const fini = statut === "reussi" || statut === "revele";
  const verifier = () => {
    const v = normaliser(valeur);
    if (!v) return;
    if (question.r.some((r) => normaliser(r) === v)) return onReussi();
    if (!presque && v.length > 3 && question.r.some((r) => ecart(normaliser(r), v) === 1)) {
      setPresque(true);
      return onRate("Tu y es presque : une seule lettre est à corriger. Regarde bien l'orthographe (une lettre doublée, un e, un y ?).", false);
    }
    onRate(question.i);
  };
  return (
    <form
      className="rg-ecrire"
      onSubmit={(e) => {
        e.preventDefault();
        verifier();
      }}
    >
      <input
        type="text"
        value={fini && statut === "revele" ? question.r[0] : valeur}
        onChange={(e) => setValeur(e.target.value)}
        disabled={fini}
        lang="en"
        aria-label="Ta réponse"
        placeholder="Écris ta réponse"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        data-etat={statut === "reussi" ? "bonne" : statut === "revele" ? "revele" : undefined}
      />
      {!fini && (
        <button type="submit" className="bouton bouton-principal" disabled={!valeur.trim()}>
          Vérifier
        </button>
      )}
    </form>
  );
}

function VueToucher({ question, statut, onReussi, onRate }: { question: Toucher; statut: Statut; onReussi: () => void; onRate: () => void }) {
  const mots = useMemo(() => question.p.split(/\s+/).map((m) => ({ cible: m.startsWith("*"), texte: m.replace(/^\*/, "") })), [question]);
  const [choisis, setChoisis] = useState<number[]>([]);
  const [pistes, setPistes] = useState<number[]>([]);
  const fini = statut === "reussi" || statut === "revele";
  const cibles = mots.flatMap((m, i) => (m.cible ? [i] : []));
  const verifier = () => {
    const juste = choisis.length === cibles.length && cibles.every((i) => choisis.includes(i));
    if (juste) return onReussi();
    setPistes(choisis.filter((i) => !cibles.includes(i)));
    setChoisis(choisis.filter((i) => cibles.includes(i)));
    onRate();
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
              onClick={() => setChoisis((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))}
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

/* ---------- 4. Le secret d'expert ---------- */

function Secret({
  lecon,
  bilan,
  meilleur,
  suivante,
  onRefaire,
  onSuivante,
  onRetour,
}: {
  lecon: Lecon;
  bilan: { erreurs: number; xp: number } | null;
  meilleur: number;
  suivante?: Lecon;
  onRefaire: () => void;
  onSuivante: () => void;
  onRetour: () => void;
}) {
  const etoiles = bilan ? etoilesDe(bilan.erreurs) : meilleur;
  const phrase = !bilan ? "Ton meilleur score sur cette leçon." : etoiles === 3 ? "Trois étoiles : tu maîtrises cette règle comme un expert." : etoiles === 2 ? "Deux étoiles : tes erreurs t'ont appris quelque chose de solide." : "Une étoile, et une règle de plus dans ta tête. Refais le défi quand tu veux : la deuxième fois, tout paraît simple.";
  return (
    <section className="rg-secret" aria-label="Le secret d'expert">
      <div className="rg-recompense">
        <p className="rg-etoiles" aria-label={`${etoiles} étoile${etoiles > 1 ? "s" : ""} sur 3`}>
          {[0, 1, 2].map((i) => (
            <Star key={i} className="size-9" data-pleine={i < etoiles || undefined} style={{ "--i": i } as React.CSSProperties} aria-hidden="true" />
          ))}
        </p>
        <p className="rg-recompense-texte">
          {phrase}
          {bilan && <span className="rg-recompense-xp"> +{bilan.xp} XP</span>}
        </p>
      </div>

      <div className="rg-coffre">
        <p className="rg-coffre-etiquette">
          <KeyRound className="size-4" aria-hidden="true" />
          Secret d&apos;expert
        </p>
        <h3 className="rg-coffre-titre">{lecon.secret.titre}</h3>
        <p className="rg-coffre-texte">{lecon.secret.texte}</p>
        {lecon.secret.formule && (
          <p className="rg-formule">
            {lecon.secret.formule}
          </p>
        )}
      </div>

      <div className="rg-actions">
        {suivante ? (
          <button type="button" className="bouton bouton-principal" onClick={onSuivante}>
            <Sparkles className="size-4" aria-hidden="true" />
            Leçon suivante : {suivante.titre}
          </button>
        ) : (
          <button type="button" className="bouton bouton-principal" onClick={onRetour}>
            <Sparkles className="size-4" aria-hidden="true" />
            Retour à la carte
          </button>
        )}
        <button type="button" className="bouton" onClick={onRefaire}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Refaire le défi
        </button>
        {suivante && (
          <button type="button" className="bouton" onClick={onRetour}>
            Retour à la carte
          </button>
        )}
      </div>
    </section>
  );
}
