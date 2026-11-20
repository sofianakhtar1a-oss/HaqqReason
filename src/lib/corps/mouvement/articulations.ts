/*
 * L'Écorché — les degrés de liberté du squelette : quel segment tourne, autour de quel axe mesuré, de combien.
 *
 * Les centres et les axes viennent de la géométrie des os (scripts/corps/squelette.py → modele/squelette.json).
 * Les amplitudes sont celles de l'examen clinique chez l'adulte (voir AMPLITUDES_SOURCES) ; zéro est la position
 * anatomique du modèle : debout, bras le long du corps, paumes vers l'avant.
 *
 * Un degré de liberté latéral existe des deux côtés (« coude.flexion:g », « coude.flexion:d »). Son angle positif
 * fait le mouvement nommé `plus`, son angle négatif le mouvement `moins`. Pour la colonne, la tête et la mâchoire,
 * l'inclinaison et la rotation positives vont vers la gauche du sujet.
 */

export type Effet = {
  /** Le segment qui bouge. */
  segment: string;
  /** Le repère (un segment) dont on prend le centre comme pivot. */
  pivot: string;
  /** L'axe : « segment.nom » d'un axe mesuré, ou une direction fixe. */
  axe: string | [number, number, number];
  /** Degrés du segment par degré du mouvement (1 par défaut)… */
  part?: number;
  /** … ou une courbe : valeur du mouvement → degrés du segment. */
  courbe?: [number, number][];
  /** Une translation le long de l'axe au lieu d'une rotation : millimètres par unité du mouvement. */
  glisse?: number;
  /** Pour un mouvement du milieu du corps qui déplace des segments latéraux : de quel côté. */
  cote?: "g" | "d";
};

export type Ddl = {
  id: string;
  /** L'articulation, dans le vocabulaire des fiches (donnees/fiches/vocabulaire.json). */
  articulation: string;
  /** Le nom du mouvement vers le minimum, vers le maximum (vocabulaire des fiches). */
  moins: string;
  plus: string;
  min: number;
  max: number;
  lateral: boolean;
  unite: "°" | "mm" | "";
  effets: Effet[];
};

const somme = (l: number[]) => l.reduce((a, b) => a + b, 0);

/** Un mouvement de la colonne, réparti entre ses étages à proportion de leur mobilité propre. */
function colonne(id: string, articulation: string, segments: string[], parts: number[], axe: string, min: number, max: number, moins: string, plus: string): Ddl {
  const total = somme(parts);
  return { id, articulation, moins, plus, min, max, lateral: false, unite: "°", effets: segments.map((s, k) => ({ segment: s, pivot: s, axe: `${s}.${axe}`, part: parts[k] / total })) };
}

const CERVICALES = ["axis", "c3", "c4", "c5", "c6", "c7"];
const THORACIQUES = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12"];
const LOMBAIRES = ["l1", "l2", "l3", "l4", "l5"];
/** La rotation de chaque côte à l'inspiration profonde, en degrés (les côtes moyennes et basses bougent le plus). */
const COTES_INSPIRATION = [3, 5, 6, 6, 6.5, 7, 7.5, 8, 8, 7, 5, 4];

const simple = (id: string, articulation: string, segment: string, axe: string, min: number, max: number, moins: string, plus: string, autres: Partial<Ddl> = {}): Ddl => ({
  id,
  articulation,
  moins,
  plus,
  min,
  max,
  lateral: true,
  unite: "°",
  effets: [{ segment, pivot: segment, axe: `${segment}.${axe}` }],
  ...autres,
});

const DOIGTS = ["index", "majeur", "annulaire", "auriculaire"] as const;
const ORTEILS = ["orteil2", "orteil3", "orteil4", "orteil5"] as const;

