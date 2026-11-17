"use client";

import { ArrowLeft, Captions, FileUp, Languages, ListVideo, MousePointerClick, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { motA, phraseA } from "@/lib/alambic/transcription/phrases";
import { type Phrase, texteDe, type Transcription } from "@/lib/alambic/transcription/types";
import { ecrire, ecrireBlob, lireBlob, type MediaLangue } from "@/lib/langues/stockage";
import { type Controle, controleElement, controleVide, controleYoutube, Horloge } from "../alambic/transcription/controle";
import type { Cible } from "../alambic/transcription/Glose";
import { useTraductions } from "../alambic/transcription/useTraductions";
import { GloseMot } from "./GloseMot";

/*
 * L'immersion : la vidéo au centre, la phrase dite en grand juste dessous, mot par mot.
 * Toucher un mot met en pause et le traduit dans sa phrase ; la phrase entière se traduit en français.
 * Le texte complet suit la voix, et chaque phrase y ramène.
 */

type Reglages = { francais: boolean; pauseAuMot: boolean; boucle: boolean; vitesse: number; texte: boolean };
const CLE = "haqqreason-truchement-immersion";
const VITESSES = [0.75, 0.9, 1];

function reglagesInitiaux(): Reglages {
  const defaut: Reglages = { francais: true, pauseAuMot: true, boucle: false, vitesse: 1, texte: true };
  try {
    return { ...defaut, ...(JSON.parse(localStorage.getItem(CLE) ?? "{}") as Partial<Reglages>), boucle: false };
  } catch {
    return defaut;
  }
}

type Media = { type: "fichier"; url: string; video: boolean } | { type: "youtube"; id: string } | null;

export function Immersion({ media: m, onFermer }: { media: MediaLangue; onFermer: () => void }) {
  const t = m;
  const dernier = useRef<MediaLangue>(m);
  const [media, setMedia] = useState<Media>(() => (m.source.type === "youtube" ? { type: "youtube", id: m.source.id } : null));
  const [reglages, setReglages] = useState<Reglages>(reglagesInitiaux);
  const controleRef = useRef<Controle>(controleVide);
  const [controle, setControle] = useState<Controle>(controleVide);
  const [horloge] = useState(() => new Horloge(controleRef));
  const [actif, setActif] = useState({ phrase: -1, mot: -1 });
  const actifRef = useRef(actif);
  const [lecture, setLecture] = useState(false);
  const [glose, setGlose] = useState<Cible | null>(null);
  const [tactile, setTactile] = useState(false);
  const element = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const hoteYt = useRef<HTMLDivElement>(null);
  const curseur = useRef<HTMLInputElement>(null);
  const temps = useRef<HTMLSpanElement>(null);
  const liste = useRef<HTMLOListElement>(null);
  const reglagesRef = useRef(reglages);
  useEffect(() => {
    reglagesRef.current = reglages;
  }, [reglages]);

  const enregistrer = useCallback((maj: Pick<Transcription, "traductions" | "analyses">) => {
    dernier.current = { ...dernier.current, ...maj };
    void ecrire("medias", dernier.current).catch(() => undefined);
  }, []);
  const { traductions, analyses, erreur, traduire, analyser } = useTraductions(t, enregistrer);

  // Le son ou la vidéo d'un fichier : gardé sur l'appareil.
  useEffect(() => {
    if (t.source.type !== "fichier") return;
    let url = "";
    let fini = false;
    void lireBlob(t.id).then((b) => {
      if (fini || !b) return;
      url = URL.createObjectURL(b);
      setMedia({ type: "fichier", url, video: t.source.type === "fichier" && t.source.video });
    });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [t]);

  // Branchement du lecteur.
  useEffect(() => {
    const brancher = (c: Controle | null) => {
      controleRef.current = c ?? controleVide;
      setControle(c ?? controleVide);
      if (c) {
        c.vitesse(reglagesRef.current.vitesse);
        if (t.position) c.aller(t.position);
      }
    };
    if (media?.type === "fichier" && element.current) {
      const el = element.current;
      const pret = () => brancher(controleElement(el));
      if (el.readyState >= 1) pret();
      else el.addEventListener("loadedmetadata", pret, { once: true });
      return () => {
        el.removeEventListener("loadedmetadata", pret);
        brancher(null);
      };
    }
    if (media?.type === "youtube" && hoteYt.current) {
      let fini = false;
      let detruire = () => undefined as void;
      const hote = document.createElement("div");
      hoteYt.current.replaceChildren(hote);
      void controleYoutube(hote, media.id).then((c) => {
        if (fini) return c.detruire();
        detruire = c.detruire;
        brancher(c);
      });
      return () => {
        fini = true;
        brancher(null);
        detruire();
      };
    }
  }, [media, t]);

  useEffect(() => {
    const maj = () => setLecture(controle.enLecture());
    maj();
    return controle.surEtat(maj);
  }, [controle]);

  // L'horloge : phrase et mot en cours, curseur, boucle sur la phrase.
  useEffect(() => {
    horloge.demarrer();
    const desabonner = horloge.abonner((s) => {
      const c = controleRef.current;
      const duree = t.duree || c.duree() || 1;
      if (curseur.current && document.activeElement !== curseur.current) curseur.current.value = String(Math.min(duree, s));
      if (temps.current) temps.current.textContent = dureeLisible(s);
      if (!c.pret()) return;
      const a = actifRef.current;
      if (reglagesRef.current.boucle && a.phrase >= 0 && c.enLecture()) {
        const ph = t.phrases[a.phrase];
        if (s > ph.fin + 0.15) {
          c.aller(ph.debut);
          return;
        }
      }
      const p = phraseA(t.phrases, s);
      const mo = p >= 0 && s <= t.phrases[p].fin + 0.6 ? motA(t.phrases[p], s) : -1;
      if (p !== a.phrase || mo !== a.mot) {
        actifRef.current = { phrase: p, mot: mo };
        setActif(actifRef.current);
      }
    });
    return () => {
      desabonner();
      horloge.arreter();
    };
  }, [horloge, t]);

  // Traduction de la phrase en cours et des voisines, par petits lots.
  const courante = Math.max(0, actif.phrase);
  useEffect(() => {
    if (!reglages.francais) return;
    traduire([courante - 1, courante, courante + 1, courante + 2, courante + 3].filter((x) => x >= 0 && x < t.phrases.length));
  }, [courante, reglages.francais, traduire, t.phrases.length]);

  useEffect(() => {
    if (glose) analyser(glose.phrase);
  }, [glose, analyser]);

  // Le texte complet suit la voix.
  useEffect(() => {
    if (!reglages.texte || actif.phrase < 0) return;
    const li = liste.current?.querySelector<HTMLElement>(`[data-id="${actif.phrase}"]`);
    const boite = liste.current;
    if (!li || !boite) return;
    const haut = li.offsetTop - boite.offsetTop;
    if (haut < boite.scrollTop + 40 || haut > boite.scrollTop + boite.clientHeight - 80) boite.scrollTo({ top: haut - boite.clientHeight / 3, behavior: "smooth" });
  }, [actif.phrase, reglages.texte]);

  // Position retenue, réglages retenus.
  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(reglages));
    } catch {
      // Navigation privée.
    }
  }, [reglages]);
  useEffect(() => {
    const garder = () => {
      const s = controleRef.current.temps();
      if (s <= 0) return;
      dernier.current = { ...dernier.current, position: s, vu: Date.now() };
      void ecrire("medias", dernier.current).catch(() => undefined);
    };
    const minuteur = setInterval(garder, 8000);
    window.addEventListener("pagehide", garder);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener("pagehide", garder);
      garder();
    };
  }, [t]);

  const aller = useCallback((s: number, jouer = true) => {
    controleRef.current.aller(s);
    if (jouer) controleRef.current.jouer();
  }, []);

  const versPhrase = useCallback(
    (d: number) => {
      const c = controleRef.current;
      const p = Math.max(0, actifRef.current.phrase);
      // « Précédente » au milieu d'une phrase : on la reprend d'abord au début.
      const cible = d < 0 && c.temps() - t.phrases[p].debut > 1.2 ? p : Math.min(t.phrases.length - 1, Math.max(0, p + d));
      aller(t.phrases[cible].debut, true);
    },
    [aller, t.phrases],
  );

  const basculer = useCallback(() => (controleRef.current.enLecture() ? controleRef.current.pause() : controleRef.current.jouer()), []);

  // Clavier : espace, flèches gauche/droite (phrase), R (répéter), Échap.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " ") {
        e.preventDefault();
        basculer();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        versPhrase(e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key.toLowerCase() === "r") versPhrase(0);
      else if (e.key === "Escape") {
        if (glose) setGlose(null);
        else onFermer();
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [basculer, glose, onFermer, versPhrase]);

  // Un clic hors de la carte la ferme.
  useEffect(() => {
    if (!glose || tactile) return;
    const dehors = (e: PointerEvent) => {
      const c = e.target as HTMLElement;
      if (c.closest(".tr-glose, .lg-st-mot")) return;
      setGlose(null);
    };
    window.addEventListener("pointerdown", dehors);
    return () => window.removeEventListener("pointerdown", dehors);
  }, [glose, tactile]);

  const toucherMot = (phrase: number, mot: number, el: HTMLElement, viaDoigt: boolean) => {
    setTactile(viaDoigt);
    if (reglages.pauseAuMot) controleRef.current.pause();
    setGlose({ phrase, mot, el, via: "toucher" });
  };

  const ph = actif.phrase >= 0 ? t.phrases[actif.phrase] : t.phrases[0];
  const precedente = actif.phrase > 0 ? t.phrases[actif.phrase - 1] : null;
  const suivante = t.phrases[(actif.phrase < 0 ? 0 : actif.phrase) + 1] ?? null;
  const video = media?.type === "youtube" || (media?.type === "fichier" && media.video);
  const phraseGlose = glose ? t.phrases[glose.phrase] : null;
  const duree = t.duree || controle.duree();

  return (
    <div className="lg-immersion" data-texte={reglages.texte || undefined}>
      <div className="lg-immersion-tete">
        <button type="button" className="lg-retour-lien" onClick={onFermer}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mes vidéos
        </button>
        <h2 className="lg-immersion-titre" dir="auto">
          {t.titre}
        </h2>
      </div>

      <div className="lg-immersion-grille">
        <div className="lg-immersion-principal">
          <div className="lg-ecran" data-video={video || undefined}>
            {media?.type === "fichier" &&
              (media.video ? (
                <video ref={element} src={media.url} playsInline preload="metadata" onClick={basculer} />
              ) : (
                <>
                  <audio ref={element} src={media.url} preload="metadata" />
                  <button type="button" className="lg-ecran-son" onClick={basculer} aria-label={lecture ? "Pause" : "Lecture"}>
                    <span className="lg-onde" data-lecture={lecture || undefined} aria-hidden="true">
                      {Array.from({ length: 24 }, (_, k) => (
                        <i key={k} style={{ ["--h" as string]: 0.25 + ((k * 37) % 70) / 100 }} />
                      ))}
                    </span>
                  </button>
                </>
              ))}
            {media?.type === "youtube" && <div ref={hoteYt} className="lg-youtube" />}
            {!media && t.source.type === "fichier" && (
              <label className="lg-rebrancher">
                <FileUp className="size-7" strokeWidth={1.4} aria-hidden="true" />
                <span className="font-semibold">Le fichier n&apos;est pas gardé sur cet appareil</span>
                <span className="text-sm text-encre-douce">Choisis à nouveau « {t.source.nom} » pour l&apos;écouter.</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void ecrireBlob(t.id, f).catch(() => undefined);
                    setMedia({ type: "fichier", url: URL.createObjectURL(f), video: f.type.startsWith("video/") });
                  }}
                />
              </label>
            )}
          </div>

          <div className="lg-soustitres" aria-live="off">
            {precedente && (
              <p className="lg-st-voisine" lang="en">
                <button type="button" onClick={() => aller(precedente.debut)}>
                  {texteDe(precedente)}
                </button>
              </p>
            )}
            <PhraseCliquable phrase={ph} actif={actif.phrase === ph.id ? actif.mot : -1} onMot={(i, el, doigt) => toucherMot(ph.id, i, el, doigt)} glose={glose?.phrase === ph.id ? glose.mot : -1} />
            {reglages.francais && (
              <p className="lg-st-fr" data-vide={!traductions[ph.id] || undefined}>
                {traductions[ph.id] ?? (erreur ? erreur : " ")}
              </p>
            )}
            {suivante && (
              <p className="lg-st-voisine" lang="en">
                <button type="button" onClick={() => aller(suivante.debut)}>
                  {texteDe(suivante)}
                </button>
              </p>
            )}
          </div>

          <div className="lg-commandes">
            <input
              ref={curseur}
              type="range"
              className="lg-curseur"
              min={0}
              max={Math.max(1, duree)}
              step={0.1}
              defaultValue={t.position ?? 0}
              aria-label="Position"
              onChange={(e) => controleRef.current.aller(Number(e.target.value))}
            />
            <div className="lg-commandes-rang">
              <span ref={temps} className="lg-temps">
                0:00
              </span>
              <span className="flex-1" />
              <button type="button" className="tr-cmd" aria-label="Phrase précédente" title="Phrase précédente (←)" onClick={() => versPhrase(-1)}>
                <SkipBack className="size-5" aria-hidden="true" />
              </button>
              <button type="button" className="lg-cmd-lecture" aria-label={lecture ? "Pause" : "Lecture"} onClick={basculer}>
                {lecture ? <Pause className="size-6" fill="currentColor" aria-hidden="true" /> : <Play className="size-6" fill="currentColor" aria-hidden="true" />}
              </button>
              <button type="button" className="tr-cmd" aria-label="Phrase suivante" title="Phrase suivante (→)" onClick={() => versPhrase(1)}>
                <SkipForward className="size-5" aria-hidden="true" />
              </button>
              <span className="flex-1" />
              <span className="lg-temps lg-temps-total">{dureeLisible(duree)}</span>
            </div>
            <div className="lg-options" role="group" aria-label="Options de lecture">
              <button type="button" className="lg-option" aria-pressed={reglages.boucle} onClick={() => setReglages((r) => ({ ...r, boucle: !r.boucle }))} title="Répéter la phrase en boucle">
                <Repeat className="size-4" aria-hidden="true" />
                Boucle
              </button>
              <button
                type="button"
                className="lg-option"
                onClick={() => {
                  const v = VITESSES[(VITESSES.indexOf(reglages.vitesse) + 1) % VITESSES.length];
                  controleRef.current.vitesse(v);
                  setReglages((r) => ({ ...r, vitesse: v }));
                }}
                title="Vitesse de lecture"
              >
                <span className="lg-option-vitesse">{String(reglages.vitesse).replace(".", ",")}×</span>
                Vitesse
              </button>
              <button type="button" className="lg-option" aria-pressed={reglages.francais} onClick={() => setReglages((r) => ({ ...r, francais: !r.francais }))} title="Traduction française de la phrase">
                <Languages className="size-4" aria-hidden="true" />
                Français
              </button>
              <button type="button" className="lg-option" aria-pressed={reglages.pauseAuMot} onClick={() => setReglages((r) => ({ ...r, pauseAuMot: !r.pauseAuMot }))} title="Mettre en pause quand on touche un mot">
                <MousePointerClick className="size-4" aria-hidden="true" />
                Pause au mot
              </button>
              <button type="button" className="lg-option" aria-pressed={reglages.texte} onClick={() => setReglages((r) => ({ ...r, texte: !r.texte }))} title="Afficher le texte complet">
                <ListVideo className="size-4" aria-hidden="true" />
                Texte
              </button>
            </div>
          </div>
        </div>

        {reglages.texte && (
          <aside className="lg-transcript" aria-label="Texte complet">
            <p className="lg-transcript-titre">
              <Captions className="size-4" aria-hidden="true" />
              Texte complet
              <span className="text-encre-douce">{t.phrases.length} phrases</span>
            </p>
            <ol ref={liste} className="lg-transcript-liste">
              {t.phrases.map((p) => (
                <li key={p.id} data-id={p.id} data-actif={p.id === actif.phrase || undefined}>
                  <button type="button" onClick={() => aller(p.debut)}>
                    <span className="lg-transcript-t">{dureeLisible(p.debut)}</span>
                    <span lang="en">{texteDe(p)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      {glose && phraseGlose && (
        <GloseMot
          cible={glose}
          phrase={phraseGlose}
          analyse={analyses[glose.phrase]}
          traduction={traductions[glose.phrase]}
          erreur={erreur}
          origine={{ type: "video", titre: t.titre, ref: t.id, t: phraseGlose.debut }}
          tactile={tactile}
          onFermer={() => setGlose(null)}
          onMot={(i, el) => setGlose({ phrase: glose.phrase, mot: i, el, via: "toucher" })}
          onEcouter={(s) => {
            setGlose(null);
            aller(s);
          }}
        />
      )}
    </div>
  );
}

function PhraseCliquable({ phrase, actif, glose, onMot }: { phrase: Phrase; actif: number; glose: number; onMot: (i: number, el: HTMLElement, doigt: boolean) => void }) {
  const pointeur = useRef("mouse");
  const mots = useMemo(() => phrase.mots, [phrase]);
  return (
    <p className="lg-st-courante" lang="en" onPointerDown={(e) => (pointeur.current = e.pointerType)}>
      {mots.map((m, i) => (
        <span key={i}>
          <button
            type="button"
            className="lg-st-mot"
            data-dit={i <= actif || undefined}
            data-ici={i === actif || undefined}
            aria-pressed={i === glose}
            onClick={(e) => onMot(i, e.currentTarget, pointeur.current !== "mouse")}
          >
            {m.t}
          </button>{" "}
        </span>
      ))}
    </p>
  );
}
