"use client";

import { FileUp, PanelBottom, PanelLeftOpen, Pause, PictureInPicture2, Play, RotateCcw, RotateCw } from "lucide-react";
import { type PointerEvent as EvPointeur, useCallback, useEffect, useRef, useState } from "react";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { phraseA } from "@/lib/alambic/transcription/phrases";
import { type Phrase, texteDe } from "@/lib/alambic/transcription/types";
import { type Controle, controleElement, controleYoutube, type Horloge } from "./controle";

export type MediaLecture = { type: "fichier"; url: string; video: boolean } | { type: "youtube"; id: string } | null;
export type Mode = "scene" | "flottant" | "barre";
type Coin = "bd" | "bg" | "hd" | "hg";

const VITESSES = [1, 1.25, 1.5, 1.75, 0.75];

type Props = {
  media: MediaLecture;
  mode: Mode;
  onMode: (m: Mode) => void;
  titre: string;
  horloge: Horloge;
  controle: Controle;
  onControle: (c: Controle | null) => void;
  phrases: Phrase[];
  duree: number;
  rtl: boolean;
  onRebrancher: (f: File) => void;
};

export function Lecteur({ media, mode, onMode, titre, horloge, controle, onControle, phrases, duree, rtl, onRebrancher }: Props) {
  const element = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const hoteYt = useRef<HTMLDivElement>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const [coin, setCoin] = useState<Coin>("bd");
  const [deplacement, setDeplacement] = useState<{ x: number; y: number } | null>(null);
  const video = media?.type === "youtube" || (media?.type === "fichier" && media.video);

  // Branchement du son ou de la vidéo.
  useEffect(() => {
    if (media?.type === "fichier" && element.current) {
      const c = controleElement(element.current);
      onControle(c);
      return () => onControle(null);
    }
    if (media?.type === "youtube" && hoteYt.current) {
      let fini = false;
      let detruire = () => undefined as void;
      const hote = document.createElement("div");
      hoteYt.current.replaceChildren(hote);
      void controleYoutube(hote, media.id).then((c) => {
        if (fini) return c.detruire();
        detruire = c.detruire;
        onControle(c);
      });
      return () => {
        fini = true;
        onControle(null);
        detruire();
      };
    }
  }, [media, onControle]);

  useEffect(() => {
    const maj = () => setLecture(controle.enLecture());
    maj();
    return controle.surEtat(maj);
  }, [controle]);

  const changerVitesse = () => {
    const v = VITESSES[(VITESSES.indexOf(vitesse) + 1) % VITESSES.length];
    setVitesse(v);
    controle.vitesse(v);
  };

  // Lecteur flottant : on le saisit, on le lâche, il rejoint le coin le plus proche.
  const saisir = (e: EvPointeur<HTMLDivElement>) => {
    if (mode !== "flottant" || (e.target as HTMLElement).closest("button, .tr-frise")) return;
    const depart = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    const bouger = (ev: PointerEvent) => setDeplacement({ x: ev.clientX - depart.x, y: ev.clientY - depart.y });
    const lacher = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", lacher);
      const r = boite.current?.getBoundingClientRect();
      if (r) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        setCoin(`${cy < window.innerHeight / 2 ? "h" : "b"}${cx < window.innerWidth / 2 ? "g" : "d"}` as Coin);
      }
      setDeplacement(null);
      void ev;
    };
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", lacher);
  };

  return (
    <>
      <div
        ref={boite}
        className="tr-lecteur"
        data-mode={mode}
        data-video={video || undefined}
        data-coin={coin}
        data-glisse={deplacement ? "" : undefined}
        style={deplacement ? { translate: `${deplacement.x}px ${deplacement.y}px` } : undefined}
        onPointerDown={saisir}
      >
        <div className="tr-ecran" data-vide={!media || undefined}>
          {media?.type === "fichier" &&
            (media.video ? (
              <video ref={element} src={media.url} playsInline preload="metadata" onClick={() => (controle.enLecture() ? controle.pause() : controle.jouer())} />
            ) : (
              <>
                <audio ref={element} src={media.url} preload="metadata" />
                <Platine element={element} horloge={horloge} titre={titre} lecture={lecture} />
              </>
            ))}
          {media?.type === "youtube" && <div ref={hoteYt} className="tr-youtube" />}
          {!media && (
            <label className="tr-rebrancher">
              <FileUp className="size-6 text-or" strokeWidth={1.4} aria-hidden="true" />
              <span className="font-semibold">Le son n&apos;est pas gardé sur cet appareil</span>
              <span className="text-sm text-encre-douce">Choisis à nouveau le fichier d&apos;origine pour l&apos;écouter en lisant.</span>
              <input type="file" accept="audio/*,video/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onRebrancher(e.target.files[0])} />
            </label>
          )}
        </div>
        {mode !== "barre" && media && (
          <Commandes
            variante={mode === "flottant" ? "mini" : "carte"}
            {...{ controle, horloge, lecture, vitesse, changerVitesse, phrases, duree, rtl, mode, onMode }}
          />
        )}
      </div>
      {mode === "barre" && media && (
        <div className="tr-barre">
          <Commandes variante="barre" {...{ controle, horloge, lecture, vitesse, changerVitesse, phrases, duree, rtl, mode, onMode }} />
        </div>
      )}
    </>
  );
}

