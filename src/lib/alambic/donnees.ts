/*
 * Données : un même modèle pour tous les formats tabulaires, et des passages vers les structures.
 * Pur : testé dans tests/test-logique.mts. (Excel, YAML et la lecture du XML se font dans le navigateur.)
 */

export type Valeur = string | number | boolean | null;
export type Feuille = { nom: string; colonnes: string[]; lignes: Valeur[][] };

/* ---------------------------------------------------------------- CSV ---- */

/** Devine le séparateur d'après la première ligne (hors guillemets). */
export function devinerSeparateur(texte: string): string {
  const premiere = texte.split(/\r?\n/, 1)[0] ?? "";
  let dehors = "";
  let dedans = false;
  for (const c of premiere) {
    if (c === '"') dedans = !dedans;
    else if (!dedans) dehors += c;
  }
  const candidats = [";", ",", "\t", "|"];
  return candidats.reduce((meilleur, c) => (dehors.split(c).length > dehors.split(meilleur).length ? c : meilleur), ",");
}

/** CSV selon la norme RFC 4180 : guillemets doublés, retours à la ligne dans les cellules. */
export function lireCsv(brut: string, separateur?: string): string[][] {
  const texte = brut.replace(/^﻿/, "");
  const sep = separateur ?? devinerSeparateur(texte);
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let cellule = "";
  let guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          cellule += '"';
          i++;
        } else guillemets = false;
      } else cellule += c;
    } else if (c === '"' && cellule === "") guillemets = true;
    else if (c === sep) {
      ligne.push(cellule);
      cellule = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(cellule);
      lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else cellule += c;
  }
  if (cellule !== "" || ligne.length) {
    ligne.push(cellule);
    lignes.push(ligne);
  }
  return lignes.filter((l) => !(l.length === 1 && l[0] === ""));
}

/** Reconnaît nombres et booléens. `virguleDecimale` : « 3,5 » est un nombre (CSV français). */
export function typer(v: string, virguleDecimale = false): Valeur {
  const t = v.trim();
  if (t === "") return null;
  if (/^-?(0|[1-9]\d{0,14})(\.\d+)?([eE][-+]?\d+)?$/.test(t)) return Number(t);
  if (virguleDecimale && /^-?(0|[1-9]\d{0,14}),\d+$/.test(t)) return Number(t.replace(",", "."));
  if (/^(true|vrai)$/i.test(t)) return true;
  if (/^(false|faux)$/i.test(t)) return false;
  return v;
}

export function feuilleDeCsv(brut: string, nom = "Feuille 1"): Feuille {
  const sep = devinerSeparateur(brut.replace(/^﻿/, ""));
  const lignes = lireCsv(brut, sep);
  const entete = lignes[0] ?? [];
  const largeur = Math.max(entete.length, ...lignes.map((l) => l.length));
  const colonnes = Array.from({ length: largeur }, (_, i) => (entete[i] ?? "").trim() || `Colonne ${i + 1}`);
  return { nom, colonnes: dedoublonner(colonnes), lignes: lignes.slice(1).map((l) => colonnes.map((_, i) => typer(l[i] ?? "", sep === ";"))) };
}

