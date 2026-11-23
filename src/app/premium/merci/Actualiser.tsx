"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { estAbonne, rechargerDroits } from "@/lib/client/premium";

/** Juste après le paiement : la page se met à jour pour faire apparaître le badge doré partout. */
export function Actualiser({ premium }: { premium: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (premium && !estAbonne()) router.refresh();
    void rechargerDroits(true);
  }, [premium, router]);
  return null;
}
