"use client";

import { Check, ChevronRight, Lightbulb, RotateCcw, Timer, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { CATEGORIES, type CategorieId, COEURS, etoilesPour, niveauxDe } from "@/lib/corps/niveaux";
import { battreRecord, finirNiveau, noterErreur, noterJournal, noterReponse, profilActuel, useEcorche } from "@/lib/corps/progression";
import { article, type Difficulte, defiDuJour, METHODES, partieDeNiveau, type Question, questionMelangee, questionSur, structuresDe, type TypeQ } from "@/lib/corps/quiz";
import { jugerNom, type Jugement } from "@/lib/corps/texte";
import { REGIONS } from "@/lib/corps/types";
import { Cartel, Coeurs, Etoiles, TEINTE, miseEnScene, romain } from "./communs";
import type { Stage } from "./Ecorche";
import type { EtatStructure } from "./moteur/Corps3D";
import { dire, ressentir } from "./sons";

export type Lancement =
  | { sorte: "niveau"; categorie: CategorieId; n: number; titre: string; methode: TypeQ | null; revision?: string[]; graine?: number }
  | { sorte: "revision"; ids: string[]; titre: string; graine?: number }
  | { sorte: "defi"; jour: string; titre: string; graine?: number }
  | { sorte: "eclair" | "survie"; categorie: CategorieId; titre: string; graine?: number }
  | { sorte: "entrainement"; ids: string[]; titre: string; methodes?: TypeQ[]; graine?: number };

type Reponse = { verdict: Jugement; choisi?: string; texte?: string; touche?: string };

const DUREE_ECLAIR = 60;
const GRANDE = new Map(REGIONS.map((r) => [r.id, r.grande]));

/** Les questions d'avance (niveau, défi, révisions) ; l'éclair et la survie les tirent au fil de l'eau. */
function preparer(l: Lancement, graine: number, difficulte: Difficulte, nombre: number): Question[] {
  switch (l.sorte) {
    case "niveau":
      return partieDeNiveau({ categorie: l.categorie, n: l.n, graine, nombre, revision: l.revision, difficulte, methode: l.methode });
    case "defi":
      return defiDuJour(l.jour);
    case "revision":
    case "entrainement": {
      const permis: TypeQ[] = l.sorte === "entrainement" && l.methodes ? l.methodes : ["nommer", "situer", "ecrire", "memo", "latin", "action", "terminaison", "articulation", "provenance", "territoire", "tendon-muscle"];
      const ids = l.ids.filter((id) => PAR_ID.has(id));
      const sortie: Question[] = [];
      const tours = l.sorte === "entrainement" ? Math.max(6, Math.min(12, ids.length * 3)) : ids.length;
      for (let i = 0; i < tours; i++) {
        const q = questionSur(graine + i * 31, ids[i % ids.length], permis, { difficulte }, sortie[sortie.length - 1]?.type);
        if (q) sortie.push(q);
      }
      return sortie;
    }
    default:
      return [];
  }
}

export function Partie({ lancement, stage, fermer, relancer }: { lancement: Lancement; stage: Stage; fermer: () => void; relancer: (l: Lancement) => void }) {
  const etat = useEcorche();
  const p = etat.profil;
  const graine = lancement.graine ?? 1;
  const sansFin = lancement.sorte === "eclair" || lancement.sorte === "survie";
  const pool = useMemo(() => (sansFin ? structuresDe((lancement as { categorie: CategorieId }).categorie) : []), [lancement, sansFin]);
  const difficulteSurvie = (n: number): Difficulte => (n < 8 ? "facile" : n < 20 ? "normal" : "difficile");
  const tirer = (n: number): Question | null => questionMelangee(graine + n * 977, pool, lancement.sorte === "eclair", lancement.sorte === "survie" ? difficulteSurvie(n) : profilActuel().difficulte);
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (!sansFin) return preparer(lancement, graine, profilActuel().difficulte, profilActuel().questions);
    const q0 = tirer(0);
    return q0 ? [q0] : [];
  });
  const [i, setI] = useState(0);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [coeurs, setCoeurs] = useState(COEURS);
  const [bonnes, setBonnes] = useState(0);
  const [fautes, setFautes] = useState(0);
  const [serie, setSerie] = useState(0);
  const [xp, setXp] = useState(0);
  const [manquees, setManquees] = useState<string[]>([]);
  const [fin, setFin] = useState<null | { titre: string; etoiles?: number; record?: boolean; reussi: boolean }>(null);
  const [reste, setReste] = useState(DUREE_ECLAIR);
  const [ecrit, setEcrit] = useState("");
  const [indice, setIndice] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const debut = useRef(0);

  useEffect(() => {
    debut.current = Date.now();
  }, []);

  const q = questions[i] ?? null;
  const total = sansFin ? null : questions.length;

  /* ---------- La scène pour chaque question ---------- */

  const mettreEnScene = useCallback(
    (question: Question, apres: Reponse | null) => {
      const montre = apres ? (PAR_ID.has(question.attendu) ? question.attendu : question.cible) : question.cible;
      const e = PAR_ID.get(montre) ?? PAR_ID.get(question.cible);
      if (!e) return;
      const structures = stage.poignee.current?.structuresDe(e.id) ?? [];
      const { couches, profondeur } = miseEnScene(e, structures);
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
        couches: voirTout || question.montrer || apres ? couches : { os: 1, muscle: 1, tendon: 1, artere: 0 },
        profondeur: voirTout || question.montrer || apres ? profondeur : 0,
        etats,
        isoler: null,
        rotation: false,
        etiquette: apres ? { id: montre, texte: PAR_ID.get(montre)?.nom ?? "" } : null,
        retrait: false,
      });
      const cam = stage.poignee.current;
      if (!cam) return;
      if (apres || question.montrer) cam.viser([montre], { marge: apres ? 1.9 : 1.6 });
      else if (question.reponse === "clic") {
        // Chercher sur le corps : la grande région, sans désigner la structure.
        const g = GRANDE.get(e.region);
        const voisins = ELEMENTS.filter((x) => x.couche === e.couche && GRANDE.get(x.region) === g).map((x) => x.id);
        const cote = structures.length && structures.every((s) => s.cote === "d") ? "d" : "g";
        cam.viser(voisins, { marge: 1.05, cote, depuis: e.id });
      } else cam.vue("ensemble");
    },
    [stage],
  );

  useEffect(() => {
    if (q && !fin) mettreEnScene(q, reponse);
  }, [q, reponse, fin, mettreEnScene]);

  useEffect(() => {
    if (q?.reponse === "ecrit" && !reponse) champ.current?.focus();
  }, [q, reponse]);

  /* ---------- Répondre ---------- */

  const repondre = useCallback(
    (r: Reponse) => {
      if (!q || reponse || fin) return;
      setReponse(r);
      const juste = r.verdict !== "faux";
      const base = q.reponse === "qcm" ? (q.options.length === 2 ? 6 : 10) : 15;
      const gain = juste ? Math.round(base * (r.verdict === "presque" ? 0.7 : 1)) + Math.min(10, serie * 2) : 0;
      const sujet = q.type === "intrus" || q.type === "vrai-faux" ? "" : q.cible;
      noterReponse(sujet, juste, gain);
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
      const bon = PAR_ID.get(q.attendu);
      if (bon) dire(bon.nom);
    },
    [q, reponse, fin, serie, lancement.sorte],
  );

  // Toucher le corps : pour « situer », c'est la réponse.
  useEffect(() => {
    stage.surChoix((s) => {
      if (!q || reponse || fin || q.reponse !== "clic") return;
      if (!s) return;
      repondre({ verdict: s.element === q.attendu ? "juste" : "faux", touche: s.element === q.attendu ? undefined : s.element, texte: PAR_ID.get(s.element)?.nom });
    });
    return () => stage.surChoix(null);
  }, [stage, q, reponse, fin, repondre]);

  /* ---------- La suite, la fin ---------- */

  const terminer = useCallback(
    (raison: "fini" | "coeurs" | "temps") => {
      const duree = Math.round((Date.now() - debut.current) / 1000);
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
      } else {
        if (lancement.sorte === "defi") battreRecord(`defi:${lancement.jour}`, Math.max(1, bonnes));
        setFin({ titre: lancement.sorte === "defi" ? `Défi : ${bonnes}/${questions.length}` : `${bonnes}/${questions.length} justes`, reussi: true });
        ressentir("niveau");
        noterJournal({ s: lancement.sorte, n: lancement.titre, b: bonnes, q: questions.length, x: xp });
      }
      void duree;
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
      if (suite) setQuestions((l) => [...l, suite]);
    }
    setReponse(null);
    setEcrit("");
    setIndice(false);
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

  // Le clavier : 1 à 4 pour choisir, Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement && ev.key !== "Enter") return;
      if (ev.key === "Escape") return fermer();
      if (fin) return;
      if (reponse && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        return suivante();
      }
      if (!reponse && q?.reponse === "qcm") {
        const n = Number(ev.key);
        if (n >= 1 && n <= q.options.length) {
          const o = q.options[n - 1];
          repondre({ verdict: o.id === q.attendu ? "juste" : "faux", choisi: o.id, texte: o.texte });
        }
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fin, reponse, q, suivante, repondre, fermer]);

  /* ---------- L'affichage ---------- */

  if (fin) return <Bilan lancement={lancement} fin={fin} bonnes={bonnes} total={total} xp={xp} manquees={manquees} fermer={fermer} relancer={relancer} stage={stage} />;
  if (!q)
    return (
      <div className="ec-partie">
        <p className="ec-note">Préparation des questions…</p>
      </div>
    );

  const bon = PAR_ID.get(q.attendu);
  const sujet = PAR_ID.get(q.cible);
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
      <h2 className="ec-consigne">{q.consigne}</h2>
      {q.indice && (
        <p className={`ec-indice ${q.type === "latin" ? "est-latin" : ""}`} lang={q.type === "latin" ? "la" : q.type === "anglais" ? "en" : undefined}>
          {q.indice}
        </p>
      )}

      {q.reponse === "qcm" && (
        <div className={`ec-options ${q.options.length === 2 ? "est-binaire" : ""}`} role="group" aria-label="Les réponses">
          {q.options.map((o, k) => {
            const etat = reponse ? (o.id === q.attendu ? "juste" : o.id === reponse.choisi ? "faux" : "neutre") : undefined;
            return (
              <button
                key={o.id}
                type="button"
                className={`ec-option ${o.latin ? "est-latin" : ""}`}
                data-etat={etat}
                disabled={Boolean(reponse)}
                onClick={() => repondre({ verdict: o.id === q.attendu ? "juste" : "faux", choisi: o.id, texte: o.texte })}
              >
                <kbd aria-hidden="true">{k + 1}</kbd>
                <span lang={o.latin ? "la" : undefined}>{o.texte}</span>
                {etat === "juste" && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
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

      {q.reponse === "clic" && !reponse && (
        <div className="ec-situer">
          <p className="ec-note">Fais tourner le corps, rapproche-toi, puis touche la bonne structure.</p>
          <button type="button" className="ec-bouton est-discret" onClick={() => repondre({ verdict: "faux", texte: "" })}>
            Je ne sais pas
          </button>
        </div>
      )}

      {reponse && (
        <div className="ec-verdict" data-verdict={reponse.verdict}>
          <p className="ec-verdict-titre">
            {reponse.verdict === "juste" ? "Juste." : reponse.verdict === "presque" ? "Presque : c'est bien cela, à une lettre près." : q.reponse === "clic" && reponse.touche && PAR_ID.has(reponse.touche) ? `Non : tu as touché ${article(PAR_ID.get(reponse.touche)!)}.` : "Non."}
          </p>
          {bon && <Cartel e={bon} complet={lancement.sorte !== "eclair"} latin={p.latin} />}
          {sujet && bon && sujet.id !== bon.id && q.type !== "intrus" && <p className="ec-note">La question portait sur : {sujet.nom}.</p>}
          {lancement.sorte !== "eclair" && (
            <button type="button" className="ec-bouton est-plein est-grand" onClick={suivante} autoFocus>
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
  fermer,
  relancer,
  stage,
}: {
  lancement: Lancement;
  fin: { titre: string; etoiles?: number; record?: boolean; reussi: boolean };
  bonnes: number;
  total: number | null;
  xp: number;
  manquees: string[];
  fermer: () => void;
  relancer: (l: Lancement) => void;
  stage: Stage;
}) {
  const suivant =
    lancement.sorte === "niveau" && fin.reussi && lancement.n < niveauxDe(lancement.categorie).length
      ? ({ ...lancement, n: lancement.n + 1, titre: `${CATEGORIES[lancement.categorie].nom} · Planche ${romain(lancement.n + 1)}`, methode: null, revision: [] } as Lancement)
      : null;
  return (
    <div className="ec-bilan">
      <p className="ec-methode">{lancement.titre}</p>
      <h2 className="ec-bilan-titre">{fin.titre}</h2>
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
        <button type="button" className="ec-bouton" onClick={() => relancer(lancement)}>
          <RotateCcw size={15} aria-hidden="true" /> Rejouer
        </button>
        <button type="button" className="ec-bouton est-discret" onClick={fermer}>
          Retour
        </button>
      </div>
    </div>
  );
}
