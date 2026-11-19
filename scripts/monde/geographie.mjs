// Le Portulan : la géographie physique de la carte (mers, lacs, fleuves, montagnes, sommets, déserts),
// le point où écrire le nom de chaque pays, et les pays qui vivent à plusieurs heures.
//
//   node scripts/monde/geographie.mjs <node_modules des sources> <dossier geojson de Natural Earth>
//
// Les sources (domaine public), hors du dépôt :
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/nvkelso/natural-earth-vector.git /tmp/ne-git
//   cd /tmp/ne-git && git sparse-checkout set --no-cone /geojson/ne_50m_rivers_lake_centerlines_scale_rank.geojson \
//     /geojson/ne_50m_lakes.geojson /geojson/ne_50m_geography_marine_polys.geojson /geojson/ne_50m_geography_regions_polys.geojson
//   (et les modules de construire.mjs : d3-geo, topojson-server, topojson-simplify, countries-and-timezones)
//
// Produit :
//   public/monde/geographie-<empreinte>.json   chargé par la carte quand on allume ses calques
//   src/lib/monde/geographie-donnees.ts        son adresse, et les fuseaux des pays qui en ont plusieurs
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [dossierDeps, dossierNE] = process.argv.slice(2);
if (!dossierDeps || !dossierNE) {
  console.error("Usage : node scripts/monde/geographie.mjs <node_modules des sources> <dossier geojson de Natural Earth>");
  process.exit(1);
}
const racine = new URL("../..", import.meta.url).pathname;
const req = createRequire(join(dossierDeps, "x.js"));
const importer = (nom) => import(pathToFileURL(req.resolve(nom)).href);
const d3 = await importer("d3-geo");
const { topology } = req("topojson-server");
const topojson = req("topojson-client");
const simplifieur = req("topojson-simplify");
const fuseauxDe = req("countries-and-timezones");

const lireNE = (nom) => JSON.parse(readFileSync(join(dossierNE, nom), "utf8"));
const erreurs = [];
const exiger = (cond, message) => {
  if (!cond) erreurs.push(message);
};
const arrondi = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const km2 = (stera) => stera * 6371 * 6371;

/* ---------- Le point le plus « intérieur » d'un polygone (pôle d'inaccessibilité, d'après Mapbox) ---------- */

function distanceAuBord(x, y, anneaux) {
  let dedans = false;
  let min = Infinity;
  for (const anneau of anneaux) {
    for (let i = 0, n = anneau.length, j = n - 1; i < n; j = i++) {
      const [ax, ay] = anneau[i];
      const [bx, by] = anneau[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) dedans = !dedans;
      // La distance au segment.
      let px = ax;
      let py = ay;
      let dx = bx - px;
      let dy = by - py;
      if (dx !== 0 || dy !== 0) {
        const t = ((x - px) * dx + (y - py) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          px = bx;
          py = by;
        } else if (t > 0) {
          px += dx * t;
          py += dy * t;
        }
      }
      dx = x - px;
      dy = y - py;
      min = Math.min(min, dx * dx + dy * dy);
    }
  }
  return (dedans ? 1 : -1) * Math.sqrt(min);
}

function poleInterieur(anneaux, precision) {
  const exterieur = anneaux[0];
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of exterieur) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const cote = Math.min(maxX - minX, maxY - minY);
  if (!(cote > 0)) return [minX, minY, 0];
  const cellule = (x, y, h) => {
    const d = distanceAuBord(x, y, anneaux);
    return { x, y, h, d, max: d + h * Math.SQRT2 };
  };
  const file = [];
  for (let x = minX; x < maxX; x += cote) for (let y = minY; y < maxY; y += cote) file.push(cellule(x + cote / 2, y + cote / 2, cote / 2));
  let meilleur = cellule((minX + maxX) / 2, (minY + maxY) / 2, 0);
  while (file.length) {
    // La cellule la plus prometteuse d'abord.
    let k = 0;
    for (let i = 1; i < file.length; i++) if (file[i].max > file[k].max) k = i;
    const c = file[k];
    file[k] = file[file.length - 1];
    file.pop();
    if (c.d > meilleur.d) meilleur = c;
    if (c.max - meilleur.d <= precision) continue;
    const h = c.h / 2;
    file.push(cellule(c.x - h, c.y - h, h), cellule(c.x + h, c.y - h, h), cellule(c.x - h, c.y + h, h), cellule(c.x + h, c.y + h, h));
  }
  return [meilleur.x, meilleur.y, meilleur.d];
}