export function ecrireCsv(f: Feuille, separateur = ";"): string {
  const cel = (v: Valeur) => {
    if (v === null) return "";
    let s = typeof v === "number" && separateur === ";" ? String(v).replace(".", ",") : String(v);
    // Une cellule qui commence par = + - @ serait exécutée comme une formule par un tableur : on la neutralise.
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /["\r\n]/.test(s) || s.includes(separateur) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM : Excel reconnaît ainsi l'UTF-8 et les accents.
  return "﻿" + [f.colonnes, ...f.lignes].map((l) => l.map(cel).join(separateur)).join("\r\n") + "\r\n";
}

function dedoublonner(noms: string[]): string[] {
  const vus = new Map<string, number>();
  return noms.map((n) => {
    const k = vus.get(n) ?? 0;
    vus.set(n, k + 1);
    return k ? `${n} (${k + 1})` : n;
  });
}

/* --------------------------------------------- structures ↔ tableaux ---- */

/** Aplatit un objet : { a: { b: 1 } } → { "a.b": 1 } ; les listes de valeurs simples sont jointes. */
export function aplatir(obj: unknown, prefixe = "", sortie: Record<string, Valeur> = {}): Record<string, Valeur> {
  if (obj === null || obj === undefined) {
    if (prefixe) sortie[prefixe] = null;
  } else if (Array.isArray(obj)) {
    if (obj.every((x) => x === null || typeof x !== "object")) sortie[prefixe || "valeur"] = obj.map((x) => String(x ?? "")).join(", ");
    else obj.forEach((x, i) => aplatir(x, prefixe ? `${prefixe}.${i}` : String(i), sortie));
  } else if (typeof obj === "object") {
    const entrees = Object.entries(obj as Record<string, unknown>);
    if (!entrees.length && prefixe) sortie[prefixe] = null;
    for (const [k, v] of entrees) aplatir(v, prefixe ? `${prefixe}.${k}` : k, sortie);
  } else sortie[prefixe || "valeur"] = obj as Valeur;
  return sortie;
}

/** L'inverse : { "a.b": 1 } → { a: { b: 1 } }. */
export function deplier(plat: Record<string, Valeur>): Record<string, unknown> {
  const racine: Record<string, unknown> = {};
  for (const [cle, v] of Object.entries(plat)) {
    const parts = cle.split(".");
    let o = racine;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) o[p] = v;
      else {
        if (typeof o[p] !== "object" || o[p] === null) o[p] = {};
        o = o[p] as Record<string, unknown>;
      }
    });
  }
  return racine;
}

/** Trouve le tableau principal d'une structure : la liste d'objets la plus longue. */
function listePrincipale(s: unknown): { nom: string; liste: unknown[] }[] {
  if (Array.isArray(s)) return [{ nom: "Données", liste: s }];
  if (s && typeof s === "object") {
    const listes = Object.entries(s as Record<string, unknown>).filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0);
    if (listes.length) return listes.map(([k, v]) => ({ nom: k, liste: v as unknown[] }));
    return [{ nom: "Données", liste: [s] }];
  }
  return [{ nom: "Données", liste: [s] }];
}

export function feuillesDeStructure(s: unknown): Feuille[] {
  return listePrincipale(s).map(({ nom, liste }) => {
    const plats = liste.map((x) => (x !== null && typeof x === "object" ? aplatir(x) : { valeur: x as Valeur }));
    const colonnes: string[] = [];
    for (const p of plats) for (const k of Object.keys(p)) if (!colonnes.includes(k)) colonnes.push(k);
    return { nom: nom.slice(0, 31), colonnes, lignes: plats.map((p) => colonnes.map((c) => (c in p ? p[c] : null))) };
  });
}

export function structureDeFeuilles(feuilles: Feuille[]): unknown {
  const enObjets = (f: Feuille) => f.lignes.map((l) => deplier(Object.fromEntries(f.colonnes.map((c, i) => [c, l[i] ?? null]))));
  if (feuilles.length === 1) return enObjets(feuilles[0]);
  return Object.fromEntries(feuilles.map((f) => [f.nom, enObjets(f)]));
}

/* ---------------------------------------------------------------- XML ---- */

