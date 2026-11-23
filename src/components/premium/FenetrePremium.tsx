"use client";

import { Check, Crown, LogIn, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type DemandePremium, EVENEMENT_PREMIUM } from "@/lib/client/premium";
import { economieAnnuelle, LIBELLES_PERIODE, PAR_ID, prixLisible, PRIX_ANNEE_DEFAUT, PRIX_MOIS_DEFAUT } from "@/lib/premium/catalogue";

/*
 * La fenêtre Premium : elle s'ouvre quand une partie réservée est touchée, ou quand les essais
 * gratuits de la période sont épuisés. Elle dit pourquoi, quand les essais reviennent, et ce que
 * Premium ouvre. Un seul exemplaire sur la page, posé dans la mise en page générale.
 */

function prixDuSite(): { mois: number; annee: number } {
  const d = typeof document === "undefined" ? undefined : document.documentElement.dataset;
  const mois = Number(d?.prixMois);
  const annee = Number(d?.prixAnnee);
  return { mois: Number.isFinite(mois) && mois > 0 ? mois : PRIX_MOIS_DEFAUT, annee: Number.isFinite(annee) && annee > 0 ? annee : PRIX_ANNEE_DEFAUT };
}

export function FenetrePremium() {
  const boite = useRef<HTMLDialogElement>(null);
  const [demande, setDemande] = useState<DemandePremium | null>(null);

  useEffect(() => {
    const ouvrir = (e: Event) => setDemande((e as CustomEvent<DemandePremium>).detail ?? { raison: "premium" });
    window.addEventListener(EVENEMENT_PREMIUM, ouvrir);
    return () => window.removeEventListener(EVENEMENT_PREMIUM, ouvrir);
  }, []);

  useEffect(() => {
    const d = boite.current;
    if (demande && d && !d.open) d.showModal();
  }, [demande]);

  const fermer = useCallback(() => boite.current?.close(), []);

  const f = demande?.fonction ? PAR_ID.get(demande.fonction) : undefined;
  const prix = prixDuSite();
  const eco = economieAnnuelle({ prixMois: prix.mois, prixAnnee: prix.annee });
  const chemin = typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const versPremium = `/premium${f ? `?depuis=${encodeURIComponent(f.id)}` : ""}`;
  const limite = demande?.limite ?? 0;
  const unite = f ? (limite > 1 ? f.unite.plusieurs : f.unite.un) : "";
  const periode = demande?.periode && demande.periode in LIBELLES_PERIODE ? LIBELLES_PERIODE[demande.periode as keyof typeof LIBELLES_PERIODE].par : "";
  // « 3 dictées par semaine » : dit sans accord à faire, quel que soit le mot.
  const quota = limite > 0 && unite ? `${limite} ${unite}${periode ? ` ${periode}` : ""}` : "";

  let titre = "Réservé à Premium";
  let message = f ? `« ${f.nom} » fait partie de l'accès Premium.` : "Cette partie fait partie de l'accès Premium.";
  if (demande?.raison === "limite") {
    titre = "La version gratuite s'arrête ici";
    message = `${quota ? `Tu as utilisé ce qu'elle offre : ${quota}. ` : ""}${demande.remise ? `Le compteur repart ${demande.remise}. ` : ""}Avec Premium, c'est sans limite.`;
  } else if (demande?.raison === "compte") {
    titre = "Connecte-toi pour continuer";
    message = `C'est gratuit${quota ? ` : avec un compte, tu as droit à ${quota}` : ""}, et ta progression te suit sur tous tes appareils.`;
  }

  return (
    <dialog ref={boite} className="fenetre-premium" aria-labelledby="fenetre-premium-titre" aria-describedby="fenetre-premium-message" onClose={() => setDemande(null)}>
      {demande && (
        <div className="fenetre-premium-corps">
          <button type="button" className="fenetre-premium-fermer" onClick={fermer} aria-label="Fermer">
            <X className="size-5" aria-hidden="true" />
          </button>
          <span className="sceau-premium" aria-hidden="true">
            <Crown className="size-7" />
          </span>
          <h2 id="fenetre-premium-titre" className="fenetre-premium-titre">
            {titre}
          </h2>
          <p id="fenetre-premium-message" className="fenetre-premium-message">
            {message}
          </p>
          {demande.raison !== "compte" && (
            <>
              <p className="fenetre-premium-prix">
                <strong>{prixLisible(prix.mois)}</strong> par mois, ou <strong>{prixLisible(prix.annee)}</strong> par an
                {eco.moisOfferts >= 1 ? ` (${eco.moisOfferts} mois offert${eco.moisOfferts > 1 ? "s" : ""})` : ""}.
              </p>
              <ul className="fenetre-premium-avantages">
                <li>
                  <Check className="size-4" aria-hidden="true" />
                  Toutes les histoires et toutes les dictées, du A1 au C2
                </li>
                <li>
                  <Check className="size-4" aria-hidden="true" />
                  Les outils et les examens, sans limite
                </li>
                <li>
                  <Check className="size-4" aria-hidden="true" />
                  Le badge doré « Accès premium » sur ton compte
                </li>
              </ul>
            </>
          )}
          <div className="fenetre-premium-actions">
            {demande.raison === "compte" ? (
              <a className="bouton bouton-principal" href={`/connexion?retour=${encodeURIComponent(chemin)}`}>
                <LogIn className="size-5" aria-hidden="true" />
                Se connecter avec Google
              </a>
            ) : (
              <a className="bouton bouton-principal bouton-premium" href={versPremium}>
                <Crown className="size-5" aria-hidden="true" />
                Découvrir Premium
              </a>
            )}
            <button type="button" className="bouton bouton-discret" onClick={fermer}>
              Plus tard
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
