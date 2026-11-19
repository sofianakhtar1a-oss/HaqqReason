import { CATEGORIES_CLASSIQUES, IDS_CATEGORIES } from "./categories";
import { PAYS } from "./donnees";
import { NB_NIVEAUX } from "./niveaux";
import type { Etat } from "./progression";
import type { ContinentId } from "./types";

/*
 * Le Portulan : ce qu'on collectionne. Le niveau du profil (d'après l'XP), le passeport et ses
 * tampons, les médailles, la boutique (thèmes du globe, cadres, couleurs du bateau, gel de série)
 * et les ligues de la semaine.
 */

/* ---------- Le niveau du profil ---------- */

const SEUILS = [0, 100, 300, 700, 1500, 3000, 6000, 10_000, 16_000, 25_000, 40_000, 60_000];
const TITRES = ["Voyageur", "Pèlerin", "Marchand", "Navigateur", "Pilote", "Cartographe", "Géographe", "Explorateur", "Savant", "Maître des cartes", "Légende des mers", "Légende des mers"];

export function niveauProfil(xp: number): { n: number; titre: string; de: number; a: number | null; part: number } {
  let n = 1;
  while (n < SEUILS.length && xp >= SEUILS[n]) n++;
  const de = SEUILS[n - 1];
  const a = n < SEUILS.length ? SEUILS[n] : null;
  return { n, titre: TITRES[n - 1], de, a, part: a ? (xp - de) / (a - de) : 1 };
}

/* ---------- Le passeport ---------- */

/** Un tampon par pays connu (maîtrisé dans au moins deux catégories), daté du dernier passage. */
export function tampons(e: Etat): Map<string, number> {
  const sortie = new Map<string, number>();
  for (const p of PAYS) {
    if (!p.quiz || p.statut === "territoire") continue;
    const m = e.pays[p.code];
    if (!m) continue;
    let k = 0;
    let jour = 0;
    for (const [f, x] of Object.entries(m)) {
      if (f === "fiches" || !x) continue;
      if (x[2] >= 3) {
        k++;
        jour = Math.max(jour, x[3]);
      }
    }
    if (k >= 2) sortie.set(p.code, jour);
  }
  return sortie;
}

export const PAGES_PASSEPORT: { id: ContinentId; nom: string }[] = [
  { id: "europe", nom: "Europe" },
  { id: "afrique", nom: "Afrique" },
  { id: "asie", nom: "Asie" },
  { id: "amerique-nord", nom: "Amérique du Nord" },
  { id: "amerique-sud", nom: "Amérique du Sud" },
  { id: "oceanie", nom: "Océanie" },
];

/* ---------- Les médailles ---------- */

export type Medaille = { id: string; nom: string; texte: string; metal: "bronze" | "argent" | "or" | "saphir"; obtenue: (e: Etat) => boolean };

const reussis = (e: Etat, c: string) => {
  let k = 0;
  for (let n = 1; n <= NB_NIVEAUX; n++) if ((e.niveaux[`${c}:${n}`]?.f ?? 0) > 0) k++;
  return k;
};
const toutesCategoriesNiveau = (e: Etat, n: number) => IDS_CATEGORIES.filter((c) => reussis(e, c) >= n).length;
const etoilesTotales = (e: Etat) => Object.values(e.niveaux).reduce((s, r) => s + (r.e ?? 0), 0);
const cabinetsFinis = (e: Etat) => Object.values(e.cabinets).filter((c) => Object.keys(c.n).length > 0).length;

