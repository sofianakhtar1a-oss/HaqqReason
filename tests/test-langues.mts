import { composerSeance, leurres, melanger, trouDans } from "../src/lib/langues/exercices";
import { apercuDelai, estDue, intervalle, maitrise, nouvelleCarte, rappel, reviser, serie } from "../src/lib/langues/srs";
import type { Carte, Element } from "../src/lib/langues/types";
import { normaliser, verifier } from "../src/lib/langues/verification";
import { THEMES, TOUTES_LES_ENTREES } from "../src/lib/langues/themes/index";
import { decouperPage, decouperPhrases, lotsDePassage } from "../src/lib/langues/texte";
import { idMot, motPropre, nouveauMot, versCsv } from "../src/lib/langues/dictionnaire";

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${JSON.stringify(x).slice(0, 400)}`));
  if (!c) e++;
};
const MIN = 60_000;
const JOUR = 86_400_000;
const t0 = Date.UTC(2026, 10, 17, 9);

// ---------------------------------------------------------------- FSRS
ok("à 90 % de rappel, l'intervalle vaut la stabilité", intervalle(10) === 10 && Math.abs(rappel(10, 10) - 0.9) < 0.001);
const n = nouvelleCarte("x", t0);
const a1 = reviser(n, 3, t0);
ok("nouveau mot « bien » : étape de 10 minutes", a1.etat === "apprentissage" && a1.echeance - t0 === 10 * MIN && a1.pas === 1);
const a0 = reviser(n, 1, t0);
ok("nouveau mot « à revoir » : 1 minute", a0.echeance - t0 === MIN && a0.etat === "apprentissage");
const r1 = reviser(a1, 3, t0 + 10 * MIN);
ok("fin des étapes : le mot passe en révision, à un jour au moins", r1.etat === "revision" && r1.echeance - (t0 + 10 * MIN) >= JOUR);
const facile = reviser(n, 4, t0);
ok("nouveau mot « facile » : directement à plusieurs jours", facile.etat === "revision" && facile.echeance - t0 >= 4 * JOUR);
let c: Carte = r1;
let instant = c.echeance;
const intervalles: number[] = [];
for (let i = 0; i < 5; i++) {
  c = reviser(c, 3, instant);
  intervalles.push(Math.round((c.echeance - instant) / JOUR));
  instant = c.echeance;
}
ok("réussites successives : les intervalles grandissent", intervalles.every((x, i) => i === 0 || x > intervalles[i - 1]) && intervalles[4] > 30, intervalles);
const oubli = reviser(c, 1, instant);
ok("oubli : retour en réapprentissage, stabilité réduite, oubli compté", oubli.etat === "reapprentissage" && oubli.stabilite < c.stabilite && oubli.oublis === 1 && oubli.echeance - instant === 10 * MIN);
const dur = reviser(c, 2, instant);
const bien = reviser(c, 3, instant);
const tresFacile = reviser(c, 4, instant);
ok("difficile < bien < facile", dur.echeance < bien.echeance && bien.echeance < tresFacile.echeance);
ok("« difficile » augmente la difficulté, « facile » la baisse", dur.difficulte > c.difficulte && tresFacile.difficulte < c.difficulte);
ok("aperçu des délais lisible", apercuDelai(n, 1, t0) === "1 min" && apercuDelai(n, 3, t0) === "10 min" && /j$/.test(apercuDelai(n, 4, t0)));
ok("maîtrise : nouveau, en cours, appris, maîtrisé", maitrise(undefined) === "nouveau" && maitrise(a1) === "en-cours" && maitrise(r1) === "appris" && maitrise(c) === "maitrise");
ok("échéance due ou pas", estDue(a1, t0 + 11 * MIN) && !estDue(a1, t0 + 5 * MIN) && !estDue(n, t0));
ok("série de jours consécutifs", serie(["2026-11-15", "2026-11-16", "2026-11-17"], "2026-11-17") === 3 && serie(["2026-11-15", "2026-11-16"], "2026-11-17") === 2 && serie(["2026-11-14"], "2026-11-17") === 0);

// ---------------------------------------------------------------- vérification
ok("normaliser : articles, accents, casse, ponctuation", normaliser("  The Brother! ") === "brother" && normaliser("To Travel") === "travel" && normaliser("L'été") === "ete");
ok("réponse exacte", verifier("brother", "brother") === "juste" && verifier("the brother", "brother") === "juste");
ok("petite faute : presque", verifier("brohter", "brother") === "presque" && verifier("neighbour", "neighbor") === "presque");
ok("plusieurs réponses admises", verifier("journey", "trip / journey") === "juste" && verifier("trip", "trip, journey") === "juste");
ok("mauvaise réponse", verifier("sister", "brother") === "faux" && verifier("", "brother") === "faux" && verifier("cat", "car") === "faux");

// ---------------------------------------------------------------- exercices
const alea = (() => {
  let s = 42;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();
const els: Element[] = [
  ["brother", "frère", "nom", "My brother lives in London."],
  ["sister", "sœur", "nom", "Her sister is a doctor."],
  ["to travel", "voyager", "verbe", "We travelled to Spain last summer."],
  ["luggage", "bagages", "nom", "Don't forget your luggage."],
  ["to study", "étudier", "verbe", "She studies every evening."],
  ["happy", "heureux", "adjectif", "They look happy today."],
  ["ticket", "billet", "nom", "I bought a ticket online."],
  ["to cry", "pleurer", "verbe", "The baby cried all night."],
].map(([en, fr, nature, exEn], i) => ({ id: `e${i}`, en, fr, nature, exEn, exFr: "" }));
ok("mélange : mêmes éléments", melanger([1, 2, 3, 4], alea).sort().join() === "1,2,3,4");
const l = leurres(els[0], els, "fr", alea);
ok("trois leurres distincts, sans la bonne réponse, de même nature d'abord", l.length === 3 && !l.includes("frère") && new Set(l).size === 3 && l.every((x) => ["sœur", "bagages", "billet"].includes(x)), l);
ok("trou : verbe conjugué retrouvé", trouDans(els[2])?.mot === "travelled" && trouDans(els[4])?.mot === "studies" && trouDans(els[7])?.mot === "cried", [trouDans(els[2]), trouDans(els[4]), trouDans(els[7])]);
ok("trou : nom simple", trouDans(els[0])?.avant === "My " && trouDans(els[0])?.apres === " lives in London.");
const premiere = composerSeance({ elements: els, cartes: new Map(), maintenant: t0, nouveauxMax: 5, alea });
ok("première séance : cinq découvertes puis leur rappel", premiere.filter((x) => x.type === "carte").length === 5 && premiere.filter((x) => x.type === "qcm").length === 5 && premiere.slice(0, 5).every((x) => x.type === "carte"));
const cartes = new Map<string, Carte>(els.map((el) => [el.id, { ...nouvelleCarte(el.id, t0), etat: "revision", stabilite: 30, difficulte: 5, derniere: t0 - 40 * JOUR, echeance: t0 - JOUR, reps: 5 }]));
const revision = composerSeance({ elements: els, cartes, maintenant: t0, alea });
ok("révision : pas de carte de découverte, une association de paires", !revision.some((x) => x.type === "carte") && revision.filter((x) => x.type === "paires").length === 1 && revision.length === els.length + 1, revision.map((x) => x.type));
ok("mots bien installés : exercices exigeants", revision.every((x) => ["ecriture", "trou", "ecoute", "paires"].includes(x.type)));
const qcms = premiere.filter((x) => x.type === "qcm");
ok("chaque choix multiple contient la bonne réponse une seule fois", qcms.every((x) => x.type === "qcm" && x.choix.filter((ch) => ch === x.bonne).length === 1 && x.choix.length === 4));
const rien = composerSeance({ elements: els, cartes: new Map([...cartes].map(([k, v]) => [k, { ...v, echeance: t0 + 5 * JOUR }])), maintenant: t0, alea });
ok("rien à réviser et pas de nouveau mot : séance vide", rien.length === 0);
const libre = composerSeance({ elements: els, cartes: new Map([...cartes].map(([k, v]) => [k, { ...v, echeance: t0 + 5 * JOUR }])), maintenant: t0, alea, libre: true });
ok("révision libre : on peut s'entraîner même sans échéance", libre.length > 0);

// ---------------------------------------------------------------- contenu des thèmes
ok("52 thèmes, chacun d'au moins 40 mots", THEMES.length === 52 && THEMES.every((t) => t.entrees.length >= 40), THEMES.map((t) => `${t.id}:${t.entrees.length}`));
const ids = TOUTES_LES_ENTREES.map((x) => x.id);
ok("aucun identifiant en double", new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i));
ok("tous les champs remplis, prononciation entre barres obliques", TOUTES_LES_ENTREES.every((x) => x.en && x.fr && x.exEn && x.exFr && /^\/.+\/$/.test(x.api)));
ok("les six niveaux CECRL représentés", ["A1", "A2", "B1", "B2", "C1", "C2"].every((n) => TOUTES_LES_ENTREES.some((x) => x.niveau === n)));
const sansTrou = TOUTES_LES_ENTREES.filter((x) => !trouDans(x));
console.log(`   (texte à trous possible pour ${TOUTES_LES_ENTREES.length - sansTrou.length}/${TOUTES_LES_ENTREES.length} mots)`);
if (sansTrou.length) console.log("   sans trou :", sansTrou.map((x) => x.en).join(", "));
ok("le texte à trous est possible pour au moins 85 % des mots", sansTrou.length / TOUTES_LES_ENTREES.length < 0.15);

// ---------------------------------------------------------------- texte des PDF
const ph = decouperPhrases("Dr. Smith arrived. He said: \"Hello!\" Then he left. 3 apples were there.");
ok("phrases coupées aux points, majuscules et chiffres", ph.length >= 3 && ph.at(-1) === "3 apples were there.", ph);
const pg = decouperPage("First paragraph here. Second sentence.\n\nAnother paragraph.");
ok("paragraphes et phrases numérotés", pg.paragraphes.length === 2 && pg.phrases.length === 3 && pg.paragraphes[1][0] === 2, pg.paragraphes);
const long = decouperPage(Array.from({ length: 130 }, (_, i) => `w${i}`).join(" "));
ok("une phrase trop longue est coupée (analyse limitée à 90 mots)", long.phrases.every((p) => p.mots.length <= 60) && long.phrases.length === 3);
const lots = lotsDePassage(Array.from({ length: 60 }, (_, i) => `Sentence number ${i} is here.`).join(" "));
ok("passages en lots de 25 phrases au plus", lots.length === 3 && lots.every((l) => l.length <= 25), lots.map((l) => l.length));

// ---------------------------------------------------------------- dictionnaire
ok("identifiant stable malgré casse et ponctuation", idMot("Brother,") === idMot("brother") && idMot("to look after") === "perso:to-look-after");
ok("mot propre : ponctuation ôtée, majuscule de phrase baissée, sigle gardé", motPropre("“Travelled,") === "travelled" && motPropre("NASA.") === "NASA");
const mp = nouveauMot({ en: "travel", fr: "voyager", lemme: "travel", forme: "travelled", phrase: "We travelled far." }, { type: "manuel", titre: "x" }, 0);
ok("nouveau mot : identifiant tiré du lemme", mp.id === "perso:travel" && mp.forme === "travelled");
ok("export CSV avec BOM et guillemets", versCsv([{ ...mp, fr: "voyager; partir" }]).startsWith("\uFEFFanglais;") && versCsv([{ ...mp, fr: "voyager; partir" }]).includes('"voyager; partir"'));

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
