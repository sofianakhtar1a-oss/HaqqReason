/* Tests des leçons des Règles (conjugaison et grammaire) : chaque leçon est complète, bien placée et jouable. */
import { CONJUGAISON_PLUS } from "../src/lib/regles/conjugaison-plus";
import { fichiersDe, palierDe } from "../src/lib/regles/cours/index";
import { fichiersEntrainement } from "../src/lib/regles/entrainement/index";
import { lireRef, refExercice } from "../src/lib/regles/suivi";
import { bonneReponse, differences, normaliser, ordreJuste, phraseOrdre, verdictEcrit } from "../src/lib/regles/verifier";
import { controlerExercice, MINIMUM } from "../scripts/langues/entrainement/controle";
import { TEMPS } from "../src/lib/regles/conjugueur";
import { GRAMMAIRE_PLUS } from "../src/lib/regles/grammaire-plus";
import { SECTIONS } from "../src/lib/regles/index";
import { type Code, estChoix, estEcrire, LEGENDE_DEFAUT, NIVEAUX } from "../src/lib/regles/types";
import { IRREGULIERS } from "../src/lib/regles/verbes-a";
import { REGULIERS } from "../src/lib/regles/verbes-b";

let e = 0;
const ok = (nom: string, cond: boolean, detail?: unknown) => {
  if (!cond) {
    e++;
    console.log(`ÉCHEC ${nom}`);
    if (detail !== undefined) console.log("   ", JSON.stringify(detail).slice(0, 400));
  }
  return cond;
};
const vu = (nom: string) => console.log(`OK ${nom}`);

const CODES = new Set(Object.keys(LEGENDE_DEFAUT) as Code[]);
const VERBES = new Set([...IRREGULIERS.split("\n").map((l) => l.trim().split(" ")[0]), ...REGULIERS.split(/\s+/)].filter(Boolean));
const TEMPS_IDS = new Set(TEMPS.map((t) => t.id));

/** Les [code:texte] d'une phrase colorée, et ce qui reste de crochets mal fermés. */
function verifierPhrase(p: string, ou: string) {
  const codes = [...p.matchAll(/\[([a-z]):([^\]]*)\]/g)];
  for (const m of codes) ok(`${ou} : couleur « ${m[1]} » connue`, CODES.has(m[1] as Code), p);
  for (const m of codes) ok(`${ou} : morceau coloré non vide`, m[2].trim().length > 0, p);
  const reste = p.replace(/\[([a-z]):([^\]]*)\]/g, "");
  ok(`${ou} : crochets bien formés`, !/[[\]]/.test(reste), p);
}

for (const section of SECTIONS) {
  const ids = section.lecons.map((l) => l.id);
  ok(`${section.id} : identifiants uniques`, new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i));
  // Le parcours reste dans l'ordre des niveaux (A1 avant A2…), pour que « la prochaine leçon » soit la bonne.
  const rangs = section.lecons.map((l) => NIVEAUX.indexOf(l.niveau));
  ok(`${section.id} : parcours dans l'ordre A1 → C2`, rangs.every((r, i) => i === 0 || r >= rangs[i - 1]), section.lecons.map((l) => `${l.niveau}:${l.id}`));

  for (const l of section.lecons) {
    const ou = `${section.id}/${l.id}`;
    ok(`${ou} : titre, notion, héros`, !!(l.titre.trim() && l.notion.trim() && l.heros.trim()));
    ok(`${ou} : le déclic est complet`, !!(l.declic.scene.trim() && l.declic.image.trim() && l.declic.sens.trim()));
    ok(`${ou} : au moins trois étapes de démonstration`, l.demo.etapes.length >= 3, l.demo.etapes.length);
    for (const et of l.demo.etapes) {
      verifierPhrase(et.p, ou);
      ok(`${ou} : chaque étape est expliquée`, et.n.trim().length > 0, et);
    }
    if (l.demo.machine) {
      for (const t of l.demo.machine.temps) ok(`${ou} : temps de la Machine connu (${t})`, TEMPS_IDS.has(t));
      for (const v of l.demo.machine.verbes) ok(`${ou} : verbe de la Machine connu (${v})`, VERBES.has(v));
    }
    ok(`${ou} : au moins cinq questions`, l.defi.length >= 5, l.defi.length);
    for (const q of l.defi) {
      ok(`${ou} : énoncé, indice et explication`, !!(q.q.trim() && q.i.trim() && q.e.trim()), q);
      if (estChoix(q)) {
        ok(`${ou} : au moins deux choix, tous différents`, q.o.length >= 2 && new Set(q.o).size === q.o.length, q);
        for (const cle of Object.keys(q.io ?? {})) ok(`${ou} : la remarque vise un mauvais choix existant`, q.o.includes(cle) && cle !== q.o[0], { cle, q });
      } else if (estEcrire(q)) {
        ok(`${ou} : au moins une réponse acceptée`, q.r.length > 0 && q.r.every((r) => r.trim().length > 0), q);
      } else {
        const mots = q.p.split(/\s+/);
        ok(`${ou} : au moins un mot à toucher`, mots.some((m) => m.startsWith("*") && m.length > 1), q);
      }
    }
    ok(`${ou} : le secret est complet`, !!(l.secret.titre.trim() && l.secret.texte.trim()));
  }
}
vu("toutes les leçons sont complètes et jouables");

