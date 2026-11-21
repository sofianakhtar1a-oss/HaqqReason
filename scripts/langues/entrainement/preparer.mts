/*
 * Prépare les lots de l'entraînement : pour chaque leçon, ce qu'elle enseigne (titre, notion,
 * explication, pièges) et les questions du défi déjà posées, pour que les nouveaux exercices
 * restent fidèles au cours sans répéter le défi.
 *   npx tsx scripts/langues/entrainement/preparer.mts
 */
import { writeFileSync } from "node:fs";
import { chargerCours } from "../../../src/lib/regles/cours/index";
import { SECTIONS } from "../../../src/lib/regles/index";
import type { Lecon, Section } from "../../../src/lib/regles/types";

const sansCouleurs = (s: string) => s.replace(/\[[a-z]:([^\]]*)\]/g, "$1");
const TAILLE_LOT = 9;

async function resume(section: Section, l: Lecon) {
  const c = await chargerCours(section.id, l);
  return {
    id: l.id,
    niveau: l.niveau,
    titre: l.titre,
    notion: l.notion,
    image: l.declic.image,
    demo: l.demo.etapes.map((e) => sansCouleurs(e.p)),
    regle: c?.regle ?? "",
    formes: c?.forme?.map((f) => `${f.nom} : ${f.modele} — ${sansCouleurs(f.exemple)}`) ?? [],
    usages: c?.usages?.map((u) => `${u.quand} : ${sansCouleurs(u.en)} (${u.fr})`) ?? [],
    pieges: c?.pieges?.map((p) => `faux « ${sansCouleurs(p.faux)} » → juste « ${sansCouleurs(p.juste)} » : ${p.pourquoi}`) ?? [],
    retenir: c?.retenir ?? "",
    secret: l.secret.texte,
    defi_deja_pose: l.defi.map((q) => ("p" in q ? `${q.q} ${q.p}` : q.q)),
  };
}

const lots: { lot: string; section: string; lecons: number }[] = [];
for (const s of SECTIONS) {
  const parNiveau = new Map<string, Lecon[]>();
  for (const l of s.lecons) parNiveau.set(l.niveau, [...(parNiveau.get(l.niveau) ?? []), l]);
  for (const [niveau, lecons] of parNiveau) {
    const n = Math.ceil(lecons.length / TAILLE_LOT);
    const taille = Math.ceil(lecons.length / n);
    for (let k = 0; k < n; k++) {
      const part = lecons.slice(k * taille, (k + 1) * taille);
      const nom = `${s.id}-${niveau.toLowerCase()}${n > 1 ? String.fromCharCode(97 + k) : ""}`;
      const contenu = { section: s.id, niveau, univers: s.univers, lecons: await Promise.all(part.map((l) => resume(s, l))) };
      writeFileSync(`scripts/langues/entrainement/entree/${nom}.json`, JSON.stringify(contenu, null, 1));
      lots.push({ lot: nom, section: s.id, lecons: part.length });
    }
  }
}
console.log(lots.map((l) => `${l.lot} (${l.lecons})`).join("\n"));
console.log(`${lots.length} lots`);
