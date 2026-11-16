"use client";

import { CircleCheck, Download, Info, Lock } from "lucide-react";
import { format, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";

export function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function CarteResultat({ resultat, tailleAvant, protege, children }: { resultat: Resultat; tailleAvant?: number; protege: boolean; children?: React.ReactNode }) {
  const gain = tailleAvant ? Math.round((1 - resultat.blob.size / tailleAvant) * 100) : null;
  return (
    <div className="alambic-resultat" role="status">
      <div className="alambic-resultat-tete">
        <CircleCheck className="size-6 shrink-0 text-succes" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={resultat.nom}>
            {resultat.nom}
          </p>
          <p className="text-sm text-encre-douce">
            {format(resultat.format).nom}, {tailleLisible(resultat.blob.size)}
            {gain !== null && Math.abs(gain) >= 5 && (gain > 0 ? `, ${gain} % plus léger` : `, ${-gain} % plus lourd`)}
            {protege && (
              <span className="ml-2 inline-flex items-center gap-1 text-or">
                <Lock className="size-3.5" aria-hidden="true" />
                protégé
              </span>
            )}
          </p>
        </div>
        <button type="button" className="bouton bouton-principal" onClick={() => telecharger(resultat.blob, resultat.nom)}>
          <Download className="size-4" aria-hidden="true" />
          Télécharger
        </button>
      </div>
      {resultat.avertissements.length > 0 && (
        <ul className="alambic-avertissements">
          {resultat.avertissements.map((a) => (
            <li key={a}>
              <Info className="size-4 shrink-0" aria-hidden="true" />
              {a}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
