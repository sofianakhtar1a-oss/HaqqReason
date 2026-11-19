// Le Portulan : construit les données du monde à partir de sources ouvertes.
//
//   node scripts/monde/construire.mjs <dossier node_modules des sources> <population.csv>
//
// Les sources s'installent à part, hors du dépôt (elles ne servent qu'ici) :
//   mkdir /tmp/monde-deps && cd /tmp/monde-deps && npm init -y && npm i --ignore-scripts \
//     world-countries@5.1.0 flag-icons@7.6.0 world-atlas@2.0.2 topojson-client@3 topojson-server@3 topojson-simplify@3 \
//     d3-geo@3 svgo@3 countries-and-timezones@3 all-the-cities@3
//   curl -o /tmp/population.csv https://raw.githubusercontent.com/datasets/population/main/data/population.csv
//
// Produit :
//   src/lib/monde/donnees.ts            les pays (noms, capitales, continents, monnaies, chiffres…)
//   public/monde/drapeaux/<empreinte>.svg  les drapeaux, allégés, nommés par leur contenu
//   public/monde/carte-<empreinte>.json  la carte du monde (TopoJSON simplifié)
//
// Licences : world-countries (ODbL), flag-icons (MIT), Natural Earth via world-atlas (domaine public),
// Banque mondiale (CC BY 4.0). Les crédits sont repris dans l'atlas du module.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import * as C from "./curation.mjs";
import * as P from "./curation-plus.mjs";

const [dossierDeps, fichierPop] = process.argv.slice(2);
if (!dossierDeps || !fichierPop) {
  console.error("Usage : node scripts/monde/construire.mjs <node_modules des sources> <population.csv>");
  process.exit(1);
}
const racine = new URL("../..", import.meta.url).pathname;
const req = createRequire(join(dossierDeps, "x.js"));
const importer = (nom) => import(pathToFileURL(req.resolve(nom)).href);

const pays = req("world-countries/countries.json");
const topo = req("world-atlas/countries-50m.json");
const topojson = req("topojson-client");
const simplifieur = req("topojson-simplify");
const d3 = await importer("d3-geo");
const { optimize } = await importer("svgo");
const dossierDrapeaux = join(dirname(req.resolve("flag-icons/package.json")), "flags", "4x3");

const erreurs = [];
const exiger = (cond, message) => {
  if (!cond) erreurs.push(message);
};

/* ---------- 1. La population (Banque mondiale, dernière année connue) ---------- */
const populations = new Map();
for (const ligne of readFileSync(fichierPop, "utf8").replace(/\r/g, "").trim().split("\n").slice(1)) {
  const m = /,([A-Z0-9]{3}),(\d{4}),([\d.]+)$/.exec(ligne);
  if (!m) continue;
  const [, code, annee, valeur] = m;
  const avant = populations.get(code);
  if (!avant || avant.annee < Number(annee)) populations.set(code, { annee: Number(annee), valeur: Math.round(Number(valeur)) });
}

/* ---------- 2. Les noms français ---------- */
const langue = new Intl.DisplayNames("fr", { type: "language" });
const devise = new Intl.DisplayNames("fr", { type: "currency" });
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nomLangue = (code) => {
  if (C.NOMS_LANGUES[code]) return C.NOMS_LANGUES[code];
  try {
    const n = langue.of(code);
    return n && n !== code ? n : null;
  } catch {
    return null;
  }
};
const nomMonnaie = (code) => {
  if (C.NOMS_MONNAIES[code]) return C.NOMS_MONNAIES[code];
  const n = devise.of(code);
  return n && n !== code ? n : null;
};

/* ---------- 3. Les pays ---------- */
const parCca3 = new Map(pays.map((p) => [p.cca3, p.cca2.toLowerCase()]));
const continentDe = (p) => {
  const c = p.cca2.toLowerCase();
  if (C.CONTINENT_FORCE[c]) return C.CONTINENT_FORCE[c];
  switch (p.region) {
    case "Africa":
      return ["afrique", []];
    case "Asia":
      return ["asie", []];
    case "Europe":
      return ["europe", []];
    case "Oceania":
      return ["oceanie", []];
    case "Antarctic":
      return ["antarctique", []];
    case "Americas":
      return [p.subregion === "South America" ? "amerique-sud" : "amerique-nord", []];
    default:
      erreurs.push(`continent inconnu pour ${c}`);
      return ["europe", []];
  }
};

const rangs = new Map(C.ORDRE.map((c, i) => [c, i]));
exiger(rangs.size === C.ORDRE.length, "ORDRE contient des doublons");
for (const c of C.ORDRE) exiger(pays.some((p) => p.cca2.toLowerCase() === c), `ORDRE : code inconnu ${c}`);

