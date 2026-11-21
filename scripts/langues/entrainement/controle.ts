/*
 * Le contrôle des exercices d'entraînement (partagé par valider.mts, ranger.mts et les tests).
 */
import { existsSync, readFileSync } from "node:fs";
import { normaliser } from "../../../src/lib/regles/verifier";
import { type Exercice, typeExercice } from "../../../src/lib/regles/types";

const DOSSIER = "scripts/langues/entrainement";
export const MINIMUM = 20;

type Entree = { section: string; niveau: string; lecons: { id: string; defi_deja_pose: string[] }[] };

const texte = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const liste = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(texte);

export function controlerExercice(x: Exercice, ou: string): string[] {
  const p: string[] = [];
  const o = x as Record<string, unknown>;
  if (!texte(o.q)) p.push(`${ou} : consigne « q » vide`);
  if (!texte(o.i)) p.push(`${ou} : indice « i » vide`);
  if (!texte(o.e)) p.push(`${ou} : correction « e » vide`);
  if (o.d !== undefined && ![1, 2, 3].includes(o.d as number)) p.push(`${ou} : difficulté « d » doit valoir 1, 2 ou 3`);
  for (const k of ["q", "i", "e"]) if (typeof o[k] === "string" && (o[k] as string).length > 420) p.push(`${ou} : « ${k} » trop long (${(o[k] as string).length} signes)`);
  if (typeof o.q === "string" && /\[[a-z]:/.test(o.q)) p.push(`${ou} : pas de couleurs [x:…] dans la consigne`);
  const connus = new Set(["q", "i", "e", "d", "o", "io", "r", "p", "m", "fin", "alt", "f"]);
  for (const k of Object.keys(o)) if (!connus.has(k)) p.push(`${ou} : champ inconnu « ${k} »`);
  const type = typeExercice(x);
  if (type === "choix") {
    const opts = o.o as unknown[];
    if (!liste(opts) || opts.length < 2 || opts.length > 4) p.push(`${ou} : « o » doit avoir 2 à 4 options`);
    else if (new Set(opts.map((s) => normaliser(String(s)))).size !== opts.length) p.push(`${ou} : options en double`);
    if (o.io !== undefined) {
      if (typeof o.io !== "object" || o.io === null) p.push(`${ou} : « io » doit être un objet`);
      else for (const cle of Object.keys(o.io)) if (!Array.isArray(opts) || !opts.includes(cle) || cle === opts[0]) p.push(`${ou} : « io » vise « ${cle} », qui n'est pas un mauvais choix`);
    }
    if ("r" in o || "m" in o || "f" in o || "p" in o) p.push(`${ou} : un choix ne porte que q, o, io, i, e, d`);
  } else if (type === "ecrire") {
    if (!liste(o.r)) p.push(`${ou} : « r » doit lister au moins une réponse`);
  } else if (type === "corriger") {
    if (!texte(o.f)) p.push(`${ou} : « f » (phrase fautive) vide`);
    if (!liste(o.r)) p.push(`${ou} : « r » doit lister au moins une correction`);
    else if ((o.r as string[]).some((r) => normaliser(r) === normaliser(String(o.f)))) p.push(`${ou} : la phrase fautive figure parmi les corrections`);
    if (typeof o.f === "string" && o.f.includes("*")) p.push(`${ou} : pas d'étoile dans « f » (l'erreur doit se chercher)`);
  } else if (type === "ordre") {
    const m = o.m as unknown[];
    if (!liste(m) || m.length < 3 || m.length > 14) p.push(`${ou} : « m » doit avoir 3 à 14 morceaux`);
    else {
      for (const t of m as string[]) if (/[.?!]$/.test(t) && !/^(Mr|Mrs|Ms|Dr|St)\.$/.test(t)) p.push(`${ou} : morceau « ${t} » : la ponctuation finale va dans « fin »`);
      const tri = (l: string[]) => l.map((s) => s.toLowerCase()).sort().join("|");
      for (const v of (o.alt as string[][] | undefined) ?? []) if (!Array.isArray(v) || tri(v) !== tri(m as string[])) p.push(`${ou} : une variante « alt » n'utilise pas exactement les mêmes morceaux`);
      if (new Set((m as string[]).map((s) => s.toLowerCase())).size < m.length && !o.alt) {
        // Deux morceaux identiques : permis, l'un vaut l'autre.
      }
    }
    if (o.fin !== undefined && ![".", "?", "!"].includes(o.fin as string)) p.push(`${ou} : « fin » vaut ".", "?" ou "!"`);
  } else {
    const mots = String(o.p ?? "").split(/\s+/);
    if (!mots.some((w) => w.startsWith("*") && w.length > 1)) p.push(`${ou} : « p » doit marquer au moins un mot avec *`);
    if (mots.length > 30) p.push(`${ou} : phrase à toucher trop longue`);
  }
  return p;
}

export function controlerLot(nom: string): { problemes: string[]; total: number } {
  const entree = JSON.parse(readFileSync(`${DOSSIER}/entree/${nom}.json`, "utf8")) as Entree;
  const chemin = `${DOSSIER}/sortie/${nom}.json`;
  if (!existsSync(chemin)) return { problemes: [`${nom} : fichier de sortie absent`], total: 0 };
  let sortie: Record<string, Exercice[]>;
  try {
    sortie = JSON.parse(readFileSync(chemin, "utf8"));
  } catch (e) {
    return { problemes: [`${nom} : JSON illisible (${(e as Error).message})`], total: 0 };
  }
  const problemes: string[] = [];
  let total = 0;
  const attendues = new Set(entree.lecons.map((l) => l.id));
  for (const id of Object.keys(sortie)) if (!attendues.has(id)) problemes.push(`${nom} : leçon inconnue « ${id} »`);
  for (const l of entree.lecons) {
    const ex = sortie[l.id];
    if (!Array.isArray(ex)) {
      problemes.push(`${nom}/${l.id} : leçon absente`);
      continue;
    }
    total += ex.length;
    if (ex.length < MINIMUM) problemes.push(`${nom}/${l.id} : ${ex.length} exercices, il en faut au moins ${MINIMUM}`);
    const types = new Set(ex.map(typeExercice));
    if (types.size < 4) problemes.push(`${nom}/${l.id} : seulement ${types.size} types d'exercices (au moins 4)`);
    const niveaux = new Set(ex.map((x) => x.d));
    for (const d of [1, 2, 3]) if (!niveaux.has(d as 1)) problemes.push(`${nom}/${l.id} : aucune question de difficulté ${d}`);
    const vus = new Set<string>();
    const deja = new Set(l.defi_deja_pose.map(normaliser));
    ex.forEach((x, k) => {
      const ou = `${nom}/${l.id}#${k + 1}`;
      problemes.push(...controlerExercice(x, ou));
      const o = x as Record<string, unknown>;
      const signature = normaliser(`${o.q} ${o.p ?? ""} ${o.f ?? ""} ${Array.isArray(o.m) ? (o.m as string[]).join(" ") : ""} ${Array.isArray(o.o) ? (o.o as string[]).join("|") : ""}`);
      if (vus.has(signature)) problemes.push(`${ou} : exercice en double`);
      vus.add(signature);
      if (deja.has(normaliser(`${o.q}${"p" in o ? ` ${o.p}` : ""}`)) && !("m" in o) && !("f" in o)) problemes.push(`${ou} : reprend une question du défi`);
    });
  }
  return { problemes, total };
}

