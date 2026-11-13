"use client";

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { Maximize, Minus, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { normaliser } from "@/lib/recherche-texte";

export type Noeud = { id: string; type: "bloc" | "categorie" | "article" | "etiquette"; titre: string; accent: string; href: string };
export type Arete = { source: string; cible: string; type: "rangement" | "etiquette" | "lien" };

type Point = Noeud & SimulationNodeDatum & { x: number; y: number };
type Lien = SimulationLinkDatum<Point> & { type: Arete["type"] };

const RAYONS: Record<Noeud["type"], number> = { bloc: 22, categorie: 11, article: 6, etiquette: 4.5 };
const LIBELLES: Record<Noeud["type"], string> = { bloc: "Blocs", categorie: "Catégories", article: "Articles", etiquette: "Étiquettes" };

export function GrapheConnaissances({ noeuds, aretes }: { noeuds: Noeud[]; aretes: Arete[] }) {
  const router = useRouter();
  const svg = useRef<SVGSVGElement>(null);
  const [types, setTypes] = useState<Set<Noeud["type"]>>(new Set(["bloc", "categorie", "article", "etiquette"]));
  const [survol, setSurvol] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [vue, setVue] = useState({ x: 0, y: 0, k: 1 });
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const glisse = useRef(false);

  // Mise en place du graphe (calculée une fois pour toutes, puis figée).
  const { points, liens } = useMemo(() => {
    const visibles = noeuds.filter((n) => types.has(n.type));
    const ids = new Set(visibles.map((n) => n.id));
    const pts: Point[] = visibles.map((n, i) => ({ ...n, x: Math.cos(i) * 200, y: Math.sin(i) * 200 }));
    const lns: Lien[] = aretes.filter((a) => ids.has(a.source) && ids.has(a.cible)).map((a) => ({ source: a.source, target: a.cible, type: a.type }));
    const simulation = forceSimulation(pts)
      .force("charge", forceManyBody<Point>().strength((p) => (p.type === "bloc" ? -900 : p.type === "categorie" ? -220 : -60)))
      .force("liens", forceLink<Point, Lien>(lns).id((p) => p.id).distance((l) => (l.type === "lien" ? 70 : l.type === "etiquette" ? 45 : 55)).strength((l) => (l.type === "lien" ? 0.25 : 0.6)))
      .force("centre", forceCenter(0, 0))
      // Rappel doux vers le centre : les groupes sans lien entre eux restent proches et lisibles.
      .force("x", forceX<Point>(0).strength(0.07))
      .force("y", forceY<Point>(0).strength(0.07))
      .force("collision", forceCollide<Point>((p) => RAYONS[p.type] + 4))
      .stop();
    const tours = Math.min(400, 120 + pts.length);
    for (let i = 0; i < tours; i++) simulation.tick();
    return { points: pts, liens: lns };
  }, [noeuds, aretes, types]);

  const voisins = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of liens) {
      const s = (l.source as Point).id;
      const c = (l.target as Point).id;
      if (!m.has(s)) m.set(s, new Set());
      if (!m.has(c)) m.set(c, new Set());
      m.get(s)!.add(c);
      m.get(c)!.add(s);
    }
    return m;
  }, [liens]);

  const trouves = useMemo(() => {
    const m = normaliser(q.trim());
    return m.length >= 2 ? new Set(points.filter((p) => normaliser(p.titre).includes(m)).map((p) => p.id)) : null;
  }, [q, points]);

  // Cadrage automatique sur l'ensemble du graphe.
  const cadrer = () => {
    const boite = svg.current?.getBoundingClientRect();
    if (!boite || points.length === 0) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const largeur = Math.max(...xs) - Math.min(...xs) + 80;
    const hauteur = Math.max(...ys) - Math.min(...ys) + 80;
    const k = Math.min(2, boite.width / largeur, boite.height / hauteur);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    setVue({ k, x: boite.width / 2 - cx * k, y: boite.height / 2 - cy * k });
  };
  useEffect(cadrer, [points]);

  const zoomer = (facteur: number, cx?: number, cy?: number) => {
    const boite = svg.current?.getBoundingClientRect();
    if (!boite) return;
    const px = cx ?? boite.width / 2;
    const py = cy ?? boite.height / 2;
    setVue((v) => {
      const k = Math.min(6, Math.max(0.15, v.k * facteur));
      return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    });
  };

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const roue = (e: WheelEvent) => {
      e.preventDefault();
      const b = el.getBoundingClientRect();
      zoomer(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - b.left, e.clientY - b.top);
    };
    el.addEventListener("wheel", roue, { passive: false });
    return () => el.removeEventListener("wheel", roue);
  }, []);

  const actif = survol;
  const proches = actif ? voisins.get(actif) : null;
  const estAllume = (id: string) => (trouves ? trouves.has(id) : !actif || id === actif || Boolean(proches?.has(id)));
  const pointActif = points.find((p) => p.id === actif);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <div className="debat-recherche !min-h-11 flex-1 sm:max-w-sm">
          <Search className="size-4 text-accent" aria-hidden="true" />
          <label htmlFor="graphe-q" className="sr-only">
            Trouver un élément du graphe
          </label>
          <input id="graphe-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Trouver un article, une étiquette…" className="!text-base" />
        </div>
        {(Object.keys(LIBELLES) as Noeud["type"][]).map((t) => (
          <button
            key={t}
            type="button"
            className="puce-filtre"
            aria-pressed={types.has(t)}
            disabled={t === "bloc"}
            onClick={() =>
              setTypes((s) => {
                const n = new Set(s);
                if (n.has(t)) n.delete(t);
                else n.add(t);
                return n;
              })
            }
          >
            <span className={`legende-point legende-${t}`} aria-hidden="true" />
            {LIBELLES[t]}
          </button>
        ))}
      </div>

      <div className="graphe-cadre">
        <svg
          ref={svg}
          className="graphe"
          role="img"
          aria-label={`Graphe de ${points.length} éléments et ${liens.length} liens`}
          onPointerDown={(e) => {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            glisse.current = false;
          }}
          onPointerMove={(e) => {
            const avant = pointeurs.current.get(e.pointerId);
            if (!avant) return;
            if (pointeurs.current.size === 2) {
              const autres = [...pointeurs.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
              if (autres) {
                const d1 = Math.hypot(avant.x - autres.x, avant.y - autres.y);
                const d2 = Math.hypot(e.clientX - autres.x, e.clientY - autres.y);
                const b = svg.current!.getBoundingClientRect();
                if (d1 > 0) zoomer(d2 / d1, (e.clientX + autres.x) / 2 - b.left, (e.clientY + autres.y) / 2 - b.top);
              }
            } else {
              const dx = e.clientX - avant.x;
              const dy = e.clientY - avant.y;
              if (Math.abs(dx) + Math.abs(dy) > 3) glisse.current = true;
              setVue((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
            }
            pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          }}
          onPointerUp={(e) => pointeurs.current.delete(e.pointerId)}
          onPointerCancel={(e) => pointeurs.current.delete(e.pointerId)}
        >
          <g transform={`translate(${vue.x} ${vue.y}) scale(${vue.k})`}>
            {liens.map((l, i) => {
              const s = l.source as Point;
              const c = l.target as Point;
              const allume = !actif ? !trouves : s.id === actif || c.id === actif;
              return <line key={i} x1={s.x} y1={s.y} x2={c.x} y2={c.y} className={`arete arete-${l.type}`} data-allume={allume} />;
            })}
            {points.map((p) => (
              <g
                key={p.id}
                transform={`translate(${p.x} ${p.y})`}
                className="sommet"
                data-type={p.type}
                data-accent={p.accent}
                data-allume={estAllume(p.id)}
                tabIndex={0}
                role="link"
                aria-label={`${p.titre} (${LIBELLES[p.type].toLowerCase().replace(/s$/, "")})`}
                onPointerEnter={() => setSurvol(p.id)}
                onPointerLeave={() => setSurvol((s) => (s === p.id ? null : s))}
                onFocus={() => setSurvol(p.id)}
                onBlur={() => setSurvol(null)}
                onClick={() => {
                  if (!glisse.current) router.push(p.href);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(p.href);
                }}
              >
                <circle r={RAYONS[p.type]} />
                {(p.type === "bloc" || (vue.k > 1.4 && p.type === "categorie") || p.id === actif || trouves?.has(p.id)) && (
                  <text y={-RAYONS[p.type] - 6} textAnchor="middle" style={{ fontSize: `${Math.max(10, 13 / vue.k)}px` }}>
                    {p.titre.length > 48 ? `${p.titre.slice(0, 46)}…` : p.titre}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
        <div className="graphe-zoom" role="group" aria-label="Zoom">
          <button type="button" className="bouton-icone" aria-label="Zoomer" onClick={() => zoomer(1.3)}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton-icone" aria-label="Dézoomer" onClick={() => zoomer(1 / 1.3)}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton-icone" aria-label="Tout afficher" onClick={cadrer}>
            <Maximize className="size-4" aria-hidden="true" />
          </button>
        </div>
        {pointActif && (
          <p className="graphe-info" aria-live="polite">
            <strong>{pointActif.titre}</strong>
            <span>
              {LIBELLES[pointActif.type].replace(/s$/, "")}, {proches?.size ?? 0} lien{(proches?.size ?? 0) > 1 ? "s" : ""}
            </span>
          </p>
        )}
      </div>
      {points.length <= 3 && (
        <p className="mt-4 text-encre-douce">Le graphe se remplit au fur et à mesure que des catégories et des articles sont publiés.</p>
      )}
    </div>
  );
}
