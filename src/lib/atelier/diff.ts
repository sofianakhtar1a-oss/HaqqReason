/**
 * Le Calame — comparer deux versions d'un texte.
 *
 * D'abord paragraphe par paragraphe (rapide, même sur un long document), puis mot à
 * mot à l'intérieur des paragraphes qui ont changé. Algorithme de Myers (le plus
 * court script d'édition), sur des listes de jetons. Module pur.
 */

export type Morceau = { genre: "egal" | "ajout" | "retrait"; texte: string };
export type ParagrapheCompare = { genre: "egal" | "ajout" | "retrait" | "modifie"; morceaux: Morceau[] };

/** Script d'édition entre deux listes (égal / ajout / retrait), par l'algorithme de Myers. */
export function editions<T>(a: T[], b: T[], egal: (x: T, y: T) => boolean = (x, y) => x === y, max = 4000): { genre: Morceau["genre"]; a?: T; b?: T }[] {
  // Préfixe et suffixe communs : souvent l'essentiel du texte.
  let debut = 0;
  while (debut < a.length && debut < b.length && egal(a[debut], b[debut])) debut++;
  let finA = a.length;
  let finB = b.length;
  while (finA > debut && finB > debut && egal(a[finA - 1], b[finB - 1])) {
    finA--;
    finB--;
  }
  const sortie: { genre: Morceau["genre"]; a?: T; b?: T }[] = [];
  for (let i = 0; i < debut; i++) sortie.push({ genre: "egal", a: a[i], b: b[i] });
  const A = a.slice(debut, finA);
  const B = b.slice(debut, finB);
  const n = A.length;
  const m = B.length;
  const milieu: { genre: Morceau["genre"]; a?: T; b?: T }[] = [];
  if (n === 0) B.forEach((y) => milieu.push({ genre: "ajout", b: y }));
  else if (m === 0) A.forEach((x) => milieu.push({ genre: "retrait", a: x }));
  else {
    const limite = Math.min(n + m, max);
    const decalage = limite + 1;
    let v: Int32Array<ArrayBufferLike> = new Int32Array(2 * limite + 3);
    const traces: Int32Array<ArrayBufferLike>[] = [];
    let trouve = false;
    for (let d = 0; d <= limite && !trouve; d++) {
      traces.push(v.slice());
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[decalage + k - 1] < v[decalage + k + 1])) x = v[decalage + k + 1];
        else x = v[decalage + k - 1] + 1;
        let y = x - k;
        while (x < n && y < m && egal(A[x], B[y])) {
          x++;
          y++;
        }
        v[decalage + k] = x;
        if (x >= n && y >= m) {
          trouve = true;
          break;
        }
      }
    }
    if (!trouve) {
      // Trop différent pour un détail fin : tout l'ancien part, tout le nouveau arrive.
      A.forEach((x) => milieu.push({ genre: "retrait", a: x }));
      B.forEach((y) => milieu.push({ genre: "ajout", b: y }));
    } else {
      // Remontée des traces.
      let x = n;
      let y = m;
      const inverse: { genre: Morceau["genre"]; a?: T; b?: T }[] = [];
      for (let d = traces.length - 1; d > 0; d--) {
        v = traces[d];
        const k = x - y;
        const kPrec = k === -d || (k !== d && v[decalage + k - 1] < v[decalage + k + 1]) ? k + 1 : k - 1;
        const xPrec = v[decalage + kPrec];
        const yPrec = xPrec - kPrec;
        while (x > xPrec && y > yPrec) {
          inverse.push({ genre: "egal", a: A[x - 1], b: B[y - 1] });
          x--;
          y--;
        }
        if (x === xPrec) inverse.push({ genre: "ajout", b: B[y - 1] });
        else inverse.push({ genre: "retrait", a: A[x - 1] });
        x = xPrec;
        y = yPrec;
      }
      while (x > 0 && y > 0) {
        inverse.push({ genre: "egal", a: A[x - 1], b: B[y - 1] });
        x--;
        y--;
      }
      milieu.push(...inverse.reverse());
    }
  }
  sortie.push(...milieu);
  for (let i = 0; i < a.length - finA; i++) sortie.push({ genre: "egal", a: a[finA + i], b: b[finB + i] });
  return sortie;
}

/** Les mots et les espaces d'un texte, comme jetons (les espaces collent au mot qui les précède). */
export function jetons(texte: string): string[] {
  return texte.match(/\S+\s*|\s+/g) ?? [];
}

function fusionner(morceaux: Morceau[]): Morceau[] {
  const sortie: Morceau[] = [];
  for (const m of morceaux) {
    const dernier = sortie[sortie.length - 1];
    if (dernier && dernier.genre === m.genre) dernier.texte += m.texte;
    else if (m.texte) sortie.push({ ...m });
  }
  return sortie;
}

/** Différences mot à mot entre deux textes courts (un paragraphe). */
export function diffMots(avant: string, apres: string): Morceau[] {
  const r = editions(jetons(avant), jetons(apres), (x, y) => x.trim() === y.trim());
  return fusionner(r.map((e) => ({ genre: e.genre, texte: e.genre === "retrait" ? (e.a ?? "") : (e.b ?? "") })));
}

/** Compare deux textes découpés en paragraphes. */
export function comparerParagraphes(avant: string[], apres: string[]): ParagrapheCompare[] {
  const r = editions(avant, apres);
  const sortie: ParagrapheCompare[] = [];
  // Un retrait suivi d'un ajout = un paragraphe modifié : on le détaille mot à mot.
  for (let i = 0; i < r.length; i++) {
    const e = r[i];
    if (e.genre === "egal") sortie.push({ genre: "egal", morceaux: [{ genre: "egal", texte: e.a ?? "" }] });
    else if (e.genre === "retrait" && r[i + 1]?.genre === "ajout") {
      sortie.push({ genre: "modifie", morceaux: diffMots(e.a ?? "", r[i + 1].b ?? "") });
      i++;
    } else if (e.genre === "retrait") sortie.push({ genre: "retrait", morceaux: [{ genre: "retrait", texte: e.a ?? "" }] });
    else sortie.push({ genre: "ajout", morceaux: [{ genre: "ajout", texte: e.b ?? "" }] });
  }
  return sortie;
}

/** Combien de mots ajoutés et retirés entre deux versions. */
export function bilanDiff(paragraphes: ParagrapheCompare[]): { ajoutes: number; retires: number } {
  let ajoutes = 0;
  let retires = 0;
  for (const p of paragraphes) {
    for (const m of p.morceaux) {
      const n = (m.texte.match(/\S+/g) ?? []).length;
      if (m.genre === "ajout") ajoutes += n;
      if (m.genre === "retrait") retires += n;
    }
  }
  return { ajoutes, retires };
}
