/*
 * L'Écorché — les catégories et leurs planches.
 *
 * Une catégorie par couche, et « Le corps entier », qui mêle tout. Chaque planche présente ses structures et en fait
 * revenir quelques-unes déjà vues. La composition des planches est écrite une fois pour toutes dans le modèle
 * (modele/planches.json, tenu par scripts/corps/06_catalogue.py) : une planche publiée ne change plus, puisque la
 * progression de chacun en dépend ; les nouvelles s'ajoutent à la suite.
 *
 * Les méthodes de question s'ajoutent au fil des planches : on commence par reconnaître et situer,
 * puis viennent l'écrit, le latin, les fonctions, les attaches, l'innervation, les pièges.
 */

import { ELEMENTS, PAR_ID } from "./catalogue";
import planchesJson from "./modele/planches.json";
import titresJson from "./modele/planches-titres.json";
import type { Couche, Element, RegionId } from "./types";
import { REGIONS } from "./types";

export type CategorieId = "os" | "muscles" | "tendons" | "ligaments" | "arteres" | "veines" | "nerfs" | "visceres" | "encephale" | "lymphe" | "corps";

export type DefCategorie = {
  id: CategorieId;
  nom: string;
  /** Une ligne pour la carte de la catégorie. */
  texte: string;
  couches: Couche[];
};

const planches = planchesJson as unknown as Partial<Record<CategorieId, string[][]>>;
/** Les titres écrits avec la planche (système, partie de l'encéphale, tronc et ses branches), par rang dans la catégorie. */
const titresEcrits = titresJson as unknown as Partial<Record<CategorieId, Record<string, string>>>;

const TOUTES: Record<CategorieId, DefCategorie> = {
  os: { id: "os", nom: "Les os", texte: "Le squelette, du crâne aux phalanges du pied.", couches: ["os"] },
  muscles: { id: "muscles", nom: "Les muscles", texte: "Leur nom, leur place, leurs attaches, leur action et leur nerf.", couches: ["muscle"] },
  tendons: { id: "tendons", nom: "Les tendons", texte: "Tendons, aponévroses et rétinaculums.", couches: ["tendon"] },
  ligaments: { id: "ligaments", nom: "Les ligaments", texte: "Ligaments, capsules, ménisques, disques et bourses.", couches: ["ligament"] },
  arteres: { id: "arteres", nom: "Les artères", texte: "De l'aorte aux arcades de la main et du pied.", couches: ["artere"] },
  veines: { id: "veines", nom: "Les veines", texte: "Des veines caves aux réseaux superficiels.", couches: ["veine"] },
  nerfs: { id: "nerfs", nom: "Les nerfs", texte: "Les plexus, les troncs et leurs branches.", couches: ["nerf"] },
  visceres: { id: "visceres", nom: "Les viscères", texte: "Le cœur, les poumons, le tube digestif, les glandes, les organes des sens.", couches: ["viscere"] },
  encephale: { id: "encephale", nom: "L'encéphale", texte: "Le cerveau, le cervelet, le tronc cérébral et leurs noyaux.", couches: ["encephale"] },
  lymphe: { id: "lymphe", nom: "Le système lymphatique", texte: "Les nœuds lymphatiques, région par région.", couches: ["lymphe"] },
  corps: { id: "corps", nom: "Le corps entier", texte: "Tout mêlé : l'examen final, région par région.", couches: [] },
};

/** Les catégories qui ont des planches (les autres couches se visitent déjà dans l'explorateur). */
export const IDS_CATEGORIES: CategorieId[] = [...(Object.keys(TOUTES) as CategorieId[]).filter((c) => c !== "corps" && (planches[c]?.length ?? 0) > 0), "corps"];
const couchesApprises = IDS_CATEGORIES.flatMap((c) => TOUTES[c].couches);
export const CATEGORIES: Record<CategorieId, DefCategorie> = { ...TOUTES, corps: { ...TOUTES.corps, couches: couchesApprises } };

