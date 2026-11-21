/*
 * L'Écorché — les questions sur les fonctions.
 *
 * Les fiches disent ce que fait chaque structure : l'action d'un muscle (articulation, mouvement, rôle), son nerf et
 * ses racines, le test qui l'examine ; la provenance d'une artère, ses branches dans l'ordre, l'endroit où l'on prend
 * son pouls ; ce que sent un nerf, ce que donne son atteinte, le réflexe qu'il porte ; le rôle d'un organe.
 * Ce module en tire des questions, avec la règle des autres : une graine donne toujours la même question.
 * Chaque question dit aussi ce que le corps montre pendant et après : le geste joué, le chemin du sang allumé,
 * le pouls qui bat. Module pur : les fiches lui sont données, déjà chargées.
 */
import { ELEMENTS, PAR_ID } from "./catalogue";
import type { CoucheAFiches, FichesDe, Recueil } from "./fiches/types";
import type { Facette } from "./memoire";
import { DDL, NOMS_MOUVEMENTS } from "./mouvement/articulations";
import { type Action, gesteDe } from "./mouvement/gestes";
import { ELEMENTS_APPRIS, EN_PLANCHE } from "./niveaux";
import type { Difficulte, Option, Question } from "./quiz";
import { article, majuscule, minuscule, normaliser } from "./texte";
import { type Couche, type Element, REGIONS } from "./types";
import { hasard } from "./vec";

export const TYPES_FONCTION = ["mouvement", "quel-muscle", "geste", "agoniste", "qui-innerve", "racines", "reflexe", "cas-clinique", "sang", "pouls", "sensibilite", "branches", "tester", "reconstruis", "role"] as const;
export type TypeFonction = (typeof TYPES_FONCTION)[number];
export const estFonction = (t: string): t is TypeFonction => (TYPES_FONCTION as readonly string[]).includes(t);

/** Les fiches déjà chargées, par couche. */
export type Recueils = { [C in CoucheAFiches]?: Recueil<C> };

/** Les couches de fiches dont une couche a besoin pour ses questions de fonction (le réflexe d'un tendon passe par son muscle…). */
export const FICHES_UTILES: Record<Couche, CoucheAFiches[]> = {
  os: ["os"],
  muscle: ["muscle"],
  tendon: ["tendon", "muscle"],
  ligament: ["ligament"],
  artere: ["artere"],
  veine: ["veine"],
  nerf: ["nerf", "muscle"],
  viscere: ["viscere"],
  encephale: ["encephale"],
  lymphe: ["lymphe"],
};

export const METHODES_FONCTION: Record<TypeFonction, { nom: string; texte: string; facette: Facette }> = {
  mouvement: { nom: "Regarde le mouvement", texte: "Le muscle se contracte : quel mouvement produit-il ?", facette: "fonction" },
  "quel-muscle": { nom: "Qui fait ce geste ?", texte: "Le corps bouge : quel muscle en est le moteur ?", facette: "fonction" },
  geste: { nom: "Fais le geste", texte: "Fais bouger le corps comme ce muscle le ferait.", facette: "fonction" },
  agoniste: { nom: "Agoniste ou antagoniste ?", texte: "Pour ce mouvement, ce muscle le produit-il ou le freine-t-il ?", facette: "fonction" },
  "qui-innerve": { nom: "Qui innerve ?", texte: "Quel nerf commande ce muscle ?", facette: "innervation" },
  racines: { nom: "Les racines", texte: "De quels étages de la moelle vient sa commande ?", facette: "innervation" },
  reflexe: { nom: "Réflexe et racine", texte: "Quelles racines ce réflexe explore-t-il ?", facette: "clinique" },
  "cas-clinique": { nom: "Cas clinique", texte: "Des signes : quelle structure est atteinte ?", facette: "clinique" },
  sang: { nom: "Suis le sang", texte: "Remets dans l'ordre le chemin du sang.", facette: "vaisseaux" },
  pouls: { nom: "Où prendre le pouls ?", texte: "On le palpe ici : quelle artère bat ?", facette: "vaisseaux" },
  sensibilite: { nom: "Le territoire", texte: "Ce territoire de peau : quel nerf le sent ?", facette: "innervation" },
  branches: { nom: "Les branches dans l'ordre", texte: "De l'origine à la fin : dans quel ordre naissent-elles ?", facette: "vaisseaux" },
  tester: { nom: "Comment le tester ?", texte: "Cet examen : que teste-t-il ?", facette: "clinique" },
  reconstruis: { nom: "Reconstruis", texte: "Touche dans l'ordre les pièces d'un trajet.", facette: "situer" },
  role: { nom: "À quoi sert-il ?", texte: "Ce rôle : quelle structure le tient ?", facette: "fonction" },
};

/* ---------- Petits outils ---------- */

