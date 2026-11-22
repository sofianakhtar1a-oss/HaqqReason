"use client";

/*
 * Documents, dans le navigateur : lire n'importe quel format vers le modèle intermédiaire,
 * puis l'écrire dans le format demandé.
 */
import { generateJSON } from "@tiptap/core";
import { strFromU8, unzipSync } from "fflate";
import { extensionsDocument } from "@/lib/editeur/extensions";
import { extensionsTableau } from "@/app/ecrire/tableaux";
import { construireDocx } from "@/lib/atelier/docx";
import { enMarkdown } from "@/lib/atelier/markdown";
import { REGLAGES_PAR_DEFAUT } from "@/lib/atelier/modele";
import { texteDuDocument } from "@/lib/document-schema";
import { chargerPdfjs } from "@/lib/client/pdf";
import { rtfVersHtml } from "../archives";
import { PdfProtege } from "../erreurs";
import { versEpub, versHtml, versOdt, versRtf } from "../ecrivains";
import type { Noeud } from "../pm";

export type DocumentLu = { doc: Noeud; titre: string; avertissements: string[] };

const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Nettoie un HTML venu d'ailleurs et le range dans le modèle de l'éditeur. */
export function htmlVersDocument(html: string, avertissements: string[]): Noeud {
  const d = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const images = d.body.querySelectorAll("img, svg, picture").length;
  if (images) avertissements.push(`${images} image${images > 1 ? "s" : ""} du document ne ${images > 1 ? "sont" : "est"} pas reprise${images > 1 ? "s" : ""}.`);
  d.body.querySelectorAll("script, style, noscript, iframe, object, embed, img, svg, picture, video, audio, canvas, form, button, input, select, textarea, head, link, meta").forEach((n) => n.remove());
  // L'éditeur range les titres aux niveaux 2 à 4 : h1 → h2, h2 → h3, h3 et plus → h4.
  d.body.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    const niveau = Math.min(4, Number(h.tagName[1]) + 1);
    const nouveau = d.createElement(`h${niveau}`);
    nouveau.innerHTML = h.innerHTML;
    h.replaceWith(nouveau);
  });
  const json = generateJSON(d.body.innerHTML || "<p></p>", [...extensionsDocument(), ...extensionsTableau]);
  return JSON.parse(JSON.stringify(json)) as Noeud;
}