const DE_COUCHE: Record<Couche, CategorieId> = { os: "os", muscle: "muscles", tendon: "tendons", ligament: "ligaments", artere: "arteres", veine: "veines", nerf: "nerfs", viscere: "visceres", encephale: "encephale", lymphe: "lymphe" };
export const categorieDeCouche = (c: Couche): CategorieId => DE_COUCHE[c];

/** Les structures qui figurent dans une planche : celles qu'on apprend (les jeux et les examens puisent là). */
export const EN_PLANCHE: ReadonlySet<string> = new Set(Object.values(planches).flatMap((l) => (l ?? []).flat()));
export const ELEMENTS_APPRIS: readonly Element[] = ELEMENTS.filter((e) => EN_PLANCHE.has(e.id));

export type Niveau = {
  categorie: CategorieId;
  /** De 1 au nombre de niveaux de la catégorie. */
  n: number;
  titre: string;
  /** Les structures présentées à ce niveau. */
  nouveaux: string[];
};

const grandeDe = (r: RegionId) => REGIONS.find((x) => x.id === r)?.grande;
const NOMS_GRANDES: Record<string, string> = { "tete-cou": "Tête et cou", tronc: "Le tronc", "membre-sup": "Le membre supérieur", "membre-inf": "Le membre inférieur" };
const SUITES_GRANDES: Record<string, string> = { "tete-cou": "la tête et le cou", tronc: "le tronc", "membre-sup": "le membre supérieur", "membre-inf": "le membre inférieur" };

/**
 * Le titre d'un niveau : « Les incontournables » pour le premier, sinon la région qu'il couvre (la région fine si elle
 * en tient au moins 70 %, sinon une ou deux grandes régions). Les titres répétés sont numérotés ensuite (II, III…).
 */
function titreDe(els: Element[], n: number, categorie: CategorieId): string {
  if (n === 1 && categorie !== "corps") return "Les incontournables";
  if (!els.length) return "Planche";
  const fines = new Map<RegionId, number>();
  const grandes = new Map<string, number>();
  for (const e of els) {
    fines.set(e.region, (fines.get(e.region) ?? 0) + 1);
    const g = grandeDe(e.region) ?? "tronc";
    grandes.set(g, (grandes.get(g) ?? 0) + 1);
  }
  const [fine, nFine] = [...fines].sort((a, b) => b[1] - a[1])[0];
  if (nFine >= els.length * 0.7) return REGIONS.find((r) => r.id === fine)?.nom ?? "Planche";
  const tri = [...grandes].sort((a, b) => b[1] - a[1]);
  if (tri.length === 1 || tri[0][1] >= els.length * 0.7) return NOMS_GRANDES[tri[0][0]];
  return `${NOMS_GRANDES[tri[0][0]]}, ${SUITES_GRANDES[tri[1][0]]}`;
}

const ROMAINS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
const romain = (k: number) => ROMAINS[k] ?? String(k);

/** Numérote les titres qui reviennent : « La main I », « La main II »… */
function numeroter(niveaux: Niveau[]): Niveau[] {
  const total = new Map<string, number>();
  for (const x of niveaux) total.set(x.titre, (total.get(x.titre) ?? 0) + 1);
  const vu = new Map<string, number>();
  return niveaux.map((x) => {
    if ((total.get(x.titre) ?? 0) < 2) return x;
    const k = (vu.get(x.titre) ?? 0) + 1;
    vu.set(x.titre, k);
    return { ...x, titre: `${x.titre} ${romain(k)}` };
  });
}

const cache = new Map<CategorieId, Niveau[]>();

