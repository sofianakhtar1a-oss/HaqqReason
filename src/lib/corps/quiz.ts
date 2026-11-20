/*
 * L'Écorché — le moteur des questions.
 *
 *   • Une question se fabrique à partir d'une graine : la même graine donne la même question, avec
 *     les mêmes faux choix dans le même ordre (le défi du jour et les défis entre amis en dépendent).
 *   • Les faux choix se resserrent avec la difficulté : d'abord des structures de la même couche,
 *     puis de la même grande région, enfin de la même région (les voisins, ceux qu'on confond).
 *   • Les méthodes s'ajoutent au fil des niveaux : reconnaître et situer sur le corps, puis écrire,
 *     le latin, les fonctions, les attaches, l'innervation, la provenance des artères, l'intrus…
 */

import { ELEMENTS, PAR_ID } from "./catalogue";
import { type CategorieId, CATEGORIES, ELEMENTS_APPRIS, EN_PLANCHE, niveauxDe, vusJusqua } from "./niveaux";
import { normaliser } from "./texte";
import { type Couche, type Element, REGIONS, type RegionId, type SorteOs } from "./types";
import { hasard } from "./vec";

export type TypeQ =
  | "nommer"
  | "situer"
  | "ecrire"
  | "memo"
  | "region"
  | "latin"
  | "vers-latin"
  | "anglais"
  | "action"
  | "innervation"
  | "terminaison"
  | "origine"
  | "articulation"
  | "sorte"
  | "provenance"
  | "territoire"
  | "tendon-muscle"
  | "intrus"
  | "vrai-faux";

export type Option = { id: string; texte: string; latin?: boolean };
export type Question = {
  type: TypeQ;
  /** La structure visée (pour l'intrus : l'intrus). */
  cible: string;
  consigne: string;
  /** L'indice montré (un nom latin, une action, un nerf, un mémo…). */
  indice?: string;
  options: Option[];
  attendu: string;
  reponse: "qcm" | "clic" | "ecrit";
  /** Montrer la cible en lumière sur le corps. */
  montrer: boolean;
  /** Pour l'intrus : les structures à montrer ensemble. */
  groupe?: string[];
};

export type Methode = { id: TypeQ; nom: string; texte: string };
export const METHODES: Record<TypeQ, Methode> = {
  nommer: { id: "nommer", nom: "Reconnaître", texte: "Une structure s'allume : quel est son nom ?" },
  situer: { id: "situer", nom: "Situer", texte: "Un nom : touche la structure sur le corps." },
  ecrire: { id: "ecrire", nom: "Écrire", texte: "Une structure s'allume : écris son nom." },
  memo: { id: "memo", nom: "Qui suis-je ?", texte: "Une devinette, quatre réponses." },
  region: { id: "region", nom: "Où est-ce ?", texte: "Dans quelle région du corps ?" },
  latin: { id: "latin", nom: "Du latin", texte: "Le nom latin : quel est le nom français ?" },
  "vers-latin": { id: "vers-latin", nom: "Vers le latin", texte: "Une structure s'allume : quel est son nom latin ?" },
  anglais: { id: "anglais", nom: "De l'anglais", texte: "Le nom anglais : quel est le nom français ?" },
  action: { id: "action", nom: "Action", texte: "Ce que fait le muscle : lequel est-ce ?" },
  innervation: { id: "innervation", nom: "Innervation", texte: "Le nerf qui le commande : quel muscle ?" },
  terminaison: { id: "terminaison", nom: "Terminaison", texte: "Où il s'insère : quel muscle ?" },
  origine: { id: "origine", nom: "Origine", texte: "D'où il part : quel muscle ?" },
  articulation: { id: "articulation", nom: "Articulations", texte: "Avec quel os s'articule-t-il ?" },
  sorte: { id: "sorte", nom: "Forme de l'os", texte: "Long, court, plat, irrégulier ou sésamoïde ?" },
  provenance: { id: "provenance", nom: "Provenance", texte: "De quelle artère naît-elle ?" },
  territoire: { id: "territoire", nom: "Territoire", texte: "Ce qu'elle irrigue : quelle artère ?" },
  "tendon-muscle": { id: "tendon-muscle", nom: "Tendon et muscle", texte: "Quel muscle prolonge ce tendon ?" },
  intrus: { id: "intrus", nom: "L'intrus", texte: "Trois vont ensemble, un seul n'est pas à sa place." },
  "vrai-faux": { id: "vrai-faux", nom: "Vrai ou faux", texte: "Une affirmation à juger." },
};

