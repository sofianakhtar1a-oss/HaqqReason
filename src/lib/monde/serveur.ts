import "server-only";
import { createHash, randomInt } from "node:crypto";
import { after } from "next/server";
import { avatarSur, nomPublic } from "@/lib/langues/points";
import { dbAdmin } from "@/lib/supabase";
import type { ModeJeu } from "./categories";
import { evaluer, type ReponseEnvoyee } from "./points";
import { cleDefi, questionsDefi, type SorteDefi } from "./defis";
import { DUREES_DUEL, NOMBRES_DUEL, PAUSE_REPONSE, pointsReponse, type Reaction, tempsArbitre } from "./duels";
import { noterManques } from "./atelier";
import { notifier } from "./notifications";
import { juger, questionsDuel } from "./quiz";

/*
 * Le Portulan, côté serveur : l'XP, le classement et les duels. Les tables sont fermées au
 * navigateur (migration 017) : tout passe par ici, après vérification de la session du compte.
 * Tant que la migration n'a pas été lancée, chaque fonction répond « indisponible » et le
 * module reste jouable (progression sur l'appareil, duels contre les explorateurs virtuels).
 */

type Erreur = { erreur: "indisponible" | "trop_vite" | "illisible" | "introuvable" | "ferme" | "code_pris" };

/** Un travail qui n'a pas à retarder la réponse (une notification, l'XP) : après elle, si possible. */
export function plusTard(travail: () => Promise<unknown>): void {
  try {
    after(travail);
  } catch {
    void travail().catch(() => undefined);
  }
}

export type EtatXp = { gain: number; xp: number; aujourdhui: number; trophees: number; plafond: boolean };

