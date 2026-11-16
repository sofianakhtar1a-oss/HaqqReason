/*
 * Archives TAR (format ustar, compris par tous les systèmes) et lecture du RTF.
 * Pur : testé dans tests/test-logique.mts.
 */

export type Entree = { nom: string; octets: Uint8Array; date?: Date };

const enc = new TextEncoder();

function ecrireChamp(tampon: Uint8Array, debut: number, longueur: number, texte: string) {
  const o = enc.encode(texte);
  tampon.set(o.slice(0, longueur), debut);
}
function octal(n: number, longueur: number): string {
  return n.toString(8).padStart(longueur - 1, "0") + "\0";
}

function entete(nom: string, taille: number, type: string, mtime: number): Uint8Array {
  const h = new Uint8Array(512);
  let prefixe = "";
  let court = nom;
  if (enc.encode(nom).length > 100) {
    // ustar : chemin long coupé en « préfixe / nom » sur une barre oblique.
    const k = nom.lastIndexOf("/", 155);
    if (k > 0 && enc.encode(nom.slice(k + 1)).length <= 100) {
      prefixe = nom.slice(0, k);
      court = nom.slice(k + 1);
    }
  }
  ecrireChamp(h, 0, 100, court);
  ecrireChamp(h, 100, 8, octal(type === "5" ? 0o755 : 0o644, 8));
  ecrireChamp(h, 108, 8, octal(0, 8));
  ecrireChamp(h, 116, 8, octal(0, 8));
  ecrireChamp(h, 124, 12, octal(taille, 12));
  ecrireChamp(h, 136, 12, octal(mtime, 12));
  ecrireChamp(h, 148, 8, "        ");
  ecrireChamp(h, 156, 1, type);
  ecrireChamp(h, 257, 6, "ustar\0");
  ecrireChamp(h, 263, 2, "00");
  ecrireChamp(h, 345, 155, prefixe);
  let somme = 0;
  for (const b of h) somme += b;
  ecrireChamp(h, 148, 8, somme.toString(8).padStart(6, "0") + "\0 ");
  return h;
}

export function ecrireTar(entrees: Entree[]): Uint8Array {
  const morceaux: Uint8Array[] = [];
  for (const e of entrees) {
    const mtime = Math.floor((e.date?.getTime() ?? Date.now()) / 1000);
    const octetsNom = enc.encode(e.nom);
    if (octetsNom.length > 100 && !(e.nom.lastIndexOf("/", 155) > 0 && enc.encode(e.nom.slice(e.nom.lastIndexOf("/", 155) + 1)).length <= 100)) {
      // Nom vraiment long : extension GNU « LongLink », lue par tar, 7-Zip et WinRAR.
      const donnees = new Uint8Array([...octetsNom, 0]);
      morceaux.push(entete("././@LongLink", donnees.length, "L", mtime), donnees, new Uint8Array((512 - (donnees.length % 512)) % 512));
    }
    morceaux.push(entete(e.nom, e.octets.length, "0", mtime), e.octets, new Uint8Array((512 - (e.octets.length % 512)) % 512));
  }
  morceaux.push(new Uint8Array(1024));
  const total = morceaux.reduce((s, m) => s + m.length, 0);
  const sortie = new Uint8Array(total);
  let p = 0;
  for (const m of morceaux) {
    sortie.set(m, p);
    p += m.length;
  }
  return sortie;
}

export function lireTar(octets: Uint8Array): Entree[] {
  const dec = new TextDecoder();
  const lire = (debut: number, longueur: number) => dec.decode(octets.subarray(debut, debut + longueur)).replace(/\0[\s\S]*$/, "");
  const sortie: Entree[] = [];
  let p = 0;
  let nomLong: string | null = null;
  while (p + 512 <= octets.length) {
    const h = octets.subarray(p, p + 512);
    if (h.every((b) => b === 0)) break;
    const taille = parseInt(lire(p + 124, 12).trim() || "0", 8);
    const type = lire(p + 156, 1);
    const prefixe = lire(p + 345, 155);
    const nom = nomLong ?? (prefixe ? `${prefixe}/${lire(p, 100)}` : lire(p, 100));
    const mtime = parseInt(lire(p + 136, 12).trim() || "0", 8);
    const donnees = octets.subarray(p + 512, p + 512 + taille);
    p += 512 + Math.ceil(taille / 512) * 512;
    if (type === "L") {
      nomLong = dec.decode(donnees).replace(/\0[\s\S]*$/, "");
      continue;
    }
    if (type === "x") {
      // En-tête PAX : on n'en garde que le chemin.
      const chemin = /\d+ path=([^\n]*)\n/.exec(dec.decode(donnees))?.[1];
      nomLong = chemin ?? null;
      continue;
    }
    nomLong = null;
    if (type === "0" || type === "" || type === "\0" || type === "7") sortie.push({ nom, octets: donnees.slice(), date: mtime ? new Date(mtime * 1000) : undefined });
  }
  return sortie;
}

