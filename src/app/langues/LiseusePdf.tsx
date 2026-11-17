"use client";

import { ArrowLeft, BookmarkCheck, BookmarkPlus, Check, ChevronLeft, ChevronRight, Copy, Languages, LoaderCircle, Minus, Plus, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyserPhrase, traduireLot } from "@/lib/alambic/transcription/client";
import { type Analyse, texteDe } from "@/lib/alambic/transcription/types";
import { nouveauMot } from "@/lib/langues/dictionnaire";
import { type DocumentLangue, ecrire } from "@/lib/langues/stockage";
import { decouperPage, lotsDePassage } from "@/lib/langues/texte";
import { parler, voixDisponible } from "@/lib/langues/voix";
import type { Cible } from "../alambic/transcription/Glose";
import { ajouterMot, useDonnees } from "./donnees";
import { GloseMot } from "./GloseMot";
import "@fontsource-variable/literata/opsz.css";

/*
 * La liseuse de PDF : le texte de chaque page, mis en page pour la lecture.
 * Un mot touché se traduit dans sa phrase ; un passage sélectionné se traduit en entier ;
 * la page entière peut s'afficher avec sa traduction sous chaque paragraphe.
 */

const TAILLES = [1, 1.1, 1.22, 1.36];
const CLE = "haqqreason-truchement-pdf";

type Selection = { texte: string; rect: { top: number; left: number; bottom: number; width: number } };
type Passage = { texte: string; traduction: string | null; erreur: string | null; rect: Selection["rect"] };

