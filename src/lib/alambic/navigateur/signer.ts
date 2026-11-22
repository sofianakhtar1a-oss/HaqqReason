"use client";

/*
 * Signer et remplir un PDF, dans le navigateur : champs de formulaire (Cerfa…), signature, texte, date, coches.
 * Rien n'est envoyé.
 */
import { degrees, LineCapStyle, PDFBool, PDFCheckBox, PDFDropdown, PDFHexString, PDFName, PDFOptionList, PDFRadioGroup, PDFString, PDFTextField, rgb, StandardFonts, type PDFDocument, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import { couleurRvb } from "../filigrane";
import { boiteVersPdf, pointVersPdf, rectVersVisible, type BoiteVisible } from "../signature";

export type ChampFormulaire = {
  nom: string;
  libelle: string;
  genre: "texte" | "case" | "radio" | "liste";
  options: string[];
  valeur: string | boolean;
  multiligne: boolean;
  max?: number;
  lectureSeule: boolean;
  widgets: { page: number; boite: BoiteVisible; option?: string }[];
};

export type ElementSigne =
  | { id: string; genre: "image"; page: number; boite: BoiteVisible; source: string }
  | { id: string; genre: "texte"; page: number; boite: BoiteVisible; texte: string; taille: number; couleur: string }
  | { id: string; genre: "coche" | "croix"; page: number; boite: BoiteVisible; couleur: string };

/** Un nom de champ lisible : l'infobulle du champ s'il y en a une, sinon la fin de son nom technique. */
function libelleDe(nom: string, infobulle?: string): string {
  if (infobulle?.trim()) return infobulle.trim();
  const fin = nom.split(".").pop() ?? nom;
  return fin.replace(/\[\d+\]$/, "").replace(/[_-]+/g, " ").trim() || nom;
}

function texteDe(v: unknown): string | undefined {
  if (v instanceof PDFString || v instanceof PDFHexString) return v.decodeText();
  return undefined;
}

/** Les champs du formulaire et leur place sur les pages. */
export async function lireFormulaire(octets: Uint8Array): Promise<ChampFormulaire[]> {
  const { charger } = await import("./pdf");
  const doc = await charger(octets);
  let champs;
  try {
    champs = doc.getForm().getFields();
  } catch {
    return [];
  }
  const pages = doc.getPages();
  const pageDeRef = new Map(pages.map((p, i) => [p.ref.toString(), i]));
  const sortie: ChampFormulaire[] = [];
  for (const champ of champs) {
    const nom = champ.getName();
    const infobulle = texteDe(champ.acroField.dict.lookup(PDFName.of("TU")));
    let genre: ChampFormulaire["genre"];
    let valeur: string | boolean = "";
    let options: string[] = [];
    let multiligne = false;
    let max: number | undefined;
    if (champ instanceof PDFTextField) {
      genre = "texte";
      valeur = champ.getText() ?? "";
      multiligne = champ.isMultiline();
      max = champ.getMaxLength();
    } else if (champ instanceof PDFCheckBox) {
      genre = "case";
      valeur = champ.isChecked();
    } else if (champ instanceof PDFRadioGroup) {
      genre = "radio";
      options = champ.getOptions();
      valeur = champ.getSelected() ?? "";
    } else if (champ instanceof PDFDropdown || champ instanceof PDFOptionList) {
      genre = "liste";
      options = champ.getOptions();
      valeur = champ.getSelected()[0] ?? "";
    } else continue; // boutons, signatures numériques : rien à remplir ici
    const widgets: ChampFormulaire["widgets"] = [];
    champ.acroField.getWidgets().forEach((w, k) => {
      let page = w.P() ? pageDeRef.get(w.P()!.toString()) : undefined;
      if (page === undefined) {
        const ref = doc.context.getObjectRef(w.dict)?.toString();
        page = pages.findIndex((p) => p.node.Annots()?.asArray().some((a) => a.toString() === ref));
      }
      if (page === undefined || page < 0) return;
      const p = pages[page];
      const boite = p.getCropBox();
      const r = w.getRectangle();
      widgets.push({ page, boite: rectVersVisible({ x: r.x - boite.x, y: r.y - boite.y, width: r.width, height: r.height }, boite.width, boite.height, p.getRotation().angle), option: genre === "radio" ? options[k] : undefined });
    });
    if (widgets.length) sortie.push({ nom, libelle: libelleDe(nom, infobulle), genre, options, valeur, multiligne, max, lectureSeule: champ.isReadOnly(), widgets });
  }
  return sortie;
}

function enPng(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const brut = atob(base64);
  const o = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) o[i] = brut.charCodeAt(i);
  return o;
}

/** Un texte que la police standard ne sait pas écrire (arabe…) devient une image, nette, à sa taille. */
function texteEnImage(texte: string, taillePt: number, couleur: string): { png: Uint8Array; ratio: number } {
  const echelle = 6;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const police = `${taillePt * echelle}px "Noto Sans Arabic", "Segoe UI", Arial, sans-serif`;
  ctx.font = police;
  const l = Math.ceil(ctx.measureText(texte).width) + 8;
  const h = Math.ceil(taillePt * echelle * 1.35);
  c.width = l;
  c.height = h;
  ctx.font = police;
  ctx.fillStyle = couleur;
  ctx.textBaseline = "alphabetic";
  ctx.direction = "auto" as CanvasDirection;
  ctx.fillText(texte, 4, taillePt * echelle);
  return { png: enPng(c.toDataURL("image/png")), ratio: h / l };
}

