"use client";

import { useEffect } from "react";
import { PAYS } from "@/lib/monde/donnees";
import { CAPITALES_LANGUES } from "@/lib/monde/noms-langues";
import type { Langue } from "@/lib/monde/progression";

/*
 * Le Portulan en anglais et en arabe.
 *
 * Le code de l'interface reste écrit en français : la traduction se fait sur la page, à mesure
 * qu'elle s'affiche. Chaque suite de textes voisins (une phrase, même faite de plusieurs morceaux
 * comme « Encore », « 20 », « questions ») est cherchée dans le catalogue : d'abord telle quelle,
 * puis parmi les motifs (« {n} questions sur {n} », « Capitale : {x} »), dont les morceaux variables
 * sont traduits à leur tour (un nom de pays, un continent). Ce qui n'est pas au catalogue reste en
 * français : le récit des fiches, l'histoire de l'Atlas, les noms des cabinets.
 *
 * Quand React change un texte, il écrit du français par-dessus la traduction : l'observateur le
 * voit aussitôt (avant que l'écran ne soit peint) et retraduit. Rien n'est changé dans les
 * composants, et le retour au français rend à chaque texte sa valeur d'origine.
 */

type Cible = Exclude<Langue, "fr">;
type Paire = readonly [en: string, ar: string];
export type Catalogue = { exacts: readonly (readonly [fr: string, en: string, ar: string])[]; motifs: readonly (readonly [fr: string, en: string, ar: string])[] };

const exacts = new Map<string, Paire>();
/** Un motif : son expression, ses morceaux variables, sa traduction, et sa précision (pour essayer les plus précis d'abord). */
type Motif = { re: RegExp; types: ("n" | "x" | "v")[]; trad: Paire; precision: number; libre: boolean; mots: number };
const motifsParMot = new Map<string, Motif[]>();
const motifsLibres: Motif[] = [];
const memo: Record<Cible, Map<string, string | null>> = { en: new Map(), ar: new Map() };
let charge: Promise<void> | null = null;
let langueCourante: Langue = "fr";
const abonnes = new Set<() => void>();

