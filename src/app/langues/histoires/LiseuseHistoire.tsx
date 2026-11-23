"use client";

import { ArrowLeft, ArrowRight, BookmarkCheck, BookmarkPlus, CircleHelp, Languages, LoaderCircle, Minus, Plus, Square, Turtle, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Analyse, Phrase } from "@/lib/alambic/transcription/types";
import { idMot, nouveauMot } from "@/lib/langues/dictionnaire";
import { chargerHistoire, ficheHistoire, HISTOIRES, type Histoire, type PhraseHistoire } from "@/lib/langues/histoires/catalogue";
import { noterFin, noterPage, noterQuiz, useLectures, valeurLocale } from "@/lib/langues/histoires/progression";
import { motsDe, NATURES_GLOSE } from "@/lib/langues/histoires/texte";
import type { OrigineMot } from "@/lib/langues/types";
import { parler, taire, voixDisponible } from "@/lib/langues/voix";
import type { Cible } from "../../alambic/transcription/Glose";
import { ajouterMot, useDonnees } from "../donnees";
import { GloseMot } from "../GloseMot";
import { BilanSerie, type Item, type Reponse, SerieVue } from "../regles/Exercices";
import { Couverture } from "./Bibliotheque";
import "../regles/regles.css";
import "./histoires.css";

/*
 * La liseuse d'histoires : le texte anglais page par page, chaque mot traduit d'un toucher (tout est préparé
 * d'avance : aucune attente), la traduction de chaque paragraphe à la demande, la lecture à voix haute avec
 * la phrase lue mise en valeur, les mots de la page à garder, puis les questions de compréhension.
 */

const TAILLES = [0.9, 1, 1.12, 1.25, 1.4];
const REGLAGES = "haqqreason-histoires-reglages";
type Reglages = { taille: number; bilingue: boolean; lent: boolean };

function lireReglages(): Reglages {
  try {
    const r = JSON.parse(localStorage.getItem(REGLAGES) ?? "null") as Partial<Reglages> | null;
    return { taille: TAILLES.includes(r?.taille ?? 1) ? (r?.taille ?? 1) : 1, bilingue: Boolean(r?.bilingue), lent: Boolean(r?.lent) };
  } catch {
    return { taille: 1, bilingue: false, lent: false };
  }
}

type Vue = "lecture" | "questions" | "bilan";

