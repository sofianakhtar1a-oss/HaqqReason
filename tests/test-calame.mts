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
import { composer, dateHegirienne, enRomain, numeroAffiche, partieDeLaPage, remplirGabarit, type UniteMesuree } from "../src/lib/atelier/composition";
import { cleDeTri, enChiffresArabes, libelleReference, lireReference, texteDeLaPlage } from "../src/lib/atelier/coran";
import { degreDepuis, degreEnFrancais } from "../src/lib/atelier/hadiths";
import { nettoyerBibliotheque, referenceTexte, OUVRAGE_VIDE } from "../src/lib/atelier/bibliotheque";
import { enTexteBrut, versNeutre } from "../src/lib/atelier/neutre";
import { enHtml } from "../src/lib/atelier/html";
import { enMarkdown } from "../src/lib/atelier/markdown";
import { construireDocx } from "../src/lib/atelier/docx";
import { REGLAGES_PAR_DEFAUT } from "../src/lib/atelier/modele";
import { lirePlagesDePages, ordreDuLivret } from "../src/app/ecrire/impression";
import { strFromU8, unzipSync } from "fflate";

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

/* ---------- Composition des pages ---------- */
{
  // Des paragraphes de 10 lignes de 20 px, 10 px entre eux ; page utile de 300 px.
  const para = (id: string, haut: number, n = 10, extra: Partial<UniteMesuree> = {}): UniteMesuree => ({
    id,
    haut,
    hauteur: n * 20,
    lignes: () => Array.from({ length: n }, (_, i) => ({ haut: haut + i * 20, bas: haut + (i + 1) * 20 })),
    ...extra,
  });
  const utile = { hauteurUtile: () => 300 };
  const a = para("a", 0); // 0 → 200
  const b = para("b", 210); // 210 → 410 : 4 lignes tiennent (210 → 290), 6 passent
  const c1 = composer([a, b], utile);
  ok("composition : deux pages", c1.pages.length === 2, String(c1.pages.length));
  ok("composition : b coupé à la ligne 4", c1.pages[1].ouverture?.unite === "b" && c1.pages[1].ouverture?.ligne === 4, JSON.stringify(c1.pages[1].ouverture));
  ok("composition : la page 2 commence à la ligne coupée", c1.pages[1].ouverture?.y === 290);

  // Orpheline : une seule ligne tiendrait → tout le paragraphe passe.
  const c2 = composer([para("a", 0, 14), para("b", 290)], utile);
  ok("composition : pas d'orpheline", c2.pages[1].ouverture?.unite === "b" && c2.pages[1].ouverture?.ligne === 0, JSON.stringify(c2.pages[1].ouverture));

  // Veuve : 9 lignes sur 10 tiendraient → on en garde 8, deux passent.
  const c3 = composer([para("a", 0, 5), para("b", 110, 10)], utile);
  ok("composition : pas de veuve", c3.pages[1].ouverture?.ligne === 8, JSON.stringify(c3.pages[1].ouverture));

  // Sans la règle, la coupure tombe au plus juste.
  const c4 = composer([para("a", 0, 5), para("b", 110, 10)], { ...utile, veuves: false });
  ok("composition : coupure au plus juste sans règle", c4.pages[1].ouverture?.ligne === 9, JSON.stringify(c4.pages[1].ouverture));

  // Un bloc insécable descend entier.
  const c5 = composer([para("a", 0, 12), { id: "img", haut: 250, hauteur: 120, insecable: true }], utile);
  ok("composition : image descendue", c5.pages[1].ouverture?.unite === "img" && c5.pages[1].ouverture?.ligne === 0);

  // Un titre ne reste pas seul en bas de page.
  const c6 = composer([para("a", 0, 13), { id: "t", haut: 265, hauteur: 25, avecSuivant: true }, para("b", 295, 6)], utile);
  ok("composition : titre emporté avec la suite", c6.pages[1].ouverture?.unite === "t", JSON.stringify(c6.pages[1].ouverture));

  // Notes : la place des notes est retirée à la page où elles sont appelées.
  const notes = [{ id: "n1", y: 30 }];
  const c7 = composer([para("a", 0, 14, { notes })], { ...utile, hauteurNote: () => 40, filetNotes: 10 });
  ok("composition : note gardée en page 1", c7.pages[0].notes.includes("n1") && c7.pages[0].hauteurNotes === 50, JSON.stringify(c7.pages[0]));
  ok("composition : la note réduit la page (12 lignes au lieu de 14)", c7.pages[1].ouverture?.ligne === 12, JSON.stringify(c7.pages[1].ouverture));

  // Tableau : coupé entre deux rangées, l'en-tête répété en haut de la suite.
  const tableau: UniteMesuree = { id: "tab", haut: 200, hauteur: 200, minAvant: 2, minApres: 1, repete: 20, lignes: () => Array.from({ length: 10 }, (_, i) => ({ haut: 200 + i * 20, bas: 220 + i * 20 })) };
  const c8 = composer([para("a", 0, 10), tableau], utile);
  ok("composition : tableau coupé après 5 rangées", c8.pages[1].ouverture?.unite === "tab" && c8.pages[1].ouverture?.ligne === 5 && c8.pages[1].ouverture?.repete === 20, JSON.stringify(c8.pages[1].ouverture));
  ok("composition : la place de l'en-tête est comptée", c8.pages[1].debut === 280, String(c8.pages[1].debut));

  // Saut de page demandé.
  const c9 = composer([para("a", 0, 2), { ...para("b", 50, 2), sautAvant: true }], utile);
  ok("composition : saut de page", c9.pages.length === 2 && c9.pages[1].ouverture?.unite === "b");

  // Bloc plus haut qu'une page : il la traverse.
  const c10 = composer([{ id: "geant", haut: 0, hauteur: 700, insecable: true }], utile);
  ok("composition : bloc géant sur 3 pages", c10.pages.length === 3 && c10.pages[1].ouverture === null, String(c10.pages.length));

  // Très long paragraphe : plusieurs coupures.
  const c11 = composer([para("long", 0, 40)], utile);
  ok("composition : 40 lignes sur 3 pages", c11.pages.length === 3 && c11.pages[1].ouverture?.ligne === 15 && c11.pages[2].ouverture?.ligne === 30, JSON.stringify(c11.pages.map((p) => p.ouverture)));
}

