import "server-only";
import { randomUUID } from "node:crypto";
import { nomPublic } from "@/lib/langues/points";
import { notifier } from "@/lib/monde/notifications";
import { lireAmis, mesClasses } from "@/lib/monde/social";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";
import { LIMITES_PARTAGE, libelleRole, mesurerPas, type LigneHistorique, type MetaPartage, type MonRole, type Presence, type ResumePartage, type RolePartage } from "./partage-commun";

/*
 * Le Calame — les documents partagés entre comptes, côté serveur (stockage du site, dossier
 * « calame-partages »). Pour chaque document :
 *   meta.json      le propriétaire, les membres et leur rôle, la remise à une classe ;
 *   base.json      le texte à une version donnée (un point de départ pour qui arrive) ;
 *   pas/NNNNNNNNN.json  chaque lot de changements, à partir de la version NNNNNNNNN. Le fichier ne
 *                  peut être créé qu'une fois : c'est ce qui départage deux auteurs qui écrivent
 *                  au même instant (le second reprend les changements du premier, puis renvoie) ;
 *   presence.json  le curseur de chacun ; fichiers/…  les images et PDF du document.
 * Chaque compte a la liste de ses partages (comptes/<id>.json). Tout passe par ici, après
 * vérification de la session et du rôle : le navigateur ne lit jamais ce dossier directement.
 */

const DOSSIER = "calame-partages";
const chemin = (id: string, nom: string) => `${DOSSIER}/${id}/${nom}`;
const indexDe = (compte: string) => `${DOSSIER}/comptes/${compte}.json`;
const nomLot = (version: number) => `${String(version).padStart(9, "0")}.json`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const valideId = (id: string) => UUID.test(id);

const stockage = () => dbAdmin().storage.from(ESPACE);

