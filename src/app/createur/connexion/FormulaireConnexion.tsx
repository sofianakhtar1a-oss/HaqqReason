"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { seConnecter } from "../actions";

export function FormulaireConnexion() {
  const [etat, action] = useActionState(seConnecter, ETAT_INITIAL);
  const [motDePasse, setMotDePasse] = useState("");

  return (
    <form action={action} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Mode créateur</h1>
        <p className="mt-3 text-encre-douce">Saisis ton mot de passe pour modifier la bibliothèque.</p>
      </div>
      {/* Champ d'identifiant masqué : aide les gestionnaires de mots de passe à ranger le bon mot de passe. */}
      <input type="text" name="username" value="createur" autoComplete="username" readOnly hidden />
      <ChampMotDePasse
        nom="motDePasse"
        libelle="Mot de passe créateur"
        valeur={motDePasse}
        onChange={setMotDePasse}
        autoComplete="current-password"
      />
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Vérification…">Se connecter</BoutonEnvoi>
      <p className="text-center">
        <Link href="/createur/recuperation" className="font-semibold text-or underline-offset-4 hover:underline">
          Mot de passe oublié
        </Link>
      </p>
    </form>
  );
}
