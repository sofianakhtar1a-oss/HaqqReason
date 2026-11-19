import "server-only";
import { createHash, randomInt } from "node:crypto";
import { avatarSur, nomPublic } from "@/lib/langues/points";
import { dbAdmin } from "@/lib/supabase";
import type { ModeJeu } from "./categories";
import { DUREE_SALON, type FormuleSalon, PAUSE_REPONSE, pointsReponse, tempsArbitre } from "./duels";
import { notifier } from "./notifications";
import { juger, questionsDuel } from "./quiz";
import { enregistrerReponses, plusTard, type ReponseDuel } from "./serveur";

/*
 * Le Portulan, côté serveur : les amis, les salons (3 à 8 joueurs) et les classes (migration 018).
 * Les tables sont fermées au navigateur : tout passe par ici, après vérification de la session.
 * Tant que la migration n'a pas été lancée, chaque fonction répond « indisponible ».
 */

export type ErreurSociale = { erreur: "indisponible" | "trop_vite" | "illisible" | "introuvable" | "ferme" | "code_pris" | "complet" | "pas_assez" | "soi" | "trop" };

const ERREURS = new Set(["trop_vite", "illisible", "introuvable", "ferme", "code_pris", "complet", "pas_assez", "soi", "trop"]);
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const code = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const cleDe = (id: string) => createHash("sha256").update(`portulan:${id}`).digest("base64url").slice(0, 12);
const nombre = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const nombreOuNull = (x: unknown) => (x === null || x === undefined || !Number.isFinite(Number(x)) ? null : Number(x));

async function rpc<T>(fonction: string, args: Record<string, unknown>): Promise<T | ErreurSociale> {
  try {
    const { data, error } = await dbAdmin().rpc(fonction, args);
    if (error || data === null || data === undefined) return { erreur: "indisponible" };
    const r = data as T & { erreur?: string };
    if (r && typeof r === "object" && "erreur" in r && r.erreur) return { erreur: (ERREURS.has(r.erreur) ? r.erreur : "indisponible") as ErreurSociale["erreur"] };
    return r;
  } catch {
    return { erreur: "indisponible" };
  }
}

async function nomDe(compte: string): Promise<string> {
  try {
    const { data } = await dbAdmin().from("utilisateurs").select("nom").eq("id", compte).maybeSingle();
    return nomPublic((data as { nom?: string } | null)?.nom ?? "");
  } catch {
    return "Un explorateur";
  }
}

/* ---------- Les amis ---------- */

export type Ami = { id: string; nom: string; avatar: string; xp: number; semaine: number; trophees: number; elo: number; victoires: number; defaites: number; nuls: number };
export type Personne = { id: string; nom: string };
export type Amis = { code: string | null; amis: Ami[]; recues: Personne[]; envoyees: Personne[] };

type AmisBruts = { code: string | null; amis: (Omit<Ami, "nom" | "avatar"> & { nom: string; avatar: string })[]; recues: { id: string; nom: string }[]; envoyees: { id: string; nom: string }[] };

export async function lireAmis(compte: string): Promise<Amis | ErreurSociale> {
  const r = await rpc<AmisBruts>("portulan_amis_lire", { p_utilisateur: compte });
  if ("erreur" in r) return r;
  return {
    code: r.code ?? null,
    amis: (r.amis ?? []).map((a) => ({
      id: a.id,
      nom: nomPublic(a.nom),
      avatar: avatarSur(a.avatar),
      xp: nombre(a.xp),
      semaine: nombre(a.semaine),
      trophees: nombre(a.trophees),
      elo: nombre(a.elo) || 1200,
      victoires: nombre(a.victoires),
      defaites: nombre(a.defaites),
      nuls: nombre(a.nuls),
    })),
    recues: (r.recues ?? []).map((p) => ({ id: p.id, nom: nomPublic(p.nom) })),
    envoyees: (r.envoyees ?? []).map((p) => ({ id: p.id, nom: nomPublic(p.nom) })),
  };
}