/* ---------------------------------------------------------------- RTF ---- */

const CP1252: Record<number, number> = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030, 0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178 };

const IGNORES = new Set(["fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer", "headerl", "headerr", "headerf", "footerl", "footerr", "footerf", "listtable", "listoverridetable", "themedata", "colorschememapping", "datastore", "latentstyles", "xmlnstbl", "rsidtbl", "generator", "mmathPr", "object", "fldinst", "filetbl", "revtbl", "pgdsctbl", "shppict", "nonshppict", "bkmkstart", "bkmkend", "footnote"]);

const echapperHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** RTF → HTML simple : paragraphes, gras, italique, souligné, barré, retours à la ligne. */
export function rtfVersHtml(rtf: string): string {
  type Etat = { b: boolean; i: boolean; u: boolean; s: boolean; ignorer: boolean; uc: number };
  const pile: Etat[] = [];
  let etat: Etat = { b: false, i: false, u: false, s: false, ignorer: false, uc: 1 };
  const paragraphes: string[] = [];
  let courant = "";
  let aSauter = 0;
  const ajouter = (t: string) => {
    if (etat.ignorer || !t) return;
    let h = echapperHtml(t);
    if (etat.s) h = `<s>${h}</s>`;
    if (etat.u) h = `<u>${h}</u>`;
    if (etat.i) h = `<em>${h}</em>`;
    if (etat.b) h = `<strong>${h}</strong>`;
    courant += h;
  };
  const finParagraphe = () => {
    paragraphes.push(courant.replace(/<\/(strong|em|u|s)><\1>/g, ""));
    courant = "";
  };

  let i = 0;
  const n = rtf.length;
  while (i < n) {
    const c = rtf[i];
    if (c === "{") {
      pile.push({ ...etat });
      i++;
      if (rtf.startsWith("\\*", i)) etat.ignorer = true;
      continue;
    }
    if (c === "}") {
      etat = pile.pop() ?? etat;
      i++;
      continue;
    }
    if (c === "\\") {
      const suivant = rtf[i + 1];
      if (suivant === "\\" || suivant === "{" || suivant === "}") {
        if (aSauter > 0) aSauter--;
        else ajouter(suivant);
        i += 2;
        continue;
      }
      if (suivant === "'") {
        const code = parseInt(rtf.slice(i + 2, i + 4), 16);
        if (aSauter > 0) aSauter--;
        else ajouter(String.fromCharCode(CP1252[code] ?? code));
        i += 4;
        continue;
      }
      if (suivant === "~") {
        ajouter("\u00a0");
        i += 2;
        continue;
      }
      if (suivant === "-" || suivant === "_") {
        i += 2;
        continue;
      }
      if (suivant === "\n" || suivant === "\r") {
        finParagraphe();
        i += 2;
        continue;
      }
      const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i, i + 40));
      if (!m) {
        i += 2;
        continue;
      }
      i += m[0].length;
      const mot = m[1];
      const param = m[2] === undefined ? null : Number(m[2]);
      if (IGNORES.has(mot)) etat.ignorer = true;
      else if (mot === "par" || mot === "sect") finParagraphe();
      else if (mot === "line") ajouter("\n");
      else if (mot === "tab" || mot === "cell") ajouter(mot === "cell" ? " | " : "\t");
      else if (mot === "row") finParagraphe();
      else if (mot === "page") finParagraphe();
      else if (mot === "b") etat.b = param !== 0;
      else if (mot === "i") etat.i = param !== 0;
      else if (mot === "ul") etat.u = param !== 0;
      else if (mot === "ulnone") etat.u = false;
      else if (mot === "strike") etat.s = param !== 0;
      else if (mot === "plain") etat = { ...etat, b: false, i: false, u: false, s: false };
      else if (mot === "uc") etat.uc = param ?? 1;
      else if (mot === "u" && param !== null) {
        const code = param < 0 ? param + 65536 : param;
        ajouter(String.fromCharCode(code));
        aSauter = etat.uc;
      } else if (mot === "emdash") ajouter("—");
      else if (mot === "endash") ajouter("–");
      else if (mot === "bullet") ajouter("•");
      else if (mot === "lquote") ajouter("‘");
      else if (mot === "rquote") ajouter("’");
      else if (mot === "ldblquote") ajouter("“");
      else if (mot === "rdblquote") ajouter("”");
      continue;
    }
    if (c === "\r" || c === "\n") {
      i++;
      continue;
    }
    if (aSauter > 0) {
      aSauter--;
      i++;
      continue;
    }
    // Texte courant : on avance jusqu'au prochain caractère spécial.
    let j = i;
    while (j < n && !"\\{}\r\n".includes(rtf[j])) j++;
    ajouter(rtf.slice(i, j));
    i = j;
  }
  if (courant) finParagraphe();
  return paragraphes
    .map((p) => p.trim())
    .filter((p) => p !== "")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
