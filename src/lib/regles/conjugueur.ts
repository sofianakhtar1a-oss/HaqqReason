/*
 * Le moteur de la Machine à voyager dans le temps, version anglaise.
 * Les verbes irréguliers viennent d'une liste (verbes-a), les réguliers se calculent avec les règles
 * d'orthographe (-s, -ed, -ing, consonne doublée). Chaque forme est découpée en morceaux colorés :
 * le sujet, l'auxiliaire (le moteur : do, be, have, will, would), la base du verbe, sa terminaison,
 * la forme irrégulière, le mot-lien (not, to, going to).
 */

export type Role = "pronom" | "auxiliaire" | "radical" | "terminaison" | "irregulier" | "lien" | "signe";
export type Morceau = { texte: string; role: Role };
export type Forme = Morceau[] | null;

export type TempsId =
  | "presentSimple"
  | "presentContinuous"
  | "presentPerfect"
  | "presentPerfectContinuous"
  | "pastSimple"
  | "pastContinuous"
  | "pastPerfect"
  | "pastPerfectContinuous"
  | "futureSimple"
  | "futureContinuous"
  | "futurePerfect"
  | "futurePerfectContinuous"
  | "conditional"
  | "conditionalContinuous"
  | "conditionalPerfect"
  | "conditionalPerfectContinuous"
  | "passivePresent"
  | "passivePresentContinuous"
  | "passivePast"
  | "passivePastContinuous"
  | "passivePresentPerfect"
  | "passivePastPerfect"
  | "passiveFuture"
  | "passiveGoingTo"
  | "passiveConditional"
  | "passiveConditionalPerfect"
  | "goingTo"
  | "usedTo"
  | "imperative";

export type Monde = "reel" | "reve" | "passif" | "tournures";
export type Epoque = "passe" | "present" | "futur";
export type Aspect = "simple" | "continu" | "parfait" | "parfaitContinu";
export type ModePhrase = "affirmative" | "negative" | "question";

export type Temps = {
  id: TempsId;
  monde: Monde;
  /** Le nom anglais, celui des manuels. */
  nom: string;
  /** Ce que le temps raconte, en mots simples. */
  image: string;
  niveau: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  epoque?: Epoque;
  aspect?: Aspect;
};

