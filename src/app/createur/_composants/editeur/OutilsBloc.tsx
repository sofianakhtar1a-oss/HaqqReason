"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

/*
 * Petite poubelle qui apparaît au survol d'un bloc (encadré, verset, hadith, schéma…).
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

function typeDuBloc(element: HTMLElement): string | null {
  return BLOCS.find((b) => element.matches(b.selecteur))?.type ?? null;
}

type Cible = { element: HTMLElement; haut: number; droite: number };

export function OutilsBloc({ editor, conteneur }: { editor: Editor; conteneur: React.RefObject<HTMLDivElement | null> }) {
  const [cible, setCible] = useState<Cible | null>(null);
  const surBouton = useRef(false);

  useEffect(() => {
    const zone = conteneur.current;
    if (!zone || !editor.isEditable) return;

    const placer = (element: HTMLElement) => {
      const boite = element.getBoundingClientRect();
      const cadre = zone.getBoundingClientRect();
      setCible({ element, haut: boite.top - cadre.top, droite: cadre.right - boite.right });
    };

    const survol = (e: Event) => {
      const depart = e.target as HTMLElement | null;
      if (!depart || surBouton.current) return;
      // Le bloc le plus EXTERNE : un verset dans un encadré se supprime en entier.
      let trouve: HTMLElement | null = null;
      let courant: HTMLElement | null = depart.closest(SELECTEUR);
      while (courant && zone.contains(courant)) {
        trouve = courant;
        courant = courant.parentElement?.closest(SELECTEUR) ?? null;
      }
      if (trouve) placer(trouve);
      else setCible(null);
    };

    const sortie = (e: MouseEvent) => {
      const vers = e.relatedTarget as HTMLElement | null;
      if (!vers || !zone.contains(vers)) {
        if (!surBouton.current) setCible(null);
      }
    };

    const defiler = () => setCible(null);

    zone.addEventListener("mouseover", survol);
    zone.addEventListener("mouseout", sortie);
    window.addEventListener("scroll", defiler, { passive: true });
    window.addEventListener("resize", defiler);
    return () => {
      zone.removeEventListener("mouseover", survol);
      zone.removeEventListener("mouseout", sortie);
      window.removeEventListener("scroll", defiler);
      window.removeEventListener("resize", defiler);
    };
  }, [editor, conteneur]);

  if (!cible || !editor.isEditable) return null;

  const supprimer = () => {
    const element = cible.element;
    const type = typeDuBloc(element);
    setCible(null);
    // Le bouton disparaît sous le curseur : sans cette remise à zéro, « la souris est
    // sur le bouton » resterait vrai pour toujours et plus aucune poubelle n'apparaîtrait.
    surBouton.current = false;
    if (!type) return;
    try {
      const vue = editor.view;
      const position = vue.posAtDOM(element, 0);
      if (position < 0) return;
      const doc = editor.state.doc;
      const resolu = doc.resolve(Math.min(Math.max(position, 0), doc.content.size));

      // Cas d'un bloc insécable (schéma, carte, sommaire…) : le nœud commence juste là.
      let debut = -1;
      const juste = doc.nodeAt(resolu.pos);
      if (juste?.type.name === type) debut = resolu.pos;

      // Sinon on remonte jusqu'au nœud de ce type exact qui contient le curseur.
      if (debut < 0) {
        for (let d = resolu.depth; d >= 1; d--) {
          if (resolu.node(d).type.name === type) {
            debut = resolu.before(d);
            break;
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
        setCible(null);
      }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={supprimer}
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}
