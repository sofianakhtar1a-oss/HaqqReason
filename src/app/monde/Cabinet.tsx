"use client";

import { ArrowLeft, ArrowRight, Check, Lock, PenLine, RotateCcw, Sailboat, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat, pluieDeLettres } from "@/lib/langues/feux";
import { bonneReponseCabinet, cabinet, CABINETS, detailElement, element, elementsAvant, jugerCabinet, libelleMethode, METHODES, methodesDe, methodesDuNiveau, niveauxCabinet, nombreNiveaux, partieCabinet, type QuestionCabinet, resumeElement, texteOption, texteParleCabinet, urlEmbleme } from "@/lib/monde/cabinets";
import { envoyerReponse } from "@/lib/monde/compte-client";
import { nouvelleGraine } from "@/lib/monde/hasard";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { COEURS } from "@/lib/monde/niveaux";
import { baseCabinet, gainDe } from "@/lib/monde/points";
import { aReviserCabinet, type Bilan, boiteCabinet, etoilesCabinet, finirNiveauCabinet, niveauCourantCabinet, niveauOuvertCabinet, niveauxReussisCabinet, noterCabinet, noterJournal, useMonde } from "@/lib/monde/progression";
import type { Jugement } from "@/lib/monde/texte";
import type { CabinetId, DonneesCabinet, ElementCabinet, MethodeCabinet } from "@/lib/monde/types";
import { dire, taire } from "@/lib/monde/voix";
import { BoutonVoix, Chrono, Coeurs, Etoiles } from "./communs";
import { Drapeau } from "./figures";
import type { Lancement } from "./Partie";
import { ressentir } from "./sons";
import { traduire } from "./traduction";

/*
 * Les cabinets du Portulan : les pays vus de l'intérieur. Une carte par cabinet à l'accueil,
 * un écran par cabinet (sa route, ses méthodes, tous ses éléments à apprendre), et la partie,
 * en plein écran, sur le modèle de celle des pays : trois cœurs, un chrono, des étoiles.
 */

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** L'emblème d'un cabinet : le drapeau du pays, ou celui de l'organisation. */
/** La lecture d'une question de cabinet en anglais ou en arabe : la consigne traduite, les noms tels quels. */
function texteParleCabinetTraduit(q: QuestionCabinet, l: "en" | "ar"): string {
  const c = cabinet(q.cabinet);
  const e = element(q.cabinet, q.cible)!;
  const def = METHODES[q.methode];
  const t = (s: string) => traduire(s, l) ?? s;
  const montre = def.invite === "nom" ? e.nom : def.invite === "chef" ? (e.chef ?? "") : def.invite === "num" ? `${l === "en" ? "number" : "الرقم"} ${e.num}` : def.invite === "ville" ? (q.ville ?? "") : "";
  const textes = def.reponse === "ecrit" || def.reponse === "drapeau" ? [] : q.options.map((id) => t(texteOption(q, id)));
  const choix = textes.length ? ` ${l === "en" ? "Choices" : "الخيارات"}: ${textes.join(l === "en" ? ", " : "، ")}.` : "";
  return `${t(c.consignes[q.methode] ?? "")} ${montre}.${choix}`;
}

export function EmblemeCabinet({ c, grand = false }: { c: DonneesCabinet; grand?: boolean }) {
  if (!c.embleme) return <Drapeau code={c.pays} grand={grand} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={urlEmbleme(c.embleme)} alt={`Drapeau : ${c.court}`} className="pt-drapeau" data-grand={grand || undefined} draggable={false} decoding="async" />;
}

/** Le drapeau d'un élément (un État, une province, une organisation), à son propre format. */
export function DrapeauElement({ e, nomme = true, grand = false }: { e: ElementCabinet; nomme?: boolean; grand?: boolean }) {
  if (!e.drapeau) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urlEmbleme(e.drapeau)}
      alt={nomme ? `Drapeau : ${e.nom}` : "Drapeau à reconnaître"}
      className="pt-drapeau pt-embleme"
      data-grand={grand || undefined}
      style={{ "--rapport": e.rapport ?? 1.5 } as React.CSSProperties}
      draggable={false}
      decoding="async"
      loading={grand ? "eager" : "lazy"}
    />
  );
}

