/*
 * ChatPDF : comment le texte des PDF entre dans la demande faite à l'IA.
 *
 *   • Lecture complète : si les documents cochés tiennent dans le budget, leur texte entier est
 *     envoyé, page par page, dans la consigne système, que l'IA garde en cache. Les
 *     questions suivantes relisent ce texte depuis le cache : environ 20 fois moins cher
 *     (et plus rapide), tant que l'on reste actif quelques minutes.
 *   • Lecture par extraits : au-delà, les documents sont découpés en passages d'environ
 *     un millier de jetons ; on garde les plus pertinents pour la question (classement BM25,
 *     sans dépendre d'un autre service), avec une place pour chaque document quand on les
 *     compare, ou des passages répartis sur tout le document quand on demande un résumé.
 *     Les extraits voyagent avec la question, pas dans la consigne : l'historique reste en cache.
 *
 * Module pur (aucun accès au réseau ni à la base) : il est testé dans tests/test-assistant.mts.
 */
import { estimerJetons } from "./modeles";

/** numero : le « Doc N » que l'IA cite (stable dans la conversation). */
export type DocumentContexte = { id: string; numero: number; nom: string; pages: number; texte: string };

export type Passage = { doc: number; pageDebut: number; pageFin: number; texte: string; jetons: number };

export type ModeLecture = "complet" | "extraits";

export type Contexte = {
  mode: ModeLecture;
  /** Texte à placer dans la consigne système (lecture complète) ou devant la question (extraits). */
  texte: string;
  jetons: number;
  /** Pour chaque document : les pages réellement transmises (« 1-240 », « 3-5, 12 »). */
  documents: { id: string; numero: number; nom: string; pages: string }[];
  /** Vrai si la lecture intégrale était demandée mais dépassait la limite. */
  integraleImpossible: boolean;
};

/*
 * Les budgets restent modestes : chaque question est prise sur le crédit gratuit du site, et chaque
 * compte n'en a qu'une petite part par mois (limites.ts).
 */
/** Au-dessous, tout le texte est envoyé sans rien demander (une centaine de pages). */
export const BUDGET_COMPLET_AUTO = 60_000;
/** Lecture intégrale demandée : jusqu'à 250 000 jetons (quelques centaines de pages). */
export const BUDGET_INTEGRAL = 250_000;
/** Extraits : ce que l'on garde par question. */
export const BUDGET_EXTRAITS = 25_000;
export const BUDGET_EXTRAITS_LARGE = 80_000;

const TAILLE_PASSAGE = 2_600;

/* ---------- Pages ---------- */

/** Le texte stocké est « [Page 1] …\n\n[Page 2] … » : on retrouve les pages. */
export function pagesDuTexte(texte: string): { n: number; texte: string }[] {
  const pages: { n: number; texte: string }[] = [];
  const re = /\[Page (\d{1,5})\]\n?/g;
  let m: RegExpExecArray | null;
  let precedent: { n: number; debut: number } | null = null;
  while ((m = re.exec(texte))) {
    if (precedent) pages.push({ n: precedent.n, texte: texte.slice(precedent.debut, m.index).trim() });
    precedent = { n: Number(m[1]), debut: m.index + m[0].length };
  }
  if (precedent) pages.push({ n: precedent.n, texte: texte.slice(precedent.debut).trim() });
  if (!pages.length && texte.trim()) pages.push({ n: 1, texte: texte.trim() });
  return pages;
}

/** Assemble le texte de pages extraites dans le navigateur. */
export function texteDesPages(pages: { n: number; texte: string }[]): string {
  return pages.map((p) => `[Page ${p.n}]\n${p.texte.trim()}`).join("\n\n");
}

/* ---------- Découpage en passages ---------- */