/** Le plus grand morceau d'une forme (Polygon ou MultiPolygon). */
function plusGrand(geometrie) {
  const polygones = geometrie.type === "Polygon" ? [geometrie.coordinates] : geometrie.coordinates;
  let meilleur = null;
  let aire = -1;
  for (const p of polygones) {
    const a = d3.geoArea({ type: "Polygon", coordinates: p });
    if (a > aire) {
      aire = a;
      meilleur = p;
    }
  }
  return meilleur;
}

/**
 * Où écrire le nom d'une forme : son pôle d'inaccessibilité, calculé dans une projection
 * azimutale équivalente centrée sur elle (en km, sans l'étirement des hautes latitudes).
 * Renvoie [lon, lat, rayon du plus grand cercle intérieur en km].
 */
function pointDeNom(geometrie) {
  const polygone = plusGrand(geometrie);
  const centre = d3.geoCentroid({ type: "Polygon", coordinates: polygone });
  const proj = d3.geoAzimuthalEqualArea().rotate([-centre[0], -centre[1]]).scale(6371).translate([0, 0]).clipAngle(179);
  const anneaux = polygone.map((a) => a.map((p) => proj(p)).filter(Boolean));
  const [x, y, d] = poleInterieur(anneaux, 2);
  const [lon, lat] = proj.invert([x, y]);
  return [arrondi(lon), arrondi(lat), Math.round(Math.max(0, d))];
}

/* ---------- 1. Les noms des pays, là où ils tiennent ---------- */
const fichierCarte = readdirSync(join(racine, "public", "monde")).find((f) => /^carte-[0-9a-f]+\.json$/.test(f));
exiger(fichierCarte, "carte détaillée introuvable dans public/monde (lancer construire.mjs d'abord)");
const carte = JSON.parse(readFileSync(join(racine, "public", "monde", fichierCarte), "utf8"));
const etiquettes = {};
for (const f of topojson.feature(carte, carte.objects.pays).features) {
  if (!f.id || !f.geometry) continue;
  etiquettes[f.id] = pointDeNom(f.geometry);
}
// Quelques pays dont le plus grand morceau n'est pas celui qu'on attend (le nom va au cœur du pays).
const AU_CENTRE = {
  // L'Indonésie : entre Bornéo et Célèbes plutôt qu'au fond de Kalimantan.
  id: [117.5, -1.8],
};
for (const [code, [lon, lat]] of Object.entries(AU_CENTRE)) if (etiquettes[code]) etiquettes[code] = [lon, lat, etiquettes[code][2]];
console.log(`  ${Object.keys(etiquettes).length} noms de pays placés`);

/* ---------- 2. Les mers et les océans ---------- */
// Les océans, placés à la main (leurs polygones traversent l'antiméridien ou couvrent des hémisphères).
const OCEANS = [
  ["Océan Pacifique", -150, 18, 0],
  ["Océan Pacifique", -125, -22, 0],
  ["Océan Pacifique", 160, 25, 1],
  ["Océan Atlantique", -40, 28, 0],
  ["Océan Atlantique", -18, -24, 0],
  ["Océan Indien", 78, -18, 0],
  ["Océan Arctique", -10, 84, 0],
  ["Océan Austral", 40, -60, 0],
  ["Océan Austral", -150, -64, 1],
];
// Les noms de Natural Earth, corrigés pour la carte (majuscule initiale, usage français).
const MERS_NOMS = {
  "golfe Persique": "Golfe Arabo-Persique",
  "mer de Baffin": "Baie de Baffin",
  "Golfe d'Alaska": "Golfe d'Alaska",
  "Grande baie australienne": "Grande Baie australienne",
  "grande barrière de corail": "Grande Barrière de corail",
  "Golfe de Cook": "Golfe de Cook",
  "passage du Nord-Ouest": "Passage du Nord-Ouest",
  "golfe de Californie": "Golfe de Californie",
  Manche: "La Manche",
  "Golfe du Lion": "Golfe du Lion",
  "Golfe San Jorge": "Golfe San Jorge",
  "baie de Campêche": "Baie de Campêche",
  "mer des Laquedives": "Mer des Laquedives",
};
const MERS_EXCLUES = new Set(["Inner Seas", "Inner Sea", "Bristol Channel", "Cook Inlet", "Bristol Bay", "Melville Bay", "Shelikhova Gulf", "Amundsen Gulf", "Viscount Melville Sound", "Gulf of Kutch", "Bay of Fundy", "Gulf of Maine", "Chesapeake Bay", "Bo Hai", "Golfo San Jorge", "Gulf of Mannar", "Ungava Bay", "James Bay", "Gulf of Honduras", "Bay of Plenty"]);
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const mers = OCEANS.map(([n, lon, lat, r]) => [n, lon, lat, r]);
for (const f of lireNE("ne_50m_geography_marine_polys.geojson").features) {
  const p = f.properties;
  if (!["sea", "bay", "gulf", "strait", "channel", "reef"].includes(p.featurecla)) continue;
  if (MERS_EXCLUES.has(p.name) || !p.name_fr) continue;
  if (p.scalerank > 4) continue;
  const nom = MERS_NOMS[p.name_fr] ?? majuscule(p.name_fr);
  if (mers.some((m) => m[0] === nom)) continue;
  const [lon, lat] = pointDeNom(f.geometry);
  // rang : 1 grandes mers, 2 mers secondaires, 3 golfes, 4 détroits et petites mers.
  mers.push([nom, lon, lat, Math.max(1, Math.min(4, p.scalerank))]);
}
// Quelques noms recentrés : le cœur du bassin plutôt que son coin le plus large.
const RECENTRES = { "Mer Méditerranée": [16.5, 35], "Mer Caspienne": [50.6, 41.8] };
for (const m of mers) if (RECENTRES[m[0]]) [m[1], m[2]] = RECENTRES[m[0]];
exiger(mers.length > 70, `trop peu de mers : ${mers.length}`);
for (const attendu of ["Mer Méditerranée", "Mer Rouge", "Mer Noire", "Mer Caspienne", "Golfe Arabo-Persique", "Mer des Caraïbes", "Golfe du Mexique", "Mer Baltique", "Mer du Nord", "La Manche"]) exiger(mers.some((m) => m[0] === attendu), `mer absente : ${attendu}`);
console.log(`  ${mers.length} mers et océans`);

