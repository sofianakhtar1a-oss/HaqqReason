"use client";

import type { Editor } from "@tiptap/core";
import { useState } from "react";
import { COULEURS, lienSur } from "@/lib/document-schema";

/** Pastilles de couleur. « retirer » efface la marque. */
export function Pastilles({ actuelle, choisir, retirer, prefixe }: { actuelle?: string | null; choisir: (c: string) => void; retirer: () => void; prefixe: "f" | "t" }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5" role="group">
      {COULEURS.map((c) => (
        <button
          key={c.cle}
          type="button"
          className="pastille"
          style={{ background: `var(--${prefixe}-${c.cle})` }}
          aria-label={c.libelle}
          title={c.libelle}
          aria-pressed={actuelle === c.cle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => choisir(c.cle)}
        />
      ))}
      <button type="button" className="outil text-sm" onMouseDown={(e) => e.preventDefault()} onClick={retirer}>
        Retirer
      </button>
    </div>
  );
}

/** Saisie d'une adresse de lien, appliquée à la sélection. */
export function FormulaireLien({ editor, fermer }: { editor: Editor; fermer: () => void }) {
  const [adresse, setAdresse] = useState(() => String(editor.getAttributes("link").href ?? ""));
  const [erreur, setErreur] = useState("");

  function appliquer(e: React.FormEvent) {
    e.preventDefault();
    const brut = adresse.trim();
    const complete = /^[a-z]+:|^\/|^#/i.test(brut) ? brut : `https://${brut}`;
    const sur = lienSur(complete);
    if (!sur) {
      setErreur("Adresse invalide. Exemple : https://exemple.org/page");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: sur }).run();
    fermer();
  }

  return (
    <form onSubmit={appliquer} className="w-72 space-y-2 p-1.5">
      <label className="etiquette !mb-0 text-sm" htmlFor="adresse-lien">
        Adresse du lien
      </label>
      <input id="adresse-lien" className="champ !min-h-10 !py-2" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="https://" autoFocus />
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" className="bouton bouton-principal !min-h-9 !px-4 !py-1 text-sm">
          Appliquer
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            className="bouton bouton-discret !min-h-9 !px-4 !py-1 text-sm"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              fermer();
            }}
          >
            Retirer le lien
          </button>
        )}
      </div>
    </form>
  );
}
