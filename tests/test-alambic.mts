import { strFromU8, unzipSync } from "fflate";
import { PDFDocument } from "@cantoo/pdf-lib";
import { detecter, extensionDe, FORMATS, nomConverti, tailleLisible } from "../src/lib/alambic/formats";
import { destinationParDefaut, destinations, verdict } from "../src/lib/alambic/graphe";
import { evaluer, genererMotDePasse } from "../src/lib/alambic/force";
import { aplatir, deplier, ecrireCsv, ecrireSql, ecrireXml, feuilleDeCsv, feuillesDeStructure, lireCsv, lireSql, structureDeFeuilles } from "../src/lib/alambic/donnees";
import { ecrireTar, lireTar, rtfVersHtml } from "../src/lib/alambic/archives";
import { versEpub, versHtml, versOdt, versRtf } from "../src/lib/alambic/ecrivains";
import { versPdf } from "../src/lib/alambic/pdf-ecrivain";
import { documentDeTableaux, type Noeud } from "../src/lib/alambic/pm";

let e = 0;
const ok = (n: string, c: boolean, x = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${x}`));
  if (!c) e++;
};
const tous = FORMATS.map((f) => f.id);
const octets = (...b: number[]) => new Uint8Array([...b, ...new Array(600).fill(0)]);
const texte = (t: string) => new TextEncoder().encode(t);

// ---------------------------------------------------------------- formats
ok("six familles et 36 formats au catalogue", new Set(FORMATS.map((f) => f.famille)).size === 6 && FORMATS.length === 36);
ok("un PDF est reconnu par son contenu, quel que soit son nom", detecter("photo.jpg", texte("%PDF-1.7 ...")) === "pdf");
ok("un PNG est reconnu par sa signature", detecter("x", octets(0x89, 0x50, 0x4e, 0x47)) === "png");
ok("un JPEG est reconnu par sa signature", detecter("x.bin", octets(0xff, 0xd8, 0xff, 0xe0)) === "jpg");
ok("un WebP et un WAV sont distingués dans le RIFF", detecter("a", texte("RIFF\0\0\0\0WEBPVP8 ")) === "webp" && detecter("a", texte("RIFF\0\0\0\0WAVEfmt ")) === "wav");
ok("un AVI est reconnu (pour pouvoir expliquer qu'il ne se convertit pas)", detecter("a", texte("RIFF\0\0\0\0AVI LIST")) === "avi");
ok("un MP4 et un MOV sont distingués", detecter("v.mp4", texte("\0\0\0\x20ftypisom")) === "mp4" && detecter("v", texte("\0\0\0\x14ftypqt  ")) === "mov");
ok("un M4A est reconnu", detecter("a.m4a", texte("\0\0\0\x20ftypM4A ")) === "m4a");
ok("Word, Excel et ZIP sont distingués par leur contenu", detecter("a.zip", octets(0x50, 0x4b, 3, 4), ["word/document.xml"]) === "docx" && detecter("a", octets(0x50, 0x4b, 3, 4), ["xl/workbook.xml"]) === "xlsx" && detecter("a.zip", octets(0x50, 0x4b, 3, 4), ["photo.png"]) === "zip");
ok("un EPUB est reconnu", detecter("livre", octets(0x50, 0x4b, 3, 4), ["mimetype", "META-INF/container.xml"]) === "epub");
ok("un SVG sans extension est reconnu", detecter("dessin", texte('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>')) === "svg");
ok("un JSON sans extension est reconnu", detecter("donnees", texte('  [{"a":1}]')) === "json");
ok("un RTF est reconnu", detecter("x", texte("{\\rtf1\\ansi hello}")) === "rtf");
ok("« .tar.gz » est une seule extension", extensionDe("sauvegarde.tar.gz") === "gz" && nomConverti("sauvegarde.tar.gz", "zip") === "sauvegarde.zip");
ok("le nom converti garde le nom d'origine", nomConverti("Mon mémoire.docx", "pdf") === "Mon mémoire.pdf" && nomConverti("photo.jpeg", "gz") === "photo.tar.gz");
ok("les tailles sont lisibles", tailleLisible(512) === "512 o" && tailleLisible(1536) === "1,5 Ko" && tailleLisible(3 * 1024 ** 3) === "3,0 Go");

// ---------------------------------------------------------------- graphe
ok("Word → PDF est possible", verdict("docx", "pdf").possible);
ok("PDF → Word est possible, et dit honnêtement qu'il ne garde que le texte", (() => {
  const v = verdict("pdf", "docx");
  return v.possible && v.fidelite === "partielle" && /mise en page/.test(v.note ?? "");
})());
ok("un son ne devient pas un tableur, et le dit", (() => {
  const v = verdict("mp3", "xlsx");
  return !v.possible && /son/.test(v.raison);
})());
ok("l'AVI est refusé avec une explication et une alternative", (() => {
  const v = verdict("avi", "mp4");
  return !v.possible && /VLC/.test(v.raison);
})());
ok("une image en pixels ne devient pas un SVG", !verdict("png", "svg").possible && verdict("svg", "png").possible);
ok("tout fichier peut entrer dans une archive", tous.filter((t) => t !== "avi").every((s) => s === "zip" || verdict(s, "zip").possible));
ok("une vidéo donne sa bande-son", verdict("mp4", "mp3").possible && verdict("mkv", "flac").possible);
ok("un son seul ne fait pas une vidéo", !verdict("wav", "mp4").possible);
ok("une vidéo devient un GIF animé", verdict("webm", "gif").possible);
ok("les données passent d'un format à l'autre", ["csv", "json", "xml", "yaml", "sql"].every((c) => verdict("xlsx", c).possible));
ok("les données se présentent en tableau dans un document", verdict("csv", "docx").possible && verdict("json", "pdf").possible && !verdict("csv", "epub").possible);
ok("le même format est refusé", !verdict("pdf", "pdf").possible);
ok("sans AAC dans le navigateur, M4A est refusé avec une solution", (() => {
  const v = verdict("mp3", "m4a", { aac: false, opus: true, h264: true, vp9: true });
  return !v.possible && /MP3/.test(v.raison);
})());
ok("chaque format a au moins une destination, sauf l'AVI", tous.filter((s) => s !== "avi").every((s) => destinations(s, tous).length > 0));
ok("chaque impossibilité a une raison", tous.every((s) => tous.every((c) => { const v = verdict(s, c); return v.possible || v.raison.length > 10; })));
ok("la destination par défaut est utile", destinationParDefaut("docx", tous) === "pdf" && destinationParDefaut("mp4", tous) === "mp3" && destinationParDefaut("png", tous) === "jpg");
ok("inverser : une conversion dans un sens permet presque toujours le retour", verdict("pdf", "png").possible && verdict("png", "pdf").possible && verdict("csv", "json").possible && verdict("json", "csv").possible);

// ---------------------------------------------------------------- force
ok("« azerty » est très faible", evaluer("azerty").niveau === 0);
ok("« motdepasse123 » est très faible", evaluer("motdepasse123").niveau === 0);
ok("« Soleil2024! » n'est pas solide", evaluer("Soleil2024!").niveau <= 1);
ok("« 12345678abc » est faible (suites)", evaluer("12345678abc").niveau <= 1);
ok("une phrase de passe longue est excellente", evaluer("ancre-figue-lagune-safran-Torrent7").niveau >= 3);
ok("un mot de passe aléatoire long est excellent", evaluer("kT7pz-Qm4xR-9vHcw-bN3eF").niveau === 4);
ok("un conseil accompagne un mot de passe faible", evaluer("julien1990").conseils.length > 0);
ok("la durée est donnée en clair", evaluer("azerty").duree === "instantanément" && /siècle|univers|ans/.test(evaluer("kT7pz-Qm4xR-9vHcw-bN3eF").duree));
let compteur = 0;
const g = genererMotDePasse((n) => (compteur++ * 7) % n);
ok("le mot de passe généré a 4 groupes de 5 caractères", /^[A-Za-z0-9]{5}(-[A-Za-z0-9]{5}){3}$/.test(g) && !/[0O1lI]/.test(g));

// ---------------------------------------------------------------- données
ok("CSV : guillemets, séparateur et retours à la ligne dans une cellule", JSON.stringify(lireCsv('a;b\n"x;y";"ligne1\nligne2"\n"il dit ""oui""";3')) === JSON.stringify([["a", "b"], ["x;y", "ligne1\nligne2"], ['il dit "oui"', "3"]]));
const fc = feuilleDeCsv("nom;prix;dispo\nDattes;12,5;vrai\nMiel;8;faux\n");
ok("CSV français : décimales à virgule et booléens reconnus", fc.lignes[0][1] === 12.5 && fc.lignes[0][2] === true && fc.lignes[1][1] === 8);
ok("CSV écrit pour Excel français (BOM, point-virgule, virgule décimale)", ecrireCsv(fc).startsWith("﻿nom;prix;dispo\r\nDattes;12,5;true"));
ok("CSV : une cellule qui ressemble à une formule est neutralisée", ecrireCsv({ nom: "f", colonnes: ["a"], lignes: [["=HYPERLINK(\"x\")"]] }).includes("'=HYPERLINK"));
ok("aplatir et déplier sont réciproques", JSON.stringify(deplier(aplatir({ a: { b: 1, c: { d: "x" } }, e: true }))) === JSON.stringify({ a: { b: 1, c: { d: "x" } }, e: true }));
const struct = { livres: [{ titre: "Al-Muwatta", auteur: { nom: "Malik" } }, { titre: "Sahih", auteur: { nom: "Bukhari" }, tomes: 9 }] };
const fs = feuillesDeStructure(struct);
ok("une structure devient un tableau, colonnes imbriquées aplaties", fs[0].nom === "livres" && fs[0].colonnes.join() === "titre,auteur.nom,tomes" && fs[0].lignes[0][2] === null);
ok("et le tableau redevient une structure", JSON.stringify(structureDeFeuilles(fs)) === JSON.stringify([{ titre: "Al-Muwatta", auteur: { nom: "Malik" }, tomes: null }, { titre: "Sahih", auteur: { nom: "Bukhari" }, tomes: 9 }]));
const x = ecrireXml(struct);
ok("XML : structure imbriquée et caractères échappés", x.includes("<livres>") && x.includes("<nom>Malik</nom>") && ecrireXml({ a: "x < y & z" }).includes("x &lt; y &amp; z"));
ok("XML : les noms invalides deviennent des balises valides", ecrireXml({ "2 prix €": 1 }).includes("<_2_prix__>"));
const sql = ecrireSql([{ nom: "Livres anciens", colonnes: ["titre", "tomes", "lu"], lignes: [["L'Épître", 2, true], ["Sans tome", null, false]] }]);
ok("SQL : CREATE TABLE typé et INSERT échappés", sql.includes('CREATE TABLE "livres_anciens"') && sql.includes('"tomes" INTEGER') && sql.includes("'L''Épître'") && sql.includes("NULL"));
const relu = lireSql(sql);
ok("SQL : un script relu redonne le même tableau", relu.length === 1 && relu[0].colonnes.join() === "titre,tomes,lu" && relu[0].lignes[0][0] === "L'Épître" && relu[0].lignes[1][1] === null && relu[0].lignes[0][2] === true);
ok("SQL : plusieurs INSERT, commentaires et noms entre crochets", (() => {
  const t = lireSql("-- export\nINSERT INTO [dbo].[t] ([a],[b]) VALUES (1,'x');\n/* fin */ INSERT INTO [dbo].[t] ([a],[b]) VALUES (2,'y'), (3, 'z;w');");
  return t[0].nom === "t" && t[0].lignes.length === 3 && t[0].lignes[2][1] === "z;w";
})());

// ---------------------------------------------------------------- archives et RTF
const tar = ecrireTar([{ nom: "a.txt", octets: texte("bonjour") }, { nom: `dossier/${"tres-long-".repeat(15)}.txt`, octets: texte("long") }, { nom: "vide.txt", octets: new Uint8Array() }]);
const rtar = lireTar(tar);
ok("TAR : trois fichiers relus, noms longs compris", rtar.length === 3 && new TextDecoder().decode(rtar[0].octets) === "bonjour" && rtar[1].nom.endsWith(".txt") && rtar[1].nom.length > 150 && rtar[2].octets.length === 0);
ok("TAR : la taille est un multiple de 512", tar.length % 512 === 0);
const rtf = rtfVersHtml("{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}\\f0 Bonjour {\\b le monde}\\par Caf\\'e9 et \\u1575? fin\\par}");
ok("RTF : paragraphes, gras, accents cp1252 et Unicode", rtf === "<p>Bonjour <strong>le monde</strong></p><p>Café et ا fin</p>", rtf);

// ---------------------------------------------------------------- écrivains
const doc: Noeud = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Chapitre premier" }] },
    { type: "paragraph", content: [{ type: "text", text: "Un " }, { type: "text", text: "mot gras", marks: [{ type: "bold" }] }, { type: "text", text: " & un lien", marks: [{ type: "link", attrs: { href: "https://exemple.fr" } }] }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "point" }] }] }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Chapitre second" }] },
    ...documentDeTableaux([{ nom: "f", colonnes: ["A", "B"], lignes: [[1, "deux"]] }]).content!,
  ],
};
const html = versHtml(doc, "Essai");
ok("HTML : document complet, titres, gras, lien, liste, tableau", html.includes("<h1>Chapitre premier</h1>") && html.includes("<strong>mot gras</strong>") && html.includes('href="https://exemple.fr"') && html.includes("<li>") && html.includes("<th>"));
const odt = unzipSync(versOdt(doc, "Essai"));
ok("ODT : mimetype en premier et non compressé", Object.keys(odt)[0] === "mimetype" && strFromU8(odt.mimetype) === "application/vnd.oasis.opendocument.text");
const contenuOdt = strFromU8(odt["content.xml"]);
ok("ODT : titres, gras, liste et tableau", contenuOdt.includes('text:outline-level="1"') && contenuOdt.includes('fo:font-weight="bold"') && contenuOdt.includes("<text:list ") && contenuOdt.includes("<table:table "));
const rtfDoc = versRtf(doc);
ok("RTF : le document s'écrit et se relit", rtfVersHtml(rtfDoc).includes("<strong>mot gras</strong>") && rtfVersHtml(rtfDoc).includes("Chapitre second"));
ok("RTF : les accents sont encodés en Unicode", versRtf({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "é" }] }] }).includes("\\u233?"));
const epub = unzipSync(versEpub(doc, "Essai", "urn:uuid:test", "2026-01-01T00:00:00Z"));
ok("EPUB : mimetype en premier, deux chapitres, sommaire", Object.keys(epub)[0] === "mimetype" && epub["OEBPS/chapitre-2.xhtml"] !== undefined && strFromU8(epub["OEBPS/nav.xhtml"]).includes("Chapitre second"));

const pdf = await versPdf(doc, "Essai");
const relu2 = await PDFDocument.load(pdf.octets);
ok("PDF : un vrai PDF, avec son titre", relu2.getPageCount() === 1 && relu2.getTitle() === "Essai" && pdf.caracteresAbsents === 0);
const long: Noeud = { type: "doc", content: Array.from({ length: 120 }, (_, i) => ({ type: "paragraph", content: [{ type: "text", text: `Paragraphe ${i} : ${"du texte suivi qui passe à la ligne ".repeat(4)}` }] })) };
ok("PDF : un long texte passe sur plusieurs pages", (await versPdf(long, "Long")).pages > 3);
const arabe = await versPdf({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bismillah بسم الله" }] }] }, "A");
ok("PDF : les caractères arabes absents des polices sont comptés, pas cachés", arabe.caracteresAbsents === 7);
const grand = documentDeTableaux([{ nom: "f", colonnes: ["n", "texte"], lignes: Array.from({ length: 200 }, (_, i) => [i, "ligne de tableau"]) }]);
ok("PDF : un grand tableau continue sur les pages suivantes", (await versPdf(grand, "T")).pages > 2);

console.log(e ? `${e} échec(s)` : "tout est bon");
process.exit(e);