export function maitriseCabinet(monde: ReturnType<typeof useMonde>, c: DonneesCabinet) {
  const sus = c.elements.filter((e) => boiteCabinet(monde, c.id, e.id) >= 3).length;
  return { sus, total: c.elements.length };
}

/* ---------- La carte d'un cabinet, à l'accueil ---------- */

export function CartoucheCabinet({ c, i, onOuvrir }: { c: DonneesCabinet; i: number; onOuvrir: () => void }) {
  const monde = useMonde();
  const total = niveauxCabinet(c).length;
  const m = maitriseCabinet(monde, c);
  const faits = niveauxReussisCabinet(monde, c.id, total);
  const courant = niveauCourantCabinet(monde, c.id, total);
  const pourcent = m.total ? Math.round((m.sus / m.total) * 100) : 0;
  return (
    <button type="button" className="pt-cartouche pt-cartouche-cabinet" data-cabinet={c.id} style={{ "--i": i, "--part": pourcent / 100 } as React.CSSProperties} onClick={onOuvrir}>
      <span className="pt-cartouche-cadre" aria-hidden="true" />
      <span className="pt-cartouche-tete">
        <span className="pt-cartouche-embleme" aria-hidden="true">
          <EmblemeCabinet c={c} />
        </span>
        <span className="pt-anneau" role="img" aria-label={`${pourcent} % maîtrisé`}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" className="pt-anneau-fond" />
            <circle cx="18" cy="18" r="15.5" className="pt-anneau-plein" pathLength={100} />
          </svg>
          <span className="tabular-nums">{pourcent}%</span>
        </span>
      </span>
      <span className="pt-cartouche-nom">{c.court}</span>
      <span className="pt-cartouche-texte">{c.texte}</span>
      <span className="pt-cartouche-pied">
        <span>
          Niveau {courant} sur {total}
        </span>
        <span className="pt-piste" aria-label={`${faits} niveaux réussis sur ${total}`}>
          {Array.from({ length: total }, (_, k) => (
            <span key={k} data-fait={k < faits || undefined} data-courant={k === courant - 1 || undefined} />
          ))}
        </span>
      </span>
    </button>
  );
}

/* ---------- L'écran d'un cabinet ---------- */

const apercu = (e: ElementCabinet) => (e.num ? `${e.num} ${e.nom}` : e.nom);