const entites = [];
for (const p of pays) {
  const c = p.cca2.toLowerCase();
  const n = C.NOMS[c] ?? {};
  const nom = n.nom ?? p.translations.fra?.common ?? p.name.common;
  const officiel = p.translations.fra?.official;
  const complet = n.complet ?? (officiel && officiel !== nom && !C.SANS_NOM_COMPLET.has(c) ? officiel : undefined);
  const noms = [...new Set([nom, ...(n.alias ?? []), ...(n.complet ? [n.complet] : []), p.translations.fra?.common].filter(Boolean))];

  exiger(c in C.CAPITALES, `capitale manquante pour ${c}`);
  const cap = C.CAPITALES[c];
  const [continent, autres] = continentDe(p);

  // Les monnaies : on retire les codes disparus ou locaux, on ajoute les nouvelles.
  const codes = C.MONNAIES_REMPLACEES[c] ?? [...new Set([...Object.keys(p.currencies ?? {}), ...(C.MONNAIES_AJOUTEES[c] ?? [])])].filter((m) => !C.MONNAIES_RETIREES.has(m));
  const monnaies = codes
    .map((m) => ({ code: m, nom: nomMonnaie(m), symbole: p.currencies?.[m]?.symbol ?? null }))
    .filter((m) => {
      exiger(m.nom, `nom de monnaie inconnu : ${m.code} (${c})`);
      return Boolean(m.nom);
    })
    .map((m) => ({ code: m.code, nom: majuscule(m.nom), ...(m.symbole ? { symbole: m.symbole } : {}) }));
  const principale = c in C.MONNAIE_PRINCIPALE ? C.MONNAIE_PRINCIPALE[c] : codes[0] ?? null;
  if (principale && !monnaies.some((m) => m.code === principale)) {
    const nm = nomMonnaie(principale);
    exiger(nm, `monnaie principale inconnue ${principale} (${c})`);
    if (nm) monnaies.unshift({ code: principale, nom: majuscule(nm) });
  }
  const triees = principale ? [...monnaies.filter((m) => m.code === principale), ...monnaies.filter((m) => m.code !== principale)] : monnaies;

  const cca3 = p.cca3 === "UNK" ? "XKX" : p.cca3;
  const wb = populations.get(cca3);
  const manuelle = C.POPULATIONS[c];
  const population = manuelle ? manuelle[0] : wb ? wb.valeur : null;
  const anneePopulation = manuelle ? manuelle[1] : wb ? wb.annee : null;
  exiger(population !== undefined && (population !== null || c in C.POPULATIONS), `population manquante pour ${c}`);

  let statut;
  let souverain;
  let nature;
  if (C.OBSERVATEURS.has(c)) statut = "observateur";
  else if (C.RECONNAISSANCE_PARTIELLE.has(c)) statut = "partiel";
  else if (c in C.TERRITOIRES) {
    statut = "territoire";
    [souverain, nature] = C.TERRITOIRES[c];
  } else if (p.unMember) statut = "etat";
  exiger(statut, `statut inconnu pour ${c}`);
  if (statut === "observateur") nature = "État observateur auprès de l'ONU";
  if (c === "xk") nature = "État reconnu par une partie des membres de l'ONU";
  if (c === "tw") nature = "État de fait, reconnu par peu d'États ; la Chine le revendique";

  const langues = Object.keys(p.languages ?? {})
    .map(nomLangue)
    .filter(Boolean);

  exiger(rangs.has(c), `rang manquant pour ${c}`);
  const superficie = C.SUPERFICIES[c] ?? (p.area > 0 ? p.area : null);

  entites.push({
    code: c,
    nom,
    ...(complet ? { complet } : {}),
    noms,
    capitale: cap ? cap[0] : null,
    ...(cap && cap[1]?.length ? { capitales: cap[1] } : {}),
    ...(cap && cap[2] ? { noteCapitale: cap[2] } : {}),
    ...(!cap && C.NOTES_SANS_CAPITALE[c] ? { noteCapitale: C.NOTES_SANS_CAPITALE[c] } : {}),
    continent,
    ...(autres.length ? { continents: autres } : {}),
    sousRegion: C.SOUS_REGIONS[p.subregion] ?? (erreurs.push(`sous-région inconnue : ${p.subregion}`), ""),
    monnaies: triees,
    quizMonnaie: principale !== null && triees.length > 0,
    population,
    anneePopulation,
    ...(C.NOTES_POPULATION[c] ? { notePopulation: C.NOTES_POPULATION[c] } : {}),
    superficie,
    langues,
    voisins: (p.borders ?? []).map((b) => parCca3.get(b)).filter(Boolean),
    enclave: Boolean(p.landlocked),
    latlng: [Math.round(p.latlng[0] * 100) / 100, Math.round(p.latlng[1] * 100) / 100],
    statut,
    ...(souverain ? { souverain } : {}),
    ...(nature ? { nature } : {}),
    rang: rangs.get(c),
    quiz: !C.HORS_QUIZ.has(c),
  });
}
exiger(entites.length === pays.length, "nombre d'entités");

