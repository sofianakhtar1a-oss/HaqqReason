/*
 * Écrivain PDF : met en page le modèle intermédiaire sur des feuilles A4.
 * Titres, paragraphes, gras, italique, souligné, barré, listes (imbriquées), citations,
 * séparateurs, sauts de page et tableaux (dont l'en-tête se répète sur chaque page), numéros de page.
 *
 * Polices : celles intégrées à tout lecteur PDF (Helvetica), qui couvrent le français et les langues
 * latines. Les caractères qu'elles n'ont pas (arabe, par exemple) sont comptés et signalés :
 * jamais remplacés en silence.
 *
 * Fonctionne aussi dans Node : testé dans tests/test-logique.mts.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import { lignesDuTableau, morceaux, niveauTitre, type Morceau, type Noeud } from "./pm";

const A4 = { l: 595.28, h: 841.89 };
const MARGE = 56.7;
const LARGEUR = A4.l - 2 * MARGE;
const ENCRE = rgb(0.11, 0.13, 0.2);
const DOUX = rgb(0.42, 0.45, 0.56);
const OR = rgb(0.72, 0.57, 0.23);

type Polices = { r: PDFFont; b: PDFFont; i: PDFFont; bi: PDFFont };
type Jeton = { texte: string; police: PDFFont; taille: number; largeur: number; souligne: boolean; barre: boolean; decalage: number; espace: boolean; saut?: boolean };

/** Remplacements sûrs vers des caractères que les polices standard connaissent. */
const EQUIVALENTS: Record<string, string> = {
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  "​": "",
  "‑": "-",
  "−": "-",
  "ﬁ": "fi",
  "ﬂ": "fl",
  "′": "'",
  "″": '"',
};

export type ResultatPdf = { octets: Uint8Array; pages: number; caracteresAbsents: number };

