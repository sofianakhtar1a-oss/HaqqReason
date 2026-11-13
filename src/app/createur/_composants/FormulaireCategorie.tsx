"use client";

import { useActionState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { IconeCategorie } from "@/components/IconeCategorie";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { ICONES_CATEGORIE } from "@/lib/icones";
import { LIMITES } from "@/lib/validation";
import { modifierCategorie } from "../contenu-actions";

type Props = { id: string; titre: string; description: string; icone: string };

export function FormulaireCategorie({ id, titre, description, icone }: Props) {
  const [etat, envoyer] = useActionState(modifierCategorie, ETAT_INITIAL);

  return (
    <form action={envoyer} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="cat-titre" className="etiquette">
          Titre
        </label>
        <input id="cat-titre" name="titre" className="champ" defaultValue={titre} required maxLength={LIMITES.titreCategorie} />
      </div>
      <div>
        <label htmlFor="cat-description" className="etiquette">
          Description
        </label>
        <textarea
          id="cat-description"
          name="description"
          className="champ min-h-24"
          defaultValue={description}
          maxLength={LIMITES.descriptionCategorie}
          aria-describedby="cat-description-aide"
        />
        <p id="cat-description-aide" className="aide mt-1.5">
          Une ou deux phrases, affichées sur le dossier.
        </p>
      </div>
      <fieldset>
        <legend className="etiquette">Icône</legend>
        <div className="flex flex-wrap gap-2">
          {ICONES_CATEGORIE.map((choix) => (
            <label key={choix.cle} className="choix-icone relative" title={choix.libelle}>
              <input type="radio" name="icone" value={choix.cle} defaultChecked={choix.cle === icone} aria-label={choix.libelle} />
              <span>
                <IconeCategorie icone={choix.cle} className="size-5" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Enregistrement…" className="bouton bouton-principal">
        Enregistrer
      </BoutonEnvoi>
    </form>
  );
}
