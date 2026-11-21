"use client";

import { Check, ChevronRight, Lightbulb, RotateCcw, Timer, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID, vautPour } from "@/lib/corps/catalogue";
import { chargerFiches, recueilPret } from "@/lib/corps/fiches";
import type { CoucheAFiches } from "@/lib/corps/fiches/types";
import { estFonction, FICHES_UTILES, jugerGeste, type Recueils, typesFonction } from "@/lib/corps/fonctions";
import { type Carte, type Certitude, difficulteAdaptee, type Facette, FACETTES } from "@/lib/corps/memoire";
import { DDL } from "@/lib/corps/mouvement/articulations";
import { type Etape, programmeDe } from "@/lib/corps/mouvement/gestes";
import type { Pose } from "@/lib/corps/mouvement/squelette";
import { CATEGORIES, type CategorieId, COEURS, ELEMENTS_APPRIS, EN_PLANCHE, etoilesPour, IDS_CATEGORIES, niveauxDe } from "@/lib/corps/niveaux";
import { battreRecord, carte, carteFacette, type Etat, facettesDues, finirNiveau, noterErreur, noterJournal, noterReponse, profilActuel, reviserFacette, useEcorche } from "@/lib/corps/progression";
import { article, type Contexte, type Difficulte, defiDuJour, FACETTE_DE, METHODES, partieDeNiveau, type Question, questionMelangee, questionSur, structuresDe, TYPES_FONCTION, type TypeQ, typesPossibles } from "@/lib/corps/quiz";
import { jugerNom, type Jugement } from "@/lib/corps/texte";
import { type Couche, REGIONS } from "@/lib/corps/types";
import { hasard } from "@/lib/corps/vec";
import { Curseur } from "./Atelier";
import { Cartel, Coeurs, COUCHES_DEFAUT, Etoiles, TEINTE, miseEnScene, miseEnSceneDe, romain, useCalme } from "./communs";
import type { Stage } from "./Ecorche";
import type { EtatStructure } from "./moteur/Corps3D";
import { dire, ressentir } from "./sons";

export type Lancement =
  | { sorte: "niveau"; categorie: CategorieId; n: number; titre: string; methode: TypeQ | null; revision?: string[]; graine?: number }
  | { sorte: "revision"; ids: string[]; titre: string; graine?: number }
  | { sorte: "defi"; jour: string; titre: string; graine?: number }
  | { sorte: "eclair" | "survie"; categorie: CategorieId; titre: string; graine?: number }
  | { sorte: "entrainement"; ids: string[]; titre: string; methodes?: TypeQ[]; graine?: number }
  /** Une série sur les fonctions (le mouvement, le nerf, le sang, la clinique) dans une catégorie. */
  | { sorte: "fonctions"; categorie: CategorieId; titre: string; methodes?: TypeQ[]; graine?: number }
  /** La révision du jour : les facettes qui s'oublient, toutes couches mêlées. */
  | { sorte: "jour"; titre: string; graine?: number }
  /** L'examen final : quarante questions sur tout le corps, réussi à 80 %. */
  | { sorte: "examen"; titre: string; graine?: number };

type Reponse = { verdict: Jugement; choisi?: string; texte?: string; touche?: string };

const DUREE_ECLAIR = 60;
const NOMBRE_EXAMEN = 40;
export const SEUIL_EXAMEN = 0.8;
const GRANDE = new Map(REGIONS.map((r) => [r.id, r.grande]));
const TOUTES_COUCHES = Object.keys(FICHES_UTILES) as Couche[];

function melanger<T>(r: () => number, l: readonly T[]): T[] {
  const a = l.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Les fiches qu'une partie doit charger avant de poser ses questions (les jeux rapides n'en ont pas besoin). */
function fichesDeLaPartie(l: Lancement): CoucheAFiches[] {
  let couches: Couche[];
  switch (l.sorte) {
    case "niveau":
    case "fonctions":
      couches = CATEGORIES[l.categorie].couches;
      break;
    case "revision":
    case "entrainement":
      couches = l.ids.map((id) => PAR_ID.get(id)?.couche).filter((c): c is Couche => Boolean(c));
      break;
    case "jour":
    case "examen":
      couches = TOUTES_COUCHES;
      break;
    default:
      return [];
  }
  return [...new Set(couches.flatMap((c) => FICHES_UTILES[c]))];
}
function dejaLa(couches: CoucheAFiches[]): Recueils | null {
  const r: Partial<Record<CoucheAFiches, unknown>> = {};
  for (const c of couches) {
    const x = recueilPret(c);
    if (!x) return null;
    r[c] = x;
  }
  return r as Recueils;
}

/** Jamais deux fois de suite la même couche ni la même structure, quand on peut l'éviter (l'entrelacement aide à retenir). */
function entrelacer(l: Question[]): Question[] {
  const reste = l.slice();
  const sortie: Question[] = [];
  while (reste.length) {
    const avant = sortie[sortie.length - 1];
    const couche = avant ? PAR_ID.get(avant.cible)?.couche : undefined;
    let k = reste.findIndex((q) => q.cible !== avant?.cible && PAR_ID.get(q.cible)?.couche !== couche);
    if (k < 0) k = reste.findIndex((q) => q.cible !== avant?.cible);
    if (k < 0) k = 0;
    sortie.push(reste.splice(k, 1)[0]);
  }
  return sortie;
}

