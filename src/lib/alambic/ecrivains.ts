/*
 * Écrivains de documents : du modèle intermédiaire vers HTML, OpenDocument (.odt), RTF et EPUB.
 * (Word, Markdown et texte réutilisent ceux du Calame ; le PDF a son propre fichier.)
 * Pur : testé dans tests/test-logique.mts.
 */
import { strToU8, zipSync, type Zippable } from "fflate";
import { echapperXml, lignesDuTableau, morceaux, niveauTitre, type Morceau, type Noeud } from "./pm";

/* ------------------------------------------------------------------ HTML ---- */

function enligneHtml(ms: Morceau[]): string {
  return ms
    .map((m) => {
      if (m.saut) return "<br/>";
      let t = echapperXml(m.texte);
      if (m.gras) t = `<strong>${t}</strong>`;
      if (m.italique) t = `<em>${t}</em>`;
      if (m.souligne) t = `<u>${t}</u>`;
      if (m.barre) t = `<s>${t}</s>`;
      if (m.exposant) t = `<sup>${t}</sup>`;
      if (m.indice) t = `<sub>${t}</sub>`;
      if (m.lien && /^(https?:|mailto:)/i.test(m.lien)) t = `<a href="${echapperXml(m.lien)}">${t}</a>`;
      return t;
    })
    .join("");
}

/** Corps HTML (aussi valide en XHTML, pour l'EPUB). */
export function corpsHtml(noeuds: Noeud[]): string {
  return noeuds.map(blocHtml).join("\n");
}

function blocHtml(n: Noeud): string {
  switch (n.type) {
    case "paragraph":
      return `<p>${enligneHtml(morceaux(n))}</p>`;
    case "heading": {
      const h = niveauTitre(n);
      return `<h${h}>${enligneHtml(morceaux(n))}</h${h}>`;
    }
    case "bulletList":
    case "taskList":
      return `<ul>${(n.content ?? []).map((li) => `<li>${corpsHtml(li.content ?? [])}</li>`).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(n.content ?? []).map((li) => `<li>${corpsHtml(li.content ?? [])}</li>`).join("")}</ol>`;
    case "blockquote":
      return `<blockquote>${corpsHtml(n.content ?? [])}</blockquote>`;
    case "horizontalRule":
      return "<hr/>";
    case "sautPage":
      return '<div style="break-after:page"></div>';
    case "table":
      return `<table>${lignesDuTableau(n)
        .map((l) => `<tr>${l.cellules.map((c) => (c.type === "tableHeader" ? `<th>${corpsHtml(c.content ?? [])}</th>` : `<td>${corpsHtml(c.content ?? [])}</td>`)).join("")}</tr>`)
        .join("")}</table>`;
    default:
      if (n.content?.some((c) => c.type === "text")) return `<p>${enligneHtml(morceaux(n))}</p>`;
      return corpsHtml(n.content ?? []);
  }
}

const STYLE_PAGE = `body{max-width:46rem;margin:3rem auto;padding:0 1.25rem;font:17px/1.65 Georgia,"Times New Roman",serif;color:#1d2133}
h1,h2,h3{font-family:system-ui,sans-serif;line-height:1.25}blockquote{margin:1.2em 0;padding-left:1em;border-left:3px solid #b8923a;font-style:italic}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.92em}th,td{border:1px solid #c9cbd6;padding:.4em .6em;text-align:left;vertical-align:top}th{background:#f1eee6}
@media print{body{margin:0}}`;

