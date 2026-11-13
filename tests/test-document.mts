// Vérifie le nettoyage des documents (protection contre l'injection) et le contrôle qualité.
// Lancer : npm run test:document
import { controlerDocument, nettoyerDocument, texteDuDocument } from "../src/lib/document-schema.ts";

let echecs = 0;
const ok = (nom: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "OK   " : "ECHEC"} ${nom} ${cond ? "" : extra}`);
  if (!cond) echecs++;
};
const json = (x: unknown) => JSON.stringify(x);

const piege = {
  type: "doc",
  content: [
    { type: "script", content: [{ type: "text", text: "alert(1)" }] },
    { type: "paragraph", attrs: { textAlign: "center", onclick: "alert(1)", style: "x" }, content: [
      { type: "text", text: "lien piégé", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
      { type: "text", text: "lien data", marks: [{ type: "link", attrs: { href: "data:text/html,<script>alert(1)</script>" } }] },
      { type: "text", text: "lien correct", marks: [{ type: "link", attrs: { href: "https://example.org/page", onmouseover: "x" } }] },
      { type: "text", text: "fluo", marks: [{ type: "surligne", attrs: { couleur: "red;background:url(x)" } }] },
      { type: "text", text: "inconnu", marks: [{ type: "iframe" }] },
      { type: "text", text: "<img src=x onerror=alert(1)>" },
    ] },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Titre" }] },
    { type: "hadith", attrs: { degre: "inventé", recueil: "Bukhari" } },
    { type: "source", attrs: { auteur: "A", ouvrage: "B", lien: "javascript:alert(1)" } },
    { type: "encadre", attrs: { type: "<script>" }, content: [{ type: "paragraph" }] },
  ],
};
const propre = nettoyerDocument(piege);
const s = json(propre);

ok("type inconnu (script) retiré", !s.includes("script\"") && !s.includes("alert(1)\"}]},{"));
ok("attributs inconnus (onclick, style) retirés", !s.includes("onclick") && !s.includes("style"));
ok("lien javascript: retiré", !s.includes("javascript:"));
ok("lien data: retiré", !s.includes("data:text"));
ok("lien https conservé, attribut inconnu retiré", s.includes("https://example.org/page") && !s.includes("onmouseover"));
ok("couleur de surligneur invalide remplacée", s.includes('"couleur":"jaune"') && !s.includes("url(x)"));
ok("marque inconnue retirée", !s.includes("iframe"));
ok("le texte reste du texte (jamais interprété)", s.includes("<img src=x onerror=alert(1)>"));
ok("niveau de titre 1 ramené à 2 (le titre de l'article est le seul niveau 1)", s.includes('"level":2'));
ok("degré de hadith inventé remplacé par « non précisé »", s.includes('"degre":""'));
ok("type d'encadré invalide remplacé", s.includes('"type":"point-cle"'));

// Document très profond (tentative de saturation)
let profond: Record<string, unknown> = { type: "paragraph" };
for (let i = 0; i < 500; i++) profond = { type: "blockquote", content: [profond] };
const tronque = json(nettoyerDocument({ type: "doc", content: [profond] }));
ok("profondeur limitée", (tronque.match(/blockquote/g) ?? []).length <= 40);

// Texte brut
const doc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Bonjour" }, { type: "note", attrs: { texte: "une note" } }] },
    { type: "verset", attrs: { reference: "2:255" }, content: [
      { type: "versetArabe", content: [{ type: "text", text: "نص" }] },
      { type: "versetTraduction", content: [{ type: "text", text: "Traduction" }] },
    ] },
  ],
};
const t = texteDuDocument(doc);
ok("texte brut : paragraphe, note, référence, arabe et traduction", ["Bonjour", "une note", "Coran, 2:255", "نص", "Traduction"].every((x) => t.includes(x)), t);

// Contrôle qualité
const alertes = controlerDocument({
  type: "doc",
  content: [
    { type: "verset", attrs: { reference: "" }, content: [{ type: "versetArabe" }, { type: "versetTraduction" }] },
    { type: "hadith", attrs: { degre: "" }, content: [{ type: "hadithArabe" }, { type: "hadithTraduction", content: [{ type: "text", text: "x" }] }] },
  ],
}).map((a) => a.cle);
ok("contrôle qualité : verset sans traduction ni référence, hadith sans degré ni recueil, aucune source",
  ["verset-traduction", "verset-reference", "hadith-degre", "hadith-recueil", "sans-source"].every((c) => alertes.includes(c)) && !alertes.includes("hadith-traduction"),
  alertes.join(","));

console.log(echecs === 0 ? "\nTous les tests du format des documents passent." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
