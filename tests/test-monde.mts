// Le Portulan : les données du monde, les niveaux, les questions et leur arbitrage.
// Lancer : npm run test:monde
import { CONTINENTS, PAR_CODE, pays } from "../src/lib/monde/atlas";
import { CATEGORIES, CATEGORIES_CLASSIQUES, IDS_CATEGORIES, REPONSES_LIBRES, TOUS_LES_TYPES, TYPES, typesDe } from "../src/lib/monde/categories";
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
          ok(`${q.type} sans choix`, REPONSES_LIBRES.includes(def.reponse));
          // La bonne réponse (quand on peut l'écrire d'avance) est jugée juste.
          if (def.reponse === "coloriage" || def.reponse === "classer") ok(`${q.type} ${q.cible} : la réponse attendue est juste`, juger(q.type, q.cible, q.attendu) === "juste", q.attendu);
          if (def.reponse === "classer") ok(`${q.type} ${q.cible} : quatre pays à ranger`, q.codes?.length === 4 && q.codes.includes(q.cible) && q.codes.slice().sort().join() === q.attendu.split(",").sort().join());
          continue;
        }
        const ids = q.options.map((o) => o.id);
        ok(`${q.type} ${q.cible} : choix distincts`, new Set(ids).size === ids.length, ids.join(","));
        ok(`${q.type} ${q.cible} : ${q.nb} choix`, ids.length === 4 || ids.length === 6 || (ids.length === 2 && (def.reponse === "vraifaux" || q.type === "pays-conduite")), String(ids.length));
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
ok("méthodes par catégorie", CATEGORIES_CLASSIQUES.every((c) => typesDe(c).length >= 4) && IDS_CATEGORIES.every((c) => typesDe(c).length >= 2));

// Le tour du monde
for (let i = 0; i < 300; i++) ok("question mélangée", questionMelangee(i * 7919, 15) !== null);