/* ---------- Numéros et jetons ---------- */
{
  ok("romain : 4 → iv", enRomain(4) === "iv");
  ok("romain : 1994 → mcmxciv", enRomain(1994) === "mcmxciv");
  const o = { style: "arabe" as const, premier: 1, liminaires: 3 };
  ok("numéro : liminaire en romain", numeroAffiche(2, o) === "ii");
  ok("numéro : le corps repart à 1", numeroAffiche(4, o) === "1" && numeroAffiche(10, o) === "7");
  ok("numéro : premier numéro choisi", numeroAffiche(1, { style: "arabe", premier: 5, liminaires: 0 }) === "5");
  ok("numéro : romain majuscule", numeroAffiche(3, { style: "ROMAIN", premier: 1, liminaires: 0 }) === "III");
  const h = dateHegirienne(new Date("2026-11-20T12:00:00Z"));
  ok("hégire : année 1448", /1448 H$/.test(h), h);
  const ligne = remplirGabarit("{titre} — {partie} — p. {page}/{pages} — {hégire}", { titre: "Mémoire", page: "iv", pages: 12, partie: "Introduction", date: new Date("2026-11-20T12:00:00Z") });
  ok("gabarit : jetons remplis", ligne.startsWith("Mémoire — Introduction — p. iv/12 — ") && ligne.endsWith("1448 H"), ligne);
  const titres = [{ y: 0, texte: "Un" }, { y: 500, texte: "Deux" }, { y: 900, texte: "Trois" }];
  ok("partie : celle qui s'ouvre sur la page", partieDeLaPage(titres, 400, 700) === "Deux");
  ok("partie : sinon la dernière ouverte", partieDeLaPage(titres, 600, 850) === "Deux" && partieDeLaPage(titres, 950, 1200) === "Trois");
}

