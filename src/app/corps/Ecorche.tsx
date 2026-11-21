"use client";

import { GraduationCap, Layers, Moon, Rotate3d, Settings, Sun, Trophy, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { basculerTheme } from "@/components/BoutonTheme";
import { Logo } from "@/components/Logo";
import { useAppareil } from "@/lib/corps/appareil";
import type { CategorieId } from "@/lib/corps/niveaux";
import type { StructureScene } from "@/lib/corps/types";
import { regler, useEcorche } from "@/lib/corps/progression";
import { useTextes } from "@/lib/modules/textes-client";
import { Accueil } from "./Accueil";
import { type Calques, COUCHES_DEFAUT, type Couches } from "./communs";
import { Explorer } from "./Explorer";
import { Fiches } from "./Fiches";
import { chargerScene, type Scene } from "./moteur/chargement";
import { type Coupe, Corps3D, type Corps3DPoignee, type EtatStructure } from "./moteur/Corps3D";
import { type Lancement, Partie } from "./Partie";
import { Progres } from "./Progres";
import { Reglages } from "./Reglages";
import { Sources } from "./Sources";
import { NommeLesTous, CorpsMuet } from "./Jeux";
import "./ecorche.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/600.css";

/*
 * L'Écorché : apprendre le corps humain, couche par couche.
 *
 * Le corps est une scène unique, toujours là : chaque écran (apprendre, explorer, fiches, progrès,
 * une partie) le règle à sa façon — les couches montrées, la dissection, ce qui s'allume, où regarde
 * la caméra — et pose son panneau à côté. Les onglets sont adressés par le fragment de l'URL
 * (#explorer/biceps-brachial…), pour que le « retour » du téléphone et les favoris fonctionnent.
 */

export type Onglet = "apprendre" | "explorer" | "fiches" | "progres";
const ONGLETS: { id: Onglet; nom: string; Icone: typeof GraduationCap }[] = [
  { id: "apprendre", nom: "Apprendre", Icone: GraduationCap },
  { id: "explorer", nom: "Explorer", Icone: Rotate3d },
  { id: "fiches", nom: "Fiches", Icone: Layers },
  { id: "progres", nom: "Progrès", Icone: Trophy },
];

export type EtatScene = {
  couches: Couches;
  /** Les enveloppes qu'on ne montre pas d'office (fascias, gaines, bourses, séreuses). */
  calques: Calques;
  /** Les muscles dont on montre les surfaces d'insertion. */
  attaches: string[] | null;
  /** Les structures qu'on veut voir : ce qui les couvre s'efface. */
  decouvrir: string[] | null;
  profondeur: number;
  etats: Record<string, EtatStructure>;
  isoler: string[] | null;
  /** Les structures mises en avant : les autres passent en transparence (sans disparaître). */
  voiler: { ids: string[]; reste?: number } | null;
  rotation: boolean;
  etiquette: { id: string; texte: string; sous?: string } | null;
  /** Le corps en retrait (derrière un écran de lecture). */
  retrait: boolean;
  /** Les outils de l'atelier : un plan de coupe, la vue éclatée, le scalpel, le cœur qui bat et la poitrine qui respire. */
  coupe: Coupe | null;
  eclate: number;
  scalpel: boolean;
  vivant: { coeur?: boolean; souffle?: boolean } | null;
};

const SCENE_DEFAUT: EtatScene = { couches: COUCHES_DEFAUT, calques: {}, attaches: null, decouvrir: null, profondeur: 0, etats: {}, isoler: null, voiler: null, rotation: true, etiquette: null, retrait: false, coupe: null, eclate: 0, scalpel: false, vivant: null };
/** Ce qu'un écran qui ne le demande pas retrouve éteint. */
const PASSAGERS: Partial<EtatScene> = { calques: {}, attaches: null, decouvrir: null, voiler: null, coupe: null, eclate: 0, scalpel: false, vivant: null };

export type Stage = {
  scene: Scene | null;
  poignee: React.RefObject<Corps3DPoignee | null>;
  /** Règle la scène ; les enveloppes et les attaches s'éteignent si l'écran ne les demande pas. */
  regler: (s: Partial<EtatScene>) => void;
  /** Ce qui se passe quand on touche le corps (null : rien). */
  surChoix: (f: ((s: StructureScene | null) => void) | null) => void;
  surSurvol: (f: ((s: StructureScene | null) => void) | null) => void;
  /** Ce qui se passe quand le scalpel ôte une structure. */
  surOter: (f: ((s: StructureScene) => void) | null) => void;
};

export type Navigation = {
  aller: (hash: string) => void;
  jouer: (l: Lancement) => void;
  jeu: (j: Jeu) => void;
};

export type Jeu = { sorte: "nomme" | "muet"; categorie: Exclude<CategorieId, "corps">; grande: string; graine?: number };

type Route = { onglet: Onglet; detail: string | null };
function lireRoute(): Route {
  const [o, ...reste] = decodeURIComponent(window.location.hash.slice(1)).split("/");
  const trouve = ONGLETS.find((x) => x.id === o)?.id;
  return { onglet: trouve ?? "apprendre", detail: trouve ? reste.join("/") || null : null };
}

export function Ecorche() {
  const t = useTextes("corps");
  const etat = useEcorche();
  const appareil = useAppareil();
  const [route, setRoute] = useState<Route>({ onglet: "apprendre", detail: null });
  const [scene, setScene] = useState<Scene | null>(null);
  const [charge, setCharge] = useState(0);
  const [erreur, setErreur] = useState(false);
  const [vue, setVue] = useState<EtatScene>(SCENE_DEFAUT);
  const [partie, setPartie] = useState<Lancement | null>(null);
  const [jeu, setJeu] = useState<Jeu | null>(null);
  const [reglages, setReglages] = useState(false);
  const [sources, setSources] = useState(false);
  const poignee = useRef<Corps3DPoignee | null>(null);
  const choix = useRef<((s: StructureScene | null) => void) | null>(null);
  const survol = useRef<((s: StructureScene | null) => void) | null>(null);
  const oter = useRef<((s: StructureScene) => void) | null>(null);

  useEffect(() => {
    const lire = () => setRoute(lireRoute());
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

  // Le corps se fabrique une fois ; puis il apparaît couche par couche (les os, la chair, les tendons).
  useEffect(() => {
    let vivant = true;
    chargerScene((p) => vivant && setCharge(p))
      .then((s) => {
        if (vivant) setScene(s);
      })
      .catch(() => vivant && setErreur(true));
    return () => {
      vivant = false;
    };
  }, []);

  const stage = useMemo<Stage>(
    () => ({
      scene,
      poignee,
      regler: (s) => setVue((v) => ({ ...v, ...PASSAGERS, ...s })),
      surChoix: (f) => {
        choix.current = f;
      },
      surSurvol: (f) => {
        survol.current = f;
      },
      surOter: (f) => {
        oter.current = f;
      },
    }),
    [scene],
  );

  const aller = useCallback((hash: string) => {
    const url = hash ? `#${hash}` : window.location.pathname;
    if (hash.includes("/")) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    setRoute(lireRoute());
    document.querySelector(".ec-panneau")?.scrollTo({ top: 0 });
  }, []);
  // Une partie ouvre une page d’historique : le bouton « précédent » (ou le geste retour) la referme sans quitter L’Écorché.
  const ouvrirPartie = useCallback(() => {
    if (!window.history.state?.ecPartie) window.history.pushState({ ecPartie: true }, "", window.location.href);
  }, []);
  const fermerPartie = useCallback(() => {
    setPartie(null);
    setJeu(null);
    if (window.history.state?.ecPartie) window.history.back();
  }, []);
  useEffect(() => {
    const retour = () => {
      if (window.history.state?.ecPartie) return;
      setPartie(null);
      setJeu(null);
    };
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, []);
  const nav = useMemo<Navigation>(
    () => ({
      aller,
      jouer: (l) => {
        ouvrirPartie();
        setPartie({ ...l, graine: l.graine ?? Date.now() % 1_000_000_007 });
      },
      jeu: (j) => {
        ouvrirPartie();
        setJeu({ ...j, graine: j.graine ?? Date.now() % 1_000_000_007 });
      },
    }),
    [aller, ouvrirPartie],
  );

  // Les réglages de lecture valent pour toute la page ; on les retire en partant.
  const p = etat.profil;
  useEffect(() => {
    const racine = document.documentElement;
    racine.classList.toggle("ec-contraste", p.contraste);
    racine.classList.toggle("ec-taille-115", p.taille === 115);
    racine.classList.toggle("ec-taille-130", p.taille === 130);
    return () => {
      racine.classList.remove("ec-contraste", "ec-taille-115", "ec-taille-130");
    };
  }, [p.contraste, p.taille]);

  const enJeu = partie !== null || jeu !== null;
  const ecran = partie ? (
    <Partie key={partie.graine} lancement={partie} stage={stage} fermer={fermerPartie} relancer={(l) => setPartie({ ...l, graine: Date.now() % 1_000_000_007 })} />
  ) : jeu ? (
    jeu.sorte === "nomme" ? (
      <NommeLesTous key={jeu.graine} jeu={jeu} stage={stage} fermer={fermerPartie} />
    ) : (
      <CorpsMuet key={jeu.graine} jeu={jeu} stage={stage} fermer={fermerPartie} />
    )
  ) : route.onglet === "explorer" ? (
    <Explorer stage={stage} detail={route.detail} nav={nav} />
  ) : route.onglet === "fiches" ? (
    <Fiches stage={stage} nav={nav} />
  ) : route.onglet === "progres" ? (
    <Progres stage={stage} nav={nav} />
  ) : (
    <Accueil stage={stage} detail={route.detail} nav={nav} />
  );

  return (
    <div className={`ec-racine ${enJeu ? "est-en-jeu" : ""}`} data-onglet={enJeu ? "partie" : route.onglet}>
      <header className="ec-tete">
        <span className="ec-logo">
          <Logo />
        </span>
        <a className="ec-titre" href="#apprendre">
          <span className="ec-titre-nom">{t("tete.titre") || "L'Écorché"}</span>
          <span className="ec-titre-sous">{t("tete.sous") || "Anatomie"}</span>
        </a>
        {!enJeu && (
          <nav className="ec-onglets" aria-label="Sections de L'Écorché">
            {ONGLETS.map(({ id, nom, Icone }) => (
              <a key={id} href={`#${id}`} className="ec-onglet" aria-current={route.onglet === id ? "page" : undefined}>
                <Icone size={17} aria-hidden="true" />
                <span>{nom}</span>
              </a>
            ))}
          </nav>
        )}
        <div className="ec-tete-actions">
          <button type="button" className="ec-icone" onClick={() => regler({ son: !p.son })} aria-label={p.son ? "Couper le son" : "Remettre le son"} aria-pressed={!p.son}>
            {p.son ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </button>
          <button type="button" className="ec-icone" onClick={basculerTheme} aria-label="Changer de thème (clair ou sombre)">
            <Sun size={18} className="ec-theme-soleil" aria-hidden="true" />
            <Moon size={18} className="ec-theme-lune" aria-hidden="true" />
          </button>
          <button type="button" className="ec-icone" onClick={() => setReglages(true)} aria-label="Réglages">
            <Settings size={18} aria-hidden="true" />
          </button>
          <BoutonCompte />
        </div>
      </header>

      <main className="ec-corps">
        <section className={`ec-zone-scene ${vue.retrait ? "est-en-retrait" : ""}`} aria-label="Le corps en trois dimensions">
          <Corps3D
            ref={poignee}
            scene={scene}
            couches={vue.couches}
            calques={vue.calques}
            attaches={vue.attaches}
            decouvrir={vue.decouvrir}
            finesse={appareil.finesse}
            aspect={appareil.aspect}
            profondeur={vue.profondeur}
            etats={vue.etats}
            isoler={vue.isoler}
            voiler={vue.voiler}
            rotation={vue.rotation && p.rotation}
            etiquette={vue.etiquette}
            onChoisir={(s) => choix.current?.(s)}
            onSurvol={(s) => survol.current?.(s)}
            coupe={vue.coupe}
            eclate={vue.eclate}
            scalpel={vue.scalpel}
            onOter={(s) => oter.current?.(s)}
            vivant={vue.vivant}
          />
          {!scene && !erreur && (
            <div className="ec-chargement" role="status">
              <span className="ec-chargement-titre">Le corps se dessine…</span>
              <span className="ec-chargement-barre">
                <span style={{ transform: `scaleX(${Math.max(0.04, charge)})` }} />
              </span>
              <span className="ec-chargement-etape">{charge < 0.3 ? "Le squelette" : charge < 0.8 ? "Les muscles" : "Les tendons"}</span>
            </div>
          )}
          {erreur && (
            <div className="ec-chargement" role="alert">
              <span className="ec-chargement-titre">Le corps n’a pas pu s’afficher.</span>
              <span className="ec-chargement-etape">Ce navigateur ne dessine pas la 3D (WebGL 2). Essayez Chrome, Edge, Firefox ou Safari à jour.</span>
            </div>
          )}
        </section>
        <section className="ec-panneau" aria-live={enJeu ? "polite" : undefined}>
          {ecran}
          {!enJeu && (
            <p className="ec-credits">
              Modèles : Z-Anatomy et BodyParts3D, CC BY-SA.{" "}
              <button type="button" className="ec-lien" onClick={() => setSources(true)}>
                Sources et licences
              </button>
            </p>
          )}
        </section>
      </main>

      {!enJeu && (
        <nav className="ec-onglets-bas" aria-label="Sections de L'Écorché">
          {ONGLETS.map(({ id, nom, Icone }) => (
            <a key={id} href={`#${id}`} className="ec-onglet" aria-current={route.onglet === id ? "page" : undefined}>
              <Icone size={20} aria-hidden="true" />
              <span>{nom}</span>
            </a>
          ))}
        </nav>
      )}
      {reglages && <Reglages fermer={() => setReglages(false)} sources={() => setSources(true)} />}
      {sources && <Sources fermer={() => setSources(false)} />}
    </div>
  );
}
