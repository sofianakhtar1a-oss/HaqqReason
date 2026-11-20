/*
 * L'Écorché — du vocabulaire des fiches aux gestes du squelette.
 *
 * Une fiche de muscle dit : « coude, flexion, principal ». Ce module en tire un geste — d'où part l'articulation,
 * où elle arrive — puis un programme d'animation : mise en place, contraction, tenue, retour.
 * Quand le mouvement n'a pas de course depuis la position anatomique (étendre un coude déjà étendu, mettre en
 * supination une main qui l'est déjà), le geste part de la position opposée : on voit le muscle travailler.
 * Module pur.
 */
import { DDL, type Ddl } from "./articulations";
import type { Cote, Pose } from "./squelette";

export type Action = { articulation: string; mouvement: string; role: "principal" | "accessoire"; precision?: string };
export type Geste = { articulation: string; mouvement: string; depart: Pose; arrivee: Pose };

/** Les articulations que le squelette sait faire jouer (les autres mouvements se montrent par la seule contraction). */
export const ARTICULATIONS_MOBILES = new Set(DDL.map((d) => d.articulation).concat(["cotes"]));

const ddlDe = (articulation: string) => DDL.filter((d) => d.articulation === articulation);

/** Le départ et l'arrivée d'un degré de liberté pour aller dans un sens (+1 : vers le maximum). */
function course(d: Ddl, sens: 1 | -1, ampleur: number): [number, number] {
  const etendue = d.max - d.min;
  const vers = sens > 0 ? d.max : d.min;
  const oppose = sens > 0 ? d.min : d.max;
  const libre = Math.abs(vers);
  if (libre >= 0.3 * etendue) return [0, vers * 0.85 * ampleur];
  return [oppose * (libre === 0 ? 0.7 : 0.4) * ampleur, vers];
}

/** Les degrés de liberté d'un mouvement nommé, avec leur sens. `cote` : le côté du muscle qui agit. */
function cibles(articulation: string, mouvement: string, cote: Cote): { ddl: Ddl; sens: 1 | -1; avec?: Pose }[] {
  const signe: 1 | -1 = cote === "g" ? 1 : -1;
  const inverse: 1 | -1 = cote === "g" ? -1 : 1;
  const un = (id: string, sens: 1 | -1, avec?: Pose) => {
    const ddl = DDL.find((d) => d.id === id);
    return ddl ? [{ ddl, sens, avec }] : [];
  };
  // -- les cas qui ne se lisent pas tout seuls dans la table
  if (articulation === "cotes" || articulation === "respiration") {
    if (mouvement === "elevation" || mouvement === "inspiration") return un("respiration.inspiration", 1);
    if (mouvement === "abaissement" || mouvement === "expiration") return un("respiration.inspiration", -1);
    return [];
  }
  if (articulation === "temporo-mandibulaire" && mouvement === "diduction") return un("machoire.diduction", inverse); // le menton part du côté opposé au muscle
  if (articulation === "pouce-cmc" && mouvement === "opposition") return [...un("pouce.cmc-abduction", 1), ...un("pouce.cmc-flexion", 1), ...un("pouce.cmc-rotation", 1)];
  if (articulation === "genou" && mouvement.startsWith("rotation")) return un("genou.rotation", mouvement === "rotation-mediale" ? 1 : -1, { "genou.flexion": 80 });
  if (mouvement === "inclinaison" || mouvement === "rotation-homolaterale" || mouvement === "rotation-controlaterale") {
    const nom = mouvement === "inclinaison" ? "inclinaison" : "rotation";
    const sens = mouvement === "rotation-controlaterale" ? inverse : signe;
    return ddlDe(articulation)
      .filter((d) => d.plus === nom)
      .map((ddl) => ({ ddl, sens }));
  }
  // -- le cas général : le mouvement est le nom d'un des deux sens d'un degré de liberté de cette articulation
  const res: { ddl: Ddl; sens: 1 | -1 }[] = [];
  for (const ddl of ddlDe(articulation)) {
    if (ddl.plus === mouvement && ddl.moins !== mouvement) res.push({ ddl, sens: 1 });
    else if (ddl.moins === mouvement && ddl.plus !== mouvement) res.push({ ddl, sens: -1 });
  }
  return res;
}

