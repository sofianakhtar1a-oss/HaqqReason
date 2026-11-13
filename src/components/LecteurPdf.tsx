"use client";

import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Eye,
  EyeOff,
  Highlighter,
  LoaderCircle,
  MousePointer2,
  PanelLeft,
  StickyNote,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { creerAnnotation, modifierAnnotation, supprimerAnnotation, type Annotation } from "@/app/createur/fichiers-actions";
import { COULEURS } from "@/lib/document-schema";
import { chargerPdfjs, ouvrirPdf } from "@/lib/client/pdf";
import { normaliser } from "@/lib/recherche-texte";

/*
 * Lecteur PDF de HaqqReason : pages en défilement continu, zoom, miniatures, plein écran,
 * texte sélectionnable, mots recherchés surlignés, et annotations (surlignages et notes).
 * Les pages ne sont dessinées que lorsqu'elles approchent de l'écran, pour rester fluide sur les gros documents.
 */

type Outil = "lire" | "surligner" | "note";
type Taille = { largeur: number; hauteur: number };

type Props = {
  fichierId: string;
  nom: string;
  pageInitiale?: number;
  termes?: string[];
  annotations: Annotation[];
  createur?: boolean;
};

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

export function LecteurPdf({ fichierId, nom, pageInitiale = 1, termes = [], annotations: initiales, createur = false }: Props) {
  const [documentPdf, setDocumentPdf] = useState<PDFDocumentProxy | null>(null);
  const [erreur, setErreur] = useState("");
  const [tailles, setTailles] = useState<Taille[]>([]);
  const [echelle, setEchelle] = useState(1);
  const [pageCourante, setPageCourante] = useState(pageInitiale);
  const [saisiePage, setSaisiePage] = useState(String(pageInitiale));
  const [miniatures, setMiniatures] = useState(false);
  const [outil, setOutil] = useState<Outil>("lire");
  const [couleur, setCouleur] = useState("jaune");
  const [annotations, setAnnotations] = useState(initiales);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  const premierAjustement = useRef(true);

  const racines = useMemo(() => termes.map(normaliser).filter((t) => t.length >= 2).map((t) => (t.length > 5 ? t.slice(0, -2) : t)), [termes]);

  // Ouverture du document et mesure de toutes les pages.
  useEffect(() => {
    let annule = false;
    let fermer: (() => Promise<void>) | null = null;
    (async () => {
      try {
        const ouvert = await ouvrirPdf(fichierId);
        fermer = ouvert.fermer;
        if (annule) return void fermer();
        const premiere = await ouvert.document.getPage(1);
        const v = premiere.getViewport({ scale: 1 });
        const mesures: Taille[] = Array.from({ length: ouvert.document.numPages }, () => ({ largeur: v.width, hauteur: v.height }));
        setTailles(mesures);
        setDocumentPdf(ouvert.document);
        // Mesure exacte des autres pages, en arrière-plan (elles peuvent avoir des formats différents).
        for (let i = 2; i <= ouvert.document.numPages && !annule; i++) {
          const p = await ouvert.document.getPage(i);
          const vp = p.getViewport({ scale: 1 });
          if (vp.width !== v.width || vp.height !== v.height) {
            setTailles((t) => t.map((x, j) => (j === i - 1 ? { largeur: vp.width, hauteur: vp.height } : x)));
          }
        }
      } catch {
        if (!annule) setErreur("Le document n'a pas pu être ouvert. Recharge la page.");
      }
    })();
    return () => {
      annule = true;
      void fermer?.();
    };
  }, [fichierId]);

  const ajusterLargeur = useCallback(() => {
    const largeurDispo = (zone.current?.clientWidth ?? 800) - 32;
    if (tailles[0]) setEchelle(Math.max(0.3, Math.min(3, largeurDispo / tailles[0].largeur)));
  }, [tailles]);

  // Premier affichage : à la largeur de l'écran (au plus 150 %), puis aller à la page demandée.
  useEffect(() => {
    if (!documentPdf || tailles.length === 0 || !premierAjustement.current) return;
    premierAjustement.current = false;
    const largeurDispo = (zone.current?.clientWidth ?? 800) - 32;
    const e = Math.max(0.3, Math.min(1.5, largeurDispo / tailles[0].largeur));
    requestAnimationFrame(() => {
      setEchelle(e);
      if (pageInitiale > 1) requestAnimationFrame(() => pages.current[pageInitiale - 1]?.scrollIntoView({ block: "start" }));
    });
  }, [documentPdf, tailles, pageInitiale]);

  // Page courante = la plus visible.
  useEffect(() => {
    if (!documentPdf) return;
    const visibles = new Map<number, number>();
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) visibles.set(Number((e.target as HTMLElement).dataset.page), e.intersectionRatio);
        let meilleure = 0;
        let ratio = 0;
        visibles.forEach((r, p) => {
          if (r > ratio) {
            ratio = r;
            meilleure = p;
          }
        });
        if (meilleure) {
          setPageCourante(meilleure);
          setSaisiePage(String(meilleure));
        }
      },
      { root: zone.current, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pages.current.forEach((p) => p && obs.observe(p));
    return () => obs.disconnect();
  }, [documentPdf, tailles.length]);

  const allerA = (n: number) => {
    const total = tailles.length;
    const cible = Math.max(1, Math.min(total, n));
    pages.current[cible - 1]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const zoomer = (sens: 1 | -1) => {
    const suivant = sens > 0 ? ZOOMS.find((z) => z > echelle + 0.01) : [...ZOOMS].reverse().find((z) => z < echelle - 0.01);
    if (suivant) {
      const page = pageCourante;
      setEchelle(suivant);
      requestAnimationFrame(() => pages.current[page - 1]?.scrollIntoView({ block: "start" }));
    }
  };

  const pleinEcran = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void cadre.current?.requestFullscreen?.();
  };

  async function ajouterAnnotation(a: Omit<Annotation, "id">) {
    const r = await creerAnnotation({ ...a, fichierId });
    if (r.ok) {
      setAnnotations((liste) => [...liste, r.annotation]);
      if (r.annotation.type === "note") setOuverte(r.annotation.id);
    }
  }

  async function changerAnnotation(id: string, changements: Partial<Pick<Annotation, "texte" | "visible" | "couleur">>) {
    setAnnotations((liste) => liste.map((a) => (a.id === id ? { ...a, ...changements } : a)));
    await modifierAnnotation({ id, ...changements });
  }

  async function retirerAnnotation(id: string) {
    setAnnotations((liste) => liste.filter((a) => a.id !== id));
    setOuverte(null);
    await supprimerAnnotation({ id });
  }

  const total = tailles.length;

  return (
    <div ref={cadre} className="lecteur-pdf" data-outil={outil}>
      <div className="lecteur-barre" role="toolbar" aria-label="Lecture du document">
        <button type="button" className="outil" aria-label="Miniatures des pages" aria-pressed={miniatures} onClick={() => setMiniatures((m) => !m)}>
          <PanelLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="barre-separateur" aria-hidden="true" />
        <button type="button" className="outil" aria-label="Page précédente" onClick={() => allerA(pageCourante - 1)} disabled={pageCourante <= 1}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <form
          className="flex items-center gap-1.5 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            allerA(Number.parseInt(saisiePage, 10) || 1);
          }}
        >
          <label htmlFor={`page-${fichierId}`} className="sr-only">
            Aller à la page
          </label>
          <input
            id={`page-${fichierId}`}
            className="w-14 rounded-lg border border-trait bg-transparent px-2 py-1 text-center"
            value={saisiePage}
            inputMode="numeric"
            onChange={(e) => setSaisiePage(e.target.value.replace(/\D/g, ""))}
          />
          <span className="text-encre-douce">sur {total || "…"}</span>
        </form>
        <button type="button" className="outil" aria-label="Page suivante" onClick={() => allerA(pageCourante + 1)} disabled={pageCourante >= total}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <span className="barre-separateur" aria-hidden="true" />
        <button type="button" className="outil" aria-label="Dézoomer" onClick={() => zoomer(-1)} disabled={echelle <= ZOOMS[0]}>
          <ZoomOut className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="outil min-w-16 text-sm" onClick={ajusterLargeur} title="Ajuster à la largeur">
          {Math.round(echelle * 100)} %
        </button>
        <button type="button" className="outil" aria-label="Zoomer" onClick={() => zoomer(1)} disabled={echelle >= ZOOMS[ZOOMS.length - 1]}>
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>

        {createur && (
          <>
            <span className="barre-separateur" aria-hidden="true" />
            <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Outil">
              {(
                [
                  ["lire", "Lire et sélectionner le texte", MousePointer2],
                  ["surligner", "Surligner une zone", Highlighter],
                  ["note", "Ajouter une note", StickyNote],
                ] as const
              ).map(([cle, libelle, Icone]) => (
                <button key={cle} type="button" role="radio" aria-checked={outil === cle} className="outil" aria-label={libelle} title={libelle} onClick={() => setOutil(cle)}>
                  <Icone className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>
            {outil === "surligner" && (
              <div className="flex items-center gap-1" role="group" aria-label="Couleur du surlignage">
                {COULEURS.slice(0, 5).map((c) => (
                  <button
                    key={c.cle}
                    type="button"
                    className="pastille !size-5"
                    style={{ background: `var(--f-${c.cle})` }}
                    aria-label={c.libelle}
                    aria-pressed={couleur === c.cle}
                    onClick={() => setCouleur(c.cle)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <span className="ml-auto" />
        <a href={`/fichiers/${fichierId}?telecharger`} className="outil" aria-label={`Télécharger ${nom}`} title="Télécharger">
          <Download className="size-4" aria-hidden="true" />
        </a>
        <button type="button" className="outil" aria-label="Plein écran" title="Plein écran" onClick={pleinEcran}>
          <Expand className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="lecteur-corps">
        {miniatures && documentPdf && (
          <nav className="lecteur-miniatures" aria-label="Miniatures">
            {tailles.map((t, i) => (
              <Miniature key={i} documentPdf={documentPdf} numero={i + 1} taille={t} active={pageCourante === i + 1} onClick={() => allerA(i + 1)} />
            ))}
          </nav>
        )}
        <div ref={zone} className="lecteur-pages" tabIndex={0} aria-label={`Pages de ${nom}`}>
          {erreur && <p className="message message-erreur m-6">{erreur}</p>}
          {!documentPdf && !erreur && (
            <p className="flex items-center gap-2 p-8 text-encre-douce" role="status">
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              Ouverture du document…
            </p>
          )}
          {documentPdf &&
            tailles.map((t, i) => (
              <div
                key={i}
                ref={(el) => {
                  pages.current[i] = el;
                }}
                data-page={i + 1}
                className="lecteur-page"
                style={{ width: t.largeur * echelle, height: t.hauteur * echelle }}
              >
                <PagePdf
                  documentPdf={documentPdf}
                  numero={i + 1}
                  echelle={echelle}
                  racine={zone}
                  racines={racines}
                />
                <CoucheAnnotations
                  annotations={annotations.filter((a) => a.page === i + 1)}
                  page={i + 1}
                  outil={createur ? outil : "lire"}
                  couleur={couleur}
                  createur={createur}
                  ouverte={ouverte}
                  setOuverte={setOuverte}
                  ajouter={ajouterAnnotation}
                  changer={changerAnnotation}
                  retirer={retirerAnnotation}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/** Une page : dessin (canvas) et texte sélectionnable, seulement quand elle est proche de l'écran. */
function PagePdf({
  documentPdf,
  numero,
  echelle,
  racine,
  racines,
}: {
  documentPdf: PDFDocumentProxy;
  numero: number;
  echelle: number;
  racine: React.RefObject<HTMLDivElement | null>;
  racines: string[];
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const texte = useRef<HTMLDivElement>(null);
  const [proche, setProche] = useState(false);

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setProche(e.isIntersecting), { root: racine.current, rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [racine]);

  useEffect(() => {
    if (!proche) {
      // Libère la mémoire des pages éloignées.
      if (toile.current) {
        toile.current.width = 0;
        toile.current.height = 0;
      }
      if (texte.current) texte.current.replaceChildren();
      return;
    }
    let tache: RenderTask | null = null;
    let annule = false;
    (async () => {
      const page: PDFPageProxy = await documentPdf.getPage(numero);
      if (annule || !toile.current || !texte.current) return;
      const vue = page.getViewport({ scale: echelle });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const c = toile.current;
      c.width = Math.floor(vue.width * ratio);
      c.height = Math.floor(vue.height * ratio);
      c.style.width = `${vue.width}px`;
      c.style.height = `${vue.height}px`;
      tache = page.render({ canvas: c, viewport: vue, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      try {
        await tache.promise;
      } catch {
        return;
      }
      if (annule || !texte.current) return;
      const pdfjs = await chargerPdfjs();
      const couche = texte.current;
      couche.replaceChildren();
      couche.style.setProperty("--scale-factor", String(vue.scale));
      const t = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: couche, viewport: vue });
      await t.render();
      if (racines.length > 0) {
        couche.querySelectorAll("span").forEach((s) => {
          const contenu = normaliser(s.textContent ?? "");
          if (racines.some((r) => contenu.includes(r))) s.classList.add("correspondance");
        });
      }
    })();
    return () => {
      annule = true;
      tache?.cancel();
    };
  }, [proche, echelle, documentPdf, numero, racines]);

  return (
    <div ref={conteneur} className="absolute inset-0">
      <canvas ref={toile} className="lecteur-toile" aria-hidden="true" />
      <div ref={texte} className="textLayer" />
    </div>
  );
}

function Miniature({ documentPdf, numero, taille, active, onClick }: { documentPdf: PDFDocumentProxy; numero: number; taille: Taille; active: boolean; onClick: () => void }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const echelle = 110 / taille.largeur;

  useEffect(() => {
    const el = bouton.current;
    if (!el) return;
    let fait = false;
    const obs = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || fait || !toile.current) return;
      fait = true;
      const page = await documentPdf.getPage(numero);
      const vue = page.getViewport({ scale: echelle });
      toile.current.width = Math.floor(vue.width);
      toile.current.height = Math.floor(vue.height);
      await page.render({ canvas: toile.current, viewport: vue }).promise.catch(() => {});
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [documentPdf, numero, echelle]);

  useEffect(() => {
    if (active) bouton.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button ref={bouton} type="button" className="lecteur-miniature" aria-current={active} onClick={onClick} aria-label={`Page ${numero}`}>
      <canvas ref={toile} style={{ width: 110, height: taille.hauteur * echelle }} aria-hidden="true" />
      <span>{numero}</span>
    </button>
  );
}

/** Surlignages et notes d'une page ; en mode créateur, permet d'en ajouter et de les modifier. */
function CoucheAnnotations({
  annotations,
  page,
  outil,
  couleur,
  createur,
  ouverte,
  setOuverte,
  ajouter,
  changer,
  retirer,
}: {
  annotations: Annotation[];
  page: number;
  outil: Outil;
  couleur: string;
  createur: boolean;
  ouverte: string | null;
  setOuverte: (id: string | null) => void;
  ajouter: (a: Omit<Annotation, "id">) => void;
  changer: (id: string, c: Partial<Pick<Annotation, "texte" | "visible" | "couleur">>) => void;
  retirer: (id: string) => void;
}) {
  const couche = useRef<HTMLDivElement>(null);
  const [trace, setTrace] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const position = (e: React.PointerEvent) => {
    const r = couche.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };

  return (
    <div
      ref={couche}
      className="couche-annotations"
      data-active={outil !== "lire"}
      onPointerDown={(e) => {
        if (outil === "lire" || e.target !== couche.current) return;
        const p = position(e);
        if (outil === "note") {
          ajouter({ page, type: "note", x: p.x, y: p.y, largeur: 0, hauteur: 0, couleur: "jaune", texte: "", visible: true });
          return;
        }
        couche.current!.setPointerCapture(e.pointerId);
        setTrace({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      }}
      onPointerMove={(e) => {
        if (!trace) return;
        const p = position(e);
        setTrace({ ...trace, x1: p.x, y1: p.y });
      }}
      onPointerUp={() => {
        if (!trace) return;
        const x = Math.min(trace.x0, trace.x1);
        const y = Math.min(trace.y0, trace.y1);
        const largeur = Math.abs(trace.x1 - trace.x0);
        const hauteur = Math.abs(trace.y1 - trace.y0);
        setTrace(null);
        if (largeur > 0.01 && hauteur > 0.005) ajouter({ page, type: "surlignage", x, y, largeur, hauteur, couleur, texte: "", visible: true });
      }}
    >
      {trace && (
        <div
          className="annotation-surlignage"
          style={{
            left: `${Math.min(trace.x0, trace.x1) * 100}%`,
            top: `${Math.min(trace.y0, trace.y1) * 100}%`,
            width: `${Math.abs(trace.x1 - trace.x0) * 100}%`,
            height: `${Math.abs(trace.y1 - trace.y0) * 100}%`,
            ["--f" as string]: `var(--f-${couleur})`,
          }}
        />
      )}
      {annotations.map((a) => {
        const style =
          a.type === "surlignage"
            ? { left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${a.largeur * 100}%`, height: `${a.hauteur * 100}%`, ["--f" as string]: `var(--f-${a.couleur})` }
            : { left: `${a.x * 100}%`, top: `${a.y * 100}%` };
        const libelle = a.type === "note" ? `Note${a.texte ? ` : ${a.texte.slice(0, 60)}` : ""}` : `Surlignage${a.texte ? ` : ${a.texte.slice(0, 60)}` : ""}`;
        return (
          <div key={a.id} className={a.type === "note" ? "annotation-note-ancre" : "annotation-surlignage-ancre"} style={style}>
            <button
              type="button"
              className={a.type === "note" ? "annotation-note" : "annotation-surlignage annotation-cliquable"}
              data-privee={!a.visible}
              aria-label={libelle}
              aria-expanded={ouverte === a.id}
              onClick={(e) => {
                e.stopPropagation();
                setOuverte(ouverte === a.id ? null : a.id);
              }}
            >
              {a.type === "note" && <StickyNote className="size-4" aria-hidden="true" />}
            </button>
            {ouverte === a.id && (
              <div className="annotation-bulle" onPointerDown={(e) => e.stopPropagation()}>
                {createur ? (
                  <>
                    <label className="etiquette text-sm" htmlFor={`annotation-${a.id}`}>
                      {a.type === "note" ? "Texte de la note" : "Commentaire (facultatif)"}
                    </label>
                    <textarea
                      id={`annotation-${a.id}`}
                      className="champ min-h-20 text-sm"
                      defaultValue={a.texte}
                      autoFocus={a.type === "note"}
                      onBlur={(e) => e.target.value !== a.texte && changer(a.id, { texte: e.target.value })}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" className="outil text-sm" onClick={() => changer(a.id, { visible: !a.visible })}>
                        {a.visible ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                        {a.visible ? "Visible par les lecteurs" : "Privée"}
                      </button>
                      <button type="button" className="outil text-sm text-danger" onClick={() => retirer(a.id)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Supprimer
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm">{a.texte || "Passage surligné par l'auteur."}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
