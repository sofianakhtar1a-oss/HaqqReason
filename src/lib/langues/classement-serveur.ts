import "server-only";
import { createHash } from "node:crypto";
import { contenuPublie } from "@/lib/modules/donnees";
import { resoudre } from "@/lib/modules/modules";
import { dbAdmin } from "@/lib/supabase";
import { elementDEntree } from "./dictionnaire";
import { avatarSur, evaluer, nomPublic, type ReponseEnvoyee } from "./points";
import { TOUTES_LES_ENTREES } from "./themes/index";
import type { Element } from "./types";

/*
 * Points et classement, côté serveur. Les tables sont fermées au navigateur (migration 015) :
 * tout passe par ici, après vérification de la session du compte.
 */

/* ---------- Les mots que le serveur sait juger : les thèmes publiés, et ceux d'origine ---------- */

let connus: { carte: Map<string, Element>; expire: number } | null = null;

async function motsConnus(): Promise<Map<string, Element>> {
  if (connus && connus.expire > Date.now()) return connus.carte;
  const carte = new Map<string, Element>();
  for (const e of TOUTES_LES_ENTREES) carte.set(e.id, elementDEntree(e));
  // Les mots que le créateur a ajoutés ou corrigés dans ses thèmes publiés l'emportent.
  const publies = resoudre("langues", await contenuPublie("langues")).themes ?? [];
  for (const t of publies) for (const e of t.entrees) carte.set(e.id, elementDEntree(e));
  connus = { carte, expire: Date.now() + 60_000 };
  return carte;
}

/* ---------- Ce que renvoient les fonctions de la base ---------- */

export type EtatPoints = {
  gain: number;
  bonus: number;
  points: number;
  aujourdhui: number;
  serie: number;
  meilleure_serie: number;
  jours: number;
  plafond: boolean;
  details: { mot: string; resultat: string; gain: number; serie: number }[];
};

export type LigneClassement = { rang: number; cle: string; nom: string; avatar: string; points: number; serie: number; jours: number; moi: boolean };
export type Moi = {
  rang: number | null;
  nom: string;
  avatar: string;
  classement: boolean;
  points: number;
  total: number;
  semaine: number;
  serie: number;
  meilleure_serie: number;
  jours: number;
  bonnes: number;
  reponses: number;
};
export type Classement = { periode: "semaine" | "toujours"; depuis: string; participants: number; top: LigneClassement[]; moi: Moi | null };

type Erreur = { erreur: "indisponible" | "trop_vite" | "illisible" | "aucune" };

/** Une clé stable et opaque pour l'affichage (l'identifiant interne d'un compte ne sort pas du serveur). */
const cleDe = (id: string) => createHash("sha256").update(`classement:${id}`).digest("base64url").slice(0, 12);

/** Juge les réponses, puis les fait compter par la base. */
export async function enregistrerReponses(compte: string, reponses: ReponseEnvoyee[]): Promise<EtatPoints | Erreur> {
  const mots = await motsConnus();
  const jugees = reponses.map((r) => evaluer(r, mots.get(r.mot))).filter((x): x is NonNullable<typeof x> => x !== null);
  if (!jugees.length) return { erreur: "aucune" };
  try {
    const { data, error } = await dbAdmin().rpc("vocabulaire_repondre", { p_utilisateur: compte, p_reponses: jugees });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as EtatPoints | { erreur: string };
    if ("erreur" in r) return { erreur: r.erreur === "trop_vite" ? "trop_vite" : r.erreur === "illisible" ? "illisible" : "indisponible" };
    return r;
  } catch {
    return { erreur: "indisponible" };
  }
}

export async function lireClassement(compte: string, periode: "semaine" | "toujours"): Promise<Classement | null> {
  try {
    const { data, error } = await dbAdmin().rpc("vocabulaire_classement", { p_utilisateur: compte, p_periode: periode, p_limite: 10 });
    if (error || !data) return null;
    const brut = data as { periode: "semaine" | "toujours"; depuis: string; participants: number; top: (Omit<LigneClassement, "cle" | "moi"> & { id: string })[]; moi: Moi | null };
    return {
      periode: brut.periode,
      depuis: brut.depuis,
      participants: Number(brut.participants) || 0,
      top: brut.top.map((l) => ({
        rang: Number(l.rang),
        cle: cleDe(l.id),
        nom: nomPublic(l.nom),
        avatar: avatarSur(l.avatar),
        points: Number(l.points) || 0,
        serie: Number(l.serie) || 0,
        jours: Number(l.jours) || 0,
        moi: l.id === compte,
      })),
      moi: brut.moi
        ? {
            ...brut.moi,
            nom: nomPublic(brut.moi.nom),
            avatar: avatarSur(brut.moi.avatar),
            rang: brut.moi.rang === null ? null : Number(brut.moi.rang),
            points: Number(brut.moi.points) || 0,
            total: Number(brut.moi.total) || 0,
            semaine: Number(brut.moi.semaine) || 0,
          }
        : null,
    };
  } catch {
    return null;
  }
}

/** Rejoindre ou quitter le classement (le choix est gardé sur le compte). */
export async function choisirClassement(compte: string, visible: boolean): Promise<boolean> {
  try {
    const { error } = await dbAdmin().from("utilisateurs").update({ classement: visible }).eq("id", compte);
    return !error;
  } catch {
    return false;
  }
}

/** À la connexion : la photo du compte Google (sans effet si la migration 015 n'est pas encore passée). */
export async function retenirAvatar(compte: string, avatar: string): Promise<void> {
  const sure = avatarSur(avatar);
  try {
    await dbAdmin().from("utilisateurs").update({ avatar: sure }).eq("id", compte);
  } catch {
    // Colonne absente ou base indisponible : la photo attendra la prochaine connexion.
  }
}
