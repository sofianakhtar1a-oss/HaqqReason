"use client";

import Link from "next/link";
import { Captions, Cloud, Layers, MessageSquareQuote, Scissors, ShieldCheck, Shuffle, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { Logo } from "@/components/Logo";
import { FAMILLES, FORMATS } from "@/lib/alambic/formats";
import { CAPACITES_PAR_DEFAUT, type Capacites } from "@/lib/alambic/graphe";
import { useAccesComplet } from "@/lib/client/acces";
import { Convertisseur } from "./Convertisseur";
import { Decoupe } from "./Decoupe";
import { Fusion } from "./Fusion";
import { Protection } from "./Protection";
import type { Abonner } from "./reception";
import { ICONES } from "./SelecteurFormat";
import { Transcription } from "./transcription/Transcription";
import { Interroger } from "./carnet/Interroger";

type Outil = "convertir" | "fusionner" | "decouper" | "proteger" | "transcrire" | "interroger";

const OUTILS: { id: Outil; nom: string; aide: string; Icone: typeof Layers }[] = [
  { id: "convertir", nom: "Convertir", aide: "D'un format à l'autre, dans les deux sens", Icone: Shuffle },
  { id: "fusionner", nom: "Fusionner", aide: "Plusieurs fichiers, un seul PDF", Icone: Layers },
  { id: "decouper", nom: "Découper", aide: "Des pages, ou un passage d'un son, d'une vidéo", Icone: Scissors },
  { id: "proteger", nom: "Protéger", aide: "Un mot de passe, chiffré en AES-256", Icone: ShieldCheck },
  { id: "transcrire", nom: "Transcrire", aide: "Un son ou une vidéo devient un livre à lire", Icone: Captions },
  { id: "interroger", nom: "Interroger", aide: "Tes sources, un assistant qui cite tout", Icone: MessageSquareQuote },
];

function outilDuLien(): Outil {
  if (typeof window === "undefined") return "convertir";
  const h = window.location.hash.slice(1);
  return (OUTILS.find((o) => o.id === h)?.id ?? "convertir") as Outil;
}

export function Alambic() {
  const [outil, setOutil] = useState<Outil>("convertir");
  const [capacites, setCapacites] = useState<Capacites>(CAPACITES_PAR_DEFAUT);
  // Fichiers collés (Ctrl+V) : remis à l'outil ouvert, qui s'y est abonné.
  const reception = useRef<((fichiers: File[]) => void) | null>(null);
  const abonner = useCallback<Abonner>((recevoir) => {
    reception.current = recevoir;
  }, []);
  const accesComplet = useAccesComplet();

  useEffect(() => {
    const lire = () => setOutil(outilDuLien());
    lire();
    window.addEventListener("hashchange", lire);
    void import("@/lib/alambic/navigateur/medias").then((m) => m.capacites()).then(setCapacites);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

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
    history.replaceState(null, "", o === "convertir" ? window.location.pathname : `#${o}`);
  };

  return (
    <div className="alambic">
      <header className="alambic-tete sans-impression">
        <Logo />
        <span className="alambic-tete-titre" aria-hidden="true">
          L&apos;Alambic
        </span>
        <span className="flex-1" />
        {outil === "transcrire" || outil === "interroger" ? (
          <span className="alambic-local" data-nuage="" title={outil === "interroger" ? "Les passages utiles de tes sources sont envoyés à Gemini pour rédiger la réponse. Les carnets restent sur ton appareil." : "Pour transcrire, le son est envoyé à Groq (Whisper). Le texte reste sur ton appareil."}>
            <Cloud className="size-4" aria-hidden="true" />
            {outil === "interroger" ? "Les réponses passent par Gemini" : "Le son passe par Groq"}
          </span>
        ) : (
          <span className="alambic-local" title="Aucun fichier n'est envoyé : tout est calculé par ton appareil.">
            <WifiOff className="size-4" aria-hidden="true" />
            Rien ne quitte ton appareil
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
        <h1 className="sr-only">L&apos;Alambic, studio de fichiers</h1>

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
          {outil === "interroger" && <Interroger />}
        </div>

        <aside className="alambic-cotes" aria-label="À propos">
          <div className="alambic-carte verre">
            <p className="alambic-chiffre">
              {FORMATS.length}
              <span> formats</span>
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
          {outil === "interroger" ? (
            <div className="alambic-carte verre">
              <p className="font-display text-lg font-bold">Une exception, annoncée</p>
              <p className="text-sm text-encre-douce">
                Tes documents sont lus et découpés ici. Seuls les passages utiles à ta question sont envoyés à Gemini, qui rédige la réponse. Les carnets et les conversations restent sur ton appareil.
              </p>
            </div>
          ) : outil === "transcrire" ? (
            <div className="alambic-carte verre">
              <p className="font-display text-lg font-bold">Une exception, annoncée</p>
              <p className="text-sm text-encre-douce">
                Pour transcrire, le son est allégé ici puis envoyé à Groq, qui l&apos;écoute avec Whisper. Les textes et leurs traductions restent sur ton appareil, dans ta bibliothèque.
              </p>
            </div>
          ) : (
            <div className="alambic-carte verre">
              <p className="font-display text-lg font-bold">Tout se fait ici</p>
              <p className="text-sm text-encre-douce">
                Tes fichiers sont lus et transformés par ton propre appareil. Rien n&apos;est envoyé, rien n&apos;est gardé : ferme la page, il ne reste rien.
              </p>
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
