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

// ---------------------------------------------------------------- Phase 8
{
  const { nettoyerReglages, CHOIX } = await import("../src/lib/reglages");
  const r = nettoyerReglages({ inactivite_minutes: 7, session_max_heures: 999, lier_appareil: "on", taille_max_mo: 25 });
  ok("réglages : une durée hors liste revient au défaut", r.inactivite_minutes === 30 && r.session_max_heures === 12);
  ok("réglages : une durée de la liste est gardée", nettoyerReglages({ inactivite_minutes: 5 }).inactivite_minutes === 5);
  ok("réglages : case cochée lue correctement", r.lier_appareil === true && nettoyerReglages({ lier_appareil: false }).lier_appareil === false);
  ok("réglages : taille de fichier gardée", r.taille_max_mo === 25 && CHOIX.taille_max_mo.includes(50));
}
{
  const { sommaireDuDocument } = await import("../src/lib/sommaire");
  const doc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Premier titre" }] },
      { type: "sommaire", attrs: { titre: "", profondeur: 4 } },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Sous-titre [[Autre article|lien]]" }] },
      { type: "paragraph", content: [{ type: "text", text: "Texte" }] },
      { type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "Petit titre" }] },
    ],
  };
  const s = sommaireDuDocument(doc);
  ok("sommaire : un titre par entrée, dans l'ordre", s.length === 3 && s[0].id === "section-1" && s[2].id === "section-3");
  ok("sommaire : niveaux conservés", s.map((e) => e.niveau).join(",") === "2,3,4");
  ok("sommaire : les liens [[…]] sont remplacés par leur texte", s[1].texte === "Sous-titre lien");
  ok("sommaire : le bloc lui-même n'est pas compté comme un titre", !s.some((e) => e.texte === ""));
}
{
  const { NOEUDS } = await import("../src/lib/document-schema");
  ok("document : le bloc sommaire est accepté", Object.hasOwn(NOEUDS, "sommaire"));
  ok("document : profondeur du sommaire bornée entre 2 et 4", NOEUDS.sommaire.profondeur(9) === 4 && NOEUDS.sommaire.profondeur(3) === 3 && NOEUDS.sommaire.profondeur("x") === 4);
}


// ---------------------------------------------------------------- Phase 9 : recherche par le sens
{
  const { decouperArticle, normaliser, vecteurValide, LIMITES_SENS } = await import("../src/lib/sens/decoupage");
  const court = decouperArticle("Les signes de la prophétie", "Un résumé court.", "Un texte bref.");
  ok("découpage : un article court tient en un morceau", court.length === 1 && court[0].includes("Les signes de la prophétie") && court[0].includes("Un texte bref."));

  const long = decouperArticle("Titre", "Résumé", "Phrase de test. ".repeat(1200));
  ok("découpage : un article long donne plusieurs morceaux", long.length > 1 && long.length <= LIMITES_SENS.morceaux);
  ok("découpage : le titre n'est que dans le premier morceau", long[0].startsWith("Titre") && !long[1].includes("Titre\n"));
  ok("découpage : aucun morceau ne dépasse la taille prévue", long.every((m) => m.length <= LIMITES_SENS.taille + 200), String(Math.max(...long.map((m) => m.length))));
  ok("découpage : les morceaux se recouvrent un peu", long.length < 2 || long[1].length > LIMITES_SENS.recouvrement);
  ok("découpage : un article vide ne produit que l'en-tête", decouperArticle("Titre seul", "", "").length === 1);

  const n = normaliser([3, 4]);
  ok("normalisation : longueur ramenée à 1", Math.abs(Math.hypot(...n) - 1) < 1e-9 && Math.abs(n[0] - 0.6) < 1e-9);
  ok("normalisation : vecteur nul géré sans erreur", normaliser([0, 0]).every((x) => x === 0));
  ok("vecteur : refuse ce qui n'en est pas un", !vecteurValide([1, 2]) && !vecteurValide(["a"]) && !vecteurValide(null) && vecteurValide(new Array(16).fill(0.1)));
  ok("vecteur : refuse les nombres non finis", !vecteurValide([...new Array(15).fill(0.1), Number.NaN]));
  ok("vecteur : contrôle la dimension attendue", vecteurValide(new Array(16).fill(0.1), 16) && !vecteurValide(new Array(16).fill(0.1), 32));
}
{
  const { nettoyerReglages } = await import("../src/lib/reglages");
  ok("réglages : recherche par le sens active par défaut", nettoyerReglages({}).recherche_sens === true);
  ok("réglages : recherche par le sens désactivable", nettoyerReglages({ recherche_sens: false }).recherche_sens === false);
}


// ---------------------------------------------------------------- Lecteur PDF : messages d'erreur
{
  const { messageDouverture } = await import("../src/lib/client/pdf-erreurs");
  const err = (name: string, message = "") => Object.assign(new Error(message), { name });
  ok("PDF protégé : message explicite", /mot de passe/.test(messageDouverture(err("PasswordException"))));
  ok("PDF abîmé : message explicite", /abîmé/.test(messageDouverture(err("InvalidPDFException"))));
  ok("PDF introuvable : message explicite", /introuvable/.test(messageDouverture(err("MissingPDFException"))));
  ok("connexion coupée : message explicite", /connexion/.test(messageDouverture(err("UnexpectedResponseException", "Failed to fetch"))));
  ok("WebAssembly refusé : message explicite", /décoder/.test(messageDouverture(err("Error", "WebAssembly.instantiate refused"))));
  ok("cause inconnue : message de repli utile", /télécharge/.test(messageDouverture(err("Error", "???"))));
}

process.exit(e);
