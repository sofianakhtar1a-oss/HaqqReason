"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { verifierCodeConnexion } from "../../actions";

export function FormulaireCode() {
  const [etat, action] = useActionState(verifierCodeConnexion, ETAT_INITIAL);
  return (
    <form action={action} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Code de vérification</h1>
        <p className="mt-3 text-encre-douce">Ouvre ton application d&apos;authentification et tape le code à 6 chiffres affiché pour HaqqReason.</p>
      </div>
      <div>
        <label htmlFor="code" className="etiquette">
          Code à 6 chiffres
        </label>
        <input id="code" name="code" className="champ text-center font-display text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
      </div>
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Vérification…">Valider</BoutonEnvoi>
      <p className="text-center text-sm text-encre-douce">
        Téléphone perdu ?{" "}
        <Link href="/createur/recuperation" className="font-semibold text-or underline-offset-4 hover:underline">
          Utilise ta clé de récupération
        </Link>{" "}
        : elle désactive la double authentification.
      </p>
    </form>
  );
}