type Rnd = () => number;
const choisir = <T>(r: Rnd, l: readonly T[]): T => l[Math.floor(r() * l.length)];
function melanger<T>(r: Rnd, l: readonly T[]): T[] {
  const a = l.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const GRANDE = new Map(REGIONS.map((r) => [r.id, r.grande]));
const unique = <T>(l: T[], cle: (x: T) => string) => {
  const vu = new Set<string>();
  return l.filter((x) => {
    const k = cle(x);
    if (vu.has(k)) return false;
    vu.add(k);
    return true;
  });
};

function fiche<C extends CoucheAFiches>(r: Recueils, c: C, id: string | null | undefined): FichesDe[C] | undefined {
  if (!id) return undefined;
  return (r[c] as Recueil<C> | undefined)?.fiches[id];
}
function fichesDe<C extends CoucheAFiches>(r: Recueils, c: C): [string, FichesDe[C]][] {
  const rec = r[c] as Recueil<C> | undefined;
  return rec ? Object.entries(rec.fiches).filter(([id]) => PAR_ID.has(id)) : [];
}

/** « du biceps », « de la clavicule », « de l'aorte », « des lombricaux ». */
export function deLe(e: Element): string {
  const le = article(e);
  if (le.startsWith("le ")) return `du ${le.slice(3)}`;
  if (le.startsWith("les ")) return `des ${le.slice(4)}`;
  return `de ${le}`;
}

/** Ôte d'un texte le nom de la structure et ses variantes : l'indice ne doit pas donner la réponse. */
export function masquer(texte: string, e: Element): string {
  const formes = new Set<string>([e.nom, ...(e.noms ?? [])].filter((f) => f.length >= 3));
  for (const f of [...formes]) {
    // « Nerf radial » se dit aussi « radial » ; « Artère faciale », « faciale ».
    const sans = f.replace(/^(nerf|muscle|artère|veine|ligament|tendon|lymphonœuds?|branches?|rameaux?|tronc|sinus|glande)\s+(du |de la |de l'|des |de )?/i, "").replace(/\s*\([^)]*\)\s*$/, "");
    if (sans.length >= 5 && sans !== f) formes.add(sans);
    const sansParenthese = f.replace(/\s*\([^)]*\)\s*$/, "");
    if (sansParenthese.length >= 5) formes.add(sansParenthese);
  }
  let t = texte;
  for (const f of [...formes].sort((a, b) => b.length - a.length)) {
    const motif = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+");
    // (sans lookbehind : les navigateurs plus anciens ne le lisent pas)
    t = t.replace(new RegExp(`(^|[^\\p{L}])${motif}(?![\\p{L}])`, "giu"), "$1…");
  }
  // Les mots de la même famille trahissent aussi : « thalamique » pour le thalamus, « pancréatique » pour le pancréas.
  const racines = sansAccent(e.nom)
    .split(/[^a-z]+/)
    .filter((m) => m.length >= 6 && !GENERIQUES.has(m))
    .map((m) => m.slice(0, 6));
  if (racines.length) t = t.replace(/[\p{L}]+/gu, (m) => (m.length >= 6 && racines.some((r) => sansAccent(m).startsWith(r)) ? "…" : m));
  return t.replace(/…(\s*…)+/g, "…");
}
const sansAccent = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe");
/** Les mots qui ne disent pas de quelle structure il s'agit (on ne les masque pas). */
const GENERIQUES = new Set(
  "muscle muscles artere arteres veine veines ligament ligaments branche branches rameau rameaux faisceau tractus noyau noyaux gyrus sillon lobule glande segment segmentaire lymphonoeud lymphonoeuds anterieur anterieure anterieurs posterieur posterieure posterieurs lateral laterale lateraux medial mediale mediaux superieur superieure superieurs inferieur inferieure inferieurs profond profonde profondes superficiel superficielle commun commune interne externe grande petite moyenne longue courte propre accessoire principal principale droite gauche transverse oblique intermediaire ascendant ascendante descendant descendante recurrent recurrente cutane cutanee musculaire articulaire collateral collaterale terminal terminale dorsal dorsale palmaire plantaire communicante perforante perforantes digitale digitales premier premiere deuxieme troisieme quatrieme cinquieme".split(" "),
);

/** Le début d'un texte, coupé à une fin de phrase ou de proposition. */
export function court(texte: string, max = 220): string {
  const t = texte.trim();
  if (t.length <= max) return t;
  const coupe = Math.max(t.lastIndexOf(". ", max), t.lastIndexOf(" ; ", max), t.lastIndexOf(" : ", max));
  return coupe > max * 0.45 ? `${t.slice(0, coupe).trim()}…` : `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Ce qu'on montre après la réponse : le texte entier, s'il dit plus que l'indice (un mot masqué, une suite coupée). */
const deplus = (texte: string, indice: string) => (normaliser(texte) === normaliser(indice) ? undefined : court(texte, 360));

/** Le nom d'un lien de fiche : l'élément s'il existe, sinon le début du texte (« Artère tympanique antérieure »). */
const nomLien = (l: { texte: string }, id?: string | null) => (id && PAR_ID.has(id) ? PAR_ID.get(id)!.nom : l.texte.split(/\s[(:;]|,\s/)[0].trim());

/* ---------- Les mouvements ---------- */

/** « du coude », « de l'épaule »… (vide : le mouvement se dit seul, comme l'inspiration). */
const DE_ARTICULATION: Record<string, string> = {
  "temporo-mandibulaire": "de la mâchoire",
  "os-hyoide": "de l'os hyoïde",
  tete: "de la tête",
  "rachis-cervical": "du cou",
  "rachis-thoracique": "du rachis thoracique",
  "rachis-lombaire": "du rachis lombaire",
  respiration: "",
  cotes: "des côtes",
  scapula: "de la scapula",
  epaule: "de l'épaule",
  coude: "du coude",
  "radio-ulnaire": "de l'avant-bras",
  poignet: "du poignet",
  "pouce-cmc": "du pouce, à sa base",
  "pouce-mcp": "du pouce",
  "pouce-ip": "du bout du pouce",
  "doigts-mcp": "des doigts, à leur base",
  "doigts-ipp": "des doigts, au milieu",
  "doigts-ipd": "du bout des doigts",
  hanche: "de la hanche",
  genou: "du genou",
  cheville: "de la cheville",
  subtalaire: "de l'arrière-pied",
  "hallux-mtp": "du gros orteil",
  "hallux-ip": "du bout du gros orteil",
  "orteils-mtp": "des orteils",
  "orteils-ip": "du bout des orteils",
  oeil: "de l'œil",
  bassin: "du bassin",
  visage: "du visage",
  paupiere: "de la paupière",
  langue: "de la langue",
  "voile-du-palais": "du voile du palais",
  pharynx: "du pharynx",
  larynx: "du larynx",
  oreille: "de l'oreille",
  abdomen: "de l'abdomen",
};

/** « Flexion du coude », « Rotation de la tête, vers le côté opposé », « Inspiration ». */
export function nomAction(a: { articulation: string; mouvement: string }): string {
  const de = DE_ARTICULATION[a.articulation] ?? "";
  if (a.mouvement === "rotation-homolaterale") return `Rotation ${de}, vers le côté du muscle`.replace(/ ,/, ",");
  if (a.mouvement === "rotation-controlaterale") return `Rotation ${de}, vers le côté opposé`.replace(/ ,/, ",");
  const m = NOMS_MOUVEMENTS[a.mouvement] ?? majuscule(a.mouvement);
  return de ? `${m} ${de}` : m;
}
/** « la flexion du coude », « l'abduction de l'épaule ». */
const leMouvement = (a: { articulation: string; mouvement: string }) => {
  const n = minuscule(nomAction(a));
  return /^[aeéèêiîoôuœ]/i.test(n) ? `l'${n}` : `la ${n}`;
};

export const OPPOSE: Record<string, string> = {
  flexion: "extension",
  extension: "flexion",
  abduction: "adduction",
  adduction: "abduction",
  "rotation-mediale": "rotation-laterale",
  "rotation-laterale": "rotation-mediale",
  pronation: "supination",
  supination: "pronation",
  elevation: "abaissement",
  abaissement: "elevation",
  protraction: "retraction",
  retraction: "protraction",
  "flexion-dorsale": "flexion-plantaire",
  "flexion-plantaire": "flexion-dorsale",
  inversion: "eversion",
  eversion: "inversion",
  "sonnette-laterale": "sonnette-mediale",
  "sonnette-mediale": "sonnette-laterale",
  inspiration: "expiration",
  expiration: "inspiration",
  fermeture: "ouverture",
  ouverture: "fermeture",
  propulsion: "retropulsion",
  retropulsion: "propulsion",
};

/** Une action que le squelette sait jouer. */
export const jouable = (a: Action) => a.role === "principal" && Boolean(gesteDe(a.articulation, a.mouvement, "g"));

/** Une action jouée par un seul degré de liberté (« Fais le geste » se fait avec un curseur). */
function degreSeul(a: Action): { ddl: string; sens: 1 | -1 } | null {
  const g = gesteDe(a.articulation, a.mouvement, "g");
  if (!g) return null;
  const cles = Object.keys(g.arrivee).filter((k) => g.arrivee[k] !== (g.depart[k] ?? 0));
  if (cles.length !== 1) return null;
  const k = cles[0];
  const ddl = k.split(":")[0];
  if (!DDL.some((d) => d.id === ddl)) return null;
  return { ddl, sens: g.arrivee[k] > (g.depart[k] ?? 0) ? 1 : -1 };
}

/* ---------- Les index tirés des fiches (une fois par recueil) ---------- */

type Index = {
  /** articulation|mouvement → muscles qui le font en principal. */
  principaux: Map<string, Set<string>>;
  /** muscle → toutes ses actions (articulation|mouvement), tous rôles. */
  toutes: Map<string, Set<string>>;
  /** Les libellés des actions jouables, pour les faux choix. */
  libelles: { cle: string; texte: string; articulation: string }[];
  reflexes: { id: string; nom: string; racines: string[]; muscle?: string }[];
};
const INDEX = new WeakMap<object, Index>();

function index(r: Recueils): Index {
  const cleCache = (r.muscle ?? r) as object;
  const deja = INDEX.get(cleCache);
  if (deja && (r.tendon === undefined || deja.reflexes.length)) return deja;
  const principaux = new Map<string, Set<string>>();
  const toutes = new Map<string, Set<string>>();
  const libelles: Index["libelles"] = [];
  for (const [id, f] of fichesDe(r, "muscle")) {
    const t = new Set<string>();
    for (const a of f.actions) {
      const k = `${a.articulation}|${a.mouvement}`;
      t.add(k);
      if (a.role === "principal") {
        if (!principaux.has(k)) principaux.set(k, new Set());
        principaux.get(k)!.add(id);
        if (jouable(a)) libelles.push({ cle: k, texte: nomAction(a), articulation: a.articulation });
      }
    }
    toutes.set(id, t);
  }
  const reflexes: Index["reflexes"] = [];
  for (const [id, f] of fichesDe(r, "tendon")) if (f.reflexe?.racines?.length) reflexes.push({ id, nom: f.reflexe.nom, racines: f.reflexe.racines, muscle: f.muscles?.[0] });
  for (const [id, f] of fichesDe(r, "nerf")) if (f.reflexe?.racines?.length) reflexes.push({ id, nom: f.reflexe.nom, racines: f.reflexe.racines, muscle: f.moteur?.muscles?.[0] });
  const ix: Index = { principaux, toutes, libelles: unique(libelles, (l) => l.cle), reflexes };
  INDEX.set(cleCache, ix);
  return ix;
}

/** « C5-C6 », « C8-T1 », « L4, S1 » : des racines voisines se disent d'un trait. */
const ORDRE_RACINES = [..."12345678"].map((n) => `C${n}`).concat([...Array(12)].map((_, i) => `T${i + 1}`), [..."12345"].map((n) => `L${n}`), [..."12345"].map((n) => `S${n}`), ["Co1"]);
export function nomRacines(l: string[]): string {
  const rangs = unique(l, (x) => x)
    .map((x) => ORDRE_RACINES.indexOf(x.toUpperCase().replace("CO", "Co")))
    .filter((k) => k >= 0)
    .sort((a, b) => a - b);
  if (!rangs.length) return l.join(", ");
  const suite = rangs.every((k, i) => i === 0 || k === rangs[i - 1] + 1);
  if (suite) return rangs.length === 1 ? ORDRE_RACINES[rangs[0]] : `${ORDRE_RACINES[rangs[0]]}-${ORDRE_RACINES[rangs[rangs.length - 1]]}`;
  return rangs.map((k) => ORDRE_RACINES[k]).join(", ");
}
const RACINES_COURANTES = ["C3-C5", "C5-C6", "C6-C7", "C7-C8", "C8-T1", "T7-T12", "L1-L2", "L2-L4", "L3-L4", "L4-L5", "L5-S1", "S1-S2", "S2-S4"];

/* ---------- Les chaînes : du tronc à la branche ---------- */

/** Le chemin du sang jusqu'à une artère (du plus gros tronc à elle), ou depuis une veine jusqu'au cœur. */
function chaine(r: Recueils, couche: "artere" | "veine" | "nerf", id: string): string[] {
  const parent = (x: string): string | null | undefined => {
    if (couche === "artere") return fiche(r, "artere", x)?.provenance.artere;
    if (couche === "veine") return fiche(r, "veine", x)?.terminaison.veine;
    return fiche(r, "nerf", x)?.origine.nerf;
  };
  const l = [id];
  const vu = new Set(l);
  for (let x = parent(id); x && PAR_ID.has(x) && !vu.has(x) && l.length < 12; x = parent(x)) {
    l.push(x);
    vu.add(x);
  }
  // Les artères et les nerfs se lisent du tronc vers la branche ; les veines, de la branche vers le cœur.
  return couche === "veine" ? l : l.reverse();
}

/* ---------- Qui peut être interrogé sur quoi ---------- */

/** Les questions de fonction possibles pour une structure, selon sa fiche. */
export function typesFonction(e: Element, r: Recueils): TypeFonction[] {
  const t: TypeFonction[] = [];
  switch (e.couche) {
    case "muscle": {
      const f = fiche(r, "muscle", e.id);
      if (!f) break;
      const jouables = f.actions.filter(jouable);
      if (jouables.length) t.push("mouvement", "quel-muscle");
      if (jouables.some((a) => degreSeul(a))) t.push("geste");
      if (f.actions.some((a) => a.role === "principal" && OPPOSE[a.mouvement])) t.push("agoniste");
      if (f.innervation?.texte) t.push("qui-innerve");
      if (f.innervation?.racines?.length) t.push("racines");
      if (f.test) t.push("tester");
      break;
    }
    case "tendon": {
      const f = fiche(r, "tendon", e.id);
      if (f?.reflexe?.racines?.length) t.push("reflexe");
      if (f && !f.derive && f.role) t.push("role");
      break;
    }
    case "nerf": {
      const f = fiche(r, "nerf", e.id);
      if (!f) break;
      if (f.reflexe?.racines?.length) t.push("reflexe");
      if (f.atteinte) t.push("cas-clinique");
      if (f.sensitif?.texte) t.push("sensibilite");
      if (chaine(r, "nerf", e.id).length >= 3) t.push("reconstruis");
      break;
    }
    case "artere": {
      const f = fiche(r, "artere", e.id);
      if (!f) break;
      const c = chaine(r, "artere", e.id);
      if (c.length >= 4) t.push("sang");
      if (c.length >= 3) t.push("reconstruis");
      if (f.pouls?.ou) t.push("pouls");
      if ((f.branches ?? []).length >= 3) t.push("branches");
      break;
    }
    case "veine":
      if (fiche(r, "veine", e.id) && chaine(r, "veine", e.id).length >= 4) t.push("sang");
      break;
    case "ligament": {
      const f = fiche(r, "ligament", e.id);
      if (f?.test) t.push("tester");
      if (f?.role) t.push("role");
      break;
    }
    case "viscere":
      if (fiche(r, "viscere", e.id)?.fonction) t.push("role");
      break;
    case "encephale": {
      const f = fiche(r, "encephale", e.id);
      if (f?.fonction) t.push("role");
      if (f?.atteinte) t.push("cas-clinique");
      break;
    }
    default:
      break;
  }
  return t;
}

/* ---------- Fabriquer une question ---------- */

const reservoir = (e: Element): readonly Element[] => (EN_PLANCHE.has(e.id) ? ELEMENTS_APPRIS : ELEMENTS);

/** Les faux choix parmi des candidats : avec la difficulté, de plus en plus près de la cible. */
function proches(r: Rnd, e: Element, candidats: Element[], n: number, d: Difficulte): Element[] {
  const base = unique(
    candidats.filter((x) => x.id !== e.id && normaliser(x.nom) !== normaliser(e.nom)),
    (x) => normaliser(x.nom),
  );
  const meme = base.filter((x) => x.region === e.region);
  const grande = base.filter((x) => GRANDE.get(x.region) === GRANDE.get(e.region));
  const tete = d === "difficile" ? [...meme, ...grande] : d === "normal" ? grande : [];
  const sortie: Element[] = [];
  for (const x of [...melanger(r, tete), ...melanger(r, base)]) {
    if (sortie.length >= n) break;
    if (!sortie.includes(x)) sortie.push(x);
  }
  return sortie;
}
const options = (r: Rnd, bonne: Option, faux: Option[]): Option[] => melanger(r, [bonne, ...faux]);
const opt = (e: Element): Option => ({ id: e.id, texte: e.nom });

export type ContexteFonction = { difficulte: Difficulte; recueils: Recueils };

export function fabriquerFonction(graine: number, id: string, type: TypeFonction, ctx: ContexteFonction): Question | null {
  const e = PAR_ID.get(id);
  if (!e) return null;
  const r = hasard(graine * 6151 + 29);
  const d = ctx.difficulte;
  const R = ctx.recueils;
  const le = article(e);
  const facette = METHODES_FONCTION[type].facette;
  const base = { type, cible: id, facette } as const;

  switch (type) {
    case "mouvement":
    case "quel-muscle": {
      const f = fiche(R, "muscle", id);
      const jouables = f?.actions.filter(jouable) ?? [];
      if (!f || !jouables.length) return null;
      const a = choisir(r, jouables);
      const ix = index(R);
      const cle = `${a.articulation}|${a.mouvement}`;
      if (type === "mouvement") {
        const siennes = ix.toutes.get(id) ?? new Set();
        const oppose = OPPOSE[a.mouvement] ? `${a.articulation}|${OPPOSE[a.mouvement]}` : null;
        const autres = ix.libelles.filter((l) => !siennes.has(l.cle));
        const tete = autres.filter((l) => l.cle === oppose || (d !== "facile" && l.articulation === a.articulation));
        const faux = unique([...melanger(r, tete), ...melanger(r, autres)], (l) => l.cle).slice(0, 3);
        if (faux.length < 3) return null;
        return {
          ...base,
          consigne: "Le muscle en lumière se contracte : quel mouvement produit-il ?",
          options: options(r, { id: cle, texte: nomAction(a) }, faux.map((l) => ({ id: l.cle, texte: l.texte }))),
          attendu: cle,
          reponse: "qcm",
          montrer: true,
          geste: { muscle: id, action: a, contracter: true },
          apres: { montrer: [id], jouer: { muscle: id, actions: [a] } },
          explication: f.action,
        };
      }
      // Qui fait ce geste : les faux choix ne font ce mouvement à aucun titre (souvent, ils font l'inverse).
      const nonPas = ELEMENTS.filter((x) => x.couche === "muscle" && x.id !== id && fiche(R, "muscle", x.id) && !(ix.toutes.get(x.id) ?? new Set()).has(cle));
      const inverses = new Set(OPPOSE[a.mouvement] ? (ix.principaux.get(`${a.articulation}|${OPPOSE[a.mouvement]}`) ?? []) : []);
      const tete = d === "facile" ? [] : nonPas.filter((x) => inverses.has(x.id));
      const faux = unique([...melanger(r, tete), ...proches(r, e, nonPas, 6, d)], (x) => x.id).slice(0, 3);
      if (faux.length < 3) return null;
      return {
        ...base,
        consigne: "Regarde le geste : quel muscle en est le moteur ?",
        indice: nomAction(a),
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        geste: { muscle: id, action: a, contracter: false },
        apres: { montrer: [id], jouer: { muscle: id, actions: [a] } },
        explication: f.action,
      };
    }

    case "geste": {
      const f = fiche(R, "muscle", id);
      const possibles = (f?.actions.filter(jouable) ?? []).map((a) => ({ a, seul: degreSeul(a) })).filter((x) => x.seul);
      if (!f || !possibles.length) return null;
      const { a, seul } = choisir(r, possibles);
      const ddl = DDL.find((x) => x.id === seul!.ddl)!;
      // Les curseurs : ceux de l'articulation, et ceux d'une articulation voisine pour qu'il faille choisir.
      const voisines: Record<string, string[]> = { coude: ["radio-ulnaire", "epaule"], "radio-ulnaire": ["coude", "poignet"], epaule: ["coude", "scapula"], poignet: ["radio-ulnaire", "doigts-mcp"], hanche: ["genou", "rachis-lombaire"], genou: ["hanche", "cheville"], cheville: ["genou", "subtalaire"], subtalaire: ["cheville"], scapula: ["epaule"], "rachis-cervical": ["tete"], tete: ["rachis-cervical"] };
      const autour = DDL.filter((x) => x.articulation === ddl.articulation || (voisines[ddl.articulation] ?? []).slice(0, 1).includes(x.articulation));
      const curseurs = unique(
        autour.filter((x) => !/^(majeur|annulaire|auriculaire|orteil[2-5])\./.test(x.id)),
        (x) => x.id,
      )
        .slice(0, 4)
        .map((x) => x.id);
      if (!curseurs.includes(ddl.id)) curseurs.unshift(ddl.id);
      return {
        ...base,
        consigne: `Fais le geste ${deLe(e)} : bouge le corps comme il le ferait.`,
        options: [],
        attendu: `${ddl.id}:${seul!.sens}`,
        reponse: "geste",
        montrer: true,
        curseurs: curseurs.slice(0, 4),
        apres: { montrer: [id], jouer: { muscle: id, actions: [a] } },
        explication: `${nomAction(a)}. ${f.action}`,
      };
    }

    case "agoniste": {
      const f = fiche(R, "muscle", id);
      if (!f) return null;
      const ix = index(R);
      const siennes = ix.toutes.get(id) ?? new Set();
      const actions = f.actions.filter((a) => a.role === "principal" && OPPOSE[a.mouvement] && !siennes.has(`${a.articulation}|${OPPOSE[a.mouvement]}`));
      if (!actions.length) return null;
      const a = choisir(r, actions);
      const cle = `${a.articulation}|${a.mouvement}`;
      const inverse = `${a.articulation}|${OPPOSE[a.mouvement]}`;
      const net = (x: string, oui: string, non: string) => {
        const t = ix.toutes.get(x) ?? new Set();
        return t.has(oui) && !t.has(non);
      };
      const agonistes = [...(ix.principaux.get(cle) ?? [])].filter((x) => x !== id && PAR_ID.has(x) && net(x, cle, inverse));
      const antagonistes = [...(ix.principaux.get(inverse) ?? [])].filter((x) => PAR_ID.has(x) && net(x, inverse, cle));
      // De préférence ceux que la fiche nomme, les synergistes et antagonistes classiques.
      const prefere = (l: string[], noms?: string[]) => (l.filter((x) => noms?.includes(x)).length ? l.filter((x) => noms?.includes(x)) : l);
      const veutAgoniste = agonistes.length && (!antagonistes.length || r() < 0.5);
      const liste = veutAgoniste ? prefere(agonistes, f.synergistes) : prefere(antagonistes, f.antagonistes);
      if (!liste.length) return null;
      const x = PAR_ID.get(choisir(r, liste))!;
      return {
        ...base,
        cible: x.id,
        consigne: `Pour ${leMouvement(a)}, ${article(x)} est…`,
        options: [
          { id: "agoniste", texte: "Agoniste : il produit ce mouvement" },
          { id: "antagoniste", texte: "Antagoniste : il produit le mouvement inverse" },
        ],
        attendu: veutAgoniste ? "agoniste" : "antagoniste",
        reponse: "qcm",
        montrer: true,
        apres: { montrer: [id, x.id], jouer: { muscle: id, actions: [a] } },
        explication: veutAgoniste ? `${majuscule(article(x))} et ${le} travaillent ensemble pour ${leMouvement(a)}.` : `${majuscule(article(x))} fait ${leMouvement({ articulation: a.articulation, mouvement: OPPOSE[a.mouvement] })} : il freine et contrôle ${leMouvement(a)}, que produit ${le}.`,
      };
    }

    case "qui-innerve": {
      const f = fiche(R, "muscle", id);
      if (!f?.innervation?.texte) return null;
      const bonne = (i: { nerf?: string | null; texte: string }) => ({ id: i.nerf && PAR_ID.has(i.nerf) ? i.nerf : `t:${nomLien(i)}`, texte: nomLien(i, i.nerf) });
      const juste = bonne(f.innervation);
      const autres = fichesDe(R, "muscle")
        .filter(([x]) => x !== id)
        .map(([x, g]) => ({ el: PAR_ID.get(x)!, o: bonne(g.innervation) }))
        .filter(({ o }) => normaliser(o.texte) !== normaliser(juste.texte) && !normaliser(juste.texte).includes(normaliser(o.texte)) && !normaliser(o.texte).includes(normaliser(juste.texte)));
      const voisins = proches(
        r,
        e,
        autres.map((x) => x.el),
        12,
        d,
      );
      const faux = unique(
        voisins.map((v) => autres.find((x) => x.el.id === v.id)!.o),
        (o) => normaliser(o.texte),
      ).slice(0, 3);
      if (faux.length < 3) return null;
      const nerf = f.innervation.nerf && PAR_ID.has(f.innervation.nerf) ? f.innervation.nerf : null;
      return {
        ...base,
        consigne: `Quel nerf commande ${le} ?`,
        options: options(r, juste, faux),
        attendu: juste.id,
        reponse: "qcm",
        montrer: true,
        apres: { montrer: nerf ? [id, nerf] : [id] },
        explication: `${f.innervation.texte}${f.innervation.racines?.length ? ` (${nomRacines(f.innervation.racines)})` : ""}.`,
      };
    }

    case "racines": {
      const f = fiche(R, "muscle", id);
      const l = f?.innervation?.racines ?? [];
      if (!f || !l.length) return null;
      const juste = nomRacines(l);
      const famille = juste[0];
      const autres = unique(
        fichesDe(R, "muscle")
          .map(([, g]) => nomRacines(g.innervation?.racines ?? []))
          .concat(RACINES_COURANTES)
          .filter((x) => x && x !== juste),
        (x) => x,
      );
      const tete = d === "facile" ? [] : autres.filter((x) => x[0] === famille);
      const faux = unique([...melanger(r, tete), ...melanger(r, autres)], (x) => x).slice(0, 3);
      if (faux.length < 3) return null;
      const nerf = f.innervation.nerf && PAR_ID.has(f.innervation.nerf) ? f.innervation.nerf : null;
      return {
        ...base,
        consigne: `De quelles racines vient la commande ${deLe(e)} ?`,
        options: options(
          r,
          { id: juste, texte: juste },
          faux.map((x) => ({ id: x, texte: x })),
        ),
        attendu: juste,
        reponse: "qcm",
        montrer: true,
        apres: { montrer: nerf ? [id, nerf] : [id] },
        explication: `${f.innervation.texte} : ${juste}.`,
      };
    }

    case "reflexe": {
      const ix = index(R);
      const refl = ix.reflexes.find((x) => x.id === id);
      if (!refl) return null;
      const juste = nomRacines(refl.racines);
      const autres = unique(
        ix.reflexes
          .map((x) => nomRacines(x.racines))
          .concat(RACINES_COURANTES)
          .filter((x) => x !== juste),
        (x) => x,
      );
      const faux = melanger(r, autres).slice(0, 3);
      if (faux.length < 3) return null;
      const nom = minuscule(refl.nom.replace(/\s*\([^)]*\)/g, ""));
      const muscle = refl.muscle && PAR_ID.has(refl.muscle) ? refl.muscle : null;
      const fm = fiche(R, "muscle", muscle);
      const action = fm?.actions.find(jouable);
      return {
        ...base,
        consigne: `Quelles racines ${nom.startsWith("réflexe") ? `le ${nom}` : nom} explore-t-il ?`,
        options: options(
          r,
          { id: juste, texte: juste },
          faux.map((x) => ({ id: x, texte: x })),
        ),
        attendu: juste,
        reponse: "qcm",
        montrer: true,
        apres: { montrer: muscle ? [id, muscle] : [id], jouer: muscle && action ? { muscle, actions: [action] } : undefined },
        explication: `${refl.nom} : ${juste}.`,
      };
    }

    case "cas-clinique": {
      const texte = e.couche === "nerf" ? fiche(R, "nerf", id)?.atteinte : e.couche === "encephale" ? fiche(R, "encephale", id)?.atteinte : undefined;
      if (!texte) return null;
      const indice = court(masquer(texte, e), 260);
      if (normaliser(indice).includes(normaliser(e.nom))) return null;
      const meme = (x: Element) => {
        if (x.couche !== e.couche) return false;
        if (e.couche === "nerf") return Boolean(fiche(R, "nerf", x.id)?.atteinte);
        return Boolean(fiche(R, "encephale", x.id)?.atteinte);
      };
      const faux = proches(r, e, reservoir(e).filter(meme), 3, d);
      if (faux.length < 3) return null;
      const muscles = e.couche === "nerf" ? (fiche(R, "nerf", id)?.moteur?.muscles ?? []).filter((m) => PAR_ID.has(m)).slice(0, 3) : [];
      return {
        ...base,
        consigne: e.couche === "nerf" ? "Quel nerf est atteint ?" : "Quelle structure est touchée ?",
        indice,
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        apres: { montrer: [id, ...muscles] },
        explication: deplus(texte, indice),
      };
    }

    case "sang": {
      const couche = e.couche === "veine" ? "veine" : "artere";
      if (e.couche !== "artere" && e.couche !== "veine") return null;
      const c = chaine(R, couche, id);
      if (c.length < 4) return null;
      const suite = couche === "artere" ? c.slice(-5) : c.slice(0, 5);
      return {
        ...base,
        consigne: couche === "artere" ? `Remets dans l'ordre le chemin du sang jusqu'à ${le}.` : `Remets dans l'ordre le chemin du sang, depuis ${le} jusqu'au cœur.`,
        options: melanger(
          r,
          suite.map((x) => opt(PAR_ID.get(x)!)),
        ),
        attendu: suite.join(">"),
        ordre: suite,
        reponse: "ordre",
        montrer: false,
        apres: { montrer: suite, pouls: couche === "artere" },
      };
    }

    case "pouls": {
      const f = fiche(R, "artere", id);
      if (!f?.pouls?.ou) return null;
      const indice = court(masquer(f.pouls.ou, e), 240);
      const autres = fichesDe(R, "artere")
        .filter(([x, g]) => x !== id && g.pouls?.ou)
        .map(([x]) => PAR_ID.get(x)!);
      const faux = proches(r, e, autres, 3, d);
      if (faux.length < 3) return null;
      // Une fois sur deux, la réponse se donne sur le corps : toucher l'artère qu'on sent battre là.
      if (r() < 0.5)
        return {
          ...base,
          consigne: "On prend un pouls à cet endroit : touche l'artère qui bat sous les doigts.",
          indice,
          options: [],
          attendu: id,
          reponse: "clic",
          montrer: false,
          apres: { montrer: [id], pouls: true },
          explication: deplus(f.pouls.ou, indice),
        };
      return {
        ...base,
        consigne: "On prend un pouls à cet endroit : quelle artère bat sous les doigts ?",
        indice,
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        apres: { montrer: [id], pouls: true },
        explication: deplus(f.pouls.ou, indice),
      };
    }

    case "sensibilite": {
      const f = fiche(R, "nerf", id);
      if (!f?.sensitif?.texte) return null;
      const indice = court(masquer(f.sensitif.texte, e), 240);
      if (normaliser(indice).includes(normaliser(e.nom))) return null;
      const autres = fichesDe(R, "nerf")
        .filter(([x, g]) => x !== id && g.sensitif?.texte)
        .map(([x]) => PAR_ID.get(x)!);
      const faux = proches(r, e, autres, 3, d);
      if (faux.length < 3) return null;
      return {
        ...base,
        consigne: "Ce territoire : quel nerf en porte la sensibilité ?",
        indice,
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        apres: { montrer: [id] },
        explication: deplus(f.sensitif.texte, indice),
      };
    }

    case "branches": {
      const f = fiche(R, "artere", id);
      const liste = unique(
        (f?.branches ?? []).map((b, k) => ({ id: b.artere && PAR_ID.has(b.artere) ? b.artere : `t:${k}`, texte: nomLien(b, b.artere) })),
        (o) => normaliser(o.texte),
      ).filter((o) => o.texte.length > 2);
      if (!f || liste.length < 3) return null;
      const suite = liste.slice(0, 5);
      return {
        ...base,
        consigne: `Dans quel ordre naissent les branches ${deLe(e)} ?`,
        options: melanger(r, suite),
        attendu: suite.map((o) => o.id).join(">"),
        ordre: suite.map((o) => o.id),
        reponse: "ordre",
        montrer: true,
        apres: { montrer: [id, ...suite.map((o) => o.id).filter((x) => PAR_ID.has(x))], pouls: true },
      };
    }

    case "tester": {
      const texte = e.couche === "muscle" ? fiche(R, "muscle", id)?.test : e.couche === "ligament" ? fiche(R, "ligament", id)?.test : undefined;
      if (!texte) return null;
      const indice = court(masquer(texte, e), 240);
      if (normaliser(indice).includes(normaliser(e.nom))) return null;
      const avecTest = (x: Element) => x.couche === e.couche && Boolean(e.couche === "muscle" ? fiche(R, "muscle", x.id)?.test : fiche(R, "ligament", x.id)?.test);
      const faux = proches(r, e, reservoir(e).filter(avecTest), 3, d);
      if (faux.length < 3) return null;
      const action = e.couche === "muscle" ? fiche(R, "muscle", id)?.actions.find(jouable) : undefined;
      return {
        ...base,
        consigne: e.couche === "muscle" ? "Cet examen : quel muscle teste-t-il ?" : "Ce test : quelle structure explore-t-il ?",
        indice,
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        apres: { montrer: [id], jouer: action ? { muscle: id, actions: [action] } : undefined },
        explication: deplus(texte, indice),
      };
    }

    case "reconstruis": {
      if (e.couche !== "artere" && e.couche !== "nerf") return null;
      const c = chaine(R, e.couche, id);
      if (c.length < 3) return null;
      const suite = c.slice(-4);
      return {
        ...base,
        consigne: `Reconstruis le trajet : touche dans l'ordre ${suite.map((x) => article(PAR_ID.get(x)!)).join(", puis ")}.`,
        options: [],
        attendu: suite.join(">"),
        ordre: suite,
        reponse: "suite",
        montrer: false,
        apres: { montrer: suite, pouls: e.couche === "artere" },
        explication: suite.map((x) => PAR_ID.get(x)!.nom).join(" → "),
      };
    }

    case "role": {
      let texte: string | undefined;
      let parent: (x: Element) => boolean = () => true;
      if (e.couche === "viscere") {
        const f = fiche(R, "viscere", id);
        texte = f?.fonction;
        parent = (x) => fiche(R, "viscere", x.id)?.systeme === f?.systeme;
      } else if (e.couche === "encephale") {
        const f = fiche(R, "encephale", id);
        texte = f?.fonction;
        parent = (x) => fiche(R, "encephale", x.id)?.partie === f?.partie;
      } else if (e.couche === "ligament") texte = fiche(R, "ligament", id)?.role;
      else if (e.couche === "tendon") {
        const f = fiche(R, "tendon", id);
        texte = f && !f.derive ? f.role : undefined;
      }
      if (!texte) return null;
      const indice = court(masquer(texte, e), 240);
      if (normaliser(indice).includes(normaliser(e.nom))) return null;
      const aUnRole = (x: Element) => {
        if (x.couche !== e.couche) return false;
        if (x.couche === "viscere") return Boolean(fiche(R, "viscere", x.id)?.fonction);
        if (x.couche === "encephale") return Boolean(fiche(R, "encephale", x.id)?.fonction);
        if (x.couche === "ligament") return Boolean(fiche(R, "ligament", x.id)?.role);
        const t = fiche(R, "tendon", x.id);
        return Boolean(t && !t.derive && t.role);
      };
      const candidats = reservoir(e).filter(aUnRole);
      const familiers = candidats.filter(parent);
      const faux = unique([...proches(r, e, d === "facile" ? candidats : familiers, 3, d), ...proches(r, e, candidats, 3, d)], (x) => x.id).slice(0, 3);
      if (faux.length < 3) return null;
      return {
        ...base,
        consigne: "Quelle structure joue ce rôle ?",
        indice,
        options: options(r, opt(e), faux.map(opt)),
        attendu: id,
        reponse: "qcm",
        montrer: false,
        apres: { montrer: [id] },
        explication: deplus(texte, indice),
      };
    }
  }
}

/** Juger « Fais le geste » : le bon curseur doit avoir bougé dans le bon sens, plus que tous les autres. */
export function jugerGeste(attendu: string, pose: Record<string, number>): boolean {
  const [ddl, sens] = attendu.split(":");
  const part = (id: string) => {
    const d = DDL.find((x) => x.id === id);
    if (!d) return 0;
    const v = pose[d.lateral ? `${id}:g` : id] ?? 0;
    return v >= 0 ? (d.max ? v / d.max : 0) : d.min ? -v / -d.min : 0;
  };
  const bonne = part(ddl);
  const signe = Math.sign((() => {
    const d = DDL.find((x) => x.id === ddl);
    return d ? (pose[d.lateral ? `${ddl}:g` : ddl] ?? 0) : 0;
  })());
  if (signe !== Number(sens) || bonne < 0.3) return false;
  return Object.keys(pose).every((k) => {
    const id = k.split(":")[0];
    return id === ddl || part(id) < bonne * 0.8;
  });
}
