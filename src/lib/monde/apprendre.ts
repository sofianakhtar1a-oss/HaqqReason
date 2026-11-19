import { NOM_CONTINENT, pays, PAR_CODE } from "./atlas";
import { TYPES } from "./categories";
import { PAYS } from "./donnees";
import type { Question } from "./quiz";
import type { ContinentId, OrganisationId, Pays } from "./types";

/*
 * Le Portulan : mieux apprendre. Les pièges classiques (deux drapeaux presque jumeaux, deux noms
 * qui se ressemblent, une capitale qu'on croit connaître), les routes thématiques (l'Afrique,
 * l'Union européenne, la Ligue arabe…), les indices, et la mention d'un examen.
 */

/* ---------- Les pièges ---------- */

export type Piege = { codes: [string, string, ...string[]]; sur: "drapeau" | "nom"; texte: string };

/** Deux (ou trois) pays qu'on confond, et de quoi ne plus les confondre. */
export const PIEGES: readonly Piege[] = [
  { codes: ["td", "ro"], sur: "drapeau", texte: "Le Tchad et la Roumanie ont presque le même drapeau : le bleu tchadien est à peine plus sombre. Seul le continent les départage." },
  { codes: ["id", "mc"], sur: "drapeau", texte: "Rouge sur blanc tous les deux : l'Indonésie a un drapeau plus allongé que Monaco." },
  { codes: ["pl", "id"], sur: "drapeau", texte: "La Pologne met le blanc en haut et le rouge en bas : l'inverse de l'Indonésie." },
  { codes: ["ie", "ci"], sur: "drapeau", texte: "Mêmes couleurs, ordre inversé : l'Irlande commence par le vert au mât, la Côte d'Ivoire par l'orange." },
  { codes: ["it", "ie"], sur: "drapeau", texte: "Vert et blanc pour les deux : l'Italie finit par le rouge, l'Irlande par l'orange." },
  { codes: ["it", "mx"], sur: "drapeau", texte: "Le Mexique reprend vert, blanc, rouge, avec l'aigle sur un cactus au centre et un vert plus sombre." },
  { codes: ["au", "nz"], sur: "drapeau", texte: "L'Australie a six étoiles blanches ; la Nouvelle-Zélande quatre étoiles rouges bordées de blanc." },
  { codes: ["nl", "lu"], sur: "drapeau", texte: "Rouge, blanc, bleu : le bleu du Luxembourg est plus clair, presque bleu ciel." },
  { codes: ["sn", "ml"], sur: "drapeau", texte: "Vert, jaune, rouge pour les deux : seul le Sénégal porte une étoile verte au centre." },
  { codes: ["gn", "ml"], sur: "drapeau", texte: "Les mêmes bandes en sens inverse : la Guinée commence par le rouge au mât, le Mali par le vert." },
  { codes: ["cm", "sn"], sur: "drapeau", texte: "Une étoile au centre pour les deux : jaune sur la bande rouge au Cameroun, verte sur la bande jaune au Sénégal." },
  { codes: ["co", "ec", "ve"], sur: "drapeau", texte: "Colombie et Équateur : jaune sur la moitié, puis bleu et rouge ; l'Équateur ajoute son blason. Le Venezuela a trois bandes égales et un arc d'étoiles." },
  { codes: ["si", "sk"], sur: "drapeau", texte: "Blanc, bleu, rouge : le blason slovène (le mont Triglav) est petit, en haut près du mât ; le slovaque, une double croix sur trois collines, est plus grand." },
  { codes: ["sk", "ru"], sur: "drapeau", texte: "Mêmes bandes blanc, bleu, rouge : la Russie n'a pas de blason, la Slovaquie si." },
  { codes: ["no", "is"], sur: "drapeau", texte: "Croix nordiques aux couleurs inversées : la Norvège est rouge à croix bleue, l'Islande bleue à croix rouge." },
  { codes: ["dk", "ch"], sur: "drapeau", texte: "Croix blanche sur fond rouge : le drapeau suisse est carré, sa croix au centre ; la croix danoise est décalée vers le mât." },
  { codes: ["ht", "li"], sur: "drapeau", texte: "Bleu sur rouge : le Liechtenstein a une couronne d'or près du mât, Haïti son blason au centre." },
  { codes: ["qa", "bh"], sur: "drapeau", texte: "Le Qatar est bordeaux avec neuf pointes ; Bahreïn rouge vif avec cinq pointes." },
  { codes: ["jo", "ps"], sur: "drapeau", texte: "La Jordanie porte une étoile blanche à sept branches dans son triangle rouge ; la Palestine n'en a pas." },
  { codes: ["ae", "kw"], sur: "drapeau", texte: "Les Émirats ont une bande rouge verticale au mât ; le Koweït un trapèze noir." },
  { codes: ["ye", "iq", "eg"], sur: "drapeau", texte: "Rouge, blanc, noir : rien au centre pour le Yémen, une inscription verte pour l'Irak, l'aigle d'or pour l'Égypte." },
  { codes: ["sy", "iq"], sur: "drapeau", texte: "Depuis 2025, la Syrie hisse le vert, le blanc et le noir avec trois étoiles rouges ; l'Irak garde le rouge, le blanc et le noir." },
  { codes: ["hu", "bg"], sur: "drapeau", texte: "La Hongrie commence par le rouge en haut, la Bulgarie par le blanc." },
  { codes: ["gh", "bo"], sur: "drapeau", texte: "Rouge, jaune, vert : le Ghana porte une étoile noire au centre." },
  { codes: ["us", "lr"], sur: "drapeau", texte: "Le Liberia n'a qu'une étoile blanche et onze bandes." },
  { codes: ["cu", "pr"], sur: "drapeau", texte: "Couleurs inversées : Cuba a des bandes bleues et un triangle rouge ; Porto Rico des bandes rouges et un triangle bleu." },
  { codes: ["ne", "in"], sur: "drapeau", texte: "Orange, blanc, vert : un disque orange au centre pour le Niger, une roue bleue pour l'Inde." },
  { codes: ["ma", "vn"], sur: "drapeau", texte: "Une étoile sur fond rouge : verte et entrelacée pour le Maroc, jaune et pleine pour le Viêt Nam." },
  { codes: ["tr", "tn"], sur: "drapeau", texte: "Un croissant et une étoile : rouges dans un disque blanc au centre pour la Tunisie, blancs sur le rouge près du mât pour la Turquie." },
  { codes: ["at", "au"], sur: "nom", texte: "L'Autriche (Vienne) est en Europe, sans mer ; l'Australie (Canberra) est une île-continent." },
  { codes: ["se", "ch"], sur: "nom", texte: "La Suède (Stockholm) est scandinave ; la Suisse (Berne) est alpine." },
  { codes: ["si", "sk"], sur: "nom", texte: "La Slovénie (Ljubljana) touche l'Adriatique ; la Slovaquie (Bratislava), plus au nord, n'a pas de mer." },
  { codes: ["ne", "ng"], sur: "nom", texte: "Le Niger (Niamey) est au nord du Nigeria (Abuja) ; le fleuve Niger traverse les deux." },
  { codes: ["gn", "gw", "gq"], sur: "nom", texte: "La Guinée (Conakry), la Guinée-Bissau (Bissau) et la Guinée équatoriale (Malabo) : trois pays, trois capitales." },
  { codes: ["cg", "cd"], sur: "nom", texte: "Deux capitales face à face sur le fleuve Congo : Brazzaville pour le Congo, Kinshasa pour la RD Congo." },
  { codes: ["ir", "iq"], sur: "nom", texte: "L'Iran (Téhéran) est persanophone ; l'Irak (Bagdad), son voisin à l'ouest, arabophone." },
  { codes: ["dm", "do"], sur: "nom", texte: "La Dominique est une petite île anglophone ; la République dominicaine partage Hispaniola avec Haïti." },
  { codes: ["lv", "lt", "ee"], sur: "nom", texte: "Du nord au sud : Estonie (Tallinn), Lettonie (Riga), Lituanie (Vilnius), comme l'alphabet." },
];

