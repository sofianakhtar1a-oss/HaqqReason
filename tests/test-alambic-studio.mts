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
import { imagesDesPages, versRgba } from "../src/lib/alambic/extraction";
import { lireEntree } from "../src/lib/alambic/navigateur/archives";
import { boiteDe, chercher, couverture, decouverts, enPixels, ibanValide, luhnValide, memeBoite, MOTIFS, motifDeRecherche, texteDePage, type Morceau, type PageTexte } from "../src/lib/alambic/caviardage";

// Les modules du projet chargent pdf-lib en CommonJS : on prend le même exemplaire (sinon ses classes diffèrent).
const { degrees, PDFDocument, PDFHexString, PDFName, StandardFonts } = createRequire(import.meta.url)("@cantoo/pdf-lib") as typeof import("@cantoo/pdf-lib");

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${typeof x === "string" ? x : JSON.stringify(x)}`));
  if (!c) e++;
};

// ---------------------------------------------------------------- outils et familles
ok("treize outils, chacun dans une famille", TOUS_LES_OUTILS.length === 13 && TOUS_LES_OUTILS.every((o) => GROUPES.some((g) => g.id === GROUPE_DE[o])));
ok("le mode créateur connaît chaque outil", TOUS_LES_OUTILS.every((o) => MODULES.alambic.listes[0].elements.some((x) => x.id === o)));
const parDefaut = resoudre("alambic", null).listes.outils.map((x) => x.id);
const ranges = parGroupes(parDefaut.map((id) => ({ id: id as (typeof TOUS_LES_OUTILS)[number] }))).flatMap((g) => g.outils.map((o) => o.id));
ok("le menu commence par Convertir et finit par Nettoyer", ranges[0] === "convertir" && ranges[ranges.length - 1] === "nettoyer", ranges);
ok("Transcrire ferme la famille « Transformer »", ranges.indexOf("transcrire") === 3, ranges);
ok("un PDF passe à Organiser, Signer, Déverrouiller, Alléger, Filigraner, Reconnaître", ["organiser", "signer", "deverrouiller", "alleger", "filigraner", "reconnaitre", "nettoyer"].every((o) => accepte(o as never, "pdf")));
ok("une vidéo ne passe ni à Organiser ni à Signer", !accepte("organiser", "mp4") && !accepte("signer", "mp4") && accepte("transcrire", "mp4") && accepte("alleger", "mp4"));
ok("un PowerPoint (vu comme un ZIP) s'allège et se nettoie", accepte("alleger", "zip", "cours.pptx") && accepte("nettoyer", "zip", "cours.pptx") && !accepte("nettoyer", "zip", "photos.zip"));
ok("bureautique reconnaît les formats hors catalogue", bureautique("zip", "a.ods") === "ods" && bureautique("docx") === "docx" && bureautique("zip", "a.zip") === null);
ok("un PDF et une photo se masquent, pas une vidéo ni un Word", accepte("masquer", "pdf") && accepte("masquer", "jpg") && accepte("masquer", "heic") && !accepte("masquer", "mp4") && !accepte("masquer", "docx"));
ok("Masquer est rangé avec la sécurité, juste avant Nettoyer", GROUPE_DE.masquer === "securite" && ranges.indexOf("masquer") === ranges.indexOf("nettoyer") - 1, ranges);
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
ok("« cacher mon numéro de sécurité sociale » → masquer", premier("cacher mon numéro de sécurité sociale") === "masquer-numero", chercherIntentions("cacher mon numéro de sécurité sociale").map((x) => x.id));
ok("« noircir l'IBAN d'un RIB » → masquer", premier("noircir l'iban d'un rib") === "masquer-numero", chercherIntentions("noircir l'iban d'un rib").map((x) => x.id));
ok("« récupérer les photos d'un pdf » → découper, ses images", premier("récupérer les photos d'un pdf") === "extraire-images" && INTENTIONS.find((i) => i.id === "extraire-images")?.reglage === "photos", chercherIntentions("récupérer les photos d'un pdf").map((x) => x.id));
ok("« flouter un visage sur une capture » → masquer", premier("flouter un visage sur une capture") === "cacher-capture", chercherIntentions("flouter un visage sur une capture").map((x) => x.id));
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

// ---------------------------------------------------------------- masquer : chercher et placer les caches
const ligne = (t: string, x: number, y: number, fin = true): Morceau => ({ t, ox: x, oy: y, angle: 0, largeur: t.length * 6, hauteur: 12, finDeLigne: fin });
const releve: PageTexte = {
  largeur: 600,
  hauteur: 800,
  morceaux: [
    ligne("Nom : Éléonore Dupont", 50, 100),
    ligne("IBAN : FR76 3000 6000 0112 3456 7890 189", 50, 120),
    ligne("Tél. 06 12 34 56 78, jean.dupont@exemple.fr", 50, 140),
    ligne("N° SS : 1 85 05 78 006 084 36", 50, 160),
    ligne("Carte 4111 1111 1111 1111, ancienne 4970 1012 3456 7890", 50, 180),
    { t: "Du", ox: 50, oy: 200, angle: 0, largeur: 12, hauteur: 12 },
    { t: "pont", ox: 62, oy: 200, angle: 0, largeur: 24, hauteur: 12, finDeLigne: true },
  ],
};
ok("masquer : cinq motifs prêts, dont l'IBAN et la carte", MOTIFS.length === 5 && MOTIFS.some((m) => m.id === "iban"));
ok("masquer : contrôle des IBAN et des cartes", ibanValide("FR76 3000 6000 0112 3456 7890 189") && !ibanValide("FR76 3000 6000 0112 3456 7890 188") && luhnValide("4111 1111 1111 1111") && !luhnValide("4970 1012 3456 7890"));
ok("masquer : une recherche trop courte est refusée", motifDeRecherche(" a ") === null);
const parNom = chercher([releve], motifDeRecherche("eleonore DUPONT")!);
ok("masquer : sans majuscules ni accents, à travers les espaces", parNom.length === 1 && parNom[0].texte === "Éléonore Dupont", parNom);
const b0 = parNom[0]?.boites[0];
ok("masquer : le cache couvre le nom, pas l'étiquette", b0 && Math.abs(b0.x - (50 + 6 * 6) / 600) < 0.01 && b0.x + b0.w > (50 + 21 * 6) / 600 - 0.01 && b0.y < 100 / 800 && b0.y + b0.h > 100 / 800, b0);
const coupe = chercher([releve], motifDeRecherche("dupont")!);
ok("masquer : partout, même dans une adresse e-mail ; un mot coupé en deux morceaux donne deux caches", coupe.length === 3 && coupe[1].texte === "dupont" && coupe[2].boites.length === 2, coupe.map((c) => c.texte));
const iban = chercher([releve], "iban");
ok("masquer : l'IBAN est trouvé en entier", iban.length === 1 && iban[0].texte === "FR76 3000 6000 0112 3456 7890 189", iban);
ok("masquer : téléphone, e-mail, sécurité sociale", chercher([releve], "telephone")[0]?.texte === "06 12 34 56 78" && chercher([releve], "courriel")[0]?.texte === "jean.dupont@exemple.fr" && chercher([releve], "secu")[0]?.texte === "1 85 05 78 006 084 36");
const cartes = chercher([releve], "carte");
ok("masquer : seule une vraie carte bancaire est retenue", cartes.length === 1 && cartes[0].texte === "4111 1111 1111 1111", cartes);
const sep = texteDePage(releve).texte;
ok("masquer : une ligne par morceau en fin de ligne, rien entre deux morceaux collés", sep.split("\n").length === 6 && sep.endsWith("dupont"), sep);
const vertical = boiteDe({ t: "ABCDEF", ox: 100, oy: 100, angle: Math.PI / 2, largeur: 60, hauteur: 10 }, 0, 6, { largeur: 600, hauteur: 800 });
ok("masquer : un texte vertical donne un cache vertical", vertical.h * 800 > 55 && vertical.w * 600 < 20, vertical);
const mots: PageTexte = {
  largeur: 1000,
  hauteur: 600,
  morceaux: ["FR76", "3000", "6000", "0112", "3456", "7890", "189"].map((t, i) => ({ t, ox: 100 + i * 70, oy: 330, angle: 0, largeur: 60, hauteur: 30, cadre: { x0: 100 + i * 70, y0: 300, x1: 160 + i * 70, y1: 330 } })),
};
const ocr = chercher([mots], "iban");
ok("masquer : un IBAN lu mot à mot (photo) est trouvé, un cache par mot", ocr.length === 1 && ocr[0].boites.length === 7, ocr);
ok("masquer : deux caches presque confondus sont le même", memeBoite({ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }, { x: 0.101, y: 0.1, w: 0.2, h: 0.05 }) && !memeBoite({ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }, { x: 0.5, y: 0.1, w: 0.2, h: 0.05 }));
// Lettres de largeurs inégales : « iii » étroit puis « MMM » large ; le cache de « MMM » doit commencer tôt.
const inegal: Morceau = { t: "iiiMMM", ox: 0, oy: 50, angle: 0, largeur: 60, hauteur: 10, avances: [0, 3, 6, 9, 26, 43, 60] };
const large = boiteDe(inegal, 3, 6, { largeur: 100, hauteur: 100 });
ok("masquer : avec les largeurs mesurées, le cache tombe sur les bonnes lettres", Math.abs(large.x * 100 - (9 - 1.2)) < 0.01 && Math.abs((large.x + large.w) * 100 - (60 + 1.2)) < 0.01, large);
const sansMesure = boiteDe({ ...inegal, avances: undefined }, 3, 6, { largeur: 100, hauteur: 100 });
ok("masquer : sans elles, on suppose des lettres égales", Math.abs(sansMesure.x * 100 - (30 - 1.2)) < 0.01);
const caches = parNom.flatMap((t) => t.boites.map((boite) => ({ page: t.page, boite })));
ok("masquer : texte entièrement sous ses caches", couverture(parNom[0].boites[0], caches.map((c) => c.boite)) === 1 && decouverts([releve], [motifDeRecherche("eleonore dupont")!], caches).length === 0);
const deplaces = caches.map((c) => ({ ...c, boite: { ...c.boite, x: c.boite.x + c.boite.w * 0.5 } }));
const restesDeplaces = decouverts([releve], [motifDeRecherche("eleonore dupont")!], deplaces);
ok("masquer : un cache déplacé laisse le texte à découvert, et c'est signalé", restesDeplaces.length === 1 && restesDeplaces[0].texte === "Éléonore Dupont", restesDeplaces);
ok("masquer : un IBAN sans cache est signalé", decouverts([releve], ["iban"], caches).map((r) => r.texte).join() === "FR76 3000 6000 0112 3456 7890 189");
const px = enPixels({ x: 0.5, y: 0.5, w: 0.6, h: 0.1 }, 1000, 500, 2);
ok("masquer : en pixels, avec marge, sans sortir de l'image", px.x === 498 && px.x + px.w === 1000 && px.y === 248 && px.h === 54, px);

// ---------------------------------------------------------------- découper : les images d'un PDF
const album = await PDFDocument.create();
const cx = album.context;
// Un JPEG (seul l'en-tête compte ici : il doit ressortir à l'octet près).
const jpegFaux = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x40, 0x00, 0x50, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
const photo = await album.embedJpg(jpegFaux);
const rvb = new Uint8Array(30 * 30 * 3);
for (let i = 0; i < 30 * 30; i++) rvb[i * 3] = 255;
const alpha = cx.register(cx.flateStream(new Uint8Array(30 * 30).fill(128), { Type: "XObject", Subtype: "Image", Width: 30, Height: 30, ColorSpace: "DeviceGray", BitsPerComponent: 8 }));
const transparente = cx.register(cx.flateStream(rvb, { Type: "XObject", Subtype: "Image", Width: 30, Height: 30, ColorSpace: "DeviceRGB", BitsPerComponent: 8, SMask: alpha }));
// Palette de deux couleurs, 4 bits par pixel : 0 = bleu, 1 = blanc.
const indices = new Uint8Array(16 * 32).fill(0x10); // pixels pairs 1 (blanc), impairs 0 (bleu)
const palette = cx.register(cx.flateStream(indices, { Type: "XObject", Subtype: "Image", Width: 32, Height: 32, BitsPerComponent: 4, ColorSpace: [PDFName.of("Indexed"), PDFName.of("DeviceRGB"), 1, PDFHexString.of("0000FFFFFFFF")] }));
const minuscule = cx.register(cx.flateStream(new Uint8Array(10 * 10 * 3), { Type: "XObject", Subtype: "Image", Width: 10, Height: 10, ColorSpace: "DeviceRGB", BitsPerComponent: 8 }));
const fax = cx.register(cx.stream(new Uint8Array(40), { Type: "XObject", Subtype: "Image", Width: 64, Height: 64, ColorSpace: "DeviceGray", BitsPerComponent: 1, Filter: "CCITTFaxDecode" }));
const dessin = cx.register(cx.stream(new Uint8Array(0), { Type: "XObject", Subtype: "Form", BBox: [0, 0, 10, 10], Resources: { XObject: { Pal: palette } } }));
const p1 = album.addPage([300, 300]);
p1.node.setXObject(PDFName.of("Photo"), photo.ref);
p1.node.setXObject(PDFName.of("Trans"), transparente);
p1.node.setXObject(PDFName.of("Mini"), minuscule);
p1.node.setXObject(PDFName.of("Fax"), fax);
const p2 = album.addPage([300, 300]);
p2.node.setXObject(PDFName.of("Dessin"), dessin);
p2.node.setXObject(PDFName.of("Photo"), photo.ref);
// Comme un vrai fichier : enregistré puis relu (pdf-lib n'écrit le JPEG qu'à l'enregistrement).
const albumLu = await PDFDocument.load(await album.save());
const trouve = imagesDesPages(albumLu, [1, 2]);
ok("images d'un PDF : JPEG, transparente, palette dans un dessin ; ni la miniature, ni le masque, ni les doublons", trouve.images.map((i) => i.genre).join() === "jpeg,pixels,pixels" && trouve.images.map((i) => i.page).join() === "1,1,2", trouve.images.map((i) => `${i.genre}@${i.page}`));
ok("images d'un PDF : le fax est compté comme non extractible", trouve.ignorees === 1, trouve.ignorees);
const j = trouve.images[0];
ok("images d'un PDF : le JPEG ressort à l'octet près", j.genre === "jpeg" && j.octets.length === jpegFaux.length && j.octets.every((v, i) => v === jpegFaux[i]));
const t = trouve.images[1];
ok("images d'un PDF : rouge, à demi transparent", t.genre === "pixels" && t.rgba[0] === 255 && t.rgba[1] === 0 && t.rgba[3] === 128, t.genre === "pixels" ? [...t.rgba.slice(0, 4)] : t.genre);
const pal = trouve.images[2];
ok("images d'un PDF : palette dépliée (blanc puis bleu)", pal.genre === "pixels" && pal.rgba[0] === 255 && pal.rgba[2] === 255 && pal.rgba[4] === 0 && pal.rgba[6] === 255, pal.genre === "pixels" ? [...pal.rgba.slice(0, 8)] : pal.genre);
ok("images d'un PDF : seulement les pages demandées", imagesDesPages(albumLu, [2]).images.length === 2 && imagesDesPages(albumLu, [9]).images.length === 0);
const gris1 = versRgba(new Uint8Array([0b10100000]), 3, 1, { comp: 1 }, 1, true);
ok("images d'un PDF : gris sur 1 bit, avec inversion", gris1 !== null && gris1[0] === 0 && gris1[4] === 255 && gris1[8] === 0, gris1 && [...gris1]);

console.log(`\n${e ? `${e} échec(s)` : "Tout est bon."}`);
if (e) process.exit(1);
