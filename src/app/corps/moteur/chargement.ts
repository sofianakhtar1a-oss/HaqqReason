/*
 * L'Écorché — fabriquer le corps une seule fois par visite : le squelette, les muscles, les tendons,
 * les artères, puis les tampons du moteur. La fabrication est découpée en étapes (le navigateur
 * respire entre deux, et la barre de chargement avance).
 */

import { arteres } from "@/lib/corps/anatomie/arteres";
import { muscles } from "@/lib/corps/anatomie/muscles";
import { squelette } from "@/lib/corps/anatomie/squelette";
import { tendons } from "@/lib/corps/anatomie/tendons";
import { construireScene, type Scene } from "@/lib/corps/scene";

let promesse: Promise<Scene> | null = null;
const ecoutes = new Set<(p: number) => void>();
let avancement = 0;

function avancer(p: number) {
  avancement = p;
  ecoutes.forEach((f) => f(p));
}

const respirer = () => new Promise<void>((r) => setTimeout(r, 0));

export function chargerScene(progres?: (p: number) => void): Promise<Scene> {
  if (progres) {
    ecoutes.add(progres);
    progres(avancement);
  }
  if (!promesse)
    promesse = (async () => {
      await respirer();
      const pieces = squelette();
      avancer(0.3);
      await respirer();
      pieces.push(...muscles());
      avancer(0.65);
      await respirer();
      pieces.push(...tendons());
      avancer(0.78);
      await respirer();
      pieces.push(...arteres());
      avancer(0.9);
      await respirer();
      const scene = construireScene(pieces);
      avancer(1);
      return scene;
    })();
  return promesse.finally(() => {
    if (progres) ecoutes.delete(progres);
  });
}