export const DDL: Ddl[] = [
  // ---- la mâchoire : elle tourne sur ses condyles, qui glissent en même temps vers l'avant sur le tubercule articulaire
  {
    id: "machoire.ouverture",
    articulation: "temporo-mandibulaire",
    moins: "elevation",
    plus: "abaissement",
    min: 0,
    max: 28,
    lateral: false,
    unite: "°",
    effets: [
      { segment: "mandibule", pivot: "mandibule", axe: [0, -0.5, 0.866], glisse: 0.34 },
      { segment: "mandibule", pivot: "mandibule", axe: "mandibule.ouverture" },
    ],
  },
  { id: "machoire.propulsion", articulation: "temporo-mandibulaire", moins: "retropulsion", plus: "propulsion", min: -3, max: 9, lateral: false, unite: "mm", effets: [{ segment: "mandibule", pivot: "mandibule", axe: [0, -0.26, 0.966], glisse: 1 }] },
  { id: "machoire.diduction", articulation: "temporo-mandibulaire", moins: "diduction", plus: "diduction", min: -7, max: 7, lateral: false, unite: "°", effets: [{ segment: "mandibule", pivot: "mandibule", axe: [0, 1, 0] }] },
  { id: "hyoide.elevation", articulation: "os-hyoide", moins: "abaissement", plus: "elevation", min: -10, max: 16, lateral: false, unite: "mm", effets: [{ segment: "hyoide", pivot: "hyoide", axe: [0, 0.94, 0.34], glisse: 1 }] },
  // ---- la tête sur le cou : le « oui » entre l'occiput et l'atlas, le « non » entre l'atlas et l'axis
  {
    id: "tete.flexion",
    articulation: "tete",
    moins: "extension",
    plus: "flexion",
    min: -25,
    max: 20,
    lateral: false,
    unite: "°",
    effets: [
      { segment: "atlas", pivot: "atlas", axe: "atlas.flexion", part: 0.38 },
      { segment: "tete", pivot: "tete", axe: "tete.flexion", part: 0.62 },
    ],
  },
  {
    id: "tete.inclinaison",
    articulation: "tete",
    moins: "inclinaison",
    plus: "inclinaison",
    min: -8,
    max: 8,
    lateral: false,
    unite: "°",
    effets: [
      { segment: "atlas", pivot: "atlas", axe: "atlas.inclinaison", part: 0.35 },
      { segment: "tete", pivot: "tete", axe: "tete.inclinaison", part: 0.65 },
    ],
  },
  {
    id: "tete.rotation",
    articulation: "tete",
    moins: "rotation",
    plus: "rotation",
    min: -43,
    max: 43,
    lateral: false,
    unite: "°",
    effets: [
      { segment: "atlas", pivot: "atlas", axe: "atlas.rotation", part: 0.93 },
      { segment: "tete", pivot: "tete", axe: "tete.rotation", part: 0.07 },
    ],
  },
  // ---- la colonne, étage par étage (parts : White et Panjabi, Clinical Biomechanics of the Spine)
  colonne("cervical.flexion", "rachis-cervical", CERVICALES, [10, 15, 20, 20, 17, 9], "flexion", -50, 40, "extension", "flexion"),
  colonne("cervical.inclinaison", "rachis-cervical", CERVICALES, [10, 11, 11, 8, 7, 4], "inclinaison", -38, 38, "inclinaison", "inclinaison"),
  colonne("cervical.rotation", "rachis-cervical", CERVICALES, [3, 7, 7, 7, 6, 2], "rotation", -35, 35, "rotation", "rotation"),
  colonne("thoracique.flexion", "rachis-thoracique", THORACIQUES, [4, 4, 4, 4, 4, 5, 6, 6, 6, 9, 12, 12], "flexion", -25, 40, "extension", "flexion"),
  colonne("thoracique.inclinaison", "rachis-thoracique", THORACIQUES, [6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 9, 8], "inclinaison", -26, 26, "inclinaison", "inclinaison"),
  colonne("thoracique.rotation", "rachis-thoracique", THORACIQUES, [9, 8, 8, 8, 8, 8, 8, 7, 4, 2, 2, 2], "rotation", -33, 33, "rotation", "rotation"),
  colonne("lombaire.flexion", "rachis-lombaire", LOMBAIRES, [12, 14, 15, 17, 20], "flexion", -25, 55, "extension", "flexion"),
  colonne("lombaire.inclinaison", "rachis-lombaire", LOMBAIRES, [6, 6, 8, 6, 3], "inclinaison", -22, 22, "inclinaison", "inclinaison"),
  colonne("lombaire.rotation", "rachis-lombaire", LOMBAIRES, [2, 2, 2, 2, 5], "rotation", -8, 8, "rotation", "rotation"),
  // ---- la respiration : chaque côte tourne autour de l'axe de son col (1 = inspiration profonde)
  {
    id: "respiration.inspiration",
    articulation: "respiration",
    moins: "expiration",
    plus: "inspiration",
    min: -0.4,
    max: 1,
    lateral: false,
    unite: "",
    effets: COTES_INSPIRATION.flatMap((angle, k) => (["g", "d"] as const).map((cote) => ({ segment: `cote-${k + 1}`, pivot: `cote-${k + 1}`, axe: `cote-${k + 1}.inspiration`, part: angle, cote }))),
  },
  // ---- la ceinture scapulaire : la clavicule pivote sur le sternum, la scapula sur l'acromion
  {
    id: "scapula.elevation",
    articulation: "scapula",
    moins: "abaissement",
    plus: "elevation",
    min: -10,
    max: 38,
    lateral: true,
    unite: "°",
    effets: [
      { segment: "clavicule", pivot: "clavicule", axe: "clavicule.elevation" },
      // la scapula monte sans basculer : elle rend à l'acromion ce que la clavicule a tourné
      { segment: "scapula", pivot: "scapula", axe: "clavicule.elevation", part: -0.8 },
    ],
  },
  {
    id: "scapula.protraction",
    articulation: "scapula",
    moins: "retraction",
    plus: "protraction",
    min: -25,
    max: 30,
    lateral: true,
    unite: "°",
    effets: [
      { segment: "clavicule", pivot: "clavicule", axe: "clavicule.protraction" },
      // la scapula contourne le thorax : elle y reste appliquée en tournant un peu sur l'acromion
      { segment: "scapula", pivot: "scapula", axe: "scapula.sonnette", part: -0.6 },
    ],
  },
  {
    id: "scapula.sonnette",
    articulation: "scapula",
    moins: "sonnette-mediale",
    plus: "sonnette-laterale",
    min: -15,
    max: 60,
    lateral: true,
    unite: "°",
    // Pour que la scapula reste appliquée sur les côtes pendant qu'elle tourne, la clavicule monte et recule un
    // peu, et la scapula bascule en arrière (son angle inférieur avance) : parts ajustées sur le modèle, dans le
    // sens des mesures in vivo (Ludewig et al., J Bone Joint Surg Am 2009).
    effets: [
      { segment: "clavicule", pivot: "clavicule", axe: "clavicule.elevation", part: 0.2 },
      { segment: "clavicule", pivot: "clavicule", axe: "clavicule.protraction", part: -0.25 },
      { segment: "scapula", pivot: "scapula", axe: "scapula.sonnette" },
      { segment: "scapula", pivot: "scapula", axe: "scapula.bascule", part: -0.75 },
    ],
  },
  // ---- l'épaule : l'humérus s'oriente par rapport au thorax (la scapula l'accompagne : voir squelette.ts)
  simple("epaule.flexion", "epaule", "humerus", "flexion", -50, 170, "extension", "flexion"),
  simple("epaule.abduction", "epaule", "humerus", "abduction", -20, 170, "adduction", "abduction"),
  simple("epaule.rotation", "epaule", "humerus", "rotation", -80, 85, "rotation-laterale", "rotation-mediale"),
  simple("coude.flexion", "coude", "ulna", "flexion", 0, 145, "extension", "flexion"),
  // (la position anatomique est la supination complète)
  simple("avant-bras.pronation", "radio-ulnaire", "radius", "pronation", 0, 160, "supination", "pronation"),
  simple("poignet.flexion", "poignet", "main", "flexion", -70, 80, "extension", "flexion"),
  simple("poignet.abduction", "poignet", "main", "abduction", -35, 20, "adduction", "abduction"),
  // ---- le pouce
  simple("pouce.cmc-flexion", "pouce-cmc", "pouce-mc", "flexion", -20, 25, "extension", "flexion"),
  simple("pouce.cmc-abduction", "pouce-cmc", "pouce-mc", "abduction", -5, 60, "adduction", "abduction"),
  simple("pouce.cmc-rotation", "pouce-cmc", "pouce-mc", "rotation", 0, 40, "opposition", "opposition"),
  simple("pouce.mcp", "pouce-mcp", "pouce-p1", "flexion", -5, 55, "extension", "flexion"),
  simple("pouce.ip", "pouce-ip", "pouce-p2", "flexion", -15, 80, "extension", "flexion"),
  // ---- les doigts longs
  ...DOIGTS.flatMap((d) => [
    simple(`${d}.mcp`, "doigts-mcp", `${d}-p1`, "flexion", -30, 90, "extension", "flexion"),
    simple(`${d}.ecart`, "doigts-mcp", `${d}-p1`, "abduction", -20, 20, "adduction", "abduction"),
    simple(`${d}.ipp`, "doigts-ipp", `${d}-p2`, "flexion", 0, 105, "extension", "flexion"),
    simple(`${d}.ipd`, "doigts-ipd", `${d}-p3`, "flexion", -5, 80, "extension", "flexion"),
  ]),
  // ---- le membre inférieur
  simple("hanche.flexion", "hanche", "femur", "flexion", -20, 120, "extension", "flexion"),
  simple("hanche.abduction", "hanche", "femur", "abduction", -25, 45, "adduction", "abduction"),
  simple("hanche.rotation", "hanche", "femur", "rotation", -45, 40, "rotation-laterale", "rotation-mediale"),
  {
    id: "genou.flexion",
    articulation: "genou",
    moins: "extension",
    plus: "flexion",
    min: 0,
    max: 140,
    lateral: true,
    unite: "°",
    effets: [
      { segment: "jambe", pivot: "jambe", axe: "jambe.flexion" },
      // la patella, tenue par son ligament, suit le tibia en glissant dans la trochlée
      { segment: "patella", pivot: "jambe", axe: "jambe.flexion", part: 0.78 },
    ],
  },
  // (la rotation du genou n'existe que genou fléchi : le moteur la borne selon la flexion)
  simple("genou.rotation", "genou", "jambe", "rotation", -35, 25, "rotation-laterale", "rotation-mediale"),
  simple("cheville.flexion", "cheville", "talus", "flexion-dorsale", -50, 20, "flexion-plantaire", "flexion-dorsale"),
  simple("pied.inversion", "subtalaire", "pied", "inversion", -18, 32, "eversion", "inversion"),
  simple("hallux.mtp", "hallux-mtp", "hallux-p1", "flexion", -70, 45, "extension", "flexion"),
  simple("hallux.ip", "hallux-ip", "hallux-p2", "flexion", 0, 80, "extension", "flexion"),
  ...ORTEILS.flatMap((o) => [
    simple(`${o}.mtp`, "orteils-mtp", `${o}-p1`, "flexion", -45, 40, "extension", "flexion"),
    simple(`${o}.ipp`, "orteils-ip", `${o}-p2`, "flexion", 0, 35, "extension", "flexion"),
    simple(`${o}.ipd`, "orteils-ip", `${o}-p3`, "flexion", 0, 55, "extension", "flexion"),
  ]),
  // ---- l'œil
  simple("oeil.elevation", "oeil", "oeil", "elevation", -45, 35, "abaissement", "elevation"),
  simple("oeil.adduction", "oeil", "oeil", "adduction", -45, 45, "abduction", "adduction"),
  simple("oeil.torsion", "oeil", "oeil", "torsion", -12, 12, "rotation-laterale", "rotation-mediale"),
];

