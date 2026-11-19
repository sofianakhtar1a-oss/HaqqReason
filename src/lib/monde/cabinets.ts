import { CABINETS_DONNEES, EMBLEMES_URL } from "./cabinets-donnees";
import { choisir, deriver, hasard, type Hasard, melanger } from "./hasard";
import { comparer, type Jugement, normaliser } from "./texte";
import type { CabinetId, DonneesCabinet, ElementCabinet, MethodeCabinet } from "./types";

/*
 * Le Portulan : les cabinets, c'est-à-dire les pays vus de l'intérieur. Départements français,
 * États américains, provinces canadiennes, régions du Maroc, wilayas d'Algérie, et des drapeaux
 * qui ne sont pas ceux d'un pays. Chaque cabinet a sa route de niveaux (une dizaine d'éléments
 * par niveau), ses méthodes (le numéro, le chef-lieu, le drapeau, une ville…) et sa mémoire.
 *
 * Comme pour les pays, le navigateur n'envoie que ses réponses : le serveur les juge ici
 * (jugerCabinet) avec les mêmes données.
 */

export const CABINETS: readonly DonneesCabinet[] = CABINETS_DONNEES;
const PAR_ID = new Map<string, DonneesCabinet>(CABINETS.map((c) => [c.id, c]));
const ELEMENTS = new Map<string, Map<string, ElementCabinet>>(CABINETS.map((c) => [c.id, new Map(c.elements.map((e) => [e.id, e]))]));

export const estCabinet = (x: unknown): x is CabinetId => typeof x === "string" && PAR_ID.has(x);
export const cabinet = (id: CabinetId): DonneesCabinet => PAR_ID.get(id)!;
export const element = (c: CabinetId, id: string): ElementCabinet | undefined => ELEMENTS.get(c)?.get(id);
export const urlEmbleme = (fichier: string) => `${EMBLEMES_URL}${fichier}`;

/* ---------- Les méthodes ---------- */

export type InviteCabinet = "nom" | "chef" | "num" | "drapeau" | "ville";
export type ReponseCabinet = "nom" | "chef" | "num" | "groupe" | "drapeau" | "ecrit";
type DefMethode = { invite: InviteCabinet; reponse: ReponseCabinet; ecrit?: "chef" | "nom" | "num"; eligible: (e: ElementCabinet) => boolean };

/** Un chef-lieu qui porte le nom de son territoire (Paris, Québec) ne fait pas une question. */
const avecChef = (e: ElementCabinet) => Boolean(e.chef) && normaliser(e.chef!) !== normaliser(e.nom);
const avecNum = (e: ElementCabinet) => Boolean(e.num);

export const METHODES: Record<MethodeCabinet, DefMethode> = {
  "nom-chef": { invite: "nom", reponse: "chef", eligible: avecChef },
  "chef-nom": { invite: "chef", reponse: "nom", eligible: avecChef },
  "num-nom": { invite: "num", reponse: "nom", eligible: avecNum },
  "nom-num": { invite: "nom", reponse: "num", eligible: avecNum },
  "nom-groupe": { invite: "nom", reponse: "groupe", eligible: (e) => Boolean(e.groupe) },
  "drapeau-nom": { invite: "drapeau", reponse: "nom", eligible: (e) => Boolean(e.drapeau) },
  "nom-drapeau": { invite: "nom", reponse: "drapeau", eligible: (e) => Boolean(e.drapeau) },
  "ville-nom": { invite: "ville", reponse: "nom", eligible: (e) => Boolean(e.villes?.length) },
  "ecrire-chef": { invite: "nom", reponse: "ecrit", ecrit: "chef", eligible: avecChef },
  "ecrire-nom": { invite: "num", reponse: "ecrit", ecrit: "nom", eligible: avecNum },
  "ecrire-num": { invite: "nom", reponse: "ecrit", ecrit: "num", eligible: avecNum },
};

const avecArticle = (mot: string) => (/^chef/.test(mot) ? `le ${mot}` : `la ${mot}`);