/* ---------- 3. Les lacs ---------- */
const LACS = {
  Supérieur: "Lac Supérieur",
  Michigan: "Lac Michigan",
  Huron: "Lac Huron",
  Érié: "Lac Érié",
  Ontario: "Lac Ontario",
  Victoria: "Lac Victoria",
  Tanganyika: "Lac Tanganyika",
  Malawi: "Lac Malawi",
  Baïkal: "Lac Baïkal",
  "grand l'Ours": "Grand lac de l'Ours",
  "Grand Esclaves": "Grand lac des Esclaves",
  Winnipeg: "Lac Winnipeg",
  Ladoga: "Lac Ladoga",
  Onega: "Lac Onega",
  Balkhach: "Lac Balkhach",
  Titicaca: "Lac Titicaca",
  Nicaragua: "Lac Nicaragua",
  Athabasca: "Lac Athabasca",
  Turkana: "Lac Turkana",
  "Yssyk Koul": "Lac Issyk-Koul",
  Vänern: "Lac Vänern",
  Albert: "Lac Albert",
  Moero: "Lac Moero",
  Tchad: "Lac Tchad",
  Volta: "Lac Volta",
  "Grande Aral": "Mer d'Aral",
  Kariba: "Lac Kariba",
  Ourmia: "Lac d'Ourmia",
  Van: "Lac de Van",
  Tana: "Lac Tana",
  Kivu: "Lac Kivu",
  Édouard: "Lac Édouard",
  Qinghai: "Lac Qinghai",
  "Tonlé Sap": "Tonlé Sap",
  Poyang: "Lac Poyang",
  "Grand Salé": "Grand Lac Salé",
  Peïpous: "Lac Peïpous",
  Khövsgöl: "Lac Khövsgöl",
  Léman: "Lac Léman",
  Constance: "Lac de Constance",
  "mer Morte": "Mer Morte",
  Tibériade: "Lac de Tibériade",
  Sevan: "Lac Sevan",
  Kyoga: "Lac Kyoga",
  Bangwelo: "Lac Bangweulu",
};
const lacs = [];
const nomsLacs = [];
for (const f of lireNE("ne_50m_lakes.geojson").features) {
  const p = f.properties;
  const aire = km2(d3.geoArea(f));
  const nom = p.name_fr ? LACS[p.name_fr] : undefined;
  // Les grands lacs, et les petits qui ont un nom à retenir (le Léman, la mer Morte…).
  if (aire < 900 && !nom) continue;
  lacs.push({ type: "Feature", properties: {}, geometry: f.geometry });
  if (nom && !nomsLacs.some((l) => l[0] === nom)) {
    const [lon, lat] = pointDeNom(f.geometry);
    nomsLacs.push([nom, lon, lat, aire >= 25000 ? 1 : aire >= 8000 ? 2 : aire >= 2500 ? 3 : 4]);
  }
}
for (const attendu of ["Lac Victoria", "Lac Baïkal", "Lac Supérieur", "Lac Titicaca", "Mer Morte", "Lac Léman", "Mer d'Aral"]) exiger(nomsLacs.some((m) => m[0] === attendu), `lac absent : ${attendu}`);
console.log(`  ${lacs.length} lacs, ${nomsLacs.length} nommés`);

