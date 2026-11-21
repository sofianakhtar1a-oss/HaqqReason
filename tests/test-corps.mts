// L'Écorché : le modèle du corps (paquets, structures, zones), le catalogue, les planches, les questions
// et l'arbitrage des réponses écrites.
// Lancer : npm run test:corps
import { existsSync, readFileSync, statSync } from "node:fs";
import { ELEMENTS, PAR_ID, vautPour } from "../src/lib/corps/catalogue";
import manifeste from "../src/lib/corps/modele/manifeste.json";
import { CALQUES, Modele, calqueDElement } from "../src/lib/corps/modele/modele";
import { lirePaquet, OCTETS_PAR_SOMMET } from "../src/lib/corps/modele/paquet";
import { DDL, NOMS_ARTICULATIONS, NOMS_MOUVEMENTS } from "../src/lib/corps/mouvement/articulations";
import { gesteDe, programmeDe } from "../src/lib/corps/mouvement/gestes";
import { NB_AXIAUX, NB_LATERAUX, NB_SEGMENTS, type Pose, appliquer, numero, pointMesure, poser } from "../src/lib/corps/mouvement/squelette";
import { ELEMENTS_APPRIS, IDS_CATEGORIES, niveauxDe, titreDuJoueur, TITRES } from "../src/lib/corps/niveaux";
import { article, defiDuJour, FACETTE_DE, fabriquer, METHODES, partieDeNiveau, questionMelangee, typesPossibles, type TypeQ } from "../src/lib/corps/quiz";
import { estFonction, fabriquerFonction, jugerGeste, nomRacines, type Recueils, TYPES_FONCTION, type TypeFonction, typesFonction } from "../src/lib/corps/fonctions";
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
// (les vaisseaux testiculaires, eux, se montrent dans l'abdomen, jusqu'à l'anneau inguinal profond : voir plus bas)
const PUDEUR = /penis|scrot|\btestis\b|\btesticular (?!artery|vein)|epididym|clitor|\blabi(um|a) m|vulva/i;
ok("par pudeur, pas d'organes génitaux externes", !ELEMENTS.some((e) => PUDEUR.test(e.anglais)), ELEMENTS.filter((e) => PUDEUR.test(e.anglais)).map((e) => e.anglais).join());
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
const ABSENTS = ["aponevrose-bicipitale"]; // pas de modèle libre (le semi-épineux de la tête vient de BodyParts3D)
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
ok("chaque structure a son rang (0 : la plus connue) et sa région", ELEMENTS.every((e) => Number.isInteger(e.rang) && e.rang >= 0 && e.rang <= 3 && Boolean(e.region)), ELEMENTS.filter((e) => !Number.isInteger(e.rang)).slice(0, 5).map((e) => e.id).join());
ok("les incontournables existent dans chaque couche d'origine", ["os", "muscle", "artere"].every((c) => ELEMENTS.some((e) => e.couche === c && e.rang === 0)));
ok("pas de nom entre parenthèses ni de coquille connue", !ELEMENTS.some((e) => /^\(|métacrapien|plaxus|occulaire|Musclé |Facia /.test(e.nom)));

/* ---------- Les planches ---------- */
const publiees = lire("../scripts/corps/donnees/planches-publiees.json") as Record<string, string[][]>;
for (const c of IDS_CATEGORIES.filter((x) => x !== "corps")) {
  const vus = niveauxDe(c).flatMap((n) => n.nouveaux);
  ok(`${c} : chaque structure vue une seule fois`, new Set(vus).size === vus.length);
  ok(`${c} : les planches publiées gardent leur contenu`, JSON.stringify(niveauxDe(c).map((n) => n.nouveaux)) === JSON.stringify(publiees[c].map((l) => l.filter((id) => !ABSENTS.includes(id)))));
  // (la dernière peut être petite : quelques structures arrivées après la publication, comme le rein)
  // (les planches de compléments publiées avant le deuxième chantier gardent leur taille : la progression en dépend)
  const PETITES_PUBLIEES: Record<string, number[]> = { nerfs: [16], visceres: [17] };
  ok(`${c} : aucune planche vide`, niveauxDe(c).every((n, k, l) => n.nouveaux.length >= 4 || (k === l.length - 1 && n.nouveaux.length >= 1) || ((PETITES_PUBLIEES[c] ?? []).includes(k) && n.nouveaux.length >= 1)));
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

/* ---------- Le squelette ---------- */
type P3 = [number, number, number];
/** Où passe un point mesuré quand on pose le squelette : le point est emmené par le segment nommé. */
const passe = (pose: Pose, segment: string, point: string, cote: "g" | "d" = "g"): P3 => appliquer(poser(pose), pointMesure(point, cote), numero(segment, cote) * 12);
const repos = (point: string, cote: "g" | "d" = "g") => pointMesure(point, cote);
const vocabulaire = lire("../scripts/corps/donnees/fiches/vocabulaire.json") as { articulations: Record<string, string>; mouvements: Record<string, string> };
ok("le squelette tient dans un octet par segment", NB_SEGMENTS === NB_AXIAUX + 2 * NB_LATERAUX && NB_SEGMENTS <= 255, String(NB_SEGMENTS));
ok("au repos, rien ne bouge", Array.from(poser({})).every((v, i) => Math.abs(v - (i % 12 === 0 || i % 12 === 5 || i % 12 === 10 ? 1 : 0)) < 1e-9));
{
  const alea: Pose = {};
  let g = 7;
  for (const d of DDL) for (const cle of d.lateral ? [`${d.id}:g`, `${d.id}:d`] : [d.id]) alea[cle] = d.min + (((g = (g * 16807) % 2147483647) % 1000) / 1000) * (d.max - d.min);
  const m = poser(alea);
  let pire = 0;
  for (let s = 0; s < NB_SEGMENTS; s++) {
    const [a, b, c, , d, e, f, , gg, h, i] = Array.from(m.subarray(s * 12, s * 12 + 12));
    pire = Math.max(pire, Math.abs(a * (e * i - f * h) - b * (d * i - f * gg) + c * (d * h - e * gg) - 1));
  }
  ok("une pose quelconque ne déforme aucun os (rotations pures)", pire < 1e-3, String(pire));
}
const poignet = passe({ "coude.flexion:g": 90 }, "main", "main");
ok("fléchir le coude amène la main en avant et en haut", poignet[2] > repos("main")[2] + 0.12 && poignet[1] > repos("main")[1] + 0.12, poignet.map((v) => v.toFixed(2)).join());
const poignetD = passe({ "coude.flexion:d": 90 }, "main", "main", "d");
ok("le côté droit est le miroir du gauche", Math.abs(poignetD[0] + poignet[0]) < 1e-6 && Math.abs(poignetD[1] - poignet[1]) < 1e-6 && Math.abs(poignetD[2] - poignet[2]) < 1e-6);
ok("fléchir le genou emmène le pied en arrière", passe({ "genou.flexion:g": 90 }, "talus", "talus")[2] < repos("talus")[2] - 0.2);
ok("l'abduction de la hanche écarte le genou", passe({ "hanche.abduction:g": 40 }, "jambe", "jambe")[0] > repos("jambe")[0] + 0.15 && passe({ "hanche.abduction:d": 40 }, "jambe", "jambe", "d")[0] < repos("jambe", "d")[0] - 0.15);
ok("fléchir la hanche lève le genou devant", passe({ "hanche.flexion:g": 90 }, "jambe", "jambe")[2] > repos("jambe")[2] + 0.3);
const coudeLeve = passe({ "epaule.abduction:g": 90 }, "ulna", "ulna");
ok("l'abduction de l'épaule à 90° met le coude à hauteur d'épaule, en dehors", Math.abs(coudeLeve[1] - repos("humerus")[1]) < 0.09 && coudeLeve[0] > repos("ulna")[0] + 0.15, coudeLeve.map((v) => v.toFixed(2)).join());
ok("au-delà de 30°, la scapula accompagne le bras (rythme scapulo-huméral)", passe({ "epaule.abduction:g": 150 }, "scapula", "scapula.angle")[0] > repos("scapula.angle")[0] + 0.03 && Math.abs(passe({ "epaule.abduction:g": 25 }, "scapula", "scapula.angle")[0] - repos("scapula.angle")[0]) < 1e-6);
ok("la pronation fait passer le pouce en dedans", passe({ "avant-bras.pronation:g": 150 }, "pouce-mc", "pouce-mc")[0] < repos("pouce-mc")[0] - 0.02);
ok("la flexion dorsale relève la pointe du pied", passe({ "cheville.flexion:g": 20 }, "hallux-p1", "hallux-p1")[1] > repos("hallux-p1")[1] + 0.02 && passe({ "cheville.flexion:g": -40 }, "hallux-p1", "hallux-p1")[1] < repos("hallux-p1")[1] - 0.03);
ok("l'inversion relève le bord médial du pied", passe({ "pied.inversion:g": 25 }, "hallux-p1", "hallux-p1")[1] > repos("hallux-p1")[1] + 0.005);
const tete = (pose: Pose): P3 => passe(pose, "tete", "tete");
const nez = (pose: Pose): P3 => appliquer(poser(pose), [0, repos("tete")[1] + 0.05, 0.1], numero("tete") * 12);
ok("fléchir la colonne penche la tête en avant", tete({ "lombaire.flexion": 40, "thoracique.flexion": 30 })[2] > repos("tete")[2] + 0.25);
ok("l'inclinaison positive va vers la gauche, la rotation positive tourne le visage vers la gauche", tete({ "thoracique.inclinaison": 20, "lombaire.inclinaison": 15 })[0] > 0.1 && nez({ "cervical.rotation": 30, "tete.rotation": 40 })[0] > 0.05 && nez({ "cervical.rotation": -30 })[0] < -0.02);
ok("ouvrir la bouche abaisse le menton", passe({ "machoire.ouverture": 25 }, "mandibule", "mandibule.menton")[1] < repos("mandibule.menton")[1] - 0.02);
const inspire = poser({ "respiration.inspiration": 1 });
ok("à l'inspiration, les côtes se soulèvent et le sternum avance", appliquer(inspire, pointMesure("cote-5.avant"), numero("cote-5") * 12)[1] > pointMesure("cote-5.avant")[1] + 0.008 && appliquer(inspire, repos("sternum"), numero("sternum") * 12)[1] > repos("sternum")[1] + 0.004);
ok("le regard se lève et se tourne vers le nez", (() => {
  const centre = repos("oeil");
  const devant: P3 = [centre[0], centre[1], centre[2] + 0.012];
  const haut = appliquer(poser({ "oeil.elevation:g": 30 }), devant, numero("oeil") * 12);
  const dedans = appliquer(poser({ "oeil.adduction:g": 30 }), devant, numero("oeil") * 12);
  return haut[1] > devant[1] + 0.004 && dedans[0] < devant[0] - 0.004;
})());
ok("les articulations et les mouvements du squelette sont ceux du vocabulaire des fiches", DDL.every((d) => d.articulation in vocabulaire.articulations && [d.moins, d.plus].every((m) => m === "rotation" || m in vocabulaire.mouvements)), DDL.filter((d) => !(d.articulation in vocabulaire.articulations)).map((d) => d.id).join());
ok("chaque mouvement du squelette se joue", DDL.every((d) => [d.moins, d.plus].every((m) => m === "rotation" || m === "inclinaison" || gesteDe(d.articulation, m, "g"))), DDL.filter((d) => ![d.moins, d.plus].every((m) => m === "rotation" || m === "inclinaison" || gesteDe(d.articulation, m, "g"))).map((d) => d.id).join());
const etendre = gesteDe("coude", "extension", "g")!;
ok("un mouvement sans course part de la position opposée (étendre le coude, mettre en supination)", etendre.depart["coude.flexion:g"] > 60 && etendre.arrivee["coude.flexion:g"] === 0 && gesteDe("radio-ulnaire", "supination", "d")!.depart["avant-bras.pronation:d"] > 60);
ok("le rachis s'incline du côté du muscle et tourne selon lui", gesteDe("rachis-lombaire", "inclinaison", "g")!.arrivee["lombaire.inclinaison"] > 0 && gesteDe("rachis-lombaire", "inclinaison", "d")!.arrivee["lombaire.inclinaison"] < 0 && gesteDe("rachis-cervical", "rotation-controlaterale", "g")!.arrivee["cervical.rotation"] < 0 && gesteDe("tete", "rotation-homolaterale", "g")!.arrivee["tete.rotation"] > 0);
ok("l'opposition du pouce réunit trois mouvements", Object.keys(gesteDe("pouce-cmc", "opposition", "g")!.arrivee).length === 3);
ok("un muscle sans articulation à mouvoir se contracte sur place", programmeDe("orbiculaire-de-l-oeil", [{ articulation: "paupiere", mouvement: "fermeture", role: "principal" }]).some((e) => e.surPlace) && programmeDe("biceps-brachial", [{ articulation: "coude", mouvement: "flexion", role: "principal" }]).every((e) => !e.surPlace));

/* ---------- Les fiches enrichies ---------- */
{
  const bilan = lire("../src/lib/corps/fiches/bilan.json") as Record<string, [number, number]>;
  const RACINE = /^(C[1-8]|T(1[0-2]|[1-9])|L[1-5]|S[1-5]|Co|I|II|III|IV|V|V1|V2|V3|VI|VII|VIII|IX|X|XI|XII)$/;
  const existe = (id: string | null | undefined) => !id || PAR_ID.has(id);
  for (const couche of ["os", "muscle", "artere", "tendon", "ligament", "veine", "nerf", "viscere", "encephale", "lymphe"] as const) {
    const chemin = `../src/lib/corps/fiches/${couche}.json`;
    if (!existsSync(new URL(chemin, import.meta.url))) continue;
    const r = lire(chemin) as { sources: Record<string, { titre: string; url: string }>; fiches: Record<string, Record<string, unknown> & { sources: string[] }> };
    const ids = Object.keys(r.fiches);
    ok(`fiches ${couche} : chacune est une structure de la couche`, ids.every((id) => PAR_ID.get(id)?.couche === couche), ids.filter((id) => PAR_ID.get(id)?.couche !== couche).slice(0, 5).join());
    if (!ids.length) continue;
    ok(`fiches ${couche} : au moins deux sources réelles par fiche (sauf les tendons tirés de leur muscle)`, Object.values(r.fiches).every((f) => f.derive || (new Set(f.sources).size >= 2 && f.sources.every((c) => r.sources[c]?.url?.startsWith("http")))));
    ok(`fiches ${couche} : le bilan est juste`, bilan[couche]?.[0] === ids.length);
    // Tout ce qui renvoie à une autre structure (quel que soit le format de la couche) doit y mener.
    const CLES = new Set(["os", "artere", "veine", "nerf", "viscere", "lymphe", "muscles", "synergistes", "antagonistes", "structures", "arteres", "veines", "nerfs"]);
    const renvois: string[] = [];
    for (const [id, f] of Object.entries(r.fiches)) {
      const fouiller = (v: unknown, ou: string) => {
        if (Array.isArray(v)) v.forEach((x, k) => fouiller(x, `${ou}[${k}]`));
        else if (v && typeof v === "object")
          for (const [k, x] of Object.entries(v)) {
            if (CLES.has(k)) for (const y of Array.isArray(x) ? x : [x]) if (typeof y === "string" && !existe(y)) renvois.push(`${id}.${ou}.${k} → ${y}`);
            if (typeof x === "object") fouiller(x, `${ou}.${k}`);
          }
      };
      fouiller(f, "");
    }
    ok(`fiches ${couche} : tous les renvois mènent à une structure`, renvois.length === 0, renvois.slice(0, 5).join(" ; "));
    if (couche === "muscle") {
      const muscles = Object.entries(r.fiches) as [string, { actions: { articulation: string; mouvement: string; role: string }[]; innervation: { racines: string[] } }][];
      ok("chaque muscle a au moins une action principale et des racines valides", muscles.every(([, f]) => f.actions.some((a) => a.role === "principal") && f.innervation.racines.length > 0 && f.innervation.racines.every((x) => RACINE.test(x))));
      const inconnus = new Set(muscles.flatMap(([, f]) => f.actions.flatMap((a) => [a.articulation in NOMS_ARTICULATIONS ? "" : a.articulation, a.mouvement in NOMS_MOUVEMENTS ? "" : a.mouvement])).filter(Boolean));
      ok("chaque articulation et chaque mouvement des fiches a un nom à l'écran", inconnus.size === 0, [...inconnus].join());
      // Les actions qui sont des mouvements d'une articulation que le squelette modélise (pas l'expression du visage,
      // la langue, le larynx, le périnée, ni le simple maintien) : le squelette doit les jouer presque toutes.
      const modelisees = new Set(DDL.map((d) => d.articulation));
      const mouvements = muscles.flatMap(([, f]) => f.actions).filter((a) => modelisees.has(a.articulation) && !["stabilisation", "tension", "compression"].includes(a.mouvement));
      const jouees = mouvements.filter((a) => gesteDe(a.articulation, a.mouvement, "g")).length;
      ok("le squelette joue presque tous les mouvements des articulations qu'il modélise", jouees / mouvements.length >= 0.95, `${jouees}/${mouvements.length}`);
      ok("la fiche du biceps dit ce qu'il faut (flexion du coude, supination, nerf musculo-cutané, C5-C6)", (() => {
        const b = r.fiches["biceps-brachial"] as unknown as { actions: { articulation: string; mouvement: string }[]; innervation: { nerf: string; racines: string[] } };
        return b.actions.some((a) => a.articulation === "coude" && a.mouvement === "flexion") && b.actions.some((a) => a.mouvement === "supination") && b.innervation.nerf === "nerf-musculocutane" && b.innervation.racines.includes("C5") && b.innervation.racines.includes("C6");
      })());
    }
    if (couche === "veine") {
      // « Suis le sang » : de proche en proche, chaque veine mène au cœur sans tourner en rond.
      const fiches = r.fiches as unknown as Record<string, { terminaison: { veine?: string | null; viscere?: string | null } }>;
      const boucles: string[] = [];
      for (const id of Object.keys(fiches)) {
        const vus = new Set<string>();
        let x: string | null | undefined = id;
        while (x && fiches[x] && !vus.has(x)) {
          vus.add(x);
          x = fiches[x].terminaison.veine;
        }
        if (x && vus.has(x)) boucles.push(id);
      }
      ok("le sang veineux ne tourne jamais en rond", boucles.length === 0, boucles.slice(0, 4).join());
    }
    if (couche === "nerf") {
      const n = r.fiches as unknown as Record<string, { moteur?: { muscles?: string[] } | null; sensitif?: unknown; autonome?: unknown; sorte: string }>;
      ok("chaque nerf est moteur, sensitif ou autonome (sauf les plexus et les groupes)", Object.values(n).every((f) => f.moteur || f.sensitif || f.autonome || ["plexus", "groupe", "ganglion"].includes(f.sorte)));
      const median = n["nerf-median"];
      ok("le nerf médian commande le rond pronateur", !median || Boolean(median.moteur?.muscles?.includes("rond-pronateur")));
    }
    if (couche === "artere") {
      const t = r.fiches["tronc-coeliaque"] as unknown as { branches: { artere: string }[] } | undefined;
      ok("les branches du tronc cœliaque sont dans l'ordre (gastrique gauche, hépatique commune, splénique)", !t || t.branches.map((b) => b.artere).join() === "artere-gastrique-gauche,artere-hepatique-commune,artere-splenique");
      ok("les artères qui se palpent disent où prendre le pouls", ["radiale", "carotide-commune", "femorale", "poplitee"].filter((id) => r.fiches[id]).every((id) => (r.fiches[id].pouls as { ou?: string } | null)?.ou));
    }
  }
}

/* ---------- Les ensembles, les repères et les structures construites ---------- */
{
  const ensembles = ELEMENTS.filter((e) => e.membres?.length);
  // (les ensembles de la première version peuvent désigner une partie d'un os : l'ilium dans l'os coxal)
  const malFaits = ensembles.filter((e) => (e.nature === "ensemble" && e.membres!.length < 2) || !e.membres!.every((m) => PAR_ID.has(m) && !PAR_ID.get(m)!.membres));
  ok("chaque ensemble de la nomenclature réunit au moins deux structures du catalogue (pas d'ensemble d'ensembles)", !malFaits.length, malFaits.map((e) => e.id).join());
  const reperes = lire("../src/lib/corps/modele/reperes.json") as { cle: string; sur: string | null; nom: string; p: number[] }[];
  ok("chaque repère a une clé unique", new Set(reperes.map((r) => r.cle)).size === reperes.length);
  ok("presque tous les repères sont posés sur une structure du catalogue", reperes.filter((r) => r.sur && PAR_ID.has(r.sur)).length >= 0.98 * reperes.length, `${reperes.filter((r) => r.sur && PAR_ID.has(r.sur)).length}/${reperes.length}`);
  const PUDEUR_FR = /pénis|scrot|testicul|épididym|\bgland\b|prépuce/i;
  ok("aucun repère que la pudeur tait", !reperes.some((r) => PUDEUR_FR.test(r.nom)), reperes.filter((r) => PUDEUR_FR.test(r.nom)).map((r) => r.nom).join());
  const construits = ELEMENTS.filter((e) => e.construit);
  ok("les structures construites d'après les manuels sont là (plus de 500)", construits.length > 500, String(construits.length));
  // (une fiche rédigée remplace le résumé du tracé)
  const avecFiche = new Set(COUCHES.flatMap((c) => Object.keys((lire(`../src/lib/corps/fiches/${c}.json`) as { fiches: Record<string, unknown> }).fiches)));
  const sansTexte = construits.filter((e) => !e.resume && !avecFiche.has(e.id));
  ok("chaque structure construite dit ce qu'elle est (un résumé de son tracé, ou sa fiche)", !sansTexte.length, sansTexte.slice(0, 8).map((e) => e.id).join());
  const appuis = construits.filter((e) => e.appui && !PAR_ID.has(e.appui));
  ok("l'appui d'une structure construite est une structure du catalogue", !appuis.length, appuis.map((e) => e.id).join());
  // Les vaisseaux testiculaires ne sont montrés que dans l'abdomen : ils s'arrêtent au-dessus du pubis.
  const pieces = lire("../src/lib/corps/modele/pieces.json") as { element: string; c?: number[]; r?: number }[];
  const pubis = pieces.find((x) => x.element === "symphyse-pubienne");
  const testiculaires = pieces.filter((x) => /testiculaire/.test(x.element) && x.c && x.r !== undefined);
  ok("les vaisseaux testiculaires s'arrêtent au-dessus du pubis", Boolean(pubis?.c) && testiculaires.every((x) => x.c![1] - x.r! * 0.5 > pubis!.c![1]), testiculaires.map((x) => `${x.element} ${x.c?.[1]}`).join());
}

/* ---------- La couverture de la nomenclature ---------- */
{
  const c = lire("../src/lib/corps/modele/couverture.json") as { elements: number; couches: Record<string, { part: number; presents: number; reference: number }> };
  ok("la couverture est calculée sur le modèle actuel", c.elements === ELEMENTS.length, `${c.elements} ≠ ${ELEMENTS.length}`);
  // Des planchers : la couverture ne doit pas reculer (une pièce perdue en route se verrait ici).
  // Toute la référence (hors du champ mis à part : pudeur, corps féminin, microscopique, classement, inconstant).
  const planchers: Record<string, number> = { os: 1, ligament: 1, muscle: 1, artere: 1, veine: 1, lymphe: 1, nerf: 1, encephale: 1, viscere: 1 };
  for (const [couche, min] of Object.entries(planchers)) ok(`couverture ${couche} ≥ ${Math.round(min * 100)} %`, (c.couches[couche]?.part ?? 0) >= min, `${c.couches[couche]?.presents}/${c.couches[couche]?.reference}`);
}

/* ---------- Les questions sur les fonctions ---------- */
{
  const R: Recueils = {};
  for (const c of ["muscle", "nerf", "artere", "veine", "tendon", "ligament", "viscere", "encephale", "lymphe", "os"] as const) (R as Record<string, unknown>)[c] = lire(`../src/lib/corps/fiches/${c}.json`);
  const ctx = { difficulte: "normal" as const, recueils: R };
  const faites: Partial<Record<TypeFonction, number>> = {};
  const fautives: string[] = [];
  for (const e of ELEMENTS)
    for (const t of typesFonction(e, R)) {
      const q = fabriquerFonction(11, e.id, t, ctx);
      if (!q) continue;
      faites[t] = (faites[t] ?? 0) + 1;
      if (q.reponse === "qcm" && !q.options.some((o) => o.id === q.attendu)) fautives.push(`${t}:${e.id} (la bonne réponse manque)`);
      if (q.reponse === "qcm" && new Set(q.options.map((o) => normaliser(o.texte))).size !== q.options.length) fautives.push(`${t}:${e.id} (deux choix identiques)`);
      if (q.reponse === "ordre" && (q.ordre?.length !== q.options.length || q.ordre.join(">") !== q.attendu)) fautives.push(`${t}:${e.id} (ordre)`);
      if (q.reponse === "suite" && !(q.ordre ?? []).every((x) => PAR_ID.has(x))) fautives.push(`${t}:${e.id} (suite)`);
      if (q.indice && ["cas-clinique", "sensibilite", "tester", "role"].includes(t) && normaliser(q.indice).includes(normaliser(e.nom))) fautives.push(`${t}:${e.id} (l'indice donne le nom)`);
    }
  ok("chaque méthode de fonction fabrique des questions", TYPES_FONCTION.every((t) => (faites[t] ?? 0) >= 10), JSON.stringify(faites));
  ok("des milliers de questions de fonction", Object.values(faites).reduce((s, n) => s + (n ?? 0), 0) > 2500, String(Object.values(faites).reduce((s, n) => s + (n ?? 0), 0)));
  ok("les questions de fonction sont bien formées", fautives.length === 0, fautives.slice(0, 6).join(" ; "));
  ok("la même graine donne la même question de fonction", JSON.stringify(fabriquerFonction(5, "biceps-brachial", "mouvement", ctx)) === JSON.stringify(fabriquerFonction(5, "biceps-brachial", "mouvement", ctx)));
  const mvt = fabriquerFonction(5, "biceps-brachial", "mouvement", ctx);
  ok("« Regarde le mouvement » : le biceps fléchit le coude ou met l'avant-bras en supination", Boolean(mvt && ["coude|flexion", "radio-ulnaire|supination"].includes(mvt.attendu) && mvt.geste?.muscle === "biceps-brachial"), mvt?.attendu);
  const ago = Array.from({ length: 12 }, (_, k) => fabriquerFonction(k, "biceps-brachial", "agoniste", ctx)).filter(Boolean);
  ok("« Agoniste ou antagoniste ? » : le triceps est antagoniste de la flexion du coude", ago.every((q) => !(q!.cible === "triceps-brachial" && /flexion du coude/.test(q!.consigne)) || q!.attendu === "antagoniste") && ago.length > 0);
  const nerf = fabriquerFonction(5, "biceps-brachial", "qui-innerve", ctx);
  ok("« Qui innerve ? » : le biceps, par le nerf musculo-cutané", nerf?.attendu === "nerf-musculocutane", nerf?.attendu);
  // Les nerfs que les atlas n'ont pas, tracés d'après leurs repères (01c_traces.py) : les muscles les retrouvent.
  ok("les nerfs tracés existent : phrénique, laryngé récurrent, glutéal inférieur", ["nerf-phrenique", "nerf-larynge-recurrent", "nerf-gluteal-inferieur"].every((id) => PAR_ID.get(id)?.couche === "nerf"));
  ok("« Qui innerve ? » : le diaphragme, par le nerf phrénique", fabriquerFonction(5, "diaphragme", "qui-innerve", ctx)?.attendu === "nerf-phrenique");
  ok("« Qui innerve ? » : le grand fessier, par le nerf glutéal inférieur", fabriquerFonction(5, "grand-fessier", "qui-innerve", ctx)?.attendu === "nerf-gluteal-inferieur");
  ok("« Qui innerve ? » : le crico-aryténoïdien postérieur, par le nerf laryngé récurrent", fabriquerFonction(5, "crico-arytenoidien-posterieur", "qui-innerve", ctx)?.attendu === "nerf-larynge-recurrent");
  ok("« Les racines » : C5-C6 pour le biceps", fabriquerFonction(5, "biceps-brachial", "racines", ctx)?.attendu === "C5-C6");
  ok("« Réflexe et racine » : le réflexe rotulien explore L3-L4", fabriquerFonction(5, "ligament-patellaire", "reflexe", ctx)?.attendu === "L3-L4");
  const sang = fabriquerFonction(5, "radiale", "sang", ctx);
  ok("« Suis le sang » : la radiale vient de l'humérale, qui vient de l'axillaire", Boolean(sang?.ordre && sang.ordre.slice(-3).join() === "axillaire,humerale,radiale"), sang?.ordre?.join());
  const veine = fabriquerFonction(5, "veine-cephalique", "sang", ctx);
  ok("« Suis le sang » : la veine céphalique mène à la veine cave supérieure", veine?.ordre?.[0] === "veine-cephalique" && veine.ordre[veine.ordre.length - 1] === "veine-cave-superieure", veine?.ordre?.join());
  ok("« Les branches dans l'ordre » : le tronc cœliaque", fabriquerFonction(5, "tronc-coeliaque", "branches", ctx)?.attendu === "artere-gastrique-gauche>artere-hepatique-commune>artere-splenique");
  ok("les racines voisines se disent d'un trait", nomRacines(["C6", "C5"]) === "C5-C6" && nomRacines(["C8", "T1"]) === "C8-T1" && nomRacines(["L4", "S1"]) === "L4, S1");
  ok("« Fais le geste » : fléchir le coude gauche, c'est juste", jugerGeste("coude.flexion:1", { "coude.flexion:g": 110 }));
  ok("« Fais le geste » : l'étendre, ou bouger surtout l'épaule, c'est faux", !jugerGeste("coude.flexion:1", { "coude.flexion:g": -5 }) && !jugerGeste("coude.flexion:1", { "coude.flexion:g": 40, "epaule.flexion:g": 150 }));
  ok("chaque méthode exerce une facette de la mémoire (sauf l'intrus et le vrai-faux)", (Object.keys(METHODES) as TypeQ[]).every((t) => FACETTE_DE[t] !== undefined && (FACETTE_DE[t] !== null || t === "intrus" || t === "vrai-faux")));
  const avecFiches = partieDeNiveau({ categorie: "muscles", n: 8, graine: 3, nombre: 12, difficulte: "normal", ctx: { recueils: R } });
  ok("les planches avancées mêlent des questions sur les fonctions", avecFiches.some((q) => estFonction(q.type)), avecFiches.map((q) => q.type).join());
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert.");
process.exit(echecs ? 1 : 0);
