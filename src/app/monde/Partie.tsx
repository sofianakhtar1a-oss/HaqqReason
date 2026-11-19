"use client";

import { ArrowRight, Check, Flame, Hourglass, Lightbulb, LocateFixed, Minus, Plus, Printer, RotateCcw, Share2, Shuffle, SkipForward, Snowflake, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat, pluieDeLettres } from "@/lib/langues/feux";
import { jouer, ressentir } from "./sons";
import { BoutonConcentration } from "./Reglages";
import { enLangue, localeDe, traduire } from "./traduction";
import { formatPopulation, formatSuperficie, motCapitale, NOM_CONTINENT, PAR_CODE, pays } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, TYPES, type TypeQuestion, typesDe } from "@/lib/monde/categories";
import { compteMonde, envoyerReponse } from "@/lib/monde/compte-client";
import { deriver, hasard, melanger, nouvelleGraine } from "@/lib/monde/hasard";
import { COEURS, grade, NB_NIVEAUX, ordreDe } from "@/lib/monde/niveaux";
import { baseDe, gainDe, type Joker, JOKERS } from "@/lib/monde/points";
import { useRecits } from "@/lib/monde/recits-client";
import { aReviserAvant, battreRecord, battreRecordDe, type Bilan, depenser, ducats, erreursRecentes, finirNiveau, gagnerDucats, noterErreur, noterJournal, noterReponse, oublierPartie, partieSauvee, profilActuel, revisionsDues, sauverPartie, useMonde } from "@/lib/monde/progression";
import { categorieDe, consigne, fabriquer, juger, partieDeNiveau, type Question, questionMelangee, questionSur } from "@/lib/monde/quiz";
import type { Jugement } from "@/lib/monde/texte";
import type { CabinetId, ContinentId, MethodeCabinet } from "@/lib/monde/types";
import { cleDefi, DUREE_DEFI, questionsDefi, type SorteDefi, texteAPartager } from "@/lib/monde/defis";
import { PAYS } from "@/lib/monde/donnees";
import { indiceDe, mention, piegeEntre, PIEGES_CAPITALES, paysDuTheme, QUESTIONS_EXAMEN, THEMES, type ThemeId } from "@/lib/monde/apprendre";
import { dire, taire } from "@/lib/monde/voix";
import { BoutonVoix, Chrono, Coeurs, Ducats, Etoiles } from "./communs";
import { Drapeau, MiniContinent, Silhouette } from "./figures";
import { bonneReponseAutre, Classement, Coloriage, ContenuOptionAutre, gereInvite, InviteAutre, presqueAutre, Puzzle } from "./formes";
import { Globe, type GlobeRef, type Teinte } from "./Globe";

/*
 * Une partie, en plein écran : une question à la fois, trois cœurs, un chrono qui se vide,
 * des jokers à quelques ducats. Cinq sortes de parties :
 *   • niveau   : les 20 questions d'un niveau d'une catégorie ;
 *   • tour     : le tour du monde, 20 questions de toutes les catégories ;
 *   • eclair   : 60 secondes, le plus de bonnes réponses possible ;
 *   • survie   : jusqu'à la première erreur ;
 *   • revision : les pays que ta mémoire est en train de perdre.
 */

export type Lancement = {
  cle: string;
  /** cabinet : un niveau d'un cabinet (Cabinet.tsx) ; nomme : « Nomme-les tous » (NommeLesTous.tsx). */
  sorte: "niveau" | "tour" | "eclair" | "survie" | "revision" | "cabinet" | "nomme" | "theme" | "erreurs" | "examen" | "defi" | "epreuve" | "marathon" | "chrono" | "filtre";
  categorie?: CategorieId;
  niveau?: number;
  methode?: TypeQuestion | null;
  cabinet?: CabinetId;
  methodeCabinet?: MethodeCabinet | null;
  /** Pour « Nomme-les tous » : continent:afrique, monde, cabinet:fr-departements… */
  liste?: string;
  /** Une route thématique : l'Afrique, l'Union européenne, la Ligue arabe… */
  theme?: ThemeId;
  /** Le défi du jour ou de la semaine, et sa date. */
  defi?: SorteDefi;
  cleDefi?: string;
  /** Le contre-la-montre d'un continent, ou une route filtrée par continent. */
  continent?: ContinentId;
  /** Reprendre la partie laissée en cours. */
  reprise?: boolean;
  titre: string;
};

/** Les parties qu'on peut reprendre plus tard. */
const REPRENABLES: Lancement["sorte"][] = ["niveau", "theme", "filtre", "epreuve"];
type Sauvegarde = { lancement: Lancement; questions: Question[]; index: number; coeurs: number; bonnes: number; fautes: number; xp: number };

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const DUREE_ECLAIR = 60_000;

/** Le temps qu'une question demande en plus d'un simple choix (écrire, situer, colorier…). */
const enPlus = (q: Question) => {
  const r = TYPES[q.type].reponse;
  return r === "ecrit" ? 10_000 : r === "clic" || r === "placer" ? 6_000 : r === "coloriage" || r === "classer" || r === "puzzle" ? 15_000 : 0;
};

function dureeQuestion(l: Lancement, q: Question, rythme: "lent" | "normal" | "rapide", plusDeTemps = false): number | null {
  if (l.sorte === "revision" || l.sorte === "eclair" || l.sorte === "erreurs" || l.sorte === "chrono") return null;
  // Le défi du jour garde le même temps pour tous (son classement en dépend).
  if (l.sorte === "defi") return DUREE_DEFI;
  const base = l.sorte === "survie" || l.sorte === "marathon" ? 10_000 : l.sorte === "tour" ? 15_000 : (l.niveau ?? 8) <= 5 ? 20_000 : (l.niveau ?? 8) <= 10 ? 15_000 : 12_000;
  return Math.round((base + enPlus(q)) * (rythme === "lent" ? 1.5 : rythme === "rapide" ? 0.7 : 1) * (plusDeTemps ? 2 : 1));
}

/** L'étoile de vitesse : en moyenne, six secondes par choix (plus pour écrire ou situer). */
const tempsVise = (q: Question) => 6_000 + enPlus(q);

/** Une question d'un continent, pour le contre-la-montre (drapeau, capitale ou carte). */
function questionContinent(graine: number, continent: ContinentId): Question | null {
  const h = hasard(graine);
  const codes = PAYS.filter((p) => p.quiz && p.statut !== "territoire" && p.continent === continent).map((p) => p.code);
  for (let essai = 0; essai < 6; essai++) {
    const cat = (["drapeaux", "capitales", "cartes"] as const)[Math.floor(h() * 3)];
    const q = questionSur(Math.floor(h() * 4294967296), cat, codes[Math.floor(h() * codes.length)], 6, true, true);
    if (q) return q;
  }
  return null;
}

/** Le niveau de difficulté des questions des modes rapides : un peu au-delà de ce que l'on a déjà fait. */
function niveauRapide(niveauxFaits: number): number {
  return Math.min(NB_NIVEAUX, Math.max(3, Math.round(niveauxFaits / 5) + 3));
}

type Rate = { q: Question; reponse: string };

/** Ce que la voix lit : la consigne, ce que montre l'invite quand c'est un mot, puis les choix écrits. */
function texteParle(q: Question): string {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  const montre =
    def.invite === "nom" || def.invite === "coloriage" || def.invite === "puzzle" ? p.nom : def.invite === "capitale" ? (p.capitale ?? "") : def.invite === "monnaie" ? (p.monnaies[0]?.nom ?? "") : def.invite === "texte" ? (q.texte ?? "") : "";
  const textes = q.options.map((o) => o.texte ?? "").filter(Boolean);
  const choix = def.reponse !== "drapeau" && textes.length ? ` Choix : ${textes.join(", ")}.` : "";
  return `${consigne(q)}${montre ? ` ${montre}.` : ""}${choix}`;
}

/** Le texte du défi à partager, dans la langue de l'interface (sa première ligne : le reste, ce sont des carrés). */
function texteAPartagerTraduit(texte: string): string {
  const [premiere = "", ...reste] = texte.split("\n");
  return [enLangue(premiere), ...reste].join("\n");
}

