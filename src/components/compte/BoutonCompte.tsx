"use client";

import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { compteLocal, comptesActifs } from "@/lib/client/compte";
import { abonnerEtat, etatInitial, lireEtat } from "@/lib/client/synchro/journal";

const sansAbonnement = () => () => undefined;

const LIBELLES = {
  inactif: "",
  attente: "Synchronisation…",
  "en-cours": "Synchronisation…",
  "a-jour": "Tout est enregistré sur ton compte",
  "hors-ligne": "Hors ligne : l'envoi reprendra tout seul",
  erreur: "Envoi interrompu : nouvel essai bientôt",
  deconnecte: "Session terminée : reconnecte-toi",
} as const;

/**
 * Le compte, dans l'en-tête : la pastille à l'initiale mène à « Mon compte » et dit d'un point
 * de couleur si tout est bien enregistré. Sans compte, un lien « Se connecter » (si le site le propose).
 */
export function BoutonCompte() {
  // Le compte est inscrit sur la page par le serveur : on ne le lit qu'une fois affiché, pour éviter tout décalage.
  const identifiant = useSyncExternalStore(sansAbonnement, () => compteLocal()?.id ?? "", () => null);
  const actifs = useSyncExternalStore(sansAbonnement, comptesActifs, () => false);
  const etat = useSyncExternalStore(abonnerEtat, lireEtat, etatInitial);
  const chemin = usePathname() ?? "/";

  if (identifiant === null) return <span className="pastille-compte-vide" aria-hidden="true" />;
  const compte = compteLocal();
  if (!compte) {
    if (!actifs) return null;
    return (
      <a href={`/connexion?retour=${encodeURIComponent(chemin)}`} className="lien-outil" title="Se connecter avec Google">
        <LogIn className="size-5" aria-hidden="true" />
        <span className="sr-only lg:not-sr-only">Se connecter</span>
      </a>
    );
  }
  const initiale = (compte.nom || compte.email || "?").trim().charAt(0).toUpperCase();
  const libelle = LIBELLES[etat.phase];
  return (
    <a href="/compte" className="pastille-compte" data-etat={etat.phase} title={`Mon compte : ${compte.nom || compte.email}${libelle ? `\n${libelle}` : ""}`} aria-label={`Mon compte (${compte.nom || compte.email})${libelle ? `. ${libelle}` : ""}`}>
      <span aria-hidden="true">{initiale}</span>
      <span className="pastille-compte-etat" aria-hidden="true" />
    </a>
  );
}
