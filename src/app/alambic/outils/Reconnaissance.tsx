"use client";

import { ScanText } from "lucide-react";
import type { Abonner } from "../reception";
import { EnTeteOutil } from "../commun";

export function Reconnaissance({ abonner }: { abonner: Abonner }) {
  void abonner;
  return (
    <section className="alambic-outil" aria-labelledby="titre-reconnaitre">
      <EnTeteOutil Icone={ScanText} titre="Reconnaître le texte" id="titre-reconnaitre">
        En préparation.
      </EnTeteOutil>
    </section>
  );
}
