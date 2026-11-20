"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { variablesDeStyle, type ReglagesPage } from "@/lib/atelier/modele";
import { extensionsContenu } from "./extensions-calame";

type Props = { contenu: unknown; reglages?: ReglagesPage; etiquette?: string };

/**
 * Un document du Calame en lecture seule, d'un seul tenant (sans pages) : pour
 * l'aperçu d'une version, la vue côte à côte, la relecture d'un document partagé.
 */
export function VueLecture({ contenu, reglages, etiquette = "Texte du document (lecture seule)" }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: extensionsContenu(),
    content: contenu as object,
    editorProps: { attributes: { class: "tiptap", "aria-label": etiquette, lang: "fr" } },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.commands.setContent(contenu as object, { emitUpdate: false });
  }, [editor, contenu]);

  return (
    <div className="calame-lecture calame-texte" style={reglages ? (variablesDeStyle(reglages) as React.CSSProperties) : undefined}>
      <EditorContent editor={editor} />
    </div>
  );
}
