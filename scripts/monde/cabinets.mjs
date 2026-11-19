#!/usr/bin/env node
/*
 * Le Portulan : fabrique les « cabinets » (départements, États, provinces, régions, wilayas,
 * drapeaux d'organisations) à partir de scripts/monde/cabinets-sources.mjs.
 *
 * Usage :
 *   node scripts/monde/cabinets.mjs <node_modules de construire.mjs> <dossier svg de region-flags> <dossier des remplacements>
 *     • node_modules : celui où flag-icons@7.6.0 et svgo@3 sont installés (voir construire.mjs) ;
 *     • region-flags : https://github.com/fonttools/region-flags (dossier svg/, domaine public) ;
 *     • remplacements : US-MN.svg et US-UT.svg (les drapeaux adoptés en 2024, tirés de us-state-flags, ISC).
 *
 * Produit :
 *   src/lib/monde/cabinets-donnees.ts      les données, vérifiées
 *   public/monde/emblemes/<empreinte>.svg  les drapeaux légers (ou .webp quand le dessin est trop lourd)
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CABINETS } from "./cabinets-sources.mjs";

const [modules, dossierRegions, dossierRemplacements] = process.argv.slice(2);
if (!modules || !dossierRegions || !dossierRemplacements) {
  console.error("usage : node scripts/monde/cabinets.mjs <node_modules> <region-flags/svg> <remplacements>");
  process.exit(1);
}
const racine = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const req = createRequire(join(modules, "noop.js"));
const { optimize } = await import(req.resolve("svgo"));
const sharp = createRequire(join(racine, "package.json"))("sharp");
const dossierIcones = join(dirname(req.resolve("flag-icons/package.json")), "flags", "4x3");

const erreurs = [];
const exiger = (condition, message) => {
  if (!condition) erreurs.push(message);
};

/** La même normalisation que src/lib/monde/texte.ts. */
const normaliser = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’'`´ʼ\-–—.,;:()/_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(le|la|les|l|el) /, "")
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/\s/g, "");

/* ---------- Les drapeaux ---------- */
const sortie = join(racine, "public", "monde", "emblemes");
rmSync(sortie, { recursive: true, force: true });
mkdirSync(sortie, { recursive: true });
let poidsAvant = 0;
let poidsApres = 0;
const LOURD = 40_000;

function source(fichier) {
  const candidats = [join(dossierRemplacements, `${fichier}.svg`), join(dossierRegions, `${fichier}.svg`), join(dossierIcones, `${fichier}.svg`)];
  return candidats.find((c) => existsSync(c));
}

async function embleme(fichier) {
  const chemin = source(fichier);
  exiger(chemin, `drapeau absent : ${fichier}`);
  if (!chemin) return null;
  const brut = readFileSync(chemin, "utf8");
  poidsAvant += brut.length;
  // svgo bute sur quelques tracés : on réessaie sans réécrire les chemins, puis on garde l'original.
  let leger = brut;
  for (const overrides of [{ removeViewBox: false }, { removeViewBox: false, convertPathData: false, mergePaths: false }]) {
    try {
      leger = optimize(brut, { multipass: true, floatPrecision: 2, plugins: [{ name: "preset-default", params: { overrides } }, "removeDimensions"] }).data;
      break;
    } catch {
      // essai suivant
    }
  }
  const vb = /viewBox="([\d.\s-]+)"/.exec(leger)?.[1]?.trim().split(/\s+/).map(Number);
  const rapport = vb && vb[2] > 0 && vb[3] > 0 ? Math.round((vb[2] / vb[3]) * 100) / 100 : 1.5;
  let donnees;
  let extension;
  if (leger.length <= LOURD) {
    donnees = Buffer.from(leger);
    extension = "svg";
  } else {
    // Un sceau détaillé pèse des centaines de kilo-octets : une image de 480 pixels suffit.
    const png = execFileSync("rsvg-convert", ["-w", "480", "-b", "white"], { input: Buffer.from(leger), maxBuffer: 64 * 1024 * 1024 });
    donnees = await sharp(png).webp({ quality: 82 }).toBuffer();
    extension = "webp";
  }
  poidsApres += donnees.length;
  const nom = `${createHash("sha256").update(donnees).digest("hex").slice(0, 12)}.${extension}`;
  writeFileSync(join(sortie, nom), donnees);
  return { fichier: nom, rapport };
}

/* ---------- Les cabinets ---------- */
const sortieCabinets = [];
const METHODES = ["nom-chef", "chef-nom", "num-nom", "nom-num", "nom-groupe", "drapeau-nom", "nom-drapeau", "ville-nom", "ecrire-chef", "ecrire-nom", "ecrire-num"];