export async function enregistrerReponses(compte: string, reponses: ReponseEnvoyee[]): Promise<EtatXp | Erreur> {
  const jugees = reponses.map(evaluer);
  try {
    const { data, error } = await dbAdmin().rpc("portulan_repondre", { p_utilisateur: compte, p_reponses: jugees });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as EtatXp | { erreur: string };
    if ("erreur" in r) return { erreur: r.erreur === "trop_vite" ? "trop_vite" : r.erreur === "illisible" ? "illisible" : "indisponible" };
    // Les questions manquées, pour l'atelier du créateur (des totaux, aucun nom) : après la réponse.
    const pays = reponses.flatMap((x, i) => (x.cabinet ? [] : [{ type: x.type, cible: x.cible, juste: jugees[i].resultat === "juste" }]));
    after(() => noterManques(pays).catch(() => undefined));
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

export type ReponseDuel = { i: number; j: boolean; p: number; t?: number };

export type EtatDuel = {
  id: string;
  code: string;
  mode: ModeJeu;
  graine: number;
  etat: "attente" | "en_cours" | "fini" | "expire" | "abandon";
  public: boolean;
  /** À distance : chacun joue quand il veut, dans les 24 heures (migration 018). */
  asynchrone: boolean;
  /** Le nombre de questions et le temps de chacune (ms). */
  nombre: number;
  duree: number;
  /** Heures du serveur (ms) : la création, l'arrivée de l'adversaire, le début, et maintenant (pour caler les horloges). */
  cree: number | null;
  rejoint: number | null;
  debut: number | null;
  maintenant: number;
  moi: { points: number; reponses: ReponseDuel[]; trophees: number; elo: number | null };
  adversaire: { nom: string; avatar: string; points: number; nombre: number; justes: number; elo: number | null; reaction: { r: Reaction; t: number } | null } | null;
  resultat: "victoire" | "defaite" | "nul" | null;
};

type DuelBrut = Omit<EtatDuel, "adversaire"> & {
  adversaire: { id?: string; nom: string; avatar: string; classement: boolean; points: number; nombre: number; justes: number; elo?: number; reaction?: { r: Reaction; t: number } | null } | null;
};

const nombreOuNull = (x: unknown) => (x === null || x === undefined || !Number.isFinite(Number(x)) ? null : Number(x));

/** Ce qu'on montre de l'adversaire : son prénom et l'initiale de son nom, et sa photo s'il a rejoint le classement. */
function nettoyer(d: DuelBrut): EtatDuel {
  const a = d.adversaire;
  const reaction = a?.reaction && typeof a.reaction === "object" && typeof a.reaction.r === "string" ? { r: a.reaction.r, t: Number(a.reaction.t) || 0 } : null;
  return {
    id: d.id,
    code: d.code,
    mode: d.mode,
    graine: Number(d.graine),
    etat: d.etat,
    public: Boolean(d.public),
    asynchrone: Boolean(d.asynchrone),
    nombre: NOMBRES_DUEL.includes(Number(d.nombre) as never) ? Number(d.nombre) : 10,
    duree: DUREES_DUEL.includes(Number(d.duree) as never) ? Number(d.duree) : 15_000,
    cree: nombreOuNull(d.cree),
    rejoint: nombreOuNull(d.rejoint),
    debut: nombreOuNull(d.debut),
    maintenant: Number(d.maintenant),
    moi: {
      points: Number(d.moi.points) || 0,
      reponses: Array.isArray(d.moi.reponses) ? d.moi.reponses.map((r) => ({ i: Number(r.i), j: Boolean(r.j), p: Number(r.p) || 0, ...(r.t ? { t: Number(r.t) } : {}) })) : [],
      trophees: Number(d.moi.trophees) || 0,
      elo: nombreOuNull(d.moi.elo),
    },
    adversaire: a
      ? {
          nom: d.public && !a.classement ? "Un explorateur" : nomPublic(a.nom),
          avatar: a.classement ? avatarSur(a.avatar) : "",
          points: Number(a.points) || 0,
          nombre: Number(a.nombre) || 0,
          justes: Number(a.justes) || 0,
          elo: nombreOuNull(a.elo),
          reaction,
        }
      : null,
    resultat: d.resultat,
  };
}

type Brut = DuelBrut | Erreur;

async function appelerBrut(fonction: string, args: Record<string, unknown>): Promise<Brut> {
  try {
    const { data, error } = await dbAdmin().rpc(fonction, args);
    if (error || !data) return { erreur: "indisponible" };
    const r = data as DuelBrut | { erreur: string };
    if ("erreur" in r) {
      const e = r.erreur;
      return { erreur: e === "trop_vite" || e === "introuvable" || e === "ferme" || e === "code_pris" || e === "illisible" ? e : "indisponible" };
    }
    return r;
  } catch {
    return { erreur: "indisponible" };
  }
}
const net = (r: Brut): EtatDuel | Erreur => ("erreur" in r ? r : nettoyer(r));
const appeler = async (fonction: string, args: Record<string, unknown>) => net(await appelerBrut(fonction, args));

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const nouveauCode = (n = 6) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const nouvelleGraine = () => randomInt(0, 4294967295);

export async function creerDuel(compte: string, mode: ModeJeu): Promise<EtatDuel | Erreur> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await appeler("portulan_duel_creer", { p_utilisateur: compte, p_code: nouveauCode(), p_mode: mode, p_graine: nouvelleGraine(), p_public: false });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}

/** Un duel réglé (migration 018) : en direct ou à distance (24 heures), 5 à 15 questions, 5 à 30 secondes chacune. */
export async function ouvrirDuel(compte: string, mode: ModeJeu, o: { asynchrone: boolean; nombre: number; duree: number }): Promise<EtatDuel | Erreur> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await appeler("portulan_duel_ouvrir", { p_utilisateur: compte, p_code: nouveauCode(), p_mode: mode, p_graine: nouvelleGraine(), p_public: false, p_asynchrone: o.asynchrone, p_nombre: o.nombre, p_duree: o.duree });
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

export async function rejoindreDuel(compte: string, code: string): Promise<EtatDuel | Erreur> {
  const r = await appelerBrut("portulan_duel_rejoindre", { p_utilisateur: compte, p_code: code.toUpperCase() });
  // Un duel à distance vient d'être relevé : son auteur le saura sur son téléphone.
  if (!("erreur" in r) && r.asynchrone && r.adversaire?.id && r.moi.reponses.length === 0) {
    const auteur = r.adversaire.id;
    plusTard(async () => notifier(auteur, { titre: "Ton duel est relevé", corps: `${nomPublic((await nomDe(compte)) ?? "")} a accepté ton défi au Portulan.`, url: "/monde#duels" }));
  }
  return net(r);
}
export const lireDuel = (compte: string, id: string) => appeler("portulan_duel_lire", { p_utilisateur: compte, p_id: id });
export const quitterDuel = (compte: string, id: string) => appeler("portulan_duel_quitter", { p_utilisateur: compte, p_id: id });

/** Le nom d'un compte (pour les notifications). */
async function nomDe(compte: string): Promise<string | null> {
  try {
    const { data } = await dbAdmin().from("utilisateurs").select("nom").eq("id", compte).maybeSingle();
    return (data as { nom?: string } | null)?.nom ?? null;
  } catch {
    return null;
  }
}

/**
 * Une réponse de duel : le serveur retrouve la question à partir de la graine du duel (que le
 * navigateur ne peut pas changer), la juge, arbitre le temps annoncé (il doit tenir dans le temps
 * réellement écoulé depuis que la question a pu s'afficher), puis la base l'ajoute — dans l'ordre,
 * une seule fois. La bonne réponse rapporte aussi de l'XP, comme en partie seule.
 */
export async function repondreDuel(compte: string, id: string, index: number, reponse: string, ms: number): Promise<EtatDuel | Erreur> {
  const avant = await appelerBrut("portulan_duel_lire", { p_utilisateur: compte, p_id: id });
  if ("erreur" in avant) return avant;
  const d = nettoyer(avant);
  if (d.etat !== "en_cours" && !(d.asynchrone && d.etat === "attente")) return d;
  const question = questionsDuel(d.graine, d.mode, d.nombre)[index];
  if (!question) return { erreur: "illisible" };
  const resultat = juger(question.type, question.cible, reponse);
  const juste = resultat !== "faux";
  // Quand la question a-t-elle pu s'afficher ? Après la réponse d'avant (et sa pause), ou au début de la partie.
  const derniere = d.moi.reponses[d.moi.reponses.length - 1];
  const depart = derniere ? (derniere.t ? derniere.t + PAUSE_REPONSE : null) : d.asynchrone ? null : d.debut;
  const arbitre = tempsArbitre(ms, depart === null ? null : d.maintenant - depart, d.duree);
  const brut = await appelerBrut("portulan_duel_repondre", { p_utilisateur: compte, p_id: id, p_index: index, p_juste: juste, p_points: pointsReponse(juste, arbitre, d.duree) });
  if ("erreur" in brut) return brut;
  plusTard(() => enregistrerReponses(compte, [{ type: question.type, cible: question.cible, reponse, nb: question.nb }]));
  // À distance : la dernière réponse donnée, l'adversaire est prévenu (son tour, ou le résultat).
  if (brut.asynchrone && brut.adversaire?.id && brut.moi.reponses.length === Number(brut.nombre)) {
    const fini = brut.etat === "fini" || brut.etat === "abandon";
    const autre = brut.adversaire.id;
    plusTard(async () => {
      const qui = nomPublic((await nomDe(compte)) ?? "");
      await notifier(autre, {
        titre: fini ? "Le duel est fini" : "À toi de jouer",
        corps: fini ? `${qui} a fini son duel : viens voir le résultat.` : `${qui} a joué son duel au Portulan. À ton tour, tu as 24 heures.`,
        url: "/monde#duels",
      });
    });
  }
  return nettoyer(brut);
}

/** Une réaction rapide (« Bravo ! », « Salam ! »…), montrée à l'adversaire. */
export async function reagirDuel(compte: string, id: string, reaction: Reaction): Promise<{ ok: true } | Erreur> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_duel_reagir", { p_utilisateur: compte, p_id: id, p_reaction: reaction });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { ok?: boolean; erreur?: string };
    if (r.erreur) return { erreur: r.erreur === "introuvable" ? "introuvable" : r.erreur === "illisible" ? "illisible" : "indisponible" };
    return { ok: true };
  } catch {
    return { erreur: "indisponible" };
  }
}

