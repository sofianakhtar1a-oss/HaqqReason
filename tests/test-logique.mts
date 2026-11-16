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

// ---------------------------------------------------------------- Atelier d'image : calculs
{
  const { bornerRecadrage, tailleFinale, rayonCoins, poidsLisible, nomPourCapture, RECADRAGE_ENTIER, REGLAGES_PAR_DEFAUT, LARGEUR_MAX } = await import("../src/lib/client/image-atelier");
  const r = (x: number, y: number, largeur: number, hauteur: number) => bornerRecadrage({ x, y, largeur, hauteur });
  ok("recadrage : l'image entière reste l'image entière", JSON.stringify(r(0, 0, 1, 1)) === JSON.stringify(RECADRAGE_ENTIER));
  ok("recadrage : une zone qui sort à gauche est ramenée dedans", r(-0.4, 0, 0.5, 0.5).x === 0);
  ok("recadrage : une zone qui sort à droite est ramenée dedans", r(0.9, 0, 0.5, 0.5).x === 0.5);
  ok("recadrage : une zone plus grande que l'image est rabotée", r(0, 0, 3, 3).largeur === 1 && r(0, 0, 3, 3).hauteur === 1);
  ok("recadrage : il reste toujours une zone utilisable", r(0, 0, 0, 0).largeur >= 0.02 && r(0, 0, -5, -5).hauteur >= 0.02);

  const source = { largeur: 1600, hauteur: 900 };
  const regler = (p: Partial<typeof REGLAGES_PAR_DEFAUT>) => tailleFinale(source, { ...REGLAGES_PAR_DEFAUT, ...p });
  ok("taille : la largeur demandée est respectée", regler({ largeur: 800 }).largeur === 800);
  ok("taille : les proportions sont gardées", regler({ largeur: 800 }).hauteur === 450);
  ok("taille : on n'agrandit jamais au-delà de la source", regler({ largeur: 5000 }).largeur === 1600);
  ok("taille : la largeur maximale est tenue", tailleFinale({ largeur: 9000, hauteur: 9000 }, { ...REGLAGES_PAR_DEFAUT, largeur: 9000 }).largeur === LARGEUR_MAX);
  ok("taille : une largeur minuscule est relevée", regler({ largeur: 1 }).largeur === 80);
  const coupe = tailleFinale(source, { ...REGLAGES_PAR_DEFAUT, largeur: 1600, recadrage: { x: 0.25, y: 0.25, largeur: 0.5, hauteur: 0.5 } });
  ok("taille : le recadrage limite la largeur disponible", coupe.largeur === 800 && coupe.hauteur === 450);

  const { tailleFichier } = await import("../src/lib/client/image-atelier");
  const fichier = (p: Partial<typeof REGLAGES_PAR_DEFAUT>) => tailleFichier(source, { ...REGLAGES_PAR_DEFAUT, ...p });
  ok("fichier : sans cadre ni ombre, c'est la taille de l'image", JSON.stringify(fichier({ largeur: 800 })) === JSON.stringify({ largeur: 800, hauteur: 450 }));
  ok("fichier : le cadre s'ajoute des deux côtés", fichier({ largeur: 800, cadre: 6 }).largeur === 812);
  ok("fichier : l'ombre réserve de la place autour", fichier({ largeur: 800, ombre: true }).largeur === 832);
  ok("fichier : cadre et ombre se cumulent", fichier({ largeur: 800, cadre: 6, ombre: true }).hauteur === 494);

  ok("coins : 0 % ne donne aucun arrondi", rayonCoins({ largeur: 800, hauteur: 400 }, 0) === 0);
  ok("coins : l'arrondi suit le plus petit côté", rayonCoins({ largeur: 800, hauteur: 400 }, 10) === 40);
  ok("coins : l'arrondi est plafonné à la moitié", rayonCoins({ largeur: 800, hauteur: 400 }, 200) === 200);

  ok("poids : en octets", poidsLisible(900) === "900 o");
  ok("poids : en kilo-octets", poidsLisible(40960) === "40 ko");
  ok("poids : en méga-octets", poidsLisible(3 * 1024 * 1024) === "3.0 Mo");

  const nom = nomPourCapture(() => new Date(2026, 10, 15, 9, 5, 3));
  ok("nom de fichier : daté et lisible", nom === "capture-2026-11-15-090503.png", nom);
}

