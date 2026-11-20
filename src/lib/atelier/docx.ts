/**
 * Le Calame — export Word (.docx).
 *
 * Un vrai fichier OOXML, écrit ici même : paragraphes, titres, gras, italique,
 * souligné, barré, listes à puces et numérotées, citations, tableaux, images,
 * et la mise en page (format, marges, en-tête, pied, numérotation) reprise des
 * réglages du document. Word et LibreOffice l'ouvrent sans conversion.
 *
 * S'y ajoutent ce qu'un mémoire attend de Word : de vraies notes de bas de page (ou de fin),
 * l'arabe écrit de droite à gauche, des liens cliquables (vers le web ou vers une partie du
 * document), la table des matières, l'index et la table des figures sous forme de champs que
 * Word numérote lui-même, les sections en paysage, et les propriétés du document.
 *
 * La fonction principale est pure : on lui donne le document et les images déjà
 * décodées, elle rend les octets du fichier. C'est le navigateur qui décode les
 * images avant l'appel — ce qui rend l'écriture du .docx testable hors navigateur.
 */

import { zipSync, strToU8 } from "fflate";
import { dateHegirienne } from "./composition";
import { geometrie, MM, zonesDeLaPage, type ReglagesPage, type Styles, type ZonesLigne } from "./modele";

type Noeud = { type?: string; text?: string; content?: Noeud[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] };

export type ImageDecodee = { id: string; octets: Uint8Array; extension: "png" | "jpeg" | "gif" | "webp"; largeur: number; hauteur: number };

/** Les propriétés du document (Fichier › Propriétés dans Word). */
export type ProprietesDocx = { auteur?: string; sujet?: string; motsCles?: string; statut?: string };

/** 1 point typographique = 20 twips ; 1 mm = 1440/25,4 twips. */
const TWIPS_PAR_MM = 1440 / 25.4;
const EMU_PAR_PIXEL = 9525;
/** Police de l'arabe dans Word (installée avec Office ; sinon Word en choisit une proche). */
const POLICE_ARABE = "Traditional Arabic";
const LETTRES_ARABES = "؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
const ARABE = new RegExp(`[${LETTRES_ARABES}]`);
/** Un passage arabe : de la première à la dernière lettre arabe, espaces et chiffres compris. */
const PASSAGES_ARABES = new RegExp(`([${LETTRES_ARABES}](?:[${LETTRES_ARABES}\\s\u0660-\u0669]*[${LETTRES_ARABES}\u0660-\u0669])?)`, "g");
const DEGRES: Record<string, string> = {
  sahih: "authentique (ṣaḥīḥ)",
  "sahih-li-ghayrihi": "authentique par ses appuis (ṣaḥīḥ li-ghayrihi)",
  hasan: "bon (ḥasan)",
  "hasan-li-ghayrihi": "bon par ses appuis (ḥasan li-ghayrihi)",
  daif: "faible (ḍaʿīf)",
  mawdu: "forgé (mawḍūʿ)",
};

function xml(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function demiPoints(taille: number): number {
  return Math.round(taille * 2);
}

/** Ce que l'écriture accumule en chemin : les notes, les liens, les signets. */
type Contexte = {
  images: Map<string, { img: ImageDecodee; index: number }>;
  largeurZone: number;
  notes: string[];
  enFin: boolean;
  liens: string[];
  signets: number;
  styles: Styles;
  /** Orientation de la section en cours (un saut de section en change). */
  orientation: ReglagesPage["orientation"];
  reglages: ReglagesPage;
  avecEntete: boolean;
  avecPied: boolean;
  avecPaires: boolean;
  /** Les titres (pour le résultat provisoire de la table des matières). */
  titres: { niveau: number; texte: string }[];
  termes: string[];
  /** Relevés d'avance (premier passage) : ce que la table des matières, l'index et la table des figures affichent avant que Word ne les mette à jour. */
  prevus: { titres: { niveau: number; texte: string }[]; termes: string[]; legendes: string[] };
};

function releve(racine: Noeud): Contexte["prevus"] {
  const prevus: Contexte["prevus"] = { titres: [], termes: [], legendes: [] };
  const texteDe = (n: Noeud): string => (n.type === "text" ? (n.text ?? "") : (n.content ?? []).map(texteDe).join(""));
  const visiter = (n: Noeud) => {
    if (n.type === "heading") prevus.titres.push({ niveau: Math.min(4, Math.max(2, Number(n.attrs?.level ?? 2))), texte: texteDe(n).trim() });
    if (n.type === "image" && n.attrs?.legende) prevus.legendes.push(String(n.attrs.legende));
    if (n.type === "paragraph" && n.attrs?.styleNomme === "legende") prevus.legendes.push(texteDe(n).trim());
    if (n.type === "text") {
      const m = n.marks?.find((x) => x.type === "indexe");
      const terme = m ? (String(m.attrs?.terme ?? "") || n.text || "").trim() : "";
      if (terme && !prevus.termes.includes(terme)) prevus.termes.push(terme);
    }
    (n.content ?? []).forEach(visiter);
  };
  visiter(racine);
  prevus.termes.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  return prevus;
}

/** Un nom de signet accepté par Word : une lettre d'abord, 40 signes au plus, sans espace. */
const nomSignet = (ancre: string) => `a_${ancre.replace(/[^A-Za-z0-9_]/g, "_")}`.slice(0, 40);

// ---------------------------------------------------------------------------
// Contenu du document
// ---------------------------------------------------------------------------

/** L'ordre des propriétés de caractère imposé par le format (Word refuse le fichier sinon). */
const ORDRE_RPR = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "color", "spacing", "sz", "szCs", "highlight", "u", "vertAlign", "rtl", "lang"];
function ordonner(proprietes: string[]): string[] {
  const rang = (p: string) => {
    const i = ORDRE_RPR.indexOf(/^<w:(\w+)/.exec(p)?.[1] ?? "");
    return i < 0 ? ORDRE_RPR.length : i;
  };
  return [...new Set(proprietes)].sort((a, b) => rang(a) - rang(b));
}

