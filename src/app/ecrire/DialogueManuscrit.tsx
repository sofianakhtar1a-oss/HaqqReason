"use client";

import { ArrowDown, ArrowUp, BookCopy, X } from "lucide-react";
import { useState } from "react";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { OPTIONS_MANUSCRIT, type OptionsManuscrit } from "@/lib/atelier/manuscrit";
import { Fenetre } from "./Fenetre";

type Props = {
  documents: DocumentAtelier[];
  ids: string[];
  surFermer: () => void;
  surCreer: (ordre: string[], options: OptionsManuscrit) => void;
};

/**
 * Le manuscrit en chapitres : les documents choisis, remis dans l'ordre, deviennent un seul document
 * (chaque document un chapitre) qui s'exporte d'un seul tenant depuis l'onglet « Sortie ».
 */
export function DialogueManuscrit({ documents, ids, surFermer, surCreer }: Props) {
  const [ordre, setOrdre] = useState(() => ids.filter((id) => documents.some((d) => d.id === id)));
  const premier = documents.find((d) => d.id === ids[0]);
  const [titre, setTitre] = useState(() => (premier?.dossier ? premier.dossier.split("/").pop() ?? "" : "") || "Manuscrit");
  const [options, setOptions] = useState(OPTIONS_MANUSCRIT);

  const deplacer = (i: number, sens: -1 | 1) =>
    setOrdre((o) => {
      const j = i + sens;
      if (j < 0 || j >= o.length) return o;
      const suite = [...o];
      [suite[i], suite[j]] = [suite[j], suite[i]];
      return suite;
    });

  const bascule = (cle: keyof typeof OPTIONS_MANUSCRIT, libelle: string) => (
    <label className="inspecteur-bascule" key={cle}>
      <input type="checkbox" checked={options[cle]} onChange={(e) => setOptions((o) => ({ ...o, [cle]: e.target.checked }))} disabled={cle === "decalerTitres" && !options.titresDeChapitre} />
      <span>{libelle}</span>
    </label>
  );

  return (
    <Fenetre
      titre="Manuscrit en chapitres"
      sousTitre="Les documents choisis, dans cet ordre, deviennent un seul document : chacun un chapitre. Les originaux ne changent pas."
      surFermer={surFermer}
      largeur={36}
      pied={
        <button type="button" className="bouton bouton-principal" disabled={ordre.length < 2 || !titre.trim()} onClick={() => surCreer(ordre, { ...options, titre })}>
          <BookCopy className="size-4" aria-hidden="true" />
          Assembler {ordre.length} chapitres
        </button>
      }
    >
      <div className="grid gap-3">
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Titre du manuscrit</span>
          <input className="champ" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} autoFocus />
        </label>
        <ol className="calame-manuscrit-ordre" aria-label="Ordre des chapitres">
          {ordre.map((id, i) => {
            const d = documents.find((x) => x.id === id);
            return (
              <li key={id}>
                <span className="calame-manuscrit-numero" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="calame-manuscrit-titre">{d?.titre || "Sans titre"}</span>
                <span className="calame-manuscrit-mots">{(d?.mots ?? 0).toLocaleString("fr-FR")} mots</span>
                <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label={`Monter « ${d?.titre || "Sans titre"} »`}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => deplacer(i, 1)} disabled={i === ordre.length - 1} aria-label={`Descendre « ${d?.titre || "Sans titre"} »`}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setOrdre((o) => o.filter((x) => x !== id))} aria-label={`Retirer « ${d?.titre || "Sans titre"} » du manuscrit`}>
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
        {ordre.length < 2 && <p className="inspecteur-aide">Il faut au moins deux documents : choisis-en d&apos;autres dans la liste.</p>}
        {bascule("titresDeChapitre", "Le titre de chaque document devient le titre du chapitre")}
        {bascule("decalerTitres", "Ses parties descendent d'un niveau, sous le titre du chapitre")}
        {bascule("nouvellePage", "Chaque chapitre commence sur une nouvelle page")}
        {bascule("tablesUniques", "Une seule table des matières, bibliographie, index et glossaire pour tout le manuscrit")}
        <p className="inspecteur-aide">La mise en page est celle du premier chapitre. Le manuscrit s&apos;exporte ensuite d&apos;un seul tenant : PDF, Word, EPUB, page web (onglet « Sortie »).</p>
      </div>
    </Fenetre>
  );
}
