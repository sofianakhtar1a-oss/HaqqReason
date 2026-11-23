"use client";

/*
 * « Rassembler » : la liste des documents et leur lecture, gardées hors du composant. On peut ainsi
 * passer à un autre outil de L'Alambic pendant que la lecture continue, puis revenir la trouver finie.
 * Un document à la fois (les images d'affilée ensemble : la reconnaissance ne se charge qu'une fois).
 */
import { useSyncExternalStore } from "react";
import type { LangueOcr } from "@/lib/alambic/navigateur/ocr";
import { aIgnorer, cleFichier, compterMots, genreDe, type GenreLecture, ordreNaturel, texteRassemble } from "@/lib/alambic/rassemblement";
import { utiliser } from "@/lib/client/premium";

export type EtatPiece = "attente" | "lecture" | "pret" | "vide" | "erreur" | "reserve" | "deballee";

export type Piece = {
  id: number;
  fichier: File;
  /** Le nom affiché : avec son dossier quand il vient d'un dossier ou d'une archive. */
  nom: string;
  cle: string;
  format: string | null;
  genre: GenreLecture | null;
  etat: EtatPiece;
  etape?: string;
  avancement?: number | null;
  texte?: string;
  mots?: number;
  via?: "texte" | "reconnaissance" | "transcription";
  note?: string;
  erreur?: string;
};

export type Rassemblement = {
  pieces: Piece[];
  /** Ce rassemblement a été compté (offre Premium) : on peut y ajouter des documents sans recompter. */
  compte: boolean;
  /** La fenêtre Premium a répondu non : la lecture attend. */
  refuse: boolean;
  /** La lecture tourne. */
  marche: boolean;
  langues: LangueOcr[];
  titres: boolean;
};

export const PIECES_MAX = 500;

let etat: Rassemblement = { pieces: [], compte: false, refuse: false, marche: false, langues: ["fra", "eng"], titres: true };
const abonnes = new Set<() => void>();
let prochainId = 1;

function changer(f: (e: Rassemblement) => Rassemblement) {
  etat = f(etat);
  abonnes.forEach((a) => a());
}
const maj = (id: number, m: Partial<Piece>) => changer((e) => ({ ...e, pieces: e.pieces.map((p) => (p.id === id ? { ...p, ...m } : p)) }));

export function useRassemblement(): Rassemblement {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
    () => etat,
  );
}

/* ---------- Ajouter, ranger, retirer ---------- */

export type Bilan = { ajoutes: number; ignores: number; doublons: number; trop: number };

/** Ajoute des fichiers (choisis, déposés, collés ou venus d'un dossier), rangés par nom, sans doublon. */
export async function ajouter(entrants: { fichier: File; chemin?: string }[]): Promise<Bilan> {
  const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
  const connus = new Set(etat.pieces.map((p) => p.cle));
  const bilan: Bilan = { ajoutes: 0, ignores: 0, doublons: 0, trop: 0 };
  const nouvelles: Piece[] = [];
  const tries = [...entrants].sort((a, b) => ordreNaturel(a.chemin || a.fichier.name, b.chemin || b.fichier.name));
  for (const { fichier, chemin } of tries) {
    const nom = chemin || fichier.name;
    if (aIgnorer(nom) || fichier.size === 0) {
      bilan.ignores++;
      continue;
    }
    const cle = cleFichier(fichier, chemin);
    if (connus.has(cle)) {
      bilan.doublons++;
      continue;
    }
    if (etat.pieces.length + nouvelles.length >= PIECES_MAX) {
      bilan.trop++;
      continue;
    }
    connus.add(cle);
    const format = await reconnaitre(fichier).catch(() => null);
    nouvelles.push({ id: prochainId++, fichier, nom, cle, format, genre: genreDe(format, fichier.name), etat: "attente" });
    bilan.ajoutes++;
  }
  if (nouvelles.length) {
    changer((e) => ({ ...e, pieces: [...e.pieces, ...nouvelles] }));
    void lancer();
  }
  return bilan;
}

const controleurs = new Map<number, AbortController>();

export function retirer(id: number) {
  controleurs.get(id)?.abort();
  changer((e) => ({ ...e, pieces: e.pieces.filter((p) => p.id !== id) }));
}