export async function versPdf(doc: Noeud, titre: string): Promise<ResultatPdf> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titre);
  pdf.setLanguage("fr-FR");
  pdf.setProducer("HaqqReason — L'Alambic");
  pdf.setCreator("HaqqReason — L'Alambic");
  const p: Polices = {
    r: await pdf.embedFont(StandardFonts.Helvetica),
    b: await pdf.embedFont(StandardFonts.HelveticaBold),
    i: await pdf.embedFont(StandardFonts.HelveticaOblique),
    bi: await pdf.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  const connus = new Set(p.r.getCharacterSet());
  let absents = 0;
  const nettoyer = (t: string): string => {
    let s = "";
    for (const c of t) {
      const e = EQUIVALENTS[c];
      if (e !== undefined) s += e;
      else if (c === "\t") s += "    ";
      else if (connus.has(c.codePointAt(0)!)) s += c;
      else if (c.trim() === "") s += " ";
      else absents++;
    }
    return s;
  };

  let page: PDFPage = pdf.addPage([A4.l, A4.h]);
  let y = A4.h - MARGE;
  const nouvellePage = () => {
    page = pdf.addPage([A4.l, A4.h]);
    y = A4.h - MARGE;
  };
  const place = (hauteur: number) => {
    if (y - hauteur < MARGE) nouvellePage();
  };

  const police = (m: { gras: boolean; italique: boolean }, forceGras = false, forceItalique = false) => {
    const g = m.gras || forceGras;
    const i = m.italique || forceItalique;
    return g && i ? p.bi : g ? p.b : i ? p.i : p.r;
  };

  /** Transforme des morceaux en jetons mesurés (mots et espaces). */
  const jetons = (ms: Morceau[], taille: number, gras = false, italique = false): Jeton[] => {
    const sortie: Jeton[] = [];
    for (const m of ms) {
      if (m.saut) {
        sortie.push({ texte: "", police: p.r, taille, largeur: 0, souligne: false, barre: false, decalage: 0, espace: false, saut: true });
        continue;
      }
      const f = police(m, gras, italique);
      const t = m.exposant || m.indice ? taille * 0.7 : taille;
      const decalage = m.exposant ? taille * 0.33 : m.indice ? -taille * 0.15 : 0;
      for (const bout of nettoyer(m.texte).split(/( +)/)) {
        if (!bout) continue;
        const espace = /^ +$/.test(bout);
        sortie.push({ texte: espace ? " " : bout, police: f, taille: t, largeur: f.widthOfTextAtSize(espace ? " " : bout, t), souligne: m.souligne || Boolean(m.lien), barre: m.barre, decalage, espace });
      }
    }
    return sortie;
  };

  /** Coupe les jetons en lignes de largeur maximale ; un mot trop long est coupé lettre à lettre. */
  const lignes = (js: Jeton[], largeur: number): Jeton[][] => {
    const sortie: Jeton[][] = [];
    let ligne: Jeton[] = [];
    let l = 0;
    const pousser = () => {
      while (ligne.length && ligne[ligne.length - 1].espace) ligne.pop();
      sortie.push(ligne);
      ligne = [];
      l = 0;
    };
    for (const j of js) {
      if (j.saut) {
        pousser();
        continue;
      }
      if (j.espace) {
        if (ligne.length) {
          ligne.push(j);
          l += j.largeur;
        }
        continue;
      }
      if (l + j.largeur > largeur && ligne.length) pousser();
      if (j.largeur > largeur) {
        let reste = j.texte;
        while (reste) {
          let n = reste.length;
          while (n > 1 && j.police.widthOfTextAtSize(reste.slice(0, n), j.taille) > largeur - l) n--;
          const morceau = reste.slice(0, n);
          const w = j.police.widthOfTextAtSize(morceau, j.taille);
          ligne.push({ ...j, texte: morceau, largeur: w });
          l += w;
          reste = reste.slice(n);
          if (reste) pousser();
        }
        continue;
      }
      ligne.push(j);
      l += j.largeur;
    }
    if (ligne.length) pousser();
    return sortie;
  };

  const dessinerLigne = (cible: PDFPage, ligne: Jeton[], x: number, base: number, couleur = ENCRE) => {
    let cx = x;
    for (const j of ligne) {
      if (!j.espace) cible.drawText(j.texte, { x: cx, y: base + j.decalage, size: j.taille, font: j.police, color: couleur });
      if (j.souligne && !j.espace) cible.drawLine({ start: { x: cx, y: base - 1.6 }, end: { x: cx + j.largeur, y: base - 1.6 }, thickness: 0.6, color: couleur });
      if (j.barre && !j.espace) cible.drawLine({ start: { x: cx, y: base + j.taille * 0.3 }, end: { x: cx + j.largeur, y: base + j.taille * 0.3 }, thickness: 0.6, color: couleur });
      cx += j.largeur;
    }
  };

  /** Un paragraphe (ou titre) : chaque ligne passe à la page suivante si elle ne tient plus. */
  const paragraphe = (ms: Morceau[], o: { taille: number; interligne: number; x: number; largeur: number; avant: number; apres: number; gras?: boolean; italique?: boolean; marque?: string; barre?: boolean; couleur?: ReturnType<typeof rgb>; garderAvecSuivant?: boolean }) => {
    const ls = lignes(jetons(ms, o.taille, o.gras, o.italique), o.largeur);
    if (ls.length === 0) ls.push([]);
    const h = o.taille * o.interligne;
    y -= o.avant;
    // Un titre ne reste jamais seul en bas de page.
    place(h * (o.garderAvecSuivant ? 3 : 1));
    ls.forEach((ligne, k) => {
      if (k > 0) place(h);
      const base = y - o.taille;
      if (k === 0 && o.marque) page.drawText(nettoyer(o.marque), { x: o.x - 14, y: base, size: o.taille, font: p.r, color: o.couleur ?? ENCRE });
      if (o.barre) page.drawLine({ start: { x: o.x - 10, y: y + 1 }, end: { x: o.x - 10, y: y - h + 1 }, thickness: 1.6, color: OR });
      dessinerLigne(page, ligne, o.x, base, o.couleur);
      y -= h;
    });
    y -= o.apres;
  };

  const tableau = (n: Noeud, x: number, largeur: number) => {
    const ls = lignesDuTableau(n);
    const cols = Math.max(1, ...ls.map((l) => l.cellules.length));
    const lc = largeur / cols;
    const pad = 4;
    const taille = 9.5;
    const h = taille * 1.3;
    const preparer = (l: (typeof ls)[number]) => {
      const cellules = Array.from({ length: cols }, (_, i) => {
        const c = l.cellules[i];
        if (!c) return [] as Jeton[][];
        const contenu: Morceau[] = [];
        (c.content ?? []).forEach((b, k) => {
          if (k > 0) contenu.push({ texte: "\n", saut: true, gras: false, italique: false, souligne: false, barre: false, exposant: false, indice: false, lien: null });
          contenu.push(...morceaux(b));
        });
        return lignes(jetons(contenu, taille, l.entete || c.type === "tableHeader"), lc - 2 * pad);
      });
      return { cellules, hauteur: Math.max(1, ...cellules.map((c) => c.length)) * h + 2 * pad, entete: l.entete };
    };
    const rangees = ls.map(preparer);
    const entete = rangees[0]?.entete ? rangees[0] : null;
    const dessiner = (r: (typeof rangees)[number]) => {
      if (r.entete) page.drawRectangle({ x, y: y - r.hauteur, width: largeur, height: r.hauteur, color: rgb(0.95, 0.93, 0.88) });
      r.cellules.forEach((c, i) => {
        c.forEach((ligne, k) => dessinerLigne(page, ligne, x + i * lc + pad, y - pad - taille - k * h + 1.5));
        page.drawRectangle({ x: x + i * lc, y: y - r.hauteur, width: lc, height: r.hauteur, borderColor: rgb(0.78, 0.79, 0.84), borderWidth: 0.6 });
      });
      y -= r.hauteur;
    };
    y -= 6;
    rangees.forEach((r, k) => {
      if (y - r.hauteur < MARGE) {
        nouvellePage();
        if (entete && k > 0) dessiner(entete);
      }
      dessiner(r);
    });
    y -= 10;
  };

  const blocs = (noeuds: Noeud[], x: number, largeur: number, ctx: { italique?: boolean; barre?: boolean } = {}) => {
    for (const n of noeuds) {
      switch (n.type) {
        case "heading": {
          const niv = niveauTitre(n);
          const taille = [0, 19, 15, 12.5][niv];
          paragraphe(morceaux(n), { taille, interligne: 1.25, x, largeur, avant: [0, 16, 13, 10][niv], apres: 5, gras: true, garderAvecSuivant: true });
          break;
        }
        case "paragraph":
          paragraphe(morceaux(n), { taille: 11, interligne: 1.45, x, largeur, avant: 0, apres: 7, italique: ctx.italique, barre: ctx.barre });
          break;
        case "bulletList":
        case "taskList":
        case "orderedList":
          (n.content ?? []).forEach((li, k) => {
            const marque = n.type === "orderedList" ? `${k + 1}.` : "•";
            const enfants = li.content ?? [];
            enfants.forEach((e, j) => {
              if (j === 0 && e.type === "paragraph") paragraphe(morceaux(e), { taille: 11, interligne: 1.45, x: x + 18, largeur: largeur - 18, avant: 0, apres: 3, marque, italique: ctx.italique });
              else blocs([e], x + 18, largeur - 18, ctx);
            });
          });
          y -= 4;
          break;
        case "blockquote":
          blocs(n.content ?? [], x + 18, largeur - 18, { italique: true, barre: true });
          break;
        case "horizontalRule":
          place(16);
          y -= 8;
          page.drawLine({ start: { x: x + largeur * 0.35, y }, end: { x: x + largeur * 0.65, y }, thickness: 0.8, color: OR });
          y -= 10;
          break;
        case "sautPage":
          nouvellePage();
          break;
        case "table":
          tableau(n, x, largeur);
          break;
        default:
          if (n.content?.some((c) => c.type === "text")) paragraphe(morceaux(n), { taille: 11, interligne: 1.45, x, largeur, avant: 0, apres: 7 });
          else blocs(n.content ?? [], x, largeur, ctx);
      }
    }
  };

  blocs(doc.content ?? [], MARGE, LARGEUR);

  const total = pdf.getPageCount();
  pdf.getPages().forEach((pg, i) => {
    const t = `${i + 1} / ${total}`;
    pg.drawText(t, { x: (A4.l - p.r.widthOfTextAtSize(t, 8.5)) / 2, y: MARGE / 2, size: 8.5, font: p.r, color: DOUX });
  });

  return { octets: await pdf.save(), pages: total, caracteresAbsents: absents };
}