/* ---------- 3 bis. Les fiches : gentilé, noms étrangers, codes, fuseau, organisations ---------- */
const fuseaux = req("countries-and-timezones");
const villes = req("all-the-cities");
const villesParPays = new Map();
for (const v of villes) {
  const k = v.country.toLowerCase();
  if (!villesParPays.has(k)) villesParPays.set(k, []);
  villesParPays.get(k).push(v);
}
const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const membres = new Map();
for (const [id, o] of Object.entries(P.ORGANISATIONS)) {
  for (const m of o.membres) {
    exiger(pays.some((p) => p.cca2.toLowerCase() === m), `organisation ${id} : membre inconnu ${m}`);
    if (!membres.has(m)) membres.set(m, []);
    membres.get(m).push(id);
  }
}
for (const [id, n] of [["ue", 27], ["ua", 54], ["la", 22], ["oci", 57], ["asean", 11], ["g20", 19], ["commonwealth", 56], ["otan", 32]]) exiger(P.ORGANISATIONS[id].membres.length === n, `${id} : ${P.ORGANISATIONS[id].membres.length} membres au lieu de ${n}`);
const indicatif = (idd) => {
  if (!idd?.root) return null;
  const s = idd.suffixes ?? [];
  if (s.length !== 1) return idd.root;
  return idd.root === "+1" ? `+1 ${s[0]}` : `${idd.root}${s[0]}`;
};
for (const e of entites) {
  const p = pays.find((x) => x.cca2.toLowerCase() === e.code);
  const g = e.code in P.GENTILES ? P.GENTILES[e.code] : p.demonyms?.fra?.m ? [p.demonyms.fra.m, p.demonyms.fra.f || p.demonyms.fra.m] : null;
  if (g) e.gentile = g;
  e.nomEn = p.name.common;
  const ar = P.NOMS_AR[e.code] ?? p.translations.ara?.common;
  if (ar) e.nomAr = ar;
  const tel = P.INDICATIFS[e.code] ?? indicatif(p.idd);
  if (tel) e.indicatif = tel;
  if (p.tld?.[0]) e.tld = p.tld[0];
  e.iso3 = p.cca3 === "UNK" ? "XKX" : p.cca3;
  if (!P.CONDUITE_INCONNUE.has(e.code) && e.population !== null) e.conduite = P.CONDUITE_GAUCHE.has(e.code) ? "gauche" : "droite";
  // Le fuseau de la capitale : son nom dans un fuseau IANA, sinon le seul du pays, sinon celui choisi à la main.
  const zones = fuseaux.getCountry(p.cca2)?.timezones ?? [];
  const capEn = p.capital?.[0] ? sansAccent(p.capital[0]) : "";
  const parNom = zones.find((z) => capEn && sansAccent(z.split("/").pop()) === capEn);
  const fuseau = e.code in P.FUSEAUX ? P.FUSEAUX[e.code] : parNom ?? (zones.length === 1 ? zones[0] : null);
  exiger(fuseau !== undefined, `fuseau indéfini pour ${e.code}`);
  if (zones.length > 1 && !parNom && !(e.code in P.FUSEAUX)) erreurs.push(`fuseau à choisir pour ${e.code} : ${zones.join(", ")}`);
  if (fuseau) {
    try {
      new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
      e.fuseau = fuseau;
    } catch {
      erreurs.push(`fuseau inconnu de Intl : ${fuseau} (${e.code})`);
    }
  }
  if (membres.has(e.code)) e.orgs = membres.get(e.code);
  // La capitale sur le globe : la ville « PPLC » de GeoNames (ou celle qui porte son nom anglais).
  if (e.capitale) {
    const locales = villesParPays.get(e.code) ?? [];
    const nomsCap = [p.capital?.[0], e.capitale, ...(e.capitales ?? [])].filter(Boolean).map(sansAccent);
    const pplc = locales.filter((v) => v.featureCode === "PPLC");
    const trouvee = P.COORDS_CAPITALE[e.code]
      ? { loc: { coordinates: [P.COORDS_CAPITALE[e.code][1], P.COORDS_CAPITALE[e.code][0]] } }
      : (pplc.length === 1 ? pplc[0] : null) ??
        pplc.find((v) => nomsCap.includes(sansAccent(v.name)) || nomsCap.includes(sansAccent(v.altName))) ??
        locales.filter((v) => nomsCap.includes(sansAccent(v.name)) || nomsCap.includes(sansAccent(v.altName))).sort((a, b) => b.population - a.population)[0];
    if (trouvee) {
      const [lon, lat] = trouvee.loc.coordinates;
      e.capLatLng = [Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000];
    } else if (e.quiz) console.log(`(note) capitale sans coordonnées : ${e.code} ${e.capitale}`);
  }
}

