"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { AVANT_BRAS_R, BRAS_R, CENTRE_CRANE, CUISSE_R, JAMBE_R, TETE_HUMERUS } from "@/lib/corps/anatomie/reperes";
import { PAR_ID } from "@/lib/corps/catalogue";
import type { Scene } from "@/lib/corps/scene";
import type { Couche, RegionId, StructureScene } from "@/lib/corps/types";
import { type V3, borne, fois, longueur, moins, multiplier, perspective, plus, projeter, regarder, scal, unitaire } from "@/lib/corps/vec";
import { type Camera, COUCHES, Rendu } from "./rendu";

/*
 * Le corps en 3D, qu'on fait tourner à 360°, qu'on rapproche, qu'on touche.
 *
 *   • Un doigt (ou la souris) fait tourner ; deux doigts rapprochent et déplacent ; la molette zoome
 *     vers ce qu'on vise ; clic droit ou Maj pour déplacer ; les flèches et + / − au clavier.
 *   • Un toucher bref choisit une structure ; un double toucher s'en approche.
 *   • La caméra glisse avec inertie, et vole d'une structure à l'autre ; tout est instantané si le
 *     système demande moins d'animations.
 *   • Rien ne se dessine à vide : une image seulement quand quelque chose bouge.
 */

export type EtatStructure = { teinte?: [number, number, number, number]; visible?: number; pulse?: boolean; choisi?: boolean };
export type NomVue = "face" | "dos" | "gauche" | "droite" | "ensemble";

export type Corps3DPoignee = {
  /** Cadrer ces éléments ; « depuis » : regarder du côté où cet élément-là se voit (sans le cadrer seul). */
  viser(ids: string[], o?: { cote?: "g" | "d" | null; marge?: number; instant?: boolean; depuis?: string }): void;
  vue(nom: NomVue, o?: { instant?: boolean }): void;
  zoomer(facteur: number): void;
  structuresDe(id: string): StructureScene[];
};

type Props = {
  scene: Scene | null;
  couches: Record<Couche, number>;
  /** La dissection : les muscles moins profonds que ce seuil s'effacent (0 : tout, 1 : sans les superficiels, 2 : les profonds seuls). */
  profondeur?: number;
  /** L'état de certaines structures (par identifiant d'élément). */
  etats?: Record<string, EtatStructure>;
  /** N'afficher que ces éléments (les autres deviennent des fantômes). */
  isoler?: string[] | null;
  rotation?: boolean;
  interactif?: boolean;
  onChoisir?: (s: StructureScene | null) => void;
  onSurvol?: (s: StructureScene | null) => void;
  /** Une étiquette accrochée à une structure (et son texte). */
  etiquette?: { id: string; texte: string; sous?: string } | null;
  className?: string;
  /** Le libellé pour les lecteurs d'écran. */
  libelle?: string;
};

const FOV = 0.6;
const CIBLE_CORPS: V3 = [0, 0.88, 0];

type Cam = { yaw: number; pitch: number; dist: number; cible: V3 };

const angleProche = (de: number, vers: number) => {
  let d = vers - de;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return de + d;
};

/** D'où regarder une structure : depuis l'axe de son segment (le bras, la cuisse…) vers elle. */
function directionPour(s: StructureScene): V3 {
  const region = (PAR_ID.get(s.element)?.region ?? "thorax") as RegionId;
  const droite = s.centre[0] < 0;
  const m = (p: V3): V3 => (droite ? [-p[0], p[1], p[2]] : p);
  const surSegment = (a: V3, b: V3): V3 => {
    const [A, B] = [m(a), m(b)];
    const ab = moins(B, A);
    const t = borne(scal(moins(s.centre, A), ab) / scal(ab, ab), 0, 1);
    return plus(A, fois(ab, t));
  };
  const seg = (r: typeof BRAS_R): [V3, V3] => [r.point(0, 0, 0), r.point(1, 0, 0)];
  let ancre: V3;
  switch (region) {
    case "bras":
      ancre = surSegment(...seg(BRAS_R));
      break;
    case "avant-bras":
      ancre = surSegment(...seg(AVANT_BRAS_R));
      break;
    case "cuisse":
      ancre = surSegment(...seg(CUISSE_R));
      break;
    case "jambe":
      ancre = surSegment(...seg(JAMBE_R));
      break;
    case "main":
      ancre = m([0.258, 0.8, 0.012]);
      break;
    case "pied":
      ancre = m([0.105, 0.05, 0.02]);
      break;
    case "epaule":
      ancre = m(TETE_HUMERUS);
      break;
    case "tete":
      ancre = CENTRE_CRANE;
      break;
    default:
      ancre = [0, s.centre[1], -0.012];
  }
  let d = moins(s.centre, ancre);
  d = [d[0], d[1] * 0.4, d[2]];
  if (longueur(d) < 0.004) d = [s.centre[0] * 0.5, 0, s.centre[2] + 0.012 >= 0 ? 1 : -1];
  return unitaire(d);
}

