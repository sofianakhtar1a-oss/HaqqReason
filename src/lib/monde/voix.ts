"use client";

/*
 * Le Portulan : la voix du navigateur, pour entendre un nom en français, en anglais ou en arabe
 * (et, pour l'accessibilité, lire une question à voix haute). Gratuite et hors ligne sur la
 * plupart des appareils ; on choisit la meilleure voix disponible pour chaque langue.
 */

export type LangueVoix = "fr" | "en" | "ar";

const choisies = new Map<LangueVoix, SpeechSynthesisVoice | null>();

export const voixDisponible = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

function choisir(langue: LangueVoix): SpeechSynthesisVoice | null {
  const deja = choisies.get(langue);
  if (deja) return deja;
  const toutes = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(langue));
  if (!toutes.length) return null;
  const prefere = langue === "fr" ? "fr-FR" : langue === "en" ? "en-GB" : "ar-SA";
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|premium|enhanced|online/i.test(v.name) ? 8 : 0) + (/google|microsoft|amélie|thomas|daniel|maged|tarik/i.test(v.name) ? 4 : 0) + (v.lang === prefere ? 2 : 0);
  const v = [...toutes].sort((a, b) => score(b) - score(a))[0];
  choisies.set(langue, v);
  return v;
}

if (voixDisponible()) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => choisies.clear());
}

/** Une voix existe-t-elle pour cette langue ? (l'arabe manque sur certains appareils). */
export function voixPour(langue: LangueVoix): boolean {
  if (!voixDisponible()) return false;
  const voix = window.speechSynthesis.getVoices();
  // Tant que la liste n'est pas chargée, on propose le bouton : le navigateur choisira.
  return !voix.length || voix.some((v) => v.lang.toLowerCase().startsWith(langue));
}

/** Dit un texte. La promesse se résout à la fin (ou tout de suite si c'est impossible). */
export function dire(texte: string, langue: LangueVoix = "fr", vitesse = 0.95): Promise<void> {
  if (!voixDisponible() || !texte.trim()) return Promise.resolve();
  const s = window.speechSynthesis;
  s.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(texte);
    const v = choisir(langue);
    if (v) u.voice = v;
    u.lang = v?.lang ?? (langue === "fr" ? "fr-FR" : langue === "en" ? "en-GB" : "ar-SA");
    u.rate = vitesse;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    s.speak(u);
    // Certains navigateurs ne préviennent jamais de la fin.
    setTimeout(resolve, 1500 + texte.length * 110);
  });
}

export function taire() {
  if (voixDisponible()) window.speechSynthesis.cancel();
}
