"use client";

import Link from "next/link";
import { Compass, Layers, Library, Map as IconeCarte, Swords } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { Logo } from "@/components/Logo";
import { useAccesComplet } from "@/lib/client/acces";
import { article } from "@/lib/monde/collection";
import { lireScore } from "@/lib/monde/compte-client";
import { useMonde } from "@/lib/monde/progression";
import { Boussole } from "./communs";
import { AideClavier, BoutonSon, useAideClavier } from "./Reglages";
import { ambiance } from "./sons";
import { useTraduction } from "./traduction";
import { useResolu, useTextes } from "@/lib/modules/textes-client";
import { Accueil } from "./Accueil";
import { Atlas } from "./Atlas";
import { PartieCabinet } from "./Cabinet";
import { Duels } from "./Duels";
import { Explorer } from "./Explorer";
import { Fiches } from "./Fiches";
import { Histoire, type SujetHistoire, SUJETS_HISTOIRE } from "./Histoire";
import { NommeLesTous } from "./NommeLesTous";
import { type Lancement, Partie } from "./Partie";
import "./portulan.css";
import "./portulan-rtl.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
// La police pour la dyslexie : ses fichiers ne se chargent que si le réglage est choisi.
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "@fontsource/opendyslexic/400-italic.css";
// L'arabe de l'interface : la police ne se charge que pour des lettres arabes.
import "@fontsource-variable/noto-sans-arabic";
import { ecouterInstallation, rafraichirHorsLigne } from "./HorsLigne";
import { MesureVitesse } from "./MesureVitesse";

/*
 * Le Portulan : apprendre la géographie. Cinq onglets, adressés par le fragment de l'URL
 * (#accueil/drapeaux, #carte/fr, #atlas/jp…), pour que le « retour » du téléphone et les
 * favoris fonctionnent. Une partie s'ouvre par-dessus, en plein écran.
 */

export type Onglet = "accueil" | "carte" | "fiches" | "atlas" | "duels";
const ICONES: Record<Onglet, typeof Compass> = { accueil: Compass, carte: IconeCarte, fiches: Layers, atlas: Library, duels: Swords };
const TOUS: Onglet[] = ["accueil", "carte", "fiches", "atlas", "duels"];

type Route = { onglet: Onglet; detail: string | null };

function lireRoute(onglets: { id: Onglet }[]): Route {
  const [o, ...reste] = decodeURIComponent(window.location.hash.slice(1)).split("/");
  const trouve = onglets.find((x) => x.id === o)?.id;
  return { onglet: trouve ?? onglets[0]?.id ?? "accueil", detail: trouve ? reste.join("/") || null : null };
}

const sAbonner = () => () => undefined;
const mouvementReduit = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Depuis = { x: number; y: number };
const depuisClic = (e: React.MouseEvent<HTMLElement>): Depuis => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Le nouvel écran s'ouvre en cercle depuis l'onglet touché (View Transitions), sinon directement. */
function transition(scene: HTMLElement | null, depuis: Depuis | undefined, appliquer: () => void) {
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  if (!depuis || !scene || !doc.startViewTransition || mouvementReduit()) return appliquer();
  const r = scene.getBoundingClientRect();
  const racine = document.documentElement;
  racine.style.setProperty("--vt-x", `${Math.round(depuis.x - r.left)}px`);
  racine.style.setProperty("--vt-y", `${Math.round(depuis.y - r.top)}px`);
  racine.dataset.ptTransition = "";
  doc
    .startViewTransition(() => flushSync(appliquer))
    .finished.catch(() => undefined)
    .finally(() => delete racine.dataset.ptTransition);
}

/** Une lueur safran suit le pointeur (souris seulement). */
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
  return <div ref={ref} className="pt-lueur" aria-hidden="true" />;
}

