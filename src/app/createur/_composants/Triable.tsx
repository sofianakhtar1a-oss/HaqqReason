"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { reordonner } from "../contenu-actions";

/*
 * Glisser-déposer pour réordonner catégories et articles.
 * À la souris : on attrape la poignée. Au clavier : Tab jusqu'à la poignée, Espace pour saisir,
 * flèches pour déplacer, Espace pour déposer, Échap pour annuler.
 */

type Element = { id: string; titre: string };

const INSTRUCTIONS = {
  draggable:
    "Pour déplacer cet élément : appuie sur Espace pour le saisir, utilise les flèches pour le déplacer, puis Espace pour le déposer ou Échap pour annuler.",
};

function annonces(titres: Map<string, string>): Announcements {
  const t = (id: string | number) => `« ${titres.get(String(id)) ?? ""} »`;
  return {
    onDragStart: ({ active }) => `${t(active.id)} saisi.`,
    onDragOver: ({ active, over }) => (over ? `${t(active.id)} au-dessus de ${t(over.id)}.` : `${t(active.id)} hors de la liste.`),
    onDragEnd: ({ active, over }) => (over ? `${t(active.id)} déposé à la place de ${t(over.id)}.` : `${t(active.id)} déposé.`),
    onDragCancel: ({ active }) => `Déplacement de ${t(active.id)} annulé.`,
  };
}

function Ligne({ id, titre, rendu, grille }: { id: string; titre: string; rendu: React.ReactNode; grille: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-glisse={isDragging}
      className={grille ? "flex flex-col" : "rangee"}
    >
      {grille ? (
        <>
          {rendu}
          <div className="mt-1 flex justify-end">
            <button type="button" ref={setActivatorNodeRef} className="poignee" aria-label={`Déplacer « ${titre} »`} {...attributes} {...listeners}>
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" ref={setActivatorNodeRef} className="poignee shrink-0" aria-label={`Déplacer « ${titre} »`} {...attributes} {...listeners}>
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          {rendu}
        </>
      )}
    </li>
  );
}

type Props<T extends Element> = {
  table: "categories" | "articles";
  elements: T[];
  rendre: (element: T) => React.ReactNode;
  grille?: boolean;
  className?: string;
};

export function ListeTriable<T extends Element>({ table, elements, rendre, grille = false, className }: Props<T>) {
  const [ordre, setOrdre] = useState(elements);
  const [erreur, setErreur] = useState("");
  const capteurs = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function finir({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const avant = ordre;
    const apres = arrayMove(ordre, ordre.findIndex((e) => e.id === active.id), ordre.findIndex((e) => e.id === over.id));
    setOrdre(apres);
    setErreur("");
    const resultat = await reordonner({ table, ids: apres.map((e) => e.id) }).catch(() => ({ ok: false }));
    if (!resultat.ok) {
      setOrdre(avant);
      setErreur("Le nouvel ordre n'a pas pu être enregistré. Réessaie.");
    }
  }

  return (
    <>
      <DndContext
        sensors={capteurs}
        collisionDetection={closestCenter}
        onDragEnd={finir}
        accessibility={{ announcements: annonces(new Map(ordre.map((e) => [e.id, e.titre]))), screenReaderInstructions: INSTRUCTIONS }}
      >
        <SortableContext items={ordre.map((e) => e.id)} strategy={grille ? rectSortingStrategy : verticalListSortingStrategy}>
          <ul className={className}>
            {ordre.map((e) => (
              <Ligne key={e.id} id={e.id} titre={e.titre} rendu={rendre(e)} grille={grille} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {erreur && (
        <p role="alert" className="message message-erreur mt-3">
          {erreur}
        </p>
      )}
    </>
  );
}