/** Mon code d'ami (huit caractères), créé la première fois qu'on le demande. */
export async function monCodeAmi(compte: string): Promise<{ code: string } | ErreurSociale> {
  for (let essai = 0; essai < 5; essai++) {
    const r = await rpc<{ code: string }>("portulan_ami_code", { p_utilisateur: compte, p_propose: code(8) });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}

export async function ajouterAmi(compte: string, codeAmi: string): Promise<{ etat: "ami" | "demande" } | ErreurSociale> {
  const r = await rpc<{ etat: "ami" | "demande"; id?: string }>("portulan_ami_ajouter", { p_utilisateur: compte, p_code: codeAmi.toUpperCase() });
  if ("erreur" in r) return r;
  if (r.id) {
    const autre = r.id;
    const etat = r.etat;
    plusTard(async () => {
      const qui = await nomDe(compte);
      await notifier(autre, etat === "ami" ? { titre: "Un nouvel ami", corps: `${qui} et toi êtes amis au Portulan.`, url: "/monde#duels/amis" } : { titre: "Une demande d'ami", corps: `${qui} veut être ton ami au Portulan.`, url: "/monde#duels/amis" });
    });
  }
  return { etat: r.etat };
}

export const repondreAmi = (compte: string, autre: string, accepte: boolean) => rpc<{ ok: true }>("portulan_ami_repondre", { p_utilisateur: compte, p_autre: autre, p_accepte: accepte });
export const retirerAmi = (compte: string, autre: string) => rpc<{ ok: true }>("portulan_ami_retirer", { p_utilisateur: compte, p_autre: autre });

/* ---------- Les salons ---------- */

export type JoueurSalon = { cle: string; nom: string; moi: boolean; hote: boolean; points: number; nombre: number; justes: number; elimine: number | null; rang: number | null };
export type EtatSalon = {
  id: string;
  code: string;
  mode: ModeJeu;
  formule: FormuleSalon;
  nombre: number;
  taille: number;
  graine: number;
  etat: "attente" | "en_cours" | "fini" | "expire";
  createur: boolean;
  debut: number | null;
  maintenant: number;
  joueurs: JoueurSalon[];
  /** Mes réponses (pour reprendre où j'en étais). */
  reponses: ReponseDuel[];
};

type SalonBrut = Omit<EtatSalon, "joueurs" | "reponses"> & { joueurs: { id: string; nom: string; moi: boolean; hote: boolean; points: number; nombre: number; justes: number; elimine: number | null; rang: number | null; reponses: ReponseDuel[] | null }[] };

function salon(s: SalonBrut): EtatSalon {
  const moi = (s.joueurs ?? []).find((j) => j.moi);
  return {
    id: s.id,
    code: s.code,
    mode: s.mode,
    formule: s.formule === "elimination" ? "elimination" : "classique",
    nombre: nombre(s.nombre) || 10,
    taille: nombre(s.taille) || 8,
    graine: nombre(s.graine),
    etat: s.etat,
    createur: Boolean(s.createur),
    debut: nombreOuNull(s.debut),
    maintenant: nombre(s.maintenant),
    joueurs: (s.joueurs ?? []).map((j) => ({
      cle: cleDe(j.id),
      nom: j.moi ? "Toi" : nomPublic(j.nom),
      moi: Boolean(j.moi),
      hote: Boolean(j.hote),
      points: nombre(j.points),
      nombre: nombre(j.nombre),
      justes: nombre(j.justes),
      elimine: nombreOuNull(j.elimine),
      rang: nombreOuNull(j.rang),
    })),
    reponses: Array.isArray(moi?.reponses) ? moi.reponses.map((r) => ({ i: nombre(r.i), j: Boolean(r.j), p: nombre(r.p), ...(r.t ? { t: nombre(r.t) } : {}) })) : [],
  };
}
const etatSalon = async (fonction: string, args: Record<string, unknown>): Promise<EtatSalon | ErreurSociale> => {
  const r = await rpc<SalonBrut>(fonction, args);
  return "erreur" in r ? r : salon(r);
};

export async function creerSalon(compte: string, o: { mode: ModeJeu; formule: FormuleSalon; nombre: number; taille: number }): Promise<EtatSalon | ErreurSociale> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await etatSalon("portulan_salon_creer", { p_utilisateur: compte, p_code: code(6), p_mode: o.mode, p_graine: randomInt(0, 4294967295), p_formule: o.formule, p_nombre: o.nombre, p_taille: o.taille });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}
export const rejoindreSalon = (compte: string, codeSalon: string) => etatSalon("portulan_salon_rejoindre", { p_utilisateur: compte, p_code: codeSalon.toUpperCase() });
export const lireSalon = (compte: string, id: string) => etatSalon("portulan_salon_lire", { p_utilisateur: compte, p_id: id });
export const lancerSalon = (compte: string, id: string) => etatSalon("portulan_salon_lancer", { p_utilisateur: compte, p_id: id });
export const quitterSalon = (compte: string, id: string) => rpc<{ ok: true }>("portulan_salon_quitter", { p_utilisateur: compte, p_id: id });

