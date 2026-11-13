"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

/** Champ de recherche d'un article (pour relier un élément de schéma, une conclusion, un prérequis…). */
export function ChoixArticle({ valeur, onChange, libelle = "Article lié", exclure }: { valeur: string; onChange: (id: string, titre: string) => void; libelle?: string; exclure?: string[] }) {
  const exclus = (exclure ?? []).join(",");
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<{ id: string; titre: string }[]>([]);
  const [titre, setTitre] = useState("");

  useEffect(() => {
    if (!valeur) return;
    let annule = false;
    void fetch(`/api/article-titre?id=${valeur}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !annule && j?.titre && setTitre(j.titre));
    return () => {
      annule = true;
    };
  }, [valeur]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const minuteur = setTimeout(() => {
      void fetch(`/api/recherche?q=${encodeURIComponent(q)}&types=article&limite=8`)
        .then((r) => r.json())
        .then((j: { resultats?: { type: string; id: string; titre: string }[] }) => setResultats((j.resultats ?? []).filter((x) => x.type === "article" && !exclus.split(",").includes(x.id))));
    }, 250);
    return () => clearTimeout(minuteur);
  }, [q, exclus]);

  return (
    <div className="choix-article">
      <span className="etiquette text-sm">{libelle}</span>
      {valeur ? (
        <div className="flex items-center gap-2 rounded-xl border border-trait px-3 py-2">
          <span className="min-w-0 flex-1 truncate">{titre || "Article choisi"}</span>
          <button type="button" className="bouton-icone !size-8" aria-label="Retirer l'article lié" onClick={() => onChange("", "")}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-encre-douce" aria-hidden="true" />
          <input className="champ !min-h-10 !py-2 !pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un article…" aria-label={`${libelle} : chercher`} />
          {q.trim().length >= 2 && resultats.length > 0 && (
            <ul className="choix-article-liste verre">
              {resultats.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(r.id, r.titre);
                      setTitre(r.titre);
                      setQ("");
                      setResultats([]);
                    }}
                  >
                    {r.titre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
