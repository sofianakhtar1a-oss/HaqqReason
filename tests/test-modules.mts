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
ok("vocabulaire d'origine", resoudre("langues", null).themes?.length === 33);

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
ok("mot ajouté gardé, mot incomplet refusé", cv.themes![0].entrees[0].en === "niece" && cv.themes![0].entrees.length === 51);
ok("thème sans nom refusé, identifiant et icône assainis", cv.themes!.length === 34 && cv.themes![33].id === "nouveau-theme" && cv.themes![33].icone === "BookOpen");
ok("thème masqué absent pour les visiteurs", resoudre("langues", { ...cv, themes: cv.themes!.map((t, i) => (i === 1 ? { ...t, visible: false } : t)) }).themes!.length === 33);

// Nombres bornés, textes remplis.
ok("objectif borné", nettoyerContenu("langues", { textes: { objectif: "5000" } }).textes.objectif === "200");
ok("valeur égale à l'origine non stockée", Object.keys(nettoyerContenu("calame", { textes: { nouveau: "Nouveau" } }).textes).length === 0);
ok("remplissage des variables", remplir("{mots} mots, {themes} thèmes", { mots: 600, themes: 12 }) === "600 mots, 12 thèmes");
ok("contenu vide sûr pour tous les modules", (["accueil", "calame", "alambic", "langues"] as const).every((id) => resoudre(id, contenuVide()).textes && resoudre(id, nettoyerContenu(id, "n'importe quoi")).textes));

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
