import { nombreFr } from "./calques";
import type { LatLng } from "./geo";

/*
 * Le Portulan : ce que calculent les outils et les jeux de la carte (sans React ni DOM).
 */

/** 45,2° N, 3,1° E. */
export function coordonnees([la, lo]: LatLng): string {
  const f = (x: number) => Math.abs(x).toFixed(1).replace(".", ",");
  return `${f(la)}° ${la >= 0 ? "N" : "S"}, ${f(lo)}° ${lo >= 0 ? "E" : "O"}`;
}

/** Une surface comparée à une autre : « 15 fois plus vaste », « 1,8 fois moins vaste », « à peu près aussi vaste ». */
export function comparerSurfaces(soi: number, autre: number): string {
  const r = autre / soi;
  const fois = (x: number) => (x < 10 ? x.toFixed(1).replace(".", ",").replace(",0", "") : nombreFr(Math.round(x)));
  if (r > 0.87 && r < 1.15) return "à peu près aussi vaste";
  return r >= 1 ? `${fois(r)} fois plus vaste` : `${fois(1 / r)} fois moins vaste`;
}

/** Placer une capitale : mille points à l'endroit exact, la moitié à 830 km, presque rien au-delà de 4 000 km. */
export const pointsCapitale = (km: number) => Math.round(1000 * Math.exp(-km / 1200));

export type JeuId = "chasse" | "voisins" | "capitales";

/** Les jeux de la carte et la clé de leur record (gardé avec les autres records). */
export const JEUX: readonly { id: JeuId; nom: string; texte: string; cle: string; record: (n: number) => string }[] = [
  { id: "chasse", nom: "La chasse aux pays", texte: "Une minute pour toucher le plus de pays possible sur le planisphère.", cle: "carte-chasse", record: (n) => `${n} pays` },
  { id: "voisins", nom: "Tous les voisins", texte: "Un pays s'allume : touche tous ceux qui le bordent.", cle: "carte-voisins", record: (n) => `${n} pays de suite` },
  { id: "capitales", nom: "Où est la capitale ?", texte: "Dix capitales à placer du doigt : plus tu es près, plus tu gagnes de points.", cle: "carte-capitales", record: (n) => `${nombreFr(n)} points` },
];
