import { PAYS } from "./donnees";
import type { Pays } from "./types";

/*
 * Le Portulan : les catégories et toutes les façons de poser une question.
 *
 * Une question = ce qu'on montre (l'invite) + ce qu'on doit trouver (la réponse).
 * Le drapeau donné, on cherche le nom ; le nom donné, on cherche le drapeau ; un pays
 * colorié sur le globe, on cherche son nom, son drapeau, ou on l'écrit ; etc.
 *
 * Les cinq grandes catégories (drapeaux, capitales, cartes, continents, monnaies) servent aussi
 * aux duels et aux modes rapides ; les huit autres se jouent par niveaux.
 */

export type CategorieClassique = "drapeaux" | "capitales" | "cartes" | "continents" | "monnaies";
export type CategorieId = CategorieClassique | "gentiles" | "langues" | "villes" | "reliefs" | "codes" | "fuseaux" | "voisins" | "comparaisons";
/** Les duels ne connaissent que les cinq grandes catégories (et leur mélange). */
export type ModeJeu = CategorieClassique | "melange";

export type TypeQuestion =
  // Drapeaux
  | "drapeau-nom"
  | "nom-drapeau"
  | "drapeau-ecrit"
  | "drapeau-gris"
  | "drapeau-devoile"
  | "drapeau-vrai-faux"
  | "drapeau-carte"
  | "drapeau-couleur"
  | "drapeau-colorie"
  | "drapeau-puzzle"
  // Capitales
  | "pays-capitale"
  | "capitale-pays"
  | "drapeau-capitale"
  | "capitale-drapeau"
  | "capitale-ecrit"
  | "capitale-vrai-faux"
  | "capitale-carte"
  | "capitale-placer"
  // Cartes
  | "carte-nom"
  | "carte-drapeau"
  | "carte-ecrit"
  | "silhouette-nom"
  | "silhouette-tournee"
  | "nom-carte"
  // Continents
  | "pays-continent"
  | "drapeau-continent"
  | "continent-pays"
  | "continent-intrus"
  // Monnaies
  | "pays-monnaie"
  | "monnaie-pays"
  | "drapeau-monnaie"
  | "monnaie-intrus"
  // Gentilés, langues, villes
  | "pays-gentile"
  | "gentile-pays"
  | "pays-langue"
  | "langue-pays"
  | "ville-pays"
  | "pays-ville"
  // Reliefs et fleuves
  | "sommet-pays"
  | "pays-sommet"
  | "fleuve-pays"
  | "pays-fleuve"
  // Codes
  | "pays-conduite"
  | "tld-pays"
  | "pays-indicatif"
  | "indicatif-pays"
  | "pays-iso"
  // Fuseaux horaires
  | "fuseau-heure"
  | "heure-pays"
  // Voisins
  | "voisin-de"
  | "pas-voisin"
  | "nb-voisins"
  // Comparaisons
  | "plus-peuple"
  | "plus-grand"
  | "classer-population"
  | "classer-superficie";

export type Invite =
  | "drapeau"
  | "drapeau-gris"
  | "drapeau-devoile"
  | "drapeau-trou"
  | "coloriage"
  | "puzzle"
  | "nom"
  | "capitale"
  | "carte"
  | "silhouette"
  | "silhouette-tournee"
  | "monnaie"
  | "continent"
  | "proposition"
  | "texte"
  | "heure"
  | "heure-locale"
  | "aucune";

/**
 * Ce qu'on choisit ou ce qu'on fait pour répondre :
 *   nom, drapeau, capitale, continent, monnaie : un choix parmi des pays (ou des continents, des monnaies) ;
 *   texte : un choix parmi des mots (gentilés, langues, villes, sommets, codes, heures, nombres) ;
 *   couleur : une pastille ; vraifaux : vrai ou faux ;
 *   ecrit : on écrit ; clic : on touche un pays sur le globe ; placer : on pose un point sur le globe ;
 *   coloriage : on colorie un drapeau ; classer : on range quatre pays ; puzzle : on remet en place
 *   les six pièces d'un drapeau.
 */
