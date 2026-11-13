"use client";

import Link from "next/link";
import { FolderPlus, Heart, History, Trash2, WifiOff } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { abonnerConnexion, abonnerFavoris, basculerFavori, garderHorsLigne, instantaneFavoris, lireFavoris } from "@/lib/client/favoris";
import { abonnerCollections, ecrireCollections, effacerHistorique, lireCollections, lireHistorique, type Collections, type Visite } from "@/lib/client/historique";

const AUCUNE: Collections = {};

export function ListeFavoris() {
  const favoris = useSyncExternalStore(abonnerFavoris, instantaneFavoris, () => null);
  const collections = useSyncExternalStore(abonnerCollections, lireCollections, () => AUCUNE);
  const horsLigne = useSyncExternalStore(abonnerConnexion, () => !navigator.onLine, () => false);
  const [onglet, setOnglet] = useState<"favoris" | "historique">("favoris");
  const [filtre, setFiltre] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState("");
  const [historique, setHistorique] = useState<Visite[] | null>(null);

  useEffect(() => {
    // Remet à jour la copie hors ligne des favoris à chaque visite de cette page.
    if (navigator.onLine) garderHorsLigne(lireFavoris().map((f) => `/explorer/article/${f.id}`));
  }, []);

  if (favoris === null) return null;
  const noms = Object.keys(collections).sort((a, b) => a.localeCompare(b, "fr"));
  const visibles = filtre ? favoris.filter((f) => collections[filtre]?.includes(f.id)) : favoris;
  const ranger = (id: string, nom: string, dedans: boolean) => {
    const c = { ...collections };
    c[nom] = dedans ? [...new Set([...(c[nom] ?? []), id])] : (c[nom] ?? []).filter((x) => x !== id);
    ecrireCollections(c);
  };

  return (
    <div className="mt-8">
      {horsLigne && (
        <p className="message mb-6 flex items-center gap-2">
          <WifiOff className="size-4" aria-hidden="true" />
          Tu es hors ligne : tes favoris et les articles déjà consultés restent lisibles.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Affichage">
        <button type="button" role="tab" aria-selected={onglet === "favoris"} className="puce-filtre" onClick={() => setOnglet("favoris")}>
          <Heart className="size-4" aria-hidden="true" /> Favoris
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={onglet === "historique"}
          className="puce-filtre"
          onClick={() => {
            setOnglet("historique");
            setHistorique(lireHistorique());
          }}
        >
          <History className="size-4" aria-hidden="true" /> Historique de lecture
        </button>
      </div>

      {onglet === "historique" ? (
        <div className="mt-6">
          {!historique || historique.length === 0 ? (
            <p className="verre rounded-3xl p-6 text-encre-douce">Aucun article lu sur cet appareil pour l&apos;instant.</p>
          ) : (
            <>
              <ol className="grid gap-2">
                {historique.map((v) => (
                  <li key={v.id}>
                    <Link href={`/explorer/article/${v.id}`} className="rangee hover:text-accent">
                      <span className="min-w-0 flex-1 truncate font-semibold">{v.titre}</span>
                      <span className="shrink-0 text-sm text-encre-douce">{new Date(v.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="bouton bouton-discret mt-4"
                onClick={() => {
                  effacerHistorique();
                  setHistorique([]);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" /> Effacer l&apos;historique
              </button>
            </>
          )}
        </div>
      ) : favoris.length === 0 ? (
        <p className="verre mt-6 rounded-3xl p-6 text-encre-douce">Aucun favori pour l&apos;instant. Ouvre un article et touche « Ajouter aux favoris ».</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Collections">
            <button type="button" className="puce-filtre" aria-pressed={filtre === null} onClick={() => setFiltre(null)}>
              Tous ({favoris.length})
            </button>
            {noms.map((n) => (
              <button key={n} type="button" className="puce-filtre" aria-pressed={filtre === n} onClick={() => setFiltre(filtre === n ? null : n)}>
                {n} ({collections[n].filter((id) => favoris.some((f) => f.id === id)).length})
              </button>
            ))}
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const nom = nouvelle.trim().slice(0, 40);
                if (!nom || collections[nom]) return;
                ecrireCollections({ ...collections, [nom]: [] });
                setNouvelle("");
              }}
            >
              <input className="champ !min-h-10 !w-44 !py-1 text-sm" placeholder="Nouvelle collection" aria-label="Nom de la nouvelle collection" value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} />
              <button type="submit" className="bouton-icone" aria-label="Créer la collection">
                <FolderPlus className="size-4" aria-hidden="true" />
              </button>
            </form>
            {filtre && (
              <button
                type="button"
                className="puce-filtre"
                onClick={() => {
                  const c = { ...collections };
                  delete c[filtre];
                  ecrireCollections(c);
                  setFiltre(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" /> Supprimer « {filtre} »
              </button>
            )}
          </div>
          <ul className="mt-5 grid gap-3">
            {visibles.map((f) => (
              <li key={f.id} className="verre rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <Link href={`/explorer/article/${f.id}`} className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold hover:underline hover:underline-offset-4">{f.titre}</span>
                    {f.resume && <span className="mt-1 line-clamp-2 block text-encre-douce">{f.resume}</span>}
                  </Link>
                  <button type="button" className="bouton-icone" aria-label={`Retirer « ${f.titre} » des favoris`} onClick={() => basculerFavori(f)}>
                    <Heart className="size-4 text-accent" fill="currentColor" aria-hidden="true" />
                  </button>
                </div>
                {noms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Collections de « ${f.titre} »`}>
                    {noms.map((n) => {
                      const dedans = collections[n].includes(f.id);
                      return (
                        <button key={n} type="button" className="puce-filtre !min-h-8 text-sm" aria-pressed={dedans} onClick={() => ranger(f.id, n, !dedans)}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