const NOMS_SORTES: Record<SorteOs, string> = { long: "Os long", court: "Os court", plat: "Os plat", irregulier: "Os irrégulier", sesamoide: "Os sésamoïde" };
export const nomSorte = (s: SorteOs) => NOMS_SORTES[s];
const GRANDE = new Map(REGIONS.map((r) => [r.id, r.grande]));
const NOM_REGION = new Map(REGIONS.map((r) => [r.id, r.nom]));
export const nomRegion = (r: RegionId) => NOM_REGION.get(r) ?? r;

/** Le, la, l' : pour écrire « le biceps », « l'aorte », « la clavicule ». */
export function article(e: Element): string {
  const n = e.nom;
  // Le catalogue le sait pour chaque structure ; la règle qui suit ne sert qu'aux fiches sans article.
  if (e.art) return `${e.art}${minuscule(n)}`;
  const premier = n.split(/[\s-]/)[0].toLowerCase();
  const singuliers = /^(biceps|triceps|radius|humérus|talus|pubis|atlas|axis|coccyx|calcanéus|os|longissimus)$/;
  const pluriel = (/[sx]$/.test(premier) && !singuliers.test(premier)) || /\b\p{L}+aux\b/u.test(n);
  if (pluriel) return `les ${minuscule(n)}`;
  if (/^[aeéèêiîoôuœh]/i.test(premier)) return `l'${minuscule(n)}`;
  const feminin = /^(artère|carotide|aorte|clavicule|scapula|ulna|fibula|patella|mandibule|ligne|aponévrose|arcade|vertèbre|côte|phalange|intersection)/i.test(n) || (e.couche === "artere" && !/^tronc/i.test(n));
  return `${feminin ? "la" : "le"} ${minuscule(n)}`;
}
const SIGLES = /^(C\d|T\d|L\d|SCM|TFL)/;
export const minuscule = (s: string) => (SIGLES.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Le hasard réglé ---------- */

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

export type Difficulte = "facile" | "normal" | "difficile";

/** Où puiser les voisins d'une structure : parmi celles qu'on apprend si elle en est, sinon dans tout l'atlas. */
const reservoir = (cible: Element): readonly Element[] => (EN_PLANCHE.has(cible.id) ? ELEMENTS_APPRIS : ELEMENTS);

/** Les faux choix : même couche ; avec la difficulté, des voisins de plus en plus proches. */
function fauxChoix(r: Rnd, cible: Element, n: number, d: Difficulte, filtre: (e: Element) => boolean = () => true, pool?: Element[]): Element[] {
  const base = (pool ?? reservoir(cible)).filter((e) => e.id !== cible.id && e.couche === cible.couche && filtre(e) && normaliser(e.nom) !== normaliser(cible.nom));
  const meme = base.filter((e) => e.region === cible.region);
  const grande = base.filter((e) => GRANDE.get(e.region) === GRANDE.get(cible.region));
  const proches = d === "difficile" ? [...meme, ...grande] : d === "normal" ? (r() < 0.6 ? grande : base) : base;
  const sortie: Element[] = [];
  for (const e of [...melanger(r, proches), ...melanger(r, base)]) {
    if (sortie.length >= n) break;
    if (!sortie.some((x) => x.id === e.id || normaliser(x.nom) === normaliser(e.nom))) sortie.push(e);
  }
  return sortie;
}

const optionsDe = (r: Rnd, bonne: Element, faux: Element[], champ: (e: Element) => string = (e) => e.nom): Option[] => melanger(r, [bonne, ...faux]).map((e) => ({ id: e.id, texte: champ(e) }));

/* ---------- Qui peut être interrogé sur quoi ---------- */

export function typesPossibles(e: Element): TypeQ[] {
  const t: TypeQ[] = ["nommer", "ecrire", "region"];
  // Toucher sur le corps : ce qui se voit de l'extérieur (un noyau du cerveau, un organe profond ne s'atteignent pas ainsi).
  if (e.couche !== "viscere" && e.couche !== "encephale") t.push("situer");
  if (e.memo && !normaliser(e.memo).includes(normaliser(e.nom))) t.push("memo");
  // Une fiche née d'une règle (« Tendon du … ») n'a pas de nom latin ni anglais à apprendre.
  if (!e.genere) {
    t.push("vers-latin");
    if (normaliser(e.latin) !== normaliser(e.nom)) t.push("latin");
    if (normaliser(e.anglais) !== normaliser(e.nom)) t.push("anglais");
  }
  if (e.couche === "muscle") {
    if (e.action) t.push("action");
    if (e.innervation) t.push("innervation", "vrai-faux");
    if (e.terminaison) t.push("terminaison");
    if (e.origine) t.push("origine");
  }
  if (e.couche === "os") {
    if (e.sorte) t.push("sorte");
    if ((e.articulations ?? []).length) t.push("articulation", "vrai-faux");
  }
  if (e.couche === "artere") {
    if (e.territoire) t.push("territoire");
    if (e.provenance && PAR_ID.has(e.provenance)) t.push("provenance", "vrai-faux");
  }
  if (e.couche === "tendon" && e.muscle && PAR_ID.has(e.muscle)) t.push("tendon-muscle");
  t.push("intrus");
  return t;
}

/** Les méthodes d'un niveau : de plus en plus variées. */
export function typesDuNiveau(categorie: CategorieId, n: number): TypeQ[] {
  const base: TypeQ[] = ["nommer", "situer"];
  if (categorie === "corps") return ["nommer", "situer", "ecrire", "memo", "latin", "action", "articulation", "provenance", "tendon-muscle", "intrus", "vrai-faux", "terminaison", "innervation"];
  if (n >= 2) base.push("memo", "region");
  if (n >= 3) base.push("ecrire");
  if (n >= 4) base.push("latin", "sorte", "action", "territoire", "tendon-muscle");
  if (n >= 5) base.push("vers-latin", "intrus", "articulation", "terminaison", "provenance");
  if (n >= 6) base.push("anglais", "vrai-faux", "innervation", "origine");
  return base;
}

/* ---------- Fabriquer une question ---------- */

/** « Quel est… ? » et « un… » pour chaque couche. */
export const QUEL: Record<Couche, string> = {
  os: "Quel est cet os ?",
  muscle: "Quel est ce muscle ?",
  tendon: "Quelle est cette structure tendineuse ?",
  ligament: "Quelle est cette structure de l'articulation ?",
  artere: "Quelle est cette artère ?",
  veine: "Quelle est cette veine ?",
  nerf: "Quel est ce nerf ?",
  viscere: "Quel est cet organe ?",
  encephale: "Quelle est cette partie de l'encéphale ?",
  lymphe: "Quels sont ces nœuds lymphatiques ?",
};
const QUOI: Record<Couche, string> = {
  os: "un os",
  muscle: "un muscle",
  tendon: "une structure tendineuse",
  ligament: "une structure articulaire",
  artere: "une artère",
  veine: "une veine",
  nerf: "un nerf",
  viscere: "un organe",
  encephale: "une partie de l'encéphale",
  lymphe: "un groupe de nœuds lymphatiques",
};

export type Contexte = { difficulte: Difficulte; /** Les structures parmi lesquelles prendre les faux choix (sinon : toutes). */ pool?: Element[] };

export function fabriquer(graine: number, id: string, type: TypeQ, ctx: Contexte): Question | null {
  const e = PAR_ID.get(id);
  if (!e) return null;
  const r = hasard(graine * 7919 + 17);
  const d = ctx.difficulte;
  const le = article(e);
  switch (type) {
    case "nommer": {
      const f = fauxChoix(r, e, 3, d, undefined, ctx.pool);
      return { type, cible: id, consigne: QUEL[e.couche], options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: true };
    }
    case "situer":
      return { type, cible: id, consigne: `Touche ${le} sur le corps.`, options: [], attendu: id, reponse: "clic", montrer: false };
    case "ecrire":
      return { type, cible: id, consigne: "Écris le nom de la structure en lumière.", options: [], attendu: id, reponse: "ecrit", montrer: true };
    case "memo": {
      if (!e.memo) return null;
      const f = fauxChoix(r, e, 3, d, undefined, ctx.pool);
      return { type, cible: id, consigne: "Qui suis-je ?", indice: e.memo, options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: false };
    }
    case "region": {
      const autres = melanger(
        r,
        REGIONS.filter((x) => x.id !== e.region && (d === "facile" || x.grande === GRANDE.get(e.region) || r() < 0.4)),
      ).slice(0, 3);
      const options = melanger(r, [{ id: e.region, texte: nomRegion(e.region) }, ...autres.map((x) => ({ id: x.id, texte: x.nom }))]);
      return { type, cible: id, consigne: `Où se trouve ${le} ?`, options, attendu: e.region, reponse: "qcm", montrer: false };
    }
    case "latin": {
      const f = fauxChoix(r, e, 3, d, undefined, ctx.pool);
      return { type, cible: id, consigne: "Quel est son nom en français ?", indice: e.latin, options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: false };
    }
    case "vers-latin": {
      const f = fauxChoix(r, e, 3, d, (x) => normaliser(x.latin) !== normaliser(e.latin), ctx.pool);
      return { type, cible: id, consigne: "Quel est son nom latin ?", options: optionsDe(r, e, f, (x) => x.latin).map((o) => ({ ...o, latin: true })), attendu: id, reponse: "qcm", montrer: true };
    }
    case "anglais": {
      const f = fauxChoix(r, e, 3, d, undefined, ctx.pool);
      return { type, cible: id, consigne: "On l'appelle ainsi en anglais. Et en français ?", indice: e.anglais, options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: false };
    }
    case "action":
    case "innervation":
    case "terminaison":
    case "origine": {
      const champ = e[type];
      if (!champ) return null;
      const f = fauxChoix(r, e, 3, d, (x) => Boolean(x[type]) && x[type] !== champ, ctx.pool);
      const consignes = { action: "Quel muscle fait cela ?", innervation: "Quel muscle ce nerf commande-t-il ?", terminaison: "Quel muscle se termine ici ?", origine: "Quel muscle naît ici ?" };
      return { type, cible: id, consigne: consignes[type], indice: champ, options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: false };
    }
    case "sorte": {
      if (!e.sorte) return null;
      const autres = melanger(r, (Object.keys(NOMS_SORTES) as SorteOs[]).filter((s) => s !== e.sorte)).slice(0, 3);
      return { type, cible: id, consigne: `Quelle sorte d'os est ${le} ?`, options: melanger(r, [e.sorte, ...autres]).map((s) => ({ id: s, texte: NOMS_SORTES[s] })), attendu: e.sorte, reponse: "qcm", montrer: true };
    }
    case "articulation": {
      const arts = (e.articulations ?? []).filter((a) => PAR_ID.has(a));
      if (!arts.length) return null;
      const bonne = PAR_ID.get(choisir(r, arts))!;
      const f = fauxChoix(r, e, 3, d, (x) => !arts.includes(x.id) && x.id !== bonne.id);
      return { type, cible: id, consigne: `Avec quel os s'articule ${le} ?`, options: optionsDe(r, bonne, f), attendu: bonne.id, reponse: "qcm", montrer: true };
    }
    case "provenance": {
      const mere = e.provenance ? PAR_ID.get(e.provenance) : undefined;
      if (!mere) return null;
      const f = fauxChoix(r, mere, 3, d, (x) => x.id !== e.id);
      return { type, cible: id, consigne: `De quelle artère naît ${le} ?`, options: optionsDe(r, mere, f), attendu: mere.id, reponse: "qcm", montrer: true };
    }
    case "territoire": {
      if (!e.territoire) return null;
      const f = fauxChoix(r, e, 3, d, (x) => x.territoire !== e.territoire, ctx.pool);
      return { type, cible: id, consigne: "Quelle artère irrigue ce territoire ?", indice: e.territoire, options: optionsDe(r, e, f), attendu: id, reponse: "qcm", montrer: false };
    }
    case "tendon-muscle": {
      const m = e.muscle ? PAR_ID.get(e.muscle) : undefined;
      if (!m) return null;
      const f = fauxChoix(r, m, 3, d);
      return { type, cible: id, consigne: "Quel muscle se prolonge par cette structure ?", options: optionsDe(r, m, f), attendu: m.id, reponse: "qcm", montrer: true };
    }
    case "intrus": {
      // Trois structures de la même grande région, un intrus d'ailleurs (même couche).
      const g = GRANDE.get(e.region);
      const source = reservoir(e);
      const voisins = melanger(
        r,
        source.filter((x) => x.couche === e.couche && x.id !== e.id && GRANDE.get(x.region) === g),
      ).slice(0, 3);
      const intrus = melanger(
        r,
        source.filter((x) => x.couche === e.couche && GRANDE.get(x.region) !== g),
      )[0];
      if (voisins.length < 3 || !intrus) return null;
      const nomG: Record<string, string> = { "tete-cou": "de la tête et du cou", tronc: "du tronc", "membre-sup": "du membre supérieur", "membre-inf": "du membre inférieur" };
      return {
        type,
        cible: intrus.id,
        consigne: `Lequel n'est pas ${QUOI[e.couche]} ${nomG[g ?? "tronc"]} ?`,
        options: optionsDe(r, intrus, voisins),
        attendu: intrus.id,
        reponse: "qcm",
        montrer: false,
        groupe: voisins.map((v) => v.id),
      };
    }
    case "vrai-faux": {
      const vrai = r() < 0.5;
      let phrase = "";
      if (e.couche === "muscle") {
        const autre = fauxChoix(r, e, 1, d, (x) => Boolean(x.innervation) && Boolean(x.terminaison) && x.innervation !== e.innervation)[0];
        const sur = r() < 0.5 || !e.terminaison ? "innervation" : "terminaison";
        if (!e[sur]) return null;
        const valeur = vrai || !autre ? e[sur] : autre[sur];
        phrase = sur === "innervation" ? `${majuscule(le)} est innervé par : ${minuscule(valeur ?? "")}.` : `${majuscule(le)} se termine sur : ${minuscule(valeur ?? "")}.`;
        if (!vrai && (!autre || autre[sur] === e[sur])) return null;
      } else if (e.couche === "os") {
        const arts = (e.articulations ?? []).filter((a) => PAR_ID.has(a));
        const non = reservoir(e).filter((x) => x.couche === "os" && x.id !== e.id && !arts.includes(x.id) && GRANDE.get(x.region) === GRANDE.get(e.region));
        const autre = vrai ? PAR_ID.get(choisir(r, arts)) : choisir(r, non);
        if (!autre) return null;
        phrase = `${majuscule(le)} s'articule avec ${article(autre)}.`;
      } else if (e.couche === "artere") {
        const mere = e.provenance ? PAR_ID.get(e.provenance) : undefined;
        if (!mere) return null;
        const autre = vrai ? mere : fauxChoix(r, mere, 1, d, (x) => x.id !== e.id)[0];
        if (!autre) return null;
        phrase = `${majuscule(le)} naît de ${article(autre)}.`;
      } else return null;
      return { type, cible: id, consigne: "Vrai ou faux ?", indice: phrase, options: [{ id: "vrai", texte: "Vrai" }, { id: "faux", texte: "Faux" }], attendu: vrai ? "vrai" : "faux", reponse: "qcm", montrer: false };
    }
  }
}

/** Une question sur une structure, d'une méthode tirée parmi celles permises. */
export function questionSur(graine: number, id: string, permis: TypeQ[], ctx: Contexte, eviter?: TypeQ): Question | null {
  const e = PAR_ID.get(id);
  if (!e) return null;
  const r = hasard(graine * 104729 + 3);
  const permises = typesPossibles(e).filter((t) => permis.includes(t));
  // Éviter de reposer la même méthode deux fois de suite, sauf s'il n'y en a qu'une.
  const possibles = permises.filter((t) => t !== eviter).length ? permises.filter((t) => t !== eviter) : permises;
  for (const t of melanger(r, possibles)) {
    const q = fabriquer(graine, id, t, ctx);
    if (q) return q;
  }
  return fabriquer(graine, id, "nommer", ctx);
}

/* ---------- Une partie ---------- */

export function partieDeNiveau(o: { categorie: CategorieId; n: number; graine: number; nombre: number; revision?: string[]; difficulte: Difficulte; methode?: TypeQ | null }): Question[] {
  const niveaux = niveauxDe(o.categorie);
  const niv = niveaux[o.n - 1];
  if (!niv) return [];
  const r = hasard(o.graine);
  const permis = o.methode ? [o.methode] : typesDuNiveau(o.categorie, o.n);
  const ctx: Contexte = { difficulte: o.difficulte };
  const nouveaux = o.categorie === "corps" ? melanger(r, niv.nouveaux).slice(0, o.nombre) : melanger(r, niv.nouveaux);
  const anciens = o.categorie === "corps" ? [] : vusJusqua(o.categorie, o.n - 1);
  const revus = melanger(r, [...new Set([...(o.revision ?? []).filter((x) => anciens.includes(x)), ...melanger(r, anciens)])]);
  // D'abord chaque nouveauté, reconnue puis située ; ensuite des méthodes variées, et des révisions.
  const cibles: string[] = [];
  for (const id of nouveaux) if (cibles.length < o.nombre) cibles.push(id);
  let k = 0;
  while (cibles.length < o.nombre) {
    const source = revus.length && (k % 3 === 2 || !nouveaux.length) ? revus : nouveaux;
    cibles.push(source[k % source.length]);
    k++;
    if (k > 400) break;
  }
  const questions: Question[] = [];
  const vu = new Map<string, TypeQ[]>();
  cibles.forEach((id, i) => {
    const deja = vu.get(id) ?? [];
    const premier = !deja.length && niv.nouveaux.includes(id) && !o.methode;
    const q = premier ? fabriquer(o.graine + i, id, o.categorie === "corps" || o.n > 2 ? choisir(r, ["nommer", "situer"]) : "nommer", ctx) : questionSur(o.graine + i, id, permis, ctx, deja[deja.length - 1]);
    if (q) {
      questions.push(q);
      vu.set(id, [...deja, q.type]);
    }
  });
  // Mélangées, sans jamais deux fois de suite la même structure.
  const tri = melanger(r, questions);
  for (let i = 1; i < tri.length; i++)
    if (tri[i].cible === tri[i - 1].cible) {
      const j = tri.findIndex((q, k) => k > i && q.cible !== tri[i - 1].cible);
      if (j > 0) [tri[i], tri[j]] = [tri[j], tri[i]];
    }
  return tri;
}

/** Une question tirée dans un ensemble de structures (éclair, survie, défis) : à choix seulement si demandé. */
export function questionMelangee(graine: number, ids: string[], qcmSeulement: boolean, difficulte: Difficulte): Question | null {
  const r = hasard(graine);
  const permis: TypeQ[] = qcmSeulement ? ["nommer", "memo", "latin", "action", "territoire", "tendon-muscle", "sorte", "articulation", "provenance", "region"] : ["nommer", "situer", "ecrire", "memo", "latin", "action", "provenance", "tendon-muscle", "articulation"];
  for (let essai = 0; essai < 6; essai++) {
    const q = questionSur(graine + essai, choisir(r, ids), permis, { difficulte });
    if (q) return q;
  }
  return null;
}

/** Le défi du jour : dix questions, les mêmes pour tout le monde ce jour-là. */
export function defiDuJour(jour: string, nombre = 10): Question[] {
  const graine = [...jour].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pool = ELEMENTS_APPRIS.filter((e) => e.rang <= 2).map((e) => e.id);
  const sortie: Question[] = [];
  for (let i = 0; sortie.length < nombre && i < nombre * 4; i++) {
    const q = questionMelangee(graine + i * 101, pool, false, "normal");
    if (q && !sortie.some((x) => x.cible === q.cible)) sortie.push(q);
  }
  return sortie;
}

/** Les structures qu'on apprend dans une catégorie (pour l'éclair, la survie, les jeux). */
export function structuresDe(categorie: CategorieId): string[] {
  return ELEMENTS_APPRIS.filter((e) => CATEGORIES[categorie].couches.includes(e.couche)).map((e) => e.id);
}