export type SorteReponse = "nom" | "drapeau" | "capitale" | "continent" | "monnaie" | "texte" | "couleur" | "vraifaux" | "ecrit" | "clic" | "placer" | "coloriage" | "classer" | "puzzle";

export type DefType = {
  id: TypeQuestion;
  categorie: CategorieId;
  /** Le nom de la méthode, dans le choix avant une partie. */
  libelle: string;
  /** La consigne affichée au-dessus de la question. */
  consigne: string;
  invite: Invite;
  reponse: SorteReponse;
  /** Pour une réponse écrite : ce qu'on écrit. */
  ecrit?: "nom" | "capitale";
  /** Le pays peut-il être la cible de cette question ? */
  eligible: (p: Pays) => boolean;
  /** false : pas dans les duels (les duels gardent leurs dix questions à quatre choix d'origine). */
  duel?: false;
};

/** Les réponses qu'on ne donne pas d'un simple choix : pas de duel, pas de mode rapide. */
export const REPONSES_LIBRES: readonly SorteReponse[] = ["ecrit", "clic", "placer", "coloriage", "classer", "puzzle"];

const enQuiz = (p: Pays) => p.quiz;
const avecDrapeau = (p: Pays) => p.quiz && p.drapeauPropre;
const avecCapitale = (p: Pays) => p.quiz && p.capitale !== null;
const surContinent = (p: Pays) => p.quiz && p.continent !== "antarctique";
const avecMonnaie = (p: Pays) => p.quiz && p.quizMonnaie;

/* ---------- Ce qui n'appartient qu'à un seul pays (on peut alors demander « à qui est-ce ? ») ---------- */

function compter(cle: (p: Pays) => readonly (string | undefined)[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of PAYS) if (p.quiz) for (const k of new Set(cle(p))) if (k) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}
const usagesMonnaie = compter((p) => p.monnaies.map((m) => m.code));
const usagesGentile = compter((p) => [p.gentile?.[0]]);
const usagesIndicatif = compter((p) => [p.indicatif]);
const usagesTld = compter((p) => [p.tld]);
/** Les noms de lieux portés par deux pays (une ville ici, une capitale là : Tripoli…) : jamais demandés seuls. */
const usagesLieu = compter((p) => [...(p.villes ?? []), p.capitale ?? undefined].map((x) => x?.toLowerCase()));

export const monnaieUnique = (p: Pays) => avecMonnaie(p) && usagesMonnaie.get(p.monnaies[0].code) === 1;
/** Les monnaies que se partagent au moins trois pays (l'euro, le franc CFA, le dollar…). */
export const MONNAIES_PARTAGEES = [...usagesMonnaie].filter(([, n]) => n >= 3).map(([c]) => c);
export const gentileUnique = (p: Pays) => Boolean(p.quiz && p.gentile && usagesGentile.get(p.gentile[0]) === 1);
export const indicatifUnique = (p: Pays) => Boolean(p.quiz && p.indicatif && usagesIndicatif.get(p.indicatif) === 1);
export const tldUnique = (p: Pays) => Boolean(p.quiz && p.tld && usagesTld.get(p.tld) === 1);
/** Les grandes villes d'un pays qu'on peut demander sans ambiguïté. */
export const villesSures = (p: Pays): string[] => (p.villes ?? []).filter((v) => usagesLieu.get(v.toLowerCase()) === 1);

