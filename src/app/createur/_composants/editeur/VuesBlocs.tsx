"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Brain, PenLine } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { CarteLien } from "@/components/CarteLien";
import { RenduLogique } from "@/components/logique/RenduLogique";
import { SvgSchema } from "@/components/schemas/SvgSchema";
import { nettoyerLogique, type DonneesLogique } from "@/lib/logique/bloc";
import { nettoyerSchema, type DonneesSchema } from "@/lib/schemas/modele";
import { sophismeParCle } from "@/lib/sophismes";
import { localisation, partiesReference, statutSource, type DonneesSources } from "@/lib/sources";
import { lireSourcesEditeur } from "../../sources/actions";
import { AtelierLogique } from "../ateliers/AtelierLogique";
import { AtelierSchema } from "../ateliers/AtelierSchema";

/*
 * Affichage des blocs de la phase 7 dans l'éditeur : aperçu fidèle et bouton pour ouvrir l'atelier.
 */

/** Une insertion depuis le menu « / » demande l'ouverture immédiate de l'atelier du bloc inséré. */
export const drapeaux = { ouvrirAtelier: false };

function useOuvertureAuto(): [boolean, (v: boolean) => void] {
  const [ouvert, setOuvert] = useState(() => {
    if (drapeaux.ouvrirAtelier) {
      drapeaux.ouvrirAtelier = false;
      return true;
    }
    return false;
  });
  return [ouvert, setOuvert];
}

const enJson = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function VueSchema({ node, updateAttributes, selected }: NodeViewProps) {
  const uid = useId().replace(/:/g, "");
  const [ouvert, setOuvert] = useOuvertureAuto();
  const donnees = nettoyerSchema(enJson(node.attrs.donnees));
  return (
    <NodeViewWrapper className="bloc-atelier" data-selectionne={selected || undefined} data-drag-handle="">
      <div className="bloc-atelier-entete" contentEditable={false}>
        <span className="bloc-atelier-type">Schéma{donnees.titre ? ` : ${donnees.titre}` : ""}</span>
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" onClick={() => setOuvert(true)}>
          <PenLine className="size-4" aria-hidden="true" />
          Modifier dans l&apos;atelier
        </button>
      </div>
      <div className="bloc-atelier-apercu" contentEditable={false} onDoubleClick={() => setOuvert(true)}>
        <SvgSchema donnees={donnees} uid={uid} />
      </div>
      {ouvert && (
        <AtelierSchema
          initial={donnees}
          onFermer={() => setOuvert(false)}
          onValider={(d: DonneesSchema) => {
            updateAttributes({ donnees: enJson(d) });
            setOuvert(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

export function VueLogique({ node, updateAttributes, selected }: NodeViewProps) {
  const [ouvert, setOuvert] = useOuvertureAuto();
  const donnees = nettoyerLogique(enJson(node.attrs.donnees));
  return (
    <NodeViewWrapper className="bloc-atelier" data-selectionne={selected || undefined} data-drag-handle="">
      <div className="bloc-atelier-entete" contentEditable={false}>
        <span className="bloc-atelier-type">
          <Brain className="mr-1 inline size-4" aria-hidden="true" />
          Atelier de logique
        </span>
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" onClick={() => setOuvert(true)}>
          <PenLine className="size-4" aria-hidden="true" />
          Modifier
        </button>
      </div>
      <div className="bloc-atelier-apercu" contentEditable={false} onDoubleClick={() => setOuvert(true)}>
        <RenduLogique donnees={donnees} />
      </div>
      {ouvert && (
        <AtelierLogique
          initial={donnees}
          onFermer={() => setOuvert(false)}
          onValider={(d: DonneesLogique) => {
            updateAttributes({ donnees: enJson(d) });
            setOuvert(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

export function VueLienCarte({ node, selected }: NodeViewProps) {
  const a = node.attrs as Record<string, string>;
  return (
    <NodeViewWrapper className="carte-lien-conteneur" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false}>
      <CarteLien actif={false} d={{ url: a.url ?? "", titre: a.titre ?? "", description: a.description ?? "", site: a.site ?? "", auteur: a.auteur ?? "", genre: a.genre ?? "web", video: a.video ?? "", liste: a.liste ?? "", image: a.image ?? "" }} />
    </NodeViewWrapper>
  );
}

export function VueSophisme({ node, selected }: NodeViewProps) {
  const s = sophismeParCle(String(node.attrs.cle));
  return (
    <NodeViewWrapper as="aside" className="sophisme-carte" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false}>
      <p className="sophisme-surtitre">Sophisme identifié (choisis-le dans le panneau « Bloc sélectionné »)</p>
      <p className="sophisme-nom">
        {s?.nom}
        {s?.latin && <span className="sophisme-latin"> ({s.latin})</span>}
      </p>
      <p>{s?.definition}</p>
      {node.attrs.commentaire && <p className="sophisme-commentaire">{String(node.attrs.commentaire)}</p>}
    </NodeViewWrapper>
  );
}

// Cache des sources affichées dans l'éditeur (évite de redemander les mêmes informations).
const cache: DonneesSources = { ouvrages: {}, citations: {} };
function useSources(ouvrage: string, citation: string): DonneesSources | null {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const manque = (ouvrage && !cache.ouvrages[ouvrage]) || (citation && !cache.citations[citation]);
    if (!manque) return;
    let annule = false;
    void lireSourcesEditeur({ ouvrages: ouvrage ? [ouvrage] : [], citations: citation ? [citation] : [] }).then((d) => {
      Object.assign(cache.ouvrages, d.ouvrages);
      Object.assign(cache.citations, d.citations);
      if (!annule) setVersion((v) => v + 1);
    });
    return () => {
      annule = true;
    };
  }, [ouvrage, citation]);
  return cache;
}

export function VueReference({ node, selected }: NodeViewProps) {
  const a = node.attrs as Record<string, string>;
  const sources = useSources(a.ouvrage ?? "", a.citation ?? "");
  const c = a.citation ? sources?.citations[a.citation] : undefined;
  const o = sources?.ouvrages[c?.ouvrage_id ?? a.ouvrage ?? ""];
  const loc = c ? localisation(c.tome, c.page) : localisation(a.tome ?? "", a.page ?? "");
  const court = o ? `${partiesReference(o).auteur || partiesReference(o).titre}${loc ? `, ${loc}` : ""}` : "référence";
  return (
    <NodeViewWrapper as="sup" className="reference-appel reference-editeur" data-selectionne={selected || undefined} title={o ? `${partiesReference(o).titre}${loc ? `, ${loc}` : ""}` : undefined}>
      [{court}]
    </NodeViewWrapper>
  );
}

export function VueCitationOuvrage({ node, selected }: NodeViewProps) {
  const id = String(node.attrs.citation ?? "");
  const sources = useSources("", id);
  const c = sources?.citations[id];
  const o = c ? sources?.ouvrages[c.ouvrage_id] : undefined;
  return (
    <NodeViewWrapper as="figure" className="citation-ouvrage" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false}>
      {c?.texte_original && <blockquote className="citation-originale" dir="auto">{c.texte_original}</blockquote>}
      <blockquote>{c?.texte ?? "Chargement de la citation…"}</blockquote>
      {o && (
        <figcaption>
          {partiesReference(o).auteur && `${partiesReference(o).auteur}, `}
          <cite>{o.titre}</cite>
          {c && localisation(c.tome, c.page) && `, ${localisation(c.tome, c.page)}`}
          <span className="statut-source" data-teinte={statutSource(c?.statut ?? "").teinte}>
            {statutSource(c?.statut ?? "").court}
          </span>
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}