export function LiseuseHistoire({ id, onFermer, onOuvrir }: { id: string; onFermer: () => void; onOuvrir: (id: string) => void }) {
  const fiche = ficheHistoire(id);
  const [h, setH] = useState<Histoire | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);
  const [page, setPage] = useState(() => Math.max(0, (valeurLocale(id)?.page ?? 1) - 1));
  const [vue, setVue] = useState<Vue>("lecture");
  const [glose, setGlose] = useState<Cible | null>(null);
  const [tactile, setTactile] = useState(false);
  const [reglages, setReglages] = useState<Reglages>(lireReglages);
  const [lue, setLue] = useState<number | null>(null);
  const [lecture, setLecture] = useState(false);
  const [reponses, setReponses] = useState<Reponse[] | null>(null);
  const [tour, setTour] = useState(0);
  const jeton = useRef(0);
  const haut = useRef<HTMLDivElement>(null);
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const lectures = useLectures();
  const { mots } = useDonnees();

  useEffect(() => {
    let vivant = true;
    chargerHistoire(id).then(
      (x) => {
        if (!vivant) return;
        setH(x);
        setErreur(null);
        setPage((p) => Math.min(p, x.pages.length - 1));
      },
      (e: unknown) => vivant && setErreur(e instanceof Error ? e.message : "L'histoire n'a pas pu se charger."),
    );
    return () => {
      vivant = false;
    };
  }, [id, essai]);

  const changerReglages = (r: Partial<Reglages>) =>
    setReglages((avant) => {
      const suivant = { ...avant, ...r };
      try {
        localStorage.setItem(REGLAGES, JSON.stringify(suivant));
      } catch {
        // Réglages pour cette visite seulement.
      }
      return suivant;
    });

  const arreterLecture = useCallback(() => {
    jeton.current++;
    taire();
    setLue(null);
    setLecture(false);
  }, []);
  useEffect(() => () => taire(), []);

  const total = h?.pages.length ?? fiche?.pages ?? 1;
  const allerPage = (n: number) => {
    if (!h || n < 0 || n >= h.pages.length) return;
    arreterLecture();
    setGlose(null);
    setPage(n);
    noterPage(id, n + 1);
    haut.current?.scrollIntoView({ block: "start" });
  };

  // La page affichée est notée (pour la reprise), dès l'ouverture.
  useEffect(() => {
    if (h) noterPage(id, page + 1);
  }, [h, id, page]);

  // Les flèches du clavier tournent les pages.
  useEffect(() => {
    if (vue !== "lecture") return;
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
      if (e.key === "ArrowRight") allerPage(page + 1);
      else if (e.key === "ArrowLeft") allerPage(page - 1);
      else if (e.key === "Escape") setGlose(null);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  });

  const pageCourante = h?.pages[page];
  /** Les phrases de la page, dans l'ordre (chaque phrase garde son rang dans la page). */
  const phrases = useMemo(() => (pageCourante ? pageCourante.p.flat() : []), [pageCourante]);
  const outils = useMemo(() => new Set(h?.o ?? []), [h]);

  const lireAVoixHaute = async (depuis: number) => {
    const mon = ++jeton.current;
    setGlose(null);
    setLecture(true);
    for (let k = depuis; k < phrases.length; k++) {
      if (jeton.current !== mon) return;
      setLue(k);
      document.querySelector(`[data-phrase="${k}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      await parler(phrases[k][0].replace(/[“”]/g, '"').replace(/[‘’]/g, "'"), reglages.lent ? 0.72 : 0.95);
    }
    if (jeton.current === mon) {
      setLue(null);
      setLecture(false);
    }
  };

  if (!fiche)
    return (
      <div className="hs-erreur">
        <p>Cette histoire n&apos;existe pas (ou plus).</p>
        <button type="button" className="bouton" onClick={onFermer}>
          Retour à la bibliothèque
        </button>
      </div>
    );

  const origine = (n: number): OrigineMot => ({ type: "histoire", titre: fiche.titreFr, ref: id, page: n + 1 });
  const phraseGlose = glose ? phrases[glose.phrase] : null;
  const gloseDe = (ph: PhraseHistoire, i: number) => {
    const k = ph[2][i];
    return k === null || k === undefined || !h ? null : { g: h.gloses[k], outil: outils.has(k) };
  };

  /* ---------- Les questions et le bilan ---------- */

  if (h && vue !== "lecture") {
    const items: Item[] = h.questions.map((exercice, k) => ({ ref: `histoire/${id}/q${k}`, exercice }));
    const suivantes = HISTOIRES.filter((x) => x.id !== id && !lectures[x.id]?.fini && (x.niveau === fiche.niveau || HISTOIRES.indexOf(x) > HISTOIRES.indexOf(fiche))).slice(0, 3);
    return (
      <div className="hs-liseuse rg-lecon" data-niveau={fiche.niveau}>
        <EnTete fiche={fiche} onFermer={onFermer} texte="Les questions" />
        {vue === "questions" ? (
          <>
            <div className="hs-questions-tete">
              <CircleHelp className="size-6" aria-hidden="true" />
              <div>
                <h3>As-tu tout compris ?</h3>
                <p>{items.length} questions sur l&apos;histoire. Une erreur allume un indice ; la correction suit chaque réponse.</p>
              </div>
            </div>
            <SerieVue
              key={tour}
              items={items}
              mode="guide"
              libelleFin="Voir mon résultat"
              onFini={(r) => {
                setReponses(r);
                noterQuiz(id, r.filter((x) => x.juste).length, r.length);
                noterFin(id);
                setVue("bilan");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : (
          reponses && (
            <BilanSerie
              items={items}
              reponses={reponses}
              mode="guide"
              titre={`${fiche.titre} : l'histoire est lue !`}
              onRecommencer={() => {
                setTour((t) => t + 1);
                setVue("questions");
              }}
              autres={
                <button type="button" className="bouton" onClick={() => setVue("lecture")}>
                  Relire l&apos;histoire
                </button>
              }
            />
          )
        )}
        {vue === "bilan" && suivantes.length > 0 && (
          <section className="hs-suite" aria-labelledby="titre-suite">
            <h3 id="titre-suite">Et maintenant ?</h3>
            <ul>
              {suivantes.map((x) => (
                <li key={x.id}>
                  <button type="button" className="hs-suite-carte" onClick={() => onOuvrir(x.id)}>
                    <Couverture h={x} petite />
                    <span>
                      <strong>{x.titreFr}</strong>
                      <span>
                        {x.niveau} · {x.pages} pages · {x.minutes} min
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  /* ---------- La lecture ---------- */

  const derniere = page === total - 1;
  const motsCles = h && pageCourante ? pageCourante.m.map((k) => ({ k, g: h.gloses[k] })) : [];
  const dejaGarde = (lemme: string) => mots.some((m) => m.id === idMot(lemme));
  const aGarder = motsCles.filter((m) => !dejaGarde(m.g[1]));
  /** Le rang de la première phrase de chaque paragraphe, dans la page. */
  const debuts = (pageCourante?.p ?? []).reduce<number[]>((l, para, j) => [...l, j === 0 ? 0 : l[j - 1] + (pageCourante?.p[j - 1].length ?? 0)], []);
  const garder = (k: number) => {
    if (!h) return;
    const g = h.gloses[k];
    ajouterMot(nouveauMot({ en: g[1], fr: g[3] ?? g[0], nature: NATURES_GLOSE[g[2]] }, origine(page)));
  };
  return (
    <div className="hs-liseuse" data-niveau={fiche.niveau} style={{ "--hs-taille": reglages.taille } as React.CSSProperties}>
      <div ref={haut} />
      <EnTete fiche={fiche} onFermer={onFermer} texte={`Page ${page + 1} sur ${total}`}>
        <div className="hs-outils" role="toolbar" aria-label="Réglages de lecture">
          <button type="button" className="hs-outil" aria-label="Texte plus petit" disabled={reglages.taille === TAILLES[0]} onClick={() => changerReglages({ taille: TAILLES[Math.max(0, TAILLES.indexOf(reglages.taille) - 1)] })}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="hs-outil" aria-label="Texte plus grand" disabled={reglages.taille === TAILLES[TAILLES.length - 1]} onClick={() => changerReglages({ taille: TAILLES[Math.min(TAILLES.length - 1, TAILLES.indexOf(reglages.taille) + 1)] })}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="hs-outil hs-outil-texte" aria-pressed={reglages.bilingue} onClick={() => changerReglages({ bilingue: !reglages.bilingue })}>
            <Languages className="size-4" aria-hidden="true" />
            <span>Traduction</span>
          </button>
          {voixDisponible() && (
            <>
              <button type="button" className="hs-outil hs-outil-texte" aria-pressed={lecture} onClick={() => (lecture ? arreterLecture() : void lireAVoixHaute(0))}>
                {lecture ? <Square className="size-3.5" fill="currentColor" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
                <span>{lecture ? "Arrêter" : "Écouter"}</span>
              </button>
              <button type="button" className="hs-outil" aria-pressed={reglages.lent} aria-label="Voix plus lente" title="Voix plus lente" onClick={() => changerReglages({ lent: !reglages.lent })}>
                <Turtle className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </EnTete>
      <span className="hs-avancee" style={{ "--p": `${((page + 1) / total) * 100}%` } as React.CSSProperties} aria-hidden="true" />

      {erreur ? (
        <div className="hs-erreur" role="alert">
          <p>{erreur}</p>
          <button type="button" className="bouton" onClick={() => setEssai((e) => e + 1)}>
            Réessayer
          </button>
        </div>
      ) : !h || !pageCourante ? (
        <p className="hs-charge" role="status">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          L&apos;histoire s&apos;ouvre…
        </p>
      ) : (
        <>
          {page === 0 && (
            <header className="hs-ouverture">
              <Couverture h={fiche} />
              <div>
                <h2 className="hs-ouverture-titre" lang="en">
                  {fiche.titre}
                </h2>
                <p className="hs-ouverture-fr">{fiche.titreFr}</p>
                <p className="hs-ouverture-auteur">
                  {fiche.auteur === "HaqqReason" ? "Une histoire originale du Truchement" : fiche.auteur}
                  {fiche.annee ? `, ${fiche.annee}` : ""} · niveau {fiche.niveau} · {fiche.pages} pages · {fiche.minutes} min
                </p>
                <p className="hs-ouverture-resume">{fiche.resume}</p>
                {fiche.source && <p className="hs-ouverture-source">{fiche.source}</p>}
                <p className="hs-astuce">Touche n&apos;importe quel mot : sa traduction s&apos;affiche aussitôt, avec celle de toute la phrase.</p>
              </div>
            </header>
          )}
          <article
            className="hs-page"
            lang="en"
            onPointerDown={(e) => setTactile(e.pointerType !== "mouse")}
            onClick={(e) => {
              const el = (e.target as HTMLElement).closest<HTMLElement>(".hs-mot");
              if (!el) return;
              const k = Number(el.dataset.k);
              const i = Number(el.dataset.i);
              if (glose && glose.phrase === k && glose.mot === i) return setGlose(null);
              setGlose({ phrase: k, mot: i, el, via: "toucher" });
            }}
            onTouchStart={(e) => (toucher.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              const d = toucher.current;
              toucher.current = null;
              if (!d) return;
              const dx = e.changedTouches[0].clientX - d.x;
              const dy = e.changedTouches[0].clientY - d.y;
              if (Math.abs(dx) > 80 && Math.abs(dy) < 50) allerPage(page + (dx < 0 ? 1 : -1));
            }}
          >
            {pageCourante.t && (
              <h3 className="hs-chapitre">
                <span>{pageCourante.t}</span>
                {pageCourante.tf && (
                  <span className="hs-chapitre-fr" lang="fr">
                    {pageCourante.tf}
                  </span>
                )}
              </h3>
            )}
            {pageCourante.p.map((para, j) => (
              <div key={`${page}-${j}`} className="hs-paragraphe">
                <p>
                  {para.map((ph, n) => {
                    const k = debuts[j] + n;
                    const toks = motsDe(ph[0]);
                    return (
                      <span key={k} className="hs-phrase" data-phrase={k} data-lue={lue === k || undefined}>
                        {toks.map((t, i) => (
                          <span key={i}>
                            {ph[2][i] === null || ph[2][i] === undefined ? (
                              t
                            ) : (
                              <span className="hs-mot" data-k={k} data-i={i} data-actif={(glose?.phrase === k && glose.mot === i) || undefined}>
                                {t}
                              </span>
                            )}{" "}
                          </span>
                        ))}
                      </span>
                    );
                  })}
                </p>
                {reglages.bilingue && (
                  <p className="hs-traduction" lang="fr">
                    {para.map((ph) => ph[1]).join(" ")}
                  </p>
                )}
              </div>
            ))}
          </article>

          {motsCles.length > 0 && (
            <section className="hs-mots-page" aria-labelledby="titre-mots-page">
              <div className="hs-mots-page-tete">
                <h3 id="titre-mots-page">Les mots de la page</h3>
                {aGarder.length > 1 && (
                  <button type="button" className="hs-lien" onClick={() => aGarder.forEach((m) => garder(m.k))}>
                    <BookmarkPlus className="size-4" aria-hidden="true" />
                    Tout garder ({aGarder.length})
                  </button>
                )}
              </div>
              <ul>
                {motsCles.map(({ k, g }) => {
                  const garde = dejaGarde(g[1]);
                  return (
                    <li key={k}>
                      <span lang="en" className="hs-mot-cle">
                        {g[1]}
                      </span>
                      <span className="hs-mot-sens">{g[3] ?? g[0]}</span>
                      <button type="button" className="hs-garder" disabled={garde} aria-label={garde ? `« ${g[1]} » est dans ton dictionnaire` : `Garder « ${g[1]} » dans ton dictionnaire`} onClick={() => garder(k)}>
                        {garde ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <nav className="hs-navigation" aria-label="Pages">
            <button type="button" className="bouton" disabled={page === 0} onClick={() => allerPage(page - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hs-nav-long">Page précédente</span>
              <span className="hs-nav-court">Précédente</span>
            </button>
            <span className="hs-navigation-numero">
              {page + 1} / {total}
            </span>
            {derniere ? (
              <button
                type="button"
                className="bouton bouton-principal"
                onClick={() => {
                  arreterLecture();
                  noterFin(id);
                  setVue("questions");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                J&apos;ai fini : les questions
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="bouton bouton-principal" onClick={() => allerPage(page + 1)}>
                <span className="hs-nav-long">Page suivante</span>
                <span className="hs-nav-court">Suivante</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </nav>
        </>
      )}

      {glose && phraseGlose && h && (
        <GlosePhrase
          cible={glose}
          ph={phraseGlose}
          gloseDe={gloseDe}
          origine={origine(page)}
          tactile={tactile}
          onFermer={() => setGlose(null)}
          onMot={(i, el) => setGlose({ phrase: glose.phrase, mot: i, el, via: "toucher" })}
        />
      )}
    </div>
  );
}

function EnTete({ fiche, onFermer, texte, children }: { fiche: { titre: string; niveau: string }; onFermer: () => void; texte: string; children?: React.ReactNode }) {
  return (
    <header className="hs-entete">
      <button type="button" className="hs-retour" onClick={onFermer} aria-label="Bibliothèque">
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Bibliothèque</span>
      </button>
      <p className="hs-entete-titre">
        <span className="hs-entete-niveau">{fiche.niveau}</span>
        <span lang="en" className="truncate">
          {fiche.titre}
        </span>
        <span className="hs-entete-page">{texte}</span>
      </p>
      {children}
    </header>
  );
}

/** La glose d'un mot touché : tout est déjà là, rien n'est demandé au serveur. */
function GlosePhrase({
  cible,
  ph,
  gloseDe,
  origine,
  tactile,
  onFermer,
  onMot,
}: {
  cible: Cible;
  ph: PhraseHistoire;
  gloseDe: (ph: PhraseHistoire, i: number) => { g: [string, string, string, string?]; outil: boolean } | null;
  origine: OrigineMot;
  tactile: boolean;
  onFermer: () => void;
  onMot: (i: number, el: HTMLElement) => void;
}) {
  const toks = motsDe(ph[0]);
  const phrase: Phrase = { id: cible.phrase, debut: 0, fin: 0, paragraphe: 0, mots: toks.map((t) => ({ t, d: 0, f: 0 })) };
  const analyse: Analyse = {
    traduction: ph[1],
    mots: toks.flatMap((_, i) => {
      const x = gloseDe(ph, i);
      // Un mot-outil à plusieurs sens (« la, lui ; son, sa ») garde son sens général : la phrase traduite tranche.
      const general = x?.outil && /[;,]/.test(x.g[0]);
      return x ? [{ i, sens: general ? `${x.g[0]} (selon la phrase)` : x.g[0], nature: NATURES_GLOSE[x.g[2]] || undefined, lemme: x.g[1] }] : [];
    }),
  };
  const courante = gloseDe(ph, cible.mot);
  return <GloseMot cible={cible} phrase={phrase} analyse={analyse} traduction={ph[1]} erreur={null} origine={origine} tactile={tactile} onFermer={onFermer} onMot={onMot} sensBase={courante?.g[3]} />;
}
