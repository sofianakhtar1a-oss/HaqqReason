"use client";

import { useActionState, useState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { CleRecuperation } from "@/components/CleRecuperation";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { changerMotDePasse, effacerToutLeContenu, regenererCle } from "../actions";

export function FormulaireMotDePasse() {
  const [etat, action] = useActionState(changerMotDePasse, ETAT_INITIAL);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={action} className="space-y-5">
      <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />
      <ChampMotDePasse nom="motDePasse" libelle="Nouveau mot de passe" valeur={nouveau} onChange={setNouveau} autoComplete="new-password" jauge aide="12 caractères minimum." />
      <ChampMotDePasse nom="confirmation" libelle="Confirme le nouveau mot de passe" valeur={confirmation} onChange={setConfirmation} autoComplete="new-password" />
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Enregistrement…">Changer le mot de passe</BoutonEnvoi>
    </form>
  );
}

export function FormulaireNouvelleCle() {
  const [etat, action] = useActionState(regenererCle, ETAT_INITIAL);
  const [actuel, setActuel] = useState("");

  if (etat.statut === "succes" && etat.cle) {
    return (
      <>
        <p role="status" className="message message-succes mb-6">
          Nouvelle clé créée. L&apos;ancienne ne fonctionne plus.
        </p>
        <CleRecuperation cle={etat.cle} suite="/createur" />
      </>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Création…" className="bouton bouton-discret w-full">
        Créer une nouvelle clé
      </BoutonEnvoi>
    </form>
  );
}

export function FormulaireEffacement() {
  const [etat, action] = useActionState(effacerToutLeContenu, ETAT_INITIAL);
  const [actuel, setActuel] = useState("");
  if (etat.statut === "succes") return <MessageFormulaire etat={etat} />;
  return (
    <form action={action} className="space-y-5">
      <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />
      <div>
        <label htmlFor="phrase-effacement" className="etiquette">
          Recopie : TOUT EFFACER
        </label>
        <input id="phrase-effacement" name="phrase" className="champ" autoComplete="off" required />
      </div>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Effacement…" className="bouton bouton-danger w-full">
        Effacer tout le contenu
      </BoutonEnvoi>
    </form>
  );
}
