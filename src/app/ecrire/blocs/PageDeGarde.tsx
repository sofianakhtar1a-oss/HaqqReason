"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

/**
 * Le Calame — la page de garde : titre, sous-titre, auteur, établissement, direction, date,
 * composés sur une page entière selon un modèle. Elle ouvre le document et la suite repart
 * toujours en haut de la page suivante.
 */

export const MODELES_GARDE = [
  { cle: "classique", libelle: "Classique" },
  { cle: "moderne", libelle: "Moderne" },
  { cle: "academique", libelle: "Universitaire" },
  { cle: "sobre", libelle: "Sobre" },
] as const;

const CHAMPS = [
  { cle: "titre", libelle: "Titre", indication: "Le titre du document" },
  { cle: "sousTitre", libelle: "Sous-titre", indication: "Facultatif" },
  { cle: "auteur", libelle: "Auteur", indication: "Ton nom" },
  { cle: "etablissement", libelle: "Établissement", indication: "Université, institut, association…" },
  { cle: "direction", libelle: "Direction", indication: "Sous la direction de…" },
  { cle: "date", libelle: "Date", indication: "Laisser vide : le mois en cours" },
] as const;

type Attributs = Record<(typeof CHAMPS)[number]["cle"] | "modele", string>;

const attribut = (nom: string, defaut = "") => ({
  default: defaut,
  parseHTML: (el: HTMLElement) => el.getAttribute(`data-${nom}`) ?? defaut,
  renderHTML: (a: Record<string, unknown>) => ({ [`data-${nom}`]: String(a[nom] ?? "") }),
});

function VuePageDeGarde({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const a = node.attrs as Attributs;
  const date = a.date || new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const modele = MODELES_GARDE.some((m) => m.cle === a.modele) ? a.modele : "classique";
  const vide = (texte: string, repli: string) => texte || <span className="pdg-vide">{repli}</span>;

  return (
    <NodeViewWrapper className="page-de-garde" data-modele={modele} data-saut-apres="" data-selectionne={selected || undefined} contentEditable={false}>
      <div className="pdg-haut">{a.etablissement && <p className="pdg-etablissement">{a.etablissement}</p>}</div>
      <div className="pdg-milieu">
        {modele === "academique" && a.auteur && <p className="pdg-presente">Présenté par {a.auteur}</p>}
        <h1 className="pdg-titre">{vide(a.titre, "Titre du document")}</h1>
        {a.sousTitre && <p className="pdg-sous-titre">{a.sousTitre}</p>}
      </div>
      <div className="pdg-bas">
        {modele !== "academique" && a.auteur && <p className="pdg-auteur">{a.auteur}</p>}
        {a.direction && <p className="pdg-direction">Sous la direction de {a.direction}</p>}
        <p className="pdg-date">{date}</p>
      </div>

      {selected && editor.isEditable && (
        <div className="pdg-reglages sans-impression" role="group" aria-label="Page de garde">
          <div className="inspecteur-choix" role="group" aria-label="Modèle">
            {MODELES_GARDE.map((m) => (
              <button key={m.cle} type="button" className="puce-module" aria-pressed={modele === m.cle} onClick={() => updateAttributes({ modele: m.cle })}>
                {m.libelle}
              </button>
            ))}
          </div>
          {CHAMPS.map((c) => (
            <label key={c.cle} className="inspecteur-reglage">
              <span className="inspecteur-libelle">{c.libelle}</span>
              <input className="champ" value={a[c.cle] ?? ""} placeholder={c.indication} onChange={(e) => updateAttributes({ [c.cle]: e.target.value.slice(0, 200) })} />
            </label>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const PageDeGarde = Node.create({
  name: "pageDeGarde",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      titre: attribut("titre"),
      sousTitre: attribut("sous-titre"),
      auteur: attribut("auteur"),
      etablissement: attribut("etablissement"),
      direction: attribut("direction"),
      date: attribut("date"),
      modele: attribut("modele", "classique"),
    };
  },
  parseHTML() {
    return [{ tag: "section.page-de-garde" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Attributs;
    return ["section", mergeAttributes(HTMLAttributes, { class: "page-de-garde" }), ["h1", {}, a.titre], ["p", {}, a.sousTitre], ["p", {}, a.auteur]];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VuePageDeGarde, {
      // Les champs de réglage gardent le clavier pour eux : Retour arrière n'efface pas la page.
      stopEvent: ({ event }) => {
        const cible = event.target as HTMLElement | null;
        return !!cible?.closest?.(".pdg-reglages");
      },
    });
  },
});
