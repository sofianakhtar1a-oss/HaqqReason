/**
 * Le Calame — export Word (.docx).
 *
 * Un vrai fichier OOXML, écrit ici même : paragraphes, titres, gras, italique,
 * souligné, barré, listes à puces et numérotées, citations, tableaux, images,
 * et la mise en page (format, marges, en-tête, pied, numérotation) reprise des
 * réglages du document. Word et LibreOffice l'ouvrent sans conversion.
 *
 * La fonction principale est pure : on lui donne le document et les images déjà
 * décodées, elle rend les octets du fichier. C'est le navigateur qui décode les
 * images avant l'appel — ce qui rend l'écriture du .docx testable hors navigateur.
 */

import { zipSync, strToU8 } from "fflate";
import { geometrie, MM, type ReglagesPage, type Styles } from "./modele";

type Noeud = { type?: string; text?: string; content?: Noeud[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] };

export type ImageDecodee = { id: string; octets: Uint8Array; extension: "png" | "jpeg" | "gif" | "webp"; largeur: number; hauteur: number };

/** 1 point typographique = 20 twips ; 1 mm = 1440/25,4 twips. */
const TWIPS_PAR_MM = 1440 / 25.4;
const EMU_PAR_PIXEL = 9525;

function xml(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function demiPoints(taille: number): number {
  return Math.round(taille * 2);
}

// ---------------------------------------------------------------------------
// Contenu du document
// ---------------------------------------------------------------------------

function fragments(noeuds: Noeud[] | undefined, heritees: string[] = []): string {
  return (noeuds ?? [])
    .map((n) => {
      if (n.type === "hardBreak") return `<w:r><w:br/></w:r>`;
      if (n.type !== "text") return fragments(n.content, heritees);
      const proprietes: string[] = [...heritees];
      let lien: string | null = null;
      for (const marque of n.marks ?? []) {
        if (marque.type === "bold") proprietes.push("<w:b/>");
        else if (marque.type === "italic") proprietes.push("<w:i/>");
        else if (marque.type === "strike") proprietes.push("<w:strike/>");
        else if (marque.type === "souligne") proprietes.push('<w:u w:val="single"/>');
        else if (marque.type === "superscript") proprietes.push('<w:vertAlign w:val="superscript"/>');
        else if (marque.type === "subscript") proprietes.push('<w:vertAlign w:val="subscript"/>');
        else if (marque.type === "surligne") proprietes.push('<w:highlight w:val="yellow"/>');
        else if (marque.type === "couleur") proprietes.push(`<w:color w:val="${String(marque.attrs?.couleur ?? "#000000").replace("#", "").slice(0, 6)}"/>`);
        else if (marque.type === "link") lien = String(marque.attrs?.href ?? "");
      }
      const rPr = proprietes.length ? `<w:rPr>${proprietes.join("")}</w:rPr>` : "";
      const run = `<w:r>${rPr}<w:t xml:space="preserve">${xml(n.text ?? "")}</w:t></w:r>`;
      // Le lien est écrit en clair entre parenthèses : pas de relation à poser, pas de fichier à casser.
      return lien ? `${run}<w:r><w:t xml:space="preserve"> (${xml(lien)})</w:t></w:r>` : run;
    })
    .join("");
}

function paragraphe(contenu: string, options: { style?: string; retrait?: number; liste?: { niveau: number; numerotee: boolean }; alignement?: string } = {}): string {
  const pPr: string[] = [];
  if (options.style) pPr.push(`<w:pStyle w:val="${options.style}"/>`);
  if (options.liste) pPr.push(`<w:numPr><w:ilvl w:val="${options.liste.niveau}"/><w:numId w:val="${options.liste.numerotee ? 2 : 1}"/></w:numPr>`);
  if (options.retrait) pPr.push(`<w:ind w:left="${Math.round(options.retrait * TWIPS_PAR_MM)}"/>`);
  if (options.alignement && options.alignement !== "left") pPr.push(`<w:jc w:val="${options.alignement === "justify" ? "both" : options.alignement}"/>`);
  const avant = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${avant}${contenu}</w:p>`;
}

function image(img: ImageDecodee, index: number, legende: string, largeurZone: number): string {
  const echelle = Math.min(1, largeurZone / Math.max(1, img.largeur));
  const cx = Math.round(img.largeur * echelle * EMU_PAR_PIXEL);
  const cy = Math.round(img.hauteur * echelle * EMU_PAR_PIXEL);
  const dessin =
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index + 1}" name="Image ${index + 1}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${index + 1}" name="Image ${index + 1}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rId${100 + index}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  const corps = paragraphe(dessin, { alignement: "center" });
  return legende ? corps + paragraphe(`<w:r><w:rPr><w:i/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${xml(legende)}</w:t></w:r>`, { alignement: "center" }) : corps;
}

function tableau(noeud: Noeud): string {
  const lignes = (noeud.content ?? []).map((ligne) => {
    const cellules = (ligne.content ?? []).map((cellule) => {
      const dedans = (cellule.content ?? []).map((p) => paragraphe(fragments(p.content))).join("") || paragraphe("");
      return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${dedans}</w:tc>`;
    });
    return `<w:tr>${cellules.join("")}</w:tr>`;
  });
  return `<w:tbl><w:tblPr><w:tblStyle w:val="Grille"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((c) => `<w:${c} w:val="single" w:sz="4" w:color="BFC4D8"/>`)
    .join("")}</w:tblBorders></w:tblPr>${lignes.join("")}</w:tbl>`;
}

