"use client";

import { Crown } from "lucide-react";
import { accesDe } from "@/lib/client/premium";
import { useDroits } from "@/lib/client/use-premium";
import { LIBELLES_PERIODE } from "@/lib/premium/catalogue";

/**
 * Une petite marque à côté d'une partie : « Premium » en or si elle est réservée, ou les essais
 * gratuits qui restent (« 2 sur 3 »). Rien si la partie est gratuite, si l'offre est éteinte, ou
 * pour un abonné.
 */
export function MarquePremium({ fonction, compacte = false }: { fonction: string; compacte?: boolean }) {
  const { droits } = useDroits();
  const a = accesDe(droits, fonction);
  if (a.etat === "libre") return null;
  if (a.etat === "premium" || a.etat === "epuise") {
    const aide = a.etat === "premium" ? "Réservé à Premium" : `Essais gratuits utilisés : le compteur repart ${a.remise}`;
    return (
      <span className="marque-premium" title={aide} aria-label={aide} data-epuise={a.etat === "epuise" || undefined}>
        <Crown className="size-3.5" aria-hidden="true" />
        {!compacte && <span aria-hidden="true">Premium</span>}
      </span>
    );
  }
  const periode = LIBELLES_PERIODE[a.periode as keyof typeof LIBELLES_PERIODE]?.par ?? "";
  const aide = `Encore ${a.reste} utilisation${a.reste > 1 ? "s" : ""} gratuite${a.reste > 1 ? "s" : ""} sur ${a.limite} ${periode}`;
  return (
    <span className="marque-essais" title={aide} aria-label={aide}>
      <span aria-hidden="true">
        {a.reste} sur {a.limite}
      </span>
    </span>
  );
}
