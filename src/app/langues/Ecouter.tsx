"use client";

import { AudioLines, Clapperboard, FileAudio, Link2, LoaderCircle, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { POIDS_MEDIA_MAX } from "@/lib/alambic/transcription/bibliotheque";
import { ErreurService, type Etape, transcrireFichier, transcrireYoutube } from "@/lib/alambic/transcription/client";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { idYoutube } from "@/lib/alambic/transcription/lien";
import { ecrire, ecrireBlob, listerMedias, lireUn, type MediaLangue, supprimerMedia } from "@/lib/langues/stockage";
import { BoutonSupprimer, ChoixLangue } from "./communs";
import { useTextes } from "@/lib/modules/textes-client";
import { Immersion } from "./Immersion";

/*
 * Écouter : un lien YouTube ou un fichier devient une leçon d'immersion.
 * La transcription (Whisper) et les traductions passent par les services de L'Alambic ;
 * le texte, les traductions et le fichier restent sur l'appareil.
 */

const ETAPES: Record<Etape, string> = { preparation: "Préparation du son", distillation: "Écoute et transcription", "mise-en-page": "Mise en phrases" };

type Travail = { nom: string; etape: Etape; progression: number; apercu: string[] };

export function Ecouter({ ouvert, onOuvrir }: { ouvert: string | null; onOuvrir: (id: string | null) => void }) {
  const [medias, setMedias] = useState<MediaLangue[] | null>(null);
  const [courant, setCourant] = useState<MediaLangue | null>(null);
  const [lien, setLien] = useState("");
  const [travail, setTravail] = useState<Travail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false);
  // La langue parlée dans la vidéo : l'anglais (traduit en français) ou le français (traduit en anglais).
  const [langue, setLangue] = useState<"en" | "fr">("en");
  const annulation = useRef<AbortController | null>(null);
  const t = useTextes("langues");

  const recharger = useCallback(() => void listerMedias().then(setMedias).catch(() => setMedias([])), []);
  useEffect(recharger, [recharger]);
  useEffect(() => () => annulation.current?.abort(), []);

  useEffect(() => {
    if (!ouvert) return;
    let fini = false;
    void lireUn<MediaLangue>("medias", ouvert).then((m) => {
      if (fini) return;
      if (m) setCourant(m);
      else onOuvrir(null);
    });
    return () => {
      fini = true;
    };
  }, [ouvert, onOuvrir]);

  const lancer = async (faire: (signal: AbortSignal, suivi: Parameters<typeof transcrireFichier>[2]) => Promise<MediaLangue>, nom: string) => {
    annulation.current?.abort();
    const c = new AbortController();
    annulation.current = c;
    setErreur(null);
    setTravail({ nom, etape: "preparation", progression: 0, apercu: [] });
    try {
      const m = await faire(c.signal, {
        etape: (etape) => setTravail((w) => w && { ...w, etape }),
        progression: (progression) => setTravail((w) => w && { ...w, progression }),
        distillat: (apercu) => setTravail((w) => w && { ...w, apercu }),
      });
      await ecrire("medias", m);
      setTravail(null);
      setLien("");
      recharger();
      onOuvrir(m.id);
    } catch (e) {
      setTravail(null);
      if (c.signal.aborted) return;
      setErreur(e instanceof ErreurService || e instanceof Error ? e.message : "La transcription a échoué.");
    }
  };

  const depuisLien = () => {
    const id = idYoutube(lien.trim());
    if (!id) {
      setErreur("Ce lien n'est pas une vidéo YouTube. Colle l'adresse complète (youtube.com/watch?v=… ou youtu.be/…).");
      return;
    }
    void lancer(async (signal, suivi) => ({ ...(await transcrireYoutube(id, langue, suivi, signal)), langue, vu: Date.now() }), "Vidéo YouTube");
  };

  const depuisFichier = (f: File) => {
    if (!f.type.startsWith("audio/") && !f.type.startsWith("video/") && !/\.(mp3|m4a|wav|ogg|opus|flac|aac|mp4|mov|mkv|webm)$/i.test(f.name)) {
      setErreur("Choisis un fichier son ou vidéo (MP3, M4A, WAV, MP4, WEBM…).");
      return;
    }
    void lancer(async (signal, suivi) => {
      const t = await transcrireFichier(f, langue, suivi, signal);
      if (f.size <= POIDS_MEDIA_MAX) await ecrireBlob(t.id, f).catch(() => undefined);
      return { ...t, langue, vu: Date.now() };
    }, f.name);
  };

  if (courant && courant.id === ouvert) return <Immersion key={courant.id} media={courant} onFermer={() => { onOuvrir(null); recharger(); }} />;

  return (
    <section aria-labelledby="titre-ecouter">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-ecouter" className="lg-titre">
            {t("ecouter.titre")}
          </h2>
          <p className="lg-chapo">{t("ecouter.chapo")}</p>
        </div>
      </div>

      {travail ? (
        <div className="lg-travail" role="status">
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin text-accent" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate font-semibold">{travail.nom}</p>
            <button type="button" className="bouton-icone" aria-label="Annuler" onClick={() => annulation.current?.abort()}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-sm text-encre-douce">
            {ETAPES[travail.etape]} · {Math.round(travail.progression * 100)} %
          </p>
          <span className="lg-travail-barre">
            <span style={{ transform: `scaleX(${Math.max(0.03, travail.progression)})` }} />
          </span>
          {travail.apercu.length > 0 && (
            <p className="lg-travail-apercu" lang="en">
              {travail.apercu.slice(0, 40).join(" ")}…
            </p>
          )}
        </div>
      ) : (
        <div className="lg-import">
          <ChoixLangue valeur={langue} onChange={setLangue} quoi="La vidéo ou le son est en" />
          <form
            className="lg-import-lien"
            onSubmit={(e) => {
              e.preventDefault();
              depuisLien();
            }}
          >
            <Link2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
            <input value={lien} onChange={(e) => setLien(e.target.value)} placeholder={t("ecouter.lien")} aria-label="Lien YouTube" inputMode="url" autoComplete="off" />
            <button type="submit" className="bouton bouton-principal" disabled={!lien.trim()}>
              Préparer
            </button>
          </form>
          <label
            className="lg-import-fichier"
            data-survol={survol || undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              const f = e.dataTransfer.files[0];
              if (f) depuisFichier(f);
            }}
          >
            <Upload className="size-5 text-accent" aria-hidden="true" />
            <span>
              <strong>Ou dépose un son, une vidéo</strong>
              <small>MP3, M4A, WAV, MP4, WEBM… jusqu&apos;à 6 heures</small>
            </span>
            <input type="file" accept="audio/*,video/*" className="sr-only" onChange={(e) => e.target.files?.[0] && depuisFichier(e.target.files[0])} />
          </label>
        </div>
      )}
      {erreur && (
        <p className="lg-erreur" role="alert">
          {erreur}
        </p>
      )}

      <h3 className="lg-sous-titre">Mes vidéos et sons</h3>
      {medias === null ? (
        <p className="text-encre-douce">Chargement…</p>
      ) : medias.length === 0 ? (
        <div className="lg-vide">
          <Clapperboard className="size-8" strokeWidth={1.3} aria-hidden="true" />
          <p>{t("ecouter.vide")}</p>
        </div>
      ) : (
        <ul className="lg-bibliotheque">
          {medias.map((m) => (
            <li key={m.id} className="lg-element">
              <button type="button" className="lg-element-ouvrir" onClick={() => onOuvrir(m.id)}>
                {m.source.type === "youtube" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="lg-vignette" src={`https://i.ytimg.com/vi/${m.source.id}/mqdefault.jpg`} alt="" loading="lazy" />
                ) : (
                  <span className="lg-vignette lg-vignette-son" aria-hidden="true">
                    {m.source.video ? <Clapperboard className="size-6" strokeWidth={1.4} /> : <AudioLines className="size-6" strokeWidth={1.4} />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="lg-element-titre" dir="auto">
                    {m.titre}
                  </span>
                  <span className="lg-element-infos">
                    {m.langue === "fr" ? "Français" : "Anglais"} · {m.source.type === "youtube" ? "YouTube" : <><FileAudio className="inline size-3.5" aria-hidden="true" /> Fichier</>} · {dureeLisible(m.duree)} · {m.phrases.length} phrases
                    {m.position ? ` · repris à ${dureeLisible(m.position)}` : ""}
                  </span>
                  {m.duree > 0 && (
                    <span className="lg-element-avancee">
                      <span style={{ transform: `scaleX(${Math.min(1, (m.position ?? 0) / m.duree)})` }} />
                    </span>
                  )}
                </span>
              </button>
              <BoutonSupprimer nom={m.titre} onSupprimer={() => void supprimerMedia(m.id).then(recharger)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
