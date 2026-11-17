"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { changerStatut, effacerMessage, marquerLue, repondreCreateur, supprimerContribution, viderRefusees } from "@/lib/contributions/donnees";
import type { StatutContribution } from "@/lib/contributions/modele";
import type { EtatFormulaire } from "@/lib/form-state";
import { sessionCreateur } from "@/lib/session";

const nonConnecte: EtatFormulaire = { statut: "erreur", message: "Ta session a expiré. Reconnecte-toi, puis recommence." };

const STATUTS: StatutContribution[] = ["en_attente", "publiee", "refusee", "masquee"];

function rafraichir() {
  revalidatePath("/createur/contributions");
  revalidatePath("/contribuer");
}

/** Publier, masquer ou remettre en attente une contribution. */
export async function marquer(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const id = String(formData.get("id") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutContribution;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUTS.includes(statut)) return { statut: "erreur", message: "Demande incomprise." };

  if (!(await changerStatut(id, statut))) return { statut: "erreur", message: "Changement impossible. Réessaie." };
  await journaliser("contribution_statut", { id, statut });
  rafraichir();
  const dit: Record<StatutContribution, string> = {
    publiee: "Contribution publiée : elle est visible sur la page Contribuer.",
    masquee: "Contribution masquée : plus personne ne la voit.",
    en_attente: "Contribution remise en attente.",
    refusee: "Contribution marquée comme refusée.",
  };
  return { statut: "succes", message: dit[statut] };
}

/** Effacer définitivement une contribution. */
export async function effacer(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { statut: "erreur", message: "Demande incomprise." };
  if (!(await supprimerContribution(id))) return { statut: "erreur", message: "Suppression impossible. Réessaie." };
  await journaliser("contribution_supprimee", { id });
  rafraichir();
  return { statut: "succes", message: "Contribution effacée." };
}

/** Vider d'un coup tout ce que le filtre a refusé. */
export async function viderLesRefusees(): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const combien = await viderRefusees();
  await journaliser("contributions_refusees_vidées", { combien });
  rafraichir();
  return { statut: "succes", message: combien === 0 ? "Rien à vider." : `${combien} contribution${combien > 1 ? "s" : ""} refusée${combien > 1 ? "s" : ""} effacée${combien > 1 ? "s" : ""}.` };
}

const ID = /^[0-9a-f-]{36}$/i;

/** Répondre à l'auteur d'une contribution, et la publier du même geste si demandé. */
export async function repondreA(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const id = String(formData.get("id") ?? "");
  const texte = String(formData.get("texte") ?? "");
  const publier = String(formData.get("publier") ?? "") === "oui";
  if (!ID.test(id)) return { statut: "erreur", message: "Demande incomprise." };
  const resultat = await repondreCreateur(id, texte, publier);
  if (!resultat.ok) return { statut: "erreur", message: resultat.message };
  await journaliser("contribution_reponse", { id, publier });
  rafraichir();
  return { statut: "succes", message: resultat.message };
}

/** Marquer une contribution comme lue ou non lue. */
export async function basculerLue(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const id = String(formData.get("id") ?? "");
  const lue = String(formData.get("lue") ?? "") === "oui";
  if (!ID.test(id)) return { statut: "erreur", message: "Demande incomprise." };
  if (!(await marquerLue(id, lue))) return { statut: "erreur", message: "Changement impossible. Réessaie." };
  rafraichir();
  return { statut: "succes" };
}

/** Effacer une de mes réponses. */
export async function effacerReponse(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return nonConnecte;
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return { statut: "erreur", message: "Demande incomprise." };
  if (!(await effacerMessage(id))) return { statut: "erreur", message: "Suppression impossible. Réessaie." };
  rafraichir();
  return { statut: "succes", message: "Réponse effacée." };
}
