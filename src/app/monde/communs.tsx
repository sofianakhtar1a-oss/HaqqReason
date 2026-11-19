"use client";

import { Coins, Heart, HeartCrack, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatNombre } from "@/lib/monde/atlas";

/* Les petites pièces de l'interface du Portulan. */

/** Trois étoiles (n allumées). */
export function Etoiles({ n, total = 3, taille = "petite", animees = false }: { n: number; total?: number; taille?: "petite" | "grande"; animees?: boolean }) {
  return (
    <span className="pt-etoiles" data-taille={taille} data-animees={animees || undefined} role="img" aria-label={`${n} étoile${n > 1 ? "s" : ""} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} className="pt-etoile" data-allumee={i < n || undefined} style={{ "--i": i } as React.CSSProperties} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Les cœurs restants (le dernier perdu se brise). */
export function Coeurs({ restants, total, brise }: { restants: number; total: number; brise?: number | null }) {
  if (!Number.isFinite(total)) return null;
  return (
    <span className="pt-coeurs" role="img" aria-label={`${restants} cœur${restants > 1 ? "s" : ""} sur ${total}`}>
      {Array.from({ length: Math.max(total, restants) }, (_, i) => {
        const plein = i < restants;
        const vientDeSeBriser = brise === i;
        return vientDeSeBriser ? (
          <HeartCrack key={`b${i}`} className="pt-coeur" data-brise="" aria-hidden="true" />
        ) : (
          <Heart key={i} className="pt-coeur" data-plein={plein || undefined} aria-hidden="true" />
        );
      })}
    </span>
  );
}

/** Les ducats (la monnaie des jokers). */
export function Ducats({ n, className }: { n: number; className?: string }) {
  return (
    <span className={`pt-ducats ${className ?? ""}`} title="Ducats : ils achètent les jokers">
      <Coins className="size-4" aria-hidden="true" />
      <span className="tabular-nums">{formatNombre(n)}</span>
      <span className="sr-only">ducats</span>
    </span>
  );
}

/** Un anneau qui se vide pendant le temps d'une question (animation CSS), et les secondes qui restent. */
export function Chrono({ duree, cle, pause }: { duree: number; cle: string; pause?: boolean }) {
  const [reste, setReste] = useState(duree);
  useEffect(() => {
    if (pause) return;
    const fin = Date.now() + reste;
    const t = setInterval(() => setReste(Math.max(0, fin - Date.now())), 250);
    return () => clearInterval(t);
    // Le compte repart de ce qui reste quand la pause se lève.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause]);
  return (
    <span className="pt-chrono" data-pause={pause || undefined} data-presse={reste < duree / 4 || undefined} role="timer" aria-label={`${Math.ceil(reste / 1000)} secondes`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="19" className="pt-chrono-fond" />
        <circle key={cle} cx="22" cy="22" r="19" className="pt-chrono-reste" style={{ animationDuration: `${duree}ms` }} pathLength={100} />
      </svg>
      <span className="pt-chrono-secondes tabular-nums" aria-hidden="true">
        {Math.ceil(reste / 1000)}
      </span>
    </span>
  );
}

/** Le grain de la page : une rose des vents d'encre, posée en décor. */
export function RoseDesVents({ className }: { className?: string }) {
  const branches = Array.from({ length: 32 }, (_, i) => i * 11.25);
  return (
    <svg viewBox="-100 -100 200 200" className={`pt-rose ${className ?? ""}`} aria-hidden="true">
      <g className="pt-rose-rhumbs">
        {branches.map((a) => (
          <line key={a} x1="0" y1="0" x2={Math.cos((a * Math.PI) / 180) * 98} y2={Math.sin((a * Math.PI) / 180) * 98} data-rang={a % 90 === 0 ? 1 : a % 45 === 0 ? 2 : a % 22.5 === 0 ? 3 : 4} />
        ))}
      </g>
      <circle r="62" className="pt-rose-cercle" />
      <circle r="58" className="pt-rose-cercle fin" />
      <g className="pt-rose-etoile">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d={a % 90 === 0 ? "M0 -56 L7 -7 L0 0 Z" : "M0 -34 L5 -5 L0 0 Z"} transform={`rotate(${a})`} className={a % 90 === 0 ? "pleine" : "pale"} />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={`o${a}`} d={a % 90 === 0 ? "M0 -56 L-7 -7 L0 0 Z" : "M0 -34 L-5 -5 L0 0 Z"} transform={`rotate(${a})`} className="ombre" />
        ))}
      </g>
      <circle r="4" className="pt-rose-coeur" />
      <text y="-66" className="pt-rose-n">N</text>
    </svg>
  );
}