/** Les capitales qu'on croit connaître. */
export const PIEGES_CAPITALES: Readonly<Record<string, string>> = {
  au: "Ni Sydney ni Melbourne : Canberra, bâtie exprès entre les deux.",
  ca: "Ni Toronto ni Montréal : Ottawa, en Ontario, au bord du Québec.",
  tr: "Pas Istanbul : Ankara, depuis 1923.",
  br: "Ni Rio ni São Paulo : Brasília, inaugurée en 1960.",
  ch: "Ni Zurich ni Genève : Berne, la « ville fédérale ».",
  ma: "Pas Casablanca : Rabat.",
  ng: "Pas Lagos : Abuja, depuis 1991.",
  pk: "Pas Karachi : Islamabad.",
  mm: "Pas Rangoun : Naypyidaw, depuis 2005.",
  ci: "Yamoussoukro est la capitale ; Abidjan reste le cœur économique.",
  tz: "Dodoma est la capitale ; Dar es Salaam la plus grande ville.",
  bo: "Sucre est la capitale constitutionnelle ; le gouvernement siège à La Paz.",
  za: "Trois capitales : Pretoria, Le Cap et Bloemfontein.",
  kz: "Astana, et non plus Almaty, depuis 1997.",
  nz: "Pas Auckland : Wellington.",
  us: "Pas New York : Washington.",
  in: "New Delhi, pas Bombay.",
  vn: "Hanoï au nord, pas Hô Chi Minh-Ville au sud.",
  lk: "Sri Jayawardenapura Kotte, à côté de Colombo.",
  bj: "Porto-Novo ; le gouvernement siège à Cotonou.",
  my: "Kuala Lumpur, même si le gouvernement siège à Putrajaya.",
  nl: "Amsterdam ; le gouvernement siège à La Haye.",
  ae: "Pas Dubaï : Abou Dabi.",
  sa: "Riyad, ni Djeddah ni La Mecque.",
  cn: "Pékin, pas Shanghai.",
  ec: "Quito, pas Guayaquil.",
  cm: "Yaoundé, pas Douala.",
};

