/*
 * Le contrôle des histoires (partagé par valider.mts et construire.mts) : le format, les gloses de
 * chaque mot, les pages, et pour un texte classique, l'anglais inchangé.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { cleMot, estMot, type Glose, motsDe, NATURES_GLOSE } from "../../../src/lib/langues/histoires/texte";
import type { Exercice } from "../../../src/lib/regles/types";
import { controlerExercice } from "../entrainement/controle";

export const DOSSIER = "scripts/langues/histoires";
const NIVEAUX = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type GloseSource = [string, string?, string?, string?];
export type PhraseSource = { en: string; fr: string; g?: Record<string, GloseSource> };
export type PageSource = { titre?: string; titreFr?: string; p: PhraseSource[][] };
export type LotSource = { debut: number; lexique?: Record<string, GloseSource>; pages: PageSource[] };
export type Meta = {
  id: string;
  titre: string;
  titreFr: string;
  auteur: string;
  annee?: number;
  niveau: string;
  genre: string;
  resume: string;
  source?: string;
  questions: Exercice[];
};

export const MOTS_OUTILS = JSON.parse(readFileSync(`${DOSSIER}/mots-outils.json`, "utf8")) as Record<string, GloseSource>;

/** Pages attendues et mots par page, pour une histoire originale. */
export const GABARITS: Record<string, { pages: number; min: number; max: number }> = {
  A1: { pages: 12, min: 70, max: 175 },
  A2: { pages: 12, min: 110, max: 235 },
  B1: { pages: 13, min: 150, max: 290 },
  B2: { pages: 14, min: 180, max: 330 },
  C1: { pages: 15, min: 220, max: 370 },
  C2: { pages: 15, min: 240, max: 390 },
};

const estGlose = (g: unknown): g is GloseSource =>
  Array.isArray(g) && g.length >= 1 && g.length <= 4 && g.every((x) => typeof x === "string") && (g[0] as string).trim().length > 0;

/** La glose d'un mot : celle de la phrase (n-ième occurrence), puis du lexique du lot, puis des mots-outils. */
export function gloseDe(cle: string, rang: number, phrase: PhraseSource, lexique: Record<string, GloseSource> = {}): { glose: GloseSource; ou: "phrase" | "lexique" | "outil" } | null {
  const g = phrase.g ?? {};
  if (rang > 1 && g[`${cle}#${rang}`]) return { glose: g[`${cle}#${rang}`], ou: "phrase" };
  if (g[cle]) return { glose: g[cle], ou: "phrase" };
  if (lexique[cle]) return { glose: lexique[cle], ou: "lexique" };
  if (MOTS_OUTILS[cle]) return { glose: MOTS_OUTILS[cle], ou: "outil" };
  return null;
}

/** La glose complète, prête pour la liseuse. */
export const gloseFinale = (g: GloseSource, cle: string): Glose => {
  const sortie: Glose = [g[0].trim(), (g[1] ?? "").trim() || cle, (g[2] ?? "").trim()];
  if (g[3]?.trim()) sortie.push(g[3].trim());
  return sortie;
};

export const lots = (id: string) =>
  existsSync(`${DOSSIER}/sortie/${id}`)
    ? readdirSync(`${DOSSIER}/sortie/${id}`)
        .filter((f) => /^pages-\d+\.json$/.test(f))
        .sort()
    : [];

/** Le numéro de la première page d'un lot d'entrée (texte classique), ou null. */
function entreeDebut(id: string, f: string): number | null {
  try {
    return (JSON.parse(readFileSync(`${DOSSIER}/entree/${id}/${f}`, "utf8")) as { debut: number }).debut;
  } catch {
    return null;
  }
}

const unPeu = (s: string) => (s.length > 90 ? `${s.slice(0, 90)}…` : s);