/* ---------- 4. Les fleuves ---------- */
// Le nom écrit sur la carte, pour les fleuves qu'on nomme (les autres sont tracés sans nom).
const FLEUVES = {
  Nil: "Nil",
  "Nil Blanc": "Nil Blanc",
  "Nil Bleu": "Nil Bleu",
  Amazone: "Amazone",
  Yangzi: "Yangzi Jiang",
  Mississippi: "Mississippi",
  Missouri: "Missouri",
  Léna: "Léna",
  Paraná: "Paraná",
  Ob: "Ob",
  Irrawaddy: "Irrawaddy",
  "fleuve Saint-Laurent": "Saint-Laurent",
  Danube: "Danube",
  Selenga: "Selenga",
  Angara: "Angara",
  Irtych: "Irtych",
  "fleuve Mackenzie": "Mackenzie",
  Mékong: "Mékong",
  Congo: "Congo",
  Brahmapoutre: "Brahmapoutre",
  Murray: "Murray",
  Darling: "Darling",
  Grande: "Rio Grande",
  Negro: "Rio Negro",
  "fleuve Columbia": "Columbia",
  Yukon: "Yukon",
  Gange: "Gange",
  Indus: "Indus",
  Niger: "Niger",
  Oubangui: "Oubangui",
  Euphrate: "Euphrate",
  "fleuve Jaune": "Fleuve Jaune",
  Volga: "Volga",
  Zambèze: "Zambèze",
  Amour: "Amour",
  Orénoque: "Orénoque",
  Kasaï: "Kasaï",
  Madeira: "Madeira",
  Ohio: "Ohio",
  "Chatt-el-Arab": "Chatt al-Arab",
  Xi: "Xi Jiang",
  Orange: "Orange",
  "São Francisco": "São Francisco",
  Rhin: "Rhin",
  Ienisseï: "Ienisseï",
  Tocantins: "Tocantins",
  Dniepr: "Dniepr",
  Bénoué: "Bénoué",
  Tigre: "Tigre",
  Kolyma: "Kolyma",
  Magdalena: "Magdalena",
  Seine: "Seine",
  Oder: "Oder",
  Arkansas: "Arkansas",
  Sénégal: "Sénégal",
  Salouen: "Salouen",
  Loire: "Loire",
  Rhône: "Rhône",
  Elbe: "Elbe",
  Vistule: "Vistule",
  Don: "Don",
  Limpopo: "Limpopo",
  Jourdain: "Jourdain",
  "Amou-Daria": "Amou-Daria",
  "Syr-Daria": "Syr-Daria",
  Tage: "Tage",
  Èbre: "Èbre",
  Pô: "Pô",
  Garonne: "Garonne",
  Douro: "Douro",
  Dniestr: "Dniestr",
  Okavango: "Okavango",
  Chari: "Chari",
  Helmand: "Helmand",
  Tarim: "Tarim",
  Volta: "Volta",
};
const fleuves = [];
const segments = new Map();
for (const f of lireNE("ne_50m_rivers_lake_centerlines_scale_rank.geojson").features) {
  const p = f.properties;
  if (p.featurecla !== "River" || p.scalerank > 6 || !f.geometry) continue;
  // rang : 1 et 2 dès le globe entier, puis de plus en plus fins à mesure qu'on s'approche.
  const rang = Math.max(1, Math.min(6, p.scalerank));
  fleuves.push({ type: "Feature", properties: { r: rang }, geometry: f.geometry });
  const nom = p.name_fr ? FLEUVES[p.name_fr] : undefined;
  if (!nom) continue;
  // Le nom suit le cours principal : le tronçon le plus long parmi ceux du meilleur rang.
  const lignes = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const l of lignes) {
    const avant = segments.get(nom);
    const longueur = d3.geoLength({ type: "LineString", coordinates: l });
    if (!avant || rang < avant.rang || (rang === avant.rang && longueur > avant.longueur)) segments.set(nom, { ligne: l, longueur, rang });
  }
}
// Le nom s'écrit au milieu du plus long tronçon, dans le sens du fleuve (un second point donne l'angle).
const nomsFleuves = [];
for (const [nom, { ligne, longueur, rang }] of segments) {
  if (longueur < 0.012) continue;
  const total = longueur;
  let parcouru = 0;
  let i = 1;
  for (; i < ligne.length; i++) {
    parcouru += d3.geoDistance(ligne[i - 1], ligne[i]);
    if (parcouru >= total / 2) break;
  }
  const a = ligne[Math.max(0, i - 1)];
  const b = ligne[Math.min(ligne.length - 1, i + 1)];
  nomsFleuves.push([nom, arrondi(a[0]), arrondi(a[1]), arrondi(b[0]), arrondi(b[1]), Math.min(4, rang)]);
}
for (const attendu of ["Nil", "Amazone", "Congo", "Niger", "Danube", "Volga", "Gange", "Mississippi", "Euphrate", "Tigre"]) exiger(nomsFleuves.some((m) => m[0] === attendu), `fleuve absent : ${attendu}`);
console.log(`  ${fleuves.length} tronçons de fleuves, ${nomsFleuves.length} nommés`);