function texteVersHtml(t: string): string {
  return t
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${echapper(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function decoder(octets: Uint8Array): string {
  // UTF-8 d'abord ; si le texte n'en est pas, Windows-1252 (fichiers anciens de Windows).
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

/** content.xml d'un ODT → HTML. */
function odtVersHtml(xml: string): string {
  const d = new DOMParser().parseFromString(xml, "application/xml");
  const NS_TEXT = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
  const NS_TABLE = "urn:oasis:names:tc:opendocument:xmlns:table:1.0";
  const NS_STYLE = "urn:oasis:names:tc:opendocument:xmlns:style:1.0";
  const NS_FO = "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0";
  // Styles automatiques : quels noms de style mettent en gras, en italique…
  const styles = new Map<string, { g: boolean; i: boolean; s: boolean }>();
  for (const st of Array.from(d.getElementsByTagNameNS(NS_STYLE, "style"))) {
    const props = st.getElementsByTagNameNS(NS_STYLE, "text-properties")[0];
    if (!props) continue;
    styles.set(st.getAttributeNS(NS_STYLE, "name") ?? "", {
      g: props.getAttributeNS(NS_FO, "font-weight") === "bold",
      i: props.getAttributeNS(NS_FO, "font-style") === "italic",
      s: (props.getAttributeNS(NS_STYLE, "text-underline-style") ?? "none") !== "none",
    });
  }
  const enligne = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return echapper(n.textContent ?? "");
    if (!(n instanceof Element)) return "";
    const nom = n.localName;
    if (nom === "s") return " ".repeat(Number(n.getAttributeNS(NS_TEXT, "c") ?? 1));
    if (nom === "tab") return "\t";
    if (nom === "line-break") return "<br>";
    if (nom === "note") return ` (${echapper(n.getElementsByTagNameNS(NS_TEXT, "note-body")[0]?.textContent?.trim() ?? "")})`;
    const dedans = Array.from(n.childNodes).map(enligne).join("");
    if (nom === "a") return `<a href="${echapper(n.getAttribute("xlink:href") ?? "")}">${dedans}</a>`;
    if (nom === "span") {
      const st = styles.get(n.getAttributeNS(NS_TEXT, "style-name") ?? "");
      let t = dedans;
      if (st?.g) t = `<strong>${t}</strong>`;
      if (st?.i) t = `<em>${t}</em>`;
      if (st?.s) t = `<u>${t}</u>`;
      return t;
    }
    return dedans;
  };
  const bloc = (n: Element): string => {
    const nom = n.localName;
    if (n.namespaceURI === NS_TEXT && nom === "h") {
      const niveau = Math.min(6, Number(n.getAttributeNS(NS_TEXT, "outline-level") ?? 1));
      return `<h${niveau}>${enligne(n)}</h${niveau}>`;
    }
    if (n.namespaceURI === NS_TEXT && nom === "p") return `<p>${enligne(n)}</p>`;
    if (n.namespaceURI === NS_TEXT && nom === "list") {
      return `<ul>${Array.from(n.children)
        .filter((li) => li.localName === "list-item")
        .map((li) => `<li>${Array.from(li.children).map(bloc).join("")}</li>`)
        .join("")}</ul>`;
    }
    if (n.namespaceURI === NS_TABLE && nom === "table") {
      const lignes = Array.from(n.getElementsByTagNameNS(NS_TABLE, "table-row"));
      return `<table>${lignes.map((r) => `<tr>${Array.from(r.getElementsByTagNameNS(NS_TABLE, "table-cell")).map((c) => `<td>${Array.from(c.children).map(bloc).join("")}</td>`).join("")}</tr>`).join("")}</table>`;
    }
    if (nom === "section" || nom === "soft-page-break" || nom === "sequence-decls") return Array.from(n.children).map(bloc).join("");
    return "";
  };
  const texte = d.getElementsByTagNameNS("urn:oasis:names:tc:opendocument:xmlns:office:1.0", "text")[0];
  return texte ? Array.from(texte.children).map(bloc).join("") : "";
}

/** EPUB : les chapitres dans l'ordre de lecture. */
function epubVersHtml(entrees: Record<string, Uint8Array>): { html: string; titre: string } {
  const conteneur = new DOMParser().parseFromString(strFromU8(entrees["META-INF/container.xml"] ?? new Uint8Array()), "application/xml");
  const chemin = conteneur.querySelector("rootfile")?.getAttribute("full-path") ?? "";
  const opf = new DOMParser().parseFromString(strFromU8(entrees[chemin] ?? new Uint8Array()), "application/xml");
  const base = chemin.includes("/") ? chemin.slice(0, chemin.lastIndexOf("/") + 1) : "";
  const titre = opf.getElementsByTagName("dc:title")[0]?.textContent?.trim() ?? "";
  const items = new Map(Array.from(opf.getElementsByTagName("item")).map((i) => [i.getAttribute("id"), i.getAttribute("href") ?? ""]));
  const ordre = Array.from(opf.getElementsByTagName("itemref")).map((r) => items.get(r.getAttribute("idref")) ?? "");
  const html = ordre
    .map((href) => {
      const brut = entrees[decodeURIComponent(base + href)];
      if (!brut) return "";
      const page = new DOMParser().parseFromString(strFromU8(brut), "application/xhtml+xml");
      return page.querySelector("body")?.innerHTML ?? "";
    })
    .join("");
  return { html, titre };
}

/** PDF : le texte, regroupé en paragraphes d'après l'espacement des lignes. */
async function pdfVersHtml(octets: Uint8Array, avancer: (f: number) => void): Promise<{ html: string; vide: boolean }> {
  const pdfjs = await chargerPdfjs();
  const tache = pdfjs.getDocument({ data: octets, cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/", iccUrl: "/vendor/pdfjs/iccs/", enableXfa: false });
  let doc: Awaited<typeof tache.promise>;
  try {
    doc = await tache.promise;
  } catch (e) {
    await tache.destroy();
    if ((e as { name?: string }).name === "PasswordException") throw new PdfProtege();
    throw new Error("Ce PDF est illisible : il est peut-être abîmé.");
  }
  const paragraphes: string[] = [];
  let caracteres = 0;
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const contenu = await page.getTextContent();
      type Ligne = { y: number; h: number; texte: string };
      const lignes: Ligne[] = [];
      for (const item of contenu.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        const h = Math.abs(item.transform[3]) || item.height || 10;
        const derniere = lignes[lignes.length - 1];
        if (derniere && Math.abs(derniere.y - y) < h * 0.5) derniere.texte += (item.hasEOL ? " " : "") + item.str;
        else lignes.push({ y, h, texte: item.str });
        caracteres += item.str.length;
      }
      let courant = "";
      let tailleCourante = 0;
      lignes.forEach((l, i) => {
        const avant = lignes[i - 1];
        const ecart = avant ? avant.y - l.y : 0;
        const nouveau = !avant || ecart > l.h * 1.75 || Math.abs(l.h - tailleCourante) > 1.5;
        if (nouveau && courant.trim()) {
          paragraphes.push(tailleCourante >= 15 ? `<h2>${echapper(courant.trim())}</h2>` : `<p>${echapper(courant.trim())}</p>`);
          courant = "";
        }
        tailleCourante = l.h;
        // Mot coupé en fin de ligne : on recolle.
        courant = courant.endsWith("-") ? courant.slice(0, -1) + l.texte.trimStart() : `${courant} ${l.texte}`;
      });
      if (courant.trim()) paragraphes.push(tailleCourante >= 15 ? `<h2>${echapper(courant.trim())}</h2>` : `<p>${echapper(courant.trim())}</p>`);
      page.cleanup();
      avancer(n / doc.numPages);
    }
  } finally {
    await tache.destroy();
  }
  return { html: paragraphes.join(""), vide: caracteres === 0 };
}

export async function lireDocument(nom: string, format: string, blob: Blob, avancer: (f: number) => void): Promise<DocumentLu> {
  const avertissements: string[] = [];
  const octets = new Uint8Array(await blob.arrayBuffer());
  const titreDuNom = nom.replace(/\.[^.]+$/, "");
  let html = "";
  let titre = titreDuNom;
  switch (format) {
    case "txt":
      html = texteVersHtml(decoder(octets));
      break;
    case "md": {
      const { marked } = await import("marked");
      html = await marked.parse(decoder(octets), { gfm: true });
      break;
    }
    case "html": {
      const d = new DOMParser().parseFromString(decoder(octets), "text/html");
      titre = d.title.trim() || titreDuNom;
      html = (d.querySelector("article") ?? d.body).innerHTML;
      break;
    }
    case "rtf":
      html = rtfVersHtml(decoder(octets));
      break;
    case "docx": {
      const mammoth = await import("mammoth");
      const r = await mammoth.convertToHtml({ arrayBuffer: octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer });
      html = r.value;
      break;
    }
    case "odt": {
      const entrees = unzipSync(octets, { filter: (f) => f.name === "content.xml" });
      if (!entrees["content.xml"]) throw new Error("Ce fichier OpenDocument est incomplet : son contenu est introuvable.");
      html = odtVersHtml(strFromU8(entrees["content.xml"]));
      break;
    }
    case "epub": {
      const lu = epubVersHtml(unzipSync(octets));
      html = lu.html;
      titre = lu.titre || titreDuNom;
      break;
    }
    case "pdf": {
      const lu = await pdfVersHtml(octets, avancer);
      if (lu.vide) throw new Error("Ce PDF ne contient pas de texte : c'est sans doute un document scanné (une image de texte). Convertis-le plutôt en images.");
      html = lu.html;
      break;
    }
    default:
      throw new Error("Ce format n'est pas un document.");
  }
  return { doc: htmlVersDocument(html, avertissements), titre, avertissements };
}

export async function ecrireDocument(doc: Noeud, format: string, titre: string): Promise<{ blob: Blob; avertissements: string[] }> {
  const t = (octets: Uint8Array | string, type: string) => new Blob([typeof octets === "string" ? octets : octets.slice().buffer], { type });
  switch (format) {
    case "docx":
      return { blob: t(construireDocx({ titre: "", contenu: doc, reglages: REGLAGES_PAR_DEFAUT }), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), avertissements: [] };
    case "md":
      return { blob: t(enMarkdown(doc, ""), "text/markdown;charset=utf-8"), avertissements: [] };
    case "txt":
      return { blob: t(texteDuDocument(doc, true) + "\n", "text/plain;charset=utf-8"), avertissements: [] };
    case "html":
      return { blob: t(versHtml(doc, titre), "text/html;charset=utf-8"), avertissements: [] };
    case "odt":
      return { blob: t(versOdt(doc, titre), "application/vnd.oasis.opendocument.text"), avertissements: [] };
    case "rtf":
      return { blob: t(versRtf(doc), "application/rtf"), avertissements: [] };
    case "epub":
      return { blob: t(versEpub(doc, titre, `urn:uuid:${crypto.randomUUID()}`, new Date().toISOString().replace(/\.\d+Z$/, "Z")), "application/epub+zip"), avertissements: [] };
    case "pdf": {
      const { versPdf } = await import("../pdf-ecrivain");
      const r = await versPdf(doc, titre);
      const avertissements = r.caracteresAbsents
        ? [`${r.caracteresAbsents} caractère${r.caracteresAbsents > 1 ? "s" : ""} (arabe ou autre écriture non latine) n'${r.caracteresAbsents > 1 ? "ont" : "a"} pas pu être placé${r.caracteresAbsents > 1 ? "s" : ""} dans le PDF. Pour un PDF fidèle, ouvre le document dans Le Calame et imprime-le en PDF.`]
        : [];
      return { blob: t(r.octets, "application/pdf"), avertissements };
    }
    default:
      throw new Error("Ce format n'est pas un document.");
  }
}
