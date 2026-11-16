"use client";

import { motion, useReducedMotion } from "motion/react";

/*
 * La pièce maîtresse : le sceau à huit branches du site, avec la flèche en son cœur.
 * - Un clic inverse le sens de la conversion : le sceau fait un tour complet pendant que les deux
 *   formats échangent leur place. La flèche montre toujours le sens de lecture : de la source (à gauche)
 *   vers la destination (à droite).
 * - Pendant une conversion, son contour se dessine au fil de l'avancement : il devient la jauge.
 */

/** Contour de l'étoile à huit branches (deux carrés, l'un tourné de 45°), en un seul tracé. */
const ETOILE = (() => {
  const points: string[] = [];
  const r = 44;
  const creux = r * Math.cos(Math.PI / 8) * 0.83;
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const rayon = i % 2 === 0 ? r : creux;
    points.push(
      `${(50 + rayon * Math.cos(angle)).toFixed(2)},${(50 + rayon * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return `M${points.join("L")}Z`;
})();

export function BoutonInverser({
  tours,
  avancement,
  enCours,
  desactive,
  onInverser,
}: {
  tours: number;
  avancement: number | null;
  enCours: boolean;
  desactive: boolean;
  onInverser: () => void;
}) {
  const calme = useReducedMotion();
  const indetermine = enCours && avancement === null;
  return (
    <button
      type="button"
      className="alambic-sceau"
      onClick={onInverser}
      disabled={desactive || enCours}
      data-en-cours={enCours || undefined}
      aria-label={
        enCours ? "Conversion en cours" : "Inverser le sens de la conversion"
      }
      title={enCours ? undefined : "Inverser le sens"}
    >
      <span className="alambic-sceau-axe">
        <motion.svg
          viewBox="0 0 100 100"
          className="alambic-sceau-dessin"
          aria-hidden="true"
          animate={{ rotate: tours * 360 }}
          transition={
            calme
              ? { duration: 0 }
              : { type: "spring", stiffness: 170, damping: 17, mass: 0.9 }
          }
        >
          <path d={ETOILE} className="alambic-sceau-fond" />
          <path d={ETOILE} className="alambic-sceau-trace" pathLength={100} />
          {enCours && (
            <path
              d={ETOILE}
              className="alambic-sceau-jauge"
              pathLength={100}
              data-indetermine={indetermine || undefined}
              style={
                indetermine
                  ? undefined
                  : {
                      strokeDashoffset:
                        100 - Math.round((avancement ?? 0) * 100),
                    }
              }
            />
          )}
          <g className="alambic-sceau-fleche">
            <path d="M30 50 H68" />
            <path d="M57 39 L68 50 L57 61" />
          </g>
        </motion.svg>
      </span>
      {enCours && avancement !== null && (
        <span className="alambic-sceau-pourcent">
          {Math.round(avancement * 100)} %
        </span>
      )}
    </button>
  );
}