export const TEMPS: Temps[] = [
  { id: "pastSimple", monde: "reel", nom: "Past simple", image: "Une action terminée, à un moment précis du passé (yesterday, last week, in 2010).", niveau: "A2", epoque: "passe", aspect: "simple" },
  { id: "pastContinuous", monde: "reel", nom: "Past continuous", image: "« J'étais en train de… » : le décor d'une histoire passée.", niveau: "A2", epoque: "passe", aspect: "continu" },
  { id: "pastPerfect", monde: "reel", nom: "Past perfect", image: "Le passé du passé : c'était déjà fait avant un autre moment passé.", niveau: "B1", epoque: "passe", aspect: "parfait" },
  { id: "pastPerfectContinuous", monde: "reel", nom: "Past perfect continuous", image: "Ça durait déjà depuis un moment, avant un autre moment passé.", niveau: "B2", epoque: "passe", aspect: "parfaitContinu" },
  { id: "presentSimple", monde: "reel", nom: "Present simple", image: "Les habitudes et les vérités : ce qui est vrai en général.", niveau: "A1", epoque: "present", aspect: "simple" },
  { id: "presentContinuous", monde: "reel", nom: "Present continuous", image: "« Je suis en train de… » : ce qui se passe en ce moment même.", niveau: "A1", epoque: "present", aspect: "continu" },
  { id: "presentPerfect", monde: "reel", nom: "Present perfect", image: "Le pont entre passé et présent : une expérience de vie, un résultat visible maintenant.", niveau: "B1", epoque: "present", aspect: "parfait" },
  { id: "presentPerfectContinuous", monde: "reel", nom: "Present perfect continuous", image: "Ça a commencé avant et ça dure encore : le « depuis » français.", niveau: "B1", epoque: "present", aspect: "parfaitContinu" },
  { id: "futureSimple", monde: "reel", nom: "Future (will)", image: "Une décision prise sur le moment, une prédiction, une promesse.", niveau: "A2", epoque: "futur", aspect: "simple" },
  { id: "futureContinuous", monde: "reel", nom: "Future continuous", image: "« Je serai en train de… » à un moment précis du futur.", niveau: "B2", epoque: "futur", aspect: "continu" },
  { id: "futurePerfect", monde: "reel", nom: "Future perfect", image: "Dans le futur, ce sera déjà fini (by tomorrow, by 2030).", niveau: "B2", epoque: "futur", aspect: "parfait" },
  { id: "futurePerfectContinuous", monde: "reel", nom: "Future perfect continuous", image: "À un moment futur, ça durera déjà depuis un certain temps.", niveau: "C1", epoque: "futur", aspect: "parfaitContinu" },

  { id: "conditional", monde: "reve", nom: "Conditional (would)", image: "La bulle de rêve : ce qui arriverait si…, et la politesse (I would like).", niveau: "B1" },
  { id: "conditionalContinuous", monde: "reve", nom: "Conditional continuous", image: "Ce qu'on serait en train de faire, dans un monde imaginaire.", niveau: "B2" },
  { id: "conditionalPerfect", monde: "reve", nom: "Conditional perfect", image: "Le regret : ce qui serait arrivé si… (mais ce n'est pas arrivé).", niveau: "B2" },
  { id: "conditionalPerfectContinuous", monde: "reve", nom: "Conditional perfect continuous", image: "Ce qu'on aurait été en train de faire, si les choses avaient été différentes.", niveau: "C1" },

  { id: "passivePresent", monde: "passif", nom: "Present simple passive", image: "L'action tombe sur le sujet, en général : English is spoken here.", niveau: "B1" },
  { id: "passivePresentContinuous", monde: "passif", nom: "Present continuous passive", image: "L'action tombe sur le sujet en ce moment : the road is being repaired.", niveau: "B2" },
  { id: "passivePast", monde: "passif", nom: "Past simple passive", image: "L'action est tombée sur le sujet dans le passé : it was built in 1889.", niveau: "B1" },
  { id: "passivePastContinuous", monde: "passif", nom: "Past continuous passive", image: "Le sujet était en train de subir l'action : the car was being washed.", niveau: "B2" },
  { id: "passivePresentPerfect", monde: "passif", nom: "Present perfect passive", image: "Le résultat est là maintenant : my bike has been stolen!", niveau: "B1" },
  { id: "passivePastPerfect", monde: "passif", nom: "Past perfect passive", image: "C'était déjà subi avant un autre moment passé.", niveau: "B2" },
  { id: "passiveFuture", monde: "passif", nom: "Future passive (will)", image: "Le sujet subira l'action : the results will be announced tomorrow.", niveau: "B1" },
  { id: "passiveGoingTo", monde: "passif", nom: "Going to passive", image: "C'est prévu, le sujet va subir l'action.", niveau: "B2" },
  { id: "passiveConditional", monde: "passif", nom: "Conditional passive", image: "Le sujet subirait l'action, si…", niveau: "B2" },
  { id: "passiveConditionalPerfect", monde: "passif", nom: "Conditional perfect passive", image: "Le sujet aurait subi l'action, si…", niveau: "C1" },

  { id: "imperative", monde: "tournures", nom: "Imperative", image: "La télécommande : un ordre, un conseil, une invitation.", niveau: "A1" },
  { id: "goingTo", monde: "tournures", nom: "Be going to", image: "Le projet déjà décidé, ou ce qu'on voit arriver (look at those clouds!).", niveau: "A2" },
  { id: "usedTo", monde: "tournures", nom: "Used to", image: "Les habitudes d'autrefois, qui n'existent plus aujourd'hui.", niveau: "A2" },
];