/** Le nom d'une méthode, dans le choix avant une partie. */
export function libelleMethode(c: DonneesCabinet, m: MethodeCabinet): string {
  const chef = avecArticle(c.mots.chef ?? "capitale");
  switch (m) {
    case "nom-chef":
      return `Trouver ${chef}`;
    case "chef-nom":
      return `Depuis ${chef}`;
    case "num-nom":
      return "Depuis le numéro";
    case "nom-num":
      return "Trouver le numéro";
    case "nom-groupe":
      return `Trouver ${avecArticle(c.mots.groupe ?? "région")}`;
    case "drapeau-nom":
      return "Reconnaître le drapeau";
    case "nom-drapeau":
      return "Trouver le drapeau";
    case "ville-nom":
      return "Depuis une ville";
    case "ecrire-chef":
      return `Écrire ${chef}`;
    case "ecrire-nom":
      return "Écrire le nom";
    case "ecrire-num":
      return "Écrire le numéro";
  }
}

export const methodesDe = (c: DonneesCabinet): MethodeCabinet[] => c.paliers.flat();

/* ---------- Les niveaux ---------- */

const niveauxCache = new Map<string, ElementCabinet[][]>();

/** Les éléments rangés par niveau : à peu près « taille » par niveau, sans petit reste à la fin. */
export function niveauxCabinet(c: DonneesCabinet): ElementCabinet[][] {
  const deja = niveauxCache.get(c.id);
  if (deja) return deja;
  const tries = [...c.elements].sort((a, b) => a.rang - b.rang);
  const n = Math.max(1, Math.round(tries.length / c.taille));
  const sortie: ElementCabinet[][] = [];
  for (let i = 0; i < n; i++) sortie.push(tries.slice(Math.round((i * tries.length) / n), Math.round(((i + 1) * tries.length) / n)));
  niveauxCache.set(c.id, sortie);
  return sortie;
}

/** Le nombre de niveaux d'un cabinet, et les éléments des niveaux d'avant (par identifiant). */
export const nombreNiveaux = (id: CabinetId): number => niveauxCabinet(cabinet(id)).length;
export const elementsAvant = (id: CabinetId, niveau: number): string[] =>
  niveauxCabinet(cabinet(id))
    .slice(0, niveau - 1)
    .flat()
    .map((e) => e.id);

/** Les méthodes ouvertes à un niveau : les premières dans la première moitié de la route, toutes ensuite. */
export function methodesDuNiveau(c: DonneesCabinet, niveau: number): MethodeCabinet[] {
  const total = niveauxCabinet(c).length;
  const [a, b = []] = c.paliers;
  return niveau <= Math.ceil(total / 2) || !b.length ? a : [...a, ...b];
}

/* ---------- Les questions ---------- */

export type QuestionCabinet = {
  cabinet: CabinetId;
  methode: MethodeCabinet;
  cible: string;
  /** Les choix : des identifiants d'éléments (ou de régions pour « nom-groupe ») ; vide pour une réponse écrite. */
  options: string[];
  /** Pour « ville-nom » : la ville montrée. */
  ville?: string;
  nb: number;
};

