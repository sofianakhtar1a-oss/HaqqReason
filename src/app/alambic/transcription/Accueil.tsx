"use client";

import { AudioLines, Cloud, FlaskConical, Link2, LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Resume } from "@/lib/alambic/transcription/bibliotheque";
import { apercuYoutube, type ApercuYoutube } from "@/lib/alambic/transcription/client";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { idYoutube } from "@/lib/alambic/transcription/lien";
import { type Langue, LANGUES } from "@/lib/alambic/transcription/types";
import { tailleLisible } from "@/lib/alambic/formats";

const SIGLES: Record<string, string> = { en: "EN", ar: "ع", es: "ES" };

type Props = {
  fichier: File | null;
  onFichier: (f: File | null) => void;
  onLancer: (source: { fichier: File } | { youtube: string }, langue: Langue | null) => void;
  bibliotheque: Resume[];
  onOuvrir: (id: string) => void;
  onSupprimer: (id: string) => void;
  erreur: string | null;
};

export function Accueil({ fichier, onFichier, onLancer, bibliotheque, onOuvrir, onSupprimer, erreur }: Props) {
  const choix = useRef<HTMLInputElement>(null);
  const [lien, setLien] = useState("");
  const [langue, setLangue] = useState<Langue | null>(null);
  const [apercus, setApercus] = useState<Record<string, (ApercuYoutube & { etat: "pret" }) | { etat: "introuvable" }>>({});
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [glisse, setGlisse] = useState(false);
  const id = idYoutube(lien);
  const apercu = id ? (apercus[id] ?? { etat: "chargement" as const }) : null;

  useEffect(() => {
    if (!id) return;
    const controle = new AbortController();
    apercuYoutube(id, controle.signal)
      .then((a) => setApercus((avant) => ({ ...avant, [id]: { ...a, etat: "pret" } })))
      .catch(() => !controle.signal.aborted && setApercus((avant) => ({ ...avant, [id]: { etat: "introuvable" } })));
    return () => controle.abort();
  }, [id]);

  const source = fichier ? { fichier } : id && apercu?.etat !== "introuvable" ? { youtube: id } : null;

  return (
    <section
      className="alambic-outil tr-accueil"
      aria-labelledby="tr-titre"
      data-glisse={glisse || undefined}
      onDragOver={(e) => {
        if (![...e.dataTransfer.types].includes("Files")) return;
        e.preventDefault();
        setGlisse(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setGlisse(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setGlisse(false);
        const f = e.dataTransfer.files[0];
        if (f) {
          onFichier(f);
          setLien("");
        }
      }}
    >
      <header className="tr-entete">
        <h2 id="tr-titre" className="tr-entete-titre">
          Transcrire
        </h2>
        <p className="tr-entete-aide">Un cours, un podcast, une conférence : le son devient un texte à lire, à écouter et à comprendre, mot à mot.</p>
      </header>

      <input
        ref={choix}
        type="file"
        hidden
        accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.opus,.flac,.aac,.mp4,.mov,.mkv,.webm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onFichier(f);
            setLien("");
          }
          e.target.value = "";
        }}
      />

      <div className="tr-sources">
        {fichier ? (
          <div className="tr-source tr-source-fichier" data-actif>
            <AudioLines className="size-7 text-or" strokeWidth={1.4} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate font-semibold" title={fichier.name}>
                {fichier.name}
              </span>
              <span className="text-sm text-encre-douce">{tailleLisible(fichier.size)}</span>
            </span>
            <button type="button" className="bouton-icone" aria-label="Retirer le fichier" onClick={() => onFichier(null)}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" className="tr-source tr-source-depot" onClick={() => choix.current?.click()} disabled={Boolean(id)}>
            <span className="tr-onde" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />
              ))}
            </span>
            <span className="font-display text-lg font-bold">Dépose un son ou une vidéo</span>
            <span className="text-sm text-encre-douce">MP3, M4A, WAV, MP4, MOV, WebM… jusqu&apos;à 6 heures</span>
          </button>
        )}

        <span className="tr-ou" aria-hidden="true">
          ou
        </span>

        <div className="tr-source tr-source-lien" data-actif={id ? "" : undefined} data-desactive={fichier ? "" : undefined}>
          <label htmlFor="tr-lien" className="font-display text-lg font-bold">
            Un lien YouTube
          </label>
          <div className="tr-champ">
            <Link2 className="size-5 text-encre-douce" aria-hidden="true" />
            <input
              id="tr-lien"
              type="url"
              inputMode="url"
              placeholder="https://youtu.be/…"
              value={lien}
              disabled={Boolean(fichier)}
              onChange={(e) => setLien(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {lien && (
              <button type="button" className="tr-champ-effacer" aria-label="Effacer le lien" onClick={() => setLien("")}>
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {lien && !id && <p className="text-sm text-danger">Ce lien n&apos;est pas celui d&apos;une vidéo YouTube.</p>}
          {id && (
            <div className="tr-vignette" data-etat={apercu?.etat}>
              {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par YouTube, taille fixe */}
              <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" width={160} height={90} loading="lazy" />
              <span className="min-w-0">
                {apercu?.etat === "pret" ? (
                  <>
                    <span className="tr-vignette-titre">{apercu.titre}</span>
                    <span className="text-sm text-encre-douce">{apercu.auteur}</span>
                  </>
                ) : apercu?.etat === "introuvable" ? (
                  <span className="text-sm text-danger">Vidéo introuvable ou privée.</span>
                ) : (
                  <span className="tr-ligne-attente" />
                )}
              </span>
            </div>
          )}
          <p className="text-xs text-encre-douce">Ses sous-titres (écrits ou automatiques) sont lus et synchronisés avec la vidéo.</p>
        </div>
      </div>

      <div className="tr-reglage" role="radiogroup" aria-label="Langue parlée">
        <span className="tr-reglage-nom">Langue parlée</span>
        <div className="alambic-segments">
          <button type="button" role="radio" aria-checked={langue === null} onClick={() => setLangue(null)}>
            Détecter
          </button>
          {LANGUES.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={langue === l.id} onClick={() => setLangue(l.id)} lang={l.id} className={l.id === "ar" ? "tr-arabe-court" : undefined}>
              {l.natif}
            </button>
          ))}
        </div>
      </div>

      <div className="alambic-actions">
        <button type="button" className="bouton bouton-principal alambic-lancer" disabled={!source} onClick={() => source && onLancer(source, langue)}>
          <FlaskConical className="size-5" aria-hidden="true" />
          Transcrire
        </button>
        <p className="tr-note">
          <Cloud className="size-4 shrink-0" aria-hidden="true" />
          Pour cet outil, le son part chez Groq, qui le transcrit avec Whisper. Le texte, lui, reste sur ton appareil.
        </p>
      </div>

      {erreur && (
        <p className="message message-erreur" role="alert">
          {erreur}
        </p>
      )}

      {bibliotheque.length > 0 && (
        <section className="tr-biblio" aria-labelledby="tr-biblio-titre">
          <h3 id="tr-biblio-titre" className="tr-biblio-titre">
            Tes transcriptions
          </h3>
          <ul>
            {bibliotheque.map((r) => (
              <li key={r.id} className="tr-biblio-ligne">
                <button type="button" className="tr-biblio-ouvrir" onClick={() => onOuvrir(r.id)}>
                  <span className="tr-sigle" data-langue={r.langue} aria-hidden="true">
                    {SIGLES[r.langue] ?? r.langue.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" dir="auto">
                      {r.titre}
                    </span>
                    <span className="text-sm text-encre-douce">
                      {dureeLisible(r.duree)} · {r.source.type === "youtube" ? "YouTube" : "fichier"} · {new Date(r.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {r.traduites > 0 && ` · traduit à ${Math.min(100, Math.round((r.traduites / r.nbPhrases) * 100))} %`}
                    </span>
                  </span>
                </button>
                {aSupprimer === r.id ? (
                  <button
                    type="button"
                    className="tr-biblio-confirmer"
                    onClick={() => {
                      onSupprimer(r.id);
                      setASupprimer(null);
                    }}
                    onBlur={() => setASupprimer(null)}
                    autoFocus
                  >
                    Supprimer ?
                  </button>
                ) : (
                  <button type="button" className="bouton-icone" aria-label={`Supprimer « ${r.titre} »`} onClick={() => setASupprimer(r.id)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function Chargement() {
  return (
    <p className="alambic-etape">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      Ouverture…
    </p>
  );
}