function nomXml(n: string): string {
  let s = n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_.-]/g, "_");
  if (!/^[A-Za-z_]/.test(s)) s = `_${s}`;
  if (/^xml/i.test(s)) s = `_${s}`;
  return s || "_";
}
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Structure → XML. Les clés « @nom » deviennent des attributs, « #texte » le texte de l'élément. */
export function ecrireXml(s: unknown, racine = "donnees"): string {
  const element = (nom: string, v: unknown, retrait: string): string => {
    const tag = nomXml(nom);
    if (v === null || v === undefined) return `${retrait}<${tag}/>`;
    if (Array.isArray(v)) return v.map((x) => element(nom, x, retrait)).join("\n");
    if (typeof v === "object") {
      const entrees = Object.entries(v as Record<string, unknown>);
      const attributs = entrees
        .filter(([k, x]) => k.startsWith("@") && (x === null || typeof x !== "object"))
        .map(([k, x]) => ` ${nomXml(k.slice(1))}="${esc(String(x ?? ""))}"`)
        .join("");
      const texte = entrees.find(([k]) => k === "#texte")?.[1];
      const enfants = entrees.filter(([k]) => !k.startsWith("@") && k !== "#texte");
      if (!enfants.length) return texte === undefined ? `${retrait}<${tag}${attributs}/>` : `${retrait}<${tag}${attributs}>${esc(String(texte))}</${tag}>`;
      return `${retrait}<${tag}${attributs}>\n${enfants.map(([k, x]) => element(k, x, retrait + "  ")).join("\n")}\n${retrait}</${tag}>`;
    }
    return `${retrait}<${tag}>${esc(String(v))}</${tag}>`;
  };
  const corps = Array.isArray(s) ? `<${racine}>\n${s.map((x) => element("element", x, "  ")).join("\n")}\n</${racine}>` : element(racine, s, "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${corps}\n`;
}

/* ---------------------------------------------------------------- SQL ---- */

function identifiant(n: string): string {
  return `"${n.replace(/"/g, '""')}"`;
}
function litteral(v: Valeur): string {
  if (v === null) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return `'${v.replace(/'/g, "''")}'`;
}

/** CREATE TABLE puis INSERT par lots de 100 lignes. Types déduits des valeurs. */
export function ecrireSql(feuilles: Feuille[]): string {
  return feuilles
    .map((f) => {
      const table = f.nom.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "donnees";
      const types = f.colonnes.map((_, i) => {
        const vals = f.lignes.map((l) => l[i]).filter((v) => v !== null);
        if (vals.length && vals.every((v) => typeof v === "number" && Number.isInteger(v))) return "INTEGER";
        if (vals.length && vals.every((v) => typeof v === "number")) return "NUMERIC";
        if (vals.length && vals.every((v) => typeof v === "boolean")) return "BOOLEAN";
        return "TEXT";
      });
      const creer = `CREATE TABLE ${identifiant(table)} (\n${f.colonnes.map((c, i) => `  ${identifiant(c)} ${types[i]}`).join(",\n")}\n);`;
      const lots: string[] = [];
      for (let i = 0; i < f.lignes.length; i += 100) {
        const tranche = f.lignes.slice(i, i + 100);
        lots.push(`INSERT INTO ${identifiant(table)} (${f.colonnes.map(identifiant).join(", ")}) VALUES\n${tranche.map((l) => `  (${f.colonnes.map((_, k) => litteral(l[k] ?? null)).join(", ")})`).join(",\n")};`);
      }
      return [creer, ...lots].join("\n\n");
    })
    .join("\n\n") + "\n";
}

/** Lit les INSERT INTO (et les colonnes des CREATE TABLE) d'un script SQL. */
export function lireSql(sql: string): Feuille[] {
  const tables = new Map<string, Feuille>();
  let i = 0;
  const n = sql.length;
  const espaces = () => {
    for (;;) {
      while (i < n && /\s/.test(sql[i])) i++;
      if (sql.startsWith("--", i)) {
        while (i < n && sql[i] !== "\n") i++;
      } else if (sql.startsWith("/*", i)) {
        const f = sql.indexOf("*/", i + 2);
        i = f < 0 ? n : f + 2;
      } else return;
    }
  };
  const mot = (): string => {
    espaces();
    if (sql[i] === '"' || sql[i] === "`" || sql[i] === "[") {
      const fin = sql[i] === "[" ? "]" : sql[i];
      let s = "";
      i++;
      while (i < n) {
        if (sql[i] === fin && sql[i + 1] === fin) {
          s += fin;
          i += 2;
        } else if (sql[i] === fin) {
          i++;
          break;
        } else s += sql[i++];
      }
      return s;
    }
    const m = /^[A-Za-z0-9_.$]+/.exec(sql.slice(i, i + 200));
    if (!m) return "";
    i += m[0].length;
    return m[0];
  };
  /** Nom éventuellement qualifié (« schema.table », « [dbo].[t] ») : on garde la dernière partie. */
  const nomQualifie = (): string => {
    let nom = mot();
    while (sql[i] === ".") {
      i++;
      nom = mot();
    }
    return nom;
  };
  const valeur = (): Valeur => {
    espaces();
    if (sql[i] === "'") {
      let s = "";
      i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          s += "'";
          i += 2;
        } else if (sql[i] === "\\" && sql[i + 1]) {
          s += sql[i + 1] === "n" ? "\n" : sql[i + 1];
          i += 2;
        } else if (sql[i] === "'") {
          i++;
          break;
        } else s += sql[i++];
      }
      return s;
    }
    const m = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/.exec(sql.slice(i, i + 64));
    if (m) {
      i += m[0].length;
      return Number(m[0]);
    }
    const w = mot().toUpperCase();
    if (w === "NULL") return null;
    if (w === "TRUE") return true;
    if (w === "FALSE") return false;
    return w;
  };
  const liste = <T,>(lire: () => T): T[] => {
    espaces();
    const sortie: T[] = [];
    if (sql[i] !== "(") return sortie;
    i++;
    for (;;) {
      espaces();
      if (sql[i] === ")") {
        i++;
        break;
      }
      sortie.push(lire());
      espaces();
      if (sql[i] === ",") i++;
      else if (sql[i] === ")") {
        i++;
        break;
      } else if (i >= n) break;
      else i++;
    }
    return sortie;
  };
  const prochaineInstruction = () => {
    let dedans = false;
    while (i < n) {
      const c = sql[i];
      if (c === "'") dedans = !dedans;
      else if (c === ";" && !dedans) {
        i++;
        return;
      }
      i++;
    }
  };
  const table = (nom: string) => {
    const court = nom.split(".").pop() ?? nom;
    if (!tables.has(court)) tables.set(court, { nom: court, colonnes: [], lignes: [] });
    return tables.get(court)!;
  };

  while (i < n) {
    espaces();
    const debut = i;
    const w = mot().toUpperCase();
    if (w === "INSERT") {
      mot(); // INTO
      const t = table(nomQualifie());
      espaces();
      let colonnes: string[] = [];
      if (sql[i] === "(") colonnes = liste(mot);
      if (colonnes.length && !t.colonnes.length) t.colonnes = colonnes;
      const v = mot().toUpperCase();
      if (v === "VALUES") {
        for (;;) {
          const l = liste(valeur);
          if (!t.colonnes.length) t.colonnes = l.map((_, k) => `colonne_${k + 1}`);
          const ordre = colonnes.length ? colonnes : t.colonnes;
          t.lignes.push(t.colonnes.map((c) => l[ordre.indexOf(c)] ?? null));
          espaces();
          if (sql[i] === ",") i++;
          else break;
        }
      }
      prochaineInstruction();
    } else if (w === "CREATE") {
      const quoi = mot().toUpperCase();
      if (quoi === "TABLE") {
        let nom = nomQualifie();
        if (nom.toUpperCase() === "IF") {
          mot();
          mot();
          nom = nomQualifie();
        }
        const t = table(nom);
        // Colonnes : premier mot de chaque définition, sauf contraintes.
        espaces();
        if (sql[i] === "(") {
          i++;
          let profondeur = 1;
          let def = "";
          const defs: string[] = [];
          while (i < n && profondeur > 0) {
            const c = sql[i++];
            if (c === "(") profondeur++;
            if (c === ")") profondeur--;
            if ((c === "," && profondeur === 1) || profondeur === 0) {
              defs.push(def.trim());
              def = "";
            } else def += c;
          }
          const cols = defs.map((d) => /^["`[]?([^"`\]\s]+)/.exec(d)?.[1] ?? "").filter((c) => c && !/^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK|KEY|INDEX)$/i.test(c));
          if (!t.colonnes.length) t.colonnes = cols;
        }
      }
      prochaineInstruction();
    } else {
      if (i === debut) i++;
      prochaineInstruction();
    }
  }
  return [...tables.values()].filter((t) => t.colonnes.length);
}