/* ---------- Sources : Coran, hadiths, bibliographie ---------- */
{
  const r1 = lireReference("2:1-5");
  ok("coran : 2:1-5", "sourate" in r1 && r1.sourate === 2 && r1.debut === 1 && r1.fin === 5, JSON.stringify(r1));
  const r2 = lireReference("Al-Baqara 255");
  ok("coran : par le nom", "sourate" in r2 && r2.sourate === 2 && r2.debut === 255 && r2.fin === 255, JSON.stringify(r2));
  ok("coran : verset inexistant refusé", "erreur" in lireReference("1:8"));
  ok("coran : sourate inexistante refusée", "erreur" in lireReference("115:1"));
  ok("coran : libellé", "sourate" in r1 && libelleReference(r1) === "Al-Baqara (2), 1-5", "sourate" in r1 ? libelleReference(r1) : "");
  ok("coran : chiffres arabes", enChiffresArabes(255) === "٢٥٥");
  const plage = texteDeLaPlage([["أ", "ب"], ["ج", "د", "ه"]], { sourate: 2, debut: 2, fin: 3 }, true);
  ok("coran : texte de la plage numéroté", plage.includes("د") && plage.includes("ه") && plage.includes("٢") && !plage.includes("ج"), plage);
  const [s1, v1] = cleDeTri("Coran, Al-Baqara (2), 255");
  ok("coran : clé de tri", s1 === 2 && v1 === 255, String([s1, v1]));
  ok("hadith : degré traduit", degreEnFrancais("Sahih") === "authentique (ṣaḥīḥ)" && degreEnFrancais("Hasan Sahih").startsWith("bon et authentique") && /faible/i.test(degreEnFrancais("Da'if")), degreEnFrancais("Sahih"));
  ok("hadith : recueil sahih par consensus", degreDepuis([], true) === "sahih");
  ok("hadith : la majorité des savants l'emporte", degreDepuis([{ nom: "a", degre: "Da'if" }, { nom: "b", degre: "Da'if" }, { nom: "c", degre: "Hasan" }], false) === "daif");

  const livre = { ...OUVRAGE_VIDE, auteur: "Ghazali, Abu Hamid; Nasr, Seyyed Hossein", titre: "Le Tabernacle des lumières", traducteur: "R. Deladrière", editeur: "Seuil", lieu: "Paris", annee: "1981" };
  const chicago = referenceTexte(livre, "chicago", "42");
  ok("bibliographie : Chicago", chicago.startsWith("Ghazali, Abu Hamid et Seyyed Hossein Nasr. Le Tabernacle des lumières, trad. R. Deladrière. Paris\u00a0: Seuil, 1981, p.\u00a042."), chicago);
  const iso = referenceTexte(livre, "iso690");
  ok("bibliographie : ISO 690 en capitales", iso.startsWith("GHAZALI, Abu Hamid et NASR, Seyyed Hossein."), iso);
  const apa = referenceTexte({ ...livre, auteur: "Ghazali, Abu Hamid" }, "apa");
  ok("bibliographie : APA", apa.startsWith("Ghazali, A. H. (1981). Le Tabernacle des lumières"), apa);
  const article = referenceTexte({ ...OUVRAGE_VIDE, genre: "article", auteur: "Dupont, Marie", titre: "Une lecture", recueil: "Revue d'études", volume: "12", annee: "2020", pages: "5-20" }, "chicago");
  ok("bibliographie : article", article === "Dupont, Marie. «\u00a0Une lecture\u00a0». Revue d'études 12 (2020)\u00a0: 5-20.", article);
  const nettoyee = nettoyerBibliotheque([{ id: "abcd", titre: "A", q: 2 }, { id: "abcd", titre: "doublon" }, { id: "x" }, { id: "efgh", titre: "B", supprime: true }]);
  ok("bibliothèque : doublons et identifiants invalides écartés", nettoyee.length === 2 && nettoyee[0].titre === "A" && nettoyee[1].supprime === true, JSON.stringify(nettoyee));
}

