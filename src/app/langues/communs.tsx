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