export function deplacer(id: number, sens: -1 | 1) {
  changer((e) => {
    const i = e.pieces.findIndex((p) => p.id === id);
    const j = i + sens;
    if (i < 0 || j < 0 || j >= e.pieces.length) return e;
    const pieces = [...e.pieces];
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    return { ...e, pieces };
  });
}

export function trierParNom() {
  changer((e) => ({ ...e, pieces: [...e.pieces].sort((a, b) => ordreNaturel(a.nom, b.nom)) }));
}

/** Tout effacer : un nouveau rassemblement commence (il sera compté à nouveau). */
export function vider() {
  arreter();
  changer((e) => ({ ...e, pieces: [], compte: false, refuse: false }));
}

export function reessayer(id: number) {
  maj(id, { etat: "attente", erreur: undefined, note: undefined, etape: undefined, avancement: undefined });
  void lancer();
}

export function choisirLangues(langues: LangueOcr[]) {
  changer((e) => ({ ...e, langues: langues.length ? langues : ["fra"] }));
}

export function choisirTitres(titres: boolean) {
  changer((e) => ({ ...e, titres }));
}

/* ---------- Le texte rassemblé ---------- */

export function texteComplet(e: Rassemblement): { texte: string; documents: number; mots: number; restants: number } {
  const prets = e.pieces.filter((p) => p.etat === "pret" && p.texte);
  const texte = texteRassemble(
    prets.map((p) => ({ nom: p.nom, texte: p.texte ?? "" })),
    e.titres,
  );
  return { texte, documents: prets.length, mots: prets.reduce((s, p) => s + (p.mots ?? 0), 0), restants: e.pieces.filter((p) => p.etat === "attente" || p.etat === "lecture").length };
}

/* ---------- La lecture, un document après l'autre ---------- */

let enMarche = false;
let arret = false;

/** Arrête la lecture en cours : ce qui n'est pas fini repasse « en attente ». */
export function arreter() {
  arret = true;
  controleurs.forEach((c) => c.abort());
}

/** Reprend (ou lance) la lecture de ce qui attend. */
export function lancer(): Promise<void> {
  arret = false;
  return boucle();
}

async function boucle() {
  if (enMarche) return;
  enMarche = true;
  changer((e) => ({ ...e, marche: true }));
  try {
    for (;;) {
      if (arret) break;
      const suivante = etat.pieces.find((p) => p.etat === "attente");
      if (!suivante) break;
      if (!etat.compte) {
        // L'offre Premium : un rassemblement compte une fois, quel que soit le nombre de documents.
        if (!(await utiliser("alambic.rassembler"))) {
          changer((e) => ({ ...e, refuse: true }));
          break;
        }
        changer((e) => ({ ...e, compte: true, refuse: false }));
      }
      if (suivante.genre === "archive") await deballerPiece(suivante);
      else if (suivante.genre === "image") await lireImages();
      else await lirePiece(suivante);
    }
  } finally {
    enMarche = false;
    changer((e) => ({ ...e, marche: false }));
  }
}

/** Un suivi d'avancement qui ne redessine pas la page plus de dix fois par seconde. */
function suivi(ids: number[]) {
  let dernier = 0;
  return (avancement: number | null, etape: string) => {
    const t = performance.now();
    if (t - dernier < 100 && avancement !== null && avancement < 1) return;
    dernier = t;
    changer((e) => ({ ...e, pieces: e.pieces.map((p) => (ids.includes(p.id) && p.etat === "lecture" ? { ...p, avancement, etape } : p)) }));
  };
}

const lu = (texte: string): Partial<Piece> => (texte.trim() ? { etat: "pret", texte, mots: compterMots(texte), etape: undefined, avancement: undefined } : { etat: "vide", texte: "", mots: 0, etape: undefined, avancement: undefined });

