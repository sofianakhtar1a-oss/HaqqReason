"use client";

import { ArrowLeft, ArrowRight, Check, Ear, LoaderCircle, Play, RotateCcw, Turtle, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chargerHistoire, HISTOIRES } from "@/lib/langues/histoires/catalogue";
import { motsDe } from "@/lib/langues/histoires/texte";
import { NIVEAUX, type Niveau } from "@/lib/langues/types";
import { parler, taire, voixDisponible } from "@/lib/langues/voix";
import { enregistrerSerie, useSuivi } from "@/lib/regles/suivi";
import { differences } from "@/lib/regles/verifier";
import { melanger } from "./regles/Exercices";
import "./dictee.css";

/*
 * Les dictées : une phrase anglaise lue par la voix du navigateur, on l'écrit, puis la correction mot à mot
 * (juste, en trop, oublié) et la traduction. Les phrases viennent des histoires du niveau choisi.
 */

export const NOMBRE_PHRASES = 6;
const LONGUEURS: Record<Niveau, [number, number]> = { A1: [4, 9], A2: [5, 11], B1: [6, 14], B2: [7, 16], C1: [8, 18], C2: [8, 20] };
export const serieDictee = (niveau: Niveau) => `d:${niveau}`;

type PhraseDictee = { en: string; fr: string };

