/**
 * Le Calame — chercher dans un texte.
 *
 * Fonctions pures : on leur donne un document ProseMirror (ou son JSON), elles
 * rendent les endroits trouvés. La recherche se fait bloc de texte par bloc de
 * texte (un paragraphe, un titre, une ligne de verset) ; elle peut ignorer la casse,
 * les accents (et, pour l'arabe, les voyelles brèves), et ne garder que les mots entiers.
 */

import type { Node as NoeudPM } from "@tiptap/pm/model";

export type OptionsRecherche = { casse: boolean; accents: boolean; motEntier: boolean };
export const OPTIONS_PAR_DEFAUT: OptionsRecherche = { casse: false, accents: false, motEntier: false };
export type Trouvaille = { from: number; to: number };

/** Signes diacritiques latins et voyelles brèves arabes (tachkil), qu'une recherche « sans accents » ignore. */
const DIACRITIQUE = /[̀-ًͯ-ٰٟۖ-ۭ]/;
const LETTRE = /[\p{L}\p{N}_]/u;
/** Un caractère qu'aucune recherche ne doit traverser (note, image dans la ligne, saut de ligne). */
const MUR = "\u0000";

/** Plie un caractère selon les options : "" s'il doit être ignoré. */
export function plier(c: string, o: OptionsRecherche): string {
  let x = c;
  if (!o.accents) {
    if (DIACRITIQUE.test(x)) return "";
    const decompose = x.normalize("NFD");
    let base = "";
    for (const ch of decompose) if (!DIACRITIQUE.test(ch)) base += ch;
    x = base || x;
    // Ligatures et lettres que l'on tape souvent sans leur forme exacte.
    if (x === "œ" || x === "Œ") x = x === "œ" ? "oe" : "OE";
    if (x === "æ" || x === "Æ") x = x === "æ" ? "ae" : "AE";
    if (x === "’" || x === "ʼ") x = "'";
    if (x === " " || x === " ") x = " ";
    // Alif avec hamza ou madda : la même lettre pour une recherche sans voyelles.
    if (/[آأإٱ]/.test(x)) x = "ا";
  }
  if (!o.casse) x = x.toLowerCase();
  return x;
}

/** Plie une requête entière (même règle que pour le texte). */
export function plierTexte(texte: string, o: OptionsRecherche): string {
  let sortie = "";
  for (const c of texte) sortie += plier(c, o);
  return sortie;
}

type TexteIndexe = { texte: string; debuts: number[]; fins: number[] };

/** Le texte plié d'un bloc, avec, pour chaque caractère plié, sa position dans le document. */
function indexerBloc(bloc: NoeudPM, debutContenu: number, o: OptionsRecherche): TexteIndexe {
  let texte = "";
  const debuts: number[] = [];
  const fins: number[] = [];
  bloc.forEach((enfant, decalage) => {
    const pos = debutContenu + decalage;
    if (enfant.isText) {
      const brut = enfant.text ?? "";
      let i = 0;
      for (const c of brut) {
        const plie = plier(c, o);
        for (const p of plie) {
          texte += p;
          debuts.push(pos + i);
          fins.push(pos + i + c.length);
        }
        i += c.length;
      }
    } else {
      texte += MUR;
      debuts.push(pos);
      fins.push(pos + enfant.nodeSize);
    }
  });
  return { texte, debuts, fins };
}

/** Tous les endroits où la requête apparaît, dans l'ordre du texte (5 000 au plus). */
export function chercher(doc: NoeudPM, requete: string, o: OptionsRecherche = OPTIONS_PAR_DEFAUT, max = 5000): Trouvaille[] {
  const aiguille = plierTexte(requete, o);
  if (!aiguille || aiguille.includes(MUR)) return [];
  const trouvees: Trouvaille[] = [];
  doc.descendants((noeud, pos) => {
    if (trouvees.length >= max) return false;
    if (!noeud.isTextblock) return true;
    const { texte, debuts, fins } = indexerBloc(noeud, pos + 1, o);
    let depart = 0;
    while (trouvees.length < max) {
      const i = texte.indexOf(aiguille, depart);
      if (i < 0) break;
      const j = i + aiguille.length;
      const avant = i > 0 ? texte[i - 1] : "";
      const apres = j < texte.length ? texte[j] : "";
      const entier = !o.motEntier || ((!avant || !LETTRE.test(avant)) && (!apres || !LETTRE.test(apres)));
      if (entier) trouvees.push({ from: debuts[i], to: fins[j - 1] });
      depart = i + 1;
    }
    return false;
  });
  return trouvees;
}