/**
 * Le geste d'un mouvement nommé. `cote` : « g », « d », ou « deux » pour une contraction des deux côtés
 * (l'extension du rachis par les deux érecteurs). Rend null si le squelette ne sait pas le jouer.
 */
export function gesteDe(articulation: string, mouvement: string, cote: Cote | "deux" = "g", ampleur = 1): Geste | null {
  const depart: Pose = {};
  const arrivee: Pose = {};
  const cotes: Cote[] = cote === "deux" ? ["g", "d"] : [cote];
  let trouve = false;
  for (const c of cotes) {
    for (const { ddl, sens, avec } of cibles(articulation, mouvement, c)) {
      // Un mouvement du milieu du corps n'a qu'une clé : des deux côtés à la fois, l'inclinaison s'annule (on l'ignore).
      if (!ddl.lateral && cote === "deux" && ddl.plus === ddl.moins) continue;
      const cle = ddl.lateral ? `${ddl.id}:${c}` : ddl.id;
      const [d, a] = course(ddl, sens, ampleur);
      depart[cle] = d;
      arrivee[cle] = a;
      for (const [k, v] of Object.entries(avec ?? {})) {
        depart[`${k}:${c}`] = v;
        arrivee[`${k}:${c}`] = v;
      }
      trouve = true;
    }
  }
  return trouve ? { articulation, mouvement, depart, arrivee } : null;
}

/* ---------- le programme d'une animation ---------- */

export type Etape = {
  /** Durée en secondes. */
  duree: number;
  /** La pose à la fin de l'étape (on y va en douceur depuis la pose courante). */
  pose: Pose;
  /** L'activité des muscles à la fin de l'étape : identifiant d'élément → 0 (au repos) à 1 (contracté). */
  actifs: Record<string, number>;
  /** Ce que l'étape montre (pour une légende) : l'articulation et le mouvement, ou rien pendant les transitions. */
  legende?: { articulation: string; mouvement: string; precision?: string };
  /** Vrai quand aucune articulation ne bouge : le muscle se raccourcit alors sur place, vers son origine. */
  surPlace?: boolean;
};

/**
 * Le programme qui montre les actions d'un muscle, l'une après l'autre : pour chacune, la mise en place,
 * la contraction (le squelette bouge, le muscle gonfle), une tenue, puis le retour au repos.
 * Une action que le squelette ne sait pas jouer se montre par la seule contraction du muscle.
 */
export function programmeDe(muscle: string, actions: Action[], cote: Cote | "deux" = "g", o: { toutes?: boolean } = {}): Etape[] {
  const voulues = actions.filter((a) => o.toutes || a.role === "principal");
  const liste = voulues.length ? voulues : actions.slice(0, 1);
  const etapes: Etape[] = [];
  for (const a of liste) {
    const g = gesteDe(a.articulation, a.mouvement, cote);
    const legende = { articulation: a.articulation, mouvement: a.mouvement, precision: a.precision };
    if (g) {
      const enPlace = Object.values(g.depart).some((v) => v !== 0);
      if (enPlace) etapes.push({ duree: 0.7, pose: g.depart, actifs: { [muscle]: 0 } });
      etapes.push({ duree: 1.3, pose: g.arrivee, actifs: { [muscle]: 1 }, legende });
      etapes.push({ duree: 0.7, pose: g.arrivee, actifs: { [muscle]: 1 }, legende });
    } else {
      etapes.push({ duree: 0.9, pose: {}, actifs: { [muscle]: 1 }, legende, surPlace: true });
      etapes.push({ duree: 0.6, pose: {}, actifs: { [muscle]: 1 }, legende, surPlace: true });
    }
    etapes.push({ duree: 0.8, pose: {}, actifs: { [muscle]: 0 }, surPlace: !g });
  }
  return etapes;
}

/** Le mélange de deux poses (les clés absentes valent zéro). */
export function melangerPoses(a: Pose, b: Pose, t: number): Pose {
  const m: Pose = {};
  for (const k in a) m[k] = a[k] * (1 - t);
  for (const k in b) m[k] = (m[k] ?? 0) + b[k] * t;
  return m;
}