/** Une phrase à dicter : sans guillemets, sans nom propre difficile, sans chiffres ni tirets. */
function phraseDictable(en: string) {
  return !/[0-9—–()[\];:]/.test(en);
}
const nettoyer = (en: string) => en.replace(/[“”"‘]/g, "").replace(/’/g, "'").replace(/\s+/g, " ").trim();

async function tirerPhrases(niveau: Niveau): Promise<PhraseDictee[]> {
  const ids = HISTOIRES.filter((h) => h.niveau === niveau).map((h) => h.id);
  const histoires = await Promise.all(ids.map((id) => chargerHistoire(id).catch(() => null)));
  const [min, max] = LONGUEURS[niveau];
  const candidates: PhraseDictee[] = [];
  for (const h of histoires) {
    if (!h) continue;
    for (const page of h.pages)
      for (const para of page.p)
        for (const [en, fr, g] of para) {
          const n = motsDe(en).length;
          const nomPropre = g.some((k) => k !== null && h.gloses[k]?.[2] === "np");
          if (n >= min && n <= max && !nomPropre && phraseDictable(en)) candidates.push({ en: nettoyer(en), fr });
        }
  }
  const melangees = melanger(candidates);
  const vues = new Set<string>();
  return melangees.filter((p) => !vues.has(p.en) && vues.add(p.en)).slice(0, NOMBRE_PHRASES);
}

type Resultat = { ecrit: string; justes: number; total: number };

export function Dictee({ niveau, onFermer }: { niveau: Niveau; onFermer: () => void }) {
  const [phrases, setPhrases] = useState<PhraseDictee[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [valeur, setValeur] = useState("");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [corrige, setCorrige] = useState(false);
  const [tour, setTour] = useState(0);
  const [termine, setTermine] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);
  const voix = voixDisponible();

  useEffect(() => {
    let vivant = true;
    tirerPhrases(niveau).then(
      (p) => vivant && (p.length ? setPhrases(p) : setErreur("Aucune phrase n'est disponible pour ce niveau.")),
      () => vivant && setErreur("Les phrases n'ont pas pu se charger. Vérifie ta connexion."),
    );
    return () => {
      vivant = false;
      taire();
    };
  }, [niveau, tour]);

  const phrase = phrases?.[n];
  const ecouter = (lent = false) => phrase && void parler(phrase.en, lent ? 0.62 : 0.88);
  const fini = termine;

  const verifier = () => {
    if (!phrase || !valeur.trim()) return;
    const d = differences(valeur, phrase.en);
    const total = motsDe(phrase.en).length;
    const justes = d.filter((m) => m.etat === "pareil").length;
    setResultats((r) => [...r, { ecrit: valeur, justes, total }]);
    setCorrige(true);
    if (n === (phrases?.length ?? 0) - 1) {
      const tous = [...resultats, { ecrit: valeur, justes, total }];
      enregistrerSerie(serieDictee(niveau), { juste: tous.reduce((s, x) => s + x.justes, 0), total: tous.reduce((s, x) => s + x.total, 0) });
    }
  };

  const suivante = () => {
    if (phrases && n >= phrases.length - 1) {
      setTermine(true);
      return;
    }
    setN((x) => x + 1);
    setValeur("");
    setCorrige(false);
    // Le geste qui passe à la phrase suivante lance aussi la voix (les navigateurs l'exigent).
    const p = phrases?.[n + 1];
    if (p) void parler(p.en, 0.88);
    setTimeout(() => champ.current?.focus(), 50);
  };

  return (
    <section className="dc" aria-labelledby="titre-dictee">
      <button type="button" className="hs-retour dc-retour" onClick={onFermer}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Écouter</span>
      </button>
      <div className="dc-tete" data-niveau={niveau}>
        <Ear className="size-7" aria-hidden="true" />
        <div>
          <p className="dc-niveau">Dictée · niveau {niveau}</p>
          <h2 id="titre-dictee" className="dc-titre">
            {fini ? "Ta dictée est finie" : phrases ? `Phrase ${n + 1} sur ${phrases.length}` : "La dictée se prépare"}
          </h2>
        </div>
      </div>

      {!voix && <p className="lg-erreur">Ton navigateur ne sait pas lire à voix haute : essaie avec Chrome, Edge ou Safari.</p>}
      {erreur ? (
        <p className="lg-erreur" role="alert">
          {erreur}
        </p>
      ) : !phrases || !phrase ? (
        <p className="dc-charge" role="status">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Les phrases se choisissent…
        </p>
      ) : fini ? (
        <Bilan
          phrases={phrases}
          resultats={resultats}
          onRecommencer={() => {
            setPhrases(null);
            setResultats([]);
            setN(0);
            setValeur("");
            setCorrige(false);
            setTermine(false);
            setTour((t) => t + 1);
          }}
          onFermer={onFermer}
        />
      ) : (
        <div className="dc-carte" data-niveau={niveau}>
          <div className="dc-ecoute">
            <button type="button" className="dc-jouer" onClick={() => ecouter()} disabled={!voix}>
              <Volume2 className="size-7" aria-hidden="true" />
              <span>Écouter</span>
            </button>
            <button type="button" className="bouton" onClick={() => ecouter(true)} disabled={!voix}>
              <Turtle className="size-4" aria-hidden="true" />
              Plus lentement
            </button>
          </div>
          <form
            className="dc-formulaire"
            onSubmit={(e) => {
              e.preventDefault();
              if (corrige) suivante();
              else verifier();
            }}
          >
            <label htmlFor="dc-champ" className="dc-consigne">
              Écris ce que tu entends, avec la ponctuation si tu veux (elle ne compte pas).
            </label>
            <textarea
              id="dc-champ"
              ref={champ}
              rows={2}
              lang="en"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              disabled={corrige}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="Your sentence…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (corrige) suivante();
                  else verifier();
                }
              }}
            />
            {corrige && <Correction ecrit={valeur} phrase={phrase} resultat={resultats[resultats.length - 1]} onEcouter={() => ecouter()} />}
            <div className="rg-actions">
              {corrige ? (
                <button type="submit" className="bouton bouton-principal">
                  {n === phrases.length - 1 ? "Voir mon résultat" : "Phrase suivante"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="bouton bouton-principal" disabled={!valeur.trim()}>
                  <Check className="size-4" aria-hidden="true" />
                  Corriger
                </button>
              )}
            </div>
          </form>
          <ol className="dc-points" aria-label={`Phrase ${n + 1} sur ${phrases.length}`}>
            {phrases.map((_, k) => (
              <li key={k} data-etat={k < resultats.length ? (resultats[k].justes === resultats[k].total ? "juste" : "faite") : k === n ? "ici" : undefined} />
            ))}
          </ol>
        </div>
      )}
      {phrases && !fini && n === 0 && !corrige && !valeur && voix && <p className="dc-astuce">Touche « Écouter » autant de fois que tu veux : la dictée ne compte que ce que tu écris.</p>}
    </section>
  );
}

