"use client";

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { ArrowRight, FileText, Folder, Hash, LoaderCircle, Maximize, Minus, Plus, Search, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { normaliser } from "@/lib/recherche-texte";
import type { ApercuNoeud } from "@/app/api/apercu-noeud/route";

export type Noeud = { id: string; type: "bloc" | "categorie" | "article" | "etiquette"; titre: string; accent: string; href: string };
export type Arete = { source: string; cible: string; type: "rangement" | "etiquette" | "lien" };

type Point = Noeud & SimulationNodeDatum & { x: number; y: number };
type Lien = SimulationLinkDatum<Point> & { type: Arete["type"] };

const RAYONS: Record<Noeud["type"], number> = { bloc: 22, categorie: 11, article: 6, etiquette: 4.5 };
const LIBELLES: Record<Noeud["type"], string> = { bloc: "Blocs", categorie: "Catégories", article: "Articles", etiquette: "Étiquettes" };
/** Ce vers quoi mène chaque point, dit en clair dans l'aperçu. */
const NATURE: Record<Noeud["type"], string> = { bloc: "Bloc de la bibliothèque", categorie: "Catégorie", article: "Article", etiquette: "Étiquette" };
const OUVRIR: Record<Noeud["type"], string> = { bloc: "Ouvrir le bloc", categorie: "Ouvrir la catégorie", article: "Lire l'article", etiquette: "Voir les articles" };
const ICONES: Record<Noeud["type"], React.ReactNode> = {
  bloc: <Hash className="size-4" aria-hidden="true" />,
  categorie: <Folder className="size-4" aria-hidden="true" />,
  article: <FileText className="size-4" aria-hidden="true" />,
  etiquette: <Tag className="size-4" aria-hidden="true" />,
};

export function GrapheConnaissances({ noeuds, aretes }: { noeuds: Noeud[]; aretes: Arete[] }) {
  const router = useRouter();
  const svg = useRef<SVGSVGElement>(null);
  const [types, setTypes] = useState<Set<Noeud["type"]>>(new Set(["bloc", "categorie", "article", "etiquette"]));
  const [survol, setSurvol] = useState<string | null>(null);
  // Premier appui : on choisit le point et on l'examine. Deuxième appui : on y va.
  const [choisi, setChoisi] = useState<string | null>(null);
  // null dans « donnees » = la réponse est arrivée mais vide ; tant que l'identifiant ne
  // correspond pas au point choisi, c'est que la lecture est encore en cours.
  const [apercu, setApercu] = useState<{ id: string; donnees: ApercuNoeud | null } | null>(null);
  const texteApercu = useRef<HTMLDivElement>(null);
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

  // Aperçu du point choisi, chargé à la demande (rien n'est demandé tant qu'on n'a pas cliqué).
  useEffect(() => {
    const point = choisi ? points.find((p) => p.id === choisi) : undefined;
    if (!point) return;
    const controleur = new AbortController();
    fetch(`/api/apercu-noeud?id=${encodeURIComponent(point.id)}&type=${point.type}`, { signal: controleur.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApercuNoeud | null) => setApercu({ id: point.id, donnees: d && !("erreur" in d) ? d : null }))
      .catch(() => {
        if (!controleur.signal.aborted) setApercu({ id: point.id, donnees: null });
      });
    return () => controleur.abort();
  }, [choisi, points]);

  // Échap referme l'examen en cours.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && choisi) setChoisi(null);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [choisi]);

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

  /*
   * Le dégradé du bas ne doit apparaître que si le texte continue vraiment en dessous.
   * On marque donc l'élément lui-même, sans repasser par un état : rien à réafficher.
   */
  useEffect(() => {
    const zone = texteApercu.current;
    if (!zone) return;
    zone.toggleAttribute("data-coulisse", zone.scrollHeight > zone.clientHeight + 4);
  });

  const actif = choisi ?? survol;
  const proches = actif ? voisins.get(actif) : null;
  const estAllume = (id: string) => (trouves ? trouves.has(id) : !actif || id === actif || Boolean(proches?.has(id)));
  const pointActif = points.find((p) => p.id === actif);
  const pointChoisi = points.find((p) => p.id === choisi);
  // L'aperçu n'est montré que s'il correspond bien au point examiné (une réponse en retard est ignorée).
  const donnees = apercu && apercu.id === choisi ? apercu.donnees : null;
  const lectureEnCours = Boolean(choisi) && apercu?.id !== choisi;

  /*
   * Un titre ne s'affiche que s'il a une raison d'être là. Pendant l'examen d'un point,
   * seul le sien reste : c'est ce qui rend la lecture du graphe possible quand il est dense.
   */
  const titreVisible = (p: Point) => {
    if (choisi) return p.id === choisi;
    if (trouves?.has(p.id)) return true;
    return p.type === "bloc" || (vue.k > 1.4 && p.type === "categorie") || p.id === actif;
  };

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

      <div className="graphe-cadre" data-apercu={choisi ? "" : undefined}>
        <svg
          ref={svg}
          className="graphe"
          role="img"
          aria-label={`Graphe de ${points.length} éléments et ${liens.length} liens`}
          onPointerDown={(e) => {
            // La capture peut être refusée (pointeur déjà relâché) : ce n'est pas une raison de tout arrêter.
            try {
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
            } catch {}
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
          onPointerUp={(e) => {
            pointeurs.current.delete(e.pointerId);
            if (glisse.current || pointeurs.current.size > 0) return;
            /*
             * Le svg capture le pointeur pour pouvoir être déplacé même quand le doigt
             * en sort : les appuis arrivent donc tous sur le svg, jamais sur le point visé.
             * On retrouve donc nous-mêmes le point qui se trouve sous le doigt.
             */
            const vise = document.elementFromPoint(e.clientX, e.clientY)?.closest(".sommet");
            const id = vise instanceof SVGElement ? vise.dataset.id : undefined;
            const point = id ? points.find((p) => p.id === id) : undefined;
            // Appui dans le vide : on sort de l'examen.
            if (!point) {
              setChoisi(null);
              return;
            }
            if (choisi === point.id) router.push(point.href);
            else setChoisi(point.id);
          }}
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
                data-id={p.id}
                data-type={p.type}
                data-accent={p.accent}
                data-allume={estAllume(p.id)}
                tabIndex={0}
                role="link"
                aria-label={`${p.titre} (${LIBELLES[p.type].toLowerCase().replace(/s$/, "")})`}
                data-choisi={p.id === choisi || undefined}
                aria-current={p.id === choisi ? "true" : undefined}
                onPointerEnter={() => setSurvol(p.id)}
                onPointerLeave={() => setSurvol((s) => (s === p.id ? null : s))}
                onFocus={() => setSurvol(p.id)}
                onBlur={() => setSurvol(null)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (choisi === p.id) router.push(p.href);
                  else setChoisi(p.id);
                }}
              >
                <circle r={RAYONS[p.type]} />
                {titreVisible(p) && (
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
        {pointActif && !choisi && (
          <p className="graphe-info" aria-live="polite">
            <strong>{pointActif.titre}</strong>
            <span>
              {LIBELLES[pointActif.type].replace(/s$/, "")}, {proches?.size ?? 0} lien{(proches?.size ?? 0) > 1 ? "s" : ""}
            </span>
          </p>
        )}

        {pointChoisi && (
          <aside className="graphe-apercu" data-accent={pointChoisi.accent} aria-label={`Aperçu de ${pointChoisi.titre}`}>
            <button type="button" className="graphe-apercu-fermer" aria-label="Fermer l'aperçu" onClick={() => setChoisi(null)}>
              <X className="size-4" aria-hidden="true" />
            </button>
            <p className="graphe-apercu-nature">
              {ICONES[pointChoisi.type]}
              {NATURE[pointChoisi.type]}
            </p>
            <h2 className="graphe-apercu-titre">{pointChoisi.titre}</h2>

            <p className="graphe-apercu-chiffres">
              {donnees?.contexte ? <span>dans {donnees.contexte}</span> : null}
              {donnees?.mots ? <span>{donnees.mots.toLocaleString("fr-FR")} mots</span> : null}
              {donnees?.compte !== undefined ? (
                <span>
                  {donnees.compte} {pointChoisi.type === "bloc" ? "catégorie" : "article"}
                  {donnees.compte > 1 ? "s" : ""}
                </span>
              ) : null}
              <span>
                {proches?.size ?? 0} lien{(proches?.size ?? 0) > 1 ? "s" : ""}
              </span>
            </p>

            {lectureEnCours && (
              <p className="graphe-apercu-attente" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Lecture…
              </p>
            )}

            {donnees && (donnees.resume || donnees.extrait) && (
              <div ref={texteApercu} className="graphe-apercu-texte" tabIndex={0} role="region" aria-label="Aperçu du contenu">
                {donnees.resume && <p className="graphe-apercu-resume">{donnees.resume}</p>}
                {donnees.extrait && <p className="graphe-apercu-extrait">{donnees.extrait}</p>}
              </div>
            )}

            <button type="button" className="bouton bouton-principal graphe-apercu-ouvrir" onClick={() => router.push(pointChoisi.href)}>
              {OUVRIR[pointChoisi.type]}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <p className="graphe-apercu-aide">Appuie une deuxième fois sur le point pour l&apos;ouvrir.</p>
          </aside>
        )}
      </div>
      {points.length <= 3 && (
        <p className="mt-4 text-encre-douce">Le graphe se remplit au fur et à mesure que des catégories et des articles sont publiés.</p>
      )}
    </div>
  );
}
