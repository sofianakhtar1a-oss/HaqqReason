import { lierCitations, lireCitations, trouverSource } from "../src/lib/alambic/carnet/citations";
import { decouperLignes, decouperTemps, decouperTexte, pagesEstimees, phrasesDe } from "../src/lib/alambic/carnet/decoupage";
import { bm25, motsCles, selectionner } from "../src/lib/alambic/carnet/recherche";
import { type Morceau, referenceDe, type Source } from "../src/lib/alambic/carnet/types";

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${JSON.stringify(x).slice(0, 400)}`));
  if (!c) e++;
};
const phrase = (k: number, mot = "texte") => `Ceci est la phrase ${k} sur le ${mot} étudié avec quelques mots de plus pour la longueur.`;

// ---------------------------------------------------------------- découpage
ok("phrases latines et arabes", phrasesDe("Un. Deux ? Trois! قال: نعم؟ ثم ذهب.").length === 5);
const pages = Array.from({ length: 12 }, (_, i) => ({ page: i + 1, texte: Array.from({ length: 6 }, (_, k) => phrase(i * 10 + k)).join(" ") + "\n\n" + phrase(99) }));
const mx = decouperTexte("doc", pages);
ok("chaque morceau garde la page de son début", mx.every((m) => m.page! >= 1 && m.page! <= 12) && mx[0].page === 1);
ok("un morceau ne couvre jamais deux pages (citations exactes)", new Set(decouperTexte("p", [{ page: 1, texte: "Court." }, { page: 2, texte: "Aussi court." }]).map((m) => m.page)).size === 2);
ok("aucun mot perdu ni doublé", mx.map((m) => m.texte).join(" ").split(/\s+/).length === pages.map((p) => p.texte).join(" ").split(/\s+/).length);
ok("les morceaux restent dans la taille visée", mx.every((m) => m.texte.split(/\s+/).length <= 470), mx.map((m) => m.texte.split(/\s+/).length));
const longue = decouperTexte("x", [{ page: 1, texte: Array.from({ length: 200 }, (_, k) => phrase(k)).join(" ") }]);
ok("un paragraphe géant est coupé entre deux phrases, jamais au milieu", longue.length > 3 && longue.every((m) => /\.$/.test(m.texte)));
const est = pagesEstimees(Array.from({ length: 40 }, (_, k) => phrase(k).repeat(3)).join("\n\n"));
ok("pages estimées d'environ 3 000 signes, coupées entre paragraphes", est.length >= 3 && est.every((p) => p.texte.length <= 3400));
const tps = decouperTemps("v", Array.from({ length: 60 }, (_, k) => ({ texte: phrase(k), t: k * 6 })));
ok("transcriptions : passages d'environ 90 s avec leur minutage", tps.length >= 3 && tps.every((m, i) => i === 0 || m.t! - tps[i - 1].t! <= 110) && tps[1].t! > 0);
const csv = decouperLignes("c", [{ texte: "nom;age", ligne: 1 }, ...Array.from({ length: 70 }, (_, k) => ({ texte: `p${k};${k}`, ligne: k + 2 }))]);
ok("tableaux : l'en-tête est répété dans chaque paquet de lignes", csv.length === 3 && csv.every((m) => m.texte.startsWith("nom;age")) && csv[1].ligne === 32);

// ---------------------------------------------------------------- recherche
ok("mots-clés sans mots vides ni accents", motsCles("Les Prémisses d'un argument").join(",") === "premisse,argument");
const corpus: Morceau[] = [
  { id: "a:0", source: "a", ordre: 0, texte: "La prière en commun et ses conditions.", jetons: 2000 },
  { id: "a:1", source: "a", ordre: 1, texte: "Le jeûne du mois de Ramadan.", jetons: 2000 },
  { id: "a:2", source: "a", ordre: 2, texte: "La zakat et ses montants minimaux.", jetons: 2000 },
  { id: "b:0", source: "b", ordre: 0, texte: "Discussion sur le jeûne et la santé.", jetons: 2000 },
  { id: "b:1", source: "b", ordre: 1, texte: "Une anecdote sans rapport.", jetons: 2000 },
  { id: "c:0", source: "c", ordre: 0, texte: "Un document sur un autre sujet.", jetons: 2000 },
];
const s1 = bm25(corpus, "Que disent les sources sur le jeûne ?");
ok("BM25 trouve les passages pertinents", (s1.get("a:1") ?? 0) > 0 && (s1.get("b:0") ?? 0) > 0 && !s1.has("a:2"));
const tout = selectionner({ morceaux: corpus, ordreSources: ["a", "b", "c"], question: "jeûne", budget: 100000 });
ok("tout tient dans le budget : tout est envoyé, dans l'ordre", tout.mode === "complet" && tout.morceaux.map((m) => m.id).join() === "a:0,a:1,a:2,b:0,b:1,c:0");
const rech = selectionner({ morceaux: corpus, ordreSources: ["a", "b", "c"], question: "le jeûne", budget: 9000 });
ok("budget serré : les passages pertinents d'abord, chaque source représentée", rech.mode === "recherche" && rech.jetonsEnvoyes <= 9000 && ["a:1", "b:0", "c:0"].every((id) => rech.morceaux.some((m) => m.id === id)), rech.morceaux.map((m) => m.id));
const couv = selectionner({ morceaux: corpus, ordreSources: ["a", "b", "c"], question: "", action: "synthese", budget: 9000 });
ok("synthèse : couverture de chaque source", couv.mode === "couverture" && new Set(couv.morceaux.map((m) => m.source)).size === 3);
const vec = selectionner({
  morceaux: corpus.map((m, i) => ({ ...m, vecteur: [i === 2 ? 1 : 0, i === 2 ? 0 : 1] })),
  ordreSources: ["a", "b", "c"],
  question: "aumône obligatoire",
  budget: 9000,
  vecteurQuestion: [1, 0],
});
ok("le sens rattrape ce que les mots ratent (aumône → zakat)", vec.morceaux.some((m) => m.id === "a:2"));

// ---------------------------------------------------------------- citations
const sources: Source[] = [
  { id: "s1", nom: "Rapport_2026.pdf", type: "pdf", ajouteLe: 0, active: true, etat: "pret", nbMorceaux: 1, jetons: 1 },
  { id: "s2", nom: "La logique expliquée", type: "youtube", ajouteLe: 0, active: true, etat: "pret", nbMorceaux: 1, jetons: 1, youtube: "abc" },
  { id: "s3", nom: "ventes.csv", type: "csv", ajouteLe: 0, active: true, etat: "pret", nbMorceaux: 1, jetons: 1 },
];
ok("références fabriquées au bon format", referenceDe(sources[0], { page: 14 }) === "[Rapport_2026.pdf, p. 14]" && referenceDe(sources[1], { t: 765 }) === "[Vidéo YouTube - La logique expliquée, 12:45]");
const c1 = lireCitations("Rapport_2026.pdf, p. 14; Vidéo YouTube - La logique expliquée, 1:02:05", sources);
ok("deux citations dans un crochet, page et minutage", c1.length === 2 && c1[0].source?.id === "s1" && c1[0].page === 14 && c1[1].source?.id === "s2" && c1[1].t === 3725, c1);
ok("nom approché retrouvé (sans extension, casse, accents)", trouverSource("rapport 2026", sources)?.id === "s1" && trouverSource("Vidéo YouTube – la logique EXPLIQUEE", sources)?.id === "s2");
const html = lierCitations("Le taux est de 4 % [Rapport_2026.pdf, p. 14]. Voir [ce lien](https://x.fr) et [ventes.csv, lignes 3-9].", sources);
ok("citations transformées en boutons, liens Markdown intacts", html.includes('data-source="s1" data-page="14"') && html.includes("[ce lien](https://x.fr)") && html.includes('data-ligne="3"'), html);
ok("crochet ordinaire laissé tel quel", lierCitations("Il dit [sic] et [note 3].", sources) === "Il dit [sic] et [note 3].");
ok("source inconnue : bouton marqué, sans plantage", lierCitations("[Inconnu.pdf, p. 2]", sources).includes('data-inconnue="1"'));
ok("pas d'injection HTML par le nom cité", !lierCitations('[<img src=x onerror=alert(1)>, p. 2]', sources).includes("<img"));

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
