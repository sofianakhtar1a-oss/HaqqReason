"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { PAR_ID } from "@/lib/corps/catalogue";
import { type Etape, melangerPoses } from "@/lib/corps/mouvement/gestes";
import { NB_AXIAUX, NB_LATERAUX, type Pose, auRepos, deplacer as deplacerPoint, poser } from "@/lib/corps/mouvement/squelette";
import type { Couche, RegionId, StructureScene } from "@/lib/corps/types";
import { type V3, borne, fois, longueur, moins, multiplier, perspective, plus, projeter, regarder, scal, unitaire } from "@/lib/corps/vec";
import { type Finesse, niveauPour, type Scene } from "./chargement";
import { type Camera, ORDRE, RenduReel } from "./reel";

/*
 * Le corps en 3D, qu'on fait tourner à 360°, qu'on rapproche, qu'on touche.
 *
 *   • Un doigt (ou la souris) fait tourner ; deux doigts rapprochent et déplacent ; la molette zoome
 *     vers ce qu'on vise ; clic droit ou Maj pour déplacer ; les flèches et + / − au clavier.
 *   • Un toucher bref choisit une structure ; un double toucher s'en approche.
 *   • La caméra glisse avec inertie, et vole d'une structure à l'autre ; tout est instantané si le
 *     système demande moins d'animations.
 *   • Rien ne se dessine à vide : une image seulement quand quelque chose bouge.
 *   • Les modèles arrivent couche par couche : ce qu'on demande à voir se télécharge à ce moment-là,
 *     d'abord en version légère, puis à la finesse que l'appareil peut tenir.
 */

export type EtatStructure = { teinte?: [number, number, number, number]; visible?: number; pulse?: boolean; choisi?: boolean };
export type NomVue = "face" | "dos" | "gauche" | "droite" | "ensemble";
/** Les enveloppes qu'on ne montre pas d'office : elles couvrent ce qu'on vient voir. */
export type CalqueOptionnel = "fascia" | "gaine" | "bourse" | "enveloppe";

/** Un plan de coupe : horizontal (axial), de profil (sagittal) ou de face (frontal), à une position en mètres. */
export type Coupe = { plan: "axial" | "sagittal" | "frontal"; position: number; inverse?: boolean };

export type Corps3DPoignee = {
  /** Mettre le squelette dans une pose (en douceur, ou d'un coup). Une pose vide ramène à la position anatomique. */
  poser(pose: Pose, o?: { instant?: boolean }): void;
  /** Jouer un programme de gestes (voir mouvement/gestes.ts). `etape` reçoit le rang de l'étape qui commence. */
  jouer(etapes: Etape[], o?: { boucle?: boolean; etape?: (rang: number) => void; fin?: () => void }): void;
  /** Arrêter le programme et revenir à la position anatomique. */
  arreter(): void;
  /** Cadrer ces éléments ; « depuis » : regarder du côté où cet élément-là se voit (sans le cadrer seul). */
  viser(ids: string[], o?: { cote?: "g" | "d" | null; marge?: number; instant?: boolean; depuis?: string }): void;
  vue(nom: NomVue, o?: { instant?: boolean }): void;
  zoomer(facteur: number): void;
  structuresDe(id: string): StructureScene[];
};

