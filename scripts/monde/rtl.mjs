// Produit les règles « de droite à gauche » du Portulan : seules les déclarations que rtlcss
// retourne (left ↔ right, marges, alignements), sous html[dir="rtl"].
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import rtlcss from "rtlcss";
const [entree, sortie] = process.argv.slice(2);
const source = readFileSync(entree, "utf8");
const a = postcss.parse(source);
const b = postcss.parse(rtlcss.process(source));
const regles = (r) => { const l = []; r.walkRules((x) => { if (x.parent?.type === "atrule" && /keyframes/.test(x.parent.name)) return; l.push(x); }); return l; };
const ra = regles(a), rb = regles(b);
if (ra.length !== rb.length) throw new Error(`structures différentes : ${ra.length} / ${rb.length}`);
const prefixer = (sel) => sel.split(",").map((s) => {
  s = s.trim();
  if (/^html\b/.test(s)) return s.replace(/^html/, 'html[dir="rtl"]');
  if (/^\[data-theme/.test(s)) return `html[dir="rtl"]${s}`;
  if (/^:root\b/.test(s)) return s.replace(/^:root/, 'html[dir="rtl"]');
  return `html[dir="rtl"] ${s}`;
}).join(",\n");
const blocs = new Map();
let n = 0;
for (let i = 0; i < ra.length; i++) {
  const net = (v) => v.replace(/\s+/g, " ").trim();
  const da = new Map(); ra[i].each((d) => d.type === "decl" && !d.prop.startsWith("--") && da.set(d.prop, net(d.value)));
  const diff = [];
  rb[i].each((d) => { if (d.type === "decl" && !d.prop.startsWith("--") && da.get(d.prop) !== net(d.value)) diff.push(`  ${d.prop}: ${net(d.value)}${d.important ? " !important" : ""};`); });
  // Une propriété retournée en son contraire (left → right) : l'ancienne doit être annulée.
  const db = new Map(); rb[i].each((d) => d.type === "decl" && !d.prop.startsWith("--") && db.set(d.prop, net(d.value)));
  for (const [p] of da) if (!db.has(p)) diff.push(`  ${p}: ${/^(left|right|margin|padding|border)/.test(p) ? (/^(margin|padding)/.test(p) ? "0" : /^border/.test(p) ? "0" : "auto") : "initial"};`);
  if (!diff.length) continue;
  const contexte = [];
  for (let p = ra[i].parent; p && p.type === "atrule"; p = p.parent) contexte.unshift(`@${p.name} ${p.params}`);
  const cle = contexte.join(" | ");
  blocs.set(cle, [...(blocs.get(cle) ?? []), `${prefixer(ra[i].selector)} {\n${diff.join("\n")}\n}`]);
  n++;
}
let css = "/* Fichier produit par scripts/monde/rtl.mjs (rtlcss) : le Portulan de droite à gauche, pour l'arabe. Ne pas modifier à la main. */\n";
for (const [cle, regles] of blocs) {
  if (!cle) css += regles.join("\n") + "\n";
  else {
    const ouvertures = cle.split(" | ");
    css += ouvertures.map((o) => `${o} {`).join("\n") + "\n" + regles.join("\n") + "\n" + ouvertures.map(() => "}").join("\n") + "\n";
  }
}
writeFileSync(sortie, css);
console.log(`${n} règles retournées`);
