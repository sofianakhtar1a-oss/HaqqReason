"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const CLE = "hr-scene-pause";

/**
 * Met en pause (ou relance) les animations qui tournent sans fin : l'astrolabe, ses orbites,
 * le ciel et les étincelles du titre. Le choix reste sur l'appareil du lecteur.
 */
export function BoutonPauseScene() {
  const [enPause, setEnPause] = useState(false);

  useEffect(() => {
    let memo = false;
    try {
      memo = localStorage.getItem(CLE) === "1";
    } catch {
      // Stockage indisponible : l'animation tourne pour cette visite.
    }
    if (memo) document.documentElement.dataset.scenePause = "";
    // Le choix mémorisé n'est connu qu'une fois sur l'appareil du lecteur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnPause(memo);
  }, []);

  function basculer() {
    const suivant = !enPause;
    setEnPause(suivant);
    if (suivant) document.documentElement.dataset.scenePause = "";
    else delete document.documentElement.dataset.scenePause;
    try {
      localStorage.setItem(CLE, suivant ? "1" : "0");
    } catch {
      // Stockage indisponible : le choix vaut pour cette visite.
    }
  }

  return (
    <button type="button" onClick={basculer} className="pause-scene" aria-pressed={enPause}>
      {enPause ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      {enPause ? "Relancer l'animation" : "Mettre l'animation en pause"}
    </button>
  );
}