/* ---------- Les duels ---------- */
for (const mode of [...CATEGORIES_CLASSIQUES, "melange"] as const) {
  for (let i = 0; i < 25; i++) {
    const graine = nouvelleGraine();
    const q = questionsDuel(graine, mode);
    ok(`duel ${mode} : 10 questions`, q.length === QUESTIONS_PAR_DUEL);
    ok(`duel ${mode} : reproductible`, JSON.stringify(q) === JSON.stringify(questionsDuel(graine, mode)));
    ok(`duel ${mode} : 4 choix, pas d'écrit`, q.every((x) => x.nb === 4));
    ok(`duel ${mode} : seulement les méthodes d'origine`, q.every((x) => TYPES[x.type].duel !== false));
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
// Les nouvelles méthodes
ok("placer : sur Rabat", juger("capitale-placer", "ma", "34.01,-6.83") === "juste");
ok("placer : à Casablanca (90 km), c'est juste", juger("capitale-placer", "ma", "33.57,-7.59") === "juste");
ok("placer : à Agadir (480 km), presque", juger("capitale-placer", "ma", "30.42,-9.60") === "presque");
ok("placer : à Paris, faux", juger("capitale-placer", "ma", "48.85,2.35") === "faux" && juger("capitale-placer", "ma", "x,y") === "faux" && juger("capitale-placer", "ma", "95,0") === "faux");
ok("vrai ou faux : drapeau", juger("drapeau-vrai-faux", "fr", "vrai:fr") === "juste" && juger("drapeau-vrai-faux", "fr", "faux:fr") === "faux" && juger("drapeau-vrai-faux", "fr", "faux:it") === "juste" && juger("drapeau-vrai-faux", "fr", "vrai:it") === "faux");
ok("vrai ou faux : la Guyane hisse le drapeau français", juger("drapeau-vrai-faux", "fr", "vrai:gf") === "juste");
ok("vrai ou faux : capitale", juger("capitale-vrai-faux", "au", "vrai:au") === "juste" && juger("capitale-vrai-faux", "au", "vrai:nz") === "faux" && juger("capitale-vrai-faux", "au", "faux:nz") === "juste" && juger("capitale-vrai-faux", "au", "peut-etre:nz") === "faux");
ok("couleur qui manque", juger("drapeau-couleur", "fr", "bleu") === "juste" && juger("drapeau-couleur", "fr", "vert") === "faux");
ok("coloriage", juger("drapeau-colorie", "fr", "bleu,blanc,rouge") === "juste" && juger("drapeau-colorie", "fr", "bleu,blanc,vert") === "presque" && juger("drapeau-colorie", "fr", "vert,vert,vert") === "faux" && juger("drapeau-colorie", "fr", "bleu,blanc") === "faux");
ok("ranger", juger("classer-population", "us", "us,fr,be,lu") === "juste" && juger("classer-population", "us", "fr,us,be,lu") === "faux" && juger("classer-population", "us", "us,fr,fr,lu") === "faux");
ok("fuseau de Paris", juger("fuseau-heure", "fr", "0") === "juste" && juger("fuseau-heure", "fr", "60") === "faux");
ok("voisins", juger("voisin-de", "fr", "de") === "juste" && juger("voisin-de", "fr", "pl") === "faux");
ok("pas voisin", juger("pas-voisin", "fr", "pl") === "juste" && juger("pas-voisin", "fr", "de") === "faux" && juger("pas-voisin", "fr", "fr") === "faux");
ok("nombre de voisins", juger("nb-voisins", "fr", String(pays("fr").voisins.length)) === "juste");
ok("habitants", juger("pays-gentile", "ma", "Marocain") === "juste" && juger("gentile-pays", "ma", "ma") === "juste" && juger("gentile-pays", "ma", "dz") === "faux");
ok("indicatif", juger("pays-indicatif", "ma", "+212") === "juste" && juger("indicatif-pays", "ma", "ma") === "juste");
ok("conduite", juger("pays-conduite", "gb", "gauche") === "juste" && juger("pays-conduite", "gb", "droite") === "faux");
ok("langue", juger("pays-langue", "ma", "arabe") === "juste" && juger("pays-langue", "ma", "anglais") === "faux");
ok("sommet partagé", juger("sommet-pays", "fr", "it") === "juste" && juger("sommet-pays", "fr", "es") === "faux");

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

/* ---------- Les fiches enrichies ---------- */
{
  const { RECITS } = await import("../src/lib/monde/recits");
  const { ORGANISATIONS } = await import("../src/lib/monde/organisations");
  const geo = await import("../src/lib/monde/geo");
  const enQuiz = PAYS.filter((p) => p.quiz);
  for (const p of enQuiz) {
    ok(`nom anglais ${p.code}`, p.nomEn.length > 1);
    ok(`code ISO ${p.code}`, /^[A-Z]{3}$/.test(p.iso3), p.iso3);
    if (p.capitale) ok(`capitale située ${p.code}`, Boolean(p.capLatLng));
    if (p.capLatLng) ok(`capitale proche du pays ${p.code}`, geo.distanceKm(p.capLatLng, p.latlng) < 4000, String(Math.round(geo.distanceKm(p.capLatLng, p.latlng))));
    if (p.fuseau) ok(`fuseau valide ${p.code}`, geo.heureLocale(p.fuseau) !== "", p.fuseau);
    if (p.indicatif) ok(`indicatif ${p.code}`, /^\+\d{1,3}( \d{1,4})*$/.test(p.indicatif), p.indicatif);
    for (const o of p.orgs ?? []) ok(`organisation ${p.code} ${o}`, o in ORGANISATIONS);
    if (p.statut !== "territoire") ok(`anecdote ${p.code}`, Boolean(RECITS[p.code]?.anecdote));
    for (const v of Object.values(RECITS[p.code] ?? {})) {
      const textes = (Array.isArray(v) ? v.flat() : [v]).filter((t): t is string => typeof t === "string");
      for (const t of textes) ok(`typographie ${p.code}`, !/["]|\s{2}|^\s|\s$/.test(t) && !/ [,.]( |$)/.test(t.replace(/ \.[a-z]{2,3}\b/g, "")), t);
    }
  }
  const membres = (o: string) => PAYS.filter((p) => p.orgs?.includes(o as never)).length;
  ok("UE : 27", membres("ue") === 27, String(membres("ue")));
  ok("Ligue arabe : 22", membres("la") === 22, String(membres("la")));
  ok("Union africaine : 54 + 1", membres("ua") === 54, String(membres("ua")));
  ok("gentilé de la France", pays("fr").gentile?.[1] === "Française");
  ok("indicatif du Maroc", pays("ma").indicatif === "+212");
  ok("on roule à gauche au Japon", pays("jp").conduite === "gauche");
  ok("on roule à droite en France", pays("fr").conduite === "droite");
  ok("Mont Blanc", pays("fr").sommet?.[0] === "Mont Blanc");
  ok("le nom arabe du Mexique", pays("mx").nomAr === "المكسيك");
  // La qibla : depuis Rabat, plein est (un peu au sud) ; depuis Jakarta, vers l'ouest-nord-ouest.
  const rabat = geo.qibla(pays("ma"));
  ok("qibla depuis Rabat", rabat.cap > 88 && rabat.cap < 98 && rabat.km > 4700 && rabat.km < 4800, `${rabat.cap} ${rabat.km}`);
  const jakarta = geo.qibla(pays("id"));
  ok("qibla depuis Jakarta", jakarta.cap > 290 && jakarta.cap < 300, String(jakarta.cap));
  ok("Paris – La Mecque", Math.abs(geo.distanceKm(pays("fr").capLatLng!, geo.KAABA) - 4500) < 60, String(geo.distanceKm(pays("fr").capLatLng!, geo.KAABA)));
  ok("point cardinal", geo.pointCardinal(92) === "est" && geo.pointCardinal(350) === "nord" && geo.pointCardinal(225) === "sud-ouest");
  const route = geo.grandCercle([48.85, 2.35], [21.42, 39.83], 10);
  ok("grand cercle", route.length === 11 && Math.abs(route[10][0] - 21.42) < 1e-6 && Math.abs(route[0][1] - 2.35) < 1e-6);
  ok("décalage", geo.formatDecalage(60) === "UTC+1" && geo.formatDecalage(-210) === "UTC−3:30" && geo.formatDecalage(0) === "UTC" && geo.formatDecalage(345) === "UTC+5:45");
  ok("décalage de l'Inde", geo.decalageMinutes("Asia/Kolkata") === 330);
  ok("durée de vol", geo.dureeVol(850) === "1 h 30" && geo.dureeVol(100) === "35 min");
  ok("densité", geo.formatDensite(1000, 10) === "100 hab./km²");
}

/* ---------- Le puzzle du drapeau ---------- */
{
  ok("puzzle : la France résolue", juger("drapeau-puzzle", "fr", "0,1,2,3,4,5") === "juste");
  // abcabc : les deux pièces bleues (0 et 3) sont interchangeables.
  ok("puzzle : deux pièces identiques échangées", pays("fr").decoupe === "abcabc" && juger("drapeau-puzzle", "fr", "3,1,2,0,4,5") === "juste", pays("fr").decoupe);
  ok("puzzle : une vraie erreur", juger("drapeau-puzzle", "fr", "1,0,2,3,4,5") === "faux");
  ok("puzzle : réponse illisible", juger("drapeau-puzzle", "fr", "0,0,2,3,4,5") === "faux" && juger("drapeau-puzzle", "fr", "0,1,2") === "faux" && juger("drapeau-puzzle", "fr", "a,b,c,d,e,f") === "faux");
  ok("puzzle : au moins 150 drapeaux", PAYS.filter((p) => TYPES["drapeau-puzzle"].eligible(p)).length >= 150);
}

/* ---------- Les cabinets ---------- */
{
  const cab = await import("../src/lib/monde/cabinets");
  const { lireReponse, evaluer } = await import("../src/lib/monde/points");
  const attendus: Record<string, number> = { "fr-regions": 18, "fr-departements": 101, "us-etats": 50, "ca-provinces": 13, "ma-regions": 12, "dz-wilayas": 69, "drapeaux-plus": 15 };
  for (const c of cab.CABINETS) {
    ok(`${c.id} : ${attendus[c.id]} éléments`, c.elements.length === attendus[c.id], String(c.elements.length));
    const niveaux = cab.niveauxCabinet(c);
    ok(`${c.id} : tous les éléments dans les niveaux`, niveaux.flat().length === c.elements.length);
    ok(`${c.id} : des niveaux ni trop petits ni trop grands`, niveaux.every((n) => n.length >= Math.min(5, c.elements.length) && n.length <= 12), niveaux.map((n) => n.length).join(","));
    for (const e of c.elements) {
      for (const m of cab.methodesDe(c)) {
        const def = cab.METHODES[m];
        if (!def.eligible(e)) continue;
        for (let g = 1; g <= 3; g++) {
          const q = cab.fabriquerCabinet(c.id, e.id, m, g * 7919 + e.rang);
          ok(`${c.id}/${e.id}/${m} : une question`, q !== null);
          if (!q) continue;
          if (def.reponse === "ecrit") {
            const bonne = def.ecrit === "num" ? e.num! : def.ecrit === "chef" ? e.chef! : e.nom;
            ok(`${c.id}/${e.id}/${m} : la bonne réponse écrite`, cab.jugerCabinet(c.id, m, e.id, bonne) === "juste", bonne);
            const autre = c.elements.find((x) => x.id !== e.id && (def.ecrit === "num" ? x.num : def.ecrit === "chef" ? x.chef : true));
            if (autre) {
              const faux = def.ecrit === "num" ? autre.num! : def.ecrit === "chef" ? autre.chef! : autre.nom;
              ok(`${c.id}/${e.id}/${m} : un autre est faux`, cab.jugerCabinet(c.id, m, e.id, faux) === "faux", faux);
            }
            continue;
          }
          ok(`${c.id}/${e.id}/${m} : quatre choix distincts`, q.options.length === 4 && new Set(q.options).size === 4 && new Set(q.options.map((o) => cab.texteOption(q, o))).size === 4, q.options.join(","));
          const justes = q.options.filter((o) => cab.jugerCabinet(c.id, m, e.id, o) === "juste");
          ok(`${c.id}/${e.id}/${m} : une seule bonne réponse`, justes.length === 1, justes.join(","));
          if (m === "ville-nom") ok(`${c.id}/${e.id} : la ville est la sienne`, Boolean(q.ville && e.villes?.includes(q.ville)));
        }
      }
    }
    for (let n = 1; n <= niveaux.length; n++) {
      const qs = cab.partieCabinet({ cabinet: c.id, niveau: n, graine: 1000 + n });
      ok(`${c.id} niveau ${n} : assez de questions`, qs.length >= Math.min(8, niveaux[n - 1].length), String(qs.length));
      ok(`${c.id} niveau ${n} : pas deux fois la même`, new Set(qs.map((q) => `${q.methode}:${q.cible}`)).size === qs.length);
      for (const m of cab.methodesDe(c)) {
        const seule = cab.partieCabinet({ cabinet: c.id, niveau: n, graine: 7, methode: m });
        ok(`${c.id} niveau ${n} ${m} : la méthode imposée`, seule.every((q) => q.methode === m));
      }
    }
  }
  const dep = (id: string) => cab.element("fr-departements", id)!;
  ok("Mayenne : 53, Laval", dep("53").nom === "Mayenne" && dep("53").chef === "Laval" && dep("53").groupe === "pdl");
  ok("Val-d'Oise : Pontoise, et Cergy accepté", cab.jugerCabinet("fr-departements", "ecrire-chef", "95", "Cergy") === "juste" && cab.jugerCabinet("fr-departements", "ecrire-chef", "95", "pontoise") === "juste");
  ok("2A s'écrit sans majuscule", cab.jugerCabinet("fr-departements", "ecrire-num", "2a", "2a") === "juste" && cab.jugerCabinet("fr-departements", "ecrire-num", "2a", "2B") === "faux");
  ok("01 s'écrit 1", cab.jugerCabinet("fr-departements", "ecrire-num", "01", "1") === "juste");
  ok("Paris n'a pas de question de préfecture", !cab.METHODES["nom-chef"].eligible(dep("75")));
  const w = (n: number) => cab.element("dz-wilayas", String(n))!;
  ok("wilayas : 16 Alger, 31 Oran, 58 El Meniaa", w(16).nom === "Alger" && w(31).nom === "Oran" && w(58).nom === "El Meniaa");
  ok("wilayas de 2026 (décret 26-206)", w(59).nom === "Aflou" && w(60).nom === "Barika" && w(63).nom === "El Aricha" && w(68).nom === "Bou Saâda" && w(69).nom === "El Abiodh Sidi Cheikh");
  ok("wilaya : Brika accepté pour Barika", cab.jugerCabinet("dz-wilayas", "ecrire-nom", "60", "Brika") === "juste");
  ok("États : Sacramento", cab.element("us-etats", "ca")!.chef === "Sacramento" && cab.jugerCabinet("us-etats", "ecrire-chef", "ca", "sacramento") === "juste");
  ok("États : les nouveaux drapeaux du Minnesota et de l'Utah", Boolean(cab.element("us-etats", "mn")!.drapeau && cab.element("us-etats", "ut")!.drapeau));
  ok("Canada : St. John's", cab.jugerCabinet("ca-provinces", "ecrire-chef", "nl", "Saint-Jean de Terre-Neuve") === "juste" && cab.jugerCabinet("ca-provinces", "ecrire-chef", "nl", "st johns") === "juste");
  ok("Maroc : Drâa-Tafilalet, Errachidia", cab.element("ma-regions", "dt")!.chef === "Errachidia");
  ok("Maroc : l'avertissement", Boolean(cab.cabinet("ma-regions").avertissement?.includes("Nations unies")));
  // Le serveur : les réponses de cabinet sont lues, jugées, et leur clé tient dans la base.
  const lue = lireReponse({ cabinet: "fr-departements", type: "nom-num", cible: "53", reponse: "53", nb: 4 });
  ok("serveur : une réponse de cabinet lue", lue !== null && lue.cabinet === "fr-departements");
  ok("serveur : jugée juste", lue !== null && evaluer(lue).resultat === "juste" && evaluer(lue).base === 10);
  ok("serveur : cabinet inconnu refusé", lireReponse({ cabinet: "xx-yy", type: "nom-num", cible: "53", reponse: "53", nb: 4 }) === null);
  ok("serveur : méthode étrangère refusée", lireReponse({ cabinet: "dz-wilayas", type: "nom-chef", cible: "16", reponse: "16", nb: 4 }) === null);
  ok("serveur : élément inconnu refusé", lireReponse({ cabinet: "us-etats", type: "nom-chef", cible: "zz", reponse: "zz", nb: 4 }) === null);
  let plusLongue = 0;
  for (const c of cab.CABINETS) for (const m of cab.methodesDe(c)) for (const e of c.elements) plusLongue = Math.max(plusLongue, `${m}:${c.id}:${e.id}`.length);
  ok("serveur : les clés tiennent en 40 caractères", plusLongue <= 40, String(plusLongue));
  ok("serveur : une réponse de pays toujours lue", lireReponse({ type: "drapeau-nom", cible: "fr", reponse: "fr", nb: 4 }) !== null);
  // Les drapeaux des cabinets existent bien.
  for (const c of cab.CABINETS) for (const e of c.elements) if (e.drapeau) ok(`${c.id}/${e.id} : drapeau présent`, existsSync(`public/monde/emblemes/${e.drapeau}`));
}

/* ---------- Mieux apprendre et l'histoire ---------- */
{
  const ap = await import("../src/lib/monde/apprendre");
  const hi = await import("../src/lib/monde/histoire");
  for (const piege of ap.PIEGES) for (const c of piege.codes) ok(`piège : ${c} existe`, PAR_CODE.has(c), piege.texte.slice(0, 30));
  for (const [c, t] of Object.entries(ap.PIEGES_CAPITALES)) ok(`piège de capitale : ${c}`, Boolean(PAR_CODE.get(c)?.capitale && t.includes(PAR_CODE.get(c)!.capitale!)), t);
  ok("routes : l'Afrique des 54", ap.paysDuTheme("afrique").length === 54, String(ap.paysDuTheme("afrique").length));
  ok("routes : les 27 de l'Union", ap.paysDuTheme("ue").length === 27, String(ap.paysDuTheme("ue").length));
  ok("routes : la Ligue arabe", ap.paysDuTheme("la").length === 22, String(ap.paysDuTheme("la").length));
  for (const t of ap.THEMES) ok(`route ${t.id} : assez de pays`, ap.paysDuTheme(t.id).length >= 8, String(ap.paysDuTheme(t.id).length));
  ok("mentions", ap.mention(20) === "Félicitations du jury" && ap.mention(16) === "Très bien" && ap.mention(10) === "Passable" && ap.mention(9) === "À repasser");
  for (const type of ["drapeau-nom", "pays-capitale", "pays-continent", "monnaie-pays", "pays-monnaie"] as const) {
    if (!(type in TYPES)) continue;
    const q = fabriquer(42, "fr", { types: [type], niveau: 5 }, type);
    if (q) ok(`indice ${type}`, ap.indiceDe(q, q.options[0]?.texte).length > 5);
  }
  ok("géographes : identifiants uniques", new Set(hi.GEOGRAPHES.map((g) => g.id)).size === hi.GEOGRAPHES.length);
  for (const v of hi.VOYAGES) for (const e of v.etapes) ok(`voyage ${v.id} : ${e.lieu}`, Math.abs(e.latlng[0]) <= 90 && Math.abs(e.latlng[1]) <= 180);
  ok("cartographie : douze jalons", hi.CARTOGRAPHIE.length === 12);
}

/* ---------- Les défis et la collection ---------- */
{
  const de = await import("../src/lib/monde/defis");
  const co = await import("../src/lib/monde/collection");
  const j1 = de.questionsDefi("jour", "2026-11-19");
  const j2 = de.questionsDefi("jour", "2026-11-19");
  ok("défi : dix questions", j1.length === 10, String(j1.length));
  ok("défi : les mêmes pour tout le monde", JSON.stringify(j1) === JSON.stringify(j2));
  ok("défi : un autre jour, d'autres questions", JSON.stringify(de.questionsDefi("jour", "2026-11-20")) !== JSON.stringify(j1));
  ok("défi : dix pays différents", new Set(j1.map((q) => q.cible)).size === 10);
  ok("défi : toujours à choix", j1.every((q) => q.options.length >= 2));
  ok("défi de la semaine : vingt questions", de.questionsDefi("semaine", "2026-11-16").length === 20);
  ok("le lundi", de.lundiDe("2026-11-19") === "2026-11-16" && de.lundiDe("2026-11-16") === "2026-11-16" && de.lundiDe("2026-11-22") === "2026-11-16" && de.lundiDe("2027-01-01") === "2026-12-28");
  const partage = de.texteAPartager("jour", "2026-11-19", [true, true, false, true, true, true, false, true, true, true], "https://exemple.fr/monde");
  ok("défi : le texte à partager", partage.startsWith("Le Portulan, défi du 19 novembre : 8/10") && partage.includes("🟩🟩🟥") && !partage.includes("fr,"), partage);
  ok("niveau du profil", co.niveauProfil(0).n === 1 && co.niveauProfil(100).n === 2 && co.niveauProfil(99).n === 1 && co.niveauProfil(1_000_000).a === null);
  ok("ligues", co.ligueDe(0).ligue.id === "bronze" && co.ligueDe(499).ligue.id === "argent" && co.ligueDe(500).ligue.id === "or" && co.ligueDe(9999).suivante === null);
  ok("médailles : identifiants uniques", new Set(co.MEDAILLES.map((m) => m.id)).size === co.MEDAILLES.length);
  ok("boutique : identifiants uniques et un article gratuit par rayon", new Set(co.BOUTIQUE.map((a) => a.id)).size === co.BOUTIQUE.length && ["globe", "cadre", "bateau"].every((r) => co.BOUTIQUE.some((a) => a.sorte === r && a.prix === 0)));
  const vide = { niveaux: {}, pays: {}, profil: { jours: 0, eclair: 0, survie: 0 }, cabinets: {}, records: {}, erreurs: [], confusions: {}, favoris: {} } as never;
  ok("médailles : aucune au départ", co.MEDAILLES.every((m) => !m.obtenue(vide)));
  ok("passeport : vide au départ", co.tampons(vide).size === 0);
}

/* ---------- La carte : les calques, le Soleil, la géographie physique, les outils ---------- */
{
  const ca = await import("../src/lib/monde/calques");
  const gd = await import("../src/lib/monde/geographie-donnees");
  ok("classes : sous la première borne", ca.classeDe(5, [10, 20]) === 0 && ca.classeDe(10, [10, 20]) === 1 && ca.classeDe(25, [10, 20]) === 2);
  const pop = ca.calquePopulation();
  ok("population : la Chine et l'Inde dans la dernière classe", pop.couleurs.cn === ca.SEQUENCE[ca.SEQUENCE.length - 1] && pop.couleurs.in === pop.couleurs.cn);
  ok("population : Monaco dans la première", pop.couleurs.mc === ca.SEQUENCE[0]);
  ok("population : chaque pays chiffré a sa couleur", PAYS.filter((p) => p.population).every((p) => pop.couleurs[p.code]));
  ok("population : légende de sept classes", pop.legende.entrees.length === 7);
  const sup = ca.calqueSuperficie();
  ok("superficie : la Russie tout en haut, le Vatican tout en bas", sup.couleurs.ru === sup.legende.entrees[5].couleur && sup.couleurs.va === sup.legende.entrees[0].couleur);
  const zones = ca.zonesMonetaires();
  const zone = (c: string) => zones.find((z) => z.code === c);
  ok("monnaies : la zone euro", (zone("EUR")?.membres.length ?? 0) >= 25 && ["fr", "de", "it", "es", "bg", "hr", "me", "xk"].every((c) => zone("EUR")!.membres.includes(c)));
  ok("monnaies : le franc CFA d'Afrique de l'Ouest", ["sn", "ci", "ml", "ne", "bf", "bj", "tg", "gw"].every((c) => zone("XOF")?.membres.includes(c)));
  ok("monnaies : le franc CFA d'Afrique centrale", ["cm", "cg", "ga", "td", "cf", "gq"].every((c) => zone("XAF")?.membres.includes(c)));
  ok("monnaies : le dollar des Caraïbes orientales", zone("XCD")?.membres.includes("lc") === true);
  const mon = ca.calqueMonnaies();
  ok("monnaies : le Sahara occidental reste sans couleur", !mon.couleurs.eh);
  ok("monnaies : la France et l'Allemagne de la même couleur", mon.couleurs.fr === mon.couleurs.de && Boolean(mon.couleurs.fr));
  ok("monnaies : un pays à sa monnaie seule n'est pas colorié", !mon.couleurs.jp && !mon.couleurs.ma);
  ok("organisations : la Ligue arabe compte 22 membres", Object.keys(ca.calqueOrganisation("la").couleurs).length === 22);
  ok("organisations : l'Union européenne en compte 27", Object.keys(ca.calqueOrganisation("ue").couleurs).length === 27);
  const langues = ca.languesRepandues();
  ok("langues : l'anglais d'abord, puis le français et l'arabe", langues[0].langue === "anglais" && langues.slice(0, 4).some((l) => l.langue === "arabe"));
  ok("langues : le titre élidé", ca.calqueLangue("arabe").legende.titre === "L'arabe" && ca.calqueLangue("français").legende.titre === "Le français");
  ok("langues : l'arabe en Algérie et au Maroc", Boolean(ca.calqueLangue("arabe").couleurs.dz && ca.calqueLangue("arabe").couleurs.ma));
  const hiver = ca.calqueFuseaux(new Date(Date.UTC(2026, 0, 15, 12)));
  ok("fuseaux : la France et l'Allemagne à la même heure", hiver.couleurs.fr === hiver.couleurs.de);
  ok("fuseaux : la France et le Royaume-Uni pas à la même heure", hiver.couleurs.fr !== hiver.couleurs.gb);
  ok("fuseaux : la Russie, les États-Unis, le Canada rayés", ["ru", "us", "ca", "br", "au", "id", "mx"].every((c) => hiver.rayes.includes(c)));
  ok("fuseaux : la Chine, la France, l'Inde ne sont pas rayées", !["cn", "fr", "in", "ua", "kz"].some((c) => hiver.rayes.includes(c)));
  ok("fuseaux : onze heures en Russie", gd.FUSEAUX_PAYS.ru?.length === 11 && gd.FUSEAUX_PAYS.us?.length === 6 && gd.FUSEAUX_PAYS.ca?.length === 6);
  ok("fuseaux : une couleur d'heure valide", /^hsl\(\d+, 52%, 60%\)$/.test(ca.couleurHeure(-210)));

  // Le Soleil : au zénith sur l'équateur à l'équinoxe, sur le tropique du Cancer au solstice, sur Greenwich vers midi.
  const equinoxe = ca.soleilAuZenith(new Date("2026-03-20T14:46:00Z"));
  ok("Soleil : l'équinoxe de mars", Math.abs(equinoxe[0]) < 0.3, String(equinoxe));
  const solstice = ca.soleilAuZenith(new Date("2026-06-21T08:24:00Z"));
  ok("Soleil : le solstice de juin", Math.abs(solstice[0] - 23.44) < 0.15, String(solstice));
  const decembre = ca.soleilAuZenith(new Date("2026-12-21T20:50:00Z"));
  ok("Soleil : le solstice de décembre", Math.abs(decembre[0] + 23.44) < 0.15, String(decembre));
  const midi = ca.soleilAuZenith(new Date("2026-04-15T12:00:00Z"));
  ok("Soleil : midi à Greenwich", Math.abs(midi[1]) < 2.5, String(midi));
  ok("Soleil : six heures plus tard, 90° plus à l'ouest", Math.abs(ca.soleilAuZenith(new Date("2026-04-15T18:00:00Z"))[1] - (midi[1] - 90)) < 0.6);
  ok("Soleil : haut à son zénith", ca.hauteurSoleil(midi, new Date("2026-04-15T12:00:00Z")) > 89.5);
  ok("Soleil : la nuit aux antipodes", ca.momentDuJour([-midi[0], midi[1] + 180], new Date("2026-04-15T12:00:00Z")) === "nuit");
  ok("Soleil : il fait jour à Paris à midi en juin", ca.momentDuJour([48.85, 2.35], new Date("2026-06-21T11:00:00Z")) === "jour");
  ok("Soleil : il fait nuit à Paris à minuit", ca.momentDuJour([48.85, 2.35], new Date("2026-01-15T23:00:00Z")) === "nuit");

  // La géographie physique : le fichier existe, il est complet, les noms sont en français.
  const nom = gd.GEOGRAPHIE_URL.replace(/^\//, "");
  ok("géographie : le fichier existe", existsSync(new URL(`../public/${nom}`, import.meta.url)));
  const geo = JSON.parse(readFileSync(new URL(`../public/${nom}`, import.meta.url), "utf8")) as {
    topo: Topology;
    mers: [string, number, number, number][];
    lacs: [string, number, number, number][];
    fleuves: [string, number, number, number, number, number][];
    chaines: [string, number, number, number][];
    deserts: [string, number, number, number][];
    monts: [number, number, number, number][];
    sommets: [string, number, number, number, number][];
    pays: Record<string, [number, number, number]>;
  };
  for (const m of ["Océan Atlantique", "Océan Pacifique", "Océan Indien", "Mer Méditerranée", "Mer Rouge", "Golfe Arabo-Persique", "Mer Noire", "Mer Caspienne", "La Manche"]) ok(`mer : ${m}`, geo.mers.some((x) => x[0] === m));
  for (const f of ["Nil", "Niger", "Congo", "Amazone", "Euphrate", "Tigre", "Danube", "Loire", "Rhône"]) ok(`fleuve : ${f}`, geo.fleuves.some((x) => x[0] === f));
  for (const c of ["Himalaya", "Alpes", "Atlas", "Cordillère des Andes", "Hoggar", "Pyrénées"]) ok(`chaîne : ${c}`, geo.chaines.some((x) => x[0] === c));
  ok("déserts : le Sahara et le Rub al-Khali", geo.deserts.some((x) => x[0] === "Sahara") && geo.deserts.some((x) => x[0] === "Rub al-Khali"));
  ok("relief : plus de mille monts sur trois niveaux", geo.monts.length > 1000 && [0, 1, 2].every((n) => geo.monts.some((m) => m[2] === n)));
  ok("sommets : l'Everest et le Toubkal", geo.sommets.some((s) => s[0] === "Everest" && s[3] === 8849) && geo.sommets.some((s) => s[0] === "Toubkal"));
  ok("géographie : des coordonnées sur la Terre", [...geo.mers, ...geo.lacs, ...geo.chaines, ...geo.deserts].every((x) => Math.abs(x[1]) <= 180 && Math.abs(x[2]) <= 90) && geo.monts.every((m) => Math.abs(m[0]) <= 180 && Math.abs(m[1]) <= 90));
  ok("géographie : les tracés des lacs et des fleuves", (geo.topo.objects.lacs as GeometryCollection).geometries.length > 100 && (geo.topo.objects.fleuves as GeometryCollection).geometries.length > 1000);
  // Le nom de chaque pays s'écrit dans le pays (sauf l'Indonésie, écrite entre ses îles, et les îlots de
  // quelques kilomètres, dont le nom s'écrit à côté de leur repère).
  const carteDetail = JSON.parse(readFileSync(new URL(`../public${CARTE_URL}`, import.meta.url), "utf8")) as Topology;
  const formesPays = feature(carteDetail, carteDetail.objects.pays as GeometryCollection).features;
  let dehors = 0;
  for (const f of formesPays) {
    if (!f.id) continue;
    const e = geo.pays[String(f.id)];
    ok(`nom placé : ${f.id}`, Boolean(e));
    if (e && e[2] >= 5 && f.id !== "id" && !geoContains(f, [e[0], e[1]])) dehors++;
  }
  ok("noms des pays : chacun dans son pays", dehors === 0, `${dehors} dehors`);
  ok("noms des pays : un grand cercle intérieur pour les grands", geo.pays.ru[2] > 800 && geo.pays.fr[2] > 200 && geo.pays.va[2] < 5);

  // Les outils et les jeux.
  const ou = await import("../src/lib/monde/carte-outils");
  ok("vraie taille : la France et le Brésil", ou.comparerSurfaces(551695, 8515767) === "15 fois plus vaste", ou.comparerSurfaces(551695, 8515767));
  ok("vraie taille : moins vaste", ou.comparerSurfaces(100, 50) === "2 fois moins vaste" && ou.comparerSurfaces(100, 55) === "1,8 fois moins vaste");
  ok("vraie taille : à peu près pareil", ou.comparerSurfaces(100, 105) === "à peu près aussi vaste");
  ok("coordonnées", ou.coordonnees([48.853, 2.349]) === "48,9° N, 2,3° E" && ou.coordonnees([-33.9, -70.6]) === "33,9° S, 70,6° O");
  ok("capitales : mille points pile dessus", ou.pointsCapitale(0) === 1000 && ou.pointsCapitale(1200) === 368 && ou.pointsCapitale(8000) < 2);
  ok("jeux : trois jeux, des records distincts", ou.JEUX.length === 3 && new Set(ou.JEUX.map((j) => j.cle)).size === 3);
}

console.log(echecs ? `\n${echecs} échec(s).` : `Tout est bon (${questions} questions de niveau vérifiées).`);
process.exit(echecs ? 1 : 0);