export const DDL_PAR_ID: Record<string, Ddl> = Object.fromEntries(DDL.map((d) => [d.id, d]));

/** D'où viennent les amplitudes (page « Sources et licences »). */
export const AMPLITUDES_SOURCES = [
  "American Academy of Orthopaedic Surgeons, Joint Motion: Method of Measuring and Recording (1965)",
  "I. A. Kapandji, Anatomie fonctionnelle (Maloine)",
  "C. C. Norkin, D. J. White, Measurement of Joint Motion: A Guide to Goniometry (F. A. Davis)",
  "A. A. White, M. M. Panjabi, Clinical Biomechanics of the Spine (Lippincott)",
  "P. M. Ludewig et al., Motion of the shoulder complex during multiplanar humeral elevation, J Bone Joint Surg Am 2009",
];

/** Le nom des articulations qu'on peut manier, pour l'interface. */
export const NOMS_ARTICULATIONS: Record<string, string> = {
  "temporo-mandibulaire": "Mâchoire",
  "os-hyoide": "Os hyoïde",
  tete: "Tête",
  "rachis-cervical": "Cou",
  "rachis-thoracique": "Rachis thoracique",
  "rachis-lombaire": "Rachis lombaire",
  respiration: "Respiration",
  scapula: "Scapula",
  epaule: "Épaule",
  coude: "Coude",
  "radio-ulnaire": "Avant-bras",
  poignet: "Poignet",
  "pouce-cmc": "Pouce (base)",
  "pouce-mcp": "Pouce (milieu)",
  "pouce-ip": "Pouce (bout)",
  "doigts-mcp": "Doigts (base)",
  "doigts-ipp": "Doigts (milieu)",
  "doigts-ipd": "Doigts (bout)",
  hanche: "Hanche",
  genou: "Genou",
  cheville: "Cheville",
  subtalaire: "Arrière-pied",
  "hallux-mtp": "Gros orteil (base)",
  "hallux-ip": "Gros orteil (bout)",
  "orteils-mtp": "Orteils (base)",
  "orteils-ip": "Orteils (bout)",
  oeil: "Œil",
};

export const NOMS_MOUVEMENTS: Record<string, string> = {
  flexion: "Flexion",
  extension: "Extension",
  abduction: "Abduction",
  adduction: "Adduction",
  "rotation-mediale": "Rotation médiale",
  "rotation-laterale": "Rotation latérale",
  pronation: "Pronation",
  supination: "Supination",
  elevation: "Élévation",
  abaissement: "Abaissement",
  protraction: "Protraction",
  retraction: "Rétraction",
  "sonnette-laterale": "Sonnette latérale",
  "sonnette-mediale": "Sonnette médiale",
  inclinaison: "Inclinaison",
  rotation: "Rotation",
  "rotation-homolaterale": "Rotation du même côté",
  "rotation-controlaterale": "Rotation du côté opposé",
  "flexion-dorsale": "Flexion dorsale",
  "flexion-plantaire": "Flexion plantaire",
  inversion: "Inversion",
  eversion: "Éversion",
  opposition: "Opposition",
  propulsion: "Propulsion",
  retropulsion: "Rétropulsion",
  diduction: "Diduction",
  inspiration: "Inspiration",
  expiration: "Expiration",
};
