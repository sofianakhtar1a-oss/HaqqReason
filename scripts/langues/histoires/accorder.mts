/*
 * Accorde les gloses d'adjectifs à la traduction de leur phrase. Quand le sens d'un adjectif
 * (« petit ») n'apparaît pas tel quel dans la traduction, mais qu'une seule forme accordée y figure
 * (« petite »), la glose de la phrase prend cette forme, avec le masculin singulier en sens de base.
 *
 *   npx tsx scripts/langues/histoires/accorder.mts <id>... [--ecrire]
 *
 * Sans --ecrire, le script montre seulement ce qu'il changerait.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { cleMot, estMot, motsDe } from "../../../src/lib/langues/histoires/texte";
import { DOSSIER, gloseDe, type GloseSource, lots, type LotSource } from "./controle";

const args = process.argv.slice(2);
const ecrire = args.includes("--ecrire");
const ids = args.filter((a) => !a.startsWith("--"));
if (!ids.length) {
  console.error("Usage : npx tsx scripts/langues/histoires/accorder.mts <id>... [--ecrire]");
  process.exit(1);
}

const IRREGULIERS: Record<string, string[]> = {
  beau: ["belle", "belles", "beaux", "bel"],
  nouveau: ["nouvelle", "nouvelles", "nouveaux", "nouvel"],
  vieux: ["vieille", "vieilles", "vieil"],
  fou: ["folle", "folles", "fous"],
  mou: ["molle", "molles", "mous"],
  doux: ["douce", "douces"],
  faux: ["fausse", "fausses"],
  roux: ["rousse", "rousses"],
  frais: ["fraîche", "fraîches"],
  sec: ["sèche", "sèches", "secs"],
  long: ["longue", "longues", "longs"],
  grec: ["grecque", "grecques", "grecs"],
  public: ["publique", "publiques", "publics"],
  favori: ["favorite", "favorites", "favoris"],
  malin: ["maligne", "malignes", "malins"],
  bénin: ["bénigne", "bénignes", "bénins"],
};

/** Les formes accordées d'un adjectif au masculin singulier. */
function formes(m: string): Set<string> {
  const f = new Set<string>([m]);
  const ajoute = (...xs: string[]) => xs.forEach((x) => f.add(x));
  if (IRREGULIERS[m]) ajoute(...IRREGULIERS[m]);
  if (m.endsWith("e")) ajoute(`${m}s`);
  else if (m.endsWith("eux")) ajoute(`${m.slice(0, -1)}se`, `${m.slice(0, -1)}ses`);
  else if (m.endsWith("x")) ajoute(`${m.slice(0, -1)}se`, `${m.slice(0, -1)}ses`);
  else if (m.endsWith("f")) ajoute(`${m.slice(0, -1)}ve`, `${m.slice(0, -1)}ves`, `${m}s`);
  else if (/(el|eil|en|on)$/.test(m)) ajoute(`${m}${m.slice(-1)}e`, `${m}${m.slice(-1)}es`, `${m}s`, `${m}e`, `${m}es`);
  else if (m.endsWith("il")) ajoute(`${m}le`, `${m}les`, `${m}e`, `${m}es`, `${m}s`);
  else if (m.endsWith("et")) ajoute(`${m}te`, `${m}tes`, `${m.slice(0, -2)}ète`, `${m.slice(0, -2)}ètes`, `${m}s`);
  else if (m.endsWith("er")) ajoute(`${m.slice(0, -2)}ère`, `${m.slice(0, -2)}ères`, `${m}s`);
  else if (m.endsWith("c")) ajoute(`${m.slice(0, -1)}che`, `${m.slice(0, -1)}ches`, `${m.slice(0, -1)}que`, `${m.slice(0, -1)}ques`, `${m}s`);
  else if (m.endsWith("s")) ajoute(`${m}se`, `${m}ses`, `${m}e`, `${m}es`);
  else if (m.endsWith("al")) ajoute(`${m.slice(0, -1)}ux`, `${m}e`, `${m}es`, `${m}s`);
  else if (m.endsWith("eau")) ajoute(`${m}x`);
  else if (m.endsWith("eur")) ajoute(`${m.slice(0, -1)}se`, `${m.slice(0, -1)}ses`, `${m}e`, `${m}es`, `${m}s`, `${m.slice(0, -3)}rice`, `${m.slice(0, -3)}rices`);
  else ajoute(`${m}e`, `${m}s`, `${m}es`);
  return f;
}