/* ---------- 3 ter. Les récits des fiches (scripts/monde/recits/*.mjs) ---------- */
const sources = {};
for (const f of ["europe", "afrique", "asie", "ameriques", "oceanie"]) {
  const m = (await import(`./recits/${f}.mjs`)).default;
  for (const [code, r] of Object.entries(m)) {
    exiger(!(code in sources), `récit en double : ${code}`);
    sources[code] = r;
  }
}
const CLES_RECIT = new Set(["d", "h", "ha", "i", "f", "s", "r", "rn", "m", "dr", "e", "a", "v"]);
const texteOk = (t) => typeof t === "string" && t.trim() === t && t.length > 1 && !/\s{2}|\s[,)]|[(]\s|\s\.(\s|$)/.test(t);
// Deux chiffres significatifs : la population d'une ville change vite, et GeoNames n'est pas un recensement.
const arrondi = (n) => {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
};
const recits = {};
for (const [code, r] of Object.entries(sources)) {
  const e = entites.find((x) => x.code === code);
  exiger(e, `récit pour un code inconnu : ${code}`);
  if (!e) continue;
  for (const [k, v] of Object.entries(r)) {
    exiger(CLES_RECIT.has(k), `récit ${code} : clé inconnue ${k}`);
    if (["d", "h", "ha", "i", "f", "rn", "dr", "e", "a"].includes(k)) exiger(texteOk(v), `récit ${code}.${k} : texte mal formé « ${v} »`);
  }
  if (r.s) {
    exiger(Array.isArray(r.s) && texteOk(r.s[0]) && Number.isInteger(r.s[1]) && r.s[1] >= 0 && r.s[1] < 8850, `récit ${code} : sommet mal formé`);
    e.sommet = r.s;
  }
  if (r.r) {
    exiger(Array.isArray(r.r) && texteOk(r.r[0]) && Number.isInteger(r.r[1]) && r.r[1] > 0 && r.r[1] < 7000, `récit ${code} : fleuve mal formé`);
    e.fleuve = r.r;
  }
  if (r.m) exiger(Array.isArray(r.m) && r.m.every(texteOk), `récit ${code} : mers mal formées`);
  const villesRecit = [];
  for (const v of r.v ?? []) {
    const [fr, autres] = v.split("=");
    exiger(texteOk(fr), `récit ${code} : ville mal formée « ${v} »`);
    exiger(fr !== e.capitale, `récit ${code} : la capitale n'est pas une « grande ville » (${fr})`);
    const noms = [fr, ...(autres ? autres.split("|") : [])].map(sansAccent);
    const trouvee = (villesParPays.get(code) ?? []).filter((c) => noms.includes(sansAccent(c.name)) || (c.altName && noms.includes(sansAccent(c.altName)))).sort((a, b) => b.population - a.population)[0];
    villesRecit.push(trouvee ? [fr, arrondi(trouvee.population)] : [fr]);
    if (!trouvee) console.log(`(note) ville sans population : ${code} ${fr}`);
  }
  // De la plus peuplée à la moins peuplée (celles dont on ignore la population restent à la fin, dans l'ordre donné).
  villesRecit.sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1));
  if (villesRecit.length) e.villes = villesRecit.map((v) => v[0]);
  const sortie = {
    ...(r.d ? { devise: r.d } : {}),
    ...(r.h ? { hymne: r.h } : {}),
    ...(r.ha ? { auteurs: r.ha } : {}),
    ...(r.i ? { independance: r.i } : {}),
    ...(r.f ? { fete: r.f } : {}),
    ...(r.rn ? { fleuveNote: r.rn } : {}),
    ...(r.m?.length ? { mers: r.m } : {}),
    ...(r.dr ? { drapeau: r.dr } : {}),
    ...(r.e ? { etymologie: r.e } : {}),
    ...(r.a ? { anecdote: r.a } : {}),
    ...(villesRecit.length ? { villes: villesRecit } : {}),
    ...(P.ANCIENS_NOMS[code] ? { anciens: P.ANCIENS_NOMS[code] } : {}),
  };
  // L'espace insécable de la typographie française : avant ; : ! ? », après «.
  const typo = (t) => t.replace(/ ([;:!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  for (const k of Object.keys(sortie)) {
    const v = sortie[k];
    if (typeof v === "string") sortie[k] = typo(v);
    else if (Array.isArray(v)) sortie[k] = v.map((x) => (typeof x === "string" ? typo(x) : Array.isArray(x) ? x.map((y) => (typeof y === "string" ? typo(y) : y)) : x));
  }
  if (Object.keys(sortie).length) recits[code] = sortie;
}
for (const code of Object.keys(P.ANCIENS_NOMS)) {
  exiger(entites.some((x) => x.code === code), `ancien nom pour un code inconnu : ${code}`);
  if (!recits[code]) recits[code] = { anciens: P.ANCIENS_NOMS[code] };
}
// Les États (pas les territoires) ont tous l'essentiel de leur fiche.
for (const e of entites.filter((x) => x.quiz && x.statut !== "territoire")) {
  const r = sources[e.code] ?? {};
  // L'Afghanistan n'a plus d'hymne officiel depuis 2021.
  for (const k of ["h", "e", "a"]) exiger(r[k] || (k === "h" && e.code === "af"), `récit ${e.code} : ${k} manquant`);
}

/* ---------- 4. Les drapeaux : allégés, nommés par leur contenu ---------- */
const sortieDrapeaux = join(racine, "public", "monde", "drapeaux");
rmSync(sortieDrapeaux, { recursive: true, force: true });
mkdirSync(sortieDrapeaux, { recursive: true });
const fichiers = new Map();
let poidsAvant = 0;
let poidsApres = 0;
function drapeau(fichier) {
  if (fichiers.has(fichier)) return fichiers.get(fichier);
  const brut = readFileSync(join(dossierDrapeaux, `${fichier}.svg`), "utf8");
  const leger = optimize(brut, {
    multipass: true,
    floatPrecision: 2,
    plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }, "removeDimensions"],
  }).data;
  const empreinte = createHash("sha256").update(leger).digest("hex").slice(0, 12);
  writeFileSync(join(sortieDrapeaux, `${empreinte}.svg`), leger);
  poidsAvant += brut.length;
  poidsApres += leger.length;
  // La teinte : la couleur moyenne de 12 cases (4 × 3), pour trouver des drapeaux qui se ressemblent.
  let teinte = "";
  try {
    const png = execFileSync("rsvg-convert", ["-w", "64", "-h", "48", join(dossierDrapeaux, `${fichier}.svg`)]);
    const rgb = execFileSync("convert", ["png:-", "-resize", "4x3!", "-depth", "8", "rgb:-"], { input: png });
    teinte = rgb.toString("hex");
  } catch {
    erreurs.push(`teinte impossible pour ${fichier} (rsvg-convert et ImageMagick sont nécessaires)`);
  }
  const r = { empreinte, teinte };
  fichiers.set(fichier, r);
  return r;
}
for (const e of entites) {
  const proprietaire = C.DRAPEAU_DE[e.code];
  const fichier = proprietaire ? C.FICHIER_DRAPEAU[proprietaire] ?? proprietaire : C.FICHIER_DRAPEAU[e.code] ?? e.code;
  exiger(existsSync(join(dossierDrapeaux, `${fichier}.svg`)), `drapeau absent : ${fichier}`);
  const d = drapeau(fichier);
  e.drapeau = d.empreinte;
  e.teinte = d.teinte;
  e.drapeauPropre = !proprietaire;
  if (proprietaire) e.drapeauDe = proprietaire;
}