export function decouper(texte: string, doc: number, taille = TAILLE_PASSAGE): Passage[] {
  const passages: Passage[] = [];
  let courant = "";
  let debut = 0;
  let fin = 0;
  const vider = () => {
    const t = courant.trim();
    if (t) passages.push({ doc, pageDebut: debut, pageFin: fin, texte: t, jetons: estimerJetons(t) });
    courant = "";
  };
  for (const page of pagesDuTexte(texte)) {
    const morceaux = page.texte.split(/\n{2,}/).flatMap((p) => (p.length > taille ? (p.match(new RegExp(`[\\s\\S]{1,${taille}}(?=\\s|$)|[\\s\\S]{1,${taille}}`, "g")) ?? [p]) : [p]));
    for (const morceau of morceaux) {
      if (!morceau.trim()) continue;
      if (courant && courant.length + morceau.length > taille) vider();
      if (!courant) debut = page.n;
      courant += `${courant ? "\n\n" : ""}${courant && fin !== page.n ? `[Page ${page.n}]\n` : ""}${morceau}`;
      fin = page.n;
    }
  }
  vider();
  return passages;
}

/* ---------- Classement BM25 ---------- */

const MOTS_VIDES = new Set(
  (
    "le la les un une des du de d l au aux et ou mais donc or ni car que qui quoi dont ou a à ce cet cette ces se sa son ses leur leurs " +
    "il elle ils elles on nous vous je tu me te moi toi lui y en ne pas plus moins tres très tout tous toute toutes est sont etre être " +
    "avoir a ont fait faire pour par sur sous dans avec sans entre vers chez comme si quel quelle quels quelles est-ce " +
    "the a an of to in on at for by with from and or but is are was were be been it its this that these those what which who how why " +
    "do does did can could should would will i you he she we they me my your our their as not no yes " +
    "document documents pdf texte page pages resume résume resumer résumer explique dis donne quels"
  ).split(" "),
);

export function motsCles(texte: string): string[] {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((m) => m.length >= 2 && !MOTS_VIDES.has(m))
    .map((m) => (m.length > 4 && /[sx]$/.test(m) ? m.slice(0, -1) : m));
}

/** Score BM25 de chaque passage pour la requête. */
export function classer(passages: Passage[], requete: string): number[] {
  const termes = [...new Set(motsCles(requete))];
  if (!termes.length || !passages.length) return passages.map(() => 0);
  const docs = passages.map((p) => {
    const freq = new Map<string, number>();
    const mots = motsCles(p.texte);
    for (const m of mots) freq.set(m, (freq.get(m) ?? 0) + 1);
    return { freq, longueur: mots.length };
  });
  const moyenne = docs.reduce((s, d) => s + d.longueur, 0) / docs.length || 1;
  const k1 = 1.2;
  const b = 0.75;
  const idf = new Map(
    termes.map((t) => {
      const df = docs.filter((d) => d.freq.has(t)).length;
      return [t, Math.log(1 + (docs.length - df + 0.5) / (df + 0.5))];
    }),
  );
  return docs.map((d) =>
    termes.reduce((score, t) => {
      const f = d.freq.get(t) ?? 0;
      if (!f) return score;
      return score + (idf.get(t) ?? 0) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.longueur) / moyenne)));
    }, 0),
  );
}

/* ---------- Ce que demande la question ---------- */

export type Intention = "resume" | "comparaison" | "question";

export function intention(question: string): Intention {
  const q = question.toLowerCase();
  if (/compar|diff[ée]ren|point(s)? commun|croise|crois[ée]|contradi|convergen|divergen|versus|\bvs\b|entre les (deux|documents|textes)|chaque document|tous les documents/.test(q)) {
    return "comparaison";
  }
  if (/r[ée]sum|synth[èe]s|grandes lignes|principaux points|points cl[ée]s|de quoi (parle|traite)|sommaire|plan du|id[ée]es? principales?|summar|overview|tl;?dr/.test(q)) return "resume";
  return "question";
}

/* ---------- Choix des passages ---------- */

