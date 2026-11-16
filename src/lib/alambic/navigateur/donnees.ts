"use client";

/*
 * Données, dans le navigateur : Excel (ExcelJS), YAML, lecture du XML.
 * Le reste (CSV, SQL, passages structure ↔ tableau) est dans ../donnees.ts.
 */
import { ecrireCsv, ecrireSql, ecrireXml, feuilleDeCsv, feuillesDeStructure, lireSql, structureDeFeuilles, type Feuille, type Valeur } from "../donnees";

export type DonneesLues = { feuilles: Feuille[]; structure: unknown | null };

function decoder(octets: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

/** Valeur d'une cellule Excel : formule → son résultat, texte enrichi → son texte, date → AAAA-MM-JJ. */
function valeurExcel(v: unknown): Valeur {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    const iso = v.toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace(".000Z", "Z");
  }
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("result" in o) return valeurExcel(o.result);
    if ("richText" in o && Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((r) => r.text).join("");
    if ("text" in o) return String(o.text);
    if ("error" in o) return String(o.error);
  }
  return String(v);
}

/** XML → structure : attributs en « @nom », éléments répétés en listes, texte seul en valeur. */
function xmlVersStructure(texte: string): unknown {
  const d = new DOMParser().parseFromString(texte, "application/xml");
  const erreur = d.querySelector("parsererror");
  if (erreur) throw new Error("Ce XML est mal formé : une balise n'est pas fermée ou un caractère est interdit.");
  const element = (e: Element): unknown => {
    const enfants = Array.from(e.children);
    const attributs = Array.from(e.attributes).filter((a) => !a.name.startsWith("xmlns"));
    const texte = Array.from(e.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE)
      .map((n) => n.textContent ?? "")
      .join("")
      .trim();
    if (!enfants.length && !attributs.length) return texte === "" ? null : texte;
    const o: Record<string, unknown> = {};
    for (const a of attributs) o[`@${a.name}`] = a.value;
    for (const c of enfants) {
      const v = element(c);
      const k = c.localName;
      if (k in o) o[k] = Array.isArray(o[k]) ? [...(o[k] as unknown[]), v] : [o[k], v];
      else o[k] = v;
    }
    if (texte && enfants.length === 0) o["#texte"] = texte;
    return o;
  };
  const racine = d.documentElement;
  const v = element(racine);
  // <donnees><element/>…</donnees> : la racine ne contient qu'une liste, on la renvoie directement.
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const cles = Object.keys(v);
    if (cles.length === 1 && Array.isArray((v as Record<string, unknown>)[cles[0]])) return (v as Record<string, unknown>)[cles[0]];
  }
  return v;
}

export async function lireDonnees(nom: string, format: string, blob: Blob): Promise<DonneesLues> {
  const tampon = await blob.arrayBuffer();
  switch (format) {
    case "xlsx": {
      const ExcelJS = (await import("exceljs")).default;
      const classeur = new ExcelJS.Workbook();
      try {
        await classeur.xlsx.load(tampon);
      } catch {
        throw new Error("Ce classeur Excel ne s'ouvre pas : il est peut-être protégé par un mot de passe, ou abîmé.");
      }
      const feuilles: Feuille[] = [];
      classeur.eachSheet((ws) => {
        const lignes: Valeur[][] = [];
        let largeur = 0;
        ws.eachRow({ includeEmpty: false }, (row) => {
          const valeurs = (row.values as unknown[]).slice(1).map(valeurExcel);
          largeur = Math.max(largeur, valeurs.length);
          lignes.push(valeurs);
        });
        if (!lignes.length) return;
        const entete = lignes[0];
        const colonnes = Array.from({ length: largeur }, (_, i) => (entete[i] === null || entete[i] === undefined || entete[i] === "" ? `Colonne ${i + 1}` : String(entete[i])));
        feuilles.push({ nom: ws.name, colonnes, lignes: lignes.slice(1).map((l) => colonnes.map((_, i) => l[i] ?? null)) });
      });
      if (!feuilles.length) throw new Error("Ce classeur est vide.");
      return { feuilles, structure: null };
    }
    case "csv":
      return { feuilles: [feuilleDeCsv(decoder(tampon), nom.replace(/\.[^.]+$/, ""))], structure: null };
    case "sql": {
      const feuilles = lireSql(decoder(tampon));
      if (!feuilles.length) throw new Error("Aucune instruction INSERT INTO n'a été trouvée dans ce fichier SQL.");
      return { feuilles, structure: null };
    }
    case "json": {
      let s: unknown;
      try {
        s = JSON.parse(decoder(tampon));
      } catch (e) {
        throw new Error(`Ce JSON est mal formé : ${(e as Error).message}`);
      }
      return { feuilles: feuillesDeStructure(s), structure: s };
    }
    case "yaml": {
      const YAML = await import("yaml");
      let s: unknown;
      try {
        s = YAML.parse(decoder(tampon), { maxAliasCount: 100 });
      } catch (e) {
        throw new Error(`Ce YAML est mal formé : ${(e as Error).message}`);
      }
      return { feuilles: feuillesDeStructure(s), structure: s };
    }
    case "xml": {
      const s = xmlVersStructure(decoder(tampon));
      return { feuilles: feuillesDeStructure(s), structure: s };
    }
    default:
      throw new Error("Ce format n'est pas un format de données.");
  }
}