/** Contrôle une histoire entière, ou un seul de ses lots (« pages-02.json ») pendant qu'on y travaille. */
export function controlerHistoire(id: string, fichierSeul?: string): { problemes: string[]; pages: number; mots: number } {
  const p: string[] = [];
  const dossier = `${DOSSIER}/sortie/${id}`;
  let meta: Meta | null = null;
  try {
    meta = JSON.parse(readFileSync(`${dossier}/meta.json`, "utf8")) as Meta;
  } catch (e) {
    if (!fichierSeul || fichierSeul === "pages-01.json") p.push(`${id} : meta.json absent ou illisible (${(e as Error).message})`);
  }
  if (meta) {
    for (const k of ["id", "titre", "titreFr", "auteur", "niveau", "genre", "resume"] as const) if (typeof meta[k] !== "string" || !String(meta[k]).trim()) p.push(`${id} : meta « ${k} » manquant`);
    if (meta.id !== id) p.push(`${id} : meta « id » vaut « ${meta.id} »`);
    if (!NIVEAUX.includes(meta.niveau)) p.push(`${id} : niveau inconnu « ${meta.niveau} »`);
    if (!Array.isArray(meta.questions) || meta.questions.length < 6 || meta.questions.length > 12) p.push(`${id} : il faut 6 à 12 questions de compréhension`);
    else
      meta.questions.forEach((q, k) => {
        if (!("o" in q)) p.push(`${id} : la question ${k + 1} doit être un choix (« o »)`);
        p.push(...controlerExercice(q, `${id} question ${k + 1}`));
      });
  }
  const fichiers = lots(id).filter((f) => !fichierSeul || f === fichierSeul);
  if (!fichiers.length) p.push(`${id} : aucun lot ${fichierSeul ?? "pages-NN.json"}`);
  const classique = existsSync(`${DOSSIER}/entree/${id}`);
  let attendu = 1;
  let mots = 0;
  let pages = 0;
  for (const f of fichiers) {
    let lot: LotSource;
    try {
      lot = JSON.parse(readFileSync(`${dossier}/${f}`, "utf8")) as LotSource;
    } catch (e) {
      p.push(`${id}/${f} : JSON illisible (${(e as Error).message})`);
      continue;
    }
    if (fichierSeul) attendu = lot.debut;
    else if (lot.debut !== attendu) p.push(`${id}/${f} : « debut » vaut ${lot.debut}, attendu ${attendu}`);
    if (entreeDebut(id, f) !== null && entreeDebut(id, f) !== lot.debut) p.push(`${id}/${f} : « debut » doit valoir ${entreeDebut(id, f)}, comme le lot d'entrée`);
    if (!Array.isArray(lot.pages) || !lot.pages.length) {
      p.push(`${id}/${f} : aucune page`);
      continue;
    }
    for (const [cle, g] of Object.entries(lot.lexique ?? {})) {
      if (!estGlose(g)) p.push(`${id}/${f} : glose du lexique « ${cle} » mal formée`);
      if (cle !== cleMot(cle)) p.push(`${id}/${f} : clé du lexique « ${cle} » : écris « ${cleMot(cle)} »`);
    }
    let entree: { debut: number; pages: { titre?: string; p: string[][] }[] } | null = null;
    if (classique) {
      try {
        entree = JSON.parse(readFileSync(`${DOSSIER}/entree/${id}/${f}`, "utf8"));
      } catch {
        p.push(`${id}/${f} : pas de lot d'entrée correspondant`);
      }
      if (entree && entree.pages.length !== lot.pages.length) p.push(`${id}/${f} : ${lot.pages.length} pages au lieu de ${entree.pages.length}`);
    }
    lot.pages.forEach((page, k) => {
      const ou = `${id} p.${lot.debut + k}`;
      let motsPage = 0;
      if (!Array.isArray(page.p) || !page.p.length) return void p.push(`${ou} : page vide`);
      if (page.titre !== undefined && (typeof page.titre !== "string" || !page.titre.trim())) p.push(`${ou} : titre vide`);
      page.p.forEach((para, j) => {
        if (!Array.isArray(para) || !para.length) return void p.push(`${ou} § ${j + 1} : paragraphe vide`);
        para.forEach((ph) => {
          if (typeof ph?.en !== "string" || !ph.en.trim() || /\n/.test(ph.en)) return void p.push(`${ou} : phrase anglaise vide ou sur plusieurs lignes`);
          if (typeof ph.fr !== "string" || !ph.fr.trim()) p.push(`${ou} : traduction manquante pour « ${unPeu(ph.en)} »`);
          else if (ph.fr.trim() === ph.en.trim() && motsDe(ph.en).length > 3) p.push(`${ou} : la traduction recopie l'anglais « ${unPeu(ph.en)} »`);
          const g = ph.g ?? {};
          if (typeof g !== "object" || Array.isArray(g)) p.push(`${ou} : « g » doit être un objet`);
          const toks = motsDe(ph.en);
          const compte = new Map<string, number>();
          for (const t of toks) if (estMot(t)) compte.set(cleMot(t), (compte.get(cleMot(t)) ?? 0) + 1);
          for (const [cle, gl] of Object.entries(g)) {
            const [base, rang] = cle.split("#");
            if (!compte.has(base) || (rang && Number(rang) > (compte.get(base) ?? 0))) p.push(`${ou} : la glose « ${cle} » ne correspond à aucun mot de « ${unPeu(ph.en)} »`);
            if (!estGlose(gl)) p.push(`${ou} : glose « ${cle} » mal formée`);
            else if (gl[2] && !NATURES_GLOSE[gl[2]]) p.push(`${ou} : nature « ${gl[2]} » inconnue (glose « ${cle} »)`);
          }
          const vus = new Map<string, number>();
          for (const t of toks) {
            if (!estMot(t)) continue;
            motsPage++;
            const cle = cleMot(t);
            const rang = (vus.get(cle) ?? 0) + 1;
            vus.set(cle, rang);
            if (!gloseDe(cle, rang, ph, lot.lexique)) p.push(`${ou} : mot sans glose « ${t} » dans « ${unPeu(ph.en)} »`);
          }
        });
      });
      mots += motsPage;
      pages++;
      if (entree) {
        const e = entree.pages[k];
        if (e) {
          const net = (s: string) => s.replace(/\s+/g, " ").trim();
          if ((e.titre ?? "") !== (page.titre ?? "")) p.push(`${ou} : le titre de partie a changé`);
          if (e.p.length !== page.p.length) p.push(`${ou} : ${page.p.length} paragraphes au lieu de ${e.p.length}`);
          else
            e.p.forEach((para, j) => {
              const avant = net(para.join(" "));
              const apres = net(page.p[j].map((ph) => ph.en ?? "").join(" "));
              if (avant !== apres) p.push(`${ou} § ${j + 1} : l'anglais a changé (« ${unPeu(avant)} »)`);
            });
        }
      } else if (meta && GABARITS[meta.niveau]) {
        const { min, max } = GABARITS[meta.niveau];
        if (motsPage < min || motsPage > max) p.push(`${ou} : ${motsPage} mots (attendu de ${min} à ${max} pour ${meta.niveau})`);
      }
    });
    attendu = lot.debut + lot.pages.length;
  }
  if (fichierSeul) return { problemes: p, pages, mots };
  if (meta && !classique && GABARITS[meta.niveau] && pages < GABARITS[meta.niveau].pages) p.push(`${id} : ${pages} pages, il en faut au moins ${GABARITS[meta.niveau].pages} en ${meta.niveau}`);
  if (classique) {
    const attendues = readdirSync(`${DOSSIER}/entree/${id}`).filter((f) => /^pages-\d+\.json$/.test(f)).length;
    if (fichiers.length < attendues) p.push(`${id} : ${fichiers.length} lot(s) traduit(s) sur ${attendues}`);
  }
  return { problemes: p, pages, mots };
}
