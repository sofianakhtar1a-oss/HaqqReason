"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Suppression en deux touches : la première arme le bouton, la seconde supprime. */
export function BoutonSupprimer({ nom, onSupprimer }: { nom: string; onSupprimer: () => void }) {
  const [arme, setArme] = useState(false);
  useEffect(() => {
    if (!arme) return;
    const m = setTimeout(() => setArme(false), 3500);
    return () => clearTimeout(m);
  }, [arme]);
  return (
    <button
      type="button"
      className={arme ? "lg-supprimer" : "bouton-icone"}
      data-arme={arme || undefined}
      aria-label={arme ? `Confirmer la suppression de « ${nom} »` : `Supprimer « ${nom} »`}
      onClick={() => (arme ? onSupprimer() : setArme(true))}
      onBlur={() => setArme(false)}
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {arme && <span>Supprimer</span>}
    </button>
  );
}

export function telecharger(nom: string, contenu: string | Blob, type = "text/plain") {
  const blob = typeof contenu === "string" ? new Blob([contenu], { type: `${type};charset=utf-8` }) : contenu;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * La langue d'une vidéo ou d'un PDF : l'anglais (le texte affiché est anglais, un mot touché se traduit en français)
 * ou le français (le texte affiché est français, un mot touché se traduit en anglais).
 */
export function ChoixLangue({ valeur, onChange, quoi }: { valeur: "en" | "fr"; onChange: (l: "en" | "fr") => void; quoi: string }) {
  const options = [
    { id: "en", titre: "Anglais", aide: "Texte en anglais, traduction en français au toucher" },
    { id: "fr", titre: "Français", aide: "Texte en français, traduction en anglais au toucher" },
  ] as const;
  return (
    <fieldset className="lg-choix-langue">
      <legend className="lg-choix-langue-titre">{quoi}</legend>
      <div className="lg-choix-langue-options">
        {options.map((o) => (
          <label key={o.id} className="lg-choix-langue-option" data-choisi={valeur === o.id || undefined}>
            <input type="radio" name={`langue-${quoi}`} value={o.id} checked={valeur === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            <span className="lg-choix-langue-nom">{o.titre}</span>
            <span className="lg-choix-langue-aide">{o.aide}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