/** Mes duels à distance des huit derniers jours : à jouer, en attente, finis. */
export async function mesDuels(compte: string): Promise<EtatDuel[] | Erreur> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_duels_mes", { p_utilisateur: compte });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { duels?: DuelBrut[]; erreur?: string };
    if (r.erreur || !Array.isArray(r.duels)) return { erreur: "indisponible" };
    return r.duels.filter((x) => x && !("erreur" in x)).map(nettoyer);
  } catch {
    return { erreur: "indisponible" };
  }
}

/** Ma cote (Elo), si la base la connaît. */
export async function maCote(compte: string): Promise<number | null> {
  try {
    const { data, error } = await dbAdmin().from("portulan_scores").select("elo").eq("utilisateur_id", compte).maybeSingle();
    if (error) return null;
    return data && Number.isFinite(Number((data as { elo?: number }).elo)) ? Number((data as { elo: number }).elo) : 1200;
  } catch {
    return null;
  }
}

/* ---------- Le double XP, les records en ligne, les défis (migration 018) ---------- */

/** Dix minutes d'XP double, une fois par jour. */
export async function activerDouble(compte: string): Promise<{ jusqua: number } | { erreur: "deja"; jusqua: number | null } | Erreur> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_double", { p_utilisateur: compte });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { jusqua?: number | null; erreur?: string };
    if (r.erreur === "deja") return { erreur: "deja", jusqua: r.jusqua === null || r.jusqua === undefined ? null : Number(r.jusqua) };
    if (r.erreur) return { erreur: "indisponible" };
    return { jusqua: Number(r.jusqua) };
  } catch {
    return { erreur: "indisponible" };
  }
}

