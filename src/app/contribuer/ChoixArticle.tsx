"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Search, X } from "lucide-react";

export type BlocSimple = { id: string; slug: string; titre: string; accent: string };
type ArticleTrouve = { id: string; titre: string; bloc_id: string };

/**
 * Choix d'un article publié, parmi les trois modules.
 * Le choix est transmis au serveur par un champ caché ; le serveur le revérifie.
 */
export function ChoixArticle({ blocs, nom = "article" }: { blocs: BlocSimple[]; nom?: string }) {
  const [q, setQ] = useState("");
  const [bloc, setBloc] = useState("");
  const [articles, setArticles] = useState<ArticleTrouve[]>([]);
  const [chargement, setChargement] = useState(true);
  const [choisi, setChoisi] = useState<ArticleTrouve | null>(null);
  const dernier = useRef(0);

  useEffect(() => {
    if (choisi) return;
    const marque = ++dernier.current;
    const minuteur = setTimeout(() => {
      setChargement(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (bloc) params.set("bloc", bloc);
      fetch(`/api/articles-publies?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (marque !== dernier.current) return;
          setArticles(Array.isArray(d.articles) ? d.articles : []);
          setChargement(false);
        })
        .catch(() => {
          if (marque === dernier.current) setChargement(false);
        });
    }, 220);
    return () => clearTimeout(minuteur);
  }, [q, bloc, choisi]);

  const titreBloc = (id: string) => blocs.find((b) => b.id === id)?.titre ?? "";

  if (choisi) {
    return (
      <div className="contrib-choisi" data-accent={blocs.find((b) => b.id === choisi.bloc_id)?.accent}>
        <input type="hidden" name={nom} value={choisi.id} />
        <BookOpen className="size-5 shrink-0 text-accent" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-xs uppercase tracking-wide text-encre-douce">Article choisi</span>
          <span className="block font-semibold">{choisi.titre}</span>
          <span className="block text-sm text-encre-douce">{titreBloc(choisi.bloc_id)}</span>
        </span>
        <button type="button" className="bouton bouton-discret ml-auto shrink-0" onClick={() => setChoisi(null)}>
          <X className="size-4" aria-hidden="true" />
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="contrib-choix">
      <div className="contrib-modules-filtre" role="group" aria-label="Filtrer par module">
        <button type="button" className="puce-module" aria-pressed={bloc === ""} onClick={() => setBloc("")}>
          Les trois modules
        </button>
        {blocs.map((b) => (
          <button key={b.id} type="button" className="puce-module" data-accent={b.accent} aria-pressed={bloc === b.id} onClick={() => setBloc(b.id)}>
            {b.titre}
          </button>
        ))}
      </div>

      <label className="contrib-recherche">
        <Search className="size-5 shrink-0 text-encre-douce" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un article par son titre…"
          aria-label="Chercher un article"
          className="w-full bg-transparent outline-none"
        />
        {chargement && <Loader2 className="size-4 shrink-0 animate-spin text-encre-douce" aria-hidden="true" />}
      </label>

      <ul className="contrib-liste-articles" aria-live="polite">
        {articles.map((a) => (
          <li key={a.id}>
            <button type="button" className="contrib-article" onClick={() => setChoisi(a)}>
              <span className="font-semibold">{a.titre}</span>
              <span className="text-sm text-encre-douce">{titreBloc(a.bloc_id)}</span>
            </button>
          </li>
        ))}
        {!chargement && articles.length === 0 && (
          <li className="px-3 py-4 text-sm text-encre-douce">
            {q ? "Aucun article publié ne porte ce titre." : "Aucun article publié pour l'instant dans ce module."}
          </li>
        )}
      </ul>
    </div>
  );
}