function reparti<T>(liste: T[], combien: number): T[] {
  if (combien >= liste.length) return [...liste];
  if (combien <= 0) return [];
  const pris: T[] = [];
  for (let i = 0; i < combien; i++) pris.push(liste[Math.floor((i * liste.length) / combien)]);
  return pris;
}

export function choisirPassages(passagesParDoc: Passage[][], question: string, budget: number): Passage[] {
  const tous = passagesParDoc.flat();
  if (!tous.length) return [];
  const pris = new Set<Passage>();
  let utilises = 0;
  const prendre = (p: Passage) => {
    if (pris.has(p) || utilises + p.jetons > budget) return false;
    pris.add(p);
    utilises += p.jetons;
    return true;
  };
  const scores = classer(tous, question);
  const score = new Map(tous.map((p, i) => [p, scores[i]]));
  const pertinent = scores.some((s) => s > 0);
  const but = intention(question);
  const nbDocs = passagesParDoc.filter((l) => l.length).length;

  if (but === "resume" || !pertinent) {
    // Résumé, ou question sans mot retrouvé : des passages répartis sur chaque document,
    // en commençant par son début (titre, introduction), puis les plus pertinents s'il reste de la place.
    const parDoc = Math.max(1, Math.floor(budget / Math.max(1, nbDocs)));
    for (const liste of passagesParDoc) {
      if (!liste.length) continue;
      const moyenne = liste.reduce((s, p) => s + p.jetons, 0) / liste.length || 1;
      const combien = Math.max(1, Math.floor(parDoc / moyenne));
      for (const p of reparti(liste, combien)) prendre(p);
    }
  } else if (nbDocs > 1 && but === "comparaison") {
    // Comparaison : chaque document a sa part, ses passages les plus pertinents d'abord.
    const parDoc = Math.floor(budget / nbDocs);
    for (const liste of passagesParDoc) {
      let part = 0;
      for (const p of [...liste].sort((a, c) => (score.get(c) ?? 0) - (score.get(a) ?? 0))) {
        if (part + p.jetons > parDoc) break;
        if (prendre(p)) part += p.jetons;
      }
    }
  } else if (nbDocs > 1) {
    // Question précise sur plusieurs documents : au moins le meilleur passage de chacun s'il parle du sujet.
    for (const liste of passagesParDoc) {
      const meilleur = [...liste].sort((a, c) => (score.get(c) ?? 0) - (score.get(a) ?? 0))[0];
      if (meilleur && (score.get(meilleur) ?? 0) > 0) prendre(meilleur);
    }
  }
  // Le reste du budget : les passages les plus pertinents, tous documents confondus.
  for (const p of [...tous].sort((a, c) => (score.get(c) ?? 0) - (score.get(a) ?? 0))) {
    if (utilises >= budget) break;
    if (pertinent && (score.get(p) ?? 0) === 0 && but === "question") break;
    prendre(p);
  }
  return tous.filter((p) => pris.has(p));
}

/* ---------- Mise en forme ---------- */

const attribut = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Un PDF ne peut pas fermer lui-même la balise qui l'entoure (ni se faire passer pour une consigne). */
export const neutraliser = (s: string) => s.replace(/<\/?\s*(documents?|extraits?|extrait|question)\b/gi, (m) => m.replace("<", "‹"));

export function plages(pages: number[]): string {
  const triees = [...new Set(pages)].sort((a, b) => a - b);
  const morceaux: string[] = [];
  for (let i = 0; i < triees.length; i++) {
    let j = i;
    while (j + 1 < triees.length && triees[j + 1] === triees[j] + 1) j++;
    morceaux.push(i === j ? `${triees[i]}` : `${triees[i]}-${triees[j]}`);
    i = j;
  }
  return morceaux.join(", ");
}

