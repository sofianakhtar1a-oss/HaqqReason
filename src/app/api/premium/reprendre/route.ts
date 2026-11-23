import type { NextRequest } from "next/server";
import { changer } from "@/lib/premium/resiliation";

/** Annuler une résiliation avant la fin de la période : l'abonnement continue comme avant. */
export async function POST(requete: NextRequest) {
  return changer(requete, false);
}