/** Une série sur les fonctions : d'abord les structures déjà rencontrées, puis les autres. */
function serieFonctions(l: Extract<Lancement, { sorte: "fonctions" }>, graine: number, nombre: number, ctx: Contexte, etat: Etat): Question[] {
  const r = hasard(graine);
  const permis = l.methodes?.length ? l.methodes : [...TYPES_FONCTION];
  const avec = structuresDe(l.categorie).filter((id) => typesFonction(PAR_ID.get(id)!, ctx.recueils ?? {}).some((t) => permis.includes(t)));
  const vues = melanger(
    r,
    avec.filter((id) => etat.elements[id]),
  );
  const neuves = melanger(
    r,
    avec.filter((id) => !etat.elements[id]),
  );
  const ids = [...vues, ...neuves];
  const sortie: Question[] = [];
  for (let k = 0; sortie.length < nombre && k < Math.min(400, ids.length * 3); k++) {
    const id = ids[k % ids.length];
    const q = questionSur(graine + k * 37, id, permis, ctx, sortie[sortie.length - 1]?.type);
    if (q && estFonction(q.type) && !sortie.some((x) => x.cible === q.cible && x.type === q.type)) sortie.push(q);
  }
  return entrelacer(sortie);
}

/** La révision du jour : les facettes près d'être oubliées ; s'il en reste peu, de nouvelles facettes de structures connues. */
function revisionDuJour(graine: number, nombre: number, ctx: Contexte, etat: Etat): Question[] {
  const r = hasard(graine);
  const dues = facettesDues(etat)
    .sort((a, b) => a.retenue - b.retenue)
    .slice(0, nombre);
  const sortie: Question[] = [];
  dues.forEach((x, i) => {
    const permis = (Object.keys(FACETTE_DE) as TypeQ[]).filter((t) => FACETTE_DE[t] === x.facette);
    const q = questionSur(graine + i * 53, x.id, permis, ctx);
    if (q) sortie.push(q);
  });
  if (sortie.length < nombre) {
    const connues = Object.keys(etat.elements).filter((id) => PAR_ID.has(id) && etat.elements[id][2] >= 2);
    for (const id of melanger(r, connues)) {
      if (sortie.length >= nombre) break;
      const neuves = typesFonction(PAR_ID.get(id)!, ctx.recueils ?? {}).filter((t) => !carte(etat, id, FACETTE_DE[t] ?? "nom"));
      if (!neuves.length || sortie.some((s) => s.cible === id)) continue;
      const q = questionSur(graine + sortie.length * 71, id, neuves, ctx);
      if (q) sortie.push(q);
    }
  }
  return entrelacer(sortie);
}

/** L'examen final : autant de questions dans chaque couche, toutes les méthodes. */
function examenFinal(graine: number, ctx: Contexte): Question[] {
  const r = hasard(graine);
  const cats = IDS_CATEGORIES.filter((c) => c !== "corps");
  const parCat = Math.ceil(NOMBRE_EXAMEN / cats.length);
  const sortie: Question[] = [];
  for (const c of cats) {
    let n = 0;
    for (const id of melanger(r, structuresDe(c)).slice(0, parCat * 4)) {
      if (n >= parCat) break;
      const tous = typesPossibles(PAR_ID.get(id)!, ctx.recueils).filter((t) => t !== "intrus" && t !== "vrai-faux");
      const q = questionSur(graine + sortie.length * 89, id, tous, ctx);
      if (q) {
        sortie.push(q);
        n++;
      }
    }
  }
  return entrelacer(melanger(r, sortie)).slice(0, NOMBRE_EXAMEN);
}

/** Les questions d'avance (niveau, défi, révisions, séries, examen) ; l'éclair et la survie les tirent au fil de l'eau. */
function preparer(l: Lancement, graine: number, difficulte: Difficulte, nombre: number, recueils: Recueils, etat: Etat): Question[] {
  const ctx: Contexte = { difficulte, recueils, adapter: (id, t) => difficulteAdaptee(carte(etat, id, FACETTE_DE[t] ?? "nom"), difficulte) };
  switch (l.sorte) {
    case "niveau":
      return partieDeNiveau({ categorie: l.categorie, n: l.n, graine, nombre, revision: l.revision, difficulte, methode: l.methode, ctx });
    case "defi":
      return defiDuJour(l.jour);
    case "revision":
    case "entrainement": {
      const permis: TypeQ[] = l.sorte === "entrainement" && l.methodes ? l.methodes : ["nommer", "situer", "ecrire", "memo", "latin", "action", "terminaison", "articulation", "provenance", "territoire", "tendon-muscle", ...TYPES_FONCTION];
      const ids = l.ids.filter((id) => PAR_ID.has(id));
      const sortie: Question[] = [];
      const tours = l.sorte === "entrainement" ? Math.max(6, Math.min(12, ids.length * 3)) : ids.length;
      for (let i = 0; i < tours; i++) {
        const q = questionSur(graine + i * 31, ids[i % ids.length], permis, ctx, sortie[sortie.length - 1]?.type);
        if (q) sortie.push(q);
      }
      return sortie;
    }
    case "fonctions":
      return serieFonctions(l, graine, nombre, ctx, etat);
    case "jour":
      return revisionDuJour(graine, Math.max(nombre, 15), ctx, etat);
    case "examen":
      return examenFinal(graine, ctx);
    default:
      return [];
  }
}

