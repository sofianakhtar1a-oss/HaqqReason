"use client";

import { useActionState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { CHOIX, libelleDuree, libelleHeures, TAILLE_GRATUITE_MO, type Reglages } from "@/lib/reglages";
import { enregistrerReglages } from "./actions";

export function FormulaireReglages({ reglages }: { reglages: Reglages }) {
  const [etat, action] = useActionState(enregistrerReglages, ETAT_INITIAL);

  return (
    <form action={action} className="space-y-8">
      <div className="reglage">
        <label htmlFor="inactivite" className="etiquette">
          Déconnexion automatique après inactivité
        </label>
        <select id="inactivite" name="inactivite_minutes" defaultValue={String(reglages.inactivite_minutes)} className="champ">
          {CHOIX.inactivite_minutes.map((m) => (
            <option key={m} value={m}>
              {libelleDuree(m)}
            </option>
          ))}
        </select>
        <p className="reglage-aide">
          Sans la moindre action de ta part pendant cette durée, l&apos;espace créateur se ferme et il faut retaper le mot de passe. Une durée courte protège
          mieux un ordinateur partagé ; une durée longue évite de se reconnecter souvent.
        </p>
      </div>

      <div className="reglage">
        <label htmlFor="duree-max" className="etiquette">
          Durée maximale d&apos;une session
        </label>
        <select id="duree-max" name="session_max_heures" defaultValue={String(reglages.session_max_heures)} className="champ">
          {CHOIX.session_max_heures.map((h) => (
            <option key={h} value={h}>
              {libelleHeures(h)}
            </option>
          ))}
        </select>
        <p className="reglage-aide">
          Passé ce délai, la session se ferme même si tu es resté actif. C&apos;est une limite de sécurité : un accès oublié ouvert ne le reste pas
          indéfiniment.
        </p>
      </div>

      <div className="reglage">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="lier_appareil" defaultChecked={reglages.lier_appareil} className="mt-1 size-5 shrink-0 accent-[var(--accent)]" />
          <span>
            <span className="etiquette block">Session liée à cet appareil</span>
            <span className="reglage-aide mt-1 block">
              La session n&apos;est valable que dans le navigateur qui s&apos;est connecté. Même recopié ailleurs, le cookie d&apos;accès ne sert à rien. À
              laisser cochée : c&apos;est la protection la plus efficace contre le vol de session. Conséquence : une mise à jour de ton navigateur peut
              demander une nouvelle connexion.
            </span>
          </span>
        </label>
      </div>

      <div className="reglage">
        <label htmlFor="taille" className="etiquette">
          Taille maximale d&apos;un fichier
        </label>
        <select id="taille" name="taille_max_mo" defaultValue={String(reglages.taille_max_mo)} className="champ">
          {CHOIX.taille_max_mo.map((mo) => (
            <option key={mo} value={mo}>
              {mo} Mo{mo > TAILLE_GRATUITE_MO ? " — forfait Supabase payant requis" : ""}
            </option>
          ))}
        </select>
        <p className="reglage-aide">
          Au-delà de {TAILLE_GRATUITE_MO} Mo par fichier, il faut un forfait Supabase payant et relever la limite dans Supabase (Storage → Settings → Global
          file size limit). Sans cela, l&apos;envoi d&apos;un fichier plus gros sera refusé par le serveur de stockage.
        </p>
      </div>

      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Enregistrement…">Enregistrer les réglages</BoutonEnvoi>
    </form>
  );
}