/* ---------- 5. Les montagnes (le relief) et les déserts ---------- */
// [nom de Natural Earth, nom sur la carte, rang du nom (1 : dès le globe entier), taille des monts (1 à 3)].
const CHAINES = [
  ["HIMALAYAS", "Himalaya", 1, 3],
  ["ANDES", "Cordillère des Andes", 1, 3],
  ["ROCKY MOUNTAINS", "Montagnes Rocheuses", 1, 3],
  ["ALPS", "Alpes", 1, 3],
  ["URAL MOUNTAINS", "Oural", 1, 2],
  ["CAUCASUS MTS.", "Caucase", 1, 3],
  ["TIAN SHAN", "Tian Shan", 1, 3],
  ["GREAT DIVIDING RANGE", "Cordillère australienne", 1, 2],
  ["Transantarctic Mountains", "Chaîne Transantarctique", 1, 2],
  ["ATLAS MOUNTAINS", "Atlas", 2, 2],
  ["APPALACHIAN MTS.", "Appalaches", 2, 2],
  ["ETHIOPIAN HIGHLANDS", "Hauts plateaux d'Éthiopie", 2, 2],
  ["ZAGROS MOUNTAINS", "Zagros", 2, 2],
  ["ALTAY MOUNTAINS", "Altaï", 2, 2],
  ["PAMIRS", "Pamir", 2, 3],
  ["HINDU KUSH", "Hindou Kouch", 2, 3],
  ["KARAKORAM RA.", "Karakoram", 2, 3],
  ["KUNLUN MOUNTAINS", "Kunlun", 2, 3],
  ["GREATER KHINGAN RANGE", "Grand Khingan", 3, 2],
  ["STANOVOY RANGE", "Monts Stanovoï", 3, 2],
  ["CHAÎNE ANNAMITIQUE", "Cordillère annamitique", 3, 2],
  ["BROOKS RANGE", "Chaîne Brooks", 3, 2],
  ["COAST MOUNTAINS", "Chaîne Côtière", 3, 2],
  ["CASCADE RANGE", "Chaîne des Cascades", 3, 2],
  ["ALASKA RANGE", "Chaîne d'Alaska", 3, 3],
  ["ATLAS SAHARIEN", "Atlas saharien", 3, 1],
  ["HAUT ATLAS", "Haut Atlas", 3, 2],
  ["Anti Atlas", "Anti-Atlas", 4, 1],
  ["DRAKENSBERG", "Drakensberg", 3, 2],
  ["TIBESTI MTS.", "Tibesti", 3, 2],
  ["AHAGGAR MTS.", "Hoggar", 3, 2],
  ["AÏR MTS.", "Aïr", 4, 1],
  ["MITUMBA MTS.", "Monts Mitumba", 4, 1],
  ["CRYSTAL MOUNTAINS", "Monts de Cristal", 4, 1],
  ["VERKHOYANSK RANGE", "Monts de Verkhoïansk", 3, 2],
  ["CHERSKIY RANGE", "Monts Tcherski", 4, 2],
  ["SIKHOTE-ALIN’ RANGE", "Sikhote-Aline", 4, 1],
  ["QUILIAN MOUNTAINS", "Monts Qilian", 3, 2],
  ["EASTERN SAYAN MTS.", "Monts Saïan", 3, 2],
  ["WESTERN GHATS", "Ghâts occidentaux", 3, 1],
  ["EASTERN GHATS", "Ghâts orientaux", 4, 1],
  ["HEJAZ MTS.", "Monts du Hedjaz", 3, 1],
  ["ASIR MTS.", "Monts Asir", 4, 1],
  ["ELBURZ MTS.", "Elbourz", 3, 2],
  ["KJØLEN MOUNTAINS", "Alpes scandinaves", 3, 1],
  ["CARPATHIAN MOUNTAINS", "Carpates", 3, 2],
  ["APPENNINI", "Apennins", 3, 1],
  ["PYRENEES", "Pyrénées", 3, 2],
  ["Dinaric Alps", "Alpes dinariques", 4, 1],
  ["Balkan Mts.", "Grand Balkan", 4, 1],
  ["PONTIC MOUNTAINS", "Chaîne pontique", 4, 1],
  ["Lesser Caucasus", "Petit Caucase", 4, 1],
  ["Hadhramaut", "Hadramaout", 4, 1],
  ["SIERRA MADRE OCCIDENTAL", "Sierra Madre occidentale", 3, 2],
  ["SIERRA MADRE ORIENTAL", "Sierra Madre orientale", 3, 2],
  ["Sierra Madre del Sur", "Sierra Madre du Sud", 4, 1],
  ["SIERRA NEVADA", "Sierra Nevada", 4, 2],
  ["MACKENZIE MTS.", "Monts Mackenzie", 4, 2],
  ["SOUTHERN ALPS", "Alpes du Sud", 3, 2],
  ["NEW GUINEA HIGHLANDS", "Chaîne centrale de Nouvelle-Guinée", 4, 2],
  ["GUIANA HIGHLANDS", "Massif des Guyanes", 4, 1],
  ["PLATEAU OF TIBET", "Plateau tibétain", 2, 1],
  ["ALTIPLANO", "Altiplano", 4, 1],
];
const regions = lireNE("ne_50m_geography_regions_polys.geojson").features;
const chaines = [];
const monts = [];
// Un petit hasard fixe (le même à chaque construction).
const bruit = (a, b) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ESPACEMENTS = [4, 2, 1];
for (const [nomNE, nom, rang, taille] of CHAINES) {
  const fs = regions.filter((f) => f.properties.NAME === nomNE);
  exiger(fs.length, `chaîne introuvable : ${nomNE}`);
  if (!fs.length) continue;
  // Le nom sur le plus grand morceau.
  const plus = fs.reduce((a, b) => (d3.geoArea(b) > d3.geoArea(a) ? b : a));
  const [lon, lat] = pointDeNom(plus.geometry);
  chaines.push([nom, lon, lat, rang]);
  // Les monts : une grille de plus en plus fine (4°, 2°, 1°), chaque niveau ne garde que ses points à lui.
  for (const f of fs) {
    const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
    const pris = [];
    ESPACEMENTS.forEach((pas, niveau) => {
      for (let la = Math.floor(y0 / pas) * pas; la <= y1 + pas; la += pas) {
        const pasLon = pas / Math.max(0.3, Math.cos((la * Math.PI) / 180));
        for (let lo = Math.floor(x0 / pasLon) * pasLon; lo <= (x1 < x0 ? x1 + 360 : x1) + pasLon; lo += pasLon) {
          const jl = (bruit(lo, la) - 0.5) * pas * 0.55;
          const jo = (bruit(la, lo) - 0.5) * pasLon * 0.55;
          const p = [((lo + jo + 540) % 360) - 180, la + jl];
          if (!d3.geoContains(f, p)) continue;
          if (pris.some((q) => d3.geoDistance(q, p) < ((pas * 0.62) / 180) * Math.PI)) continue;
          if (monts.some((m) => m[2] <= niveau && d3.geoDistance([m[0], m[1]], p) < ((pas * 0.55) / 180) * Math.PI)) continue;
          pris.push(p);
          monts.push([arrondi(p[0]), arrondi(p[1]), niveau, taille]);
        }
      }
    });
    // Une petite chaîne (les Pyrénées, le Haut Atlas) a toujours au moins un mont, dès le globe entier.
    if (!pris.length) {
      const [plon, plat] = pointDeNom(f.geometry);
      monts.push([plon, plat, 0, taille]);
    }
  }
}
const DESERTS = [
  ["SAHARA", "Sahara", 1],
  ["GOBI DESERT", "Désert de Gobi", 1],
  ["RUB’ AL KHALI", "Rub al-Khali", 2],
  ["KALAHARI DESERT", "Désert du Kalahari", 2],
  ["NAMIB DESERT", "Désert du Namib", 3],
  ["LIBYAN DESERT", "Désert libyque", 3],
  ["NUBIAN DESERT", "Désert de Nubie", 3],
  ["SYRIAN DESERT", "Désert de Syrie", 3],
  ["THAR DESERT", "Désert du Thar", 3],
  ["GARAGUM DESERT", "Karakoum", 3],
  ["QIZILQUM DESERT", "Kyzylkoum", 3],
  ["DESIERTO DE ATACAMA", "Désert d'Atacama", 3],
  ["GREAT SANDY DESERT", "Grand Désert de Sable", 3],
  ["GREAT VICTORIA DESERT", "Grand Désert Victoria", 3],
];
const deserts = [];
for (const [nomNE, nom, rang] of DESERTS) {
  const f = regions.find((x) => x.properties.NAME === nomNE);
  exiger(f, `désert introuvable : ${nomNE}`);
  if (!f) continue;
  const [lon, lat] = pointDeNom(f.geometry);
  deserts.push([nom, lon, lat, rang]);
}
// Le Taklamakan (absent de Natural Earth à cette échelle), placé à la main.
deserts.push(["Taklamakan", 83, 38.9, 3]);
console.log(`  ${chaines.length} chaînes, ${monts.length} monts, ${deserts.length} déserts`);