type PropsCommandes = {
  variante: "carte" | "mini" | "barre";
  controle: Controle;
  horloge: Horloge;
  lecture: boolean;
  vitesse: number;
  changerVitesse: () => void;
  phrases: Phrase[];
  duree: number;
  rtl: boolean;
  mode: Mode;
  onMode: (m: Mode) => void;
};

function Commandes({ variante, controle, horloge, lecture, vitesse, changerVitesse, phrases, duree, rtl, mode, onMode }: PropsCommandes) {
  const temps = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      horloge.abonner((t) => {
        if (temps.current) temps.current.textContent = dureeLisible(t);
      }),
    [horloge],
  );
  return (
    <div className="tr-commandes" data-variante={variante}>
      <Frise controle={controle} horloge={horloge} phrases={phrases} duree={duree} rtl={rtl} />
      <div className="tr-commandes-rang">
        <button type="button" className="tr-cmd" aria-label="Reculer de 5 secondes" onClick={() => controle.aller(controle.temps() - 5)}>
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="tr-cmd tr-cmd-lecture" aria-label={lecture ? "Pause" : "Lecture"} onClick={() => (lecture ? controle.pause() : controle.jouer())} data-lecture={lecture || undefined}>
          <Pause className="tr-icone-pause size-5" fill="currentColor" aria-hidden="true" />
          <Play className="tr-icone-lecture size-5" fill="currentColor" aria-hidden="true" />
        </button>
        <button type="button" className="tr-cmd" aria-label="Avancer de 5 secondes" onClick={() => controle.aller(controle.temps() + 5)}>
          <RotateCw className="size-4" aria-hidden="true" />
        </button>
        <span className="tr-temps tabular-nums">
          <span ref={temps}>0:00</span>
          <span className="text-encre-douce"> / {dureeLisible(duree)}</span>
        </span>
        <span className="flex-1" />
        <button type="button" className="tr-cmd tr-vitesse tabular-nums" onClick={changerVitesse} aria-label={`Vitesse : ${vitesse} fois`} title="Vitesse de lecture">
          {String(vitesse).replace(".", ",")}×
        </button>
        {variante !== "mini" && (
          <span className="tr-modes" role="radiogroup" aria-label="Taille du lecteur">
            {(
              [
                ["scene", PanelLeftOpen, "Lecteur à côté du texte"],
                ["flottant", PictureInPicture2, "Lecteur flottant"],
                ["barre", PanelBottom, "Barre discrète"],
              ] as const
            ).map(([m, Icone, nom]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className="tr-cmd" aria-label={nom} title={nom} onClick={() => onMode(m)}>
                <Icone className="size-4" aria-hidden="true" />
              </button>
            ))}
          </span>
        )}
        {variante === "mini" && (
          <>
            <button type="button" className="tr-cmd" aria-label="Lecteur à côté du texte" title="Agrandir" onClick={() => onMode("scene")}>
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="tr-cmd" aria-label="Barre discrète" title="Réduire en barre" onClick={() => onMode("barre")}>
              <PanelBottom className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Frise de lecture : marques de paragraphe, aperçu de la phrase au survol, saisie au doigt. */
function Frise({ controle, horloge, phrases, duree, rtl }: { controle: Controle; horloge: Horloge; phrases: Phrase[]; duree: number; rtl: boolean }) {
  const piste = useRef<HTMLDivElement>(null);
  const plein = useRef<HTMLSpanElement>(null);
  const [survol, setSurvol] = useState<{ x: number; t: number } | null>(null);
  const [tenue, setTenue] = useState<number | null>(null);
  const total = duree || controle.duree() || 1;

  useEffect(
    () =>
      horloge.abonner((t) => {
        if (plein.current && tenue === null) plein.current.style.transform = `scaleX(${Math.min(1, t / total)})`;
      }),
    [horloge, total, tenue],
  );

  const instant = useCallback(
    (clientX: number) => {
      const r = piste.current!.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      return { x: f * r.width, t: f * total, f };
    },
    [total],
  );

  const reperes = phrases.filter((p, i) => i > 0 && p.paragraphe !== phrases[i - 1].paragraphe).map((p) => p.debut / total);
  const apercu = survol ? phrases[Math.max(0, phraseA(phrases, survol.t))] : null;

  return (
    <div
      ref={piste}
      className="tr-frise"
      role="slider"
      tabIndex={0}
      aria-label="Position de lecture"
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(tenue ?? 0)}
      onPointerMove={(e) => {
        const { x, t, f } = instant(e.clientX);
        setSurvol({ x, t });
        if (tenue !== null && plein.current) {
          plein.current.style.transform = `scaleX(${f})`;
          setTenue(t);
        }
      }}
      onPointerLeave={() => tenue === null && setSurvol(null)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const { t, f } = instant(e.clientX);
        if (plein.current) plein.current.style.transform = `scaleX(${f})`;
        setTenue(t);
      }}
      onPointerUp={(e) => {
        if (tenue !== null) controle.aller(instant(e.clientX).t);
        setTenue(null);
        if (e.pointerType !== "mouse") setSurvol(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          controle.aller(controle.temps() + (e.key === "ArrowRight" ? 5 : -5));
        }
      }}
    >
      <span className="tr-frise-piste">
        <span ref={plein} className="tr-frise-plein" />
        {reperes.map((r, i) => (
          <i key={i} className="tr-frise-repere" style={{ left: `${r * 100}%` }} />
        ))}
      </span>
      {survol && apercu && (
        <span className="tr-frise-bulle" style={{ left: survol.x }}>
          <span className="tabular-nums font-semibold">{dureeLisible(survol.t)}</span>
          <span className="tr-frise-extrait" dir={rtl ? "rtl" : "ltr"}>
            {texteDe(apercu).slice(0, 90)}
          </span>
        </span>
      )}
    </div>
  );
}

/** Son sans image : une platine dont les barres suivent le vrai spectre du son. */
function Platine({ element, horloge, titre, lecture }: { element: React.RefObject<HTMLAudioElement | null>; horloge: Horloge; titre: string; lecture: boolean }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const analyse = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const brancher = () => {
      if (analyse.current) return;
      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(el);
        const a = ctx.createAnalyser();
        a.fftSize = 1024;
        a.smoothingTimeConstant = 0.82;
        source.connect(a);
        a.connect(ctx.destination);
        analyse.current = a;
        el.addEventListener("play", () => void ctx.resume());
      } catch {
        // Sans Web Audio, les barres respirent doucement à la place.
      }
    };
    el.addEventListener("play", brancher, { once: true });
    return () => el.removeEventListener("play", brancher);
  }, [element]);

  useEffect(() => {
    const donnees = new Uint8Array(512);
    return horloge.abonner((t) => {
      const c = toile.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const { width: l, height: h } = c;
      ctx.clearRect(0, 0, l, h);
      const n = 36;
      if (analyse.current) analyse.current.getByteFrequencyData(donnees);
      const couleur = getComputedStyle(c).color;
      ctx.fillStyle = couleur;
      // Échelle logarithmique, de 90 Hz à 7 kHz : la voix occupe toute la largeur, comme l'oreille l'entend.
      const largeurBande = analyse.current ? analyse.current.context.sampleRate / analyse.current.fftSize : 1;
      for (let i = 0; i < n; i++) {
        const frequence = 90 * Math.pow(7000 / 90, i / (n - 1));
        const v = analyse.current ? donnees[Math.min(511, Math.round(frequence / largeurBande))] / 255 : 0.15 + 0.12 * Math.sin(t * 2 + i * 0.5);
        const bh = Math.max(3, v * h * 0.9);
        const x = (i * l) / n + 2;
        ctx.globalAlpha = 0.35 + v * 0.65;
        ctx.beginPath();
        ctx.roundRect(x, (h - bh) / 2, l / n - 4, bh, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }, [horloge]);

  return (
    <div className="tr-platine" data-lecture={lecture || undefined}>
      <canvas ref={toile} width={360} height={84} aria-hidden="true" />
      <p className="tr-platine-titre" dir="auto">
        {titre}
      </p>
    </div>
  );
}
