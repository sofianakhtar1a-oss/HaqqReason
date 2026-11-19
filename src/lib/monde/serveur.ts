import "server-only";
import { createHash, randomInt } from "node:crypto";
import { avatarSur, nomPublic } from "@/lib/langues/points";
import { dbAdmin } from "@/lib/supabase";
import type { ModeJeu } from "./categories";
import { evaluer, pointsDuel, type ReponseEnvoyee } from "./points";
import { juger, questionsDuel } from "./quiz";

/*
 * Le Portulan, côté serveur : l'XP, le classement et les duels. Les tables sont fermées au
 * navigateur (migration 017) : tout passe par ici, après vérification de la session du compte.
 * Tant que la migration n'a pas été lancée, chaque fonction répond « indisponible » et le
 * module reste jouable (progression sur l'appareil, duels contre les explorateurs virtuels).
 */

type Erreur = { erreur: "indisponible" | "trop_vite" | "illisible" | "introuvable" | "ferme" | "code_pris" };

export type EtatXp = { gain: number; xp: number; aujourdhui: number; trophees: number; plafond: boolean };

export async function enregistrerReponses(compte: string, reponses: ReponseEnvoyee[]): Promise<EtatXp | Erreur> {
  const jugees = reponses.map(evaluer);
  try {
    const { data, error } = await dbAdmin().rpc("portulan_repondre", { p_utilisateur: compte, p_reponses: jugees });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as EtatXp | { erreur: string };
    if ("erreur" in r) return { erreur: r.erreur === "trop_vite" ? "trop_vite" : r.erreur === "illisible" ? "illisible" : "indisponible" };
    return { gain: Number(r.gain) || 0, xp: Number(r.xp) || 0, aujourdhui: Number(r.aujourdhui) || 0, trophees: Number(r.trophees) || 0, plafond: Boolean(r.plafond) };
  } catch {
    return { erreur: "indisponible" };
  }
}

/* ---------- Le classement ---------- */

export type PeriodeClassement = "jour" | "semaine" | "toujours" | "trophees";
export type LigneClassement = { rang: number; cle: string; nom: string; avatar: string; points: number; victoires: number; moi: boolean };
export type MoiClassement = { rang: number | null; nom: string; avatar: string; classement: boolean; points: number; xp: number; trophees: number; victoires: number; duels: number; bonnes: number; reponses: number };
export type Classement = { periode: PeriodeClassement; depuis: string; participants: number; top: LigneClassement[]; moi: MoiClassement | null };

const cleDe = (id: string) => createHash("sha256").update(`portulan:${id}`).digest("base64url").slice(0, 12);

export async function lireClassement(compte: string, periode: PeriodeClassement): Promise<Classement | null> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_classement", { p_utilisateur: compte, p_periode: periode, p_limite: 50 });
    if (error || !data) return null;
    const brut = data as { periode: PeriodeClassement; depuis: string; participants: number; top: (Omit<LigneClassement, "cle" | "moi"> & { id: string })[]; moi: MoiClassement | null };
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
        victoires: Number(l.victoires) || 0,
        moi: l.id === compte,
      })),
      moi: brut.moi
        ? {
            rang: brut.moi.rang === null ? null : Number(brut.moi.rang),
            nom: nomPublic(brut.moi.nom),
            avatar: avatarSur(brut.moi.avatar),
            classement: Boolean(brut.moi.classement),
            points: Number(brut.moi.points) || 0,
            xp: Number(brut.moi.xp) || 0,
            trophees: Number(brut.moi.trophees) || 0,
            victoires: Number(brut.moi.victoires) || 0,
            duels: Number(brut.moi.duels) || 0,
            bonnes: Number(brut.moi.bonnes) || 0,
            reponses: Number(brut.moi.reponses) || 0,
          }
        : null,
    };
  } catch {
    return null;
  }
}

/* ---------- Les duels ---------- */

export type EtatDuel = {
  id: string;
  code: string;
  mode: ModeJeu;
  graine: number;
  etat: "attente" | "en_cours" | "fini" | "expire" | "abandon";
  public: boolean;
  /** Heures du serveur (ms) : le début du duel, et maintenant (pour caler les horloges). */
  debut: number | null;
  maintenant: number;
  moi: { points: number; reponses: { i: number; j: boolean; p: number }[]; trophees: number };
  adversaire: { nom: string; avatar: string; points: number; nombre: number; justes: number } | null;
  resultat: "victoire" | "defaite" | "nul" | null;
};

