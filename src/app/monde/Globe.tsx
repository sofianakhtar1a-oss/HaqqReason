"use client";

import {
  type GeoContext,
  geoArea,
  geoCentroid,
  geoCircle,
  geoContains,
  geoDistance,
  geoEqualEarth,
  geoGraticule10,
  geoInterpolate,
  geoMercator,
  geoOrthographic,
  geoPath,
  type GeoProjection,
  geoRotation,
} from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { soleilAuZenith } from "@/lib/monde/calques";
import { PAYS } from "@/lib/monde/donnees";
import { type Carte, type Forme, useCarte } from "./carte";
import { type Geographie, useGeographie } from "./geographie";

/*
 * Le globe du Portulan, dessiné sur un <canvas>.
 *
 *   • Trois projections : le globe (orthographique), le planisphère (Equal Earth, qui garde les surfaces)
 *     et le Mercator (celui des écoles, qui garde les angles et gonfle les pays du Nord).
 *   • Il vise un pays (cible) : il tourne vers lui en suivant le grand cercle, s'éloigne un peu
 *     pendant le voyage puis s'approche, le pays s'allume. Rien ne bouge si l'on a demandé de
 *     réduire les animations : le globe saute directement à sa place.
 *   • On le fait tourner du doigt, de la souris ou au clavier (flèches, plus et moins, Entrée), on zoome
 *     à la molette ou à deux doigts.
 *   • Des calques s'ajoutent sur demande : les pays coloriés (couleurs, rayes), leurs noms et leurs
 *     capitales selon le zoom, les mers, les lacs et les fleuves, le relief et les sommets, la nuit,
 *     des silhouettes de pays à promener (la vraie taille), le contour d'un pays (« mon pays »).
 *   • Il ne dessine que ce qui se voit, et seulement quand quelque chose change (aucune boucle à vide).
 *     Pendant un mouvement, la carte légère ; au repos, la détaillée.
 *   • Les couleurs viennent des variables CSS (--pt-*) : le thème clair ou sombre s'applique seul.
 */

export type Teinte = "or" | "juste" | "faux" | "choix" | "doux" | "cible";
export type Mode = "globe" | "plan" | "mercator";
export type Vue = { lon: number; lat: number; zoom: number };
/** Un point posé sur le globe (une capitale, une réponse, La Mecque…), avec son nom s'il en a un. */
export type Marque = { latlng: [number, number]; teinte: Teinte; taille?: number; libelle?: string };
/** Une route tracée sur le globe : une suite de points [latitude, longitude]. */
export type Trait = { points: [number, number][]; teinte: Teinte; tirets?: boolean; epaisseur?: number };
/**
 * La silhouette d'un pays, posée ailleurs sur le globe sans changer de taille : le centre de son corps
 * principal va en vers [latitude, longitude] (sans vers : à sa place).
 */
export type Silhouette = { code: string; vers?: [number, number]; teinte: Teinte };

export type GlobeProps = {
  mode?: Mode;
  /** Le pays visé : le globe tourne vers lui et l'allume. */
  cible?: string | null;
  /** Ne pas zoomer sur la cible (on la voit dans son voisinage). */
  recul?: number;
  /** D'autres pays à colorier (maîtrisés, bonne ou mauvaise réponse…). */
  teintes?: Record<string, Teinte>;
  /** Les pays d'un calque, chacun de sa couleur (une couleur CSS) ; les teintes passent par-dessus. */
  couleurs?: Record<string, string>;
  /** Des pays rayés par-dessus leur couleur (ceux qui vivent à plusieurs heures, par exemple). */
  rayes?: readonly string[];
  /** Les noms des pays et des capitales, qui paraissent à mesure qu'on s'approche (« petits » : les petits pays d'abord, pour un encart). */
  etiquettes?: boolean | "petits";
  /** Les mers, les océans, les lacs et les fleuves. */
  geographie?: boolean;
  /** Le relief (les monts à la manière des cartes anciennes), les chaînes, les déserts et les sommets. */
  relief?: boolean;
  /** Le jour et la nuit à cet instant (en millisecondes) ; rien : pas de nuit. */
  nuit?: number | null;
  /** Des nuages qui dérivent vers l'est au-dessus des terres et des mers (le globe de l'accueil). */
  nuages?: boolean;
  /** Des silhouettes de pays qu'on promène à la main (la vraie taille). */
  silhouettes?: Silhouette[];
  /** Une silhouette lâchée à un nouvel endroit. */
  onSilhouette?: (index: number, vers: [number, number]) => void;
  /** Un pays cerné d'un trait (« mon pays »). */
  contour?: string | null;
  /** Le globe tourne seul, doucement, tant qu'on n'y touche pas. */
  tourne?: boolean;
  interactif?: boolean;
  /** On peut le faire tourner du doigt ou de la souris, dans tous les sens (sans zoom ni choix de pays). */
  glissable?: boolean;
  /** Toucher un pays (null : la mer). */
  onToucher?: (code: string | null) => void;
  /** Les repères des tout petits pays (micro-États, îles) : toujours, ou seulement la cible. */
  reperes?: "tous" | "cible";
  vueInitiale?: Partial<Vue>;
  className?: string;
  libelle: string;
  /** Prévenu quand le globe a fini de viser la cible. */
  onArrive?: () => void;
  /** Des points et des routes à dessiner par-dessus la carte. */
  marques?: Marque[];
  traits?: Trait[];
  /** Toucher un point du globe (au lieu d'un pays) : [latitude, longitude], ou null dans le vide. */
  onPoint?: (latlng: [number, number] | null) => void;
};

export type GlobeRef = {
  viser: (code: string) => void;
  vue: () => Vue;
  zoomer: (facteur: number) => void;
  recentrer: () => void;
  voler: (vers: Vue) => void;
  /** Le pays sous un point [latitude, longitude] (null : la mer). */
  paysA: (latlng: [number, number]) => string | null;
};

type Couleurs = Record<
  | "merCentre"
  | "merBord"
  | "terre"
  | "trait"
  | "grille"
  | "cible"
  | "cibleTrait"
  | "or"
  | "juste"
  | "faux"
  | "choix"
  | "doux"
  | "halo"
  | "repere"
  | "etiquette"
  | "etiquetteHalo"
  | "capitale"
  | "merNom"
  | "lac"
  | "fleuve"
  | "fleuveNom"
  | "reliefOmbre"
  | "reliefTrait"
  | "reliefNom"
  | "desertNom"
  | "nuit"
  | "terminateur"
  | "soleil"
  | "rayure"
  | "nuage",
  string
>;

const lireCouleurs = (el: Element): Couleurs => {
  const s = getComputedStyle(el);
  const v = (n: string, d: string) => s.getPropertyValue(n).trim() || d;
  return {
    merCentre: v("--pt-mer-centre", "#1a2c6e"),
    merBord: v("--pt-mer-bord", "#0b1440"),
    terre: v("--pt-terre", "#5d5f78"),
    trait: v("--pt-trait", "#a99363"),
    grille: v("--pt-grille", "rgba(233,190,106,0.12)"),
    cible: v("--pt-cible", "#ffa65c"),
    cibleTrait: v("--pt-cible-trait", "#ffe1c4"),
    or: v("--pt-or", "#c9a15a"),
    juste: v("--pt-juste", "#58c99f"),
    faux: v("--pt-faux", "#e46a6a"),
    choix: v("--pt-choix", "#7cc8f2"),
    doux: v("--pt-doux", "#8a8a9a"),
    halo: v("--pt-halo", "rgba(124,200,242,0.28)"),
    nuage: v("--pt-nuage", "rgba(255,255,255,0.95)"),
    repere: v("--pt-repere", "#e9be6a"),
    etiquette: v("--pt-etiquette", "#f6eedb"),
    etiquetteHalo: v("--pt-etiquette-halo", "rgba(14,20,52,0.72)"),
    capitale: v("--pt-capitale", "#ffe7c2"),
    merNom: v("--pt-mer-nom", "rgba(186,206,255,0.72)"),
    lac: v("--pt-lac", "#22397f"),
    fleuve: v("--pt-fleuve", "rgba(120,170,255,0.8)"),
    fleuveNom: v("--pt-fleuve-nom", "#a9c8ff"),
    reliefOmbre: v("--pt-relief-ombre", "rgba(28,22,14,0.42)"),
    reliefTrait: v("--pt-relief-trait", "rgba(246,230,190,0.8)"),
    reliefNom: v("--pt-relief-nom", "#f0d9a6"),
    desertNom: v("--pt-desert-nom", "#f2d497"),
    nuit: v("--pt-nuit", "rgba(4,8,28,0.2)"),
    terminateur: v("--pt-terminateur", "rgba(255,200,120,0.55)"),
    soleil: v("--pt-soleil", "#ffcf5c"),
    rayure: v("--pt-rayure", "rgba(20,16,40,0.5)"),
  };
};

/** Une carte plane (le planisphère ou le Mercator) : pas de face cachée, pas d'élan. */
const estPlan = (m: Mode) => m !== "globe";
const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/*
 * Les nuages : des bancs étirés le long des parallèles, là où ils naissent sur la vraie Terre
 * (les dépressions des latitudes moyennes, la ceinture de l'équateur, quelques cumulus des alizés).
 * Tirés une fois pour toutes (la même graine : le même ciel à chaque visite).
 */
