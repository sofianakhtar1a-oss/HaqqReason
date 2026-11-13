/**
 * Conversion des fichiers importés (dans le navigateur du créateur) vers le format des articles.
 * Formats : Markdown (.md), texte (.txt), Word (.docx), HTML (.html, export Notion),
 * et archives .zip (export Notion complet, avec ses dossiers).
 */
import { generateJSON } from "@tiptap/core";
import { extensionsDocument } from "@/lib/editeur/extensions";

export type Brouillon = { cle: string; titre: string; chemin: string[]; html: string; source: string; garder: boolean };

const ID_NOTION = /\s+[0-9a-f]{32}$/i;

function nettoyerNom(nom: string): string {
  return nom.replace(/\.[^.]+$/, "").replace(ID_NOTION, "").replace(/[_]+/g, " ").trim();
}

function echapper(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sépare le premier grand titre (il devient le titre de l'article). */
function extraireTitre(html: string, defaut: string): { titre: string; html: string } {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const premier = doc.body.querySelector("h1");
  let titre = defaut;
  if (premier && premier.textContent?.trim()) {
    titre = premier.textContent.trim();
    premier.remove();
  }
  // Titres de niveau 1 restants : ramenés au niveau 2 (le niveau 1 est réservé au titre de l'article).
  doc.body.querySelectorAll("h1").forEach((h) => {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h.innerHTML;
    h.replaceWith(h2);
  });
  // Images, scripts, styles : non importés (seul le texte et sa mise en forme le sont).
  doc.body.querySelectorAll("img, script, style, iframe, object, svg, video, audio").forEach((n) => n.remove());
  return { titre: titre.slice(0, 200), html: doc.body.innerHTML };
}

async function versHtml(nom: string, octets: Uint8Array): Promise<string | null> {
  const ext = nom.toLowerCase().split(".").pop();
  if (ext === "md" || ext === "markdown") {
    const { marked } = await import("marked");
    return await marked.parse(new TextDecoder().decode(octets), { gfm: true });
  }
  if (ext === "txt") {
    return new TextDecoder()
      .decode(octets)
      .split(/\n\s*\n/)
      .map((p) => `<p>${echapper(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  if (ext === "html" || ext === "htm") {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(octets), "text/html");
    const article = doc.querySelector("article") ?? doc.body;
    const titreNotion = doc.querySelector("h1.page-title")?.textContent;
    doc.querySelector("header")?.remove();
    return `${titreNotion ? `<h1>${echapper(titreNotion)}</h1>` : ""}${article.innerHTML}`;
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.convertToHtml({ arrayBuffer: octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer });
    return r.value;
  }
  return null;
}

/** Lit les fichiers choisis et prépare un brouillon d'article par document reconnu. */
export async function preparerImport(fichiers: File[], dossiers: boolean): Promise<{ brouillons: Brouillon[]; ignores: string[] }> {
  const brouillons: Brouillon[] = [];
  const ignores: string[] = [];
  let n = 0;
  const ajouter = async (chemin: string, octets: Uint8Array) => {
    const morceaux = chemin.split("/").filter(Boolean);
    const nom = morceaux.pop() ?? chemin;
    const html = await versHtml(nom, octets);
    if (html === null) {
      if (!nom.startsWith(".") && !/\.(png|jpe?g|gif|webp|svg|css|csv)$/i.test(nom)) ignores.push(nom);
      return;
    }
    const { titre, html: corps } = extraireTitre(html, nettoyerNom(nom));
    brouillons.push({ cle: `b${n++}`, titre, chemin: dossiers ? morceaux.map(nettoyerNom).filter(Boolean) : [], html: corps, source: chemin, garder: true });
  };

  for (const f of fichiers) {
    const octets = new Uint8Array(await f.arrayBuffer());
    if (f.name.toLowerCase().endsWith(".zip")) {
      const { unzipSync } = await import("fflate");
      const entrees = unzipSync(octets);
      const noms = Object.keys(entrees).filter((k) => !k.endsWith("/") && !k.startsWith("__MACOSX"));
      // Un export Notion contient souvent un premier dossier racine : on l'enlève du chemin.
      const racines = new Set(noms.map((k) => k.split("/")[0]));
      const sansRacine = racines.size === 1 && noms.every((k) => k.includes("/"));
      for (const k of noms.sort()) {
        const entree = entrees[k];
        if (k.toLowerCase().endsWith(".zip")) {
          const interne = unzipSync(entree);
          for (const [k2, v2] of Object.entries(interne)) if (!k2.endsWith("/")) await ajouter(k2, v2);
        } else await ajouter(sansRacine ? k.split("/").slice(1).join("/") : k, entree);
      }
    } else {
      await ajouter(f.name, octets);
    }
  }
  return { brouillons, ignores };
}

/** HTML → document de l'éditeur (le serveur revérifie tout). */
export function versDocument(html: string): unknown {
  const json = generateJSON(html || "<p></p>", extensionsDocument());
  return JSON.parse(JSON.stringify(json));
}