/* ---------- Sorties : document neutre, Word, HTML, Markdown, texte, livret ---------- */
{
  const contenu = {
    type: "doc",
    content: [
      { type: "pageDeGarde", attrs: { titre: "Mémoire", auteur: "Sofian", etablissement: "Université" } },
      { type: "sommaire", attrs: { titre: "Table des matières" } },
      { type: "heading", attrs: { level: 2, ancre: "intro" }, content: [{ type: "text", text: "Introduction" }] },
      { type: "paragraph", content: [{ type: "text", text: "Le " }, { type: "text", text: "tawḥīd", marks: [{ type: "termeGlossaire", attrs: { entree: "tawḥīd", sens: "unicité" } }] }, { type: "text", text: " selon Ghazali" }, { type: "note", attrs: { texte: "Ghazali, Iḥyāʾ, I, p. 12." } }, { type: "text", text: ", et " }, { type: "text", text: "un lien", marks: [{ type: "link", attrs: { href: "https://exemple.org" } }] }, { type: "text", text: "." }] },
      { type: "paragraph", content: [{ type: "text", text: "قل هو الله أحد" }] },
      { type: "verset", attrs: { reference: "Al-Ikhlas (112), 1" }, content: [{ type: "versetArabe", content: [{ type: "text", text: "قل هو الله أحد" }] }, { type: "versetTraduction", content: [{ type: "text", text: "Dis : Il est Dieu, Unique." }] }] },
      { type: "schema", attrs: { donnees: JSON.stringify({ titre: "Plan" }) } },
      { type: "frise", content: [{ type: "evenement", content: [{ type: "evenementDate", content: [{ type: "text", text: "622" }] }, { type: "paragraph", content: [{ type: "text", text: "Hégire" }] }] }] },
      { type: "sautSection", attrs: { orientation: "paysage" } },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Annexe" }] },
      { type: "bibliographie", attrs: { titre: "Bibliographie" } },
      { type: "glossaire", attrs: { titre: "Glossaire" } },
      { type: "indexSources", attrs: { genre: "versets" } },
    ],
  };
  const neutre = versNeutre(contenu, {
    imageDuBloc: (k) => (k === 0 ? { fichier: "bloc-0", alt: "" } : null),
    bibliographie: () => [[{ texte: "Ghazali. " }, { texte: "Iḥyāʾ", italique: true }]],
    versets: [{ libelle: "Al-Ikhlas (112), 1" }],
    glossaire: [{ entree: "tawḥīd", translitteration: "", sens: "unicité" }],
    numeroterTitres: true,
  });
  const types = (neutre.content ?? []).map((n) => n.type);
  ok("neutre : page de garde en texte puis saut de page", types[0] === "paragraph" && types.includes("sautPage"), types.join(","));
  ok("neutre : le schéma devient une image", (neutre.content ?? []).some((n) => n.type === "image" && n.attrs?.fichier === "bloc-0"));
  ok("neutre : la frise sans image reste du texte", JSON.stringify(neutre).includes("622") && JSON.stringify(neutre).includes("Hégire"));
  ok("neutre : titres numérotés", JSON.stringify(neutre).includes('"1. "') && JSON.stringify(neutre).includes('"1.1. "'));
  ok("neutre : bibliographie, glossaire et index écrits", JSON.stringify(neutre).includes("Iḥyāʾ") && JSON.stringify(neutre).includes("unicité") && JSON.stringify(neutre).includes("Index des versets"));
  ok("neutre : la marque du glossaire ne voyage pas", !JSON.stringify(neutre).includes("termeGlossaire"));

  const html = enHtml(neutre, { sourceImage: (f) => (f === "bloc-0" ? "images/bloc-1.png" : null) });
  ok("html : note renvoyée en fin avec retour", html.corps.includes('href="#note-1"') && html.corps.includes('id="note-1"') && html.corps.includes('href="#appel-1"'));
  ok("html : arabe de droite à gauche", html.corps.includes('dir="rtl"'));
  ok("html : verset avec sa référence", html.corps.includes("<figcaption>Coran, Al-Ikhlas (112), 1</figcaption>"));
  ok("html : sommaire avec liens vers les titres", html.corps.includes('href="#t1"') && html.corps.includes('id="t1"'));
  ok("html : image du schéma", html.corps.includes('src="images/bloc-1.png"'));
  ok("html : XHTML bien formé (balises vides fermées)", !/<(br|hr|img)(\s[^>]*)?(?<!\/)>/.test(html.corps), html.corps.match(/<(br|hr|img)(\s[^>]*)?(?<!\/)>/)?.[0] ?? "");

  const md = enMarkdown(neutre, "Mémoire", { cheminImage: (f) => (f === "bloc-0" ? "images/bloc-1.png" : null) });
  ok("markdown : note de bas de page [^1]", md.includes("[^1]") && md.includes("[^1]: Ghazali, Iḥyāʾ, I, p. 12."));
  ok("markdown : image jointe", md.includes("](images/bloc-1.png)"));

  const txt = enTexteBrut(neutre, "Mémoire");
  ok("texte : notes en fin de texte", txt.includes("[1]") && txt.includes("Notes"));
  ok("texte : verset et référence", txt.includes("Coran, Al-Ikhlas (112), 1"));

  const neutreWord = versNeutre(contenu, { pourWord: true, imageDuBloc: () => null });
  const docx = unzipSync(construireDocx({ titre: "Mémoire", contenu: neutreWord, reglages: { ...REGLAGES_PAR_DEFAUT, entete: "{titre} — {partie}" }, proprietes: { auteur: "Sofian", sujet: "Tawḥīd", motsCles: "kalam, preuve" } }));
  const corps = strFromU8(docx["word/document.xml"]);
  ok("word : vraie note de bas de page", corps.includes("<w:footnoteReference") && strFromU8(docx["word/footnotes.xml"] ?? new Uint8Array()).includes("Ghazali"));
  ok("word : lien cliquable", corps.includes("<w:hyperlink") && strFromU8(docx["word/_rels/document.xml.rels"]).includes('TargetMode="External"'));
  ok("word : arabe de droite à gauche", corps.includes("<w:bidi/>") && corps.includes("<w:rtl/>"));
  ok("word : table des matières en champ", corps.includes("TOC \\o") && strFromU8(docx["word/settings.xml"]).includes("updateFields"));
  ok("word : la table montre déjà les titres", corps.includes("Introduction"));
  ok("word : section en paysage", corps.includes('w:orient="landscape"'));
  ok("word : signet sur un titre ancré", corps.includes('w:bookmarkStart') && corps.includes('w:name="a_intro"'));
  ok("word : propriétés du document", strFromU8(docx["docProps/core.xml"]).includes("<dc:creator>Sofian</dc:creator>") && strFromU8(docx["docProps/core.xml"]).includes("kalam"));
  ok("word : {partie} devient un champ STYLEREF", strFromU8(docx["word/header1.xml"]).includes("STYLEREF"));
  ok("word : référence du verset", corps.includes("Coran, Al-Ikhlas (112), 1"));
  const ordre = (xml: string, balise: string) => [...xml.matchAll(new RegExp(`<w:${balise}>(.*?)</w:${balise}>`, "g"))].every((m) => {
    const noms = [...m[1].matchAll(/<w:(\w+)/g)].map((x) => x[1]);
    const ref = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "color", "spacing", "sz", "szCs", "highlight", "u", "vertAlign", "rtl", "lang"];
    const rangs = noms.map((n) => ref.indexOf(n)).filter((r) => r >= 0);
    return rangs.every((r, i) => i === 0 || r >= rangs[i - 1]);
  });
  ok("word : propriétés de caractère dans l'ordre du format", ordre(corps, "rPr"));
  const notesFin = unzipSync(construireDocx({ titre: "T", contenu: neutreWord, reglages: { ...REGLAGES_PAR_DEFAUT, notes: "fin-document" } }));
  ok("word : notes de fin quand le document les veut en fin", notesFin["word/endnotes.xml"] !== undefined && strFromU8(notesFin["word/document.xml"]).includes("<w:endnoteReference"));

  ok("livret : 8 pages dans l'ordre d'imposition", JSON.stringify(ordreDuLivret(8)) === JSON.stringify([[8, 1], [2, 7], [6, 3], [4, 5]]), JSON.stringify(ordreDuLivret(8)));
  ok("livret : complété de pages blanches", JSON.stringify(ordreDuLivret(5)) === JSON.stringify([[null, 1], [2, null], [null, 3], [4, 5]]), JSON.stringify(ordreDuLivret(5)));
  ok("pages : « 1-3, 5, 9-7 »", JSON.stringify(lirePlagesDePages("1-3, 5, 9-7", 8)) === JSON.stringify([1, 2, 3, 5, 7, 8]), JSON.stringify(lirePlagesDePages("1-3, 5, 9-7", 8)));
}

