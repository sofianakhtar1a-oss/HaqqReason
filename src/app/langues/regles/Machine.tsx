"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ASPECTS,
  chargerVerbes,
  conjuguer,
  EPOQUES,
  ETATS,
  formesDeReference,
  type ModePhrase,
  type Monde,
  MONDES,
  TEMPS,
  type TempsId,
  type Verbes,
} from "@/lib/regles/conjugueur";
import { CODE_DU_ROLE, collage, Legende } from "./Phrase";

/*
 * La Machine à voyager dans le temps : un verbe anglais, une époque, une façon de voir l'action,
 * et les six passagers (I, you, he/she/it, we, you, they) qui l'habillent sous tes yeux.
 * La base du verbe est en bleu, sa terminaison en or, le moteur (auxiliaire) en violet,
 * la forme irrégulière en rose.
 */

type Props = {
  /** Les temps proposés (dans une leçon). Sans eux : la Machine complète, avec ses quatre mondes. */
  temps?: TempsId[];
  /** Les verbes proposés en raccourci. */
  verbes?: string[];
  /** La forme de phrase au départ. */
  mode?: ModePhrase;
};

const VERBES_DEPART = ["walk", "play", "study", "stop", "be", "have", "go", "do", "eat", "write"];
const MODES: { id: ModePhrase; nom: string }[] = [
  { id: "affirmative", nom: "Affirmative" },
  { id: "negative", nom: "Négative" },
  { id: "question", nom: "Question" },
];
const NOTES = ["", "= tu", "", "", "= vous", ""];
const NOTES_IMPERATIF = ["à toi ou à vous", "à nous (let's = let us)"];