export function niveauxDe(categorie: CategorieId): Niveau[] {
  const deja = cache.get(categorie);
  if (deja) return deja;
  let niveaux: Niveau[];
  if (categorie === "corps") {
    // L'examen : une grande région par niveau, toutes couches mêlées, puis la grande finale.
    const grandes: { id: string; titre: string }[] = [
      { id: "tete-cou", titre: "Tête et cou" },
      { id: "tronc", titre: "Le tronc" },
      { id: "membre-sup", titre: "Le membre supérieur" },
      { id: "membre-inf", titre: "Le membre inférieur" },
    ];
    niveaux = grandes.map((g, i) => ({ categorie, n: i + 1, titre: g.titre, nouveaux: ELEMENTS_APPRIS.filter((e) => grandeDe(e.region) === g.id).map((e) => e.id) }));
    niveaux.push({ categorie, n: 5, titre: "Les incontournables du corps", nouveaux: ELEMENTS_APPRIS.filter((e) => e.rang <= 1).map((e) => e.id) });
    niveaux.push({ categorie, n: 6, titre: "Le grand examen", nouveaux: ELEMENTS_APPRIS.map((e) => e.id) });
  } else {
    niveaux = numeroter(
      (planches[categorie] ?? []).map((ids, i) => {
        const els = ids.map((id) => PAR_ID.get(id)).filter((e): e is Element => Boolean(e));
        return { categorie, n: i + 1, titre: titresEcrits[categorie]?.[String(i)] ?? titreDe(els, i + 1, categorie), nouveaux: els.map((e) => e.id) };
      }),
    );
  }
  cache.set(categorie, niveaux);
  return niveaux;
}

export const nombreNiveaux = (c: CategorieId) => niveauxDe(c).length;
export const niveau = (c: CategorieId, n: number): Niveau | undefined => niveauxDe(c)[n - 1];

/** Toutes les structures vues jusqu'au niveau n (compris). */
export function vusJusqua(c: CategorieId, n: number): string[] {
  return niveauxDe(c)
    .slice(0, n)
    .flatMap((x) => x.nouveaux);
}

/** Le niveau où une structure est présentée, dans sa catégorie. */
export function niveauDe(id: string): { categorie: CategorieId; n: number } | null {
  for (const c of IDS_CATEGORIES) {
    if (c === "corps") continue;
    const i = niveauxDe(c).findIndex((x) => x.nouveaux.includes(id));
    if (i >= 0) return { categorie: c, n: i + 1 };
  }
  return null;
}

/* ---------- Les titres du joueur (selon son expérience) ---------- */

export type Titre = { n: number; nom: string; devise: string; xp: number };

/** Du carabin (l'étudiant en médecine) à Vésale, le père de l'anatomie moderne. */
export const TITRES: readonly Titre[] = [
  { n: 1, nom: "Carabin", devise: "Premier jour à l'amphithéâtre.", xp: 0 },
  { n: 2, nom: "Externe", devise: "Le scalpel ne tremble plus.", xp: 400 },
  { n: 3, nom: "Dessinateur", devise: "Chaque trait à sa place.", xp: 1200 },
  { n: 4, nom: "Interne", devise: "Les noms viennent tout seuls.", xp: 2600 },
  { n: 5, nom: "Prosecteur", devise: "Tu prépares les dissections des autres.", xp: 4800 },
  { n: 6, nom: "Chef de clinique", devise: "On vient te demander.", xp: 8000 },
  { n: 7, nom: "Agrégé", devise: "Le corps n'a plus de secret.", xp: 12500 },
  { n: 8, nom: "Professeur", devise: "Tu fais la leçon d'anatomie.", xp: 18500 },
  { n: 9, nom: "Maître de l'amphithéâtre", devise: "Les gradins sont pleins.", xp: 26000 },
  { n: 10, nom: "Vésale", devise: "Le corps humain, comme un livre ouvert.", xp: 36000 },
];

export function titreDuJoueur(xp: number): { titre: Titre; suivant: Titre | null; part: number } {
  let i = 0;
  while (i + 1 < TITRES.length && xp >= TITRES[i + 1].xp) i++;
  const titre = TITRES[i];
  const suivant = TITRES[i + 1] ?? null;
  return { titre, suivant, part: suivant ? (xp - titre.xp) / (suivant.xp - titre.xp) : 1 };
}

/** Les étoiles d'un niveau réussi : 3 sans faute, 2 avec une faute, 1 avec deux. */
export const etoilesPour = (fautes: number): 0 | 1 | 2 | 3 => (fautes <= 0 ? 3 : fautes === 1 ? 2 : fautes === 2 ? 1 : 0);
export const COEURS = 3;
