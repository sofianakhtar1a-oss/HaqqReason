// L'Alambic, « Rassembler » : la part pure (genres de lecture, fichiers ignorés, ordre, texte assemblé).
// Lancer : npx tsx tests/test-alambic-rassembler.mts
import { accepte } from "../src/lib/alambic/outils";
import { chercherIntentions } from "../src/lib/alambic/intentions";
import { aIgnorer, cleFichier, compterMots, decoderTexte, genreDe, ordreNaturel, ressembleTexte, texteDeFeuilles, texteDrawingMl, texteNet, texteRassemble } from "../src/lib/alambic/rassemblement";
import { FONCTIONS, regleEffective, configParDefaut } from "../src/lib/premium/catalogue";

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${typeof x === "string" ? x : JSON.stringify(x)}`));
  if (!c) e++;
};

// Les genres de lecture
const g = (format: string | null, nom: string) => genreDe(format, nom);
ok("PDF, Word, OpenDocument, RTF, EPUB, page web : lus comme documents", g("pdf", "a.pdf") === "pdf" && ["docx", "odt", "rtf", "epub", "html"].every((f) => g(f, `a.${f}`) === "document"));
ok("texte brut, Markdown, CSV, JSON, XML, YAML, SQL : lus tels quels", ["txt", "md", "csv", "json", "xml", "yaml", "sql"].every((f) => g(f, `a.${f}`) === "texte"));
ok("Excel et classeur OpenDocument : tableurs", g("xlsx", "a.xlsx") === "tableur" && g("ods", "a.ods") === "tableur" && g("zip", "a.ods") === "tableur");
ok("PowerPoint et présentation OpenDocument, même reconnus comme ZIP", g("pptx", "a.pptx") === "presentation" && g("zip", "cours.pptx") === "presentation" && g("zip", "a.odp") === "presentation");
ok("photos et scans : reconnaissance ; SVG : son texte", ["png", "jpg", "webp", "heic", "tiff"].every((f) => g(f, `a.${f}`) === "image") && g("svg", "a.svg") === "svg");
ok("sons et vidéos : transcription (pas l'AVI)", ["mp3", "m4a", "wav", "mp4", "mov", "webm"].every((f) => g(f, `a.${f}`) === "media") && g("avi", "a.avi") === null);
ok("ZIP, TAR, TAR.GZ : archives à déballer", g("zip", "a.zip") === "archive" && g("tar", "a.tar") === "archive" && g("gz", "a.tar.gz") === "archive");
ok("sous-titres, journaux, code : lus comme du texte", ["a.srt", "a.vtt", "notes.log", "script.py", "page.tsx"].every((n) => g(null, n) === "texte"));
ok("une icône ou un format inconnu : pas de genre", g("ico", "a.ico") === null && g(null, "a.bin") === null);
ok("l'outil accepte documents, tableurs, images, sons, archives, mais pas l'AVI ni l'icône", ["pdf", "docx", "xlsx", "csv", "png", "mp3", "mp4", "zip"].every((f) => accepte("rassembler", f)) && accepte("rassembler", "zip", "cours.pptx") && !accepte("rassembler", "avi") && !accepte("rassembler", "ico"));

// Les fichiers à ignorer, les doublons, l'ordre
ok("fichiers cachés et du système ignorés", aIgnorer(".DS_Store") && aIgnorer("dossier/.cache") && aIgnorer("Thumbs.db") && aIgnorer("desktop.ini") && aIgnorer("~$rapport.docx") && !aIgnorer("rapport.docx"));
ok("un même fichier a la même clé ; un autre chemin non", cleFichier({ name: "a.pdf", size: 10, lastModified: 1 }) === cleFichier({ name: "a.pdf", size: 10, lastModified: 1 }) && cleFichier({ name: "a.pdf", size: 10, lastModified: 1 }, "x/a.pdf") !== cleFichier({ name: "a.pdf", size: 10, lastModified: 1 }, "y/a.pdf"));
const noms = ["Cours 10.pdf", "cours 2.pdf", "Cours 1.pdf", "Écrit.docx", "annexe.txt"].sort(ordreNaturel);
ok("ordre naturel : 1, 2, 10, sans tenir compte des majuscules ni des accents", noms.join("|") === "annexe.txt|Cours 1.pdf|cours 2.pdf|Cours 10.pdf|Écrit.docx", noms);

// Le texte assemblé
const pieces = [
  { nom: "a.pdf", texte: "Premier texte." },
  { nom: "vide.png", texte: "   " },
  { nom: "b.docx", texte: "Deuxième\n\ntexte." },
];
const avec = texteRassemble(pieces, true);
ok("avec les noms : chaque document est annoncé, dans l'ordre, les vides sautés", avec.startsWith("Document 1 sur 2 : a.pdf\n") && avec.includes("Document 2 sur 2 : b.docx") && !avec.includes("vide.png") && avec.indexOf("Premier") < avec.indexOf("Deuxième"), avec);
const sans = texteRassemble(pieces, false);
ok("sans les noms : les textes seuls, séparés", sans === "Premier texte.\n\n\nDeuxième\n\ntexte.\n", sans);
ok("un seul document : son nom sans numérotation", texteRassemble([pieces[0]], true).startsWith("a.pdf\n====="));
ok("rien de prêt : texte vide", texteRassemble([], true) === "" && texteRassemble([{ nom: "x", texte: "" }], false) === "");
ok("compter les mots (sans la ponctuation seule)", compterMots("Bonjour , le monde — 2026 !") === 4);
ok("texte net : fins de ligne, espaces de fin, lignes vides en trop", texteNet("a  \r\nb\r\n\n\n\n\n\nc\u0000") === "a\nb\n\n\nc");

// Décodage
const enc = new TextEncoder();
ok("UTF-8 avec marque", decoderTexte(new Uint8Array([0xef, 0xbb, 0xbf, ...enc.encode("été")])) === "été");
ok("Windows-1252 (vieux fichier Windows)", decoderTexte(new Uint8Array([0xe9, 0x74, 0xe9])) === "été");
ok("UTF-16 avec marque", decoderTexte(new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0xe9, 0x00])) === "aé");
ok("ressemble à du texte, ou pas", ressembleTexte(enc.encode("Bonjour\nle monde")) && !ressembleTexte(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x01])) && ressembleTexte(new Uint8Array([0xff, 0xfe, 0x61, 0x00])));

// Tableurs et présentations
const feuilles = texteDeFeuilles([{ nom: "Ventes", colonnes: ["Mois", "Total"], lignes: [["Janvier", 12], ["Février", null], ["", ""]] }]);
ok("un tableur : une ligne par rangée, des tabulations entre les cellules", feuilles === "Mois\tTotal\nJanvier\t12\nFévrier", feuilles);
ok("plusieurs feuilles : chacune annoncée", texteDeFeuilles([{ nom: "A", colonnes: ["x"], lignes: [] }, { nom: "B", colonnes: ["y"], lignes: [] }]).startsWith("Feuille « A »\nx\n\nFeuille « B »"));
const diapo = '<p:sld><a:p><a:r><a:t>Le titre</a:t></a:r></a:p><a:p><a:r><a:t>Une </a:t></a:r><a:r><a:t>phrase &amp; demie</a:t></a:r></a:p><a:p></a:p></p:sld>';
ok("une diapositive : un paragraphe par ligne, entités décodées", JSON.stringify(texteDrawingMl(diapo)) === JSON.stringify(["Le titre", "Une phrase & demie"]), texteDrawingMl(diapo));

// La recherche et l'offre Premium
ok("« copier le texte de tous mes documents » → Rassembler", chercherIntentions("copier le texte de tous mes documents")[0]?.outil === "rassembler", chercherIntentions("copier le texte de tous mes documents").map((x) => x.id));
ok("Rassembler a sa règle Premium (limité par défaut)", FONCTIONS.some((f) => f.id === "alambic.rassembler") && regleEffective(configParDefaut(), "alambic.rassembler").acces === "limite");

console.log(e ? `\n${e} échec(s)` : "\nRassembler : tout est bon.");
process.exit(e ? 1 : 0);
