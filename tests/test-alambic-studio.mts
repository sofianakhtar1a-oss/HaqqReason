/*
 * L'Alambic, studio complet : outils et familles, recherche par intention, organisation des pages,
 * allègement (calculs purs), filigrane (placements et repère du PDF), déchiffrement et organisation réels.
 */
import { createRequire } from "node:module";
import { dimensionsCibles, dimensionsVideo, defiltrerPng, masquesDImages, retirerOrphelins, sansExif, viserPoids } from "../src/lib/alambic/allegement";
import { couleurRvb, departPdf, placerFiligrane, poseNumero, posesMarquage, tailleVisible, texteIdentite, texteNumero, versRepereePdf } from "../src/lib/alambic/filigrane";
import { chercherIntentions, INTENTIONS, POPULAIRES } from "../src/lib/alambic/intentions";
import { ecrireOrganise } from "../src/lib/alambic/organiser-pdf";
import { accepte, bureautique, GROUPE_DE, GROUPES, parGroupes, TOUS_LES_OUTILS } from "../src/lib/alambic/outils";
import { boiteVersPdf, borner, cadreUtile, detourerEncre, pointVersPdf, rectVersVisible, versRepereVisible } from "../src/lib/alambic/signature";
import { verdict } from "../src/lib/alambic/graphe";
import { versDocument } from "../src/lib/alambic/transcription/exports";
import { deplacer, dupliquer, entrelacer, estIntacte, insererBlanche, inverser, pagesDe, pivoter, placeBlanche, retirer } from "../src/lib/alambic/pages";
import { MODULES, resoudre } from "../src/lib/modules/modules";
import * as zipjs from "@zip.js/zip.js";
import { lireEntree } from "../src/lib/alambic/navigateur/archives";

