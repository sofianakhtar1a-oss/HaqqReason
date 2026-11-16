"use client";

import { BookMarked, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { listerCarnets, supprimerCarnet } from "@/lib/alambic/carnet/stockage";
import type { Carnet } from "@/lib/alambic/carnet/types";
import { Atelier } from "./Atelier";
import "../transcription/transcription.css";
import "./carnet.css";

/** La scène « Interroger » de L'Alambic : la liste des carnets, et l'atelier plein écran. */
export function Interroger() {
  const [carnets, setCarnets] = useState<Carnet[]>([]);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const rafraichir = useCallback(() => void listerCarnets().then(setCarnets), []);
  useEffect(rafraichir, [rafraichir]);

  return (
    <section className="alambic-outil cb-scene" aria-labelledby="cb-titre">
      <header className="tr-entete">
        <h2 id="cb-titre" className="tr-entete-titre">
          Interroger tes sources
        </h2>
        <p className="tr-entete-aide">
          Rassemble des PDF, des documents Word, des notes, des tableaux, des sons et des vidéos YouTube dans un carnet. L&apos;assistant répond à partir d&apos;eux seuls, et chaque affirmation renvoie à sa page ou à sa minute.
        </p>
      </header>

      <button type="button" className="cb-nouveau" onClick={() => setOuvert("nouveau")}>
        <span className="cb-nouveau-icone" aria-hidden="true">
          <Plus className="size-6" />
        </span>
        <span>
          <span className="block font-display text-lg font-bold">Nouveau carnet</span>
          <span className="text-sm text-encre-douce">Glisse tes fichiers, colle tes liens, pose tes questions.</span>
        </span>
      </button>

      {carnets.length > 0 && (
        <section aria-labelledby="cb-liste" className="tr-biblio">
          <h3 id="cb-liste" className="tr-biblio-titre">
            Tes carnets
          </h3>
          <ul>
            {carnets.map((c) => (
              <li key={c.id} className="tr-biblio-ligne">
                <button type="button" className="tr-biblio-ouvrir" onClick={() => setOuvert(c.id)}>
                  <span className="tr-sigle" aria-hidden="true">
                    <BookMarked className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" dir="auto">
                      {c.titre}
                    </span>
                    <span className="text-sm text-encre-douce">
                      {c.sources.length} source{c.sources.length > 1 ? "s" : ""} · {Math.ceil(c.messages.length / 2)} échange{c.messages.length > 2 ? "s" : ""} ·{" "}
                      {new Date(c.majLe).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </button>
                {aSupprimer === c.id ? (
                  <button
                    type="button"
                    className="tr-biblio-confirmer"
                    autoFocus
                    onBlur={() => setASupprimer(null)}
                    onClick={() => void supprimerCarnet(c).then(rafraichir).then(() => setASupprimer(null))}
                  >
                    Supprimer ?
                  </button>
                ) : (
                  <button type="button" className="bouton-icone" aria-label={`Supprimer « ${c.titre} »`} onClick={() => setASupprimer(c.id)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ouvert && (
        <Atelier
          key={ouvert}
          id={ouvert === "nouveau" ? null : ouvert}
          onFermer={() => {
            setOuvert(null);
            rafraichir();
          }}
        />
      )}
    </section>
  );
}
