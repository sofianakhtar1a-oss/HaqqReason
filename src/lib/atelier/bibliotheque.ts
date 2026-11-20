"use client";

/**
 * Le Calame — la bibliothèque personnelle : un ouvrage saisi une fois sert dans tous les
 * documents (sources, notes, bibliographie). Elle vit sur l'appareil, rangée par compte,
 * et suit le compte d'un appareil à l'autre : chaque ouvrage garde sa date de modification,
 * la plus récente l'emporte quand deux appareils l'ont changé.
 */

import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

export const GENRES_OUVRAGE = [
  { cle: "livre", libelle: "Livre" },
  { cle: "chapitre", libelle: "Chapitre d'un livre" },
  { cle: "article", libelle: "Article de revue" },
  { cle: "site", libelle: "Page web" },
] as const;
export type GenreOuvrage = (typeof GENRES_OUVRAGE)[number]["cle"];

export type Ouvrage = {
  id: string;
  genre: GenreOuvrage;
  /** « Nom, Prénom » de préférence ; plusieurs auteurs séparés par « ; ». */
  auteur: string;
  titre: string;
  /** Livre qui contient le chapitre, ou revue qui publie l'article. */
  recueil: string;
  traducteur: string;
  editeur: string;
  lieu: string;
  annee: string;
  volume: string;
  pages: string;
  url: string;
  /** Date de modification (ms). */
  q: number;
  /** Ouvrage retiré : la trace reste, pour que le retrait gagne aussi les autres appareils. */
  supprime?: boolean;
};

export const OUVRAGE_VIDE: Omit<Ouvrage, "id" | "q"> = { genre: "livre", auteur: "", titre: "", recueil: "", traducteur: "", editeur: "", lieu: "", annee: "", volume: "", pages: "", url: "" };

const EVENEMENT = "calame-bibliotheque";
const CLE = () => tiroir("calame-bibliotheque");
let cache: Ouvrage[] | null = null;
let visibles: Ouvrage[] | null = null;

function nettoyer(brut: unknown): Ouvrage | null {
  const o = (brut ?? {}) as Record<string, unknown>;
  const t = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
  const id = t(o.id, 40);
  if (!/^[a-z0-9-]{4,40}$/i.test(id)) return null;
  const genre = GENRES_OUVRAGE.some((g) => g.cle === o.genre) ? (o.genre as GenreOuvrage) : "livre";
  const ouvrage: Ouvrage = { id, genre, auteur: t(o.auteur), titre: t(o.titre), recueil: t(o.recueil), traducteur: t(o.traducteur), editeur: t(o.editeur), lieu: t(o.lieu, 120), annee: t(o.annee, 20), volume: t(o.volume, 40), pages: t(o.pages, 40), url: t(o.url, 600), q: Number(o.q) || 0 };
  if (o.supprime === true) ouvrage.supprime = true;
  return ouvrage;
}

export function nettoyerBibliotheque(brut: unknown): Ouvrage[] {
  if (!Array.isArray(brut)) return [];
  const vus = new Set<string>();
  const liste: Ouvrage[] = [];
  for (const b of brut.slice(0, 2000)) {
    const o = nettoyer(b);
    if (o && !vus.has(o.id)) {
      vus.add(o.id);
      liste.push(o);
    }
  }
  return liste;
}

/** Tout ce qui est rangé, traces des ouvrages retirés comprises. */
function toutes(): Ouvrage[] {
  if (cache) return cache;
  try {
    cache = nettoyerBibliotheque(JSON.parse(localStorage.getItem(CLE()) ?? "[]"));
  } catch {
    cache = [];
  }
  return cache;
}

/** Les ouvrages de la bibliothèque (la même liste tant que rien ne change). */
export function lireBibliotheque(): Ouvrage[] {
  if (!visibles || !cache) visibles = toutes().filter((o) => !o.supprime);
  return visibles;
}

export function ouvrageParId(id: string): Ouvrage | undefined {
  return lireBibliotheque().find((o) => o.id === id);
}