type DuelBrut = Omit<EtatDuel, "adversaire"> & { adversaire: { nom: string; avatar: string; classement: boolean; points: number; nombre: number; justes: number } | null };

/** Ce qu'on montre de l'adversaire : son prénom et l'initiale de son nom, et sa photo s'il a rejoint le classement. */
function nettoyer(d: DuelBrut): EtatDuel {
  const a = d.adversaire;
  return {
    id: d.id,
    code: d.code,
    mode: d.mode,
    graine: Number(d.graine),
    etat: d.etat,
    public: Boolean(d.public),
    debut: d.debut === null ? null : Number(d.debut),
    maintenant: Number(d.maintenant),
    moi: { points: Number(d.moi.points) || 0, reponses: Array.isArray(d.moi.reponses) ? d.moi.reponses : [], trophees: Number(d.moi.trophees) || 0 },
    adversaire: a
      ? {
          nom: d.public && !a.classement ? "Un explorateur" : nomPublic(a.nom),
          avatar: a.classement ? avatarSur(a.avatar) : "",
          points: Number(a.points) || 0,
          nombre: Number(a.nombre) || 0,
          justes: Number(a.justes) || 0,
        }
      : null,
    resultat: d.resultat,
  };
}

async function appeler(fonction: string, args: Record<string, unknown>): Promise<EtatDuel | Erreur> {
  try {
    const { data, error } = await dbAdmin().rpc(fonction, args);
    if (error || !data) return { erreur: "indisponible" };
    const r = data as DuelBrut | { erreur: string };
    if ("erreur" in r) {
      const e = r.erreur;
      return { erreur: e === "trop_vite" || e === "introuvable" || e === "ferme" || e === "code_pris" || e === "illisible" ? e : "indisponible" };
    }
    return nettoyer(r);
  } catch {
    return { erreur: "indisponible" };
  }
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const nouveauCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const nouvelleGraine = () => randomInt(0, 4294967295);

export async function creerDuel(compte: string, mode: ModeJeu): Promise<EtatDuel | Erreur> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await appeler("portulan_duel_creer", { p_utilisateur: compte, p_code: nouveauCode(), p_mode: mode, p_graine: nouvelleGraine(), p_public: false });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}

export async function duelAuHasard(compte: string, mode: ModeJeu): Promise<EtatDuel | Erreur> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await appeler("portulan_duel_hasard", { p_utilisateur: compte, p_code: nouveauCode(), p_mode: mode, p_graine: nouvelleGraine() });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}

export const rejoindreDuel = (compte: string, code: string) => appeler("portulan_duel_rejoindre", { p_utilisateur: compte, p_code: code.toUpperCase() });
export const lireDuel = (compte: string, id: string) => appeler("portulan_duel_lire", { p_utilisateur: compte, p_id: id });
export const quitterDuel = (compte: string, id: string) => appeler("portulan_duel_quitter", { p_utilisateur: compte, p_id: id });

/**
 * Une réponse de duel : le serveur retrouve la question à partir de la graine du duel (que le
 * navigateur ne peut pas changer), la juge, puis la base l'ajoute — dans l'ordre, une seule fois.
 * La bonne réponse rapporte aussi de l'XP, comme en partie seule.
 */
export async function repondreDuel(compte: string, id: string, index: number, reponse: string, ms: number): Promise<EtatDuel | Erreur> {
  const avant = await lireDuel(compte, id);
  if ("erreur" in avant) return avant;
  if (avant.etat !== "en_cours") return avant;
  const question = questionsDuel(avant.graine, avant.mode)[index];
  if (!question) return { erreur: "illisible" };
  const resultat = juger(question.type, question.cible, reponse);
  const juste = resultat !== "faux";
  const r = await appeler("portulan_duel_repondre", { p_utilisateur: compte, p_id: id, p_index: index, p_juste: juste, p_points: pointsDuel(juste, ms) });
  if (!("erreur" in r)) void enregistrerReponses(compte, [{ type: question.type, cible: question.cible, reponse, nb: question.nb }]);
  return r;
}
