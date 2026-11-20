// Le Calame : recherche, aides à la frappe, sens d'écriture, relecture, comparaison, modèle.
// Lancer : npm run test:calame
import { getSchema } from "@tiptap/core";
import { Node as NoeudPM } from "@tiptap/pm/model";
import { extensionsDocument } from "../src/lib/editeur/extensions";
import { adapterCasse, chercher, extraits, plierTexte } from "../src/lib/atelier/recherche-texte";
import { transformer, FINE, INSECABLE } from "../src/app/ecrire/extensions/saisie";
import { commenceEnArabe } from "../src/app/ecrire/extensions/sens";
import { analyser, lisibilite, motsFrequents, phrases, syllabes } from "../src/lib/atelier/analyse-texte";
import { bilanDiff, comparerParagraphes, diffMots, editions } from "../src/lib/atelier/diff";
import { corbeilleExpiree, nettoyerExtras } from "../src/lib/atelier/modele";
import { nettoyerPreferences } from "../src/lib/atelier/preferences";

let echecs = 0;
const ok = (nom: string, cond: boolean, detail = "") => {
  if (!cond) {
    echecs++;
    console.log(`ECHEC ${nom}${detail ? ` — ${detail}` : ""}`);
  }
};

const schema = getSchema(extensionsDocument());
const doc = (...paragraphes: string[]) =>
  NoeudPM.fromJSON(schema, { type: "doc", content: paragraphes.map((t) => ({ type: "paragraph", content: t ? [{ type: "text", text: t }] : [] })) });

