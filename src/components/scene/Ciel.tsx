/**
 * Un ciel d'étoiles qui scintillent, derrière l'astrolabe.
 * Les positions sont tirées d'une suite fixe : le ciel est le même à chaque visite.
 * Il glisse un peu avec la souris ou l'inclinaison du téléphone (data-couche, voir Mouvements).
 */
function etoiles(nombre: number, graine: number) {
  let s = graine;
  const alea = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: nombre }, (_, i) => ({
    x: alea() * 100,
    y: alea() * 100,
    duree: 3 + alea() * 5,
    delai: alea() * 7,
    grande: i % 7 === 0,
  }));
}

export function Ciel({ nombre = 44, graine = 11, className = "" }: { nombre?: number; graine?: number; className?: string }) {
  return (
    <div className={`ciel ${className}`} data-couche="-16,-12" aria-hidden="true">
      {etoiles(nombre, graine).map((e, i) => (
        <span
          key={i}
          className="etoile-ciel"
          data-grande={e.grande || undefined}
          style={
            {
              left: `${e.x.toFixed(2)}%`,
              top: `${e.y.toFixed(2)}%`,
              "--duree": `${e.duree.toFixed(2)}s`,
              "--delai": `${e.delai.toFixed(2)}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
