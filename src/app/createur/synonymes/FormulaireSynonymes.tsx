"use client";

import { useActionState, useEffect, useRef } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { ajouterSynonymes } from "./actions";

export function FormulaireSynonymes() {
  const [etat, envoyer] = useActionState(ajouterSynonymes, ETAT_INITIAL);
  const formulaire = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (etat.statut === "succes") formulaire.current?.reset();
  }, [etat]);
  return (
    <form ref={formulaire} action={envoyer} className="space-y-3">
      <label htmlFor="termes" className="etiquette">
        Nouveau groupe de synonymes
      </label>
      <input id="termes" name="termes" className="champ" placeholder="Par exemple : Trinité, trinitaire, trois personnes" required />
      <p className="aide text-sm">Sépare les termes par des virgules. Chercher l&apos;un d&apos;eux trouvera aussi les autres.</p>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Enregistrement…" className="bouton bouton-principal">
        Ajouter le groupe
      </BoutonEnvoi>
    </form>
  );
}
