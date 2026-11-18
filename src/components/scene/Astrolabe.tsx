import { Rosace } from "@/components/Rosace";

/**
 * L'astrolabe de l'accueil : la rosace, son alidade (la règle de visée, avec son faisceau de lumière)
 * et deux astres en orbite sur le limbe. L'alidade suit le curseur et vise la carte survolée ;
 * sans souris, elle tourne lentement (voir Mouvements et scene.css).
 */
export function Astrolabe({ className = "", viseur = true, couche = "12,9" }: { className?: string; viseur?: boolean; couche?: string }) {
  return (
    <div className={`astrolabe-scene ${className}`} data-couche={couche} aria-hidden="true">
      <Rosace />
      {viseur && (
        <div className="viseur-entree apparait-doux" style={{ "--delai": "1.1s" } as React.CSSProperties}>
          <div className="viseur" data-viseur>
            <svg viewBox="-200 -200 400 400" fill="none" stroke="currentColor" strokeLinejoin="round">
              <defs>
                <radialGradient id="lueur-alidade">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.9" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <polygon points="0,-176 6,0 0,176 -6,0" fill="currentColor" fillOpacity="0.1" strokeWidth="0.8" opacity="0.8" />
              <line x1="0" y1="-176" x2="0" y2="176" strokeWidth="0.45" opacity="0.6" />
              <rect x="-7" y="-130" width="14" height="5" rx="1" fill="currentColor" fillOpacity="0.3" strokeWidth="0.6" />
              <rect x="-7" y="125" width="14" height="5" rx="1" fill="currentColor" fillOpacity="0.3" strokeWidth="0.6" />
              <circle r="10" strokeWidth="1" />
              <circle cy="-176" r="16" fill="url(#lueur-alidade)" stroke="none" />
              <circle cy="-176" r="3.2" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>
      )}
      <div className="orbite" />
      <div className="orbite orbite-lune" />
    </div>
  );
}
