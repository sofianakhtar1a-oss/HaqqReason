"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { CleRecuperation } from "@/components/CleRecuperation";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { recuperer } from "../actions";

/** Met la saisie en forme au fil de la frappe : XXXX-XXXX-XXXX-XXXX-XXXX */
function mettreEnForme(saisie: string): string {
  const brute = saisie.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  return brute.match(/.{1,4}/g)?.join("-") ?? "";
}

export function FormulaireRecuperation() {
  const [etat, action] = useActionState(recuperer, ETAT_INITIAL);
  const [cle, setCle] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  if (etat.statut === "succes" && etat.cle) {
    return (
      <>
        <p role="status" className="message message-succes mb-6">
          Mot de passe changé. Ton ancienne clé ne fonctionne plus : voici la nouvelle.
        </p>
        <CleRecuperation cle={etat.cle} suite="/createur" />
      </>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
        <p className="mt-3 text-encre-douce">
          Saisis ta clé de récupération (5 groupes de 4 caractères), puis choisis un nouveau mot de passe.
        </p>
      </div>
      <div>
        <label htmlFor="cle" className="etiquette">
          Clé de récupération
        </label>
        <input
          id="cle"
          name="cle"
          className="champ tracking-[0.12em]"
          value={cle}
          onChange={(e) => setCle(mettreEnForme(e.target.value))}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
      </div>
      <ChampMotDePasse
        nom="motDePasse"
        libelle="Nouveau mot de passe"
        valeur={motDePasse}
        onChange={setMotDePasse}
        autoComplete="new-password"
        jauge
        aide="12 caractères minimum."
      />
      <ChampMotDePasse
        nom="confirmation"
        libelle="Confirme le nouveau mot de passe"
        valeur={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
      />
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Vérification…">Définir le nouveau mot de passe</BoutonEnvoi>
      <p className="text-center">
        <Link href="/createur/connexion" className="font-semibold text-or underline-offset-4 hover:underline">
          Revenir à la connexion
        </Link>
      </p>
    </form>
  );
}