export type ModeRecord = "eclair" | "survie" | "marathon";
export type LigneRecord = { rang: number; cle: string; nom: string; avatar: string; points: number; moi: boolean; ms?: number };
export type TableauRecords = { top: LigneRecord[]; moi: { rang: number; points: number; ms?: number } | null; mien: number | null; participants?: number; jour?: string };

type LigneBrute = { rang: number; id: string; nom: string; avatar: string; points: number; ms?: number };
const lignes = (compte: string, top: LigneBrute[]): LigneRecord[] =>
  (top ?? []).map((l) => ({ rang: Number(l.rang), cle: cleDe(l.id), nom: nomPublic(l.nom), avatar: avatarSur(l.avatar), points: Number(l.points) || 0, moi: l.id === compte, ...(l.ms !== undefined ? { ms: Number(l.ms) } : {}) }));

export async function envoyerRecord(compte: string, mode: ModeRecord, score: number): Promise<{ record: number; nouveau: boolean } | Erreur> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_record_envoyer", { p_utilisateur: compte, p_mode: mode, p_score: Math.max(0, Math.round(score)) });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { record?: number; nouveau?: boolean; erreur?: string };
    if (r.erreur) return { erreur: r.erreur === "illisible" ? "illisible" : "indisponible" };
    return { record: Number(r.record) || 0, nouveau: Boolean(r.nouveau) };
  } catch {
    return { erreur: "indisponible" };
  }
}

export async function lireRecords(compte: string, mode: ModeRecord): Promise<TableauRecords | null> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_records_lire", { p_utilisateur: compte, p_mode: mode });
    if (error || !data) return null;
    const r = data as { top: LigneBrute[]; moi: { rang: number; points: number } | null; mien: number | null };
    return { top: lignes(compte, r.top), moi: r.moi ? { rang: Number(r.moi.rang), points: Number(r.moi.points) } : null, mien: r.mien === null ? null : Number(r.mien) };
  } catch {
    return null;
  }
}

/**
 * Le défi du jour (ou de la semaine) : le serveur retrouve les questions à partir de la date,
 * juge les réponses une à une, enregistre le score (une seule tentative) et compte l'XP.
 */
export async function envoyerDefi(compte: string, sorte: SorteDefi, cle: string, reponses: string[], ms: number): Promise<{ score: number; deja: boolean; resultats: boolean[] } | Erreur> {
  // Le défi commencé juste avant minuit (ou lundi 0 h) reste celui qu'on a joué.
  const valides = [cleDefi(sorte), cleDefi(sorte, new Date(Date.now() - 20 * 60_000))];
  if (!valides.includes(cle)) return { erreur: "illisible" };
  const questions = questionsDefi(sorte, cle);
  if (reponses.length !== questions.length) return { erreur: "illisible" };
  const resultats = questions.map((q, i) => juger(q.type, q.cible, reponses[i] ?? "") !== "faux");
  const score = resultats.filter(Boolean).length;
  try {
    const { data, error } = await dbAdmin().rpc("portulan_defi_envoyer", { p_utilisateur: compte, p_sorte: sorte, p_score: score, p_ms: Math.max(0, Math.round(ms)) });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { score?: number; deja?: boolean; erreur?: string };
    if (r.erreur) return { erreur: r.erreur === "illisible" ? "illisible" : "indisponible" };
    if (!r.deja) {
      // L'XP, comme pour toute autre partie (par lots de douze).
      const toutes = questions.map((q, i) => ({ type: q.type, cible: q.cible, reponse: reponses[i] ?? "", nb: q.nb }));
      for (let k = 0; k < toutes.length; k += 12) await enregistrerReponses(compte, toutes.slice(k, k + 12));
    }
    return { score: Number(r.score) || 0, deja: Boolean(r.deja), resultats };
  } catch {
    return { erreur: "indisponible" };
  }
}

export async function lireDefi(compte: string, sorte: SorteDefi): Promise<TableauRecords | null> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_defi_lire", { p_utilisateur: compte, p_sorte: sorte });
    if (error || !data) return null;
    const r = data as { top: LigneBrute[]; moi: { rang: number; points: number; ms: number } | null; participants: number; jour: string };
    return { top: lignes(compte, r.top), moi: r.moi ? { rang: Number(r.moi.rang), points: Number(r.moi.points), ms: Number(r.moi.ms) } : null, mien: r.moi ? Number(r.moi.points) : null, participants: Number(r.participants) || 0, jour: String(r.jour) };
  } catch {
    return null;
  }
}
