"use client";

import type { Editor } from "@tiptap/core";
import { strToU8, zipSync, type Zippable } from "fflate";
import { lireBibliotheque, referenceOuvrage } from "@/lib/atelier/bibliotheque";
import { fichiersCites, lireFichier, listerDocuments } from "@/lib/atelier/depot";
import { construireDocx, type ImageDecodee } from "@/lib/atelier/docx";
import { echapper, enHtml, feuilleDeStyle } from "@/lib/atelier/html";
import { enMarkdown } from "@/lib/atelier/markdown";
import { extrasDe, type DocumentAtelier } from "@/lib/atelier/modele";
import { enTexteBrut, TYPES_DESSINES, versNeutre, type DonneesNeutre, type Noeud } from "@/lib/atelier/neutre";
import { sophismeParCle } from "@/lib/sophismes";
import { entreesBibliographie, entreesGlossaire, hadithsDuDocument, ouvragesCites, sourcesLibres, styleDe, versetsDuDocument } from "./blocs/Sources";
import { construirePaquet, nomDeFichier, telecharger } from "./exporter";
import { rasteriser, type ImageRaster } from "./rasteriser";
import { estOuvert } from "./verrou";

/*
 * Le Calame — les sorties complètes : Word avec ses notes et ses schémas, Markdown avec ses
 * images, EPUB, page HTML autonome, texte brut, archive de tous les documents, partage.
 *
 * Tout passe par le document « neutre » (lib/atelier/neutre.ts) : les blocs propres à l'atelier
 * y deviennent du texte ou des images prises à l'écran, pour que rien ne se perde en route.
 */

type Fichier = { chemin: string; type: string; octets: Uint8Array; largeur: number; hauteur: number };

const EXTENSIONS: Record<string, ImageDecodee["extension"]> = { "image/png": "png", "image/jpeg": "jpeg", "image/jpg": "jpeg", "image/gif": "gif", "image/webp": "webp" };

/** La partie visible d'un bloc dessiné (sans son en-tête ni ses réglages). */
function cibleDuBloc(type: string, dom: HTMLElement): Element {
  switch (type) {
    case "schema":
    case "logique":
      return dom.querySelector(".bloc-atelier-apercu") ?? dom;
    case "dessin":
    case "carteGeo":
      return dom.querySelector("svg") ?? dom;
    case "formule":
      return dom.querySelector(".calame-formule-rendu") ?? dom;
    default:
      return dom;
  }
}

/** Chaque bloc dessiné du document, pris en image à l'écran, dans l'ordre du document. */
async function imagesDesBlocs(editor: Editor | null): Promise<(ImageRaster | null)[]> {
  if (!editor || editor.isDestroyed) return [];
  const cibles: (Element | null)[] = [];
  editor.state.doc.descendants((n, pos) => {
    if (!TYPES_DESSINES.has(n.type.name)) return true;
    const dom = editor.view.nodeDOM(pos);
    cibles.push(dom instanceof HTMLElement ? cibleDuBloc(n.type.name, dom) : null);
    return false;
  });
  const images: (ImageRaster | null)[] = [];
  for (const c of cibles) images.push(c ? await rasteriser(c, { echelle: 2 }) : null);
  return images;
}

/** Les images jointes au document (photos), lues sur l'appareil et mesurées. */
async function imagesJointes(doc: DocumentAtelier): Promise<Map<string, Fichier>> {
  const sortie = new Map<string, Fichier>();
  for (const id of fichiersCites(doc.contenu)) {
    const fichier = await lireFichier(id);
    const extension = fichier ? EXTENSIONS[fichier.type] : undefined;
    if (!fichier || !extension) continue;
    let largeur = 600;
    let hauteur = 400;
    try {
      const image = await createImageBitmap(fichier.blob);
      largeur = image.width;
      hauteur = image.height;
      image.close();
    } catch {
      // Dimensions inconnues : la taille par défaut plutôt que de perdre l'image.
    }
    sortie.set(id, { chemin: `images/${id}.${extension}`, type: fichier.type, octets: new Uint8Array(await fichier.blob.arrayBuffer()), largeur, hauteur });
  }
  return sortie;
}

