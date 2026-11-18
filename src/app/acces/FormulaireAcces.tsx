"use client";

import { useActionState, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { entrerDansLesModules } from "./actions";

export function FormulaireAcces({ retour }: { retour: string }) {
  const [etat, action] = useActionState(entrerDansLesModules, ETAT_INITIAL);
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="retour" value={retour} />
      <div>
        <label htmlFor={id} className="etiquette">
          Mot de passe des modules
        </label>
        <div className="relative">
          <input
            id={id}
            name="motDePasse"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={200}
            className="champ pr-14"
            autoFocus
          />
          <button
            type="button"
            className="bouton-icone absolute right-1.5 top-1/2 -translate-y-1/2"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Vérification…">Entrer</BoutonEnvoi>
    </form>
  );
}