/* ---------- 6. Les sommets ---------- */
// [nom, latitude, longitude, altitude, rang] : les plus hauts de chaque continent (rang 1) et des sommets célèbres.
const SOMMETS = [
  ["Everest", 27.988, 86.925, 8849, 1],
  ["Aconcagua", -32.653, -70.011, 6961, 1],
  ["Denali", 63.069, -151.007, 6190, 1],
  ["Kilimandjaro", -3.067, 37.356, 5895, 1],
  ["Elbrouz", 43.355, 42.439, 5642, 1],
  ["Mont Blanc", 45.833, 6.865, 4806, 1],
  ["Mont Vinson", -78.525, -85.617, 4892, 1],
  ["Puncak Jaya", -4.078, 137.158, 4884, 1],
  ["Mont Kosciuszko", -36.456, 148.263, 2228, 2],
  ["K2", 35.881, 76.513, 8611, 2],
  ["Kangchenjunga", 27.703, 88.148, 8586, 3],
  ["Nanga Parbat", 35.237, 74.589, 8126, 3],
  ["Annapurna", 28.596, 83.82, 8091, 3],
  ["Pic Ismail Samani", 38.942, 72.016, 7495, 3],
  ["Pic Pobeda", 42.035, 80.125, 7439, 3],
  ["Ojos del Salado", -27.109, -68.541, 6893, 3],
  ["Huascarán", -9.122, -77.604, 6768, 3],
  ["Chimborazo", -1.469, -78.817, 6263, 3],
  ["Mont Logan", 60.567, -140.405, 5959, 3],
  ["Cotopaxi", -0.684, -78.438, 5897, 3],
  ["Pic d'Orizaba", 19.03, -97.268, 5636, 3],
  ["Damavand", 35.956, 52.11, 5610, 2],
  ["Mont Kenya", -0.152, 37.308, 5199, 3],
  ["Ararat", 39.702, 44.298, 5137, 2],
  ["Rwenzori", 0.386, 29.872, 5109, 3],
  ["Klioutchevskoï", 56.056, 160.642, 4750, 3],
  ["Ras Dashen", 13.236, 38.372, 4550, 3],
  ["Mauna Kea", 19.821, -155.468, 4207, 3],
  ["Toubkal", 31.06, -7.915, 4167, 2],
  ["Mont Kinabalu", 6.075, 116.558, 4095, 3],
  ["Mont Cameroun", 4.217, 9.17, 4040, 3],
  ["Fuji", 35.361, 138.727, 3776, 2],
  ["Aoraki / Mont Cook", -43.595, 170.142, 3724, 3],
  ["Teide", 28.272, -16.642, 3715, 3],
  ["Djebel an-Nabi Chouaïb", 15.279, 43.976, 3666, 3],
  ["Thabana Ntlenyana", -29.467, 29.267, 3482, 3],
  ["Emi Koussi", 19.793, 18.552, 3415, 3],
  ["Etna", 37.751, 14.993, 3357, 3],
  ["Djebel Shams", 23.238, 57.263, 3009, 3],
  ["Mont Olympe", 40.086, 22.359, 2918, 3],
  ["Tahat", 23.289, 5.534, 2908, 3],
  ["Mont Sinaï (Djebel Moussa)", 28.539, 33.975, 2285, 3],
];
for (const [nom, la, lo] of SOMMETS) exiger(Math.abs(la) <= 90 && Math.abs(lo) <= 180, `sommet mal placé : ${nom}`);