/** La trouvaille à montrer en premier : celle qui suit la position du curseur. */
export function premiereApres(trouvailles: Trouvaille[], position: number): number {
  const i = trouvailles.findIndex((t) => t.from >= position);
  return i >= 0 ? i : 0;
}

/**
 * Le texte de remplacement, avec la majuscule initiale du texte trouvé quand la
 * recherche ignore la casse (« Dieu » remplacé par « allah » donne « Allah »).
 */
export function adapterCasse(trouve: string, remplacement: string, o: OptionsRecherche): string {
  if (o.casse || !remplacement) return remplacement;
  const premiere = [...trouve][0] ?? "";
  if (premiere && premiere !== premiere.toLowerCase() && premiere === premiere.toUpperCase()) {
    const tout = trouve.length > 1 && trouve === trouve.toUpperCase();
    if (tout) return remplacement.toUpperCase();
    return remplacement.charAt(0).toUpperCase() + remplacement.slice(1);
  }
  return remplacement;
}

/* ---------- Le même travail sur un document JSON (recherche dans tous les documents) ---------- */

type NoeudJSON = { type?: string; text?: string; content?: NoeudJSON[] };

/** Les blocs de texte d'un document JSON, à plat, dans l'ordre. */
export function blocsDeTexte(contenu: unknown): string[] {
  const blocs: string[] = [];
  const visiter = (n: NoeudJSON | undefined, profondeur: number) => {
    if (!n || typeof n !== "object" || profondeur > 60) return;
    const enfants = Array.isArray(n.content) ? n.content : [];
    const textuel = enfants.length > 0 && enfants.every((e) => e && (e.type === "text" || e.type === "hardBreak" || !Array.isArray(e.content)));
    if (textuel && enfants.some((e) => e.type === "text")) {
      blocs.push(enfants.map((e) => (e.type === "text" ? (e.text ?? "") : " ")).join(""));
      return;
    }
    for (const e of enfants) visiter(e, profondeur + 1);
  };
  visiter(contenu as NoeudJSON, 0);
  return blocs;
}

export type Extrait = { avant: string; trouve: string; apres: string };

/** Les passages d'un document qui contiennent la requête, avec un peu de contexte autour (3 au plus). */
export function extraits(contenu: unknown, requete: string, o: OptionsRecherche = OPTIONS_PAR_DEFAUT, max = 3): { total: number; extraits: Extrait[] } {
  const aiguille = plierTexte(requete, o);
  if (!aiguille) return { total: 0, extraits: [] };
  let total = 0;
  const liste: Extrait[] = [];
  for (const bloc of blocsDeTexte(contenu)) {
    // Plier caractère par caractère en gardant l'index d'origine.
    let plie = "";
    const origine: number[] = [];
    let i = 0;
    for (const c of bloc) {
      for (const p of plier(c, o)) {
        plie += p;
        origine.push(i);
      }
      i += c.length;
    }
    let depart = 0;
    for (;;) {
      const k = plie.indexOf(aiguille, depart);
      if (k < 0) break;
      const fin = k + aiguille.length;
      const avantC = k > 0 ? plie[k - 1] : "";
      const apresC = fin < plie.length ? plie[fin] : "";
      const entier = !o.motEntier || ((!avantC || !LETTRE.test(avantC)) && (!apresC || !LETTRE.test(apresC)));
      depart = k + 1;
      if (!entier) continue;
      total++;
      if (liste.length < max) {
        const a = origine[k];
        const b = fin - 1 < origine.length ? origine[fin - 1] + 1 : bloc.length;
        const debutContexte = Math.max(0, a - 50);
        const finContexte = Math.min(bloc.length, b + 70);
        liste.push({
          avant: (debutContexte > 0 ? "…" : "") + bloc.slice(debutContexte, a),
          trouve: bloc.slice(a, b),
          apres: bloc.slice(b, finContexte) + (finContexte < bloc.length ? "…" : ""),
        });
      }
    }
  }
  return { total, extraits: liste };
}