/** La même lecture, en anglais ou en arabe (ce que le catalogue ne connaît pas reste en français). */
function texteParleTraduit(q: Question, l: "en" | "ar"): string {
  const t = (s: string) => traduire(s, l) ?? s;
  const def = TYPES[q.type];
  const p = pays(q.cible);
  const montre =
    def.invite === "nom" || def.invite === "coloriage" || def.invite === "puzzle" ? p.nom : def.invite === "capitale" ? (p.capitale ?? "") : def.invite === "monnaie" ? (p.monnaies[0]?.nom ?? "") : def.invite === "texte" ? (q.texte ?? "") : "";
  const textes = q.options.map((o) => o.texte ?? "").filter(Boolean).map(t);
  const choix = def.reponse !== "drapeau" && textes.length ? ` ${l === "en" ? "Choices" : "الخيارات"}: ${textes.join(l === "en" ? ", " : "، ")}.` : "";
  return `${t(consigne(q))}${montre ? ` ${t(montre)}.` : ""}${choix}`;
}

export function Partie({ lancement, onFermer, onRejouer }: { lancement: Lancement; onFermer: () => void; onRejouer: (l: Lancement) => void }) {
  const monde = useMonde();
  const [graine] = useState(nouvelleGraine);
  const niveauxFaits = Object.keys(monde.niveaux).length;
  const coeursMax = lancement.sorte === "survie" ? 1 : ["niveau", "tour", "theme", "filtre", "epreuve", "marathon"].includes(lancement.sorte) ? COEURS : Infinity;
  // Une partie laissée en cours, qu'on reprend là où elle s'était arrêtée.
  const [reprise] = useState<Sauvegarde | null>(() => (lancement.reprise ? partieSauvee<Sauvegarde>() : null));

  /** Les questions prévues d'avance (niveau, tour, révision) ; les modes rapides en ajoutent au fil de l'eau. */
  const [questions, setQuestions] = useState<Question[]>(() => {
    const g = graine;
    if (reprise) return reprise.questions;
    if (lancement.sorte === "defi" && lancement.defi && lancement.cleDefi) return questionsDefi(lancement.defi, lancement.cleDefi);
    if (lancement.sorte === "epreuve" && lancement.categorie) {
      // L'épreuve finale : quarante questions sur toute la route, toutes les méthodes, au plus haut niveau.
      const codes = melanger(ordreDe(lancement.categorie), hasard(g)).slice(0, 40);
      return codes.map((c, i) => fabriquer(deriver(g, i), c, { types: typesDe(lancement.categorie!), niveau: 15 })).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "filtre" && lancement.categorie && lancement.continent) {
      const codes = melanger(
        ordreDe(lancement.categorie).filter((c) => pays(c).continent === lancement.continent),
        hasard(g),
      );
      const sortie: Question[] = [];
      for (let i = 0; sortie.length < 20 && i < codes.length * 2; i++) {
        const q = questionSur(deriver(g, i), lancement.categorie, codes[i % codes.length], 8);
        if (q && !sortie.some((x) => x.cible === q.cible && x.type === q.type)) sortie.push(q);
      }
      return sortie;
    }
    if (lancement.sorte === "chrono" && lancement.continent) {
      return Array.from({ length: 8 }, (_, i) => questionContinent(deriver(g, i), lancement.continent!)).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "marathon") {
      return Array.from({ length: 8 }, (_, i) => questionMelangee(deriver(g, i), 3, true)).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "niveau" && lancement.categorie && lancement.niveau) {
      // Les pays du niveau, complétés par ceux des niveaux d'avant que la mémoire perd le plus.
      const revision = lancement.niveau > 1 ? aReviserAvant(monde, lancement.categorie, lancement.niveau, 8) : [];
      return partieDeNiveau({ categorie: lancement.categorie, niveau: lancement.niveau, graine: g, methode: lancement.methode, revision, difficulte: monde.profil.difficulte, nombre: monde.profil.questions });
    }
    if (lancement.sorte === "theme" && lancement.theme) {
      // Une route thématique : 20 questions sur ses pays (drapeau, capitale, carte), un niveau moyen.
      const codes = melanger(paysDuTheme(lancement.theme), hasard(g));
      const sortie: Question[] = [];
      for (let i = 0; sortie.length < 20 && i < codes.length * 3; i++) {
        const code = codes[i % codes.length];
        const cat = (["drapeaux", "capitales", "cartes"] as const)[(i + (g % 3)) % 3];
        const q = questionSur(deriver(g, i), cat, code, 8);
        if (q && !sortie.some((x) => x.cible === q.cible && categorieDe(x.type) === cat)) sortie.push(q);
      }
      return sortie;
    }
    if (lancement.sorte === "erreurs") {
      // Les erreurs des sept derniers jours, une question par erreur (la même méthode), sans doublon.
      const vues = new Set<string>();
      const sortie: Question[] = [];
      for (const [i, x] of erreursRecentes(monde).reverse().entries()) {
        const cle = `${x.t}:${x.c}`;
        if (vues.has(cle) || !(x.t in TYPES) || !PAR_CODE.has(x.c)) continue;
        vues.add(cle);
        const q = fabriquer(deriver(g, i), x.c, { types: [x.t as TypeQuestion], niveau: 8 }, x.t as TypeQuestion);
        if (q) sortie.push(q);
        if (sortie.length >= 20) break;
      }
      return sortie;
    }
    if (lancement.sorte === "examen") {
      const n = niveauRapide(niveauxFaits);
      return Array.from({ length: QUESTIONS_EXAMEN }, (_, i) => questionMelangee(deriver(g, i), n, false)).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "revision") {
      const dues = revisionsDues(monde).slice(0, 20);
      return dues.map((d, i) => questionSur(deriver(g, i), d.famille, d.code, 6)).filter((q): q is Question => q !== null);
    }
    if (lancement.sorte === "tour") {
      const n = niveauRapide(niveauxFaits);
      return Array.from({ length: 20 }, (_, i) => questionMelangee(deriver(g, i), n, false)).filter((q): q is Question => q !== null);
    }
    const n = niveauRapide(niveauxFaits);
    return Array.from({ length: 6 }, (_, i) => questionMelangee(deriver(g, i), n, true)).filter((q): q is Question => q !== null);
  });
  const sansFin = lancement.sorte === "eclair" || lancement.sorte === "survie" || lancement.sorte === "marathon" || lancement.sorte === "chrono";

  const [phase, setPhase] = useState<"intro" | "question" | "reponse" | "fin">("intro");
  const [index, setIndex] = useState(reprise?.index ?? 0);
  const [coeurs, setCoeurs] = useState(reprise?.coeurs ?? coeursMax);
  const [brise, setBrise] = useState<number | null>(null);
  const [bonnes, setBonnes] = useState(reprise?.bonnes ?? 0);
  const [fautes, setFautes] = useState(reprise?.fautes ?? 0);
  const [xp, setXp] = useState(reprise?.xp ?? 0);
  // Le combo (bonnes réponses d'affilée), le temps passé, les réponses du défi.
  const [serie, setSerie] = useState(0);
  const [meilleureSerie, setMeilleureSerie] = useState(0);
  const [glace, setGlace] = useState(false);
  const [reponsesDefi, setReponsesDefi] = useState<string[]>([]);
  const [resultatDefi, setResultatDefi] = useState<{ score: number; resultats: boolean[]; deja: boolean; enLigne: boolean } | null>(null);
  const [vitesse, setVitesse] = useState<{ ms: number; vise: number } | null>(null);
  const debutQuestion = useRef(0);
  const temps = useRef({ ms: 0, vise: 0 });
  // Pour le journal de bord : l'XP gagnée, l'heure du départ, le nombre de questions.
  const xpTotal = useRef(reprise?.xp ?? 0);
  const debutJeu = useRef(0);
  const totalQuestions = useRef<number | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [rates, setRates] = useState<string[]>([]);
  const [jugement, setJugement] = useState<Jugement | null>(null);
  const [ecrit, setEcrit] = useState("");
  const [rateList, setRateList] = useState<Rate[]>([]);
  const [masques, setMasques] = useState<string[]>([]);
  const [seconde, setSeconde] = useState(false);
  const [sablier, setSablier] = useState(false);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [record, setRecord] = useState(false);
  const [finEclair, setFinEclair] = useState<number | null>(null);
  const [toucheGlobe, setToucheGlobe] = useState<string | null>(null);
  const [indice, setIndice] = useState<string | null>(null);
  const globe = useRef<GlobeRef>(null);
  const zoneChoix = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  const q = questions[index] as Question | undefined;
  const def = q ? TYPES[q.type] : null;
  const duree = q ? dureeQuestion(lancement, q, monde.profil.rythme, monde.profil.plusDeTemps) : null;
  const avecChrono = Boolean(duree && (monde.profil.chrono || lancement.sorte === "defi") && !glace);
  const total = sansFin ? null : questions.length;
  useEffect(() => {
    totalQuestions.current = total;
  }, [total]);

  /* ---------- La fin ---------- */
  const terminer = useCallback(
    (r: { bonnes: number; fautes: number; coeurs: number; reponses?: string[]; resultats?: boolean[] }) => {
      setPhase("fin");
      oublierPartie();
      const enLigne = compteMonde().connecte === true && compteMonde().enLigne !== false;
      const recordEnLigne = (mode: "eclair" | "survie" | "marathon", score: number) => {
        // Au temps doublé, le record reste sur l'appareil : le classement en ligne compare à temps égal.
        if (enLigne && score > 0 && !profilActuel().plusDeTemps) void fetch("/api/monde/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, score }) }).catch(() => undefined);
      };
      let etoilesNiveau: number | undefined;
      let estRecord = false;
      const garderRecord = (x: boolean) => {
        estRecord = x;
        setRecord(x);
      };
      if (lancement.sorte === "niveau" && lancement.categorie && lancement.niveau) {
        const reussi = r.coeurs > 0;
        // La troisième étoile demande aussi d'aller vite : en moyenne, sous le temps visé.
        const rapide = temps.current.ms <= temps.current.vise;
        setVitesse({ ...temps.current });
        const b = finirNiveau(lancement.categorie, lancement.niveau, { bonnes: r.bonnes, fautes: r.fautes, reussi, rapide });
        etoilesNiveau = b.etoiles;
        setBilan(b);
        if (reussi && !mouvementReduit()) setTimeout(() => pluieDeLettres(document.querySelector(".pt-fin-titre"), b.etoiles === 3 ? "aurore" : "ambre", grade(lancement.niveau!).nom), 380);
      } else if (lancement.sorte === "eclair" || lancement.sorte === "survie") {
        garderRecord(battreRecord(lancement.sorte, r.bonnes));
        recordEnLigne(lancement.sorte, r.bonnes);
      } else if (lancement.sorte === "marathon") {
        garderRecord(battreRecordDe("marathon", r.bonnes));
        recordEnLigne("marathon", r.bonnes);
      } else if (lancement.sorte === "chrono" && lancement.continent) {
        garderRecord(battreRecordDe(`chrono:${lancement.continent}`, r.bonnes));
      } else if (lancement.sorte === "epreuve" && lancement.categorie && r.coeurs > 0) {
        garderRecord(battreRecordDe(`epreuve:${lancement.categorie}`, r.bonnes));
        gagnerDucats(100);
      } else if (lancement.sorte === "theme" && lancement.theme && r.coeurs > 0) {
        garderRecord(battreRecordDe(`theme:${lancement.theme}`, r.bonnes));
      } else if (lancement.sorte === "examen") {
        garderRecord(battreRecordDe("examen", r.bonnes));
      } else if (lancement.sorte === "defi" && lancement.defi && lancement.cleDefi) {
        // Le défi : gardé sur l'appareil (une seule tentative), jugé et classé par le serveur.
        const resultats = r.resultats ?? [];
        const local = { score: r.bonnes, resultats, deja: false, enLigne: false };
        battreRecordDe(`defi:${lancement.defi}:${lancement.cleDefi}`, Math.max(1, r.bonnes));
        setResultatDefi(local);
        if (enLigne && r.reponses) {
          void fetch("/api/monde/defi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sorte: lancement.defi, cle: lancement.cleDefi, reponses: r.reponses, ms: temps.current.ms }) })
            .then((x) => (x.ok ? x.json() : null))
            .then((x: { score: number; deja: boolean; resultats: boolean[] } | null) => {
              if (x) setResultatDefi({ score: x.score, resultats: x.resultats, deja: x.deja, enLigne: true });
            })
            .catch(() => undefined);
        }
      }
      // Le journal de bord, et la musique de la fin.
      noterJournal({ s: lancement.sorte, n: lancement.titre, b: r.bonnes, q: totalQuestions.current, x: xpTotal.current, d: debutJeu.current ? (Date.now() - debutJeu.current) / 1000 : 0, e: etoilesNiveau });
      const naufrage = r.coeurs <= 0 && ["niveau", "theme", "epreuve", "tour", "filtre"].includes(lancement.sorte);
      ressentir(estRecord ? "record" : naufrage ? "defaite" : "niveau");
    },
    [lancement],
  );

  /* ---------- Répondre ---------- */
  const suivant = useCallback(() => {
    setBrise(null);
    if (coeurs <= 0 || (!sansFin && index + 1 >= questions.length) || ((lancement.sorte === "eclair" || lancement.sorte === "chrono") && finEclair !== null && Date.now() >= finEclair)) {
      terminer({ bonnes, fautes, coeurs, reponses: reponsesDefi, resultats: reponsesDefi.map((r, i) => (questions[i] ? juger(questions[i].type, questions[i].cible, r) !== "faux" : false)) });
      return;
    }
    // Les modes sans fin : toujours quelques questions d'avance (le marathon durcit tous les dix).
    if (sansFin && questions.length - (index + 1) <= 4) {
      const n = niveauRapide(niveauxFaits);
      setQuestions((qs) => {
        const ajout: Question[] = [];
        for (let i = qs.length; i < qs.length + 6; i++) {
          const x =
            lancement.sorte === "chrono" && lancement.continent
              ? questionContinent(deriver(graine, i), lancement.continent)
              : questionMelangee(deriver(graine, i), lancement.sorte === "marathon" ? Math.min(NB_NIVEAUX, 3 + Math.floor(i / 10)) : n, true);
          if (x) ajout.push(x);
        }
        return [...qs, ...ajout];
      });
    }
    setIndex((i) => i + 1);
    setChoix(null);
    setRates([]);
    setJugement(null);
    setEcrit("");
    setMasques([]);
    setSeconde(false);
    setSablier(false);
    setToucheGlobe(null);
    setIndice(null);
    setPhase("question");
  }, [bonnes, coeurs, fautes, finEclair, index, lancement.sorte, lancement.continent, questions, sansFin, terminer, niveauxFaits, graine, reponsesDefi]);

  const repondre = useCallback(
    (reponse: string, ou?: { x: number; y: number }) => {
      if (!q || phase !== "question") return;
      const j = juger(q.type, q.cible, reponse);
      const juste = j !== "faux";
      // Seconde chance : une erreur ne coûte rien, on peut rejouer (une fois).
      if (!juste && seconde) {
        setSeconde(false);
        setRates((r) => [...r, reponse]);
        if (TYPES[q.type].reponse === "ecrit") setEcrit("");
        ressentir("faux");
        return;
      }
      setChoix(reponse);
      setJugement(j);
      setPhase("reponse");
      ressentir(j === "juste" ? "juste" : j === "presque" ? "presque" : "faux");
      const base = baseDe(q.type, q.nb);
      const gain = gainDe(j, base);
      const famille = categorieDe(q.type);
      noterReponse(q.cible, famille, juste, gain);
      // Le temps de réponse (pour l'étoile de vitesse) ; le défi garde ses réponses pour le serveur.
      temps.current = { ms: temps.current.ms + Math.min(Date.now() - debutQuestion.current, duree ?? 60_000), vise: temps.current.vise + tempsVise(q) * (profilActuel().plusDeTemps ? 2 : 1) };
      if (lancement.sorte === "defi") setReponsesDefi((l) => [...l, reponse]);
      else envoyerReponse({ type: q.type, cible: q.cible, reponse, nb: q.nb });
      // Le combo : cinq bonnes réponses d'affilée valent un ducat de plus, dix en valent deux.
      const suite = juste ? serie + 1 : 0;
      setSerie(suite);
      setMeilleureSerie((m) => Math.max(m, suite));
      if (suite >= 5) gagnerDucats(suite >= 10 ? 2 : 1);
      if (juste) {
        setBonnes((b) => b + 1);
        setXp((x) => x + gain);
        xpTotal.current += gain;
        if (ou && !mouvementReduit()) eclat(ou.x, ou.y, j === "juste" ? "ambre" : "azur", 1.1);
      } else {
        setFautes((f) => f + 1);
        setRateList((l) => [...l, { q, reponse }]);
        // L'erreur reste sept jours (« Mes erreurs ») ; un pays pris pour un autre devient une confusion.
        const confondu = PAR_CODE.has(reponse) ? reponse : undefined;
        noterErreur(q.type, q.cible, reponse, confondu);
        if (Number.isFinite(coeursMax)) {
          setBrise(coeurs - 1);
          setCoeurs((c) => c - 1);
        }
      }
    },
    [coeurs, coeursMax, phase, q, seconde, serie, duree, lancement.sorte],
  );

  // Après une bonne réponse, on passe tout seul ; après une erreur, on laisse le temps de lire.
  useEffect(() => {
    if (phase !== "reponse") return;
    const juste = jugement !== "faux";
    const attente = lancement.sorte === "eclair" ? (juste ? 450 : 1300) : juste ? (jugement === "presque" ? 1700 : 950) : coeurs <= 0 && Number.isFinite(coeursMax) ? 2200 : null;
    if (attente === null) return;
    const t = setTimeout(suivant, attente);
    return () => clearTimeout(t);
  }, [phase, jugement, suivant, lancement.sorte, coeurs, coeursMax]);

  // Le chrono de la question (le dessin est une animation CSS ; ici, seulement l'échéance).
  useEffect(() => {
    if (phase !== "question" || !avecChrono || !duree || sablier) return;
    const t = setTimeout(() => repondre("__temps__"), duree);
    return () => clearTimeout(t);
  }, [phase, avecChrono, duree, sablier, index, repondre]);

  // Le début de chaque question (pour l'étoile de vitesse), et la sauvegarde de la partie en cours.
  useEffect(() => {
    if (phase === "question") debutQuestion.current = Date.now();
  }, [phase, index]);
  useEffect(() => {
    if (phase === "question" && index > 0 && REPRENABLES.includes(lancement.sorte)) sauverPartie({ lancement: { ...lancement, reprise: false }, questions, index, coeurs, bonnes, fautes, xp } satisfies Sauvegarde);
  }, [phase, index, lancement, questions, coeurs, bonnes, fautes, xp]);

  // Le chrono de l'éclair (et du contre-la-montre) : 60 secondes en tout.
  useEffect(() => {
    if ((lancement.sorte !== "eclair" && lancement.sorte !== "chrono") || finEclair === null || phase === "fin") return;
    const t = setTimeout(() => terminer({ bonnes, fautes, coeurs }), Math.max(0, finEclair - Date.now()));
    return () => clearTimeout(t);
  }, [finEclair, lancement.sorte, phase, terminer, bonnes, fautes, coeurs]);

  // Le champ de réponse écrite prend le focus.
  useEffect(() => {
    if (phase === "question" && def?.reponse === "ecrit") champ.current?.focus();
  }, [phase, def, index]);

  // La lecture à voix haute : la consigne, ce qui est montré (s'il se dit), puis les choix ; dans la langue de l'interface.
  const langue = monde.profil.langue;
  useEffect(() => {
    if (phase === "question" && q && monde.profil.voix) void dire(langue === "fr" ? texteParle(q) : texteParleTraduit(q, langue), langue);
  }, [phase, q, monde.profil.voix, langue]);
  useEffect(() => () => taire(), []);

  // Le clavier : 1 à 6 pour choisir, Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onFermer();
      if (phase === "reponse" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        return suivant();
      }
      if (phase !== "question" || !q || !q.options.length || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        const o = q.options[n - 1];
        if (!masques.includes(o.id) && !rates.includes(o.id)) {
          const bouton = zoneChoix.current?.querySelectorAll("button")[n - 1]?.getBoundingClientRect();
          repondre(o.id, bouton ? { x: bouton.left + bouton.width / 2, y: bouton.top + bouton.height / 2 } : undefined);
        }
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [phase, q, masques, rates, repondre, suivant, onFermer]);

  // Pas de défilement de la page derrière la partie.
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  /* ---------- Les jokers ---------- */
  const solde = ducats(monde);
  const jokers: Joker[] = ["niveau", "tour", "survie", "theme", "filtre", "marathon"].includes(lancement.sorte) ? ["indice", "passer", "seconde", "moitie", "sablier", "glace", "coeur"] : [];
  const jokerPossible = (j: Joker) => {
    if (!q || phase !== "question" || solde < JOKERS[j].prix) return false;
    if (j === "seconde") return !seconde;
    if (j === "moitie") return q.options.length > 2 && masques.length === 0;
    if (j === "sablier") return avecChrono && !sablier;
    if (j === "indice") return !indice;
    if (j === "passer") return true;
    if (j === "glace") return avecChrono && !glace;
    return coeurs < 5 && Number.isFinite(coeursMax);
  };
  const jouerJoker = (j: Joker) => {
    if (!jokerPossible(j) || !q || !depenser(JOKERS[j].prix)) return;
    if (j === "seconde") setSeconde(true);
    if (j === "glace") setGlace(true);
    if (j === "passer") {
      // La question passée ne compte ni comme bonne ni comme fausse.
      setSerie(0);
      suivant();
      return;
    }
    if (j === "indice") setIndice(indiceDe(q, q.options.find((o) => juger(q.type, q.cible, o.id) !== "faux")?.texte));
    if (j === "sablier") setSablier(true);
    if (j === "coeur") setCoeurs((c) => c + 1);
    if (j === "moitie") {
      const faux = q.options.filter((o) => juger(q.type, q.cible, o.id) === "faux" && !rates.includes(o.id));
      const n = Math.floor(q.options.length / 2);
      const h = deriver(graine, index + 1000);
      setMasques(faux.sort((a, b) => ((deriver(h, a.id.charCodeAt(0)) % 97) - (deriver(h, b.id.charCodeAt(0)) % 97))).slice(0, n).map((o) => o.id));
    }
  };

  /* ---------- Démarrer ---------- */
  const commencer = () => {
    if (!questions.length) return;
    debutJeu.current = Date.now();
    if (lancement.sorte === "eclair" || lancement.sorte === "chrono") setFinEclair(Date.now() + DUREE_ECLAIR * (monde.profil.plusDeTemps ? 2 : 1));
    setPhase("question");
  };

  const contenu = (
    <div className="pt pt-partie" data-accent="safran" data-globe={monde.profil.globe} data-phase={phase} data-concentration={monde.profil.concentration || undefined} role="dialog" aria-modal="true" aria-label={lancement.titre}>
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-partie-tete">
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Quitter la partie">
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pt-partie-route" aria-label={total ? `Question ${Math.min(index + 1, total)} sur ${total}` : `${bonnes} bonnes réponses`}>
          {total ? (
            <>
              <span className="pt-route-trait" aria-hidden="true">
                <span className="pt-route-fait" style={{ transform: `scaleX(${(index + (phase === "reponse" || phase === "fin" ? 1 : 0)) / total})` }} />
              </span>
              <span className="pt-route-compte tabular-nums">
                {Math.min(index + 1, total)}/{total}
              </span>
            </>
          ) : (
            <span className="pt-route-compte tabular-nums">
              {bonnes} bonne{bonnes > 1 ? "s" : ""}
              {(lancement.sorte === "eclair" || lancement.sorte === "chrono") && finEclair !== null && phase !== "fin" && <ChronoGlobal fin={finEclair} />}
            </span>
          )}
        </div>
        {serie >= 3 && phase !== "fin" && (
          <span className="pt-combo" data-palier={serie >= 10 ? "3" : serie >= 5 ? "2" : undefined} aria-label={`${serie} bonnes réponses d'affilée`} title={serie >= 5 ? `Combo : +${serie >= 10 ? 2 : 1} ducat${serie >= 10 ? "s" : ""} par bonne réponse` : "Encore un peu pour le combo"}>
            <Flame className="size-4" aria-hidden="true" />
            <span className="tabular-nums">{serie}</span>
            {serie >= 5 && <span className="pt-combo-x">×{serie >= 10 ? 3 : 2}</span>}
          </span>
        )}
        <BoutonConcentration />
        <BoutonVoix />
        <Coeurs restants={coeurs} total={coeursMax} brise={brise} />
        {avecChrono && phase === "question" && q && <Chrono key={index} duree={duree!} cle={`${index}`} pause={sablier} />}
      </header>

      {phase === "intro" && <Intro lancement={lancement} nombre={questions.length} coeurs={coeursMax} chrono={monde.profil.chrono} onCommencer={commencer} onFermer={onFermer} />}

      {(phase === "question" || phase === "reponse") && q && def && (
        <div className="pt-question" key={index}>
          <p className="pt-consigne">
            {lancement.sorte !== "niveau" && <span className="pt-consigne-cat">{CATEGORIES[categorieDe(q.type)].nom}</span>}
            {consigne(q)}
          </p>
          <div className="pt-invite" data-sorte={def.invite}>
            <Invite q={q} globe={globe} phase={phase} toucheGlobe={toucheGlobe} choix={choix} onRepondre={(r) => repondre(r)} onToucher={(code) => {
              if (phase !== "question" || !code) return;
              setToucheGlobe(code);
              repondre(code);
            }} />
          </div>

          {indice && phase === "question" && (
            <p className="pt-indice" role="status">
              <Lightbulb className="size-4" aria-hidden="true" />
              {indice}
            </p>
          )}

          {def.reponse === "ecrit" ? (
            <form
              className="pt-ecrit"
              onSubmit={(e) => {
                e.preventDefault();
                if (ecrit.trim()) repondre(ecrit.trim());
              }}
            >
              <input
                ref={champ}
                value={ecrit}
                onChange={(e) => setEcrit(e.target.value)}
                disabled={phase !== "question"}
                placeholder={def.ecrit === "capitale" ? "La capitale…" : "Le nom du pays…"}
                aria-label={def.ecrit === "capitale" ? "Écris la capitale" : "Écris le nom du pays"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                data-etat={phase === "reponse" ? (jugement ?? undefined) : rates.length ? "rate" : undefined}
              />
              <button type="submit" className="bouton bouton-principal" disabled={phase !== "question" || !ecrit.trim()}>
                Valider
              </button>
            </form>
          ) : def.reponse === "clic" ? (
            <p className="pt-astuce">Fais tourner le globe et touche le pays. Pince ou utilise la molette pour zoomer.</p>
          ) : def.reponse === "placer" ? (
            <p className="pt-astuce">Fais tourner le globe, zoome, puis touche l&apos;endroit où tu places la capitale. À moins de 300 km, c&apos;est gagné.</p>
          ) : def.reponse === "coloriage" ? (
            <Coloriage key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : def.reponse === "classer" ? (
            <Classement key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : def.reponse === "puzzle" ? (
            <Puzzle key={q.cible} q={q} phase={phase} onRepondre={(r) => repondre(r)} />
          ) : (
            <div ref={zoneChoix} className="pt-choix" data-sorte={def.reponse} data-nb={q.options.length}>
              {q.options.map((o, i) => {
                const masque = masques.includes(o.id);
                const deja = rates.includes(o.id);
                const etat = phase === "reponse" ? (o.id === choix ? (jugement === "faux" ? "faux" : "juste") : juger(q.type, q.cible, o.id) !== "faux" ? "attendu" : undefined) : deja ? "faux" : undefined;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="pt-option"
                    data-etat={etat}
                    data-masque={masque || undefined}
                    disabled={phase !== "question" || masque || deja}
                    style={{ "--i": i } as React.CSSProperties}
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      repondre(o.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
                    }}
                  >
                    <span className="pt-option-touche" aria-hidden="true">
                      {i + 1}
                    </span>
                    <ContenuOption q={q} o={o} />
                    {etat === "juste" || etat === "attendu" ? <Check className="pt-option-signe" aria-hidden="true" /> : etat === "faux" ? <X className="pt-option-signe" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          )}

          {phase === "question" && jokers.length > 0 && (
            <div className="pt-jokers" role="group" aria-label="Jokers">
              {jokers.map((j) => (
                <button key={j} type="button" className="pt-joker" data-joker={j} data-actif={(j === "seconde" && seconde) || (j === "sablier" && sablier) || undefined} disabled={!jokerPossible(j)} onClick={() => jouerJoker(j)} title={JOKERS[j].texte}>
                  <IconeJoker j={j} />
                  <span className="pt-joker-nom">{JOKERS[j].nom}</span>
                  <span className="pt-joker-prix tabular-nums">{JOKERS[j].prix}</span>
                </button>
              ))}
              <Ducats n={solde} className="pt-jokers-solde" />
            </div>
          )}

          {phase === "reponse" && <Retour q={q} jugement={jugement} choix={choix} sansCoeur={coeurs <= 0 && Number.isFinite(coeursMax)} gain={jugement && jugement !== "faux" ? gainDe(jugement, baseDe(q.type, q.nb)) : 0} onSuivant={suivant} auto={jugement !== "faux" || lancement.sorte === "eclair"} />}
        </div>
      )}

      {phase === "fin" && (
        <Fin
          lancement={lancement}
          bonnes={bonnes}
          total={sansFin ? null : questions.length}
          fautes={fautes}
          coeurs={coeurs}
          xp={xp}
          bilan={bilan}
          record={record}
          rates={rateList}
          croises={questions.slice(0, index + 1).map((x) => x.cible)}
          meilleureSerie={meilleureSerie}
          vitesse={vitesse}
          defi={resultatDefi}
          onFermer={onFermer}
          onRejouer={onRejouer}
        />
      )}
    </div>
  );
  return createPortal(contenu, document.body);
}

/* ---------- L'éclair : le temps qui reste ---------- */
function ChronoGlobal({ fin }: { fin: number }) {
  const [reste, setReste] = useState(() => Math.max(0, fin - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setReste(Math.max(0, fin - Date.now())), 250);
    return () => clearInterval(t);
  }, [fin]);
  return <span className="pt-eclair-reste" data-presse={reste < 10_000 || undefined}> · {Math.ceil(reste / 1000)} s</span>;
}

/* ---------- Ce qu'on montre ---------- */
export function Invite({
  q,
  globe,
  phase,
  toucheGlobe,
  onToucher,
  choix = null,
  onRepondre = () => undefined,
}: {
  q: Question;
  globe: React.RefObject<GlobeRef | null>;
  phase: string;
  toucheGlobe: string | null;
  onToucher: (code: string | null) => void;
  choix?: string | null;
  onRepondre?: (reponse: string) => void;
}) {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  if (gereInvite(q)) return <InviteAutre q={q} globe={globe} phase={phase} choix={choix} onRepondre={onRepondre} />;
  if (def.reponse === "clic") {
    const teintes: Record<string, "juste" | "faux"> = {};
    if (phase === "reponse") {
      teintes[q.cible] = "juste";
      if (toucheGlobe && toucheGlobe !== q.cible) teintes[toucheGlobe] = "faux";
    }
    return (
      <div className="pt-invite-globe" data-large="">
        {def.invite === "drapeau" ? (
          <Drapeau code={q.cible} nomme={false} className="pt-invite-globe-drapeau" />
        ) : (
          <p className="pt-nom-grand" lang="fr">
            {def.invite === "capitale" ? p.capitale : p.nom}
          </p>
        )}
        <Globe ref={globe} interactif onToucher={onToucher} teintes={teintes} reperes="tous" cible={phase === "reponse" ? q.cible : null} libelle="Globe : touche le pays demandé" vueInitiale={{ lon: 15, lat: 25, zoom: 1 }} />
      </div>
    );
  }
  switch (def.invite) {
    case "drapeau":
      return <Drapeau code={q.cible} nomme={false} grand />;
    case "nom":
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{p.statut === "territoire" ? "Territoire" : "Pays"}</span>
          <span className="pt-nom-grand">{p.nom}</span>
        </div>
      );
    case "capitale":
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{motCapitale(p)}</span>
          <span className="pt-nom-grand">{p.capitale}</span>
        </div>
      );
    case "monnaie": {
      const m = p.monnaies[0];
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">Monnaie</span>
          <span className="pt-nom-grand">{m.nom}</span>
          {m.symbole && <span className="pt-invite-symbole">{m.symbole}</span>}
        </div>
      );
    }
    case "continent":
      return (
        <div className="pt-invite-continent">
          <MiniContinent continent={q.continent ?? p.continent} className="pt-mini-grand" />
          <span className="pt-nom-grand">{NOM_CONTINENT[q.continent ?? p.continent]}</span>
        </div>
      );
    case "silhouette":
      return <Silhouette code={q.cible} />;
    case "silhouette-tournee":
      return <Silhouette code={q.cible} rotation={q.rotation} miroir={q.miroir} />;
    case "carte":
      return <InviteCarte q={q} globe={globe} />;
  }
}

function InviteCarte({ q, globe }: { q: Question; globe: React.RefObject<GlobeRef | null> }) {
  const p = pays(q.cible);
  return (
    <div className="pt-invite-globe">
      <Globe ref={globe} cible={q.cible} libelle="Globe : un pays est allumé" interactif reperes="cible" />
      <div className="pt-globe-outils">
        <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1.6)} aria-label="Voir de plus près">
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(0.5)} aria-label="Voir de plus loin">
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="pt-icone" onClick={() => globe.current?.viser(q.cible)} aria-label="Revenir sur le pays">
          <LocateFixed className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="pt-indices" aria-label="Indices">
        <span>{formatPopulation(p.population)}</span>
        <span>{formatSuperficie(p.superficie)}</span>
      </div>
    </div>
  );
}

export function ContenuOption({ q, o }: { q: Question; o: Question["options"][number] }) {
  const r = TYPES[q.type].reponse;
  const autre = ContenuOptionAutre({ q, o });
  if (autre) return autre;
  if (r === "drapeau" && o.code) return <Drapeau code={o.code} nomme={false} />;
  if (r === "continent" && o.continent)
    return (
      <span className="pt-option-continent">
        <MiniContinent continent={o.continent} />
        <span>{o.texte}</span>
      </span>
    );
  return <span className="pt-option-texte">{o.texte}</span>;
}

function IconeJoker({ j }: { j: Joker }) {
  if (j === "indice") return <Lightbulb className="size-4" aria-hidden="true" />;
  if (j === "passer") return <SkipForward className="size-4" aria-hidden="true" />;
  if (j === "glace") return <Snowflake className="size-4" aria-hidden="true" />;
  if (j === "seconde") return <Undo2 className="size-4" aria-hidden="true" />;
  if (j === "moitie") return <Shuffle className="size-4" aria-hidden="true" />;
  if (j === "sablier") return <Hourglass className="size-4" aria-hidden="true" />;
  return <Plus className="size-4" aria-hidden="true" />;
}

/* ---------- Après la réponse : ce qu'il fallait trouver, pour apprendre ---------- */
function Retour({ q, jugement, choix, sansCoeur, gain, onSuivant, auto }: { q: Question; jugement: Jugement | null; choix: string | null; sansCoeur: boolean; gain: number; onSuivant: () => void; auto: boolean }) {
  const p = pays(q.cible);
  const def = TYPES[q.type];
  const temps = choix === "__temps__";
  const bonneReponse =
    bonneReponseAutre(q, choix) ??
    (def.reponse === "capitale" || (def.reponse === "ecrit" && def.ecrit === "capitale")
      ? `${p.capitale} (${p.nom})`
      : def.reponse === "continent"
        ? `${NOM_CONTINENT[p.continent]} (${p.nom})`
        : def.reponse === "monnaie"
          ? `${p.monnaies[0].nom} (${p.nom})`
          : q.type === "continent-pays"
            ? `${p.nom}, en ${NOM_CONTINENT[p.continent]}`
            : p.nom);
  return (
    <div className="pt-retour" data-jugement={jugement ?? "faux"} role="status">
      <div className="pt-retour-texte">
        {jugement === "juste" ? (
          <strong>
            Exact !{q.type === "capitale-placer" ? ` ${bonneReponseAutre(q, choix)}.` : ""}
            {gain ? ` +${gain} XP` : ""}
          </strong>
        ) : jugement === "presque" ? (
          <strong>{presqueAutre(q, choix) ? `Presque ! ${presqueAutre(q, choix)}` : <>Presque ! On écrit « {def.ecrit === "capitale" ? p.capitale : p.nom} »</>}</strong>
        ) : (
          <strong>{temps ? "Temps écoulé." : "Ce n'est pas ça."} C&apos;était : {bonneReponse}</strong>
        )}
        {jugement === "faux" && (
          <span className="pt-retour-fiche">{p.capitale ? `${motCapitale(p)} : ${p.capitale}, en ${NOM_CONTINENT[p.continent]}.` : `En ${NOM_CONTINENT[p.continent]}.`}</span>
        )}
        {jugement === "faux" && <Piege q={q} choix={choix} />}
      </div>
      {!auto && (
        <button type="button" className="bouton bouton-principal" onClick={onSuivant} autoFocus>
          {sansCoeur ? "Voir le bilan" : "Continuer"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Après une erreur : les deux drapeaux côte à côte, et le moyen de ne plus les confondre. */
function Piege({ q, choix }: { q: Question; choix: string | null }) {
  const def = TYPES[q.type];
  const autre = choix && choix !== q.cible && PAR_CODE.has(choix) ? choix : null;
  const surDrapeau = def.reponse === "drapeau" || def.invite === "drapeau" || def.invite === "drapeau-gris" || def.invite === "drapeau-devoile";
  const piege = autre ? piegeEntre(q.cible, autre, surDrapeau ? "drapeau" : undefined) ?? piegeEntre(q.cible, autre) : undefined;
  const capitale = def.reponse === "capitale" || def.ecrit === "capitale" || def.invite === "capitale" ? PIEGES_CAPITALES[q.cible] : undefined;
  if (!autre && !capitale) return null;
  return (
    <span className="pt-piege">
      {autre && surDrapeau && (
        <span className="pt-confusion" aria-hidden="true">
          <span>
            <Drapeau code={autre} />
            <span>{pays(autre).nom}</span>
          </span>
          <span>
            <Drapeau code={q.cible} />
            <span>{pays(q.cible).nom}</span>
          </span>
        </span>
      )}
      {(piege || capitale) && <span className="pt-piege-texte">{piege?.texte ?? capitale}</span>}
    </span>
  );
}

/* ---------- L'introduction ---------- */
function Intro({ lancement, nombre, coeurs, chrono, onCommencer, onFermer }: { lancement: Lancement; nombre: number; coeurs: number; chrono: boolean; onCommencer: () => void; onFermer: () => void }) {
  const g = lancement.niveau ? grade(lancement.niveau) : null;
  const regles =
    lancement.sorte === "eclair"
      ? "60 secondes : le plus de bonnes réponses possible."
      : lancement.sorte === "survie"
        ? "Une seule vie : jusqu'à la première erreur."
        : lancement.sorte === "revision"
          ? `${nombre} pays à revoir, sans chrono ni cœurs.`
          : lancement.sorte === "erreurs"
            ? `${nombre} question${nombre > 1 ? "s" : ""} manquée${nombre > 1 ? "s" : ""} ces sept derniers jours, sans chrono ni cœurs.`
            : lancement.sorte === "examen"
              ? `${nombre} questions de toutes les catégories, sans joker ni cœurs. Une note sur 20, et un certificat à imprimer.`
              : lancement.sorte === "defi"
                ? `${nombre} questions, les mêmes pour tout le monde, ${DUREE_DEFI / 1000} secondes chacune. Une seule tentative.`
                : lancement.sorte === "epreuve"
                  ? `${nombre} questions sur toute la route, toutes les méthodes, trois cœurs. La dernière marche.`
                  : lancement.sorte === "marathon"
                    ? "Trois cœurs, et des questions de plus en plus difficiles : jusqu'où iras-tu ?"
                    : lancement.sorte === "chrono"
                      ? "60 secondes : le plus de bonnes réponses possible sur ce continent."
              : `${nombre} questions, ${coeurs} cœurs${chrono ? " et un chrono pour chaque question" : ""}.`;
  return (
    <div className="pt-intro">
      {g && (
        <p className="pt-intro-grade">
          Niveau {lancement.niveau} : {g.nom}
        </p>
      )}
      <h2 className="pt-intro-titre">{lancement.titre}</h2>
      <p className="pt-intro-regles">{regles}</p>
      {nombre === 0 ? (
        <>
          <p className="pt-intro-regles">{lancement.sorte === "erreurs" ? "Aucune erreur ces sept derniers jours : rien à rejouer." : "Rien à revoir pour l'instant : ta mémoire tient bon. Reviens demain."}</p>
          <button type="button" className="bouton bouton-discret" onClick={onFermer}>
            Retour
          </button>
        </>
      ) : (
        <button type="button" className="bouton bouton-principal pt-intro-go" onClick={onCommencer} autoFocus>
          C&apos;est parti
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- Le bilan ---------- */
function Fin({
  lancement,
  bonnes,
  total,
  fautes,
  coeurs,
  xp,
  bilan,
  record,
  rates,
  croises,
  meilleureSerie,
  vitesse,
  defi,
  onFermer,
  onRejouer,
}: {
  lancement: Lancement;
  bonnes: number;
  total: number | null;
  fautes: number;
  coeurs: number;
  xp: number;
  bilan: Bilan | null;
  record: boolean;
  rates: Rate[];
  /** Les pays croisés pendant la partie (pour le « Le savais-tu ? »). */
  croises: string[];
  meilleureSerie: number;
  vitesse: { ms: number; vise: number } | null;
  defi: { score: number; resultats: boolean[]; deja: boolean; enLigne: boolean } | null;
  onFermer: () => void;
  onRejouer: (l: Lancement) => void;
}) {
  const recits = useRecits();
  const [tirage] = useState(() => Math.random());
  const niveau = lancement.sorte === "niveau";
  const reussi = niveau ? coeurs > 0 : true;
  const g = lancement.niveau ? grade(lancement.niveau) : null;
  const titre = niveau
    ? reussi
      ? bilan?.premiereFois && g
        ? `Te voilà ${g.nom} !`
        : bilan?.etoiles === 3
          ? "Sans une faute !"
          : "Niveau réussi"
      : "Naufrage…"
    : lancement.sorte === "eclair"
      ? record
        ? "Nouveau record !"
        : "Temps écoulé"
      : lancement.sorte === "survie"
        ? record
          ? "Nouveau record !"
          : "Fin de la traversée"
        : lancement.sorte === "examen"
          ? `${bonnes}/20 : ${mention(bonnes)}`
          : lancement.sorte === "defi"
            ? `${defi?.score ?? bonnes}/${total ?? 10} au défi`
            : lancement.sorte === "epreuve"
              ? coeurs > 0
                ? "Épreuve réussie"
                : "Naufrage…"
              : lancement.sorte === "marathon" || lancement.sorte === "chrono"
                ? record
                  ? "Nouveau record !"
                  : "Bien couru"
          : lancement.sorte === "theme"
            ? coeurs > 0
              ? record
                ? "Nouveau record !"
                : "Route accomplie"
              : "Naufrage…"
            : "Terminé";
  const sousTitre = niveau ? (reussi ? (bilan?.premiereFois && g ? g.devise : `${bonnes} bonnes réponses sur ${total}`) : "Les cœurs sont épuisés. Les pays manqués t'attendent ci-dessous : revois-les, puis reprends la mer.") : `${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""}${total ? ` sur ${total}` : ""}`;
  const suivantPossible = niveau && reussi && (lancement.niveau ?? 15) < NB_NIVEAUX;
  const uniques = useMemo(() => [...new Map(rates.map((r) => [r.q.cible, r])).values()], [rates]);
  // Une anecdote sur un pays de la partie : de préférence un pays manqué, pour qu'il reste en mémoire.
  const candidats = [...new Set([...uniques.map((u) => u.q.cible), ...croises])].filter((c) => recits?.[c]?.anecdote);
  const savais = candidats.length ? candidats[uniques.length && recits?.[uniques[0].q.cible]?.anecdote ? 0 : Math.floor(tirage * candidats.length)] : null;
  // Les pays de la partie, sur un petit globe : trouvés ou à revoir.
  const teintesFin = useMemo(() => {
    const t: Record<string, Teinte> = {};
    for (const c of croises) if (PAR_CODE.has(c)) t[c] = "juste";
    for (const u of uniques) if (PAR_CODE.has(u.q.cible)) t[u.q.cible] = "faux";
    return t;
  }, [croises, uniques]);
  const centreFin = useMemo(() => centreDe(Object.keys(teintesFin)), [teintesFin]);
  const nouveauGrade = niveau && reussi && bilan?.premiereFois && g && lancement.categorie ? g : null;
  return (
    <div className="pt-fin" data-reussi={reussi || undefined}>
      {niveau && <Etoiles n={bilan?.etoiles ?? 0} taille="grande" animees />}
      <h2 className="pt-fin-titre">{titre}</h2>
      <p className="pt-fin-sous">{sousTitre}</p>
      {nouveauGrade && <Brevet g={nouveauGrade} categorie={CATEGORIES[lancement.categorie!].nom} />}
      {Object.keys(teintesFin).length > 0 && (
        <figure className="pt-fin-globe">
          <Globe tourne teintes={teintesFin} vueInitiale={{ lon: centreFin[0], lat: centreFin[1], zoom: 1 }} libelle={`Les ${Object.keys(teintesFin).length} pays de la partie sur le globe : ceux que tu as trouvés et ceux à revoir.`} />
          <figcaption>
            <span data-teinte="juste">{Object.values(teintesFin).filter((x) => x === "juste").length} trouvés</span>
            {uniques.length > 0 && <span data-teinte="faux">{Object.values(teintesFin).filter((x) => x === "faux").length} à revoir</span>}
          </figcaption>
        </figure>
      )}
      <dl className="pt-fin-chiffres">
        <div>
          <dt>Bonnes réponses</dt>
          <dd className="tabular-nums">{bonnes}</dd>
        </div>
        <div>
          <dt>Erreurs</dt>
          <dd className="tabular-nums">{fautes}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd className="tabular-nums">+{xp}</dd>
        </div>
        {bilan && bilan.ducats > 0 && (
          <div>
            <dt>Ducats</dt>
            <dd className="tabular-nums">+{bilan.ducats}</dd>
          </div>
        )}
        {bilan && bilan.jours > 1 && (
          <div>
            <dt>Jours d&apos;affilée</dt>
            <dd className="tabular-nums">{bilan.jours}</dd>
          </div>
        )}
        {meilleureSerie >= 3 && (
          <div>
            <dt>Meilleure série</dt>
            <dd className="tabular-nums">{meilleureSerie}</dd>
          </div>
        )}
      </dl>
      {lancement.sorte === "examen" && <Certificat note={bonnes} />}
      {lancement.sorte === "defi" && lancement.defi && lancement.cleDefi && defi && <PartageDefi sorte={lancement.defi} cle={lancement.cleDefi} resultat={defi} />}
      {lancement.sorte === "epreuve" && coeurs > 0 && lancement.categorie && <p className="pt-fin-medaille">Te voilà maître de la route « {CATEGORIES[lancement.categorie].nom} ». Une médaille de saphir et 100 ducats.</p>}
      {vitesse && niveau && reussi && fautes === 0 && (
        <p className="pt-fin-vitesse">
          {vitesse.ms <= vitesse.vise ? "L'étoile de vitesse : " : "Il manque l'étoile de vitesse : "}
          {Math.round(vitesse.ms / Math.max(1, bonnes) / 100) / 10} s par question en moyenne (il fallait au plus {Math.round(vitesse.vise / Math.max(1, bonnes) / 100) / 10} s).
        </p>
      )}
      {savais && (
        <aside className="pt-fiche-savais pt-fin-savais" aria-label="Le savais-tu ?">
          <p className="pt-fiche-savais-titre">
            Le savais-tu ? <span>{pays(savais).nom}</span>
          </p>
          <p>{recits?.[savais]?.anecdote}</p>
        </aside>
      )}
      <div className="pt-fin-actions">
        {suivantPossible && (
          <button type="button" className="bouton bouton-principal" onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}`, niveau: lancement.niveau! + 1, titre: `${CATEGORIES[lancement.categorie!].nom} · niveau ${lancement.niveau! + 1}` })}>
            Niveau suivant
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
        {lancement.sorte !== "defi" && (
          <button type="button" className={`bouton ${suivantPossible ? "bouton-discret" : "bouton-principal"}`} onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}`, reprise: false })}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Rejouer
          </button>
        )}
        <button type="button" className="bouton bouton-discret" onClick={onFermer}>
          Fermer
        </button>
      </div>
      {uniques.length > 0 && (
        <section className="pt-fin-rates" aria-label="À revoir">
          <h3>À revoir</h3>
          <ul>
            {uniques.map(({ q }) => {
              const p = pays(q.cible);
              return (
                <li key={q.cible}>
                  <Drapeau code={p.code} />
                  <span>
                    <strong>{p.nom}</strong>
                    <span>
                      {p.capitale ? `${motCapitale(p)} : ${p.capitale}` : NOM_CONTINENT[p.continent]}
                      {categorieDe(q.type) === "monnaies" ? `, monnaie : ${p.monnaies[0]?.nom}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Le défi : le score, des carrés à partager (sans les réponses), et le classement du jour. */
function PartageDefi({ sorte, cle, resultat }: { sorte: SorteDefi; cle: string; resultat: { score: number; resultats: boolean[]; deja: boolean; enLigne: boolean } }) {
  const [copie, setCopie] = useState(false);
  const texte = texteAPartagerTraduit(texteAPartager(sorte, cle, resultat.resultats, typeof window === "undefined" ? "" : `${window.location.origin}/monde`, localeDe(profilActuel().langue)));
  const partager = async () => {
    try {
      if (navigator.share) await navigator.share({ text: texte });
      else {
        await navigator.clipboard.writeText(texte);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };
  return (
    <section className="pt-defi-partage" aria-label="Partager le défi">
      <p className="pt-defi-carres" aria-label={`${resultat.score} bonnes réponses sur ${resultat.resultats.length}`}>
        {resultat.resultats.map((x, i) => (
          <span key={i} data-juste={x || undefined} />
        ))}
      </p>
      {resultat.deja && <p className="pt-astuce">Le défi d&apos;aujourd&apos;hui avait déjà été joué sur ce compte : c&apos;est le premier score qui compte.</p>}
      {!resultat.enLigne && <p className="pt-astuce">Connecte-toi pour figurer au classement du défi.</p>}
      <button type="button" className="bouton bouton-principal" onClick={() => void partager()}>
        <Share2 className="size-4" aria-hidden="true" />
        {copie ? "Copié !" : "Partager mon résultat"}
      </button>
    </section>
  );
}

/** Le certificat de l'examen : un parchemin à imprimer, au nom qu'on veut. */
function Certificat({ note }: { note: number }) {
  const [nom, setNom] = useState("");
  const [date] = useState(() => new Intl.DateTimeFormat(localeDe(profilActuel().langue), { dateStyle: "long" }).format(new Date()));
  return (
    <section className="pt-certificat-zone" aria-label="Le certificat">
      <label className="pt-certificat-nom">
        <span>Ton nom sur le certificat</span>
        <input value={nom} onChange={(e) => setNom(e.target.value.slice(0, 60))} placeholder="Prénom et nom" autoComplete="name" />
      </label>
      <div className="pt-certificat" data-reussi={note >= 10 || undefined}>
        <p className="pt-certificat-sur">Le Portulan</p>
        <h3 className="pt-certificat-titre">Certificat de géographie</h3>
        <p className="pt-certificat-texte">
          décerné à <strong>{nom.trim() || "…………………………"}</strong>
          <br />
          pour l&apos;examen du {date}
        </p>
        <p className="pt-certificat-note">
          <span className="tabular-nums">{note}</span>/20
        </p>
        <p className="pt-certificat-mention">{mention(note)}</p>
        <span className="pt-certificat-sceau" aria-hidden="true">
          <RoseSceau />
        </span>
      </div>
      <button type="button" className="bouton bouton-principal" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Imprimer le certificat
      </button>
    </section>
  );
}

/** Le centre (longitude, latitude) d'une poignée de pays : la moyenne des directions, pour viser juste par-delà l'antiméridien. */
function centreDe(codes: string[]): [number, number] {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const c of codes) {
    const p = PAR_CODE.get(c);
    if (!p) continue;
    const [la, lo] = [(p.latlng[0] * Math.PI) / 180, (p.latlng[1] * Math.PI) / 180];
    x += Math.cos(la) * Math.cos(lo);
    y += Math.cos(la) * Math.sin(lo);
    z += Math.sin(la);
  }
  if (!x && !y && !z) return [12, 20];
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
  return [lon, Math.max(-60, Math.min(60, lat))];
}

/**
 * Le brevet d'un nouveau grade : un parchemin qui se déroule, le nom du grade à l'encre dorée,
 * et le sceau de cire qui vient le frapper.
 */
function Brevet({ g, categorie }: { g: { n: number; nom: string; devise: string }; categorie: string }) {
  const [date] = useState(() => new Intl.DateTimeFormat(localeDe(profilActuel().langue), { dateStyle: "long" }).format(new Date()));
  useEffect(() => {
    const reduit = mouvementReduit();
    const a = setTimeout(() => jouer("parchemin"), reduit ? 0 : 200);
    const b = setTimeout(() => ressentir("sceau"), reduit ? 150 : 1450);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return (
    <section className="pt-brevet" aria-label={`Brevet de ${g.nom}`}>
      <div className="pt-brevet-parchemin">
        <span className="pt-brevet-rouleau" data-haut="" aria-hidden="true" />
        <div className="pt-brevet-corps">
          <div className="pt-brevet-texte">
            <p className="pt-brevet-sur">Le Portulan décerne le brevet de</p>
            <p className="pt-brevet-titre">{g.nom}</p>
            <p className="pt-brevet-devise">« {g.devise} »</p>
            <p className="pt-brevet-pied">
              Niveau {g.n} de la route « {categorie} », le {date}
            </p>
          </div>
        </div>
        <span className="pt-brevet-rouleau" data-bas="" aria-hidden="true" />
        <span className="pt-brevet-sceau" aria-hidden="true">
          <RoseSceau />
        </span>
      </div>
    </section>
  );
}

/** Le sceau de cire : une rose des vents en relief. */
function RoseSceau() {
  return (
    <svg viewBox="-50 -50 100 100">
      <circle r="44" className="pt-sceau-cire" />
      <circle r="35" className="pt-sceau-trait" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d={a % 90 === 0 ? "M0 -30 L6 0 L0 6 L-6 0 Z" : "M0 -20 L4 0 L0 4 L-4 0 Z"} transform={`rotate(${a})`} className="pt-sceau-branche" />
      ))}
      <circle r="4" className="pt-sceau-trait" />
    </svg>
  );
}

export function useLancer() {
  return useMemo(
    () => ({
      niveau: (categorie: CategorieId, niveau: number, methode: TypeQuestion | null = null): Lancement => ({ cle: `${Date.now()}`, sorte: "niveau", categorie, niveau, methode, titre: `${CATEGORIES[categorie].nom} · niveau ${niveau}` }),
      theme: (theme: ThemeId): Lancement => ({ cle: `${Date.now()}`, sorte: "theme", theme, titre: THEMES.find((t) => t.id === theme)?.nom ?? "Route thématique" }),
      erreurs: (): Lancement => ({ cle: `${Date.now()}`, sorte: "erreurs", titre: "Mes erreurs" }),
      examen: (): Lancement => ({ cle: `${Date.now()}`, sorte: "examen", titre: "L'examen" }),
      defi: (sorte: SorteDefi): Lancement => ({ cle: `${Date.now()}`, sorte: "defi", defi: sorte, cleDefi: cleDefi(sorte), titre: sorte === "jour" ? "Le défi du jour" : "Le défi de la semaine" }),
      epreuve: (categorie: CategorieId): Lancement => ({ cle: `${Date.now()}`, sorte: "epreuve", categorie, titre: `${CATEGORIES[categorie].nom} : l'épreuve finale` }),
      marathon: (): Lancement => ({ cle: `${Date.now()}`, sorte: "marathon", titre: "Le marathon" }),
      chrono: (continent: ContinentId): Lancement => ({ cle: `${Date.now()}`, sorte: "chrono", continent, titre: `Contre la montre : ${NOM_CONTINENT[continent]}` }),
      filtre: (categorie: CategorieId, continent: ContinentId): Lancement => ({ cle: `${Date.now()}`, sorte: "filtre", categorie, continent, titre: `${CATEGORIES[categorie].nom} : ${NOM_CONTINENT[continent]}` }),
      rapide: (sorte: "tour" | "eclair" | "survie" | "revision"): Lancement => ({
        cle: `${Date.now()}`,
        sorte,
        titre: sorte === "tour" ? "Le tour du monde" : sorte === "eclair" ? "L'éclair" : sorte === "survie" ? "Sans faute" : "Révisions du jour",
      }),
    }),
    [],
  );
}