/** Tout ce qu'il faut pour écrire un document hors de l'atelier : le texte neutre et ses images. */
export async function preparerSortie(doc: DocumentAtelier, editor: Editor | null, options: { pourWord?: boolean; sansImages?: boolean } = {}): Promise<{ neutre: Noeud; images: Map<string, Fichier> }> {
  const images = await imagesJointes(doc);
  // Le texte brut n'a que faire d'images : la frise y reste en texte, la formule en LaTeX.
  const blocs = options.sansImages ? [] : await imagesDesBlocs(editor);
  blocs.forEach((r, k) => {
    if (r) images.set(`bloc-${k}`, { chemin: `images/bloc-${k + 1}.png`, type: "image/png", octets: r.octets, largeur: r.largeur, hauteur: r.hauteur });
  });
  const pm = editor && !editor.isDestroyed ? editor.state.doc : null;
  const biblio = lireBibliotheque();
  const style = editor && !editor.isDestroyed ? styleDe(editor) : doc.reglages.styleCitation;
  const cites = pm ? ouvragesCites(pm).flatMap((id) => biblio.filter((o) => o.id === id)) : [];
  const libres = pm ? sourcesLibres(pm) : [];
  const donnees: DonneesNeutre = {
    imageDuBloc: (k) => (images.has(`bloc-${k}`) ? { fichier: `bloc-${k}`, alt: "" } : null),
    bibliographie: (portee) => entreesBibliographie(portee === "toute" ? biblio : cites, libres).map((f) => referenceOuvrage(f, style)),
    versets: pm ? versetsDuDocument(pm) : [],
    hadiths: pm ? hadithsDuDocument(pm) : [],
    glossaire: pm ? entreesGlossaire(pm) : [],
    numeroterTitres: doc.reglages.numeroterTitres,
    pourWord: options.pourWord,
    nomSophisme: (cle) => sophismeParCle(cle)?.nom ?? cle,
  };
  return { neutre: versNeutre(doc.contenu, donnees), images };
}

const motsCles = (doc: DocumentAtelier) => extrasDe(doc).proprietes;

// ---------------------------------------------------------------------------
// Word
// ---------------------------------------------------------------------------

export async function construireWord(doc: DocumentAtelier, editor: Editor | null): Promise<Uint8Array> {
  const { neutre, images } = await preparerSortie(doc, editor, { pourWord: true });
  const liste: ImageDecodee[] = [...images].map(([id, f]) => ({ id, octets: f.octets, extension: EXTENSIONS[f.type] ?? "png", largeur: f.largeur, hauteur: f.hauteur }));
  const p = motsCles(doc);
  return construireDocx({ titre: doc.titre, contenu: neutre, reglages: doc.reglages, images: liste, proprietes: { auteur: p.auteur, sujet: p.sujet, motsCles: p.motsCles, statut: p.statut } });
}

export async function exporterWord(doc: DocumentAtelier, editor: Editor | null): Promise<void> {
  telecharger(nomDeFichier(doc.titre, "docx"), await construireWord(doc, editor), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

// ---------------------------------------------------------------------------
// Markdown (avec ses images, dans une archive quand il y en a)
// ---------------------------------------------------------------------------

/** La table des matières écrite en clair (Markdown et texte n'ont pas de champs). */
function sommaireEnListe(neutre: Noeud): Noeud {
  const titres: { niveau: number; texte: string }[] = [];
  const relever = (n: Noeud) => {
    if (n.type === "heading") titres.push({ niveau: Number(n.attrs?.level) || 2, texte: (n.content ?? []).map((x) => x.text ?? "").join("") });
    else (n.content ?? []).forEach(relever);
  };
  relever(neutre);
  const remplacer = (n: Noeud): Noeud[] => {
    if (n.type === "sommaire") {
      if (titres.length === 0) return [];
      return [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: String(n.attrs?.titre || "Table des matières") }] },
        { type: "bulletList", content: titres.map((t) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `${" ".repeat(Math.max(0, t.niveau - 2))}${t.texte}` }] }] })) },
      ];
    }
    return [n.content ? { ...n, content: n.content.flatMap(remplacer) } : n];
  };
  return { ...neutre, content: (neutre.content ?? []).flatMap(remplacer) };
}

