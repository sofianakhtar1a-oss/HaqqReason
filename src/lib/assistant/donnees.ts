import "server-only";
import { dbAdmin } from "@/lib/supabase";
import { iaDuReglage, type Fournisseur, type Usage } from "./modeles";
import type { EtatMessage } from "./protocole";

/*
 * Les données de l'Assistant. À n'appeler qu'APRÈS avoir vérifié la session (lib/compte/session.ts) :
 * CHAQUE requête est filtrée par l'identifiant du compte, même quand l'identifiant de l'objet suffirait.
 * Un compte ne peut donc ni lire, ni modifier les conversations ou les PDF d'un autre.
 */

export class ErreurDonnees extends Error {
  constructor(public raison: "installation" | "indisponible") {
    super(raison);
  }
}

type ErreurPostgrest = { code?: string; message?: string } | null;

/** Table ou fonction absente : la migration 016 n'a pas encore été lancée. */
export function installationManquante(e: ErreurPostgrest): boolean {
  if (!e) return false;
  return ["PGRST205", "PGRST202", "42P01", "42883"].includes(e.code ?? "") || /schema cache|does not exist|could not find the (table|function)/i.test(e.message ?? "");
}

function echec(e: ErreurPostgrest): never {
  throw new ErreurDonnees(installationManquante(e) ? "installation" : "indisponible");
}

const db = () => dbAdmin();

/* ---------- Les réglages : l'IA choisie ---------- */

export type Reglages = { ia: Fournisseur };

/** L'IA est rangée dans la colonne « modele » (« openai ») ; les anciens réglages y ont un modèle (« gpt-6-luna »). */
export async function lireReglages(utilisateur: string): Promise<Reglages> {
  const { data, error } = await db().from("assistant_reglages").select("modele").eq("utilisateur_id", utilisateur).maybeSingle();
  if (error) echec(error);
  return { ia: iaDuReglage((data as { modele?: string } | null)?.modele) };
}

export async function reglerReglages(utilisateur: string, ia: Fournisseur): Promise<Reglages> {
  const { data, error } = await db()
    .from("assistant_reglages")
    .upsert({ utilisateur_id: utilisateur, modele: ia, maj: new Date().toISOString() }, { onConflict: "utilisateur_id" })
    .select("modele")
    .single();
  if (error || !data) echec(error);
  return { ia: iaDuReglage((data as { modele: string }).modele) };
}

/** Les clés d'IA d'avant (quand chacun reliait la sienne) : le site ne s'en sert plus, on les efface. */
export async function effacerAnciennesCles(utilisateur: string): Promise<void> {
  await db().from("assistant_cles").delete().eq("utilisateur_id", utilisateur);
}

/* ---------- Le bilan : rythme, dépense du mois, place ---------- */

export type Bilan = {
  dixMinutes: number;
  aujourdhui: number;
  moisCout: number;
  moisJetons: number;
  moisAppels: number;
  documentsCaracteres: number;
  conversations: number;
  verificationsHeure: number;
};

export async function bilan(utilisateur: string): Promise<Bilan> {
  const { data, error } = await db().rpc("assistant_bilan", { p_utilisateur: utilisateur });
  if (error || !data) echec(error);
  const b = data as Record<string, number | string>;
  const n = (k: string) => Number(b[k] ?? 0) || 0;
  return {
    dixMinutes: n("dix_minutes"),
    aujourdhui: n("aujourdhui"),
    moisCout: n("mois_cout"),
    moisJetons: n("mois_jetons"),
    moisAppels: n("mois_appels"),
    documentsCaracteres: n("documents_caracteres"),
    conversations: n("conversations"),
    verificationsHeure: n("verifications_heure"),
  };
}

/* ---------- Les conversations ---------- */

export type Espace = "general" | "pdf";
export type Lecture = "auto" | "integrale";
export type Conversation = { id: string; espace: Espace; titre: string; lecture: Lecture; creeLe: string; maj: string };

type LigneConversation = { id: string; espace: string; titre: string; lecture: string; cree_le: string; maj: string };
const COLONNES_CONVERSATION = "id, espace, titre, lecture, cree_le, maj";
const conversation = (l: LigneConversation): Conversation => ({
  id: l.id,
  espace: l.espace === "pdf" ? "pdf" : "general",
  titre: l.titre,
  lecture: l.lecture === "integrale" ? "integrale" : "auto",
  creeLe: l.cree_le,
  maj: l.maj,
});

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listerConversations(utilisateur: string, espace: Espace): Promise<Conversation[]> {
  const { data, error } = await db().from("assistant_conversations").select(COLONNES_CONVERSATION).eq("utilisateur_id", utilisateur).eq("espace", espace).order("maj", { ascending: false }).limit(300);
  if (error) echec(error);
  return (data as LigneConversation[]).map(conversation);
}

export async function creerConversation(utilisateur: string, espace: Espace, titre: string): Promise<Conversation> {
  const { data, error } = await db().from("assistant_conversations").insert({ utilisateur_id: utilisateur, espace, titre: titre.slice(0, 200) }).select(COLONNES_CONVERSATION).single();
  if (error || !data) echec(error);
  return conversation(data as LigneConversation);
}

