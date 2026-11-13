"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/** Filtre instantané des fiches (accents et majuscules ignorés). */
export function FiltreSophismes() {
  const [q, setQ] = useState("");
  useEffect(() => {
    const norme = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const mots = norme(q).split(/\s+/).filter(Boolean);
    document.querySelectorAll<HTMLElement>(".fiche-sophisme").forEach((f) => {
      f.hidden = !mots.every((m) => norme(f.dataset.recherche ?? "").includes(m));
    });
    document.querySelectorAll<HTMLElement>(".famille-sophismes").forEach((s) => {
      s.hidden = [...s.querySelectorAll<HTMLElement>(".fiche-sophisme")].every((f) => f.hidden);
    });
  }, [q]);
  return (
    <div className="debat-recherche mt-8">
      <Search className="size-5 text-accent" aria-hidden="true" />
      <label htmlFor="filtre-sophismes" className="sr-only">
        Chercher un sophisme
      </label>
      <input id="filtre-sophismes" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Homme de paille, autorité, causalité…" />
    </div>
  );
}
