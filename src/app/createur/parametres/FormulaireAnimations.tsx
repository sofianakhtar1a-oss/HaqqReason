"use client";

import { useActionState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { CHOIX, libellePortail, type Reglages } from "@/lib/reglages";
import { enregistrerAnimations } from "./actions";

/** La section « Animations » : la durée de la porte de lumière, pour tous les visiteurs. */
export function FormulaireAnimations({ reglages }: { reglages: Reglages }) {
  const [etat, action] = useActionState(enregistrerAnimations, ETAT_INITIAL);

  return (
    // La clé suit la valeur enregistrée : après l'enregistrement, la liste affiche la nouvelle durée
    // (sans elle, la remise à zéro automatique du formulaire reviendrait à l'ancienne).
    <form key={reglages.portail_duree_ms} action={action} className="space-y-8">
      <div className="reglage">
        <label htmlFor="portail-duree" className="etiquette">
          Durée de la porte de lumière
        </label>
        <select id="portail-duree" name="portail_duree_ms" defaultValue={String(reglages.portail_duree_ms)} className="champ">
          {CHOIX.portail_duree_ms.map((ms) => (
            <option key={ms} value={ms}>
              {libellePortail(ms)}
            </option>
          ))}
        </select>
        <p className="reglage-aide">
          La porte de lumière est le passage animé qui s&apos;affiche quand on entre dans un espace&nbsp;: un disque de lumière s&apos;ouvre, l&apos;astrolabe se trace
          avec le nom de l&apos;espace (par exemple «&nbsp;Apprendre les langues — Le Truchement&nbsp;»), puis s&apos;efface. Elle est la même dans tous les espaces&nbsp;: Le Calame, L&apos;Alambic, Le Truchement, la bibliothèque, l&apos;Islam authentique, l&apos;accueil et le mode créateur, à l&apos;entrée comme à la sortie. Cette durée va du clic jusqu&apos;à ce que la
          page apparaisse&nbsp;; toute l&apos;animation s&apos;y ajuste. «&nbsp;Désactivée&nbsp;» ouvre les espaces sans animation. Le réglage vaut pour tous les visiteurs, au
          prochain chargement d&apos;une page. Si l&apos;appareil d&apos;un visiteur demande de réduire les animations, la porte reste toujours éteinte pour lui.
        </p>
      </div>

      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Enregistrement…">Enregistrer la durée</BoutonEnvoi>
    </form>
  );
}