/* ---------- 5. La carte : un TopoJSON par pays (code ISO), simplifié ---------- */
const parCcn3 = new Map(pays.filter((p) => p.ccn3).map((p) => [p.ccn3, p.cca2.toLowerCase()]));
const geometries = topo.objects.countries.geometries;
const nouvelles = [];
const fusions = new Map(); // code → géométries à fusionner
const ajouter = (code, g) => {
  if (!fusions.has(code)) fusions.set(code, []);
  fusions.get(code).push(g);
};
const polygones = (g) => (g.type === "Polygon" ? [g.arcs] : g.type === "MultiPolygon" ? g.arcs : []);
const centre = (arcs) => d3.geoCentroid(topojson.feature(topo, { type: "Polygon", arcs }));
// Découpe un ensemble d'îles entre plusieurs codes, selon la position de chaque île.
function decouper(g, classer) {
  for (const arcs of polygones(g)) {
    const [lon, lat] = centre(arcs);
    ajouter(classer(lon, lat), { type: "Polygon", arcs });
  }
}
for (const g of geometries) {
  const nomNE = g.properties?.name;
  if (g.id === "250") {
    decouper(g, (lon, lat) => (lon < -58 && lon > -63 ? (lat > 15.5 ? "gp" : "mq") : lon < -50 && lon > -55 && lat > 1 && lat < 7 ? "gf" : lon > 55 && lon < 56 && lat < -20 ? "re" : lon > 44 && lon < 46 && lat < -12 ? "yt" : "fr"));
  } else if (g.id === "578") {
    decouper(g, (lon, lat) => (lat < -40 ? "bv" : lat > 73 || (lon < 0 && lat > 70) ? "sj" : "no"));
  } else if (g.id === "528") {
    decouper(g, (lon) => (lon < -60 ? "bq" : "nl"));
  } else if (nomNE === "Indian Ocean Ter.") {
    decouper(g, (lon) => (lon > 100 ? "cx" : "cc"));
  } else if (g.id === "643") {
    // La Crimée revient à l'Ukraine (voir curation.mjs) ; le reste de la Russie garde sa géométrie d'origine.
    const { ouest, est, sud, nord } = C.CRIMEE;
    const reste = [];
    for (const arcs of polygones(g)) {
      const [lon, lat] = centre(arcs);
      if (lon > ouest && lon < est && lat > sud && lat < nord) ajouter("ua", { type: "Polygon", arcs });
      else reste.push(arcs);
    }
    exiger(reste.length === polygones(g).length - 1, `Crimée introuvable (${polygones(g).length - reste.length} îles)`);
    ajouter("ru", { type: "MultiPolygon", arcs: reste });
  } else if (nomNE === "Kosovo") ajouter("xk", g);
  else if (nomNE === "Somaliland") ajouter("so", g);
  else if (nomNE === "N. Cyprus") ajouter("cy", g);
  else if (nomNE === "Siachen Glacier") nouvelles.push({ type: g.type, arcs: g.arcs });
  else {
    const code = parCcn3.get(g.id);
    if (!code) {
      erreurs.push(`géométrie sans pays : ${g.id} ${nomNE}`);
      continue;
    }
    ajouter(code, g);
  }
}
for (const [code, liste] of fusions) {
  const fusion = liste.length === 1 && liste[0].type !== "Polygon" ? liste[0] : topojson.mergeArcs(topo, liste);
  nouvelles.push({ type: fusion.type, arcs: fusion.arcs, id: code });
}