export function construireContexte(
  documents: DocumentContexte[],
  question: string,
  options: { integrale?: boolean; questionPrecedente?: string } = {},
): Contexte {
  const total = documents.reduce((s, d) => s + estimerJetons(d.texte), 0);
  const limiteComplete = options.integrale ? BUDGET_INTEGRAL : BUDGET_COMPLET_AUTO;

  if (total <= limiteComplete) {
    const texte = [
      "<documents>",
      ...documents.map((d) => `<document index="${d.numero}" nom="${attribut(d.nom)}" pages="${d.pages}">\n${neutraliser(d.texte)}\n</document>`),
      "</documents>",
    ].join("\n");
    return {
      mode: "complet",
      texte,
      jetons: estimerJetons(texte),
      documents: documents.map((d) => ({ id: d.id, numero: d.numero, nom: d.nom, pages: plages(pagesDuTexte(d.texte).map((p) => p.n)) })),
      integraleImpossible: false,
    };
  }

  const budget = options.integrale ? BUDGET_EXTRAITS_LARGE : BUDGET_EXTRAITS;
  // La question précédente aide quand la nouvelle est elliptique (« et dans le second ? »).
  const requete = `${question}\n${options.questionPrecedente ?? ""}`;
  const passagesParDoc = documents.map((d, i) => decouper(d.texte, i));
  const choisis = choisirPassages(passagesParDoc, requete, budget);
  const pagesLues = (i: number) => plages(choisis.filter((p) => p.doc === i).flatMap((p) => suite(p.pageDebut, p.pageFin)));
  const blocs = documents
    .map((d, i) => {
      const siens = choisis.filter((p) => p.doc === i);
      if (!siens.length) return "";
      const extraits = siens.map((p) => `<extrait pages="${p.pageDebut === p.pageFin ? p.pageDebut : `${p.pageDebut}-${p.pageFin}`}">\n[Page ${p.pageDebut}]\n${neutraliser(p.texte)}\n</extrait>`);
      return `<document index="${d.numero}" nom="${attribut(d.nom)}" pages="${d.pages}" extraits="${pagesLues(i)}">\n${extraits.join("\n")}\n</document>`;
    })
    .filter(Boolean);
  const texte = ["<extraits>", ...blocs, "</extraits>"].join("\n");
  return {
    mode: "extraits",
    texte,
    jetons: estimerJetons(texte),
    documents: documents.map((d, i) => ({ id: d.id, numero: d.numero, nom: d.nom, pages: pagesLues(i) })),
    integraleImpossible: Boolean(options.integrale),
  };
}

function suite(a: number, b: number): number[] {
  const r: number[] = [];
  for (let i = a; i <= b && r.length < 500; i++) r.push(i);
  return r;
}

/* ---------- L'historique de la conversation ---------- */

export type MessageHistorique = { role: "user" | "assistant"; contenu: string };

/**
 * Les derniers échanges qui tiennent dans le budget, dans un ordre que l'API accepte :
 * le premier message est de l'utilisateur, les rôles alternent (une question restée sans réponse
 * après une erreur est remplacée par la suivante).
 */
export function historiquePourApi(messages: MessageHistorique[], budget: number): MessageHistorique[] {
  const propres: MessageHistorique[] = [];
  for (const m of messages) {
    if (!m.contenu.trim()) continue;
    const dernier = propres[propres.length - 1];
    if (dernier && dernier.role === m.role) {
      if (m.role === "user") propres[propres.length - 1] = m;
      else dernier.contenu += `\n\n${m.contenu}`;
    } else propres.push({ ...m });
  }
  const gardes: MessageHistorique[] = [];
  let utilises = 0;
  for (let i = propres.length - 1; i >= 0; i--) {
    const j = estimerJetons(propres[i].contenu);
    if (utilises + j > budget) break;
    utilises += j;
    gardes.unshift(propres[i]);
  }
  while (gardes.length && gardes[0].role !== "user") gardes.shift();
  return gardes;
}
