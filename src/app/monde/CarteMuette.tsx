"use client";

import { geoAzimuthalEqualArea, geoEqualEarth, geoGraticule10, geoPath, type GeoProjection } from "d3-geo";
import { Printer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PAYS } from "@/lib/monde/donnees";
import type { ContinentId, Pays } from "@/lib/monde/types";
import { useCarte } from "./carte";
import { useGeographie } from "./geographie";

/*
 * La carte muette : le monde ou un continent, les frontières sans les noms, chaque pays numéroté,
 * la liste à remplir et le corrigé. On l'imprime, ou on l'enregistre en PDF depuis la fenêtre
 * d'impression. Les pages s'impriment en noir sur blanc, sans rien d'autre de l'écran.
 */

type IdRegion = "monde" | Exclude<ContinentId, "antarctique">;
type Region = { id: IdRegion; nom: string; titre: string; boite?: [number, number, number, number] };

/** [ouest, sud, est, nord] : ce qu'on cadre (l'Océanie passe l'antiméridien). */
const REGIONS: readonly Region[] = [
  { id: "monde", nom: "Le monde", titre: "le monde" },
  { id: "afrique", nom: "L'Afrique", titre: "l'Afrique", boite: [-26, -36, 58, 38] },
  { id: "europe", nom: "L'Europe", titre: "l'Europe", boite: [-25, 34, 45, 71] },
  { id: "asie", nom: "L'Asie", titre: "l'Asie", boite: [25, -11, 150, 56] },
  { id: "amerique-nord", nom: "L'Amérique du Nord", titre: "l'Amérique du Nord et centrale", boite: [-170, 6, -52, 75] },
  { id: "amerique-sud", nom: "L'Amérique du Sud", titre: "l'Amérique du Sud", boite: [-92, -56, -32, 13] },
  { id: "oceanie", nom: "L'Océanie", titre: "l'Océanie", boite: [110, -48, 210, 22] },
];

const L = 1100;
const H = 720;

function projectionDe(r: Region): GeoProjection {
  if (!r.boite) return geoEqualEarth().fitExtent([[12, 12], [L - 12, H - 12]], { type: "Sphere" });
  const [o, s, e, n] = r.boite;
  const centre: [number, number] = [(o + e) / 2, (s + n) / 2];
  const points: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const lon = o + ((e - o) * i) / 8;
    const lat = s + ((n - s) * i) / 8;
    points.push([lon, s], [lon, n], [o, lat], [e, lat]);
  }
  return geoAzimuthalEqualArea()
    .rotate([-centre[0], -centre[1]])
    .fitExtent([[12, 12], [L - 12, H - 12]], { type: "MultiPoint", coordinates: points });
}

/** Les pays à numéroter : les États (pas les territoires), du nord au sud par bandes, puis d'ouest en est. */
function paysDe(r: Region): Pays[] {
  const liste = PAYS.filter((p) => p.statut !== "territoire" && p.continent !== "antarctique" && (r.id === "monde" || p.continent === r.id));
  return liste.sort((a, b) => Math.floor((90 - a.latlng[0]) / 9) - Math.floor((90 - b.latlng[0]) / 9) || a.latlng[1] - b.latlng[1]);
}

type Dessin = { terres: { code: string; d: string; dedans: boolean }[]; grille: string; sphere: string; numeros: { n: number; x: number; y: number; petit: boolean }[]; liste: Pays[] };

function useDessin(r: Region, numeroter: boolean): Dessin | null {
  const { detail, leger } = useCarte();
  const geo = useGeographie(true);
  const carte = detail ?? leger;
  return useMemo(() => {
    if (!carte) return null;
    const proj = projectionDe(r);
    const chemin = geoPath(proj);
    const liste = paysDe(r);
    const voulus = new Set(liste.map((p) => p.code));
    const terres = carte.formes.map((f) => ({ code: f.code, d: chemin(f.f) ?? "", dedans: voulus.has(f.code) })).filter((t) => t.d);
    const numeros: Dessin["numeros"] = [];
    if (numeroter) {
      const pris: [number, number][] = [];
      liste.forEach((p, i) => {
        const e = geo?.pays.get(p.code);
        const ll: [number, number] = e ? [e[0], e[1]] : [p.latlng[1], p.latlng[0]];
        const pt = proj(ll);
        if (!pt || pt[0] < 0 || pt[1] < 0 || pt[0] > L || pt[1] > H) return;
        const rayonPx = e ? (e[2] / 6371) * proj.scale() : 0;
        const petit = rayonPx < 7;
        // Un numéro ne cache pas l'autre : on le décale un peu s'il le faut.
        let [x, y] = petit ? [pt[0] + 8, pt[1] - 6] : pt;
        for (const [dx, dy] of [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10], [14, 10], [-14, -10]]) {
          if (!pris.some(([a, b]) => Math.abs(a - (x + dx)) < 12 && Math.abs(b - (y + dy)) < 10)) {
            x += dx;
            y += dy;
            break;
          }
        }
        pris.push([x, y]);
        numeros.push({ n: i + 1, x, y, petit });
        if (petit) numeros.push({ n: -1, x: pt[0], y: pt[1], petit });
      });
    }
    return { terres, grille: chemin(geoGraticule10()) ?? "", sphere: chemin({ type: "Sphere" }) ?? "", numeros, liste };
  }, [carte, geo, r, numeroter]);
}

