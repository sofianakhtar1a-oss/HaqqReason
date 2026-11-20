/*
 * L'Écorché — les catégories et leurs niveaux.
 *
 * Quatre catégories (les os, les muscles, les tendons, les artères) et une cinquième, « Le corps entier »,
 * qui mêle tout. Les structures de chaque catégorie sont rangées du plus connu au plus pointu (le rang),
 * puis par région (de la tête aux pieds), et partagées en niveaux de sept nouveautés : chaque niveau
 * présente les siennes et en fait revenir quelques-unes déjà vues. Le dernier niveau achevé, tout est su.
 *
 * Les méthodes de question s'ajoutent au fil des niveaux : on commence par reconnaître et situer,
 * puis viennent l'écrit, le latin, les fonctions, les attaches, l'innervation, les pièges.
 */

import { ELEMENTS } from "./catalogue";
import type { Couche, Element, RegionId } from "./types";
import { REGIONS } from "./types";

export type CategorieId = "os" | "muscles" | "tendons" | "arteres" | "corps";

export type DefCategorie = {
  id: CategorieId;
  nom: string;
  /** Une ligne pour la carte de la catégorie. */
  texte: string;
  couches: Couche[];
  /** Les nouveautés par niveau. */
  parNiveau: number;
};

export const CATEGORIES: Record<CategorieId, DefCategorie> = {
  os: { id: "os", nom: "Les os", texte: "Le squelette, du crâne aux phalanges du pied.", couches: ["os"], parNiveau: 7 },
  muscles: { id: "muscles", nom: "Les muscles", texte: "Leur nom, leur place, leurs attaches, leur action et leur nerf.", couches: ["muscle"], parNiveau: 7 },
  tendons: { id: "tendons", nom: "Les tendons", texte: "Tendons, aponévroses, ligaments et rétinaculums.", couches: ["tendon"], parNiveau: 7 },
  arteres: { id: "arteres", nom: "Les artères", texte: "De l'aorte aux arcades de la main et du pied.", couches: ["artere"], parNiveau: 7 },
  corps: { id: "corps", nom: "Le corps entier", texte: "Tout mêlé : l'examen final, région par région.", couches: ["os", "muscle", "tendon", "artere"], parNiveau: 0 },
};
export const IDS_CATEGORIES: CategorieId[] = ["os", "muscles", "tendons", "arteres", "corps"];

export const categorieDeCouche = (c: Couche): CategorieId => (c === "os" ? "os" : c === "muscle" ? "muscles" : c === "tendon" ? "tendons" : "arteres");

const ORDRE_REGION = new Map<RegionId, number>(REGIONS.map((r, i) => [r.id, i]));

export type Niveau = {
  categorie: CategorieId;
  /** De 1 au nombre de niveaux de la catégorie. */
  n: number;
  titre: string;
  /** Les structures présentées à ce niveau. */
  nouveaux: string[];
};

/** Le titre d'un niveau : les régions qu'il couvre (au plus deux), ou « Les incontournables ». */
function titreDe(els: Element[], n: number, categorie: CategorieId): string {
  if (n === 1 && categorie !== "corps") return "Les incontournables";
  const compte = new Map<string, number>();
  for (const e of els) {
    const g = REGIONS.find((r) => r.id === e.region)?.grande ?? "tronc";
    compte.set(g, (compte.get(g) ?? 0) + 1);
  }
  const noms: Record<string, string> = { "tete-cou": "Tête et cou", tronc: "Le tronc", "membre-sup": "Le membre supérieur", "membre-inf": "Le membre inférieur" };
  const tri = [...compte].sort((a, b) => b[1] - a[1]);
  if (tri.length === 1 || tri[0][1] >= els.length * 0.7) return noms[tri[0][0]];
  return `${noms[tri[0][0]]}, ${noms[tri[1][0]].replace(/^Le /, "le ")}`;
}

const cache = new Map<CategorieId, Niveau[]>();

export function niveauxDe(categorie: CategorieId): Niveau[] {
  const deja = cache.get(categorie);
  if (deja) return deja;
  const def = CATEGORIES[categorie];
  let niveaux: Niveau[];
  if (categorie === "corps") {
    // L'examen : une grande région par niveau, toutes couches mêlées, puis la grande finale.
    const grandes: { id: string; titre: string }[] = [
      { id: "tete-cou", titre: "Tête et cou" },
      { id: "tronc", titre: "Le tronc" },
      { id: "membre-sup", titre: "Le membre supérieur" },
      { id: "membre-inf", titre: "Le membre inférieur" },
    ];
    niveaux = grandes.map((g, i) => ({
      categorie,
      n: i + 1,
      titre: g.titre,
      nouveaux: ELEMENTS.filter((e) => REGIONS.find((r) => r.id === e.region)?.grande === g.id).map((e) => e.id),
    }));
    niveaux.push({ categorie, n: 5, titre: "Les incontournables du corps", nouveaux: ELEMENTS.filter((e) => e.rang <= 1).map((e) => e.id) });
    niveaux.push({ categorie, n: 6, titre: "Le grand examen", nouveaux: ELEMENTS.map((e) => e.id) });
  } else {
    const ordre = ELEMENTS.filter((e) => def.couches.includes(e.couche))
      .slice()
      .sort((a, b) => a.rang - b.rang || (ORDRE_REGION.get(a.region) ?? 0) - (ORDRE_REGION.get(b.region) ?? 0) || a.nom.localeCompare(b.nom, "fr"));
    niveaux = [];
    // Le premier niveau garde tout le rang 0 s'il est court ; ensuite, des paquets de sept.
    const premiers = ordre.filter((e) => e.rang === 0);
    const tete = premiers.length >= 4 && premiers.length <= def.parNiveau + 3 ? premiers : ordre.slice(0, def.parNiveau);
    niveaux.push({ categorie, n: 1, titre: titreDe(tete, 1, categorie), nouveaux: tete.map((e) => e.id) });
    const reste = ordre.slice(tete.length);
    const nb = Math.max(1, Math.round(reste.length / def.parNiveau));
    for (let i = 0; i < nb; i++) {
      const morceau = reste.slice(Math.round((i * reste.length) / nb), Math.round(((i + 1) * reste.length) / nb));
      niveaux.push({ categorie, n: i + 2, titre: titreDe(morceau, i + 2, categorie), nouveaux: morceau.map((e) => e.id) });
    }
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
