"use client";

import { Extension, Node, mergeAttributes, type Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Columns2, ImageOff, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { useUrlLocale } from "../VuesLocales";

/**
 * Le Calame — les images d'un document : le texte peut les entourer (à gauche, à droite),
 * leur taille se règle à la souris, elles tournent d'un quart de tour, et plusieurs images
 * se rangent côte à côte dans une galerie.
 */

export const ImageMiseEnPage = Extension.create({
  name: "imageMiseEnPage",
  addGlobalAttributes() {
    return [
      {
        types: ["image"],
        attributes: {
          habillage: { default: "", parseHTML: (el) => el.getAttribute("data-habillage") ?? "", renderHTML: (a) => (a.habillage ? { "data-habillage": String(a.habillage) } : {}) },
          taille: { default: 0, parseHTML: (el) => Number(el.getAttribute("data-taille")) || 0, renderHTML: (a) => (a.taille ? { "data-taille": String(a.taille) } : {}) },
          rotation: { default: 0, parseHTML: (el) => Number(el.getAttribute("data-rotation")) || 0, renderHTML: (a) => (a.rotation ? { "data-rotation": String(a.rotation) } : {}) },
        },
      },
    ];
  },
});

/** Ce que porte l'enveloppe de l'image dans le texte : c'est elle qui flotte, et qui a la largeur choisie. */
export function attributsEnveloppe(node: { attrs: Record<string, unknown> }): Record<string, string> {
  const a: Record<string, string> = {};
  const taille = Number(node.attrs.taille) || 0;
  if (node.attrs.habillage) a["data-habillage"] = String(node.attrs.habillage);
  if (taille) {
    a["data-taille"] = String(taille);
    a.style = `--taille: ${taille}%`;
  }
  return a;
}

export function VueImageCalame(props: NodeViewProps) {
  const attrs = props.node.attrs as { fichier: string; legende: string; alt: string; largeur: string; habillage: string; taille: number; rotation: number };
  const url = useUrlLocale(attrs.fichier);
  const legende = useRef(attrs.legende ?? "");
  const [naturel, setNaturel] = useState<{ l: number; h: number } | null>(null);
  const [glisse, setGlisse] = useState<number | null>(null);
  const figure = useRef<HTMLElement>(null);
  const rotation = Number(attrs.rotation) || 0;
  const quart = (rotation === 90 || rotation === 270) && naturel !== null;
  const modifiable = props.editor.isEditable;

  /** Tirer le coin : la largeur suit la souris, en pourcentage de la colonne de texte. */
  const tirer = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = figure.current?.closest(".react-renderer") as HTMLElement | null;
    const colonne = el?.parentElement?.getBoundingClientRect().width ?? 0;
    if (!el || !colonne) return;
    const depart = e.clientX;
    const largeur = el.getBoundingClientRect().width;
    const calcul = (x: number) => Math.max(10, Math.min(100, Math.round(((largeur + (x - depart) * (attrs.habillage === "droite" ? -1 : 1)) / colonne) * 100)));
    // Pendant le geste, seule l'enveloppe change (aucune étape d'annulation par pixel) ; on enregistre en lâchant.
    const bouger = (ev: PointerEvent) => {
      const t = calcul(ev.clientX);
      el.dataset.taille = String(t);
      el.style.setProperty("--taille", `${t}%`);
      setGlisse(t);
    };
    const lacher = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", lacher);
      setGlisse(null);
      props.updateAttributes({ taille: calcul(ev.clientX) });
    };
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", lacher);
  };

  const styleImage: React.CSSProperties | undefined = rotation
    ? quart && naturel
      ? { position: "absolute", top: "50%", left: "50%", width: `${(naturel.l / naturel.h) * 100}%`, height: `${(naturel.h / naturel.l) * 100}%`, maxWidth: "none", transform: `translate(-50%, -50%) rotate(${rotation}deg)` }
      : { transform: `rotate(${rotation}deg)` }
    : undefined;

  return (
    <NodeViewWrapper as="figure" ref={figure} className="image-bloc calame-image" data-largeur={attrs.largeur || "normale"} data-selectionne={props.selected || undefined} data-glisse={glisse !== null ? "" : undefined}>
      {url ? (
        <div className="calame-image-cadre" style={quart && naturel ? { aspectRatio: `${naturel.h} / ${naturel.l}` } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={attrs.alt || ""} style={styleImage} onLoad={(e) => setNaturel({ l: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 })} />
        </div>
      ) : (
        <span className="image-absente">
          <ImageOff className="size-5" aria-hidden="true" />
          Image introuvable : elle est peut-être restée sur un autre appareil
        </span>
      )}
      <figcaption>
        <input
          key={attrs.legende}
          defaultValue={attrs.legende ?? ""}
          onChange={(e) => {
            legende.current = e.target.value;
          }}
          onBlur={() => props.updateAttributes({ legende: legende.current })}
          placeholder="Légende (facultative)"
          className="image-legende-champ"
          aria-label="Légende de l'image"
        />
      </figcaption>

      {props.selected && modifiable && (
        <>
          <span className="calame-image-poignee sans-impression" onPointerDown={tirer} role="presentation" title="Tirer pour changer la taille" />
          <div className="calame-image-outils sans-impression" role="toolbar" aria-label="Image">
            {(
              [
                ["", "Seule"],
                ["gauche", "Texte à droite"],
                ["droite", "Texte à gauche"],
              ] as const
            ).map(([cle, libelle]) => (
              <button key={cle || "aucun"} type="button" aria-pressed={(attrs.habillage || "") === cle} onClick={() => props.updateAttributes({ habillage: cle })}>
                {libelle}
              </button>
            ))}
            <span className="calame-image-separateur" aria-hidden="true" />
            {[25, 50, 75, 100].map((t) => (
              <button key={t} type="button" aria-pressed={Number(attrs.taille) === t} onClick={() => props.updateAttributes({ taille: t })}>
                {t} %
              </button>
            ))}
            <button type="button" onClick={() => props.updateAttributes({ rotation: (rotation + 90) % 360 })} aria-label="Tourner d'un quart de tour" title="Tourner d'un quart de tour">
              <RotateCw className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => mettreCoteACote(props.editor, props.getPos())} title="Ranger côte à côte avec l'image suivante">
              <Columns2 className="size-4" aria-hidden="true" /> Côte à côte
            </button>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}

/** La galerie : plusieurs images sur une même ligne. */
export const Galerie = Node.create({
  name: "galerie",
  group: "block",
  content: "image+",
  draggable: true,
  parseHTML() {
    return [{ tag: "div.calame-galerie" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "calame-galerie" }), 0];
  },
});

/** Range l'image (à `pos`) et les images qui la suivent directement dans une galerie (jusqu'à quatre). */
export function mettreCoteACote(editor: Editor, pos: number | undefined): boolean {
  if (pos === undefined) return false;
  const { state } = editor;
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  const galerie = state.schema.nodes.galerie;
  if (!galerie) return false;
  if (parent.type.name === "galerie") {
    // Déjà dans une galerie : on y fait entrer l'image qui suit la galerie, s'il y en a une.
    const apres = $pos.after($pos.depth);
    const suivante = state.doc.nodeAt(apres);
    if (suivante?.type.name !== "image") return false;
    const tr = state.tr.delete(apres, apres + suivante.nodeSize).insert(apres - 1, suivante);
    editor.view.dispatch(tr);
    return true;
  }
  const index = $pos.index();
  let fin = index;
  while (fin + 1 < parent.childCount && fin - index < 3 && parent.child(fin + 1).type.name === "image") fin++;
  if (fin === index) return false;
  const debut = $pos.posAtIndex(index);
  const finPos = $pos.posAtIndex(fin + 1);
  const range = state.doc.resolve(debut + 1).blockRange(state.doc.resolve(finPos - 1));
  if (!range) return false;
  const tr = state.tr.wrap(range, [{ type: galerie }]);
  editor.view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, debut + 1)));
  return true;
}

/** Défait la galerie qui contient le curseur : les images reprennent leur place l'une sous l'autre. */
export function separerGalerie(editor: Editor): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const n = $from.node(d);
    if (n.type.name !== "galerie") continue;
    const pos = $from.before(d);
    editor.view.dispatch(state.tr.replaceWith(pos, pos + n.nodeSize, n.content));
    return true;
  }
  if (state.selection instanceof NodeSelection && state.selection.$from.parent.type.name === "galerie") {
    const $p = state.selection.$from;
    const pos = $p.before($p.depth);
    const n = $p.parent;
    editor.view.dispatch(state.tr.replaceWith(pos, pos + n.nodeSize, n.content));
    return true;
  }
  return false;
}
