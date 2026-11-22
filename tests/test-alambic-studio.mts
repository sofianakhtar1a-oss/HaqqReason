/*
 * L'Alambic, studio complet : outils et familles, recherche par intention, organisation des pages,
 * allègement (calculs purs), filigrane (placements et repère du PDF), déchiffrement et organisation réels.
 */
import { createRequire } from "node:module";
import { dimensionsCibles, dimensionsVideo, defiltrerPng, retirerOrphelins, viserPoids } from "../src/lib/alambic/allegement";
import { couleurRvb, departPdf, placerFiligrane, poseNumero, tailleVisible, texteIdentite, texteNumero, versRepereePdf } from "../src/lib/alambic/filigrane";
import { chercherIntentions, INTENTIONS, POPULAIRES } from "../src/lib/alambic/intentions";
import { ecrireOrganise } from "../src/lib/alambic/organiser-pdf";
import { accepte, bureautique, GROUPE_DE, GROUPES, parGroupes, TOUS_LES_OUTILS } from "../src/lib/alambic/outils";
import { deplacer, dupliquer, entrelacer, estIntacte, insererBlanche, inverser, pagesDe, pivoter, placeBlanche, retirer } from "../src/lib/alambic/pages";
import { MODULES, resoudre } from "../src/lib/modules/modules";

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
ok("taille visible d'une page pivotée", tailleVisible(595, 842, 90).join() === "842,595" && tailleVisible(595, 842, 180).join() === "595,842");
ok("repère du PDF sans rotation : y retourné", versRepereePdf(10, 20, 595, 842, 0).join() === "10,822");
ok("repère du PDF à 90° (comme pdf.js)", versRepereePdf(10, 20, 595, 842, 90).join() === "20,10" && versRepereePdf(10, 20, 595, 842, 270).join() === "575,832" && versRepereePdf(10, 20, 595, 842, 180).join() === "585,20");
ok("départ du texte : centré sur la pose", (() => {
  const d = departPdf({ texte: "x", x: 300, y: 400, angle: 0, taillePolice: 20 }, 100, 595, 842, 0);
  return Math.abs(d.x - 250) < 1e-6 && Math.abs(d.y - (842 - 400 - 7)) < 1e-6 && d.angle === 0;
})());
ok("couleurs", couleurRvb("#ff0000").join() === "1,0,0" && couleurRvb("pas une couleur").length === 3);

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

console.log(`\n${e ? `${e} échec(s)` : "Tout est bon."}`);
if (e) process.exit(1);
