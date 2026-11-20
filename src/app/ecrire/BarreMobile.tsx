"use client";

import type { Editor } from "@tiptap/core";
import { Bold, Heading2, Italic, KeyboardOff, List, Plus, Redo2, Search, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { editor: Editor; surRechercher: () => void };

/**
 * Sur téléphone et tablette : une barre compacte collée au-dessus du clavier, avec les
 * gestes essentiels. Elle suit le clavier grâce à la zone visible (visualViewport).
 */
export function BarreMobile({ editor, surRechercher }: Props) {
  const [bas, setBas] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    const tactile = window.matchMedia("(pointer: coarse)").matches;
    if (!tactile) return;
    const placer = () => {
      if (!vv) return;
      const clavier = window.innerHeight - vv.height - vv.offsetTop;
      setBas(Math.max(0, clavier));
    };
    const surFocus = () => setVisible(editor.isFocused);
    placer();
    vv?.addEventListener("resize", placer);
    vv?.addEventListener("scroll", placer);
    editor.on("focus", surFocus);
    editor.on("blur", surFocus);
    return () => {
      vv?.removeEventListener("resize", placer);
      vv?.removeEventListener("scroll", placer);
      editor.off("focus", surFocus);
      editor.off("blur", surFocus);
    };
  }, [editor]);

  if (!visible) return null;
  const bouton = (libelle: string, Icone: typeof Bold, faire: () => void, actif = false) => (
    <button
      type="button"
      aria-label={libelle}
      aria-pressed={actif}
      onMouseDown={(e) => e.preventDefault()}
      onClick={faire}
    >
      <Icone className="size-5" aria-hidden="true" />
    </button>
  );
  return (
    <div className="calame-barre-mobile sans-impression" style={{ bottom: bas }} role="toolbar" aria-label="Outils d'écriture">
      {bouton("Annuler", Undo2, () => editor.chain().focus().undo().run())}
      {bouton("Rétablir", Redo2, () => editor.chain().focus().redo().run())}
      {bouton("Gras", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {bouton("Italique", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {bouton("Titre", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading"))}
      {bouton("Liste", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {bouton("Insérer un bloc", Plus, () => editor.chain().focus().insertContent("/").run())}
      {bouton("Rechercher", Search, surRechercher)}
      {bouton("Fermer le clavier", KeyboardOff, () => (document.activeElement as HTMLElement | null)?.blur())}
    </div>
  );
}
