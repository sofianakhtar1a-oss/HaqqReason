"use client";

/*
 * Une seule façon de piloter le son, la vidéo d'un fichier ou une vidéo YouTube,
 * et une horloge qui lit l'instant courant à chaque image pour synchroniser le texte.
 */

export type Controle = {
  temps(): number;
  duree(): number;
  enLecture(): boolean;
  pret(): boolean;
  jouer(): void;
  pause(): void;
  aller(t: number): void;
  vitesse(v: number): void;
  /** Prévient à chaque lecture, pause, attente ou fin. Renvoie de quoi se désabonner. */
  surEtat(cb: () => void): () => void;
};

export const controleVide: Controle = {
  temps: () => 0,
  duree: () => 0,
  enLecture: () => false,
  pret: () => false,
  jouer: () => undefined,
  pause: () => undefined,
  aller: () => undefined,
  vitesse: () => undefined,
  surEtat: () => () => undefined,
};

export function controleElement(el: HTMLMediaElement): Controle {
  return {
    temps: () => el.currentTime,
    duree: () => (Number.isFinite(el.duration) ? el.duration : 0),
    enLecture: () => !el.paused && !el.ended,
    pret: () => el.readyState >= 1,
    jouer: () => void el.play().catch(() => undefined),
    pause: () => el.pause(),
    aller: (t) => {
      el.currentTime = Math.max(0, t);
    },
    vitesse: (v) => {
      el.playbackRate = v;
    },
    surEtat: (cb) => {
      const evenements = ["play", "pause", "ended", "waiting", "playing", "loadedmetadata", "ratechange"];
      evenements.forEach((e) => el.addEventListener(e, cb));
      return () => evenements.forEach((e) => el.removeEventListener(e, cb));
    },
  };
}

/* ---------- YouTube : le lecteur officiel, sans cookie ---------- */

type JoueurYt = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(t: number, autoriser: boolean): void;
  setPlaybackRate(v: number): void;
  destroy(): void;
  unloadModule?(nom: string): void;
};

type ApiYt = {
  Player: new (
    el: HTMLElement,
    o: { videoId: string; host: string; playerVars: Record<string, number | string>; events: { onReady: () => void; onStateChange: () => void } },
  ) => JoueurYt;
};

declare global {
  interface Window {
    YT?: ApiYt;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let chargement: Promise<ApiYt> | null = null;

function apiYoutube(): Promise<ApiYt> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  chargement ??= new Promise((resolve, reject) => {
    const precedent = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      precedent?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      chargement = null;
      reject(new Error("Le lecteur YouTube n'a pas pu se charger."));
    };
    document.head.appendChild(s);
  });
  return chargement;
}

/** Nos propres sous-titres s'affichent sous la vidéo : ceux de YouTube (souvent traduits automatiquement) sont retirés. */
function sansSousTitres(j: JoueurYt) {
  try {
    j.unloadModule?.("captions");
    j.unloadModule?.("cc");
  } catch {
    // Lecteur pas encore prêt.
  }
}

export async function controleYoutube(hote: HTMLElement, id: string): Promise<Controle & { detruire(): void }> {
  const api = await apiYoutube();
  const abonnes = new Set<() => void>();
  let pret = false;
  const prevenir = () => abonnes.forEach((cb) => cb());
  const joueur = await new Promise<JoueurYt>((resolve) => {
    const j = new api.Player(hote, {
      videoId: id,
      host: "https://www.youtube-nocookie.com",
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, controls: 0, disablekb: 1, cc_load_policy: 0, cc_lang_pref: "en", fs: 0 },
      events: {
        onReady: () => {
          pret = true;
          sansSousTitres(j);
          resolve(j);
          prevenir();
        },
        onStateChange: () => {
          sansSousTitres(j);
          prevenir();
        },
      },
    });
  });
  return {
    temps: () => joueur.getCurrentTime?.() ?? 0,
    duree: () => joueur.getDuration?.() ?? 0,
    enLecture: () => joueur.getPlayerState?.() === 1 || joueur.getPlayerState?.() === 3,
    pret: () => pret,
    jouer: () => joueur.playVideo(),
    pause: () => joueur.pauseVideo(),
    aller: (t) => joueur.seekTo(Math.max(0, t), true),
    vitesse: (v) => joueur.setPlaybackRate(v),
    surEtat: (cb) => {
      abonnes.add(cb);
      return () => abonnes.delete(cb);
    },
    detruire: () => {
      abonnes.clear();
      joueur.destroy();
    },
  };
}

/* ---------- Horloge : un seul requestAnimationFrame pour toute la liseuse ---------- */

export class Horloge {
  private abonnes = new Set<(t: number) => void>();
  private image = 0;
  constructor(private source: { readonly current: Controle }) {}
  demarrer() {
    const tour = () => {
      const t = this.source.current.temps();
      this.abonnes.forEach((cb) => cb(t));
      this.image = requestAnimationFrame(tour);
    };
    this.image = requestAnimationFrame(tour);
  }
  arreter() {
    cancelAnimationFrame(this.image);
  }
  abonner(cb: (t: number) => void) {
    this.abonnes.add(cb);
    return () => {
      this.abonnes.delete(cb);
    };
  }
}
