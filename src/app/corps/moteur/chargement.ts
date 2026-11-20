/*
 * L'Écorché — charger le corps une seule fois par visite.
 * La table des structures est connue d'emblée ; on télécharge d'abord le niveau léger des couches affichées au
 * départ (le corps apparaît en une ou deux secondes), le reste vient ensuite, à la demande et selon l'appareil.
 */

import { Modele, poidsDe } from "@/lib/corps/modele/modele";
import type { StructureScene } from "@/lib/corps/types";

export { type Finesse, niveauPour } from "@/lib/corps/appareil";

export type Scene = { structures: StructureScene[]; parElement: Map<string, number[]>; modele: Modele };

const DEPART = ["os", "muscle", "tendon"] as const;

let promesse: Promise<Scene> | null = null;
const ecoutes = new Set<(p: number) => void>();
let avancement = 0;

function avancer(p: number) {
  avancement = p;
  ecoutes.forEach((f) => f(p));
}

export function chargerScene(progres?: (p: number) => void): Promise<Scene> {
  if (progres) {
    ecoutes.add(progres);
    progres(avancement);
  }
  if (!promesse)
    promesse = (async () => {
      const modele = new Modele();
      const total = DEPART.reduce((s, c) => s + poidsDe(c, 2), 0) || 1;
      const suivre = setInterval(() => avancer(Math.min(0.97, modele.octets / total)), 80);
      try {
        await Promise.all(DEPART.map((c) => modele.demander(c, 2)));
      } finally {
        clearInterval(suivre);
      }
      avancer(1);
      return { structures: modele.structures, parElement: modele.parElement, modele };
    })();
  promesse.catch(() => {
    promesse = null;
  });
  return promesse.finally(() => {
    if (progres) ecoutes.delete(progres);
  });
}