const avecGentile = (p: Pays) => Boolean(p.quiz && p.gentile);
/** Le Sahara occidental n'a pas de langue officielle reconnue par tous : on ne le demande pas. */
export const avecLangue = (p: Pays) => p.quiz && p.langues.length > 0 && p.code !== "eh";
const avecVille = (p: Pays) => p.quiz && villesSures(p).length > 0;
const avecSommet = (p: Pays) => Boolean(p.quiz && p.sommet && p.sommet[1] > 0);
const avecFleuve = (p: Pays) => Boolean(p.quiz && p.fleuve);
const avecFuseau = (p: Pays) => Boolean(p.quiz && p.fuseau && p.population);
const avecVoisins = (p: Pays) => p.quiz && p.voisins.length > 0;
/** Les petits pays ne peuvent pas être « le plus peuplé » ou « le plus grand » de quatre : il faut des plus petits qu'eux. */
const rangPopulation = new Map(
  PAYS.filter((p) => p.quiz && p.population)
    .sort((a, b) => (a.population ?? 0) - (b.population ?? 0))
    .map((p, i) => [p.code, i]),
);
const rangSuperficie = new Map(
  PAYS.filter((p) => p.quiz && p.superficie)
    .sort((a, b) => (a.superficie ?? 0) - (b.superficie ?? 0))
    .map((p, i) => [p.code, i]),
);
const comparable = (p: Pays) => p.quiz && (rangPopulation.get(p.code) ?? 0) >= 12 && (rangSuperficie.get(p.code) ?? 0) >= 12;

/** Les drapeaux qu'on colorie et ceux dont on cache une couleur. */
const coloriable = (p: Pays) => avecDrapeau(p) && Boolean(p.coloriage);
const aDesCouleurs = (p: Pays) => avecDrapeau(p) && (p.couleurs?.length ?? 0) >= 2;
/** Un puzzle digne de ce nom : au moins trois sortes de pièces (pas deux bandes qu'on inverse). */
const puzzlable = (p: Pays) => avecDrapeau(p) && new Set(p.decoupe ?? "").size >= 3;

const t = (d: DefType) => d;

