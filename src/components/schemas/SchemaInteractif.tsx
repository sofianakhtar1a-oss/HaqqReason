"use client";

import { Download, Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { exporterPdf, exporterPng, exporterSvg } from "@/lib/client/export-schema";
import { disposer } from "@/lib/schemas/disposition";
import type { DonneesSchema } from "@/lib/schemas/modele";
import { cadreDe, SvgSchema } from "./SvgSchema";

/** Schéma dans un article, côté lecteur : zoom, déplacement, branches repliables, plein écran, export. */
export function SchemaInteractif({ donnees }: { donnees: DonneesSchema }) {
  const uid = useId().replace(/:/g, "");
  const [replies, setReplies] = useState<Set<string>>(() => new Set(donnees.noeuds.filter((n) => n.replie).map((n) => n.id)));
  const [vue, setVue] = useState({ x: 0, y: 0, k: 1 });
  const [plein, setPlein] = useState(false);
  const [menu, setMenu] = useState(false);
  const cadreRef = useRef<HTMLDivElement>(null);
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const plan = useMemo(() => (donnees.genre === "graphe" ? disposer(donnees, replies) : undefined), [donnees, replies]);
  const cadre = useMemo(() => cadreDe(donnees, plan), [donnees, plan]);
  const interactif = donnees.genre === "graphe";

  useEffect(() => {
    const el = cadreRef.current;
    if (!el || !interactif) return;
    const roue = (e: WheelEvent) => {
      if (!e.ctrlKey && !plein) return; // sans Ctrl, la molette fait défiler la page
      e.preventDefault();
      setVue((v) => ({ ...v, k: Math.min(5, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12))) }));
    };
    el.addEventListener("wheel", roue, { passive: false });
    return () => el.removeEventListener("wheel", roue);
  }, [interactif, plein]);

  useEffect(() => {
    if (!plein) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setPlein(false);
    window.addEventListener("keydown", echap);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", echap);
      document.body.style.overflow = "";
    };
  }, [plein]);

  const svg = () => cadreRef.current?.querySelector("svg") as SVGSVGElement | null;
  const transformation = `translate(${vue.x} ${vue.y}) translate(${cadre.x + cadre.l / 2} ${cadre.y + cadre.h / 2}) scale(${vue.k}) translate(${-(cadre.x + cadre.l / 2)} ${-(cadre.y + cadre.h / 2)})`;

  return (
    <figure className={`schema-bloc${plein ? " schema-plein-ecran" : ""}`} data-genre={donnees.genre}>
      {donnees.titre && <figcaption className="schema-titre">{donnees.titre}</figcaption>}
      <div
        ref={cadreRef}
        className={`schema-cadre${interactif ? " schema-deplacable" : ""}`}
        onPointerDown={(e) => {
          if (!interactif || (e.target as Element).closest("a, .schema-basculer")) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }}
        onPointerMove={(e) => {
          const avant = pointeurs.current.get(e.pointerId);
          if (!avant) return;
          const rect = cadreRef.current!.getBoundingClientRect();
          const echelle = cadre.l / rect.width;
          if (pointeurs.current.size === 2) {
            const autre = [...pointeurs.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
            if (autre) {
              const d1 = Math.hypot(avant.x - autre.x, avant.y - autre.y);
              const d2 = Math.hypot(e.clientX - autre.x, e.clientY - autre.y);
              if (d1 > 0) setVue((v) => ({ ...v, k: Math.min(5, Math.max(0.3, (v.k * d2) / d1)) }));
            }
          } else setVue((v) => ({ ...v, x: v.x + (e.clientX - avant.x) * echelle, y: v.y + (e.clientY - avant.y) * echelle }));
          pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }}
        onPointerUp={(e) => pointeurs.current.delete(e.pointerId)}
        onPointerCancel={(e) => pointeurs.current.delete(e.pointerId)}
      >
        <SvgSchema
          donnees={donnees}
          uid={uid}
          plan={plan}
          replies={replies}
          cadre={cadre}
          liensActifs
          transformation={interactif ? transformation : undefined}
          surBasculer={
            interactif
              ? (id) =>
                  setReplies((r) => {
                    const n = new Set(r);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                  })
              : undefined
          }
        />
      </div>
      <div className="schema-outils sans-impression" role="toolbar" aria-label="Outils du schéma">
        {interactif && (
          <>
            <button type="button" className="bouton-icone" aria-label="Zoomer" onClick={() => setVue((v) => ({ ...v, k: Math.min(5, v.k * 1.25) }))}>
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton-icone" aria-label="Dézoomer" onClick={() => setVue((v) => ({ ...v, k: Math.max(0.3, v.k / 1.25) }))}>
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton-icone" aria-label="Recentrer" onClick={() => setVue({ x: 0, y: 0, k: 1 })}>
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
        <button type="button" className="bouton-icone" aria-label={plein ? "Quitter le plein écran" : "Plein écran"} onClick={() => setPlein((p) => !p)}>
          {plein ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
        </button>
        <div className="relative">
          <button type="button" className="bouton-icone" aria-label="Exporter le schéma" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <Download className="size-4" aria-hidden="true" />
          </button>
          {menu && (
            <div className="schema-menu-export verre" role="menu">
              <button type="button" role="menuitem" onClick={() => { const s = svg(); if (s) void exporterPng(s, donnees.titre); setMenu(false); }}>
                Image PNG
              </button>
              <button type="button" role="menuitem" onClick={() => { const s = svg(); if (s) exporterSvg(s, donnees.titre); setMenu(false); }}>
                Vectoriel SVG
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); const f = cadreRef.current?.closest("figure"); if (f) exporterPdf(f as HTMLElement); }}>
                Document PDF
              </button>
            </div>
          )}
        </div>
      </div>
      {interactif && <p className="schema-aide sans-impression">Glisse pour te déplacer, Ctrl + molette ou pince pour zoomer, ± pour replier une branche.</p>}
    </figure>
  );
}
