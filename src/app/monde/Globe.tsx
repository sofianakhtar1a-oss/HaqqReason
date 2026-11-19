"use client";

import { type GeoContext, geoContains, geoDistance, geoEqualEarth, geoGraticule10, geoInterpolate, geoOrthographic, geoPath, type GeoProjection } from "d3-geo";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { PAYS } from "@/lib/monde/donnees";
import { type Carte, type Forme, useCarte } from "./carte";

/*
 * Le globe du Portulan, dessiné sur un <canvas>.
 *
 *   • Deux projections : le globe (orthographique) et le planisphère (Equal Earth).
 *   • Il vise un pays (cible) : il tourne vers lui en suivant le grand cercle, s'éloigne un peu
 *     pendant le voyage puis s'approche, le pays s'allume. Rien ne bouge si l'on a demandé de
 *     réduire les animations : le globe saute directement à sa place.
 *   • On le fait tourner du doigt ou de la souris, on zoome à la molette ou à deux doigts.
 *   • Il ne dessine que ce qui se voit, et seulement quand quelque chose change (aucune boucle à vide).
 *     Pendant un mouvement, la carte légère ; au repos, la détaillée.
 *   • Les couleurs viennent des variables CSS (--pt-*) : le thème clair ou sombre s'applique seul.
 */

export type Teinte = "or" | "juste" | "faux" | "choix" | "doux";
export type Vue = { lon: number; lat: number; zoom: number };

export type GlobeProps = {
  mode?: "globe" | "plan";
  /** Le pays visé : le globe tourne vers lui et l'allume. */
  cible?: string | null;
  /** Ne pas zoomer sur la cible (on la voit dans son voisinage). */
  recul?: number;
  /** D'autres pays à colorier (maîtrisés, bonne ou mauvaise réponse…). */
  teintes?: Record<string, Teinte>;
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
};

export type GlobeRef = { viser: (code: string) => void; vue: () => Vue; zoomer: (facteur: number) => void; recentrer: () => void; voler: (vers: Vue) => void };

type Couleurs = Record<"merCentre" | "merBord" | "terre" | "trait" | "cote" | "grille" | "cible" | "cibleTrait" | "or" | "juste" | "faux" | "choix" | "doux" | "halo" | "repere", string>;

