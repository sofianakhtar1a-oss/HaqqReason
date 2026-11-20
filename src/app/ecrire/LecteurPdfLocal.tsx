"use client";

import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { LoaderCircle, Quote, TextQuote, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { chargerPdfjs } from "@/lib/client/pdf";

/*
 * Un PDF lu à côté du texte : pages en défilement continu (dessinées seulement quand elles
 * approchent), texte sélectionnable, et deux boutons pour citer — la page en cours, ou le
 * passage sélectionné avec sa page. Le fichier vient de l'appareil (pièce jointe du document,
 * ou PDF ouvert pour l'occasion) : rien ne part sur le réseau.
 */

type Props = {
  /** Le contenu du PDF : lu sur l'appareil, il est passé tel quel au lecteur (aucune requête réseau). */
  fichier: Blob;
  nom: string;
  pageInitiale?: number;
  surCiter: (citation: { page: number; texte: string }) => void;
};

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2];

export function LecteurPdfLocal({ fichier, nom, pageInitiale = 1, surCiter }: Props) {
  const [documentPdf, setDocumentPdf] = useState<PDFDocumentProxy | null>(null);
  const [erreur, setErreur] = useState("");
  const [ratio, setRatio] = useState(1.414);
  const [largeur, setLargeur] = useState(0);
  const [zoom, setZoom] = useState(3);
  const [page, setPage] = useState(pageInitiale);
  const [selection, setSelection] = useState<{ page: number; texte: string } | null>(null);
  const racine = useRef<HTMLDivElement>(null);
  const premiereFois = useRef(true);

  useEffect(() => {
    let vivant = true;
    let detruire: (() => Promise<void>) | null = null;
    (async () => {
      try {
        const [pdfjs, octets] = await Promise.all([chargerPdfjs(), fichier.arrayBuffer()]);
        if (!vivant) return;
        const tache = pdfjs.getDocument({
          data: new Uint8Array(octets),
          cMapUrl: "/vendor/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
          wasmUrl: "/vendor/pdfjs/wasm/",
          iccUrl: "/vendor/pdfjs/iccs/",
          enableXfa: false,
        });
        detruire = () => tache.destroy();
        const d = await tache.promise;
        const premiere = await d.getPage(1);
        const vue = premiere.getViewport({ scale: 1 });
        if (!vivant) return;
        setRatio(vue.height / vue.width);
        setDocumentPdf(d);
      } catch {
        if (vivant) setErreur("Ce PDF n'a pas pu être ouvert (fichier abîmé, protégé par un mot de passe, ou resté sur un autre appareil).");
      }
    })();
    return () => {
      vivant = false;
      void detruire?.();
    };
  }, [fichier]);

  // La largeur de la colonne décide de la taille des pages.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLargeur(Math.max(200, Math.floor(e.contentRect.width) - 24)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const largeurPage = Math.round(largeur * ZOOMS[zoom]);

  // La page en cours : celle qui occupe le haut de la colonne.
  const suivrePage = useCallback(() => {
    const el = racine.current;
    if (!el) return;
    const repere = el.getBoundingClientRect().top + el.clientHeight / 3;
    let courante = 1;
    for (const p of Array.from(el.querySelectorAll<HTMLElement>("[data-page]"))) {
      if (p.getBoundingClientRect().top <= repere) courante = Number(p.dataset.page);
      else break;
    }
    setPage(courante);
  }, []);

  // Ouvert à la bonne page (celle indiquée dans le bloc du document).
  useEffect(() => {
    if (!documentPdf || !largeurPage || !premiereFois.current) return;
    premiereFois.current = false;
    if (pageInitiale > 1) racine.current?.querySelector<HTMLElement>(`[data-page="${pageInitiale}"]`)?.scrollIntoView({ block: "start" });
  }, [documentPdf, largeurPage, pageInitiale]);

  // Le passage sélectionné dans le PDF, avec la page où il commence.
  useEffect(() => {
    const surSelection = () => {
      const s = window.getSelection();
      const texte = s?.toString().replace(/\s+/g, " ").trim() ?? "";
      const noeud = s?.anchorNode;
      const el = noeud ? (noeud.nodeType === 1 ? (noeud as Element) : noeud.parentElement) : null;
      const pageEl = el?.closest<HTMLElement>("[data-page]");
      if (!texte || !pageEl || !racine.current?.contains(pageEl)) {
        setSelection(null);
        return;
      }
      setSelection({ page: Number(pageEl.dataset.page), texte: texte.slice(0, 2000) });
    };
    document.addEventListener("selectionchange", surSelection);
    return () => document.removeEventListener("selectionchange", surSelection);
  }, []);

  return (
    <div className="calame-pdf">
      <div className="calame-pdf-barre">
        <span className="calame-pdf-nom" title={nom}>
          {nom}
        </span>
        <span className="calame-pdf-page" aria-live="polite">
          {documentPdf ? `p. ${page} / ${documentPdf.numPages}` : ""}
        </span>
        <button type="button" className="calame-icone" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label="Réduire">
          <ZoomOut className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="calame-icone" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1} aria-label="Agrandir">
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="calame-pdf-citer">
        <button type="button" className="bouton bouton-discret bouton-petit" disabled={!documentPdf} onClick={() => surCiter({ page, texte: "" })}>
          <Quote className="size-4" aria-hidden="true" /> Citer la page {page}
        </button>
        <button type="button" className="bouton bouton-discret bouton-petit" disabled={!selection} onClick={() => selection && surCiter(selection)} title={selection ? `« ${selection.texte.slice(0, 80)}… »` : "Sélectionne un passage dans le PDF"}>
          <TextQuote className="size-4" aria-hidden="true" /> Citer la sélection
        </button>
      </div>
      <div ref={racine} className="calame-pdf-pages" onScroll={suivrePage} tabIndex={0} aria-label={`Pages de ${nom}`}>
        {erreur ? (
          <p className="inspecteur-aide" data-alerte="">
            {erreur}
          </p>
        ) : !documentPdf || !largeurPage ? (
          <p className="inspecteur-aide">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Ouverture du PDF…
          </p>
        ) : (
          Array.from({ length: documentPdf.numPages }, (_, i) => <PagePdf key={i} documentPdf={documentPdf} numero={i + 1} largeur={largeurPage} hauteur={Math.round(largeurPage * ratio)} racine={racine} />)
        )}
      </div>
    </div>
  );
}

