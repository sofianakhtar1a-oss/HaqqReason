"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useArrivees } from "@/lib/client/synchro/useArrivees";
import { enregistrer, enregistrerMedia, lire, lireMedia, lister, type Resume, supprimer } from "@/lib/alambic/transcription/bibliotheque";
import { type Etape, transcrireFichier, transcrireYoutube } from "@/lib/alambic/transcription/client";
import type { Langue, Transcription as TypeTranscription } from "@/lib/alambic/transcription/types";
import { type Abonner, useReception } from "../reception";
import { Accueil } from "./Accueil";
import { Distillation } from "./Distillation";
import { Liseuse } from "./Liseuse";
import type { MediaLecture } from "./Lecteur";
import "./transcription.css";

type Phase =
  | { nom: "accueil" }
  | { nom: "distillation"; titre: string; langue: Langue | null; etape: Etape; progression: number; detail: { transcrits: number; total: number }; distillat: string[] }
  | { nom: "lecture"; t: TypeTranscription; media: MediaLecture };

const LIEN_LECTURE = "lire";

const MAGASINS_TRANSCRIPTIONS = ["transcriptions"] as const;

export function Transcription({ abonner }: { abonner: Abonner }) {
  const [phase, setPhase] = useState<Phase>({ nom: "accueil" });
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [biblio, setBiblio] = useState<Resume[]>([]);
  const annulation = useRef<AbortController | null>(null);
  const urlMedia = useRef<string | null>(null);

  const rafraichir = useCallback(() => void lister().then(setBiblio), []);
  useEffect(rafraichir, [rafraichir]);
  useArrivees(MAGASINS_TRANSCRIPTIONS, rafraichir);

  useReception(abonner, (fichiers) => {
    if (phase.nom !== "accueil") return;
    const f = fichiers.find((x) => /^(audio|video)\//.test(x.type)) ?? fichiers[0];
    if (f) setFichier(f);
  });

  const libererMedia = () => {
    if (urlMedia.current) URL.revokeObjectURL(urlMedia.current);
    urlMedia.current = null;
  };
  const mediaDe = (blob: Blob | undefined, video: boolean): MediaLecture => {
    libererMedia();
    if (!blob) return null;
    urlMedia.current = URL.createObjectURL(blob);
    return { type: "fichier", url: urlMedia.current, video };
  };
  useEffect(() => libererMedia, []);

  const ouvrirLecture = (t: TypeTranscription, media: MediaLecture) => {
    setPhase({ nom: "lecture", t, media });
    // Le bouton Retour du navigateur ramène à L'Alambic au lieu de quitter la page.
    history.pushState({ [LIEN_LECTURE]: t.id }, "", window.location.href);
  };

  useEffect(() => {
    const retour = () => {
      if (phase.nom === "lecture") {
        setPhase({ nom: "accueil" });
        rafraichir();
      }
    };
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, [phase.nom, rafraichir]);

  const lancer = async (source: { fichier: File } | { youtube: string }, langue: Langue | null) => {
    setErreur(null);
    const controle = new AbortController();
    annulation.current = controle;
    setPhase({
      nom: "distillation",
      titre: "fichier" in source ? source.fichier.name : "Vidéo YouTube",
      langue,
      etape: "preparation",
      progression: 0,
      detail: { transcrits: 0, total: 1 },
      distillat: [],
    });
    const maj = (m: Partial<Extract<Phase, { nom: "distillation" }>>) => setPhase((p) => (p.nom === "distillation" ? { ...p, ...m } : p));
    const suivi = {
      etape: (etape: Etape) => maj({ etape }),
      progression: (progression: number, detail: { transcrits: number; total: number }) => maj({ progression, detail }),
      distillat: (mots: string[]) => maj({ distillat: mots }),
    };
    const debut = Date.now();
    try {
      const t = "fichier" in source ? await transcrireFichier(source.fichier, langue, suivi, controle.signal) : await transcrireYoutube(source.youtube, langue, suivi, controle.signal);
      maj({ langue: (t.langue as Langue) ?? langue, titre: t.titre });
      // Laisser aux dernières gouttes le temps de tomber.
      await new Promise((r) => setTimeout(r, Math.max(900, 2600 - (Date.now() - debut))));
      if (controle.signal.aborted) return;
      await enregistrer(t).catch(() => undefined);
      if ("fichier" in source) await enregistrerMedia(t.id, source.fichier);
      setFichier(null);
      ouvrirLecture(t, "fichier" in source ? mediaDe(source.fichier, t.source.type === "fichier" && t.source.video) : { type: "youtube", id: source.youtube });
    } catch (e) {
      if (controle.signal.aborted) {
        setPhase({ nom: "accueil" });
        return;
      }
      setErreur(e instanceof Error ? e.message : "La transcription a échoué.");
      setPhase({ nom: "accueil" });
    }
  };

  const ouvrir = async (id: string) => {
    setErreur(null);
    const t = await lire(id).catch(() => undefined);
    if (!t) {
      setErreur("Cette transcription est introuvable sur l'appareil.");
      rafraichir();
      return;
    }
    if (t.source.type === "youtube") return ouvrirLecture(t, { type: "youtube", id: t.source.id });
    ouvrirLecture(t, mediaDe(await lireMedia(id), t.source.video));
  };

  const fermer = () => {
    libererMedia();
    setPhase({ nom: "accueil" });
    rafraichir();
    if (history.state?.[LIEN_LECTURE]) history.back();
  };

  const majLecture = useCallback((maj: Pick<TypeTranscription, "traductions" | "analyses">) => {
    setPhase((p) => {
      if (p.nom !== "lecture") return p;
      const t = { ...p.t, ...maj };
      void enregistrer(t).catch(() => undefined);
      return { ...p, t };
    });
  }, []);

  if (phase.nom === "distillation")
    return (
      <Distillation
        etape={phase.etape}
        progression={phase.progression}
        detail={phase.detail}
        distillat={phase.distillat}
        langue={phase.langue}
        titre={phase.titre}
        onAnnuler={() => annulation.current?.abort()}
      />
    );

  return (
    <>
      <Accueil
        fichier={fichier}
        onFichier={(f) => {
          setFichier(f);
          setErreur(null);
        }}
        onLancer={(s, l) => void lancer(s, l)}
        bibliotheque={biblio}
        onOuvrir={(id) => void ouvrir(id)}
        onSupprimer={(id) => void supprimer(id).then(rafraichir)}
        erreur={erreur}
      />
      {phase.nom === "lecture" && (
        <Liseuse
          key={phase.t.id}
          t={phase.t}
          media={phase.media}
          onFermer={fermer}
          onMaj={majLecture}
          onRebrancher={(f) => {
            setPhase((p) => (p.nom === "lecture" ? { ...p, media: mediaDe(f, /^video\//.test(f.type)) } : p));
            void enregistrerMedia(phase.t.id, f);
          }}
        />
      )}
    </>
  );
}
