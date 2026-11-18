"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import type { Phrase } from "@/lib/alambic/transcription/types";
import { chargerPdfjs } from "@/lib/client/pdf";

/*
 * Une page du PDF telle qu'elle a été composée : le dessin exact de la page (polices, images,
 * couleurs, marges, tableaux, couverture) est rendu par pdf.js dans une toile, et une couche de
 * texte invisible, posée exactement sur les lettres, permet de sélectionner et de toucher les mots.
 *
 * Un mot touché est retrouvé dans les phrases du texte de la page (le même découpage que la vue
 * « texte seul ») : la traduction au clic garde donc ses analyses et ses traductions en mémoire.
 *
 * Version traduite : chaque paragraphe est remplacé à sa place, dans son cadre, avec la couleur
 * du fond et de l'encre relevées sur la page, une police proche et une taille ajustée pour tenir
 * dans le même espace. Les images, filets, tableaux et marges ne bougent pas.
 */

type ContenuTexte = Awaited<ReturnType<PDFPageProxy["getTextContent"]>>;
type Element = ContenuTexte["items"][number];
type ElementTexte = Extract<Element, { str: string }>;
type Rect = { x: number; y: number; l: number; h: number };
type Police = { taille: number; famille: string; graisse: number; italique: boolean };
type Jeton = { rects: Rect[]; police: Police; encre: string };
type Geometrie = {
  largeur: number;
  hauteur: number;
  jetons: Jeton[];
  /** Jeton de la page → mot des phrases (« phrase:mot »), et l'inverse. */
  versMot: Map<number, { p: number; i: number }>;
  depuisMot: Map<string, number>;
  fond: string;
  encre: string;
  /** Le dessin de la page, pour relever la couleur du fond derrière chaque paragraphe traduit. */
  dessin: { ctx: CanvasRenderingContext2D; ratio: number } | null;
};

const MARGE_TOILE = 16_000_000;

/**
 * Le texte de la page, construit exactement comme à l'import (lib/langues/pdf.ts), avec pour chaque
 * caractère l'élément de texte et la position d'où il vient (-1 pour un espace ajouté).
 */
function texteSitue(elements: ElementTexte[]) {
  const car: string[] = [];
  const src: number[] = [];
  const pos: number[] = [];
  let y: number | null = null;
  elements.forEach((el, n) => {
    const yi = el.transform[5];
    const h = Math.abs(el.transform[3]) || 10;
    if (y !== null && Math.abs(y - yi) > h * 1.8) {
      car.push("\n", "\n");
      src.push(-1, -1);
      pos.push(0, 0);
    } else if (y !== null && Math.abs(y - yi) > h * 0.5) {
      if (car[car.length - 1] === "-") {
        car.pop();
        src.pop();
        pos.pop();
      } else {
        car.push(" ");
        src.push(-1);
        pos.push(0);
      }
    }
    for (let c = 0; c < el.str.length; c++) {
      car.push(el.str[c]);
      src.push(n);
      pos.push(c);
    }
    y = yi;
  });
  // Les espaces et tabulations répétés deviennent un seul espace, puis les bords sont rognés.
  const t: string[] = [];
  const s: number[] = [];
  const p: number[] = [];
  for (let k = 0; k < car.length; k++) {
    const espace = car[k] === " " || car[k] === "\t";
    if (espace && t[t.length - 1] === " ") continue;
    t.push(espace ? " " : car[k]);
    s.push(src[k]);
    p.push(pos[k]);
  }
  let debut = 0;
  let fin = t.length;
  while (debut < fin && /\s/.test(t[debut])) debut++;
  while (fin > debut && /\s/.test(t[fin - 1])) fin--;
  return { texte: t.slice(debut, fin).join(""), source: s.slice(debut, fin), position: p.slice(debut, fin) };
}

function famille(nom: string, serif: boolean, mono: boolean): string {
  if (mono || /mono|courier|consolas/i.test(nom)) return '"Courier New", ui-monospace, monospace';
  if (serif || /times|roman|garamond|georgia|cambria|minion|palatino|book|caslon|baskerville|serif/i.test(nom.replace(/sans/i, "")))
    return '"Times New Roman", Times, "Liberation Serif", "Noto Serif", Georgia, serif';
  return 'Arial, Helvetica, "Liberation Sans", Roboto, "Noto Sans", system-ui, sans-serif';
}

