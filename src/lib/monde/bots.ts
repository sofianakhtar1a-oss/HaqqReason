import { pays } from "./atlas";
import { type Hasard } from "./hasard";
import { pointsDuel } from "./points";
import type { Question } from "./quiz";

/*
 * Les explorateurs virtuels : des adversaires simulés sur l'appareil, toujours présentés comme
 * tels. Ils portent le nom de grands géographes et voyageurs d'autrefois, avec quelques mots
 * sur chacun : on apprend en jouant contre eux.
 */

export type Explorateur = {
  id: string;
  nom: string;
  epoque: string;
  bio: string;
  /** Justesse de 0 à 1 sur un pays très connu (elle baisse avec la difficulté du pays). */
  justesse: number;
  /** Temps de réponse habituel, en ms. */
  vitesse: number;
  /** De 1 (abordable) à 5 (redoutable). */
  force: number;
};

export const EXPLORATEURS: readonly Explorateur[] = [
  { id: "polo", nom: "Marco Polo", epoque: "XIIIe siècle", bio: "Le marchand vénitien qui raconta la Chine de Kubilaï Khan dans Le Devisement du monde.", justesse: 0.66, vitesse: 6800, force: 1 },
  { id: "masudi", nom: "Al-Mas’ûdî", epoque: "Xe siècle", bio: "Voyageur et historien de Bagdad, surnommé « l'Hérodote des Arabes » pour ses Prairies d'or.", justesse: 0.72, vitesse: 6000, force: 2 },
  { id: "zhenghe", nom: "Zheng He", epoque: "XVe siècle", bio: "L'amiral chinois dont les flottes immenses atteignirent l'Arabie et la côte de l'Afrique de l'Est.", justesse: 0.76, vitesse: 5200, force: 2 },
  { id: "pirireis", nom: "Piri Reis", epoque: "XVIe siècle", bio: "Amiral ottoman, auteur d'une célèbre carte de 1513 et du Kitab-ı Bahriye, livre de la mer.", justesse: 0.8, vitesse: 4700, force: 3 },
  { id: "ibnmajid", nom: "Ibn Mâjid", epoque: "XVe siècle", bio: "Navigateur arabe surnommé « le lion de la mer », auteur de traités sur l'océan Indien.", justesse: 0.84, vitesse: 4300, force: 3 },
  { id: "ibnbattuta", nom: "Ibn Battûta", epoque: "XIVe siècle", bio: "Parti de Tanger, il parcourut près de 120 000 km, du Mali à la Chine, en trente ans.", justesse: 0.88, vitesse: 3800, force: 4 },
  { id: "biruni", nom: "Al-Bîrûnî", epoque: "XIe siècle", bio: "Savant qui calcula le rayon de la Terre avec une précision étonnante, depuis une montagne.", justesse: 0.93, vitesse: 4400, force: 5 },
  { id: "idrisi", nom: "Al-Idrîsî", epoque: "XIIe siècle", bio: "Le géographe de Palerme dont la Tabula Rogeriana fut la carte du monde la plus juste de son temps.", justesse: 0.95, vitesse: 3300, force: 5 },
  { id: "ptolemee", nom: "Ptolémée", epoque: "IIe siècle", bio: "Savant grec d'Alexandrie : sa Géographie donna des coordonnées à quelque 8 000 lieux et fixa la carte du monde pour quatorze siècles. L'Amérique, il ne la connaissait pas.", justesse: 0.62, vitesse: 7400, force: 1 },
  { id: "ibnfadlan", nom: "Ahmad ibn Fadlân", epoque: "Xe siècle", bio: "Envoyé du calife de Bagdad chez les Bulgares de la Volga en 921-922, il décrivit les Rus' et les peuples des steppes dans sa Risâla.", justesse: 0.74, vitesse: 5600, force: 2 },
  { id: "ibnhawqal", nom: "Ibn Hawqal", epoque: "Xe siècle", bio: "Marchand et géographe de Nisibe, il parcourut trente ans le monde musulman, d'al-Andalus à l'Inde, et en dessina les cartes dans La Configuration de la Terre.", justesse: 0.82, vitesse: 4600, force: 3 },
  { id: "bakri", nom: "Al-Bakrî", epoque: "XIe siècle", bio: "Géographe andalou, auteur du Livre des routes et des royaumes : il décrivit l'Afrique du Nord et l'empire du Ghana sans jamais quitter al-Andalus.", justesse: 0.83, vitesse: 4400, force: 3 },
  { id: "magellan", nom: "Magellan", epoque: "XVIe siècle", bio: "Navigateur portugais au service de l'Espagne : son expédition (1519-1522) accomplit le premier tour du monde, qu'il ne vit pas s'achever.", justesse: 0.88, vitesse: 3900, force: 4 },
  { id: "mercator", nom: "Mercator", epoque: "XVIe siècle", bio: "Cartographe flamand : sa projection de 1569, qui garde les angles, guide encore les marins, et il donna le nom d'« atlas » aux recueils de cartes.", justesse: 0.9, vitesse: 3700, force: 4 },
  { id: "humboldt", nom: "Humboldt", epoque: "XIXe siècle", bio: "Naturaliste prussien : de son voyage en Amérique (1799-1804) il tira une géographie nouvelle, qui relie le climat, l'altitude et la vie des plantes.", justesse: 0.94, vitesse: 3500, force: 5 },
];

/** La campagne : les explorateurs, du plus abordable au plus redoutable ; on les bat dans l'ordre. */
export const CAMPAGNE: readonly Explorateur[] = [...EXPLORATEURS].sort((a, b) => a.force - b.force || a.justesse - b.justesse || a.vitesse - b.vitesse);
/** La clé du record qui compte les explorateurs vaincus dans l'ordre de la campagne. */
export const CLE_CAMPAGNE = "campagne";
/** L'explorateur suivant de la campagne (null : la campagne est finie). */
export const suivantCampagne = (vaincus: number): Explorateur | null => CAMPAGNE[vaincus] ?? null;

/** Un explorateur à la mesure du joueur (d'après ses niveaux réussis), ou celui qu'il a choisi. */
export function adversaire(niveauxReussis: number, h: Hasard): Explorateur {
  const cible = Math.min(5, 1 + Math.floor(niveauxReussis / 12));
  const proches = EXPLORATEURS.filter((e) => Math.abs(e.force - cible) <= 1);
  return proches[Math.floor(h() * proches.length)] ?? EXPLORATEURS[0];
}

export type CoupVirtuel = { ms: number; juste: boolean; reponse: string; points: number };

/** Ce que fera l'explorateur à une question : quand il répond, et s'il a juste. */
export function jouerVirtuel(e: Explorateur, q: Question, h: Hasard): CoupVirtuel {
  const rang = pays(q.cible).rang;
  // Plus le pays est obscur, plus il hésite et se trompe.
  const difficulte = Math.min(1, rang / 240);
  const p = Math.max(0.25, e.justesse - difficulte * 0.28);
  const juste = h() < p;
  // Un temps de réponse naturel : autour de sa vitesse, plus long si le pays est difficile.
  const base = e.vitesse * (0.75 + difficulte * 0.6);
  const ms = Math.round(Math.min(14_500, Math.max(1200, base * (0.55 + h() * 0.9))));
  const faux = q.options.filter((o) => o.id !== q.attendu);
  const reponse = juste || !faux.length ? q.attendu : faux[Math.floor(h() * faux.length)].id;
  return { ms, juste, reponse, points: pointsDuel(juste, ms) };
}
