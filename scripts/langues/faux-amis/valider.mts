/* Contrôle la liste des faux amis : npx tsx scripts/langues/faux-amis/valider.mts */
import { readFileSync } from "node:fs";

const NIVEAUX = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CHAMPS = ["en", "piege", "sens", "traduirePiege", "exEn", "exFr", "note", "niveau"] as const;
let liste: Record<string, unknown>[] = [];
const p: string[] = [];
try {
  liste = JSON.parse(readFileSync("src/lib/langues/faux-amis.json", "utf8"));
} catch (e) {
  p.push(`JSON illisible : ${(e as Error).message}`);
}
if (!Array.isArray(liste)) p.push("le fichier doit être un tableau");
else {
  if (liste.length < 120 || liste.length > 160) p.push(`${liste.length} entrées (attendu de 120 à 160)`);
  const vus = new Set<string>();
  liste.forEach((x, k) => {
    const ou = `#${k + 1} ${String(x.en ?? "?")}`;
    for (const c of CHAMPS) if (typeof x[c] !== "string" || !(x[c] as string).trim()) p.push(`${ou} : « ${c} » manquant`);
    for (const c of Object.keys(x)) if (!(CHAMPS as readonly string[]).includes(c)) p.push(`${ou} : champ inconnu « ${c} »`);
    if (!NIVEAUX.includes(String(x.niveau))) p.push(`${ou} : niveau inconnu`);
    const cle = String(x.en ?? "").toLowerCase().trim();
    if (vus.has(cle)) p.push(`${ou} : doublon`);
    vus.add(cle);
    const nu = cle.replace(/^to /, "");
    if (typeof x.exEn === "string" && !x.exEn.toLowerCase().includes(nu.slice(0, Math.max(3, nu.length - 3)))) p.push(`${ou} : l'exemple anglais n'emploie pas le mot`);
    for (const c of ["sens", "traduirePiege"]) if (typeof x[c] === "string" && (x[c] as string).length > 60) p.push(`${ou} : « ${c} » trop long`);
  });
}
console.log(p.slice(0, 60).join("\n"));
console.log(`${Array.isArray(liste) ? liste.length : 0} faux amis, ${p.length} problème(s)`);
process.exit(p.length ? 1 : 0);
