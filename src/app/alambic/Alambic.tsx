"use client";

import Link from "next/link";
import { Captions, Cloud, Eraser, EyeOff, FileStack, Layers, LayoutGrid, LockOpen, ScanText, Scissors, ShieldCheck, Shrink, Shuffle, Signature, Stamp, WifiOff, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { Logo } from "@/components/Logo";
import { FAMILLES, FORMATS } from "@/lib/alambic/formats";
import { CAPACITES_PAR_DEFAUT, type Capacites } from "@/lib/alambic/graphe";
import type { Intention } from "@/lib/alambic/intentions";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { estOutil, parGroupes, TOUS_LES_OUTILS, type Outil } from "@/lib/alambic/outils";
import { useAccesComplet } from "@/lib/client/acces";
import { useResolu, useTextes } from "@/lib/modules/textes-client";
import { ContexteAlambic, type FicheOutil, type ValeurAlambic } from "./contexte";
import { Convertisseur } from "./Convertisseur";
import { Decoupe } from "./Decoupe";
import { Deverrouillage } from "./outils/Deverrouillage";
import { Etagere, type Rangement } from "./Etagere";
import { Filigrane } from "./outils/Filigrane";
import { Masquage } from "./outils/Masquage";
import { Fusion } from "./Fusion";
import { Allegement } from "./outils/Allegement";
import { Navigation } from "./Navigation";
import { Nettoyage } from "./outils/Nettoyage";
import { Organisation } from "./outils/Organisation";
import { Protection } from "./Protection";
import type { Abonner } from "./reception";
import { Rassembler } from "./outils/Rassembler";
import { Reconnaissance } from "./outils/Reconnaissance";
import { ICONES } from "./SelecteurFormat";
import { Signature as OutilSignature } from "./outils/Signature";
import { Transcription } from "./transcription/Transcription";
import "./studio.css";

const ICONES_OUTILS: Record<Outil, LucideIcon> = {
  convertir: Shuffle,
  fusionner: Layers,
  decouper: Scissors,
  proteger: ShieldCheck,
  transcrire: Captions,
  organiser: LayoutGrid,
  alleger: Shrink,
  filigraner: Stamp,
  signer: Signature,
  deverrouiller: LockOpen,
  nettoyer: Eraser,
  reconnaitre: ScanText,
  masquer: EyeOff,
  rassembler: FileStack,
};

/** Outils encore en préparation : présents dans le code, pas encore dans le menu. */
const EN_PREPARATION = new Set<Outil>([]);

/** Les outils sous les noms choisis par le créateur (mode créateur › L'Alambic), rangés par famille. */
function useOutils(): FicheOutil[] {
  const resolu = useResolu("alambic");
  return useMemo(() => {
    const liste = (resolu?.listes.outils ?? TOUS_LES_OUTILS.map((id) => ({ id, valeurs: {} as Record<string, string> }))).filter((o): o is { id: Outil; valeurs: Record<string, string> } => estOutil(o.id) && !EN_PREPARATION.has(o.id));
    const fiches = liste.map((o) => ({ id: o.id, nom: o.valeurs.nom ?? o.id, aide: o.valeurs.aide ?? "", Icone: ICONES_OUTILS[o.id] }));
    // L'ordre affiché : famille par famille, comme dans le menu.
    return parGroupes(fiches).flatMap((g) => g.outils);
  }, [resolu]);
}

function outilDuLien(outils: { id: Outil }[]): Outil {
  const premier = outils[0]?.id ?? "convertir";
  if (typeof window === "undefined") return premier;
  const h = window.location.hash.slice(1);
  return outils.find((o) => o.id === h)?.id ?? premier;
}

const MAX_RESULTATS = 12;

export function Alambic() {
  const OUTILS = useOutils();
  const t = useTextes("alambic");
  const [outil, setOutil] = useState<Outil>(OUTILS[0]?.id ?? "convertir");
  const [intention, setIntention] = useState<Intention | null>(null);
  const [capacites, setCapacites] = useState<Capacites>(CAPACITES_PAR_DEFAUT);
  const [rangements, setRangements] = useState<Rangement[]>([]);
  // Fichiers collés (Ctrl+V) ou passés par un autre outil : remis à l'outil ouvert, qui s'y est abonné.
  const reception = useRef<((fichiers: File[]) => void) | null>(null);
  const enAttente = useRef<File[] | null>(null);
  const compteur = useRef(0);
  const scene = useRef<HTMLDivElement>(null);
  const abonner = useCallback<Abonner>((recevoir) => {
    reception.current = recevoir;
    if (recevoir && enAttente.current) {
      const fichiers = enAttente.current;
      enAttente.current = null;
      setTimeout(() => recevoir(fichiers), 0);
    }
  }, []);
  const accesComplet = useAccesComplet();

  useEffect(() => {
    const lire = () => setOutil(outilDuLien(OUTILS));
    lire();
    window.addEventListener("hashchange", lire);
    void import("@/lib/alambic/navigateur/medias").then((m) => m.capacites()).then(setCapacites);
    return () => window.removeEventListener("hashchange", lire);
  }, [OUTILS]);

  useEffect(() => {
    const coller = (e: ClipboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.isContentEditable)) return;
      const fichiers = [...(e.clipboardData?.files ?? [])];
      if (!fichiers.length) return;
      e.preventDefault();
      reception.current?.(fichiers.map((f, i) => (f.name === "image.png" || !f.name ? new File([f], `capture-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}${i ? `-${i}` : ""}.png`, { type: f.type }) : f)));
    };
    window.addEventListener("paste", coller);
    return () => window.removeEventListener("paste", coller);
  }, []);

  const afficher = useCallback(
    (o: Outil) => {
      setOutil(o);
      history.replaceState(null, "", o === OUTILS[0]?.id ? window.location.pathname : `#${o}`);
      // Si la page a défilé (téléphone, long résultat), l'outil revient en vue.
      const haut = scene.current?.getBoundingClientRect().top ?? 0;
      if (haut < 0) scene.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    },
    [OUTILS],
  );

  const choisir = (o: Outil) => {
    setIntention(null);
    afficher(o);
  };

  const envoyer = useCallback(
    (o: Outil, fichiers: File[]) => {
      setIntention(null);
      if (o === outil && reception.current) {
        reception.current(fichiers);
        return;
      }
      enAttente.current = fichiers;
      afficher(o);
    },
    [outil, afficher],
  );

  const ouvrirIntention = (i: Intention) => {
    setIntention(i);
    afficher(i.outil);
  };

  // Un résultat n'est rangé qu'une fois : retiré de l'étagère, il n'y revient pas au rendu suivant.
  const dejaNotes = useRef(new WeakSet<Blob>());
  const noter = useCallback((r: Resultat) => {
    if (dejaNotes.current.has(r.blob)) return;
    dejaNotes.current.add(r.blob);
    setRangements((liste) => (liste.some((x) => x.resultat.blob === r.blob) ? liste : [{ cle: ++compteur.current, resultat: r }, ...liste].slice(0, MAX_RESULTATS)));
  }, []);

  const valeur = useMemo<ValeurAlambic>(() => ({ outil, outils: OUTILS, envoyer, intention: intention?.outil === outil ? intention : null, noter }), [outil, OUTILS, envoyer, intention, noter]);

  return (
    <ContexteAlambic.Provider value={valeur}>
      <div className="alambic">
        <header className="alambic-tete sans-impression">
          <Logo />
          <span className="alambic-tete-titre" aria-hidden="true">
            {t("tete.titre")}
          </span>
          <span className="flex-1" />
          {outil === "transcrire" ? (
            <span className="alambic-local" data-nuage="" title="Pour transcrire, le son est envoyé à Groq (Whisper). Le texte est rangé dans ta bibliothèque.">
              <Cloud className="size-4" aria-hidden="true" />
              {t("badge.nuage")}
            </span>
          ) : outil === "rassembler" ? (
            <span className="alambic-local" title="Les documents, les photos et les scans sont lus sur ton appareil ; seuls les sons et les vidéos partent à la transcription (Groq).">
              <WifiOff className="size-4" aria-hidden="true" />
              {t("badge.mixte")}
            </span>
          ) : (
            <span className="alambic-local" title="Aucun fichier n'est envoyé : tout est calculé par ton appareil.">
              <WifiOff className="size-4" aria-hidden="true" />
              {t("badge.local")}
            </span>
          )}
          <BoutonTheme />
          <BoutonCompte />
          {accesComplet && (
            <Link href="/utilisateur" className="calame-sortie" data-portail="Les espaces" data-portail-sur="Mode utilisateur" data-portail-accent="or">
              Quitter
            </Link>
          )}
        </header>

        <main className="alambic-grille">
          <h1 className="sr-only">{t("meta.titre")}</h1>

          <Navigation outils={OUTILS} actif={outil} onChoisir={choisir} onIntention={ouvrirIntention} />

          <div className="alambic-scene verre" ref={scene}>
            {outil === "convertir" && <Convertisseur capacites={capacites} abonner={abonner} />}
            {outil === "fusionner" && <Fusion abonner={abonner} />}
            {outil === "decouper" && <Decoupe capacites={capacites} abonner={abonner} />}
            {outil === "proteger" && <Protection abonner={abonner} />}
            {outil === "transcrire" && <Transcription abonner={abonner} />}
            {outil === "organiser" && <Organisation abonner={abonner} />}
            {outil === "alleger" && <Allegement capacites={capacites} abonner={abonner} />}
            {outil === "filigraner" && <Filigrane abonner={abonner} />}
            {outil === "signer" && !EN_PREPARATION.has("signer") && <OutilSignature abonner={abonner} />}
            {outil === "deverrouiller" && <Deverrouillage abonner={abonner} />}
            {outil === "nettoyer" && <Nettoyage abonner={abonner} />}
            {outil === "masquer" && <Masquage abonner={abonner} />}
            {outil === "reconnaitre" && !EN_PREPARATION.has("reconnaitre") && <Reconnaissance abonner={abonner} />}
            {outil === "rassembler" && <Rassembler abonner={abonner} />}
          </div>

          <aside className="alambic-cotes" aria-label="À propos">
            <Etagere
              elements={rangements}
              onRetirer={(cle) => setRangements((l) => l.filter((x) => x.cle !== cle))}
              onVider={() => setRangements([])}
            />
            <div className="alambic-carte verre">
              <p className="alambic-chiffre">
                {FORMATS.length}
                <span> {t("formats")}</span>
              </p>
              <ul className="alambic-familles">
                {FAMILLES.map((f) => {
                  const Icone = ICONES[f.id];
                  return (
                    <li key={f.id}>
                      <Icone className="size-4" aria-hidden="true" />
                      <span>{f.nom}</span>
                      <span className="text-encre-douce">{FORMATS.filter((x) => x.famille === f.id).length}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {outil === "transcrire" ? (
              <div className="alambic-carte verre">
                <p className="font-display text-lg font-bold">{t("nuage.titre")}</p>
                <p className="text-sm text-encre-douce">{t("nuage.texte")}</p>
              </div>
            ) : outil === "rassembler" ? (
              <div className="alambic-carte verre">
                <p className="font-display text-lg font-bold">{t("mixte.titre")}</p>
                <p className="text-sm text-encre-douce">{t("mixte.texte")}</p>
              </div>
            ) : (
              <div className="alambic-carte verre">
                <p className="font-display text-lg font-bold">{t("local.titre")}</p>
                <p className="text-sm text-encre-douce">{t("local.texte")}</p>
              </div>
            )}
            {(!capacites.aac || !capacites.h264) && (
              <div className="alambic-carte verre">
                <p className="text-sm text-encre-douce">
                  Ton navigateur ne sait pas produire {[!capacites.h264 && "de vidéo MP4", !capacites.aac && "d'AAC (M4A)"].filter(Boolean).join(" ni ")}. Ces choix sont grisés ; Chrome, Edge et Safari les proposent.
                </p>
              </div>
            )}
            <section className="alambic-carte verre alambic-faq" aria-labelledby="titre-faq">
              <h2 id="titre-faq" className="font-display text-lg font-bold">
                {t("faq.titre")}
              </h2>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <details key={n}>
                  <summary>{t(`faq.${n}.q`)}</summary>
                  <p className="text-sm text-encre-douce">{t(`faq.${n}.r`)}</p>
                </details>
              ))}
            </section>
          </aside>
        </main>
      </div>
    </ContexteAlambic.Provider>
  );
}