/** Un texte en un ou plusieurs « runs » : les passages arabes sont marqués de droite à gauche. */
function runs(texte: string, proprietes: string[]): string {
  if (!texte) return "";
  const morceaux = ARABE.test(texte) ? texte.split(PASSAGES_ARABES) : [texte];
  return morceaux
    .map((m, i) => {
      if (!m) return "";
      const arabe = i % 2 === 1;
      const p = ordonner(arabe ? [...proprietes, "<w:rtl/>"] : proprietes);
      const rPr = p.length ? `<w:rPr>${p.join("")}</w:rPr>` : "";
      return `<w:r>${rPr}<w:t xml:space="preserve">${xml(m)}</w:t></w:r>`;
    })
    .join("");
}

/** Un champ Word tenu dans un paragraphe (PAGE, XE, NUMPAGES…). */
function champ(instruction: string, resultat = "", proprietes = ""): string {
  const rPr = proprietes ? `<w:rPr>${proprietes}</w:rPr>` : "";
  return (
    `<w:r>${rPr}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rPr}<w:instrText xml:space="preserve"> ${xml(instruction)} </w:instrText></w:r>` +
    (resultat ? `<w:r>${rPr}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rPr}<w:t xml:space="preserve">${xml(resultat)}</w:t></w:r>` : "") +
    `<w:r>${rPr}<w:fldChar w:fldCharType="end"/></w:r>`
  );
}

