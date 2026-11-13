"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Plus } from "lucide-react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/form-state";

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  champsCaches: Record<string, string>;
  libelle: string;
  bouton: string;
  exemple: string;
  children?: React.ReactNode;
};

/** Petit formulaire « un titre + un bouton » pour créer une catégorie ou un article. */
export function FormulaireCreation({ action, champsCaches, libelle, bouton, exemple, children }: Props) {
  const [etat, envoyer] = useActionState(action, ETAT_INITIAL);
  const id = useId();
  const formulaire = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (etat.statut === "succes") formulaire.current?.reset();
  }, [etat]);

  return (
    <form ref={formulaire} action={envoyer} className="space-y-3">
      {Object.entries(champsCaches).map(([nom, valeur]) => (
        <input key={nom} type="hidden" name={nom} value={valeur} />
      ))}
      <label htmlFor={id} className="etiquette">
        {libelle}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id={id} name="titre" className="champ" placeholder={exemple} required maxLength={300} autoComplete="off" />
        <BoutonEnvoi enCours="Création…" className="bouton bouton-principal shrink-0">
          <Plus className="size-5" aria-hidden="true" />
          {bouton}
        </BoutonEnvoi>
      </div>
      {children}
      <MessageFormulaire etat={etat} />
    </form>
  );
}
