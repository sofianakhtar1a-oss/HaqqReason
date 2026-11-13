"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import { CleRecuperation } from "@/components/CleRecuperation";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { ETAT_INITIAL } from "@/lib/form-state";
import { configurer } from "../actions";

export function FormulaireConfiguration({ dejaConfigure }: { dejaConfigure: boolean }) {
  const [etat, action] = useActionState(configurer, ETAT_INITIAL);
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");

  if (etat.statut === "succes" && etat.cle) {
    return <CleRecuperation cle={etat.cle} suite="/createur" />;
  }

  if (dejaConfigure) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Ton accès créateur existe déjà</h1>
        <p className="mt-3 text-encre-douce">La configuration initiale est terminée.</p>
        <Link href="/createur" className="bouton bouton-principal mt-6 w-full">
          Ouvrir mon espace
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Créer ton accès créateur</h1>
        <p className="mt-3 text-encre-douce">
          Cette étape n&apos;a lieu qu&apos;une fois. Elle fait de toi le seul et unique créateur de HaqqReason.
        </p>
      </div>

      <div>
        <label htmlFor="code" className="etiquette">
          Code d&apos;installation
        </label>
        <input
          id="code"
          name="code"
          className="champ"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          required
          aria-describedby="code-aide"
        />
        <p id="code-aide" className="aide mt-2">
          C&apos;est la valeur de SETUP_TOKEN que tu as choisie dans les réglages du serveur. Elle prouve que c&apos;est
          bien toi qui installes l&apos;application.
        </p>
      </div>

      <ChampMotDePasse
        nom="motDePasse"
        libelle="Mot de passe créateur"
        valeur={motDePasse}
        onChange={setMotDePasse}
        autoComplete="new-password"
        jauge
        aide="12 caractères minimum. Une phrase de plusieurs mots est idéale."
      />
      <ChampMotDePasse
        nom="confirmation"
        libelle="Confirme le mot de passe"
        valeur={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
      />

      <MessageFormulaire etat={etat} />
      <BoutonEnvoi enCours="Création en cours…">Créer mon accès</BoutonEnvoi>
    </form>
  );
}
