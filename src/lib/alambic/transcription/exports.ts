/* Exports : texte propre, sous-titres SRT et WebVTT. Code pur, testé à part. */
import type { Noeud } from "../pm";
import { type Mot, type Phrase, type Transcription, texteDe } from "./types";

const MAX_LIGNE = 42;
const MAX_REPLIQUE = MAX_LIGNE * 2;
const MAX_DUREE = 7;

type Replique = { d: number; f: number; texte: string };

/** Découpe une phrase longue en répliques lisibles (2 lignes de 42 signes, 7 secondes au plus). */
function repliques(p: Phrase): Replique[] {
  const sortie: Replique[] = [];
  let groupe: Mot[] = [];
  const longueur = (g: Mot[]) => g.reduce((s, m) => s + m.t.length + 1, -1);
  for (const m of p.mots) {
    const essai = [...groupe, m];
    if (groupe.length && (longueur(essai) > MAX_REPLIQUE || m.f - groupe[0].d > MAX_DUREE)) {
      sortie.push({ d: groupe[0].d, f: groupe[groupe.length - 1].f, texte: enLignes(groupe.map((x) => x.t)) });
      groupe = [m];
    } else groupe = essai;
  }
  if (groupe.length) sortie.push({ d: groupe[0].d, f: groupe[groupe.length - 1].f, texte: enLignes(groupe.map((x) => x.t)) });
  return sortie;
}

/** Répartit les mots sur une ou deux lignes équilibrées. */
function enLignes(mots: string[]): string {
  const texte = mots.join(" ");
  if (texte.length <= MAX_LIGNE) return texte;
  let meilleur = 1;
  let ecart = Number.POSITIVE_INFINITY;
  for (let i = 1; i < mots.length; i++) {
    const a = mots.slice(0, i).join(" ").length;
    const b = mots.slice(i).join(" ").length;
    const e = Math.abs(a - b) + (a > MAX_LIGNE || b > MAX_LIGNE ? 100 : 0);
    if (e < ecart) {
      ecart = e;
      meilleur = i;
    }
  }
  return `${mots.slice(0, meilleur).join(" ")}\n${mots.slice(meilleur).join(" ")}`;
}

function toutesRepliques(phrases: Phrase[]): Replique[] {
  const liste = phrases.flatMap(repliques);
  // Une réplique reste au moins une seconde à l'écran, sans jamais chevaucher la suivante.
  return liste.map((r, i) => {
    const suivante = liste[i + 1]?.d ?? Number.POSITIVE_INFINITY;
    const fin = Math.min(Math.max(r.f + 0.4, r.d + 1), suivante - 0.04);
    return { ...r, f: Math.max(fin, r.d + 0.3) };
  });
}

function horodatage(t: number, separateur: "," | "."): string {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const deux = (x: number) => String(x).padStart(2, "0");
  return `${deux(h)}:${deux(m)}:${deux(s)}${separateur}${String(r).padStart(3, "0")}`;
}

export function versSrt(phrases: Phrase[]): string {
  return toutesRepliques(phrases)
    .map((r, i) => `${i + 1}\n${horodatage(r.d, ",")} --> ${horodatage(r.f, ",")}\n${r.texte}\n`)
    .join("\n");
}

export function versVtt(phrases: Phrase[], langue: string): string {
  const corps = toutesRepliques(phrases)
    .map((r) => `${horodatage(r.d, ".")} --> ${horodatage(r.f, ".")}\n${r.texte}\n`)
    .join("\n");
  return `WEBVTT\nLanguage: ${langue}\n\n${corps}`;
}

/** Texte propre, un paragraphe par bloc. Avec la traduction en regard si on la demande. */
export function versTexte(t: Pick<Transcription, "titre" | "phrases" | "traductions">, avecTraduction = false): string {
  const paragraphes = new Map<number, Phrase[]>();
  for (const p of t.phrases) paragraphes.set(p.paragraphe, [...(paragraphes.get(p.paragraphe) ?? []), p]);
  const blocs = [...paragraphes.values()].map((ps) => {
    const original = ps.map(texteDe).join(" ");
    if (!avecTraduction) return original;
    const fr = ps.map((p) => t.traductions[p.id]).filter(Boolean).join(" ");
    return fr ? `${original}\n\n— ${fr}` : original;
  });
  return `${t.titre}\n\n${blocs.join("\n\n")}\n`;
}

export function dureeLisible(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** La transcription en document (Word, PDF, livre numérique…) : un titre, puis les paragraphes ; la traduction en italique sous chacun. */
export function versDocument(t: Pick<Transcription, "titre" | "phrases" | "traductions">, avecTraduction = false): Noeud {
  const paragraphes = new Map<number, Phrase[]>();
  for (const p of t.phrases) paragraphes.set(p.paragraphe, [...(paragraphes.get(p.paragraphe) ?? []), p]);
  const content: Noeud[] = [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t.titre || "Transcription" }] }];
  for (const ps of paragraphes.values()) {
    const original = ps.map(texteDe).join(" ").trim();
    if (original) content.push({ type: "paragraph", content: [{ type: "text", text: original }] });
    if (avecTraduction) {
      const fr = ps
        .map((p) => t.traductions[p.id])
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fr) content.push({ type: "paragraph", content: [{ type: "text", text: fr, marks: [{ type: "italic" }] }] });
    }
  }
  return { type: "doc", content };
}