export type DonneesEcrites = { fichiers: { suffixe: string; blob: Blob }[]; avertissements: string[] };

export async function ecrireDonnees(lu: DonneesLues, format: string, options: { separateur: ";" | "," }): Promise<DonneesEcrites> {
  const structure = lu.structure ?? structureDeFeuilles(lu.feuilles);
  const texte = (t: string, type: string) => new Blob([t], { type });
  switch (format) {
    case "json":
      return { fichiers: [{ suffixe: "", blob: texte(JSON.stringify(structure, null, 2) + "\n", "application/json") }], avertissements: [] };
    case "yaml": {
      const YAML = await import("yaml");
      return { fichiers: [{ suffixe: "", blob: texte(YAML.stringify(structure, { lineWidth: 0 }), "application/yaml") }], avertissements: [] };
    }
    case "xml":
      return { fichiers: [{ suffixe: "", blob: texte(ecrireXml(structure), "application/xml") }], avertissements: [] };
    case "sql":
      return { fichiers: [{ suffixe: "", blob: texte(ecrireSql(lu.feuilles), "application/sql") }], avertissements: [] };
    case "csv":
      // Une feuille par CSV : plusieurs feuilles donnent plusieurs fichiers (livrés dans un ZIP).
      return {
        fichiers: lu.feuilles.map((f) => ({ suffixe: lu.feuilles.length > 1 ? f.nom : "", blob: texte(ecrireCsv(f, options.separateur), "text/csv;charset=utf-8") })),
        avertissements: lu.feuilles.length > 1 ? [`Le classeur a ${lu.feuilles.length} feuilles : chacune devient un CSV, et ils sont réunis dans un ZIP.`] : [],
      };
    case "xlsx": {
      const ExcelJS = (await import("exceljs")).default;
      const classeur = new ExcelJS.Workbook();
      classeur.creator = "HaqqReason — L'Alambic";
      const noms = new Set<string>();
      for (const f of lu.feuilles) {
        let nomFeuille = f.nom.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Feuille";
        while (noms.has(nomFeuille)) nomFeuille = `${nomFeuille.slice(0, 28)} ${noms.size + 1}`;
        noms.add(nomFeuille);
        const ws = classeur.addWorksheet(nomFeuille, { views: [{ state: "frozen", ySplit: 1 }] });
        ws.addRow(f.colonnes);
        for (const l of f.lignes) ws.addRow(l.map((v) => (v === null ? null : v)));
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1EEE6" } };
        if (f.colonnes.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: f.colonnes.length } };
        ws.columns.forEach((col, i) => {
          const longueurs = [f.colonnes[i] ?? "", ...f.lignes.slice(0, 500).map((l) => String(l[i] ?? ""))].map((s) => s.length);
          col.width = Math.min(60, Math.max(8, ...longueurs) + 2);
        });
      }
      const tampon = await classeur.xlsx.writeBuffer();
      return { fichiers: [{ suffixe: "", blob: new Blob([tampon], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) }], avertissements: [] };
    }
    default:
      throw new Error("Ce format n'est pas un format de données.");
  }
}
