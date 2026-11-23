"use client";

import { Check, Crown, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

type Props = {
  connecte: boolean;
  prixMois: string;
  prixAnnee: string;
  gainAnnee: string | null;
  essaiJours: number;
};

const MESSAGES: Record<string, string> = {
  consentement: "Coche les deux cases pour continuer.",
  deconnecte: "Ta session a expiré : reconnecte-toi, puis recommence.",
  fermee: "L'offre Premium n'est pas ouverte pour l'instant.",
  trop: "Beaucoup d'essais d'un coup : patiente quelques minutes, puis recommence.",
  indisponible: "Le site ne répond pas pour l'instant. Réessaie dans un moment.",
};

/** Choisir sa formule, cocher les deux cases, puis partir vers la page de paiement sécurisée de Stripe. */
export function FormulairePremium({ connecte, prixMois, prixAnnee, gainAnnee, essaiJours }: Props) {
  const [formule, setFormule] = useState<"mois" | "annee">("annee");
  const [cgv, setCgv] = useState(false);
  const [renonciation, setRenonciation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const id = useId();

  const payer = async () => {
    if (!cgv || !renonciation) {
      setErreur(MESSAGES.consentement);
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch("/api/premium/paiement", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formule, cgv, renonciation }),
      });
      const v = (await r.json().catch(() => ({}))) as { url?: string; erreur?: string; message?: string };
      if (r.ok && v.url && /^https:\/\/(checkout|billing)\.stripe\.com\//.test(v.url)) {
        // La page de paiement de Stripe : le numéro de carte est saisi là-bas, jamais ici.
        window.location.assign(v.url);
        return;
      }
      setErreur(v.message ?? MESSAGES[v.erreur ?? ""] ?? "Le paiement n'a pas pu s'ouvrir. Réessaie dans un moment.");
    } catch {
      setErreur("Pas de connexion : vérifie ton réseau, puis recommence.");
    }
    setEnvoi(false);
  };

  return (
    <div>
      <fieldset className="premium-offres">
        <legend className="sr-only">Choisis ta formule</legend>
        <label className="offre-premium">
          <input type="radio" name={`${id}-formule`} value="mois" checked={formule === "mois"} onChange={() => setFormule("mois")} />
          <span className="offre-premium-nom">Au mois</span>
          <span className="offre-premium-prix">
            {prixMois} <small>par mois</small>
          </span>
          <span className="offre-premium-detail">Sans engagement : tu arrêtes quand tu veux.</span>
          <span className="offre-premium-coche" aria-hidden="true">
            <Check className="size-4" />
          </span>
        </label>
        <label className="offre-premium">
          <input type="radio" name={`${id}-formule`} value="annee" checked={formule === "annee"} onChange={() => setFormule("annee")} />
          {gainAnnee && <span className="marque-premium offre-premium-gain">{gainAnnee}</span>}
          <span className="offre-premium-nom">À l&apos;année</span>
          <span className="offre-premium-prix">
            {prixAnnee} <small>par an</small>
          </span>
          <span className="offre-premium-detail">Un seul paiement pour toute l&apos;année.</span>
          <span className="offre-premium-coche" aria-hidden="true">
            <Check className="size-4" />
          </span>
        </label>
      </fieldset>

      {connecte ? (
        <>
          <div className="premium-consentements">
            <label className="premium-consentement">
              <input type="checkbox" checked={cgv} onChange={(e) => setCgv(e.target.checked)} />
              <span>
                J&apos;ai lu et j&apos;accepte les{" "}
                <Link href="/conditions-vente" target="_blank" rel="noopener">
                  conditions générales de vente
                </Link>
                .
              </span>
            </label>
            <label className="premium-consentement">
              <input type="checkbox" checked={renonciation} onChange={(e) => setRenonciation(e.target.checked)} />
              <span>
                Je demande l&apos;accès immédiat à Premium{essaiJours > 0 ? ", essai compris," : ""} et je reconnais perdre mon droit de rétractation de quatorze jours dès que l&apos;accès commence.
              </span>
            </label>
          </div>
          <button type="button" className="bouton bouton-principal bouton-premium mt-6 w-full sm:w-auto" onClick={payer} disabled={envoi} aria-describedby={`${id}-securite`}>
            {envoi ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Crown className="size-5" aria-hidden="true" />}
            {envoi ? "Ouverture du paiement sécurisé…" : essaiJours > 0 ? `Commencer mes ${essaiJours} jours d'essai` : "Continuer vers le paiement sécurisé"}
          </button>
        </>
      ) : (
        <a className="bouton bouton-principal bouton-premium mt-6 w-full sm:w-auto" href="/connexion?retour=%2Fpremium">
          <Crown className="size-5" aria-hidden="true" />
          Se connecter pour devenir Premium
        </a>
      )}
      <p className="mt-3 min-h-6 font-semibold text-danger" role="alert" aria-live="assertive">
        {erreur}
      </p>
      <ul className="premium-garanties" id={`${id}-securite`}>
        <li>
          <LockKeyhole className="size-4" aria-hidden="true" />
          Paiement par Stripe : ta carte est saisie sur sa page sécurisée, HaqqReason ne la voit jamais.
        </li>
        <li>
          <Check className="size-4" aria-hidden="true" />
          {essaiJours > 0 ? `Rien n'est prélevé pendant les ${essaiJours} jours d'essai. ` : ""}Résiliable à tout moment, en trois clics, depuis « Mon compte » : l&apos;accès reste jusqu&apos;à la fin de la période payée.
        </li>
        <li>
          <Check className="size-4" aria-hidden="true" />
          Une facture à chaque paiement, envoyée par Stripe et téléchargeable depuis ton compte.
        </li>
      </ul>
    </div>
  );
}
