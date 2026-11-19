// Le Portulan : les données du monde, les niveaux, les questions et leur arbitrage.
// Lancer : npm run test:monde
import { CONTINENTS, PAR_CODE, pays } from "../src/lib/monde/atlas";
import { CATEGORIES, IDS_CATEGORIES, TOUS_LES_TYPES, TYPES, typesDe } from "../src/lib/monde/categories";
import { PAYS } from "../src/lib/monde/donnees";
import { nouvelleGraine } from "../src/lib/monde/hasard";
import { NB_NIVEAUX, niveauxDe, QUESTIONS_PAR_NIVEAU } from "../src/lib/monde/niveaux";
import { fabriquer, juger, partieDeNiveau, questionMelangee, questionsDuel, QUESTIONS_PAR_DUEL } from "../src/lib/monde/quiz";
import { distance, jugerCapitale, jugerNom, normaliser } from "../src/lib/monde/texte";
import { existsSync, readFileSync } from "node:fs";
import { geoArea, geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { CARTE_LEGERE_URL, CARTE_ULTRA_URL, CARTE_URL } from "../src/lib/monde/donnees";

let echecs = 0;
const ok = (nom: string, cond: boolean, detail = "") => {
  if (!cond) {
    echecs++;
    console.log(`ECHEC ${nom}${detail ? ` — ${detail}` : ""}`);
  }
};

/* ---------- Les données ---------- */
ok("250 entités", PAYS.length === 250, String(PAYS.length));
ok("codes uniques", new Set(PAYS.map((p) => p.code)).size === PAYS.length);
const etats = PAYS.filter((p) => p.statut === "etat");
ok("193 États membres de l'ONU", etats.length === 193, String(etats.length));
ok("au moins 235 drapeaux propres", PAYS.filter((p) => p.quiz && p.drapeauPropre).length >= 235);
ok("au moins 235 capitales", PAYS.filter((p) => p.quiz && p.capitale).length >= 235);
for (const p of PAYS) {
  ok(`drapeau présent ${p.code}`, existsSync(new URL(`../public/monde/drapeaux/${p.drapeau}.svg`, import.meta.url)));
  ok(`nom ${p.code}`, p.nom.length > 1 && p.noms[0] === p.nom);
  if (p.drapeauDe) ok(`drapeau partagé ${p.code}`, PAR_CODE.get(p.drapeauDe)?.drapeau === p.drapeau);
}
// Quelques vérités sûres
const verifie = (code: string, capitale: string, continent: string) => {
  const p = pays(code);
  ok(`capitale ${code}`, p.capitale === capitale, String(p.capitale));
  ok(`continent ${code}`, p.continent === continent, p.continent);
};
verifie("fr", "Paris", "europe");
verifie("au", "Canberra", "oceanie");
verifie("ma", "Rabat", "afrique");
verifie("tr", "Ankara", "asie");
verifie("br", "Brasília", "amerique-sud");
verifie("ca", "Ottawa", "amerique-nord");
verifie("ci", "Yamoussoukro", "afrique");
verifie("kz", "Astana", "asie");
ok("Bulgarie à l'euro", pays("bg").monnaies[0].code === "EUR");
ok("Croatie à l'euro", pays("hr").monnaies[0].code === "EUR");
ok("Mayotte hisse le drapeau français", !pays("yt").drapeauPropre && pays("yt").drapeauDe === "fr");
ok("pas de capitale disputée en quiz", pays("il").capitale === null && pays("ps").capitale === null && pays("eh").capitale === null);

/* ---------- Les niveaux ---------- */
for (const c of IDS_CATEGORIES) {
  const n = niveauxDe(c);
  ok(`${c} : 15 niveaux`, n.length === NB_NIVEAUX);
  ok(`${c} : 20 pays au premier niveau`, n[0].length === QUESTIONS_PAR_NIVEAU);
  const tous = n.flat();
  ok(`${c} : chaque pays une seule fois`, new Set(tous).size === tous.length);
  ok(`${c} : tous les pays de la catégorie`, tous.length === PAYS.filter(CATEGORIES[c].eligible).length);
  ok(`${c} : niveaux équilibrés`, n.slice(1).every((x) => x.length >= 10 && x.length <= 20), n.map((x) => x.length).join(","));
}

/* ---------- Les questions ---------- */
let questions = 0;
for (const c of IDS_CATEGORIES) {
  for (let niveau = 1; niveau <= NB_NIVEAUX; niveau++) {
    for (let essai = 0; essai < 6; essai++) {
      const graine = nouvelleGraine();
      const partie = partieDeNiveau({ categorie: c, niveau, graine });
      questions += partie.length;
      ok(`${c} ${niveau} : 20 questions`, partie.length === QUESTIONS_PAR_NIVEAU, String(partie.length));
      ok(`${c} ${niveau} : pays tous différents`, new Set(partie.map((q) => q.cible)).size === partie.length);
      // Reproductible
      const encore = partieDeNiveau({ categorie: c, niveau, graine });
      ok(`${c} ${niveau} : même graine, même partie`, JSON.stringify(encore) === JSON.stringify(partie));
      for (const q of partie) {
        const def = TYPES[q.type];
        ok(`${q.type} dans ${c}`, def.categorie === c);
        if (q.nb === 0) {
          ok(`${q.type} sans choix`, def.reponse === "ecrit" || def.reponse === "clic");
          continue;
        }
        const ids = q.options.map((o) => o.id);
        ok(`${q.type} ${q.cible} : choix distincts`, new Set(ids).size === ids.length, ids.join(","));
        ok(`${q.type} ${q.cible} : ${q.nb} choix`, ids.length === 4 || ids.length === 6, String(ids.length));
        ok(`${q.type} ${q.cible} : la réponse est proposée`, ids.includes(q.attendu));
        // Une seule bonne réponse parmi les choix.
        const justes = q.options.filter((o) => juger(q.type, q.cible, o.id) === "juste");
        ok(`${q.type} ${q.cible} : une seule bonne réponse`, justes.length === 1, justes.map((o) => o.id).join(","));
        const textes = q.options.map((o) => o.texte ?? o.code ?? o.id);
        ok(`${q.type} ${q.cible} : textes distincts`, new Set(textes.map((t) => t.toLowerCase())).size === textes.length, textes.join(" | "));
        if (def.reponse === "drapeau") {
          const fichiers = q.options.map((o) => pays(o.code!).drapeau);
          ok(`${q.type} ${q.cible} : drapeaux distincts`, new Set(fichiers).size === fichiers.length);
        }
      }
    }
  }
}
ok("des milliers de questions", questions > 4000, String(questions));

// Chaque méthode, imposée, donne une partie complète.
for (const t of TOUS_LES_TYPES) {
  const c = TYPES[t].categorie;
  for (const niveau of [1, 8, 15]) {
    const partie = partieDeNiveau({ categorie: c, niveau, graine: 42 + niveau, methode: t });
    ok(`méthode ${t} niveau ${niveau}`, partie.length === QUESTIONS_PAR_NIVEAU && partie.every((q) => q.type === t), String(partie.length));
  }
}
ok("méthodes par catégorie", IDS_CATEGORIES.every((c) => typesDe(c).length >= 3));

// Le tour du monde
for (let i = 0; i < 300; i++) ok("question mélangée", questionMelangee(i * 7919, 15) !== null);

/* ---------- Les duels ---------- */
for (const mode of [...IDS_CATEGORIES, "melange"] as const) {
  for (let i = 0; i < 25; i++) {
    const graine = nouvelleGraine();
    const q = questionsDuel(graine, mode);
    ok(`duel ${mode} : 10 questions`, q.length === QUESTIONS_PAR_DUEL);
    ok(`duel ${mode} : reproductible`, JSON.stringify(q) === JSON.stringify(questionsDuel(graine, mode)));
    ok(`duel ${mode} : 4 choix, pas d'écrit`, q.every((x) => x.nb === 4));
  }
}

/* ---------- L'arbitrage ---------- */
const q1 = fabriquer(1, "fr", { types: ["drapeau-nom"], niveau: 1 })!;
ok("drapeau → nom : juste", juger(q1.type, "fr", "fr") === "juste");
ok("drapeau → nom : faux", juger(q1.type, "fr", "de") === "faux");
ok("continent juste", juger("pays-continent", "ru", "europe") === "juste" && juger("pays-continent", "ru", "asie") === "juste");
ok("continent faux", juger("pays-continent", "ru", "afrique") === "faux");
ok("monnaie juste", juger("pays-monnaie", "fr", "EUR") === "juste");
ok("monnaie faux", juger("pays-monnaie", "fr", "USD") === "faux");
ok("réponse inconnue", juger("drapeau-nom", "fr", "zz") === "faux" && juger("drapeau-nom", "zz", "fr") === "faux");

/* ---------- Les réponses écrites ---------- */
ok("normaliser", normaliser("  Côte-d'Ivoire ") === normaliser("cote d ivoire") && normaliser("St-Marin") === normaliser("Saint Marin"));
ok("article", normaliser("La Havane") === normaliser("havane"));
ok("distance", distance("mali", "mlai") === 1 && distance("iran", "irak") === 1);
ok("nom exact", jugerNom("france", pays("fr")) === "juste");
ok("nom sans accent", jugerNom("etats unis", pays("us")) === "juste");
ok("alias", jugerNom("USA", pays("us")) === "juste" && jugerNom("Myanmar", pays("mm")) === "juste");
ok("petite faute", jugerNom("Allemagen", pays("de")) === "presque");
ok("Irak n'est pas Iran", jugerNom("Irak", pays("ir")) === "faux");
ok("Niger n'est pas Nigeria", jugerNom("Niger", pays("ng")) === "faux");
ok("Gambie n'est pas Zambie", jugerNom("Gambie", pays("zm")) === "faux");
ok("Guinée n'est pas Guinée-Bissau", jugerNom("Guinée", pays("gw")) === "faux");
ok("capitale", jugerCapitale("pekin", pays("cn")) === "juste" && jugerCapitale("Beijing", pays("cn")) === "juste");
ok("capitale fautive", jugerCapitale("Ouagadougo", pays("bf")) === "presque");
ok("capitale d'un autre", jugerCapitale("Lagos", pays("ng")) === "faux" && jugerCapitale("Bamako", pays("ne")) === "faux");
ok("La Paz pour la Bolivie", jugerCapitale("La Paz", pays("bo")) === "juste");
ok("vide", jugerNom("", pays("fr")) === "faux");
ok("continents nommés", CONTINENTS.length === 7);

/* ---------- La carte : chaque lieu dans son pays (positions de l'ONU pour les territoires disputés) ---------- */
for (const url of [CARTE_URL, CARTE_LEGERE_URL, CARTE_ULTRA_URL]) {
  const topo = JSON.parse(readFileSync(new URL(`../public${url}`, import.meta.url), "utf8")) as Topology;
  const objet = Object.values(topo.objects)[0] as GeometryCollection;
  const formes = objet.geometries.map((g) => ({ code: g.id as string | undefined, forme: feature(topo, g) }));
  const chez = (lon: number, lat: number) => formes.filter((f) => geoContains(f.forme, [lon, lat])).map((f) => f.code ?? "?").join(",") || "mer";
  const lieux: [string, number, number, string][] = [
    ["Simferopol", 34.1, 44.95, "ua"], ["Bakhtchyssaraï", 33.86, 44.75, "ua"], ["Kyiv", 30.52, 50.45, "ua"], ["Moscou", 37.62, 55.75, "ru"],
    ["Katzrin (Golan)", 35.69, 32.99, "sy"], ["Damas", 36.29, 33.51, "sy"], ["Tel-Aviv", 34.78, 32.08, "il"], ["Tibériade", 35.53, 32.79, "il"],
    ["Laâyoune", -13.2, 27.15, "eh"], ["Aousserd", -14.32, 22.55, "eh"], ["Tifariti", -10.57, 26.15, "eh"], ["Rabat", -6.84, 34.02, "ma"],
    ["Tan-Tan", -11.1, 28.44, "ma"], ["Paris", 2.35, 48.86, "fr"], ["Ramallah", 35.2, 31.9, "ps"], ["Pristina", 21.17, 42.66, "xk"],
  ];
  for (const [nom, lon, lat, code] of lieux) ok(`${url} : ${nom} est en ${code}`, chez(lon, lat) === code, chez(lon, lat));
  const retournees = formes.filter((f) => geoArea(f.forme) > 2 * Math.PI).map((f) => f.code);
  ok(`${url} : aucun pays retourné`, retournees.length === 0, retournees.join(" "));
}

console.log(echecs ? `\n${echecs} échec(s).` : `Tout est bon (${questions} questions de niveau vérifiées).`);
process.exit(echecs ? 1 : 0);
