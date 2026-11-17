"use client";

/*
 * La voix du navigateur (synthèse vocale), pour entendre un mot ou une phrase en anglais.
 * Gratuite et hors ligne sur la plupart des appareils ; on choisit la meilleure voix anglaise disponible.
 */

let voixChoisie: SpeechSynthesisVoice | null | undefined;

export const voixDisponible = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

function choisir(): SpeechSynthesisVoice | null {
  if (voixChoisie !== undefined && voixChoisie !== null) return voixChoisie;
  const toutes = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!toutes.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|premium|enhanced|online/i.test(v.name) ? 8 : 0) + (/google|microsoft|samantha|daniel|serena|karen/i.test(v.name) ? 4 : 0) + (v.lang === "en-GB" ? 2 : v.lang === "en-US" ? 1 : 0) + (v.localService ? 0 : 1);
  voixChoisie = [...toutes].sort((a, b) => score(b) - score(a))[0];
  return voixChoisie;
}

if (voixDisponible()) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voixChoisie = undefined;
  });
}

/** Prononce un texte anglais. Renvoie une promesse résolue à la fin (ou tout de suite si impossible). */
export function parler(texte: string, vitesse = 0.95): Promise<void> {
  if (!voixDisponible() || !texte.trim()) return Promise.resolve();
  const s = window.speechSynthesis;
  s.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(texte);
    const v = choisir();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-GB";
    u.rate = vitesse;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    s.speak(u);
    // Certains navigateurs ne préviennent jamais de la fin.
    setTimeout(resolve, 1200 + texte.length * 120);
  });
}

export function taire() {
  if (voixDisponible()) window.speechSynthesis.cancel();
}
