import type { ReactNode } from "react";
import { compiler } from "@/lib/schemas/expression";
import { bord, couperTexte, disposer, type Boite, type Plan } from "@/lib/schemas/disposition";
import { hexTeinte, ZONES_VENN, type DonneesSchema, type LienSchema, type NoeudSchema } from "@/lib/schemas/modele";

/*
 * Dessin d'un schéma en SVG. Sans état : utilisé tel quel par le serveur (lecture, export PDF),
 * et par les composants interactifs (lecture avec zoom, atelier d'édition) qui lui passent leurs fonctions.
 * Les couleurs de texte suivent « currentColor » : le schéma s'adapte au thème clair ou sombre.
 */

type Props = {
  donnees: DonneesSchema;
  uid: string;
  replies?: Set<string>;
  plan?: Plan;
  selection?: string | null;
  /** Rend les éléments cliquables (liens vers les articles et les sites). */
  liensActifs?: boolean;
  surNoeud?: (id: string, e: React.PointerEvent) => void;
  surLienSchema?: (id: string, e: React.PointerEvent) => void;
  surBasculer?: (id: string) => void;
  surDoubleClic?: (id: string) => void;
  cadre?: { x: number; y: number; l: number; h: number };
  classe?: string;
  transformation?: string;
  avantContenu?: ReactNode;
  apresContenu?: ReactNode;
};

const MARGE = 40;
const COULEURS_NATURE: Record<string, string> = { soutient: "#2fb48a", conteste: "#e05d5d", cause: "#e8893a" };