export async function exporterMarkdownComplet(doc: DocumentAtelier, editor: Editor | null): Promise<void> {
  const { neutre, images } = await preparerSortie(doc, editor);
  const nom = nomDeFichier(doc.titre, "md");
  const texte = enMarkdown(sommaireEnListe(neutre), doc.titre, { cheminImage: (f) => images.get(f)?.chemin ?? null });
  const utilisees = [...images.values()].filter((f) => texte.includes(f.chemin));
  if (utilisees.length === 0) {
    telecharger(nom, texte, "text/markdown;charset=utf-8");
    return;
  }
  // Le texte et ses images ensemble : l'archive s'ouvre telle quelle dans un éditeur Markdown.
  const archive: Zippable = { [nom]: strToU8(texte) };
  for (const f of utilisees) archive[f.chemin] = [f.octets, { level: 0 }];
  telecharger(nomDeFichier(doc.titre, "zip"), zipSync(archive, { level: 6 }), "application/zip");
}

// ---------------------------------------------------------------------------
// Texte brut
// ---------------------------------------------------------------------------

export async function exporterTexte(doc: DocumentAtelier, editor: Editor | null): Promise<void> {
  const { neutre } = await preparerSortie(doc, editor, { sansImages: true });
  telecharger(nomDeFichier(doc.titre, "txt"), enTexteBrut(neutre, doc.titre), "text/plain;charset=utf-8");
}

// ---------------------------------------------------------------------------
// Page HTML autonome (un seul fichier : images comprises)
// ---------------------------------------------------------------------------

