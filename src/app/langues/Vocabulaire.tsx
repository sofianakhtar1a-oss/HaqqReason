"use client";

import { ArrowLeft, BookmarkCheck, BookmarkPlus, Briefcase, Building2, CloudSun, GraduationCap, HeartPulse, House, Layers, type LucideIcon, Plane, Play, Shuffle, Smile, Sun, Trees, Users, UtensilsCrossed, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { elementDEntree, nouveauMot } from "@/lib/langues/dictionnaire";
import { estDue, type Maitrise, maitrise } from "@/lib/langues/srs";
import { THEMES, themeDe, TOUTES_LES_ENTREES } from "@/lib/langues/themes/index";
import { type Carte, NIVEAUX, type Niveau, type Theme } from "@/lib/langues/types";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { ajouterMot, useDonnees } from "./donnees";
import type { Lancement } from "./Seance";

export const ICONES_THEMES: Record<string, LucideIcon> = { Users, Plane, Briefcase, Sun, UtensilsCrossed, HeartPulse, House, Smile, CloudSun, GraduationCap, Building2, Trees };

export type Progres = { total: number; nouveau: number; enCours: number; appris: number; maitrise: number; dus: number };

export function progresDe(ids: string[], cartes: Map<string, Carte>, maintenant = Date.now()): Progres {
  const p: Progres = { total: ids.length, nouveau: 0, enCours: 0, appris: 0, maitrise: 0, dus: 0 };
  for (const id of ids) {
    const c = cartes.get(id);
    const m = maitrise(c);
    if (m === "nouveau") p.nouveau++;
    else if (m === "en-cours") p.enCours++;
    else if (m === "appris") p.appris++;
    else p.maitrise++;
    if (estDue(c, maintenant)) p.dus++;
  }
  return p;
}

/** Barre de progression en trois teintes : maîtrisé, appris, en cours. */
export function BarreProgres({ p, fine }: { p: Progres; fine?: boolean }) {
  const pc = (n: number) => `${(n / Math.max(1, p.total)) * 100}%`;
  return (
    <span className="lg-progres" data-fine={fine || undefined} role="img" aria-label={`${p.maitrise} maîtrisés, ${p.appris} appris, ${p.enCours} en cours sur ${p.total}`}>
      <i data-m="maitrise" style={{ width: pc(p.maitrise) }} />
      <i data-m="appris" style={{ width: pc(p.appris) }} />
      <i data-m="en-cours" style={{ width: pc(p.enCours) }} />
    </span>
  );
}

const NOMS_MAITRISE: Record<Maitrise, string> = { nouveau: "Nouveau", "en-cours": "En cours", appris: "Appris", maitrise: "Maîtrisé" };

export function Pastille({ m }: { m: Maitrise }) {
  const n = { nouveau: 0, "en-cours": 1, appris: 2, maitrise: 3 }[m];
  return (
    <span className="lg-pastille" data-m={m} title={NOMS_MAITRISE[m]} aria-label={NOMS_MAITRISE[m]}>
      {[0, 1, 2].map((k) => (
        <i key={k} data-plein={k < n || undefined} />
      ))}
    </span>
  );
}

type Props = { themeId: string | null; onOuvrir: (id: string | null) => void; lancer: (l: Lancement) => void };

export function Vocabulaire({ themeId, onOuvrir, lancer }: Props) {
  const theme = themeId ? themeDe(themeId) : undefined;
  if (theme) return <DetailTheme theme={theme} onRetour={() => onOuvrir(null)} lancer={lancer} />;
  return <Themes onOuvrir={onOuvrir} lancer={lancer} />;
}

function Themes({ onOuvrir, lancer }: Pick<Props, "onOuvrir" | "lancer">) {
  const { cartes } = useDonnees();
  const global = progresDe(
    TOUTES_LES_ENTREES.map((e) => e.id),
    cartes,
  );
  const tout = TOUTES_LES_ENTREES.map(elementDEntree);
  return (
    <section aria-labelledby="titre-vocabulaire">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-vocabulaire" className="lg-titre">
            Vocabulaire
          </h2>
          <p className="lg-chapo">
            {TOUTES_LES_ENTREES.length} mots et expressions du quotidien, en {THEMES.length} thèmes, du niveau A1 au B2. Chaque mot revient au moment où ta mémoire allait le perdre.
          </p>
        </div>
        <div className="lg-section-actions">
          <button type="button" className="bouton" onClick={() => lancer({ titre: "Tous les thèmes", elements: tout, mode: "cartes" })}>
            <Layers className="size-4" aria-hidden="true" />
            Cartes mémoire
          </button>
          <button type="button" className="bouton bouton-principal" onClick={() => lancer({ titre: "Tous les thèmes", elements: tout, mode: "guidee" })}>
            <Play className="size-4" fill="currentColor" aria-hidden="true" />
            {global.dus ? `Réviser ${global.dus} mot${global.dus > 1 ? "s" : ""}` : "Séance du jour"}
          </button>
        </div>
      </div>

      <ul className="lg-themes">
        {THEMES.map((t) => {
          const p = progresDe(
            t.entrees.map((e) => e.id),
            cartes,
          );
          const Icone = ICONES_THEMES[t.icone] ?? Layers;
          const vus = p.total - p.nouveau;
          return (
            <li key={t.id}>
              <button type="button" className="lg-theme" onClick={() => onOuvrir(t.id)}>
                <span className="lg-theme-icone" aria-hidden="true">
                  <Icone className="size-6" strokeWidth={1.5} />
                </span>
                <span className="lg-theme-nom">{t.nom}</span>
                <span className="lg-theme-desc">{t.description}</span>
                <span className="lg-theme-pied">
                  <BarreProgres p={p} fine />
                  <span className="lg-theme-chiffres">
                    {vus ? `${p.appris + p.maitrise}/${p.total} appris` : `${p.total} mots`}
                    {p.dus > 0 && <span className="lg-badge">{p.dus} à revoir</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DetailTheme({ theme, onRetour, lancer }: { theme: Theme; onRetour: () => void; lancer: (l: Lancement) => void }) {
  const { cartes, mots } = useDonnees();
  const [niveau, setNiveau] = useState<Niveau | null>(null);
  const entrees = useMemo(() => theme.entrees.filter((e) => !niveau || e.niveau === niveau), [theme, niveau]);
  const p = progresDe(
    entrees.map((e) => e.id),
    cartes,
  );
  const Icone = ICONES_THEMES[theme.icone] ?? Layers;
  const elements = entrees.map(elementDEntree);
  const reserve = theme.entrees.map(elementDEntree);
  const titre = niveau ? `${theme.nom} (${niveau})` : theme.nom;
  const dansDico = new Set(mots.map((m) => m.en.toLowerCase()));

  return (
    <section aria-labelledby="titre-theme">
      <button type="button" className="lg-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Tous les thèmes
      </button>
      <div className="lg-theme-entete">
        <span className="lg-theme-icone lg-theme-icone-grande" aria-hidden="true">
          <Icone className="size-8" strokeWidth={1.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titre-theme" className="lg-titre">
            {theme.nom}
          </h2>
          <p className="lg-chapo">{theme.description}</p>
          <div className="mt-4 max-w-md">
            <BarreProgres p={p} />
            <p className="lg-legende">
              <span data-m="maitrise">{p.maitrise} maîtrisés</span>
              <span data-m="appris">{p.appris} appris</span>
              <span data-m="en-cours">{p.enCours} en cours</span>
              <span>{p.nouveau} nouveaux</span>
            </p>
          </div>
        </div>
      </div>

      <div className="lg-lancements">
        <button type="button" className="lg-lancement" data-principal="" onClick={() => lancer({ titre, elements, reserve, mode: "guidee" })}>
          <Play className="size-5" fill="currentColor" aria-hidden="true" />
          <span>
            <strong>Séance guidée</strong>
            <small>{p.dus ? `${p.dus} à revoir, puis de nouveaux mots` : p.nouveau ? "Découvrir 5 nouveaux mots, puis les exercer" : "Tout est à jour"}</small>
          </span>
        </button>
        <button type="button" className="lg-lancement" onClick={() => lancer({ titre, elements, reserve, mode: "cartes" })}>
          <Layers className="size-5" aria-hidden="true" />
          <span>
            <strong>Cartes mémoire</strong>
            <small>Recto anglais, verso français, à toi de juger</small>
          </span>
        </button>
        <button type="button" className="lg-lancement" onClick={() => lancer({ titre, elements, reserve, mode: "guidee", libre: true })}>
          <Shuffle className="size-5" aria-hidden="true" />
          <span>
            <strong>Entraînement libre</strong>
            <small>Des exercices sur tout le thème, même à jour</small>
          </span>
        </button>
      </div>

      <div className="lg-filtres" role="group" aria-label="Niveau">
        <button type="button" className="lg-filtre" aria-pressed={niveau === null} onClick={() => setNiveau(null)}>
          Tous niveaux
        </button>
        {NIVEAUX.map((n) => (
          <button key={n} type="button" className="lg-filtre" aria-pressed={niveau === n} onClick={() => setNiveau(niveau === n ? null : n)}>
            {n}
            <small>{theme.entrees.filter((e) => e.niveau === n).length}</small>
          </button>
        ))}
      </div>

      <ul className="lg-liste-mots">
        {entrees.map((e) => {
          const m = maitrise(cartes.get(e.id));
          const ajoute = dansDico.has(e.en.toLowerCase());
          return (
            <li key={e.id} className="lg-ligne-mot">
              <Pastille m={m} />
              <div className="min-w-0 flex-1">
                <p className="lg-ligne-en" lang="en">
                  {e.en}
                  <span className="lg-ligne-api">{e.api}</span>
                </p>
                <p className="lg-ligne-fr">{e.fr}</p>
                <p className="lg-ligne-ex" lang="en">
                  {e.exEn}
                </p>
              </div>
              <span className="lg-niveau">{e.niveau}</span>
              {voixDisponible() && (
                <button type="button" className="bouton-icone" aria-label={`Écouter « ${e.en} »`} onClick={() => void parler(e.en)}>
                  <Volume2 className="size-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="bouton-icone"
                aria-label={ajoute ? "Déjà dans ton dictionnaire" : `Ajouter « ${e.en} » à ton dictionnaire`}
                title={ajoute ? "Déjà dans ton dictionnaire" : "Ajouter à mon dictionnaire"}
                data-actif={ajoute || undefined}
                disabled={ajoute}
                onClick={() => ajouterMot(nouveauMot({ en: e.en, fr: e.fr, nature: e.nature, phrase: e.exEn, phraseFr: e.exFr }, { type: "theme", titre: theme.nom, ref: theme.id }))}
              >
                {ajoute ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