export const TYPES: Record<TypeQuestion, DefType> = {
  "drapeau-nom": t({ id: "drapeau-nom", categorie: "drapeaux", libelle: "Drapeau → pays", consigne: "À quel pays est ce drapeau ?", invite: "drapeau", reponse: "nom", eligible: avecDrapeau }),
  "nom-drapeau": t({ id: "nom-drapeau", categorie: "drapeaux", libelle: "Pays → drapeau", consigne: "Trouve son drapeau", invite: "nom", reponse: "drapeau", eligible: avecDrapeau }),
  "drapeau-ecrit": t({ id: "drapeau-ecrit", categorie: "drapeaux", libelle: "Drapeau → nom à écrire", consigne: "Écris le nom de ce pays", invite: "drapeau", reponse: "ecrit", ecrit: "nom", eligible: avecDrapeau }),
  "drapeau-gris": t({ id: "drapeau-gris", categorie: "drapeaux", libelle: "Drapeau en noir et blanc", consigne: "Sans ses couleurs, à quel pays est ce drapeau ?", invite: "drapeau-gris", reponse: "nom", eligible: avecDrapeau, duel: false }),
  "drapeau-devoile": t({ id: "drapeau-devoile", categorie: "drapeaux", libelle: "Drapeau qui se dévoile", consigne: "Le drapeau se dévoile : reconnais-le au plus vite", invite: "drapeau-devoile", reponse: "nom", eligible: avecDrapeau, duel: false }),
  "drapeau-vrai-faux": t({ id: "drapeau-vrai-faux", categorie: "drapeaux", libelle: "Vrai ou faux", consigne: "Vrai ou faux ?", invite: "proposition", reponse: "vraifaux", eligible: avecDrapeau, duel: false }),
  "drapeau-carte": t({ id: "drapeau-carte", categorie: "drapeaux", libelle: "Drapeau → le situer sur le globe", consigne: "Touche sur le globe le pays de ce drapeau", invite: "drapeau", reponse: "clic", eligible: (p) => avecDrapeau(p) && p.carte && (p.superficie ?? 0) >= 9000 }),
  "drapeau-couleur": t({ id: "drapeau-couleur", categorie: "drapeaux", libelle: "La couleur qui manque", consigne: "Quelle couleur manque à ce drapeau ?", invite: "drapeau-trou", reponse: "couleur", eligible: aDesCouleurs, duel: false }),
  "drapeau-colorie": t({ id: "drapeau-colorie", categorie: "drapeaux", libelle: "Colorie le drapeau", consigne: "Colorie ce drapeau", invite: "coloriage", reponse: "coloriage", eligible: coloriable }),
  "drapeau-puzzle": t({ id: "drapeau-puzzle", categorie: "drapeaux", libelle: "Le puzzle du drapeau", consigne: "Remets les pièces de ce drapeau en place", invite: "puzzle", reponse: "puzzle", eligible: puzzlable }),

  "pays-capitale": t({ id: "pays-capitale", categorie: "capitales", libelle: "Pays → capitale", consigne: "Quelle est sa capitale ?", invite: "nom", reponse: "capitale", eligible: avecCapitale }),
  "capitale-pays": t({ id: "capitale-pays", categorie: "capitales", libelle: "Capitale → pays", consigne: "De quel pays est-ce la capitale ?", invite: "capitale", reponse: "nom", eligible: avecCapitale }),
  "drapeau-capitale": t({ id: "drapeau-capitale", categorie: "capitales", libelle: "Drapeau → capitale", consigne: "Quelle est la capitale de ce pays ?", invite: "drapeau", reponse: "capitale", eligible: (p) => avecCapitale(p) && p.drapeauPropre }),
  "capitale-drapeau": t({ id: "capitale-drapeau", categorie: "capitales", libelle: "Capitale → drapeau", consigne: "Trouve le drapeau de son pays", invite: "capitale", reponse: "drapeau", eligible: (p) => avecCapitale(p) && p.drapeauPropre }),
  "capitale-ecrit": t({ id: "capitale-ecrit", categorie: "capitales", libelle: "Pays → capitale à écrire", consigne: "Écris sa capitale", invite: "nom", reponse: "ecrit", ecrit: "capitale", eligible: avecCapitale }),
  "capitale-vrai-faux": t({ id: "capitale-vrai-faux", categorie: "capitales", libelle: "Vrai ou faux", consigne: "Vrai ou faux ?", invite: "proposition", reponse: "vraifaux", eligible: avecCapitale, duel: false }),
  "capitale-carte": t({ id: "capitale-carte", categorie: "capitales", libelle: "Capitale → le pays sur le globe", consigne: "Touche sur le globe le pays de cette capitale", invite: "capitale", reponse: "clic", eligible: (p) => avecCapitale(p) && p.carte && (p.superficie ?? 0) >= 9000 }),
  "capitale-placer": t({ id: "capitale-placer", categorie: "capitales", libelle: "Placer la capitale", consigne: "Pose la capitale sur le globe, au plus près", invite: "nom", reponse: "placer", eligible: (p) => avecCapitale(p) && Boolean(p.capLatLng) && p.carte }),

  "carte-nom": t({ id: "carte-nom", categorie: "cartes", libelle: "Carte → pays", consigne: "Quel est ce pays ?", invite: "carte", reponse: "nom", eligible: enQuiz }),
  "carte-drapeau": t({ id: "carte-drapeau", categorie: "cartes", libelle: "Carte → drapeau", consigne: "Trouve le drapeau de ce pays", invite: "carte", reponse: "drapeau", eligible: avecDrapeau }),
  "carte-ecrit": t({ id: "carte-ecrit", categorie: "cartes", libelle: "Carte → nom à écrire", consigne: "Écris le nom de ce pays", invite: "carte", reponse: "ecrit", ecrit: "nom", eligible: enQuiz }),
  "silhouette-nom": t({ id: "silhouette-nom", categorie: "cartes", libelle: "Silhouette → pays", consigne: "À qui est cette silhouette ?", invite: "silhouette", reponse: "nom", eligible: (p) => p.quiz && p.carte && (p.superficie ?? 0) >= 2500 }),
  "silhouette-tournee": t({ id: "silhouette-tournee", categorie: "cartes", libelle: "Silhouette tournée ou retournée", consigne: "Elle est tournée, ou vue dans un miroir : à qui est-elle ?", invite: "silhouette-tournee", reponse: "nom", eligible: (p) => p.quiz && p.carte && (p.superficie ?? 0) >= 20000, duel: false }),
  "nom-carte": t({ id: "nom-carte", categorie: "cartes", libelle: "Pays → le situer sur le globe", consigne: "Touche ce pays sur le globe", invite: "nom", reponse: "clic", eligible: (p) => p.quiz && p.carte && (p.superficie ?? 0) >= 9000 }),

  "pays-continent": t({ id: "pays-continent", categorie: "continents", libelle: "Pays → continent", consigne: "Sur quel continent ?", invite: "nom", reponse: "continent", eligible: surContinent }),
  "drapeau-continent": t({ id: "drapeau-continent", categorie: "continents", libelle: "Drapeau → continent", consigne: "De quel continent vient ce drapeau ?", invite: "drapeau", reponse: "continent", eligible: (p) => surContinent(p) && p.drapeauPropre }),
  "continent-pays": t({ id: "continent-pays", categorie: "continents", libelle: "Continent → pays", consigne: "Lequel se trouve sur ce continent ?", invite: "continent", reponse: "nom", eligible: (p) => surContinent(p) && !p.continents }),
  "continent-intrus": t({ id: "continent-intrus", categorie: "continents", libelle: "L'intrus", consigne: "Lequel n'est pas sur ce continent ?", invite: "continent", reponse: "nom", eligible: (p) => surContinent(p) && !p.continents, duel: false }),

  "pays-monnaie": t({ id: "pays-monnaie", categorie: "monnaies", libelle: "Pays → monnaie", consigne: "Quelle est sa monnaie ?", invite: "nom", reponse: "monnaie", eligible: avecMonnaie }),
  "monnaie-pays": t({ id: "monnaie-pays", categorie: "monnaies", libelle: "Monnaie → pays", consigne: "Quel pays l'utilise ?", invite: "monnaie", reponse: "nom", eligible: monnaieUnique }),
  "drapeau-monnaie": t({ id: "drapeau-monnaie", categorie: "monnaies", libelle: "Drapeau → monnaie", consigne: "Quelle monnaie dans ce pays ?", invite: "drapeau", reponse: "monnaie", eligible: (p) => avecMonnaie(p) && p.drapeauPropre }),
  "monnaie-intrus": t({ id: "monnaie-intrus", categorie: "monnaies", libelle: "L'intrus", consigne: "Lequel n'utilise pas cette monnaie ?", invite: "monnaie", reponse: "nom", eligible: avecMonnaie, duel: false }),

  "pays-gentile": t({ id: "pays-gentile", categorie: "gentiles", libelle: "Pays → habitants", consigne: "Comment appelle-t-on ses habitants ?", invite: "nom", reponse: "texte", eligible: avecGentile }),
  "gentile-pays": t({ id: "gentile-pays", categorie: "gentiles", libelle: "Habitants → pays", consigne: "De quel pays sont-ils ?", invite: "texte", reponse: "nom", eligible: gentileUnique }),
  "pays-langue": t({ id: "pays-langue", categorie: "langues", libelle: "Pays → langue officielle", consigne: "Laquelle est une langue officielle de ce pays ?", invite: "nom", reponse: "texte", eligible: avecLangue }),
  "langue-pays": t({ id: "langue-pays", categorie: "langues", libelle: "Langue → pays", consigne: "Dans lequel est-ce une langue officielle ?", invite: "texte", reponse: "nom", eligible: avecLangue }),
  "ville-pays": t({ id: "ville-pays", categorie: "villes", libelle: "Ville → pays", consigne: "Dans quel pays est cette ville ?", invite: "texte", reponse: "nom", eligible: avecVille }),
  "pays-ville": t({ id: "pays-ville", categorie: "villes", libelle: "Pays → grande ville", consigne: "Laquelle de ces villes s'y trouve ?", invite: "nom", reponse: "texte", eligible: avecVille }),

  "sommet-pays": t({ id: "sommet-pays", categorie: "reliefs", libelle: "Sommet → pays", consigne: "De quel pays est-ce le point culminant ?", invite: "texte", reponse: "nom", eligible: avecSommet }),
  "pays-sommet": t({ id: "pays-sommet", categorie: "reliefs", libelle: "Pays → point culminant", consigne: "Quel est son point culminant ?", invite: "nom", reponse: "texte", eligible: avecSommet }),
  "fleuve-pays": t({ id: "fleuve-pays", categorie: "reliefs", libelle: "Fleuve → pays", consigne: "De quel pays est-ce le plus long fleuve ?", invite: "texte", reponse: "nom", eligible: avecFleuve }),
  "pays-fleuve": t({ id: "pays-fleuve", categorie: "reliefs", libelle: "Pays → plus long fleuve", consigne: "Quel est son plus long fleuve ?", invite: "nom", reponse: "texte", eligible: avecFleuve }),

  "pays-conduite": t({ id: "pays-conduite", categorie: "codes", libelle: "De quel côté roule-t-on ?", consigne: "De quel côté de la route roule-t-on ?", invite: "nom", reponse: "texte", eligible: (p) => Boolean(p.quiz && p.conduite) }),
  "tld-pays": t({ id: "tld-pays", categorie: "codes", libelle: "Domaine Internet → pays", consigne: "À quel pays est ce domaine Internet ?", invite: "texte", reponse: "nom", eligible: tldUnique }),
  "pays-indicatif": t({ id: "pays-indicatif", categorie: "codes", libelle: "Pays → indicatif", consigne: "Quel est son indicatif téléphonique ?", invite: "nom", reponse: "texte", eligible: (p) => Boolean(p.quiz && p.indicatif) }),
  "indicatif-pays": t({ id: "indicatif-pays", categorie: "codes", libelle: "Indicatif → pays", consigne: "À quel pays est cet indicatif ?", invite: "texte", reponse: "nom", eligible: indicatifUnique }),
  "pays-iso": t({ id: "pays-iso", categorie: "codes", libelle: "Pays → code ISO", consigne: "Quel est son code à trois lettres ?", invite: "nom", reponse: "texte", eligible: enQuiz }),

  "fuseau-heure": t({ id: "fuseau-heure", categorie: "fuseaux", libelle: "Quelle heure là-bas ?", consigne: "Il est midi à Paris. Quelle heure est-il là-bas ?", invite: "heure", reponse: "texte", eligible: avecFuseau }),
  "heure-pays": t({ id: "heure-pays", categorie: "fuseaux", libelle: "Où est-on ?", consigne: "Où peut-on être à cette heure-là ?", invite: "heure-locale", reponse: "nom", eligible: avecFuseau }),

  "voisin-de": t({ id: "voisin-de", categorie: "voisins", libelle: "Trouver un voisin", consigne: "Lequel est son voisin ?", invite: "nom", reponse: "nom", eligible: avecVoisins }),
  "pas-voisin": t({ id: "pas-voisin", categorie: "voisins", libelle: "L'intrus", consigne: "Lequel n'est pas son voisin ?", invite: "nom", reponse: "nom", eligible: (p) => p.quiz && p.voisins.length >= 3 }),
  "nb-voisins": t({ id: "nb-voisins", categorie: "voisins", libelle: "Combien de voisins ?", consigne: "Combien de pays le touchent ?", invite: "nom", reponse: "texte", eligible: avecVoisins }),

  "plus-peuple": t({ id: "plus-peuple", categorie: "comparaisons", libelle: "Le plus peuplé", consigne: "Lequel compte le plus d'habitants ?", invite: "aucune", reponse: "nom", eligible: comparable }),
  "plus-grand": t({ id: "plus-grand", categorie: "comparaisons", libelle: "Le plus grand", consigne: "Lequel est le plus grand ?", invite: "aucune", reponse: "nom", eligible: comparable }),
  "classer-population": t({ id: "classer-population", categorie: "comparaisons", libelle: "Ranger par population", consigne: "Range-les du plus peuplé au moins peuplé", invite: "aucune", reponse: "classer", eligible: comparable }),
  "classer-superficie": t({ id: "classer-superficie", categorie: "comparaisons", libelle: "Ranger par superficie", consigne: "Range-les du plus grand au plus petit", invite: "aucune", reponse: "classer", eligible: comparable }),
};
export const TOUS_LES_TYPES = Object.keys(TYPES) as TypeQuestion[];

