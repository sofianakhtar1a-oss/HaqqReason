"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Eraser, Trash2, Undo2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

/**
 * Le Calame — le bloc « Dessin » : à main levée, au doigt, au stylet ou à la souris.
 * Les traits sont gardés en vecteurs (un tracé SVG) : le dessin reste net à l'écran comme à
 * l'impression, et il pèse peu.
 */

type Trait = { c: string; e: number; p: number[] };

const LARGEUR = 1000;
const COULEURS = ["#1a1d2e", "#b42318", "#1f5fbf", "#1e7a46", "#c8901e"];
const EPAISSEURS = [2, 4, 8];
const MAX_POINTS = 40_000;

function lireTraits(brut: unknown): Trait[] {
  try {
    const t = typeof brut === "string" ? (JSON.parse(brut || "[]") as unknown) : brut;
    if (!Array.isArray(t)) return [];
    return t
      .filter((x): x is Trait => !!x && typeof x === "object" && Array.isArray((x as Trait).p))
      .map((x) => ({ c: /^#[0-9a-f]{6}$/i.test(x.c) ? x.c : COULEURS[0], e: Math.min(20, Math.max(1, Number(x.e) || 2)), p: x.p.filter((n) => Number.isFinite(n)).slice(0, MAX_POINTS) }));
  } catch {
    return [];
  }
}

/** Un tracé doux : les points reliés par des courbes passant par leurs milieux. */
function chemin(p: number[]): string {
  if (p.length < 2) return "";
  if (p.length === 2) return `M${p[0]} ${p[1]}l0.01 0`;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (p[i] + p[i + 2]) / 2;
    const my = (p[i + 1] + p[i + 3]) / 2;
    d += `Q${p[i]} ${p[i + 1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += `L${p[p.length - 2]} ${p[p.length - 1]}`;
  return d;
}

function VueDessin({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const hauteur = Math.min(1400, Math.max(120, Number(node.attrs.hauteur) || 420));
  const traits = useMemo(() => lireTraits(node.attrs.traits), [node.attrs.traits]);
  const [encours, setEncours] = useState<Trait | null>(null);
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [epaisseur, setEpaisseur] = useState(EPAISSEURS[1]);
  const [gomme, setGomme] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const modifiable = editor.isEditable && selected;

  const point = (e: React.PointerEvent): [number, number] => {
    const r = svg.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * LARGEUR * 10) / 10, Math.round(((e.clientY - r.top) / r.height) * hauteur * 10) / 10];
  };
  const enregistrer = (suite: Trait[]) => updateAttributes({ traits: JSON.stringify(suite) });

  return (
    <NodeViewWrapper className="calame-dessin" data-selectionne={selected || undefined} contentEditable={false}>
      <svg
        ref={svg}
        viewBox={`0 0 ${LARGEUR} ${hauteur}`}
        className="calame-dessin-toile"
        data-actif={modifiable ? "" : undefined}
        role="img"
        aria-label="Dessin à main levée"
        onPointerDown={(e) => {
          if (!modifiable) return;
          e.preventDefault();
          (e.target as Element).setPointerCapture?.(e.pointerId);
          const [x, y] = point(e);
          if (gomme) {
            // La gomme enlève le trait le plus proche du point touché.
            let meilleur = -1;
            let distance = 30;
            traits.forEach((t, i) => {
              for (let k = 0; k < t.p.length; k += 2) {
                const d = Math.hypot(t.p[k] - x, t.p[k + 1] - y);
                if (d < distance) {
                  distance = d;
                  meilleur = i;
                }
              }
            });
            if (meilleur >= 0) enregistrer(traits.filter((_, i) => i !== meilleur));
            return;
          }
          setEncours({ c: couleur, e: epaisseur, p: [x, y] });
        }}
        onPointerMove={(e) => {
          if (!encours) return;
          const [x, y] = point(e);
          const p = encours.p;
          // Pas de point inutile : on n'ajoute que si la plume a vraiment bougé.
          if (Math.hypot(p[p.length - 2] - x, p[p.length - 1] - y) < 2.5) return;
          setEncours({ ...encours, p: [...p, x, y] });
        }}
        onPointerUp={() => {
          if (!encours) return;
          const total = traits.reduce((s, t) => s + t.p.length, 0);
          if (total + encours.p.length <= MAX_POINTS) enregistrer([...traits, encours]);
          setEncours(null);
        }}
      >
        {traits.map((t, i) => (
          <path key={i} d={chemin(t.p)} stroke={t.c} strokeWidth={t.e} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {encours && <path d={chemin(encours.p)} stroke={encours.c} strokeWidth={encours.e} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {traits.length === 0 && !encours && <p className="calame-dessin-vide">{selected ? "Dessine ici, au doigt, au stylet ou à la souris." : "Clique pour dessiner."}</p>}
      {modifiable && (
        <div className="calame-dessin-outils sans-impression" role="toolbar" aria-label="Dessin">
          {COULEURS.map((c) => (
            <button key={c} type="button" className="calame-dessin-couleur" style={{ background: c }} aria-pressed={!gomme && couleur === c} aria-label={`Couleur ${c}`} onClick={() => (setCouleur(c), setGomme(false))} />
          ))}
          <span className="calame-image-separateur" aria-hidden="true" />
          {EPAISSEURS.map((ep) => (
            <button key={ep} type="button" aria-pressed={!gomme && epaisseur === ep} aria-label={`Épaisseur ${ep}`} onClick={() => (setEpaisseur(ep), setGomme(false))}>
              <span className="calame-dessin-trait" style={{ height: ep, background: "currentColor" }} />
            </button>
          ))}
          <button type="button" aria-pressed={gomme} onClick={() => setGomme((g) => !g)} title="Gomme : touche un trait pour l'effacer">
            <Eraser className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => enregistrer(traits.slice(0, -1))} disabled={traits.length === 0} title="Retirer le dernier trait">
            <Undo2 className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => enregistrer([])} disabled={traits.length === 0} title="Tout effacer">
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
          <label className="calame-dessin-hauteur">
            Hauteur
            <input type="range" min={120} max={1400} step={20} value={hauteur} onChange={(e) => updateAttributes({ hauteur: Number(e.target.value) })} />
          </label>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Dessin = Node.create({
  name: "dessin",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      traits: { default: "[]", parseHTML: (el) => el.getAttribute("data-traits") ?? "[]", renderHTML: (a) => ({ "data-traits": String(a.traits ?? "[]") }) },
      hauteur: { default: 420, parseHTML: (el) => Number(el.getAttribute("data-hauteur")) || 420, renderHTML: (a) => ({ "data-hauteur": String(a.hauteur ?? 420) }) },
    };
  },
  parseHTML() {
    return [{ tag: "div.calame-dessin[data-traits]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "calame-dessin" }), "Dessin"];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueDessin, {
      stopEvent: ({ event }) => {
        const cible = event.target as HTMLElement | null;
        return !!cible?.closest?.(".calame-dessin-outils, .calame-dessin-toile[data-actif]");
      },
    });
  },
});