/** La couleur la plus fréquente parmi quelques points de la toile. */
function couleurDominante(ctx: CanvasRenderingContext2D, points: [number, number][]): [number, number, number] {
  const compte = new Map<string, { n: number; c: [number, number, number] }>();
  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= ctx.canvas.width || y >= ctx.canvas.height) continue;
    const d = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const c: [number, number, number] = [d[0], d[1], d[2]];
    const cle = c.map((v) => v >> 3).join(",");
    const e = compte.get(cle);
    if (e) e.n++;
    else compte.set(cle, { n: 1, c });
  }
  let mieux: { n: number; c: [number, number, number] } = { n: 0, c: [255, 255, 255] };
  for (const e of compte.values()) if (e.n > mieux.n) mieux = e;
  return mieux.c;
}

const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r} ${g} ${b})`;
const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** L'encre : le point le plus contrasté avec le fond dans une petite zone de texte. */
function couleurEncre(ctx: CanvasRenderingContext2D, r: Rect, ratio: number, fond: [number, number, number]): [number, number, number] {
  const x = Math.max(0, Math.floor(r.x * ratio));
  const y = Math.max(0, Math.floor(r.y * ratio));
  const l = Math.max(1, Math.min(ctx.canvas.width - x, Math.ceil(r.l * ratio)));
  const h = Math.max(1, Math.min(ctx.canvas.height - y, Math.ceil(r.h * ratio)));
  const d = ctx.getImageData(x, y, l, h).data;
  const lf = luminance(fond);
  let mieux: [number, number, number] = lf > 128 ? [20, 20, 20] : [240, 240, 240];
  let ecart = 0;
  for (let k = 0; k < d.length; k += 16) {
    const c: [number, number, number] = [d[k], d[k + 1], d[k + 2]];
    const e = Math.abs(luminance(c) - lf);
    if (e > ecart) {
      ecart = e;
      mieux = c;
    }
  }
  return mieux;
}

type Bloc = {
  cle: string;
  fond: string;
  encre: string;
  x: number;
  y: number;
  l: number;
  h: number;
  police: Police;
  interligne: number;
  alignement: "left" | "center" | "right" | "justify";
  mots: { p: number; i: number; t: string }[];
};

export function PagePdfFidele(p: {
  pdf: PDFDocumentProxy;
  numero: number;
  /** Les phrases du texte de la page (vue « texte seul »), et leurs paragraphes. */
  phrases: Phrase[];
  paragraphes: number[][];
  /** La traduction de chaque phrase, mot à mot (vide tant qu'elle n'est pas arrivée). */
  phrasesTraduites: Phrase[];
  version: "original" | "traduction";
  zoom: number;
  interactive: boolean;
  glose: { phrase: number; mot: number } | null;
  langue: "en" | "fr";
  onMot?: (phrase: number, mot: number, el: HTMLElement) => void;
  /** Un toucher à côté des mots (marge, image) : la carte de traduction se ferme. */
  onRien?: () => void;
  /** La souris passe sur un mot (phrase, mot), ou ne survole plus aucun mot (null). */
  onSurvol?: (phrase: number | null, mot?: number) => void;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const couche = useRef<HTMLDivElement>(null);
  const marqueur = useRef<HTMLSpanElement>(null);
  const [largeurDispo, setLargeurDispo] = useState(0);
  const [geo, setGeo] = useState<Geometrie | null>(null);
  const [erreur, setErreur] = useState(false);

  // La page occupe la largeur disponible (sans dépasser une lecture confortable), multipliée par le zoom.
  useEffect(() => {
    const el = cadre.current?.parentElement;
    if (!el) return;
    let minuteur = 0;
    const mesurer = () => setLargeurDispo(Math.round(el.clientWidth));
    mesurer();
    const obs = new ResizeObserver(() => {
      clearTimeout(minuteur);
      minuteur = window.setTimeout(mesurer, 120);
    });
    obs.observe(el);
    return () => {
      clearTimeout(minuteur);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!largeurDispo || !toile.current || !couche.current) return;
    let annule = false;
    let tache: RenderTask | null = null;
    setErreur(false);
    (async () => {
      try {
        const page = await p.pdf.getPage(p.numero);
        if (annule || !toile.current || !couche.current) return;
        const base = page.getViewport({ scale: 1 });
        const echelle = (Math.min(largeurDispo, 920) / base.width) * p.zoom;
        const vue = page.getViewport({ scale: echelle });
        let ratio = Math.min(window.devicePixelRatio || 1, 2);
        if (vue.width * vue.height * ratio * ratio > MARGE_TOILE) ratio = Math.sqrt(MARGE_TOILE / (vue.width * vue.height));
        // La page se dessine à part, puis remplace l'ancienne d'un coup : aucun blanc pendant un zoom.
        const hors = document.createElement("canvas");
        hors.width = Math.floor(vue.width * ratio);
        hors.height = Math.floor(vue.height * ratio);
        tache = page.render({ canvas: hors, viewport: vue, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
        const [contenu] = await Promise.all([page.getTextContent(), tache.promise]);
        if (annule || !couche.current || !toile.current) return;
        const c = toile.current;
        // Le cadre prend la taille de la page : la couche de texte s'y place au pixel près.
        if (cadre.current) Object.assign(cadre.current.style, { width: `${vue.width}px`, height: `${vue.height}px` });
        c.width = hors.width;
        c.height = hors.height;
        c.style.width = `${vue.width}px`;
        c.style.height = `${vue.height}px`;
        c.getContext("2d")?.drawImage(hors, 0, 0);

        const pdfjs = await chargerPdfjs();
        const zone = couche.current;
        zone.replaceChildren();
        zone.style.setProperty("--scale-factor", String(vue.scale));
        const calque = new pdfjs.TextLayer({ textContentSource: contenu, container: zone, viewport: vue });
        await calque.render();
        if (annule || !cadre.current) return;

        // Les mots de la page et leur place exacte.
        const elements = contenu.items.filter((x): x is ElementTexte => "str" in x);
        const divs = calque.textDivs;
        const { texte, source, position } = texteSitue(elements);
        // Les positions sont prises par rapport à la couche de texte elle-même (posée en haut à gauche du cadre).
        const boite = zone.getBoundingClientRect();
        const polices = new Map<string, Police>();
        const policeDe = (el: ElementTexte): Police => {
          const taille = Math.hypot(el.transform[2], el.transform[3]) * vue.scale;
          const cle = `${el.fontName}:${taille.toFixed(1)}`;
          const connue = polices.get(cle);
          if (connue) return connue;
          const style = contenu.styles[el.fontName];
          let info: { name?: string; bold?: boolean; black?: boolean; italic?: boolean; isSerifFont?: boolean; isMonospace?: boolean } = {};
          try {
            if (page.commonObjs.has(el.fontName)) info = page.commonObjs.get(el.fontName) as typeof info;
          } catch {
            // Police inconnue : on garde la famille générique.
          }
          const nom = info.name ?? "";
          const police: Police = {
            taille,
            famille: famille(nom, info.isSerifFont ?? style?.fontFamily === "serif", info.isMonospace ?? style?.fontFamily === "monospace"),
            graisse: info.black || /black|heavy/i.test(nom) ? 900 : info.bold || /bold|semibold|demi/i.test(nom) ? 700 : 400,
            italique: Boolean(info.italic) || /italic|oblique/i.test(nom),
          };
          polices.set(cle, police);
          return police;
        };

        const ctx = c.getContext("2d");
        let fond: [number, number, number] = [255, 255, 255];
        if (ctx) {
          const pts: [number, number][] = [];
          for (let a = 0.05; a < 1; a += 0.15) pts.push([c.width * a, c.height * 0.02], [c.width * a, c.height * 0.98], [c.width * 0.02, c.height * a], [c.width * 0.98, c.height * a]);
          fond = couleurDominante(ctx, pts);
        }
        // L'encre de chaque élément de texte (un titre rouge reste rouge, le corps reste noir).
        const encres = new Map<number, string>();
        const encreDe = (n: number, r: Rect | undefined) => {
          const connue = encres.get(n);
          if (connue) return connue;
          const e = ctx && r ? rgb(couleurEncre(ctx, r, ratio, couleurDominante(ctx, [[(r.x - 3) * ratio, (r.y - 3) * ratio], [(r.x + r.l + 3) * ratio, (r.y + r.h + 3) * ratio], [(r.x - 3) * ratio, (r.y + r.h + 3) * ratio], [(r.x + r.l + 3) * ratio, (r.y - 3) * ratio]]))) : rgb(luminance(fond) > 128 ? [20, 20, 20] : [240, 240, 240]);
          encres.set(n, e);
          return e;
        };

        const jetons: Jeton[] = [];
        const textes: string[] = [];
        const plage = document.createRange();
        for (const m of texte.matchAll(/\S+/g)) {
          const debut = m.index ?? 0;
          const fin = debut + m[0].length;
          const rects: Rect[] = [];
          let police: Police | null = null;
          let premier = -1;
          // Un mot peut être réparti sur deux éléments (coupure en fin de ligne).
          let k = debut;
          while (k < fin) {
            const n = source[k];
            if (n < 0) {
              k++;
              continue;
            }
            let f = k;
            while (f + 1 < fin && source[f + 1] === n) f++;
            const noeud = divs[n]?.firstChild;
            if (noeud && noeud.nodeType === Node.TEXT_NODE) {
              try {
                plage.setStart(noeud, position[k]);
                plage.setEnd(noeud, position[f] + 1);
                for (const r of Array.from(plage.getClientRects())) {
                  if (r.width > 0 && r.height > 0) rects.push({ x: r.left - boite.left, y: r.top - boite.top, l: r.width, h: r.height });
                }
              } catch {
                // Position hors du texte : le mot reste sans cadre.
              }
            }
            police ??= policeDe(elements[n]);
            if (premier < 0) premier = n;
            k = f + 1;
          }
          jetons.push({
            rects,
            police: police ?? { taille: 12 * vue.scale, famille: famille("", true, false), graisse: 400, italique: false },
            encre: premier >= 0 ? encreDe(premier, rects[0]) : "",
          });
          textes.push(m[0]);
        }

        // Chaque mot de la page retrouve sa place dans les phrases (le même texte qu'à l'import).
        const mots = p.phrases.flatMap((ph) => ph.mots.map((mo, i) => ({ p: ph.id, i, t: mo.t })));
        const versMot = new Map<number, { p: number; i: number }>();
        const depuisMot = new Map<string, number>();
        let j = 0;
        textes.forEach((t, k) => {
          for (let s = j; s < Math.min(mots.length, j + 12); s++) {
            if (mots[s].t === t) {
              versMot.set(k, { p: mots[s].p, i: mots[s].i });
              depuisMot.set(`${mots[s].p}:${mots[s].i}`, k);
              j = s + 1;
              return;
            }
          }
        });

        const encre = jetons.find((x) => x.encre)?.encre ?? rgb([20, 20, 20]);
        setGeo({ largeur: vue.width, hauteur: vue.height, jetons, versMot, depuisMot, fond: rgb(fond), encre, dessin: ctx ? { ctx, ratio } : null });
        page.cleanup();
      } catch (e) {
        if (!annule && (e as { name?: string }).name !== "RenderingCancelledException") setErreur(true);
      }
    })();
    return () => {
      annule = true;
      tache?.cancel();
    };
  }, [p.pdf, p.numero, p.zoom, largeurDispo, p.phrases]);

  // Zoomée au-delà de la colonne, la page se montre par son milieu.
  useEffect(() => {
    const col = cadre.current?.parentElement;
    if (col && col.scrollWidth > col.clientWidth) col.scrollTo({ left: (col.scrollWidth - col.clientWidth) / 2 });
  }, [geo?.largeur]);

  // Version traduite : les paragraphes de la page, découpés en cadres (colonnes, retours à la ligne).
  const blocs = useMemo<Bloc[]>(() => {
    if (!geo || p.version !== "traduction") return [];
    const sortie: Bloc[] = [];
    p.paragraphes.forEach((ids, n) => {
      const situes = ids.flatMap((id) => (p.phrases[id]?.mots ?? []).map((_, i) => geo.depuisMot.get(`${id}:${i}`))).filter((k): k is number => k !== undefined && geo.jetons[k].rects.length > 0);
      if (!situes.length) return;
      // Les lignes, puis les cadres : une ligne qui ne suit pas la précédente ouvre un nouveau cadre.
      type Ligne = { x: number; y: number; d: number; b: number; jetons: number[] };
      const lignes: Ligne[] = [];
      for (const k of situes) {
        const r = geo.jetons[k].rects[0];
        const l = lignes[lignes.length - 1];
        if (l && Math.min(r.y + r.h, l.b) - Math.max(r.y, l.y) > Math.min(r.h, l.b - l.y) * 0.5 && r.x >= l.x - 2) {
          l.x = Math.min(l.x, r.x);
          l.y = Math.min(l.y, r.y);
          l.d = Math.max(l.d, r.x + r.l);
          l.b = Math.max(l.b, r.y + r.h);
          l.jetons.push(k);
        } else lignes.push({ x: r.x, y: r.y, d: r.x + r.l, b: r.y + r.h, jetons: [k] });
      }
      const groupes: Ligne[][] = [];
      for (const l of lignes) {
        const g = groupes[groupes.length - 1];
        const prec = g?.[g.length - 1];
        const hauteur = prec ? prec.b - prec.y : 0;
        if (prec && l.y - prec.b < hauteur * 1.5 && l.y > prec.y + hauteur * 0.3 && Math.min(l.d, prec.d) - Math.max(l.x, prec.x) > 0) g.push(l);
        else groupes.push([l]);
      }
      const traduits = ids.flatMap((id) => (p.phrasesTraduites[id]?.mots ?? []).map((m, i) => ({ p: id, i, t: m.t })));
      if (!traduits.length || ids.some((id) => !(p.phrasesTraduites[id]?.mots.length))) return;
      const poids = groupes.map((g) => g.reduce((s, l) => s + l.jetons.length, 0));
      const total = poids.reduce((a, b) => a + b, 0) || 1;
      const totalSignes = traduits.reduce((s, m) => s + m.t.length + 1, 0);
      let curseur = 0;
      let cumul = 0;
      groupes.forEach((g, gi) => {
        cumul += poids[gi];
        const objectif = gi === groupes.length - 1 ? Infinity : (cumul / total) * totalSignes;
        const mots: Bloc["mots"] = [];
        let signes = traduits.slice(0, curseur).reduce((s, m) => s + m.t.length + 1, 0);
        while (curseur < traduits.length && (signes < objectif || mots.length === 0)) {
          mots.push(traduits[curseur]);
          signes += traduits[curseur].t.length + 1;
          curseur++;
        }
        const x = Math.min(...g.map((l) => l.x));
        const y = Math.min(...g.map((l) => l.y));
        const d = Math.max(...g.map((l) => l.d));
        const b = Math.max(...g.map((l) => l.b));
        const tous = g.flatMap((l) => l.jetons);
        const tailles = tous.map((k) => geo.jetons[k].police.taille).sort((a, z) => a - z);
        const plusFrequent = <T,>(valeurs: T[], cle: (v: T) => string) => {
          const n = new Map<string, { v: T; n: number }>();
          for (const v of valeurs) {
            const e = n.get(cle(v));
            if (e) e.n++;
            else n.set(cle(v), { v, n: 1 });
          }
          return [...n.values()].sort((a, z) => z.n - a.n)[0].v;
        };
        const forme = plusFrequent(
          tous.map((k) => geo.jetons[k].police),
          (x) => `${x.famille}|${x.graisse}|${x.italique}`,
        );
        const police = { ...forme, taille: tailles[Math.floor(tailles.length / 2)] };
        const encre = plusFrequent(
          tous.map((k) => geo.jetons[k].encre).filter(Boolean),
          (x) => x,
        ) ?? geo.encre;
        const pas = g.length > 1 ? (g[g.length - 1].y - g[0].y) / (g.length - 1) : Math.max(police.taille, g[0].b - g[0].y);
        // L'alignement des lignes d'origine : justifié, centré, à droite ou à gauche.
        const pleines = g.length > 1 ? g.slice(0, -1) : g;
        const ecartG = Math.max(...pleines.map((l) => l.x)) - Math.min(...pleines.map((l) => l.x));
        const ecartD = Math.max(...pleines.map((l) => l.d)) - Math.min(...pleines.map((l) => l.d));
        const centres = g.map((l) => (l.x + l.d) / 2);
        const ecartC = Math.max(...centres) - Math.min(...centres);
        const tol = police.taille * 0.6;
        let alignement: Bloc["alignement"] = "left";
        if (g.length > 1 && ecartG < tol && ecartD < tol) alignement = "justify";
        else if (g.length > 1 ? ecartC < tol && ecartG > tol : Math.abs((x + d) / 2 - geo.largeur / 2) < geo.largeur * 0.03 && d - x < geo.largeur * 0.7) alignement = "center";
        else if (g.length > 1 && ecartD < tol && ecartG > tol) alignement = "right";
        let fond = geo.fond;
        if (geo.dessin) {
          const { ctx, ratio } = geo.dessin;
          const m = 4;
          const autour: [number, number][] = [
            [x - m, y - m], [(x + d) / 2, y - m], [d + m, y - m], [d + m, (y + b) / 2],
            [d + m, b + m], [(x + d) / 2, b + m], [x - m, b + m], [x - m, (y + b) / 2],
          ];
          fond = rgb(couleurDominante(ctx, autour.map(([a, z]) => [a * ratio, z * ratio])));
        }
        sortie.push({
          cle: `${n}-${gi}`,
          fond,
          encre,
          x: x - 1.5,
          y: y - 1,
          l: d - x + 3,
          h: b - y + 2,
          police,
          interligne: Math.min(1.6, Math.max(1.0, pas / police.taille)),
          alignement,
          mots,
        });
      });
    });
    return sortie;
  }, [geo, p.version, p.paragraphes, p.phrases, p.phrasesTraduites]);

  // Chaque cadre traduit tient dans la place du texte d'origine : la taille baisse au besoin.
  useLayoutEffect(() => {
    const zone = cadre.current;
    if (!zone || !blocs.length) return;
    const ajuster = () =>
      zone.querySelectorAll<HTMLElement>(".lg-fidele-bloc").forEach((el) => {
        const base = Number(el.dataset.taille);
        let taille = base;
        el.style.height = el.dataset.hauteur ?? "";
        el.style.fontSize = `${taille}px`;
        while (el.scrollHeight > el.clientHeight + 1 && taille > base * 0.55) {
          taille *= 0.95;
          el.style.fontSize = `${taille}px`;
        }
        if (el.scrollHeight > el.clientHeight + 1) el.style.height = "auto";
      });
    ajuster();
    // Une police qui finit de charger change la largeur des lignes : on ajuste à nouveau.
    const polices = document.fonts;
    polices?.addEventListener("loadingdone", ajuster);
    void polices?.ready.then(ajuster);
    // Les règles de césure arrivent parfois un peu après : un dernier ajustement, plus tard.
    const minuteurs = [500, 1500].map((ms) => window.setTimeout(ajuster, ms));
    return () => {
      polices?.removeEventListener("loadingdone", ajuster);
      minuteurs.forEach((m) => window.clearTimeout(m));
    };
  }, [blocs]);

  const surClic = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!p.interactive || !geo) return;
    const s = window.getSelection();
    if (s && !s.isCollapsed) return;
    const traduit = (e.target as HTMLElement).closest<HTMLElement>(".lg-pdf-mot");
    if (traduit) {
      p.onMot?.(Number(traduit.dataset.p), Number(traduit.dataset.i), traduit);
      return;
    }
    if (p.version !== "original" || !cadre.current || !marqueur.current) {
      p.onRien?.();
      return;
    }
    const b = cadre.current.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    const k = geo.jetons.findIndex((j) => j.rects.some((r) => x >= r.x - 2 && x <= r.x + r.l + 2 && y >= r.y - 2 && y <= r.y + r.h + 2));
    const mot = k >= 0 ? geo.versMot.get(k) : undefined;
    if (!mot) {
      p.onRien?.();
      return;
    }
    const r = geo.jetons[k].rects[0];
    Object.assign(marqueur.current.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.l}px`, height: `${r.h}px` });
    p.onMot?.(mot.p, mot.i, marqueur.current);
  };

  const survolEnAttente = useRef(0);
  const surMouvement = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!p.interactive || !p.onSurvol || e.pointerType !== "mouse" || !geo || survolEnAttente.current) return;
    const { clientX, clientY, target } = e;
    survolEnAttente.current = requestAnimationFrame(() => {
      survolEnAttente.current = 0;
      const traduit = (target as HTMLElement).closest?.<HTMLElement>(".lg-pdf-mot");
      if (traduit) return p.onSurvol?.(Number(traduit.dataset.p), Number(traduit.dataset.i));
      if (p.version !== "original" || !cadre.current) return p.onSurvol?.(null);
      const b = cadre.current.getBoundingClientRect();
      const x = clientX - b.left;
      const y = clientY - b.top;
      const k = geo.jetons.findIndex((j) => j.rects.some((r) => x >= r.x && x <= r.x + r.l && y >= r.y && y <= r.y + r.h));
      const mot = k >= 0 ? geo.versMot.get(k) : undefined;
      p.onSurvol?.(mot ? mot.p : null, mot?.i);
    });
  };
  useEffect(() => () => cancelAnimationFrame(survolEnAttente.current), []);

  // La phrase du mot touché se surligne doucement, le mot plus franchement.
  const surlignes = useMemo(() => {
    if (!geo || !p.glose || p.version !== "original") return [];
    const ph = p.phrases[p.glose.phrase];
    if (!ph) return [];
    return ph.mots.flatMap((_, i) => {
      const k = geo.depuisMot.get(`${ph.id}:${i}`);
      return k === undefined ? [] : geo.jetons[k].rects.map((r, n) => ({ ...r, cle: `${i}-${n}`, mot: i === p.glose?.mot }));
    });
  }, [geo, p.glose, p.version, p.phrases]);

  return (
    <div
      ref={cadre}
      className="lg-fidele"
      data-version={p.version}
      style={{ width: geo?.largeur, height: geo?.hauteur, ["--lg-fond-page" as string]: geo?.fond, ["--lg-encre-page" as string]: geo?.encre }}
      onClick={surClic}
      onPointerMove={surMouvement}
      onPointerLeave={() => p.onSurvol?.(null)}
    >
      <canvas ref={toile} className="lg-fidele-toile" aria-hidden="true" />
      <div ref={couche} className="textLayer" lang={p.langue} />
      <div className="lg-fidele-surlignes" aria-hidden="true">
        {surlignes.map((r) => (
          <span key={r.cle} data-mot={r.mot || undefined} style={{ left: r.x, top: r.y, width: r.l, height: r.h }} />
        ))}
        <span ref={marqueur} className="lg-fidele-marqueur" />
      </div>
      {blocs.length > 0 && (
        <div className="lg-fidele-traduction" lang={p.langue === "en" ? "fr" : "en"}>
          {blocs.map((b) => (
            <div
              key={b.cle}
              className="lg-fidele-bloc"
              data-taille={b.police.taille}
              data-hauteur={`${b.h}px`}
              style={{
                left: b.x,
                top: b.y,
                width: b.l,
                height: b.h,
                fontFamily: b.police.famille,
                fontWeight: b.police.graisse,
                fontStyle: b.police.italique ? "italic" : "normal",
                lineHeight: b.interligne,
                textAlign: b.alignement,
                background: b.fond,
                color: b.encre,
                // Le fond déborde un peu du cadre pour couvrir jambages et accents du texte d'origine.
                boxShadow: `0 0 0 ${Math.max(2, b.police.taille * 0.16).toFixed(1)}px ${b.fond}`,
              }}
            >
              {b.mots.map((m) => (
                <span key={`${m.p}-${m.i}`}>
                  <span className="lg-pdf-mot" data-p={m.p} data-i={m.i} aria-pressed={p.glose?.phrase === m.p && p.glose.mot === m.i ? true : undefined}>
                    {m.t}
                  </span>{" "}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {!geo && !erreur && <span className="lg-fidele-attente" aria-hidden="true" />}
      {erreur && <p className="lg-fidele-erreur">Cette page n&apos;a pas pu être dessinée.</p>}
    </div>
  );
}
