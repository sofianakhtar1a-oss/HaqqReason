"use server";

import { revalidatePath } from "next/cache";
import {
  deposerContribution,
  lireSuivies,
  LIMITES_CONTRIBUTION,
  marquerReponsesLues,
  repondreLecteur,
  signalerContribution,
  type ContributionSuivie,
  type NatureSite,
  type TypeContribution,
} from "@/lib/contributions/donnees";
import type { EtatFormulaire } from "@/lib/form-state";
import { infosRequete } from "@/lib/request-info";
import { dbPublic } from "@/lib/supabase";

function texteDe(formData: FormData, nom: string, max: number): string {
  return String(formData.get(nom) ?? "")
    .replace(/\s+\n/g, "\n")
    .trim()
    .slice(0, max);
}

/**
 * Reçoit une proposition de lecteur : idée de sujet ou argument de plus.
 * Tout est vérifié ici, côté serveur — le navigateur ne décide de rien.
 */
export async function envoyerContribution(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  // Champ-piège : invisible pour une personne, rempli par les robots.
  if (String(formData.get("site") ?? "") !== "") return { statut: "succes", message: "Merci !" };

  const type = String(formData.get("type") ?? "") as TypeContribution;
  if (type !== "idee" && type !== "argument" && type !== "site") return { statut: "erreur", message: "Formulaire inconnu." };
  const nature = String(formData.get("nature") ?? "") as NatureSite;
  if (type === "site" && nature !== "fonctionnalite" && nature !== "bug") {
    return { statut: "erreur", message: "Dis d'abord s'il s'agit d'une idée de fonctionnalité ou d'un bug." };
  }

  const titre = texteDe(formData, "titre", LIMITES_CONTRIBUTION.titre);
  const texte = texteDe(formData, "texte", LIMITES_CONTRIBUTION.texte);
  const pseudo = texteDe(formData, "pseudo", LIMITES_CONTRIBUTION.pseudo);
  const lie = String(formData.get("lie") ?? "non") === "oui";
  const articleDemande = String(formData.get("article") ?? "").trim();
  const blocDemande = String(formData.get("bloc") ?? "").trim();

  if (titre.length < LIMITES_CONTRIBUTION.titreMin) {
    return { statut: "erreur", message: `Donne un titre d'au moins ${LIMITES_CONTRIBUTION.titreMin} caractères : c'est ce qu'on lira en premier.` };
  }
  if (texte.length < LIMITES_CONTRIBUTION.texteMin) {
    return { statut: "erreur", message: `Explique un peu : au moins ${LIMITES_CONTRIBUTION.texteMin} caractères.` };
  }

  // L'article cité doit exister et être publié : la base publique ne montre que ceux-là.
  let articleId: string | null = null;
  let blocId: string | null = null;
  if (type === "site") {
    // « Amélioration du site » ne se rattache à aucun module.
  } else if (lie) {
    if (!articleDemande) return { statut: "erreur", message: "Choisis l'article dont tu veux parler, ou indique que ta proposition n'en concerne aucun." };
    const { data } = await dbPublic().from("articles").select("id, bloc_id").eq("id", articleDemande).maybeSingle();
    if (!data) return { statut: "erreur", message: "Cet article est introuvable. Choisis-en un autre dans la liste." };
    articleId = (data as { id: string }).id;
    blocId = (data as { bloc_id: string }).bloc_id;
  }

  if (!blocId && type !== "site") {
    if (!blocDemande) {
      return {
        statut: "erreur",
        message: type === "idee" ? "Choisis le module auquel ton idée se rattache." : "Choisis le module auquel ton argument se rattache.",
      };
    }
    const { data } = await dbPublic().from("blocs").select("id").eq("id", blocDemande).maybeSingle();
    if (!data) return { statut: "erreur", message: "Ce module est introuvable." };
    blocId = (data as { id: string }).id;
  }

  const { ipHash } = await infosRequete();
  const resultat = await deposerContribution({ type, nature: type === "site" ? nature : "", blocId, articleId, pseudo, titre, texte }, ipHash);
  if (!resultat.ok) return { statut: "erreur", message: resultat.message };

  revalidatePath("/contribuer");
  revalidatePath("/createur/contributions");
  // Le jeton (« cle ») est gardé par le navigateur : c'est lui qui ouvre « Mes messages ».
  return { statut: "succes", message: resultat.message, cle: resultat.jeton };
}

/** Un lecteur signale une proposition qui lui paraît déplacée. */
export async function signaler(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { statut: "erreur", message: "Proposition inconnue." };
  const { ipHash } = await infosRequete();
  const resultat = await signalerContribution(id, ipHash);
  revalidatePath("/contribuer");
  return { statut: "succes", message: resultat.message };
}

/** « Mes messages » : les contributions dont ce navigateur garde le jeton, avec leurs réponses. */
export async function mesConversations(jetons: string[]): Promise<ContributionSuivie[]> {
  if (!Array.isArray(jetons)) return [];
  return lireSuivies(jetons.map(String));
}

/** L'auteur a ouvert sa conversation : les réponses du créateur sont lues. */
export async function marquerLu(jeton: string): Promise<void> {
  await marquerReponsesLues(String(jeton));
}

/** L'auteur répond au créateur. */
export async function repondre(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const jeton = String(formData.get("jeton") ?? "");
  const texte = String(formData.get("texte") ?? "");
  const resultat = await repondreLecteur(jeton, texte);
  if (!resultat.ok) return { statut: "erreur", message: resultat.message };
  revalidatePath("/createur/contributions");
  return { statut: "succes", message: resultat.message };
}
