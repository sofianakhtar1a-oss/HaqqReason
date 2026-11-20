// L'Écorché : le modèle du corps (paquets, structures, zones), le catalogue, les planches, les questions
// et l'arbitrage des réponses écrites.
// Lancer : npm run test:corps
import { existsSync, readFileSync, statSync } from "node:fs";
import { ELEMENTS, PAR_ID, vautPour } from "../src/lib/corps/catalogue";
import manifeste from "../src/lib/corps/modele/manifeste.json";
import { CALQUES, Modele, calqueDElement } from "../src/lib/corps/modele/modele";
import { lirePaquet, OCTETS_PAR_SOMMET } from "../src/lib/corps/modele/paquet";
import { ELEMENTS_APPRIS, IDS_CATEGORIES, niveauxDe, titreDuJoueur, TITRES } from "../src/lib/corps/niveaux";
import { article, defiDuJour, fabriquer, METHODES, partieDeNiveau, questionMelangee, typesPossibles, type TypeQ } from "../src/lib/corps/quiz";
import { jugerNom, normaliser } from "../src/lib/corps/texte";
import { COUCHES } from "../src/lib/corps/types";

let echecs = 0;
const ok = (nom: string, cond: boolean, detail = "") => {
  if (!cond) {
    echecs++;
    console.log(`ÉCHEC ${nom}${detail ? ` — ${detail}` : ""}`);
  } else console.log(`OK ${nom}`);
};
const lire = (chemin: string) => JSON.parse(readFileSync(new URL(chemin, import.meta.url), "utf8"));

/* ---------- Le modèle : les paquets ---------- */
type Lod = { lod: number; fichier: string; octets: number; sommets: number; triangles: number };
type Groupe = { pieces: string[]; lods: Lod[] };
const groupes = Object.entries(manifeste.paquets as Record<string, { paire?: Groupe; impaire?: Groupe }>).flatMap(([nom, p]) => [p.paire, p.impaire].filter((g): g is Groupe => Boolean(g)).map((g) => ({ nom, g })));
// Le niveau le plus fin n'est dans le dépôt que s'il est publié.
const fichiers = groupes.flatMap(({ g }) => g.lods).filter((l) => (manifeste as { haute?: boolean }).haute === true || l.lod >= 1);
const chemin = (f: string) => new URL(`../public/corps/${f}`, import.meta.url);
ok("chaque paquet du manifeste est sur le disque, à la bonne taille", fichiers.every((l) => existsSync(chemin(l.fichier)) && statSync(chemin(l.fichier)).size === l.octets), fichiers.filter((l) => !existsSync(chemin(l.fichier))).map((l) => l.fichier).join());
ok("pas de peau : aucune couche ni structure de peau", !CALQUES.some((c) => /peau|skin/.test(c)) && !ELEMENTS.some((e) => /\bskin\b|\bpeau\b/i.test(`${e.anglais} ${e.nom}`)));
ok("par pudeur, pas d'organes génitaux externes", !ELEMENTS.some((e) => /penis|scrot|\btest(is|icular)\b|epididym|clitor|\blabi(um|a) m|vulva/i.test(e.anglais)), ELEMENTS.filter((e) => /penis|scrot|\btest(is|icular)\b|epididym|clitor|\blabi(um|a) m|vulva/i.test(e.anglais)).map((e) => e.anglais).join());
ok("les dix couches sont là", COUCHES.every((c) => CALQUES.includes(c)), CALQUES.join());
ok("trois niveaux de détail par couche", COUCHES.every((c) => groupes.filter((x) => x.nom === c).every((x) => x.g.lods.length === 3)));
// Le niveau léger, décodé en entier : c'est celui du premier affichage.
const t0 = performance.now();
let sommets = 0;
let triangles = 0;
let horsCorps = "";
let indicesFaux = "";
for (const { nom, g } of groupes) {
  const l = g.lods.find((x) => x.lod === 2) ?? g.lods[g.lods.length - 1];
  const donnees = readFileSync(chemin(l.fichier));
  const p = await lirePaquet(donnees.buffer.slice(donnees.byteOffset, donnees.byteOffset + donnees.byteLength) as ArrayBuffer);
  sommets += p.sommets;
  triangles += p.triangles;
  if (p.pieces.length !== g.pieces.length || p.pieces.some((x, i) => x.cle !== g.pieces[i])) horsCorps += ` ${nom} (pièces)`;
  if (p.tampon.byteLength !== p.sommets * OCTETS_PAR_SOMMET) horsCorps += ` ${nom} (tampon)`;
  const u16 = new Uint16Array(p.tampon);
  for (let i = 0; i < p.sommets; i++) {
    const y = p.origine[1] + u16[i * 12 + 1] * p.pas;
    const x = p.origine[0] + u16[i * 12] * p.pas;
    if (y < -0.02 || y > 1.85 || Math.abs(x) > 0.95) {
      horsCorps += ` ${nom}`;
      break;
    }
  }
  for (const piece of p.pieces)
    for (let i = piece.t[0] * 3, fin = (piece.t[0] + piece.t[1]) * 3; i < fin; i++)
      if (p.indices[i] < piece.s[0] || p.indices[i] >= piece.s[0] + piece.s[1]) {
        indicesFaux += ` ${nom}/${piece.cle}`;
        break;
      }
}
const duree = performance.now() - t0;
ok("les paquets légers se décodent en moins de 3 secondes", duree < 3000, `${Math.round(duree)} ms, ${sommets} sommets, ${triangles} triangles`);
ok("le corps tient debout entre le sol et 1,85 m", !horsCorps, horsCorps);
ok("les triangles de chaque pièce restent dans ses sommets", !indicesFaux, indicesFaux);