/* ---------- 5 bis. Le Golan et le Sahara occidental (voir curation.mjs) ---------- */
// La carte passe en GeoJSON (les frontières communes y gardent exactement les mêmes points). Le Maroc et
// Israël y sont fendus le long d'une ligne (le 27° 40′ N, la ligne de 1967) sans qu'aucune autre frontière
// ne bouge ; la topologie est ensuite reconstruite, et chaque frontière redevient un arc partagé.
const { topology } = req("topojson-server");
const traits = nouvelles.map((g) => ({ type: "Feature", id: g.id, properties: {}, geometry: topojson.feature(topo, g).geometry }));
const trait = (code) => traits.find((t) => t.id === code);
const anneauxDe = (geo) => (geo.type === "Polygon" ? geo.coordinates : geo.coordinates.flat(1));
const meme = (a, b) => a[0] === b[0] && a[1] === b[1];
const aire = (geo) => d3.geoArea({ type: "Feature", geometry: geo, properties: {} });
const km2 = (sr) => Math.round(sr * 6371.0088 ** 2);
// Le point où le segment [p, q] croise le segment [a, b], hors de leurs extrémités.
function croisement(p, q, a, b) {
  const r = [q[0] - p[0], q[1] - p[1]];
  const s = [b[0] - a[0], b[1] - a[1]];
  const d = r[0] * s[1] - r[1] * s[0];
  if (d === 0) return null;
  const t = ((a[0] - p[0]) * s[1] - (a[1] - p[1]) * s[0]) / d;
  const u = ((a[0] - p[0]) * r[1] - (a[1] - p[1]) * r[0]) / d;
  return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + t * r[0], p[1] + t * r[1]] : null;
}
// Ajoute un point sur une arête, dans l'anneau du pays et dans celui de son voisin qui partage cette arête.
function poser(u, v, point) {
  for (const t of traits) {
    for (const anneau of anneauxDe(t.geometry)) {
      for (let i = 0; i < anneau.length - 1; i++) {
        if ((meme(anneau[i], u) && meme(anneau[i + 1], v)) || (meme(anneau[i], v) && meme(anneau[i + 1], u))) {
          anneau.splice(i + 1, 0, [...point]);
          break;
        }
      }
    }
  }
}
// Fend le pays (d'un seul tenant) le long d'une ligne : chaque bout de la ligne est un sommet de son contour,
// ou bien le premier (le dernier) segment croise ce contour une seule fois ; entre les deux, la ligne reste dedans.
function fendre(code, ligne) {
  const t = trait(code);
  const polygones = t.geometry.type === "Polygon" ? [t.geometry.coordinates] : t.geometry.coordinates;
  if (polygones.length !== 1 || polygones[0].length !== 1) throw new Error(`${code} : un seul contour, sans trou, était attendu`);
  const anneau = polygones[0][0];
  const bout = (p, q) => {
    const touches = [];
    for (let i = 0; i < anneau.length - 1; i++) {
      const c = croisement(p, q, anneau[i], anneau[i + 1]);
      if (c) touches.push([c, anneau[i], anneau[i + 1]]);
    }
    if (anneau.some((s) => meme(s, p))) {
      exiger(touches.length === 0, `${code} : la ligne sort du pays`);
      return p;
    }
    if (touches.length !== 1) throw new Error(`${code} : la ligne croise ${touches.length} fois le contour`);
    const [c, u, v] = touches[0];
    poser(u, v, c);
    return c;
  };
  const debut = bout(ligne[0], ligne[1]);
  const fin = bout(ligne[ligne.length - 1], ligne[ligne.length - 2]);
  const interieur = ligne.slice(1, -1);
  for (let k = 0; k < interieur.length - 1; k++)
    for (let i = 0; i < anneau.length - 1; i++) exiger(!croisement(interieur[k], interieur[k + 1], anneau[i], anneau[i + 1]), `${code} : la ligne sort du pays`);
  const ouvert = anneau.slice(0, -1);
  const i = ouvert.findIndex((s) => meme(s, debut));
  const j = ouvert.findIndex((s) => meme(s, fin));
  const tour = (de, a) => {
    const r = [];
    for (let k = de; ; k = (k + 1) % ouvert.length) {
      r.push(ouvert[k]);
      if (k === a) return r;
    }
  };
  // Les deux morceaux gardent le sens du contour d'origine (celui qu'attend d3-geo).
  const un = [...tour(i, j), ...[...interieur].reverse()];
  const deux = [...tour(j, i), ...interieur];
  return [[...un, un[0]], [...deux, deux[0]]];
}
const avant = new Map(["ma", "eh", "il", "sy"].map((c) => [c, aire(trait(c).geometry)]));
const moyenne = (anneau, axe) => anneau.reduce((s, p) => s + p[axe], 0) / anneau.length;
{
  // Le Sahara occidental : la part de la carte du Maroc au sud du 27° 40′ N, tel que la carte le trace
  // (le haut du Sahara occidental de Natural Earth, dont le coin ouest est le départ du mur de sable).
  const eh = trait("eh");
  const parallele = Math.max(...anneauxDe(eh.geometry).flat(1).map((p) => p[1]));
  exiger(Math.abs(parallele - C.PARALLELE_SAHARA) < 0.02, `frontière du Sahara occidental inattendue : ${parallele}`);
  const coin = anneauxDe(eh.geometry).flat(1).filter((p) => p[1] === parallele).sort((a, b) => a[0] - b[0])[0];
  const ligne = [[-18, parallele]];
  for (let lon = -13; lon < coin[0] - 0.1; lon += 0.25) ligne.push([lon, parallele]); // le parallèle, pas une ligne droite sur le globe
  ligne.push(coin);
  const morceaux = fendre("ma", ligne);
  const [sud, nord] = morceaux.sort((a, b) => moyenne(a, 1) - moyenne(b, 1));
  trait("ma").geometry = { type: "Polygon", coordinates: [nord] };
  eh.geometry = { type: "MultiPolygon", coordinates: [...(eh.geometry.type === "Polygon" ? [eh.geometry.coordinates] : eh.geometry.coordinates), [sud]] };
}
{
  // Le Golan : la carte d'Israël à l'est de la ligne de 1967 (les bouts de la ligne sortent du pays).
  const ouest = C.GOLAN.slice(4, 16);
  const morceaux = fendre("il", ouest);
  const [israel, golan] = morceaux.sort((a, b) => moyenne(a, 0) - moyenne(b, 0));
  trait("il").geometry = { type: "Polygon", coordinates: [israel] };
  const sy = trait("sy");
  sy.geometry = { type: "MultiPolygon", coordinates: [...(sy.geometry.type === "Polygon" ? [sy.geometry.coordinates] : sy.geometry.coordinates), [golan]] };
}
// Les morceaux rejoignent leur pays : leur frontière commune disparaît, puis la topologie est refaite au propre.
const premiere = topology({ pays: { type: "FeatureCollection", features: traits } });
for (const g of premiere.objects.pays.geometries) {
  if (g.id !== "eh" && g.id !== "sy") continue;
  const fondu = topojson.mergeArcs(premiere, g.arcs.map((arcs) => ({ type: "Polygon", arcs })));
  g.type = fondu.type;
  g.arcs = fondu.arcs;
}
const propres = premiere.objects.pays.geometries.map((g) => ({ type: "Feature", id: g.id, properties: {}, geometry: topojson.feature(premiere, g).geometry }));
const decoupee = topology({ pays: { type: "FeatureCollection", features: propres } });
for (const g of decoupee.objects.pays.geometries) delete g.properties;
delete decoupee.bbox;
// Contrôles : rien ne se perd, chaque pays reste d'un seul tenant, et la surface passe d'un pays à l'autre.
{
  const apres = new Map(propres.filter((f) => avant.has(f.id)).map((f) => [f.id, f]));
  for (const [a, b, attendu] of [["ma", "eh", 178000], ["il", "sy", 1600]]) {
    const total = avant.get(a) + avant.get(b);
    const nouveau = aire(apres.get(a).geometry) + aire(apres.get(b).geometry);
    const passe = km2(avant.get(a) - aire(apres.get(a).geometry));
    exiger(Math.abs(nouveau - total) / total < 1e-5, `${a}/${b} : la surface change (${km2(total)} → ${km2(nouveau)} km²)`);
    exiger(passe > attendu * 0.85 && passe < attendu * 1.15, `${a} → ${b} : ${passe} km² déplacés, ${attendu} attendus`);
    for (const c of [a, b]) {
      const geo = apres.get(c).geometry;
      const polygones = geo.type === "Polygon" ? 1 : geo.coordinates.length;
      exiger(polygones === 1, `${c} : ${polygones} morceaux au lieu d'un`);
    }
    console.log(`  ${a} → ${b} : ${passe} km²`);
  }
}

