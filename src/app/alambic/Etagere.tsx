"use client";

/*
 * « Tes résultats » : les fichiers produits pendant la visite, à retélécharger ou à passer à un autre
 * outil sans tout refaire. Rien n'est enregistré : fermer la page les efface.
 */
import { Download, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { familleDuFormat, nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { accepte, type Outil } from "@/lib/alambic/outils";
import { fichierDe, useAlambic } from "./contexte";
import { ICONES } from "./SelecteurFormat";
import { telecharger } from "./telecharger";

export type Rangement = { cle: number; resultat: Resultat };

export function Etagere({ elements, onRetirer, onVider }: { elements: Rangement[]; onRetirer: (cle: number) => void; onVider: () => void }) {
  const { outils, outil, envoyer } = useAlambic();
  const [zip, setZip] = useState(false);
  if (!elements.length) return null;
  const total = elements.reduce((s, e) => s + e.resultat.blob.size, 0);

  return (
    <section className="alambic-carte verre alambic-etagere" aria-labelledby="titre-etagere">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="titre-etagere" className="font-display text-lg font-bold">
          Tes résultats
        </h2>
        <button type="button" className="text-sm text-encre-douce underline-offset-2 hover:underline" onClick={onVider}>
          Tout effacer
        </button>
      </div>
      <p className="text-sm text-encre-douce">Gardés le temps de la visite : fermer la page les efface.</p>
      <ul className="alambic-etagere-liste">
        {elements.map(({ cle, resultat }) => {
          const Icone = ICONES[familleDuFormat(resultat.format)];
          const suites = outils.filter((o) => o.id !== outil && accepte(o.id, resultat.format, resultat.nom)).slice(0, 4);
          return (
            <li key={cle}>
              <Icone className="size-4 shrink-0 text-or" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" title={resultat.nom}>
                  {resultat.nom}
                </span>
                <span className="block text-xs text-encre-douce">
                  {nomDuFormat(resultat.format)}, {tailleLisible(resultat.blob.size)}
                </span>
                {suites.length > 0 && (
                  <span className="alambic-etagere-suites">
                    {suites.map((o) => (
                      <button key={o.id} type="button" onClick={() => envoyer(o.id as Outil, [fichierDe(resultat)])} title={`Continuer avec « ${o.nom} »`}>
                        {o.nom}
                      </button>
                    ))}
                  </span>
                )}
              </span>
              <button type="button" className="bouton-icone !size-9" onClick={() => telecharger(resultat.blob, resultat.nom)} aria-label={`Télécharger ${resultat.nom}`} title="Télécharger">
                <Download className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="bouton-icone !size-9" onClick={() => onRetirer(cle)} aria-label={`Retirer ${resultat.nom} de la liste`} title="Retirer de la liste">
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {elements.length > 1 && (
        <button
          type="button"
          className="bouton bouton-discret !min-h-10 w-full"
          disabled={zip}
          onClick={async () => {
            setZip(true);
            try {
              const { ecrireArchive } = await import("@/lib/alambic/navigateur/archives");
              const noms = new Set<string>();
              const fichiers = elements.map(({ resultat: r }) => {
                let nom = r.nom;
                for (let k = 2; noms.has(nom); k++) nom = r.nom.replace(/(\.[^.]+)?$/, ` (${k})$1`);
                noms.add(nom);
                return { nom, blob: r.blob };
              });
              telecharger(await ecrireArchive(fichiers, "zip", () => {}), "Résultats de L'Alambic.zip");
            } finally {
              setZip(false);
            }
          }}
        >
          {zip ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
          Tout télécharger ({tailleLisible(total)})
        </button>
      )}
    </section>
  );
}