export const MONDES: { id: Monde; nom: string; image: string }[] = [
  { id: "reel", nom: "Le monde réel", image: "Les 12 temps : 3 époques × 4 façons de voir l'action" },
  { id: "reve", nom: "Le monde des rêves", image: "Ce qui arriverait si… (would)" },
  { id: "passif", nom: "Le monde à l'envers", image: "Le sujet subit l'action (le passif)" },
  { id: "tournures", nom: "Les tournures", image: "L'ordre, le projet, l'habitude d'avant" },
];

export const EPOQUES: { id: Epoque; nom: string; anglais: string }[] = [
  { id: "passe", nom: "Le passé", anglais: "past" },
  { id: "present", nom: "Le présent", anglais: "present" },
  { id: "futur", nom: "Le futur", anglais: "future" },
];

export const ASPECTS: { id: Aspect; nom: string; recette: string }[] = [
  { id: "simple", nom: "Simple", recette: "le verbe tout seul" },
  { id: "continu", nom: "Continuous", recette: "be + -ing" },
  { id: "parfait", nom: "Perfect", recette: "have + participe" },
  { id: "parfaitContinu", nom: "Perfect continuous", recette: "have been + -ing" },
];

/* ---------- La base ---------- */

export type InfoVerbe = { base: string; passe: string[]; participe: string[]; irregulier: boolean };
export type Verbes = Map<string, InfoVerbe>;

let cache: Verbes | null = null;
let promesse: Promise<Verbes> | null = null;

/** Charge la base (deux morceaux, séparés du reste du site). */
export function chargerVerbes(): Promise<Verbes> {
  if (cache) return Promise.resolve(cache);
  promesse ??= Promise.all([import("./verbes-a"), import("./verbes-b")]).then(([a, b]) => {
    const m: Verbes = new Map();
    for (const ligne of a.IRREGULIERS.split("\n")) {
      const [base, passe, participe] = ligne.trim().split(" ");
      if (base) m.set(base, { base, passe: passe.split("/"), participe: participe.split("/"), irregulier: true });
    }
    for (const base of b.REGULIERS.split(/\s+/)) {
      if (!base || m.has(base)) continue;
      const ed = formeEd(base).join("");
      m.set(base, { base, passe: [ed], participe: [ed], irregulier: false });
    }
    cache = m;
    return m;
  });
  return promesse;
}

/* ---------- L'orthographe ---------- */

/** Les verbes de plusieurs syllabes qui doublent leur consonne finale (accent sur la fin, ou -l britannique). */
const DOUBLENT = new Set([
  "admit", "commit", "control", "occur", "permit", "prefer", "refer", "regret", "transfer", "travel", "cancel", "label", "quarrel",
  "equip", "compel", "expel", "patrol", "forget", "begin", "upset", "forbid", "quit", "beget", "outrun", "overrun", "underlet",
]);

export function doubleSaConsonne(b: string) {
  if (DOUBLENT.has(b)) return true;
  const syllabes = b.match(/[aeiou]+/g)?.length ?? 0;
  return syllabes === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(b);
}

/** La 3e personne : [base, terminaison] (study → stud + ies). */
export function formeS(b: string): [string, string] {
  if (/[^aeiou]y$/.test(b)) return [b.slice(0, -1), "ies"];
  if (/(s|x|z|ch|sh)$/.test(b) || /[^aeiou]o$/.test(b)) return [b, "es"];
  return [b, "s"];
}

/** Le -ed régulier : [base, terminaison] (stop → stop + ped). */
export function formeEd(b: string): [string, string] {
  if (/e$/.test(b)) return [b, "d"];
  if (/[^aeiou]y$/.test(b)) return [b.slice(0, -1), "ied"];
  if (/c$/.test(b)) return [b, "ked"];
  if (doubleSaConsonne(b)) return [b, b.slice(-1) + "ed"];
  return [b, "ed"];
}

