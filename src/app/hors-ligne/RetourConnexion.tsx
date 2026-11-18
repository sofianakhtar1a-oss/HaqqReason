"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import { useAdresseAccueil } from "@/lib/client/acces";

/**
 * Quand la connexion revient, la page hors ligne le dit et propose de reprendre :
 * recharger la page demandée (le service hors-ligne l'avait remplacée par celle-ci),
 * ou revenir à l'accueil si l'on est venu ici directement (l'accueil cloisonné, voir lib/client/acces.ts).
 */
export function RetourConnexion() {
  const accueil = useAdresseAccueil();
  const [enLigne, setEnLigne] = useState(false);
  const [ici, setIci] = useState(true);

  useEffect(() => {
    const direct = window.location.pathname === "/hors-ligne";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIci(direct);
    // Servie à la place d'une autre page alors que la connexion est déjà revenue : on le dit tout de suite.
    if (!direct && navigator.onLine) setEnLigne(true);
    const surEnLigne = () => setEnLigne(true);
    const surHorsLigne = () => setEnLigne(false);
    window.addEventListener("online", surEnLigne);
    window.addEventListener("offline", surHorsLigne);
    return () => {
      window.removeEventListener("online", surEnLigne);
      window.removeEventListener("offline", surHorsLigne);
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {enLigne && (
        <div className="retour-connexion">
          <Wifi className="size-5 shrink-0" aria-hidden="true" />
          <p>La connexion est revenue.</p>
          <button type="button" className="bouton bouton-principal" onClick={() => (ici ? window.location.assign(accueil) : window.location.reload())}>
            {ici ? "Revenir à l'accueil" : "Recharger la page"}
          </button>
        </div>
      )}
    </div>
  );
}