type Nuage = { lon: number; lat: number; r: number; a: number };
const NUAGES: readonly Nuage[] = (() => {
  let graine = 20251119;
  const h = () => {
    graine = (graine * 1664525 + 1013904223) >>> 0;
    return graine / 4294967296;
  };
  const sortie: Nuage[] = [];
  for (let s = 0; s < 26; s++) {
    const bande = h();
    const lat0 = bande < 0.34 ? 38 + h() * 22 : bande < 0.68 ? -(38 + h() * 20) : bande < 0.86 ? (h() - 0.5) * 14 : (h() - 0.5) * 50;
    const lon0 = h() * 360 - 180;
    const n = 3 + Math.floor(h() * 6);
    const pas = 2.6 + h() * 3;
    for (let i = 0; i < n; i++) sortie.push({ lon: lon0 + (i - n / 2) * pas, lat: lat0 + (h() - 0.5) * 5 + Math.sin(i) * 1.5, r: 2.2 + h() * 4.2, a: 0.45 + h() * 0.55 });
  }
  return sortie;
})();
/** Un flocon de nuage : un disque blanc qui s'efface vers le bord (dessiné une fois par couleur). */
const flocons = new Map<string, HTMLCanvasElement>();
function flocon(couleur: string): HTMLCanvasElement {
  const deja = flocons.get(couleur);
  if (deja) return deja;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  if (x) {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, couleur);
    g.addColorStop(0.45, couleur);
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.globalAlpha = 1;
    x.beginPath();
    x.arc(32, 32, 32, 0, Math.PI * 2);
    x.fill();
  }
  flocons.set(couleur, c);
  return c;
}
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const DEG = 180 / Math.PI;
const lisse = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const SERIF = "'Literata Variable', Georgia, serif";

/** Un Path2D sert de contexte à d3 (qui n'appelle que moveTo, lineTo, closePath et arc). */
const enChemin = (p: Path2D) => p as unknown as GeoContext;

/** Les pays qu'on ne voit pas sur la carte (trop petits, ou sans forme) : un repère rond. */
const REPERES = PAYS.filter((p) => !p.carte || (p.superficie ?? 0) < 2600).map((p) => ({ code: p.code, lonlat: [p.latlng[1], p.latlng[0]] as [number, number] }));
/** Les noms des pays, des plus grands aux plus petits (les grands d'abord trouvent leur place). */
const ORDRE_NOMS = [...PAYS].sort((a, b) => (b.superficie ?? 0) - (a.superficie ?? 0));
/** Dans un encart, les petits États d'abord (c'est pour eux qu'on l'ouvre), puis les territoires. */
const ORDRE_PETITS = [...ORDRE_NOMS].reverse().sort((a, b) => Number(a.statut === "territoire") - Number(b.statut === "territoire"));
/** Les capitales, des plus connues aux moins connues. */
const ORDRE_CAPITALES = PAYS.filter((p) => p.capitale && p.capLatLng).sort((a, b) => a.rangCapitale - b.rangCapitale);

/** Le zoom qui montre un pays en entier, assez grand. */
function zoomPour(forme: Forme | undefined, recul = 1): number {
  if (!forme) return 6;
  const r = Math.max(forme.rayon, 0.004);
  return borne((0.55 / r) * (1 / recul), 1, 26);
}

/* ---------- Les noms : mesurer une fois, ne jamais se chevaucher ---------- */
type Boite = [number, number, number, number];
const mesures = new Map<string, number>();
function largeur(ctx: CanvasRenderingContext2D, police: string, texte: string): number {
  const cle = `${police}|${texte}`;
  let w = mesures.get(cle);
  if (w === undefined) {
    ctx.font = police;
    w = ctx.measureText(texte).width;
    if (mesures.size > 5000) mesures.clear();
    mesures.set(cle, w);
  }
  return w;
}
/** Couper un nom trop long en deux lignes, à l'espace ou au trait d'union le plus proche du milieu. */
function couper(nom: string): [string, string] | null {
  let meilleur = -1;
  for (let i = 1; i < nom.length - 1; i++) if ((nom[i] === " " || nom[i] === "-") && (meilleur < 0 || Math.abs(i - nom.length / 2) < Math.abs(meilleur - nom.length / 2))) meilleur = i;
  if (meilleur < 0) return null;
  return nom[meilleur] === "-" ? [nom.slice(0, meilleur + 1), nom.slice(meilleur + 1)] : [nom.slice(0, meilleur), nom.slice(meilleur + 1)];
}
const espacer = (ctx: CanvasRenderingContext2D, px: number) => {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
};

/** Les seuils (en pixels par radian au centre de la vue) à partir desquels chaque rang paraît. */
const SEUILS_MERS = [0, 430, 820, 1500, 2700];
const SEUILS_CHAINES = [0, 380, 760, 1400, 2600];
const SEUILS_FLEUVES = [0, 650, 950, 1500, 2500, 4000];
const SEUILS_LACS = [0, 850, 1400, 2400, 3800];
const SEUILS_SOMMETS = [0, 900, 1600, 2800];
const SEUILS_TRACES_FLEUVES = [0, 0, 0, 420, 700, 1100, 2000];

/**
 * Le corps d'un pays, pour sa silhouette : son plus grand morceau et les terres à moins de 4 500 km de
 * lui (l'Alaska suit les États-Unis, pas Hawaï ; la Corse suit la France, pas la Guyane).
 */
const corps = new WeakMap<Forme, { polygones: number[][][][]; centre: [number, number] }>();
function corpsDe(forme: Forme) {
  let c = corps.get(forme);
  if (!c) {
    const g = forme.f.geometry;
    const tous = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    let grand = tous[0] ?? [];
    let aire = -1;
    for (const p of tous) {
      const a = geoArea({ type: "Polygon", coordinates: p });
      if (a > aire) [aire, grand] = [a, p];
    }
    const centre = (grand.length ? geoCentroid({ type: "Polygon", coordinates: grand }) : forme.centre) as [number, number];
    const polygones = tous.filter((p) => p === grand || geoDistance(centre, geoCentroid({ type: "Polygon", coordinates: p }) as [number, number]) < 4500 / 6371);
    c = { polygones, centre };
    corps.set(forme, c);
  }
  return c;
}

/** Une forme de pays déplacée sur la sphère : son centre va en vers, sans que la forme change de taille. */
function deplacer(forme: Forme, vers: [number, number] | null): Feature<Geometry> | null {
  const { polygones, centre } = corpsDe(forme);
  if (!polygones.length) return null;
  if (!vers) return { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: polygones } };
  const de = geoRotation([-centre[0], -centre[1]]);
  const a = geoRotation([-vers[1], -vers[0]]);
  const f = (p: number[]) => a.invert(de(p as [number, number])) as [number, number];
  return { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: polygones.map((p) => p.map((r) => r.map(f))) } };
}

