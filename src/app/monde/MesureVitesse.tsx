"use client";

import { useReportWebVitals } from "next/web-vitals";

/*
 * La vitesse réelle du Portulan, mesurée dans les navigateurs des joueurs (Web Vitals) et
 * envoyée sans rien qui les identifie : le créateur en voit le 75e centile dans son atelier.
 */

const MESURES = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

function envoyer(m: { name: string; value: number }) {
  if (!MESURES.has(m.name) || !Number.isFinite(m.value)) return;
  const corps = JSON.stringify([{ mesure: m.name, valeur: m.value }]);
  try {
    if (navigator.sendBeacon?.("/api/monde/vitesse", new Blob([corps], { type: "application/json" }))) return;
    void fetch("/api/monde/vitesse", { method: "POST", body: corps, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
  } catch {
    // Une mesure perdue n'a pas d'importance.
  }
}

export function MesureVitesse() {
  useReportWebVitals(envoyer);
  return null;
}
