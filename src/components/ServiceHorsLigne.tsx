"use client";

import { useEffect } from "react";

/** Active le service hors-ligne (uniquement dans l'application en ligne, pas pendant le développement). */
export function ServiceHorsLigne() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
