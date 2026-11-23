"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

/*
 * Petite poubelle d'un bloc (encadré, verset, hadith, image, schéma…). Elle apparaît :
 *  - au survol d'un bloc, à la souris ;
 *  - sur le bloc choisi (une image touchée du doigt, un schéma cliqué, le curseur dans un encadré),
 *    sur ordinateur comme sur téléphone. C'est le seul bouton de suppression d'un bloc.
 * Elle vit EN DEHORS du document : rien n'est ajouté au contenu de l'article, donc
 * la saisie, l'enregistrement et l'export restent exactement les mêmes.
 */

/**
 * Blocs qu'on peut retirer d'un seul geste, avec le type exact du nœud derrière chaque
 * apparence : la suppression vise ce type précis, jamais « le bloc au-dessus ».
 */
const BLOCS: { selecteur: string; type: string }[] = [
  { selecteur: ".encadre", type: "encadre" },
  { selecteur: ".verset", type: "verset" },
  { selecteur: ".hadith", type: "hadith" },
  { selecteur: ".source-bloc", type: "source" },
  { selecteur: ".objection-reponse", type: "objectionReponse" },
  { selecteur: ".comparaison", type: "comparaison" },
  { selecteur: ".accordeon", type: "accordeon" },
  { selecteur: ".frise", type: "frise" },
  { selecteur: ".image-bloc", type: "image" },
  { selecteur: ".document-bloc", type: "documentPdf" },
  { selecteur: ".carte-lien", type: "lienCarte" },
  { selecteur: ".schema-bloc-editeur", type: "schema" },
  { selecteur: ".logique-bloc-editeur", type: "logique" },
  { selecteur: ".sophisme-bloc", type: "sophisme" },
  { selecteur: ".citation-ouvrage", type: "citationOuvrage" },
  { selecteur: ".table-matieres", type: "sommaire" },
];
const SELECTEUR = BLOCS.map((b) => b.selecteur).join(",");

/** Le bloc choisi peut aussi être un petit élément dans le texte : appel de note, référence. */
const PETITS: { selecteur: string; type: string }[] = [
  { selecteur: ".note-marqueur", type: "note" },
  { selecteur: ".reference-appel", type: "reference" },
];
const SELECTEUR_CHOISI = [...BLOCS, ...PETITS].map((b) => b.selecteur).join(",");
const TYPES_CHOISIS = new Set([...BLOCS, ...PETITS].map((b) => b.type));
/** Les blocs qu'on habite (le curseur est dedans) : choisis tant que le curseur y reste. */
const CONTENEURS = new Set(["verset", "hadith", "encadre", "frise", "objectionReponse", "comparaison", "accordeon"]);

function typeDuBloc(element: HTMLElement): string | null {
  return BLOCS.find((b) => element.matches(b.selecteur))?.type ?? null;
}

type Cible = { element: HTMLElement; type: string; pos: number | null; haut: number; droite: number };

/** Le bloc choisi, comme le panneau « Bloc sélectionné » : nœud sélectionné, ou bloc qui contient le curseur. */
function blocChoisi(editor: Editor): { pos: number; type: string } | null {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && TYPES_CHOISIS.has(selection.node.type.name)) return { pos: selection.from, type: selection.node.type.name };
  const { $from } = selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (CONTENEURS.has(n.type.name)) return { pos: $from.before(d), type: n.type.name };
  }
  return null;
}

/** La partie visible où vit l'élément : son premier parent qui défile, sinon la zone d'écriture. */
function partieVisible(element: HTMLElement, zone: HTMLElement): DOMRect {
  for (let p = element.parentElement; p && p !== zone; p = p.parentElement) {
    const style = getComputedStyle(p);
    if (/(auto|scroll)/.test(style.overflowY) && p.scrollHeight > p.clientHeight) return p.getBoundingClientRect();
  }
  return zone.getBoundingClientRect();
}

/**
 * Où poser la poubelle d'un bloc : à son coin haut droit, ou plus bas si une barre collée
 * (barre d'outils, panneau du bas) cache ce coin. Rien si le bloc n'est pas visible.
 */
function placement(element: HTMLElement, zone: HTMLElement): { haut: number; droite: number } | null {
  const boite = element.getBoundingClientRect();
  const visible = partieVisible(element, zone);
  if (boite.bottom < visible.top + 8 || boite.top > visible.bottom - 8) return null;
  const x = Math.min(boite.right, visible.right) - 22;
  for (let y = Math.max(boite.top, visible.top) + 6; y < Math.min(boite.bottom, visible.bottom) - 6; y += 12) {
    const dessus = document.elementFromPoint(x, y);
    if (dessus && (element.contains(dessus) || dessus.closest(".bloc-poubelle"))) {
      const cadre = zone.getBoundingClientRect();
      return { haut: y - 6 - cadre.top, droite: cadre.right - boite.right };
    }
  }
  return null;
}

