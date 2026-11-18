/**
 * L'étoile des états vides : deux carrés croisés et un cercle, tracés d'un trait à l'arrivée
 * (voir .etoile-vide dans finitions.css). Purement décorative : le texte qui la suit dit tout.
 */
function carre(rayon: number, decalage: number): string {
  return [0, 90, 180, 270]
    .map((angle) => {
      const radians = ((angle + decalage) * Math.PI) / 180;
      return `${(rayon * Math.cos(radians)).toFixed(2)},${(rayon * Math.sin(radians)).toFixed(2)}`;
    })
    .join(" ");
}

export function EtoileVide({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={`etoile-vide ${className}`} fill="none" stroke="currentColor" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polygon points={carre(40, 45)} strokeWidth="2.6" pathLength={1} />
      <polygon points={carre(40, 0)} strokeWidth="2.6" pathLength={1} />
      <circle r="13" strokeWidth="2" pathLength={1} />
      <circle r="3.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
