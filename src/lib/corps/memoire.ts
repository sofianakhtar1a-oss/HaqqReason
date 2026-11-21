/*
 * L'Écorché — la mémoire de chaque facette de chaque structure.
 *
 * Savoir nommer le biceps n'est pas savoir ce qu'il fait, ni qui le commande. Chaque structure a donc plusieurs
 * facettes, et chacune a sa propre carte de mémoire, réglée par FSRS (Free Spaced Repetition Scheduler, version
 * 4.5, paramètres par défaut) : la stabilité S (en jours, le temps au bout duquel on a encore neuf chances sur dix
 * de s'en souvenir) et la difficulté D (de 1 à 10) évoluent à chaque réponse selon la note donnée :
 *   1 « à revoir » (erreur, ou bonne réponse au hasard), 2 « difficile » (juste mais hésitant), 3 « bien » (sûr),
 *   4 « facile » (sûr et rapide).
 * La carte revient quand la probabilité de s'en souvenir tombe à 90 % : au bout de S jours.
 *
 * Module pur (pas de stockage) : la progression range les cartes et les synchronise.
 */

export type Facette = "nom" | "situer" | "fonction" | "innervation" | "attaches" | "vaisseaux" | "clinique";

export const FACETTES: { id: Facette; nom: string; texte: string }[] = [
  { id: "nom", nom: "Le nom", texte: "Reconnaître la structure et la nommer, en français et en latin" },
  { id: "situer", nom: "La place", texte: "La trouver sur le corps, savoir ce qui l'entoure" },
  { id: "fonction", nom: "Ce qu'elle fait", texte: "Son action, son rôle, le mouvement qu'elle produit" },
  { id: "innervation", nom: "Ses nerfs", texte: "Le nerf qui la commande et ses racines" },
  { id: "attaches", nom: "Ses attaches", texte: "D'où elle part, où elle se termine, avec quoi elle s'articule" },
  { id: "vaisseaux", nom: "Ses vaisseaux", texte: "D'où naît l'artère, ses branches, ce qu'elle irrigue, où va le sang" },
  { id: "clinique", nom: "La clinique", texte: "Le test, le réflexe, ce qui arrive quand elle est atteinte" },
];
export const NOM_FACETTE = Object.fromEntries(FACETTES.map((f) => [f.id, f.nom])) as Record<Facette, string>;

/** [stabilité (jours), difficulté (1-10), jour du dernier passage, passages, oublis] */
export type Carte = [number, number, number, number, number];
export type Note = 1 | 2 | 3 | 4;

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECLIN = -0.5;
const FACTEUR = 19 / 81;
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La probabilité de s'en souvenir après `jours` jours, pour une stabilité S. */
export const retenue = (jours: number, S: number) => Math.pow(1 + (FACTEUR * Math.max(0, jours)) / Math.max(0.01, S), DECLIN);

const D0 = (note: Note) => borne(W[4] - (note - 3) * W[5], 1, 10);

/** La carte après une réponse notée, un jour donné (jours depuis 1970). */
export function revoir(carte: Carte | undefined, note: Note, jour: number): Carte {
  if (!carte) return [W[note - 1], D0(note), jour, 1, note === 1 ? 1 : 0];
  const [S, D, dernier, passages, oublis] = carte;
  const R = retenue(jour - dernier, S);
  const D1 = borne(W[7] * D0(3) + (1 - W[7]) * (D - W[6] * (note - 3)), 1, 10);
  let S1: number;
  if (note === 1) {
    S1 = Math.min(S, W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)));
  } else {
    const gain = Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) * (note === 2 ? W[15] : 1) * (note === 4 ? W[16] : 1);
    S1 = S * (gain + 1);
  }
  return [Math.round(borne(S1, 0.1, 36500) * 1000) / 1000, Math.round(D1 * 1000) / 1000, jour, passages + 1, oublis + (note === 1 ? 1 : 0)];
}

/** Le jour où la carte revient (la mémoire est alors à 90 %). */
export const echeance = (c: Carte) => c[2] + Math.max(1, Math.round(c[0]));
export const due = (c: Carte, jour: number) => jour >= echeance(c);

/** La note d'une réponse : juste ou non, la certitude déclarée, la rapidité. */
export type Certitude = "sur" | "hesitant" | "hasard";
export function noteDe(juste: boolean, certitude: Certitude = "sur", rapide = false): Note {
  if (!juste || certitude === "hasard") return 1;
  if (certitude === "hesitant") return 2;
  return rapide ? 4 : 3;
}

/** Le degré de maîtrise d'une carte : 0 jamais vue, 1 fragile, 2 en cours, 3 sue (au moins une semaine), 4 solide (un mois). */
export function degre(c: Carte | undefined, jour: number): 0 | 1 | 2 | 3 | 4 {
  if (!c) return 0;
  const S = c[0];
  if (retenue(jour - c[2], S) < 0.7 || S < 2) return 1;
  if (S < 7) return 2;
  if (S < 30) return 3;
  return 4;
}

/** Une carte tirée de l'ancienne boîte de Leitner (0 à 5) d'une structure : rien ne se perd au passage. */
const DELAIS_LEITNER = [0.5, 1, 2, 4, 8, 16];
export function carteDeBoite(m: [number, number, number, number]): Carte {
  const [bonnes, fautes, boite, jour] = m;
  const D = borne(5 + (fautes - bonnes) * 0.4, 1, 10);
  return [DELAIS_LEITNER[borne(boite, 0, 5)] * (boite >= 5 ? 2 : 1), Math.round(D * 1000) / 1000, jour, bonnes + fautes, fautes];
}

/** La difficulté des faux choix selon ce qu'on sait déjà : fragile, des voisins éloignés ; solide, les plus proches. */
export function difficulteAdaptee(c: Carte | undefined, base: "facile" | "normal" | "difficile"): "facile" | "normal" | "difficile" {
  const echelle = ["facile", "normal", "difficile"] as const;
  let k = echelle.indexOf(base);
  if (!c || c[0] < 3) k -= 1;
  else if (c[0] > 21) k += 1;
  return echelle[borne(k, 0, 2)];
}
