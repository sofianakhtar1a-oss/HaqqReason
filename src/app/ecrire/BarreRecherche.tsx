"use client";

import type { Editor } from "@tiptap/core";
import { ChevronDown, ChevronUp, Replace, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { OptionsRecherche } from "@/lib/atelier/recherche-texte";
import { allerA, effacerRecherche, etatRecherche, lancerRecherche, remplacerActif, remplacerTout } from "./extensions/recherche";

type Props = {
  editor: Editor;
  avecRemplacement: boolean;
  requeteInitiale?: string;
  surFermer: () => void;
};

/** La barre « Rechercher et remplacer » (Ctrl+F, Ctrl+H), posée en haut de la page. */
export function BarreRecherche({ editor, avecRemplacement, requeteInitiale = "", surFermer }: Props) {
  const [requete, setRequete] = useState(requeteInitiale);
  const [remplacement, setRemplacement] = useState("");
  const [remplacer, setRemplacer] = useState(avecRemplacement);
  const [options, setOptions] = useState<OptionsRecherche>({ casse: false, accents: false, motEntier: false });
  const [annonce, setAnnonce] = useState("");
  const champ = useRef<HTMLInputElement>(null);

  // L'état de la recherche vit dans l'éditeur : on s'y abonne pour suivre le compte.
  const r = useSyncExternalStore(
    (f) => {
      editor.on("transaction", f);
      return () => {
        editor.off("transaction", f);
      };
    },
    () => etatRecherche(editor),
    () => etatRecherche(null),
  );

  // Ctrl+H pendant que la barre est ouverte : le remplacement s'affiche.
  const [demandeVue, setDemandeVue] = useState(avecRemplacement);
  if (avecRemplacement !== demandeVue) {
    setDemandeVue(avecRemplacement);
    setRemplacer(avecRemplacement);
  }

  useEffect(() => {
    champ.current?.focus();
    champ.current?.select();
  }, []);

  useEffect(() => {
    const minuteur = setTimeout(() => lancerRecherche(editor, requete, options), 120);
    return () => clearTimeout(minuteur);
  }, [editor, requete, options]);

  useEffect(() => () => effacerRecherche(editor), [editor]);

  const total = r.trouvailles.length;
  const position = total > 0 ? `${r.actif + 1} sur ${total.toLocaleString("fr-FR")}` : requete ? "Aucun résultat" : "";

  const fermer = () => {
    effacerRecherche(editor);
    surFermer();
    editor.commands.focus();
  };

  const bascule = (cle: keyof OptionsRecherche, libelle: string, texte: string) => (
    <button type="button" className="calame-recherche-option" aria-pressed={options[cle]} title={libelle} onClick={() => setOptions((o) => ({ ...o, [cle]: !o[cle] }))}>
      {texte}
      <span className="sr-only">{libelle}</span>
    </button>
  );

  return (
    <div className="calame-recherche sans-impression" role="search" aria-label="Rechercher dans le document">
      <div className="calame-recherche-ligne">
        <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
        <input
          ref={champ}
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              allerA(editor, e.shiftKey ? -1 : 1);
            } else if (e.key === "Escape") {
              e.preventDefault();
              fermer();
            }
          }}
          placeholder="Rechercher dans le document"
          aria-label="Texte à rechercher"
          className="calame-recherche-champ"
        />
        <span className="calame-recherche-compte" aria-live="polite">
          {position}
        </span>
        {bascule("casse", "Respecter les majuscules", "Aa")}
        {bascule("accents", "Respecter les accents", "é")}
        {bascule("motEntier", "Mots entiers seulement", "«»")}
        <button type="button" className="calame-icone" onClick={() => allerA(editor, -1)} disabled={total === 0} title="Précédent (Maj+Entrée)">
          <ChevronUp className="size-4" aria-hidden="true" />
          <span className="sr-only">Résultat précédent</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => allerA(editor, 1)} disabled={total === 0} title="Suivant (Entrée)">
          <ChevronDown className="size-4" aria-hidden="true" />
          <span className="sr-only">Résultat suivant</span>
        </button>
        <button type="button" className="calame-icone" aria-pressed={remplacer} onClick={() => setRemplacer((x) => !x)} title="Remplacer (Ctrl+H)">
          <Replace className="size-4" aria-hidden="true" />
          <span className="sr-only">Afficher le remplacement</span>
        </button>
        <button type="button" className="calame-icone" onClick={fermer} title="Fermer (Échap)">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Fermer la recherche</span>
        </button>
      </div>
      {remplacer && (
        <div className="calame-recherche-ligne">
          <Replace className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
          <input
            value={remplacement}
            onChange={(e) => setRemplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                remplacerActif(editor, remplacement);
              } else if (e.key === "Escape") {
                e.preventDefault();
                fermer();
              }
            }}
            placeholder="Remplacer par"
            aria-label="Texte de remplacement"
            className="calame-recherche-champ"
          />
          <button type="button" className="bouton bouton-discret bouton-petit" disabled={total === 0} onClick={() => remplacerActif(editor, remplacement)}>
            Remplacer
          </button>
          <button
            type="button"
            className="bouton bouton-discret bouton-petit"
            disabled={total === 0}
            onClick={() => {
              const n = remplacerTout(editor, remplacement);
              setAnnonce(`${n.toLocaleString("fr-FR")} remplacement${n > 1 ? "s" : ""}. Ctrl+Z pour annuler.`);
            }}
          >
            Tout remplacer
          </button>
        </div>
      )}
      {annonce && (
        <p className="calame-recherche-annonce" role="status">
          {annonce}
        </p>
      )}
    </div>
  );
}