/* ---------- 7. Les pays qui vivent à plusieurs heures ---------- */
// L'heure d'hiver de chaque fuseau (la plus petite des heures de janvier et de juillet), et les heures
// différentes d'un même pays. Ne comptent que les heures officielles : Ürümqi vit à l'heure de Xinjiang
// sans que la Chine la reconnaisse (une seule heure, celle de Pékin), la Crimée occupée vit à l'heure de
// Moscou (l'Ukraine n'a qu'une heure), Eucla n'a qu'une heure d'usage.
const NON_OFFICIELS = new Set(["Asia/Urumqi", "Europe/Simferopol", "Australia/Eucla", "Asia/Tokyo"]);
const FUSEAUX = {};
const decalage = (fuseau, date) => {
  const t = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, timeZoneName: "longOffset" }).formatToParts(date).find((x) => x.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(t);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
};
const [janvier, juillet] = [new Date(Date.UTC(2026, 0, 15, 12)), new Date(Date.UTC(2026, 6, 15, 12))];
for (const code of Object.keys(etiquettes)) {
  if (code === "aq") continue;
  const c = fuseauxDe.getCountry(code.toUpperCase());
  if (!c) continue;
  const heures = new Set();
  for (const z of c.timezones) {
    if (NON_OFFICIELS.has(z)) continue;
    try {
      heures.add(Math.min(decalage(z, janvier), decalage(z, juillet)));
    } catch {
      continue;
    }
  }
  if (heures.size > 1) FUSEAUX[code] = [...heures].sort((a, b) => a - b);
}
exiger((FUSEAUX.ru?.length ?? 0) === 11, `la Russie a onze fuseaux : ${FUSEAUX.ru}`);
exiger((FUSEAUX.us?.length ?? 0) === 6, `les États-Unis (sans leurs territoires) ont six fuseaux : ${FUSEAUX.us}`);
exiger((FUSEAUX.ca?.length ?? 0) === 6, `le Canada a six fuseaux : ${FUSEAUX.ca}`);
exiger(!FUSEAUX.fr && !FUSEAUX.cn && !FUSEAUX.ua && !FUSEAUX.kz, "la France, la Chine, l'Ukraine et le Kazakhstan vivent à une seule heure");
console.log(`  ${Object.keys(FUSEAUX).length} pays à plusieurs fuseaux : ${Object.entries(FUSEAUX).map(([c, h]) => `${c} ${h.length}`).join(", ")}`);