/** La typographie française : pas de deux-points ni de point d'interrogation seul en début de ligne. */
const fine = (s: string) => s.replace(/ ([:;?!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");

/** La bonne suite d'une question à remettre dans l'ordre, en noms. */
const nomOption = (q: Question, id: string) => q.options.find((o) => o.id === id)?.texte ?? PAR_ID.get(id)?.nom ?? id;

export function Partie({ lancement, stage, fermer, relancer }: { lancement: Lancement; stage: Stage; fermer: () => void; relancer: (l: Lancement) => void }) {
  const etat = useEcorche();
  const p = etat.profil;
  const calme = useCalme();
  const graine = lancement.graine ?? 1;
  const sansFin = lancement.sorte === "eclair" || lancement.sorte === "survie";
  const pool = useMemo(() => (sansFin ? structuresDe((lancement as { categorie: CategorieId }).categorie) : []), [lancement, sansFin]);
  const difficulteSurvie = (n: number): Difficulte => (n < 8 ? "facile" : n < 20 ? "normal" : "difficile");
  const tirer = (n: number): Question | null => questionMelangee(graine + n * 977, pool, lancement.sorte === "eclair", lancement.sorte === "survie" ? difficulteSurvie(n) : profilActuel().difficulte);

  // Les fiches d'abord (une fois chargées, elles restent en mémoire), puis les questions.
  const aCharger = useMemo(() => fichesDeLaPartie(lancement), [lancement]);
  const [recueils, setRecueils] = useState<Recueils | null>(() => (aCharger.length ? dejaLa(aCharger) : {}));
  useEffect(() => {
    if (recueils) return;
    let vivant = true;
    Promise.all(aCharger.map((c) => chargerFiches(c).then((r) => [c, r] as const))).then(
      (l) => vivant && setRecueils(Object.fromEntries(l) as Recueils),
      // Sans réseau, les questions sur les fonctions s'effacent : la partie se joue avec les autres.
      () => vivant && setRecueils({}),
    );
    return () => {
      vivant = false;
    };
  }, [recueils, aCharger]);
  // Les questions d'une partie se tirent une fois, au départ (l'état de la mémoire bouge pendant qu'on joue).
  const [etatDepart] = useState(etat);
  const preparees = useMemo(() => (sansFin || !recueils ? null : preparer(lancement, graine, profilActuel().difficulte, profilActuel().questions, recueils, etatDepart)), [sansFin, recueils, lancement, graine, etatDepart]);
  const [tirees, setTirees] = useState<Question[]>(() => {
    if (!sansFin) return [];
    const q0 = tirer(0);
    return q0 ? [q0] : [];
  });
  const questions = sansFin ? tirees : (preparees ?? []);

  const [i, setI] = useState(0);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [coeurs, setCoeurs] = useState(COEURS);
  const [bonnes, setBonnes] = useState(0);
  const [fautes, setFautes] = useState(0);
  const [serie, setSerie] = useState(0);
  const [xp, setXp] = useState(0);
  const [manquees, setManquees] = useState<string[]>([]);
  const [fin, setFin] = useState<null | { titre: string; etoiles?: number; record?: boolean; reussi: boolean; sousTitre?: string }>(null);
  const [reste, setReste] = useState(DUREE_ECLAIR);
  const [ecrit, setEcrit] = useState("");
  const [indice, setIndice] = useState(false);
  // Les réponses en plusieurs gestes : l'ordre choisi, la pose des curseurs, l'étape de la suite à toucher.
  const [ordreChoisi, setOrdreChoisi] = useState<string[]>([]);
  const [poseGeste, setPoseGeste] = useState<Pose>({});
  const [etape, setEtape] = useState(0);
  // La certitude déclarée après la réponse (elle règle le prochain retour de la question).
  const [certitude, setCertitude] = useState<Certitude | null>(null);
  const note = useRef<{ id: string; facette: Facette; avant: Carte | undefined; juste: boolean; rapide: boolean } | null>(null);
  const [notable, setNotable] = useState(false);
  // Le bilan par facette (pour l'examen) : justes et posées.
  const [parFacette, setParFacette] = useState<Partial<Record<Facette, [number, number]>>>({});
  const champ = useRef<HTMLInputElement>(null);
  const debut = useRef(0);
  const posee = useRef(0);

  useEffect(() => {
    debut.current = Date.now();
  }, []);

  const q = questions[i] ?? null;
  const total = sansFin ? null : questions.length;
  useEffect(() => {
    posee.current = Date.now();
  }, [q]);

  /* ---------- La scène pour chaque question ---------- */

  const mettreEnScene = useCallback(
    (question: Question, apres: Reponse | null, trouves: number) => {
      const cam = stage.poignee.current;
      cam?.arreter();
      // Les questions de fonction ont leur propre mise en scène : un geste, un chemin, un territoire.
      if (estFonction(question.type)) {
        const cible = PAR_ID.get(question.cible);
        if (!cible) return;
        if (apres) {
          const ids = (question.apres?.montrer ?? [question.cible]).filter((x) => PAR_ID.has(x));
          const etats: Record<string, EtatStructure> = Object.fromEntries(ids.map((x, k) => [x, { teinte: x === question.cible || (k === 0 && !ids.includes(question.cible)) ? TEINTE.juste : TEINTE.voisin, pulse: x === question.cible }]));
          const errone = apres.touche ?? (apres.choisi && PAR_ID.has(apres.choisi) ? apres.choisi : null);
          if (errone && !ids.includes(errone)) etats[errone] = { teinte: TEINTE.faux, pulse: false };
          const scene = miseEnSceneDe(ids);
          const enfoui = ids.some((x) => ["viscere", "encephale"].includes(PAR_ID.get(x)?.couche ?? ""));
          stage.regler({ ...scene, etats, isoler: enfoui ? Object.keys(etats) : null, rotation: false, etiquette: { id: question.cible, texte: cible.nom }, retrait: false, vivant: question.apres?.pouls ? { coeur: true } : null });
          cam?.viser(ids, { marge: ids.length > 2 ? 1.5 : question.apres?.jouer ? 3 : 1.9, cote: question.apres?.jouer ? "g" : undefined });
          const jouer = question.apres?.jouer;
          if (jouer && !calme) cam?.jouer(programmeDe(jouer.muscle, jouer.actions, "g", { toutes: true }));
          return;
        }
        // Pendant la question.
        if (question.geste) {
          const m = question.geste.muscle;
          const scene = miseEnScene(PAR_ID.get(m)!);
          stage.regler({ ...scene, etats: question.geste.contracter ? { [m]: { teinte: TEINTE.laiton, pulse: true } } : {}, isoler: null, rotation: false, etiquette: null, retrait: false });
          cam?.viser([m], { marge: 3.2, cote: "g" });
          const programme: Etape[] = programmeDe(m, [question.geste.action], "g", { toutes: true });
          const sansMuscle = question.geste.contracter ? programme : programme.map((x) => ({ ...x, actifs: {} }));
          // Moins d'animations : le corps prend la pose d'arrivée, immobile.
          if (calme) cam?.poser(programme.reduce<Pose>((a, x) => (Object.keys(x.pose).length ? x.pose : a), {}));
          else cam?.jouer(sansMuscle, { boucle: true });
          return;
        }
        if (question.reponse === "geste") {
          stage.regler({ ...miseEnScene(cible), etats: { [cible.id]: { teinte: TEINTE.laiton, pulse: true } }, isoler: null, rotation: false, etiquette: null, retrait: false });
          cam?.viser([cible.id], { marge: 3.4, cote: "g" });
          return;
        }
        if (question.reponse === "suite" || question.reponse === "ordre") {
          const ids = (question.ordre ?? []).filter((x) => PAR_ID.has(x));
          const etats: Record<string, EtatStructure> = {};
          if (question.reponse === "suite") for (const x of ids.slice(0, trouves)) etats[x] = { teinte: TEINTE.juste, pulse: false };
          if (question.reponse === "ordre" && question.montrer) etats[question.cible] = { teinte: TEINTE.laiton, pulse: true };
          stage.regler({ ...miseEnSceneDe(ids.length ? ids : [question.cible]), etats, isoler: null, rotation: false, etiquette: null, retrait: false });
          if (!trouves) cam?.viser(ids.length ? ids : [question.cible], { marge: 1.25, depuis: ids[ids.length - 1] ?? question.cible });
          return;
        }
        if (question.reponse === "clic") {
          // Toucher sur le corps : sa couche visible, la région cadrée, rien de désigné.
          stage.regler({ ...miseEnScene(cible), etats: {}, isoler: null, rotation: false, etiquette: null, retrait: false });
          const g = GRANDE.get(cible.region);
          cam?.viser(
            ELEMENTS.filter((x) => x.couche === cible.couche && GRANDE.get(x.region) === g).map((x) => x.id),
            { marge: 1.05, depuis: cible.id },
          );
          return;
        }
        stage.regler({ ...(question.montrer ? miseEnScene(cible) : { couches: COUCHES_DEFAUT, calques: {}, profondeur: 0, decouvrir: null }), etats: question.montrer ? { [cible.id]: { teinte: TEINTE.laiton, pulse: true } } : {}, isoler: null, rotation: false, etiquette: null, retrait: false });
        if (question.montrer) cam?.viser([cible.id], { marge: 1.8 });
        else cam?.vue("ensemble");
        return;
      }

      const montre = apres ? (PAR_ID.has(question.attendu) ? question.attendu : question.cible) : question.cible;
      const e = PAR_ID.get(montre) ?? PAR_ID.get(question.cible);
      if (!e) return;
      const structures = cam?.structuresDe(e.id) ?? [];
      const { couches, calques, profondeur, decouvrir } = miseEnScene(e);
      // Un organe ou un noyau du cerveau peut être caché par ses voisins : on le montre seul, le reste en transparence.
      const enfoui = e.couche === "viscere" || e.couche === "encephale";
      const etats: Record<string, EtatStructure> = {};
      if (!apres) {
        if (question.montrer) etats[question.cible] = { teinte: TEINTE.laiton, pulse: true };
      } else {
        if (question.montrer && question.cible !== montre) etats[question.cible] = { teinte: TEINTE.voisin, pulse: false };
        etats[montre] = { teinte: apres.verdict === "faux" ? TEINTE.faux : TEINTE.juste, pulse: apres.verdict !== "faux" };
        if (apres.verdict === "faux") etats[montre] = { teinte: TEINTE.juste, pulse: true };
        const errone = apres.touche ?? (apres.choisi && PAR_ID.has(apres.choisi) ? apres.choisi : null);
        if (errone && errone !== montre) etats[errone] = { teinte: TEINTE.faux, pulse: false };
      }
      const voirTout = !question.montrer && !apres && question.reponse === "clic";
      stage.regler({
        couches: voirTout || question.montrer || apres ? couches : COUCHES_DEFAUT,
        calques: voirTout || question.montrer || apres ? calques : {},
        profondeur: voirTout || question.montrer || apres ? profondeur : 0,
        decouvrir: voirTout || question.montrer || apres ? decouvrir : null,
        etats,
        isoler: enfoui && (question.montrer || apres) ? Object.keys(etats) : null,
        rotation: false,
        etiquette: apres ? { id: montre, texte: PAR_ID.get(montre)?.nom ?? "" } : null,
        retrait: false,
      });
      if (!cam) return;
      if (apres || question.montrer) cam.viser([montre], { marge: apres ? 1.9 : 1.6 });
      else if (question.reponse === "clic") {
        // Chercher sur le corps : la grande région, sans désigner la structure.
        const g = GRANDE.get(e.region);
        const voisins = (EN_PLANCHE.has(e.id) ? ELEMENTS_APPRIS : ELEMENTS).filter((x) => x.couche === e.couche && GRANDE.get(x.region) === g).map((x) => x.id);
        const cote = structures.length && structures.every((s) => s.cote === "d") ? "d" : "g";
        cam.viser(voisins, { marge: 1.05, cote, depuis: e.id });
      } else cam.vue("ensemble");
    },
    [stage, calme],
  );

  useEffect(() => {
    if (q && !fin) mettreEnScene(q, reponse, etape);
  }, [q, reponse, fin, etape, mettreEnScene]);

  // Fais le geste : le corps suit les curseurs.
  useEffect(() => {
    if (q?.reponse === "geste" && !reponse) stage.poignee.current?.poser(poseGeste);
  }, [q, reponse, poseGeste, stage]);
  // En quittant la partie : plus d'animation, la position anatomique.
  useEffect(
    () => () => {
      stage.poignee.current?.arreter();
      stage.poignee.current?.poser({});
    },
    [stage],
  );

  useEffect(() => {
    if (q?.reponse === "ecrit" && !reponse) champ.current?.focus();
  }, [q, reponse]);

  // Le verdict se lit d'abord (sur téléphone, le panneau défile jusqu'à lui) ; « Continuer » reçoit le focus sans faire défiler.
  const verdictTitre = useRef<HTMLParagraphElement>(null);
  const continuer = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!reponse) return;
    continuer.current?.focus({ preventScroll: true });
    verdictTitre.current?.scrollIntoView({ block: "nearest", behavior: calme ? "auto" : "smooth" });
  }, [reponse, calme]);

  /* ---------- Répondre ---------- */

  const repondre = useCallback(
    (r: Reponse) => {
      if (!q || reponse || fin) return;
      setReponse(r);
      const juste = r.verdict !== "faux";
      const base = q.reponse === "qcm" ? (q.options.length === 2 ? 6 : 10) : 15;
      const gain = juste ? Math.round(base * (r.verdict === "presque" ? 0.7 : 1)) + Math.min(10, serie * 2) : 0;
      const sujet = q.type === "intrus" || q.type === "vrai-faux" ? "" : q.cible;
      const facette = q.facette ?? FACETTE_DE[q.type] ?? "nom";
      const duree = Date.now() - posee.current;
      const rapide = duree < (q.reponse === "qcm" ? 5000 : 9000);
      // La carte d'avant la réponse : si l'on dit ensuite qu'on hésitait, la note se refait depuis elle.
      note.current = sujet ? { id: sujet, facette, avant: carteFacette(sujet, facette), juste, rapide } : null;
      setNotable(Boolean(sujet));
      noterReponse(sujet, juste, gain, { facette, rapide });
      setParFacette((m) => {
        const [j, n] = m[facette] ?? [0, 0];
        return { ...m, [facette]: [j + (juste ? 1 : 0), n + 1] };
      });
      if (juste) {
        setBonnes((b) => b + 1);
        setSerie((s) => s + 1);
        setXp((x) => x + gain);
        ressentir(r.verdict === "presque" ? "presque" : "juste");
      } else {
        setFautes((f) => f + 1);
        setSerie(0);
        setManquees((m) => (m.includes(q.cible) ? m : [...m, q.cible]));
        const confondu = r.touche ?? (r.choisi && PAR_ID.has(r.choisi) ? r.choisi : undefined);
        noterErreur(q.type, q.attendu, r.texte ?? r.choisi ?? r.touche ?? "", confondu);
        if (lancement.sorte === "niveau" || lancement.sorte === "survie") setCoeurs((c) => c - 1);
        ressentir("faux");
      }
      const bon = PAR_ID.get(q.attendu) ?? (estFonction(q.type) ? PAR_ID.get(q.cible) : undefined);
      if (bon) dire(bon.nom);
    },
    [q, reponse, fin, serie, lancement.sorte],
  );

  const declarer = (c: Certitude) => {
    setCertitude(c);
    const n = note.current;
    if (n) reviserFacette(n.id, n.facette, n.avant, n.juste, c, n.rapide);
  };

  // Toucher le corps : pour « situer », c'est la réponse ; pour « reconstruis », chaque pièce à son tour.
  useEffect(() => {
    stage.surChoix((s) => {
      if (!q || reponse || fin || !s) return;
      if (q.reponse === "clic") {
        const juste = vautPour(s.element, q.attendu);
        repondre({ verdict: juste ? "juste" : "faux", touche: juste ? undefined : s.element, texte: PAR_ID.get(s.element)?.nom });
      } else if (q.reponse === "suite") {
        const l = q.ordre ?? [];
        if (l.slice(0, etape).some((x) => vautPour(s.element, x))) return; // une pièce déjà posée
        if (vautPour(s.element, l[etape])) {
          if (etape + 1 >= l.length) repondre({ verdict: "juste" });
          else {
            setEtape(etape + 1);
            ressentir("presque");
          }
        } else repondre({ verdict: "faux", touche: s.element, texte: PAR_ID.get(s.element)?.nom });
      }
    });
    return () => stage.surChoix(null);
  }, [stage, q, reponse, fin, repondre, etape]);

  // Remettre dans l'ordre : la réponse part quand tout est placé.
  const placer = (id: string) => {
    if (!q || reponse || ordreChoisi.includes(id)) return;
    const l = [...ordreChoisi, id];
    setOrdreChoisi(l);
    if (l.length === q.options.length) repondre({ verdict: l.join(">") === q.attendu ? "juste" : "faux", texte: l.map((x) => nomOption(q, x)).join(" → ") });
  };

  /* ---------- La suite, la fin ---------- */

  const terminer = useCallback(
    (raison: "fini" | "coeurs" | "temps") => {
      stage.poignee.current?.arreter();
      stage.poignee.current?.poser({});
      if (lancement.sorte === "niveau") {
        const reussi = raison === "fini" && coeurs > 0;
        const nb = etoilesPour(fautes);
        const bilan = finirNiveau(lancement.categorie, lancement.n, { bonnes, fautes, reussi, etoiles: reussi ? Math.max(1, nb) : 0 });
        setXp((x) => x + bilan.xp);
        setFin({ titre: reussi ? (bilan.premiereFois ? "Planche réussie" : "Planche refaite") : "Encore un effort", etoiles: reussi ? Math.max(1, nb) : 0, record: bilan.record, reussi });
        ressentir(reussi ? "niveau" : "echec");
        noterJournal({ s: "niveau", n: lancement.titre, b: bonnes, q: questions.length, x: xp + bilan.xp, e: reussi ? Math.max(1, nb) : 0 });
      } else if (lancement.sorte === "eclair" || lancement.sorte === "survie") {
        const cle = lancement.categorie === "corps" ? lancement.sorte : `${lancement.sorte}:${lancement.categorie}`;
        const record = battreRecord(cle, bonnes);
        setFin({ titre: lancement.sorte === "eclair" ? `${bonnes} en une minute` : `${bonnes} bonnes réponses`, record, reussi: true });
        ressentir(record ? "record" : "niveau");
        noterJournal({ s: lancement.sorte, n: lancement.titre, b: bonnes, q: null, x: xp, e: undefined });
      } else if (lancement.sorte === "examen") {
        const part = questions.length ? bonnes / questions.length : 0;
        const pour = Math.round(part * 100);
        const reussi = part >= SEUIL_EXAMEN;
        const record = battreRecord("examen", pour);
        setFin({ titre: reussi ? `Examen réussi : ${pour} %` : `${pour} % : pas encore`, sousTitre: reussi ? "Le corps n'a plus beaucoup de secrets pour toi." : `Il faut ${Math.round(SEUIL_EXAMEN * 100)} % pour réussir. Les facettes à travailler sont en tête.`, record, reussi });
        ressentir(reussi ? "record" : "echec");
        noterJournal({ s: "examen", n: lancement.titre, b: bonnes, q: questions.length, x: xp });
      } else {
        if (lancement.sorte === "defi") battreRecord(`defi:${lancement.jour}`, Math.max(1, bonnes));
        setFin({ titre: lancement.sorte === "defi" ? `Défi : ${bonnes}/${questions.length}` : `${bonnes}/${questions.length} justes`, reussi: true });
        ressentir("niveau");
        noterJournal({ s: lancement.sorte, n: lancement.titre, b: bonnes, q: questions.length, x: xp });
      }
      stage.regler({ etats: Object.fromEntries(manquees.map((id) => [id, { teinte: TEINTE.faux, pulse: false }])), etiquette: null });
      if (manquees.length) stage.poignee.current?.viser(manquees, { marge: 1.3 });
      else stage.poignee.current?.vue("ensemble");
    },
    [lancement, coeurs, fautes, bonnes, questions.length, xp, manquees, stage],
  );

  const suivante = useCallback(() => {
    if (fin) return;
    if ((lancement.sorte === "niveau" || lancement.sorte === "survie") && coeurs <= 0) return terminer("coeurs");
    if (!sansFin && i + 1 >= questions.length) return terminer("fini");
    if (sansFin && questions.length <= i + 1) {
      const suite = tirer(i + 1);
      if (suite) setTirees((l) => [...l, suite]);
    }
    setReponse(null);
    setEcrit("");
    setIndice(false);
    setOrdreChoisi([]);
    setPoseGeste({});
    setEtape(0);
    setCertitude(null);
    setNotable(false);
    note.current = null;
    setI((x) => x + 1);
    // tirer() ne lit que la graine, le lancement et le réservoir : stables le temps d'une partie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fin, lancement.sorte, coeurs, sansFin, i, questions.length, terminer]);

  // L'éclair : une minute, et la question suivante vient seule.
  const terminerRef = useRef(terminer);
  useEffect(() => {
    terminerRef.current = terminer;
  });
  useEffect(() => {
    if (lancement.sorte !== "eclair" || fin) return;
    const limite = Date.now() + DUREE_ECLAIR * 1000;
    const id = setInterval(() => {
      const r = Math.ceil((limite - Date.now()) / 1000);
      setReste(r);
      if (r <= 0) {
        clearInterval(id);
        terminerRef.current("temps");
      }
    }, 250);
    return () => clearInterval(id);
  }, [lancement.sorte, fin]);
  useEffect(() => {
    if (!reponse || fin || lancement.sorte !== "eclair") return;
    const id = setTimeout(suivante, reponse.verdict === "faux" ? 1100 : 550);
    return () => clearTimeout(id);
  }, [reponse, fin, lancement.sorte, suivante]);

  // Le clavier : 1 à 4 pour choisir (ou placer dans l'ordre), Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement && ev.key !== "Enter") return;
      if (ev.key === "Escape") return fermer();
      if (fin) return;
      if (reponse && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        return suivante();
      }
      const n = Number(ev.key);
      if (!reponse && q && n >= 1 && n <= q.options.length) {
        const o = q.options[n - 1];
        if (q.reponse === "qcm") repondre({ verdict: o.id === q.attendu ? "juste" : "faux", choisi: o.id, texte: o.texte });
        else if (q.reponse === "ordre") placer(o.id);
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  });

  /* ---------- L'affichage ---------- */

  if (fin) return <Bilan lancement={lancement} fin={fin} bonnes={bonnes} total={total} xp={xp} manquees={manquees} parFacette={parFacette} fermer={fermer} relancer={relancer} stage={stage} />;
  if (!q)
    return (
      <div className="ec-partie">
        <p className="ec-note">{!sansFin && !preparees ? "Préparation des questions…" : "Pas de question à poser ici pour l'instant."}</p>
        {!sansFin && preparees && (
          <button type="button" className="ec-bouton" onClick={fermer}>
            Retour
          </button>
        )}
      </div>
    );

  const fonction = estFonction(q.type);
  const bon = PAR_ID.get(q.attendu) ?? (fonction ? PAR_ID.get(q.cible) : undefined);
  const sujet = PAR_ID.get(q.cible);
  const curseurs = (q.curseurs ?? []).map((id) => DDL.find((d) => d.id === id)).filter((d): d is (typeof DDL)[number] => Boolean(d));
  return (
    <div className="ec-partie" data-type={q.type}>
      <header className="ec-partie-tete">
        <button type="button" className="ec-icone" onClick={fermer} aria-label="Quitter la partie">
          <X size={18} aria-hidden="true" />
        </button>
        <span className="ec-partie-titre">{lancement.titre}</span>
        {lancement.sorte === "eclair" ? (
          <span className="ec-chrono" aria-label={`${reste} secondes`}>
            <Timer size={15} aria-hidden="true" /> {Math.max(0, reste)}
          </span>
        ) : lancement.sorte === "niveau" || lancement.sorte === "survie" ? (
          <Coeurs n={coeurs} />
        ) : null}
      </header>
      {total !== null && (
        <span className="ec-progression" aria-label={`Question ${i + 1} sur ${total}`}>
          <span style={{ transform: `scaleX(${(i + (reponse ? 1 : 0)) / total})` }} />
        </span>
      )}
      <p className="ec-methode">
        {METHODES[q.type].nom}
        {serie >= 3 && <span className="ec-combo">série de {serie}</span>}
        {sansFin && <span className="ec-score">{bonnes} juste{bonnes > 1 ? "s" : ""}</span>}
      </p>
      <h2 className="ec-consigne">{fine(q.consigne)}</h2>
      {q.indice && (
        <p className={`ec-indice ${q.type === "latin" ? "est-latin" : ""}`} lang={q.type === "latin" ? "la" : q.type === "anglais" ? "en" : undefined}>
          {fine(q.indice)}
        </p>
      )}
      {q.geste && calme && !reponse && <p className="ec-note">Ton appareil demande moins d’animations : le corps montre la position d’arrivée du geste.</p>}

      {q.reponse === "qcm" && (
        <div className={`ec-options ${q.options.length === 2 ? "est-binaire" : ""}`} role="group" aria-label="Les réponses">
          {q.options.map((o, k) => {
            const etatO = reponse ? (o.id === q.attendu ? "juste" : o.id === reponse.choisi ? "faux" : "neutre") : undefined;
            return (
              <button
                key={o.id}
                type="button"
                className={`ec-option ${o.latin ? "est-latin" : ""}`}
                data-etat={etatO}
                disabled={Boolean(reponse)}
                onClick={() => repondre({ verdict: o.id === q.attendu ? "juste" : "faux", choisi: o.id, texte: o.texte })}
              >
                <kbd aria-hidden="true">{k + 1}</kbd>
                <span lang={o.latin ? "la" : undefined}>{o.texte}</span>
                {etatO === "juste" && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {q.reponse === "ordre" && (
        <div className="ec-ordre">
          <ol className="ec-ordre-choisi" aria-label="Ton ordre">
            {(reponse ? (q.ordre ?? []) : ordreChoisi).map((id, k) => (
              <li key={id} data-etat={reponse ? (ordreChoisi[k] === id ? "juste" : "faux") : undefined}>
                <span className="ec-ordre-rang">{k + 1}</span> {nomOption(q, id)}
              </li>
            ))}
            {!reponse &&
              q.options.slice(ordreChoisi.length).map((o) => (
                <li key={`vide-${o.id}`} className="est-vide" aria-hidden="true">
                  <span className="ec-ordre-rang">·</span>
                </li>
              ))}
          </ol>
          {!reponse && (
            <>
              <div className="ec-options" role="group" aria-label="Les choix, à placer dans l'ordre">
                {q.options.map((o, k) => (
                  <button key={o.id} type="button" className="ec-option" disabled={ordreChoisi.includes(o.id)} onClick={() => placer(o.id)}>
                    <kbd aria-hidden="true">{k + 1}</kbd>
                    <span>{o.texte}</span>
                  </button>
                ))}
              </div>
              <div className="ec-boutons">
                <button type="button" className="ec-bouton est-discret" disabled={!ordreChoisi.length} onClick={() => setOrdreChoisi((l) => l.slice(0, -1))}>
                  <Undo2 size={14} aria-hidden="true" /> Retirer le dernier
                </button>
                <button type="button" className="ec-bouton est-discret" onClick={() => repondre({ verdict: "faux", texte: "" })}>
                  Je ne sais pas
                </button>
              </div>
            </>
          )}
          {reponse && reponse.verdict === "faux" && ordreChoisi.length > 0 && <p className="ec-note">Ton ordre : {ordreChoisi.map((x) => nomOption(q, x)).join(" → ")}.</p>}
        </div>
      )}

      {q.reponse === "geste" && !reponse && (
        <div className="ec-geste">
          {curseurs.map((d) => (
            <Curseur
              key={d.id}
              ddl={[d]}
              valeur={poseGeste[d.lateral ? `${d.id}:g` : d.id] ?? 0}
              articulation={d.articulation}
              changer={(v) =>
                setPoseGeste((po) => {
                  const k = d.lateral ? `${d.id}:g` : d.id;
                  const suite = { ...po };
                  if (v) suite[k] = v;
                  else delete suite[k];
                  return suite;
                })
              }
            />
          ))}
          <div className="ec-boutons">
            <button type="button" className="ec-bouton est-plein" disabled={!Object.keys(poseGeste).length} onClick={() => repondre({ verdict: jugerGeste(q.attendu, poseGeste) ? "juste" : "faux", texte: "geste" })}>
              Valider le geste
            </button>
            <button type="button" className="ec-bouton est-discret" onClick={() => repondre({ verdict: "faux", texte: "" })}>
              Je ne sais pas
            </button>
          </div>
        </div>
      )}

      {q.reponse === "ecrit" && !reponse && (
        <form
          className="ec-ecrire"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!bon || !ecrit.trim()) return;
            repondre({ verdict: jugerNom(bon, ecrit), texte: ecrit });
          }}
        >
          <input ref={champ} value={ecrit} onChange={(ev) => setEcrit(ev.target.value)} placeholder="Le nom de la structure" aria-label="Le nom de la structure" autoComplete="off" autoCapitalize="none" spellCheck={false} />
          <button type="submit" className="ec-bouton est-plein">
            Valider
          </button>
          <button type="button" className="ec-bouton est-discret" onClick={() => repondre({ verdict: "faux", texte: "" })}>
            Je ne sais pas
          </button>
          {bon && (
            <button type="button" className="ec-bouton est-discret" onClick={() => setIndice(true)} disabled={indice}>
              <Lightbulb size={14} aria-hidden="true" /> {indice ? `Commence par « ${bon.nom.slice(0, 3)}… »` : "Un indice"}
            </button>
          )}
        </form>
      )}

      {(q.reponse === "clic" || q.reponse === "suite") && !reponse && (
        <div className="ec-situer">
          <p className="ec-note">{q.reponse === "suite" ? `${etape} pièce${etape > 1 ? "s" : ""} sur ${(q.ordre ?? []).length} : touche maintenant ${PAR_ID.get((q.ordre ?? [])[etape]) ? article(PAR_ID.get((q.ordre ?? [])[etape])!) : "la suivante"}.` : "Fais tourner le corps, rapproche-toi, puis touche la bonne structure."}</p>
          <button type="button" className="ec-bouton est-discret" onClick={() => repondre({ verdict: "faux", texte: "" })}>
            Je ne sais pas
          </button>
        </div>
      )}

      {reponse && (
        <div className="ec-verdict" data-verdict={reponse.verdict}>
          <p className="ec-verdict-titre" ref={verdictTitre}>
            {reponse.verdict === "juste" ? "Juste." : reponse.verdict === "presque" ? "Presque : c'est bien cela, à une lettre près." : (q.reponse === "clic" || q.reponse === "suite") && reponse.touche && PAR_ID.has(reponse.touche) ? `Non : tu as touché ${article(PAR_ID.get(reponse.touche)!)}.` : "Non."}
          </p>
          {q.explication && <p className="ec-explication">{fine(q.explication)}</p>}
          {lancement.sorte !== "eclair" && notable && (
            <div className="ec-certitude" role="radiogroup" aria-label="Tu étais">
              <span>Tu étais :</span>
              {(
                [
                  ["sur", "Sûr de toi"],
                  ["hesitant", "Hésitant"],
                  ["hasard", "Au hasard"],
                ] as const
              ).map(([v, n]) => (
                <button key={v} type="button" role="radio" aria-checked={certitude === v} className="ec-puce" onClick={() => declarer(v)}>
                  {n}
                </button>
              ))}
            </div>
          )}
          {certitude === "sur" && reponse.verdict === "faux" && <p className="ec-note">Sûr de toi, et pourtant non : c’est l’erreur qu’on retient le mieux une fois corrigée. Elle reviendra demain.</p>}
          {bon && <Cartel e={bon} complet={lancement.sorte !== "eclair"} latin={p.latin} />}
          {sujet && bon && sujet.id !== bon.id && q.type !== "intrus" && <p className="ec-note">La question portait sur : {sujet.nom}.</p>}
          {lancement.sorte !== "eclair" && (
            <button type="button" className="ec-bouton est-plein est-grand ec-continuer" onClick={suivante} ref={continuer}>
              Continuer <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- le bilan */

function Bilan({
  lancement,
  fin,
  bonnes,
  total,
  xp,
  manquees,
  parFacette,
  fermer,
  relancer,
  stage,
}: {
  lancement: Lancement;
  fin: { titre: string; etoiles?: number; record?: boolean; reussi: boolean; sousTitre?: string };
  bonnes: number;
  total: number | null;
  xp: number;
  manquees: string[];
  parFacette: Partial<Record<Facette, [number, number]>>;
  fermer: () => void;
  relancer: (l: Lancement) => void;
  stage: Stage;
}) {
  const suivant =
    lancement.sorte === "niveau" && fin.reussi && lancement.n < niveauxDe(lancement.categorie).length
      ? ({ ...lancement, n: lancement.n + 1, titre: `${CATEGORIES[lancement.categorie].nom} · Planche ${romain(lancement.n + 1)}`, methode: null, revision: [] } as Lancement)
      : null;
  // Les facettes de l'examen, de la moins réussie à la mieux sue.
  const facettes = FACETTES.filter((f) => parFacette[f.id]).sort((a, b) => {
    const [ja, na] = parFacette[a.id]!;
    const [jb, nb] = parFacette[b.id]!;
    return ja / na - jb / nb;
  });
  return (
    <div className="ec-bilan">
      <p className="ec-methode">{lancement.titre}</p>
      <h2 className="ec-bilan-titre">{fin.titre}</h2>
      {fin.sousTitre && <p className="ec-note">{fin.sousTitre}</p>}
      {fin.etoiles !== undefined && fin.reussi && <Etoiles n={fin.etoiles} taille={28} />}
      {fin.record && <p className="ec-pastille est-or">Nouveau record</p>}
      <dl className="ec-bilan-chiffres">
        <div>
          <dt>Bonnes réponses</dt>
          <dd>{total ? `${bonnes}/${total}` : bonnes}</dd>
        </div>
        <div>
          <dt>Expérience</dt>
          <dd>+{xp} XP</dd>
        </div>
      </dl>
      {lancement.sorte === "examen" && facettes.length > 0 && (
        <section>
          <h3 className="ec-section-titre">Par facette</h3>
          <ul className="ec-facettes">
            {facettes.map((f) => {
              const [j, n] = parFacette[f.id]!;
              return (
                <li key={f.id}>
                  <span className="ec-facette-nom">{f.nom}</span>
                  <span className="ec-jauge fine" aria-hidden="true">
                    <span style={{ transform: `scaleX(${j / n})` }} />
                  </span>
                  <span className="ec-facette-chiffre">
                    {j}/{n}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {manquees.length > 0 && (
        <section>
          <h3 className="ec-section-titre">À revoir</h3>
          <ul className="ec-manquees">
            {manquees.map((id) => (
              <li key={id}>
                <button type="button" className="ec-lien" onClick={() => stage.poignee.current?.viser([id], { marge: 1.8 })}>
                  {PAR_ID.get(id)?.nom}
                </button>
              </li>
            ))}
          </ul>
          <p className="ec-note">Elles reviendront dans tes révisions, au bon moment.</p>
        </section>
      )}
      <div className="ec-boutons">
        {suivant && (
          <button type="button" className="ec-bouton est-plein est-grand" onClick={() => relancer(suivant)}>
            Planche suivante <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
        {manquees.length > 0 && (
          <button type="button" className="ec-bouton" onClick={() => relancer({ sorte: "entrainement", ids: manquees, titre: "Revoir mes erreurs" })}>
            Revoir mes erreurs
          </button>
        )}
        <button type="button" className="ec-bouton" onClick={() => relancer({ ...lancement, graine: (lancement.graine ?? 1) + 1 })}>
          <RotateCcw size={15} aria-hidden="true" /> Rejouer
        </button>
        <button type="button" className="ec-bouton est-discret" onClick={fermer}>
          Retour
        </button>
      </div>
    </div>
  );
}