export const Globe = forwardRef<GlobeRef, GlobeProps>(function Globe(
  {
    mode = "globe",
    cible = null,
    recul = 1,
    teintes,
    couleurs: coloriage,
    rayes,
    etiquettes = false,
    geographie = false,
    relief = false,
    nuit = null,
    nuages = false,
    silhouettes,
    onSilhouette,
    contour = null,
    tourne = false,
    interactif = false,
    glissable = false,
    onToucher,
    reperes = "cible",
    vueInitiale,
    className,
    libelle,
    onArrive,
    marques,
    traits,
    onPoint,
  },
  ref,
) {
  const { ultra, leger, detail, erreur } = useCarte();
  const geo = useGeographie(Boolean(etiquettes || geographie || relief));
  const toile = useRef<HTMLCanvasElement>(null);
  const boite = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLSpanElement>(null);
  /** Le halo safran qui se diffuse autour du globe quand on le fait tourner. */
  const halo = useRef<HTMLSpanElement>(null);
  /** L'élan d'un globe lancé du doigt : sa vitesse, en degrés par milliseconde. */
  const elan = useRef<{ lon: number; lat: number } | null>(null);
  const vitesse = useRef({ lon: 0, lat: 0, t: 0 });
  const dernierElan = useRef(0);
  const vue = useRef<Vue>({ lon: vueInitiale?.lon ?? 10, lat: vueInitiale?.lat ?? 20, zoom: vueInitiale?.zoom ?? 1 });
  const vol = useRef<{ de: Vue; vers: Vue; t0: number; duree: number } | null>(null);
  const image = useRef(0);
  const enMouvement = useRef(false);
  const derniereInteraction = useRef(0);
  const dernierePas = useRef(0);
  const relance = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const couleurs = useRef<Couleurs | null>(null);
  const motif = useRef<CanvasPattern | null>(null);
  const taille = useRef({ l: 300, h: 300, dpr: 1 });
  const props = useRef({ mode, cible, teintes, coloriage, rayes, etiquettes, geographie, relief, nuit, nuages, silhouettes, onSilhouette, contour, tourne, reperes, onArrive, marques, traits, onPoint, onToucher });
  props.current = { mode, cible, teintes, coloriage, rayes, etiquettes, geographie, relief, nuit, nuages, silhouettes, onSilhouette, contour, tourne, reperes, onArrive, marques, traits, onPoint, onToucher };
  const cartes = useRef<{ ultra: Carte | null; leger: Carte | null; detail: Carte | null }>({ ultra, leger, detail });
  cartes.current = { ultra, leger, detail };
  const geoRef = useRef<Geographie | null>(geo);
  geoRef.current = geo;
  /** Les silhouettes déplacées à la main, en attendant que le parent les range. */
  const silVues = useRef(new Map<number, [number, number]>());
  const silFormes = useRef(new Map<string, Feature<Geometry> | null>());
  const glisse = useRef<{ i: number; depart: [number, number]; vers0: [number, number] } | null>(null);
  /** Ce que dit le globe au lecteur d'écran quand on le pilote au clavier. */
  const [annonce, setAnnonce] = useState("");
  const minuterieAnnonce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** La projection pour la vue courante. */
  const projection = useCallback((v: Vue): GeoProjection => {
    const { l, h } = taille.current;
    const m = props.current.mode;
    if (m === "plan" || m === "mercator") {
      const base =
        m === "plan"
          ? geoEqualEarth()
              .rotate([-v.lon, 0])
              .fitExtent(
                [
                  [6, 6],
                  [l - 6, h - 6],
                ],
                { type: "Sphere" },
              )
          : geoMercator().rotate([-v.lon, 0]);
      // Le Mercator remplit la largeur (le monde de 85° sud à 85° nord est un carré).
      const s = m === "plan" ? base.scale() * v.zoom : ((l - 12) / (2 * Math.PI)) * v.zoom;
      base.scale(s).translate([l / 2, h / 2]);
      const p = base([v.lon, v.lat]) ?? [l / 2, h / 2];
      base.translate([l - p[0], h - p[1]]);
      // La carte plane ne laisse jamais de vide au-dessus ou au-dessous : elle couvre la hauteur, ou se centre.
      const [[, y0], [, y1]] = geoPath(base).bounds({ type: "Sphere" });
      const [tx, ty] = base.translate();
      if (y1 - y0 <= h) return base.translate([tx, ty + h / 2 - (y0 + y1) / 2]);
      if (y0 > 0) return base.translate([tx, ty - y0]);
      if (y1 < h) return base.translate([tx, ty + h - y1]);
      return base;
    }
    const rayon = Math.min(l, h) / 2 - 8;
    return geoOrthographic()
      .rotate([-v.lon, -v.lat])
      .scale(rayon * v.zoom)
      .translate([l / 2, h / 2])
      .clipAngle(90)
      .precision(0.6);
  }, []);

  /** La forme d'une silhouette à sa place (gardée tant qu'elle ne bouge pas). */
  const formeSilhouette = useCallback((carte: Carte, code: string, vers: [number, number] | null) => {
    const cle = `${code}|${vers ? `${vers[0].toFixed(3)},${vers[1].toFixed(3)}` : "ici"}|${carte === cartes.current.detail ? "d" : carte === cartes.current.leger ? "l" : "u"}`;
    if (silFormes.current.has(cle)) return silFormes.current.get(cle)!;
    const forme = carte.parCode.get(code);
    const f = forme ? deplacer(forme, vers) : null;
    if (silFormes.current.size > 40) silFormes.current.clear();
    silFormes.current.set(cle, f);
    return f;
  }, []);

  const dessiner = useCallback(() => {
    image.current = 0;
    const canvas = toile.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = (couleurs.current ??= lireCouleurs(canvas));
    const { l, h, dpr } = taille.current;
    const v = vue.current;
    const plan = props.current.mode !== "globe";
    const bouge = enMouvement.current;
    const proche = v.zoom >= 3;
    // La carte selon la vue : l'ultra pour faire tourner le globe entier, la détaillée au repos ou de près.
    const { ultra: u, leger: lg, detail: dt } = cartes.current;
    const carte = proche ? (dt ?? lg ?? u) : bouge ? ((v.zoom < 1.8 ? u : lg) ?? lg ?? u ?? dt) : ((v.zoom < 1.8 ? lg : dt) ?? lg ?? dt ?? u);
    const proj = projection(v);
    // Pendant un mouvement, pas de rééchantillonnage des segments : la différence ne se voit pas.
    // Le contour d'une carte plane, lui, se rééchantillonne toujours (sans quoi il devient un hexagone).
    const grossier = bouge || carte !== dt ? 0 : 0.6;
    const net = plan ? 0.6 : grossier;
    proj.precision(net);
    const chemin = geoPath(proj, ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, l, h);
    const centreVue: [number, number] = [v.lon, v.lat];
    /** Sur le globe, un point de la face cachée ne se dessine pas. */
    const visible = (ll: [number, number], marge = 0.02) => plan || geoDistance(centreVue, ll) < Math.PI / 2 - marge;
    const dedans = (p: [number, number] | null, m = 30): p is [number, number] => !!p && p[0] > -m && p[1] > -m && p[0] < l + m && p[1] < h + m;
    // L'échelle au centre de la vue, en pixels par radian (les seuils des noms et des monts en dépendent).
    const echelleEn = (ll: [number, number]) => {
      const a = proj(ll);
      const b = proj([ll[0], ll[1] + (ll[1] > 80 ? -0.5 : 0.5)]);
      return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) / (0.5 / DEG) : proj.scale();
    };
    const centreEcran = plan ? (proj.invert?.([l / 2, h / 2]) ?? centreVue) : centreVue;
    const ppr = echelleEn([centreEcran[0], borne(centreEcran[1], -70, 70)]);
    /** Sur le globe, l'angle (depuis le centre de la vue) au-delà duquel rien ne se voit à l'écran. */
    const angleVu = plan ? Math.PI : Math.asin(Math.min(1, Math.hypot(l, h) / 2 / ((Math.min(l, h) / 2 - 8) * v.zoom))) + 0.05;
    const seVoit = (centre: [number, number], rayon: number) => plan || geoDistance(centreVue, centre) - rayon <= angleVu;

    // La mer : un dégradé de lapis, plus clair au centre.
    const [cx, cy] = [l / 2, h / 2];
    const r = plan ? Math.max(l, h) : (Math.min(l, h) / 2 - 8) * v.zoom;
    const fond = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.05, cx, cy, r);
    fond.addColorStop(0, c.merCentre);
    fond.addColorStop(1, c.merBord);
    if (!plan && v.zoom < 1.6) {
      // Le halo de l'atmosphère autour du globe.
      const halo = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.09);
      halo.addColorStop(0, c.halo);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.09, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    chemin({ type: "Sphere" });
    ctx.fillStyle = fond;
    ctx.fill();

    // Les méridiens et les parallèles, à l'encre d'or très pâle.
    ctx.beginPath();
    chemin(geoGraticule10());
    ctx.strokeStyle = c.grille;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    proj.precision(grossier);
    const cibleCode = props.current.cible;
    const t = props.current.teintes ?? {};
    const calque = props.current.coloriage ?? {};
    const couleurDe = (code: string): string | undefined => {
      const teinte = t[code];
      return teinte ? c[teinte] : calque[code];
    };
    // Les pays coloriés, groupés par couleur (les teintes passent par-dessus les couleurs du calque).
    const groupes = new Map<string, string[]>();
    for (const code of new Set([...Object.keys(calque), ...Object.keys(t)])) {
      if (code === cibleCode) continue;
      const couleur = couleurDe(code);
      if (!couleur) continue;
      const g = groupes.get(couleur);
      if (g) g.push(code);
      else groupes.set(couleur, [code]);
    }
    const rayures = (props.current.rayes ?? []).filter((code) => code !== cibleCode);
    if (rayures.length && !motif.current) {
      const m = document.createElement("canvas");
      m.width = m.height = 7;
      const mc = m.getContext("2d");
      if (mc) {
        mc.strokeStyle = c.rayure;
        mc.lineWidth = 1.3;
        mc.beginPath();
        mc.moveTo(-1, 8);
        mc.lineTo(8, -1);
        mc.moveTo(-1, 1);
        mc.lineTo(1, -1);
        mc.moveTo(6, 8);
        mc.lineTo(8, 6);
        mc.stroke();
        motif.current = ctx.createPattern(m, "repeat");
      }
    }

    // Le globe entier : les terres d'un seul tenant, les pays coloriés fusionnés, les frontières d'un trait.
    // Dès qu'on s'approche (une partie seulement se voit), ou quand les couleurs sont trop nombreuses pour
    // être fusionnées : pays par pays, et seulement ceux qui se voient.
    if (carte && v.zoom < 1.8 && groupes.size <= 12) {
      const terre = new Path2D();
      geoPath(proj, enChemin(terre))(carte.terre);
      ctx.fillStyle = c.terre;
      ctx.fill(terre);
      for (const [couleur, codes] of groupes) {
        ctx.beginPath();
        chemin(carte.fusion(codes));
        ctx.fillStyle = couleur;
        ctx.fill();
      }
      if (rayures.length && motif.current) {
        ctx.beginPath();
        chemin(carte.fusion(rayures));
        ctx.fillStyle = motif.current;
        ctx.fill();
      }
      ctx.lineJoin = "round";
      ctx.beginPath();
      chemin(carte.frontieres);
      ctx.strokeStyle = c.trait;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.lineWidth = 0.7;
      ctx.stroke(terre);
    } else if (carte) {
      // Seulement les pays qui se voient, chacun projeté une seule fois.
      const terre = new Path2D();
      const dessinTerre = geoPath(proj, enChemin(terre));
      const parCouleur = new Map<string, { chemin: Path2D; dessin: (f: Feature<Geometry>) => void }>();
      const raye = new Set(rayures);
      const cheminRayes = new Path2D();
      const dessinRayes = geoPath(proj, enChemin(cheminRayes));
      for (const f of carte.formes) {
        if (!seVoit(f.centre, f.rayon)) continue;
        if (f.code === cibleCode) continue;
        const couleur = couleurDe(f.code);
        if (couleur) {
          let pc = parCouleur.get(couleur);
          if (!pc) {
            const chemin = new Path2D();
            const d = geoPath(proj, enChemin(chemin));
            parCouleur.set(couleur, (pc = { chemin, dessin: (x) => void d(x) }));
          }
          pc.dessin(f.f);
        } else dessinTerre(f.f);
        if (raye.has(f.code)) dessinRayes(f.f);
      }
      for (const n of carte.neutres) dessinTerre(n);
      ctx.fillStyle = c.terre;
      ctx.fill(terre);
      ctx.strokeStyle = c.trait;
      ctx.lineJoin = "round";
      ctx.lineWidth = proche ? 0.9 : 0.6;
      ctx.stroke(terre);
      for (const [couleur, pc] of parCouleur) {
        ctx.fillStyle = couleur;
        ctx.fill(pc.chemin);
        ctx.stroke(pc.chemin);
      }
      if (raye.size && motif.current) {
        ctx.fillStyle = motif.current;
        ctx.fill(cheminRayes);
      }
    }

    const g = geoRef.current;
    // Les lacs et les fleuves : seulement ceux qui se voient.
    if (g && props.current.geographie) {
      const lacs = new Path2D();
      const dessinLacs = geoPath(proj, enChemin(lacs));
      // Un lac de moins d'un pixel ne se dessine pas.
      for (const x of g.lacs) if (x.rayon * ppr > 1.2 && seVoit(x.centre, x.rayon)) dessinLacs(x.f);
      ctx.fillStyle = c.lac;
      ctx.fill(lacs);
      ctx.strokeStyle = c.trait;
      ctx.lineWidth = 0.5;
      ctx.stroke(lacs);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const parRang = new Map<number, { chemin: Path2D; dessin: (f: Feature<Geometry>) => void }>();
      for (const x of g.fleuves) {
        if (ppr < (SEUILS_TRACES_FLEUVES[x.rang] ?? Infinity) || x.rayon * ppr < 2 || !seVoit(x.centre, x.rayon)) continue;
        let r = parRang.get(x.rang);
        if (!r) {
          const chemin = new Path2D();
          const d = geoPath(proj, enChemin(chemin));
          parRang.set(x.rang, (r = { chemin, dessin: (f) => void d(f) }));
        }
        r.dessin(x.f);
      }
      ctx.strokeStyle = c.fleuve;
      for (const [rang, r] of parRang) {
        ctx.lineWidth = borne(1.5 - rang * 0.17 + Math.log2(Math.max(1, ppr / 400)) * 0.22, 0.45, 2.2);
        ctx.stroke(r.chemin);
      }
    }

    // Le relief : de petits monts, une face dans l'ombre, comme sur les cartes anciennes.
    if (g && props.current.relief) {
      const ombre = new Path2D();
      const trait = new Path2D();
      const espacements = [4, 2, 1];
      const grossir = borne(1 + Math.log2(Math.max(0.5, ppr / 320)) * 0.16, 0.8, 1.7);
      for (const [lon, lat, niveau, t2] of g.monts) {
        if ((espacements[niveau] / DEG) * ppr < 14) continue;
        const ll: [number, number] = [lon, lat];
        if (!visible(ll, 0.06)) continue;
        const p = proj(ll);
        if (!dedans(p, 10)) continue;
        const s = (1.9 + t2 * 0.85) * grossir;
        const [x, y] = p;
        trait.moveTo(x - s, y + s * 0.5);
        trait.lineTo(x - s * 0.08, y - s * 0.78);
        trait.lineTo(x + s, y + s * 0.5);
        ombre.moveTo(x - s * 0.08, y - s * 0.78);
        ombre.lineTo(x + s, y + s * 0.5);
        ombre.lineTo(x + s * 0.12, y + s * 0.5);
        ombre.closePath();
      }
      ctx.fillStyle = c.reliefOmbre;
      ctx.fill(ombre);
      ctx.strokeStyle = c.reliefTrait;
      ctx.lineWidth = 0.9;
      ctx.lineJoin = "round";
      ctx.stroke(trait);
    }

    // La nuit : l'hémisphère opposé au Soleil, plus sombre à mesure qu'on s'enfonce dans la nuit.
    let soleil: [number, number] | null = null;
    if (props.current.nuit != null) {
      const [sla, slo] = soleilAuZenith(new Date(props.current.nuit));
      soleil = [slo, sla];
      const anti: [number, number] = [slo > 0 ? slo - 180 : slo + 180, -sla];
      proj.precision(net);
      ctx.fillStyle = c.nuit;
      for (const rayon of bouge ? [90, 78] : [90, 84, 78, 72]) {
        ctx.beginPath();
        chemin(geoCircle().center(anti).radius(rayon).precision(3)());
        ctx.fill();
      }
      ctx.beginPath();
      chemin(geoCircle().center(anti).radius(90).precision(3)());
      ctx.strokeStyle = c.terminateur;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      proj.precision(grossier);
    }

    // Les nuages : chaque flocon posé sur la sphère, aplati vers le bord, dérivant lentement vers l'est.
    if (props.current.nuages && !plan && v.zoom < 2.2) {
      const derive = mouvementReduit() ? 0 : ((performance.now() / 1000) * 0.7) % 360;
      const floconImage = flocon(c.nuage);
      const echelle = proj.scale();
      ctx.save();
      for (const n of NUAGES) {
        const centre: [number, number] = [n.lon + derive, n.lat];
        const d = geoDistance(centreVue, centre);
        if (d > Math.PI / 2 - 0.04) continue;
        const p = proj(centre);
        if (!p) continue;
        const k = Math.cos(d);
        const rr = (n.r / 57.3) * echelle;
        ctx.globalAlpha = 0.3 * n.a * (0.25 + 0.75 * k);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(p[0], p[1]);
        ctx.rotate(Math.atan2(p[1] - cy, p[0] - cx));
        ctx.scale(Math.max(0.22, k), 1);
        ctx.drawImage(floconImage, -rr, -rr * 0.72, rr * 2, rr * 1.44);
      }
      ctx.restore();
    }

    // La cible : allumée, avec une lueur.
    const cibleForme = carte && cibleCode ? carte.parCode.get(cibleCode) : undefined;
    if (cibleForme) {
      ctx.save();
      ctx.beginPath();
      chemin(cibleForme.f);
      ctx.shadowColor = c.cible;
      ctx.shadowBlur = 16;
      ctx.fillStyle = c.cible;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = c.cibleTrait;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // Les repères des tout petits pays.
    const tous = props.current.reperes === "tous";
    let anneauPose = false;
    for (const rp of REPERES) {
      const estCible = rp.code === cibleCode;
      const teinte = t[rp.code];
      const couleurCalque = calque[rp.code];
      if (!tous && !estCible && !teinte) continue;
      if (!plan && geoDistance(centreVue, rp.lonlat) > Math.PI / 2 - 0.02) continue;
      const p = proj(rp.lonlat);
      if (!p || p[0] < -20 || p[1] < -20 || p[0] > l + 20 || p[1] > h + 20) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], estCible ? 5.5 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = estCible ? c.cible : teinte ? c[teinte] : (couleurCalque ?? c.repere);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = c.merBord;
      ctx.stroke();
      if (estCible && anneau.current) {
        anneau.current.style.transform = `translate3d(${p[0]}px, ${p[1]}px, 0)`;
        anneau.current.dataset.visible = "";
        anneauPose = true;
      }
    }
    // Une cible minuscule (moins de quelques pixels) reçoit aussi un anneau qui pulse.
    if (!anneauPose && anneau.current) {
      const pays = cibleCode ? PAR_CODE.get(cibleCode) : undefined;
      if (cibleForme && pays && (pays.superficie ?? 0) < 30000) {
        const p = proj(cibleForme.centre);
        if (p && (plan || geoDistance(centreVue, cibleForme.centre) < Math.PI / 2)) {
          anneau.current.style.transform = `translate3d(${p[0]}px, ${p[1]}px, 0)`;
          anneau.current.dataset.visible = "";
          anneauPose = true;
        }
      }
      if (!anneauPose) delete anneau.current.dataset.visible;
    }

    // Mon pays : cerné d'un trait pointillé.
    const contourCode = props.current.contour;
    const contourForme = carte && contourCode ? carte.parCode.get(contourCode) : undefined;
    if (contourForme) {
      ctx.beginPath();
      chemin(contourForme.f);
      ctx.strokeStyle = c.cible;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (contourCode) {
      // Un pays sans forme sur la carte (une île minuscule) : un cercle pointillé autour de son repère.
      const p0 = PAR_CODE.get(contourCode);
      const ll: [number, number] | null = p0 ? [p0.latlng[1], p0.latlng[0]] : null;
      const p = ll && visible(ll) ? proj(ll) : null;
      if (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 7, 0, Math.PI * 2);
        ctx.strokeStyle = c.cible;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Les silhouettes (la vraie taille) : la forme du pays, posée ailleurs.
    const sils = props.current.silhouettes ?? [];
    const nomsSilhouettes: { nom: string; p: [number, number] }[] = [];
    if (carte) {
      sils.forEach((s, i) => {
        const vers = silVues.current.get(i) ?? s.vers ?? null;
        const f = formeSilhouette(carte, s.code, vers);
        if (!f) return;
        ctx.beginPath();
        chemin(f);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = c[s.teinte];
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = c[s.teinte];
        ctx.lineWidth = 1.8;
        ctx.stroke();
        const forme = carte.parCode.get(s.code);
        const ll: [number, number] = vers ? [vers[1], vers[0]] : forme ? corpsDe(forme).centre : [0, 0];
        const p = visible(ll) ? proj(ll) : null;
        if (p) nomsSilhouettes.push({ nom: PAR_CODE.get(s.code)?.nom ?? s.code, p });
      });
    }

    /* ---------- Les noms, sans jamais se chevaucher ---------- */
    const boites: Boite[] = [];
    const libre = (b: Boite) => {
      for (const o of boites) if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) return false;
      return true;
    };
    /** Sur le globe, les noms s'effacent doucement vers le bord. */
    const opacite = (ll: [number, number]) => {
      if (plan) return 1;
      const d = geoDistance(centreVue, ll);
      return d > 1.48 ? 0 : d > 1.2 ? (1.48 - d) / 0.28 : 1;
    };
    // Pendant un mouvement, les noms se passent de leur liseré (il se redessine à l'arrêt) : deux fois moins de travail.
    const ecrire = (texte: string, x: number, y: number, couleur: string, avecHalo = true, epaisseur = 3) => {
      if (avecHalo && !bouge) {
        ctx.lineWidth = epaisseur;
        ctx.strokeStyle = c.etiquetteHalo;
        ctx.lineJoin = "round";
        ctx.strokeText(texte, x, y);
      }
      ctx.fillStyle = couleur;
      ctx.fillText(texte, x, y);
    };
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Les silhouettes gardent leur nom, au-dessus de tout le reste.
    for (const { nom, p } of nomsSilhouettes) {
      const police = `700 13px ${SERIF}`;
      const w = largeur(ctx, police, nom);
      ctx.font = police;
      ecrire(nom, p[0], p[1], c.cibleTrait, true, 3.5);
      boites.push([p[0] - w / 2 - 3, p[1] - 9, p[0] + w / 2 + 3, p[1] + 9]);
    }

    /** Les océans et les mers, en italique espacé (les océans d'abord, les mers après les pays). */
    const poserMers = (rangs: (r: number) => boolean) => {
      if (!g || !props.current.geographie) return;
      for (const [nom, lon, lat, rang] of g.mers) {
        if (!rangs(rang) || ppr < SEUILS_MERS[rang]) continue;
        const ll: [number, number] = [lon, lat];
        const a = opacite(ll);
        if (!a) continue;
        const p = proj(ll);
        if (!dedans(p)) continue;
        const corps = rang === 0 ? 15 : rang === 1 ? 12.5 : 11.5;
        const espace = rang === 0 ? 3.2 : 1.2;
        const police = `italic 500 ${corps}px ${SERIF}`;
        const w = largeur(ctx, police, nom) + espace * nom.length;
        const b: Boite = [p[0] - w / 2 - 2, p[1] - corps * 0.7, p[0] + w / 2 + 2, p[1] + corps * 0.7];
        if (!libre(b)) continue;
        boites.push(b);
        ctx.font = police;
        espacer(ctx, espace);
        ctx.globalAlpha = a;
        ecrire(nom, p[0], p[1], c.merNom, false);
        espacer(ctx, 0);
      }
      ctx.globalAlpha = 1;
    };
    poserMers((r) => r === 0);

    if (g && props.current.etiquettes) {
      // Les pays : un nom là où il tient (sur une ou deux lignes), les plus grands d'abord.
      for (const p of props.current.etiquettes === "petits" ? ORDRE_PETITS : ORDRE_NOMS) {
        if (p.code === "aq" && !plan) continue;
        const e = g.pays.get(p.code);
        if (!e && p.carte) continue;
        const ll: [number, number] = e ? [e[0], e[1]] : [p.latlng[1], p.latlng[0]];
        const a = opacite(ll);
        if (!a) continue;
        const pt = proj(ll);
        if (!dedans(pt)) continue;
        const rayonPx = e && e[2] > 0 ? (e[2] / 6371) * echelleEn(ll) : 0;
        // Les petits pays (et les îles étroites) s'écrivent à côté de leur point, une fois qu'on s'est approché.
        const approche = ppr >= 800 || v.zoom >= 3;
        let minuscule = !p.carte || rayonPx < 4;
        if (minuscule && !approche) continue;
        const corps = rayonPx > 110 ? 14 : rayonPx > 45 ? 12.5 : 11;
        const police = `${rayonPx > 45 ? 650 : 600} ${corps}px ${SERIF}`;
        let lignes: string[] = [p.nom];
        let w = largeur(ctx, police, p.nom);
        if (!minuscule && w / 2 > rayonPx * 1.6 + 5) {
          const deux = couper(p.nom);
          const w2 = deux ? Math.max(largeur(ctx, police, deux[0]), largeur(ctx, police, deux[1])) : Infinity;
          if (deux && w2 / 2 <= rayonPx * 1.6 + 5) {
            lignes = deux;
            w = w2;
          } else if (rayonPx < 18 && approche) minuscule = true;
          else continue;
        }
        const hauteur = corps * 1.15 * lignes.length;
        const x = minuscule ? pt[0] + 6 + w / 2 : pt[0];
        const y = minuscule ? pt[1] - 7 : pt[1];
        const b: Boite = [x - w / 2 - 2, y - hauteur / 2 - 1, x + w / 2 + 2, y + hauteur / 2 + 1];
        if (!libre(b)) continue;
        boites.push(b);
        ctx.font = police;
        ctx.globalAlpha = a;
        lignes.forEach((ligne, i) => ecrire(ligne, x, y + (i - (lignes.length - 1) / 2) * corps * 1.15, c.etiquette));
      }
      // Les capitales : un point et un nom en italique, quand on s'approche.
      for (const p of ORDRE_CAPITALES) {
        if (ppr < (p.rangCapitale < 45 ? 950 : p.rangCapitale < 130 ? 1700 : 3000)) continue;
        const ll: [number, number] = [p.capLatLng![1], p.capLatLng![0]];
        const a = opacite(ll);
        if (!a) continue;
        const pt = proj(ll);
        if (!dedans(pt)) continue;
        const police = `italic 500 11px ${SERIF}`;
        const w = largeur(ctx, police, p.capitale!);
        const point: Boite = [pt[0] - 3, pt[1] - 3, pt[0] + 3, pt[1] + 3];
        let b: Boite = [pt[0] + 5, pt[1] - 7, pt[0] + 7 + w, pt[1] + 7];
        let x = pt[0] + 6 + w / 2;
        if (!libre(b) || b[2] > l) {
          b = [pt[0] - 7 - w, pt[1] - 7, pt[0] - 5, pt[1] + 7];
          x = pt[0] - 6 - w / 2;
          if (!libre(b)) continue;
        }
        if (!libre(point)) continue;
        boites.push(b, point);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 2.4, 0, Math.PI * 2);
        ctx.fillStyle = c.capitale;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = c.etiquetteHalo;
        ctx.stroke();
        ctx.font = police;
        ecrire(p.capitale!, x, pt[1], c.capitale, true, 2.6);
      }
      ctx.globalAlpha = 1;
    }
    poserMers((r) => r > 0);

    if (g && props.current.relief) {
      // Les chaînes et les déserts : en italique espacé, couleur de vélin et de sable.
      const poser = (liste: [string, number, number, number][], seuils: number[], couleur: string, corps: number, espace: number) => {
        for (const [nom, lon, lat, rang] of liste) {
          if (ppr < (seuils[rang] ?? Infinity)) continue;
          const ll: [number, number] = [lon, lat];
          const a = opacite(ll);
          if (!a) continue;
          const p = proj(ll);
          if (!dedans(p)) continue;
          const police = `italic 600 ${corps}px ${SERIF}`;
          const w = largeur(ctx, police, nom) + espace * nom.length;
          const b: Boite = [p[0] - w / 2 - 2, p[1] - corps * 0.7, p[0] + w / 2 + 2, p[1] + corps * 0.7];
          if (!libre(b)) continue;
          boites.push(b);
          ctx.font = police;
          espacer(ctx, espace);
          ctx.globalAlpha = a;
          ecrire(nom, p[0], p[1], couleur, true, 2.6);
          espacer(ctx, 0);
        }
        ctx.globalAlpha = 1;
      };
      poser(g.chaines, SEUILS_CHAINES, c.reliefNom, 11, 1.4);
      poser(g.deserts, SEUILS_CHAINES, c.desertNom, 11.5, 2.2);
    }

    if (g && props.current.geographie && !bouge) {
      // Les fleuves : le nom couché le long de son cours (à l'arrêt seulement, comme les lacs et les sommets).
      for (const [nom, lo1, la1, lo2, la2, rang] of g.nomsFleuves) {
        if (ppr < (SEUILS_FLEUVES[rang] ?? Infinity)) continue;
        const ll: [number, number] = [lo1, la1];
        const a = opacite(ll);
        if (!a) continue;
        const p = proj(ll);
        const q = proj([lo2, la2]);
        if (!dedans(p) || !q) continue;
        let angle = Math.atan2(q[1] - p[1], q[0] - p[0]);
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
        const police = `italic 500 10.5px ${SERIF}`;
        const w = largeur(ctx, police, nom);
        // La boîte du nom couché, à peu près.
        const dx = (Math.abs(Math.cos(angle)) * w) / 2 + 6 * Math.abs(Math.sin(angle));
        const dy = (Math.abs(Math.sin(angle)) * w) / 2 + 6 * Math.abs(Math.cos(angle));
        const b: Boite = [p[0] - dx, p[1] - dy, p[0] + dx, p[1] + dy];
        if (!libre(b)) continue;
        boites.push(b);
        ctx.save();
        ctx.translate(p[0], p[1]);
        ctx.rotate(angle);
        ctx.font = police;
        ctx.globalAlpha = a;
        ecrire(nom, 0, -5, c.fleuveNom, true, 2.4);
        ctx.restore();
      }
      for (const [nom, lon, lat, rang] of g.nomsLacs) {
        if (ppr < (SEUILS_LACS[rang] ?? Infinity)) continue;
        const ll: [number, number] = [lon, lat];
        const a = opacite(ll);
        if (!a) continue;
        const p = proj(ll);
        if (!dedans(p)) continue;
        const police = `italic 500 10.5px ${SERIF}`;
        const w = largeur(ctx, police, nom);
        const b: Boite = [p[0] - w / 2 - 2, p[1] - 7, p[0] + w / 2 + 2, p[1] + 7];
        if (!libre(b)) continue;
        boites.push(b);
        ctx.font = police;
        ctx.globalAlpha = a;
        ecrire(nom, p[0], p[1], c.fleuveNom, true, 2.4);
      }
      ctx.globalAlpha = 1;
    }

    if (g && props.current.relief && !bouge) {
      // Les sommets : un petit triangle, le nom et l'altitude.
      for (const [nom, lon, lat, altitude, rang] of g.sommets) {
        if (ppr < (SEUILS_SOMMETS[rang] ?? Infinity)) continue;
        const ll: [number, number] = [lon, lat];
        const a = opacite(ll);
        if (!a) continue;
        const p = proj(ll);
        if (!dedans(p)) continue;
        const texte = `${nom}, ${new Intl.NumberFormat("fr-FR").format(altitude).replace(/[\u202f\u00a0]/g, "\u00a0")}\u00a0m`;
        const police = `italic 500 10px ${SERIF}`;
        const w = largeur(ctx, police, texte);
        const b: Boite = [p[0] - 5, p[1] - 7, p[0] + 9 + w, p[1] + 7];
        if (!libre(b)) continue;
        boites.push(b);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1] - 4.5);
        ctx.lineTo(p[0] + 4, p[1] + 3);
        ctx.lineTo(p[0] - 4, p[1] + 3);
        ctx.closePath();
        ctx.fillStyle = c.reliefNom;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = c.etiquetteHalo;
        ctx.stroke();
        ctx.font = police;
        ctx.textAlign = "left";
        ecrire(texte, p[0] + 7, p[1], c.reliefNom, true, 2.4);
        ctx.textAlign = "center";
      }
      ctx.globalAlpha = 1;
    }

    // Le Soleil, là où il est au zénith.
    if (soleil && visible(soleil)) {
      const p = proj(soleil);
      if (dedans(p)) {
        ctx.save();
        ctx.translate(p[0], p[1]);
        ctx.strokeStyle = c.soleil;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 8.5, Math.sin(ang) * 8.5);
          ctx.lineTo(Math.cos(ang) * 12.5, Math.sin(ang) * 12.5);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = c.soleil;
        ctx.shadowColor = c.soleil;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      }
    }

    // Les routes (grand cercle) et les points posés.
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    for (const tr of props.current.traits ?? []) {
      ctx.beginPath();
      chemin({ type: "LineString", coordinates: tr.points.map(([la, lo]) => [lo, la]) });
      ctx.strokeStyle = c[tr.teinte];
      ctx.lineWidth = tr.epaisseur ?? 2;
      ctx.lineCap = "round";
      ctx.setLineDash(tr.tirets ? [6, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const m of props.current.marques ?? []) {
      const ll: [number, number] = [m.latlng[1], m.latlng[0]];
      if (!plan && geoDistance(centreVue, ll) > Math.PI / 2 - 0.01) continue;
      const p = proj(ll);
      if (!p) continue;
      const rayon = m.taille ?? 5.5;
      ctx.beginPath();
      ctx.arc(p[0], p[1], rayon + 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p[0], p[1], rayon, 0, Math.PI * 2);
      ctx.fillStyle = c[m.teinte];
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = c.cibleTrait;
      ctx.stroke();
      if (m.libelle) {
        ctx.font = `italic 600 13px ${SERIF}`;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = c.merBord;
        ctx.strokeText(m.libelle, p[0] + rayon + 5, p[1] - rayon - 2);
        ctx.fillStyle = c.cibleTrait;
        ctx.fillText(m.libelle, p[0] + rayon + 5, p[1] - rayon - 2);
      }
    }

    // Le bord du globe : un filet d'or.
    if (!plan) {
      ctx.beginPath();
      chemin({ type: "Sphere" });
      ctx.strokeStyle = c.trait;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [projection, formeSilhouette]);

  const demander = useCallback(() => {
    if (!image.current) image.current = requestAnimationFrame(boucle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Une image : avancer le vol ou la rotation lente, puis dessiner. */
  function boucle(t: number) {
    image.current = 0;
    let continuer = false;
    const vl = vol.current;
    if (vl) {
      const x = borne((t - vl.t0) / vl.duree, 0, 1);
      const e = lisse(x);
      const [lon, lat] = geoInterpolate([vl.de.lon, vl.de.lat], [vl.vers.lon, vl.vers.lat])(e);
      const distance = geoDistance([vl.de.lon, vl.de.lat], [vl.vers.lon, vl.vers.lat]);
      // En vol, on prend de la hauteur, d'autant plus que le voyage est long.
      const creux = estPlan(props.current.mode) ? 0 : Math.min(1, distance / 1.4) * 0.9;
      const lz = Math.log(vl.de.zoom) + (Math.log(vl.vers.zoom) - Math.log(vl.de.zoom)) * e - creux * Math.sin(Math.PI * e);
      vue.current = { lon, lat, zoom: Math.max(estPlan(props.current.mode) ? 1 : 0.85, Math.exp(lz)) };
      enMouvement.current = x < 1;
      if (x < 1) continuer = true;
      else {
        vol.current = null;
        vue.current = { ...vl.vers };
        props.current.onArrive?.();
      }
    } else if (elan.current) {
      // Le globe lancé continue sur sa lancée, puis ralentit comme une toupie.
      const dt = dernierElan.current ? Math.min(48, t - dernierElan.current) : 16;
      dernierElan.current = t;
      const e = elan.current;
      vue.current = { ...vue.current, lon: vue.current.lon - e.lon * dt, lat: borne(vue.current.lat + e.lat * dt, -80, 80) };
      const frein = Math.exp(-dt / 520);
      e.lon *= frein;
      e.lat *= frein;
      derniereInteraction.current = performance.now();
      if (Math.hypot(e.lon, e.lat) < 0.0025) {
        elan.current = null;
        dernierElan.current = 0;
        allumerHalo(false);
        enMouvement.current = false;
      } else {
        enMouvement.current = true;
        continuer = true;
      }
    } else if (props.current.tourne && !mouvementReduit() && !document.hidden) {
      const attente = 3500 - (performance.now() - derniereInteraction.current);
      if (attente <= 0) {
        // La rotation lente : une vitesse en degrés par seconde, la même quel que soit l'écran.
        const dt = dernierePas.current ? Math.min(64, t - dernierePas.current) : 16;
        dernierePas.current = t;
        vue.current = { ...vue.current, lon: vue.current.lon - dt * 0.0036 };
        enMouvement.current = true;
        continuer = true;
      } else {
        // On vient de toucher le globe (ou la page vient de s'ouvrir) : il repartira seul un peu plus tard.
        enMouvement.current = false;
        dernierePas.current = 0;
        clearTimeout(relance.current);
        relance.current = setTimeout(() => demander(), attente + 20);
      }
    } else enMouvement.current = false;
    dessiner();
    if (continuer) image.current = requestAnimationFrame(boucle);
  }

  /** Viser un pays : voler jusqu'à lui (ou y sauter, si les animations sont réduites). */
  const viser = useCallback(
    (code: string) => {
      const carte = cartes.current.detail ?? cartes.current.leger ?? cartes.current.ultra;
      const forme = carte?.parCode.get(code);
      const p = PAR_CODE.get(code);
      const centre: [number, number] = forme?.centre ?? (p ? [p.latlng[1], p.latlng[0]] : [0, 0]);
      const m = props.current.mode;
      // Le Mercator grossit les pays loin de l'équateur : on s'en approche moins.
      const zoom = m === "plan" ? borne(zoomPour(forme, recul) / 2.2, 1, 14) : m === "mercator" ? borne((zoomPour(forme, recul) / 2.4) * Math.cos(borne(centre[1], -75, 75) / DEG), 1, 14) : zoomPour(forme, recul);
      const vers: Vue = { lon: centre[0], lat: borne(centre[1], -70, 75), zoom };
      if (mouvementReduit()) {
        vol.current = null;
        vue.current = vers;
        dessiner();
        props.current.onArrive?.();
        return;
      }
      const de = { ...vue.current };
      const distance = geoDistance([de.lon, de.lat], [vers.lon, vers.lat]);
      const duree = borne(520 + distance * 420 + Math.abs(Math.log(vers.zoom / de.zoom)) * 160, 520, 1500);
      vol.current = { de, vers, t0: performance.now(), duree };
      demander();
    },
    [dessiner, demander, recul],
  );

  /** Le pays sous un point du globe [lon, lat] (les petits d'abord : ils sont dessinés par-dessus). */
  const paysEn = useCallback((point: [number, number]): string | null => {
    const carte = cartes.current.detail ?? cartes.current.leger ?? cartes.current.ultra;
    if (!carte) return null;
    for (let i = carte.formes.length - 1; i >= 0; i--) {
      const f = carte.formes[i];
      if (geoDistance(f.centre, point) > f.rayon + 0.01) continue;
      if (geoContains(f.f, point)) return f.code;
    }
    return null;
  }, []);

  const allerVers = useCallback(
    (vers: Vue, duree: number) => {
      derniereInteraction.current = performance.now();
      if (mouvementReduit()) {
        vol.current = null;
        vue.current = { ...vers };
        dessiner();
      } else {
        vol.current = { de: { ...vue.current }, vers: { ...vers }, t0: performance.now(), duree };
        demander();
      }
    },
    [dessiner, demander],
  );

  useImperativeHandle(
    ref,
    () => ({
      viser,
      vue: () => ({ ...vue.current }),
      zoomer: (facteur: number) => {
        const de = vue.current;
        allerVers({ ...de, zoom: borne(de.zoom * facteur, 1, estPlan(props.current.mode) ? 24 : 40) }, 320);
      },
      voler: (vers: Vue) => {
        const de = vue.current;
        allerVers(vers, borne(520 + geoDistance([de.lon, de.lat], [vers.lon, vers.lat]) * 420, 520, 1400));
      },
      recentrer: () => {
        const de = vue.current;
        allerVers({ lon: de.lon, lat: estPlan(props.current.mode) ? 0 : 20, zoom: 1 }, 600);
      },
      paysA: (latlng: [number, number]) => paysEn([latlng[1], latlng[0]]),
    }),
    [viser, allerVers, paysEn],
  );

  // La taille du dessin suit celle de la boîte.
  useEffect(() => {
    const el = boite.current;
    const canvas = toile.current;
    if (!el || !canvas) return;
    const ajuster = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      taille.current = { l: Math.max(10, r.width), h: Math.max(10, r.height), dpr };
      // La taille affichée vient du CSS (100 %) : seule la résolution du dessin suit la boîte.
      canvas.width = Math.round(taille.current.l * dpr);
      canvas.height = Math.round(taille.current.h * dpr);
      dessiner();
    };
    const obs = new ResizeObserver(ajuster);
    obs.observe(el);
    ajuster();
    return () => obs.disconnect();
  }, [dessiner]);

  // Le thème change : relire les couleurs.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      couleurs.current = null;
      motif.current = null;
      demander();
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => obs.disconnect();
  }, [demander]);

  // Les polices des noms arrivent : mesurer à nouveau et redessiner.
  useEffect(() => {
    if (!(etiquettes || geographie || relief) || typeof document === "undefined" || !document.fonts) return;
    let vivant = true;
    void document.fonts.ready.then(() => {
      if (!vivant) return;
      mesures.clear();
      demander();
    });
    return () => {
      vivant = false;
    };
  }, [etiquettes, geographie, relief, demander]);

  // Les silhouettes rangées par le parent remplacent celles qu'on vient de lâcher.
  useEffect(() => {
    if (!glisse.current) silVues.current.clear();
  }, [silhouettes]);

  // La carte arrive, les teintes changent : redessiner. La cible change : voler vers elle.
  useEffect(() => {
    demander();
  }, [ultra, leger, detail, geo, teintes, coloriage, rayes, etiquettes, geographie, relief, nuit, nuages, silhouettes, contour, mode, marques, traits, demander]);
  // La cible change, ou la carte détaillée arrive (le centre exact du pays est alors connu) : voler vers elle.
  useEffect(() => {
    if (cible && (ultra || leger || detail)) viser(cible);
    else demander();
  }, [cible, ultra, leger, detail, viser, demander]);
  useEffect(() => {
    if (tourne) demander();
  }, [tourne, demander]);
  useEffect(
    () => () => {
      cancelAnimationFrame(image.current);
      clearTimeout(relance.current);
      clearTimeout(minuterieAnnonce.current);
    },
    [],
  );

  /* ---------- Le doigt, la souris, la molette, le clavier ---------- */
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ x: number; y: number; t: number; bouge: boolean; ecart?: number; zoom?: number } | null>(null);

  const glisser = (dx: number, dy: number) => {
    const v = vue.current;
    const { l, h } = taille.current;
    if (estPlan(props.current.mode)) {
      // Sur une carte plane, le point sous le doigt suit le doigt.
      const proj = projection(v);
      const nouveau = proj.invert?.([l / 2 - dx, h / 2 - dy]);
      if (nouveau && Number.isFinite(nouveau[0]) && Number.isFinite(nouveau[1])) vue.current = { ...v, lon: nouveau[0], lat: borne(nouveau[1], -84, 84) };
    } else {
      const echelle = ((Math.min(l, h) / 2 - 8) * v.zoom) / DEG;
      vue.current = { ...v, lon: v.lon - dx / echelle, lat: borne(v.lat + dy / echelle, -80, 80) };
      // La vitesse du geste (lissée), pour l'élan au moment où l'on lâche.
      const maintenant = performance.now();
      const dt = Math.max(1, maintenant - (vitesse.current.t || maintenant - 16));
      const lisser = (avant: number, mesure: number) => avant * 0.35 + mesure * 0.65;
      vitesse.current = { lon: lisser(vitesse.current.lon, dx / echelle / dt), lat: lisser(vitesse.current.lat, -dy / echelle / dt), t: maintenant };
      allumerHalo(true);
    }
    enMouvement.current = true;
    demander();
  };

  /** Le halo safran : il s'allume quand on fait tourner le globe et s'éteint doucement à l'arrêt. */
  function allumerHalo(oui: boolean) {
    const el = halo.current;
    if (!el) return;
    if (oui) el.dataset.actif = "";
    else delete el.dataset.actif;
  }

  /** On lâche le globe : s'il a été lancé, il garde son élan (sauf si les animations sont réduites). */
  const lacher = () => {
    const v = vitesse.current;
    const recent = performance.now() - v.t < 80;
    const vite = Math.hypot(v.lon, v.lat) > 0.012;
    vitesse.current = { lon: 0, lat: 0, t: 0 };
    if (recent && vite && !mouvementReduit() && !estPlan(props.current.mode)) {
      // L'élan est borné : un geste très vif ne fait pas tourner le monde comme une roue de loterie.
      const f = Math.min(1, 0.4 / Math.hypot(v.lon, v.lat));
      elan.current = { lon: v.lon * f, lat: v.lat * f };
      dernierElan.current = 0;
      demander();
    } else allumerHalo(false);
  };

  /** Le point du globe sous un point de l'écran [lon, lat], ou null (le vide, la face cachée). */
  const pointSous = (x: number, y: number): [number, number] | null => {
    const proj = projection(vue.current);
    const point = proj.invert?.([x, y]);
    if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
    if (!estPlan(props.current.mode) && geoDistance([vue.current.lon, vue.current.lat], point) > Math.PI / 2) return null;
    return point as [number, number];
  };

  /** Le pays sous un point de l'écran : d'abord les repères (les tout petits pays), à 14 px près. */
  const codeSous = (x: number, y: number): string | null => {
    const proj = projection(vue.current);
    let meilleur: { code: string; d: number } | null = null;
    for (const rp of REPERES) {
      if (!estPlan(props.current.mode) && geoDistance([vue.current.lon, vue.current.lat], rp.lonlat) > Math.PI / 2) continue;
      if (props.current.reperes !== "tous" && !props.current.teintes?.[rp.code]) continue;
      const p = proj(rp.lonlat);
      if (!p) continue;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < 14 && (!meilleur || d < meilleur.d)) meilleur = { code: rp.code, d };
    }
    if (meilleur) return meilleur.code;
    const point = pointSous(x, y);
    return point ? paysEn(point) : null;
  };

  const toucher = (x: number, y: number) => {
    if (props.current.onPoint) {
      const point = pointSous(x, y);
      return props.current.onPoint(point ? [point[1], point[0]] : null);
    }
    props.current.onToucher?.(codeSous(x, y));
  };

  /** Une silhouette sous le doigt (la dernière posée d'abord). */
  const silhouetteSous = (x: number, y: number): { i: number; point: [number, number] } | null => {
    const sils = props.current.silhouettes;
    const carte = cartes.current.detail ?? cartes.current.leger ?? cartes.current.ultra;
    if (!sils?.length || !props.current.onSilhouette || !carte) return null;
    const point = pointSous(x, y);
    if (!point) return null;
    for (let i = sils.length - 1; i >= 0; i--) {
      const f = formeSilhouette(carte, sils[i].code, silVues.current.get(i) ?? sils[i].vers ?? null);
      if (f && geoContains(f, point)) return { i, point };
    }
    return null;
  };

  /** Annoncer au lecteur d'écran le pays au centre, une fois le mouvement fini. */
  const annoncerCentre = () => {
    clearTimeout(minuterieAnnonce.current);
    minuterieAnnonce.current = setTimeout(() => {
      const { l, h } = taille.current;
      if (props.current.onPoint) {
        const p = pointSous(l / 2, h / 2);
        setAnnonce(p ? `Au centre : ${Math.abs(p[1]).toFixed(1)}° ${p[1] >= 0 ? "nord" : "sud"}, ${Math.abs(p[0]).toFixed(1)}° ${p[0] >= 0 ? "est" : "ouest"}. Entrée pour choisir ce point.` : "Au centre : le vide.");
        return;
      }
      const code = codeSous(l / 2, h / 2);
      const nom = code ? PAR_CODE.get(code)?.nom : null;
      setAnnonce(nom ? `Au centre : ${nom}.${props.current.onToucher ? " Entrée pour choisir." : ""}` : "Au centre : la mer.");
    }, 420);
  };

  const clavier = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const v = vue.current;
    const { l, h } = taille.current;
    const fort = e.shiftKey ? 3 : 1;
    const tourner = (dx: number, dy: number) => {
      if (estPlan(props.current.mode)) {
        const proj = projection(v);
        const n = proj.invert?.([l / 2 + dx * 70 * fort, h / 2 + dy * 70 * fort]);
        if (n && Number.isFinite(n[0])) allerVers({ ...v, lon: n[0], lat: borne(n[1], -84, 84) }, 220);
      } else {
        const pas = (10 * fort) / Math.sqrt(v.zoom);
        allerVers({ ...v, lon: v.lon + dx * pas, lat: borne(v.lat - dy * pas, -80, 80) }, 220);
      }
    };
    switch (e.key) {
      case "ArrowLeft":
        tourner(-1, 0);
        break;
      case "ArrowRight":
        tourner(1, 0);
        break;
      case "ArrowUp":
        tourner(0, -1);
        break;
      case "ArrowDown":
        tourner(0, 1);
        break;
      case "+":
      case "=":
        if (!interactif) return;
        allerVers({ ...v, zoom: borne(v.zoom * 1.5, 1, estPlan(props.current.mode) ? 24 : 40) }, 240);
        break;
      case "-":
      case "_":
        if (!interactif) return;
        allerVers({ ...v, zoom: borne(v.zoom / 1.5, 1, estPlan(props.current.mode) ? 24 : 40) }, 240);
        break;
      case "0":
        allerVers({ lon: v.lon, lat: estPlan(props.current.mode) ? 0 : 20, zoom: 1 }, 400);
        break;
      case "Enter":
      case " ":
        if (!interactif) return;
        toucher(l / 2, h / 2);
        break;
      default:
        return;
    }
    e.preventDefault();
    annoncerCentre();
  };

  const evenements =
    interactif || glissable
      ? {
          onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            derniereInteraction.current = performance.now();
            vol.current = null;
            // On rattrape un globe qui tournait encore sur sa lancée : il s'arrête sous le doigt.
            elan.current = null;
            dernierElan.current = 0;
            vitesse.current = { lon: 0, lat: 0, t: 0 };
            if (pointeurs.current.size === 1 && interactif) {
              const r = e.currentTarget.getBoundingClientRect();
              const s = silhouetteSous(e.clientX - r.left, e.clientY - r.top);
              if (s) {
                const sil = props.current.silhouettes![s.i];
                const carte = cartes.current.detail ?? cartes.current.leger ?? cartes.current.ultra;
                const forme = carte?.parCode.get(sil.code);
                const ici = forme ? corpsDe(forme).centre : ([0, 0] as [number, number]);
                glisse.current = { i: s.i, depart: s.point, vers0: silVues.current.get(s.i) ?? sil.vers ?? [ici[1], ici[0]] };
              }
            }
            if (pointeurs.current.size === 2 && interactif) {
              glisse.current = null;
              const [a, b] = [...pointeurs.current.values()];
              geste.current = { x: e.clientX, y: e.clientY, t: performance.now(), bouge: true, ecart: Math.hypot(a.x - b.x, a.y - b.y), zoom: vue.current.zoom };
            } else geste.current = { x: e.clientX, y: e.clientY, t: performance.now(), bouge: false };
          },
          onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
            const avant = pointeurs.current.get(e.pointerId);
            if (!avant || !geste.current) return;
            pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            derniereInteraction.current = performance.now();
            if (pointeurs.current.size === 2 && geste.current.ecart && interactif) {
              const [a, b] = [...pointeurs.current.values()];
              const ecart = Math.hypot(a.x - b.x, a.y - b.y);
              vue.current = { ...vue.current, zoom: borne((geste.current.zoom ?? 1) * (ecart / geste.current.ecart), 1, estPlan(props.current.mode) ? 24 : 40) };
              enMouvement.current = true;
              demander();
              return;
            }
            const dx = e.clientX - avant.x;
            const dy = e.clientY - avant.y;
            if (!geste.current.bouge && Math.hypot(e.clientX - geste.current.x, e.clientY - geste.current.y) > 5) geste.current.bouge = true;
            if (!geste.current.bouge) return;
            const gl = glisse.current;
            if (gl) {
              // La silhouette suit le doigt sur la sphère : le point saisi reste sous le doigt.
              const r = e.currentTarget.getBoundingClientRect();
              const p = pointSous(e.clientX - r.left, e.clientY - r.top);
              if (!p) return;
              const de = geoRotation([-gl.depart[0], -gl.depart[1]]);
              const a = geoRotation([-p[0], -p[1]]);
              const [lon, lat] = a.invert(de([gl.vers0[1], gl.vers0[0]])) as [number, number];
              silVues.current.set(gl.i, [borne(lat, -85, 85), lon]);
              enMouvement.current = true;
              demander();
              return;
            }
            glisser(dx, dy);
          },
          onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => {
            pointeurs.current.delete(e.pointerId);
            const g = geste.current;
            if (pointeurs.current.size === 0) {
              geste.current = null;
              enMouvement.current = false;
              dernierePas.current = 0;
              const gl = glisse.current;
              glisse.current = null;
              if (gl) {
                // Une silhouette lâchée ailleurs ; touchée sans bouger, elle ne fait rien.
                const vers = g?.bouge ? silVues.current.get(gl.i) : undefined;
                if (vers) props.current.onSilhouette?.(gl.i, vers);
                demander();
                return;
              }
              demander();
              if (g?.bouge) lacher();
              else allumerHalo(false);
              if (interactif && g && !g.bouge && performance.now() - g.t < 600) {
                const r = e.currentTarget.getBoundingClientRect();
                toucher(e.clientX - r.left, e.clientY - r.top);
              }
            }
          },
          onPointerCancel: (e: React.PointerEvent<HTMLCanvasElement>) => {
            pointeurs.current.delete(e.pointerId);
            if (!pointeurs.current.size) {
              geste.current = null;
              glisse.current = null;
              if (!elan.current) allumerHalo(false);
            }
          },
          onKeyDown: clavier,
          // La molette zoome les globes interactifs ; sur un globe qu'on fait seulement tourner, elle fait défiler la page.
          ...(interactif
            ? {
                onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => {
                  derniereInteraction.current = performance.now();
                  vue.current = { ...vue.current, zoom: borne(vue.current.zoom * Math.exp(-e.deltaY * 0.0016), 1, estPlan(props.current.mode) ? 24 : 40) };
                  demander();
                },
              }
            : {}),
        }
      : {};

  // La molette ne doit pas faire défiler la page quand elle zoome le globe.
  useEffect(() => {
    const c = toile.current;
    if (!c || !interactif) return;
    const bloquer = (e: WheelEvent) => e.preventDefault();
    c.addEventListener("wheel", bloquer, { passive: false });
    return () => c.removeEventListener("wheel", bloquer);
  }, [interactif]);

  const pilotable = interactif || glissable;
  return (
    <div ref={boite} className={`pt-globe ${className ?? ""}`} data-mode={mode} data-interactif={interactif || undefined} data-glissable={glissable || undefined}>
      <canvas
        ref={toile}
        role={pilotable ? "application" : "img"}
        aria-roledescription={pilotable ? "carte" : undefined}
        aria-label={pilotable ? `${libelle}. ${interactif ? "Au clavier : les flèches pour tourner, plus et moins pour zoomer, Entrée pour choisir ce qui est au centre." : "Au clavier : les flèches pour le faire tourner."}` : libelle}
        tabIndex={pilotable ? 0 : undefined}
        {...evenements}
      />
      {pilotable && <span className="pt-globe-mire" aria-hidden="true" />}
      {pilotable && (
        <span className="sr-only" aria-live="polite">
          {annonce}
        </span>
      )}
      {(interactif || glissable) && mode === "globe" && <span ref={halo} className="pt-globe-halo" aria-hidden="true" />}
      <span ref={anneau} className="pt-globe-anneau" aria-hidden="true" />
      {erreur && !ultra && !leger && <p className="pt-globe-erreur">La carte n&apos;a pas pu se charger. Vérifie ta connexion.</p>}
    </div>
  );
});
