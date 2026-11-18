import { Rosace } from "@/components/Rosace";
import { PasserOuverture } from "./PasserOuverture";

/**
 * L'ouverture du site : une grande porte bleue à deux battants, gravée de motifs à huit branches.
 * Une lumière d'or filtre par la fente, les motifs s'allument un à un, puis les battants s'ouvrent
 * en profondeur sur l'accueil, dans une pluie de particules de lumière.
 *
 * Elle n'est jouée qu'à l'arrivée sur l'accueil, une fois par session (SCRIPT_OUVERTURE décide,
 * avant le premier affichage). Les visites suivantes ont une version courte : l'astrolabe se trace
 * et s'efface. Avec « réduire les animations », un simple fondu. Un clic, un toucher ou une touche
 * la passe. Tout est en CSS (voir scene.css) : sans JavaScript, elle s'efface d'elle-même.
 */
export const SCRIPT_OUVERTURE = `try{if(location.pathname==="/"&&!sessionStorage.getItem("hr-ouverture")){var d=document.documentElement,r=matchMedia("(prefers-reduced-motion: reduce)").matches,m=r?"fondu":localStorage.getItem("hr-venu")?"court":"porte";sessionStorage.setItem("hr-ouverture","1");localStorage.setItem("hr-venu","1");d.setAttribute("data-ouverture",m);d.setAttribute("data-portail-arret","");setTimeout(function(){d.removeAttribute("data-portail-arret")},m==="porte"?1500:m==="court"?750:0);setTimeout(function(){d.removeAttribute("data-ouverture")},m==="porte"?3000:m==="court"?1500:700)}}catch(e){}`;

function Battant({ cote }: { cote: "gauche" | "droit" }) {
  const id = `entrelacs-${cote}`;
  return (
    <div className={`porte-battant porte-${cote}`}>
      <svg className="porte-trame" aria-hidden="true">
        <defs>
          <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M36 6 66 36 36 66 6 36Z M15 15h42v42H15z M0 36h6M66 36h6M36 0v6M36 66v6" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      {[0, 1, 2].map((i) => (
        <svg key={i} className="porte-motif" style={{ "--i": i + (cote === "droit" ? 0.5 : 0) } as React.CSSProperties} viewBox="-50 -50 100 100" aria-hidden="true">
          <rect x="-30" y="-30" width="60" height="60" />
          <rect x="-30" y="-30" width="60" height="60" transform="rotate(45)" />
          <circle r="16" />
          <circle r="44" />
        </svg>
      ))}
      <span className="porte-poignee" />
    </div>
  );
}

export function Ouverture() {
  return (
    <div className="ouverture" aria-hidden="true">
      <div className="porte-voile" />
      <div className="porte-scene">
        <Battant cote="gauche" />
        <Battant cote="droit" />
        <span className="porte-fente" />
        <div className="porte-sceau">
          <Rosace className="porte-rosace" />
          <span className="porte-nom">
            Haqq<span className="text-or">Reason</span>
          </span>
        </div>
      </div>
      <div className="porte-particules">
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            style={{ left: `${(i * 37) % 100}%`, "--d": `${1.25 + ((i * 7) % 10) * 0.08}s`, "--t": `${1.4 + ((i * 3) % 5) * 0.25}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <PasserOuverture />
    </div>
  );
}
