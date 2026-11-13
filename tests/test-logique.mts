import { analyser, ecrire, validite, coherence, tableDeVerite, statutFormule, syllogismeValide } from "../src/lib/logique/moteur";
import { analyserLogique, nettoyerLogique, logiqueParDefaut } from "../src/lib/logique/bloc";
import { nettoyerSchema, schemaParDefaut } from "../src/lib/schemas/modele";
import { compiler } from "../src/lib/schemas/expression";
import { disposer } from "../src/lib/schemas/disposition";
import { infosYoutube } from "../src/lib/liens-web";
let e = 0; const ok = (n: string, c: boolean) => { console.log((c ? "OK " : "ECHEC ") + n); if (!c) e++; };
ok("écriture", ecrire(analyser("non P et Q -> R ou S")) === "¬P ∧ Q → R ∨ S");
ok("parenthèses", ecrire(analyser("(P -> Q) -> R")) === "(P → Q) → R" && ecrire(analyser("P -> Q -> R")) === "P → Q → R");
ok("modus ponens valide", validite([analyser("P -> Q"), analyser("P")], analyser("Q")).valide);
const aff = validite([analyser("P -> Q"), analyser("Q")], analyser("P"));
ok("affirmation du conséquent invalide + contre-exemple", !aff.valide && aff.contreExemple!.P === false && aff.contreExemple!.Q === true);
ok("tautologie", statutFormule(analyser("P ou non P")) === "tautologie");
ok("contradiction", statutFormule(analyser("P et ~P")) === "contradiction");
const c = coherence([analyser("P"), analyser("P -> Q"), analyser("~Q"), analyser("R")]);
ok("incohérence + conflit minimal", !c.coherent && JSON.stringify(c.conflits[0]) === "[0,1,2]");
ok("table 2 variables", tableDeVerite([analyser("P ∧ Q")]).lignes.length === 4);
type T = "S" | "M" | "P";
const A = (s: T, p: T) => ({ quantite: "A" as const, sujet: s, predicat: p });
ok("Barbara valide", syllogismeValide(A("M","P"), A("S","M"), A("S","P"), false).valide);
ok("Darapti dépend de l'importation existentielle", !syllogismeValide(A("M","P"), A("M","S"), { quantite: "I", sujet: "S", predicat: "P" }, false).valide && syllogismeValide(A("M","P"), A("M","S"), { quantite: "I", sujet: "S", predicat: "P" }, true).valide);
ok("non distribué invalide", !syllogismeValide(A("P","M"), A("S","M"), A("S","P"), true).valide);
let err = ""; try { analyser("P et (Q"); } catch (x) { err = (x as Error).message; } ok("erreur claire", err.includes("Parenthèse"));
ok("mots-clés", ecrire(analyser("P implique Q ssi non Q implique non P")) === "P → Q ↔ ¬Q → ¬P");

// Blocs : nettoyage et calculs complets

const demo = nettoyerLogique({ genre: "demonstration", lignes: [
  { formule: "P -> Q", regle: "Prémisse", role: "premisse" },
  { formule: "P", regle: "Prémisse", role: "premisse" },
  { formule: "Q", regle: "Modus ponens", role: "etape", depuis: [0, 1] },
  { formule: "R", regle: "Modus ponens", role: "etape", depuis: [2] },
] });
const rd = analyserLogique(demo);
ok("démonstration : étape juste vérifiée, étape injustifiée signalée", rd.genre === "demonstration" && rd.verifications[2] === "ok" && rd.verifications[3] === "faux");
const pire = nettoyerLogique({ genre: "<script>", titre: 42, lignes: "x", variables: [{ nom: "javascript:", sens: "x" }] });
ok("logique : données hostiles neutralisées", pire.genre === "validite" && pire.titre === "" && pire.variables.length === 0 && pire.lignes.length === 3);
const s = nettoyerSchema({ genre: "graphe", noeuds: [{ id: "a", texte: "A", lien: "javascript:alert(1)", article: "pas-un-uuid" }, { id: "a", texte: "doublon" }, { id: "b", texte: "B" }], liens: [{ id: "l", de: "a", vers: "b" }, { id: "m", de: "a", vers: "zzz" }] });
ok("schéma : lien dangereux, doublon et lien orphelin retirés", s.noeuds.length === 2 && s.noeuds[0].lien === "" && s.noeuds[0].article === "" && s.liens.length === 1);
ok("schémas par défaut valides", ["carte-mentale", "arbre-argumentatif", "flux", "causalite", "classification", "dependance", "carte-conceptuelle", "organigramme"].every((st) => nettoyerSchema(schemaParDefaut("graphe", st as never)).noeuds.length >= 2));
const plan = disposer(schemaParDefaut("graphe", "carte-mentale"));
const xs = [...plan.boites.values()].map((b) => b.x);
ok("carte mentale : branches des deux côtés", xs.some((x) => x > 50) && xs.some((x) => x < -50));
ok("courbes : 2x^2 - 3x + 1 en 2 = 3", compiler("2x^2 - 3x + 1").f!(2) === 3 && Math.abs(compiler("sin(pi/2)").f!(0) - 1) < 1e-12);
ok("courbes : expression invalide refusée", compiler("x +* 2").f === null && compiler("alert(1)").f === null);
ok("YouTube : vidéo, court, playlist, minutage", infosYoutube("https://youtu.be/dQw4w9WgXcQ?t=1m5s")!.debut === 65 && infosYoutube("https://www.youtube.com/shorts/dQw4w9WgXcQ")!.video === "dQw4w9WgXcQ" && infosYoutube("https://www.youtube.com/playlist?list=PLabcdefghijkl")!.liste === "PLabcdefghijkl" && infosYoutube("https://example.com/watch?v=dQw4w9WgXcQ") === null);
ok("logique par défaut cohérente", (["validite", "demonstration", "syllogisme", "coherence", "verite"] as const).every((g) => nettoyerLogique(logiqueParDefaut(g)).genre === g));
process.exit(e);
