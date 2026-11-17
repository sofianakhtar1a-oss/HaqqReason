/*
 * Le moteur de la Machine à voyager dans le temps.
 * Les temps simples viennent de la base (Lefff, corrigée) ; les temps composés, le futur proche,
 * le passé récent, les verbes pronominaux et les accords sont calculés ici.
 * Chaque forme est découpée en morceaux colorés : pronom, auxiliaire (le moteur), radical (le corps),
 * terminaison (le costume), participe.
 */

export type Role = "pronom" | "que" | "reflexif" | "auxiliaire" | "radical" | "terminaison" | "participe" | "lien" | "infinitif";
export type Morceau = { texte: string; role: Role };
export type Forme = Morceau[] | null;

export type TempsId =
  | "present"
  | "imparfait"
  | "passeSimple"
  | "futur"
  | "passeCompose"
  | "plusQueParfait"
  | "passeAnterieur"
  | "futurAnterieur"
  | "futurProche"
  | "passeRecent"
  | "conditionnel"
  | "conditionnelPasse"
  | "subjonctif"
  | "subjonctifPasse"
  | "subjonctifImparfait"
  | "subjonctifPlusQueParfait"
  | "imperatif"
  | "imperatifPasse";

export type Monde = "reel" | "reve" | "souhait" | "ordre";