/* ---------- Modèles ---------- */
{
  const { MODELES } = await import("../src/lib/atelier/modeles");
  ok("modèles : les sept attendus", ["lettre", "expose", "memoire", "fiche-lecture", "refutation", "sermon", "plan-cours"].every((c) => MODELES.some((m) => m.cle === c)));
  for (const m of MODELES) {
    const c = m.contenu() as { type: string; content: unknown[] };
    ok(`modèle « ${m.titre} » : un document non vide`, c.type === "doc" && c.content.length > 3);
    // Le contenu se lit avec le vocabulaire des documents (sauf les blocs propres à l'atelier, ignorés ici).
    const propres = new Set(["sommaire", "pageDeGarde", "bibliographie", "glossaire", "indexSources", "table"]);
    const filtre = { ...c, content: c.content.filter((n) => !propres.has((n as { type: string }).type)) };
    let lisible = true;
    try {
      NoeudPM.fromJSON(schema, filtre).check();
    } catch (e) {
      lisible = false;
      console.log(String(e).slice(0, 200));
    }
    ok(`modèle « ${m.titre} » : conforme au schéma`, lisible);
  }
}

console.log(echecs ? `\n${echecs} échec(s).` : "Tout est bon (Calame).");
process.exit(echecs ? 1 : 0);
