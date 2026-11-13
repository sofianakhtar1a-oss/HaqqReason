/**
 * La rosace de HaqqReason : une étoile à huit branches inscrite dans les cercles gradués d'un astrolabe.
 * Elle se trace une seule fois à l'arrivée, puis tourne très lentement.
 */

function point(rayon: number, degres: number): string {
  const radians = (degres * Math.PI) / 180;
  return `${(rayon * Math.cos(radians)).toFixed(2)},${(rayon * Math.sin(radians)).toFixed(2)}`;
}

/** Polygone étoilé : relie un sommet sur « pas » parmi « sommets » points répartis sur un cercle. */
function etoile(rayon: number, sommets: number, pas: number, decalage = 0): string {
  const points: string[] = [];
  for (let i = 0; i < sommets; i++) {
    points.push(point(rayon, decalage + (360 / sommets) * ((i * pas) % sommets)));
  }
  return points.join(" ");
}

function carre(rayon: number, decalage: number): string {
  return [0, 90, 180, 270].map((angle) => point(rayon, angle + decalage)).join(" ");
}

export function Rosace({ className = "" }: { className?: string }) {
  const graduations = Array.from({ length: 72 }, (_, i) => {
    const angle = i * 5;
    const longue = i % 9 === 0;
    const [x1, y1] = point(longue ? 172 : 180, angle).split(",");
    const [x2, y2] = point(190, angle).split(",");
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={longue ? 1.4 : 0.6} />;
  });

  const rang = (n: number) => ({ "--rang": n }) as React.CSSProperties;

  return (
    <svg
      className={`rosace ${className}`}
      viewBox="-200 -200 400 400"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="rosace-tourne" opacity="0.55">
        {graduations}
        <circle r="190" strokeWidth="1" pathLength={1} style={rang(0)} />
        <circle r="166" strokeWidth="0.6" pathLength={1} style={rang(1)} />
      </g>
      <circle cy="-38" r="104" strokeWidth="0.8" opacity="0.5" pathLength={1} style={rang(2)} />
      <g className="rosace-tourne-inverse">
        <polygon points={carre(150, 0)} strokeWidth="1.3" pathLength={1} style={rang(3)} />
        <polygon points={carre(150, 45)} strokeWidth="1.3" pathLength={1} style={rang(4)} />
        <polygon points={etoile(118, 8, 3, 22.5)} strokeWidth="1" opacity="0.8" pathLength={1} style={rang(5)} />
        <polygon points={carre(62, 22.5)} strokeWidth="1" pathLength={1} style={rang(6)} />
        <polygon points={carre(62, 67.5)} strokeWidth="1" pathLength={1} style={rang(7)} />
        <circle r="26" strokeWidth="1.2" pathLength={1} style={rang(8)} />
      </g>
      <circle r="5" fill="currentColor" stroke="none" />
    </svg>
  );
}