async function lireJson<T>(lieu: string): Promise<T | null> {
  try {
    const { data } = await stockage().download(lieu);
    if (!data) return null;
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function ecrireJson(lieu: string, valeur: unknown, ecraser = true): Promise<"ok" | "existe" | "erreur"> {
  const { error } = await stockage().upload(lieu, new Blob([JSON.stringify(valeur)], { type: "application/json" }), { upsert: ecraser, contentType: "application/json", cacheControl: "0" });
  if (!error) return "ok";
  const statut = String((error as { statusCode?: string | number; status?: number }).statusCode ?? (error as { status?: number }).status ?? "");
  return statut === "409" || /exist|duplicate/i.test(error.message) ? "existe" : "erreur";
}

async function nomDe(compte: string): Promise<string> {
  try {
    const { data } = await dbAdmin().from("utilisateurs").select("nom").eq("id", compte).maybeSingle();
    return nomPublic((data as { nom?: string } | null)?.nom ?? "");
  } catch {
    return "Un auteur";
  }
}

// ---------------------------------------------------------------- le document et ses membres

export const lireMeta = (id: string) => (valideId(id) ? lireJson<MetaPartage>(chemin(id, "meta.json")) : Promise.resolve(null));

async function ecrireMeta(m: MetaPartage): Promise<boolean> {
  m.maj = new Date().toISOString();
  return (await ecrireJson(chemin(m.id, "meta.json"), m)) === "ok";
}

export function roleDe(m: MetaPartage, compte: string): MonRole | null {
  if (m.proprietaire === compte) return "proprietaire";
  return m.membres.find((x) => x.compte === compte)?.role ?? null;
}

/** Le propriétaire, les relecteurs et les auteurs envoient des changements ; le lecteur, non. */
export const peutEcrire = (r: MonRole | null) => r === "proprietaire" || r === "ecriture" || r === "commentaire";

const nomDansMeta = (m: MetaPartage, compte: string) => (m.proprietaire === compte ? m.nomProprietaire : (m.membres.find((x) => x.compte === compte)?.nom ?? "Un auteur"));

async function modifierIndex(compte: string, id: string, ajouter: boolean) {
  const liste = (await lireJson<string[]>(indexDe(compte))) ?? [];
  const suite = ajouter ? [...new Set([id, ...liste])].slice(0, 500) : liste.filter((x) => x !== id);
  if (suite.length !== liste.length || ajouter) await ecrireJson(indexDe(compte), suite);
}

/** Les documents partagés par moi ou avec moi. */
export async function mesPartages(compte: string): Promise<ResumePartage[]> {
  const ids = (await lireJson<string[]>(indexDe(compte))) ?? [];
  const metas = await Promise.all(ids.slice(0, 200).map((id) => lireMeta(id)));
  const sortie: ResumePartage[] = [];
  for (const m of metas) {
    const role = m ? roleDe(m, compte) : null;
    if (!m || !role) continue;
    sortie.push({ id: m.id, titre: m.titre, role, nomProprietaire: m.nomProprietaire, membres: m.membres.length, remise: m.remise, maj: m.maj });
  }
  return sortie.sort((a, b) => b.maj.localeCompare(a.maj));
}

type Base = { version: number; contenu: unknown; reglages: unknown; titre: string; maj: string };

export async function creerPartage(compte: string, envoi: { titre: string; contenu: unknown; reglages: unknown }): Promise<MetaPartage | { erreur: string }> {
  const id = randomUUID();
  const maintenant = new Date().toISOString();
  const titre = String(envoi.titre ?? "").slice(0, 200) || "Document sans titre";
  const meta: MetaPartage = { id, proprietaire: compte, nomProprietaire: await nomDe(compte), titre, membres: [], remise: null, cree: maintenant, maj: maintenant };
  const base: Base = { version: 0, contenu: envoi.contenu, reglages: envoi.reglages ?? null, titre, maj: maintenant };
  if (JSON.stringify(base).length > LIMITES_PARTAGE.poidsBase) return { erreur: "Ce document est trop lourd pour être partagé (3 Mo de texte au plus)." };
  if ((await ecrireJson(chemin(id, "base.json"), base)) !== "ok" || !(await ecrireMeta(meta))) return { erreur: "Le stockage n'a pas répondu : réessaie dans un instant." };
  await modifierIndex(compte, id, true);
  return meta;
}

export async function ajouterMembre(meta: MetaPartage, cible: string, role: RolePartage): Promise<MetaPartage | { erreur: string }> {
  if (cible === meta.proprietaire) return { erreur: "C'est déjà ton document." };
  const existant = meta.membres.find((m) => m.compte === cible);
  if (!existant) {
    if (meta.membres.length >= LIMITES_PARTAGE.membres) return { erreur: `${LIMITES_PARTAGE.membres} personnes au plus par document.` };
    // Le carnet, ce sont les amis du Portulan : on ne partage pas avec un inconnu.
    const amis = await lireAmis(meta.proprietaire);
    if ("erreur" in amis) return { erreur: "Ta liste d'amis du Portulan ne répond pas : réessaie dans un instant." };
    const ami = amis.amis.find((a) => a.id === cible);
    if (!ami) return { erreur: "On ne partage qu'avec ses amis du Portulan." };
    meta.membres.push({ compte: cible, nom: ami.nom, role, ajoute: new Date().toISOString() });
  } else existant.role = role;
  if (!(await ecrireMeta(meta))) return { erreur: "Le stockage n'a pas répondu." };
  await modifierIndex(cible, meta.id, true);
  if (!existant) await notifier(cible, { titre: "Le Calame", corps: `${meta.nomProprietaire} partage « ${meta.titre} » avec toi (${libelleRole(role).toLowerCase()}).`, url: `/ecrire?partage=${meta.id}`, etiquette: `calame-${meta.id}`.slice(0, 60) });
  return meta;
}

export async function retirerMembre(meta: MetaPartage, cible: string): Promise<MetaPartage | { erreur: string }> {
  meta.membres = meta.membres.filter((m) => m.compte !== cible);
  if (meta.remise?.enseignant === cible) meta.remise = null;
  if (!(await ecrireMeta(meta))) return { erreur: "Le stockage n'a pas répondu." };
  await modifierIndex(cible, meta.id, false);
  return meta;
}

/** Arrêter le partage : tout ce qui est rangé sur le serveur pour ce document disparaît (chacun garde sa copie). */
export async function supprimerPartage(meta: MetaPartage): Promise<boolean> {
  for (const sous of ["pas", "fichiers"]) {
    for (let tour = 0; tour < 200; tour++) {
      const { data } = await stockage().list(chemin(meta.id, sous), { limit: 100 });
      if (!data?.length) break;
      await stockage().remove(data.map((f) => chemin(meta.id, `${sous}/${f.name}`)));
    }
  }
  const { error } = await stockage().remove(["meta.json", "base.json", "presence.json"].map((f) => chemin(meta.id, f)));
  for (const c of [meta.proprietaire, ...meta.membres.map((m) => m.compte)]) await modifierIndex(c, meta.id, false);
  return !error;
}

// ---------------------------------------------------------------- les changements

type Lot = { debut: number; pas: unknown[]; clients: number[]; compte: string; nom: string; quand: string };

async function listerLots(id: string, limite: number): Promise<{ debut: number; nom: string }[]> {
  const { data } = await stockage().list(chemin(id, "pas"), { limit: limite, sortBy: { column: "name", order: "desc" } });
  return (data ?? []).filter((f) => /^\d{9}\.json$/.test(f.name)).map((f) => ({ debut: Number(f.name.slice(0, 9)), nom: f.name }));
}

const lireLot = (id: string, nom: string) => lireJson<Lot>(chemin(id, `pas/${nom}`));

/** La dernière version du document (le nombre de changements reçus). */
export async function versionActuelle(id: string): Promise<number> {
  const [dernier] = await listerLots(id, 1);
  if (!dernier) return (await lireJson<Base>(chemin(id, "base.json")))?.version ?? 0;
  const lot = await lireLot(id, dernier.nom);
  return dernier.debut + (lot?.pas.length ?? 0);
}

/** Un lot de changements, reçu seulement s'il part de la dernière version (sinon : « conflit », il faut d'abord reprendre les autres). */
export async function ajouterLot(meta: MetaPartage, compte: string, version: number, pas: unknown[], clients: number[]): Promise<{ version: number } | { conflit: number } | { erreur: string }> {
  const actuelle = await versionActuelle(meta.id);
  if (version !== actuelle) return { conflit: actuelle };
  const lot: Lot = { debut: version, pas, clients, compte, nom: nomDansMeta(meta, compte), quand: new Date().toISOString() };
  const r = await ecrireJson(chemin(meta.id, `pas/${nomLot(version)}`), lot, false);
  if (r === "existe") return { conflit: await versionActuelle(meta.id) };
  if (r === "erreur") return { erreur: "Le stockage n'a pas répondu." };
  return { version: version + pas.length };
}

async function lireEnParallele<T>(noms: string[], lire: (nom: string) => Promise<T | null>, parTour = 10): Promise<(T | null)[]> {
  const sortie: (T | null)[] = [];
  for (let i = 0; i < noms.length; i += parTour) sortie.push(...(await Promise.all(noms.slice(i, i + parTour).map(lire))));
  return sortie;
}

/** Les changements depuis une version ; « recharger » si l'écart est trop grand (on repart alors de la base). */
export async function changementsDepuis(id: string, depuis: number): Promise<{ pas: unknown[]; clients: number[]; version: number } | { recharger: true }> {
  const [dernier] = await listerLots(id, 1);
  if (!dernier) return depuis === 0 ? { pas: [], clients: [], version: 0 } : { recharger: true };
  if (dernier.debut < depuis) {
    const lot = await lireLot(id, dernier.nom);
    const fin = dernier.debut + (lot?.pas.length ?? 0);
    return depuis === fin ? { pas: [], clients: [], version: fin } : { recharger: true };
  }
  const lots = dernier.debut === depuis ? [dernier] : (await listerLots(id, 300)).filter((l) => l.debut >= depuis).reverse();
  if (!lots.length || lots[0].debut !== depuis) return { recharger: true };
  const lus = await lireEnParallele(
    lots.map((l) => l.nom),
    (nom) => lireLot(id, nom),
  );
  const pas: unknown[] = [];
  const clients: number[] = [];
  let version = depuis;
  for (const lot of lus) {
    if (!lot || lot.debut !== version) break;
    pas.push(...lot.pas);
    clients.push(...lot.clients);
    version += lot.pas.length;
  }
  return { pas, clients, version };
}

export const lireBase = (id: string) => lireJson<Base>(chemin(id, "base.json"));

/** Un nouveau point de départ, envoyé par un auteur à jour : il évite de rejouer tout l'historique. */
export async function ecrireBase(meta: MetaPartage, role: MonRole, envoi: { version: number; contenu: unknown; reglages: unknown; titre: string }): Promise<boolean> {
  const actuelle = await lireBase(meta.id);
  if (actuelle && actuelle.version >= envoi.version) return true;
  if (envoi.version > (await versionActuelle(meta.id))) return false;
  const titre = String(envoi.titre ?? "").slice(0, 200) || meta.titre;
  const ok = (await ecrireJson(chemin(meta.id, "base.json"), { version: envoi.version, contenu: envoi.contenu, reglages: envoi.reglages ?? actuelle?.reglages ?? null, titre, maj: new Date().toISOString() } satisfies Base)) === "ok";
  if (ok && role === "proprietaire" && titre !== meta.titre) {
    meta.titre = titre;
    await ecrireMeta(meta);
  }
  return ok;
}

// ---------------------------------------------------------------- les curseurs

/** Range le curseur de l'un (s'il est donné) et renvoie ceux des autres, encore frais. */
export async function presences(id: string, ici: Presence | null): Promise<Presence[]> {
  const toutes = (await lireJson<Record<string, Presence>>(chemin(id, "presence.json"))) ?? {};
  const maintenant = Date.now();
  if (ici) toutes[ici.compte] = ici;
  for (const [cle, p] of Object.entries(toutes)) if (maintenant - p.quand > LIMITES_PARTAGE.presenceMs) delete toutes[cle];
  if (ici) await ecrireJson(chemin(id, "presence.json"), toutes);
  return Object.values(toutes);
}

// ---------------------------------------------------------------- les fichiers (images, PDF)

export async function deposerFichier(id: string, fichier: string, blob: Blob): Promise<boolean> {
  const { error } = await stockage().upload(chemin(id, `fichiers/${fichier}`), blob, { upsert: true, contentType: blob.type || "application/octet-stream" });
  return !error;
}

export async function lireFichierPartage(id: string, fichier: string): Promise<Blob | null> {
  const { data } = await stockage().download(chemin(id, `fichiers/${fichier}`));
  return data ?? null;
}

export async function fichiersDeposes(id: string): Promise<string[]> {
  const noms: string[] = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    const { data } = await stockage().list(chemin(id, "fichiers"), { limit: 1000, offset });
    if (!data?.length) break;
    noms.push(...data.map((f) => f.name));
    if (data.length < 1000) break;
  }
  return noms;
}

// ---------------------------------------------------------------- l'historique

export async function historique(id: string, nombre = 150): Promise<LigneHistorique[]> {
  const lots = await listerLots(id, nombre);
  const lus = await lireEnParallele(
    lots.map((l) => l.nom),
    (nom) => lireLot(id, nom),
  );
  return lus.filter((l): l is Lot => Boolean(l)).map((l) => ({ debut: l.debut, compte: l.compte, nom: l.nom, quand: l.quand, pas: l.pas.length, ...mesurerPas(l.pas) }));
}

// ---------------------------------------------------------------- remettre une copie à une classe

/** Les classes du Portulan que je suis, avec leur enseignant. */
export async function classesSuivies(compte: string): Promise<{ id: string; nom: string; enseignant: string; nomEnseignant: string }[]> {
  const r = await mesClasses(compte);
  if ("erreur" in r || r.suivies.length === 0) return [];
  const { data } = await dbAdmin()
    .from("portulan_classes")
    .select("id, proprietaire")
    .in(
      "id",
      r.suivies.map((c) => c.id),
    );
  const proprietaires = new Map(((data ?? []) as { id: string; proprietaire: string }[]).map((c) => [c.id, c.proprietaire]));
  return r.suivies.filter((c) => proprietaires.has(c.id) && proprietaires.get(c.id) !== compte).map((c) => ({ id: c.id, nom: c.nom, enseignant: proprietaires.get(c.id) as string, nomEnseignant: c.enseignant }));
}

export async function remettre(meta: MetaPartage, compte: string, classe: string): Promise<MetaPartage | { erreur: string }> {
  if (meta.proprietaire !== compte) return { erreur: "Seul l'auteur remet sa copie." };
  const c = (await classesSuivies(compte)).find((x) => x.id === classe);
  if (!c) return { erreur: "Cette classe n'est pas l'une des tiennes." };
  const deja = meta.membres.find((m) => m.compte === c.enseignant);
  if (deja) deja.role = deja.role === "ecriture" ? "ecriture" : "commentaire";
  else meta.membres.push({ compte: c.enseignant, nom: c.nomEnseignant, role: "commentaire", ajoute: new Date().toISOString() });
  meta.remise = { classe: c.id, nomClasse: c.nom, enseignant: c.enseignant, nomEnseignant: c.nomEnseignant, etat: "remise", remiseLe: new Date().toISOString(), rendueLe: null };
  if (!(await ecrireMeta(meta))) return { erreur: "Le stockage n'a pas répondu." };
  await modifierIndex(c.enseignant, meta.id, true);
  await notifier(c.enseignant, { titre: `Le Calame · ${c.nom}`, corps: `${meta.nomProprietaire} t'a remis « ${meta.titre} ».`, url: `/ecrire?partage=${meta.id}`, etiquette: `calame-${meta.id}`.slice(0, 60) });
  return meta;
}

export async function rendre(meta: MetaPartage, compte: string): Promise<MetaPartage | { erreur: string }> {
  if (!meta.remise || meta.remise.enseignant !== compte) return { erreur: "Seul l'enseignant rend la copie." };
  meta.remise = { ...meta.remise, etat: "rendue", rendueLe: new Date().toISOString() };
  if (!(await ecrireMeta(meta))) return { erreur: "Le stockage n'a pas répondu." };
  await notifier(meta.proprietaire, { titre: `Le Calame · ${meta.remise.nomClasse}`, corps: `Ta copie « ${meta.titre} » est annotée : ouvre-la pour voir les remarques.`, url: `/ecrire?partage=${meta.id}`, etiquette: `calame-${meta.id}`.slice(0, 60) });
  return meta;
}

/** Quitter un document partagé avec moi. */
export async function quitter(meta: MetaPartage, compte: string): Promise<boolean> {
  if (meta.proprietaire === compte) return false;
  const r = await retirerMembre(meta, compte);
  return !("erreur" in r);
}
