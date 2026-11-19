"use client";

import { profilActuel } from "@/lib/monde/progression";

/*
 * Les sons du Portulan : de petites notes synthétisées sur place (aucun fichier à charger),
 * la mer et le vent en fond, et les vibrations du téléphone. Chacun se coupe dans les réglages.
 *
 * Le navigateur ne laisse jouer un son qu'après un geste (un clic, une touche) : le premier son
 * réveille le contexte audio, l'ambiance attend le premier geste pour partir.
 */

export type Son =
  | "juste"
  | "presque"
  | "faux"
  | "niveau"
  | "record"
  | "victoire"
  | "defaite"
  | "debloque"
  | "sceau"
  | "parchemin"
  | "trouve"
  | "adverse"
  | "tic"
  | "partez"
  | "ducats";

type Contexte = { ctx: AudioContext; effets: GainNode; ambiance: GainNode };
let audio: Contexte | null = null;

function contexte(): Contexte | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audio) {
    try {
      const ctx = new AC();
      const effets = ctx.createGain();
      effets.gain.value = 0.42;
      effets.connect(ctx.destination);
      const ambiance = ctx.createGain();
      ambiance.gain.value = 0;
      ambiance.connect(ctx.destination);
      audio = { ctx, effets, ambiance };
    } catch {
      return null;
    }
  }
  if (audio.ctx.state === "suspended") void audio.ctx.resume().catch(() => undefined);
  return audio;
}

