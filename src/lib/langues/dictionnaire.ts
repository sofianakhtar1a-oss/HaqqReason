/* Le dictionnaire personnel : identifiants, passage vers les exercices, exports. */
import { TOUTES_LES_ENTREES } from "./themes/index";
import type { Element, Entree, MotPerso, OrigineMot } from "./types";

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");

/** Un mot n'entre qu'une fois dans le dictionnaire, quelle que soit sa casse ou sa ponctuation. */
export function idMot(en: string): string {
  const cle = sansAccents(en.toLowerCase())
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' -]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
  return `perso:${cle.slice(0, 120) || "mot"}`;
}

/** Nettoie un mot touché dans un texte : ponctuation autour, majuscule de début de phrase. */
export function motPropre(brut: string): string {
  const nu = brut.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  return nu === nu.toUpperCase() && nu.length > 1 ? nu : nu.charAt(0).toLowerCase() + nu.slice(1);
}

export function elementDe(m: MotPerso): Element {
  return { id: m.id, en: m.en, fr: m.fr, nature: m.nature, exEn: m.phrase, exFr: m.phraseFr, forme: m.forme };
}

export function elementDEntree(e: Entree): Element {
  return { id: e.id, en: e.en, fr: e.fr, nature: e.nature, api: e.api, exEn: e.exEn, exFr: e.exFr };
}

/** Prononciation connue : celle d'un mot des thèmes, quand il y figure. */
const PRONONCIATIONS = new Map(TOUTES_LES_ENTREES.map((e) => [e.en.toLowerCase().replace(/^to /, ""), e.api]));
export const prononciation = (en: string) => PRONONCIATIONS.get(en.toLowerCase().replace(/^to /, ""));

export function nouveauMot(champs: { en: string; fr: string; nature?: string; lemme?: string; phrase?: string; phraseFr?: string; forme?: string; passage?: boolean }, origine: OrigineMot, maintenant = Date.now()): MotPerso {
  const en = champs.en.trim();
  return {
    id: idMot(champs.lemme && !champs.passage ? champs.lemme : en),
    en,
    fr: champs.fr.trim(),
    nature: champs.nature || undefined,
    lemme: champs.lemme || undefined,
    phrase: champs.phrase?.trim() || undefined,
    phraseFr: champs.phraseFr?.trim() || undefined,
    forme: champs.forme || undefined,
    passage: champs.passage || undefined,
    origine,
    ajouteLe: maintenant,
  };
}

export function libelleOrigine(o: OrigineMot): string {
  if (o.type === "video") return `Vidéo · ${o.titre}`;
  if (o.type === "pdf") return `PDF · ${o.titre}, p. ${o.page}`;
  if (o.type === "theme") return `Thème · ${o.titre}`;
  if (o.type === "histoire") return `Histoire · ${o.titre}, p. ${o.page}`;
  return "Ajouté à la main";
}

const champCsv = (s: string | undefined) => {
  const v = s ?? "";
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

/** Export CSV (séparateur point-virgule, lisible par Excel en français), avec BOM. */
export function versCsv(mots: MotPerso[]): string {
  const lignes = [["anglais", "français", "nature", "phrase", "traduction de la phrase", "origine", "ajouté le"]];
  for (const m of mots) lignes.push([m.en, m.fr, m.nature ?? "", m.phrase ?? "", m.phraseFr ?? "", libelleOrigine(m.origine), new Date(m.ajouteLe).toISOString().slice(0, 10)]);
  return `﻿${lignes.map((l) => l.map(champCsv).join(";")).join("\r\n")}`;
}

/** Export pour Anki : recto, verso, séparés par une tabulation. */
export function versAnki(mots: MotPerso[]): string {
  const net = (s: string) => s.replace(/[\t\n]+/g, " ");
  return mots.map((m) => `${net(m.en)}\t${net(m.fr)}${m.phrase ? `<br><i>${net(m.phrase)}</i>` : ""}`).join("\n");
}
