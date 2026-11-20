"use client";

import type { Editor } from "@tiptap/core";
import { useMemo, useState } from "react";
import { Fenetre } from "./Fenetre";
import { ciblesDuDocument, FORMES_RENVOI, insererRenvoi } from "./blocs/References";

type Props = { editor: Editor; surFermer: () => void };

/** Choisir la cible d'un renvoi (un titre, une figure, un tableau) et sa forme. */
export function DialogueRenvoi({ editor, surFermer }: Props) {
  const cibles = useMemo(() => ciblesDuDocument(editor.state.doc), [editor]);
  const [forme, setForme] = useState<string>("complet");
  const [filtre, setFiltre] = useState("");
  const q = filtre.trim().toLowerCase();
  const visibles = cibles.filter((c) => !q || `${c.numero} ${c.texte}`.toLowerCase().includes(q));

  return (
    <Fenetre titre="Insérer un renvoi" sousTitre="Il se met à jour seul : numéro de partie, de figure, et page." surFermer={surFermer} largeur={36}>
      <div className="grid gap-3">
        <div className="inspecteur-choix" role="group" aria-label="Forme du renvoi">
          {FORMES_RENVOI.map((f) => (
            <button key={f.cle} type="button" className="puce-module" aria-pressed={forme === f.cle} onClick={() => setForme(f.cle)}>
              {f.libelle}
            </button>
          ))}
        </div>
        <input className="champ" value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Chercher un titre, une figure…" aria-label="Chercher une cible" autoFocus />
        {visibles.length === 0 ? (
          <p className="inspecteur-aide">{cibles.length === 0 ? "Aucun titre ni aucune légende dans ce document pour l'instant." : "Rien ne correspond."}</p>
        ) : (
          <ul className="calame-cibles" role="listbox" aria-label="Cibles du renvoi">
            {visibles.map((c) => (
              <li key={`${c.genre}-${c.pos}`}>
                <button
                  type="button"
                  className="calame-cible"
                  data-genre={c.genre}
                  data-niveau={c.niveau}
                  onClick={() => {
                    insererRenvoi(editor, c, forme);
                    surFermer();
                  }}
                >
                  <span className="calame-cible-genre">{c.genre === "titre" ? (c.numero || "Titre") : `${c.genre === "tableau" ? "Tableau" : "Figure"} ${c.numero}`}</span>
                  <span className="calame-cible-texte">{c.texte || "Sans titre"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Fenetre>
  );
}