type Props = {
  scene: Scene | null;
  couches: Record<Couche, number>;
  /** Les fascias, gaines synoviales, bourses et séreuses (0 à 1). */
  calques?: Partial<Record<CalqueOptionnel, number>>;
  /** Montrer les surfaces d'insertion de ces muscles : origines en rouge, terminaisons en bleu. */
  attaches?: string[] | null;
  /** La finesse des modèles : selon l'appareil, ou choisie. */
  finesse?: Finesse;
  /** La pièce fraîche (humide) ou plastinée (satinée). */
  aspect?: "frais" | "plastine";
  /** La dissection : les muscles moins profonds que ce seuil s'effacent (0 : tout, 1 : sans les superficiels, 2 : les profonds seuls). */
  profondeur?: number;
  /** L'état de certaines structures (par identifiant d'élément). */
  etats?: Record<string, EtatStructure>;
  /** N'afficher que ces éléments (les autres deviennent des fantômes). */
  isoler?: string[] | null;
  /** Ôter ce qui couvre ces éléments, et rien d'autre : la dissection qu'il faut pour les voir. */
  decouvrir?: string[] | null;
  rotation?: boolean;
  interactif?: boolean;
  onChoisir?: (s: StructureScene | null) => void;
  onSurvol?: (s: StructureScene | null) => void;
  /** Une étiquette accrochée à une structure (et son texte). */
  etiquette?: { id: string; texte: string; sous?: string } | null;
  /** Un plan de coupe, ou rien. */
  coupe?: Coupe | null;
  /** La vue éclatée : 0 (le corps assemblé) à 1 (les pièces écartées les unes des autres). */
  eclate?: number;
  /** Le scalpel : on saisit une structure et on la tire hors du corps pour l'ôter. */
  scalpel?: boolean;
  onOter?: (s: StructureScene) => void;
  /** Le corps vivant : le cœur bat et le pouls court dans les artères ; la poitrine respire. */
  vivant?: { coeur?: boolean; souffle?: boolean } | null;
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

/*
 * Les axes des membres, mesurés sur le modèle (mètres ; x vers la gauche du sujet, y vers le haut, z vers l'avant) :
 * de l'épaule au coude, du coude au poignet, de la hanche au genou, du genou à la cheville.
 */
const AXES: Partial<Record<RegionId, [V3, V3]>> = {
  bras: [[0.168, 1.385, -0.025], [0.232, 1.095, -0.03]],
  "avant-bras": [[0.238, 1.09, -0.02], [0.268, 0.86, 0]],
  cuisse: [[0.1, 0.86, -0.02], [0.068, 0.45, -0.015]],
  jambe: [[0.072, 0.43, -0.025], [0.075, 0.08, -0.035]],
};
const POINTS: Partial<Record<RegionId, V3>> = {
  main: [0.28, 0.78, 0.005],
  pied: [0.08, 0.045, 0.02],
  epaule: [0.165, 1.39, -0.02],
  hanche: [0.09, 0.87, -0.02],
  tete: [0, 1.62, -0.005],
  cou: [0, 1.5, -0.02],
};

/** D'où regarder une structure : depuis l'axe de son segment (le bras, la cuisse…) vers elle. */
function directionPour(s: StructureScene): V3 {
  const region = (PAR_ID.get(s.element)?.region ?? "thorax") as RegionId;
  const droite = s.centre[0] < 0;
  const m = (p: V3): V3 => (droite ? [-p[0], p[1], p[2]] : p);
  let ancre: V3;
  const axe = AXES[region];
  const point = POINTS[region];
  if (axe) {
    const [A, B] = [m(axe[0]), m(axe[1])];
    const ab = moins(B, A);
    const t = borne(scal(moins(s.centre, A), ab) / scal(ab, ab), 0, 1);
    ancre = plus(A, fois(ab, t));
  } else if (point) ancre = region === "tete" || region === "cou" ? point : m(point);
  else ancre = [0, s.centre[1], -0.02];
  let d = moins(s.centre, ancre);
  d = [d[0], d[1] * 0.4, d[2]];
  // Un membre : on ne le regarde pas à travers le corps. Une structure à peine en dedans de l'axe (le biceps, devant
  // l'humérus) se regarde de face ou de dos ; seule une structure franchement médiale se regarde par le dedans.
  const dehors = s.centre[0] < 0 ? -1 : 1;
  if ((axe || (point && region !== "tete" && region !== "cou")) && d[0] * dehors < 0 && Math.abs(d[0]) < 2 * Math.abs(d[2])) d = [0, d[1], d[2]];
  // Un vaisseau ou un nerf du cou, du thorax ou de l'abdomen : de face, à hauteur (la chair et les os s'effacent devant
  // lui, les viscères restent rangés) ; ni par-dessous, ni à travers la colonne.
  const couche = PAR_ID.get(s.element)?.couche;
  if ((region === "cou" || region === "thorax" || region === "abdomen") && (couche === "nerf" || couche === "artere" || couche === "veine" || couche === "lymphe")) d = [d[0], 0, Math.max(d[2], Math.abs(d[0]) * 0.6, 0.02)];
  if (longueur(d) < 0.004) d = [s.centre[0] * 0.5, 0, s.centre[2] + 0.02 >= 0 ? 1 : -1];
  return unitaire(d);
}

const hexa = (h: string): [number, number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const SANS_TEINTE: [number, number, number, number] = [0, 0, 0, 0];
const ROUGE_ORIGINE: [number, number, number, number] = [214, 64, 52, 255];
const BLEU_TERMINAISON: [number, number, number, number] = [58, 112, 214, 255];

/** L'opacité voulue d'un calque du moteur. */
function cibleDe(p: Props, calque: string): number {
  if (calque === "insertion") return p.attaches?.length ? 1 : 0;
  if (calque in p.couches) return p.couches[calque as Couche] ?? 0;
  return p.calques?.[calque as CalqueOptionnel] ?? 0;
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
    r: RenduReel;
    scene: Scene | null;
    parElement: Map<string, number[]>;
    cam: Cam;
    vise: Cam;
    vitesse: [number, number];
    opacites: Record<string, number>;
    /** Les calques dont les modèles ont été demandés. */
    demandes: Set<string>;
    /** La qualité du dessin, de 0 (tout) à 3 (le plus léger), réglée d'après la cadence mesurée. */
    qualite: number;
    mesure: { images: number; somme: number; ignorees: number };
    tailler: () => void;
    desabonner: (() => void) | null;
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
    /** Le squelette : la pose courante, celle qu'on vise, les matrices envoyées au moteur. */
    pose: Pose;
    poseCible: Pose;
    poseEnRoute: boolean;
    matrices: Float32Array;
    programme: { etapes: Etape[]; rang: number; t: number; depuis: Pose; actifsDepuis: Record<string, number>; boucle: boolean; etape?: (rang: number) => void; fin?: () => void } | null;
    /** L'activité des muscles (élément → 0 à 1), et ceux qu'il a fallu remettre au repos. */
    actifs: Record<string, number>;
    /** Le déplacement de chaque structure (vue éclatée, scalpel) : courant et visé. */
    decal: Float32Array;
    decalCible: Float32Array;
    decalEnRoute: boolean;
    /** Les pièces du cœur et des poumons, et l'état de la respiration (0 : expiration, 1 : inspiration profonde). */
    vivants: { coeur: { i: number; c: V3; atrium: boolean }[]; poumons: { i: number; c: V3 }[] } | null;
    vivantActif: boolean;
    souffle: number;
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
    const ecoule = (t - (m.t0 || t)) / 1000 || 0.016;
    const dt = Math.min(0.05, ecoule);
    // La cadence : quand deux images se suivent, le temps qui les sépare. Trop lente, on allège le dessin.
    if (m.t0 && ecoule < 0.5) {
      if (m.mesure.ignorees < 8) m.mesure.ignorees++;
      else {
        m.mesure.images++;
        m.mesure.somme += ecoule;
        if (m.mesure.images >= 20) {
          const moyenne = m.mesure.somme / m.mesure.images;
          m.mesure = { images: 0, somme: 0, ignorees: 4 };
          if (moyenne > 0.024 && m.qualite < 3) {
            m.qualite++;
            m.tailler();
          }
        }
      }
    }
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
    // Les couches s'effacent et reviennent en fondu ; une couche demandée attend que ses modèles soient là.
    // Le fondu suit l'horloge, pas le nombre d'images : sur un appareil lent il ne dure pas plus longtemps.
    const ko = m.calmes ? 1 : 1 - Math.exp(-Math.min(0.4, ecoule) * 9);
    for (const n of ORDRE) {
      const voulue = cibleDe(props, n);
      const prete = m.scene ? m.scene.modele.niveau(n) !== null : false;
      if (voulue > 0.01 && !prete) demander(n);
      const cible = prete ? voulue : 0;
      const a = m.opacites[n] ?? 0;
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
    // Le squelette : un programme de gestes en cours, ou une pose visée qu'on rejoint en douceur.
    let poseChange = false;
    const pg = m.programme;
    if (pg) {
      const etape = pg.etapes[pg.rang];
      pg.t += dt;
      const u = borne(pg.t / Math.max(0.01, etape.duree), 0, 1);
      const e = u * u * (3 - 2 * u);
      m.pose = melangerPoses(pg.depuis, etape.pose, e);
      const actifs: Record<string, number> = {};
      for (const id of new Set([...Object.keys(pg.actifsDepuis), ...Object.keys(etape.actifs)])) actifs[id] = (pg.actifsDepuis[id] ?? 0) * (1 - e) + (etape.actifs[id] ?? 0) * e;
      activer(actifs, etape.surPlace ?? false);
      poseChange = bouge = true;
      if (u >= 1) {
        pg.depuis = etape.pose;
        pg.actifsDepuis = etape.actifs;
        pg.rang++;
        pg.t = 0;
        if (pg.rang >= pg.etapes.length) {
          if (pg.boucle) pg.rang = 0;
          else {
            m.programme = null;
            pg.fin?.();
          }
        }
        if (m.programme) pg.etape?.(pg.rang);
      }
    } else if (m.poseEnRoute) {
      let reste = false;
      const kp = m.calmes ? 1 : 1 - Math.exp(-dt * 6);
      const suite: Pose = {};
      for (const cle of new Set([...Object.keys(m.pose), ...Object.keys(m.poseCible)])) {
        const a = m.pose[cle] ?? 0;
        const b = m.poseCible[cle] ?? 0;
        const proche = Math.abs(b - a) < 0.05;
        const x = proche ? b : a + (b - a) * kp;
        if (!proche) reste = true;
        if (x) suite[cle] = x;
      }
      m.pose = suite;
      m.poseEnRoute = reste;
      poseChange = true;
      if (reste) bouge = true;
    }
    // Le corps vivant : le cœur bat à 60 par minute (les oreillettes, puis les ventricules) et l'onde du pouls court
    // le long des artères à 6 mètres par seconde ; la poitrine se soulève une quinzaine de fois par minute.
    const vivant = props.vivant;
    if ((vivant?.coeur || vivant?.souffle || m.vivantActif) && m.scene) {
      if (!m.vivants) m.vivants = preparerVivants();
      const anime = !m.calmes;
      const temps = t / 1000;
      const phase = anime ? temps % 1 : 0.3;
      const oreillettes = vivant?.coeur ? (phase < 0.12 ? Math.sin((Math.PI * phase) / 0.12) : 0) : 0;
      const ventricules = vivant?.coeur ? (phase >= 0.12 && phase < 0.45 ? Math.sin((Math.PI * (phase - 0.12)) / 0.33) : 0) : 0;
      for (const h of m.vivants.coeur) m.r.contracter(h.i, { origine: h.c, terminaison: [0, 0, 0], rond: true, raccourci: h.atrium ? 0.05 * oreillettes : 0.08 * ventricules });
      m.r.pouls = vivant?.coeur && anime ? { amplitude: 0.0007, instant: phase - 0.05, etalement: 0.33 } : { amplitude: 0, instant: 0, etalement: 1 };
      const souffle = vivant?.souffle ? (anime ? 0.3 + 0.3 * Math.sin((temps * 2 * Math.PI) / 4.4) : 0.6) : 0;
      for (const l of m.vivants.poumons) m.r.contracter(l.i, { origine: l.c, terminaison: [0, 0, 0], rond: true, raccourci: -0.04 * souffle });
      if (souffle !== m.souffle) {
        m.souffle = souffle;
        poseChange = true;
      }
      m.vivantActif = Boolean(vivant?.coeur || vivant?.souffle);
      if (anime && m.vivantActif) bouge = true;
      else m.besoin = true;
    }
    if (poseChange) {
      const pose = m.souffle ? { ...m.pose, "respiration.inspiration": (m.pose["respiration.inspiration"] ?? 0) + m.souffle } : m.pose;
      m.r.poser(auRepos(pose) ? null : poser(pose, m.matrices), NB_AXIAUX, NB_LATERAUX);
    }
    // Les pièces déplacées (vue éclatée, scalpel) glissent vers leur place.
    if (m.decalEnRoute) {
      let reste = false;
      const kd = m.calmes ? 1 : 1 - Math.exp(-Math.min(0.4, ecoule) * 8);
      for (let i = 0; i < m.decal.length; i += 3) {
        const dx = m.decalCible[i] - m.decal[i];
        const dy = m.decalCible[i + 1] - m.decal[i + 1];
        const dz = m.decalCible[i + 2] - m.decal[i + 2];
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const proche = Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 0.0004;
        m.decal[i] = proche ? m.decalCible[i] : m.decal[i] + dx * kd;
        m.decal[i + 1] = proche ? m.decalCible[i + 1] : m.decal[i + 1] + dy * kd;
        m.decal[i + 2] = proche ? m.decalCible[i + 2] : m.decal[i + 2] + dz * kd;
        m.r.decaler(i / 3, [m.decal[i], m.decal[i + 1], m.decal[i + 2]]);
        if (!proche) reste = true;
      }
      m.decalEnRoute = reste;
      if (reste) bouge = true;
    }
    // L'image.
    const largeur = canvas.width;
    const hauteur = canvas.height;
    const oeil: V3 = plus(c.cible, [c.dist * Math.cos(c.pitch) * Math.sin(c.yaw), c.dist * Math.sin(c.pitch), c.dist * Math.cos(c.pitch) * Math.cos(c.yaw)]);
    const vue = regarder(oeil, c.cible);
    const proj = perspective(FOV, largeur / Math.max(1, hauteur), 0.02, 30);
    m.camera = { vue, proj, oeil, yaw: c.yaw, focale: c.dist };
    m.r.dessiner(m.camera, t / 1000, { fige: !bouge && !m.pulses });
    placerEtiquette();
    if (bouge || m.pulses || m.besoin) {
      m.besoin = false;
      if (bouge || m.pulses) m.image = requestAnimationFrame(boucle);
    }
    // Tout est immobile, mais l'image s'affine encore (le studio accumule) : une image de plus.
    if (!m.image && m.r.affiner()) m.image = requestAnimationFrame(boucle);
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

  /** Les pièces qui vivent : celles du cœur (oreillettes et ventricules) et les lobes des poumons, avec leur centre. */
  function preparerVivants() {
    const m = moteur.current!;
    const structures = m.scene!.structures;
    const coeur: { i: number; c: V3; atrium: boolean }[] = [];
    const lobes: Record<string, number[]> = { droit: [], gauche: [] };
    for (const s of structures) {
      if (s.zone) continue;
      if (/^(atrium|ventricule)-/.test(s.element)) coeur.push({ i: s.id, c: s.centre, atrium: s.element.startsWith("atrium") });
      const l = /^lobe-(superieur|moyen|inferieur)-du-poumon-(droit|gauche)$/.exec(s.element);
      if (l) lobes[l[2]].push(s.id);
    }
    // Les lobes d'un poumon se gonflent ensemble, autour du centre du poumon (sinon ils s'écarteraient).
    const poumons: { i: number; c: V3 }[] = [];
    for (const ids of Object.values(lobes)) {
      if (!ids.length) continue;
      let c: V3 = [0, 0, 0];
      for (const i of ids) c = plus(c, structures[i].centre);
      c = fois(c, 1 / ids.length);
      for (const i of ids) poumons.push({ i, c });
    }
    return { coeur, poumons };
  }

  /** L'activité des muscles : leur ventre gonfle ; sans articulation à mouvoir, ils se raccourcissent sur place. */
  function activer(actifs: Record<string, number>, surPlace: boolean) {
    const m = moteur.current;
    if (!m || !m.scene) return;
    const structures = m.scene.structures;
    for (const id of new Set([...Object.keys(m.actifs), ...Object.keys(actifs)])) {
      const a = actifs[id] ?? 0;
      for (const i of m.parElement.get(id) ?? []) {
        const s = structures[i];
        if (s.zone) continue;
        m.r.contracter(i, { gonfle: a * borne(s.rayon * 0.035, 0.0008, 0.0045), raccourci: surPlace && s.origine && s.terminaison ? a * 0.13 : 0, origine: s.origine, terminaison: s.terminaison, rond: false });
      }
    }
    m.actifs = Object.fromEntries(Object.entries(actifs).filter(([, a]) => a > 0));
  }

  /** Fait venir les modèles d'un calque : la version légère tout de suite, puis celle que l'appareil peut tenir. */
  function demander(calque: string) {
    const m = moteur.current;
    if (!m || !m.scene || m.demandes.has(calque)) return;
    m.demandes.add(calque);
    const modele = m.scene.modele;
    const cible = niveauPour(p.current.finesse ?? "auto");
    void modele
      .demander(calque, 2)
      .then(() => (cible < 2 ? modele.demander(calque, cible) : undefined))
      .catch(() => {
        // Le réseau a manqué : on réessaiera à la prochaine image qui demande ce calque.
        moteur.current?.demandes.delete(calque);
      });
  }

  /** Une zone sans tendon propre (un tendon minuscule) suit son muscle : on rend la pièce. */
  function pieceDe(i: number): StructureScene | null {
    const m = moteur.current;
    const s = m?.scene?.structures[i];
    if (!m || !m.scene || !s) return null;
    if (s.zone && s.de !== undefined && m.scene.structures[s.de].element === s.element) return m.scene.structures[s.de];
    return s;
  }

  function survoler(i: number, oui: boolean) {
    const m = moteur.current;
    if (!m || i < 0) return;
    m.r.definir(i, { survol: oui });
    for (const j of m.scene?.modele.suiveuses.get(i) ?? []) m.r.definir(j, { survol: oui });
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
    // Le point d'accroche suit la structure : là où le squelette l'a emmenée, là où on l'a déplacée.
    let accroche = auRepos(m.pose) || meilleure.segment === undefined ? meilleure.centre : deplacerPoint(m.matrices, meilleure.segment, meilleure.centre);
    const pd = (meilleure.de ?? meilleure.id) * 3;
    if (m.decal[pd] || m.decal[pd + 1] || m.decal[pd + 2]) accroche = plus(accroche, [m.decal[pd], m.decal[pd + 1], m.decal[pd + 2]]);
    const pt = projeter(accroche, vp, rect.width, rect.height);
    if (!pt) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    el.style.transform = `translate(${Math.round(pt[0])}px, ${Math.round(pt[1])}px)`;
    // Près d'un bord, l'étiquette passe de l'autre côté de son point, ou glisse vers l'intérieur : elle ne sort jamais du cadre.
    const boite = el.firstElementChild as HTMLElement | null;
    const large = boite ? boite.offsetWidth : 0;
    const haut = boite ? boite.offsetHeight : 0;
    const placeD = rect.width - 8 - (pt[0] + 20);
    const placeG = pt[0] - 20 - 8;
    const versGauche = large > placeD && placeG > placeD;
    const deborde = Math.max(0, large - (versGauche ? placeG : placeD));
    const gauche = String(versGauche);
    const bas = String(pt[1] - 18 - haut < 6);
    if (el.dataset.gauche !== gauche) el.dataset.gauche = gauche;
    if (el.dataset.bas !== bas) el.dataset.bas = bas;
    el.style.setProperty("--decalage", `${Math.round(versGauche ? deborde : -deborde)}px`);
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
    poser(pose, o = {}) {
      const m = moteur.current;
      if (!m) return;
      m.programme = null;
      m.poseCible = { ...pose };
      if (o.instant || m.calmes) m.pose = { ...pose };
      m.poseEnRoute = true;
      reveiller();
    },
    jouer(etapes, o = {}) {
      const m = moteur.current;
      if (!m || !etapes.length) return;
      if (m.calmes) {
        // Moins d'animations : on montre le geste accompli, immobile.
        const rang = Math.max(0, etapes.findIndex((e) => e.legende));
        m.programme = null;
        m.pose = { ...etapes[rang].pose };
        m.poseCible = { ...etapes[rang].pose };
        m.poseEnRoute = true;
        activer(etapes[rang].actifs, etapes[rang].surPlace ?? false);
        o.etape?.(rang);
        reveiller();
        return;
      }
      m.programme = { etapes, rang: 0, t: 0, depuis: { ...m.pose }, actifsDepuis: { ...m.actifs }, boucle: o.boucle ?? false, etape: o.etape, fin: o.fin };
      o.etape?.(0);
      reveiller();
    },
    arreter() {
      const m = moteur.current;
      if (!m) return;
      m.programme = null;
      m.poseCible = {};
      m.poseEnRoute = true;
      activer({}, false);
      reveiller();
    },
    // Les méthodes ne lisent que des références : elles naissent une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  useImperativeHandle(ref, () => poignee, [poignee]);

  /* ---------- Le moteur et la toile ---------- */

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    let r: RenduReel;
    try {
      r = new RenduReel(canvas);
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
      opacites: {},
      demandes: new Set(),
      desabonner: null,
      qualite: 0,
      mesure: { images: 0, somme: 0, ignorees: 0 },
      tailler: () => undefined,
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
      pose: {},
      poseCible: {},
      poseEnRoute: false,
      matrices: new Float32Array((NB_AXIAUX + 2 * NB_LATERAUX) * 12),
      programme: null,
      actifs: {},
      decal: new Float32Array(0),
      decalCible: new Float32Array(0),
      decalEnRoute: false,
      vivants: null,
      vivantActif: false,
      souffle: 0,
    };
    // La taille : celle de l'élément, en pixels réels, plafonnée selon la qualité que l'appareil tient à 60 images
    // par seconde (qualité 0 : tout ; 1 : ombres plus petites ; 2 : sans ombres portées ; 3 : un pixel par point).
    const tailler = () => {
      const m = moteur.current;
      const q = m?.qualite ?? 0;
      const rect = canvas.getBoundingClientRect();
      const tactile = window.matchMedia?.("(pointer: coarse)").matches;
      const plafond = [tactile ? 1.75 : 2, 1.5, 1.25, 1][q];
      const dpr = Math.min(window.devicePixelRatio || 1, plafond);
      r.reglages.ombres = q < 2;
      r.reglages.tailleOmbre = q === 0 ? 2048 : 1024;
      // Le studio (occlusion d'écran, accumulation, profondeur de champ en gros plan) tant que l'appareil suit.
      r.reglages.studio = q < 2;
      r.reglages.occlusion = q === 0 ? 0.6 : 0.45;
      r.reglages.ouverture = q === 0 ? 0.0022 : 0;
      r.redimensionner(Math.max(1, Math.round(rect.width * dpr)), Math.max(1, Math.round(rect.height * dpr)));
      reveiller();
    };
    moteur.current.tailler = tailler;
    const ro = new ResizeObserver(tailler);
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
      m?.desabonner?.();
      moteur.current = null;
      r.detruire();
    };
    // Le moteur naît une fois par toile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La scène arrive (une fois) : la table des structures ; puis chaque paquet monte sur la carte graphique en arrivant.
  useEffect(() => {
    const m = moteur.current;
    const scene = props.scene;
    if (!m || !scene || m.scene === scene) return;
    m.desabonner?.();
    m.scene = scene;
    m.parElement = scene.parElement;
    m.demandes = new Set();
    const n = scene.structures.length;
    m.r.structures(n);
    for (const s of scene.structures) {
      if (s.couleur) m.r.definir(s.id, { propre: hexa(s.couleur) });
      // Les surfaces d'insertion : l'origine en rouge, la terminaison en bleu.
      if (s.calque === "insertion") m.r.definir(s.id, { propre: scene.modele.insertionDe.get(s.id)?.sorte === "terminaison" ? BLEU_TERMINAISON : ROUGE_ORIGINE });
      if (s.zone && s.de !== undefined && scene.structures[s.de].element !== s.element) m.r.definir(s.id, { coucheDesZones: true });
    }
    m.vis = new Float32Array(n).fill(m.calmes ? 1 : 0);
    m.visCible = new Float32Array(n).fill(1);
    m.decal = new Float32Array(n * 3);
    m.decalCible = new Float32Array(n * 3);
    m.vivants = null;
    for (let i = 0; i < n; i++) m.r.definir(i, { visible: m.vis[i] });
    m.desabonner = scene.modele.abonner((paquet, base, zones) => {
      const mm = moteur.current;
      if (!mm) return;
      mm.r.installer(paquet, base, zones);
      reveiller(900);
    });
    // Ce qui est déjà là (le niveau léger du départ) passe à la finesse de l'appareil, sans bloquer l'affichage.
    const cible = niveauPour(p.current.finesse ?? "auto");
    setTimeout(() => {
      if (moteur.current?.scene !== scene || cible >= 2) return;
      for (const c of ORDRE) if (scene.modele.niveau(c) !== null) void scene.modele.demander(c, cible).catch(() => undefined);
    }, 350);
    reveiller(1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scene]);

  // La finesse change (réglages) : les calques présents passent au nouveau niveau.
  useEffect(() => {
    const m = moteur.current;
    if (!m || !m.scene) return;
    const cible = niveauPour(props.finesse ?? "auto");
    for (const c of ORDRE) if (m.scene.modele.niveau(c) !== null) void m.scene.modele.demander(c, cible).catch(() => undefined);
  }, [props.finesse]);

  // Les états, la dissection, l'isolement, les attaches : la visibilité et la teinte voulues de chaque structure.
  useEffect(() => {
    const m = moteur.current;
    if (!m || !m.scene) return;
    const { etats = {}, profondeur = 0, isoler, attaches, decouvrir } = props;
    const structures = m.scene.structures;
    const n = structures.length;
    const garde = isoler && isoler.length ? new Set(isoler.flatMap((id) => m.parElement.get(id) ?? [])) : null;
    // Ce qu'il faut ôter pour voir les éléments à découvrir : les pièces qui les couvrent (pas celles qu'on veut voir).
    const voulues = new Set((decouvrir ?? []).flatMap((id) => m.parElement.get(id) ?? []).map((i) => structures[i].de ?? i));
    const otees = new Set<number>();
    for (const i of voulues) for (const c of m.scene.modele.couvrants.get(i) ?? []) if (!voulues.has(c)) otees.add(c);
    const montrees = new Set(attaches ?? []);
    const vis = new Float32Array(n);
    const teintes: ([number, number, number, number] | undefined)[] = new Array(n);
    const marques = new Uint8Array(n); // 1 : pulse, 2 : choisi
    for (let i = 0; i < n; i++) {
      const s = structures[i];
      let v = 1;
      if ((s.calque === "muscle" || s.calque === "tendon") && s.profondeur < profondeur && !voulues.has(s.de ?? i)) v = 0;
      if (otees.has(s.de ?? i)) v = 0;
      if (s.calque === "insertion") {
        const ins = m.scene.modele.insertionDe.get(i);
        v = ins && ins.muscles.some((x) => montrees.has(x)) ? 1 : 0;
      } else {
        // Un voile ne se montre qu'avec son calque (ou quand c'est lui qu'on étudie : son état le rallume plus bas).
        const voile = PAR_ID.get(s.element)?.voile;
        if (voile && !((props.calques?.[voile] ?? 0) > 0)) v = 0;
        else if (garde && !garde.has(i)) v = Math.min(v, 0.1);
      }
      vis[i] = v;
    }
    // Les états par élément : les ensembles d'abord, pour qu'un de leurs membres puisse avoir le sien.
    const entrees = Object.entries(etats).sort((a, b) => (PAR_ID.get(b[0])?.membres ? 1 : 0) - (PAR_ID.get(a[0])?.membres ? 1 : 0));
    for (const [id, e] of entrees)
      for (const i of m.parElement.get(id) ?? []) {
        if (e.visible !== undefined) vis[i] = e.visible;
        else if (PAR_ID.get(id)?.voile && (e.teinte || e.choisi || e.pulse)) vis[i] = 1;
        teintes[i] = e.teinte;
        marques[i] = (e.pulse ? 1 : 0) | (e.choisi ? 2 : 0);
      }
    // Une zone sans tendon propre suit sa pièce.
    for (const [piece, zones] of m.scene.modele.suiveuses)
      for (const z of zones) {
        vis[z] = vis[piece];
        teintes[z] = teintes[piece];
        marques[z] = marques[piece];
      }
    let pulses = false;
    for (let i = 0; i < n; i++) {
      m.visCible[i] = vis[i];
      m.r.definir(i, { teinte: teintes[i] ?? SANS_TEINTE, pulse: (marques[i] & 1) > 0, choisi: (marques[i] & 2) > 0 });
      if (marques[i] & 1 && vis[i] > 0.05) pulses = true;
    }
    m.pulses = pulses && !m.calmes;
    reveiller(900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scene, props.etats, props.profondeur, props.isoler, props.attaches, props.calques, props.decouvrir]);

  // Les couches, la rotation, l'étiquette, l'aspect de la pièce : une image de plus.
  useEffect(() => {
    const m = moteur.current;
    if (m) {
      m.r.reglages.humide = props.aspect === "plastine" ? 0.22 : 1;
      m.r.reglages.exposition = props.aspect === "plastine" ? 1.08 : 1;
    }
    reveiller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.couches, props.calques, props.rotation, props.etiquette, props.aspect]);

  // Le plan de coupe.
  useEffect(() => {
    const m = moteur.current;
    if (!m) return;
    const c = props.coupe;
    if (!c) m.r.coupe = null;
    else {
      const s = c.inverse ? -1 : 1;
      const n: V3 = c.plan === "axial" ? [0, 1, 0] : c.plan === "sagittal" ? [1, 0, 0] : [0, 0, 1];
      m.r.coupe = [n[0] * s, n[1] * s, n[2] * s, c.position * s];
    }
    reveiller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.coupe]);

  // La vue éclatée : chaque pièce s'écarte du centre de ce qu'on regarde (le corps, ou ce qu'on a isolé).
  useEffect(() => {
    const m = moteur.current;
    if (!m || !m.scene) return;
    const k = props.eclate ?? 0;
    const structures = m.scene.structures;
    const gardes = props.isoler && props.isoler.length ? props.isoler.flatMap((id) => m.parElement.get(id) ?? []) : [];
    let centre: V3 = [0, 0.95, -0.01];
    if (gardes.length) {
      centre = [0, 0, 0];
      for (const i of gardes) centre = plus(centre, structures[i].centre);
      centre = fois(centre, 1 / gardes.length);
    }
    const force: Record<string, number> = { os: 0.55, ligament: 0.6, muscle: 1, tendon: 1, fascia: 1.25, artere: 0.8, veine: 0.85, nerf: 0.8, viscere: 0.7, encephale: 0.6, lymphe: 0.8 };
    for (const s of structures) {
      if (s.zone) continue;
      const d = moins(s.centre, centre);
      const f = k * 0.75 * (force[s.calque] ?? 0.8) * (s.calque === "muscle" ? 1.25 - 0.2 * s.profondeur : 1);
      m.decalCible[s.id * 3] = d[0] * f;
      m.decalCible[s.id * 3 + 1] = d[1] * f * 0.5;
      m.decalCible[s.id * 3 + 2] = d[2] * f;
    }
    m.decalEnRoute = true;
    reveiller(600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.eclate, props.scene, props.isoler]);

  /* ---------- Les gestes ---------- */

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    const pointeurs = new Map<number, { x: number; y: number }>();
    let depart: { x: number; y: number; t: number; bouton: number; deplace: boolean } | null = null;
    let pince: { d: number; mx: number; my: number } | null = null;
    let dernierToucher = 0;
    let survolTempo = 0;
    // Le scalpel : la structure saisie, ses pièces, et l'échelle (mètres par pixel) à sa distance.
    let saisie: { s: StructureScene; ids: number[]; x: number; y: number; echelle: number; base: Float32Array } | null = null;

    const choisirSous = (cx: number, cy: number): StructureScene | null => {
      const m = moteur.current;
      if (!m || !m.scene || !m.camera) return null;
      const rect = canvas.getBoundingClientRect();
      const x = ((cx - rect.left) / rect.width) * canvas.width;
      const y = ((cy - rect.top) / rect.height) * canvas.height;
      const i = m.r.choisir(m.camera, x, y);
      reveiller();
      const s = i >= 0 ? pieceDe(i) : null;
      // Les surfaces d'insertion ne se choisissent pas : elles montrent seulement où le muscle s'attache.
      return s && s.element ? s : null;
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
      saisie = null;
      if (pointeurs.size === 1 && p.current.scalpel && m && m.scene && m.camera && ev.button === 0) {
        const s = choisirSous(ev.clientX, ev.clientY);
        if (s) {
          const structures = m.scene.structures;
          const ids = (m.parElement.get(s.element) ?? []).filter((i) => !structures[i].zone && structures[i].cote === s.cote);
          const rect = canvas.getBoundingClientRect();
          const loin = Math.max(0.05, longueur(moins(s.centre, m.camera.oeil)));
          const base = new Float32Array(ids.length * 3);
          ids.forEach((i, k) => base.set(m.decal.subarray(i * 3, i * 3 + 3), k * 3));
          saisie = { s, ids, x: ev.clientX, y: ev.clientY, echelle: (2 * Math.tan(FOV / 2) * loin) / Math.max(1, rect.height), base };
        }
      }
      if (pointeurs.size === 2) {
        saisie = null;
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
            survoler(m.survol, false);
            survoler(i, true);
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
      if (saisie && pointeurs.size === 1) {
        // La structure suit le doigt, dans le plan de l'écran.
        const c = m.cam;
        const droite: V3 = [Math.cos(c.yaw), 0, -Math.sin(c.yaw)];
        const haut: V3 = [-Math.sin(c.pitch) * Math.sin(c.yaw), Math.cos(c.pitch), -Math.sin(c.pitch) * Math.cos(c.yaw)];
        const v = plus(fois(droite, (ev.clientX - saisie.x) * saisie.echelle), fois(haut, -(ev.clientY - saisie.y) * saisie.echelle));
        saisie.ids.forEach((i, k) => {
          for (let a = 0; a < 3; a++) m.decal[i * 3 + a] = m.decalCible[i * 3 + a] = saisie!.base[k * 3 + a] + v[a];
          m.r.decaler(i, [m.decal[i * 3], m.decal[i * 3 + 1], m.decal[i * 3 + 2]]);
        });
        canvas.style.cursor = "grabbing";
        reveiller();
        return;
      }
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
        survoler(m.survol, false);
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
      if (saisie && depart.deplace) {
        // Tirée assez loin, la structure est ôtée ; sinon elle revient à sa place.
        const tenue = saisie;
        const loin = Math.hypot(ev.clientX - tenue.x, ev.clientY - tenue.y) > 70;
        if (loin) p.current.onOter?.(tenue.s);
        const remettre = () => {
          const mm = moteur.current;
          if (!mm) return;
          tenue.ids.forEach((i, k) => {
            for (let a = 0; a < 3; a++) {
              mm.decalCible[i * 3 + a] = tenue.base[k * 3 + a];
              if (loin) mm.decal[i * 3 + a] = tenue.base[k * 3 + a];
            }
            if (loin) mm.r.decaler(i, [mm.decal[i * 3], mm.decal[i * 3 + 1], mm.decal[i * 3 + 2]]);
          });
          mm.decalEnRoute = true;
          reveiller();
        };
        if (loin) setTimeout(remettre, 520);
        else remettre();
        saisie = null;
        depart = null;
        reveiller();
        return;
      }
      saisie = null;
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
        survoler(m.survol, false);
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