/** Trois faux choix proches : même région, numéros voisins, sinon au hasard. */
function voisins(c: DonneesCabinet, cible: ElementCabinet, m: MethodeCabinet, h: Hasard, nombre: number): ElementCabinet[] {
  const def = METHODES[m];
  const besoin = (e: ElementCabinet) => (def.reponse === "chef" ? Boolean(e.chef) : def.reponse === "num" ? Boolean(e.num) : def.reponse === "drapeau" ? Boolean(e.drapeau) : true);
  const autres = c.elements.filter((e) => e.id !== cible.id && besoin(e));
  const proches = (e: ElementCabinet) => {
    let d = Math.abs(e.rang - cible.rang);
    if (def.invite === "num" || def.reponse === "num") d = Math.min(d, 6);
    else d = 12;
    if (cible.groupe && e.groupe === cible.groupe) d -= 4;
    return d + h() * 8;
  };
  return autres
    .map((e) => ({ e, d: proches(e) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, nombre)
    .map((x) => x.e);
}

export function fabriquerCabinet(cab: CabinetId, cible: string, m: MethodeCabinet, graine: number): QuestionCabinet | null {
  const c = cabinet(cab);
  const e = element(cab, cible);
  if (!e || !METHODES[m].eligible(e)) return null;
  const h = hasard(graine);
  const def = METHODES[m];
  const base = { cabinet: cab, methode: m, cible };
  const ville = def.invite === "ville" ? choisir(e.villes ?? [], h) : undefined;
  if (def.reponse === "ecrit") return { ...base, options: [], nb: 0, ...(ville ? { ville } : {}) };
  if (def.reponse === "groupe") {
    const groupes = Object.keys(c.groupes ?? {}).filter((g) => g !== e.groupe);
    if (!e.groupe || groupes.length < 3) return null;
    const options = melanger([e.groupe, ...melanger(groupes, h).slice(0, 3)], h);
    return { ...base, options, nb: options.length };
  }
  const faux = voisins(c, e, m, h, 3);
  if (faux.length < 3) return null;
  const options = melanger([e, ...faux], h).map((x) => x.id);
  return { ...base, options, nb: options.length, ...(ville ? { ville } : {}) };
}

/** Les questions d'un niveau : chaque élément au moins une fois, puis d'autres méthodes, puis quelques révisions. */
export function partieCabinet(o: { cabinet: CabinetId; niveau: number; graine: number; methode?: MethodeCabinet | null; revision?: string[] }): QuestionCabinet[] {
  const c = cabinet(o.cabinet);
  const niveau = niveauxCabinet(c)[o.niveau - 1] ?? [];
  const h = hasard(o.graine);
  const ouvertes = methodesDuNiveau(c, o.niveau);
  const methodes = o.methode && methodesDe(c).includes(o.methode) ? [o.methode] : ouvertes;
  const voulu = Math.min(15, Math.max(8, Math.round(niveau.length * 1.5)));
  const sortie: QuestionCabinet[] = [];
  const vues = new Set<string>();
  let k = 0;
  const ajouter = (e: ElementCabinet, liste: MethodeCabinet[]) => {
    const possibles = melanger(
      liste.filter((m) => METHODES[m].eligible(e) && !vues.has(`${m}:${e.id}`)),
      h,
    );
    for (const m of possibles) {
      const q = fabriquerCabinet(o.cabinet, e.id, m, deriver(o.graine, k++));
      if (q) {
        vues.add(`${m}:${e.id}`);
        sortie.push(q);
        return true;
      }
    }
    return false;
  };
  const ordre = melanger(niveau, h);
  for (const e of ordre) ajouter(e, methodes);
  for (let tour = 0; tour < 3 && sortie.length < voulu; tour++) for (const e of melanger(ordre, h)) if (sortie.length < voulu) ajouter(e, methodes);
  // Les révisions des niveaux d'avant (au plus trois), mêlées aux autres.
  const revision = (o.revision ?? []).slice(0, 3).map((id) => element(o.cabinet, id)).filter((e): e is ElementCabinet => Boolean(e));
  for (const e of revision) ajouter(e, ouvertes);
  return melanger(sortie, h);
}

/** Une question au hasard, dans tout le cabinet (pour les tests). */
export function questionAuHasard(cab: CabinetId, graine: number): QuestionCabinet | null {
  const c = cabinet(cab);
  const h = hasard(graine);
  for (let i = 0; i < 10; i++) {
    const e = choisir(c.elements, h);
    const m = choisir(methodesDe(c), h);
    const q = fabriquerCabinet(cab, e.id, m, deriver(graine, i));
    if (q) return q;
  }
  return null;
}

/* ---------- Juger ---------- */

const formes = new Map<string, Map<string, string[]>>();
function formesDe(cab: CabinetId, quoi: "nom" | "chef"): Map<string, string[]> {
  const cle = `${cab}:${quoi}`;
  const deja = formes.get(cle);
  if (deja) return deja;
  const m = new Map<string, string[]>();
  for (const e of cabinet(cab).elements) {
    const liste = quoi === "nom" ? [e.nom, ...(e.noms ?? [])] : e.chef ? [e.chef, ...(e.chefs ?? [])] : [];
    if (liste.length) m.set(e.id, [...new Set(liste.map(normaliser))]);
  }
  formes.set(cle, m);
  return m;
}

/** Un numéro écrit : sans espace ni zéro devant, en minuscules (« 2A » = « 2a », « 1 » = « 01 »). */
const numero = (s: string) => s.replace(/\s/g, "").toLowerCase().replace(/^0+(?=.)/, "");

export function jugerCabinet(cab: CabinetId, m: MethodeCabinet, cible: string, reponse: string): Jugement {
  const e = element(cab, cible);
  const def = METHODES[m];
  if (!e || !def) return "faux";
  if (def.reponse === "groupe") return reponse === e.groupe ? "juste" : "faux";
  if (def.reponse !== "ecrit") return reponse === cible ? "juste" : "faux";
  if (def.ecrit === "num") return e.num && numero(reponse) === numero(e.num) ? "juste" : "faux";
  return comparer(reponse, cible, formesDe(cab, def.ecrit === "chef" ? "chef" : "nom"));
}

/** Toutes les formes acceptées d'un nom (pour « Nomme-les tous »). */
export const formesNom = (cab: CabinetId, id: string): string[] => formesDe(cab, "nom").get(id) ?? [];

/* ---------- Les textes ---------- */

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ce qu'affiche un choix. */
export function texteOption(q: QuestionCabinet, id: string): string {
  const c = cabinet(q.cabinet);
  const def = METHODES[q.methode];
  if (def.reponse === "groupe") return c.groupes?.[id] ?? id;
  const e = element(q.cabinet, id);
  if (!e) return id;
  return def.reponse === "chef" ? (e.chef ?? e.nom) : def.reponse === "num" ? (e.num ?? e.nom) : e.nom;
}

/** La bonne réponse, en toutes lettres. */
export function bonneReponseCabinet(q: QuestionCabinet): string {
  const c = cabinet(q.cabinet);
  const e = element(q.cabinet, q.cible)!;
  const def = METHODES[q.methode];
  if (def.reponse === "groupe") return `${c.groupes?.[e.groupe ?? ""] ?? ""} (${e.nom})`;
  if (def.reponse === "chef" || def.ecrit === "chef") return `${e.chef} (${e.nom})`;
  if (def.reponse === "num" || def.ecrit === "num") return `${e.num} (${e.nom})`;
  return e.num ? `${e.nom} (${e.num})` : e.nom;
}

/** Une fiche d'une ligne : « Mayenne (53). Préfecture : Laval. Région : Pays de la Loire. » */
export function resumeElement(cab: CabinetId, id: string): string {
  const c = cabinet(cab);
  const e = element(cab, id);
  if (!e) return "";
  const parts = [`${e.nom}${e.num ? ` (${e.num})` : ""}`];
  if (e.chef && c.mots.chef) parts.push(`${majuscule(c.mots.chef)} : ${e.chef}`);
  if (e.groupe && c.groupes) parts.push(`${majuscule(c.mots.groupe ?? "région")} : ${c.groupes[e.groupe]}`);
  return `${parts.join(". ")}.`;
}

/** Ce qu'on sait d'un élément, sans son nom : « Préfecture : Laval. Région : Pays de la Loire. » */
export function detailElement(cab: CabinetId, id: string): string {
  const c = cabinet(cab);
  const e = element(cab, id);
  if (!e) return "";
  const parts: string[] = [];
  if (e.num) parts.push(`${majuscule(c.mots.num ?? "numéro")} ${e.num}`);
  if (e.chef && c.mots.chef) parts.push(`${majuscule(c.mots.chef)} : ${e.chef}`);
  if (e.groupe && c.groupes) parts.push(`${majuscule(c.mots.groupe ?? "région")} : ${c.groupes[e.groupe]}`);
  return parts.length ? `${parts.join(". ")}.` : (e.note ?? "");
}

/** Ce que la voix lit pour une question. */
export function texteParleCabinet(q: QuestionCabinet): string {
  const c = cabinet(q.cabinet);
  const e = element(q.cabinet, q.cible)!;
  const def = METHODES[q.methode];
  const montre = def.invite === "nom" ? e.nom : def.invite === "chef" ? (e.chef ?? "") : def.invite === "num" ? `numéro ${e.num}` : def.invite === "ville" ? (q.ville ?? "") : "";
  const choix = def.reponse === "ecrit" || def.reponse === "drapeau" ? "" : ` Choix : ${q.options.map((id) => texteOption(q, id)).join(", ")}.`;
  return `${c.consignes[q.methode] ?? ""} ${montre}.${choix}`;
}

/* ---------- La vérification d'une réponse envoyée (serveur) ---------- */

export function reponseCabinetValide(cab: unknown, m: unknown, cible: unknown): boolean {
  if (!estCabinet(cab) || typeof m !== "string" || typeof cible !== "string") return false;
  return methodesDe(cabinet(cab)).includes(m as MethodeCabinet) && Boolean(element(cab, cible));
}