export async function lireConversation(utilisateur: string, id: string): Promise<Conversation | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db().from("assistant_conversations").select(COLONNES_CONVERSATION).eq("utilisateur_id", utilisateur).eq("id", id).maybeSingle();
  if (error) echec(error);
  return data ? conversation(data as LigneConversation) : null;
}

export async function modifierConversation(utilisateur: string, id: string, champs: { titre?: string; lecture?: Lecture }): Promise<Conversation | null> {
  if (!UUID.test(id)) return null;
  const maj: Record<string, unknown> = {};
  if (champs.titre !== undefined) maj.titre = champs.titre.slice(0, 200);
  if (champs.lecture) maj.lecture = champs.lecture;
  const { data, error } = await db().from("assistant_conversations").update(maj).eq("utilisateur_id", utilisateur).eq("id", id).select(COLONNES_CONVERSATION).maybeSingle();
  if (error) echec(error);
  return data ? conversation(data as LigneConversation) : null;
}

/** La conversation remonte en tête de liste. */
export async function toucherConversation(utilisateur: string, id: string): Promise<void> {
  await db().from("assistant_conversations").update({ maj: new Date().toISOString() }).eq("utilisateur_id", utilisateur).eq("id", id);
}

export async function supprimerConversation(utilisateur: string, id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const { data, error } = await db().from("assistant_conversations").delete().eq("utilisateur_id", utilisateur).eq("id", id).select("id");
  if (error) echec(error);
  return (data ?? []).length > 0;
}

/* ---------- Les messages ---------- */

export type Message = { id: string; role: "user" | "assistant"; contenu: string; modele: string; etat: EtatMessage; usage: Usage; cout: number; creeLe: string };

type LigneMessage = {
  id: string;
  role: string;
  contenu: string;
  modele: string;
  etat: string;
  jetons_entree: number;
  jetons_sortie: number;
  jetons_cache_ecriture: number;
  jetons_cache_lecture: number;
  cout_usd: number | string;
  cree_le: string;
};
const COLONNES_MESSAGE = "id, role, contenu, modele, etat, jetons_entree, jetons_sortie, jetons_cache_ecriture, jetons_cache_lecture, cout_usd, cree_le";
const message = (l: LigneMessage): Message => ({
  id: l.id,
  role: l.role === "assistant" ? "assistant" : "user",
  contenu: l.contenu,
  modele: l.modele,
  etat: l.etat === "erreur" ? "erreur" : l.etat === "interrompu" ? "interrompu" : "complet",
  usage: { entree: l.jetons_entree, sortie: l.jetons_sortie, ecritureCache: l.jetons_cache_ecriture, lectureCache: l.jetons_cache_lecture },
  cout: Number(l.cout_usd) || 0,
  creeLe: l.cree_le,
});

/** Les derniers messages, du plus ancien au plus récent. */
export async function lireMessages(utilisateur: string, conversationId: string, limite: number): Promise<Message[]> {
  const { data, error } = await db().from("assistant_messages").select(COLONNES_MESSAGE).eq("utilisateur_id", utilisateur).eq("conversation_id", conversationId).order("cree_le", { ascending: false }).limit(limite);
  if (error) echec(error);
  return (data as LigneMessage[]).map(message).reverse();
}

export async function ajouterMessage(
  utilisateur: string,
  conversationId: string,
  m: { role: "user" | "assistant"; contenu: string; modele?: string; etat?: EtatMessage; usage?: Usage; cout?: number },
): Promise<Message> {
  const u = m.usage ?? { entree: 0, sortie: 0, ecritureCache: 0, lectureCache: 0 };
  const { data, error } = await db()
    .from("assistant_messages")
    .insert({
      conversation_id: conversationId,
      utilisateur_id: utilisateur,
      role: m.role,
      contenu: m.contenu.replaceAll("\u0000", "").slice(0, 400_000),
      modele: (m.modele ?? "").slice(0, 80),
      etat: m.etat ?? "complet",
      jetons_entree: Math.max(0, Math.round(u.entree)),
      jetons_sortie: Math.max(0, Math.round(u.sortie)),
      jetons_cache_ecriture: Math.max(0, Math.round(u.ecritureCache)),
      jetons_cache_lecture: Math.max(0, Math.round(u.lectureCache)),
      cout_usd: Math.max(0, m.cout ?? 0),
    })
    .select(COLONNES_MESSAGE)
    .single();
  if (error || !data) echec(error);
  return message(data as LigneMessage);
}

export async function supprimerMessages(utilisateur: string, conversationId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await db().from("assistant_messages").delete().eq("utilisateur_id", utilisateur).eq("conversation_id", conversationId).in("id", ids);
  if (error) echec(error);
}

