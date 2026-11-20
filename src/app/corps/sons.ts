"use client";

import { profilActuel } from "@/lib/corps/progression";

/*
 * Les sons de L'Écorché : de petites notes synthétisées sur place (aucun fichier à charger),
 * et les vibrations du téléphone. Chacun se coupe dans les réglages.
 */

export type Son = "juste" | "presque" | "faux" | "niveau" | "record" | "echec" | "trouve" | "tic" | "retourne" | "debloque";

let ctx: AudioContext | null = null;
let sortie: GainNode | null = null;

function contexte(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
      sortie = ctx.createGain();
      sortie.gain.value = 0.4;
      sortie.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

function note(f: number, debut: number, duree: number, o: { onde?: OscillatorType; volume?: number; vers?: number; harmonique?: number } = {}) {
  const c = contexte();
  if (!c || !sortie) return;
  const t = c.currentTime + debut;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = o.onde ?? "sine";
  osc.frequency.setValueAtTime(f, t);
  if (o.vers) osc.frequency.exponentialRampToValueAtTime(o.vers, t + duree);
  const v = o.volume ?? 0.4;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(v, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(env).connect(sortie);
  osc.start(t);
  osc.stop(t + duree + 0.02);
  if (o.harmonique) note(f * o.harmonique, debut, duree * 0.5, { volume: v * 0.2 });
}

// Une gamme de ré mineur : grave et douce, comme un cabinet de curiosités.
const RE5 = 587.33;
const FA5 = 698.46;
const LA5 = 880;
const RE6 = 1174.66;
const LA3 = 220;
const FA3 = 174.61;

export function jouer(s: Son) {
  try {
    if (!profilActuel().son) return;
  } catch {
    return;
  }
  switch (s) {
    case "juste":
      note(FA5, 0, 0.2, { volume: 0.3, harmonique: 2.76 });
      note(LA5, 0.07, 0.34, { volume: 0.28, harmonique: 2.76 });
      break;
    case "presque":
      note(LA5, 0, 0.3, { volume: 0.24, harmonique: 2.76 });
      break;
    case "faux":
      note(LA3, 0, 0.16, { onde: "triangle", volume: 0.28 });
      note(FA3, 0.11, 0.3, { onde: "triangle", volume: 0.24 });
      break;
    case "niveau":
      [RE5, FA5, LA5, RE6].forEach((f, i) => note(f, i * 0.1, 0.55 + i * 0.08, { volume: 0.26, harmonique: 2.76 }));
      break;
    case "record":
      [LA5, RE6, FA5 * 2, LA5 * 2].forEach((f, i) => note(f, i * 0.06, 0.34, { volume: 0.18, harmonique: 3.1 }));
      break;
    case "echec":
      [LA5 / 2, FA5 / 2, RE5 / 2].forEach((f, i) => note(f, i * 0.16, 0.42, { onde: "triangle", volume: 0.2 }));
      break;
    case "trouve":
      note(LA5, 0, 0.16, { volume: 0.2, harmonique: 2.76 });
      break;
    case "tic":
      note(880, 0, 0.05, { onde: "square", volume: 0.05 });
      break;
    case "retourne":
      note(RE6, 0, 0.09, { volume: 0.08 });
      note(LA5, 0.04, 0.12, { volume: 0.06 });
      break;
    case "debloque":
      note(RE5, 0, 0.18, { volume: 0.2, harmonique: 2.01 });
      note(LA5, 0.12, 0.4, { volume: 0.2, harmonique: 2.76 });
      break;
  }
}

const MOTIFS: Partial<Record<Son, number | number[]>> = { juste: 14, faux: [40, 50, 40], niveau: [20, 40, 20, 40, 70], echec: 120, debloque: [12, 30, 12] };

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
    // Pas de vibration sans geste récent : rien à faire.
  }
}

export function ressentir(s: Son) {
  jouer(s);
  vibrer(s);
}

/** Prononcer un nom (si la voix est permise, ou si on le demande exprès). */
export function dire(texte: string, force = false) {
  try {
    if (!force && !profilActuel().voix) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR";
    u.rate = 0.95;
    const voix = synth.getVoices().find((v) => v.lang.startsWith("fr"));
    if (voix) u.voice = voix;
    synth.speak(u);
  } catch {
    // Pas de synthèse vocale : tant pis.
  }
}