export type Temps = {
  id: TempsId;
  monde: Monde;
  nom: string;
  /** Ce que le temps raconte, en mots simples. */
  image: string;
  niveau: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

export const TEMPS: Temps[] = [
  { id: "passeSimple", monde: "reel", nom: "Passé simple", image: "Il était une fois… : le temps des contes et des livres d'histoire", niveau: "C1" },
  { id: "passeAnterieur", monde: "reel", nom: "Passé antérieur", image: "Juste avant une action des contes", niveau: "C2" },
  { id: "plusQueParfait", monde: "reel", nom: "Plus-que-parfait", image: "Le passé du passé : c'était déjà fait avant", niveau: "B1" },
  { id: "imparfait", monde: "reel", nom: "Imparfait", image: "Le décor du passé, le film qui tourne en fond", niveau: "A2" },
  { id: "passeCompose", monde: "reel", nom: "Passé composé", image: "La photo souvenir : une action finie", niveau: "A2" },
  { id: "passeRecent", monde: "reel", nom: "Passé récent", image: "Ça vient juste d'arriver, il y a deux secondes", niveau: "A1" },
  { id: "present", monde: "reel", nom: "Présent", image: "Maintenant, ici, en direct", niveau: "A1" },
  { id: "futurProche", monde: "reel", nom: "Futur proche", image: "Ça va arriver tout de suite", niveau: "A1" },
  { id: "futur", monde: "reel", nom: "Futur simple", image: "Plus tard, demain, un jour", niveau: "A2" },
  { id: "futurAnterieur", monde: "reel", nom: "Futur antérieur", image: "Dans le futur, ce sera déjà fini", niveau: "B1" },
  { id: "conditionnel", monde: "reve", nom: "Conditionnel présent", image: "La bulle de rêve : si… alors…, et la politesse", niveau: "B1" },
  { id: "conditionnelPasse", monde: "reve", nom: "Conditionnel passé", image: "Le regret : ce qui aurait pu arriver", niveau: "B2" },
  { id: "subjonctif", monde: "souhait", nom: "Subjonctif présent", image: "Le monde des envies, des peurs et des obligations", niveau: "B1" },
  { id: "subjonctifPasse", monde: "souhait", nom: "Subjonctif passé", image: "Une envie à propos d'une chose déjà faite", niveau: "B2" },
  { id: "subjonctifImparfait", monde: "souhait", nom: "Subjonctif imparfait", image: "Le subjonctif des grands écrivains", niveau: "C2" },
  { id: "subjonctifPlusQueParfait", monde: "souhait", nom: "Subjonctif plus-que-parfait", image: "Le regret des grands écrivains", niveau: "C2" },
  { id: "imperatif", monde: "ordre", nom: "Impératif présent", image: "La télécommande : un ordre, un conseil", niveau: "A1" },
  { id: "imperatifPasse", monde: "ordre", nom: "Impératif passé", image: "Un ordre à finir avant un moment précis", niveau: "C1" },
];

export const MONDES: { id: Monde; nom: string; image: string }[] = [
  { id: "reel", nom: "Le monde réel", image: "Ce qui arrive vraiment (l'indicatif)" },
  { id: "reve", nom: "Le monde des rêves", image: "Ce qui arriverait si… (le conditionnel)" },
  { id: "souhait", nom: "Le monde des souhaits", image: "Ce qu'on veut, craint ou exige (le subjonctif)" },
  { id: "ordre", nom: "La télécommande", image: "Ce qu'on ordonne (l'impératif)" },
];

/* ---------- La base ---------- */

type Base = { P?: (string | null)[]; I?: (string | null)[]; J?: (string | null)[]; F?: (string | null)[]; C?: (string | null)[]; S?: (string | null)[]; T?: (string | null)[]; Y?: (string | null)[]; G?: (string | null)[]; K?: (string | null)[] };
const ORDRE = ["P", "I", "J", "F", "C", "S", "T", "Y", "G", "K"] as const;

let cache: Map<string, Base> | null = null;
let promesse: Promise<Map<string, Base>> | null = null;

function decoder(texte: string, m: Map<string, Base>) {
  for (const ligne of texte.split("\n")) {
    const deux = ligne.indexOf(":");
    const verbe = ligne.slice(0, deux);
    const parts = ligne.slice(deux + 1).split(";");
    const b: Base = {};
    ORDRE.forEach((t, k) => {
      const p = parts[k];
      if (!p) return;
      const [pre, suf] = p.split("|");
      b[t] = suf.split(",").map((s) => (s === "-" ? null : pre + s));
    });
    m.set(verbe, b);
  }
}

/** Charge la base (deux morceaux, séparés du reste du site). */
export function chargerVerbes(): Promise<Map<string, Base>> {
  if (cache) return Promise.resolve(cache);
  promesse ??= Promise.all([import("./verbes-a"), import("./verbes-b")]).then(([a, b]) => {
    const m = new Map<string, Base>();
    decoder(a.VERBES, m);
    decoder(b.VERBES, m);
    cache = m;
    return m;
  });
  return promesse;
}

/* ---------- Les règles ---------- */

/** Verbes qui voyagent avec le moteur « être » aux temps composés (la maison d'être). */
export const VERBES_ETRE = new Set([
  "aller", "venir", "devenir", "revenir", "parvenir", "intervenir", "arriver", "partir", "rester", "tomber", "naître", "mourir",
  "entrer", "rentrer", "sortir", "monter", "descendre", "retourner", "passer", "apparaître", "éclore",
]);
const H_ASPIRE = new Set(["haïr", "hurler", "hacher", "hisser", "heurter", "hanter", "harceler", "hausser", "hâter"]);

export type VerbeChoisi = { infinitif: string; base: string; pronominal: boolean };

export function lireVerbe(saisie: string): VerbeChoisi {
  const s = saisie.trim().toLowerCase();
  const m = /^(?:se |s')(.+)$/.exec(s);
  return m ? { infinitif: s, base: m[1], pronominal: true } : { infinitif: s, base: s, pronominal: false };
}

const voyelle = (mot: string, base: string) => /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(mot) || (/^h/i.test(mot) && !H_ASPIRE.has(base));

const PRONOMS = ["je", "tu", "il", "nous", "vous", "ils"];
const PRONOMS_F = ["je", "tu", "elle", "nous", "vous", "elles"];
const REFLEXIFS = ["me", "te", "se", "nous", "vous", "se"];

type Simple = "P" | "I" | "J" | "F" | "C" | "S" | "T" | "Y";
const TERMINAISONS: Record<Simple, string[][]> = {
  P: [["ai", "e", "s", "x"], ["es", "as", "s", "x"], ["e", "t", "d", "a", "c"], ["ons", "mes"], ["ez", "es"], ["ent", "ont"]],
  I: [["ais"], ["ais"], ["ait"], ["ions"], ["iez"], ["aient"]],
  J: [["ai", "is", "us", "ins"], ["as", "is", "us", "ins"], ["a", "it", "ut", "int"], ["âmes", "îmes", "ûmes", "înmes"], ["âtes", "îtes", "ûtes", "întes"], ["èrent", "irent", "urent", "inrent"]],
  F: [["rai"], ["ras"], ["ra"], ["rons"], ["rez"], ["ront"]],
  C: [["rais"], ["rais"], ["rait"], ["rions"], ["riez"], ["raient"]],
  S: [["e", "s"], ["es", "s"], ["e", "t"], ["ions", "yons"], ["iez", "yez"], ["ent"]],
  T: [["sse"], ["sses"], ["ât", "ît", "ût", "înt"], ["ssions"], ["ssiez"], ["ssent"]],
  Y: [["e", "s", "x", "a"], ["ons"], ["ez", "es"]],
};

/** Le corps (radical) et le costume (terminaison) d'une forme simple. */
export function decouper(forme: string, temps: Simple, personne: number): Morceau[] {
  const possibles = [...(TERMINAISONS[temps][personne] ?? [])].sort((a, b) => b.length - a.length);
  const t = possibles.find((x) => forme.endsWith(x) && forme.length > x.length) ?? possibles.find((x) => forme.endsWith(x)) ?? "";
  const r = forme.slice(0, forme.length - t.length);
  const sortie: Morceau[] = [];
  if (r) sortie.push({ texte: r, role: "radical" });
  if (t) sortie.push({ texte: t, role: "terminaison" });
  return sortie;
}

type Options = { feminin: boolean };

const SIMPLE: Partial<Record<TempsId, Simple>> = {
  present: "P",
  imparfait: "I",
  passeSimple: "J",
  futur: "F",
  conditionnel: "C",
  subjonctif: "S",
  subjonctifImparfait: "T",
};
const COMPOSE: Partial<Record<TempsId, Simple>> = {
  passeCompose: "P",
  plusQueParfait: "I",
  passeAnterieur: "J",
  futurAnterieur: "F",
  conditionnelPasse: "C",
  subjonctifPasse: "S",
  subjonctifPlusQueParfait: "T",
};

export function auxiliaireDe(v: VerbeChoisi) {
  return v.pronominal || VERBES_ETRE.has(v.base) ? "être" : "avoir";
}

/** Le participe passé accordé (ms, mp, fs, fp) ; avec avoir, il reste au masculin singulier. */
function participe(b: Base, avecEtre: boolean, personne: number, o: Options) {
  const k = b.K ?? [];
  if (!avecEtre) return k[0] ?? "";
  const pluriel = personne >= 3;
  return k[(o.feminin ? 2 : 0) + (pluriel ? 1 : 0)] ?? k[0] ?? "";
}

/** Le sujet, l'éventuel « que » du subjonctif, le pronom réfléchi : avec élision devant une voyelle. */
function devant(personne: number, suite: string, base: string, v: VerbeChoisi, o: Options, subjonctif: boolean): Morceau[] {
  const sortie: Morceau[] = [];
  const pronom = (o.feminin ? PRONOMS_F : PRONOMS)[personne];
  const apres = v.pronominal ? REFLEXIFS[personne] : suite;
  if (subjonctif) sortie.push({ texte: personne === 2 || personne === 5 ? "qu'" : "que ", role: "que" });
  if (personne === 0 && voyelle(apres, base)) sortie.push({ texte: "j'", role: "pronom" });
  else sortie.push({ texte: pronom + " ", role: "pronom" });
  if (v.pronominal) {
    const r = REFLEXIFS[personne];
    if (personne !== 3 && personne !== 4 && voyelle(suite, base)) sortie.push({ texte: r[0] + "'", role: "reflexif" });
    else sortie.push({ texte: r + " ", role: "reflexif" });
  }
  return sortie;
}

/**
 * Les six formes d'un temps (trois à l'impératif). null : la forme n'existe pas
 * (« il faut » n'a qu'une personne, « clore » n'a pas de « nous »).
 */
export function conjuguer(verbes: Map<string, Base>, saisie: string, temps: TempsId, o: Options): Forme[] {
  const v = lireVerbe(saisie);
  const b = verbes.get(v.base);
  if (!b) return [];
  const aux = auxiliaireDe(v);
  const ba = verbes.get(aux === "être" ? "être" : "avoir");

  if (temps === "imperatif" || temps === "imperatifPasse") {
    const reflexifs = ["toi", "nous", "vous"];
    return [0, 1, 2].map((k) => {
      if (temps === "imperatif") {
        const f = b.Y?.[k];
        if (!f) return null;
        const sortie = decouper(f, "Y", k);
        if (v.pronominal) sortie.push({ texte: "-" + reflexifs[k], role: "reflexif" });
        return sortie;
      }
      const fa = ba?.Y?.[k];
      if (!fa || v.pronominal) return null;
      return [
        { texte: fa + " ", role: "auxiliaire" },
        { texte: participe(b, aux === "être", k === 0 ? 0 : 3, o), role: "participe" },
      ];
    });
  }

  return [0, 1, 2, 3, 4, 5].map((p) => {
    const sub = temps.startsWith("subjonctif");
    const simple = SIMPLE[temps];
    if (simple) {
      const f = b[simple]?.[p];
      if (!f) return null;
      return [...devant(p, f, v.base, v, o, sub), ...decouper(f, simple, p)];
    }
    const compose = COMPOSE[temps];
    if (compose) {
      const fa = ba?.[compose]?.[p];
      if (!fa || !b.K?.[0]) return null;
      // Un verbe à une seule personne (il faut, il pleut) garde ses trous.
      if (!b.P?.[p] && !b.I?.[p] && !b.F?.[p]) return null;
      return [...devant(p, fa, aux, v, o, sub), { texte: fa + " ", role: "auxiliaire" }, { texte: participe(b, aux === "être", p, o), role: "participe" }];
    }
    if (temps === "futurProche" || temps === "passeRecent") {
      const outil = verbes.get(temps === "futurProche" ? "aller" : "venir")?.P?.[p];
      if (!outil || (!b.P?.[p] && !b.F?.[p])) return null;
      const sortie: Morceau[] = [...devant(p, outil, temps === "futurProche" ? "aller" : "venir", { ...v, pronominal: false }, o, false), { texte: outil + " ", role: "auxiliaire" }];
      if (temps === "passeRecent") sortie.push({ texte: voyelle(v.pronominal ? REFLEXIFS[p] : v.base, v.base) ? "d'" : "de ", role: "lien" });
      if (v.pronominal) {
        const r = REFLEXIFS[p];
        sortie.push({ texte: p !== 3 && p !== 4 && voyelle(v.base, v.base) ? r[0] + "'" : r + " ", role: "reflexif" });
      }
      sortie.push({ texte: v.base, role: "infinitif" });
      return sortie;
    }
    return null;
  });
}

/** Les formes sans personne : participe présent, gérondif, participe passé. */
export function formesSansPersonne(verbes: Map<string, Base>, saisie: string) {
  const v = lireVerbe(saisie);
  const b = verbes.get(v.base);
  if (!b) return null;
  const g = b.G?.[0] ?? null;
  const pron = v.pronominal ? (voyelle(g ?? "", v.base) ? "s'" : "se ") : "";
  return { participePresent: g ? pron + g : null, gerondif: g ? `en ${pron}${g}` : null, participePasse: b.K?.[0] ?? null, auxiliaire: auxiliaireDe(v) };
}

/** Les verbes proposés dans la Machine, avec les pronominaux courants. */
export const PRONOMINAUX = [
  "se laver", "se lever", "se coucher", "se réveiller", "se dépêcher", "s'habiller", "s'appeler", "se promener", "se souvenir",
  "se taire", "s'asseoir", "se rappeler", "se tromper", "se moquer", "s'évanouir", "se repentir", "s'ennuyer",
];

export const texteDe = (f: Forme) => (f ? f.map((m) => m.texte).join("") : "");