const lireCouleurs = (el: Element): Couleurs => {
  const s = getComputedStyle(el);
  const v = (n: string, d: string) => s.getPropertyValue(n).trim() || d;
  return {
    merCentre: v("--pt-mer-centre", "#1a2c6e"),
    merBord: v("--pt-mer-bord", "#0b1440"),
    terre: v("--pt-terre", "#5d5f78"),
    trait: v("--pt-trait", "#a99363"),
    cote: v("--pt-cote", "#c8b78c"),
    grille: v("--pt-grille", "rgba(233,190,106,0.12)"),
    cible: v("--pt-cible", "#ffa65c"),
    cibleTrait: v("--pt-cible-trait", "#ffe1c4"),
    or: v("--pt-or", "#c9a15a"),
    juste: v("--pt-juste", "#58c99f"),
    faux: v("--pt-faux", "#e46a6a"),
    choix: v("--pt-choix", "#7cc8f2"),
    doux: v("--pt-doux", "#8a8a9a"),
    halo: v("--pt-halo", "rgba(124,200,242,0.28)"),
    repere: v("--pt-repere", "#e9be6a"),
  };
};

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const DEG = 180 / Math.PI;
const lisse = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Un Path2D sert de contexte à d3 (qui n'appelle que moveTo, lineTo, closePath et arc). */
const enChemin = (p: Path2D) => p as unknown as GeoContext;

/** Les pays qu'on ne voit pas sur la carte (trop petits, ou sans forme) : un repère rond. */
const REPERES = PAYS.filter((p) => !p.carte || (p.superficie ?? 0) < 2600).map((p) => ({ code: p.code, lonlat: [p.latlng[1], p.latlng[0]] as [number, number] }));

/** Le zoom qui montre un pays en entier, assez grand. */
function zoomPour(forme: Forme | undefined, recul = 1): number {
  if (!forme) return 6;
  const r = Math.max(forme.rayon, 0.004);
  return borne((0.55 / r) * (1 / recul), 1, 26);
}

export const Globe = forwardRef<GlobeRef, GlobeProps>(function Globe(
  { mode = "globe", cible = null, recul = 1, teintes, tourne = false, interactif = false, glissable = false, onToucher, reperes = "cible", vueInitiale, className, libelle, onArrive },
  ref,
) {
  const { ultra, leger, detail, erreur } = useCarte();
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
  const taille = useRef({ l: 300, h: 300, dpr: 1 });
  const props = useRef({ mode, cible, teintes, tourne, reperes, onArrive });
  props.current = { mode, cible, teintes, tourne, reperes, onArrive };
  const cartes = useRef<{ ultra: Carte | null; leger: Carte | null; detail: Carte | null }>({ ultra, leger, detail });
  cartes.current = { ultra, leger, detail };

  /** La projection pour la vue courante. */
  const projection = useCallback((v: Vue): GeoProjection => {
    const { l, h } = taille.current;
    if (props.current.mode === "plan") {
      const base = geoEqualEarth().rotate([-v.lon, 0]).fitExtent(
        [
          [6, 6],
          [l - 6, h - 6],
        ],
        { type: "Sphere" },
      );
      const s = base.scale() * v.zoom;
      base.scale(s).translate([l / 2, h / 2]);
      const p = base([v.lon, v.lat]) ?? [l / 2, h / 2];
      base.translate([l - p[0], h - p[1]]);
      // Le planisphère ne laisse jamais de vide au-dessus ou au-dessous : il couvre la hauteur, ou se centre.
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

  const dessiner = useCallback(() => {
    image.current = 0;
    const canvas = toile.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = (couleurs.current ??= lireCouleurs(canvas));
    const { l, h, dpr } = taille.current;
    const v = vue.current;
    const plan = props.current.mode === "plan";
    const bouge = enMouvement.current;
    const proche = v.zoom >= 3;
    // La carte selon la vue : l'ultra pour faire tourner le globe entier, la détaillée au repos ou de près.
    const { ultra: u, leger: lg, detail: dt } = cartes.current;
    const carte = proche ? (dt ?? lg ?? u) : bouge ? ((v.zoom < 1.8 ? u : lg) ?? lg ?? u ?? dt) : ((v.zoom < 1.8 ? lg : dt) ?? lg ?? dt ?? u);
    const proj = projection(v);
    // Pendant un mouvement, pas de rééchantillonnage des segments : la différence ne se voit pas.
    proj.precision(bouge || carte !== dt ? 0 : 0.6);
    const chemin = geoPath(proj, ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, l, h);

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

    const cibleCode = props.current.cible;
    const t = props.current.teintes ?? {};
    // Les pays coloriés, groupés par couleur.
    const groupes = new Map<string, string[]>();
    for (const [code, teinte] of Object.entries(t)) {
      if (code === cibleCode) continue;
      const couleur = c[teinte];
      const g = groupes.get(couleur);
      if (g) g.push(code);
      else groupes.set(couleur, [code]);
    }

    if (carte && !proche) {
      // Vue d'ensemble : les terres d'un seul tenant, les pays coloriés fusionnés, les frontières d'un trait.
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
      ctx.lineJoin = "round";
      ctx.beginPath();
      chemin(carte.frontieres);
      ctx.strokeStyle = c.trait;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.lineWidth = 0.7;
      ctx.stroke(terre);
    } else if (carte) {
      // De près : seulement les pays qui se voient, chacun projeté une seule fois.
      const visibleAngle = plan ? Math.PI : Math.asin(Math.min(1, Math.hypot(l, h) / 2 / ((Math.min(l, h) / 2 - 8) * v.zoom))) + 0.05;
      const centre: [number, number] = [v.lon, v.lat];
      const terre = new Path2D();
      const dessinTerre = geoPath(proj, enChemin(terre));
      const parCouleur = new Map<string, Path2D>();
      for (const f of carte.formes) {
        if (!plan && geoDistance(centre, f.centre) - f.rayon > visibleAngle) continue;
        if (f.code === cibleCode) continue;
        const teinte = t[f.code];
        if (teinte) {
          const couleur = c[teinte];
          let pc = parCouleur.get(couleur);
          if (!pc) parCouleur.set(couleur, (pc = new Path2D()));
          geoPath(proj, enChemin(pc))(f.f);
        } else dessinTerre(f.f);
      }
      for (const n of carte.neutres) dessinTerre(n);
      ctx.fillStyle = c.terre;
      ctx.fill(terre);
      ctx.strokeStyle = c.trait;
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.9;
      ctx.stroke(terre);
      for (const [couleur, pc] of parCouleur) {
        ctx.fillStyle = couleur;
        ctx.fill(pc);
        ctx.stroke(pc);
      }
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
      if (!tous && !estCible && !teinte) continue;
      if (!plan && geoDistance([v.lon, v.lat], rp.lonlat) > Math.PI / 2 - 0.02) continue;
      const p = proj(rp.lonlat);
      if (!p || p[0] < -20 || p[1] < -20 || p[0] > l + 20 || p[1] > h + 20) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], estCible ? 5.5 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = estCible ? c.cible : teinte ? c[teinte] : c.repere;
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
        if (p && (plan || geoDistance([v.lon, v.lat], cibleForme.centre) < Math.PI / 2)) {
          anneau.current.style.transform = `translate3d(${p[0]}px, ${p[1]}px, 0)`;
          anneau.current.dataset.visible = "";
          anneauPose = true;
        }
      }
      if (!anneauPose) delete anneau.current.dataset.visible;
    }

    // Le bord du globe : un filet d'or.
    if (!plan) {
      ctx.beginPath();
      chemin({ type: "Sphere" });
      ctx.strokeStyle = c.trait;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [projection]);

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
      const creux = props.current.mode === "plan" ? 0 : Math.min(1, distance / 1.4) * 0.9;
      const lz = Math.log(vl.de.zoom) + (Math.log(vl.vers.zoom) - Math.log(vl.de.zoom)) * e - creux * Math.sin(Math.PI * e);
      vue.current = { lon, lat, zoom: Math.max(props.current.mode === "plan" ? 1 : 0.85, Math.exp(lz)) };
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
      const plan = props.current.mode === "plan";
      const zoom = plan ? borne(zoomPour(forme, recul) / 2.2, 1, 14) : zoomPour(forme, recul);
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

  useImperativeHandle(
    ref,
    () => ({
      viser,
      vue: () => ({ ...vue.current }),
      zoomer: (facteur: number) => {
        derniereInteraction.current = performance.now();
        const de = { ...vue.current };
        const vers = { ...de, zoom: borne(de.zoom * facteur, 1, props.current.mode === "plan" ? 24 : 40) };
        if (mouvementReduit()) {
          vue.current = vers;
          dessiner();
        } else {
          vol.current = { de, vers, t0: performance.now(), duree: 320 };
          demander();
        }
      },
      voler: (vers: Vue) => {
        derniereInteraction.current = performance.now();
        const de = { ...vue.current };
        if (mouvementReduit()) {
          vue.current = { ...vers };
          dessiner();
        } else {
          const distance = geoDistance([de.lon, de.lat], [vers.lon, vers.lat]);
          vol.current = { de, vers: { ...vers }, t0: performance.now(), duree: borne(520 + distance * 420, 520, 1400) };
          demander();
        }
      },
      recentrer: () => {
        derniereInteraction.current = performance.now();
        const de = { ...vue.current };
        const vers = { lon: de.lon, lat: props.current.mode === "plan" ? 0 : 20, zoom: 1 };
        if (mouvementReduit()) {
          vue.current = vers;
          dessiner();
        } else {
          vol.current = { de, vers, t0: performance.now(), duree: 600 };
          demander();
        }
      },
    }),
    [viser, dessiner, demander],
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
      demander();
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => obs.disconnect();
  }, [demander]);

  // La carte arrive, les teintes changent : redessiner. La cible change : voler vers elle.
  useEffect(() => {
    demander();
  }, [ultra, leger, detail, teintes, mode, demander]);
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
    },
    [],
  );

  /* ---------- Le doigt, la souris, la molette ---------- */
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ x: number; y: number; t: number; bouge: boolean; ecart?: number; zoom?: number } | null>(null);

  const deplacer = (dx: number, dy: number) => {
    const v = vue.current;
    const { l, h } = taille.current;
    const echelle = props.current.mode === "plan" ? (l / 360) * v.zoom * 0.9 : ((Math.min(l, h) / 2 - 8) * v.zoom) / DEG;
    vue.current = { ...v, lon: v.lon - dx / echelle, lat: borne(v.lat + dy / echelle, -80, 80) };
    enMouvement.current = true;
    // La vitesse du geste (lissée), pour l'élan au moment où l'on lâche.
    const maintenant = performance.now();
    const dt = Math.max(1, maintenant - (vitesse.current.t || maintenant - 16));
    const lisser = (avant: number, mesure: number) => avant * 0.35 + mesure * 0.65;
    vitesse.current = { lon: lisser(vitesse.current.lon, dx / echelle / dt), lat: lisser(vitesse.current.lat, -dy / echelle / dt), t: maintenant };
    allumerHalo(true);
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
    if (recent && vite && !mouvementReduit() && props.current.mode !== "plan") {
      // L'élan est borné : un geste très vif ne fait pas tourner le monde comme une roue de loterie.
      const f = Math.min(1, 0.4 / Math.hypot(v.lon, v.lat));
      elan.current = { lon: v.lon * f, lat: v.lat * f };
      dernierElan.current = 0;
      demander();
    } else allumerHalo(false);
  };

  const toucher = (x: number, y: number) => {
    if (!onToucher) return;
    const carte = cartes.current.detail ?? cartes.current.leger ?? cartes.current.ultra;
    const proj = projection(vue.current);
    // D'abord les repères (les tout petits pays), à 14 px près.
    let meilleur: { code: string; d: number } | null = null;
    for (const rp of REPERES) {
      if (props.current.mode !== "plan" && geoDistance([vue.current.lon, vue.current.lat], rp.lonlat) > Math.PI / 2) continue;
      if (props.current.reperes !== "tous" && !props.current.teintes?.[rp.code]) continue;
      const p = proj(rp.lonlat);
      if (!p) continue;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < 14 && (!meilleur || d < meilleur.d)) meilleur = { code: rp.code, d };
    }
    if (meilleur) return onToucher(meilleur.code);
    const point = proj.invert?.([x, y]);
    if (!point || !Number.isFinite(point[0]) || !carte) return onToucher(null);
    if (props.current.mode !== "plan" && geoDistance([vue.current.lon, vue.current.lat], point) > Math.PI / 2) return onToucher(null);
    // Les petits d'abord (ils sont dessinés par-dessus).
    for (let i = carte.formes.length - 1; i >= 0; i--) {
      const f = carte.formes[i];
      if (geoDistance(f.centre, point) > f.rayon + 0.01) continue;
      if (geoContains(f.f, point)) return onToucher(f.code);
    }
    onToucher(null);
  };

  const evenements = interactif || glissable
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
          if (pointeurs.current.size === 2 && interactif) {
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
            vue.current = { ...vue.current, zoom: borne((geste.current.zoom ?? 1) * (ecart / geste.current.ecart), 1, props.current.mode === "plan" ? 24 : 40) };
            enMouvement.current = true;
            demander();
            return;
          }
          const dx = e.clientX - avant.x;
          const dy = e.clientY - avant.y;
          if (!geste.current.bouge && Math.hypot(e.clientX - geste.current.x, e.clientY - geste.current.y) > 5) geste.current.bouge = true;
          if (geste.current.bouge) deplacer(dx, dy);
        },
        onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => {
          pointeurs.current.delete(e.pointerId);
          const g = geste.current;
          if (pointeurs.current.size === 0) {
            geste.current = null;
            enMouvement.current = false;
            dernierePas.current = 0;
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
            if (!elan.current) allumerHalo(false);
          }
        },
        // La molette zoome les globes interactifs ; sur un globe qu'on fait seulement tourner, elle fait défiler la page.
        ...(interactif
          ? {
              onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => {
                derniereInteraction.current = performance.now();
                vue.current = { ...vue.current, zoom: borne(vue.current.zoom * Math.exp(-e.deltaY * 0.0016), 1, props.current.mode === "plan" ? 24 : 40) };
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

  return (
    <div ref={boite} className={`pt-globe ${className ?? ""}`} data-mode={mode} data-interactif={interactif || undefined} data-glissable={glissable || undefined}>
      <canvas ref={toile} role="img" aria-label={libelle} {...evenements} />
      {(interactif || glissable) && mode === "globe" && <span ref={halo} className="pt-globe-halo" aria-hidden="true" />}
      <span ref={anneau} className="pt-globe-anneau" aria-hidden="true" />
      {erreur && !ultra && !leger && <p className="pt-globe-erreur">La carte n&apos;a pas pu se charger. Vérifie ta connexion.</p>}
    </div>
  );
});