/** Le piège entre deux pays (dans n'importe quel ordre), pour ce qu'on demandait. */
export function piegeEntre(a: string, b: string, sur?: "drapeau" | "nom"): Piege | undefined {
  return PIEGES.find((p) => p.codes.includes(a) && p.codes.includes(b) && (!sur || p.sur === sur));
}

/** Tous les pièges d'un pays (pour sa carte « Découvrir »). */
export const piegesDe = (code: string): Piege[] => PIEGES.filter((p) => p.codes.includes(code));

/* ---------- Les routes thématiques ---------- */

export type ThemeId = "afrique" | "ue" | "la" | "oif" | "oci" | "g20" | "pacifique" | "asean" | "commonwealth" | "ameriques";
export type Theme = { id: ThemeId; nom: string; texte: string; filtre: (p: Pays) => boolean };

const membre = (o: OrganisationId) => (p: Pays) => p.quiz && Boolean(p.orgs?.includes(o));
const etatDe = (c: ContinentId) => (p: Pays) => p.quiz && p.statut !== "territoire" && p.continent === c;

export const THEMES: readonly Theme[] = [
  { id: "afrique", nom: "L'Afrique des 54", texte: "Les 54 pays du continent, du Maroc à l'Afrique du Sud.", filtre: etatDe("afrique") },
  { id: "ue", nom: "L'Union européenne", texte: "Les 27 pays de l'Union, leurs drapeaux et leurs capitales.", filtre: membre("ue") },
  { id: "la", nom: "La Ligue arabe", texte: "Les 22 membres, de la Mauritanie à Oman.", filtre: membre("la") },
  { id: "oif", nom: "La Francophonie", texte: "Les membres de l'Organisation internationale de la Francophonie.", filtre: membre("oif") },
  { id: "oci", nom: "L'Organisation de la coopération islamique", texte: "Les 57 membres, de l'Afrique de l'Ouest à l'Indonésie.", filtre: membre("oci") },
  { id: "g20", nom: "Le G20", texte: "Les grandes économies du monde réunies chaque année.", filtre: membre("g20") },
  { id: "asean", nom: "L'Asie du Sud-Est", texte: "Les membres de l'ASEAN.", filtre: membre("asean") },
  { id: "pacifique", nom: "Les îles du Pacifique", texte: "Des Fidji aux Tuvalu : les nations de l'Océanie.", filtre: etatDe("oceanie") },
  { id: "ameriques", nom: "Les Amériques", texte: "Du Canada à l'Argentine, Caraïbes comprises.", filtre: (p) => etatDe("amerique-nord")(p) || etatDe("amerique-sud")(p) },
  { id: "commonwealth", nom: "Le Commonwealth", texte: "Les membres du Commonwealth des nations.", filtre: membre("commonwealth") },
];

const parTheme = new Map<string, string[]>();
export function paysDuTheme(id: ThemeId): string[] {
  const deja = parTheme.get(id);
  if (deja) return deja;
  const t = THEMES.find((x) => x.id === id);
  const codes = t ? PAYS.filter(t.filtre).map((p) => p.code) : [];
  parTheme.set(id, codes);
  return codes;
}
export const estTheme = (x: unknown): x is ThemeId => typeof x === "string" && THEMES.some((t) => t.id === x);

/* ---------- L'indice (un joker) ---------- */

/** Ce que l'indice révèle : le continent et la première lettre du pays, ou celle de la réponse. */
export function indiceDe(q: Question, bonneOption?: string): string {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  const initiale = (s: string) => `commence par « ${s.trim().charAt(0).toUpperCase()} »`;
  if (def.reponse === "capitale" || def.ecrit === "capitale") return p.capitale ? `La capitale ${initiale(p.capitale)}, et compte ${p.capitale.replace(/[^\p{L}]/gu, "").length} lettres.` : "Pas d'indice ici.";
  if (def.reponse === "continent") return `Ses voisins : ${(p.voisins ?? []).slice(0, 2).map((c) => PAR_CODE.get(c)?.nom).filter(Boolean).join(", ") || "aucun, c'est une île"}.`;
  if (def.reponse === "monnaie") return p.monnaies[0]?.symbole ? `Son symbole : ${p.monnaies[0].symbole}` : `Son code : ${p.monnaies[0]?.code ?? "?"}`;
  if (def.reponse === "nom" || def.reponse === "drapeau" || def.reponse === "clic" || def.ecrit === "nom") return `En ${NOM_CONTINENT[p.continent]} ; son nom ${initiale(p.nom)}.`;
  if (bonneOption) return `La réponse ${initiale(bonneOption)}.`;
  return `C'est ${p.continent === "europe" ? "en Europe" : `en ${NOM_CONTINENT[p.continent]}`}.`;
}

/* ---------- L'examen ---------- */

export const QUESTIONS_EXAMEN = 20;

/** La mention d'une note sur 20. */
export function mention(note: number): string {
  if (note >= 18) return "Félicitations du jury";
  if (note >= 16) return "Très bien";
  if (note >= 14) return "Bien";
  if (note >= 12) return "Assez bien";
  if (note >= 10) return "Passable";
  return "À repasser";
}
