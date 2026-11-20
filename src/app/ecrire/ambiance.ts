"use client";

import type { Ambiance } from "@/lib/atelier/preferences";

/**
 * Le Calame — une ambiance sonore discrète, fabriquée sur place (aucun fichier à
 * télécharger) : la pluie, ou le murmure d'une bibliothèque. Le son ne démarre
 * qu'après un geste de l'auteur, comme l'exigent les navigateurs.
 */

let contexte: AudioContext | null = null;
let sortie: GainNode | null = null;
let arreterCourant: (() => void) | null = null;

function bruit(ctx: AudioContext, secondes = 4, couleur: "rose" | "brun" = "rose"): AudioBuffer {
  const tampon = ctx.createBuffer(2, ctx.sampleRate * secondes, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const d = tampon.getChannelData(canal);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      dernier = 0;
    for (let i = 0; i < d.length; i++) {
      const blanc = Math.random() * 2 - 1;
      if (couleur === "rose") {
        b0 = 0.99765 * b0 + blanc * 0.099046;
        b1 = 0.963 * b1 + blanc * 0.2965164;
        b2 = 0.57 * b2 + blanc * 1.0526913;
        d[i] = (b0 + b1 + b2 + blanc * 0.1848) * 0.11;
      } else {
        dernier = (dernier + 0.02 * blanc) / 1.02;
        d[i] = dernier * 3.5;
      }
    }
  }
  return tampon;
}

function source(ctx: AudioContext, tampon: AudioBuffer): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = tampon;
  s.loop = true;
  return s;
}

export function jouerAmbiance(genre: Ambiance, volume: number): void {
  arreterAmbiance();
  if (genre === "aucune") return;
  const Classe = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Classe) return;
  contexte = contexte ?? new Classe();
  void contexte.resume();
  const ctx = contexte;
  sortie = ctx.createGain();
  sortie.gain.value = 0;
  sortie.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 1.5);
  sortie.connect(ctx.destination);
  const noeuds: AudioScheduledSourceNode[] = [];
  const minuteurs: ReturnType<typeof setInterval>[] = [];

  if (genre === "pluie") {
    const fond = source(ctx, bruit(ctx, 5, "rose"));
    const filtre = ctx.createBiquadFilter();
    filtre.type = "lowpass";
    filtre.frequency.value = 2400;
    fond.connect(filtre).connect(sortie);
    fond.start();
    noeuds.push(fond);
    // Quelques gouttes plus nettes, au hasard.
    const goutte = () => {
      if (!sortie) return;
      const o = ctx.createBufferSource();
      o.buffer = bruit(ctx, 0.05, "rose");
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 2500 + Math.random() * 3000;
      g.gain.setValueAtTime(0.25 * Math.random(), ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      o.connect(f).connect(g).connect(sortie);
      o.start();
    };
    minuteurs.push(setInterval(() => Math.random() < 0.6 && goutte(), 90));
  } else {
    // Bibliothèque : un souffle grave, et de temps en temps une page qu'on tourne.
    const fond = source(ctx, bruit(ctx, 6, "brun"));
    const filtre = ctx.createBiquadFilter();
    filtre.type = "lowpass";
    filtre.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.6;
    fond.connect(filtre).connect(g).connect(sortie);
    fond.start();
    noeuds.push(fond);
    const page = () => {
      if (!sortie) return;
      const o = ctx.createBufferSource();
      o.buffer = bruit(ctx, 0.35, "rose");
      const gp = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 1800;
      gp.gain.setValueAtTime(0.0001, ctx.currentTime);
      gp.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.08);
      gp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(f).connect(gp).connect(sortie);
      o.start();
    };
    minuteurs.push(setInterval(() => Math.random() < 0.08 && page(), 1000));
  }

  arreterCourant = () => {
    minuteurs.forEach(clearInterval);
    const s = sortie;
    if (s && contexte) {
      s.gain.cancelScheduledValues(contexte.currentTime);
      s.gain.linearRampToValueAtTime(0, contexte.currentTime + 0.6);
    }
    setTimeout(() => {
      noeuds.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* déjà arrêté */
        }
      });
      s?.disconnect();
    }, 700);
  };
}

export function reglerVolume(volume: number): void {
  if (sortie && contexte) sortie.gain.linearRampToValueAtTime(volume * 0.5, contexte.currentTime + 0.2);
}

export function arreterAmbiance(): void {
  arreterCourant?.();
  arreterCourant = null;
  sortie = null;
}

/** Un petit carillon doux (fin d'une séance). */
export function carillon(): void {
  const Classe = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Classe) return;
  contexte = contexte ?? new Classe();
  const ctx = contexte;
  void ctx.resume();
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = ctx.currentTime + i * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 1.5);
  });
}
