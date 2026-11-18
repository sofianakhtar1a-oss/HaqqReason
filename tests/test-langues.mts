import { composerSeance, leurres, melanger, trouDans } from "../src/lib/langues/exercices";
import { apercuDelai, estDue, intervalle, maitrise, nouvelleCarte, rappel, reviser, serie } from "../src/lib/langues/srs";
import type { Carte, Element } from "../src/lib/langues/types";
import { normaliser, verifier } from "../src/lib/langues/verification";
import { THEMES, TOUTES_LES_ENTREES } from "../src/lib/langues/themes/index";
import { decouperPage, decouperPhrases, lotsDePassage } from "../src/lib/langues/texte";
import { idMot, motPropre, nouveauMot, versCsv } from "../src/lib/langues/dictionnaire";
import { ancres, avancee, horodaterTraduction, poidsMot } from "../src/lib/langues/karaoke";
import { avatarSur, BASES, bonusJour, evaluer, gain, lireReponse, multiplicateur, nomPublic, palier } from "../src/lib/langues/points";
import { elementDEntree } from "../src/lib/langues/dictionnaire";

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

// ---------------------------------------------------------------- Karaoké bilingue
const voix = { debut: 10, fin: 13, mots: [{ t: "I", d: 10.1, f: 10.2 }, { t: "love", d: 10.3, f: 10.7 }, { t: "big", d: 10.8, f: 11.1 }, { t: "houses.", d: 11.2, f: 12.4 }] };
const gl = [{ i: 1, sens: "aimer, adorer" }, { i: 2, sens: "grand" }, { i: 3, sens: "maisons" }];
ok("poids : une pause après le point, un petit mot pèse peu", poidsMot("houses.") > poidsMot("houses") && poidsMot("a") < poidsMot("big"));
ok("ancres : élision ignorée, accord et pluriel retrouvés", JSON.stringify(ancres(voix.mots, "J'adore les grandes maisons.".split(" "), gl)) === "[1,-1,2,3]");
const kt = horodaterTraduction(voix, "J'adore les grandes maisons.", gl);
ok("traduction : un horodatage par mot, de la voix réelle", kt.length === 4 && kt[0].d === 10.1 && kt[3].f === 12.4);
ok("traduction : les ancres calent les mots traduits sur leur mot d'origine", kt[2].d === 10.8 && kt[3].d === 11.2);
ok("traduction : le temps avance toujours", kt.every((m, i) => m.f >= m.d && (i === 0 || m.d >= kt[i - 1].d)));
const sansAnalyse = horodaterTraduction(voix, "Nous aimons beaucoup les très grandes maisons blanches.");
ok("sans analyse : partage selon les syllabes, couvre toute la voix", sansAnalyse.length === 8 && sansAnalyse[0].d === 10.1 && sansAnalyse[7].f === 12.4);
ok("traduction vide : aucun mot", horodaterTraduction(voix, "  ").length === 0);
ok("avancée dans le mot : bornée entre 0 et 1", avancee({ t: "x", d: 1, f: 2 }, 1.5) === 0.5 && avancee({ t: "x", d: 1, f: 2 }, 0) === 0 && avancee({ t: "x", d: 1, f: 2 }, 9) === 1);

