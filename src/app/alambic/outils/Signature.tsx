"use client";

import { Signature as IconeSignature } from "lucide-react";
import type { Abonner } from "../reception";
import { EnTeteOutil } from "../commun";

export function Signature({ abonner }: { abonner: Abonner }) {
  void abonner;
  return (
    <section className="alambic-outil" aria-labelledby="titre-signer">
      <EnTeteOutil Icone={IconeSignature} titre="Signer et remplir" id="titre-signer">
        En préparation.
      </EnTeteOutil>
    </section>
  );
}