function dessinerElement(doc: PDFDocument, page: PDFPage, e: ElementSigne, police: PDFFont, connus: Set<number>, images: Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>): Promise<void> | void {
  const cadre = page.getCropBox();
  const rotation = page.getRotation().angle;
  if (e.genre === "image") {
    return (async () => {
      let img = images.get(e.source);
      if (!img) {
        img = await doc.embedPng(enPng(e.source));
        images.set(e.source, img);
      }
      const b = boiteVersPdf(e.boite, cadre.width, cadre.height, rotation);
      page.drawImage(img, { x: b.x + cadre.x, y: b.y + cadre.y, width: b.largeur, height: b.hauteur, rotate: degrees(b.angle) });
    })();
  }
  const [r, g, bl] = couleurRvb(e.couleur);
  if (e.genre === "texte") {
    const texte = e.texte.trim();
    if (!texte) return;
    if ([...texte].every((c) => connus.has(c.codePointAt(0)!))) {
      // Ligne de base à 80 % de la taille sous le haut de la boîte.
      const rot = ((rotation % 360) + 360) % 360;
      const hv = rot === 90 || rot === 270 ? cadre.width : cadre.height;
      const [x, y] = pointVersPdf(e.boite.x, e.boite.y + (e.taille * 0.8) / hv, cadre.width, cadre.height, rotation);
      page.drawText(texte, { x: x + cadre.x, y: y + cadre.y, size: e.taille, font: police, color: rgb(r, g, bl), rotate: degrees(rot) });
      return;
    }
    return (async () => {
      const { png, ratio } = texteEnImage(texte, e.taille, e.couleur);
      const img = await doc.embedPng(png);
      const rot = ((rotation % 360) + 360) % 360;
      const [lv, hv] = rot === 90 || rot === 270 ? [cadre.height, cadre.width] : [cadre.width, cadre.height];
      const hauteur = (e.taille * 1.35) / hv;
      const largeur = (e.taille * 1.35) / ratio / lv;
      const b = boiteVersPdf({ x: e.boite.x, y: e.boite.y, w: largeur, h: hauteur }, cadre.width, cadre.height, rotation);
      page.drawImage(img, { x: b.x + cadre.x, y: b.y + cadre.y, width: b.largeur, height: b.hauteur, rotate: degrees(b.angle) });
    })();
  }
  // Coche ou croix : des traits, nets à toutes les tailles.
  const { x, y, w, h } = e.boite;
  const p = (fx: number, fy: number) => {
    const [px, py] = pointVersPdf(x + fx * w, y + fy * h, cadre.width, cadre.height, rotation);
    return { x: px + cadre.x, y: py + cadre.y };
  };
  const rot = ((rotation % 360) + 360) % 360;
  const [lv, hv] = rot === 90 || rot === 270 ? [cadre.height, cadre.width] : [cadre.width, cadre.height];
  const epaisseur = Math.max(0.8, Math.min(w * lv, h * hv) * 0.12);
  const traits: [number, number][][] =
    e.genre === "coche"
      ? [
          [
            [0.12, 0.55],
            [0.4, 0.85],
          ],
          [
            [0.4, 0.85],
            [0.9, 0.15],
          ],
        ]
      : [
          [
            [0.15, 0.15],
            [0.85, 0.85],
          ],
          [
            [0.85, 0.15],
            [0.15, 0.85],
          ],
        ];
  for (const [a, b] of traits) page.drawLine({ start: p(a[0], a[1]), end: p(b[0], b[1]), thickness: epaisseur, color: rgb(r, g, bl), lineCap: LineCapStyle.Round });
}

export async function enregistrerSigne(octets: Uint8Array, elements: ElementSigne[], valeurs: Record<string, string | boolean>, aplatir: boolean): Promise<{ octets: Uint8Array; avertissements: string[] }> {
  const { charger } = await import("./pdf");
  const doc = await charger(octets);
  const avertissements: string[] = [];
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const connus = new Set(police.getCharacterSet());

  const noms = Object.keys(valeurs);
  if (noms.length || aplatir) {
    let formulaire;
    try {
      formulaire = doc.getForm();
    } catch {
      formulaire = null;
    }
    if (formulaire) {
      for (const nom of noms) {
        const v = valeurs[nom];
        try {
          const champ = formulaire.getField(nom);
          if (champ instanceof PDFTextField) champ.setText(String(v));
          else if (champ instanceof PDFCheckBox) {
            if (v) champ.check();
            else champ.uncheck();
          }
          else if (champ instanceof PDFRadioGroup) {
            if (v) champ.select(String(v));
          } else if (champ instanceof PDFDropdown || champ instanceof PDFOptionList) {
            if (v) champ.select(String(v));
          }
        } catch {
          avertissements.push(`Le champ « ${nom} » n'a pas pu être rempli.`);
        }
      }
      try {
        formulaire.updateFieldAppearances(police);
      } catch {
        // Écriture que la police standard n'a pas : le lecteur PDF redessinera les champs lui-même.
        formulaire.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);
        avertissements.push("Certains champs contiennent des caractères (arabe…) que les lecteurs PDF dessinent eux-mêmes à l'ouverture.");
      }
      if (aplatir) {
        try {
          formulaire.flatten();
        } catch {
          avertissements.push("Le formulaire n'a pas pu être figé : il reste modifiable.");
        }
      }
    }
  }

  const pages = doc.getPages();
  const images = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
  for (const e of elements) {
    const page = pages[e.page];
    if (page) await dessinerElement(doc, page, e, police, connus, images);
  }
  return { octets: await doc.save(), avertissements };
}