export function EcranCabinet({ id, onRetour, lancer }: { id: CabinetId; onRetour: () => void; lancer: (l: Lancement) => void }) {
  const c = cabinet(id);
  const monde = useMonde();
  const [methode, setMethode] = useState<MethodeCabinet | null>(null);
  const niveaux = niveauxCabinet(c);
  const total = niveaux.length;
  const courant = niveauCourantCabinet(monde, id, total);
  const m = maitriseCabinet(monde, c);
  const record = monde.records[`nomme:cabinet:${id}`] ?? 0;
  const nommable = id !== "drapeaux-plus";

  return (
    <div className="pt-categorie pt-cabinet" data-cabinet={id}>
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-categorie-tete">
        <span className="pt-cabinet-embleme" aria-hidden="true">
          <EmblemeCabinet c={c} />
        </span>
        <div>
          <h2 className="pt-titre">{c.nom}</h2>
          <p className="pt-chapo">{c.texte}</p>
          <p className="pt-maitrise">
            <span className="pt-maitrise-barre" aria-hidden="true">
              <span style={{ transform: `scaleX(${m.total ? m.sus / m.total : 0})` }} />
            </span>
            <span className="tabular-nums">
              {m.sus} sur {m.total} maîtrisés
            </span>
          </p>
        </div>
      </header>

      {c.avertissement && <p className="pt-cabinet-note">{c.avertissement}</p>}

      <fieldset className="pt-methodes">
        <legend>Méthode</legend>
        <button type="button" className="pt-puce" aria-pressed={methode === null} onClick={() => setMethode(null)}>
          Mélange (recommandé)
        </button>
        {methodesDe(c).map((x) => (
          <button key={x} type="button" className="pt-puce" aria-pressed={methode === x} onClick={() => setMethode(x)}>
            {libelleMethode(c, x)}
          </button>
        ))}
      </fieldset>

      {nommable && (
        <div className="pt-cabinet-defi">
          <button type="button" className="bouton bouton-discret" onClick={() => lancer({ cle: `${Date.now()}`, sorte: "nomme", liste: `cabinet:${id}`, titre: `Nomme tous les ${c.mots.unites}` })}>
            <PenLine className="size-4" aria-hidden="true" />
            Nomme-les tous
          </button>
          <span className="pt-cabinet-record">{record ? `Record : ${record} sur ${c.elements.length}` : `Les ${c.elements.length}, de mémoire, contre la montre.`}</span>
        </div>
      )}

      <ol className="pt-route" aria-label={`Les ${total} niveaux`}>
        {niveaux.map((liste, i) => {
          const n = i + 1;
          const ouvert = niveauOuvertCabinet(monde, id, n);
          const e = etoilesCabinet(monde, id, n);
          const fait = Boolean(monde.cabinets[id]?.n[n]?.f);
          const bornes = liste[0]?.num && liste.at(-1)?.num ? `${liste[0].num} à ${liste.at(-1)!.num}` : null;
          return (
            <li key={n} className="pt-escale" data-ouvert={ouvert || undefined} data-fait={fait || undefined} data-courant={n === courant || undefined} style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                className="pt-escale-bouton"
                disabled={!ouvert}
                onClick={() => lancer({ cle: `${Date.now()}`, sorte: "cabinet", cabinet: id, niveau: n, methodeCabinet: methode, titre: `${c.court} · niveau ${n}` })}
                aria-label={`Niveau ${n}${ouvert ? (fait ? `, ${e} étoile${e > 1 ? "s" : ""}` : ", à jouer") : ", verrouillé"}`}
              >
                <span className="pt-escale-medaille" aria-hidden="true">
                  {n === courant && ouvert ? <Sailboat className="size-5" /> : ouvert ? n : <Lock className="size-4" />}
                </span>
                <span className="pt-escale-corps">
                  <span className="pt-escale-grade">
                    <span className="pt-escale-num">Niveau {n}</span>
                    {bornes ? ` ${bornes}` : ""}
                    {n > 5 && <MarquePremium fonction="portulan.niveaux-avances" compacte />}
                  </span>
                  <span className="pt-escale-pays">
                    {liste.slice(0, 3).map(apercu).join(", ")}
                    {liste.length > 3 ? ` et ${liste.length - 3} autres` : ""}
                  </span>
                  <span className="pt-escale-regles">
                    {methodesDuNiveau(c, n).some((x) => METHODES[x].reponse === "ecrit") ? "À écrire aussi, " : ""}
                    {COEURS} cœurs
                  </span>
                </span>
                <Etoiles n={e} />
              </button>
            </li>
          );
        })}
      </ol>

      <section className="pt-cabinet-tout" aria-labelledby="pt-cabinet-tout">
        <h3 id="pt-cabinet-tout" className="pt-sous-titre">
          Tout le cabinet
        </h3>
        <p className="pt-sous-chapo">Les {c.elements.length} {c.mots.unites}, pour les découvrir avant de jouer. Ceux que tu maîtrises sont dorés.</p>
        <ul className="pt-cabinet-liste">
          {[...c.elements]
            .sort((a, b) => a.rang - b.rang)
            .map((e) => (
              <li key={e.id} data-su={boiteCabinet(monde, id, e.id) >= 3 || undefined}>
                {e.num && <span className="pt-plaque pt-plaque-petite">{e.num}</span>}
                {e.drapeau && <DrapeauElement e={e} />}
                <span className="pt-cabinet-element">
                  <strong>{e.nom}</strong>
                  {(e.chef || e.groupe) && (
                    <span>
                      {e.chef ? e.chef : ""}
                      {e.chef && e.groupe ? ", " : ""}
                      {e.groupe ? c.groupes?.[e.groupe] : ""}
                    </span>
                  )}
                  {e.note && <span className="pt-cabinet-element-note">{e.note}</span>}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- La partie ---------- */

type Rate = { q: QuestionCabinet; reponse: string };


export function PartieCabinet({ lancement, onFermer, onRejouer }: { lancement: Lancement; onFermer: () => void; onRejouer: (l: Lancement) => void }) {
  const monde = useMonde();
  const id = lancement.cabinet!;
  const c = cabinet(id);
  const niveau = lancement.niveau ?? 1;
  const total = nombreNiveaux(id);
  const [questions] = useState<QuestionCabinet[]>(() => {
    const revision = niveau > 1 ? aReviserCabinet(monde, id, elementsAvant(id, niveau), 3) : [];
    return partieCabinet({ cabinet: id, niveau, graine: nouvelleGraine(), methode: lancement.methodeCabinet ?? null, revision });
  });
  const [phase, setPhase] = useState<"intro" | "question" | "reponse" | "fin">("intro");
  const [index, setIndex] = useState(0);
  const [coeurs, setCoeurs] = useState(COEURS);
  const [brise, setBrise] = useState<number | null>(null);
  const [bonnes, setBonnes] = useState(0);
  const [fautes, setFautes] = useState(0);
  const [xp, setXp] = useState(0);
  const [choix, setChoix] = useState<string | null>(null);
  const [jugement, setJugement] = useState<Jugement | null>(null);
  const [ecrit, setEcrit] = useState("");
  const [rates, setRates] = useState<Rate[]>([]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);

  const q = questions[index] as QuestionCabinet | undefined;
  const def = q ? METHODES[q.methode] : null;
  // Le temps d'une question : plus court dans la seconde moitié de la route, plus long pour écrire.
  const duree = ((niveau <= Math.ceil(total / 2) ? 18_000 : 14_000) + (def?.reponse === "ecrit" ? 10_000 : 0)) * (monde.profil.plusDeTemps ? 2 : 1);
  // Pour le journal de bord : l'XP gagnée et l'heure du départ.
  const xpTotal = useRef(0);
  const debutJeu = useRef(0);
  const avecChrono = monde.profil.chrono;

  const terminer = useCallback(
    (r: { bonnes: number; fautes: number; coeurs: number }) => {
      setPhase("fin");
      const reussi = r.coeurs > 0;
      const b = finirNiveauCabinet(lancement.cabinet!, lancement.niveau ?? 1, { bonnes: r.bonnes, fautes: r.fautes, reussi });
      setBilan(b);
      if (reussi && !mouvementReduit()) setTimeout(() => pluieDeLettres(document.querySelector(".pt-fin-titre"), b.etoiles === 3 ? "aurore" : "ambre", cabinet(lancement.cabinet!).court), 380);
      noterJournal({ s: "cabinet", n: lancement.titre, b: r.bonnes, q: r.bonnes + r.fautes, x: xpTotal.current, d: debutJeu.current ? (Date.now() - debutJeu.current) / 1000 : 0, e: b.etoiles });
      ressentir(reussi ? "niveau" : "defaite");
    },
    [lancement],
  );

  const suivant = useCallback(() => {
    setBrise(null);
    if (coeurs <= 0 || index + 1 >= questions.length) {
      terminer({ bonnes, fautes, coeurs });
      return;
    }
    setIndex((i) => i + 1);
    setChoix(null);
    setJugement(null);
    setEcrit("");
    setPhase("question");
  }, [bonnes, coeurs, fautes, index, questions.length, terminer]);

  const repondre = useCallback(
    (reponse: string, ou?: { x: number; y: number }) => {
      if (!q || phase !== "question") return;
      const j = jugerCabinet(id, q.methode, q.cible, reponse);
      const juste = j !== "faux";
      setChoix(reponse);
      setJugement(j);
      setPhase("reponse");
      ressentir(j === "juste" ? "juste" : j === "presque" ? "presque" : "faux");
      const gain = gainDe(j, baseCabinet(q.methode, q.nb));
      noterCabinet(id, q.cible, juste, gain);
      envoyerReponse({ cabinet: id, type: q.methode, cible: q.cible, reponse, nb: q.nb });
      if (juste) {
        setBonnes((b) => b + 1);
        setXp((x) => x + gain);
        xpTotal.current += gain;
        if (ou && !mouvementReduit()) eclat(ou.x, ou.y, j === "juste" ? "ambre" : "azur", 1.1);
      } else {
        setFautes((f) => f + 1);
        setRates((l) => [...l, { q, reponse }]);
        setBrise(coeurs - 1);
        setCoeurs((x) => x - 1);
      }
    },
    [coeurs, id, phase, q],
  );

  // Après une bonne réponse, on passe tout seul ; après une erreur, on laisse le temps de lire.
  useEffect(() => {
    if (phase !== "reponse") return;
    const juste = jugement !== "faux";
    const attente = juste ? (jugement === "presque" ? 1700 : 950) : coeurs <= 0 ? 2200 : null;
    if (attente === null) return;
    const t = setTimeout(suivant, attente);
    return () => clearTimeout(t);
  }, [phase, jugement, suivant, coeurs]);

  // Le chrono.
  useEffect(() => {
    if (phase !== "question" || !avecChrono) return;
    const t = setTimeout(() => repondre("__temps__"), duree);
    return () => clearTimeout(t);
  }, [phase, avecChrono, duree, index, repondre]);

  // La voix lit la question (dans la langue de l'interface) ; le champ prend le focus.
  const langue = monde.profil.langue;
  useEffect(() => {
    if (phase !== "question" || !q) return;
    if (def?.reponse === "ecrit") champ.current?.focus();
    if (monde.profil.voix) void dire(langue === "fr" ? texteParleCabinet(q) : texteParleCabinetTraduit(q, langue), langue);
  }, [phase, q, def, monde.profil.voix, langue]);
  useEffect(() => {
    if (phase === "fin") taire();
  }, [phase]);
  useEffect(() => () => taire(), []);

  // Le clavier : 1 à 4 pour choisir, Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") return onFermer();
      if (phase === "reponse" && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        return suivant();
      }
      if (phase !== "question" || !q || !q.options.length || (ev.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(ev.key);
      if (n >= 1 && n <= q.options.length) {
        const r = zone.current?.querySelectorAll("button")[n - 1]?.getBoundingClientRect();
        repondre(q.options[n - 1], r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [phase, q, repondre, suivant, onFermer]);

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  const e = q ? element(id, q.cible) : undefined;
  const contenu = (
    <div className="pt pt-partie" data-accent="safran" data-globe={monde.profil.globe} data-phase={phase} data-concentration={monde.profil.concentration || undefined} role="dialog" aria-modal="true" aria-label={lancement.titre}>
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-partie-tete">
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Quitter la partie">
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pt-partie-route" aria-label={`Question ${Math.min(index + 1, questions.length)} sur ${questions.length}`}>
          <span className="pt-route-trait" aria-hidden="true">
            <span className="pt-route-fait" style={{ transform: `scaleX(${(index + (phase === "reponse" || phase === "fin" ? 1 : 0)) / Math.max(1, questions.length)})` }} />
          </span>
          <span className="pt-route-compte tabular-nums">
            {Math.min(index + 1, questions.length)}/{questions.length}
          </span>
        </div>
        <BoutonVoix />
        <Coeurs restants={coeurs} total={COEURS} brise={brise} />
        {avecChrono && phase === "question" && q && <Chrono key={index} duree={duree} cle={`${index}`} />}
      </header>

      {phase === "intro" && (
        <div className="pt-intro">
          <p className="pt-intro-grade">
            Niveau {niveau} sur {total}
          </p>
          <h2 className="pt-intro-titre">{c.nom}</h2>
          <p className="pt-intro-regles">
            {questions.length} questions, {COEURS} cœurs{avecChrono ? " et un chrono pour chaque question" : ""}.
          </p>
          <button
            type="button"
            className="bouton bouton-principal pt-intro-go"
            onClick={() => {
              debutJeu.current = Date.now();
              setPhase("question");
            }}
            autoFocus
            disabled={!questions.length}
          >
            C&apos;est parti
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(phase === "question" || phase === "reponse") && q && def && e && (
        <div className="pt-question" key={index}>
          <p className="pt-consigne">{c.consignes[q.methode]}</p>
          <div className="pt-invite" data-sorte={def.invite}>
            {def.invite === "drapeau" ? (
              <DrapeauElement e={e} nomme={false} grand />
            ) : def.invite === "num" ? (
              <div className="pt-invite-texte">
                <span className="pt-invite-etiquette">{majuscule(c.mots.num ?? "numéro")}</span>
                <span className="pt-plaque">{e.num}</span>
              </div>
            ) : (
              <div className="pt-invite-texte">
                <span className="pt-invite-etiquette">{def.invite === "chef" ? majuscule(c.mots.chef ?? "capitale") : def.invite === "ville" ? "Ville" : majuscule(c.mots.unite)}</span>
                <span className="pt-nom-grand">{def.invite === "chef" ? e.chef : def.invite === "ville" ? q.ville : e.nom}</span>
              </div>
            )}
          </div>

          {def.reponse === "ecrit" ? (
            <form
              className="pt-ecrit"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (ecrit.trim()) repondre(ecrit.trim());
              }}
            >
              <input
                ref={champ}
                value={ecrit}
                onChange={(ev) => setEcrit(ev.target.value)}
                disabled={phase !== "question"}
                placeholder={def.ecrit === "num" ? "Le numéro…" : def.ecrit === "chef" ? `${majuscule(c.mots.chef ?? "capitale")}…` : "Le nom…"}
                aria-label={def.ecrit === "num" ? "Écris le numéro" : def.ecrit === "chef" ? `Écris ${c.mots.chef === "chef-lieu" ? "le chef-lieu" : `la ${c.mots.chef}`}` : "Écris le nom"}
                inputMode={def.ecrit === "num" ? "text" : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                data-etat={phase === "reponse" ? (jugement ?? undefined) : undefined}
              />
              <button type="submit" className="bouton bouton-principal" disabled={phase !== "question" || !ecrit.trim()}>
                Valider
              </button>
            </form>
          ) : (
            <div ref={zone} className="pt-choix" data-sorte={def.reponse === "drapeau" ? "drapeau" : def.reponse === "chef" ? "capitale" : "nom"} data-nb={q.options.length}>
              {q.options.map((o, i) => {
                const attendu = jugerCabinet(id, q.methode, q.cible, o) !== "faux";
                const etat = phase === "reponse" ? (o === choix ? (jugement === "faux" ? "faux" : "juste") : attendu ? "attendu" : undefined) : undefined;
                const el = def.reponse === "drapeau" ? element(id, o) : undefined;
                return (
                  <button
                    key={o}
                    type="button"
                    className="pt-option"
                    data-etat={etat}
                    disabled={phase !== "question"}
                    style={{ "--i": i } as React.CSSProperties}
                    onClick={(ev) => {
                      const r = ev.currentTarget.getBoundingClientRect();
                      repondre(o, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
                    }}
                    aria-label={el ? `Drapeau ${i + 1}` : undefined}
                  >
                    <span className="pt-option-touche" aria-hidden="true">
                      {i + 1}
                    </span>
                    {el ? <DrapeauElement e={el} nomme={false} /> : <span className="pt-option-texte">{texteOption(q, o)}</span>}
                    {etat === "juste" || etat === "attendu" ? <Check className="pt-option-signe" aria-hidden="true" /> : etat === "faux" ? <X className="pt-option-signe" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          )}

          {phase === "reponse" && (
            <div className="pt-retour" data-jugement={jugement ?? "faux"} role="status">
              <div className="pt-retour-texte">
                {jugement === "juste" ? (
                  <strong>Exact ! {gainDe("juste", baseCabinet(q.methode, q.nb)) ? `+${gainDe("juste", baseCabinet(q.methode, q.nb))} XP` : ""}</strong>
                ) : jugement === "presque" ? (
                  <strong>Presque ! On écrit « {def.ecrit === "chef" ? e.chef : e.nom} »</strong>
                ) : (
                  <strong>
                    {choix === "__temps__" ? "Temps écoulé." : "Ce n'est pas ça."} C&apos;était : {bonneReponseCabinet(q)}
                  </strong>
                )}
                {jugement === "faux" && (e.groupe || e.note) && (
                  <span className="pt-retour-fiche">
                    {e.groupe ? resumeElement(id, q.cible) : ""}
                    {e.groupe && e.note ? " " : ""}
                    {e.note ?? ""}
                  </span>
                )}
              </div>
              {jugement === "faux" && coeurs > 0 && (
                <button type="button" className="bouton bouton-principal" onClick={suivant} autoFocus>
                  Continuer
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "fin" && (
        <FinCabinet
          lancement={lancement}
          c={c}
          niveau={niveau}
          total={total}
          bonnes={bonnes}
          nombre={questions.length}
          fautes={fautes}
          coeurs={coeurs}
          xp={xp}
          bilan={bilan}
          rates={rates}
          onFermer={onFermer}
          onRejouer={onRejouer}
        />
      )}
    </div>
  );
  return createPortal(contenu, document.body);
}

function FinCabinet({
  lancement,
  c,
  niveau,
  total,
  bonnes,
  nombre,
  fautes,
  coeurs,
  xp,
  bilan,
  rates,
  onFermer,
  onRejouer,
}: {
  lancement: Lancement;
  c: DonneesCabinet;
  niveau: number;
  total: number;
  bonnes: number;
  nombre: number;
  fautes: number;
  coeurs: number;
  xp: number;
  bilan: Bilan | null;
  rates: Rate[];
  onFermer: () => void;
  onRejouer: (l: Lancement) => void;
}) {
  const reussi = coeurs > 0;
  const titre = reussi ? (bilan?.etoiles === 3 ? "Sans une faute !" : "Niveau réussi") : "Naufrage…";
  const sous = reussi ? `${bonnes} bonnes réponses sur ${nombre}` : `Les cœurs sont épuisés. Revois les ${c.mots.unites} manqués ci-dessous, puis reprends la mer.`;
  const suivantPossible = reussi && niveau < total;
  const uniques = useMemo(() => [...new Map(rates.map((r) => [r.q.cible, r])).values()], [rates]);
  return (
    <div className="pt-fin" data-reussi={reussi || undefined}>
      <Etoiles n={bilan?.etoiles ?? 0} taille="grande" animees />
      <h2 className="pt-fin-titre">{titre}</h2>
      <p className="pt-fin-sous">{sous}</p>
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
      </dl>
      <div className="pt-fin-actions">
        {suivantPossible && (
          <button type="button" className="bouton bouton-principal" onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}`, niveau: niveau + 1, titre: `${c.court} · niveau ${niveau + 1}` })}>
            Niveau suivant
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" className={`bouton ${suivantPossible ? "bouton-discret" : "bouton-principal"}`} onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}` })}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Rejouer
        </button>
        <button type="button" className="bouton bouton-discret" onClick={onFermer}>
          Fermer
        </button>
      </div>
      {uniques.length > 0 && (
        <section className="pt-fin-rates" aria-label="À revoir">
          <h3>À revoir</h3>
          <ul>
            {uniques.map(({ q }) => {
              const e = element(c.id, q.cible)!;
              return (
                <li key={q.cible}>
                  {e.drapeau ? <DrapeauElement e={e} /> : e.num ? <span className="pt-plaque pt-plaque-petite">{e.num}</span> : <EmblemeCabinet c={c} />}
                  <span>
                    <strong>{e.nom}</strong>
                    <span>{detailElement(c.id, e.id)}</span>
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

export const IDS_CABINETS = CABINETS.map((c) => c.id);
