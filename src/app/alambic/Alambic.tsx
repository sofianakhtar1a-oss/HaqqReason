"use client";

import Link from "next/link";
import { Captions, Cloud, Layers, Scissors, ShieldCheck, Shuffle, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { Logo } from "@/components/Logo";
import { FAMILLES, FORMATS } from "@/lib/alambic/formats";
import { CAPACITES_PAR_DEFAUT, type Capacites } from "@/lib/alambic/graphe";
import { useAccesComplet } from "@/lib/client/acces";
import { useResolu, useTextes } from "@/lib/modules/textes-client";
import { Convertisseur } from "./Convertisseur";
import { Decoupe } from "./Decoupe";
import { Fusion } from "./Fusion";
import { Protection } from "./Protection";
import type { Abonner } from "./reception";
import { ICONES } from "./SelecteurFormat";
import { Transcription } from "./transcription/Transcription";

type Outil = "convertir" | "fusionner" | "decouper" | "proteger" | "transcrire";

const ICONES_OUTILS: Record<Outil, typeof Layers> = { convertir: Shuffle, fusionner: Layers, decouper: Scissors, proteger: ShieldCheck, transcrire: Captions };
const TOUS: Outil[] = ["convertir", "fusionner", "decouper", "proteger", "transcrire"];

/** Les outils dans l'ordre et sous les noms choisis par le créateur (mode créateur › L'Alambic). */
function useOutils() {
  const resolu = useResolu("alambic");
  return useMemo(() => {
    const liste = (resolu?.listes.outils ?? TOUS.map((id) => ({ id, valeurs: {} as Record<string, string> }))).filter((o): o is { id: Outil; valeurs: Record<string, string> } => TOUS.includes(o.id as Outil));
    return liste.map((o) => ({ id: o.id, nom: o.valeurs.nom ?? o.id, aide: o.valeurs.aide ?? "", Icone: ICONES_OUTILS[o.id] }));
  }, [resolu]);
}

function outilDuLien(outils: { id: Outil }[]): Outil {
  const premier = outils[0]?.id ?? "convertir";
  if (typeof window === "undefined") return premier;
  const h = window.location.hash.slice(1);
  return outils.find((o) => o.id === h)?.id ?? premier;
}

export function Alambic() {
  const OUTILS = useOutils();
  const t = useTextes("alambic");
  const [outil, setOutil] = useState<Outil>(OUTILS[0]?.id ?? "convertir");
  const [capacites, setCapacites] = useState<Capacites>(CAPACITES_PAR_DEFAUT);
  // Fichiers collés (Ctrl+V) : remis à l'outil ouvert, qui s'y est abonné.
  const reception = useRef<((fichiers: File[]) => void) | null>(null);
  const abonner = useCallback<Abonner>((recevoir) => {
    reception.current = recevoir;
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

  const choisir = (o: Outil) => {
    setOutil(o);
    history.replaceState(null, "", o === OUTILS[0]?.id ? window.location.pathname : `#${o}`);
  };

  return (
    <div className="alambic">
      <header className="alambic-tete sans-impression">
        <Logo />
        <span className="alambic-tete-titre" aria-hidden="true">
          {t("tete.titre")}
        </span>
        <span className="flex-1" />
        {outil === "transcrire" ? (
          <span className="alambic-local" data-nuage="" title="Pour transcrire, le son est envoyé à Groq (Whisper). Le texte reste sur ton appareil.">
            <Cloud className="size-4" aria-hidden="true" />
            {t("badge.nuage")}
          </span>
        ) : (
          <span className="alambic-local" title="Aucun fichier n'est envoyé : tout est calculé par ton appareil.">
            <WifiOff className="size-4" aria-hidden="true" />
            {t("badge.local")}
          </span>
        )}
        <BoutonTheme />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie">
            Quitter
          </Link>
        )}
      </header>

      <main className="alambic-grille">
        <h1 className="sr-only">{t("meta.titre")}</h1>

        <nav className="alambic-outils" aria-label="Outils">
          {OUTILS.map(({ id, nom, aide, Icone }) => (
            <button key={id} type="button" className="alambic-tuile" aria-pressed={outil === id} onClick={() => choisir(id)}>
              <Icone className="size-6" strokeWidth={1.5} aria-hidden="true" />
              <span className="alambic-tuile-nom">{nom}</span>
              <span className="alambic-tuile-aide">{aide}</span>
            </button>
          ))}
        </nav>

        <div className="alambic-scene verre">
          {outil === "convertir" && <Convertisseur capacites={capacites} abonner={abonner} />}
          {outil === "fusionner" && <Fusion abonner={abonner} />}
          {outil === "decouper" && <Decoupe capacites={capacites} abonner={abonner} />}
          {outil === "proteger" && <Protection abonner={abonner} />}
          {outil === "transcrire" && <Transcription abonner={abonner} />}
        </div>

        <aside className="alambic-cotes" aria-label="À propos">
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
        </aside>
      </main>
    </div>
  );
}
