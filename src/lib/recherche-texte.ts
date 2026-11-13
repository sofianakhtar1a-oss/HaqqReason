/**
 * Outils de recherche partagés entre le serveur et le navigateur.
 * La normalisation est la même que celle de la base (fonction SQL « normaliser ») :
 * sans accents, sans majuscules, et pour l'arabe sans voyelles ni tatweel, avec les variantes de lettres unifiées.
 */

const DIACRITIQUES_ARABES = /[ؐ-ًؚ-ٰٟـۖ-ۭ]/;
const LETTRES: Record<string, string> = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي" };

/** Forme normalisée d'un seul caractère (peut être vide). */
function normaliserCaractere(c: string): string {
  if (DIACRITIQUES_ARABES.test(c)) return "";
  if (LETTRES[c]) return LETTRES[c];
  if (c === "œ" || c === "Œ") return "oe";
  if (c === "æ" || c === "Æ") return "ae";
  return c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function normaliser(texte: string): string {
  let r = "";
  for (const c of texte) r += normaliserCaractere(c);
  return r;
}

/** Mots utiles d'une requête (sans opérateurs, guillemets ni mots exclus). */
export function motsDeRequete(requete: string): string[] {
  return normaliser(requete)
    .replace(/["()]/g, " ")
    .split(/\s+/)
    .filter((m) => m.length >= 2 && !m.startsWith("-") && m !== "ou" && m !== "or");
}

export type Segment = { texte: string; surligne: boolean };

/**
 * Extrait d'environ « longueur » caractères autour de la première correspondance,
 * avec les mots cherchés marqués. Travaille sur le texte d'origine (accents et voyelles conservés).
 */
export function extraitSurligne(texte: string, mots: string[], longueur = 260): Segment[] {
  if (!texte) return [];
  // Correspondance entre chaque caractère normalisé et sa position dans le texte d'origine.
  const caracteres = Array.from(texte);
  let norme = "";
  const origine: number[] = [];
  caracteres.forEach((c, i) => {
    for (const n of normaliserCaractere(c)) {
      norme += n;
      origine.push(i);
    }
  });

  // Une forme courte de chaque mot attrape aussi ses variantes (pluriel, féminin…).
  const racines = [...new Set(mots.map((m) => (m.length > 5 ? m.slice(0, m.length - 2) : m)))].filter(Boolean);
  const zones: [number, number][] = [];
  for (const r of racines) {
    let depart = norme.indexOf(r);
    while (depart >= 0) {
      let fin = depart + r.length;
      // On étend jusqu'à la fin du mot.
      while (fin < norme.length && /[\p{L}\p{N}]/u.test(norme[fin])) fin++;
      zones.push([origine[depart], origine[fin - 1] + 1]);
      depart = norme.indexOf(r, fin);
    }
  }
  zones.sort((a, b) => a[0] - b[0]);

  const premiere = zones[0]?.[0] ?? 0;
  let debut = Math.max(0, premiere - Math.floor(longueur / 3));
  let fin = Math.min(caracteres.length, debut + longueur);
  // Coupe proprement sur des espaces.
  if (debut > 0) {
    const espace = caracteres.indexOf(" ", debut);
    if (espace > 0 && espace < premiere) debut = espace + 1;
  }
  if (fin < caracteres.length) {
    const espace = caracteres.lastIndexOf(" ", fin);
    if (espace > debut + longueur / 2) fin = espace;
  }

  const segments: Segment[] = [];
  let curseur = debut;
  for (const [a, b] of zones) {
    if (b <= curseur || a >= fin) continue;
    const ia = Math.max(a, curseur);
    const ib = Math.min(b, fin);
    if (ia > curseur) segments.push({ texte: caracteres.slice(curseur, ia).join(""), surligne: false });
    segments.push({ texte: caracteres.slice(ia, ib).join(""), surligne: true });
    curseur = ib;
  }
  if (curseur < fin) segments.push({ texte: caracteres.slice(curseur, fin).join(""), surligne: false });
  if (debut > 0) segments.unshift({ texte: "… ", surligne: false });
  if (fin < caracteres.length) segments.push({ texte: " …", surligne: false });
  return segments.map((s) => ({ ...s, texte: s.texte.replace(/\s+/g, " ") }));
}