function PagePdf({ documentPdf, numero, largeur, hauteur, racine }: { documentPdf: PDFDocumentProxy; numero: number; largeur: number; hauteur: number; racine: React.RefObject<HTMLDivElement | null> }) {
  const boite = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const texte = useRef<HTMLDivElement>(null);
  const [proche, setProche] = useState(numero <= 2);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setProche(e.isIntersecting), { root: racine.current, rootMargin: "600px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [racine]);

  useEffect(() => {
    if (!proche) {
      if (toile.current) {
        toile.current.width = 0;
        toile.current.height = 0;
      }
      texte.current?.replaceChildren();
      return;
    }
    let tache: RenderTask | null = null;
    let annule = false;
    (async () => {
      const p = await documentPdf.getPage(numero);
      if (annule || !toile.current || !texte.current) return;
      const base = p.getViewport({ scale: 1 });
      const vue = p.getViewport({ scale: largeur / base.width });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const c = toile.current;
      c.width = Math.floor(vue.width * ratio);
      c.height = Math.floor(vue.height * ratio);
      c.style.width = `${vue.width}px`;
      c.style.height = `${vue.height}px`;
      tache = p.render({ canvas: c, viewport: vue, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
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
      await new pdfjs.TextLayer({ textContentSource: p.streamTextContent(), container: couche, viewport: vue }).render();
    })();
    return () => {
      annule = true;
      tache?.cancel();
    };
  }, [proche, documentPdf, numero, largeur]);

  return (
    <div ref={boite} className="calame-pdf-feuille" data-page={numero} style={{ width: largeur, height: hauteur }}>
      <canvas ref={toile} aria-hidden="true" />
      <div ref={texte} className="textLayer" />
      <span className="calame-pdf-numero" aria-hidden="true">
        {numero}
      </span>
    </div>
  );
}
