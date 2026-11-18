"use client";

import Link from "next/link";
import { BookMarked, BookOpenText, Headphones, House, Layers, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { Logo } from "@/components/Logo";
import { useAccesComplet } from "@/lib/client/acces";
import { mouvementReduit } from "@/lib/langues/feux";
import { useResolu, useTextes } from "@/lib/modules/textes-client";
import { Accueil } from "./Accueil";
import { useDonnees } from "./donnees";
import { Dictionnaire } from "./Dictionnaire";
import { Ecouter } from "./Ecouter";
import { Lire } from "./Lire";
import { Regles } from "./regles/Regles";
import { type Lancement, Seance } from "./Seance";
import { Vocabulaire } from "./Vocabulaire";
import "../alambic/transcription/transcription.css";
import "./langues.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";

/*
 * Le Truchement : apprendre l'anglais (d'abord) depuis le français.
 * Six onglets, adressés par le fragment de l'URL (#vocabulaire/famille, #ecouter/<id>…),
 * pour que le bouton « retour » du téléphone et les favoris fonctionnent.
 */

type Onglet = "accueil" | "vocabulaire" | "ecouter" | "lire" | "dictionnaire" | "regles";

const ICONES_ONGLETS: Record<Onglet, typeof House> = { accueil: House, vocabulaire: Layers, ecouter: Headphones, lire: BookOpenText, dictionnaire: BookMarked, regles: Sparkles };
const TOUS: Onglet[] = ["accueil", "vocabulaire", "ecouter", "lire", "dictionnaire", "regles"];

type Route = { onglet: Onglet; detail: string | null };

function lireRoute(onglets: { id: Onglet }[]): Route {
  const [o, ...reste] = decodeURIComponent(window.location.hash.slice(1)).split("/");
  const trouve = onglets.find((x) => x.id === o)?.id;
  return { onglet: trouve ?? onglets[0]?.id ?? "accueil", detail: trouve ? reste.join("/") || null : null };
}

const sAbonner = () => () => undefined;

/** Le point d'où part la transition (l'onglet touché), en coordonnées de l'écran. */
type Depuis = { x: number; y: number };
const depuisClic = (e: React.MouseEvent<HTMLElement>): Depuis => {
  const r = e.currentTarget.getBoundingClientRect();
  // Un clic au clavier n'a pas de coordonnées : on part du centre de l'onglet.
  return e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/**
 * Change d'onglet avec une transition : la nouvelle page s'ouvre en cercle depuis l'onglet touché,
 * l'ancienne recule et s'efface. Navigateurs sans View Transitions, ou mouvement réduit : changement direct.
 */
function transition(scene: HTMLElement | null, depuis: Depuis | undefined, appliquer: () => void) {
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  if (!depuis || !scene || !doc.startViewTransition || mouvementReduit()) return appliquer();
  const r = scene.getBoundingClientRect();
  const racine = document.documentElement;
  racine.style.setProperty("--vt-x", `${Math.round(depuis.x - r.left)}px`);
  racine.style.setProperty("--vt-y", `${Math.round(depuis.y - r.top)}px`);
  racine.dataset.lgTransition = "";
  doc
    .startViewTransition(() => flushSync(appliquer))
    .finished.catch(() => undefined)
    .finally(() => delete racine.dataset.lgTransition);
}

/** Une lueur douce suit le pointeur (souris ou stylet seulement), teintée selon l'onglet. */
function Lueur() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || mouvementReduit()) return;
    let image = 0;
    let x = 0;
    let y = 0;
    const bouger = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (image) return;
      image = requestAnimationFrame(() => {
        image = 0;
        ref.current?.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0)`);
      });
    };
    window.addEventListener("pointermove", bouger, { passive: true });
    return () => {
      window.removeEventListener("pointermove", bouger);
      cancelAnimationFrame(image);
    };
  }, []);
  return <div ref={ref} className="lg-lueur" aria-hidden="true" />;
}

export function Truchement() {
  const monte = useSyncExternalStore(
    sAbonner,
    () => true,
    () => false,
  );
  const resolu = useResolu("langues");
  const t = useTextes("langues");
  // Les onglets dans l'ordre et sous les noms choisis par le créateur ; au moins un reste toujours.
  const ONGLETS = useMemo(() => {
    const liste = (resolu?.listes.onglets ?? TOUS.map((id) => ({ id, valeurs: {} as Record<string, string> }))).filter((o): o is { id: Onglet; valeurs: Record<string, string> } => TOUS.includes(o.id as Onglet));
    const sortie = liste.map((o) => ({ id: o.id, nom: o.valeurs.nom ?? o.id, Icone: ICONES_ONGLETS[o.id] }));
    return sortie.length ? sortie : [{ id: "accueil" as Onglet, nom: "Aujourd'hui", Icone: House }];
  }, [resolu]);
  const premier = ONGLETS[0].id;
  const [route, setRoute] = useState<Route>({ onglet: premier, detail: null });
  const [seance, setSeance] = useState<Lancement | null>(null);
  const accesComplet = useAccesComplet();
  const { erreur } = useDonnees();

  useEffect(() => {
    const lire = () => setRoute(lireRoute(ONGLETS));
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [ONGLETS]);

  /** Change d'écran ; un écran de détail s'empile dans l'historique (le « retour » du téléphone le ferme). */
  const empile = useRef(false);
  const scene = useRef<HTMLElement>(null);
  const aller = useCallback((hash: string) => {
    const vide = hash === premier || hash === "";
    const url = vide ? window.location.pathname : `#${hash}`;
    if (hash.includes("/")) {
      history.pushState(null, "", url);
      empile.current = true;
    } else {
      history.replaceState(null, "", url);
      empile.current = false;
    }
    setRoute(lireRoute(ONGLETS));
    window.scrollTo({ top: 0 });
  }, [ONGLETS, premier]);
  /** Un onglet touché : la même navigation, avec la transition créative. */
  const versOnglet = useCallback(
    (id: Onglet, e: React.MouseEvent<HTMLElement>) => {
      const depuis = depuisClic(e);
      if (route.onglet === id && !route.detail) return;
      transition(scene.current, depuis, () => aller(id));
    },
    [aller, route.onglet, route.detail],
  );

  const detail = useCallback(
    (onglet: Onglet) => (id: string | null) => {
      if (id) aller(`${onglet}/${id}`);
      else if (empile.current) {
        empile.current = false;
        history.back();
      } else aller(onglet);
    },
    [aller],
  );
  const ouvrirTheme = useCallback((id: string | null) => detail("vocabulaire")(id), [detail]);
  const ouvrirMedia = useCallback((id: string | null) => detail("ecouter")(id), [detail]);
  const ouvrirDocument = useCallback((id: string | null) => detail("lire")(id), [detail]);
  const ouvrirRegles = useCallback((id: string | null) => detail("regles")(id), [detail]);
  /** Dans les Règles, passer d'une leçon à la carte ou à la leçon suivante remplace l'écran au lieu de l'empiler. */
  const remplacerRegles = useCallback(
    (chemin: string) => {
      history.replaceState(null, "", `#regles/${chemin}`);
      setRoute(lireRoute(ONGLETS));
      window.scrollTo({ top: 0 });
    },
    [ONGLETS],
  );

  const immersif = (route.onglet === "ecouter" || route.onglet === "lire") && Boolean(route.detail);

  return (
    <div className="lg lg-espace" data-accent="azur" data-immersif={immersif || undefined} data-onglet={route.onglet}>
      <Lueur />
      <header className="lg-tete sans-impression">
        <Logo />
        <span className="lg-tete-titre" aria-hidden="true">
          {t("tete.titre")}
        </span>
        <span className="lg-langues" title="Tu apprends l'anglais depuis le français">
          {t("tete.langues")}
        </span>
        <span className="flex-1" />
        <nav className="lg-onglets" aria-label="Le Truchement">
          {ONGLETS.map(({ id, nom, Icone }) => (
            <button key={id} type="button" className="lg-onglet" aria-current={route.onglet === id ? "page" : undefined} onClick={(e) => versOnglet(id, e)}>
              <Icone className="size-4" aria-hidden="true" />
              {nom}
            </button>
          ))}
        </nav>
        <BoutonTheme />
        <BoutonCompte />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie">
            Quitter
          </Link>
        )}
      </header>

      <main ref={scene} className="lg-scene">
        <h1 className="sr-only">{t("meta.titre")}</h1>
        {erreur && (
          <p className="lg-erreur" role="alert">
            {erreur}
          </p>
        )}
        {!monte ? (
          <div className="lg-chargement" aria-hidden="true" />
        ) : (
          <>
            {route.onglet === "accueil" && <Accueil lancer={setSeance} aller={aller} />}
            {route.onglet === "vocabulaire" && <Vocabulaire themeId={route.detail} onOuvrir={ouvrirTheme} lancer={setSeance} />}
            {route.onglet === "ecouter" && <Ecouter ouvert={route.detail} onOuvrir={ouvrirMedia} />}
            {route.onglet === "lire" && <Lire ouvert={route.detail} onOuvrir={ouvrirDocument} />}
            {route.onglet === "dictionnaire" && <Dictionnaire lancer={setSeance} />}
            {route.onglet === "regles" && <Regles detail={route.detail} onOuvrir={ouvrirRegles} onRemplacer={remplacerRegles} />}
          </>
        )}
      </main>

      <nav className="lg-barre-bas sans-impression" aria-label="Le Truchement" style={{ gridTemplateColumns: `repeat(${ONGLETS.length}, 1fr)` }}>
        {ONGLETS.map(({ id, nom, Icone }) => (
          <button key={id} type="button" aria-current={route.onglet === id ? "page" : undefined} onClick={(e) => versOnglet(id, e)}>
            <Icone className="size-5" strokeWidth={route.onglet === id ? 2.2 : 1.7} aria-hidden="true" />
            <span>{nom}</span>
          </button>
        ))}
      </nav>

      {seance && monte && <Seance key={`${seance.titre}-${seance.mode}`} lancement={seance} onFermer={() => setSeance(null)} />}
    </div>
  );
}