export function OutilsBloc({ editor, conteneur }: { editor: Editor; conteneur: React.RefObject<HTMLDivElement | null> }) {
  const [survol, setSurvol] = useState<Cible | null>(null);
  const [choisi, setChoisi] = useState<Cible | null>(null);
  const surBouton = useRef(false);

  // Au survol de la souris : le bloc le plus externe sous le pointeur.
  useEffect(() => {
    const zone = conteneur.current;
    if (!zone || !editor.isEditable) return;

    const placer = (element: HTMLElement) => {
      const type = typeDuBloc(element);
      const ou = type ? placement(element, zone) : null;
      setSurvol(type && ou ? { element, type, pos: null, ...ou } : null);
    };

    // Au doigt, le navigateur imite un survol à chaque toucher : c'est le bloc choisi qui compte.
    let auDoigt = false;
    const pointeur = (e: PointerEvent) => {
      auDoigt = e.pointerType === "touch";
    };

    const survoler = (e: Event) => {
      const depart = e.target as HTMLElement | null;
      if (!depart || surBouton.current || auDoigt) return;
      // Le bloc le plus EXTERNE : un verset dans un encadré se supprime en entier.
      let trouve: HTMLElement | null = null;
      let courant: HTMLElement | null = depart.closest(SELECTEUR);
      while (courant && zone.contains(courant)) {
        trouve = courant;
        courant = courant.parentElement?.closest(SELECTEUR) ?? null;
      }
      if (trouve) placer(trouve);
      else setSurvol(null);
    };

    const sortie = (e: MouseEvent) => {
      const vers = e.relatedTarget as HTMLElement | null;
      if (!vers || !zone.contains(vers)) {
        if (!surBouton.current) setSurvol(null);
      }
    };

    const defiler = () => setSurvol(null);

    zone.addEventListener("pointerdown", pointeur, { capture: true });
    zone.addEventListener("mouseover", survoler);
    zone.addEventListener("mouseout", sortie);
    window.addEventListener("scroll", defiler, { passive: true });
    window.addEventListener("resize", defiler);
    return () => {
      zone.removeEventListener("pointerdown", pointeur, { capture: true });
      zone.removeEventListener("mouseover", survoler);
      zone.removeEventListener("mouseout", sortie);
      window.removeEventListener("scroll", defiler);
      window.removeEventListener("resize", defiler);
    };
  }, [editor, conteneur]);

  // Le bloc choisi (clic, doigt, curseur) : sa poubelle le suit, même quand la page défile.
  useEffect(() => {
    const zone = conteneur.current;
    if (!zone || !editor.isEditable) return;
    let image = 0;
    const mesurer = () => {
      const bloc = blocChoisi(editor);
      if (!bloc) return setChoisi(null);
      let element: HTMLElement | null = null;
      try {
        const dom = editor.view.nodeDOM(bloc.pos);
        element = dom instanceof HTMLElement ? dom : null;
      } catch {
        element = null;
      }
      if (element && !element.matches(SELECTEUR_CHOISI)) element = element.querySelector<HTMLElement>(SELECTEUR_CHOISI) ?? element;
      if (!element || !zone.contains(element)) return setChoisi(null);
      const ou = placement(element, zone);
      setChoisi(ou ? { element, type: bloc.type, pos: bloc.pos, ...ou } : null);
    };
    const plusTard = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(mesurer);
    };
    editor.on("selectionUpdate", plusTard);
    editor.on("update", plusTard);
    // Le défilement de n'importe quelle partie de la page (capture : il ne remonte pas tout seul).
    window.addEventListener("scroll", plusTard, { passive: true, capture: true });
    window.addEventListener("resize", plusTard);
    plusTard();
    return () => {
      cancelAnimationFrame(image);
      editor.off("selectionUpdate", plusTard);
      editor.off("update", plusTard);
      window.removeEventListener("scroll", plusTard, { capture: true });
      window.removeEventListener("resize", plusTard);
    };
  }, [editor, conteneur]);

  const cible = survol ?? choisi;
  if (!cible || !editor.isEditable) return null;

  /** Supprime le nœud visé par sa position exacte (bloc choisi), ou retrouvé depuis l'élément survolé. */
  const supprimer = () => {
    const { element, type, pos } = cible;
    setSurvol(null);
    setChoisi(null);
    // Le bouton disparaît sous le curseur : sans cette remise à zéro, « la souris est
    // sur le bouton » resterait vrai pour toujours et plus aucune poubelle n'apparaîtrait.
    surBouton.current = false;
    try {
      const doc = editor.state.doc;
      let debut = -1;
      if (pos !== null) {
        if (doc.nodeAt(pos)?.type.name === type) debut = pos;
      } else {
        const position = editor.view.posAtDOM(element, 0);
        if (position < 0) return;
        const resolu = doc.resolve(Math.min(Math.max(position, 0), doc.content.size));
        // Cas d'un bloc insécable (schéma, carte, sommaire…) : le nœud commence juste là.
        if (doc.nodeAt(resolu.pos)?.type.name === type) debut = resolu.pos;
        // Sinon on remonte jusqu'au nœud de ce type exact qui contient le curseur.
        if (debut < 0) {
          for (let d = resolu.depth; d >= 1; d--) {
            if (resolu.node(d).type.name === type) {
              debut = resolu.before(d);
              break;
            }
          }
        }
      }
      if (debut < 0) return;
      const noeud = doc.nodeAt(debut);
      if (!noeud || noeud.type.name !== type) return;

      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.delete(debut, debut + noeud.nodeSize);
          return true;
        })
        .run();
    } catch {
      // Bloc déjà retiré entre-temps : il n'y a rien à faire.
    }
  };

  return (
    <button
      type="button"
      className="bloc-poubelle"
      style={{ top: cible.haut, right: cible.droite }}
      title="Supprimer ce bloc"
      aria-label="Supprimer ce bloc"
      onMouseEnter={() => (surBouton.current = true)}
      onMouseLeave={() => {
        surBouton.current = false;
        setSurvol(null);
      }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={supprimer}
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}
