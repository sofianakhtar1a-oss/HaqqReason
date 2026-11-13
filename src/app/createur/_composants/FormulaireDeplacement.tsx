"use client";

import { useActionState, useId } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/form-state";

export type GroupeDestinations = {
  groupe: string;
  options: { valeur: string; libelle: string; desactive?: boolean }[];
};

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  id: string;
  groupes: GroupeDestinations[];
  aide: string;
};

/** Choix d'une nouvelle place dans l'arborescence (liste déroulante groupée par bloc). */
export function FormulaireDeplacement({ action, id, groupes, aide }: Props) {
  const [etat, envoyer] = useActionState(action, ETAT_INITIAL);
  const champ = useId();

  return (
    <form action={envoyer} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={champ} className="etiquette">
          Nouvelle place
        </label>
        <select id={champ} name="destination" className="champ" required defaultValue="" aria-describedby={`${champ}-aide`}>
          <option value="" disabled>
            Choisir…
          </option>
          {groupes.map((g) => (
            <optgroup key={g.groupe} label={g.groupe}>
              {g.options.map((o) => (
                <option key={o.valeur} value={o.valeur} disabled={o.desactive}>
                  {o.libelle}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p id={`${champ}-aide`} className="aide mt-1.5">
          {aide}
        </p>
      </div>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Déplacement…" className="bouton bouton-principal">
        Déplacer
      </BoutonEnvoi>
    </form>
  );
}