export function Machine({ temps: tempsLecon, verbes: verbesLecon, mode: modeLecon }: Props) {
  const complete = !tempsLecon;
  const raccourcis = verbesLecon ?? VERBES_DEPART;
  const [base, setBase] = useState<Verbes | null>(null);
  const [verbe, setVerbe] = useState(raccourcis[0]);
  const [saisie, setSaisie] = useState("");
  const [monde, setMonde] = useState<Monde>("reel");
  const [temps, setTemps] = useState<TempsId>(tempsLecon?.[0] ?? "presentSimple");
  const [troisieme, setTroisieme] = useState<"he" | "she" | "it">("he");
  const [mode, setMode] = useState<ModePhrase>(modeLecon ?? "affirmative");
  const [contractions, setContractions] = useState(false);
  const [inconnu, setInconnu] = useState<string | null>(null);
  const liste = useId();

  useEffect(() => {
    let fini = false;
    void chargerVerbes().then((m) => !fini && setBase(m));
    return () => {
      fini = true;
    };
  }, []);

  const tousLesVerbes = useMemo(() => (base ? [...base.keys()].sort() : []), [base]);
  const infoTemps = TEMPS.find((t) => t.id === temps);
  const formes = base ? conjuguer(base, verbe, temps, { troisieme, mode, contractions }) : [];
  const ref = base ? formesDeReference(base, verbe) : null;
  const imperatif = temps === "imperative";
  const continu = /Continuous/.test(temps);
  const grille = complete && monde === "reel";
  const tempsVisibles = complete ? TEMPS.filter((t) => t.monde === monde) : TEMPS.filter((t) => tempsLecon.includes(t.id));

  const choisir = (s: string) => {
    const propre = s.trim().toLowerCase().replace(/^to\s+/, "");
    if (!propre) return;
    if (base && !base.has(propre)) {
      setInconnu(propre);
      return;
    }
    setInconnu(null);
    setVerbe(propre);
    setSaisie("");
  };

  const changerMonde = (m: Monde) => {
    setMonde(m);
    const premier = m === "reel" ? TEMPS.find((t) => t.id === "presentSimple") : TEMPS.find((t) => t.monde === m);
    if (premier) setTemps(premier.id);
  };

  const bouton = (t: (typeof TEMPS)[number]) => (
    <button key={t.id} type="button" role="radio" aria-checked={temps === t.id} className="rg-epoque" data-maintenant={t.id === "presentSimple" || undefined} onClick={() => setTemps(t.id)}>
      <span className="rg-epoque-point" aria-hidden="true" />
      <span className="rg-epoque-nom" lang="en">
        {t.nom}
      </span>
      {complete && <span className="rg-epoque-niveau">{t.niveau}</span>}
    </button>
  );

  return (
    <section className="rg-machine" data-complete={complete || undefined} aria-label="La Machine à voyager dans le temps">
      <div className="rg-machine-verbe">
        <span className="rg-machine-infinitif" lang="en">
          to {verbe}
        </span>
        {ref && <span className="rg-machine-sorte">{ref.irregulier ? "irrégulier" : "régulier"}</span>}
        <div className="rg-machine-raccourcis" role="group" aria-label="Choisir un verbe">
          {raccourcis.map((x) => (
            <button key={x} type="button" className="rg-puce" lang="en" aria-pressed={x === verbe} onClick={() => choisir(x)}>
              {x}
            </button>
          ))}
        </div>
        <form
          className="rg-machine-cherche"
          onSubmit={(e) => {
            e.preventDefault();
            choisir(saisie);
          }}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="text"
            list={liste}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder={complete ? `Un verbe parmi ${tousLesVerbes.length || "570"}` : "Un autre verbe"}
            aria-label="Écris un verbe anglais (sa base : walk, go, write…)"
            lang="en"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <datalist id={liste}>
            {tousLesVerbes.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          <button type="submit" className="rg-puce" disabled={!saisie.trim()}>
            Embarquer
          </button>
        </form>
        {inconnu && (
          <p className="rg-machine-inconnu" role="status">
            « {inconnu} » n&apos;est pas encore à bord. Écris la base du verbe, sans terminaison (go, write, study…).
          </p>
        )}
      </div>

      {complete && (
        <div className="rg-mondes" role="tablist" aria-label="Le monde">
          {MONDES.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={monde === m.id} className="rg-monde" data-monde={m.id} onClick={() => changerMonde(m.id)}>
              <span className="rg-monde-nom">{m.nom}</span>
              <span className="rg-monde-image">{m.image}</span>
            </button>
          ))}
        </div>
      )}

      {grille ? (
        <div className="rg-grille" role="radiogroup" aria-label="Le temps : une époque et une façon de voir l'action">
          <span aria-hidden="true" />
          {EPOQUES.map((e) => (
            <span key={e.id} className="rg-grille-epoque" data-maintenant={e.id === "present" || undefined}>
              {e.nom}
            </span>
          ))}
          {ASPECTS.map((a) => (
            <div key={a.id} className="rg-grille-ligne">
              <span className="rg-grille-aspect">
                <strong lang="en">{a.nom}</strong>
                <small>{a.recette}</small>
              </span>
              {EPOQUES.map((e) => {
                const t = TEMPS.find((x) => x.monde === "reel" && x.epoque === e.id && x.aspect === a.id)!;
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={temps === t.id} className="rg-case" data-maintenant={t.id === "presentSimple" || undefined} onClick={() => setTemps(t.id)}>
                    <span lang="en">{t.nom}</span>
                    <small>{t.niveau}</small>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="rg-epoques" role="radiogroup" aria-label="Le temps">
          <div className="rg-epoques-rail" data-monde={complete ? monde : undefined}>
            {tempsVisibles.map(bouton)}
          </div>
        </div>
      )}

      {infoTemps && (
        <p className="rg-machine-image" aria-live="polite">
          {infoTemps.image}
        </p>
      )}

      <div className="rg-sieges-tete">
        <div className="rg-bascule" role="group" aria-label="La forme de la phrase">
          {MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.nom}
            </button>
          ))}
        </div>
        <div className="rg-bascules">
          {!imperatif && (
            <div className="rg-bascule" role="group" aria-label="Le troisième passager">
              {(["he", "she", "it"] as const).map((x) => (
                <button key={x} type="button" lang="en" aria-pressed={troisieme === x} onClick={() => setTroisieme(x)}>
                  {x}
                </button>
              ))}
            </div>
          )}
          <label className="rg-interrupteur">
            <input type="checkbox" checked={contractions} onChange={(e) => setContractions(e.target.checked)} />
            <span>Contractions (I&apos;m, don&apos;t)</span>
          </label>
        </div>
      </div>

      {continu && ETATS.has(verbe) && (
        <p className="rg-machine-alerte" role="note">
          Attention : <strong lang="en">{verbe}</strong> est un verbe d&apos;état. On dit presque toujours la forme simple (<span lang="en">I {verbe}</span>), pas la forme en -ing. La Machine te la montre quand même, pour comparer.
        </p>
      )}

      <ol className="rg-sieges" data-deux={imperatif || undefined} aria-live="polite">
        {!base
          ? Array.from({ length: 6 }, (_, i) => <li key={i} className="rg-siege" data-attente />)
          : formes.map((f, i) => (
              <li key={`${verbe}-${temps}-${mode}-${contractions}-${troisieme}-${i}`} className="rg-siege" data-vide={!f || undefined} style={{ "--i": i } as React.CSSProperties}>
                {f ? (
                  <span className="rg-forme" lang="en">
                    {f.map((m, k, tout) => (
                      <span key={k} className="rg-mot" data-code={CODE_DU_ROLE[m.role]} {...collage(tout.map((x) => x.texte), k)}>
                        {m.texte}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="rg-forme-vide">{imperatif ? "pas de question à l'impératif" : "n'existe pas : ce verbe n'a pas de complément, donc pas de passif"}</span>
                )}
                {(imperatif ? NOTES_IMPERATIF[i] : NOTES[i]) && <span className="rg-siege-note">{imperatif ? NOTES_IMPERATIF[i] : NOTES[i]}</span>}
              </li>
            ))}
      </ol>

      <Legende
        codes={["s", "a", "r", "t", "p", "k"]}
        libelles={{ s: "le passager (sujet)", a: "le moteur (auxiliaire)", r: "la base du verbe", t: "la terminaison (-s, -ed, -ing)", p: "la forme irrégulière", k: "le mot-lien (not, to…)" }}
      />

      {ref && complete && (
        <dl className="rg-sans-personne" lang="en">
          <div>
            <dt>Base (infinitive)</dt>
            <dd>to {ref.base}</dd>
          </div>
          <div>
            <dt>Avec he, she, it</dt>
            <dd>{ref.troisieme}</dd>
          </div>
          <div>
            <dt>Past simple</dt>
            <dd>{ref.passe}</dd>
          </div>
          <div>
            <dt>Past participle</dt>
            <dd>{ref.participe}</dd>
          </div>
          <div>
            <dt>Forme en -ing</dt>
            <dd>{ref.ing}</dd>
          </div>
        </dl>
      )}
      {complete && <p className="rg-credit">Orthographe britannique, celle des manuels européens (travelled). En anglais américain : traveled.</p>}
    </section>
  );
}