/** La forme en -ing : [base, terminaison] (make → mak + ing, die → d + ying). */
export function formeIng(b: string): [string, string] {
  if (b === "be") return ["be", "ing"];
  if (/ie$/.test(b)) return [b.slice(0, -2), "ying"];
  if (/[^eoy]e$/.test(b)) return [b.slice(0, -1), "ing"];
  if (/c$/.test(b)) return [b, "king"];
  if (doubleSaConsonne(b)) return [b, b.slice(-1) + "ing"];
  return [b, "ing"];
}

/* ---------- Les catégories utiles ---------- */

/** Verbes sans complément d'objet : pas de passif. */
export const INTRANSITIFS = new Set([
  "be", "have", "arrive", "come", "go", "die", "happen", "exist", "fall", "sleep", "lie", "rise", "sit", "smile", "laugh", "cry", "yawn",
  "appear", "disappear", "vanish", "belong", "seem", "become", "occur", "remain", "stay", "depend", "consist", "rely", "succeed", "suffer",
  "agree", "disagree", "apologise", "complain", "retire", "wait", "jog", "nod", "pray", "queue", "rain", "snow", "kneel", "flow", "float",
  "glow", "gaze", "sail", "march", "behave", "exist", "cough", "matter", "flee", "creep", "arise", "awake", "oversleep", "lean", "cling",
]);

/** Verbes d'état : ils refusent presque toujours la forme en -ing. */
export const ETATS = new Set([
  "know", "like", "love", "hate", "want", "need", "prefer", "believe", "understand", "remember", "forget", "belong", "own", "possess",
  "seem", "mean", "recognise", "suppose", "contain", "consist", "deserve", "matter", "owe", "realise", "doubt", "dislike", "wish",
]);

/* ---------- Les morceaux ---------- */

type Mot = { m: Morceau[]; aux?: string };

const PRESENT_BE = ["am", "are", "is", "are", "are", "are"];
const PASSE_BE = ["was", "were", "was", "were", "were", "were"];

const mot = (texte: string, role: Role, aux?: string): Mot => ({ m: [{ texte, role }], aux });
const coupe = ([r, t]: [string, string]): Mot => ({ m: [{ texte: r, role: "radical" }, ...(t ? [{ texte: t, role: "terminaison" as Role }] : [])] });

const beAux = (p: number, passe = false) => {
  const f = (passe ? PASSE_BE : PRESENT_BE)[p];
  return mot(f, "auxiliaire", f);
};
const haveAux = (p: number, passe = false) => {
  const f = passe ? "had" : p === 2 ? "has" : "have";
  return mot(f, "auxiliaire", f);
};
const doAux = (p: number, passe = false) => {
  const f = passe ? "did" : p === 2 ? "does" : "do";
  return mot(f, "auxiliaire", f);
};
const lien = (t: string) => mot(t, "lien");

const baseDe = (v: InfoVerbe): Mot => mot(v.base, "radical");
const ingDe = (v: InfoVerbe): Mot => coupe(formeIng(v.base));
const participeDe = (v: InfoVerbe): Mot => (v.irregulier ? mot(v.participe[0], "irregulier") : coupe(formeEd(v.base)));
const passeDe = (v: InfoVerbe, p: number): Mot => {
  if (v.base === "be") return mot(PASSE_BE[p], "irregulier", PASSE_BE[p]);
  return v.irregulier ? mot(v.passe[0], "irregulier") : coupe(formeEd(v.base));
};
const presentDe = (v: InfoVerbe, p: number): Mot => {
  if (v.base === "be") return mot(PRESENT_BE[p], "irregulier", PRESENT_BE[p]);
  if (p !== 2) return baseDe(v);
  if (v.base === "have") return mot("has", "irregulier");
  return coupe(formeS(v.base));
};

type Chaine = { mots: Mot[]; avecDo?: { passe: boolean; suite: Mot[] } };