function ecrire(liste: Ouvrage[]): void {
  cache = liste;
  visibles = null;
  try {
    localStorage.setItem(CLE(), JSON.stringify(liste));
  } catch {
    // Stockage plein : la liste reste en mémoire pour cette visite.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Ajoute ou modifie un ouvrage ; renvoie son identifiant. */
export function enregistrerOuvrage(ouvrage: Partial<Ouvrage> & { titre: string }): string {
  const liste = toutes();
  const id = ouvrage.id ?? `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const avant = liste.find((o) => o.id === id);
  const suite = nettoyer({ ...OUVRAGE_VIDE, ...avant, ...ouvrage, id, q: Date.now(), supprime: false });
  if (!suite) return id;
  ecrire(avant ? liste.map((o) => (o.id === id ? suite : o)) : [suite, ...liste]);
  void noter("calame-bibliotheque", "ouvrages", suite.q).catch(() => undefined);
  return id;
}

export function supprimerOuvrage(id: string): void {
  const q = Date.now();
  ecrire(toutes().map((o) => (o.id === id ? { ...OUVRAGE_VIDE, id, q, supprime: true } : o)));
  void noter("calame-bibliotheque", "ouvrages", q).catch(() => undefined);
}

/* ---------- Synchronisation (appelée par le moteur, sans rien noter au journal) ---------- */

export function bibliothequeBrute(): Ouvrage[] | undefined {
  const l = toutes();
  return l.length > 0 ? l : undefined;
}

/** Range la bibliothèque venue du compte : ouvrage par ouvrage, le plus récent l'emporte. */
export function rangerBibliotheque(v: unknown): "a-renvoyer" | undefined {
  const venus = nettoyerBibliotheque(v);
  const ici = toutes();
  const parId = new Map(ici.map((o) => [o.id, o]));
  let renvoyer = false;
  for (const o of venus) {
    const local = parId.get(o.id);
    if (!local || o.q >= local.q) parId.set(o.id, o);
    else renvoyer = true;
  }
  const arrives = new Set(venus.map((o) => o.id));
  if (ici.some((o) => !arrives.has(o.id))) renvoyer = true;
  ecrire([...parId.values()].sort((a, b) => b.q - a.q));
  return renvoyer ? "a-renvoyer" : undefined;
}

export function abonnerBibliotheque(f: () => void): () => void {
  const surStockage = (e: StorageEvent) => {
    if (e.key === CLE()) {
      cache = null;
      visibles = null;
      f();
    }
  };
  window.addEventListener(EVENEMENT, f);
  window.addEventListener("storage", surStockage);
  return () => {
    window.removeEventListener(EVENEMENT, f);
    window.removeEventListener("storage", surStockage);
  };
}

// ---------------------------------------------------------------------------
// Styles de citation
// ---------------------------------------------------------------------------

export const STYLES_CITATION = [
  { cle: "chicago", libelle: "Chicago" },
  { cle: "apa", libelle: "APA" },
  { cle: "iso690", libelle: "ISO 690" },
] as const;
export type StyleCitation = (typeof STYLES_CITATION)[number]["cle"];

/** Une référence bibliographique, en morceaux : du texte, et des passages en italique. */
export type Morceau = { texte: string; italique?: boolean };

function auteurs(brut: string, style: StyleCitation): string {
  const liste = brut
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
  const un = (a: string, i: number) => {
    const [nom, prenom] = a.includes(",") ? a.split(",").map((x) => x.trim()) : [a, ""];
    if (style === "iso690") return prenom ? `${nom.toUpperCase()}, ${prenom}` : nom.toUpperCase();
    if (style === "apa") return prenom ? `${nom}, ${prenom.split(/[\s-]+/).map((p) => `${p.charAt(0)}.`).join(" ")}` : nom;
    // Chicago : le premier auteur à l'envers (Nom, Prénom), les suivants à l'endroit.
    return prenom ? (i === 0 ? `${nom}, ${prenom}` : `${prenom} ${nom}`) : nom;
  };
  const noms = liste.map(un);
  if (noms.length <= 1) return noms[0] ?? "";
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

/** La référence complète d'un ouvrage dans le style choisi (typographie française). */
export function referenceOuvrage(o: Omit<Ouvrage, "id" | "q">, style: StyleCitation, page = ""): Morceau[] {
  const a = auteurs(o.auteur, style);
  const m: Morceau[] = [];
  const t = (texte: string) => texte && m.push({ texte });
  const i = (texte: string) => texte && m.push({ texte, italique: true });
  const edition = [o.lieu && o.editeur ? `${o.lieu} : ${o.editeur}` : o.lieu || o.editeur].filter(Boolean).join("");
  const traduit = o.traducteur ? `, trad. ${o.traducteur}` : "";
  const pageFin = page ? `, p. ${page}` : "";
  if (style === "apa") {
    t(`${a ? `${a} ` : ""}(${o.annee || "s. d."}). `);
    if (o.genre === "article") {
      t(`${o.titre}. `);
      i(o.recueil);
      t(`${o.volume ? `, ${o.volume}` : ""}${o.pages ? `, ${o.pages}` : ""}.`);
    } else if (o.genre === "chapitre") {
      t(`${o.titre}. Dans `);
      i(o.recueil);
      t(`${o.pages ? ` (p. ${o.pages})` : ""}. ${o.editeur}.`);
    } else {
      i(o.titre);
      t(`${traduit}. ${o.genre === "site" ? "" : o.editeur}${o.genre === "site" ? "" : "."}`);
    }
    if (o.url) t(` ${o.url}`);
    if (page) t(` (p. ${page})`);
    return m;
  }
  // Chicago et ISO 690 : auteur, titre, lieu : éditeur, année.
  if (a) t(`${a}. `);
  if (o.genre === "article") {
    t(`« ${o.titre} ». `);
    i(o.recueil);
    t(`${o.volume ? ` ${o.volume}` : ""}${o.annee ? ` (${o.annee})` : ""}${o.pages ? ` : ${o.pages}` : ""}${pageFin}.`);
  } else if (o.genre === "chapitre") {
    t(`« ${o.titre} ». Dans `);
    i(o.recueil);
    t(`${traduit}${edition ? `. ${edition}` : ""}${o.annee ? `, ${o.annee}` : ""}${o.pages ? `, p. ${o.pages}` : ""}${pageFin}.`);
  } else {
    i(o.titre);
    t(`${traduit}${edition ? `. ${edition}` : ""}${o.annee ? `, ${o.annee}` : ""}${pageFin}.`);
  }
  if (o.url) t(style === "iso690" ? ` Disponible sur : ${o.url}` : ` ${o.url}`);
  return m;
}

/** La même référence en texte simple (pour une note de bas de page). */
export function referenceTexte(o: Omit<Ouvrage, "id" | "q">, style: StyleCitation, page = ""): string {
  return referenceOuvrage(o, style, page)
    .map((x) => x.texte)
    .join("")
    .replace(/[ \t\n]+/g, " ")
    .trim();
}

/** La clé de tri d'une entrée : le nom du premier auteur, puis le titre. */
export function cleBibliographique(o: Pick<Ouvrage, "auteur" | "titre">): string {
  return `${o.auteur.split(";")[0].trim() || o.titre}\u0000${o.titre}`;
}
