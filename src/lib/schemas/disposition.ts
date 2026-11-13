import type { DonneesSchema, NoeudSchema } from "./modele";

export type Boite = { x: number; y: number; l: number; h: number; lignes: string[] };
export type Plan = { boites: Map<string, Boite>; visibles: Set<string>; enfants: Map<string, string[]>; minX: number; minY: number; maxX: number; maxY: number };

const LARGEUR_CAR = 7.3;
const HAUTEUR_LIGNE = 18;

/** Découpe un texte en lignes d'environ « largeur » caractères. */
export function couperTexte(texte: string, largeur = 24, maxLignes = 7): string[] {
  const lignes: string[] = [];
  for (const paragraphe of (texte || " ").split("\n")) {
    let courante = "";
    for (const mot of paragraphe.split(/\s+/)) {
      if (!mot) continue;
      if ((courante + " " + mot).trim().length > largeur && courante) {
        lignes.push(courante);
        courante = mot;
      } else courante = (courante + " " + mot).trim();
      while (courante.length > largeur * 1.4) {
        lignes.push(courante.slice(0, largeur));
        courante = courante.slice(largeur);
      }
    }
    lignes.push(courante);
  }
  if (lignes.length > maxLignes) return [...lignes.slice(0, maxLignes - 1), `${lignes[maxLignes - 1]}…`];
  return lignes;
}

export function taille(n: NoeudSchema): { l: number; h: number; lignes: string[] } {
  const lignes = couperTexte(n.texte, n.forme === "losange" ? 16 : 24);
  const plusLongue = Math.max(4, ...lignes.map((l) => l.length));
  let l = Math.max(96, Math.min(260, plusLongue * LARGEUR_CAR + 32));
  let h = lignes.length * HAUTEUR_LIGNE + 24;
  if (n.forme === "losange") {
    l *= 1.45;
    h *= 1.6;
  } else if (n.forme === "ellipse") {
    l *= 1.18;
    h *= 1.25;
  } else if (n.forme === "hexagone") l += 24;
  return { l: Math.round(l), h: Math.round(h), lignes };
}