export function Portulan() {
  const monte = useSyncExternalStore(
    sAbonner,
    () => true,
    () => false,
  );
  const resolu = useResolu("monde");
  const t = useTextes("monde");
  const ONGLETS = useMemo(() => {
    const liste = (resolu?.listes.onglets ?? TOUS.map((id) => ({ id, valeurs: {} as Record<string, string> }))).filter((o): o is { id: Onglet; valeurs: Record<string, string> } => TOUS.includes(o.id as Onglet));
    const sortie = liste.map((o) => ({ id: o.id, nom: o.valeurs.nom ?? o.id, Icone: ICONES[o.id] }));
    return sortie.length ? sortie : [{ id: "accueil" as Onglet, nom: "Jouer", Icone: Compass }];
  }, [resolu]);
  const premier = ONGLETS[0].id;
  const [route, setRoute] = useState<Route>({ onglet: premier, detail: null });
  const [partie, setPartie] = useState<Lancement | null>(null);
  const accesComplet = useAccesComplet();
  const monde = useMonde();

  useEffect(() => {
    const lire = () => setRoute(lireRoute(ONGLETS));
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [ONGLETS]);

  // Le score du compte (et la présence du classement en ligne), une fois.
  useEffect(() => {
    void lireScore();
  }, []);

  // Les réglages de lecture valent pour toute la page (la taille du texte change la racine) ;
  // on les retire en quittant le Portulan.
  const p = monde.profil;
  useEffect(() => {
    const racine = document.documentElement;
    const classes: Record<string, boolean> = {
      "pt-daltonien": p.daltonien,
      "pt-contraste": p.contraste,
      "pt-dyslexie": p.police === "dyslexie",
      "pt-taille-115": p.taille === 115,
      "pt-taille-130": p.taille === 130,
    };
    for (const [c, oui] of Object.entries(classes)) racine.classList.toggle(c, oui);
    return () => {
      for (const c of Object.keys(classes)) racine.classList.remove(c);
    };
  }, [p.daltonien, p.contraste, p.police, p.taille]);

  // La mer et le vent, tant que le Portulan est ouvert.
  useEffect(() => ambiance(p.ambiance), [p.ambiance]);

  // L'interface en anglais ou en arabe (de droite à gauche).
  useTraduction(p.langue);
  // L'invitation à installer Le Portulan (elle n'arrive qu'une fois), et la copie hors ligne remise à jour.
  useEffect(() => ecouterInstallation(), []);
  useEffect(() => rafraichirHorsLigne(), []);

  // La touche « ? » : l'aide du clavier.
  const [aide, fermerAide] = useAideClavier();

  // Une partie se ferme : la route peut montrer ce qui s'est ouvert (le voilier, le cadenas).
  const avait = useRef(false);
  useEffect(() => {
    if (partie) avait.current = true;
    else if (avait.current) {
      avait.current = false;
      window.dispatchEvent(new Event("portulan:partie-fermee"));
    }
  }, [partie]);

  const empile = useRef(false);
  const scene = useRef<HTMLElement>(null);
  const aller = useCallback(
    (hash: string) => {
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
    },
    [ONGLETS, premier],
  );
  const versOnglet = useCallback(
    (id: Onglet, e: React.MouseEvent<HTMLElement>) => {
      const depuis = depuisClic(e);
      if (route.onglet === id && !route.detail) return;
      transition(scene.current, depuis, () => aller(id));
    },
    [aller, route.onglet, route.detail],
  );
  /** Ouvrir (ou refermer) un détail dans un onglet ; le « retour » du téléphone le referme. */
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

  return (
    <div className="pt pt-espace" data-accent="safran" data-onglet={route.onglet} data-globe={monde.profil.globe} style={{ "--pt-bateau": article(monde.profil.bateau)?.couleur ?? "var(--sa)" } as React.CSSProperties}>
      <Lueur />
      <MesureVitesse />
      <header className="pt-tete sans-impression">
        <Logo />
        <span className="pt-tete-titre" aria-hidden="true">
          {t("tete.titre")}
        </span>
        <span className="pt-pastille">{t("tete.sous")}</span>
        <span className="flex-1" />
        <nav className="pt-onglets" aria-label="Le Portulan">
          {ONGLETS.map(({ id, nom, Icone }) => (
            <button key={id} type="button" className="pt-onglet" aria-current={route.onglet === id ? "page" : undefined} onClick={(e) => versOnglet(id, e)}>
              <Icone className="size-4" aria-hidden="true" />
              {nom}
            </button>
          ))}
        </nav>
        <BoutonSon />
        <BoutonTheme />
        <BoutonCompte />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie" data-portail="Les espaces" data-portail-sur="Mode utilisateur" data-portail-accent="or">
            Quitter
          </Link>
        )}
      </header>

      <main ref={scene} className="pt-scene">
        <h1 className="sr-only">{t("meta.titre")}</h1>
        {!monte ? (
          <div className="pt-chargement" aria-hidden="true">
            <Boussole />
          </div>
        ) : (
          <>
            {route.onglet === "accueil" && <Accueil categorie={route.detail} onCategorie={detail("accueil")} lancer={setPartie} aller={aller} />}
            {route.onglet === "carte" && <Explorer focus={route.detail} onFocus={detail("carte")} />}
            {route.onglet === "fiches" && <Fiches />}
            {route.onglet === "atlas" && (SUJETS_HISTOIRE as string[]).includes(route.detail ?? "") ? (
              <Histoire sujet={route.detail as SujetHistoire} onRetour={() => detail("atlas")(null)} />
            ) : (
              route.onglet === "atlas" && <Atlas ouvert={route.detail} onOuvrir={detail("atlas")} aller={aller} />
            )}
            {route.onglet === "duels" && <Duels sous={route.detail} onSous={detail("duels")} />}
          </>
        )}
      </main>

      <nav className="pt-barre-bas sans-impression" aria-label="Le Portulan" style={{ gridTemplateColumns: `repeat(${ONGLETS.length}, 1fr)` }}>
        {ONGLETS.map(({ id, nom, Icone }) => (
          <button key={id} type="button" aria-current={route.onglet === id ? "page" : undefined} onClick={(e) => versOnglet(id, e)}>
            <Icone className="size-5" strokeWidth={route.onglet === id ? 2.2 : 1.7} aria-hidden="true" />
            <span>{nom}</span>
          </button>
        ))}
      </nav>

      {partie && monte && partie.sorte === "cabinet" && <PartieCabinet key={partie.cle} lancement={partie} onFermer={() => setPartie(null)} onRejouer={(l) => setPartie(l)} />}
      {partie && monte && partie.sorte === "nomme" && <NommeLesTous key={partie.cle} lancement={partie} onFermer={() => setPartie(null)} onRejouer={(l) => setPartie(l)} />}
      {partie && monte && partie.sorte !== "cabinet" && partie.sorte !== "nomme" && <Partie key={partie.cle} lancement={partie} onFermer={() => setPartie(null)} onRejouer={(l) => setPartie(l)} />}
      {aide && monte && <AideClavier onFermer={fermerAide} />}
    </div>
  );
}