function enBase64(octets: Uint8Array): string {
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

export async function construireHtml(doc: DocumentAtelier, editor: Editor | null): Promise<string> {
  const { neutre, images } = await preparerSortie(doc, editor);
  const { corps } = enHtml(neutre, { sourceImage: (f) => (images.has(f) ? `data:${images.get(f)!.type};base64,${enBase64(images.get(f)!.octets)}` : null) });
  const p = motsCles(doc);
  const meta = [p.auteur ? `<meta name="author" content="${echapper(p.auteur)}"/>` : "", p.sujet ? `<meta name="description" content="${echapper(p.sujet)}"/>` : "", p.motsCles ? `<meta name="keywords" content="${echapper(p.motsCles)}"/>` : ""].join("\n");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${echapper(doc.titre || "Document")}</title>
${meta}
<meta name="generator" content="HaqqReason — Le Calame"/>
<style>${feuilleDeStyle(doc.reglages.styles)}</style>
</head>
<body>
<article>
${doc.titre.trim() ? `<h1>${echapper(doc.titre)}</h1>` : ""}
${corps}
</article>
</body>
</html>
`;
}

export async function exporterHtml(doc: DocumentAtelier, editor: Editor | null): Promise<void> {
  telecharger(nomDeFichier(doc.titre, "html"), await construireHtml(doc, editor), "text/html;charset=utf-8");
}

// ---------------------------------------------------------------------------
// Page web publiée (lecture seule)
// ---------------------------------------------------------------------------

/** Publie le document (ou met à jour sa page) ; motDePasse : texte pour en poser un, null pour le retirer. */
export async function publierDocument(doc: DocumentAtelier, editor: Editor | null, options: { id?: string; motDePasse?: string | null }): Promise<{ id: string; adresse: string } | { erreur: string }> {
  const { neutre, images } = await preparerSortie(doc, editor);
  const enLigne: Record<string, string> = {};
  for (const [cle, f] of images) if (JSON.stringify(neutre).includes(`"${cle}"`)) enLigne[cle] = `data:${f.type};base64,${enBase64(f.octets)}`;
  const reponse = await fetch("/api/calame/publication", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: options.id, documentId: doc.id, titre: doc.titre, auteur: extrasDe(doc).proprietes.auteur, contenu: neutre, images: enLigne, styles: doc.reglages.styles, motDePasse: options.motDePasse }),
  });
  const d = (await reponse.json().catch(() => ({}))) as { id?: string; adresse?: string; erreur?: string };
  return reponse.ok && d.id && d.adresse ? { id: d.id, adresse: d.adresse } : { erreur: d.erreur ?? "La publication n'a pas abouti." };
}

export async function retirerPublicationDuDocument(id: string): Promise<boolean> {
  const r = await fetch(`/api/calame/publication?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return r.ok;
}

// ---------------------------------------------------------------------------
// EPUB 3 (liseuse, téléphone)
// ---------------------------------------------------------------------------

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export async function construireEpub(doc: DocumentAtelier, editor: Editor | null): Promise<Uint8Array> {
  const { neutre, images } = await preparerSortie(doc, editor);
  // Dans le livre, les images vivent à côté du texte (OEBPS/images/…).
  const { corps, titres } = enHtml(neutre, { sourceImage: (f) => images.get(f)?.chemin ?? null, epub: true });
  const titre = doc.titre.trim() || "Document";
  const p = motsCles(doc);
  const id = `urn:uuid:${uuid()}`;
  const modifie = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const utilisees = [...images.values()].filter((f) => corps.includes(f.chemin));
  const xhtml = (t: string, contenu: string) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head><meta charset="utf-8"/><title>${echapper(t)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${contenu}</body>
</html>`;
  const nav = xhtml(
    "Sommaire",
    `<nav epub:type="toc" id="toc"><h1>Sommaire</h1><ol>${(titres.length ? titres : [{ id: "debut", niveau: 2, texte: titre }])
      .map((t) => `<li><a href="texte.xhtml#${t.id}">${echapper(t.texte || "…")}</a></li>`)
      .join("")}</ol></nav>`,
  );
  const texte = xhtml(titre, `<section epub:type="bodymatter" id="debut"><h1>${echapper(titre)}</h1>${corps}</section>`);
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id" xml:lang="fr">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="id">${id}</dc:identifier>
<dc:title>${echapper(titre)}</dc:title>
<dc:language>fr</dc:language>
${p.auteur ? `<dc:creator>${echapper(p.auteur)}</dc:creator>` : ""}
${p.sujet ? `<dc:description>${echapper(p.sujet)}</dc:description>` : ""}
${p.motsCles ? p.motsCles.split(/[,;]/).map((m) => m.trim()).filter(Boolean).map((m) => `<dc:subject>${echapper(m)}</dc:subject>`).join("") : ""}
<dc:publisher>HaqqReason — Le Calame</dc:publisher>
<meta property="dcterms:modified">${modifie}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="texte" href="texte.xhtml" media-type="application/xhtml+xml"/>
<item id="style" href="style.css" media-type="text/css"/>
${utilisees.map((f, i) => `<item id="img${i}" href="${f.chemin}" media-type="${f.type}"/>`).join("\n")}
</manifest>
<spine>
<itemref idref="texte"/>
</spine>
</package>`;
  const archive: Zippable = {
    // Le type du fichier en premier, sans compression : c'est ainsi qu'une liseuse reconnaît un EPUB.
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(`<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`),
    "OEBPS/content.opf": strToU8(opf),
    "OEBPS/nav.xhtml": strToU8(nav),
    "OEBPS/texte.xhtml": strToU8(texte),
    "OEBPS/style.css": strToU8(feuilleDeStyle(doc.reglages.styles)),
  };
  for (const f of utilisees) archive[`OEBPS/${f.chemin}`] = [f.octets, { level: 0 }];
  return zipSync(archive, { level: 6 });
}

export async function exporterEpub(doc: DocumentAtelier, editor: Editor | null): Promise<void> {
  telecharger(nomDeFichier(doc.titre, "epub"), await construireEpub(doc, editor), "application/epub+zip");
}

// ---------------------------------------------------------------------------
// Tous les documents d'un coup
// ---------------------------------------------------------------------------

/** Chaque document en .calame (tout compris, à rouvrir dans le Calame) et en .md (lisible partout). */
export async function exporterTousLesDocuments(): Promise<number> {
  const { octets, nombre } = await construireArchiveComplete();
  telecharger(`calame-${new Date().toISOString().slice(0, 10)}.zip`, octets, "application/zip");
  return nombre;
}

/** L'archive de tous les documents (pour le téléchargement, ou la sauvegarde automatique dans un dossier). */
export async function construireArchiveComplete(): Promise<{ octets: Uint8Array; nombre: number }> {
  // Un document verrouillé ne part dans l'archive que s'il a été ouvert avec son code.
  const documents = (await listerDocuments()).filter((d) => !extrasDe(d).corbeille && (!extrasDe(d).verrou || estOuvert(d.id)));
  const archive: Zippable = {};
  const pris = new Set<string>();
  for (const d of documents) {
    let base = nomDeFichier(d.titre || "sans-titre", "x").replace(/\.x$/, "");
    for (let i = 2; pris.has(base); i++) base = `${nomDeFichier(d.titre || "sans-titre", "x").replace(/\.x$/, "")}-${i}`;
    pris.add(base);
    archive[`${base}.calame`] = [await construirePaquet(d), { level: 0 }];
    archive[`markdown/${base}.md`] = strToU8(enMarkdown(d.contenu, d.titre));
  }
  archive["LISEZ-MOI.txt"] = strToU8(
    `Le Calame — ${documents.length} document(s), exportés le ${new Date().toLocaleString("fr-FR")}.\n\n` +
      `• Les fichiers .calame contiennent tout (texte, mise en page, images) : ouvre-les dans le Calame (bouton « Importer »).\n` +
      `• Le dossier « markdown » contient le texte seul, lisible dans n'importe quel éditeur.\n`,
  );
  return { octets: zipSync(archive, { level: 6 }), nombre: documents.length };
}

// ---------------------------------------------------------------------------
// Partager (feuille de partage du téléphone, ou e-mail)
// ---------------------------------------------------------------------------

export type FormatPartage = "docx" | "epub" | "html" | "md" | "txt" | "calame";

const TYPES_PARTAGE: Record<FormatPartage, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
  html: "text/html",
  md: "text/markdown",
  txt: "text/plain",
  calame: "application/gzip",
};

async function octetsPourPartage(doc: DocumentAtelier, editor: Editor | null, format: FormatPartage): Promise<Uint8Array> {
  switch (format) {
    case "docx":
      return construireWord(doc, editor);
    case "epub":
      return construireEpub(doc, editor);
    case "html":
      return strToU8(await construireHtml(doc, editor));
    case "md": {
      const { neutre } = await preparerSortie(doc, editor);
      return strToU8(enMarkdown(sommaireEnListe(neutre), doc.titre));
    }
    case "txt": {
      const { neutre } = await preparerSortie(doc, editor, { sansImages: true });
      return strToU8(enTexteBrut(neutre, doc.titre));
    }
    default:
      return construirePaquet(doc);
  }
}

/**
 * Partage le document : la feuille de partage du téléphone (ou de l'ordinateur) quand elle existe,
 * sinon le fichier est téléchargé et un e-mail prêt à partir s'ouvre (le fichier reste à joindre).
 * Rend « partage », « annule » ou « courriel ».
 */
export async function partagerDocument(doc: DocumentAtelier, editor: Editor | null, format: FormatPartage): Promise<"partage" | "annule" | "courriel"> {
  const octets = await octetsPourPartage(doc, editor, format);
  const nom = nomDeFichier(doc.titre, format);
  const fichier = new File([new Uint8Array(octets).slice().buffer], nom, { type: TYPES_PARTAGE[format] });
  const titre = doc.titre.trim() || "Document";
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: titre, text: `${titre} — écrit avec le Calame (HaqqReason)` });
      return "partage";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "annule";
    }
  }
  telecharger(nom, octets, TYPES_PARTAGE[format]);
  const corps = `Bonjour,\n\nVoici « ${titre} » (fichier ${nom}, à joindre à ce message : il vient d'être téléchargé).\n\n`;
  window.location.href = `mailto:?subject=${encodeURIComponent(titre)}&body=${encodeURIComponent(corps)}`;
  return "courriel";
}
