"use client";

import { createContext, type ReactNode, useCallback, useContext } from "react";
import { MODULES, type ModuleId, remplir, type Resolu } from "./modules";

/* Les textes d'un module, choisis par le créateur, accessibles à tous les composants de l'espace. */

const Contexte = createContext<{ id: ModuleId; resolu: Resolu } | null>(null);

export function TextesModule({ id, resolu, children }: { id: ModuleId; resolu: Resolu; children: ReactNode }) {
  return <Contexte.Provider value={{ id, resolu }}>{children}</Contexte.Provider>;
}

/** t("cle", { n: 3 }) : le texte publié, ou la valeur d'origine. */
export function useTextes(id: ModuleId) {
  const c = useContext(Contexte);
  return useCallback(
    (cle: string, vars?: Record<string, string | number>) => {
      const v = c?.id === id ? c.resolu.textes[cle] : undefined;
      const defaut = MODULES[id].sections.flatMap((s) => s.champs).find((ch) => ch.cle === cle)?.defaut ?? cle;
      return remplir(v ?? defaut, vars);
    },
    [c, id],
  );
}

export function useResolu(id: ModuleId): Resolu | null {
  const c = useContext(Contexte);
  return c?.id === id ? c.resolu : null;
}

/** Bandeau visible seulement par le créateur quand il regarde son brouillon. */
export function BandeauApercu({ id }: { id: ModuleId }) {
  return (
    <div className="bandeau-apercu" role="status">
      Aperçu du brouillon de « {MODULES[id].nom} » : les visiteurs ne voient pas encore ces changements.
      <a href={`/createur/module/${id}`}>Revenir à l&apos;éditeur</a>
    </div>
  );
}