function fragments(ctx: Contexte, noeuds: Noeud[] | undefined, heritees: string[] = []): string {
  return (noeuds ?? [])
    .map((n) => {
      if (n.type === "hardBreak") return `<w:r><w:br/></w:r>`;
      if (n.type === "note") {
        ctx.notes.push(String(n.attrs?.texte ?? "").trim());
        const id = ctx.notes.length;
        return `<w:r><w:rPr><w:rStyle w:val="AppelNote"/></w:rPr>${ctx.enFin ? `<w:endnoteReference w:id="${id}"/>` : `<w:footnoteReference w:id="${id}"/>`}</w:r>`;
      }
      if (n.type !== "text") return fragments(ctx, n.content, heritees);
      const proprietes: string[] = [...heritees];
      let lien: string | null = null;
      let ancre: string | null = null;
      let terme: string | null = null;
      for (const marque of n.marks ?? []) {
        if (marque.type === "bold") proprietes.push("<w:b/>");
        else if (marque.type === "italic") proprietes.push("<w:i/>");
        else if (marque.type === "strike") proprietes.push("<w:strike/>");
        else if (marque.type === "souligne") proprietes.push('<w:u w:val="single"/>');
        else if (marque.type === "superscript") proprietes.push('<w:vertAlign w:val="superscript"/>');
        else if (marque.type === "subscript") proprietes.push('<w:vertAlign w:val="subscript"/>');
        else if (marque.type === "surligne") proprietes.push('<w:highlight w:val="yellow"/>');
        else if (marque.type === "code") proprietes.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>');
        else if (marque.type === "couleur") proprietes.push(`<w:color w:val="${String(marque.attrs?.couleur ?? "#000000").replace("#", "").slice(0, 6)}"/>`);
        else if (marque.type === "link") lien = String(marque.attrs?.href ?? "");
        else if (marque.type === "lienInterne" && marque.attrs?.ancre) ancre = String(marque.attrs.ancre);
        else if (marque.type === "indexe") terme = (String(marque.attrs?.terme ?? "") || n.text || "").trim();
      }
      const texte = n.text ?? "";
      let sortie: string;
      if (lien && /^(https?:|mailto:)/i.test(lien)) {
        ctx.liens.push(lien);
        sortie = `<w:hyperlink r:id="rIdL${ctx.liens.length}" w:history="1">${runs(texte, ['<w:rStyle w:val="Lien"/>', ...proprietes])}</w:hyperlink>`;
        // L'adresse reste lisible sur papier quand le texte du lien ne la montre pas.
        if (texte.trim() !== lien && texte.trim() !== lien.replace(/^https?:\/\//, "")) sortie += runs(` (${lien})`, []);
      } else if (ancre) {
        sortie = `<w:hyperlink w:anchor="${nomSignet(ancre)}" w:history="1">${runs(texte, ['<w:rStyle w:val="Lien"/>', ...proprietes])}</w:hyperlink>`;
      } else {
        sortie = runs(texte, proprietes);
        if (lien) sortie += runs(` (${lien})`, []);
      }
      if (terme) {
        if (!ctx.termes.includes(terme)) ctx.termes.push(terme);
        sortie += champ(`XE "${terme.replace(/"/g, "'")}"`);
      }
      return sortie;
    })
    .join("");
}

/** La première lettre forte du paragraphe décide de son sens (comme à l'écran). */
function commenceEnArabe(noeuds: Noeud[] | undefined): boolean {
  const texte = (noeuds ?? []).map((n) => (n.type === "text" ? (n.text ?? "") : "")).join("");
  const premiere = new RegExp(`[A-Za-z\u00C0-\u00FF${LETTRES_ARABES}]`).exec(texte)?.[0] ?? "";
  return ARABE.test(premiere);
}

type OptionsParagraphe = { style?: string; retrait?: number; liste?: { niveau: number; numerotee: boolean }; alignement?: string; bidi?: boolean; avant?: string; signet?: string; ctx?: Contexte; espacement?: string; tabulations?: string };

function paragraphe(contenu: string, options: OptionsParagraphe = {}): string {
  const pPr: string[] = [];
  if (options.style) pPr.push(`<w:pStyle w:val="${options.style}"/>`);
  if (options.liste) pPr.push(`<w:numPr><w:ilvl w:val="${options.liste.niveau}"/><w:numId w:val="${options.liste.numerotee ? 2 : 1}"/></w:numPr>`);
  if (options.tabulations) pPr.push(options.tabulations);
  if (options.bidi) pPr.push("<w:bidi/>");
  if (options.espacement) pPr.push(options.espacement);
  if (options.retrait) pPr.push(`<w:ind w:left="${Math.round(options.retrait * TWIPS_PAR_MM)}"/>`);
  // Dans un paragraphe de droite à gauche, « début » est à droite : on ne force que le centré et le justifié.
  if (options.alignement && options.alignement !== "left" && !(options.bidi && options.alignement === "right")) pPr.push(`<w:jc w:val="${options.alignement === "justify" ? "both" : options.alignement}"/>`);
  const avant = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  if (options.signet && options.ctx) {
    const id = ++options.ctx.signets;
    return `<w:p>${avant}<w:bookmarkStart w:id="${id}" w:name="${nomSignet(options.signet)}"/>${contenu}<w:bookmarkEnd w:id="${id}"/></w:p>`;
  }
  return `<w:p>${avant}${contenu}</w:p>`;
}

function image(img: ImageDecodee, index: number, legende: string, largeurZone: number, proportion = 1): string {
  const echelle = Math.min(1, (largeurZone * proportion) / Math.max(1, img.largeur));
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
  return legende ? corps + paragraphe(runs(legende, []), { style: "Legende", alignement: "center" }) : corps;
}

function tableau(ctx: Contexte, noeud: Noeud): string {
  const lignes = (noeud.content ?? []).map((ligne) => {
    const entete = (ligne.content ?? []).every((c) => c.type === "tableHeader");
    const cellules = (ligne.content ?? []).map((cellule) => {
      const a = cellule.attrs ?? {};
      const fond = typeof a.fond === "string" && /^#[0-9a-f]{6}$/i.test(a.fond) ? a.fond.slice(1) : cellule.type === "tableHeader" ? "EEF0F6" : "";
      const span = Number(a.colspan) > 1 ? `<w:gridSpan w:val="${Number(a.colspan)}"/>` : "";
      const alignement = typeof a.alignement === "string" ? a.alignement : "";
      const dedans =
        (cellule.content ?? [])
          .map((p) => paragraphe(fragments(ctx, p.content, cellule.type === "tableHeader" ? ["<w:b/>"] : []), { alignement: alignement || String(p.attrs?.textAlign ?? ""), bidi: commenceEnArabe(p.content) }))
          .join("") || paragraphe("");
      return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${span}${fond ? `<w:shd w:val="clear" w:color="auto" w:fill="${fond}"/>` : ""}</w:tcPr>${dedans}</w:tc>`;
    });
    // La ligne d'en-tête se répète en haut de chaque page, comme à l'écran.
    return `<w:tr>${entete ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${cellules.join("")}</w:tr>`;
  });
  return `<w:tbl><w:tblPr><w:tblStyle w:val="Grille"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((c) => `<w:${c} w:val="single" w:sz="4" w:color="BFC4D8"/>`)
    .join("")}</w:tblBorders></w:tblPr>${lignes.join("")}</w:tbl>`;
}

/** Une table des matières, un index ou une table des figures : un champ que Word remplit et numérote. */
function champSurPlusieursParagraphes(instruction: string, titre: string, lignes: { texte: string; style: string }[], vide: string, styleTitre = "TitreSommaire"): string {
  const debut = `<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> ${xml(instruction)} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`;
  const fin = `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  const entete = paragraphe(runs(titre, []), { style: styleTitre });
  if (lignes.length === 0) return entete + paragraphe(`${debut}${runs(vide, ["<w:i/>"])}${fin}`);
  return (
    entete +
    lignes
      .map((l, i) => paragraphe(`${i === 0 ? debut : ""}${runs(l.texte, [])}${i === lignes.length - 1 ? fin : ""}`, { style: l.style }))
      .join("")
  );
}

/** Les réglages d'une section (format, marges, orientation, en-têtes, numérotation). */
function sectionXml(reglages: ReglagesPage, avecEntete: boolean, avecPied: boolean, avecPaires = false): string {
  const papier = geometrie(reglages);
  const l = Math.round((papier.page.largeur / MM) * TWIPS_PAR_MM);
  const h = Math.round((papier.page.hauteur / MM) * TWIPS_PAR_MM);
  const m = reglages.marges;
  const refs = [
    avecEntete ? '<w:headerReference w:type="default" r:id="rId10"/>' : "",
    avecEntete && avecPaires ? '<w:headerReference w:type="even" r:id="rId12"/>' : "",
    avecPied ? '<w:footerReference w:type="default" r:id="rId11"/>' : "",
    avecPied && avecPaires ? '<w:footerReference w:type="even" r:id="rId13"/>' : "",
  ].join("");
  const format = reglages.numeroStyle === "romain" ? ' w:fmt="lowerRoman"' : reglages.numeroStyle === "ROMAIN" ? ' w:fmt="upperRoman"' : "";
  const depart = reglages.premierNumero > 0 && reglages.premierNumero !== 1 ? ` w:start="${reglages.premierNumero}"` : "";
  return (
    `<w:sectPr>${refs}<w:pgSz w:w="${l}" w:h="${h}"${reglages.orientation === "paysage" ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${Math.round(m.haut * TWIPS_PAR_MM)}" w:right="${Math.round(m.droite * TWIPS_PAR_MM)}" w:bottom="${Math.round(m.bas * TWIPS_PAR_MM)}" w:left="${Math.round(m.gauche * TWIPS_PAR_MM)}" w:header="708" w:footer="708"/>` +
    (format || depart ? `<w:pgNumType${format}${depart}/>` : "") +
    `${reglages.premierePageNue === false ? "" : "<w:titlePg/>"}</w:sectPr>`
  );
}

function corpsDuDocument(ctx: Contexte, noeuds: Noeud[], profondeur = 0): string {
  const { images, largeurZone } = ctx;
  return noeuds
    .map((n) => {
      const a = n.attrs ?? {};
      switch (n.type) {
        case "heading": {
          const niveau = Math.min(4, Math.max(2, Number(a.level ?? 2)));
          ctx.titres.push({ niveau, texte: (n.content ?? []).map((x) => x.text ?? "").join("").trim() });
          return paragraphe(fragments(ctx, n.content), { style: `Titre${Math.min(3, Math.max(1, Number(a.level ?? 2) - 1))}`, alignement: String(a.textAlign ?? "left"), bidi: commenceEnArabe(n.content), signet: a.ancre ? String(a.ancre) : undefined, ctx });
        }
        case "paragraph": {
          const style = a.styleNomme === "legende" ? "Legende" : a.styleNomme === "bibliographie" ? "Bibliographie" : a.styleNomme === "titre-garde" ? "TitreGarde" : undefined;
          return paragraphe(fragments(ctx, n.content), { style, alignement: String(a.textAlign ?? "left"), bidi: a.dir === "rtl" || commenceEnArabe(n.content), signet: a.ancre ? String(a.ancre) : undefined, ctx });
        }
        case "bulletList":
        case "orderedList":
        case "taskList":
          return (n.content ?? [])
            .map((item) =>
              (item.content ?? [])
                .map((p, i) =>
                  i === 0 && p.type === "paragraph"
                    ? paragraphe(fragments(ctx, p.content), { liste: { niveau: Math.min(4, profondeur), numerotee: n.type === "orderedList" }, bidi: commenceEnArabe(p.content) })
                    : corpsDuDocument(ctx, [p], profondeur + 1),
                )
                .join(""),
            )
            .join("");
        case "verset":
        case "hadith": {
          // Le texte arabe de droite à gauche, la traduction en italique, puis la référence.
          const lignes = (n.content ?? [])
            .map((p) => {
              const arabe = p.type === "versetArabe" || p.type === "hadithArabe" || commenceEnArabe(p.content);
              if (arabe) return paragraphe(fragments(ctx, p.content, [`<w:szCs w:val="${demiPoints(ctx.styles.corps.taille * 1.35)}"/>`]), { style: "TexteArabe", bidi: true });
              return (p.content ?? []).length ? paragraphe(fragments(ctx, p.content, ["<w:i/>"]), { style: "Citation", retrait: 8 }) : "";
            })
            .join("");
          const reference =
            n.type === "verset"
              ? `Coran, ${String(a.reference || "référence à préciser")}`
              : [String(a.recueil || "Recueil à préciser"), a.numero ? `n° ${String(a.numero)}` : "", DEGRES[String(a.degre ?? "")] ?? ""].filter(Boolean).join(", ");
          return lignes + paragraphe(runs(`(${reference})`, []), { style: "Reference" });
        }
        case "blockquote":
        case "encadre":
        case "objection":
        case "reponse":
          return (n.content ?? [])
            .map((p) => (p.type === "paragraph" || p.type === "heading" ? paragraphe(fragments(ctx, p.content), { style: "Citation", retrait: 8, bidi: commenceEnArabe(p.content) }) : corpsDuDocument(ctx, [p], profondeur)))
            .join("");
        case "horizontalRule":
          return paragraphe(`<w:r><w:t>———</w:t></w:r>`, { alignement: "center" });
        case "codeBlock":
          return paragraphe(fragments(ctx, n.content, ['<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>']));
        case "table":
          return tableau(ctx, n) + paragraphe("");
        case "image": {
          const trouvee = images.get(String(a.fichier ?? ""));
          const proportion = a.taille ? Math.min(1, Math.max(0.2, Number(a.taille) / 100)) : a.largeur === "petite" ? 0.5 : 1;
          return trouvee ? image(trouvee.img, trouvee.index, String(a.legende ?? ""), largeurZone, proportion) : paragraphe(`<w:r><w:rPr><w:i/></w:rPr><w:t>[image]</w:t></w:r>`);
        }
        case "documentPdf":
          return paragraphe(`<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">[Document joint : ${xml(String(a.nom ?? "document"))}]</w:t></w:r>`);
        case "sautPage":
          return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        case "sautSection": {
          // La section qui se termine garde son orientation ; la suivante prend celle du saut.
          const fermee = sectionXml({ ...ctx.reglages, orientation: ctx.orientation }, ctx.avecEntete, ctx.avecPied, ctx.avecPaires);
          ctx.orientation = a.orientation === "paysage" ? "paysage" : "portrait";
          return `<w:p><w:pPr>${fermee}</w:pPr></w:p>`;
        }
        case "sommaire": {
          // Word met les numéros de page à l'ouverture ; en attendant (ou dans un autre logiciel), les titres sont déjà là.
          const profondeurToc = Math.min(3, Math.max(1, Number(a.profondeur ?? 4) - 1));
          const lignes = ctx.prevus.titres.filter((t) => t.niveau - 1 <= profondeurToc).map((t) => ({ texte: t.texte, style: `TM${t.niveau - 1}` }));
          return champSurPlusieursParagraphes(`TOC \\o "1-${profondeurToc}" \\h \\z \\u`, String(a.titre || "Table des matières"), lignes, "Pas encore de titres : la table se remplira à la mise à jour des champs.");
        }
        case "indexAlpha":
          return champSurPlusieursParagraphes(`INDEX \\h "A" \\c "2" \\z "1036"`, "Index", ctx.prevus.termes.map((t) => ({ texte: t, style: "Normal" })), "Marque des mots pour l'index : il se remplira à la mise à jour des champs.");
        case "tableFigures":
          return champSurPlusieursParagraphes(`TOC \\h \\z \\t "Légende du Calame,1"`, "Table des figures", ctx.prevus.legendes.map((t) => ({ texte: t, style: "TM1" })), "Pas encore de légendes.");
        default:
          if (!n.content) return "";
          // Un bloc de texte inconnu (date d'une frise, ligne d'un bloc…) reste un paragraphe.
          if (n.content.some((c) => c.type === "text" || c.type === "hardBreak" || c.type === "note")) return paragraphe(fragments(ctx, n.content), { bidi: commenceEnArabe(n.content) });
          return corpsDuDocument(ctx, n.content, profondeur);
      }
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Les pièces du fichier
// ---------------------------------------------------------------------------

function stylesXml(styles: Styles, largeurZoneTwips: number): string {
  const titre = (jeton: Styles[keyof Styles], id: string, nom: string, niveau: number) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${nom}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/>` +
    `<w:spacing w:before="${Math.round(jeton.avant * 20)}" w:after="${Math.round(jeton.apres * 20)}"/><w:outlineLvl w:val="${niveau}"/></w:pPr>` +
    `<w:rPr><w:b/><w:bCs/><w:color w:val="${jeton.couleur.replace("#", "").slice(0, 6)}"/><w:sz w:val="${demiPoints(jeton.taille)}"/><w:szCs w:val="${demiPoints(jeton.taille)}"/></w:rPr></w:style>`;
  const tm = (niveau: number) =>
    `<w:style w:type="paragraph" w:styleId="TM${niveau}"><w:name w:val="toc ${niveau}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/>` +
    `<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${largeurZoneTwips}"/></w:tabs><w:spacing w:after="60"/><w:ind w:left="${(niveau - 1) * 340}"/></w:pPr>${niveau === 1 ? "<w:rPr><w:b/></w:rPr>" : ""}</w:style>`;
  const corps = demiPoints(styles.corps.taille);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond" w:cs="${POLICE_ARABE}"/><w:sz w:val="${corps}"/><w:szCs w:val="${Math.round(corps * 1.2)}"/><w:lang w:val="fr-FR" w:bidi="ar-SA"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="${Math.round(styles.corps.apres * 20)}" w:line="${Math.round(styles.corps.interligne * 240)}" w:lineRule="auto"/></w:pPr></w:style>
${titre(styles.titre1, "Titre1", "heading 1", 0)}
${titre(styles.titre2, "Titre2", "heading 2", 1)}
${titre(styles.titre3, "Titre3", "heading 3", 2)}
<w:style w:type="paragraph" w:styleId="Citation"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="454"/></w:pPr><w:rPr><w:i/><w:color w:val="${styles.citation.couleur.replace("#", "").slice(0, 6)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TexteArabe"><w:name w:val="Texte arabe"/><w:basedOn w:val="Normal"/><w:pPr><w:bidi/><w:spacing w:before="120" w:after="60" w:line="360" w:lineRule="auto"/><w:ind w:left="454" w:right="454"/></w:pPr><w:rPr><w:rFonts w:cs="${POLICE_ARABE}"/><w:szCs w:val="${Math.round(corps * 1.35)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Reference"><w:name w:val="Référence d'une source"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="200"/><w:jc w:val="right"/></w:pPr><w:rPr><w:color w:val="5A6075"/><w:sz w:val="${Math.max(16, corps - 4)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Legende"><w:name w:val="Légende du Calame"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="60" w:after="200"/><w:jc w:val="center"/></w:pPr><w:rPr><w:i/><w:sz w:val="${Math.max(16, corps - 4)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Bibliographie"><w:name w:val="Bibliography"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/><w:ind w:left="567" w:hanging="567"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TitreGarde"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="2400" w:after="480"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="${demiPoints(styles.titre1.taille + 8)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TitreSommaire"><w:name w:val="TOC Heading"/><w:basedOn w:val="Titre1"/><w:next w:val="Normal"/><w:pPr><w:outlineLvl w:val="9"/></w:pPr></w:style>
${tm(1)}
${tm(2)}
${tm(3)}
<w:style w:type="paragraph" w:styleId="NoteBasDePage"><w:name w:val="footnote text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="${Math.max(16, corps - 4)}"/><w:szCs w:val="${Math.max(18, corps - 2)}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="NoteDeFin"><w:name w:val="endnote text"/><w:basedOn w:val="NoteBasDePage"/></w:style>
<w:style w:type="character" w:styleId="AppelNote"><w:name w:val="footnote reference"/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style>
<w:style w:type="character" w:styleId="Lien"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1F4FB0"/><w:u w:val="single"/></w:rPr></w:style>
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

/** Une zone d'en-tête ou de pied : les jetons deviennent du texte ou des champs Word ({page}, {pages}, {partie}). */
function zoneXml(gabarit: string, contexte: { titre: string; auteur: string; formatPage: string }): string {
  const rPr = '<w:sz w:val="18"/>';
  return gabarit
    .split(/(\{[^}]+\})/)
    .map((morceau) => {
      switch (morceau) {
        case "{page}":
          return champ(`PAGE${contexte.formatPage}`, "1", rPr);
        case "{pages}":
          return champ("NUMPAGES", "1", rPr);
        case "{partie}":
          return champ('STYLEREF "heading 1"', "", rPr);
        case "{titre}":
          return runs(contexte.titre, [rPr]);
        case "{auteur}":
          return runs(contexte.auteur, [rPr]);
        case "{date}":
          return runs(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), [rPr]);
        case "{hégire}":
          return runs(dateHegirienne(new Date()), [rPr]);
        default:
          return runs(morceau, [rPr]);
      }
    })
    .join("");
}

/** Une ligne d'en-tête ou de pied en trois zones : à gauche, au centre (tabulation), à droite (tabulation). */
function ligneXml(zones: ZonesLigne, balise: "hdr" | "ftr", contexte: { titre: string; auteur: string; formatPage: string; largeurZoneTwips: number }): string {
  const tab = `<w:r><w:tab/></w:r>`;
  const contenu = `${zoneXml(zones.gauche, contexte)}${zones.centre || zones.droite ? tab + zoneXml(zones.centre, contexte) : ""}${zones.droite ? tab + zoneXml(zones.droite, contexte) : ""}`;
  const tabs = `<w:tabs><w:tab w:val="center" w:pos="${Math.round(contexte.largeurZoneTwips / 2)}"/><w:tab w:val="right" w:pos="${contexte.largeurZoneTwips}"/></w:tabs>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${balise} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:pPr>${tabs}<w:rPr><w:sz w:val="18"/></w:rPr></w:pPr>${contenu}</w:p></w:${balise}>`;
}

/** L'en-tête et le pied d'une page (paire ou impaire), avec le numéro posé là où l'écran le pose. */
function zonesAvecNumero(reglages: ReglagesPage, paire: boolean): { entete: ZonesLigne; pied: ZonesLigne } {
  const z = zonesDeLaPage(reglages, paire ? 2 : 1);
  const zones = { entete: { ...z.entete }, pied: { ...z.pied } };
  const dejaLa = [zones.entete, zones.pied].some((l) => [l.gauche, l.centre, l.droite].some((t) => t.includes("{page}")));
  if (reglages.numeroter && !dejaLa) {
    const p = reglages.numeroPosition;
    const ligne = p.startsWith("haut") ? zones.entete : zones.pied;
    const cote: keyof ZonesLigne = p.endsWith("centre") ? "centre" : p.endsWith("exterieur") && paire ? "gauche" : "droite";
    ligne[cote] = ligne[cote] ? `${ligne[cote]}   {page}` : "{page}";
  }
  return zones;
}

const TYPES_MIME: Record<ImageDecodee["extension"], string> = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

function notesXml(notes: string[], enFin: boolean): string {
  const t = enFin ? "endnote" : "footnote";
  const style = enFin ? "NoteDeFin" : "NoteBasDePage";
  const separateurs =
    `<w:${t} w:type="separator" w:id="-1"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:separator/></w:r></w:p></w:${t}>` +
    `<w:${t} w:type="continuationSeparator" w:id="0"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:continuationSeparator/></w:r></w:p></w:${t}>`;
  const corps = notes
    .map(
      (texte, i) =>
        `<w:${t} w:id="${i + 1}"><w:p><w:pPr><w:pStyle w:val="${style}"/>${ARABE.test(texte.replace(new RegExp(`[^A-Za-z${LETTRES_ARABES}]`, "g"), "").charAt(0)) ? "<w:bidi/>" : ""}</w:pPr><w:r><w:rPr><w:rStyle w:val="AppelNote"/></w:rPr><w:${t}Ref/></w:r>${runs(` ${texte || "…"}`, [])}</w:p></w:${t}>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${t}s xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${separateurs}${corps}</w:${t}s>`;
}

/**
 * Écrit le fichier .docx. Rien n'est lu du navigateur : les images arrivent
 * déjà décodées, le reste est du texte.
 */
export function construireDocx(options: { titre: string; contenu: unknown; reglages: ReglagesPage; images?: ImageDecodee[]; proprietes?: ProprietesDocx; date?: Date }): Uint8Array {
  const { titre, reglages } = options;
  const images = options.images ?? [];
  const parId = new Map(images.map((img, index) => [img.id, { img, index }]));
  const racine = (options.contenu ?? {}) as Noeud;
  const largeurZone = geometrie(reglages).zone.largeur;
  const largeurZoneTwips = Math.round((largeurZone / MM) * TWIPS_PAR_MM);
  const auteur = options.proprietes?.auteur ?? "";

  // L'en-tête et le pied : trois zones, paires à part si l'auteur l'a voulu (ou si le numéro est côté extérieur).
  const avecPaires = reglages.pairesDifferentes || (reglages.numeroter && reglages.numeroPosition.endsWith("exterieur"));
  const impaires = zonesAvecNumero(reglages, false);
  const paires = zonesAvecNumero(reglages, true);
  const vide = (l: ZonesLigne) => !l.gauche.trim() && !l.centre.trim() && !l.droite.trim();
  const avecEntete = !vide(impaires.entete) || (avecPaires && !vide(paires.entete));
  const avecPied = !vide(impaires.pied) || (avecPaires && !vide(paires.pied));

  const ctx: Contexte = {
    images: parId,
    largeurZone,
    notes: [],
    enFin: reglages.notes === "fin-document" || reglages.notes === "fin-partie",
    liens: [],
    signets: 0,
    styles: reglages.styles,
    orientation: reglages.orientation,
    reglages,
    avecEntete,
    avecPied,
    avecPaires,
    titres: [],
    termes: [],
    prevus: releve(racine),
  };

  // Un titre vide (conversion d'un fichier qui a déjà ses propres titres) n'ajoute pas de grand titre en tête.
  const corps =
    (titre.trim() ? paragraphe(`<w:r><w:rPr><w:b/><w:sz w:val="${demiPoints(reglages.styles.titre1.taille + 4)}"/></w:rPr><w:t xml:space="preserve">${xml(titre)}</w:t></w:r>`, { style: "Titre1" }) : "") +
    corpsDuDocument(ctx, racine.content ?? []);

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${corps}${sectionXml({ ...reglages, orientation: ctx.orientation }, avecEntete, avecPied, avecPaires)}</w:body></w:document>`;

  const avecNotes = ctx.notes.length > 0;
  const relations = [
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    avecNotes && !ctx.enFin ? '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>' : "",
    avecNotes && ctx.enFin ? '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes" Target="endnotes.xml"/>' : "",
    avecEntete ? '<Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : "",
    avecPied ? '<Relationship Id="rId11" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : "",
    avecEntete && avecPaires ? '<Relationship Id="rId12" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header2.xml"/>' : "",
    avecPied && avecPaires ? '<Relationship Id="rId13" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>' : "",
    ...images.map((img, i) => `<Relationship Id="rId${100 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i}.${img.extension}"/>`),
    ...ctx.liens.map((url, i) => `<Relationship Id="rIdL${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(url)}" TargetMode="External"/>`),
  ].join("");

  const typesImages = [...new Set(images.map((i) => i.extension))]
    .map((ext) => `<Default Extension="${ext}" ContentType="${TYPES_MIME[ext]}"/>`)
    .join("");

  const champs = /<w:instrText[^>]*> (TOC|INDEX)/.test(document);
  const reglagesWord = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${reglages.miroir ? "<w:mirrorMargins/>" : ""}<w:defaultTabStop w:val="708"/>${avecPaires ? "<w:evenAndOddHeaders/>" : ""}${champs ? '<w:updateFields w:val="true"/>' : ""}${
    avecNotes && !ctx.enFin ? '<w:footnotePr><w:footnote w:id="-1"/><w:footnote w:id="0"/></w:footnotePr>' : ""
  }${avecNotes && ctx.enFin ? '<w:endnotePr><w:pos w:val="docEnd"/><w:endnote w:id="-1"/><w:endnote w:id="0"/></w:endnotePr>' : ""}<w:themeFontLang w:val="fr-FR" w:bidi="ar-SA"/></w:settings>`;

  const p = options.proprietes ?? {};
  const quand = (options.date ?? new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  const coeur = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xml(titre)}</dc:title>${p.sujet ? `<dc:subject>${xml(p.sujet)}</dc:subject>` : ""}${p.auteur ? `<dc:creator>${xml(p.auteur)}</dc:creator>` : ""}${p.motsCles ? `<cp:keywords>${xml(p.motsCles)}</cp:keywords>` : ""}${p.statut ? `<cp:contentStatus>${xml(p.statut)}</cp:contentStatus>` : ""}<dc:language>fr-FR</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${quand}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${quand}</dcterms:modified>
</cp:coreProperties>`;

  const fichiers: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>${typesImages}
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
${avecNotes && !ctx.enFin ? '<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>' : ""}
${avecNotes && ctx.enFin ? '<Override PartName="/word/endnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml"/>' : ""}
${avecEntete ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ""}
${avecPied ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}
${avecEntete && avecPaires ? '<Override PartName="/word/header2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ""}
${avecPied && avecPaires ? '<Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`),
    "docProps/core.xml": strToU8(coeur),
    "word/document.xml": strToU8(document),
    "word/styles.xml": strToU8(stylesXml(reglages.styles, largeurZoneTwips)),
    "word/numbering.xml": strToU8(NUMEROTATION),
    "word/settings.xml": strToU8(reglagesWord),
    "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relations}</Relationships>`),
  };
  const formatPage = reglages.numeroStyle === "romain" ? " \\* roman" : reglages.numeroStyle === "ROMAIN" ? " \\* ROMAN" : "";
  const contexte = { titre, auteur, formatPage, largeurZoneTwips };
  if (avecEntete) fichiers["word/header1.xml"] = strToU8(ligneXml(impaires.entete, "hdr", contexte));
  if (avecPied) fichiers["word/footer1.xml"] = strToU8(ligneXml(impaires.pied, "ftr", contexte));
  if (avecEntete && avecPaires) fichiers["word/header2.xml"] = strToU8(ligneXml(paires.entete, "hdr", contexte));
  if (avecPied && avecPaires) fichiers["word/footer2.xml"] = strToU8(ligneXml(paires.pied, "ftr", contexte));
  if (avecNotes) fichiers[ctx.enFin ? "word/endnotes.xml" : "word/footnotes.xml"] = strToU8(notesXml(ctx.notes, ctx.enFin));
  for (const [i, img] of images.entries()) fichiers[`word/media/image${i}.${img.extension}`] = img.octets;

  return zipSync(fichiers, { level: 6 });
}
