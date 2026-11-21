/* Tests des histoires du Truchement : chaque histoire est complète, chaque mot a sa glose, la bibliothèque est à jour. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { controlerHistoire } from "../scripts/langues/histoires/controle";
import type { Histoire } from "../src/lib/langues/histoires/catalogue";
import { HISTOIRES } from "../src/lib/langues/histoires/catalogue";
import { cleMot, estMot, motsDe } from "../src/lib/langues/histoires/texte";
import { NIVEAUX } from "../src/lib/langues/types";

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
console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