function texteMultiligne(lignes: string[], x: number, y: number, taillePolice = 14, gras = false, ancre: "middle" | "start" | "end" = "middle") {
  const hauteur = taillePolice * 1.28;
  const debut = y - ((lignes.length - 1) * hauteur) / 2;
  return (
    <text x={x} textAnchor={ancre} fontSize={taillePolice} fontWeight={gras ? 700 : 500} fill="currentColor" dominantBaseline="central">
      {lignes.map((l, i) => (
        <tspan key={i} x={x} y={debut + i * hauteur}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function forme(n: NoeudSchema, b: Boite, choisi: boolean) {
  const couleur = hexTeinte(n.teinte);
  const commun = { fill: couleur, fillOpacity: 0.16, stroke: couleur, strokeWidth: choisi ? 3.5 : 1.8 };
  const { x, y, l, h } = b;
  switch (n.forme) {
    case "rectangle":
      return <rect x={x - l / 2} y={y - h / 2} width={l} height={h} rx={4} {...commun} />;
    case "ellipse":
      return <ellipse cx={x} cy={y} rx={l / 2} ry={h / 2} {...commun} />;
    case "losange":
      return <polygon points={`${x},${y - h / 2} ${x + l / 2},${y} ${x},${y + h / 2} ${x - l / 2},${y}`} {...commun} />;
    case "hexagone":
      return <polygon points={`${x - l / 2 + 14},${y - h / 2} ${x + l / 2 - 14},${y - h / 2} ${x + l / 2},${y} ${x + l / 2 - 14},${y + h / 2} ${x - l / 2 + 14},${y + h / 2} ${x - l / 2},${y}`} {...commun} />;
    case "note":
      return <path d={`M${x - l / 2},${y - h / 2} h${l - 16} l16,16 v${h - 16} h${-l} z`} {...commun} fillOpacity={0.24} />;
    default:
      return <rect x={x - l / 2} y={y - h / 2} width={l} height={h} rx={16} {...commun} />;
  }
}

function trait(l: LienSchema, a: Boite, b: Boite, disposition: string): string {
  if (disposition === "mentale" || disposition === "horizontale") {
    const sens = b.x >= a.x ? 1 : -1;
    const x1 = a.x + (sens * a.l) / 2;
    const x2 = b.x - (sens * b.l) / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1},${a.y} C${mx},${a.y} ${mx},${b.y} ${x2},${b.y}`;
  }
  if (disposition === "verticale") {
    const sens = b.y >= a.y ? 1 : -1;
    const y1 = a.y + (sens * a.h) / 2;
    const y2 = b.y - (sens * b.h) / 2;
    const my = (y1 + y2) / 2;
    return `M${a.x},${y1} C${a.x},${my} ${b.x},${my} ${b.x},${y2}`;
  }
  const [x1, y1] = bord(a, b.x, b.y);
  const [x2, y2] = bord(b, a.x, a.y);
  return `M${x1},${y1} L${x2},${y2}`;
}

function Graphe(p: Props & { plan: Plan }) {
  const { donnees: d, plan, uid } = p;
  return (
    <>
      <defs>
        <marker id={`fleche-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>
      <g className="schema-liens">
        {d.liens.map((l) => {
          const a = plan.boites.get(l.de);
          const b = plan.boites.get(l.vers);
          if (!a || !b || !plan.visibles.has(l.de) || !plan.visibles.has(l.vers)) return null;
          const chemin = trait(l, a, b, d.disposition);
          const couleur = COULEURS_NATURE[l.nature] ?? "currentColor";
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={l.id} onPointerDown={p.surLienSchema ? (e) => p.surLienSchema!(l.id, e) : undefined} className={p.surLienSchema ? "schema-cliquable" : undefined}>
              {p.surLienSchema && <path d={chemin} stroke="transparent" strokeWidth={14} fill="none" />}
              <path
                d={chemin}
                fill="none"
                stroke={couleur}
                strokeOpacity={l.nature ? 0.9 : 0.5}
                strokeWidth={p.selection === l.id ? 3.5 : 1.8}
                strokeDasharray={l.trait === "tirets" ? "8 6" : l.trait === "pointille" ? "2 5" : undefined}
                markerEnd={l.fleche ? `url(#fleche-${uid})` : undefined}
              />
              {l.texte && (
                <g>
                  <rect x={mx - l.texte.length * 3.4 - 8} y={my - 11} width={l.texte.length * 6.8 + 16} height={22} rx={11} className="schema-etiquette-fond" />
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={12} fontStyle="italic" fill={l.nature ? couleur : "currentColor"}>
                    {l.texte}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
      <g className="schema-noeuds">
        {d.noeuds.map((n) => {
          const b = plan.boites.get(n.id);
          if (!b || !plan.visibles.has(n.id)) return null;
          const aEnfants = (plan.enfants.get(n.id) ?? []).length > 0;
          const replie = p.replies?.has(n.id) ?? n.replie;
          const contenu = (
            <>
              {forme(n, b, p.selection === n.id)}
              {texteMultiligne(b.lignes, b.x, b.y, 14, n.role === "these" || n.role === "conclusion" || n.forme === "ellipse")}
              {n.role && (
                <text x={b.x} y={b.y - b.h / 2 - 7} textAnchor="middle" fontSize={11} fontWeight={700} fill={hexTeinte(n.teinte)}>
                  {{ these: "THÈSE", premisse: "Prémisse", preuve: "Preuve", objection: "Objection", reponse: "Réponse", conclusion: "Conclusion", cause: "Cause", effet: "Effet" }[n.role]}
                </text>
              )}
              {(n.article || n.lien) && (
                <circle cx={b.x + b.l / 2 - 8} cy={b.y - b.h / 2 + 8} r={4.5} fill={hexTeinte(n.teinte)}>
                  <title>{n.article ? "Ouvre l'article lié" : "Ouvre le lien"}</title>
                </circle>
              )}
              {n.commentaire && <title>{n.commentaire}</title>}
            </>
          );
          const lienCible = n.article ? `/explorer/article/${n.article}` : n.lien;
          return (
            <g
              key={n.id}
              className={`schema-noeud${p.surNoeud ? " schema-cliquable" : ""}`}
              onPointerDown={p.surNoeud ? (e) => p.surNoeud!(n.id, e) : undefined}
              onDoubleClick={p.surDoubleClic ? () => p.surDoubleClic!(n.id) : undefined}
            >
              {p.liensActifs && lienCible ? (
                <a href={lienCible} target={n.lien && !n.article ? "_blank" : undefined} rel={n.lien && !n.article ? "noopener noreferrer" : undefined}>
                  {contenu}
                </a>
              ) : (
                contenu
              )}
              {aEnfants && p.surBasculer && (
                <g
                  className="schema-basculer"
                  role="button"
                  aria-label={replie ? `Déplier « ${n.texte} »` : `Replier « ${n.texte} »`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => p.surBasculer!(n.id)}
                >
                  <circle cx={d.disposition === "verticale" ? b.x : b.x + (b.x >= 0 || d.disposition !== "mentale" ? b.l / 2 : -b.l / 2)} cy={d.disposition === "verticale" ? b.y + b.h / 2 : b.y} r={9} />
                  <text x={d.disposition === "verticale" ? b.x : b.x + (b.x >= 0 || d.disposition !== "mentale" ? b.l / 2 : -b.l / 2)} y={d.disposition === "verticale" ? b.y + b.h / 2 : b.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
                    {replie ? "+" : "−"}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </>
  );
}

// ----------------------------------------------------------------------
// Diagramme de Venn
// ----------------------------------------------------------------------
function Venn({ d }: { d: DonneesSchema }) {
  const trois = d.ensembles.length >= 3;
  const r = 150;
  const centres = trois
    ? [
        [-85, -55],
        [85, -55],
        [0, 90],
      ]
    : [
        [-85, 0],
        [85, 0],
      ];
  const positions: Record<string, [number, number]> = trois
    ? { A: [-150, -90], B: [150, -90], C: [0, 175], AB: [0, -110], AC: [-95, 65], BC: [95, 65], ABC: [0, 0] }
    : { A: [-150, 0], B: [150, 0], AB: [0, 0] };
  return (
    <>
      {d.ensembles.slice(0, trois ? 3 : 2).map((e, i) => (
        <g key={i}>
          <circle cx={centres[i][0]} cy={centres[i][1]} r={r} fill={hexTeinte(e.teinte)} fillOpacity={0.18} stroke={hexTeinte(e.teinte)} strokeWidth={2} />
          <text x={centres[i][0] + (i === 0 ? -r * 0.55 : i === 1 ? r * 0.55 : 0)} y={centres[i][1] + (i === 2 ? r + 22 : -r - 14)} textAnchor="middle" fontSize={16} fontWeight={700} fill={hexTeinte(e.teinte)}>
            {e.nom}
          </text>
        </g>
      ))}
      {ZONES_VENN.filter((z) => positions[z] && d.zones[z]).map((z) => (
        <g key={z}>{texteMultiligne(couperTexte(d.zones[z], z.length === 1 ? 14 : 11, 5), positions[z][0], positions[z][1], 13)}</g>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------
// Graphiques statistiques et courbes
// ----------------------------------------------------------------------
function graduations(min: number, max: number, nombre = 6): number[] {
  if (max === min) return [min];
  const brut = (max - min) / nombre;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut) ?? brut;
  const debut = Math.ceil(min / pas) * pas;
  const sortie: number[] = [];
  for (let v = debut; v <= max + pas * 1e-9; v += pas) sortie.push(Math.round(v / pas) * pas);
  return sortie;
}
const nombreCourt = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M` : Math.abs(v) >= 1e4 ? `${(v / 1e3).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k` : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));

const L = 640;
const H = 380;
const G = 64;
const B = 56;

function Axes({ yMin, yMax, titreX, titreY, xs }: { yMin: number; yMax: number; titreX: string; titreY: string; xs: { x: number; texte: string }[] }) {
  const y = (v: number) => H - B - ((v - yMin) / (yMax - yMin || 1)) * (H - B - 24);
  return (
    <g fontSize={12} fill="currentColor">
      {graduations(yMin, yMax).map((v) => (
        <g key={v}>
          <line x1={G} x2={L - 16} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.5 : 0.12} />
          <text x={G - 8} y={y(v)} textAnchor="end" dominantBaseline="central" fillOpacity={0.75}>
            {nombreCourt(v)}
          </text>
        </g>
      ))}
      {xs.map((t, i) => (
        <text key={i} x={t.x} y={H - B + 18} textAnchor="middle" fillOpacity={0.8}>
          {t.texte.length > 14 ? `${t.texte.slice(0, 13)}…` : t.texte}
        </text>
      ))}
      {titreX && (
        <text x={(G + L) / 2} y={H - 12} textAnchor="middle" fontWeight={600}>
          {titreX}
        </text>
      )}
      {titreY && (
        <text x={16} y={(H - B) / 2} textAnchor="middle" fontWeight={600} transform={`rotate(-90 16 ${(H - B) / 2})`}>
          {titreY}
        </text>
      )}
    </g>
  );
}

function Legende({ elements, y }: { elements: { nom: string; couleur: string }[]; y: number }) {
  if (elements.length < 2) return null;
  const debuts = elements.map((_, i) => G + elements.slice(0, i).reduce((s, e) => s + e.nom.length * 7 + 36, 0));
  return (
    <g fontSize={12} fill="currentColor">
      {elements.map((e, i) => {
        const debut = debuts[i];
        return (
          <g key={i}>
            <rect x={debut} y={y - 6} width={12} height={12} rx={3} fill={e.couleur} />
            <text x={debut + 18} y={y} dominantBaseline="central">
              {e.nom}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Statistique({ d }: { d: DonneesSchema }) {
  const series = d.series.filter((s) => s.valeurs.length > 0);
  const n = Math.max(d.etiquettes.length, ...series.map((s) => s.valeurs.length), 1);
  if (d.typeStat === "secteurs") {
    const s = series[0];
    const valeurs = (s?.valeurs ?? []).map((v) => Math.max(0, v));
    const total = valeurs.reduce((a, b) => a + b, 0) || 1;
    const bornes = valeurs.map((_, i) => -Math.PI / 2 + (valeurs.slice(0, i).reduce((a, b) => a + b, 0) / total) * Math.PI * 2);
    const palette = ["or", "bleu", "emeraude", "amethyste", "orange", "rose", "turquoise", "rouge", "gris"] as const;
    return (
      <g>
        {valeurs.map((v, i) => {
          const a1 = bornes[i];
          const a2 = a1 + (v / total) * Math.PI * 2;
          const [cx, cy, r] = [210, H / 2, 150];
          const grand = a2 - a1 > Math.PI ? 1 : 0;
          const milieu = (a1 + a2) / 2;
          const chemin = v >= total ? `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0` : `M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 ${grand} 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} z`;
          return (
            <g key={i}>
              <path d={chemin} fill={hexTeinte(palette[i % palette.length])} stroke="var(--fond, #fff)" strokeWidth={2} />
              {v / total > 0.06 && (
                <text x={cx + r * 0.62 * Math.cos(milieu)} y={cy + r * 0.62 * Math.sin(milieu)} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill="#fff">
                  {Math.round((v / total) * 100)} %
                </text>
              )}
              <rect x={410} y={60 + i * 26} width={14} height={14} rx={3} fill={hexTeinte(palette[i % palette.length])} />
              <text x={432} y={67 + i * 26} dominantBaseline="central" fontSize={13} fill="currentColor">
                {(d.etiquettes[i] || `Part ${i + 1}`).slice(0, 26)} ({nombreCourt(v)})
              </text>
            </g>
          );
        })}
      </g>
    );
  }
  if (d.typeStat === "nuage") {
    const xs = d.etiquettes.map((e) => Number(String(e).replace(",", ".")));
    const valides = xs.map((x, i) => ({ x, i })).filter((p) => Number.isFinite(p.x));
    const xMin = Math.min(...valides.map((p) => p.x), 0);
    const xMax = Math.max(...valides.map((p) => p.x), 1);
    const toutes = series.flatMap((s) => s.valeurs);
    const yMin = Math.min(0, ...toutes);
    const yMax = Math.max(1, ...toutes);
    const px = (v: number) => G + ((v - xMin) / (xMax - xMin || 1)) * (L - G - 30);
    const py = (v: number) => H - B - ((v - yMin) / (yMax - yMin || 1)) * (H - B - 24);
    return (
      <g>
        <Axes yMin={yMin} yMax={yMax} titreX={d.titreX} titreY={d.titreY} xs={graduations(xMin, xMax).map((v) => ({ x: px(v), texte: nombreCourt(v) }))} />
        {series.map((s, k) => valides.map((p) => (Number.isFinite(s.valeurs[p.i]) ? <circle key={`${k}-${p.i}`} cx={px(p.x)} cy={py(s.valeurs[p.i])} r={5} fill={hexTeinte(s.teinte)} fillOpacity={0.85} /> : null)))}
        <Legende elements={series.map((s) => ({ nom: s.nom, couleur: hexTeinte(s.teinte) }))} y={14} />
      </g>
    );
  }
  const toutes = series.flatMap((s) => s.valeurs);
  const yMin = Math.min(0, ...toutes);
  const yMax = Math.max(1, ...toutes) * 1.08;
  const largeurCase = (L - G - 20) / n;
  const cx = (i: number) => G + largeurCase * (i + 0.5);
  const py = (v: number) => H - B - ((v - yMin) / (yMax - yMin || 1)) * (H - B - 24);
  return (
    <g>
      <Axes yMin={yMin} yMax={yMax} titreX={d.titreX} titreY={d.titreY} xs={Array.from({ length: n }, (_, i) => ({ x: cx(i), texte: d.etiquettes[i] ?? "" }))} />
      {d.typeStat === "barres"
        ? series.map((s, k) => {
            const l = (largeurCase * 0.72) / series.length;
            return s.valeurs.map((v, i) => (
              <rect key={`${k}-${i}`} x={cx(i) - (largeurCase * 0.72) / 2 + k * l} y={Math.min(py(v), py(0))} width={Math.max(1, l - 3)} height={Math.abs(py(v) - py(0))} rx={4} fill={hexTeinte(s.teinte)}>
                <title>{`${s.nom} : ${v}`}</title>
              </rect>
            ));
          })
        : series.map((s, k) => (
            <g key={k}>
              <polyline points={s.valeurs.map((v, i) => `${cx(i)},${py(v)}`).join(" ")} fill="none" stroke={hexTeinte(s.teinte)} strokeWidth={2.5} strokeLinejoin="round" />
              {s.valeurs.map((v, i) => (
                <circle key={i} cx={cx(i)} cy={py(v)} r={4} fill={hexTeinte(s.teinte)}>
                  <title>{`${s.nom} : ${v}`}</title>
                </circle>
              ))}
            </g>
          ))}
      <Legende elements={series.map((s) => ({ nom: s.nom, couleur: hexTeinte(s.teinte) }))} y={14} />
    </g>
  );
}

function Fonction({ d, uid }: { d: DonneesSchema; uid: string }) {
  const { xmin, xmax, ymin, ymax } = d.fenetre;
  const px = (v: number) => G + ((v - xmin) / (xmax - xmin)) * (L - G - 20);
  const py = (v: number) => 20 + ((ymax - v) / (ymax - ymin)) * (H - 60);
  const courbes = d.fonctions.map((f) => {
    const { f: calc } = compiler(f.expression);
    if (!calc) return { f, chemins: [] as string[] };
    const chemins: string[] = [];
    let courant = "";
    let precedent: number | null = null;
    const pas = (xmax - xmin) / 600;
    for (let x = xmin; x <= xmax + pas / 2; x += pas) {
      const y = calc(x);
      const valide = Number.isFinite(y) && y > ymin - (ymax - ymin) * 3 && y < ymax + (ymax - ymin) * 3;
      const saut = precedent !== null && Math.abs(y - precedent) > (ymax - ymin) * 1.5;
      if (!valide || saut) {
        if (courant) chemins.push(courant);
        courant = "";
      }
      if (valide) courant += `${courant ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`;
      precedent = valide ? y : null;
    }
    if (courant) chemins.push(courant);
    return { f, chemins };
  });
  return (
    <g>
      <clipPath id={`zone-courbe-${uid}`}>
        <rect x={G} y={20} width={L - G - 20} height={H - 60} />
      </clipPath>
      <g fontSize={11} fill="currentColor">
        {graduations(xmin, xmax, 8).map((v) => (
          <g key={`x${v}`}>
            <line x1={px(v)} x2={px(v)} y1={20} y2={H - 40} stroke="currentColor" strokeOpacity={v === 0 ? 0.6 : 0.1} />
            <text x={px(v)} y={H - 26} textAnchor="middle" fillOpacity={0.7}>
              {nombreCourt(v)}
            </text>
          </g>
        ))}
        {graduations(ymin, ymax, 6).map((v) => (
          <g key={`y${v}`}>
            <line x1={G} x2={L - 20} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.6 : 0.1} />
            <text x={G - 8} y={py(v)} textAnchor="end" dominantBaseline="central" fillOpacity={0.7}>
              {nombreCourt(v)}
            </text>
          </g>
        ))}
      </g>
      <g clipPath={`url(#zone-courbe-${uid})`}>
        {courbes.map(({ f, chemins }, i) => chemins.map((c, j) => <path key={`${i}-${j}`} d={c} fill="none" stroke={hexTeinte(f.teinte)} strokeWidth={2.5} />))}
      </g>
      <g fontSize={13} fill="currentColor">
        {d.fonctions.map((f, i) => (
          <g key={i}>
            <rect x={G + 10} y={28 + i * 22} width={14} height={4} rx={2} fill={hexTeinte(f.teinte)} />
            <text x={G + 30} y={30 + i * 22} dominantBaseline="central" fontStyle="italic">
              y = {f.expression}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

const SYMBOLES_MATRICE: Record<string, { s: string; c: string; t: string }> = {
  oui: { s: "✓", c: "#2fb48a", t: "Oui" },
  non: { s: "✗", c: "#e05d5d", t: "Non" },
  partiel: { s: "◐", c: "#e8893a", t: "En partie" },
  inconnu: { s: "?", c: "#8a8fa8", t: "Incertain" },
};

function Matrice({ d }: { d: DonneesSchema }) {
  const lc = 220;
  const lp = Math.max(110, Math.min(170, 560 / Math.max(1, d.positions.length)));
  const ht = 56;
  const hl = 46;
  return (
    <g fontSize={13} fill="currentColor">
      {d.positions.map((p, j) => (
        <g key={j}>
          <rect x={lc + j * lp} y={0} width={lp} height={ht} fill="currentColor" fillOpacity={0.06} stroke="currentColor" strokeOpacity={0.15} />
          {texteMultiligne(couperTexte(p, 16, 2), lc + j * lp + lp / 2, ht / 2, 13, true)}
        </g>
      ))}
      {d.criteres.map((c, i) => (
        <g key={i}>
          <rect x={0} y={ht + i * hl} width={lc} height={hl} fill="currentColor" fillOpacity={i % 2 ? 0.03 : 0.06} stroke="currentColor" strokeOpacity={0.15} />
          {texteMultiligne(couperTexte(c, 28, 2), 12, ht + i * hl + hl / 2, 13, false, "start")}
          {d.positions.map((_, j) => {
            const cel = d.cellules[i]?.[j];
            const sym = cel ? SYMBOLES_MATRICE[cel.valeur] : undefined;
            const x = lc + j * lp + lp / 2;
            const y = ht + i * hl + hl / 2;
            return (
              <g key={j}>
                <rect x={lc + j * lp} y={ht + i * hl} width={lp} height={hl} fill={sym ? sym.c : "transparent"} fillOpacity={sym ? 0.1 : 0} stroke="currentColor" strokeOpacity={0.15} />
                {sym && (
                  <text x={x} y={cel?.note ? y - 8 : y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={sym.c}>
                    {sym.s}
                    <title>{sym.t}</title>
                  </text>
                )}
                {cel?.note && (
                  <text x={x} y={sym ? y + 12 : y} textAnchor="middle" dominantBaseline="central" fontSize={11} fillOpacity={0.8}>
                    {cel.note.length > 22 ? `${cel.note.slice(0, 21)}…` : cel.note}
                    <title>{cel.note}</title>
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

/** Cadre (viewBox) d'un schéma, marges comprises. */
export function cadreDe(d: DonneesSchema, plan?: Plan): { x: number; y: number; l: number; h: number } {
  if (d.genre === "graphe") {
    const p = plan ?? disposer(d);
    return { x: p.minX - MARGE, y: p.minY - MARGE - 14, l: p.maxX - p.minX + 2 * MARGE, h: p.maxY - p.minY + 2 * MARGE + 14 };
  }
  if (d.genre === "venn") return d.ensembles.length >= 3 ? { x: -270, y: -250, l: 540, h: 520 } : { x: -270, y: -200, l: 540, h: 400 };
  if (d.genre === "matrice") return { x: -10, y: -10, l: 220 + Math.max(110, Math.min(170, 560 / Math.max(1, d.positions.length))) * d.positions.length + 20, h: 56 + 46 * d.criteres.length + 20 };
  return { x: 0, y: 0, l: L, h: H };
}

export function SvgSchema(p: Props) {
  const d = p.donnees;
  const plan = d.genre === "graphe" ? (p.plan ?? disposer(d, p.replies)) : undefined;
  const c = p.cadre ?? cadreDe(d, plan);
  return (
    <svg
      viewBox={`${c.x} ${c.y} ${c.l} ${c.h}`}
      className={`schema-svg ${p.classe ?? ""}`}
      role="img"
      aria-label={d.titre || "Schéma"}
      xmlns="http://www.w3.org/2000/svg"
      fontFamily="Inter, system-ui, sans-serif"
    >
      {p.avantContenu}
      <g transform={p.transformation}>
        {d.genre === "graphe" && plan && <Graphe {...p} plan={plan} />}
        {d.genre === "venn" && <Venn d={d} />}
        {d.genre === "statistique" && <Statistique d={d} />}
        {d.genre === "fonction" && <Fonction d={d} uid={p.uid} />}
        {d.genre === "matrice" && <Matrice d={d} />}
      </g>
      {p.apresContenu}
    </svg>
  );
}