// Les modules du projet chargent pdf-lib en CommonJS : on prend le même exemplaire (sinon ses classes diffèrent).
const { degrees, PDFDocument, PDFName, StandardFonts } = createRequire(import.meta.url)("@cantoo/pdf-lib") as typeof import("@cantoo/pdf-lib");

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${typeof x === "string" ? x : JSON.stringify(x)}`));
  if (!c) e++;
};

// ---------------------------------------------------------------- outils et familles
ok("douze outils, chacun dans une famille", TOUS_LES_OUTILS.length === 12 && TOUS_LES_OUTILS.every((o) => GROUPES.some((g) => g.id === GROUPE_DE[o])));
ok("le mode créateur connaît chaque outil", TOUS_LES_OUTILS.every((o) => MODULES.alambic.listes[0].elements.some((x) => x.id === o)));
const parDefaut = resoudre("alambic", null).listes.outils.map((x) => x.id);
const ranges = parGroupes(parDefaut.map((id) => ({ id: id as (typeof TOUS_LES_OUTILS)[number] }))).flatMap((g) => g.outils.map((o) => o.id));
ok("le menu commence par Convertir et finit par Nettoyer", ranges[0] === "convertir" && ranges[ranges.length - 1] === "nettoyer", ranges);
ok("Transcrire ferme la famille « Transformer »", ranges.indexOf("transcrire") === 3, ranges);
ok("un PDF passe à Organiser, Signer, Déverrouiller, Alléger, Filigraner, Reconnaître", ["organiser", "signer", "deverrouiller", "alleger", "filigraner", "reconnaitre", "nettoyer"].every((o) => accepte(o as never, "pdf")));
ok("une vidéo ne passe ni à Organiser ni à Signer", !accepte("organiser", "mp4") && !accepte("signer", "mp4") && accepte("transcrire", "mp4") && accepte("alleger", "mp4"));
ok("un PowerPoint (vu comme un ZIP) s'allège et se nettoie", accepte("alleger", "zip", "cours.pptx") && accepte("nettoyer", "zip", "cours.pptx") && !accepte("nettoyer", "zip", "photos.zip"));
ok("bureautique reconnaît les formats hors catalogue", bureautique("zip", "a.ods") === "ods" && bureautique("docx") === "docx" && bureautique("zip", "a.zip") === null);
ok("l'AVI n'est proposé nulle part sauf Protéger", TOUS_LES_OUTILS.filter((o) => accepte(o, "avi")).join() === "proteger");

// ---------------------------------------------------------------- intentions
const premier = (q: string) => chercherIntentions(q)[0]?.id;
ok("« réduire un pdf pour un mail » → alléger un PDF", premier("réduire un pdf pour un mail") === "alleger-pdf", chercherIntentions("réduire un pdf pour un mail").map((x) => x.id));
ok("« mettre un mot de passe » → protéger", premier("mettre un mot de passe sur un fichier") === "mot-de-passe");
ok("« enlever le mot de passe d'un pdf » → déverrouiller", premier("enlever le mot de passe d'un pdf") === "retirer-mot-de-passe", chercherIntentions("enlever le mot de passe d'un pdf").map((x) => x.id));
ok("« carte d'identité » → filigrane d'identité", premier("carte d'identité") === "filigrane-identite");
ok("« tourner les pages » → pivoter", premier("tourner les pages") === "pivoter-pdf");
ok("« word en pdf » → convertir vers PDF", premier("word en pdf") === "word-en-pdf" && INTENTIONS.find((i) => i.id === "word-en-pdf")?.cible === "pdf");
ok("« enlever gps photo » → nettoyer", premier("enlever gps photo") === "gps");
ok("« copier le texte d'une photo » → reconnaître", premier("copier le texte d'une photo") === "ocr");
ok("les fautes de frappe courantes passent (« compresser video »)", premier("compresser video") === "alleger-video");
ok("rien pour une recherche vide ou hors sujet", chercherIntentions("").length === 0 && chercherIntentions("recette de couscous").length === 0);
ok("les suggestions populaires existent", POPULAIRES.every((p) => INTENTIONS.some((i) => i.id === p)));
ok("chaque intention vise un outil connu", INTENTIONS.every((i) => TOUS_LES_OUTILS.includes(i.outil)));

// ---------------------------------------------------------------- pages
const p0 = pagesDe("a", 4);
ok("pivoter toutes les pages", pivoter(p0, new Set(), 1).every((p) => p.rotation === 90));
ok("pivoter à gauche depuis 0 donne 270", pivoter(p0, new Set([p0[0].cle]), -1)[0].rotation === 270 && pivoter(p0, new Set([p0[0].cle]), -1)[1].rotation === 0);
ok("retirer et dupliquer", retirer(p0, new Set([p0[1].cle])).length === 3 && dupliquer(p0, new Set([p0[2].cle])).map((p) => p.index).join() === "0,1,2,2,3");
ok("inverser l'ordre", inverser(p0).map((p) => p.index).join() === "3,2,1,0");
ok("déplacer une page", deplacer(p0, 0, 2).map((p) => p.index).join() === "1,2,0,3");
ok("page blanche après la dernière choisie, sinon à la fin", placeBlanche(p0, new Set([p0[1].cle])) === 2 && placeBlanche(p0, new Set()) === 4 && insererBlanche(p0, 2, [100, 200])[2].source === null);
ok("entrelacer recto et verso", entrelacer(pagesDe("r", 3), pagesDe("v", 3)).map((p) => `${p.source}${p.index}`).join() === "r0,v2,r1,v1,r2,v0");
ok("une liste intacte est reconnue", estIntacte(p0, "a", 4) && !estIntacte(pivoter(p0, new Set(), 1), "a", 4));

// ---------------------------------------------------------------- allègement
ok("les dimensions ne sont jamais agrandies", dimensionsCibles(800, 600, 1920).echelle === 1 && dimensionsCibles(4000, 3000, 1920).largeur === 1920 && dimensionsCibles(3000, 4000, 1920).hauteur === 1920);
ok("une vidéo 1080p passe en 720p, au pair", JSON.stringify(dimensionsVideo(1920, 1080, 720)) === JSON.stringify({ largeur: 1280, hauteur: 720 }) && dimensionsVideo(1280, 720, 720) === null && dimensionsVideo(1080, 1920, 720)?.largeur === 720);
const visee = await viserPoids(async (q) => ({ size: Math.round(q * 1000) }), 600);
ok("la recherche de qualité tient dans le poids visé, au plus près", visee !== null && visee.resultat.size <= 600 && visee.resultat.size > 560, visee);
ok("poids impossible : null (il faudra réduire les dimensions)", (await viserPoids(async () => ({ size: 5000 }), 100)) === null);
// Prédicteur PNG : une ligne « Sub » et une ligne « Up » sur 2 pixels RVB.
const filtre = new Uint8Array([1, 10, 20, 30, 5, 5, 5, 2, 1, 1, 1, 1, 1, 1]);
ok("le prédicteur PNG est défait", defiltrerPng(filtre, 2, 3).join() === "10,20,30,15,25,35,11,21,31,16,26,36");

// ---------------------------------------------------------------- filigrane
const mesure = (t: string) => t.length * 0.55;
const mosaique = placerFiligrane(595, 842, { texte: "CONFIDENTIEL", disposition: "mosaique", couleur: "#666666", opacite: 0.3, taille: 1 }, mesure);
ok("la mosaïque couvre toute la page", mosaique.length > 12 && mosaique.some((p) => p.x < 150 && p.y < 200) && mosaique.some((p) => p.x > 450 && p.y > 650), mosaique.length);
ok("la mosaïque reste raisonnable (pas des milliers de textes)", mosaique.length < 400);
const centre = placerFiligrane(595, 842, { texte: "COPIE", disposition: "centre", couleur: "#666666", opacite: 0.3, taille: 1 }, mesure)[0];
ok("au centre : sur la diagonale montante", Math.abs(centre.x - 297.5) < 1 && Math.abs(centre.angle - (Math.atan2(842, 595) * 180) / Math.PI) < 0.01);
const bas = placerFiligrane(595, 842, { texte: "x".repeat(400), disposition: "bas", couleur: "#000", opacite: 1, taille: 1 }, mesure)[0];
ok("en bas : un texte trop long rétrécit pour tenir", bas.taillePolice * mesure(bas.texte) <= 595 - 2 * 595 * 0.05 + 0.01 && bas.angle === 0);
ok("texte d'identité complet", texteIdentite("l'agence Immo", "dossier de location", new Date(2026, 10, 22)) === "Document exclusivement destiné à l'agence Immo — dossier de location — le 22/11/2026");
ok("formats de numéros", texteNumero("page-n-sur-t", 3, 12) === "Page 3 sur 12" && texteNumero("n/t", 1, 4) === "1 / 4" && texteNumero("tiret", 7, 9) === "– 7 –");
ok("pas de numéro sur la couverture, mais elle compte", poseNumero(595, 842, 0, 5, { format: "n", position: "bas-centre", debut: 1, sansPremiere: true }, mesure) === null && poseNumero(595, 842, 1, 5, { format: "n", position: "bas-centre", debut: 1, sansPremiere: true }, mesure)?.texte === "2");
ok("numéro en bas à droite, dans la page", (() => {
  const p = poseNumero(595, 842, 2, 5, { format: "page-n", position: "bas-droite", debut: 1, sansPremiere: false }, mesure)!;
  return p.x > 450 && p.x < 595 && p.y > 780 && p.y < 842;
})());
ok("un filigrane « en bas » remonte au-dessus d'un numéro en bas", (() => {
  const m = posesMarquage(595, 842, 0, 3, { texte: "COPIE", disposition: "bas", couleur: "#000", opacite: 1, taille: 1 }, { format: "n", position: "bas-centre", debut: 1, sansPremiere: false }, mesure);
  return m.numero !== null && m.filigrane[0].y < m.numero.y - m.numero.taillePolice * 1.5;
})());
ok("taille visible d'une page pivotée", tailleVisible(595, 842, 90).join() === "842,595" && tailleVisible(595, 842, 180).join() === "595,842");
ok("repère du PDF sans rotation : y retourné", versRepereePdf(10, 20, 595, 842, 0).join() === "10,822");
ok("repère du PDF à 90° (comme pdf.js)", versRepereePdf(10, 20, 595, 842, 90).join() === "20,10" && versRepereePdf(10, 20, 595, 842, 270).join() === "575,832" && versRepereePdf(10, 20, 595, 842, 180).join() === "585,20");
ok("départ du texte : centré sur la pose", (() => {
  const d = departPdf({ texte: "x", x: 300, y: 400, angle: 0, taillePolice: 20 }, 100, 595, 842, 0);
  return Math.abs(d.x - 250) < 1e-6 && Math.abs(d.y - (842 - 400 - 7)) < 1e-6 && d.angle === 0;
})());
ok("couleurs", couleurRvb("#ff0000").join() === "1,0,0" && couleurRvb("pas une couleur").length === 3);

// ---------------------------------------------------------------- signer : repères
ok("le repère visible est l'inverse du repère PDF, à toutes les rotations", [0, 90, 180, 270].every((r) => {
  const [x, y] = versRepereePdf(37, 61, 595, 842, r);
  const [vx, vy] = versRepereVisible(x, y, 595, 842, r);
  return Math.abs(vx - 37) < 1e-9 && Math.abs(vy - 61) < 1e-9;
}));
const proche = (a: Record<string, number>, b: Record<string, number>) => Object.keys(b).every((k) => Math.abs(a[k] - b[k]) < 1e-9);
ok("un rectangle du PDF devient une boîte visible (sans rotation)", proche(rectVersVisible({ x: 59.5, y: 84.2, width: 119, height: 84.2 }, 595, 842, 0), { x: 0.1, y: 0.8, w: 0.2, h: 0.1 }), rectVersVisible({ x: 59.5, y: 84.2, width: 119, height: 84.2 }, 595, 842, 0));
ok("une boîte visible revient au même rectangle (aller-retour, page pivotée)", [0, 90, 180, 270].every((r) => {
  const b = { x: 0.2, y: 0.3, w: 0.25, h: 0.1 };
  const p = boiteVersPdf(b, 595, 842, r);
  // Le coin bas-gauche visible, puis le coin haut-droit obtenu en suivant l'angle de la page.
  const t = (r * Math.PI) / 180;
  const coinOppose = [p.x + Math.cos(t) * p.largeur - Math.sin(t) * p.hauteur, p.y + Math.sin(t) * p.largeur + Math.cos(t) * p.hauteur];
  const [ax, ay] = versRepereVisible(p.x, p.y, 595, 842, r);
  const [bx, by] = versRepereVisible(coinOppose[0], coinOppose[1], 595, 842, r);
  const [lv, hv] = r % 180 ? [842, 595] : [595, 842];
  return Math.abs(ax / lv - 0.2) < 1e-9 && Math.abs(ay / hv - 0.4) < 1e-9 && Math.abs(bx / lv - 0.45) < 1e-9 && Math.abs(by / hv - 0.3) < 1e-9;
}));
ok("point visible → PDF", pointVersPdf(0.5, 0.5, 600, 800, 0).join() === "300,400" && pointVersPdf(0, 0, 600, 800, 90).join() === "0,0");
ok("une boîte reste dans la page", JSON.stringify(borner({ x: 0.95, y: -0.2, w: 0.2, h: 0.1 })) === JSON.stringify({ w: 0.2, h: 0.1, x: 0.8, y: 0 }));
const encre = new Uint8ClampedArray([255, 255, 255, 255, 20, 20, 20, 255, 160, 160, 160, 255]);
detourerEncre(encre);
ok("signature photographiée : le papier devient transparent, l'encre reste", encre[3] === 0 && encre[7] === 255 && encre[11] > 0 && encre[11] < 255);
const pixels = new Uint8ClampedArray(4 * 4 * 4);
pixels[(1 * 4 + 2) * 4 + 3] = 255;
pixels[(2 * 4 + 1) * 4 + 3] = 255;
ok("cadre utile d'une signature", JSON.stringify(cadreUtile(pixels, 4, 4)) === JSON.stringify({ x: 1, y: 1, w: 2, h: 2 }) && cadreUtile(new Uint8ClampedArray(16), 2, 2) === null);

// ---------------------------------------------------------------- convertir : nouveaux chemins
ok("une photo de document se convertit en Word (lecture du texte)", (() => {
  const v = verdict("png", "docx");
  return v.possible && v.moteur === "ocr" && v.fidelite === "partielle";
})());
ok("un SVG ne passe pas par la lecture de texte, et dit pourquoi", !verdict("svg", "docx").possible);
ok("un son vers un document renvoie vers « Transcrire »", (() => {
  const v = verdict("mp3", "docx");
  return !v.possible && /Transcrire/.test(v.raison);
})());

// ---------------------------------------------------------------- transcription en document
const transcription = {
  titre: "Cours",
  phrases: [
    { id: 1, debut: 0, fin: 1, paragraphe: 0, mots: [{ t: "Hello", d: 0, f: 0.5 }, { t: "world.", d: 0.5, f: 1 }] },
    { id: 2, debut: 1, fin: 2, paragraphe: 1, mots: [{ t: "Bye.", d: 1, f: 2 }] },
  ],
  traductions: { 1: "Bonjour le monde." } as Record<number, string>,
};
const docT = versDocument(transcription, true);
ok("transcription → document : titre, paragraphes, traduction en italique", docT.content?.length === 4 && docT.content[0].type === "heading" && docT.content[2].content?.[0].marks?.[0].type === "italic" && docT.content[3].content?.[0].text === "Bye.", docT.content);
ok("transcription → document sans traduction", versDocument(transcription).content?.length === 3);

// ---------------------------------------------------------------- PDF réels : organiser, orphelins
const source = await PDFDocument.create();
const police = await source.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 3; i++) source.addPage([300, 400]).drawText(`Page ${i}`, { x: 20, y: 200, font: police, size: 20 });
source.getPage(2).setRotation(degrees(90));
const chargee = await PDFDocument.load(await source.save());
const base = pagesDe("s", 3);
const pages = pivoter(dupliquer(base, new Set([base[0].cle])), new Set(), 1); // 0, 0 (copie), 1, 2 — tous pivotés de 90°
const liste = [pages[3], ...insererBlanche(pages.slice(0, 2), 1, [300, 400])]; // 2, 0, blanche, 0 (copie)
const sortie = await PDFDocument.load(await ecrireOrganise(new Map([["s", chargee]]), liste, "Essai"));
ok("organiser : nombre de pages et page blanche", sortie.getPageCount() === 4, sortie.getPageCount());
ok("organiser : la rotation s'ajoute à celle de la page (90 + 90 = 180)", sortie.getPage(0).getRotation().angle === 180 && sortie.getPage(1).getRotation().angle === 90, [sortie.getPage(0).getRotation().angle, sortie.getPage(1).getRotation().angle]);
ok("organiser : une page dupliquée est une vraie copie", sortie.getPage(1).ref.toString() !== sortie.getPage(3).ref.toString());
let refus = "";
try {
  await ecrireOrganise(new Map([["s", chargee]]), [], "x");
} catch (err) {
  refus = (err as Error).message;
}
ok("organiser : il faut garder au moins une page", /au moins une/.test(refus));
const orph = await PDFDocument.load(await source.save());
orph.context.register(orph.context.obj({ Type: PDFName.of("Abandon") }));
ok("les objets orphelins sont retirés, les pages restent", retirerOrphelins(orph) >= 1 && orph.getPageCount() === 3);

// ---------------------------------------------------------------- alléger : masques et orientation
const avecMasque = await PDFDocument.create();
const ctxM = avecMasque.context;
const masque = ctxM.register(ctxM.flateStream(new Uint8Array(64 * 64).fill(128), { Type: "XObject", Subtype: "Image", Width: 64, Height: 64, ColorSpace: "DeviceGray", BitsPerComponent: 8 }));
const pochoir = ctxM.register(ctxM.flateStream(new Uint8Array(64 * 8), { Type: "XObject", Subtype: "Image", Width: 64, Height: 64, ImageMask: true }));
ctxM.register(ctxM.flateStream(new Uint8Array(64 * 64 * 3), { Type: "XObject", Subtype: "Image", Width: 64, Height: 64, ColorSpace: "DeviceRGB", BitsPerComponent: 8, SMask: masque }));
ctxM.register(ctxM.flateStream(new Uint8Array(64 * 64 * 3), { Type: "XObject", Subtype: "Image", Width: 64, Height: 64, ColorSpace: "DeviceRGB", BitsPerComponent: 8, Mask: pochoir }));
const trouves = masquesDImages(avecMasque);
ok("alléger : les masques de transparence sont repérés (SMask et Mask)", trouves.has(masque.toString()) && trouves.has(pochoir.toString()) && trouves.size === 2, [...trouves]);

const segment = (marqueur: number, contenu: number[]) => [0xff, marqueur, (contenu.length + 2) >> 8, (contenu.length + 2) & 0xff, ...contenu];
const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a];
const jfif = [0x4a, 0x46, 0x49, 0x46, 0, 1, 1];
const corps = [0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9];
const jpeg = new Uint8Array([0xff, 0xd8, ...segment(0xe0, jfif), ...segment(0xe1, exif), ...segment(0xdb, [0, 1, 2]), ...corps]);
const nu = sansExif(jpeg);
ok("alléger : le bloc EXIF d'un JPEG est retiré, le reste est intact", nu.length === jpeg.length - (exif.length + 4) && nu[0] === 0xff && nu[1] === 0xd8 && nu[3] === 0xe0 && nu[2 + jfif.length + 4 + 1] === 0xdb && nu[nu.length - 1] === 0xd9, [...nu]);
const sansBloc = new Uint8Array([0xff, 0xd8, ...segment(0xe0, jfif), ...corps]);
ok("alléger : un JPEG sans EXIF ressort identique", sansExif(sansBloc) === sansBloc);
ok("alléger : des octets qui ne sont pas un JPEG ne sont pas touchés", sansExif(new Uint8Array([1, 2, 3])).length === 3);

// ---------------------------------------------------------------- aperçu d'un ZIP : un fichier à la fois
zipjs.configure({ useWebWorkers: false });
const ecrivainZip = new zipjs.ZipWriter(new zipjs.BlobWriter("application/zip"));
await ecrivainZip.add("secret.txt", new zipjs.TextReader("Secret."), { password: "motdepasse" });
await ecrivainZip.add("libre.txt", new zipjs.TextReader("Bonjour."));
const mixte = await ecrivainZip.close();
const libre = await lireEntree("mixte.zip", "zip", mixte, "libre.txt");
ok("ZIP mixte : un fichier libre s'extrait sans mot de passe", (await libre?.blob.text()) === "Bonjour.");
let refusSecret = "";
try {
  await lireEntree("mixte.zip", "zip", mixte, "secret.txt");
} catch (err) {
  refusSecret = (err as Error).message;
}
ok("ZIP mixte : un fichier chiffré demande le mot de passe", /mot de passe/.test(refusSecret), refusSecret);
ok("ZIP mixte : avec le mot de passe, le fichier chiffré s'ouvre", (await (await lireEntree("mixte.zip", "zip", mixte, "secret.txt", "motdepasse"))?.blob.text()) === "Secret.");
ok("ZIP : un nom absent donne null", (await lireEntree("mixte.zip", "zip", mixte, "rien.txt")) === null);

console.log(`\n${e ? `${e} échec(s)` : "Tout est bon."}`);
if (e) process.exit(1);