/* ---------- Le modèle : les structures ---------- */
const modele = new Modele();
const cles = modele.structures.map((s) => `${s.calque}/${s.cle}`);
const rangDe = new Map(cles.map((c, i) => [c, i]));
ok("chaque structure a une clé unique dans son calque", rangDe.size === cles.length, cles.filter((c, i) => rangDe.get(c) !== i).slice(0, 5).join());
ok("les numéros des structures se suivent", modele.structures.every((s, i) => s.id === i));
// Les pièces paires ne sont stockées qu'une fois : la droite est le miroir de la gauche.
const paires = groupes.flatMap(({ nom, g }) => (g === (manifeste.paquets as Record<string, { paire?: Groupe }>)[nom].paire ? g.pieces.map((cle) => [rangDe.get(`${nom}/${cle}:g`), rangDe.get(`${nom}/${cle}:d`)]) : []));
ok("chaque pièce paire a sa jumelle de l'autre côté", paires.length > 1000 && paires.every(([g, d]) => g !== undefined && d !== undefined));
ok("la jumelle est le miroir de la pièce", paires.every(([g, d]) => { const [a, b] = [modele.structures[g!], modele.structures[d!]]; return b.centre[0] === -a.centre[0] && b.centre[1] === a.centre[1] && b.element === a.element && a.cote === "g" && b.cote === "d"; }));
const sansStructure = ELEMENTS.filter((e) => !(modele.parElement.get(e.id) ?? []).length);
ok("chaque fiche a sa structure sur le corps", !sansStructure.length, sansStructure.slice(0, 8).map((e) => e.id).join());
const sansFiche = modele.structures.filter((s) => s.calque !== "insertion" && !PAR_ID.has(s.element));
ok("chaque structure a sa fiche", !sansFiche.length, sansFiche.slice(0, 8).map((s) => s.cle).join());
const zones = modele.structures.filter((s) => s.zone);
ok("les tendons portés par les muscles sont des structures", zones.length > 300 && zones.every((z) => z.de !== undefined && modele.structures[z.de].calque === "muscle"));
ok("le tendon quadricipital et le ligament patellaire se touchent à part", ["tendon-quadricipital", "ligament-patellaire", "tendon-long-biceps", "aponevrose-palmaire", "centre-tendineux"].every((id) => (modele.parElement.get(id) ?? []).some((i) => modele.structures[i].zone)));
ok("toucher le tendon d'un muscle vaut pour le muscle, pas l'inverse", vautPour("tendon-quadricipital", "tendon-quadricipital") && vautPour("vertebre-l3", "vertebres-lombaires") === ELEMENTS.some((e) => e.id === "vertebre-l3") && ELEMENTS.filter((e) => e.zone && e.muscle).every((e) => vautPour(e.id, e.muscle!) && !vautPour(e.muscle!, e.id)));
ok("les enveloppes vivent dans leur calque", calqueDElement("fascia-palmaire") === "fascia" && calqueDElement("femur") === "os" && calqueDElement("tendon-quadricipital") === "tendon");
ok("les surfaces d'insertion nomment leur muscle (ou leur ligament)", modele.insertionDe.size > 600 && [...modele.insertionDe.values()].every((i) => i.muscles.length > 0 && i.muscles.every((m) => ["muscle", "ligament"].includes(PAR_ID.get(m)?.couche ?? ""))));