// Les leçons ajoutées : chacune trouve sa place, au bon niveau.
for (const [nom, ajouts, section] of [
  ["conjugaison", CONJUGAISON_PLUS, SECTIONS[0]],
  ["grammaire", GRAMMAIRE_PLUS, SECTIONS[1]],
] as const) {
  for (const { apres, lecon } of ajouts) {
    const i = section.lecons.findIndex((l) => l.id === apres);
    ok(`${nom} : la leçon « ${lecon.id} » s'accroche à « ${apres} »`, i >= 0);
    if (i >= 0) ok(`${nom} : « ${lecon.id} » est au même niveau que « ${apres} »`, section.lecons[i].niveau === lecon.niveau, [section.lecons[i].niveau, lecon.niveau]);
    ok(`${nom} : « ${lecon.id} » est bien dans le parcours`, section.lecons.includes(lecon));
  }
  vu(`${nom} : ${ajouts.length} leçons ajoutées, chacune à sa place`);
}
console.log(`Parcours : ${SECTIONS.map((s) => `${s.nom} ${s.lecons.length} leçons`).join(", ")}`);

// L'explication en français : chaque leçon a la sienne, complète, dans le fichier de son palier.
/** Accolades {anglais} bien fermées, et pas de crochets de couleur dans un texte français. */
function verifierTexte(t: string, ou: string) {
  ok(`${ou} : texte non vide`, t.trim().length > 0, t);
  const reste = t.replace(/\{[^{}]+\}/g, "");
  ok(`${ou} : accolades bien formées`, !/[{}]/.test(reste), t);
  ok(`${ou} : pas de couleurs dans le français`, !/\[[a-z]:/.test(t), t);
}
let explications = 0;
for (const section of SECTIONS) {
  const fichiers = fichiersDe(section.id);
  const charges = {
    a: (await fichiers.a()).COURS,
    b: (await fichiers.b()).COURS,
    c: (await fichiers.c()).COURS,
  };
  const ids = new Set(section.lecons.map((l) => l.id));
  for (const [palier, cours] of Object.entries(charges)) {
    for (const id of Object.keys(cours)) {
      const l = section.lecons.find((x) => x.id === id);
      ok(`${section.id} : l'explication « ${id} » correspond à une leçon`, ids.has(id));
      if (l) ok(`${section.id} : l'explication « ${id} » est dans le bon palier`, palierDe(l.niveau) === palier, [l.niveau, palier]);
    }
  }
  for (const l of section.lecons) {
    const ou = `${section.id}/${l.id} (explication)`;
    const c = charges[palierDe(l.niveau)][l.id];
    if (!ok(`${ou} : présente`, Boolean(c))) continue;
    explications++;
    verifierTexte(c.regle, `${ou} règle`);
    ok(`${ou} : une vraie explication (au moins 180 caractères)`, c.regle.length >= 180, c.regle.length);
    for (const f of c.forme ?? []) {
      verifierTexte(f.nom, `${ou} forme`);
      verifierTexte(f.modele, `${ou} forme`);
      verifierPhrase(f.exemple, `${ou} forme`);
      ok(`${ou} : exemple de forme`, f.exemple.trim().length > 0 && !/\[x:/.test(f.exemple), f);
    }
    ok(`${ou} : au moins deux emplois`, c.usages.length >= 2, c.usages.length);
    for (const u of c.usages) {
      verifierTexte(u.quand, `${ou} emploi`);
      verifierPhrase(u.en, `${ou} emploi`);
      ok(`${ou} : exemple et traduction`, !!(u.en.trim() && u.fr.trim()), u);
      ok(`${ou} : un exemple juste n'est pas marqué comme fautif`, !/\[x:/.test(u.en), u.en);
    }
    verifierTexte(c.francais, `${ou} français`);
    ok(`${ou} : au moins un piège`, c.pieges.length >= 1, c.pieges.length);
    for (const p of c.pieges) {
      verifierPhrase(p.faux, `${ou} piège`);
      verifierPhrase(p.juste, `${ou} piège`);
      verifierTexte(p.pourquoi, `${ou} piège`);
      ok(`${ou} : la phrase fautive montre où est l'erreur`, /\[x:/.test(p.faux), p.faux);
      ok(`${ou} : la bonne phrase n'est pas marquée comme fautive`, !/\[x:/.test(p.juste), p.juste);
      ok(`${ou} : la phrase fautive et la bonne diffèrent`, p.faux.replace(/\[[a-z]:([^\]]*)\]/g, "$1") !== p.juste.replace(/\[[a-z]:([^\]]*)\]/g, "$1"), p);
    }
    verifierTexte(c.retenir, `${ou} à retenir`);
  }
}
ok("une explication pour chaque leçon", explications === SECTIONS.reduce((n, s) => n + s.lecons.length, 0), explications);
vu(`${explications} explications en français, une par leçon`);

// L'entraînement : au moins vingt exercices corrigés par leçon, tous jouables.
let exercicesEntrainement = 0;
for (const section of SECTIONS) {
  const fichiers = fichiersEntrainement(section.id);
  for (const niveau of NIVEAUX) {
    const lot = await fichiers[niveau]();
    const ids = new Set(section.lecons.filter((l) => l.niveau === niveau).map((l) => l.id));
    for (const id of Object.keys(lot)) ok(`entraînement ${section.id}/${niveau} : « ${id} » est une leçon de ce niveau`, ids.has(id));
    for (const id of ids) {
      const ex = lot[id] ?? [];
      ok(`entraînement ${section.id}/${id} : au moins ${MINIMUM} exercices`, ex.length >= MINIMUM, ex.length);
      exercicesEntrainement += ex.length;
      ex.forEach((x, k) => {
        const p = controlerExercice(x, `${section.id}/${id}#${k + 1}`);
        ok(`entraînement ${section.id}/${id}#${k + 1} : exercice valide`, p.length === 0, p);
        ok(`entraînement ${section.id}/${id}#${k + 1} : la bonne réponse s'écrit`, bonneReponse(x).trim().length > 0, x);
      });
    }
  }
}
vu(`${exercicesEntrainement} exercices d'entraînement, au moins ${MINIMUM} par leçon`);

// La vérification des réponses : pardonne la forme, jamais la grammaire.
ok("contraction acceptée", verdictEcrit("She doesn't drink coffee.", ["She does not drink coffee"]) === "juste");
ok("casse et ponctuation pardonnées", verdictEcrit("  she DOESN'T drink coffee ", ["She doesn't drink coffee."]) === "juste");
ok("une lettre de trop : presque", verdictEcrit("She doesnt drinks coffee", ["She doesn't drink coffee"]) !== "juste");
ok("une seule lettre : presque", verdictEcrit("beatiful", ["beautiful"]) === "presque");
ok("faute de grammaire refusée", verdictEcrit("She don't drink coffee", ["She doesn't drink coffee"]) === "faux");
ok("ordre juste", ordreJuste(["does", "your", "sister", "speak", "Spanish"], ["does", "your", "sister", "speak", "Spanish"]));
ok("ordre variante", ordreJuste(["every", "day", "I", "walk"], ["I", "walk", "every", "day"], [["every", "day", "I", "walk"]]));
ok("ordre faux", !ordreJuste(["your", "does", "sister", "speak", "Spanish"], ["does", "your", "sister", "speak", "Spanish"]));
ok("phrase reconstituée", phraseOrdre(["does", "your", "sister", "speak", "Spanish"], "?") === "Does your sister speak Spanish?");
const diff = differences("My father don't work.", "My father doesn't work.");
ok("différences : le mot corrigé est repéré", diff.some((m) => m.etat === "manque" && m.mot === "doesn't") && diff.some((m) => m.etat === "trop" && m.mot === "don't"), diff);
ok("normaliser : guillemets ignorés", normaliser("« Hello »") === normaliser("Hello"));
const ref = refExercice("conjugaison", "verbe-voyageur", "e", 12);
ok("référence d'exercice relue", JSON.stringify(lireRef(ref)) === JSON.stringify({ section: "conjugaison", lecon: "verbe-voyageur", source: "e", rang: 12 }), lireRef(ref));
vu("vérification des réponses et références");

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
