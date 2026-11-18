import type { NextRequest } from "next/server";
import { bilan, lireCle } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, repondre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";

/*
 * GET : ce que l'Assistant doit savoir en s'ouvrant — la clé est-elle reliée (sans jamais
 * la renvoyer), quels réglages, et où en est la consommation du mois de CE compte.
 */
export async function GET(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  try {
    const [cle, b] = await Promise.all([lireCle(e.compte.id), bilan(e.compte.id)]);
    return repondre({
      compte: { nom: e.compte.nom, email: e.compte.email },
      cle: cle ? { ...cle.fiche, lisible: cle.cle !== null } : null,
      bilan: b,
      limites: LIMITES,
    });
  } catch (err) {
    return erreurDonnees(err);
  }
}