function chaine(temps: TempsId, v: InfoVerbe, p: number): Chaine | null {
  const estBe = v.base === "be";
  const pp = participeDe(v);
  const ing = ingDe(v);
  const be = mot("be", "auxiliaire");
  const been = mot("been", "auxiliaire");
  const being = mot("being", "auxiliaire");
  const have = mot("have", "auxiliaire");
  const will = mot("will", "auxiliaire", "will");
  const would = mot("would", "auxiliaire", "would");
  if (temps.startsWith("passive") && INTRANSITIFS.has(v.base)) return null;
  switch (temps) {
    case "presentSimple":
      return estBe ? { mots: [presentDe(v, p)] } : { mots: [presentDe(v, p)], avecDo: { passe: false, suite: [baseDe(v)] } };
    case "pastSimple":
      return estBe ? { mots: [passeDe(v, p)] } : { mots: [passeDe(v, p)], avecDo: { passe: true, suite: [baseDe(v)] } };
    case "presentContinuous":
      return { mots: [beAux(p), ing] };
    case "pastContinuous":
      return { mots: [beAux(p, true), ing] };
    case "presentPerfect":
      return { mots: [haveAux(p), pp] };
    case "pastPerfect":
      return { mots: [haveAux(p, true), pp] };
    case "presentPerfectContinuous":
      return { mots: [haveAux(p), been, ing] };
    case "pastPerfectContinuous":
      return { mots: [haveAux(p, true), been, ing] };
    case "futureSimple":
      return { mots: [will, baseDe(v)] };
    case "futureContinuous":
      return { mots: [will, be, ing] };
    case "futurePerfect":
      return { mots: [will, have, pp] };
    case "futurePerfectContinuous":
      return { mots: [will, have, been, ing] };
    case "conditional":
      return { mots: [would, baseDe(v)] };
    case "conditionalContinuous":
      return { mots: [would, be, ing] };
    case "conditionalPerfect":
      return { mots: [would, have, pp] };
    case "conditionalPerfectContinuous":
      return { mots: [would, have, been, ing] };
    case "goingTo":
      return { mots: [beAux(p), lien("going"), lien("to"), baseDe(v)] };
    case "usedTo":
      return { mots: [coupe(["use", "d"]), lien("to"), baseDe(v)], avecDo: { passe: true, suite: [mot("use", "radical"), lien("to"), baseDe(v)] } };
    case "passivePresent":
      return { mots: [beAux(p), pp] };
    case "passivePresentContinuous":
      return { mots: [beAux(p), being, pp] };
    case "passivePast":
      return { mots: [beAux(p, true), pp] };
    case "passivePastContinuous":
      return { mots: [beAux(p, true), being, pp] };
    case "passivePresentPerfect":
      return { mots: [haveAux(p), been, pp] };
    case "passivePastPerfect":
      return { mots: [haveAux(p, true), been, pp] };
    case "passiveFuture":
      return { mots: [will, be, pp] };
    case "passiveGoingTo":
      return { mots: [beAux(p), lien("going"), lien("to"), be, pp] };
    case "passiveConditional":
      return { mots: [would, be, pp] };
    case "passiveConditionalPerfect":
      return { mots: [would, have, been, pp] };
    default:
      return null;
  }
}

/* ---------- Les contractions ---------- */

const CONTRACTE: Record<string, string> = { am: "'m", are: "'re", is: "'s", have: "'ve", has: "'s", had: "'d", will: "'ll", would: "'d" };
const NEGATIF: Record<string, [string, string]> = {
  is: ["is", "n't"], are: ["are", "n't"], was: ["was", "n't"], were: ["were", "n't"], have: ["have", "n't"], has: ["has", "n't"], had: ["had", "n't"],
  do: ["do", "n't"], does: ["does", "n't"], did: ["did", "n't"], will: ["wo", "n't"], would: ["would", "n't"],
};

