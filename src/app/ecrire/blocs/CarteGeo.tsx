"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { geoAzimuthalEqualArea, geoBounds, geoCentroid, geoPath } from "d3-geo";
import { useMemo, useState } from "react";
import { PAYS } from "@/lib/monde/donnees";
import { useCarte } from "../../monde/carte";

/**
 * Le Calame — le bloc « Carte » : la carte d'un pays (ou de sa région), tirée des données du
 * Portulan. Le pays est en couleur, ses voisins en gris, sa capitale marquée ; tout est en
 * vecteurs, net à l'impression.
 */

const L = 1000;
const H = 620;

export const CADRAGES = [
  { cle: "pays", libelle: "Le pays" },
  { cle: "voisins", libelle: "Avec ses voisins" },
  { cle: "continent", libelle: "Tout le continent" },
] as const;

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function VueCarteGeo({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const code = String(node.attrs.pays ?? "").toLowerCase();
  const cadrage = String(node.attrs.cadrage ?? "voisins");
  const capitale = node.attrs.capitale !== false;
  const titre = String(node.attrs.titre ?? "");
  const { detail, leger, erreur } = useCarte();
  const carte = detail ?? leger;
  const pays = PAYS.find((p) => p.code === code) ?? null;
  const [recherche, setRecherche] = useState("");

  const dessin = useMemo(() => {
    if (!carte || !pays) return null;
    const forme = carte.parCode.get(pays.code);
    if (!forme) return null;
    // Le cadre : le pays, un peu plus large (voisins), ou son continent entier.
    const [[o, s], [e, n]] = geoBounds(forme.f);
    const marge = cadrage === "pays" ? 0.15 : cadrage === "voisins" ? 0.9 : 0;
    let boite: [number, number, number, number];
    if (cadrage === "continent") {
      const memes = PAYS.filter((p) => p.continent === pays.continent && p.statut !== "territoire").map((p) => carte.parCode.get(p.code)).filter(Boolean);
      const bornes = memes.map((f) => geoBounds(f!.f));
      boite = [Math.min(...bornes.map((b) => b[0][0])), Math.min(...bornes.map((b) => b[0][1])), Math.max(...bornes.map((b) => b[1][0])), Math.max(...bornes.map((b) => b[1][1]))];
      if (boite[2] - boite[0] > 200) boite = [o - 40, s - 25, e + 40, n + 25];
    } else {
      const lx = Math.max(2, e - o);
      const ly = Math.max(2, n - s);
      boite = [o - lx * marge, s - ly * marge, e + lx * marge, n + ly * marge];
      // Avec ses voisins : le cadre les englobe (sans aller chercher un voisin d'outre-mer trop loin).
      if (cadrage === "voisins" && pays.voisins.length > 0) {
        const bornes = pays.voisins.map((v) => carte.parCode.get(v)).filter(Boolean).map((f) => geoBounds(f!.f)).filter(([[a], [b]]) => b - a < 60);
        if (bornes.length > 0) {
          boite = [Math.min(o, ...bornes.map((b) => b[0][0])), Math.min(s, ...bornes.map((b) => b[0][1])), Math.max(e, ...bornes.map((b) => b[1][0])), Math.max(n, ...bornes.map((b) => b[1][1]))];
          const mx = (boite[2] - boite[0]) * 0.06;
          const my = (boite[3] - boite[1]) * 0.06;
          boite = [boite[0] - mx, boite[1] - my, boite[2] + mx, boite[3] + my];
        }
      }
    }
    const centre = geoCentroid(forme.f);
    const points: [number, number][] = [];
    for (let i = 0; i <= 6; i++) {
      const lon = boite[0] + ((boite[2] - boite[0]) * i) / 6;
      const lat = boite[1] + ((boite[3] - boite[1]) * i) / 6;
      points.push([lon, boite[1]], [lon, boite[3]], [boite[0], lat], [boite[2], lat]);
    }
    const proj = geoAzimuthalEqualArea()
      .rotate([-centre[0], -centre[1]])
      .clipAngle(100)
      .fitExtent([[16, 16], [L - 16, H - 16]], { type: "MultiPoint", coordinates: points });
    const chemin = geoPath(proj);
    const terres = carte.formes.map((f) => ({ code: f.code, d: chemin(f.f) ?? "", choisi: f.code === pays.code })).filter((t) => t.d);
    const point = pays.capLatLng ? proj([pays.capLatLng[1], pays.capLatLng[0]]) : null;
    return { terres, frontieres: chemin(carte.frontieres) ?? "", capitale: point };
  }, [carte, pays, cadrage]);

  const choix = recherche.trim()
    ? PAYS.filter((p) => sansAccents(`${p.nom} ${p.noms.join(" ")}`).includes(sansAccents(recherche.trim()))).slice(0, 8)
    : [];

  return (
    <NodeViewWrapper as="figure" className="calame-carte-geo" data-selectionne={selected || undefined} contentEditable={false}>
      {dessin ? (
        <svg viewBox={`0 0 ${L} ${H}`} className="calame-carte-svg" role="img" aria-label={`Carte : ${pays?.nom ?? ""}`}>
          <rect width={L} height={H} className="calame-carte-mer" />
          {dessin.terres.map((t) => (
            <path key={t.code} d={t.d} className={t.choisi ? "calame-carte-choisi" : "calame-carte-terre"} />
          ))}
          <path d={dessin.frontieres} className="calame-carte-frontieres" />
          {capitale && dessin.capitale && pays?.capitale && (
            <g transform={`translate(${dessin.capitale[0]} ${dessin.capitale[1]})`}>
              <circle r={6} className="calame-carte-capitale" />
              <text x={10} y={5} className="calame-carte-etiquette">
                {pays.capitale}
              </text>
            </g>
          )}
        </svg>
      ) : (
        <div className="calame-carte-vide">{erreur ? "La carte n'a pas pu être chargée." : pays ? "Chargement de la carte…" : "Choisis un pays pour dessiner sa carte."}</div>
      )}
      <figcaption>{titre || pays?.nom || ""}</figcaption>

      {selected && editor.isEditable && (
        <div className="calame-carte-reglages sans-impression">
          <input className="champ" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un pays…" aria-label="Chercher un pays" />
          {choix.length > 0 && (
            <ul className="calame-carte-choix">
              {choix.map((p) => (
                <li key={p.code}>
                  <button
                    type="button"
                    onClick={() => {
                      updateAttributes({ pays: p.code });
                      setRecherche("");
                    }}
                  >
                    {p.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="inspecteur-choix" role="group" aria-label="Cadrage">
            {CADRAGES.map((c) => (
              <button key={c.cle} type="button" className="puce-module" aria-pressed={cadrage === c.cle} onClick={() => updateAttributes({ cadrage: c.cle })}>
                {c.libelle}
              </button>
            ))}
          </div>
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={capitale} onChange={(e) => updateAttributes({ capitale: e.target.checked })} />
            <span>Marquer la capitale</span>
          </label>
          <input className="champ" value={titre} onChange={(e) => updateAttributes({ titre: e.target.value.slice(0, 160) })} placeholder="Légende (le nom du pays par défaut)" aria-label="Légende de la carte" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const CarteGeo = Node.create({
  name: "carteGeo",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      pays: { default: "", parseHTML: (el) => el.getAttribute("data-pays") ?? "", renderHTML: (a) => ({ "data-pays": String(a.pays ?? "") }) },
      cadrage: { default: "voisins", parseHTML: (el) => el.getAttribute("data-cadrage") ?? "voisins", renderHTML: (a) => ({ "data-cadrage": String(a.cadrage ?? "voisins") }) },
      capitale: { default: true, parseHTML: (el) => el.getAttribute("data-capitale") !== "non", renderHTML: (a) => ({ "data-capitale": a.capitale === false ? "non" : "oui" }) },
      titre: { default: "", parseHTML: (el) => el.getAttribute("data-titre") ?? "", renderHTML: (a) => ({ "data-titre": String(a.titre ?? "") }) },
    };
  },
  parseHTML() {
    return [{ tag: "figure.calame-carte-geo" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const p = PAYS.find((x) => x.code === node.attrs.pays);
    return ["figure", mergeAttributes(HTMLAttributes, { class: "calame-carte-geo" }), String(node.attrs.titre || p?.nom || "Carte")];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueCarteGeo, {
      stopEvent: ({ event }) => !!(event.target as HTMLElement | null)?.closest?.(".calame-carte-reglages"),
    });
  },
});