function corpsDuDocument(noeuds: Noeud[], images: Map<string, { img: ImageDecodee; index: number }>, largeurZone: number, profondeur = 0): string {
  return noeuds
    .map((n) => {
      const a = n.attrs ?? {};
      switch (n.type) {
        case "heading":
          return paragraphe(fragments(n.content), { style: `Titre${Math.min(3, Math.max(1, Number(a.level ?? 2) - 1))}`, alignement: String(a.textAlign ?? "left") });
        case "paragraph":
          return paragraphe(fragments(n.content), { alignement: String(a.textAlign ?? "left") });
        case "bulletList":
        case "orderedList":
        case "taskList":
          return (n.content ?? [])
            .map((item) =>
              (item.content ?? [])
                .map((p, i) =>
                  i === 0
                    ? paragraphe(fragments(p.content), { liste: { niveau: Math.min(4, profondeur), numerotee: n.type === "orderedList" } })
                    : corpsDuDocument([p], images, largeurZone, profondeur + 1),
                )
                .join(""),
            )
            .join("");
        case "blockquote":
        case "verset":
        case "hadith":
        case "encadre":
        case "objection":
        case "reponse":
          return (n.content ?? []).map((p) => paragraphe(fragments(p.content, n.type === "verset" ? ["<w:i/>"] : []), { style: "Citation", retrait: 8 })).join("");
        case "horizontalRule":
          return paragraphe(`<w:r><w:t>———</w:t></w:r>`, { alignement: "center" });
        case "codeBlock":
          return paragraphe(fragments(n.content, ['<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>']));
        case "table":
          return tableau(n) + paragraphe("");
        case "image": {
          const trouvee = images.get(String(a.fichier ?? ""));
          return trouvee ? image(trouvee.img, trouvee.index, String(a.legende ?? ""), largeurZone) : paragraphe(`<w:r><w:rPr><w:i/></w:rPr><w:t>[image]</w:t></w:r>`);
        }
        case "documentPdf":
          return paragraphe(`<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">[Document joint : ${xml(String(a.nom ?? "document"))}]</w:t></w:r>`);
        case "sautPage":
          return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        default:
          return n.content ? corpsDuDocument(n.content, images, largeurZone, profondeur) : "";
      }
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Les pièces du fichier
// ---------------------------------------------------------------------------

function stylesXml(styles: Styles): string {
  const titre = (jeton: Styles[keyof Styles], id: string, nom: string, niveau: number) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${nom}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="${niveau}"/>` +
    `<w:spacing w:before="${Math.round(jeton.avant * 20)}" w:after="${Math.round(jeton.apres * 20)}"/></w:pPr>` +
    `<w:rPr><w:b/><w:sz w:val="${demiPoints(jeton.taille)}"/><w:color w:val="${jeton.couleur.replace("#", "").slice(0, 6)}"/></w:rPr></w:style>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/><w:sz w:val="${demiPoints(styles.corps.taille)}"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="${Math.round(styles.corps.apres * 20)}" w:line="${Math.round(styles.corps.interligne * 240)}" w:lineRule="auto"/></w:pPr></w:style>
${titre(styles.titre1, "Titre1", "heading 1", 0)}
${titre(styles.titre2, "Titre2", "heading 2", 1)}
${titre(styles.titre3, "Titre3", "heading 3", 2)}
<w:style w:type="paragraph" w:styleId="Citation"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="454"/></w:pPr><w:rPr><w:i/><w:color w:val="${styles.citation.couleur.replace("#", "").slice(0, 6)}"/></w:rPr></w:style>
</w:styles>`;
}

const NUMEROTATION = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>
${[0, 1, 2, 3, 4]
  .map(
    (n) =>
      `<w:lvl w:ilvl="${n}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (n + 1)}" w:hanging="360"/></w:pPr></w:lvl>`,
  )
  .join("")}
</w:abstractNum>
<w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="hybridMultilevel"/>
${[0, 1, 2, 3, 4]
  .map(
    (n) =>
      `<w:lvl w:ilvl="${n}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%${n + 1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (n + 1)}" w:hanging="360"/></w:pPr></w:lvl>`,
  )
  .join("")}
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`;

function sectionXml(reglages: ReglagesPage, avecEntete: boolean, avecPied: boolean): string {
  const papier = geometrie(reglages);
  const l = Math.round((papier.page.largeur / MM) * TWIPS_PAR_MM);
  const h = Math.round((papier.page.hauteur / MM) * TWIPS_PAR_MM);
  const m = reglages.marges;
  const refs = [avecEntete ? '<w:headerReference w:type="default" r:id="rId10"/>' : "", avecPied ? '<w:footerReference w:type="default" r:id="rId11"/>' : ""].join("");
  return (
    `<w:sectPr>${refs}<w:pgSz w:w="${l}" w:h="${h}"${reglages.orientation === "paysage" ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${Math.round(m.haut * TWIPS_PAR_MM)}" w:right="${Math.round(m.droite * TWIPS_PAR_MM)}" w:bottom="${Math.round(m.bas * TWIPS_PAR_MM)}" w:left="${Math.round(m.gauche * TWIPS_PAR_MM)}" w:header="708" w:footer="708"/>` +
    `<w:titlePg/></w:sectPr>`
  );
}

function enteteXml(texte: string, balise: "hdr" | "ftr", numeroter: boolean): string {
  const champ = numeroter
    ? `<w:r><w:t xml:space="preserve">   </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${balise} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="${balise === "ftr" ? "center" : "right"}"/><w:rPr><w:sz w:val="18"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${xml(texte)}</w:t></w:r>${champ}</w:p></w:${balise}>`;
}

const TYPES_MIME: Record<ImageDecodee["extension"], string> = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

/**
 * Écrit le fichier .docx. Rien n'est lu du navigateur : les images arrivent
 * déjà décodées, le reste est du texte.
 */
export function construireDocx(options: { titre: string; contenu: unknown; reglages: ReglagesPage; images?: ImageDecodee[] }): Uint8Array {
  const { titre, reglages } = options;
  const images = options.images ?? [];
  const parId = new Map(images.map((img, index) => [img.id, { img, index }]));
  const racine = (options.contenu ?? {}) as Noeud;
  const largeurZone = geometrie(reglages).zone.largeur;

  const entete = reglages.entete.trim();
  const pied = reglages.pied.trim();
  const avecEntete = entete !== "";
  const avecPied = pied !== "" || reglages.numeroter;

  // Un titre vide (conversion d'un fichier qui a déjà ses propres titres) n'ajoute pas de grand titre en tête.
  const corps =
    (titre.trim() ? paragraphe(`<w:r><w:rPr><w:b/><w:sz w:val="${demiPoints(reglages.styles.titre1.taille + 4)}"/></w:rPr><w:t xml:space="preserve">${xml(titre)}</w:t></w:r>`, { style: "Titre1" }) : "") +
    corpsDuDocument(racine.content ?? [], parId, largeurZone);

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${corps}${sectionXml(reglages, avecEntete, avecPied)}</w:body></w:document>`;

  const relations = [
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    avecEntete ? '<Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : "",
    avecPied ? '<Relationship Id="rId11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : "",
    ...images.map((img, i) => `<Relationship Id="rId${100 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i}.${img.extension}"/>`),
  ].join("");

  const typesImages = [...new Set(images.map((i) => i.extension))]
    .map((ext) => `<Default Extension="${ext}" ContentType="${TYPES_MIME[ext]}"/>`)
    .join("");

  const fichiers: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>${typesImages}
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
${avecEntete ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ""}
${avecPied ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`),
    "word/document.xml": strToU8(document),
    "word/styles.xml": strToU8(stylesXml(reglages.styles)),
    "word/numbering.xml": strToU8(NUMEROTATION),
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relations}</Relationships>`),
  };
  if (avecEntete) fichiers["word/header1.xml"] = strToU8(enteteXml(entete, "hdr", false));
  if (avecPied) fichiers["word/footer1.xml"] = strToU8(enteteXml(pied, "ftr", reglages.numeroter));
  for (const [i, img] of images.entries()) fichiers[`word/media/image${i}.${img.extension}`] = img.octets;

  return zipSync(fichiers, { level: 6 });
}
