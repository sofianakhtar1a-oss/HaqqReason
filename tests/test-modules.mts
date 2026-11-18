/* Tests du contenu modifiable des modules (mode créateur). */
import { contenuVide, listeComplete, MODULES, nettoyerContenu, remplir, resoudre, themesDOrigine } from "../src/lib/modules/modules";

let e = 0;
const ok = (nom: string, cond: boolean, detail?: unknown) => {
  console.log(`${cond ? "OK" : "ÉCHEC"} ${nom}`);
  if (!cond) {
    e++;
    if (detail !== undefined) console.log("   ", JSON.stringify(detail).slice(0, 400));
  }
};

// Sans rien de publié : exactement les textes d'origine.
const r0 = resoudre("alambic", null);
ok("textes d'origine sans publication", r0.textes["tete.titre"] === "L'Alambic" && r0.listes.outils.length === 5 && r0.listes.outils[0].valeurs.nom === "Convertir");
ok("vocabulaire d'origine", resoudre("langues", null).themes?.length === 52);

// Un texte modifié, un outil renommé, déplacé, un autre masqué, un troisième supprimé.
const c = nettoyerContenu("alambic", {
  textes: { "tete.titre": "Le Laboratoire", "badge.local": "L'Alambic", inconnu: "x" },
  listes: { outils: [{ id: "transcrire", visible: true, valeurs: { nom: "Écouter" } }, { id: "convertir", visible: false, valeurs: {} }, { id: "pirate", visible: true, valeurs: {} }] },
  corbeille: [{ id: "a", type: "element", liste: "outils", libelle: "Fusionner", le: 1, position: 1, donnees: { id: "fusionner", visible: true, valeurs: {} } }],
});
ok("clé inconnue et élément inconnu refusés", !("inconnu" in c.textes) && !c.listes.outils.some((x) => x.id === "pirate"));
const r1 = resoudre("alambic", c);
ok("texte modifié publié", r1.textes["tete.titre"] === "Le Laboratoire");
ok(
  "ordre, nom, masquage et corbeille respectés",
  r1.listes.outils.map((o) => o.id).join() === "transcrire,decouper,proteger" && r1.listes.outils[0].valeurs.nom === "Écouter",
  r1.listes.outils,
);
ok("un élément d'origine absent de la liste revient à la fin (ajout au code)", listeComplete(MODULES.alambic.listes[0], c).map((x) => x.id).join() === "transcrire,convertir,decouper,proteger");

// Le vocabulaire : un mot ajouté, un mot vide refusé, un thème au nom manquant refusé.
const themes = themesDOrigine();
themes[0] = { ...themes[0], entrees: [{ id: "famille:mot-ab12", en: "niece", fr: "nièce", nature: "nom", niveau: "A2", api: "/niːs/", exEn: "", exFr: "" }, { id: "x:y", en: "", fr: "vide", nature: "nom", niveau: "A1", api: "", exEn: "", exFr: "" }, ...themes[0].entrees] };
const cv = nettoyerContenu("langues", { themes: [...themes, { id: "", nom: "" }, { id: "Nouveau Thème!", nom: "Mon thème", icone: "Pirate", entrees: [] }] });
ok("mot ajouté gardé, mot incomplet refusé", cv.themes![0].entrees[0].en === "niece" && cv.themes![0].entrees.length === themesDOrigine()[0].entrees.length + 1);
ok("thème sans nom refusé, identifiant et icône assainis", cv.themes!.length === 53 && cv.themes![52].id === "nouveau-theme" && cv.themes![52].icone === "BookOpen");
ok("thème masqué absent pour les visiteurs", resoudre("langues", { ...cv, themes: cv.themes!.map((t, i) => (i === 1 ? { ...t, visible: false } : t)) }).themes!.length === 52);

// Nombres bornés, textes remplis.
ok("objectif borné", nettoyerContenu("langues", { textes: { objectif: "5000" } }).textes.objectif === "200");
ok("valeur égale à l'origine non stockée", Object.keys(nettoyerContenu("calame", { textes: { nouveau: "Nouveau" } }).textes).length === 0);
ok("remplissage des variables", remplir("{mots} mots, {themes} thèmes", { mots: 600, themes: 12 }) === "600 mots, 12 thèmes");
ok("contenu vide sûr pour tous les modules", (["accueil", "calame", "alambic", "langues"] as const).every((id) => resoudre(id, contenuVide()).textes && resoudre(id, nettoyerContenu(id, "n'importe quoi")).textes));

// Vocabulaire publié puis code enrichi : les mots ajoutés au code apparaissent, les retraits volontaires restent retirés.
const origine = themesDOrigine();
const totalOrigine = origine.reduce((n, t) => n + t.entrees.length, 0);
const fige = origine.slice(0, 5).map((t) => ({ ...t, entrees: t.entrees.slice(0, 10) }));
const publieAncien = nettoyerContenu("langues", { themes: fige });
const vu = resoudre("langues", publieAncien).themes!;
ok("mots et thèmes ajoutés au code depuis la publication visibles", vu.length === origine.length && vu.reduce((n, t) => n + t.entrees.length, 0) === totalOrigine, `${vu.length} thèmes, ${vu.reduce((n, t) => n + t.entrees.length, 0)} mots`);
const motRetire = origine[0].entrees[0].id;
const avecRetrait = nettoyerContenu("langues", { themes: [{ ...origine[0], entrees: origine[0].entrees.slice(1) }], retires: [motRetire, origine[1].id, "pas valable !"] });
const vu2 = resoudre("langues", avecRetrait).themes!;
ok("mot retiré exprès absent, même corbeille vide", !vu2[0].entrees.some((x) => x.id === motRetire));
ok("thème retiré exprès absent", !vu2.some((t) => t.id === origine[1].id) && vu2.length === origine.length - 1);
ok("identifiants de retrait assainis", avecRetrait.retires?.length === 2);
ok("modification du créateur prioritaire sur le code", resoudre("langues", nettoyerContenu("langues", { themes: [{ ...origine[0], nom: "Ma famille" }] })).themes![0].nom === "Ma famille");
ok("carte du Truchement : nombres remplis", remplir(resoudre("accueil", null).listes.cartes.find((x) => x.id === "langues")!.valeurs.texte, { mots: "23 902", themes: 52 }).includes("23 902 mots en 52 thèmes"));

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
