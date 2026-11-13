"use client";

import { useEffect } from "react";
import { noterVisite } from "@/lib/client/historique";

/** Ajoute l'article à l'historique de lecture de cet appareil (rien n'est envoyé au serveur). */
export function NoterVisite({ id, titre }: { id: string; titre: string }) {
  useEffect(() => {
    noterVisite({ id, titre });
  }, [id, titre]);
  return null;
}