function Correction({ ecrit, phrase, resultat, onEcouter }: { ecrit: string; phrase: PhraseDictee; resultat?: Resultat; onEcouter: () => void }) {
  const d = differences(ecrit, phrase.en);
  const parfait = resultat && resultat.justes === resultat.total && !d.some((m) => m.etat === "trop");
  return (
    <div className="dc-correction" aria-live="polite">
      <p className="dc-correction-score" data-parfait={parfait || undefined}>
        {parfait ? "Parfait, pas une faute !" : `${resultat?.justes ?? 0} mot${(resultat?.justes ?? 0) > 1 ? "s" : ""} juste${(resultat?.justes ?? 0) > 1 ? "s" : ""} sur ${resultat?.total ?? 0}`}
      </p>
      {!parfait && (
        <p className="dc-diff" lang="en" aria-label="Ta phrase corrigée mot à mot">
          {d.map((m, k) => (
            <span key={k} data-etat={m.etat}>
              {m.mot}
            </span>
          ))}
        </p>
      )}
      <p className="dc-juste" lang="en">
        {phrase.en}
        <button type="button" className="dc-reecouter" aria-label="Réécouter la phrase" onClick={onEcouter}>
          <Play className="size-3.5" fill="currentColor" aria-hidden="true" />
        </button>
      </p>
      <p className="dc-traduction">{phrase.fr}</p>
      {!parfait && (
        <p className="dc-legende">
          <span data-etat="pareil">juste</span> <span data-etat="manque">oublié ou mal écrit</span> <span data-etat="trop">en trop</span>
        </p>
      )}
    </div>
  );
}

function Bilan({ phrases, resultats, onRecommencer, onFermer }: { phrases: PhraseDictee[]; resultats: Resultat[]; onRecommencer: () => void; onFermer: () => void }) {
  const justes = resultats.reduce((s, r) => s + r.justes, 0);
  const total = resultats.reduce((s, r) => s + r.total, 0);
  const pct = Math.round((justes / Math.max(1, total)) * 100);
  return (
    <div className="dc-bilan">
      <p className="dc-bilan-score">
        <strong>{pct} %</strong> des mots justes
      </p>
      <p className="dc-bilan-texte">
        {pct >= 95 ? "Une oreille d'or : l'anglais parlé n'a plus de secret pour toi à ce niveau." : pct >= 75 ? "Très bien : relis les mots oubliés, ce sont souvent les petits mots qu'on n'entend pas." : "Chaque dictée affine ton oreille. Réécoute les phrases ci-dessous en lisant le texte."}
      </p>
      <ol className="dc-bilan-liste">
        {phrases.map((p, k) => (
          <li key={k} data-parfait={resultats[k]?.justes === resultats[k]?.total || undefined}>
            <span lang="en">{p.en}</span>
            <small>
              {resultats[k]?.justes ?? 0}/{resultats[k]?.total ?? 0} · {p.fr}
            </small>
          </li>
        ))}
      </ol>
      <div className="rg-actions">
        <button type="button" className="bouton bouton-principal" onClick={onRecommencer}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Nouvelle dictée
        </button>
        <button type="button" className="bouton" onClick={onFermer}>
          Changer de niveau
        </button>
      </div>
    </div>
  );
}

/** Le choix du niveau, en tête de l'onglet Écouter. */
export function ChoixDictee({ onOuvrir }: { onOuvrir: (niveau: Niveau) => void }) {
  const { series } = useSuivi();
  return (
    <section className="dc-choix" aria-labelledby="titre-dictees">
      <h3 id="titre-dictees" className="dc-choix-titre">
        <Ear className="size-5" aria-hidden="true" />
        Les dictées
      </h3>
      <p className="dc-choix-texte">Écoute une phrase, écris-la : la correction te montre chaque mot juste, oublié ou en trop, puis la traduction. Six phrases tirées des histoires, à ton niveau.</p>
      <ul className="dc-niveaux">
        {NIVEAUX.map((niv) => {
          const r = series[serieDictee(niv)];
          return (
            <li key={niv}>
              <button type="button" data-niveau={niv} onClick={() => onOuvrir(niv)}>
                <strong>{niv}</strong>
                <span>{r ? `Record : ${Math.round((r.meilleur / Math.max(1, r.total)) * 100)} %` : "Commencer"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