/* ---------- Le catalogue ---------- */
ok("identifiants uniques", new Set(ELEMENTS.map((e) => e.id)).size === ELEMENTS.length);
ok("plus de 1 600 structures", ELEMENTS.length >= 1600, String(ELEMENTS.length));
const heritage = lire("../scripts/corps/donnees/heritage.json") as { id: string; couche: string }[];
const ABSENTS = ["semi-epineux-tete", "aponevrose-bicipitale"]; // pas de modèle dans Z-Anatomy : à modéliser
const perdus = heritage.filter((h) => !PAR_ID.has(h.id)).map((h) => h.id);
ok("les structures de la première version gardent leur identifiant", perdus.every((id) => ABSENTS.includes(id)), perdus.join());
const anciens = heritage.map((h) => PAR_ID.get(h.id)).filter((e) => e !== undefined);
ok("et leur couche", anciens.every((e) => heritage.find((h) => h.id === e.id)!.couche === e.couche), anciens.filter((e) => heritage.find((h) => h.id === e.id)!.couche !== e.couche).map((e) => e.id).join());
ok("les muscles d'origine gardent origine, terminaison, action et innervation", anciens.filter((e) => e.couche === "muscle").every((e) => e.origine && e.terminaison && e.action && e.innervation));
ok("les artères d'origine gardent provenance et territoire", anciens.filter((e) => e.couche === "artere").every((e) => e.provenance && e.territoire));
ok("les tendons d'origine gardent leur muscle et leur attache", anciens.filter((e) => e.couche === "tendon").every((e) => e.muscle && PAR_ID.has(e.muscle) && e.attache), anciens.filter((e) => e.couche === "tendon" && !(e.muscle && PAR_ID.has(e.muscle) && e.attache)).map((e) => e.id).join());
ok("les articulations nomment des os connus", ELEMENTS.every((e) => (e.articulations ?? []).every((a) => PAR_ID.get(a)?.couche === "os")), ELEMENTS.flatMap((e) => (e.articulations ?? []).filter((a) => PAR_ID.get(a)?.couche !== "os")).slice(0, 6).join());
ok("les provenances nomment des artères connues (ou un texte)", ELEMENTS.filter((e) => e.provenance && /^[a-z-]+$/.test(e.provenance)).every((e) => PAR_ID.get(e.provenance!)?.couche === "artere"));
ok("les nerfs et les os d'un muscle sont des structures connues", ELEMENTS.every((e) => (!e.nerf || PAR_ID.get(e.nerf)?.couche === "nerf") && [...(e.origines ?? []), ...(e.terminaisons ?? [])].every((o) => PAR_ID.has(o))));
ok("chaque structure a un nom français, latin et anglais, et son article", ELEMENTS.every((e) => e.nom && e.latin && e.anglais && ["le ", "la ", "l'", "les "].includes(e.art ?? "")), ELEMENTS.filter((e) => !(e.nom && e.latin && e.anglais && e.art)).slice(0, 5).map((e) => e.id).join());
ok("pas de nom entre parenthèses ni de coquille connue", !ELEMENTS.some((e) => /^\(|métacrapien|plaxus|occulaire|Musclé |Facia /.test(e.nom)));

/* ---------- Les planches ---------- */
const publiees = lire("../scripts/corps/donnees/planches-publiees.json") as Record<string, string[][]>;
for (const c of IDS_CATEGORIES.filter((x) => x !== "corps")) {
  const vus = niveauxDe(c).flatMap((n) => n.nouveaux);
  ok(`${c} : chaque structure vue une seule fois`, new Set(vus).size === vus.length);
  ok(`${c} : les planches publiées gardent leur contenu`, JSON.stringify(niveauxDe(c).map((n) => n.nouveaux)) === JSON.stringify(publiees[c].map((l) => l.filter((id) => !ABSENTS.includes(id)))));
  ok(`${c} : aucune planche vide`, niveauxDe(c).every((n) => n.nouveaux.length >= 4));
}
ok("les quatre couches de la première version ont leurs planches", ["os", "muscles", "tendons", "arteres"].every((c) => (IDS_CATEGORIES as string[]).includes(c)));
ok("le grand examen couvre tout ce qu'on apprend", niveauxDe("corps").at(-1)!.nouveaux.length === ELEMENTS_APPRIS.length && ELEMENTS_APPRIS.length >= 225);
ok("les titres vont du carabin à Vésale", TITRES[0].nom === "Carabin" && TITRES.at(-1)!.nom === "Vésale" && titreDuJoueur(0).titre.nom === "Carabin" && titreDuJoueur(1e9).titre.nom === "Vésale");

/* ---------- Les questions ---------- */
let fabriquees = 0;
let ratees = "";
for (const e of ELEMENTS)
  for (const t of typesPossibles(e)) {
    const q = fabriquer(7, e.id, t, { difficulte: "difficile" });
    if (!q) continue;
    fabriquees++;
    const bonne = q.options.find((o) => o.id === q.attendu);
    if (q.reponse === "qcm" && (!bonne || new Set(q.options.map((o) => o.texte)).size !== q.options.length)) ratees += ` ${e.id}/${t}`;
  }
ok("chaque question à choix a sa bonne réponse et des choix distincts", !ratees, ratees);
ok("plus de 8 000 questions possibles", fabriquees > 8000, String(fabriquees));
const meme1 = JSON.stringify(partieDeNiveau({ categorie: "muscles", n: 3, graine: 42, nombre: 12, difficulte: "normal" }));
const meme2 = JSON.stringify(partieDeNiveau({ categorie: "muscles", n: 3, graine: 42, nombre: 12, difficulte: "normal" }));
ok("la même graine donne la même partie", meme1 === meme2);
const partie = partieDeNiveau({ categorie: "os", n: 2, graine: 9, nombre: 12, difficulte: "normal" });
ok("une planche fait ses 12 questions", partie.length === 12, String(partie.length));
ok("chaque nouveauté de la planche est interrogée", niveauxDe("os")[1].nouveaux.every((id) => partie.some((q) => q.cible === id)));
ok("jamais deux fois de suite la même structure", partie.every((q, i) => i === 0 || q.cible !== partie[i - 1].cible));
const situer = partieDeNiveau({ categorie: "os", n: 1, graine: 3, nombre: 12, difficulte: "normal", methode: "situer" });
ok("une méthode choisie s'applique à toute la planche", situer.every((q) => q.type === "situer"), situer.map((q) => q.type).join());
ok("le défi du jour : dix questions, les mêmes pour tous", defiDuJour("2026-11-20").length === 10 && JSON.stringify(defiDuJour("2026-11-20")) === JSON.stringify(defiDuJour("2026-11-20")));
ok("l'éclair tire toujours une question", Array.from({ length: 50 }, (_, i) => questionMelangee(i, ELEMENTS.map((e) => e.id), true, "normal")).every((q) => q && q.reponse === "qcm"));
ok("chaque méthode a un nom", (Object.keys(METHODES) as TypeQ[]).every((m) => METHODES[m].nom));

/* ---------- Les réponses écrites ---------- */
const el = (id: string) => PAR_ID.get(id)!;
ok("les anciens noms comptent (omoplate, rotule, péroné, couturier)", jugerNom(el("scapula"), "omoplate") === "juste" && jugerNom(el("patella"), "la rotule") === "juste" && jugerNom(el("fibula"), "Péroné") === "juste" && jugerNom(el("sartorius"), "couturier") === "juste");
ok("sans accents ni majuscules", jugerNom(el("sterno-cleido-mastoidien"), "STERNO CLEIDO MASTOIDIEN") === "juste");
ok("une lettre de travers : presque", jugerNom(el("biceps-brachial"), "bicep brachiale") === "presque");
ok("le latin compte aussi", jugerNom(el("biceps-brachial"), "biceps brachii") === "juste");
ok("une autre structure : faux", jugerNom(el("biceps-brachial"), "triceps brachial") === "faux");
ok("le mot de genre peut manquer, mais pas être faux", jugerNom(el("femorale"), "fémorale") === "juste" && jugerNom(el("femorale"), "artère fémorale") === "juste" && jugerNom(el("femorale"), "veine fémorale") === "faux" && jugerNom(el("deltoide"), "muscle deltoïde") === "juste");
ok("le singulier vaut le pluriel", normaliser("Vertèbres lombaires") === normaliser("vertèbre lombaire"));
ok("les articles : l', la, les", article(el("aorte")) === "l'aorte" && article(el("clavicule")) === "la clavicule" && article(el("intercostaux")) === "les intercostaux" && article(el("biceps-brachial")) === "le biceps brachial");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert.");
process.exit(echecs ? 1 : 0);
