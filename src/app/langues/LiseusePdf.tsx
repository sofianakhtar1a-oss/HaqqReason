"use client";

import { ArrowLeft, BookmarkCheck, BookmarkPlus, Check, ChevronLeft, ChevronRight, Copy, FileUp, Languages, LoaderCircle, Minus, Plus, Volume2, X } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyserPhrase, traduireLot } from "@/lib/alambic/transcription/client";
import { type Analyse, type Phrase, texteDe } from "@/lib/alambic/transcription/types";
import { nouveauMot } from "@/lib/langues/dictionnaire";
import { type DocumentLangue, ecrire, ecrireBlob, lireBlob } from "@/lib/langues/stockage";
import { cleOriginal, OPTIONS_PDFJS } from "@/lib/langues/pdf";
import { chargerPdfjs } from "@/lib/client/pdf";
import { decouperPage, lotsDePassage, type PageDecoupee } from "@/lib/langues/texte";
import { parler, voixDisponible } from "@/lib/langues/voix";
import type { Cible } from "../alambic/transcription/Glose";
import { ajouterMot, useDonnees } from "./donnees";
import { GloseMot } from "./GloseMot";
import { PagePdfFidele } from "./PagePdfFidele";
import "@fontsource-variable/literata/opsz.css";

/*
 * La liseuse de PDF : le texte de chaque page, mis en page pour la lecture.
 * Un mot touché se traduit dans sa phrase ; un passage sélectionné se traduit en entier ;
 * la page entière peut s'afficher avec sa traduction sous chaque paragraphe.
 */

const TAILLES = [1, 1.1, 1.22, 1.36];
/** Zoom de la page d'origine, en pour cent : 100 % = la page à la largeur de la colonne de lecture. */
const CLE_ZOOM = "haqqreason-truchement-pdf-zoom";
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
/** Traduction d'une page : des lots courts, envoyés plusieurs à la fois (la page arrive bien plus vite). */
const PHRASES_PAR_LOT = 10;
const LOTS_EN_PARALLELE = 3;
const CLE = "haqqreason-truchement-pdf";
/** La vue choisie : la page telle qu'elle a été composée, ou le texte seul (mis en page pour la lecture). */
const CLE_VUE = "haqqreason-truchement-pdf-vue";

const NOM_LANGUE = { en: "Anglais", fr: "Français" } as const;
const mots = (texte: string) => texte.split(/\s+/).filter(Boolean).map((t) => ({ t, d: 0, f: 0 }));

type Selection = { texte: string; rect: { top: number; left: number; bottom: number; width: number } };
type Passage = { texte: string; traduction: string | null; erreur: string | null; rect: Selection["rect"] };