export const Corps3D = forwardRef<Corps3DPoignee, Props>(function Corps3D(props, ref) {
  const toile = useRef<HTMLCanvasElement>(null);
  const etiquetteRef = useRef<HTMLDivElement>(null);
  const p = useRef(props);
  // Le moteur lit les réglages à chaque image ; les poignées d'événements, au moment où ils arrivent.
  useEffect(() => {
    p.current = props;
  });

  const moteur = useRef<{
    r: Rendu;
    scene: Scene | null;
    parElement: Map<string, number[]>;
    cam: Cam;
    vise: Cam;
    vitesse: [number, number];
    opacites: Record<Couche, number>;
    vis: Float32Array;
    visCible: Float32Array;
    pulses: boolean;
    survol: number;
    dernierGeste: number;
    besoin: boolean;
    image: number;
    t0: number;
    calmes: boolean;
    camera: Camera | null;
    chaud: number;
    reveil: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const reveiller = (duree = 0) => {
    const m = moteur.current;
    if (!m) return;
    m.besoin = true;
    if (duree) m.chaud = Math.max(m.chaud, performance.now() + duree);
    if (!m.image) m.image = requestAnimationFrame(boucle);
  };

  // Le calcul d'une image : la caméra glisse vers sa cible, les couches et les structures vers leur visibilité.
  function boucle(t: number) {
    const m = moteur.current;
    if (!m) return;
    m.image = 0;
    const canvas = toile.current;
    if (!canvas) return;
    const dt = Math.min(0.05, (t - (m.t0 || t)) / 1000) || 0.016;
    m.t0 = t;
    const props = p.current;
    let bouge = false;
    // Inertie de la rotation.
    if (Math.abs(m.vitesse[0]) + Math.abs(m.vitesse[1]) > 0.0004) {
      m.vise.yaw += m.vitesse[0];
      m.vise.pitch = borne(m.vise.pitch + m.vitesse[1], -1.25, 1.35);
      m.vitesse = [m.vitesse[0] * Math.pow(0.04, dt), m.vitesse[1] * Math.pow(0.04, dt)];
      bouge = true;
    }
    // La rotation tranquille, quand personne ne touche.
    if (props.rotation && !m.calmes && performance.now() - m.dernierGeste > 5000) {
      m.vise.yaw += dt * 0.16;
      bouge = true;
    }
    if (performance.now() < m.chaud) bouge = true;
    const k = m.calmes ? 1 : 1 - Math.exp(-dt * 7.5);
    const c = m.cam;
    const v = m.vise;
    const ecart = Math.abs(v.yaw - c.yaw) + Math.abs(v.pitch - c.pitch) + Math.abs(v.dist - c.dist) * 2 + longueur(moins(v.cible, c.cible)) * 3;
    if (ecart > 0.0002) {
      c.yaw += (v.yaw - c.yaw) * k;
      c.pitch += (v.pitch - c.pitch) * k;
      c.dist += (v.dist - c.dist) * k;
      c.cible = plus(c.cible, fois(moins(v.cible, c.cible), k));
      bouge = true;
    }
    // Les couches s'effacent et reviennent en fondu.
    const ko = m.calmes ? 1 : 1 - Math.exp(-dt * 9);
    for (const n of COUCHES) {
      const cible = props.couches[n] ?? 0;
      const a = m.opacites[n];
      if (Math.abs(cible - a) > 0.004) {
        m.opacites[n] = a + (cible - a) * ko;
        bouge = true;
      } else m.opacites[n] = cible;
      m.r.opacites[n] = m.opacites[n];
    }
    for (let i = 0; i < m.vis.length; i++) {
      const d = m.visCible[i] - m.vis[i];
      if (Math.abs(d) > 0.004) {
        m.vis[i] += d * ko;
        m.r.definir(i, { visible: m.vis[i] });
        bouge = true;
      } else if (d !== 0) {
        m.vis[i] = m.visCible[i];
        m.r.definir(i, { visible: m.vis[i] });
      }
    }
    // L'image.
    const largeur = canvas.width;
    const hauteur = canvas.height;
    const oeil: V3 = plus(c.cible, [c.dist * Math.cos(c.pitch) * Math.sin(c.yaw), c.dist * Math.sin(c.pitch), c.dist * Math.cos(c.pitch) * Math.cos(c.yaw)]);
    const vue = regarder(oeil, c.cible);
    const proj = perspective(FOV, largeur / Math.max(1, hauteur), 0.02, 30);
    m.camera = { vue, proj, oeil };
    m.r.dessiner(m.camera, t / 1000);
    placerEtiquette();
    if (bouge || m.pulses || m.besoin) {
      m.besoin = false;
      if (bouge || m.pulses) m.image = requestAnimationFrame(boucle);
    }
    // Tout est immobile : si la rotation tranquille est permise, un réveil la lancera au bon moment.
    if (!m.image && props.rotation && !m.calmes && !m.reveil) {
      const attente = Math.max(50, 5000 - (performance.now() - m.dernierGeste) + 30);
      m.reveil = setTimeout(() => {
        if (moteur.current) {
          moteur.current.reveil = null;
          reveiller();
        }
      }, attente);
    }
  }

  function placerEtiquette() {
    const m = moteur.current;
    const el = etiquetteRef.current;
    const e = p.current.etiquette;
    if (!el) return;
    if (!m || !m.camera || !e || !toile.current) {
      el.style.opacity = "0";
      return;
    }
    const ids = m.parElement.get(e.id) ?? [];
    if (!ids.length || !m.scene) {
      el.style.opacity = "0";
      return;
    }
    // La pièce tournée vers nous (le côté gauche ou le droit).
    const oeil = m.camera.oeil;
    let meilleure = m.scene.structures[ids[0]];
    for (const i of ids) {
      const s = m.scene.structures[i];
      if (m.vis[i] > 0.5 && longueur(moins(s.centre, oeil)) < longueur(moins(meilleure.centre, oeil))) meilleure = s;
    }
    const vp = multiplier(m.camera.proj, m.camera.vue);
    const rect = toile.current.getBoundingClientRect();
    const pt = projeter(meilleure.centre, vp, rect.width, rect.height);
    if (!pt) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    el.style.transform = `translate(${Math.round(pt[0])}px, ${Math.round(pt[1])}px)`;
  }

  /* ---------- La poignée ---------- */

  const poignee = useMemo<Corps3DPoignee>(() => ({
    viser(ids, o = {}) {
      const m = moteur.current;
      if (!m || !m.scene) return;
      let indices = ids.flatMap((id) => m.parElement.get(id) ?? []);
      if (!indices.length) return;
      const s0 = m.scene.structures;
      if (o.cote) indices = indices.filter((i) => s0[i].cote === o.cote || s0[i].cote === null).length ? indices.filter((i) => s0[i].cote === o.cote || s0[i].cote === null) : indices;
      else if (indices.some((i) => s0[i].cote === "g") && indices.some((i) => s0[i].cote === "d")) {
        // Les deux côtés : celui qui fait face à la caméra.
        const oeil = m.camera?.oeil ?? [0, 1, 3];
        const g = indices.filter((i) => s0[i].cote !== "d");
        const d = indices.filter((i) => s0[i].cote !== "g");
        const proche = (l: number[]) => Math.min(...l.map((i) => longueur(moins(s0[i].centre, oeil))));
        indices = proche(g) <= proche(d) ? g : d;
      }
      const ss = indices.map((i) => s0[i]);
      let centre: V3 = [0, 0, 0];
      let poids = 0;
      for (const s of ss) {
        const w = 0.2 + s.rayon;
        centre = plus(centre, fois(s.centre, w));
        poids += w;
      }
      centre = fois(centre, 1 / poids);
      let rayon = 0.02;
      for (const s of ss) rayon = Math.max(rayon, longueur(moins(s.centre, centre)) + s.rayon * 0.85);
      const toileEl = toile.current;
      const aspect = toileEl ? toileEl.width / Math.max(1, toileEl.height) : 1;
      const demi = Math.min(FOV / 2, Math.atan(Math.tan(FOV / 2) * aspect));
      const dist = borne((rayon / Math.sin(demi)) * (o.marge ?? 1.15), 0.16, 4.2);
      // D'où regarder : la direction de la structure ; pour un groupe étendu, de trois quarts, devant ou derrière.
      let yaw: number;
      let pitch: number;
      const elements = new Set(ss.map((s) => s.element));
      const siennes = o.depuis ? (m.parElement.get(o.depuis) ?? []) : [];
      const duCote = siennes.filter((i) => !o.cote || s0[i].cote === o.cote || s0[i].cote === null);
      const temoins = duCote.length ? duCote : siennes;
      if (temoins.length) {
        // Le côté d’où la structure cherchée se voit, de trois quarts : elle est visible, pas désignée.
        let dir: V3 = [0, 0, 0];
        for (const i of temoins) dir = plus(dir, directionPour(s0[i]));
        dir = longueur(dir) < 1e-3 ? [0, 0, 1] : unitaire(dir);
        const y = Math.atan2(dir[0], dir[2]);
        const biais = Math.abs(Math.sin(y)) < 0.5 ? 0.32 * (centre[0] < -0.05 ? -1 : 1) * (Math.cos(y) >= 0 ? 1 : -1) : 0;
        yaw = y + biais;
        pitch = borne(Math.asin(borne(dir[1], -1, 1)) * 0.6 + 0.06, -0.5, 0.6);
      } else if (elements.size > 1 && rayon > 0.22) {
        const derriere = ss.filter((s) => directionPour(s)[2] < -0.3).length;
        const devant = ss.filter((s) => directionPour(s)[2] > 0.3).length;
        const cote = centre[0] < -0.05 ? -1 : 1;
        yaw = derriere > devant ? Math.PI - 0.38 * cote : 0.38 * cote;
        pitch = 0.08;
      } else {
        let dir: V3 = [0, 0, 0];
        for (const s of ss) dir = plus(dir, directionPour(s));
        dir = longueur(dir) < 1e-3 ? [0, 0, 1] : unitaire(dir);
        yaw = Math.atan2(dir[0], dir[2]);
        pitch = borne(Math.asin(borne(dir[1], -1, 1)) + 0.08, -0.6, 0.75);
      }
      m.vise = { yaw: angleProche(m.cam.yaw, yaw), pitch, dist, cible: centre };
      m.vitesse = [0, 0];
      if (o.instant || m.calmes) m.cam = { ...m.vise };
      m.dernierGeste = performance.now();
      reveiller();
    },
    vue(nom, o = {}) {
      const m = moteur.current;
      if (!m) return;
      const yaw = { face: 0, dos: Math.PI, gauche: Math.PI / 2, droite: -Math.PI / 2, ensemble: 0.55 }[nom];
      const toileEl = toile.current;
      const aspect = toileEl ? toileEl.width / Math.max(1, toileEl.height) : 1;
      const dist = aspect < 0.7 ? 3.2 : 3.0;
      m.vise = { yaw: angleProche(m.cam.yaw, yaw), pitch: 0.06, dist, cible: CIBLE_CORPS };
      m.vitesse = [0, 0];
      if (o.instant || m.calmes) m.cam = { ...m.vise };
      m.dernierGeste = performance.now();
      reveiller();
    },
    zoomer(facteur) {
      const m = moteur.current;
      if (!m) return;
      m.vise.dist = borne(m.vise.dist * facteur, 0.12, 5);
      m.dernierGeste = performance.now();
      reveiller();
    },
    structuresDe(id) {
      const m = moteur.current;
      if (!m || !m.scene) return [];
      return (m.parElement.get(id) ?? []).map((i) => m.scene!.structures[i]);
    },
    // Les méthodes ne lisent que des références : elles naissent une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  useImperativeHandle(ref, () => poignee, [poignee]);

  /* ---------- Le moteur et la toile ---------- */

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    let r: Rendu;
    try {
      r = new Rendu(canvas);
    } catch {
      canvas.dataset.erreur = "webgl";
      return;
    }
    const calmes = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const depart: Cam = { yaw: 0.35, pitch: 0.06, dist: 3.1, cible: CIBLE_CORPS };
    moteur.current = {
      r,
      scene: null,
      parElement: new Map(),
      cam: { ...depart, yaw: calmes ? 0.35 : -0.9, dist: calmes ? 3.1 : 3.8 },
      vise: depart,
      vitesse: [0, 0],
      opacites: { os: 0, muscle: 0, tendon: 0, artere: 0 },
      vis: new Float32Array(0),
      visCible: new Float32Array(0),
      pulses: false,
      survol: -1,
      dernierGeste: performance.now(),
      besoin: true,
      image: 0,
      t0: 0,
      calmes,
      camera: null,
      chaud: 0,
      reveil: null,
    };
    // La taille : celle de l'élément, en pixels réels (plafonnée pour garder 60 images par seconde).
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const tactile = window.matchMedia?.("(pointer: coarse)").matches;
      const dpr = Math.min(window.devicePixelRatio || 1, tactile ? 1.75 : 2);
      r.redimensionner(Math.max(1, Math.round(rect.width * dpr)), Math.max(1, Math.round(rect.height * dpr)));
      reveiller();
    });
    ro.observe(canvas);
    const perdu = (ev: Event) => {
      ev.preventDefault();
      canvas.dataset.erreur = "perdu";
    };
    canvas.addEventListener("webglcontextlost", perdu);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", perdu);
      const m = moteur.current;
      if (m?.image) cancelAnimationFrame(m.image);
      if (m?.reveil) clearTimeout(m.reveil);
      moteur.current = null;
      r.detruire();
    };
    // Le moteur naît une fois par toile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La scène arrive (une fois) : les tampons montent sur la carte graphique.
  useEffect(() => {
    const m = moteur.current;
    const scene = props.scene;
    if (!m || !scene || m.scene === scene) return;
    m.r.charger(scene.couches, scene.structures.length);
    m.scene = scene;
    m.parElement = new Map();
    scene.structures.forEach((s, i) => {
      const l = m.parElement.get(s.element) ?? [];
      l.push(i);
      m.parElement.set(s.element, l);
      if (s.teinte) m.r.definir(i, { teinte: s.teinte });
    });
    m.vis = new Float32Array(scene.structures.length).fill(m.calmes ? 1 : 0);
    m.visCible = new Float32Array(scene.structures.length).fill(1);
    for (let i = 0; i < m.vis.length; i++) m.r.definir(i, { visible: m.vis[i] });
    reveiller(1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scene]);

  // Les états, la dissection, l'isolement : la visibilité voulue de chaque structure.
  useEffect(() => {
    const m = moteur.current;
    if (!m || !m.scene) return;
    const { etats = {}, profondeur = 0, isoler } = props;
    const isole = isoler && isoler.length ? new Set(isoler) : null;
    let pulses = false;
    m.scene.structures.forEach((s, i) => {
      const e = etats[s.element];
      let vis = s.couche === "muscle" && s.profondeur < profondeur ? 0 : 1;
      if (isole && !isole.has(s.element)) vis = Math.min(vis, 0.1);
      if (e?.visible !== undefined) vis = e.visible;
      m.visCible[i] = vis;
      const base = s.teinte ?? [0, 0, 0, 0];
      m.r.definir(i, { teinte: e?.teinte ?? base, pulse: Boolean(e?.pulse), choisi: Boolean(e?.choisi) });
      if (e?.pulse && vis > 0.05) pulses = true;
    });
    m.pulses = pulses && !m.calmes;
    reveiller(900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scene, props.etats, props.profondeur, props.isoler]);

  // Les couches, la rotation, l'étiquette : une image de plus.
  useEffect(() => {
    reveiller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.couches, props.rotation, props.etiquette]);

  /* ---------- Les gestes ---------- */

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    const pointeurs = new Map<number, { x: number; y: number }>();
    let depart: { x: number; y: number; t: number; bouton: number; deplace: boolean } | null = null;
    let pince: { d: number; mx: number; my: number } | null = null;
    let dernierToucher = 0;
    let survolTempo = 0;

    const choisirSous = (cx: number, cy: number): StructureScene | null => {
      const m = moteur.current;
      if (!m || !m.scene || !m.camera) return null;
      const rect = canvas.getBoundingClientRect();
      const x = ((cx - rect.left) / rect.width) * canvas.width;
      const y = ((cy - rect.top) / rect.height) * canvas.height;
      const i = m.r.choisir(m.camera, x, y);
      reveiller();
      return i >= 0 ? m.scene.structures[i] : null;
    };

    const deplacer = (dx: number, dy: number) => {
      const m = moteur.current;
      if (!m) return;
      const c = m.vise;
      const s = c.dist * 0.0016;
      const droite: V3 = [Math.cos(c.yaw), 0, -Math.sin(c.yaw)];
      const haut: V3 = [-Math.sin(c.pitch) * Math.sin(c.yaw), Math.cos(c.pitch), -Math.sin(c.pitch) * Math.cos(c.yaw)];
      c.cible = plus(c.cible, plus(fois(droite, -dx * s), fois(haut, dy * s)));
      c.cible = [borne(c.cible[0], -1, 1), borne(c.cible[1], -0.2, 2), borne(c.cible[2], -1, 1)];
    };

    const bas = (ev: PointerEvent) => {
      if (p.current.interactif === false) return;
      canvas.setPointerCapture(ev.pointerId);
      pointeurs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const m = moteur.current;
      if (m) {
        m.vitesse = [0, 0];
        m.dernierGeste = performance.now();
      }
      if (pointeurs.size === 1) depart = { x: ev.clientX, y: ev.clientY, t: performance.now(), bouton: ev.button, deplace: false };
      if (pointeurs.size === 2) {
        const [a, b] = [...pointeurs.values()];
        pince = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        if (depart) depart.deplace = true;
      }
    };

    const bouge = (ev: PointerEvent) => {
      const m = moteur.current;
      if (!m) return;
      const avant = pointeurs.get(ev.pointerId);
      if (!avant) {
        // Le survol (souris seulement), sans plus d'une recherche toutes les 60 ms.
        if (ev.pointerType === "mouse" && p.current.onSurvol && performance.now() - survolTempo > 60) {
          survolTempo = performance.now();
          const s = choisirSous(ev.clientX, ev.clientY);
          const i = s ? s.id : -1;
          if (i !== m.survol) {
            if (m.survol >= 0) m.r.definir(m.survol, { survol: false });
            if (i >= 0) m.r.definir(i, { survol: true });
            m.survol = i;
            canvas.style.cursor = i >= 0 ? "pointer" : "grab";
            p.current.onSurvol(s);
            reveiller();
          }
        }
        return;
      }
      const dx = ev.clientX - avant.x;
      const dy = ev.clientY - avant.y;
      pointeurs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      m.dernierGeste = performance.now();
      if (depart && Math.hypot(ev.clientX - depart.x, ev.clientY - depart.y) > 6) depart.deplace = true;
      if (pointeurs.size === 2 && pince) {
        const [a, b] = [...pointeurs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        m.vise.dist = borne(m.vise.dist * (pince.d / Math.max(10, d)), 0.12, 5);
        deplacer(mx - pince.mx, my - pince.my);
        pince = { d, mx, my };
      } else if (pointeurs.size === 1) {
        if (depart && (depart.bouton === 2 || ev.shiftKey)) deplacer(dx, dy);
        else {
          const vy = -dx * 0.0085;
          const vp = dy * 0.0065;
          m.vise.yaw += vy;
          m.vise.pitch = borne(m.vise.pitch + vp, -1.25, 1.35);
          m.vitesse = [vy * 0.9, vp * 0.9];
        }
      }
      if (m.survol >= 0) {
        m.r.definir(m.survol, { survol: false });
        m.survol = -1;
      }
      canvas.style.cursor = "grabbing";
      reveiller();
    };

    const haut = (ev: PointerEvent) => {
      const m = moteur.current;
      pointeurs.delete(ev.pointerId);
      if (pointeurs.size < 2) pince = null;
      canvas.style.cursor = "grab";
      if (!m || !depart || pointeurs.size > 0) {
        if (pointeurs.size === 0) depart = null;
        return;
      }
      const bref = performance.now() - depart.t < 450 && !depart.deplace;
      if (bref) {
        m.vitesse = [0, 0];
        const s = choisirSous(ev.clientX, ev.clientY);
        const maintenant = performance.now();
        // Un double toucher sur une structure : on s'en approche.
        if (s && maintenant - dernierToucher < 330) {
          const el = s.element;
          setTimeout(() => poignee.viser([el], { cote: s.cote }), 0);
        }
        dernierToucher = maintenant;
        p.current.onChoisir?.(s);
      }
      depart = null;
      reveiller();
    };

    const molette = (ev: WheelEvent) => {
      if (p.current.interactif === false) return;
      ev.preventDefault();
      const m = moteur.current;
      if (!m) return;
      const f = Math.exp(borne(ev.deltaY, -120, 120) * 0.0016);
      // Zoomer vers ce que vise la souris.
      if (f < 1 && m.camera) {
        const rect = canvas.getBoundingClientRect();
        const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = 1 - ((ev.clientY - rect.top) / rect.height) * 2;
        const c = m.vise;
        const h = Math.tan(FOV / 2) * c.dist;
        const w = h * (rect.width / rect.height);
        deplacer((-nx * w * (1 - f)) / (c.dist * 0.0016), (ny * h * (1 - f)) / (c.dist * 0.0016));
      }
      m.vise.dist = borne(m.vise.dist * f, 0.12, 5);
      m.dernierGeste = performance.now();
      reveiller();
    };

    const clavier = (ev: KeyboardEvent) => {
      const m = moteur.current;
      if (!m || p.current.interactif === false) return;
      const pas = ev.shiftKey ? 0.35 : 0.14;
      let fait = true;
      if (ev.key === "ArrowLeft") m.vise.yaw -= pas;
      else if (ev.key === "ArrowRight") m.vise.yaw += pas;
      else if (ev.key === "ArrowUp") m.vise.pitch = borne(m.vise.pitch + pas * 0.7, -1.25, 1.35);
      else if (ev.key === "ArrowDown") m.vise.pitch = borne(m.vise.pitch - pas * 0.7, -1.25, 1.35);
      else if (ev.key === "+" || ev.key === "=") m.vise.dist = borne(m.vise.dist * 0.85, 0.12, 5);
      else if (ev.key === "-" || ev.key === "_") m.vise.dist = borne(m.vise.dist / 0.85, 0.12, 5);
      else if (ev.key === "0") poignee.vue("face");
      else fait = false;
      if (fait) {
        ev.preventDefault();
        m.dernierGeste = performance.now();
        reveiller();
      }
    };

    const sortie = () => {
      const m = moteur.current;
      if (m && m.survol >= 0) {
        m.r.definir(m.survol, { survol: false });
        m.survol = -1;
        p.current.onSurvol?.(null);
        reveiller();
      }
    };

    const menu = (ev: Event) => ev.preventDefault();
    canvas.addEventListener("pointerdown", bas);
    canvas.addEventListener("pointermove", bouge);
    canvas.addEventListener("pointerup", haut);
    canvas.addEventListener("pointercancel", haut);
    canvas.addEventListener("pointerleave", sortie);
    canvas.addEventListener("wheel", molette, { passive: false });
    canvas.addEventListener("keydown", clavier);
    canvas.addEventListener("contextmenu", menu);
    return () => {
      canvas.removeEventListener("pointerdown", bas);
      canvas.removeEventListener("pointermove", bouge);
      canvas.removeEventListener("pointerup", haut);
      canvas.removeEventListener("pointercancel", haut);
      canvas.removeEventListener("pointerleave", sortie);
      canvas.removeEventListener("wheel", molette);
      canvas.removeEventListener("keydown", clavier);
      canvas.removeEventListener("contextmenu", menu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`ecorche-scene ${props.className ?? ""}`}>
      <canvas ref={toile} className="ecorche-toile" tabIndex={0} role="img" aria-label={props.libelle ?? "Le corps humain en trois dimensions : faites-le tourner, rapprochez-vous, touchez une structure."} />
      <div ref={etiquetteRef} className="ecorche-etiquette" aria-hidden={!props.etiquette}>
        {props.etiquette && (
          <span>
            <b>{props.etiquette.texte}</b>
            {props.etiquette.sous && <i>{props.etiquette.sous}</i>}
          </span>
        )}
      </div>
    </div>
  );
});