/** Une réponse de salon : jugée ici, le temps arbitré comme en duel. */
export async function repondreSalon(compte: string, id: string, index: number, reponse: string, ms: number): Promise<EtatSalon | ErreurSociale> {
  const avant = await lireSalon(compte, id);
  if ("erreur" in avant) return avant;
  if (avant.etat !== "en_cours") return avant;
  const question = questionsDuel(avant.graine, avant.mode, avant.nombre)[index];
  if (!question) return { erreur: "illisible" };
  const juste = juger(question.type, question.cible, reponse) !== "faux";
  const derniere = avant.reponses[avant.reponses.length - 1];
  const depart = derniere ? (derniere.t ? derniere.t + PAUSE_REPONSE : null) : avant.debut;
  const arbitre = tempsArbitre(ms, depart === null ? null : avant.maintenant - depart, DUREE_SALON);
  const r = await etatSalon("portulan_salon_repondre", { p_utilisateur: compte, p_id: id, p_index: index, p_juste: juste, p_points: pointsReponse(juste, arbitre, DUREE_SALON) });
  if (!("erreur" in r)) plusTard(() => enregistrerReponses(compte, [{ type: question.type, cible: question.cible, reponse, nb: question.nb }]));
  return r;
}

/* ---------- Les classes ---------- */

export type MembreClasse = { id: string; nom: string; avatar: string; moi: boolean; xp: number; bonnes: number; reponses: number; semaine: number; actif: number | null };
export type Classe = { id: string; code: string; nom: string; proprietaire: boolean; enseignant: string; membres: MembreClasse[] };
export type MesClasses = { miennes: { id: string; code: string; nom: string; membres: number }[]; suivies: { id: string; nom: string; enseignant: string }[] };

type ClasseBrute = Omit<Classe, "enseignant" | "membres"> & { enseignant: { nom: string; avatar: string } | null; membres: (Omit<MembreClasse, "nom" | "avatar"> & { nom: string; avatar: string })[] };

/**
 * Une classe : l'enseignant voit le nom complet de ses élèves (il doit les reconnaître) ; les élèves
 * voient leurs camarades par leur prénom et l'initiale de leur nom, sans photo.
 */
function classe(c: ClasseBrute): Classe {
  const prof = Boolean(c.proprietaire);
  return {
    id: c.id,
    code: prof ? c.code : "",
    nom: c.nom,
    proprietaire: prof,
    enseignant: nomPublic(c.enseignant?.nom ?? ""),
    membres: (c.membres ?? []).map((m) => ({
      id: prof ? m.id : cleDe(m.id),
      nom: prof ? m.nom.trim().slice(0, 60) || "Élève" : m.moi ? "Toi" : nomPublic(m.nom),
      avatar: prof ? avatarSur(m.avatar) : "",
      moi: Boolean(m.moi),
      xp: nombre(m.xp),
      bonnes: nombre(m.bonnes),
      reponses: nombre(m.reponses),
      semaine: nombre(m.semaine),
      actif: nombreOuNull(m.actif),
    })),
  };
}
const etatClasse = async (fonction: string, args: Record<string, unknown>): Promise<Classe | ErreurSociale> => {
  const r = await rpc<ClasseBrute>(fonction, args);
  return "erreur" in r ? r : classe(r);
};

export async function mesClasses(compte: string): Promise<MesClasses | ErreurSociale> {
  const r = await rpc<{ miennes: MesClasses["miennes"]; suivies: { id: string; nom: string; enseignant: string }[] }>("portulan_classes_mes", { p_utilisateur: compte });
  if ("erreur" in r) return r;
  return {
    miennes: (r.miennes ?? []).map((c) => ({ id: c.id, code: c.code, nom: c.nom, membres: nombre(c.membres) })),
    suivies: (r.suivies ?? []).map((c) => ({ id: c.id, nom: c.nom, enseignant: nomPublic(c.enseignant ?? "") })),
  };
}
export async function creerClasse(compte: string, nom: string): Promise<Classe | ErreurSociale> {
  for (let essai = 0; essai < 4; essai++) {
    const r = await etatClasse("portulan_classe_creer", { p_utilisateur: compte, p_code: code(6), p_nom: nom });
    if (!("erreur" in r) || r.erreur !== "code_pris") return r;
  }
  return { erreur: "indisponible" };
}
export const rejoindreClasse = (compte: string, codeClasse: string) => etatClasse("portulan_classe_rejoindre", { p_utilisateur: compte, p_code: codeClasse.toUpperCase() });
export const lireClasse = (compte: string, id: string) => etatClasse("portulan_classe_lire", { p_utilisateur: compte, p_classe: id });
export const quitterClasse = (compte: string, id: string, membre: string | null) => rpc<{ ok: true }>("portulan_classe_quitter", { p_utilisateur: compte, p_classe: id, p_membre: membre });