/** Une note : une onde, une enveloppe (attaque, chute), un départ dans le temps. */
function note(a: Contexte, f: number, debut: number, duree: number, o: { onde?: OscillatorType; volume?: number; vers?: number; harmonique?: number } = {}) {
  const t = a.ctx.currentTime + debut;
  const osc = a.ctx.createOscillator();
  const env = a.ctx.createGain();
  osc.type = o.onde ?? "sine";
  osc.frequency.setValueAtTime(f, t);
  if (o.vers) osc.frequency.exponentialRampToValueAtTime(o.vers, t + duree);
  const v = o.volume ?? 0.5;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(v, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(env).connect(a.effets);
  osc.start(t);
  osc.stop(t + duree + 0.02);
  // Une clochette : une harmonique inharmonique, plus faible et plus brève.
  if (o.harmonique) note(a, f * o.harmonique, debut, duree * 0.55, { onde: "sine", volume: v * 0.22 });
}

/** Un souffle : du bruit filtré (le sceau qui frappe, le parchemin qui se déroule, le cadenas). */
function souffle(a: Contexte, debut: number, duree: number, o: { frequence: number; q?: number; volume?: number; type?: BiquadFilterType; vers?: number }) {
  const t = a.ctx.currentTime + debut;
  const n = Math.max(1, Math.floor(a.ctx.sampleRate * duree));
  const tampon = a.ctx.createBuffer(1, n, a.ctx.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.ctx.createBufferSource();
  src.buffer = tampon;
  const filtre = a.ctx.createBiquadFilter();
  filtre.type = o.type ?? "bandpass";
  filtre.frequency.setValueAtTime(o.frequence, t);
  if (o.vers) filtre.frequency.exponentialRampToValueAtTime(o.vers, t + duree);
  filtre.Q.value = o.q ?? 1;
  const env = a.ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(o.volume ?? 0.4, t + Math.min(0.02, duree / 4));
  env.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(filtre).connect(env).connect(a.effets);
  src.start(t);
  src.stop(t + duree + 0.02);
}

// Do4 = 261,6 Hz ; les notes de la gamme utilisées.
const DO5 = 523.25;
const MI5 = 659.25;
const SOL5 = 783.99;
const SI5 = 987.77;
const DO6 = 1046.5;
const MI6 = 1318.5;
const LA3 = 220;
const FA3 = 174.61;

/** Joue un son, si les sons sont permis. */
export function jouer(s: Son) {
  try {
    if (!profilActuel().son) return;
  } catch {
    return;
  }
  const a = contexte();
  if (!a) return;
  switch (s) {
    case "juste":
      note(a, MI5, 0, 0.22, { volume: 0.32, harmonique: 2.76 });
      note(a, SI5, 0.07, 0.32, { volume: 0.3, harmonique: 2.76 });
      break;
    case "presque":
      note(a, SOL5, 0, 0.3, { volume: 0.26, harmonique: 2.76 });
      break;
    case "faux":
      note(a, LA3, 0, 0.16, { onde: "triangle", volume: 0.3 });
      note(a, FA3, 0.11, 0.3, { onde: "triangle", volume: 0.26 });
      break;
    case "niveau":
      [DO5, MI5, SOL5, DO6].forEach((f, i) => note(a, f, i * 0.09, 0.5 + i * 0.08, { volume: 0.28, harmonique: 2.76 }));
      break;
    case "record":
      [SOL5, SI5, DO6, MI6, DO6 * 2].forEach((f, i) => note(a, f, i * 0.06, 0.34, { volume: 0.2, harmonique: 3.1 }));
      break;
    case "victoire":
      [DO5, MI5, SOL5].forEach((f, i) => note(a, f, i * 0.11, 0.22, { onde: "triangle", volume: 0.24 }));
      [DO5, MI5, SOL5, DO6].forEach((f) => note(a, f, 0.36, 0.9, { volume: 0.16, harmonique: 2.01 }));
      break;
    case "defaite":
      [SOL5 / 2, MI5 / 2, DO5 / 2].forEach((f, i) => note(a, f, i * 0.16, 0.42, { onde: "triangle", volume: 0.2 }));
      break;
    case "debloque":
      souffle(a, 0, 0.05, { frequence: 3200, q: 6, volume: 0.35 });
      souffle(a, 0.09, 0.06, { frequence: 2400, q: 8, volume: 0.3 });
      note(a, SOL5, 0.18, 0.4, { volume: 0.2, harmonique: 2.76 });
      break;
    case "sceau":
      note(a, 140, 0, 0.24, { volume: 0.55, vers: 55 });
      souffle(a, 0, 0.12, { frequence: 900, q: 0.8, volume: 0.25, type: "lowpass" });
      break;
    case "parchemin":
      souffle(a, 0, 0.55, { frequence: 1800, q: 0.6, volume: 0.12, vers: 5200 });
      break;
    case "trouve":
      note(a, SOL5, 0, 0.16, { volume: 0.2, harmonique: 2.76 });
      break;
    case "adverse":
      note(a, DO6, 0, 0.08, { volume: 0.08 });
      break;
    case "tic":
      note(a, 880, 0, 0.06, { onde: "square", volume: 0.06 });
      break;
    case "partez":
      note(a, 1320, 0, 0.18, { onde: "square", volume: 0.07 });
      break;
    case "ducats":
      note(a, 2093, 0, 0.12, { volume: 0.18, harmonique: 2.4 });
      note(a, 2637, 0.06, 0.2, { volume: 0.16, harmonique: 2.4 });
      break;
  }
}

/* ---------- Les vibrations ---------- */

const MOTIFS: Partial<Record<Son, number | number[]>> = {
  juste: 14,
  faux: [40, 50, 40],
  niveau: [20, 40, 20, 40, 70],
  victoire: [30, 40, 30, 40, 90],
  defaite: 120,
  debloque: [12, 30, 12],
  sceau: 45,
};

/** Fait vibrer le téléphone (si permis et possible). */
export function vibrer(s: Son) {
  try {
    if (!profilActuel().vibrations) return;
  } catch {
    return;
  }
  const motif = MOTIFS[s];
  if (motif === undefined || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(motif);
  } catch {
    // Certains navigateurs refusent sans geste récent : rien à faire.
  }
}

/** Le son et la vibration d'un même moment. */
export function ressentir(s: Son) {
  jouer(s);
  vibrer(s);
}

/* ---------- L'ambiance : la mer et le vent ---------- */

let ambianceEnCours: { arreter: () => void } | null = null;

/** Un bruit brun (doux, grave), en boucle : la matière de la houle. */
function bruitBrun(a: Contexte, secondes: number): AudioBuffer {
  const n = Math.floor(a.ctx.sampleRate * secondes);
  const tampon = a.ctx.createBuffer(1, n, a.ctx.sampleRate);
  const d = tampon.getChannelData(0);
  let dernier = 0;
  for (let i = 0; i < n; i++) {
    const blanc = Math.random() * 2 - 1;
    dernier = (dernier + 0.02 * blanc) / 1.02;
    d[i] = dernier * 3.5;
  }
  // Les deux bouts se rejoignent sans claquement.
  const fondu = Math.min(2000, n / 4);
  for (let i = 0; i < fondu; i++) {
    const k = i / fondu;
    d[i] = d[i] * k + d[n - fondu + i] * (1 - k);
  }
  return tampon;
}

function demarrerAmbiance(a: Contexte) {
  const t = a.ctx.currentTime;
  // La houle : un bruit brun, filtré bas, dont le volume monte et descend comme les vagues.
  const mer = a.ctx.createBufferSource();
  mer.buffer = bruitBrun(a, 6);
  mer.loop = true;
  const basse = a.ctx.createBiquadFilter();
  basse.type = "lowpass";
  basse.frequency.value = 520;
  const vague = a.ctx.createGain();
  vague.gain.value = 0.55;
  const lfo = a.ctx.createOscillator();
  lfo.frequency.value = 0.11;
  const ampleur = a.ctx.createGain();
  ampleur.gain.value = 0.4;
  lfo.connect(ampleur).connect(vague.gain);
  mer.connect(basse).connect(vague).connect(a.ambiance);
  // Le vent : un bruit plus clair, en bande étroite, dont la hauteur erre lentement.
  const vent = a.ctx.createBufferSource();
  vent.buffer = bruitBrun(a, 5);
  vent.loop = true;
  vent.playbackRate.value = 3.2;
  const bande = a.ctx.createBiquadFilter();
  bande.type = "bandpass";
  bande.frequency.value = 900;
  bande.Q.value = 1.6;
  const souffleVent = a.ctx.createOscillator();
  souffleVent.frequency.value = 0.045;
  const erre = a.ctx.createGain();
  erre.gain.value = 380;
  souffleVent.connect(erre).connect(bande.frequency);
  const ventVolume = a.ctx.createGain();
  ventVolume.gain.value = 0.16;
  vent.connect(bande).connect(ventVolume).connect(a.ambiance);
  for (const x of [mer, vent, lfo, souffleVent]) x.start(t);
  // Un fondu d'entrée de trois secondes.
  a.ambiance.gain.cancelScheduledValues(t);
  a.ambiance.gain.setValueAtTime(a.ambiance.gain.value, t);
  a.ambiance.gain.linearRampToValueAtTime(0.09, t + 3);
  return () => {
    const fin = a.ctx.currentTime;
    a.ambiance.gain.cancelScheduledValues(fin);
    a.ambiance.gain.setValueAtTime(a.ambiance.gain.value, fin);
    a.ambiance.gain.linearRampToValueAtTime(0, fin + 1.2);
    for (const x of [mer, vent, lfo, souffleVent]) {
      try {
        x.stop(fin + 1.3);
      } catch {
        // déjà arrêté
      }
    }
  };
}

/**
 * Allume ou éteint la mer et le vent. Sans geste encore (au chargement), le départ attend le
 * premier clic ou la première touche. Un onglet caché se tait.
 */
export function ambiance(allumee: boolean): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (!allumee) {
    ambianceEnCours?.arreter();
    ambianceEnCours = null;
    return () => undefined;
  }
  let arret: (() => void) | null = null;
  let fini = false;
  const lancer = () => {
    if (fini || arret || document.hidden) return;
    const a = contexte();
    if (!a || a.ctx.state !== "running") return;
    arret = demarrerAmbiance(a);
  };
  const geste = () => {
    lancer();
    if (arret) {
      window.removeEventListener("pointerdown", geste);
      window.removeEventListener("keydown", geste);
    }
  };
  const visibilite = () => {
    if (document.hidden) {
      arret?.();
      arret = null;
    } else lancer();
  };
  window.addEventListener("pointerdown", geste);
  window.addEventListener("keydown", geste);
  document.addEventListener("visibilitychange", visibilite);
  // Déjà un geste dans la page : on part tout de suite.
  if (navigator.userActivation?.hasBeenActive) setTimeout(lancer, 0);
  const arreter = () => {
    fini = true;
    arret?.();
    arret = null;
    window.removeEventListener("pointerdown", geste);
    window.removeEventListener("keydown", geste);
    document.removeEventListener("visibilitychange", visibilite);
  };
  ambianceEnCours?.arreter();
  ambianceEnCours = { arreter };
  return arreter;
}