/* ---------- 8. Simplifier, écrire ---------- */
if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) :\n  ${erreurs.join("\n  ")}`);
  process.exit(1);
}
const brut = topology({ lacs: { type: "FeatureCollection", features: lacs }, fleuves: { type: "FeatureCollection", features: fleuves } });
const pre = simplifieur.presimplify(brut, simplifieur.sphericalTriangleArea);
const simple = simplifieur.simplify(pre, simplifieur.quantile(pre, 0.3));
const sansPoids = { ...simple, arcs: simple.arcs.map((arc) => arc.map((p) => [p[0], p[1]])) };
const topo = topojson.quantize(sansPoids, 20000);
delete topo.bbox;
for (const g of topo.objects.lacs.geometries) delete g.properties;
const sortie = {
  v: 1,
  topo,
  mers,
  lacs: nomsLacs,
  fleuves: nomsFleuves,
  chaines,
  deserts,
  monts,
  sommets: SOMMETS.map(([n, la, lo, alt, r]) => [n, lo, la, alt, r]),
  pays: etiquettes,
};
const json = JSON.stringify(sortie);
const empreinte = createHash("sha256").update(json).digest("hex").slice(0, 10);
const dossier = join(racine, "public", "monde");
for (const f of readdirSync(dossier)) if (/^geographie-[0-9a-f]+\.json$/.test(f)) rmSync(join(dossier, f));
writeFileSync(join(dossier, `geographie-${empreinte}.json`), json);
const ts = `// Fichier produit par scripts/monde/geographie.mjs : ne pas modifier à la main.
// Sources : Natural Earth (domaine public), countries-and-timezones (MIT).

/** La géographie physique de la carte (mers, lacs, fleuves, monts, sommets) et le point où écrire chaque pays. */
export const GEOGRAPHIE_URL = "/monde/geographie-${empreinte}.json";

/** Les pays qui vivent à plusieurs heures officielles : leurs heures d'hiver (en minutes d'écart avec le temps universel), de l'ouest à l'est. */
export const FUSEAUX_PAYS: Readonly<Record<string, readonly number[]>> = ${JSON.stringify(FUSEAUX)};
`;
writeFileSync(join(racine, "src", "lib", "monde", "geographie-donnees.ts"), ts);
console.log(`  geographie-${empreinte}.json : ${Math.round(json.length / 1024)} Ko (${Math.round(JSON.stringify(topo).length / 1024)} Ko de tracés)`);
