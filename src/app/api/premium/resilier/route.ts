import type { NextRequest } from "next/server";
import { changer } from "@/lib/premium/resiliation";

/** Résilier : l'accès reste jusqu'à la fin de la période déjà payée, puis plus rien n'est prélevé. */
export async function POST(requete: NextRequest) {
  return changer(requete, true);
}