/** Une ligne par appel à Claude : c'est ce qui permet à chacun de suivre sa dépense. */
export async function journaliserUsage(utilisateur: string, conversationId: string | null, modele: string, usage: Usage, cout: number, statut: "ok" | "interrompu" | "erreur"): Promise<void> {
  await db().from("assistant_usage").insert({
    utilisateur_id: utilisateur,
    conversation_id: conversationId,
    modele: modele.slice(0, 80),
    jetons_entree: Math.max(0, Math.round(usage.entree)),
    jetons_sortie: Math.max(0, Math.round(usage.sortie)),
    jetons_cache_ecriture: Math.max(0, Math.round(usage.ecritureCache)),
    jetons_cache_lecture: Math.max(0, Math.round(usage.lectureCache)),
    cout_usd: Math.max(0, cout),
    statut,
  });
}

/* ---------- Les PDF ---------- */

/** numero : le « Doc N » des références, donné à l'import et jamais redonné dans la conversation. */
export type FicheDocument = { id: string; numero: number; nom: string; pages: number; pagesVides: number; caracteres: number; jetons: number; actif: boolean; creeLe: string };
type LigneDocument = { id: string; numero: number; nom: string; pages: number; pages_vides: number; caracteres: number; jetons_estimes: number; actif: boolean; cree_le: string };
const COLONNES_DOCUMENT = "id, numero, nom, pages, pages_vides, caracteres, jetons_estimes, actif, cree_le";
const ficheDocument = (l: LigneDocument): FicheDocument => ({ id: l.id, numero: l.numero, nom: l.nom, pages: l.pages, pagesVides: l.pages_vides, caracteres: l.caracteres, jetons: l.jetons_estimes, actif: l.actif, creeLe: l.cree_le });

export async function listerDocuments(utilisateur: string, conversationId: string): Promise<FicheDocument[]> {
  const { data, error } = await db().from("assistant_documents").select(COLONNES_DOCUMENT).eq("utilisateur_id", utilisateur).eq("conversation_id", conversationId).order("numero", { ascending: true });
  if (error) echec(error);
  return (data as LigneDocument[]).map(ficheDocument);
}

/** Le texte des documents cochés, dans l'ordre de leur numéro (Doc 1, Doc 2…). */
export async function documentsActifs(utilisateur: string, conversationId: string): Promise<{ id: string; numero: number; nom: string; pages: number; texte: string }[]> {
  const { data, error } = await db().from("assistant_documents").select("id, numero, nom, pages, texte").eq("utilisateur_id", utilisateur).eq("conversation_id", conversationId).eq("actif", true).order("numero", { ascending: true });
  if (error) echec(error);
  return (data as { id: string; numero: number; nom: string; pages: number; texte: string }[]) ?? [];
}

export async function ajouterDocument(
  utilisateur: string,
  conversationId: string,
  d: { nom: string; pages: number; pagesVides: number; caracteres: number; jetons: number; empreinte: string; texte: string },
): Promise<{ ok: true; document: FicheDocument } | { ok: false; raison: "doublon" }> {
  const { data, error } = await db()
    .from("assistant_documents")
    .insert({
      conversation_id: conversationId,
      utilisateur_id: utilisateur,
      nom: d.nom,
      pages: d.pages,
      pages_vides: d.pagesVides,
      caracteres: d.caracteres,
      jetons_estimes: d.jetons,
      empreinte: d.empreinte,
      texte: d.texte,
    })
    .select(COLONNES_DOCUMENT)
    .single();
  if (error?.code === "23505") return { ok: false, raison: "doublon" };
  if (error || !data) echec(error);
  return { ok: true, document: ficheDocument(data as LigneDocument) };
}

export async function compterDocuments(utilisateur: string, conversationId: string): Promise<number> {
  const { count, error } = await db().from("assistant_documents").select("id", { count: "exact", head: true }).eq("utilisateur_id", utilisateur).eq("conversation_id", conversationId);
  if (error) echec(error);
  return count ?? 0;
}

export async function modifierDocument(utilisateur: string, id: string, champs: { actif?: boolean; nom?: string }): Promise<FicheDocument | null> {
  if (!UUID.test(id)) return null;
  const maj: Record<string, unknown> = {};
  if (typeof champs.actif === "boolean") maj.actif = champs.actif;
  if (champs.nom) maj.nom = champs.nom.slice(0, 300);
  const { data, error } = await db().from("assistant_documents").update(maj).eq("utilisateur_id", utilisateur).eq("id", id).select(COLONNES_DOCUMENT).maybeSingle();
  if (error) echec(error);
  return data ? ficheDocument(data as LigneDocument) : null;
}

export async function supprimerDocument(utilisateur: string, id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const { data, error } = await db().from("assistant_documents").delete().eq("utilisateur_id", utilisateur).eq("id", id).select("id");
  if (error) echec(error);
  return (data ?? []).length > 0;
}

/** Le texte d'une page, pour vérifier une référence. */
export async function lirePage(utilisateur: string, documentId: string, page: number): Promise<string | null> {
  if (!UUID.test(documentId)) return null;
  const { data, error } = await db().rpc("assistant_page", { p_utilisateur: utilisateur, p_document: documentId, p_page: page });
  if (error) echec(error);
  return typeof data === "string" ? data : null;
}