export const MEDAILLES: readonly Medaille[] = [
  { id: "premier", nom: "Premier port", texte: "Réussir un premier niveau.", metal: "bronze", obtenue: (e) => Object.values(e.niveaux).some((r) => r.f > 0) },
  { id: "trois-etoiles", nom: "Sans une faute", texte: "Réussir un niveau avec trois étoiles.", metal: "bronze", obtenue: (e) => Object.values(e.niveaux).some((r) => r.e >= 3) },
  { id: "dix-niveaux", nom: "Dix escales", texte: "Réussir dix niveaux, toutes routes confondues.", metal: "bronze", obtenue: (e) => Object.values(e.niveaux).filter((r) => r.f > 0).length >= 10 },
  { id: "cinquante-etoiles", nom: "Une nuit étoilée", texte: "Gagner cinquante étoiles.", metal: "argent", obtenue: (e) => etoilesTotales(e) >= 50 },
  { id: "cinq-routes", nom: "Cinq caps", texte: "Atteindre le niveau 5 dans les cinq grandes routes.", metal: "argent", obtenue: (e) => CATEGORIES_CLASSIQUES.every((c) => reussis(e, c) >= 5) },
  { id: "drapeaux-15", nom: "Porte-drapeau", texte: "Réussir les quinze niveaux des drapeaux.", metal: "or", obtenue: (e) => reussis(e, "drapeaux") >= NB_NIVEAUX },
  { id: "capitales-15", nom: "Toutes les capitales", texte: "Réussir les quinze niveaux des capitales.", metal: "or", obtenue: (e) => reussis(e, "capitales") >= NB_NIVEAUX },
  { id: "cartes-15", nom: "L'œil du cartographe", texte: "Réussir les quinze niveaux des cartes.", metal: "or", obtenue: (e) => reussis(e, "cartes") >= NB_NIVEAUX },
  { id: "treize-routes", nom: "Les treize routes", texte: "Réussir au moins un niveau dans chaque route.", metal: "argent", obtenue: (e) => toutesCategoriesNiveau(e, 1) === IDS_CATEGORIES.length },
  { id: "pays-50", nom: "Cinquante tampons", texte: "Connaître cinquante pays.", metal: "argent", obtenue: (e) => tampons(e).size >= 50 },
  { id: "pays-100", nom: "Cent tampons", texte: "Connaître cent pays.", metal: "or", obtenue: (e) => tampons(e).size >= 100 },
  { id: "pays-tous", nom: "Le tour complet", texte: "Connaître les 197 pays.", metal: "saphir", obtenue: (e) => tampons(e).size >= 197 },
  { id: "serie-7", nom: "Une semaine en mer", texte: "Jouer sept jours d'affilée.", metal: "bronze", obtenue: (e) => e.profil.jours >= 7 },
  { id: "serie-30", nom: "Un mois en mer", texte: "Jouer trente jours d'affilée.", metal: "or", obtenue: (e) => e.profil.jours >= 30 },
  { id: "eclair-25", nom: "Foudroyant", texte: "Faire 25 bonnes réponses à l'éclair.", metal: "argent", obtenue: (e) => e.profil.eclair >= 25 },
  { id: "survie-30", nom: "Le pied marin", texte: "Enchaîner 30 bonnes réponses au sans-faute.", metal: "or", obtenue: (e) => e.profil.survie >= 30 },
  { id: "europe-toute", nom: "L'Europe de mémoire", texte: "Nommer tous les pays d'Europe d'une traite.", metal: "or", obtenue: (e) => (e.records["nomme:continent:europe"] ?? 0) >= 46 },
  { id: "afrique-toute", nom: "L'Afrique de mémoire", texte: "Nommer les 54 pays d'Afrique d'une traite.", metal: "saphir", obtenue: (e) => (e.records["nomme:continent:afrique"] ?? 0) >= 54 },
  { id: "examen-16", nom: "Mention très bien", texte: "Obtenir au moins 16 sur 20 à l'examen.", metal: "argent", obtenue: (e) => (e.records.examen ?? 0) >= 16 },
  { id: "cabinet", nom: "Vu de l'intérieur", texte: "Réussir un niveau d'un cabinet (départements, États…).", metal: "bronze", obtenue: (e) => cabinetsFinis(e) >= 1 },
  { id: "departements", nom: "Les 101", texte: "Nommer les 101 départements d'une traite.", metal: "saphir", obtenue: (e) => (e.records["nomme:cabinet:fr-departements"] ?? 0) >= 101 },
  { id: "epreuve", nom: "Maître d'une route", texte: "Réussir une épreuve finale.", metal: "saphir", obtenue: (e) => Object.keys(e.records).some((k) => k.startsWith("epreuve:") && e.records[k] > 0) },
  { id: "marathon-100", nom: "Marathonien", texte: "Cent bonnes réponses au marathon.", metal: "or", obtenue: (e) => (e.records.marathon ?? 0) >= 100 },
  { id: "mes-pays", nom: "Collectionneur", texte: "Mettre dix pays dans « Mes pays ».", metal: "bronze", obtenue: (e) => Object.values(e.favoris).filter((x) => x > 0).length >= 10 },
];

