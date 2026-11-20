// L'Écorché : le corps fabriqué, le catalogue, les niveaux, les questions et l'arbitrage des réponses écrites.
// Lancer : npm run test:corps
import { arteres } from "../src/lib/corps/anatomie/arteres";
import { muscles } from "../src/lib/corps/anatomie/muscles";
import { squelette } from "../src/lib/corps/anatomie/squelette";
import { tendons } from "../src/lib/corps/anatomie/tendons";
import { ELEMENTS, PAR_ID } from "../src/lib/corps/catalogue";
import { IDS_CATEGORIES, niveauxDe, titreDuJoueur, TITRES } from "../src/lib/corps/niveaux";
import { article, defiDuJour, fabriquer, METHODES, partieDeNiveau, questionMelangee, typesPossibles, type TypeQ } from "../src/lib/corps/quiz";
import { construireScene } from "../src/lib/corps/scene";
import { jugerNom, normaliser } from "../src/lib/corps/texte";

let echecs = 0;
const ok = (nom: string, cond: boolean, detail = "") => {
  if (!cond) {
    echecs++;
    console.log(`ÉCHEC ${nom}${detail ? ` — ${detail}` : ""}`);
  } else console.log(`OK ${nom}`);
};

/* ---------- Le corps ---------- */
const t0 = performance.now();
const pieces = [...squelette(), ...muscles(), ...tendons(), ...arteres()];
const scene = construireScene(pieces);
const duree = performance.now() - t0;
ok("le corps se fabrique en moins de 3 secondes", duree < 3000, `${Math.round(duree)} ms`);
ok("pas de peau : quatre couches seulement", Object.keys(scene.couches).sort().join() === "artere,muscle,os,tendon");
const cles = new Set<string>();
let doublon = "";
for (const p of pieces) {
  if (cles.has(p.cle)) doublon = p.cle;
  cles.add(p.cle);
}
ok("chaque pièce a une clé unique", !doublon, doublon);
ok("toutes les pièces ont des sommets valides", pieces.every((p) => p.maillage.p.length > 0 && p.maillage.p.every(Number.isFinite) && p.maillage.n.length === p.maillage.p.length));
ok("les indices restent dans les sommets", pieces.every((p) => p.maillage.i.every((i) => i >= 0 && i < p.maillage.p.length / 3)));
ok("le corps tient debout entre le sol et 1,8 m", pieces.every((p) => p.maillage.p.every((v, k) => k % 3 !== 1 || (v > -0.01 && v < 1.8))));
const gauche = pieces.filter((p) => p.cote === "g");
ok("chaque pièce gauche a sa jumelle droite", gauche.every((g) => cles.has(g.cle.replace(/:g$/, ":d"))));

/* ---------- Le catalogue ---------- */
const elementsDuCorps = new Set(pieces.map((p) => p.element));
ok("chaque pièce a sa fiche", [...elementsDuCorps].every((id) => PAR_ID.has(id)), [...elementsDuCorps].filter((id) => !PAR_ID.has(id)).join());
ok("chaque fiche a sa pièce sur le corps", ELEMENTS.every((e) => elementsDuCorps.has(e.id)), ELEMENTS.filter((e) => !elementsDuCorps.has(e.id)).map((e) => e.id).join());
ok("identifiants uniques", new Set(ELEMENTS.map((e) => e.id)).size === ELEMENTS.length);
ok("plus de 200 structures", ELEMENTS.length >= 200, String(ELEMENTS.length));
ok("chaque muscle a origine, terminaison, action et innervation", ELEMENTS.filter((e) => e.couche === "muscle").every((e) => e.origine && e.terminaison && e.action && e.innervation));
ok("chaque artère a sa provenance et son territoire", ELEMENTS.filter((e) => e.couche === "artere").every((e) => e.provenance && e.territoire));
ok("chaque tendon a son muscle et son attache", ELEMENTS.filter((e) => e.couche === "tendon").every((e) => e.muscle && PAR_ID.has(e.muscle) && e.attache));
ok("les articulations nomment des os connus", ELEMENTS.every((e) => (e.articulations ?? []).every((a) => PAR_ID.get(a)?.couche === "os")));
ok("les provenances nomment des artères connues (ou un texte)", ELEMENTS.filter((e) => e.provenance && /^[a-z-]+$/.test(e.provenance)).every((e) => PAR_ID.get(e.provenance!)?.couche === "artere"));

/* ---------- Les niveaux ---------- */
for (const c of IDS_CATEGORIES.filter((x) => x !== "corps")) {
  const vus = niveauxDe(c).flatMap((n) => n.nouveaux);
  ok(`${c} : chaque structure vue une seule fois`, new Set(vus).size === vus.length);
  const attendus = ELEMENTS.filter((e) => ({ os: "os", muscles: "muscle", tendons: "tendon", arteres: "artere" })[c] === e.couche).length;
  ok(`${c} : les planches couvrent toute la couche`, vus.length === attendus, `${vus.length}/${attendus}`);
}
ok("le grand examen couvre tout le corps", niveauxDe("corps").at(-1)!.nouveaux.length === ELEMENTS.length);
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
ok("plus de 2000 questions possibles", fabriquees > 2000, String(fabriquees));
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
ok("le singulier vaut le pluriel", normaliser("Vertèbres lombaires") === normaliser("vertèbre lombaire"));
ok("les articles : l', la, les", article(el("aorte")) === "l'aorte" && article(el("clavicule")) === "la clavicule" && article(el("intercostaux")) === "les intercostaux" && article(el("biceps-brachial")) === "le biceps brachial");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert.");
process.exit(echecs ? 1 : 0);