/* ---------- Rechercher ---------- */
{
  const d = doc("L'Étoile du matin brille.", "Une étoile, deux étoiles.", "Le Coran dit : الحمد لله");
  const sansAccents = chercher(d, "etoile", { casse: false, accents: false, motEntier: false });
  ok("recherche : sans accents ni casse, 3 étoiles", sansAccents.length === 3, String(sansAccents.length));
  ok("recherche : positions exactes", d.textBetween(sansAccents[0].from, sansAccents[0].to) === "Étoile", d.textBetween(sansAccents[0].from, sansAccents[0].to));
  ok("recherche : avec accents, « etoile » ne trouve rien", chercher(d, "etoile", { casse: false, accents: true, motEntier: false }).length === 0);
  ok("recherche : avec la casse, « Étoile » une seule fois", chercher(d, "Étoile", { casse: true, accents: true, motEntier: false }).length === 1);
  ok("recherche : mot entier, « étoile » sans « étoiles »", chercher(d, "étoile", { casse: false, accents: true, motEntier: true }).length === 2);
  ok("recherche : l'arabe sans voyelles", chercher(doc("الْحَمْدُ لِلَّهِ"), "الحمد", { casse: false, accents: false, motEntier: false }).length === 1);
  ok("recherche : requête vide", chercher(d, "", { casse: false, accents: false, motEntier: false }).length === 0);
  ok("recherche : œ = oe", plierTexte("Œuvre", { casse: false, accents: false, motEntier: false }) === "oeuvre");
  ok("remplacement : majuscule initiale gardée", adapterCasse("Dieu", "allah", { casse: false, accents: false, motEntier: false }) === "Allah");
  ok("remplacement : tout en capitales", adapterCasse("DIEU", "allah", { casse: false, accents: false, motEntier: false }) === "ALLAH");
  const e = extraits({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Le calame écrit. Le Calame est un roseau taillé." }] }] }, "calame");
  ok("extraits : deux passages", e.total === 2 && e.extraits[0].trouve === "calame", JSON.stringify(e));
}

/* ---------- Typographie et formules ---------- */
{
  const o = { typographie: true, translit: false };
  ok("typo : espace fine avant ?", JSON.stringify(transformer("Bonjour", "?", o)) === JSON.stringify({ retirer: 0, inserer: FINE + "?" }));
  ok("typo : espace remplacée avant !", JSON.stringify(transformer("Bonjour ", "!", o)) === JSON.stringify({ retirer: 1, inserer: FINE + "!" }));
  ok("typo : deux-points", transformer("Remarque", ":", o)?.inserer === INSECABLE + ":");
  ok("typo : pas dans une heure", transformer("12", ":", o) === null);
  ok("typo : pas dans une adresse", transformer("voir https", ":", o) === null && transformer("https://site.fr/page", "?", o) === null);
  ok("typo : guillemet ouvrant", transformer("il dit ", '"', o)?.inserer === `«${INSECABLE}`);
  ok("typo : guillemet fermant", transformer("il dit « bonjour", '"', o)?.inserer === `${INSECABLE}»`);
  ok("typo : apostrophe", transformer("l", "'", o)?.inserer === "’");
  ok("typo : points de suspension", JSON.stringify(transformer("Et..", ".", o)) === JSON.stringify({ retirer: 2, inserer: "…" }));
  ok("typo : rien dans l'arabe", transformer("الحمد", "?", o) === null);
  ok("typo : éteinte", transformer("Bonjour", "?", { typographie: false, translit: false }) === null);
  ok("formule : saws + espace", JSON.stringify(transformer("le Prophète saws", " ", o)) === JSON.stringify({ retirer: 4, inserer: "ﷺ " }));
  ok("formule : pas au milieu d'un mot", transformer("chainsaws", " ", o) === null);
  ok("formule : code :ra:", transformer("Abu Bakr :ra", ":", o)?.inserer === "رضي الله عنه");
  ok("translit : _a → ā", JSON.stringify(transformer("Ka_", "a", { typographie: true, translit: true })) === JSON.stringify({ retirer: 1, inserer: "ā" }));
  ok("translit : .h → ḥ", transformer("A.", "h", { typographie: true, translit: true })?.inserer === "ḥ");
  ok("translit : éteinte par défaut", transformer("Ka_", "a", o) === null);
}

/* ---------- Sens d'écriture ---------- */
ok("sens : un paragraphe arabe", commenceEnArabe("  « بسم الله » puis du français"));
ok("sens : un paragraphe français", !commenceEnArabe("Le verset بسم الله"));
ok("sens : sans lettre", !commenceEnArabe("12 — 34"));

/* ---------- Relecture ---------- */
{
  const texte = "Le calame trace des lettres. Le calame trace encore des lettres sur le papier. Il y a vraiment beaucoup de choses à dire. La lettre est écrite par le scribe.";
  ok("phrases : quatre", phrases(texte).length === 4, String(phrases(texte).length));
  ok("syllabes : « calame » = 2", syllabes("calame") === 2, String(syllabes("calame")));
  const l = lisibilite(texte);
  ok("lisibilité : un score et un niveau", l.score > 0 && l.niveau !== "—", JSON.stringify(l));
  ok("mots fréquents : calame et trace", motsFrequents(texte).some((m) => m.mot === "calame" && m.n === 2));
  const s = analyser(texte, { repetitions: true, longues: true, faibles: true, passif: true });
  ok("analyse : répétition de « calame »", s.some((x) => x.genre === "repetition" && texte.slice(x.debut, x.fin).toLowerCase() === "calame"));
  ok("analyse : mots faibles", s.some((x) => x.genre === "faible" && texte.slice(x.debut, x.fin) === "vraiment"));
  ok("analyse : tournure passive", s.some((x) => x.genre === "passif" && texte.slice(x.debut, x.fin) === "est écrite"));
  ok("analyse : rien de long ici", !s.some((x) => x.genre === "longue"));
}

/* ---------- Comparaison ---------- */
{
  const m = diffMots("Le calame écrit vite.", "Le calame trace lentement.");
  ok("diff : un retrait et un ajout", m.some((x) => x.genre === "retrait" && x.texte.includes("écrit")) && m.some((x) => x.genre === "ajout" && x.texte.includes("trace")), JSON.stringify(m));
  const p = comparerParagraphes(["Un.", "Deux.", "Trois."], ["Un.", "Deux bis.", "Trois.", "Quatre."]);
  ok("diff : paragraphes modifié + ajouté", p.map((x) => x.genre).join(",") === "egal,modifie,egal,ajout", p.map((x) => x.genre).join(","));
  const b = bilanDiff(p);
  ok("diff : bilan des mots", b.ajoutes === 3 && b.retires === 1, JSON.stringify(b));
  const e = editions("abcabba".split(""), "cbabac".split(""));
  const reconstruit = e.filter((x) => x.genre !== "retrait").map((x) => x.b).join("");
  const ancien = e.filter((x) => x.genre !== "ajout").map((x) => x.a).join("");
  ok("diff : Myers reconstruit les deux textes", reconstruit === "cbabac" && ancien === "abcabba");
  ok("diff : script minimal (5 changements)", e.filter((x) => x.genre !== "egal").length === 5, String(e.filter((x) => x.genre !== "egal").length));
}

/* ---------- Modèle et préférences ---------- */
{
  const x = nettoyerExtras({ etiquettes: ["cours", "cours", " réfutation ", 3], epingle: true, corbeille: "pas une date", objectifMots: -5, echeance: "2026-12-01", proprietes: { statut: "inconnu", auteur: "Sofian" } });
  ok("extras : étiquettes nettoyées", JSON.stringify(x.etiquettes) === JSON.stringify(["cours", "réfutation"]));
  ok("extras : corbeille invalide ignorée", x.corbeille === null && x.epingle === true);
  ok("extras : objectif borné, échéance gardée", x.objectifMots === 0 && x.echeance === "2026-12-01");
  ok("extras : statut par défaut", x.proprietes.statut === "brouillon" && x.proprietes.auteur === "Sofian");
  ok("corbeille : 31 jours = expirée", corbeilleExpiree({ corbeille: new Date(Date.now() - 31 * 86_400_000).toISOString() }));
  ok("corbeille : 2 jours = gardée", !corbeilleExpiree({ corbeille: new Date(Date.now() - 2 * 86_400_000).toISOString() }));
  const pr = nettoyerPreferences({ tri: "titre", dossiers: ["/Cours//2026/", "Cours/2026"], etiquettes: [{ nom: "A", couleur: "#123456" }, { nom: "A" }], tailleInterface: 9 });
  ok("préférences : tri gardé", pr.tri === "titre");
  ok("préférences : dossiers propres et uniques", JSON.stringify(pr.dossiers) === JSON.stringify(["Cours/2026"]), JSON.stringify(pr.dossiers));
  ok("préférences : étiquettes uniques", pr.etiquettes.length === 1);
  ok("préférences : taille bornée", pr.tailleInterface === 1.4);
  ok("préférences : typographie active par défaut", nettoyerPreferences({}).typographie === true);
}

console.log(echecs ? `\n${echecs} échec(s).` : "Tout est bon (Calame).");
process.exit(echecs ? 1 : 0);
