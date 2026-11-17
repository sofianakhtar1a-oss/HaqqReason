"use client";

import Link from "next/link";
import { BookMarked, BookOpenText, Headphones, House, Layers } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { Logo } from "@/components/Logo";
import { useAccesComplet } from "@/lib/client/acces";
import { Accueil } from "./Accueil";
import { useDonnees } from "./donnees";
import { Dictionnaire } from "./Dictionnaire";
import { Ecouter } from "./Ecouter";
import { Lire } from "./Lire";
import { type Lancement, Seance } from "./Seance";
import { Vocabulaire } from "./Vocabulaire";
import "../alambic/transcription/transcription.css";
import "./langues.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";

/*
 * Le Truchement : apprendre l'anglais (d'abord) depuis le français.
 * Cinq onglets, adressés par le fragment de l'URL (#vocabulaire/famille, #ecouter/<id>…),
 * pour que le bouton « retour » du téléphone et les favoris fonctionnent.
 */

type Onglet = "accueil" | "vocabulaire" | "ecouter" | "lire" | "dictionnaire";

const ONGLETS: { id: Onglet; nom: string; Icone: typeof House }[] = [
  { id: "accueil", nom: "Aujourd'hui", Icone: House },
  { id: "vocabulaire", nom: "Vocabulaire", Icone: Layers },
  { id: "ecouter", nom: "Écouter", Icone: Headphones },
  { id: "lire", nom: "Lire", Icone: BookOpenText },
  { id: "dictionnaire", nom: "Dictionnaire", Icone: BookMarked },
];

type Route = { onglet: Onglet; detail: string | null };

function lireRoute(): Route {
  const [o, ...reste] = decodeURIComponent(window.location.hash.slice(1)).split("/");
  const onglet = (ONGLETS.find((x) => x.id === o)?.id ?? "accueil") as Onglet;
  return { onglet, detail: reste.join("/") || null };
}

const sAbonner = () => () => undefined;

export function Truchement() {
  const monte = useSyncExternalStore(
    sAbonner,
    () => true,
    () => false,
  );
  const [route, setRoute] = useState<Route>({ onglet: "accueil", detail: null });
  const [seance, setSeance] = useState<Lancement | null>(null);
  const accesComplet = useAccesComplet();
  const { erreur } = useDonnees();

  useEffect(() => {
    const lire = () => setRoute(lireRoute());
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

  /** Change d'écran ; un écran de détail s'empile dans l'historique (le « retour » du téléphone le ferme). */
  const empile = useRef(false);
  const aller = useCallback((hash: string) => {
    const vide = hash === "accueil" || hash === "";
    const url = vide ? window.location.pathname : `#${hash}`;
    if (hash.includes("/")) {
      history.pushState(null, "", url);
      empile.current = true;
    } else {
      history.replaceState(null, "", url);
      empile.current = false;
    }
    setRoute(lireRoute());
    window.scrollTo({ top: 0 });
  }, []);

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

  const immersif = (route.onglet === "ecouter" || route.onglet === "lire") && Boolean(route.detail);

  return (
    <div className="lg lg-espace" data-accent="azur" data-immersif={immersif || undefined}>
      <header className="lg-tete sans-impression">
        <Logo />
        <span className="lg-tete-titre" aria-hidden="true">
          Le Truchement
        </span>
        <span className="lg-langues" title="Tu apprends l'anglais depuis le français">
          Anglais <span aria-hidden="true">›</span> français
        </span>
        <span className="flex-1" />
        <nav className="lg-onglets" aria-label="Le Truchement">
          {ONGLETS.map(({ id, nom, Icone }) => (
            <button key={id} type="button" className="lg-onglet" aria-current={route.onglet === id ? "page" : undefined} onClick={() => aller(id)}>
              <Icone className="size-4" aria-hidden="true" />
              {nom}
            </button>
          ))}
        </nav>
        <BoutonTheme />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie">
            Quitter
          </Link>
        )}
      </header>

      <main className="lg-scene">
        <h1 className="sr-only">Le Truchement, apprendre l&apos;anglais</h1>
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
          </>
        )}
      </main>

      <nav className="lg-barre-bas sans-impression" aria-label="Le Truchement">
        {ONGLETS.map(({ id, nom, Icone }) => (
          <button key={id} type="button" aria-current={route.onglet === id ? "page" : undefined} onClick={() => aller(id)}>
            <Icone className="size-5" strokeWidth={route.onglet === id ? 2.2 : 1.7} aria-hidden="true" />
            <span>{nom}</span>
          </button>
        ))}
      </nav>

      {seance && monte && <Seance key={`${seance.titre}-${seance.mode}`} lancement={seance} onFermer={() => setSeance(null)} />}
    </div>
  );
}