/** Calcule la position de chaque élément selon la disposition choisie. « replies » : branches repliées. */
export function disposer(d: DonneesSchema, replies: Set<string> = new Set(d.noeuds.filter((n) => n.replie).map((n) => n.id))): Plan {
  const parId = new Map(d.noeuds.map((n) => [n.id, n]));
  const enfants = new Map<string, string[]>();
  const aUnParent = new Set<string>();
  for (const l of d.liens) {
    if (!parId.has(l.de) || !parId.has(l.vers)) continue;
    if (aUnParent.has(l.vers)) continue; // arbre : un seul parent retenu pour la disposition
    enfants.set(l.de, [...(enfants.get(l.de) ?? []), l.vers]);
    aUnParent.add(l.vers);
  }
  const tailles = new Map(d.noeuds.map((n) => [n.id, taille(n)]));
  const boites = new Map<string, Boite>();
  const visibles = new Set<string>();

  // Éléments cachés par une branche repliée.
  const cacher = (id: string, vus: Set<string>) => {
    for (const e of enfants.get(id) ?? []) {
      if (vus.has(e)) continue;
      vus.add(e);
      cacher(e, vus);
    }
  };
  const caches = new Set<string>();
  for (const r of replies) cacher(r, caches);
  for (const n of d.noeuds) if (!caches.has(n.id)) visibles.add(n.id);

  if (d.disposition === "libre") {
    for (const n of d.noeuds) {
      const t = tailles.get(n.id)!;
      boites.set(n.id, { x: n.x, y: n.y, l: t.l, h: t.h, lignes: t.lignes });
    }
  } else {
    const racines = d.noeuds.filter((n) => !aUnParent.has(n.id)).map((n) => n.id);
    const ecartFrere = 26;
    const ecartNiveau = d.disposition === "verticale" ? 70 : 64;
    const vertical = d.disposition === "verticale";
    // Taille transversale d'un sous-arbre (largeur en vertical, hauteur en horizontal).
    const cache = new Map<string, number>();
    const visite = new Set<string>();
    const transversal = (id: string): number => {
      if (cache.has(id)) return cache.get(id)!;
      const t = tailles.get(id)!;
      const propre = vertical ? t.l : t.h;
      const enf = replies.has(id) ? [] : (enfants.get(id) ?? []).filter((e) => !visite.has(e));
      enf.forEach((e) => visite.add(e));
      const somme = enf.reduce((s, e) => s + transversal(e), 0) + Math.max(0, enf.length - 1) * ecartFrere;
      const v = Math.max(propre, somme);
      cache.set(id, v);
      return v;
    };
    const profondeurMax = new Map<number, number>();
    const placer = (id: string, debutTrans: number, niveau: number, sens: 1 | -1, origine: number) => {
      const t = tailles.get(id)!;
      const largeurArbre = cache.get(id) ?? (vertical ? t.l : t.h);
      const centreTrans = debutTrans + largeurArbre / 2;
      const prof = origine + sens * niveau;
      if (vertical) boites.set(id, { x: centreTrans, y: prof, l: t.l, h: t.h, lignes: t.lignes });
      else boites.set(id, { x: prof, y: centreTrans, l: t.l, h: t.h, lignes: t.lignes });
      profondeurMax.set(niveau, Math.max(profondeurMax.get(niveau) ?? 0, vertical ? t.h : t.l));
      if (replies.has(id)) return;
      const enf = (enfants.get(id) ?? []).filter((e) => cache.has(e));
      const somme = enf.reduce((s, e) => s + cache.get(e)!, 0) + Math.max(0, enf.length - 1) * ecartFrere;
      let pos = centreTrans - somme / 2;
      const pas = (vertical ? t.h : t.l) / 2 + ecartNiveau;
      for (const e of enf) {
        const te = tailles.get(e)!;
        placer(e, pos, 0, sens, prof + sens * (pas + (vertical ? te.h : te.l) / 2));
        pos += cache.get(e)! + ecartFrere;
      }
    };

    if (d.disposition === "mentale" && racines.length > 0) {
      const centre = racines[0];
      visite.add(centre);
      const enf = enfants.get(centre) ?? [];
      enf.forEach((e) => visite.add(e));
      enf.forEach((e) => transversal(e));
      // Répartition équilibrée des branches à droite et à gauche.
      const droite: string[] = [];
      const gauche: string[] = [];
      let sD = 0;
      let sG = 0;
      for (const e of replies.has(centre) ? [] : enf) {
        if (sD <= sG) {
          droite.push(e);
          sD += cache.get(e)! + ecartFrere;
        } else {
          gauche.push(e);
          sG += cache.get(e)! + ecartFrere;
        }
      }
      const tc = tailles.get(centre)!;
      boites.set(centre, { x: 0, y: 0, l: tc.l, h: tc.h, lignes: tc.lignes });
      const cote = (liste: string[], sens: 1 | -1) => {
        const somme = liste.reduce((s, e) => s + cache.get(e)!, 0) + Math.max(0, liste.length - 1) * ecartFrere;
        let pos = -somme / 2;
        for (const e of liste) {
          const te = tailles.get(e)!;
          placer(e, pos, 0, sens, sens * (tc.l / 2 + 80 + te.l / 2));
          pos += cache.get(e)! + ecartFrere;
        }
      };
      cote(droite, 1);
      cote(gauche, -1);
      // Les autres racines (éléments isolés) sous la carte.
      let y = Math.max(sD, sG) / 2 + 120;
      for (const r of racines.slice(1)) {
        visite.add(r);
        transversal(r);
        placer(r, -cache.get(r)! / 2, 0, 1, 0);
        const b = boites.get(r)!;
        const decal = y - b.y;
        for (const [id, bo] of boites) if (bo === b || estDescendant(id, r, enfants)) boites.set(id, { ...bo, y: bo.y + decal });
        y += cache.get(r)! + 60;
      }
    } else {
      let pos = 0;
      for (const r of racines) {
        visite.add(r);
        transversal(r);
        placer(r, pos, 0, 1, 0);
        pos += cache.get(r)! + 60;
      }
    }
    // Éléments pris dans un cycle sans racine : placés en ligne.
    let reste = 0;
    for (const n of d.noeuds) {
      if (!boites.has(n.id)) {
        const t = tailles.get(n.id)!;
        boites.set(n.id, { x: reste, y: -200, l: t.l, h: t.h, lignes: t.lignes });
        reste += t.l + 30;
      }
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of visibles) {
    const b = boites.get(id);
    if (!b) continue;
    minX = Math.min(minX, b.x - b.l / 2);
    maxX = Math.max(maxX, b.x + b.l / 2);
    minY = Math.min(minY, b.y - b.h / 2);
    maxY = Math.max(maxY, b.y + b.h / 2);
  }
  if (!Number.isFinite(minX)) [minX, minY, maxX, maxY] = [-100, -60, 100, 60];
  return { boites, visibles, enfants, minX, minY, maxX, maxY };
}

function estDescendant(id: string, racine: string, enfants: Map<string, string[]>, vus = new Set<string>()): boolean {
  for (const e of enfants.get(racine) ?? []) {
    if (vus.has(e)) continue;
    vus.add(e);
    if (e === id || estDescendant(id, e, enfants, vus)) return true;
  }
  return false;
}

/** Point de sortie d'un trait sur le bord d'une boîte, en direction d'un autre point. */
export function bord(b: Boite, versX: number, versY: number): [number, number] {
  const dx = versX - b.x;
  const dy = versY - b.y;
  if (dx === 0 && dy === 0) return [b.x, b.y];
  const sx = b.l / 2 / Math.abs(dx || 1e-9);
  const sy = b.h / 2 / Math.abs(dy || 1e-9);
  const s = Math.min(sx, sy);
  return [b.x + dx * s, b.y + dy * s];
}