async function lirePiece(p: Piece) {
  const { lireTexte, messageLecture } = await import("@/lib/alambic/navigateur/rassembler");
  if (p.genre === "media" && !(await utiliser("alambic.transcrire"))) {
    // La transcription garde son propre compteur : sans essai restant, ce document attend Premium.
    maj(p.id, { etat: "reserve", erreur: "La transcription fait partie de l'accès Premium (ou tes essais de la période sont utilisés)." });
    return;
  }
  const c = new AbortController();
  controleurs.set(p.id, c);
  maj(p.id, { etat: "lecture", etape: "Préparation", avancement: null, erreur: undefined });
  try {
    const r = await lireTexte(p.fichier, p.genre, p.format, etat.langues, suivi([p.id]), c.signal);
    maj(p.id, { ...lu(r.texte), via: r.via, note: r.note });
  } catch (e) {
    if (c.signal.aborted) maj(p.id, { etat: "attente", etape: undefined, avancement: undefined });
    else maj(p.id, { etat: "erreur", erreur: messageLecture(e), etape: undefined, avancement: undefined });
  } finally {
    controleurs.delete(p.id);
  }
}

/** Les images qui attendent, lues ensemble (vingt au plus d'un coup). */
async function lireImages() {
  const { reconnaitreImages, messageLecture } = await import("@/lib/alambic/navigateur/rassembler");
  const lot = etat.pieces.filter((p) => p.etat === "attente" && p.genre === "image").slice(0, 20);
  const ids = lot.map((p) => p.id);
  const c = new AbortController();
  ids.forEach((id) => controleurs.set(id, c));
  changer((e) => ({ ...e, pieces: e.pieces.map((p) => (ids.includes(p.id) ? { ...p, etat: "lecture", etape: "Reconnaissance du texte", avancement: null } : p)) }));
  try {
    const lues = await reconnaitreImages(
      lot.map((p) => ({ fichier: p.fichier, format: p.format ?? "png" })),
      etat.langues,
      suivi(ids),
      c.signal,
    );
    lot.forEach((p, i) => {
      if (etat.pieces.some((x) => x.id === p.id)) maj(p.id, { ...lu(lues[i]?.texte ?? ""), via: "reconnaissance", note: "Texte reconnu dans une image : relis les noms propres et les chiffres." });
    });
  } catch (e) {
    const message = messageLecture(e);
    changer((x) => ({
      ...x,
      pieces: x.pieces.map((p) => (ids.includes(p.id) && p.etat === "lecture" ? { ...p, ...(c.signal.aborted ? { etat: "attente" as const } : { etat: "erreur" as const, erreur: message }), etape: undefined, avancement: undefined } : p)),
    }));
  } finally {
    ids.forEach((id) => controleurs.delete(id));
  }
}

/** Une archive : ses fichiers prennent sa place dans la liste. */
async function deballerPiece(p: Piece) {
  const { deballer, messageLecture } = await import("@/lib/alambic/navigateur/rassembler");
  const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
  maj(p.id, { etat: "lecture", etape: "Ouverture de l'archive", avancement: null });
  try {
    const fichiers = (await deballer(p.fichier, p.format ?? "zip")).sort((a, b) => ordreNaturel(a.name, b.name));
    const connus = new Set(etat.pieces.map((x) => x.cle));
    const nouvelles: Piece[] = [];
    for (const f of fichiers) {
      const nom = `${p.nom} › ${f.name}`;
      const cle = cleFichier(f, nom);
      if (aIgnorer(f.name) || connus.has(cle) || etat.pieces.length + nouvelles.length >= PIECES_MAX) continue;
      connus.add(cle);
      const format = await reconnaitre(f).catch(() => null);
      nouvelles.push({ id: prochainId++, fichier: f, nom, cle, format, genre: genreDe(format, f.name), etat: "attente" });
    }
    changer((e) => {
      const i = e.pieces.findIndex((x) => x.id === p.id);
      if (i < 0) return e;
      const pieces = [...e.pieces];
      pieces.splice(i, 1, { ...pieces[i], etat: "deballee", etape: undefined, avancement: undefined, note: `${nouvelles.length} fichier${nouvelles.length > 1 ? "s" : ""} sorti${nouvelles.length > 1 ? "s" : ""} de l'archive, juste en dessous.` }, ...nouvelles);
      return { ...e, pieces };
    });
  } catch (e) {
    maj(p.id, { etat: "erreur", erreur: messageLecture(e), etape: undefined, avancement: undefined });
  }
}