export type DefCategorie = {
  id: CategorieId;
  nom: string;
  /** Une phrase, sous le nom. */
  texte: string;
  /** Les pays de la catégorie (ceux qu'on doit apprendre). */
  eligible: (p: Pays) => boolean;
  /** L'ordre de difficulté propre à la catégorie. */
  rang: (p: Pays) => number;
  /** Les méthodes, par palier de niveaux : 1 à 5, 6 à 10, 11 à 15 (chaque palier garde les précédentes). */
  paliers: [TypeQuestion[], TypeQuestion[], TypeQuestion[]];
};

export const CATEGORIES: Record<CategorieId, DefCategorie> = {
  drapeaux: {
    id: "drapeaux",
    nom: "Drapeaux",
    texte: "Reconnaître le drapeau de chaque pays, et le pays de chaque drapeau.",
    eligible: avecDrapeau,
    rang: (p) => p.rang,
    paliers: [["drapeau-nom", "nom-drapeau"], ["drapeau-gris", "drapeau-vrai-faux", "drapeau-devoile", "drapeau-puzzle"], ["drapeau-ecrit", "drapeau-carte", "drapeau-couleur", "drapeau-colorie"]],
  },
  capitales: {
    id: "capitales",
    nom: "Capitales",
    texte: "Toutes les capitales, dans les deux sens, avec ou sans drapeau.",
    eligible: avecCapitale,
    rang: (p) => p.rangCapitale,
    paliers: [["pays-capitale", "capitale-pays"], ["drapeau-capitale", "capitale-drapeau", "capitale-vrai-faux"], ["capitale-ecrit", "capitale-carte", "capitale-placer"]],
  },
  cartes: {
    id: "cartes",
    nom: "Cartes",
    texte: "Un pays s'allume sur le globe : son nom, son drapeau, sa silhouette.",
    eligible: enQuiz,
    rang: (p) => p.rangCarte,
    paliers: [["carte-nom", "carte-drapeau"], ["silhouette-nom"], ["carte-ecrit", "nom-carte", "silhouette-tournee"]],
  },
  continents: {
    id: "continents",
    nom: "Continents",
    texte: "Ranger chaque pays sur son continent.",
    eligible: surContinent,
    rang: (p) => p.rang,
    paliers: [["pays-continent"], ["drapeau-continent", "continent-pays"], ["continent-intrus"]],
  },
  monnaies: {
    id: "monnaies",
    nom: "Monnaies",
    texte: "L'euro, le yen, le dirham, le franc CFA… et toutes les autres.",
    eligible: avecMonnaie,
    rang: (p) => p.rang,
    paliers: [["pays-monnaie"], ["drapeau-monnaie", "monnaie-pays"], ["monnaie-intrus"]],
  },
  gentiles: {
    id: "gentiles",
    nom: "Habitants",
    texte: "Les Marocains, les Ivoiriens, les Néo-Zélandais : le nom des habitants de chaque pays.",
    eligible: avecGentile,
    rang: (p) => p.rang,
    paliers: [["pays-gentile"], ["gentile-pays"], []],
  },
  langues: {
    id: "langues",
    nom: "Langues officielles",
    texte: "Ce que l'on parle officiellement, d'un bout à l'autre du monde.",
    eligible: avecLangue,
    rang: (p) => p.rang,
    paliers: [["pays-langue"], ["langue-pays"], []],
  },
  villes: {
    id: "villes",
    nom: "Grandes villes",
    texte: "Casablanca, Shanghai, Lagos… les grandes villes qui ne sont pas des capitales.",
    eligible: avecVille,
    rang: (p) => p.rang,
    paliers: [["ville-pays"], ["pays-ville"], []],
  },
  reliefs: {
    id: "reliefs",
    nom: "Sommets et fleuves",
    texte: "Le point culminant et le plus long fleuve de chaque pays.",
    eligible: (p) => avecSommet(p) || avecFleuve(p),
    rang: (p) => p.rang,
    paliers: [["sommet-pays", "fleuve-pays"], ["pays-sommet", "pays-fleuve"], []],
  },
  codes: {
    id: "codes",
    nom: "Codes et indicatifs",
    texte: "Pour les experts : .ma, +212, MAR, et le côté de la route.",
    eligible: (p) => p.quiz && Boolean(p.tld || p.indicatif),
    rang: (p) => p.rang,
    paliers: [["pays-conduite", "tld-pays"], ["pays-indicatif", "indicatif-pays"], ["pays-iso"]],
  },
  fuseaux: {
    id: "fuseaux",
    nom: "Fuseaux horaires",
    texte: "Quand il est midi à Paris, quelle heure est-il à Tokyo, à Rio, à Riyad ?",
    eligible: avecFuseau,
    rang: (p) => p.rang,
    paliers: [["fuseau-heure"], ["heure-pays"], []],
  },
  voisins: {
    id: "voisins",
    nom: "Voisins",
    texte: "Qui touche qui : les frontières de chaque pays.",
    eligible: avecVoisins,
    rang: (p) => p.rang,
    paliers: [["voisin-de"], ["pas-voisin"], ["nb-voisins"]],
  },
  comparaisons: {
    id: "comparaisons",
    nom: "Comparaisons",
    texte: "Le plus peuplé, le plus grand : à l'œil, puis en rangeant.",
    eligible: comparable,
    rang: (p) => p.rang,
    paliers: [["plus-peuple", "plus-grand"], ["classer-population"], ["classer-superficie"]],
  },
};
export const IDS_CATEGORIES = Object.keys(CATEGORIES) as CategorieId[];
/** Les cinq grandes catégories : celles des duels, des modes rapides et du tour du monde. */
export const CATEGORIES_CLASSIQUES: CategorieClassique[] = ["drapeaux", "capitales", "cartes", "continents", "monnaies"];
export const CATEGORIES_NOUVELLES = IDS_CATEGORIES.filter((c) => !(CATEGORIES_CLASSIQUES as string[]).includes(c));

/** Les méthodes de la catégorie ouvertes à un niveau donné (1 à 15). */
export function typesDuNiveau(categorie: CategorieId, niveau: number): TypeQuestion[] {
  const [a, b, c] = CATEGORIES[categorie].paliers;
  return niveau <= 5 ? a : niveau <= 10 ? [...a, ...b] : [...a, ...b, ...c];
}

/** Toutes les méthodes d'une catégorie (pour le choix libre). */
export const typesDe = (categorie: CategorieId): TypeQuestion[] => CATEGORIES[categorie].paliers.flat();