/** Les masculins singuliers possibles d'une forme donnée (« petites » → petit, petite, petites…). */
function masculins(a: string): string[] {
  const c = [a];
  const regles: [RegExp, string][] = [
    [/euses?$/, "eux"],
    [/ives?$/, "if"],
    [/elles?$/, "el"],
    [/ennes?$/, "en"],
    [/onnes?$/, "on"],
    [/ères?$/, "er"],
    [/ettes?$/, "et"],
    [/ètes?$/, "et"],
    [/ches?$/, "c"],
    [/gues?$/, "g"],
    [/sses?$/, "s"],
    [/illes?$/, "il"],
    [/aux$/, "al"],
    [/ales?$/, "al"],
    [/es$/, ""],
    [/s$/, ""],
    [/e$/, ""],
  ];
  for (const [r, fin] of regles) if (r.test(a)) c.push(a.replace(r, fin));
  for (const [m, fs] of Object.entries(IRREGULIERS)) if (fs.includes(a)) c.push(m);
  return [...new Set(c)];
}

const motsFrancais = (fr: string) =>
  fr
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);

let changements = 0;
for (const id of ids) {
  for (const f of lots(id)) {
    const chemin = `${DOSSIER}/sortie/${id}/${f}`;
    const lot = JSON.parse(readFileSync(chemin, "utf8")) as LotSource;
    let modifie = false;
    lot.pages.forEach((page, k) =>
      page.p.forEach((para) =>
        para.forEach((ph) => {
          const vus = new Map<string, number>();
          const fr = new Set(motsFrancais(ph.fr));
          const occurrences = motsDe(ph.en).filter(estMot).map(cleMot);
          for (const cle of occurrences) {
            const rang = (vus.get(cle) ?? 0) + 1;
            vus.set(cle, rang);
            const trouve = gloseDe(cle, rang, ph, lot.lexique);
            if (!trouve || trouve.ou === "outil") continue;
            const [sens, lemme, nature, base] = trouve.glose;
            if (nature !== "a" || /[()]/.test(sens)) continue;
            const variantes = sens
              .split(/\s*[,/]\s*/)
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean);
            if (!variantes.length || variantes.some((v) => /\s/.test(v))) continue;
            if (variantes.some((v) => fr.has(v))) continue;
            // Les formes accordées présentes dans la traduction, avec leur masculin.
            const accords = new Map<string, string>();
            for (const v of variantes)
              for (const m of masculins(v)) for (const x of formes(m)) if (fr.has(x) && !accords.has(x)) accords.set(x, m);
            if (accords.size !== 1) continue;
            const [forme, masculin] = [...accords][0];
            const nouvelle: GloseSource = [forme, lemme ?? cle, "a"];
            const sensDeBase = base?.trim() || masculin;
            if (sensDeBase && sensDeBase !== forme) nouvelle.push(sensDeBase);
            const g = (ph.g ??= {});
            // Une glose de phrase sans rang sert aussi aux occurrences suivantes : on les garde telles quelles.
            if (rang === 1 && occurrences.filter((o) => o === cle).length > 1)
              for (let r = 2; r <= occurrences.filter((o) => o === cle).length; r++) {
                const avant = gloseDe(cle, r, ph, lot.lexique);
                if (avant && !g[`${cle}#${r}`]) g[`${cle}#${r}`] = avant.glose;
              }
            g[rang > 1 ? `${cle}#${rang}` : cle] = nouvelle;
            console.log(`${id} p.${lot.debut + k} « ${cle} » : ${sens} → ${nouvelle[0]}${nouvelle[3] ? ` (${nouvelle[3]})` : ""}  |  ${ph.fr.slice(0, 80)}`);
            changements++;
            modifie = true;
          }
        }),
      ),
    );
    if (modifie && ecrire) writeFileSync(chemin, `${JSON.stringify(lot, null, 2)}\n`);
  }
}
console.log(`${changements} glose(s) d'adjectif ${ecrire ? "accordée(s)" : "à accorder (relance avec --ecrire)"}.`);