export function LiseusePdf({ document: d, onFermer }: { document: DocumentLangue; onFermer: () => void }) {
  const dernier = useRef(d);
  const { mots: dictionnaire } = useDonnees();
  // Le PDF est en anglais ou en français ; le texte affiché est le sien ou sa traduction.
  const langue: "en" | "fr" = d.langue ?? "en";
  const autre: "en" | "fr" = langue === "fr" ? "en" : "fr";
  const [affiche, setAffiche] = useState<"original" | "traduction">(d.affiche ?? "original");
  const lu: "en" | "fr" = affiche === "original" ? langue : autre;
  const regard: "en" | "fr" = lu === "fr" ? "en" : "fr";
  const [page, setPage] = useState(() => Math.min(Math.max(1, d.page || 1), d.pages.length));
  const [traductions, setTraductions] = useState(d.traductions);
  const [analyses, setAnalyses] = useState(d.analyses);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enRegard, setEnRegard] = useState(false);
  const [traductionPage, setTraductionPage] = useState<"attente" | null>(null);
  const [taille, setTaille] = useState(() => {
    try {
      return Math.min(3, Math.max(0, Number(localStorage.getItem(CLE) ?? 1)));
    } catch {
      return 1;
    }
  });
  const [glose, setGlose] = useState<Cible | null>(null);
  const [tactile, setTactile] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [copie, setCopie] = useState(false);
  const [zoomPage, setZoomPage] = useState(() => {
    try {
      const z = Number(localStorage.getItem(CLE_ZOOM));
      return z >= ZOOM_MIN && z <= ZOOM_MAX ? z : 100;
    } catch {
      return 100;
    }
  });
  // Le curseur répond tout de suite ; la page n'est redessinée qu'une fois le geste fini.
  const [zoomRendu, setZoomRendu] = useState(zoomPage);
  const pageSoumise = useRef(false);
  const [saisiePage, setSaisiePage] = useState(String(Math.min(Math.max(1, d.page || 1), d.pages.length)));
  const [vue, setVue] = useState<"page" | "texte">(() => {
    try {
      return localStorage.getItem(CLE_VUE) === "texte" ? "texte" : "page";
    } catch {
      return "page";
    }
  });
  // Le PDF d'origine, gardé sur cet appareil : sans lui, seule la vue « texte » est possible.
  const [original, setOriginal] = useState<PDFDocumentProxy | null>(null);
  const [etatOriginal, setEtatOriginal] = useState<"chargement" | "absent" | "pret" | "erreur">("chargement");
  const [rechargeOriginal, setRechargeOriginal] = useState(0);
  const texte = useRef<HTMLDivElement>(null);
  const pointeur = useRef("mouse");
  const enCours = useRef(new Set<string>());
  const annulation = useRef(new AbortController());

  const contenu = d.pages[page - 1];
  const decoupe = useMemo(() => decouperPage(contenu?.texte ?? ""), [contenu]);
  const cle = (id: number) => `${page}:${id}`;
  // Une phrase affichée en traduction a ses propres analyses (préfixe « t »).
  const cleAffichee = (id: number) => (affiche === "original" ? cle(id) : `t${page}:${id}`);
  const phrasesTraduites = useMemo<Phrase[]>(
    () => decoupe.phrases.map((p) => ({ ...p, mots: mots(traductions[`${page}:${p.id}`] ?? "") })),
    [decoupe, traductions, page],
  );
  const phrases = affiche === "original" ? decoupe.phrases : phrasesTraduites;
  /** La traduction de la phrase affichée : la traduction du PDF, ou le texte d'origine si l'on lit la traduction. */
  const traductionDe = (id: number) => (affiche === "original" ? traductions[cle(id)] : decoupe.phrases[id] ? texteDe(decoupe.phrases[id]) : undefined);

  useEffect(() => {
    const c = annulation.current;
    return () => c.abort();
  }, []);

  useEffect(() => {
    let fini = false;
    let tache: PDFDocumentLoadingTask | null = null;
    void (async () => {
      const fichier = await lireBlob(cleOriginal(d.id));
      if (fini) return;
      if (!fichier) {
        setEtatOriginal("absent");
        return;
      }
      const pdfjs = await chargerPdfjs();
      tache = pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()), ...OPTIONS_PDFJS });
      const doc = await tache.promise;
      if (fini) return;
      setOriginal(doc);
      setEtatOriginal("pret");
    })().catch(() => !fini && setEtatOriginal("erreur"));
    return () => {
      fini = true;
      setOriginal(null);
      void tache?.destroy();
    };
  }, [d.id, rechargeOriginal]);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_VUE, vue);
    } catch {
      // Navigation privée.
    }
  }, [vue]);
  useEffect(() => {
    const m = window.setTimeout(() => setZoomRendu(zoomPage), 160);
    try {
      localStorage.setItem(CLE_ZOOM, String(zoomPage));
    } catch {
      // Navigation privée.
    }
    return () => window.clearTimeout(m);
  }, [zoomPage]);
  useEffect(() => setSaisiePage(String(page)), [page]);

  /** Retrouver la mise en page : le même PDF, choisi à nouveau (importé ailleurs, ou avant cette fonction). */
  const rattacher = async (f: File) => {
    try {
      const pdfjs = await chargerPdfjs();
      const tache = pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()), ...OPTIONS_PDFJS });
      const n = (await tache.promise).numPages;
      await tache.destroy();
      if (n !== d.pages.length) {
        setErreur(`Ce n'est pas le même PDF : celui-ci a ${n} pages, la lecture en compte ${d.pages.length}.`);
        return;
      }
      await ecrireBlob(cleOriginal(d.id), f);
      setErreur(null);
      setVue("page");
      setEtatOriginal("chargement");
      setRechargeOriginal((x) => x + 1);
    } catch {
      setErreur("Ce PDF n'a pas pu être ouvert.");
    }
  };

  // Sauvegarde : page, traductions et analyses, groupées.
  useEffect(() => {
    const m = setTimeout(() => {
      dernier.current = { ...dernier.current, page, traductions, analyses, affiche, vu: Date.now() };
      void ecrire("documents", dernier.current).catch(() => undefined);
    }, 600);
    return () => clearTimeout(m);
  }, [page, traductions, analyses, affiche]);
  useEffect(() => {
    try {
      localStorage.setItem(CLE, String(taille));
    } catch {
      // Navigation privée.
    }
  }, [taille]);

  const changerPage = useCallback(
    (n: number) => {
      const p = Math.min(d.pages.length, Math.max(1, n));
      setPage(p);
      setGlose(null);
      setPassage(null);
      setSelection(null);
      texte.current?.closest(".lg-pdf")?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [d.pages.length],
  );

  const analyser = useCallback(
    (id: number) => {
      const k = cleAffichee(id);
      if (analyses[k] || enCours.current.has(k)) return;
      const ph = phrases[id];
      if (!ph || ph.mots.length === 0) return;
      enCours.current.add(k);
      const contexte = id > 0 ? texteDe(phrases[id - 1]) : "";
      analyserPhrase(
        lu,
        ph.mots.map((m) => m.t),
        contexte,
        annulation.current.signal,
        regard,
      )
        .then((a: Analyse) => {
          setAnalyses((x) => ({ ...x, [k]: a }));
          // La traduction de la phrase d'origine sert aussi au mode « en regard ».
          if (a.traduction && affiche === "original") setTraductions((x) => (x[k] ? x : { ...x, [k]: a.traduction }));
          setErreur(null);
        })
        .catch((e) => !annulation.current.signal.aborted && setErreur(e instanceof Error ? e.message : "L'analyse a échoué."))
        .finally(() => enCours.current.delete(k));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyses, phrases, page, affiche, lu, regard],
  );

  useEffect(() => {
    if (glose) analyser(glose.phrase);
  }, [glose, analyser]);

  // Traduction d'une page entière : des lots courts envoyés en parallèle, affichés dès qu'ils arrivent.
  const traductionsConnues = useRef(traductions);
  traductionsConnues.current = traductions;
  const pagesEnTraduction = useRef(new Set<number>());
  const traduireLaPage = useCallback(
    async (n: number, visible: boolean) => {
      if (n < 1 || n > d.pages.length || pagesEnTraduction.current.has(n)) return;
      const dec: PageDecoupee = n === page ? decoupe : decouperPage(d.pages[n - 1]?.texte ?? "");
      const manquantes = dec.phrases.filter((p) => !traductionsConnues.current[`${n}:${p.id}`]);
      if (!manquantes.length) return;
      pagesEnTraduction.current.add(n);
      if (visible) setTraductionPage("attente");
      const lots: Phrase[][] = [];
      for (let k = 0; k < manquantes.length; k += PHRASES_PAR_LOT) lots.push(manquantes.slice(k, k + PHRASES_PAR_LOT));
      let suivant = 0;
      const ouvrier = async () => {
        while (suivant < lots.length) {
          const lot = lots[suivant++];
          const contexte = lot[0].id > 0 ? texteDe(dec.phrases[lot[0].id - 1]) : "";
          const r = await traduireLot(langue, lot.map(texteDe), contexte, annulation.current.signal, autre);
          setTraductions((x) => ({ ...x, ...Object.fromEntries(lot.map((p, m) => [`${n}:${p.id}`, r[m]])) }));
        }
      };
      try {
        // La page affichée part en plusieurs lots à la fois ; la page suivante, en arrière-plan, un lot à la fois.
        await Promise.all(Array.from({ length: Math.min(visible ? LOTS_EN_PARALLELE : 1, lots.length) }, ouvrier));
        if (visible) setErreur(null);
      } catch (e) {
        if (visible && !annulation.current.signal.aborted) setErreur(e instanceof Error ? e.message : "La traduction a échoué.");
      } finally {
        pagesEnTraduction.current.delete(n);
        if (visible) setTraductionPage(null);
      }
    },
    [decoupe, page, d.pages, langue, autre],
  );

  // Lire la traduction, ou la voir en regard : la page se traduit d'abord, puis la suivante se prépare.
  useEffect(() => {
    if (!(enRegard || affiche === "traduction")) return;
    void traduireLaPage(page, true).then(() => traduireLaPage(page + 1, false));
  }, [enRegard, affiche, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un mot sur lequel la souris s'arrête un instant : sa phrase s'analyse d'avance, le clic sera instantané.
  const survolMot = useRef<{ cle: string; minuteur: number } | null>(null);
  const survoler = useCallback(
    (phrase: number | null, mot = 0) => {
      const cle = phrase === null ? "" : `${phrase}:${mot}`;
      if (survolMot.current?.cle === cle) return;
      if (survolMot.current) window.clearTimeout(survolMot.current.minuteur);
      survolMot.current = phrase === null ? null : { cle, minuteur: window.setTimeout(() => analyser(phrase), 450) };
    },
    [analyser],
  );
  useEffect(
    () => () => {
      if (survolMot.current) window.clearTimeout(survolMot.current.minuteur);
    },
    [],
  );

  // La sélection d'un passage fait apparaître « Traduire ce passage ».
  useEffect(() => {
    const lire = () => {
      const s = window.getSelection();
      if (!s || s.isCollapsed || !texte.current) return setSelection(null);
      const r = s.getRangeAt(0);
      if (!texte.current.contains(r.commonAncestorContainer)) return setSelection(null);
      // Un mot coupé par la sélection est pris en entier.
      const debut = (r.startContainer.parentElement ?? null)?.closest(".lg-pdf-mot");
      const fin = (r.endContainer.parentElement ?? null)?.closest(".lg-pdf-mot");
      const etendue = r.cloneRange();
      if (debut) etendue.setStartBefore(debut);
      if (fin) etendue.setEndAfter(fin);
      const t = etendue.toString().replace(/\s+/g, " ").trim();
      if (t.length < 2 || !/\s/.test(t)) return setSelection(null);
      const b = r.getBoundingClientRect();
      setSelection({ texte: t.slice(0, 5000), rect: { top: b.top, left: b.left, bottom: b.bottom, width: b.width } });
    };
    let minuteur = 0;
    const differe = () => {
      clearTimeout(minuteur);
      minuteur = window.setTimeout(lire, 180);
    };
    document.addEventListener("selectionchange", differe);
    return () => {
      clearTimeout(minuteur);
      document.removeEventListener("selectionchange", differe);
    };
  }, []);

  const traduirePassage = async (s: Selection) => {
    setPassage({ texte: s.texte, traduction: null, erreur: null, rect: s.rect });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    try {
      const morceaux: string[] = [];
      for (const lot of lotsDePassage(s.texte)) morceaux.push(...(await traduireLot(lu, lot, "", annulation.current.signal, regard)));
      setPassage((p) => p && { ...p, traduction: morceaux.join(" ") });
    } catch (e) {
      if (!annulation.current.signal.aborted) setPassage((p) => p && { ...p, erreur: e instanceof Error ? e.message : "La traduction a échoué." });
    }
  };

  // Clavier : flèches pour tourner les pages, Échap pour fermer.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") changerPage(page + 1);
      else if (e.key === "ArrowLeft") changerPage(page - 1);
      else if (e.key === "Escape") {
        if (glose) setGlose(null);
        else if (passage) setPassage(null);
        else onFermer();
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [changerPage, glose, onFermer, page, passage]);

  // Un clic hors de la carte la ferme.
  useEffect(() => {
    if ((!glose || tactile) && !passage) return;
    const dehors = (e: PointerEvent) => {
      const c = e.target as HTMLElement;
      if (c.closest(".tr-glose, .lg-pdf-mot, .lg-passage, .lg-fidele")) return;
      setGlose(null);
      setPassage(null);
    };
    window.addEventListener("pointerdown", dehors);
    return () => window.removeEventListener("pointerdown", dehors);
  }, [glose, passage, tactile]);

  const toucherMot = (phrase: number, mot: number, el: HTMLElement) => {
    setPassage(null);
    setTactile(pointeur.current !== "mouse");
    setGlose({ phrase, mot, el, via: "toucher" });
  };
  const pageDOrigine = vue === "page" && original !== null;

  const surClic = (e: React.MouseEvent) => {
    const s = window.getSelection();
    if (s && !s.isCollapsed) return;
    const motEl = (e.target as HTMLElement).closest<HTMLElement>(".lg-pdf-mot");
    if (!motEl) return;
    setPassage(null);
    setTactile(pointeur.current !== "mouse");
    setGlose({ phrase: Number(motEl.dataset.p), mot: Number(motEl.dataset.i), el: motEl, via: "toucher" });
  };

  const phraseGlose = glose ? phrases[glose.phrase] : null;
  // Un passage garde l'anglais d'un côté, le français de l'autre, quelle que soit la langue lue.
  const passageAnglais = passage ? (lu === "en" ? passage.texte : (passage.traduction ?? "")) : "";
  const passageFrancais = passage ? (lu === "en" ? (passage.traduction ?? "") : passage.texte) : "";
  const passageGarde = passage ? dictionnaire.some((m) => m.passage && m.en === passageAnglais) : false;

  return (
    <div className="lg-pdf" style={{ ["--lg-taille" as string]: TAILLES[taille] }}>
      <div className="lg-pdf-tete">
        <button type="button" className="lg-retour-lien" onClick={onFermer}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mes lectures
        </button>
        <h2 className="lg-immersion-titre" dir="auto">
          {d.titre}
        </h2>
        <div className="lg-pdf-outils">
          <span className="lg-pdf-affiche" role="radiogroup" aria-label="Texte affiché">
            <span className="lg-pdf-affiche-titre">Texte</span>
            {(["original", "traduction"] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={affiche === a}
                className="lg-st-choix"
                title={a === "original" ? `Le texte du PDF, en ${NOM_LANGUE[langue].toLowerCase()}` : `La traduction en ${NOM_LANGUE[autre].toLowerCase()} : chaque mot se traduit à son tour`}
                onClick={() => {
                  setGlose(null);
                  setPassage(null);
                  setAffiche(a);
                }}
              >
                {NOM_LANGUE[a === "original" ? langue : autre]}
              </button>
            ))}
          </span>
          <button
            type="button"
            className="lg-option"
            aria-pressed={enRegard}
            onClick={() => setEnRegard((x) => !x)}
            title={`Afficher le ${regard === "fr" ? "français" : "l'anglais"} sous chaque paragraphe`}
          >
            {traductionPage ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Languages className="size-4" aria-hidden="true" />}
            {regard === "fr" ? "Français" : "Anglais"} en regard
          </button>
          {etatOriginal === "pret" && (
            <span className="lg-pdf-affiche" role="radiogroup" aria-label="Mise en page">
              <span className="lg-pdf-affiche-titre">Vue</span>
              {(["page", "texte"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={vue === v}
                  className="lg-st-choix"
                  title={v === "page" ? "La page telle qu'elle a été composée : polices, images, couverture" : "Le texte seul, mis en page pour la lecture"}
                  onClick={() => {
                    setGlose(null);
                    setPassage(null);
                    setVue(v);
                  }}
                >
                  {v === "page" ? "Page d'origine" : "Texte seul"}
                </button>
              ))}
            </span>
          )}
          {pageDOrigine ? (
            <span className="lg-zoom" role="group" aria-label="Zoom de la page">
              <button type="button" className="bouton-icone" aria-label="Dézoomer" disabled={zoomPage <= ZOOM_MIN} onClick={() => setZoomPage((z) => Math.max(ZOOM_MIN, Math.ceil(z / 10) * 10 - 10))}>
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <input
                type="range"
                className="lg-zoom-curseur"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={5}
                value={zoomPage}
                aria-label="Zoom"
                aria-valuetext={`${zoomPage} %`}
                style={{ ["--lg-zoom" as string]: `${((zoomPage - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%` }}
                onChange={(e) => setZoomPage(Number(e.target.value))}
              />
              <button type="button" className="bouton-icone" aria-label="Zoomer" disabled={zoomPage >= ZOOM_MAX} onClick={() => setZoomPage((z) => Math.min(ZOOM_MAX, Math.floor(z / 10) * 10 + 10))}>
                <Plus className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="lg-zoom-valeur" title="Revenir à 100 % : la page à la largeur de l'écran" onClick={() => setZoomPage(100)}>
                {zoomPage} %
              </button>
            </span>
          ) : (
            <span className="lg-tailles" role="group" aria-label="Taille du texte">
              <button type="button" className="bouton-icone" aria-label="Texte plus petit" disabled={taille === 0} onClick={() => setTaille((t) => t - 1)}>
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="bouton-icone" aria-label="Texte plus grand" disabled={taille === TAILLES.length - 1} onClick={() => setTaille((t) => t + 1)}>
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      </div>

      {etatOriginal === "absent" && (
        <label className="lg-pdf-original">
          <FileUp className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <strong>Voir la mise en page d&apos;origine</strong>
            <small>Polices, images, tableaux et couverture, exactement comme dans le PDF : choisis à nouveau ce fichier. Il reste sur ton appareil.</small>
          </span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && void rattacher(e.target.files[0])} />
        </label>
      )}

      {pageDOrigine && original ? (
        <article className="lg-pdf-fidele-cadre" aria-label={`Page ${page} sur ${d.pages.length}`}>
          <p className="lg-pdf-folio">
            Page {page} <span>sur {d.pages.length}</span>
            {traductionPage && (
              <span className="lg-fidele-etat">
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                Traduction de la page…
              </span>
            )}
          </p>
          <div ref={texte} className="lg-pdf-fideles" data-regard={enRegard || undefined} onPointerDown={(e) => (pointeur.current = e.pointerType)}>
            <div className="lg-pdf-fidele-col">
              <PagePdfFidele
                pdf={original}
                numero={page}
                phrases={decoupe.phrases}
                paragraphes={decoupe.paragraphes}
                phrasesTraduites={phrasesTraduites}
                version={affiche}
                zoom={zoomRendu / 100}
                interactive
                glose={glose ? { phrase: glose.phrase, mot: glose.mot } : null}
                langue={langue}
                onMot={toucherMot}
                onSurvol={survoler}
                onRien={() => {
                  setGlose(null);
                  setPassage(null);
                }}
              />
            </div>
            {enRegard && (
              <div className="lg-pdf-fidele-col" aria-label={affiche === "original" ? "Traduction de la page" : "Page d'origine"}>
                <PagePdfFidele
                  pdf={original}
                  numero={page}
                  phrases={decoupe.phrases}
                  paragraphes={decoupe.paragraphes}
                  phrasesTraduites={phrasesTraduites}
                  version={affiche === "original" ? "traduction" : "original"}
                  zoom={zoomRendu / 100}
                  interactive={false}
                  glose={null}
                  langue={langue}
                />
              </div>
            )}
          </div>
          {erreur && (
            <p className="lg-erreur" role="alert">
              {erreur}
            </p>
          )}
        </article>
      ) : (
      <article className="lg-pdf-page" aria-label={`Page ${page} sur ${d.pages.length}`}>
        <p className="lg-pdf-folio">
          Page {page} <span>sur {d.pages.length}</span>
        </p>
        <div
          ref={texte}
          className="lg-pdf-texte"
          lang={lu}
          onClick={surClic}
          onPointerDown={(e) => (pointeur.current = e.pointerType)}
          onPointerOver={(e) => {
            if (e.pointerType !== "mouse") return;
            const m = (e.target as HTMLElement).closest<HTMLElement>(".lg-pdf-mot");
            survoler(m ? Number(m.dataset.p) : null, m ? Number(m.dataset.i) : 0);
          }}
          onPointerLeave={() => survoler(null)}
        >
          {decoupe.paragraphes.length === 0 && <p className="text-encre-douce">Cette page ne contient pas de texte (image, page blanche ou scan).</p>}
          {decoupe.paragraphes.map((ids, n) => (
            <div key={`${page}-${n}`} className="lg-pdf-para">
              <p>
                {affiche === "traduction" && ids.some((id) => phrases[id].mots.length === 0) && <span className="tr-attente tr-attente-courte" />}
                {ids.map((id) => (
                  <span key={id} className="lg-pdf-phrase" data-glose={glose?.phrase === id || undefined}>
                    {phrases[id].mots.map((m, i) => (
                      <span key={i}>
                        <span className="lg-pdf-mot" data-p={id} data-i={i} aria-pressed={glose?.phrase === id && glose.mot === i ? true : undefined}>
                          {m.t}
                        </span>{" "}
                      </span>
                    ))}
                  </span>
                ))}
              </p>
              {enRegard && (
                <p className="lg-pdf-fr" lang={regard}>
                  {ids.every((id) => traductionDe(id)) ? ids.map((id) => traductionDe(id)).join(" ") : <span className="tr-attente tr-attente-courte" />}
                </p>
              )}
            </div>
          ))}
        </div>
        {erreur && (
          <p className="lg-erreur" role="alert">
            {erreur}
          </p>
        )}
      </article>
      )}

      <nav className="lg-pdf-pages" aria-label="Pages">
        <button type="button" className="bouton" onClick={() => changerPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="max-sm:sr-only">Précédente</span>
        </button>
        {/* Tape un numéro de page puis Entrée (ou quitte le champ) : la page s'ouvre. */}
        <form
          className="lg-pdf-aller"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(saisiePage);
            if (n >= 1) changerPage(Math.min(n, d.pages.length));
            else setSaisiePage(String(page));
            pageSoumise.current = true;
            (e.currentTarget.elements.namedItem("page") as HTMLInputElement | null)?.blur();
          }}
        >
          <label>
            <span className="sr-only">Aller à la page (tape le numéro puis Entrée)</span>
            <input
              name="page"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="go"
              title="Tape un numéro de page, puis Entrée"
              value={saisiePage}
              style={{ width: `${Math.max(3, String(d.pages.length).length + 1.5)}ch` }}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setSaisiePage(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onBlur={() => {
                if (pageSoumise.current) {
                  pageSoumise.current = false;
                  return;
                }
                const n = Number(saisiePage);
                if (n >= 1 && n !== page) changerPage(Math.min(n, d.pages.length));
                else setSaisiePage(String(page));
              }}
            />
          </label>
          <span>/ {d.pages.length}</span>
        </form>
        <button type="button" className="bouton" onClick={() => changerPage(page + 1)} disabled={page >= d.pages.length}>
          <span className="max-sm:sr-only">Suivante</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>

      {selection && !passage && (
        <button
          type="button"
          className="lg-selection"
          style={{ top: Math.max(76, selection.rect.top - 52), left: Math.min(window.innerWidth - 220, Math.max(12, selection.rect.left + selection.rect.width / 2 - 100)) }}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => void traduirePassage(selection)}
        >
          <Languages className="size-4" aria-hidden="true" />
          Traduire ce passage
        </button>
      )}

      {passage && (
        <div className="lg-passage" role="dialog" aria-label="Traduction du passage">
          <button type="button" className="bouton-icone lg-passage-fermer" aria-label="Fermer" onClick={() => setPassage(null)}>
            <X className="size-4" aria-hidden="true" />
          </button>
          <p className="lg-passage-en" lang={lu}>
            {passage.texte.length > 420 ? `${passage.texte.slice(0, 420)}…` : passage.texte}
          </p>
          <div className="lg-passage-fr">
            {passage.traduction ? (
              <p>{passage.traduction}</p>
            ) : passage.erreur ? (
              <p className="text-danger">{passage.erreur}</p>
            ) : (
              <>
                <span className="tr-attente" />
                <span className="tr-attente tr-attente-courte" />
              </>
            )}
          </div>
          <div className="tr-glose-actions">
            {voixDisponible() && (
              <button type="button" className="lg-glose-action" disabled={!passageAnglais} onClick={() => void parler(passageAnglais, 0.92)}>
                <Volume2 className="size-4" aria-hidden="true" />
                Écouter
              </button>
            )}
            <button
              type="button"
              className="lg-glose-action"
              disabled={!passage.traduction}
              onClick={async () => {
                await navigator.clipboard.writeText(`${passage.texte}\n\n${passage.traduction}`).catch(() => undefined);
                setCopie(true);
                setTimeout(() => setCopie(false), 1800);
              }}
            >
              {copie ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copie ? "Copié" : "Copier"}
            </button>
            <button
              type="button"
              className="lg-glose-action"
              data-principal={!passageGarde || undefined}
              disabled={!passage.traduction || passageGarde || passage.texte.length > 600}
              title={passage.texte.length > 600 ? "Passage trop long pour une carte de révision" : undefined}
              onClick={() => passage.traduction && ajouterMot(nouveauMot({ en: passageAnglais, fr: passageFrancais, passage: true }, { type: "pdf", titre: d.titre, ref: d.id, page }))}
            >
              {passageGarde ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
              {passageGarde ? "Gardé" : "Garder dans le dictionnaire"}
            </button>
          </div>
        </div>
      )}

      {glose && phraseGlose && (
        <GloseMot
          cible={glose}
          phrase={phraseGlose}
          analyse={analyses[cleAffichee(glose.phrase)]}
          traduction={traductionDe(glose.phrase)}
          langue={lu}
          erreur={erreur}
          origine={{ type: "pdf", titre: d.titre, ref: d.id, page }}
          tactile={tactile}
          onFermer={() => setGlose(null)}
          onMot={(i, el) => setGlose({ phrase: glose.phrase, mot: i, el, via: "toucher" })}
        />
      )}
    </div>
  );
}