// Simplifier sans perdre les petites îles : seuls les points intermédiaires disparaissent.
// Deux cartes : la détaillée (au repos, et dès qu'on zoome) et la légère (pendant les mouvements).
// quantile(p) : le poids qui garde la part p des points.
const pre = simplifieur.presimplify(decoupee, simplifieur.sphericalTriangleArea);
function version(quantile, grille) {
  const simple = simplifieur.simplify(pre, simplifieur.quantile(pre, quantile));
  // Retirer la troisième coordonnée (le poids) et re-quantifier.
  const sansPoids = { ...simple, arcs: simple.arcs.map((arc) => arc.map((p) => [p[0], p[1]])) };
  return topojson.quantize(sansPoids, grille);
}
const finale = version(0.42, 40000);
const legere = version(0.1, 12000);
// La plus légère : le globe entier qui tourne (quelques milliers de points suffisent à cette taille).
const ultra = version(0.045, 6000);
const carte = JSON.stringify(finale);
const carteLegere = JSON.stringify(legere);
const carteUltra = JSON.stringify(ultra);
const empreinteCarte = createHash("sha256").update(carte).digest("hex").slice(0, 10);
const empreinteLegere = createHash("sha256").update(carteLegere).digest("hex").slice(0, 10);
const empreinteUltra = createHash("sha256").update(carteUltra).digest("hex").slice(0, 10);
const dossierCarte = join(racine, "public", "monde");
for (const f of (await import("node:fs")).readdirSync(dossierCarte)) if (/^carte-[a-z-]*[0-9a-f]+\.json$/.test(f)) rmSync(join(dossierCarte, f));
writeFileSync(join(dossierCarte, `carte-${empreinteCarte}.json`), carte);
writeFileSync(join(dossierCarte, `carte-legere-${empreinteLegere}.json`), carteLegere);
writeFileSync(join(dossierCarte, `carte-ultra-${empreinteUltra}.json`), carteUltra);
const avecCarte = new Set(nouvelles.map((g) => g.id).filter(Boolean));
for (const e of entites) {
  e.carte = avecCarte.has(e.code);
  // L'ordre propre à certaines catégories : capitales pièges plus tard, micro-États plus tard sur la carte.
  e.rangCapitale = e.rang + (C.RECUL_CAPITALE[e.code] ?? 0);
  e.rangCarte = e.rang + (!e.carte ? 45 : (e.superficie ?? 0) < 1000 ? 40 : (e.superficie ?? 0) < 12000 ? 15 : 0);
}