// ---------------------------------------------------------------- Points du vocabulaire
const seuils = [0, 4, 5, 9, 10, 19, 20, 39, 40, 100].map(multiplicateur);
ok("paliers : mêmes multiplicateurs que la base (×1, ×1,5, ×2, ×2,5, ×3)", JSON.stringify(seuils) === JSON.stringify([1, 1, 1.5, 1.5, 2, 2, 2.5, 2.5, 3, 3]), seuils);
ok("palier : nom et prochain seuil", palier(0).prochain === 5 && palier(12).nom === "Flamme" && palier(40).prochain === null && palier(25).index === 3);
ok("gain : juste × série, presque = moitié (au-dessus), faux = 0", gain(10, "juste", 1) === 10 && gain(15, "juste", 5) === 23 && gain(15, "presque", 30) === 8 && gain(12, "faux", 50) === 0);
ok("bonus du jour : 5 × jours, 50 au plus", bonusJour(1) === 5 && bonusJour(4) === 20 && bonusJour(30) === 50 && bonusJour(-2) === 0);
const brother = TOUTES_LES_ENTREES.find((x) => x.id === "famille:brother") ?? TOUTES_LES_ENTREES[0];
const elB = elementDEntree(brother);
ok("évaluer : choix juste (vers le français)", evaluer({ mot: elB.id, exercice: "qcm", sens: "en-fr", reponse: elB.fr }, elB)?.resultat === "juste");
ok("évaluer : choix faux, et le sens compte", evaluer({ mot: elB.id, exercice: "qcm", sens: "fr-en", reponse: elB.fr }, elB)?.resultat === "faux" && evaluer({ mot: elB.id, exercice: "qcm", sens: "fr-en", reponse: elB.en }, elB)?.resultat === "juste");
ok("évaluer : écoute jugée sur le sens français", evaluer({ mot: elB.id, exercice: "ecoute", reponse: elB.fr }, elB)?.base === BASES.ecoute);
const avecTrou = TOUTES_LES_ENTREES.map(elementDEntree).find((x) => trouDans(x));
const motTrou = avecTrou ? trouDans(avecTrou)!.mot : "";
ok("évaluer : texte à trous jugé sur le mot de la phrase", Boolean(avecTrou) && evaluer({ mot: avecTrou!.id, exercice: "trou", reponse: motTrou.toUpperCase() }, avecTrou)?.resultat === "juste" && evaluer({ mot: avecTrou!.id, exercice: "trou", reponse: "zzz" }, avecTrou)?.resultat === "faux");
ok("évaluer : écrire, une petite faute = presque, plus d'un indice = presque", evaluer({ mot: elB.id, exercice: "ecriture", reponse: elB.en }, elB)?.resultat === "juste" && evaluer({ mot: elB.id, exercice: "ecriture", reponse: elB.en, indices: 2 }, elB)?.resultat === "presque");
ok("évaluer : un mot inconnu du serveur ne rapporte rien", evaluer({ mot: "perso:x", exercice: "qcm", reponse: "x" }, undefined) === null);
ok("évaluer : cartes et paires exigent un résultat", evaluer({ mot: elB.id, exercice: "carte" }, elB) === null && evaluer({ mot: elB.id, exercice: "paires", resultat: "juste" }, elB)?.base === BASES.paires);
ok("évaluer : l'identifiant compté est celui du serveur", evaluer({ mot: "faux-id", exercice: "qcm", sens: "en-fr", reponse: elB.fr }, elB)?.mot === elB.id);
const lue = lireReponse({ mot: "a:b", exercice: "ecriture", reponse: "x".repeat(900), indices: 1e9, base: 9999, points: 1e6 });
ok("réponse reçue : champs bornés, champs inconnus ignorés", lue !== null && lue.reponse!.length === 300 && lue.indices === 50 && !("base" in lue) && !("points" in lue));
ok("réponse reçue : exercice inconnu refusé", lireReponse({ mot: "a", exercice: "bonus" }) === null && lireReponse(null) === null && lireReponse({ exercice: "qcm" }) === null);
ok("nom public : prénom et initiale", nomPublic("Yasmine  Benali") === "Yasmine B." && nomPublic("Karim") === "Karim" && nomPublic("  ") === "Apprenant" && nomPublic("Jean Pierre de la Fontaine") === "Jean F.");
ok("photo : seulement les serveurs de photos Google", avatarSur("https://lh3.googleusercontent.com/a/ACg8oc-x=s96-c") !== "" && avatarSur("https://evil.example/x.png") === "" && avatarSur("javascript:alert(1)") === "" && avatarSur(42) === "");

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