export function LiseusePdf({ document: d, onFermer }: { document: DocumentLangue; onFermer: () => void }) {
  const dernier = useRef(d);
  const { mots } = useDonnees();
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
  const texte = useRef<HTMLDivElement>(null);
  const pointeur = useRef("mouse");
  const enCours = useRef(new Set<string>());
  const annulation = useRef(new AbortController());

  const contenu = d.pages[page - 1];
  const decoupe = useMemo(() => decouperPage(contenu?.texte ?? ""), [contenu]);
  const cle = (id: number) => `${page}:${id}`;

  useEffect(() => {
    const c = annulation.current;
    return () => c.abort();
  }, []);

  // Sauvegarde : page, traductions et analyses, groupées.
  useEffect(() => {
    const m = setTimeout(() => {
      dernier.current = { ...dernier.current, page, traductions, analyses, vu: Date.now() };
      void ecrire("documents", dernier.current).catch(() => undefined);
    }, 600);
    return () => clearTimeout(m);
  }, [page, traductions, analyses]);
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
      const k = cle(id);
      if (analyses[k] || enCours.current.has(k)) return;
      const ph = decoupe.phrases[id];
      if (!ph) return;
      enCours.current.add(k);
      const contexte = id > 0 ? texteDe(decoupe.phrases[id - 1]) : "";
      analyserPhrase(
        "en",
        ph.mots.map((m) => m.t),
        contexte,
        annulation.current.signal,
      )
        .then((a: Analyse) => {
          setAnalyses((x) => ({ ...x, [k]: a }));
          if (a.traduction) setTraductions((x) => (x[k] ? x : { ...x, [k]: a.traduction }));
          setErreur(null);
        })
        .catch((e) => !annulation.current.signal.aborted && setErreur(e instanceof Error ? e.message : "L'analyse a échoué."))
        .finally(() => enCours.current.delete(k));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyses, decoupe, page],
  );

  useEffect(() => {
    if (glose) analyser(glose.phrase);
  }, [glose, analyser]);

  // Traduction de toute la page, paragraphe par paragraphe, par lots.
  const traduirePage = useCallback(async () => {
    const manquantes = decoupe.phrases.filter((p) => !traductions[cle(p.id)]);
    if (!manquantes.length) return;
    setTraductionPage("attente");
    try {
      for (let k = 0; k < manquantes.length; k += 20) {
        const lot = manquantes.slice(k, k + 20);
        const contexte = lot[0].id > 0 ? texteDe(decoupe.phrases[lot[0].id - 1]) : "";
        const r = await traduireLot("en", lot.map(texteDe), contexte, annulation.current.signal);
        setTraductions((x) => ({ ...x, ...Object.fromEntries(lot.map((p, n) => [cle(p.id), r[n]])) }));
      }
      setErreur(null);
    } catch (e) {
      if (!annulation.current.signal.aborted) setErreur(e instanceof Error ? e.message : "La traduction a échoué.");
    } finally {
      setTraductionPage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoupe, page, traductions]);

  useEffect(() => {
    if (enRegard) void traduirePage();
  }, [enRegard, page]); // eslint-disable-line react-hooks/exhaustive-deps

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
      for (const lot of lotsDePassage(s.texte)) morceaux.push(...(await traduireLot("en", lot, "", annulation.current.signal)));
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
      if (c.closest(".tr-glose, .lg-pdf-mot, .lg-passage")) return;
      setGlose(null);
      setPassage(null);
    };
    window.addEventListener("pointerdown", dehors);
    return () => window.removeEventListener("pointerdown", dehors);
  }, [glose, passage, tactile]);

  const surClic = (e: React.MouseEvent) => {
    const s = window.getSelection();
    if (s && !s.isCollapsed) return;
    const motEl = (e.target as HTMLElement).closest<HTMLElement>(".lg-pdf-mot");
    if (!motEl) return;
    setPassage(null);
    setTactile(pointeur.current !== "mouse");
    setGlose({ phrase: Number(motEl.dataset.p), mot: Number(motEl.dataset.i), el: motEl, via: "toucher" });
  };

  const phraseGlose = glose ? decoupe.phrases[glose.phrase] : null;
  const passageGarde = passage ? mots.some((m) => m.passage && m.en === passage.texte) : false;

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
          <button type="button" className="lg-option" aria-pressed={enRegard} onClick={() => setEnRegard((x) => !x)} title="Afficher la traduction sous chaque paragraphe">
            {traductionPage ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Languages className="size-4" aria-hidden="true" />}
            Traduire la page
          </button>
          <span className="lg-tailles" role="group" aria-label="Taille du texte">
            <button type="button" className="bouton-icone" aria-label="Texte plus petit" disabled={taille === 0} onClick={() => setTaille((t) => t - 1)}>
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton-icone" aria-label="Texte plus grand" disabled={taille === TAILLES.length - 1} onClick={() => setTaille((t) => t + 1)}>
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>

      <article className="lg-pdf-page" aria-label={`Page ${page} sur ${d.pages.length}`}>
        <p className="lg-pdf-folio">
          Page {page} <span>sur {d.pages.length}</span>
        </p>
        <div ref={texte} className="lg-pdf-texte" lang="en" onClick={surClic} onPointerDown={(e) => (pointeur.current = e.pointerType)}>
          {decoupe.paragraphes.length === 0 && <p className="text-encre-douce">Cette page ne contient pas de texte (image, page blanche ou scan).</p>}
          {decoupe.paragraphes.map((ids, n) => (
            <div key={`${page}-${n}`} className="lg-pdf-para">
              <p>
                {ids.map((id) => (
                  <span key={id} className="lg-pdf-phrase" data-glose={glose?.phrase === id || undefined}>
                    {decoupe.phrases[id].mots.map((m, i) => (
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
                <p className="lg-pdf-fr" lang="fr">
                  {ids.every((id) => traductions[cle(id)]) ? ids.map((id) => traductions[cle(id)]).join(" ") : <span className="tr-attente tr-attente-courte" />}
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

      <nav className="lg-pdf-pages" aria-label="Pages">
        <button type="button" className="bouton" onClick={() => changerPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="max-sm:sr-only">Précédente</span>
        </button>
        <label className="lg-pdf-aller">
          <span className="sr-only">Aller à la page</span>
          <input
            type="number"
            min={1}
            max={d.pages.length}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= d.pages.length) changerPage(n);
            }}
          />
          <span>/ {d.pages.length}</span>
        </label>
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
          <p className="lg-passage-en" lang="en">
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
              <button type="button" className="lg-glose-action" onClick={() => void parler(passage.texte, 0.92)}>
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
              onClick={() => passage.traduction && ajouterMot(nouveauMot({ en: passage.texte, fr: passage.traduction, passage: true }, { type: "pdf", titre: d.titre, ref: d.id, page }))}
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
          analyse={analyses[cle(glose.phrase)]}
          traduction={traductions[cle(glose.phrase)]}
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