export function versHtml(doc: Noeud, titre: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${echapperXml(titre)}</title>
<style>${STYLE_PAGE}</style>
</head>
<body>
${corpsHtml(doc.content ?? [])}
</body>
</html>
`;
}

/* ------------------------------------------------------- OpenDocument ---- */

const NS_ODF =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.3"';

/** Les huit combinaisons de gras / italique / souligné / barré utiles, en styles automatiques. */
function styleTexte(m: Morceau): string | null {
  const cle = `${m.gras ? "G" : ""}${m.italique ? "I" : ""}${m.souligne ? "S" : ""}${m.barre ? "B" : ""}${m.exposant ? "E" : ""}${m.indice ? "N" : ""}`;
  return cle ? `T${cle}` : null;
}

function definitionStyleTexte(nom: string): string {
  const c = nom.slice(1);
  const props = [
    c.includes("G") ? 'fo:font-weight="bold"' : "",
    c.includes("I") ? 'fo:font-style="italic"' : "",
    c.includes("S") ? 'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"' : "",
    c.includes("B") ? 'style:text-line-through-style="solid"' : "",
    c.includes("E") ? 'style:text-position="super 58%"' : "",
    c.includes("N") ? 'style:text-position="sub 58%"' : "",
  ].filter(Boolean);
  return `<style:style style:name="${nom}" style:family="text"><style:text-properties ${props.join(" ")}/></style:style>`;
}

function enligneOdt(ms: Morceau[], styles: Set<string>): string {
  return ms
    .map((m) => {
      if (m.saut) return "<text:line-break/>";
      const texte = echapperXml(m.texte).replace(/\t/g, "<text:tab/>").replace(/ {2,}/g, (e) => ` <text:s text:c="${e.length - 1}"/>`);
      const st = styleTexte(m);
      if (st) styles.add(st);
      let t = st ? `<text:span text:style-name="${st}">${texte}</text:span>` : texte;
      if (m.lien && /^(https?:|mailto:)/i.test(m.lien)) t = `<text:a xlink:type="simple" xlink:href="${echapperXml(m.lien)}">${t}</text:a>`;
      return t;
    })
    .join("");
}

function corpsOdt(noeuds: Noeud[], styles: Set<string>, ctx: { tables: number }, styleParagraphe = "Standard"): string {
  return noeuds
    .map((n) => {
      switch (n.type) {
        case "paragraph":
          return `<text:p text:style-name="${styleParagraphe}">${enligneOdt(morceaux(n), styles)}</text:p>`;
        case "heading": {
          const h = niveauTitre(n);
          return `<text:h text:style-name="Heading_20_${h}" text:outline-level="${h}">${enligneOdt(morceaux(n), styles)}</text:h>`;
        }
        case "bulletList":
        case "taskList":
        case "orderedList":
          return `<text:list text:style-name="${n.type === "orderedList" ? "LNum" : "LPuce"}">${(n.content ?? [])
            .map((li) => `<text:list-item>${corpsOdt(li.content ?? [], styles, ctx, "Liste")}</text:list-item>`)
            .join("")}</text:list>`;
        case "blockquote":
          return corpsOdt(n.content ?? [], styles, ctx, "Quotations");
        case "horizontalRule":
          return '<text:p text:style-name="Separateur"/>';
        case "sautPage":
          return '<text:p text:style-name="SautPage"/>';
        case "table": {
          const lignes = lignesDuTableau(n);
          const cols = Math.max(1, ...lignes.map((l) => l.cellules.length));
          const nom = `Tableau${++ctx.tables}`;
          return `<table:table table:name="${nom}" table:style-name="Tab"><table:table-column table:number-columns-repeated="${cols}"/>${lignes
            .map(
              (l) =>
                `<table:table-row>${Array.from({ length: cols }, (_, i) => {
                  const c = l.cellules[i];
                  const dedans = c ? corpsOdt(c.content ?? [], styles, ctx, c.type === "tableHeader" ? "Table_20_Heading" : "Table_20_Contents") : "<text:p/>";
                  return `<table:table-cell table:style-name="Cel" office:value-type="string">${dedans || "<text:p/>"}</table:table-cell>`;
                }).join("")}</table:table-row>`,
            )
            .join("")}</table:table>`;
        }
        default:
          if (n.content?.some((c) => c.type === "text")) return `<text:p text:style-name="${styleParagraphe}">${enligneOdt(morceaux(n), styles)}</text:p>`;
          return corpsOdt(n.content ?? [], styles, ctx, styleParagraphe);
      }
    })
    .join("");
}

const STYLES_ODT = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles ${NS_ODF}>
<office:font-face-decls><style:font-face style:name="Liberation Serif" svg:font-family="'Liberation Serif'"/><style:font-face style:name="Liberation Sans" svg:font-family="'Liberation Sans'"/></office:font-face-decls>
<office:styles>
<style:default-style style:family="paragraph"><style:paragraph-properties fo:margin-bottom="0.2cm"/><style:text-properties style:font-name="Liberation Serif" fo:font-size="12pt" fo:language="fr" fo:country="FR"/></style:default-style>
<style:style style:name="Standard" style:family="paragraph" style:class="text"><style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.25cm" fo:line-height="130%"/></style:style>
<style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard" style:class="text"><style:paragraph-properties fo:margin-top="0.45cm" fo:margin-bottom="0.2cm" fo:keep-with-next="always"/><style:text-properties style:font-name="Liberation Sans" fo:font-weight="bold"/></style:style>
<style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Heading" style:default-outline-level="1"><style:text-properties fo:font-size="20pt"/></style:style>
<style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Heading" style:default-outline-level="2"><style:text-properties fo:font-size="16pt"/></style:style>
<style:style style:name="Heading_20_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Heading" style:default-outline-level="3"><style:text-properties fo:font-size="13pt"/></style:style>
<style:style style:name="Quotations" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-left="1cm" fo:margin-right="1cm"/><style:text-properties fo:font-style="italic"/></style:style>
<style:style style:name="Liste" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-bottom="0.1cm"/></style:style>
<style:style style:name="Table_20_Contents" style:display-name="Table Contents" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-bottom="0cm"/></style:style>
<style:style style:name="Table_20_Heading" style:display-name="Table Heading" style:family="paragraph" style:parent-style-name="Table_20_Contents"><style:text-properties fo:font-weight="bold"/></style:style>
<style:style style:name="Separateur" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:border-bottom="0.5pt solid #999999" fo:padding-bottom="0.1cm" fo:margin-bottom="0.4cm"/></style:style>
<style:style style:name="SautPage" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:break-after="page"/></style:style>
<text:list-style style:name="LPuce"><text:list-level-style-bullet text:level="1" text:bullet-char="•"><style:list-level-properties text:list-level-position-and-space-mode="label-alignment"><style:list-level-label-alignment text:label-followed-by="listtab" fo:text-indent="-0.6cm" fo:margin-left="1.2cm"/></style:list-level-properties></text:list-level-style-bullet><text:list-level-style-bullet text:level="2" text:bullet-char="◦"><style:list-level-properties text:list-level-position-and-space-mode="label-alignment"><style:list-level-label-alignment text:label-followed-by="listtab" fo:text-indent="-0.6cm" fo:margin-left="1.8cm"/></style:list-level-properties></text:list-level-style-bullet></text:list-style>
<text:list-style style:name="LNum"><text:list-level-style-number text:level="1" style:num-format="1" style:num-suffix="."><style:list-level-properties text:list-level-position-and-space-mode="label-alignment"><style:list-level-label-alignment text:label-followed-by="listtab" fo:text-indent="-0.6cm" fo:margin-left="1.2cm"/></style:list-level-properties></text:list-level-style-number><text:list-level-style-number text:level="2" style:num-format="a" style:num-suffix="."><style:list-level-properties text:list-level-position-and-space-mode="label-alignment"><style:list-level-label-alignment text:label-followed-by="listtab" fo:text-indent="-0.6cm" fo:margin-left="1.8cm"/></style:list-level-properties></text:list-level-style-number></text:list-style>
</office:styles>
<office:automatic-styles><style:page-layout style:name="PL"><style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm"/></style:page-layout></office:automatic-styles>
<office:master-styles><style:master-page style:name="Standard" style:page-layout-name="PL"/></office:master-styles>
</office:document-styles>`;

export function versOdt(doc: Noeud, titre: string): Uint8Array {
  const styles = new Set<string>();
  const corps = corpsOdt(doc.content ?? [], styles, { tables: 0 });
  const auto =
    [...styles].map(definitionStyleTexte).join("") +
    '<style:style style:name="Tab" style:family="table"><style:table-properties style:width="17cm" table:align="margins"/></style:style>' +
    '<style:style style:name="Cel" style:family="table-cell"><style:table-cell-properties fo:padding="0.1cm" fo:border="0.5pt solid #999999"/></style:style>';
  const contenu = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${NS_ODF}><office:automatic-styles>${auto}</office:automatic-styles><office:body><office:text>${corps || "<text:p/>"}</office:text></office:body></office:document-content>`;
  const meta = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.3"><office:meta><dc:title>${echapperXml(titre)}</dc:title><meta:generator>HaqqReason — L'Alambic</meta:generator></office:meta></office:document-meta>`;
  const manifeste = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
<manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.text"/>
<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
  // « mimetype » doit être le premier fichier, et non compressé : c'est ainsi que les logiciels reconnaissent un ODT.
  const fichiers: Zippable = {
    mimetype: [strToU8("application/vnd.oasis.opendocument.text"), { level: 0 }],
    "META-INF/manifest.xml": strToU8(manifeste),
    "content.xml": strToU8(contenu),
    "styles.xml": strToU8(STYLES_ODT),
    "meta.xml": strToU8(meta),
  };
  return zipSync(fichiers, { level: 6 });
}

/* ---------------------------------------------------------------- RTF ---- */

function rtfTexte(t: string): string {
  let s = "";
  for (const c of t) {
    const code = c.codePointAt(0)!;
    if (c === "\\" || c === "{" || c === "}") s += `\\${c}`;
    else if (c === "\t") s += "\\tab ";
    else if (code < 128) s += c;
    else if (code <= 0xffff) s += `\\u${code > 32767 ? code - 65536 : code}?`;
    else {
      // Hors du plan de base (emoji…) : deux unités UTF-16.
      const u = c.charCodeAt(0);
      const v = c.charCodeAt(1);
      s += `\\u${u - 65536}?\\u${v - 65536}?`;
    }
  }
  return s;
}

function enligneRtf(ms: Morceau[]): string {
  return ms
    .map((m) => {
      if (m.saut) return "\\line ";
      const on = `${m.gras ? "\\b" : ""}${m.italique ? "\\i" : ""}${m.souligne ? "\\ul" : ""}${m.barre ? "\\strike" : ""}${m.exposant ? "\\super" : ""}${m.indice ? "\\sub" : ""}`;
      return on ? `{${on} ${rtfTexte(m.texte)}}` : rtfTexte(m.texte);
    })
    .join("");
}

function corpsRtf(noeuds: Noeud[], retrait = 0, puce: (i: number) => string | null = () => null): string {
  return noeuds
    .map((n, i) => {
      switch (n.type) {
        case "paragraph": {
          const marque = puce(i);
          return marque
            ? `\\pard\\li${retrait + 360}\\fi-360\\sa80 ${marque}\\tab ${enligneRtf(morceaux(n))}\\par\n`
            : `\\pard\\li${retrait}\\sa160\\sl276\\slmult1 ${enligneRtf(morceaux(n))}\\par\n`;
        }
        case "heading": {
          const taille = [0, 40, 32, 26][niveauTitre(n)];
          return `\\pard\\keepn\\sb240\\sa120\\li${retrait} {\\f1\\b\\fs${taille} ${enligneRtf(morceaux(n))}}\\par\n`;
        }
        case "bulletList":
        case "taskList":
        case "orderedList": {
          const numerote = n.type === "orderedList";
          return (n.content ?? [])
            .map((li, k) => {
              const enfants = li.content ?? [];
              return corpsRtf(enfants, retrait + 360, (j) => (j === 0 ? (numerote ? `${k + 1}.` : "\\bullet") : null));
            })
            .join("");
        }
        case "blockquote":
          return `{\\i ${corpsRtf(n.content ?? [], retrait + 567)}}`;
        case "horizontalRule":
          return "\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par\n";
        case "sautPage":
          return "\\page\n";
        case "table": {
          const lignes = lignesDuTableau(n);
          const cols = Math.max(1, ...lignes.map((l) => l.cellules.length));
          const largeur = Math.floor(9638 / cols);
          const bords = "\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10";
          return lignes
            .map((l) => {
              const def = `\\trowd\\trgaph108${Array.from({ length: cols }, (_, i) => `${bords}\\cellx${largeur * (i + 1)}`).join("")}`;
              const cellules = Array.from({ length: cols }, (_, i) => {
                const c = l.cellules[i];
                const texte = c ? (c.content ?? []).map((p) => enligneRtf(morceaux(p))).join("\\line ") : "";
                return `\\pard\\intbl ${l.entete ? `{\\b ${texte}}` : texte}\\cell`;
              }).join("");
              return `${def}\n${cellules}\\row\n`;
            })
            .join("") + "\\pard\n";
        }
        default:
          if (n.content?.some((c) => c.type === "text")) return `\\pard\\li${retrait}\\sa160 ${enligneRtf(morceaux(n))}\\par\n`;
          return corpsRtf(n.content ?? [], retrait);
      }
    })
    .join("");
}

export function versRtf(doc: Noeud): string {
  return `{\\rtf1\\ansi\\ansicpg1252\\deff0\\uc1
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}
\\paperw11906\\paperh16838\\margl1134\\margr1134\\margt1134\\margb1134
\\f0\\fs24
${corpsRtf(doc.content ?? [])}}`;
}

/* --------------------------------------------------------------- EPUB ---- */

/** Coupe le document en chapitres à chaque titre de premier niveau. */
function chapitres(doc: Noeud, titre: string): { titre: string; noeuds: Noeud[] }[] {
  const sortie: { titre: string; noeuds: Noeud[] }[] = [];
  let courant: { titre: string; noeuds: Noeud[] } | null = null;
  for (const n of doc.content ?? []) {
    if (n.type === "heading" && niveauTitre(n) === 1) {
      courant = { titre: morceaux(n).map((m) => m.texte).join("").trim() || `Chapitre ${sortie.length + 1}`, noeuds: [n] };
      sortie.push(courant);
    } else {
      if (!courant) {
        courant = { titre, noeuds: [] };
        sortie.push(courant);
      }
      courant.noeuds.push(n);
    }
  }
  return sortie.length ? sortie : [{ titre, noeuds: [] }];
}

export function versEpub(doc: Noeud, titre: string, identifiant: string, date: string): Uint8Array {
  const parties = chapitres(doc, titre);
  const xhtml = (t: string, corps: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head><meta charset="UTF-8"/><title>${echapperXml(t)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
${corps}
</body>
</html>`;
  const fichiers: Zippable = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`),
    "OEBPS/style.css": strToU8(
      'body{font-family:serif;line-height:1.55;margin:0 4%}h1,h2,h3{font-family:sans-serif;line-height:1.25}blockquote{margin:1em 1.5em;font-style:italic}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:.25em .4em}',
    ),
  };
  parties.forEach((p, i) => {
    fichiers[`OEBPS/chapitre-${i + 1}.xhtml`] = strToU8(xhtml(p.titre, corpsHtml(p.noeuds)));
  });
  const nav = xhtml(
    titre,
    `<nav epub:type="toc" id="toc"><h1>Sommaire</h1><ol>${parties.map((p, i) => `<li><a href="chapitre-${i + 1}.xhtml">${echapperXml(p.titre)}</a></li>`).join("")}</ol></nav>`,
  );
  fichiers["OEBPS/nav.xhtml"] = strToU8(nav);
  fichiers["OEBPS/toc.ncx"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${identifiant}"/></head><docTitle><text>${echapperXml(titre)}</text></docTitle><navMap>${parties
    .map((p, i) => `<navPoint id="n${i + 1}" playOrder="${i + 1}"><navLabel><text>${echapperXml(p.titre)}</text></navLabel><content src="chapitre-${i + 1}.xhtml"/></navPoint>`)
    .join("")}</navMap></ncx>`);
  fichiers["OEBPS/content.opf"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="fr">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">${identifiant}</dc:identifier>
<dc:title>${echapperXml(titre)}</dc:title>
<dc:language>fr</dc:language>
<meta property="dcterms:modified">${date}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="style.css" media-type="text/css"/>
${parties.map((_, i) => `<item id="c${i + 1}" href="chapitre-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("\n")}
</manifest>
<spine toc="ncx">
${parties.map((_, i) => `<itemref idref="c${i + 1}"/>`).join("\n")}
</spine>
</package>`);
  return zipSync(fichiers, { level: 6 });
}