// Les noms des pays et des capitales viennent des données : ils sont là sans attendre le catalogue.
for (const p of PAYS) exacts.set(p.nom, [p.nomEn || p.nom, p.nomAr || p.nomEn || p.nom]);
for (const p of PAYS) {
  const c = CAPITALES_LANGUES[p.code];
  if (p.capitale && c && !exacts.has(p.capitale)) exacts.set(p.capitale, c);
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NOMBRE = "([+\\-−]?\\d[\\d\\s\\u00a0\\u202f.,]*\\d|[+\\-−]?\\d)";
const mots = (s: string) => (s.toLowerCase().match(/[\p{L}’']{2,}/gu) ?? []).map((m) => m.replace(/’/g, "'"));

const ESPACE = "[\\s\\u00a0\\u202f]+";
/** Les morceaux « grammaticaux » : un nom précédé de son article ou de sa préposition, que l'on traduit sans eux. */
const PREFIXES: Record<string, string> = {
  "{d}": `(?:du${ESPACE}|des${ESPACE}|de${ESPACE}la${ESPACE}|de${ESPACE}l['’]|d['’]|de${ESPACE})`,
  "{a}": `(?:au${ESPACE}|aux${ESPACE}|à${ESPACE}la${ESPACE}|à${ESPACE}l['’]|à${ESPACE}|en${ESPACE})`,
  "{l}": `(?:le${ESPACE}|la${ESPACE}|les${ESPACE}|l['’])?`,
};
const MORCEAU = /(\{[nxvdal]\})/;
const MORCEAUX = /\{[nxvdal]\}/g;
/** « trouvé(s) », « manquée(s) » : une terminaison facultative (le pluriel français). */
const FACULTATIF = /\p{L}+\((?:s|e|es|x)\)/gu;

function ajouterMotif(fr: string, en: string, ar: string) {
  const types: Motif["types"] = [];
  let source = "^";
  for (const morceau of fr.split(MORCEAU)) {
    if (morceau === "{n}") {
      types.push("n");
      source += NOMBRE;
    } else if (morceau === "{x}" || morceau === "{v}") {
      types.push(morceau === "{x}" ? "x" : "v");
      source += "(.+?)";
    } else if (morceau in PREFIXES) {
      types.push("x");
      source += `${PREFIXES[morceau]}(.+?)`;
    } else
      source += echapper(morceau)
        .replace(/\\\((s|e|es|x)\\\)/g, "(?:$1)?")
        .replace(/ /g, ESPACE);
  }
  const litteraux = mots(fr.replace(FACULTATIF, " ").replace(MORCEAUX, " "));
  // Les motifs sans morceau libre passent d'abord ; puis les plus longs.
  const precision = fr.replace(MORCEAUX, "").length - 100 * types.filter((t) => t !== "n").length;
  const motif: Motif = { re: new RegExp(`${source}$`, "u"), types, trad: [en, ar], precision, libre: !litteraux.length, mots: litteraux.length };
  if (!litteraux.length) {
    motifsLibres.push(motif);
    motifsLibres.sort((a, b) => b.precision - a.precision);
    return;
  }
  const cle = litteraux.reduce((a, b) => (b.length > a.length ? b : a));
  motifsParMot.set(cle, [...(motifsParMot.get(cle) ?? []), motif]);
}

/** Un nombre écrit à la française (« 1 234,5 ») devient « 1,234.5 » ; une année reste une année. */
function nombre(v: string): string {
  if (!/[\s  ,]/.test(v)) return v.replace("−", "-");
  const n = Number(v.replace(/[\s  ]/g, "").replace(",", ".").replace("−", "-"));
  return Number.isFinite(n) ? new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(n) : v;
}

/** La traduction d'un texte (sans les espaces du bord), ou null s'il n'est pas au catalogue. */
export function traduire(texte: string, l: Langue = langueCourante): string | null {
  if (l === "fr") return null;
  const t = texte.replace(/[\s  ]+/g, " ").trim();
  if (!t || !/\p{L}/u.test(t)) return null;
  const m = memo[l];
  if (m.has(t)) return m.get(t)!;
  const i = l === "en" ? 0 : 1;
  // Pendant le calcul, le texte vaut « pas de traduction » : un motif ne se rappelle pas lui-même.
  m.set(t, null);
  let r: string | null = exacts.get(t)?.[i] ?? null;
  if (r === null) {
    const vus = new Set<Motif>();
    const candidats: Motif[] = [];
    for (const w of new Set(mots(t)))
      for (const x of motifsParMot.get(w) ?? [])
        if (!vus.has(x)) {
          vus.add(x);
          candidats.push(x);
        }
    candidats.sort((a, b) => b.precision - a.precision);
    // Le premier motif dont tous les morceaux se traduisent l'emporte ; à défaut, celui qui en laisse le moins en français.
    // Un morceau qui reste en français doit rester court : un motif fait de ponctuation ne laisse rien en français,
    // un motif d'un seul mot (« En {x} », « {x}, puis {x} ») trois mots au plus, les autres huit : au-delà, le motif
    // serait tombé par hasard sur une phrase du récit, qu'il ne faut pas couper en deux langues.
    let repli: { texte: string; manques: number } | null = null;
    for (const motif of [...candidats, ...motifsLibres]) {
      const res = motif.re.exec(t);
      if (!res) continue;
      let manques = 0;
      let trop = false;
      const limite = motif.libre ? 0 : motif.mots < 2 ? 3 : 8;
      const valeurs = motif.types.map((type, k) => {
        const v = res[k + 1] ?? "";
        if (type === "n") return nombre(v);
        if (type === "v") {
          if (v.split(" ").length > 8) trop = true;
          return v;
        }
        const x = traduire(v, l);
        if (x === null) {
          manques++;
          if (v.split(" ").length > limite) trop = true;
        }
        return x ?? v;
      });
      if (trop) continue;
      const texteTraduit = motif.trad[i].replace(/\{(\d)\}/g, (_, k: string) => valeurs[Number(k) - 1] ?? "");
      if (!manques) {
        r = texteTraduit;
        break;
      }
      if (!repli || manques < repli.manques) repli = { texte: texteTraduit, manques };
    }
    if (r === null && repli) r = repli.texte;
  }
  m.set(t, r);
  return r;
}

/** Un texte dans la langue de l'interface, ou tel quel (pour ce qui ne passe pas par la page : partages, dessins). */
export const enLangue = (texte: string): string => traduire(texte) ?? texte;

/** La langue des dates et des nombres écrits par le Portulan lui-même. */
export const localeDe = (l: Langue): string => (l === "en" ? "en-GB" : l === "ar" ? "ar-u-nu-latn" : "fr-FR");
export const localeInterface = (): string => localeDe(langueCourante);

/** Un nom à écrire sur la carte (pays, capitale, océan) dans la langue de l'interface. */
export const libelle = (fr: string): string => (langueCourante === "fr" ? fr : (exacts.get(fr)?.[langueCourante === "en" ? 0 : 1] ?? fr));
export const langueInterface = () => langueCourante;
/** Prévenu quand la langue change (ou que le catalogue arrive) : le globe redessine ses noms. */
export function surChangementLangue(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/** Le catalogue, chargé à part (il ne pèse que pour qui joue en anglais ou en arabe). */
export function chargerCatalogue(): Promise<void> {
  charge ??= import("./traductions/catalogue")
    .then(({ CATALOGUE }) => {
      for (const [fr, en, ar] of CATALOGUE.exacts) exacts.set(fr, [en, ar]);
      for (const [fr, en, ar] of CATALOGUE.motifs) ajouterMotif(fr, en, ar);
      memo.en.clear();
      memo.ar.clear();
    })
    .catch(() => {
      charge = null;
    });
  return charge;
}

/* =====================================================================
   La traduction de la page
   ===================================================================== */

const ATTRIBUTS = ["aria-label", "title", "placeholder", "alt"] as const;
/** Pour chaque nœud texte touché : son français (celui de React) et ce que la traduction y a mis. */
const originaux = new WeakMap<Text, string>();
const poses = new WeakMap<Text, string>();
const touches = new Set<Text>();
const attrsOriginaux = new WeakMap<Element, Map<string, string>>();
const attrsPoses = new WeakMap<Element, Map<string, string>>();
const elementsTouches = new Set<Element>();

const horsTraduction = (el: Element | null): boolean => !el || !el.closest(".pt") || Boolean(el.closest("script,style,textarea,input,[translate='no'],[contenteditable='true']"));
/** Les attributs d'un champ (son étiquette, son exemple) se traduisent, pas ce qu'on y écrit. */
const attributsHorsTraduction = (el: Element): boolean => !el.closest(".pt") || Boolean(el.closest("script,style,[translate='no'],[contenteditable='true']"));

/** Une suite de nœuds texte voisins, traduite d'un bloc. */
function traiterSuite(noeud: Text, l: Langue) {
  let premier: Node = noeud;
  while (premier.previousSibling && premier.previousSibling.nodeType === Node.TEXT_NODE) premier = premier.previousSibling;
  const suite: Text[] = [];
  for (let n: Node | null = premier; n && n.nodeType === Node.TEXT_NODE; n = n.nextSibling) suite.push(n as Text);
  let fr = "";
  for (const t of suite) {
    const actuel = t.nodeValue ?? "";
    if (poses.has(t) && poses.get(t) === actuel) fr += originaux.get(t) ?? "";
    else {
      originaux.set(t, actuel);
      poses.delete(t);
      fr += actuel;
    }
  }
  const trad = l === "fr" ? null : traduire(fr, l);
  if (trad === null) {
    // Rien à traduire (ou retour au français) : chaque nœud retrouve son texte d'origine.
    for (const t of suite) {
      if (poses.has(t)) {
        const o = originaux.get(t) ?? "";
        if (t.nodeValue !== o) t.nodeValue = o;
        poses.delete(t);
        touches.delete(t);
      }
    }
    return;
  }
  const debut = fr.match(/^[\s ]*/)?.[0] ?? "";
  const fin = fr.match(/[\s ]*$/)?.[0] ?? "";
  suite.forEach((t, i) => {
    const v = i === 0 ? `${debut}${trad}${fin}` : "";
    if (t.nodeValue !== v) t.nodeValue = v;
    poses.set(t, v);
    touches.add(t);
  });
}

function traiterAttributs(el: Element, l: Langue) {
  for (const a of ATTRIBUTS) {
    const v = el.getAttribute(a);
    if (v === null) continue;
    const pose = attrsPoses.get(el)?.get(a);
    let o = attrsOriginaux.get(el);
    if (!o) attrsOriginaux.set(el, (o = new Map()));
    if (pose === undefined || pose !== v) o.set(a, v);
    const fr = o.get(a) ?? v;
    const trad = l === "fr" ? null : traduire(fr, l);
    const voulu = trad ?? fr;
    if (voulu !== v) el.setAttribute(a, voulu);
    let p = attrsPoses.get(el);
    if (!p) attrsPoses.set(el, (p = new Map()));
    p.set(a, voulu);
    elementsTouches.add(el);
  }
}

function parcourir(racine: Node, l: Langue) {
  if (racine.nodeType === Node.TEXT_NODE) {
    if (!horsTraduction((racine as Text).parentElement)) traiterSuite(racine as Text, l);
    return;
  }
  if (!(racine instanceof Element)) return;
  if (horsTraduction(racine) && !racine.querySelector(".pt")) {
    if (!attributsHorsTraduction(racine) && racine.matches(ATTRIBUTS.map((a) => `[${a}]`).join(","))) traiterAttributs(racine, l);
    return;
  }
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const vus = new Set<Node>();
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (vus.has(n) || horsTraduction(n.parentElement)) continue;
    // Chaque suite n'est traitée qu'une fois.
    for (let m: Node | null = n; m && m.nodeType === Node.TEXT_NODE; m = m.nextSibling) vus.add(m);
    traiterSuite(n as Text, l);
  }
  const avecAttributs = racine.matches(ATTRIBUTS.map((a) => `[${a}]`).join(",")) ? [racine] : [];
  for (const el of [...avecAttributs, ...racine.querySelectorAll(ATTRIBUTS.map((a) => `[${a}]`).join(","))]) if (!attributsHorsTraduction(el)) traiterAttributs(el, l);
}

/** Rend à chaque texte et à chaque attribut touchés leur français. */
function toutRendre() {
  for (const t of touches) {
    const o = originaux.get(t);
    if (o !== undefined && t.nodeValue !== o) t.nodeValue = o;
    poses.delete(t);
  }
  touches.clear();
  for (const el of elementsTouches) {
    const o = attrsOriginaux.get(el);
    const p = attrsPoses.get(el);
    if (o && p) for (const [a, v] of o) if (el.getAttribute(a) === p.get(a) && v !== p.get(a)) el.setAttribute(a, v);
    attrsPoses.delete(el);
  }
  elementsTouches.clear();
}

/**
 * Traduit le Portulan affiché (et ce qui s'y ajoute) dans la langue choisie ; pose la langue et
 * le sens d'écriture sur la page ; rend le français en partant.
 */
export function useTraduction(langue: Langue) {
  useEffect(() => {
    langueCourante = langue;
    const racine = document.documentElement;
    if (langue === "fr") {
      abonnes.forEach((f) => f());
      return;
    }
    let vivant = true;
    let observateur: MutationObserver | null = null;
    const avant = { lang: racine.lang, dir: racine.dir, titre: document.title };
    racine.lang = langue;
    racine.dir = langue === "ar" ? "rtl" : "ltr";
    void chargerCatalogue().then(() => {
      if (!vivant) return;
      parcourir(document.body, langue);
      document.title = traduire(avant.titre, langue) ?? avant.titre;
      abonnes.forEach((f) => f());
      observateur = new MutationObserver((changements) => {
        for (const c of changements) {
          if (c.type === "characterData") {
            const t = c.target as Text;
            if (poses.has(t) && poses.get(t) === t.nodeValue) continue;
            if (!horsTraduction(t.parentElement)) traiterSuite(t, langue);
          } else if (c.type === "attributes") {
            const el = c.target as Element;
            if (attrsPoses.get(el)?.get(c.attributeName!) === el.getAttribute(c.attributeName!)) continue;
            if (!attributsHorsTraduction(el)) traiterAttributs(el, langue);
          } else {
            for (const n of c.addedNodes) parcourir(n, langue);
            // Un nœud texte retiré change la suite de ses voisins.
            if (c.removedNodes.length && c.target.nodeType === Node.ELEMENT_NODE) {
              const premier = [...c.target.childNodes].find((x) => x.nodeType === Node.TEXT_NODE);
              if (premier && !horsTraduction(c.target as Element)) traiterSuite(premier as Text, langue);
            }
          }
        }
      });
      observateur.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTS] });
    });
    // Les nœuds partis de la page ne sont plus gardés.
    const menage = setInterval(() => {
      for (const t of touches) if (!t.isConnected) touches.delete(t);
      for (const el of elementsTouches) if (!el.isConnected) elementsTouches.delete(el);
    }, 30_000);
    return () => {
      vivant = false;
      clearInterval(menage);
      observateur?.disconnect();
      toutRendre();
      racine.lang = avant.lang || "fr";
      racine.dir = avant.dir || "ltr";
      document.title = avant.titre;
      langueCourante = "fr";
      abonnes.forEach((f) => f());
    };
  }, [langue]);
}
