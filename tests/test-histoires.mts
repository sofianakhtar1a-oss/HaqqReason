/* Tests des histoires du Truchement : chaque histoire est complète, chaque mot a sa glose, la bibliothèque est à jour. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { controlerHistoire } from "../scripts/langues/histoires/controle";
import type { Histoire } from "../src/lib/langues/histoires/catalogue";
import { HISTOIRES } from "../src/lib/langues/histoires/catalogue";
import { cleMot, estMot, motsDe } from "../src/lib/langues/histoires/texte";
import { NIVEAUX } from "../src/lib/langues/types";
import { composerQuiz, FAUX_AMIS, formeDans } from "../src/lib/langues/faux-amis";
import { controlerExercice } from "../scripts/langues/entrainement/controle";
import { controlerNiveau, type FichierDictees, NOMBRE_DICTEES, PHRASES_PAR_DICTEE } from "../scripts/langues/dictees/controle";
import { differences } from "../src/lib/regles/verifier";

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

ok("au moins 12 histoires", HISTOIRES.length >= 12, HISTOIRES.length);
for (const n of NIVEAUX) ok(`au moins deux histoires de niveau ${n}`, HISTOIRES.filter((h) => h.niveau === n).length >= 2);
for (const n of NIVEAUX) ok(`au moins dix histoires de niveau ${n}`, HISTOIRES.filter((h) => h.niveau === n).length >= 10, HISTOIRES.filter((h) => h.niveau === n).length);
ok("identifiants uniques", new Set(HISTOIRES.map((h) => h.id)).size === HISTOIRES.length);
let mots = 0;
let pages = 0;
for (const fiche of HISTOIRES) {
  const { problemes } = controlerHistoire(fiche.id);
  ok(`${fiche.id} : la source passe le contrôle`, problemes.length === 0, problemes.slice(0, 3));
  const texte = readFileSync(`public/langues/histoires/${fiche.id}.json`, "utf8");
  ok(`${fiche.id} : la bibliothèque connaît la dernière version`, createHash("sha1").update(texte).digest("hex").slice(0, 10) === fiche.version);
  const h = JSON.parse(texte) as Histoire;
  ok(`${fiche.id} : au moins 10 pages`, h.pages.length >= 10, h.pages.length);
  ok(`${fiche.id} : la fiche annonce le bon nombre de pages`, fiche.pages === h.pages.length);
  ok(`${fiche.id} : des questions de compréhension`, h.questions.length >= 6);
  let sans = 0;
  for (const page of h.pages)
    for (const para of page.p)
      for (const [en, fr, g] of para) {
        const toks = motsDe(en);
        ok(`${fiche.id} : une glose par mot`, toks.length === g.length, en);
        ok(`${fiche.id} : une traduction`, fr.trim().length > 0, en);
        toks.forEach((t, i) => {
          if (estMot(t) && (g[i] === null || !h.gloses[g[i] as number])) sans++;
          if (estMot(t) && cleMot(t).length === 0) sans++;
        });
        mots += toks.filter(estMot).length;
      }
  ok(`${fiche.id} : chaque mot se traduit`, sans === 0, sans);
  for (const page of h.pages) for (const k of page.m) ok(`${fiche.id} : mot clé connu`, Boolean(h.gloses[k]));
  pages += h.pages.length;
}
vu(`${HISTOIRES.length} histoires, ${pages} pages, ${mots} mots, chacun traduit d'avance`);
// Les dictées numérotées : 20 par niveau, de 8 phrases, contrôlées, et rangées dans le site telles quelles.
let nDictees = 0;
for (const n of NIVEAUX) {
  const { problemes } = controlerNiveau(n);
  ok(`dictées ${n} : la source passe le contrôle`, problemes.length === 0, problemes.slice(0, 3));
  const source = JSON.parse(readFileSync(`scripts/langues/dictees/sortie/${n}.json`, "utf8")) as FichierDictees;
  const site = JSON.parse(readFileSync(`src/lib/langues/dictees/${n}.json`, "utf8")) as { n: number; titre: string; piege: string; phrases: [string, string][] }[];
  ok(`dictées ${n} : ${NOMBRE_DICTEES} dictées numérotées de 1 à ${NOMBRE_DICTEES}`, site.length === NOMBRE_DICTEES && site.every((d, k) => d.n === k + 1), site.map((d) => d.n));
  for (const d of site) {
    ok(`dictée ${n} n° ${d.n} : ${PHRASES_PAR_DICTEE} phrases traduites`, d.phrases.length === PHRASES_PAR_DICTEE && d.phrases.every(([en, fr]) => en.trim() && fr.trim()));
    ok(`dictée ${n} n° ${d.n} : un titre et un piège`, d.titre.trim().length > 0 && d.piege.trim().length > 0);
    // Une phrase recopiée telle quelle est toujours juste à la correction.
    for (const [en] of d.phrases) ok(`dictée ${n} n° ${d.n} : la phrase exacte est juste`, differences(en, en).every((m) => m.etat === "pareil"), en);
    const s = source.dictees.find((x) => x.n === d.n);
    ok(`dictée ${n} n° ${d.n} : le site a la dernière version`, Boolean(s) && s!.titre.trim() === d.titre && s!.piege.trim() === d.piege && s!.phrases.every((ph, k) => ph.en.trim() === d.phrases[k]?.[0] && ph.fr.trim() === d.phrases[k]?.[1]));
  }
  nDictees += site.length;
}
vu(`${nDictees} dictées numérotées, ${NOMBRE_DICTEES} par niveau`);
// Les faux amis : une liste complète, et des quiz toujours jouables.
ok("au moins 120 faux amis", FAUX_AMIS.length >= 120, FAUX_AMIS.length);
ok("faux amis sans doublon", new Set(FAUX_AMIS.map((f) => f.en.toLowerCase())).size === FAUX_AMIS.length);
let alea = 1;
const graine = () => ((alea = (alea * 16807) % 2147483647) / 2147483647);
for (let tour = 0; tour < 40; tour++)
  for (const { exercice } of composerQuiz(FAUX_AMIS, 12, graine)) {
    const p = controlerExercice(exercice, "faux amis");
    ok("question de faux ami jouable", p.length === 0, { p, exercice });
  }
ok("la plupart des exemples contiennent le mot", FAUX_AMIS.filter((f) => formeDans(f)).length >= FAUX_AMIS.length * 0.8, FAUX_AMIS.filter((f) => !formeDans(f)).map((f) => f.en));
vu(`${FAUX_AMIS.length} faux amis et leurs quiz`);

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