/* ---------- 6. Contrôles ---------- */
const parCode = new Map(entites.map((e) => [e.code, e]));
for (const e of entites) {
  if (e.souverain) exiger(parCode.has(e.souverain), `souverain inconnu ${e.souverain} (${e.code})`);
  for (const v of e.voisins) exiger(parCode.has(v), `voisin inconnu ${v}`);
  if (e.quiz) exiger(e.teinte.length === 72, `teinte manquante ${e.code}`);
}
const capitalesVues = new Map();
for (const e of entites) {
  if (!e.capitale || !e.quiz) continue;
  const cle = e.capitale.toLowerCase();
  if (capitalesVues.has(cle)) console.log(`(note) même capitale « ${e.capitale} » : ${capitalesVues.get(cle)} et ${e.code}`);
  capitalesVues.set(cle, e.code);
}
if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s) :\n - ${erreurs.join("\n - ")}`);
  process.exit(1);
}

/* ---------- 7. Le fichier TypeScript ---------- */
entites.sort((a, b) => a.rang - b.rang);
const ts = `// Fichier produit par scripts/monde/construire.mjs : ne pas modifier à la main.
// Sources : world-countries (ODbL), flag-icons (MIT), Natural Earth via world-atlas (domaine public),
// Banque mondiale (CC BY 4.0, population). Corrections et traductions : scripts/monde/curation.mjs.
import type { Pays } from "./types";

export const CARTE_URL = "/monde/carte-${empreinteCarte}.json";
export const CARTE_LEGERE_URL = "/monde/carte-legere-${empreinteLegere}.json";
export const CARTE_ULTRA_URL = "/monde/carte-ultra-${empreinteUltra}.json";
export const DRAPEAUX_URL = "/monde/drapeaux/";

export const PAYS: readonly Pays[] = ${JSON.stringify(entites, null, 1).replace(/\n\s*/g, " ").replace(/\{ /g, "{").replace(/ \}/g, "}").replace(/\}, \{/g, "},\n  {")};
`;
writeFileSync(join(racine, "src", "lib", "monde", "donnees.ts"), ts);
// Les nombres seuls, pour les pages qui n'ont pas besoin de toutes les données.
const enQuiz = entites.filter((e) => e.quiz);
writeFileSync(
  join(racine, "src", "lib", "monde", "chiffres.ts"),
  `// Fichier produit par scripts/monde/construire.mjs : ne pas modifier à la main.
/** Les pays et territoires qu'on apprend dans le Portulan. */
export const NOMBRE_PAYS = ${enQuiz.length};
export const NOMBRE_DRAPEAUX = ${enQuiz.filter((e) => e.drapeauPropre).length};
export const NOMBRE_CAPITALES = ${enQuiz.filter((e) => e.capitale).length};
export const NOMBRE_ETATS = ${entites.filter((e) => e.statut !== "territoire").length};
`,
);

// Les récits des fiches : chargés à la demande (import dynamique), jamais dans le premier écran.
const tsRecits = `// Fichier produit par scripts/monde/construire.mjs : ne pas modifier à la main.
// Rédaction : scripts/monde/recits/*.mjs ; population des villes : GeoNames (CC BY 4.0), arrondie.
import type { Recit } from "./types";

export const RECITS: Readonly<Record<string, Recit>> = ${JSON.stringify(recits, null, 1).replace(/\n\s*/g, " ").replace(/\{ /g, "{").replace(/ \}/g, "}").replace(/\}, "/g, '},\n  "')};
`;
writeFileSync(join(racine, "src", "lib", "monde", "recits.ts"), tsRecits);
const tsOrgs = `// Fichier produit par scripts/monde/construire.mjs : ne pas modifier à la main (source : scripts/monde/curation-plus.mjs).
import type { OrganisationId } from "./types";

/** Les organisations dont les pays sont membres (la liste des membres est sur chaque pays : Pays.orgs). */
export const ORGANISATIONS: Readonly<Record<OrganisationId, { nom: string; court: string; texte: string }>> = ${JSON.stringify(
  Object.fromEntries(Object.entries(P.ORGANISATIONS).map(([id, o]) => [id, { nom: o.nom, court: o.court, texte: o.texte }])),
  null,
  2,
)};
`;
writeFileSync(join(racine, "src", "lib", "monde", "organisations.ts"), tsOrgs);

const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`${entites.length} entités, dont ${entites.filter((e) => e.quiz).length} dans les quiz`);
console.log(`  drapeaux propres : ${entites.filter((e) => e.quiz && e.drapeauPropre).length} ; capitales : ${entites.filter((e) => e.quiz && e.capitale).length} ; monnaies : ${entites.filter((e) => e.quiz && e.quizMonnaie).length} ; sur la carte : ${entites.filter((e) => e.carte).length}`);
console.log(`  drapeaux : ${fichiers.size} fichiers, ${ko(poidsAvant)} → ${ko(poidsApres)}`);
console.log(`  carte : ${ko(carte.length)} (${finale.arcs.reduce((s, a) => s + a.length, 0)} points) ; légère : ${ko(carteLegere.length)} (${legere.arcs.reduce((s, a) => s + a.length, 0)} points) ; ultra : ${ko(carteUltra.length)} (${ultra.arcs.reduce((s, a) => s + a.length, 0)} points)`);
console.log(`  données : ${ko(ts.length)} ; récits : ${ko(tsRecits.length)} (${Object.keys(recits).length} fiches)`);
console.log(`  sans géométrie : ${entites.filter((e) => !e.carte).map((e) => e.code).join(" ")}`);
