"use client";

/*
 * L'Écorché — charger les fiches : un fichier par couche, téléchargé la première fois qu'on en a besoin
 * (ouvrir la fiche d'un muscle, lancer un quiz sur les fonctions) puis gardé en mémoire.
 */
import { useEffect, useState } from "react";
import { PAR_ID } from "../catalogue";
import bilanJson from "./bilan.json";
import type { CoucheAFiches, FichesDe, Recueil, Source } from "./types";

const CHARGEURS: Record<CoucheAFiches, () => Promise<unknown>> = {
  muscle: () => import("./muscle.json").then((m) => m.default),
  artere: () => import("./artere.json").then((m) => m.default),
  os: () => import("./os.json").then((m) => m.default),
  tendon: () => import("./tendon.json").then((m) => m.default),
};
export const COUCHES_A_FICHES = Object.keys(CHARGEURS) as CoucheAFiches[];
export const aDesFiches = (couche: string): couche is CoucheAFiches => couche in CHARGEURS;
/** Le nombre de fiches rédigées et le nombre de structures, par couche. */
export const BILAN_FICHES = bilanJson as unknown as Record<string, [number, number]>;

const recueils = new Map<CoucheAFiches, Recueil>();
const enCours = new Map<CoucheAFiches, Promise<Recueil>>();

export function chargerFiches<C extends CoucheAFiches>(couche: C): Promise<Recueil<C>> {
  const pret = recueils.get(couche);
  if (pret) return Promise.resolve(pret as Recueil<C>);
  let p = enCours.get(couche);
  if (!p) {
    p = CHARGEURS[couche]().then((r) => {
      recueils.set(couche, r as Recueil);
      enCours.delete(couche);
      return r as Recueil;
    });
    // Un réseau qui manque : on réessaiera à la prochaine demande.
    p.catch(() => enCours.delete(couche));
    enCours.set(couche, p);
  }
  return p as Promise<Recueil<C>>;
}

/** Le recueil d'une couche s'il est déjà là (sinon undefined : le demander avec chargerFiches). */
export const recueilPret = <C extends CoucheAFiches>(couche: C) => recueils.get(couche) as Recueil<C> | undefined;

export type FicheChargee<C extends CoucheAFiches = CoucheAFiches> = { couche: C; fiche: FichesDe[C]; sources: Source[] };

function trouver(id: string): FicheChargee | null {
  const couche = PAR_ID.get(id)?.couche;
  if (!couche || !aDesFiches(couche)) return null;
  const r = recueils.get(couche);
  const fiche = r?.fiches[id];
  if (!r || !fiche) return null;
  return { couche, fiche, sources: fiche.sources.map((c) => r.sources[c]).filter(Boolean) };
}

/**
 * La fiche d'une structure : null tant qu'elle charge ou s'il n'y en a pas, et `prete` dit lequel des deux.
 */
export function useFiche(id: string | null | undefined): { fiche: FicheChargee | null; prete: boolean } {
  const couche = id ? PAR_ID.get(id)?.couche : undefined;
  const utile = Boolean(id && couche && aDesFiches(couche));
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!utile || !couche || !aDesFiches(couche) || recueils.has(couche)) return;
    let vivant = true;
    chargerFiches(couche).then(
      () => vivant && setVersion((v) => v + 1),
      () => undefined,
    );
    return () => {
      vivant = false;
    };
  }, [couche, utile]);
  void version;
  if (!utile || !id || !couche || !aDesFiches(couche)) return { fiche: null, prete: true };
  return { fiche: trouver(id), prete: recueils.has(couche) };
}
