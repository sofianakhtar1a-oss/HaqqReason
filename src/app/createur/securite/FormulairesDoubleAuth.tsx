"use client";

import { useActionState, useState } from "react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { activerDoubleAuth, desactiverDoubleAuth, preparerDoubleAuth, type EtatDoubleAuth } from "../actions";

function ChampCode({ id }: { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="etiquette">
        Code à 6 chiffres
      </label>
      <input id={id} name="code" className="champ text-center font-display text-xl tracking-[0.35em]" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required />
    </div>
  );
}

export function ActivationDoubleAuth() {
  const [preparation, preparer] = useActionState<EtatDoubleAuth, FormData>(preparerDoubleAuth, ETAT_INITIAL);
  const [activation, activer] = useActionState(activerDoubleAuth, ETAT_INITIAL);
  const [actuel, setActuel] = useState("");

  if (activation.statut === "succes") return <MessageFormulaire etat={activation} />;

  if (preparation.statut === "succes" && preparation.qr) {
    return (
      <div className="space-y-5">
        <ol className="list-decimal space-y-2 pl-5 text-encre-douce">
          <li>Installe sur ton téléphone une application d&apos;authentification (Google Authenticator, Microsoft Authenticator, Aegis, 2FAS…).</li>
          <li>Dans l&apos;application, ajoute un compte en scannant ce code :</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preparation.qr} alt="QR code à scanner avec l'application d'authentification" width={240} height={240} className="rounded-2xl" />
        <p className="text-sm text-encre-douce">
          Impossible de scanner ? Saisis cette clé à la main : <code className="font-mono text-encre">{preparation.secret}</code>
        </p>
        <form action={activer} className="space-y-4">
          <p className="text-encre-douce">3. Tape le code que l&apos;application affiche maintenant :</p>
          <ChampCode id="code-activation" />
          <MessageFormulaire etat={activation} />
          <BoutonEnvoi enCours="Vérification…">Activer la double authentification</BoutonEnvoi>
        </form>
      </div>
    );
  }

  return (
    <form action={preparer} className="space-y-5">
      <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />
      <MessageFormulaire etat={preparation} />
      <BoutonEnvoi enCours="Préparation…">Activer la double authentification</BoutonEnvoi>
    </form>
  );
}

export function DesactivationDoubleAuth() {
  const [etat, action] = useActionState(desactiverDoubleAuth, ETAT_INITIAL);
  const [actuel, setActuel] = useState("");
  if (etat.statut === "succes") return <MessageFormulaire etat={etat} />;
  return (
    <form action={action} className="space-y-5">
      <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />
      <ChampCode id="code-desactivation" />
      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Vérification…" className="bouton bouton-discret w-full">
        Désactiver
      </BoutonEnvoi>
    </form>
  );
}