// ---------------------------------------------------------------- Filtre de politesse des contributions
{
  const { analyser, analyserContribution, colle, enMots, partDeMajuscules, libelleMotifs } = await import("../src/lib/contributions/filtre");
  const v = (t: string) => analyser(t).verdict;

  // Ce qui doit passer sans encombre, y compris le vocabulaire propre au sujet du site.
  const propres = [
    "Il manque un article sur la préservation du Coran à travers les manuscrits anciens.",
    "On pourrait citer le verset qui parle des singes et des porcs, et expliquer son contexte.",
    "La viande de porc est interdite : un article là-dessus serait utile.",
    "Le hadith du chien qui boit dans la mare mérite une explication.",
    "Un mécréant m'a posé cette question et je n'ai pas su répondre.",
    "Ce raisonnement demande une connaissance du contexte historique.",
    "La conclusion de l'article pourrait être renforcée par un autre argument.",
    "Il faudrait un concept clair de ce qu'est la prophétie.",
    "La salle de prière de ma ville organise des débats sur ce thème.",
  ];
  for (const texte of propres) ok(`passe : « ${texte.slice(0, 42)}… »`, v(texte) === "propre", analyser(texte).motifs.join(","));

  // Ce qui doit être refusé.
  const refuses = [
    "Vous êtes des connards et ce site ne vaut rien.",
    "C'est de la merde, franchement.",
    "ta gueule espèce de menteur",
    "p.u.t.a.i.n mais quel article inutile",
    "c o n n a r d",
    "Quelle grosse cooooonnerie ce raisonnement",
    "This is f u c k i n g wrong",
    "sale arabe, voilà ce que je pense",
    "l'enculé qui a écrit ça devrait avoir honte",
    "Ce type est un fils de pute",
  ];
  for (const texte of refuses) ok(`refusé : « ${texte.slice(0, 42)}… »`, v(texte) === "refuse", JSON.stringify(analyser(texte)));

  // Ce qui mérite un œil humain sans être une insulte.
  ok("un lien attend une relecture", analyser("Regarde cette page https://exemple.com pour la suite").motifs.includes("lien"));
  ok("une adresse e-mail attend une relecture", analyser("Écris-moi à salam@exemple.fr pour en discuter").motifs.includes("courriel"));
  ok("un numéro de téléphone attend une relecture", analyser("Appelle-moi au 06 12 34 56 78 si tu veux en parler").motifs.includes("telephone"));
  ok("un texte tout en majuscules attend une relecture", analyser("IL FAUT ABSOLUMENT PARLER DE CE SUJET MAINTENANT").motifs.includes("majuscules"));
  ok("un ton dur attend une relecture", analyser("Cet argument est stupide et ne tient pas debout").verdict === "a_revoir");
  ok("une ponctuation excessive attend une relecture", analyser("Il faut vraiment en parler !!!!!").motifs.includes("ponctuation"));
  ok("des caractères répétés attendent une relecture", analyser("Suuuuuuper idée pour le site").motifs.includes("repetition"));
  ok("un lien n'est jamais pris pour une insulte", analyser("https://exemple.com").verdict === "a_revoir");

  // Les pièces de la contribution comptent toutes.
  ok("le pseudo est filtré lui aussi", analyserContribution({ pseudo: "connard", titre: "Une idée très correcte", texte: "Un texte parfaitement poli et tranquille." }).verdict === "refuse");
  ok("le titre est filtré lui aussi", analyserContribution({ titre: "Quelle grosse connerie", texte: "Un texte parfaitement poli et tranquille." }).verdict === "refuse");
  ok("une contribution entièrement propre passe", analyserContribution({ pseudo: "Yacine", titre: "Un sujet sur les manuscrits", texte: "Il serait utile de parler des plus anciens manuscrits connus." }).verdict === "propre");
  ok("le plus grave l'emporte sur le reste", analyserContribution({ titre: "Va te faire voir", texte: "Regarde https://exemple.com" }).verdict === "refuse");

  // Les briques, prises une à une.
  ok("les lettres isolées sont recollées", colle("c o n n a r d") === "conard", colle("c o n n a r d"));
  ok("les lettres répétées sont ramenées à une", colle("puuutaaain") === "putain", colle("puuutaaain"));
  ok("les mots restent séparés", colle("donc on ardent") === "donc on ardent", colle("donc on ardent"));
  ok("les accents et les chiffres-lettres sont remis d'aplomb", enMots("Él3v4tion").trim() === "elevation", enMots("Él3v4tion"));
  ok("un texte court n'est jamais traité comme un cri", partDeMajuscules("OK") === 0);
  ok("les motifs se lisent en français", libelleMotifs(["lien", "majuscules"]) === "contient un lien, écrit en majuscules");
}

process.exit(e);
