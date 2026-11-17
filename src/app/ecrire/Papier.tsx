"use client";

import type { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { geometrie, MM, remplirLigne, variablesDeStyle, type ReglagesPage } from "@/lib/atelier/modele";
import { paginer, type BlocMesure, type Page } from "@/lib/atelier/pagination";
import { appliquerCoupures, type Coupure } from "./pages-extension";

/** Blanc laissé entre deux feuilles, à l'écran. */
const ECART = 30;

/*
 * Aucun bloc n'est coupé en deux par un changement de page : un paragraphe qui
 * ne tient plus descend entier sur la feuille suivante. C'est le seul choix
 * tenable avec un texte unique — on ne peut pas scinder un élément du document
 * en deux moitiés — et c'est aussi ce que fait l'impression, puisque la feuille
 * de style demande la même chose au navigateur (break-inside: avoid). Écran et
 * papier tombent donc exactement au même endroit.
 */

type Props = {
  editor: Editor | null;
  reglages: ReglagesPage;
  titre: string;
  /** Prévenu quand le nombre de pages change, pour l'afficher ailleurs. */
  surPages?: (nombre: number) => void;
};

/**
 * La feuille. Largeur, marges et hauteur sont celles du papier choisi ; le
 * texte y tombe exactement là où il tombera à l'impression, parce que l'écran
 * et l'imprimante partagent la même géométrie.
 */
export function Papier({ editor, reglages, titre, surPages }: Props) {
  const flux = useRef<HTMLDivElement>(null);
  const attente = useRef<number | null>(null);
  const [pages, setPages] = useState<Page[]>([{ numero: 1, debut: 0, fin: 0, blocs: [] }]);
  const g = geometrie(reglages);

  const mesurer = useCallback(() => {
    const zone = flux.current?.querySelector<HTMLElement>(".tiptap");
    if (!zone || !editor) return;

    /*
     * Les unités que l'on peut envoyer à la page suivante : chaque bloc du texte,
     * et, dans une liste, chaque puce — sinon une longue liste, d'un seul tenant,
     * déborderait dans la marge du bas.
     * Les blancs déjà posés faussent les positions : on les retranche pour
     * raisonner toujours dans le texte « à plat », ce qui rend le calcul stable.
     */
    const LISTES = ["bulletList", "orderedList", "taskList"];
    const sansBlancs = (el: Element) => (Array.from(el.children) as HTMLElement[]).filter((e) => e.dataset.blanc !== "page");
    const domBlocs = sansBlancs(zone);
    const unites: { pos: number; el: HTMLElement; saut: boolean }[] = [];
    editor.state.doc.forEach((noeud, offset, i) => {
      const el = domBlocs[i];
      if (!el) return;
      const puces = LISTES.includes(noeud.type.name) ? sansBlancs(el) : [];
      if (puces.length === noeud.childCount && puces.length > 1) {
        noeud.forEach((_, o, j) => unites.push({ pos: offset + 1 + o, el: puces[j], saut: j === 0 && el.classList.contains("saut-page") }));
      } else unites.push({ pos: offset, el, saut: el.classList.contains("saut-page") });
    });
    const origine = zone.getBoundingClientRect().top;
    const blancs = (Array.from(zone.querySelectorAll('[data-blanc="page"]')) as HTMLElement[]).map((b) => ({ haut: b.getBoundingClientRect().top - origine, hauteur: b.offsetHeight }));
    const blocs: BlocMesure[] = unites.map((u, index) => {
      const r = u.el.getBoundingClientRect();
      const haut = r.top - origine;
      const avant = blancs.reduce((s, b) => (b.haut < haut - 0.5 ? s + b.hauteur : s), 0);
      return { id: String(index), haut: haut - avant, hauteur: r.height, insecable: true, sautAvant: u.saut };
    });

    const pagination = paginer(blocs, g.zone.hauteur);
    const coupures: Coupure[] = [];
    let cumul = 0;
    for (let i = 1; i < pagination.pages.length; i++) {
      const page = pagination.pages[i];
      const premier = page.blocs[0];
      if (premier === undefined) continue;
      const bloc = blocs[Number(premier)];
      // Un bloc plus haut qu'une page ouvre la suivante sans y commencer : pas de blanc.
      if (!bloc || bloc.haut < page.debut - 0.5) continue;
      const cible = i * (g.page.hauteur + ECART);
      const hauteur = Math.max(0, Math.round(cible - (page.debut + cumul)));
      coupures.push({ pos: unites[Number(premier)].pos, hauteur, numero: i + 1 });
      cumul += hauteur;
    }

    appliquerCoupures(editor, coupures);
    setPages((anciennes) => (anciennes.length === pagination.pages.length ? anciennes : pagination.pages));
    surPages?.(pagination.pages.length);
  }, [editor, g.page.hauteur, g.zone.hauteur, surPages]);

  /*
   * Deux mesures : une tout de suite après le prochain rendu, une autre juste
   * derrière. La seconde rattrape ce qui n'était pas encore en place à la
   * première — une image qui vient d'arriver, un bloc inséré à l'instant.
   */
  const demanderMesure = useCallback(() => {
    if (attente.current !== null) return;
    attente.current = requestAnimationFrame(() => {
      attente.current = null;
      mesurer();
      setTimeout(mesurer, 150);
    });
  }, [mesurer]);

  useEffect(() => {
    if (!editor) return;
    const zone = flux.current?.querySelector<HTMLElement>(".tiptap");
    editor.on("update", demanderMesure);
    const observateur = zone ? new ResizeObserver(demanderMesure) : null;
    if (zone && observateur) observateur.observe(zone);
    window.addEventListener("resize", demanderMesure);
    demanderMesure();
    return () => {
      editor.off("update", demanderMesure);
      observateur?.disconnect();
      window.removeEventListener("resize", demanderMesure);
      if (attente.current !== null) cancelAnimationFrame(attente.current);
    };
  }, [editor, demanderMesure]);

  // Changer de format, de marges ou de police refait tomber le texte ailleurs.
  useEffect(() => {
    demanderMesure();
  }, [demanderMesure, reglages]);

  const hauteurTotale = pages.length * (g.page.hauteur + ECART) - ECART;
  const contexte = { titre, pages: pages.length };

  return (
    <div className="calame-scene">
      <div
        ref={flux}
        className="calame-flux"
        data-sombre={reglages.papierSombre ? "" : undefined}
        data-reperes={reglages.reperes ? "" : undefined}
        style={{ ...(variablesDeStyle(reglages) as React.CSSProperties), width: g.page.largeur, height: hauteurTotale }}
      >
        <div className="calame-feuilles" aria-hidden="true">
          {pages.map((page) => {
            const haut = (page.numero - 1) * (g.page.hauteur + ECART);
            const nue = reglages.premierePageNue && page.numero === 1;
            return (
              <div key={page.numero} className="calame-feuille" style={{ top: haut, height: g.page.hauteur }}>
                <span className="calame-marges" style={{ inset: `${reglages.marges.haut * MM}px ${reglages.marges.droite * MM}px ${reglages.marges.bas * MM}px ${reglages.marges.gauche * MM}px` }} />
                {!nue && reglages.entete.trim() !== "" && (
                  <span className="calame-entete" style={{ top: Math.max(6, reglages.marges.haut * MM - 24), left: reglages.marges.gauche * MM, right: reglages.marges.droite * MM }}>
                    {remplirLigne(reglages.entete, { ...contexte, page: page.numero })}
                  </span>
                )}
                {!nue && (reglages.pied.trim() !== "" || reglages.numeroter) && (
                  <span className="calame-pied" style={{ bottom: Math.max(6, reglages.marges.bas * MM - 26), left: reglages.marges.gauche * MM, right: reglages.marges.droite * MM }}>
                    <span>{remplirLigne(reglages.pied, { ...contexte, page: page.numero })}</span>
                    {reglages.numeroter && <span className="calame-numero">{page.numero}</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="calame-texte"
          style={{
            paddingTop: reglages.marges.haut * MM,
            paddingBottom: reglages.marges.bas * MM,
            paddingLeft: reglages.marges.gauche * MM,
            paddingRight: reglages.marges.droite * MM,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
