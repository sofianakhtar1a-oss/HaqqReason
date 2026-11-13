"use client";

import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Link2, RemoveFormatting, Underline } from "lucide-react";
import { COULEURS } from "@/lib/document-schema";
import { Deroulant } from "./Deroulant";
import { FormulaireLien } from "./outils-communs";

/** Petit menu qui apparaît au-dessus du texte sélectionné : l'essentiel à portée de main. */
export function MenuBulle({ editor }: { editor: Editor }) {
  const e = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      gras: ed.isActive("bold"),
      italique: ed.isActive("italic"),
      souligne: ed.isActive("souligne"),
      surligne: (ed.getAttributes("surligne").couleur as string | undefined) ?? null,
      lien: ed.isActive("link"),
    }),
  });
  // Le clic n'ôte pas le focus de l'éditeur (mousedown bloqué) : inutile de le redonner, ce qui pourrait
  // rétablir l'ancienne sélection une image plus tard.
  const c = () => editor.chain();
  const garder = (ev: React.MouseEvent) => ev.preventDefault();

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state, from, to }) => from !== to && !(state.selection instanceof NodeSelection) && !state.selection.empty}
      className="menu-bulle"
      aria-label="Mise en forme rapide"
    >
      <button type="button" className="outil" aria-label="Gras" aria-pressed={e.gras} onMouseDown={garder} onClick={() => c().toggleBold().run()}>
        <Bold className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="outil" aria-label="Italique" aria-pressed={e.italique} onMouseDown={garder} onClick={() => c().toggleItalic().run()}>
        <Italic className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="outil"
        aria-label="Souligner"
        aria-pressed={e.souligne}
        onMouseDown={garder}
        onClick={() => (e.souligne ? c().unsetMark("souligne").run() : c().setMark("souligne", { style: "simple", couleur: null }).run())}
      >
        <Underline className="size-4" aria-hidden="true" />
      </button>
      <span className="barre-separateur" aria-hidden="true" />
      {COULEURS.map((couleur) => (
        <button
          key={couleur.cle}
          type="button"
          className="pastille !size-5"
          style={{ background: `var(--f-${couleur.cle})` }}
          aria-label={`Surligner en ${couleur.libelle.toLowerCase()}`}
          title={`Surligner en ${couleur.libelle.toLowerCase()}`}
          aria-pressed={e.surligne === couleur.cle}
          onMouseDown={garder}
          onClick={() => (e.surligne === couleur.cle ? c().unsetMark("surligne").run() : c().setMark("surligne", { couleur: couleur.cle }).run())}
        />
      ))}
      <span className="barre-separateur" aria-hidden="true" />
      <Deroulant libelle="Lien" actif={e.lien} aDroite bouton={<Link2 className="size-4" aria-hidden="true" />}>
        {(fermer) => <FormulaireLien editor={editor} fermer={fermer} />}
      </Deroulant>
      <button type="button" className="outil" aria-label="Effacer la mise en forme" onMouseDown={garder} onClick={() => c().unsetAllMarks().run()}>
        <RemoveFormatting className="size-4" aria-hidden="true" />
      </button>
    </BubbleMenu>
  );
}
