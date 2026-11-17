"use client";

import { CloudCheck, CloudOff, LoaderCircle, LogOut, RefreshCw, TriangleAlert } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { effacerAppareil } from "@/lib/client/effacer-appareil";
import { abonnerEtat, etatInitial, lireEtat } from "@/lib/client/synchro/journal";

function heure(ms: number): string {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** L'état de la synchronisation, dit simplement, avec un bouton pour la relancer. */
export function EtatSynchronisation() {
  const etat = useSyncExternalStore(abonnerEtat, lireEtat, etatInitial);
  const enCours = etat.phase === "en-cours" || etat.phase === "attente" || etat.phase === "inactif";
  const attente = etat.enAttente;

  let Icone = CloudCheck;
  let titre = "Tout est enregistré sur ton compte";
  let detail = etat.dernier ? `Dernière vérification à ${heure(etat.dernier)}.` : "";
  if (enCours) {
    Icone = LoaderCircle;
    titre = "Synchronisation en cours…";
    detail = "";
  } else if (etat.phase === "hors-ligne") {
    Icone = CloudOff;
    titre = "Tu es hors ligne";
    detail = attente > 0 ? `${attente} élément${attente > 1 ? "s" : ""} en attente : l'envoi reprendra tout seul au retour de la connexion.` : "Ton travail s'enregistre sur cet appareil et partira au retour de la connexion.";
  } else if (etat.phase === "erreur") {
    Icone = TriangleAlert;
    titre = "L'envoi a été interrompu";
    detail = `${attente > 0 ? `${attente} élément${attente > 1 ? "s" : ""} en attente. ` : ""}Un nouvel essai est fait automatiquement ; rien n'est perdu sur cet appareil.`;
  } else if (etat.phase === "deconnecte") {
    Icone = TriangleAlert;
    titre = "Ta session est terminée";
    detail = "Reconnecte-toi pour reprendre l'enregistrement sur ton compte.";
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Icone className={`mt-0.5 size-7 shrink-0 ${enCours ? "animate-spin text-encre-douce" : etat.phase === "a-jour" ? "text-succes" : "text-or"}`} aria-hidden="true" />
      <div className="min-w-0 flex-1" role="status">
        <p className="font-display text-lg font-bold">{titre}</p>
        {detail && <p className="text-encre-douce">{detail}</p>}
        {etat.refuses > 0 && (
          <p className="mt-2 text-encre-douce">
            {etat.refuses} élément{etat.refuses > 1 ? "s sont trop lourds" : " est trop lourd"} pour le compte (ou la place est pleine) : {etat.refuses > 1 ? "ils restent" : "il reste"} sur cet appareil.
          </p>
        )}
      </div>
      <button
        type="button"
        className="bouton bouton-discret"
        disabled={enCours}
        onClick={() => void import("@/lib/client/synchro/moteur").then((m) => m.synchroniser())}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Synchroniser maintenant
      </button>
    </div>
  );
}

/** À la déconnexion, les pages gardées pour le hors-ligne sont oubliées : elles portaient le nom du compte. */
function oublierPagesHorsLigne() {
  try {
    void caches.keys().then((cles) => Promise.all(cles.filter((c) => c.endsWith("-pages")).map((c) => caches.delete(c))));
  } catch {
    /* pas de cache hors ligne */
  }
}

/** Les trois façons de fermer sa session. */
export function Deconnexion() {
  const etat = useSyncExternalStore(abonnerEtat, lireEtat, etatInitial);
  const formulaire = useRef<HTMLFormElement>(null);
  const [efface, setEfface] = useState(false);
  const [message, setMessage] = useState("");

  const quitterEnEffacant = async () => {
    // Ce qui n'est pas encore parti sur le compte serait perdu : on tente un dernier envoi, sinon on s'arrête.
    setEfface(true);
    setMessage("");
    const moteur = await import("@/lib/client/synchro/moteur");
    await moteur.synchroniser();
    const apres = lireEtat();
    if (apres.phase !== "a-jour" || apres.enAttente > 0) {
      setEfface(false);
      setMessage("Tout n'a pas encore pu être envoyé sur ton compte : effacer cet appareil maintenant ferait perdre ce qui manque. Vérifie ta connexion, puis réessaie.");
      return;
    }
    await effacerAppareil();
    formulaire.current?.requestSubmit();
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <form ref={formulaire} method="post" action="/api/compte/deconnexion" onSubmit={oublierPagesHorsLigne}>
          <button type="submit" className="bouton bouton-principal" disabled={efface}>
            <LogOut className="size-4" aria-hidden="true" />
            Se déconnecter
          </button>
        </form>
        <button type="button" className="bouton bouton-discret" disabled={efface} onClick={() => void quitterEnEffacant()}>
          {efface ? "Dernier envoi…" : "Se déconnecter et effacer cet appareil"}
        </button>
        <form method="post" action="/api/compte/deconnexion" onSubmit={oublierPagesHorsLigne}>
          <input type="hidden" name="partout" value="1" />
          <BoutonConfirmation libelle="Déconnecter tous mes appareils" confirmation="Oui, tous mes appareils" enCours="Déconnexion…" className="bouton bouton-discret" />
        </form>
      </div>
      {message && (
        <p className="message message-erreur mt-4" role="alert">
          {message}
        </p>
      )}
      <p className="mt-4 text-[0.95rem] text-encre-douce">
        Sur un ordinateur partagé, choisis « effacer cet appareil » : tes documents n&apos;y restent pas, et tu les retrouves à ta prochaine connexion.
        {etat.enAttente > 0 ? ` ${etat.enAttente} élément${etat.enAttente > 1 ? "s attendent" : " attend"} encore d'être envoyé${etat.enAttente > 1 ? "s" : ""}.` : ""}
      </p>
    </>
  );
}

/** Suppression du compte : les données sont aussi retirées de cet appareil, puis le serveur efface tout. */
export function SuppressionCompte() {
  const enCours = useRef(false);
  return (
    <form
      method="post"
      action="/api/compte/supprimer"
      className="mt-4"
      onSubmit={(e) => {
        if (enCours.current) return;
        e.preventDefault();
        enCours.current = true;
        const formulaire = e.currentTarget;
        oublierPagesHorsLigne();
        void effacerAppareil().finally(() => formulaire.submit());
      }}
    >
      <input type="hidden" name="confirmation" value="supprimer" />
      <BoutonConfirmation libelle="Supprimer mon compte" confirmation="Oui, tout effacer" enCours="Suppression…" avertissement="C'est définitif." />
    </form>
  );
}