/** Met les mots bout à bout : un espace entre deux mots, rien à l'intérieur d'un mot. */
function assembler(mots: Mot[]): Morceau[] {
  const sortie: Morceau[] = [];
  mots.forEach((w, i) => {
    w.m.forEach((x, k) => sortie.push({ ...x, texte: x.texte + (k === w.m.length - 1 && i < mots.length - 1 ? " " : "") }));
  });
  return sortie;
}

export type Options = { troisieme: "he" | "she" | "it"; mode: ModePhrase; contractions: boolean };

export const SUJETS = (troisieme: string) => ["I", "you", troisieme, "we", "you", "they"];

/**
 * Les six formes d'un temps (deux à l'impératif : you et let's).
 * null : la forme n'existe pas (le passif d'un verbe sans complément, une question à l'impératif).
 */
export function conjuguer(verbes: Verbes, saisie: string, temps: TempsId, o: Options): Forme[] {
  const v = verbes.get(saisie.trim().toLowerCase());
  if (!v) return [];

  if (temps === "imperative") {
    if (o.mode === "question") return [null, null];
    const neg = o.mode === "negative";
    const toi: Mot[] = neg ? (o.contractions ? [{ m: [{ texte: "do", role: "auxiliaire" }, { texte: "n't", role: "lien" }] }, baseDe(v)] : [mot("do", "auxiliaire"), lien("not"), baseDe(v)]) : [baseDe(v)];
    const nous: Mot[] = [{ m: [{ texte: "let", role: "auxiliaire" }, { texte: "'s", role: "pronom" }] }, ...(neg ? [lien("not")] : []), baseDe(v)];
    return [assembler(toi), assembler(nous)];
  }

  const sujets = SUJETS(o.troisieme);
  return sujets.map((s, p) => {
    const c = chaine(temps, v, p);
    if (!c) return null;
    const sujet = mot(s, "pronom");
    let mots = c.mots;
    const doSupport = c.avecDo && o.mode !== "affirmative";
    if (doSupport) mots = [doAux(p, c.avecDo!.passe), ...c.avecDo!.suite];
    const [premier, ...reste] = mots;

    if (o.mode === "question") {
      const [tete, ...suite] = assembler([premier, sujet, ...reste]);
      return [{ ...tete, texte: tete.texte.charAt(0).toUpperCase() + tete.texte.slice(1) }, ...suite, { texte: "?", role: "signe" }];
    }
    if (o.mode === "negative") {
      if (o.contractions && premier.aux === "am") {
        return assembler([{ m: [...sujet.m, { texte: "'m", role: "auxiliaire" }] }, lien("not"), ...reste]);
      }
      if (o.contractions && premier.aux && NEGATIF[premier.aux]) {
        const [a, n] = NEGATIF[premier.aux];
        const role = premier.m[0].role;
        return assembler([sujet, { m: [{ texte: a, role }, { texte: n, role: "lien" }] }, ...reste]);
      }
      return assembler([sujet, premier, lien("not"), ...reste]);
    }
    if (o.contractions && premier.aux && CONTRACTE[premier.aux]) {
      return assembler([{ m: [...sujet.m, { texte: CONTRACTE[premier.aux], role: premier.m[0].role }] }, ...reste]);
    }
    return assembler([sujet, ...mots]);
  });
}

/** Les formes de référence d'un verbe : celles qu'on apprend par cœur. */
export function formesDeReference(verbes: Verbes, saisie: string) {
  const v = verbes.get(saisie.trim().toLowerCase());
  if (!v) return null;
  return {
    base: v.base,
    troisieme: v.base === "be" ? "is" : v.base === "have" ? "has" : formeS(v.base).join(""),
    passe: v.passe.join(" / "),
    participe: v.participe.join(" / "),
    ing: formeIng(v.base).join(""),
    irregulier: v.irregulier,
  };
}

export const texteDe = (f: Forme) => (f ? f.map((m) => m.texte).join("") : "");