/* ---------- La boutique ---------- */

export type SorteArticle = "globe" | "cadre" | "bateau" | "gel";
export type Article = { id: string; sorte: SorteArticle; nom: string; texte: string; prix: number; couleur?: string };

export const BOUTIQUE: readonly Article[] = [
  { id: "globe-classique", sorte: "globe", nom: "Le globe classique", texte: "La mer d'encre et les terres de sable.", prix: 0 },
  { id: "globe-parchemin", sorte: "globe", nom: "Le parchemin", texte: "Un globe de bibliothèque, couleur vélin.", prix: 400 },
  { id: "globe-nuit", sorte: "globe", nom: "La nuit polaire", texte: "Des terres d'ardoise sur une mer d'encre noire.", prix: 400 },
  { id: "globe-emeraude", sorte: "globe", nom: "L'émeraude", texte: "Une mer de lagon et des côtes dorées.", prix: 600 },
  { id: "cadre-aucun", sorte: "cadre", nom: "Sans cadre", texte: "Le portrait tel quel.", prix: 0 },
  { id: "cadre-laiton", sorte: "cadre", nom: "Le laiton", texte: "Un cercle de cuivre poli.", prix: 200, couleur: "#b8863b" },
  { id: "cadre-or", sorte: "cadre", nom: "L'or", texte: "Un double filet d'or.", prix: 500, couleur: "#e0b35a" },
  { id: "cadre-saphir", sorte: "cadre", nom: "Le saphir", texte: "Un bleu profond serti d'or.", prix: 800, couleur: "#2f62c9" },
  { id: "bateau-safran", sorte: "bateau", nom: "La voile safran", texte: "La couleur du Portulan.", prix: 0, couleur: "var(--sa)" },
  { id: "bateau-pourpre", sorte: "bateau", nom: "La voile pourpre", texte: "La couleur des amiraux.", prix: 150, couleur: "#a2348c" },
  { id: "bateau-emeraude", sorte: "bateau", nom: "La voile émeraude", texte: "Pour les routes du sud.", prix: 150, couleur: "#16a37a" },
  { id: "bateau-azur", sorte: "bateau", nom: "La voile azur", texte: "Pour les mers du nord.", prix: 150, couleur: "#2d8fd6" },
  { id: "gel", sorte: "gel", nom: "Un gel de série", texte: "Un jour manqué ne brise pas ta série (deux au plus en réserve).", prix: 200 },
];

export const article = (id: string) => BOUTIQUE.find((a) => a.id === id);

/* ---------- Les ligues de la semaine ---------- */

export type Ligue = { id: string; nom: string; de: number; couleur: string };
export const LIGUES: readonly Ligue[] = [
  { id: "bronze", nom: "Ligue de bronze", de: 0, couleur: "#b07a45" },
  { id: "argent", nom: "Ligue d'argent", de: 200, couleur: "#a9b4c2" },
  { id: "or", nom: "Ligue d'or", de: 500, couleur: "#e0b35a" },
  { id: "saphir", nom: "Ligue de saphir", de: 1000, couleur: "#3f73d8" },
  { id: "rubis", nom: "Ligue de rubis", de: 2000, couleur: "#c8364b" },
  { id: "diamant", nom: "Ligue de diamant", de: 4000, couleur: "#7fd6e6" },
];

/** La ligue de la semaine, d'après l'XP gagnée depuis lundi. */
export function ligueDe(points: number): { ligue: Ligue; suivante: Ligue | null } {
  let i = 0;
  while (i + 1 < LIGUES.length && points >= LIGUES[i + 1].de) i++;
  return { ligue: LIGUES[i], suivante: LIGUES[i + 1] ?? null };
}