for (const c of CABINETS) {
  exiger(/^[a-z]{2}-[a-z]+$|^drapeaux-plus$/.test(c.id), `${c.id} : identifiant`);
  const ids = new Set();
  const formesNom = new Map();
  const formesChef = new Map();
  const nums = new Set();
  const villes = new Map();
  for (const e of c.elements) {
    exiger(/^[a-z0-9]{1,6}$/.test(e.id), `${c.id}/${e.id} : identifiant`);
    exiger(!ids.has(e.id), `${c.id}/${e.id} : en double`);
    ids.add(e.id);
    exiger(e.nom && e.nom.trim() === e.nom, `${c.id}/${e.id} : nom`);
    for (const n of [e.nom, ...(e.noms ?? [])]) {
      const k = normaliser(n);
      exiger(!formesNom.has(k) || formesNom.get(k) === e.id, `${c.id} : « ${n} » désigne deux éléments`);
      formesNom.set(k, e.id);
    }
    if (e.chef) {
      for (const n of [e.chef, ...(e.chefs ?? [])]) {
        const k = normaliser(n);
        exiger(!formesChef.has(k) || formesChef.get(k) === e.id, `${c.id} : la ville « ${n} » est chef-lieu de deux éléments`);
        formesChef.set(k, e.id);
      }
    }
    if (e.num) {
      exiger(!nums.has(e.num), `${c.id} : numéro ${e.num} en double`);
      nums.add(e.num);
    }
    for (const v of e.villes ?? []) {
      const k = normaliser(v);
      exiger(!villes.has(k), `${c.id} : la ville « ${v} » apparaît deux fois`);
      villes.set(k, e.id);
    }
  }
  // Une ville citée ne doit être le chef-lieu d'aucun autre élément.
  for (const [k, id] of villes) exiger(!formesChef.has(k) || formesChef.get(k) === id, `${c.id} : la ville « ${k} » est aussi un chef-lieu`);
  for (const p of c.paliers.flat()) {
    exiger(METHODES.includes(p), `${c.id} : méthode inconnue ${p}`);
    exiger(c.consignes[p], `${c.id} : consigne manquante pour ${p}`);
  }
  let groupes;
  if (c.groupes) {
    const g = CABINETS.find((x) => x.id === c.groupes);
    exiger(g, `${c.id} : groupes introuvables`);
    groupes = Object.fromEntries((g?.elements ?? []).map((x) => [x.id, x.nom]));
    for (const e of c.elements) exiger(e.groupe in groupes, `${c.id}/${e.id} : région ${e.groupe} inconnue`);
  }
  const elements = [];
  for (const e of c.elements) {
    const x = { id: e.id, nom: e.nom, rang: e.rang };
    if (e.noms?.length) x.noms = e.noms;
    if (e.chef) x.chef = e.chef;
    if (e.chefs?.length) x.chefs = e.chefs;
    if (e.num) x.num = e.num;
    if (e.groupe) x.groupe = e.groupe;
    if (e.villes?.length) x.villes = e.villes;
    if (e.note) x.note = e.note;
    if (e.dr) {
      const d = await embleme(e.dr);
      if (d) {
        x.drapeau = d.fichier;
        x.rapport = d.rapport;
      }
    }
    elements.push(x);
  }
  // L'emblème du cabinet : le drapeau d'un pays du Portulan, ou celui d'une organisation.
  const emblemeCabinet = c.pays.length === 2 && c.pays !== "eu" ? null : await embleme(c.pays);
  sortieCabinets.push({
    id: c.id,
    nom: c.nom,
    court: c.court,
    texte: c.texte,
    pays: c.pays,
    ...(emblemeCabinet ? { embleme: emblemeCabinet.fichier } : {}),
    taille: c.taille,
    mots: c.mots,
    ...(c.avertissement ? { avertissement: c.avertissement } : {}),
    consignes: c.consignes,
    paliers: c.paliers,
    ...(groupes ? { groupes } : {}),
    elements,
  });
}

if (erreurs.length) {
  console.error(erreurs.join("\n"));
  process.exit(1);
}

const ts = `// Fichier produit par scripts/monde/cabinets.mjs : ne pas modifier à la main.
// Sources : voir scripts/monde/cabinets-sources.mjs (Insee, décrets marocain et algérien,
// region-flags (domaine public), flag-icons (MIT), us-state-flags (ISC)).
import type { DonneesCabinet } from "./types";

export const EMBLEMES_URL = "/monde/emblemes/";

export const CABINETS_DONNEES: readonly DonneesCabinet[] = ${JSON.stringify(sortieCabinets)};
`;
writeFileSync(join(racine, "src", "lib", "monde", "cabinets-donnees.ts"), ts);
const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`cabinets : ${sortieCabinets.length}, éléments : ${sortieCabinets.reduce((s, c) => s + c.elements.length, 0)}`);
console.log(`emblèmes : ${ko(poidsAvant)} → ${ko(poidsApres)}`);