function Carte({ dessin, numeroter }: { dessin: Dessin; numeroter: boolean }) {
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="pt-muette-svg" role="img" aria-label="Carte muette">
      <defs>
        <clipPath id="pt-muette-cadre">
          <rect width={L} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#pt-muette-cadre)">
        <path d={dessin.sphere} className="pt-muette-mer" />
        <path d={dessin.grille} className="pt-muette-grille" />
        {dessin.terres.map((t) => (
          <path key={t.code} d={t.d} className={t.dedans ? "pt-muette-pays" : "pt-muette-autre"} />
        ))}
        {numeroter &&
          dessin.numeros.map((n, i) =>
            n.n < 0 ? (
              <circle key={i} cx={n.x} cy={n.y} r={2.4} className="pt-muette-point" />
            ) : (
              <text key={i} x={n.x} y={n.y} className="pt-muette-numero" textAnchor="middle" dominantBaseline="central">
                {n.n}
              </text>
            ),
          )}
      </g>
      <rect width={L} height={H} className="pt-muette-bord" />
    </svg>
  );
}

export function CarteMuette({ onFermer }: { onFermer: () => void }) {
  const [region, setRegion] = useState<IdRegion>("europe");
  const [numeroter, setNumeroter] = useState(true);
  const [liste, setListe] = useState(true);
  const [corrige, setCorrige] = useState(false);
  const r = REGIONS.find((x) => x.id === region)!;
  const dessin = useDessin(r, numeroter);
  const fenetre = useRef<HTMLDivElement>(null);
  const fermer = useRef(onFermer);
  useEffect(() => {
    fermer.current = onFermer;
  });

  // Échap ferme, le focus va dans la fenêtre puis revient où il était.
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    fenetre.current?.querySelector<HTMLElement>("select, button")?.focus();
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer.current();
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener("keydown", touche);
      delete document.documentElement.dataset.impression;
      avant?.focus?.();
    };
  }, []);

  const imprimer = () => {
    document.documentElement.dataset.impression = "muette";
    const fin = () => {
      delete document.documentElement.dataset.impression;
      window.removeEventListener("afterprint", fin);
    };
    window.addEventListener("afterprint", fin);
    window.print();
  };

  const pages = dessin && (
    <div className="pt-muette-impression" aria-hidden="true">
      <section className="pt-muette-page">
        <header className="pt-muette-entete">
          <p className="pt-muette-titre">Carte muette : {r.titre}</p>
          <p className="pt-muette-nom">Nom : ______________________ Date : ____________</p>
        </header>
        <Carte dessin={dessin} numeroter={numeroter} />
        <p className="pt-muette-pied">Le Portulan, HaqqReason. Frontières : Natural Earth.</p>
      </section>
      {numeroter && liste && (
        <section className="pt-muette-page">
          <p className="pt-muette-titre">Écris le nom de chaque pays</p>
          <ol className="pt-muette-liste">
            {dessin.liste.map((p) => (
              <li key={p.code}>
                <span className="pt-muette-ligne" />
              </li>
            ))}
          </ol>
        </section>
      )}
      {numeroter && corrige && (
        <section className="pt-muette-page">
          <p className="pt-muette-titre">Le corrigé</p>
          <ol className="pt-muette-liste" data-corrige="">
            {dessin.liste.map((p) => (
              <li key={p.code}>{p.nom}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );

  return (
    <div className="pt-muette-voile" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div ref={fenetre} className="pt-muette" role="dialog" aria-modal="true" aria-labelledby="pt-muette-titre">
        <header className="pt-muette-tete">
          <h2 id="pt-muette-titre">La carte muette</h2>
          <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="pt-muette-reglages">
          <label>
            <span>La carte</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as IdRegion)}>
              {REGIONS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="pt-calques-case">
            <input type="checkbox" checked={numeroter} onChange={(e) => setNumeroter(e.target.checked)} />
            <span>Numéroter les pays</span>
          </label>
          <label className="pt-calques-case">
            <input type="checkbox" checked={liste} disabled={!numeroter} onChange={(e) => setListe(e.target.checked)} />
            <span>La liste à remplir</span>
          </label>
          <label className="pt-calques-case">
            <input type="checkbox" checked={corrige} disabled={!numeroter} onChange={(e) => setCorrige(e.target.checked)} />
            <span>Le corrigé, en dernière page</span>
          </label>
        </div>
        <div className="pt-muette-apercu">{dessin ? <Carte dessin={dessin} numeroter={numeroter} /> : <p>La carte se prépare…</p>}</div>
        <p className="pt-muette-aide">
          {dessin ? `${dessin.liste.length} pays. ` : ""}Dans la fenêtre d&apos;impression, choisis ton imprimante, ou « Enregistrer au format PDF ». La carte se met en paysage.
        </p>
        <div className="pt-outil-actions">
          <button type="button" className="bouton bouton-principal" disabled={!dessin} onClick={imprimer}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimer ou enregistrer en PDF
          </button>
        </div>
      </div>
      {pages && createPortal(pages, document.body)}
    </div>
  );
}
