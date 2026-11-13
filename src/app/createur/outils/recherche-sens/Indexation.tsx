"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { indexerUnPaquet } from "./actions";

/** Lance l'indexation par paquets et montre l'avancement. */
export function Indexation({ aIndexer }: { aIndexer: number }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [faits, setFaits] = useState(0);
  const [morceaux, setMorceaux] = useState(0);
  const [restants, setRestants] = useState(aIndexer);
  const [message, setMessage] = useState<string | null>(null);
  const [fini, setFini] = useState(false);

  async function lancer() {
    setEnCours(true);
    setMessage(null);
    setFini(false);
    let total = 0;
    let vecteurs = 0;
    // Garde-fou : même en cas de réponse incohérente, la boucle s'arrête.
    for (let tour = 0; tour < 400; tour++) {
      const avancement = await indexerUnPaquet();
      total += avancement.traites;
      vecteurs += avancement.calcules;
      setFaits(total);
      setMorceaux(vecteurs);
      setRestants(avancement.restants);
      if (!avancement.ok) {
        setMessage(avancement.message ?? "L'indexation s'est arrêtée.");
        break;
      }
      if (avancement.restants === 0 || avancement.traites === 0) {
        setFini(true);
        break;
      }
    }
    setEnCours(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button type="button" className="bouton bouton-principal" onClick={() => void lancer()} disabled={enCours}>
        <Compass className="size-4" aria-hidden="true" />
        {enCours ? "Indexation en cours…" : aIndexer > 0 ? `Indexer ${aIndexer} article${aIndexer > 1 ? "s" : ""}` : "Tout réindexer"}
      </button>
      {(enCours || faits > 0) && (
        <p className="mt-3 text-encre-douce" aria-live="polite">
          {faits} article{faits > 1 ? "s" : ""} traité{faits > 1 ? "s" : ""}, {morceaux} morceau{morceaux > 1 ? "x" : ""} calculé{morceaux > 1 ? "s" : ""}
          {restants > 0 && !fini ? `, ${restants} restant${restants > 1 ? "s" : ""}` : ""}
          {fini ? " — terminé." : "…"}
        </p>
      )}
      {message && (
        <p role="alert" className="message message-erreur mt-3">
          {message}
        </p>
      )}
    </div>
  );
}
