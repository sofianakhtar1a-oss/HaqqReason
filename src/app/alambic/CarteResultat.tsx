"use client";

import { ChevronDown, CircleCheck, Download, Eye, EyeOff, Info, Lock, Share2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { accepte } from "@/lib/alambic/outils";
import { Apercu } from "./Apercu";
import { fichierDe, useAlambic } from "./contexte";
import { partager, peutPartager, telecharger } from "./telecharger";

export { telecharger };

export function CarteResultat({ resultat, tailleAvant, protege, children }: { resultat: Resultat; tailleAvant?: number; protege: boolean; children?: React.ReactNode }) {
  const { noter, outils, outil, envoyer } = useAlambic();
  const [apercu, setApercu] = useState(false);
  const [suite, setSuite] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const idSuite = useId();
  const gain = tailleAvant ? Math.round((1 - resultat.blob.size / tailleAvant) * 100) : null;
  const fichier = useMemo(() => fichierDe(resultat), [resultat]);
  const partage = useMemo(() => peutPartager(fichier), [fichier]);
  const suites = outils.filter((o) => o.id !== outil && accepte(o.id, resultat.format, resultat.nom));

  useEffect(() => {
    noter(resultat);
  }, [resultat, noter]);

  useEffect(() => {
    if (!suite) return;
    const fermer = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.current?.contains(e.target as Node)) setSuite(false);
    };
    document.addEventListener("mousedown", fermer);
    document.addEventListener("keydown", fermer);
    return () => {
      document.removeEventListener("mousedown", fermer);
      document.removeEventListener("keydown", fermer);
    };
  }, [suite]);

  return (
    <div className="alambic-resultat" role="status">
      <div className="alambic-resultat-tete">
        <CircleCheck className="size-6 shrink-0 text-succes" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={resultat.nom}>
            {resultat.nom}
          </p>
          <p className="text-sm text-encre-douce">
            {nomDuFormat(resultat.format)}, {tailleLisible(resultat.blob.size)}
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
      <div className="alambic-resultat-suites">
        {partage && (
          <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => void partager(fichier)}>
            <Share2 className="size-4" aria-hidden="true" />
            Partager
          </button>
        )}
        {!protege && (
          <button type="button" className="bouton bouton-discret !min-h-10" aria-expanded={apercu} onClick={() => setApercu((a) => !a)}>
            {apercu ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            {apercu ? "Masquer l'aperçu" : "Aperçu"}
          </button>
        )}
        {suites.length > 0 && (
          <div className="alambic-suite" ref={menu}>
            <button type="button" className="bouton bouton-discret !min-h-10" aria-expanded={suite} aria-controls={idSuite} onClick={() => setSuite((s) => !s)}>
              Continuer avec…
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
            {suite && (
              <div id={idSuite} className="alambic-suite-menu verre" role="group" aria-label="Continuer avec un autre outil">
                {suites.map(({ id, nom, aide, Icone }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSuite(false);
                      envoyer(id, [fichier]);
                    }}
                  >
                    <Icone className="size-5 shrink-0 text-or" strokeWidth={1.5} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-semibold">{nom}</span>
                      {aide && <span className="block text-sm text-encre-douce">{aide}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {apercu && <Apercu key={resultat.nom + resultat.blob.size} blob={resultat.blob} formatId={resultat.format} nom={resultat.nom} />}
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
