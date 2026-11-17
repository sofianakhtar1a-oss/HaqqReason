import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { dbAdmin, dbPublic } from "../supabase";
import { lireReglages } from "../reglages-donnees";
import { analyserContribution, libelleMotifs, type Verdict } from "./filtre";
import {
  LIMITES_CONTRIBUTION,
  LIMITES_MESSAGE,
  SIGNALEMENTS_AVANT_MASQUAGE,
  SUIVIS_MAX,
  type ContributionCreateur,
  type ContributionPublique,
  type ContributionSuivie,
  type MessageContribution,
  type NatureSite,
  type StatutContribution,
  type TypeContribution,
} from "./modele";

export * from "./modele";

export type Envoi = {
  type: TypeContribution;
  nature: NatureSite | "";
  blocId: string | null;
  articleId: string | null;
  pseudo: string;
  titre: string;
  texte: string;
};

export type ResultatEnvoi =
  | { ok: true; statut: Exclude<StatutContribution, "refusee" | "masquee">; message: string; jeton: string }
  | { ok: false; message: string };

const CHAMPS_PUBLICS = "id, type, nature, pseudo, titre, texte, created_at, bloc_id, article_id";

type Ligne = {
  id: string;
  type: TypeContribution;
  nature?: NatureSite | "";
  pseudo: string;
  titre: string;
  texte: string;
  created_at: string;
  bloc_id: string | null;
  article_id: string | null;
  statut?: StatutContribution;
  motif?: string;
  signalements?: number;
  lue?: boolean;
  jeton_hash?: string;
  derniere_activite?: string;
};

/** Empreinte d'un jeton de suivi : la base ne garde jamais le jeton lui-même. */
export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(`haqqreason-suivi:${jeton}`).digest("hex");
}

export function jetonValide(jeton: unknown): jeton is string {
  return typeof jeton === "string" && /^[A-Za-z0-9_-]{32,64}$/.test(jeton);
}

/**
 * Les messages des contributions demandées, par contribution, du plus ancien au plus récent.
 * Sans « tous », seules les réponses du créateur (celles qu'on peut montrer sous une carte publiée).
 */
async function messagesDe(ids: string[], tous: boolean): Promise<Map<string, MessageContribution[]>> {
  const parId = new Map<string, MessageContribution[]>();
  if (ids.length === 0) return parId;
  try {
    let requete = dbAdmin().from("contributions_messages").select("id, contribution_id, auteur, texte, lu, created_at").in("contribution_id", ids);
    if (!tous) requete = requete.eq("auteur", "createur");
    const { data, error } = await requete.order("created_at", { ascending: true }).limit(2000);
    if (error) return parId;
    for (const m of (data ?? []) as (MessageContribution & { contribution_id: string })[]) {
      const liste = parId.get(m.contribution_id) ?? [];
      liste.push({ id: m.id, auteur: m.auteur, texte: m.texte, lu: m.lu, created_at: m.created_at });
      parId.set(m.contribution_id, liste);
    }
  } catch {
    // Table absente (migration 013 pas encore lancée) : pas de messages, le reste fonctionne.
  }
  return parId;
}

/**
 * Les titres de blocs et d'articles sont relus à part : une jointure imposerait
 * de nommer la relation et laisserait passer les articles dépubliés depuis.
 */
async function habiller(lignes: Ligne[], createur: boolean): Promise<ContributionPublique[]> {
  const db = createur ? dbAdmin() : dbPublic();
  const blocs = [...new Set(lignes.map((l) => l.bloc_id).filter(Boolean))] as string[];
  const articles = [...new Set(lignes.map((l) => l.article_id).filter(Boolean))] as string[];

  const [retourBlocs, retourArticles] = await Promise.all([
    blocs.length ? db.from("blocs").select("id, slug, titre, accent").in("id", blocs) : Promise.resolve({ data: [] }),
    articles.length ? db.from("articles").select("id, titre").in("id", articles) : Promise.resolve({ data: [] }),
  ]);

  const messages = await messagesDe(lignes.map((l) => l.id), createur);
  const parBloc = new Map((retourBlocs.data ?? []).map((b: Record<string, unknown>) => [b.id as string, b]));
  const parArticle = new Map((retourArticles.data ?? []).map((a: Record<string, unknown>) => [a.id as string, a]));

  return lignes.map((l) => {
    const bloc = l.bloc_id ? parBloc.get(l.bloc_id) : undefined;
    const article = l.article_id ? parArticle.get(l.article_id) : undefined;
    return {
      id: l.id,
      type: l.type,
      nature: l.nature ?? "",
      pseudo: l.pseudo,
      titre: l.titre,
      texte: l.texte,
      created_at: l.created_at,
      bloc: bloc ? { slug: bloc.slug as string, titre: bloc.titre as string, accent: bloc.accent as string } : null,
      // Un article dépublié depuis l'envoi disparaît du lien : le lecteur ne tombe jamais sur une page absente.
      article: article ? { id: article.id as string, titre: article.titre as string } : null,
      reponses: messages.get(l.id) ?? [],
    };
  });
}

/** Les contributions publiées, les plus récentes d'abord. */
export async function listerPubliees(type: TypeContribution, limite = 50): Promise<ContributionPublique[]> {
  const { data, error } = await dbPublic()
    .from("contributions")
    .select(CHAMPS_PUBLICS)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error || !data) return [];
  return habiller(data as Ligne[], false);
}

/** Les contributions publiées qui citent un article précis. */
export async function listerPourArticle(articleId: string, limite = 20): Promise<ContributionPublique[]> {
  const { data, error } = await dbPublic()
    .from("contributions")
    .select(CHAMPS_PUBLICS)
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error || !data) return [];
  return habiller(data as Ligne[], false);
}

/** Tout, pour la page du créateur. */
export async function listerPourCreateur(filtre: { statut?: StatutContribution; type?: TypeContribution } = {}): Promise<ContributionCreateur[]> {
  const avecMessagerie = `${CHAMPS_PUBLICS}, statut, motif, signalements, lue, jeton_hash, derniere_activite`;
  let requete = dbAdmin().from("contributions").select(avecMessagerie).order("derniere_activite", { ascending: false }).limit(300);
  if (filtre.statut) requete = requete.eq("statut", filtre.statut);
  if (filtre.type) requete = requete.eq("type", filtre.type);
  const premier = await requete;
  let lignes: Ligne[] | null = premier.error || !premier.data ? null : (premier.data as unknown as Ligne[]);
  if (!lignes) {
    // Migration 013 pas encore lancée : on relit sans les colonnes de la messagerie.
    let ancien = dbAdmin()
      .from("contributions")
      .select("id, type, pseudo, titre, texte, created_at, bloc_id, article_id, statut, motif, signalements")
      .order("created_at", { ascending: false })
      .limit(300);
    if (filtre.statut) ancien = ancien.eq("statut", filtre.statut);
    if (filtre.type) ancien = ancien.eq("type", filtre.type);
    const second = await ancien;
    if (second.error || !second.data) return [];
    lignes = second.data as unknown as Ligne[];
  }
  const habillees = await habiller(lignes, true);
  return habillees.map((c, i) => ({
    ...c,
    reponses: c.reponses.filter((m) => m.auteur === "createur"),
    messages: c.reponses,
    statut: lignes[i].statut ?? "en_attente",
    motif: lignes[i].motif ?? "",
    signalements: lignes[i].signalements ?? 0,
    lue: lignes[i].lue ?? true,
    suivie: Boolean(lignes[i].jeton_hash),
    derniere_activite: lignes[i].derniere_activite ?? lignes[i].created_at,
  }));
}

export type EtatContributions = { en_attente: number; publiees: number; refusees: number; masquees: number; signalees: number; non_lues: number };

export async function etatContributions(): Promise<EtatContributions> {
  const vide = { en_attente: 0, publiees: 0, refusees: 0, masquees: 0, signalees: 0, non_lues: 0 };
  try {
    const [{ data, error }, non_lues] = await Promise.all([dbAdmin().rpc("etat_contributions"), compterNonLues()]);
    if (error || !data) return vide;
    const ligne = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    return {
      en_attente: Number(ligne?.en_attente ?? 0),
      publiees: Number(ligne?.publiees ?? 0),
      refusees: Number(ligne?.refusees ?? 0),
      masquees: Number(ligne?.masquees ?? 0),
      signalees: Number(ligne?.signalees ?? 0),
      non_lues,
    };
  } catch {
    return vide;
  }
}

/** Trop d'envois depuis la même adresse ? */
async function tropDenvois(ipHash: string): Promise<boolean> {
  const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await dbAdmin().from("contributions").select("created_at").eq("ip_hash", ipHash).gte("created_at", depuis).limit(60);
  const quand = (data ?? []).map((l) => new Date((l as { created_at: string }).created_at).getTime());
  const heure = quand.filter((t) => Date.now() - t < 60 * 60 * 1000).length;
  return heure >= LIMITES_CONTRIBUTION.parHeure || quand.length >= LIMITES_CONTRIBUTION.parJour;
}

/** Le statut de départ d'une contribution, selon le filtre et les réglages. */
export function statutDepart(verdict: Verdict, relireToujours: boolean): StatutContribution {
  if (verdict === "refuse") return "refusee";
  if (verdict === "a_revoir" || relireToujours) return "en_attente";
  return "publiee";
}

/**
 * Enregistre une contribution après l'avoir passée au filtre de politesse.
 * Rien n'est publié sans avoir traversé ce chemin.
 */
export async function deposerContribution(envoi: Envoi, ipHash: string): Promise<ResultatEnvoi> {
  const reglages = await lireReglages();
  if (!reglages.contributions_ouvertes) {
    return { ok: false, message: "Les contributions sont fermées pour le moment. Reviens un peu plus tard." };
  }
  if (await tropDenvois(ipHash)) {
    return { ok: false, message: "Tu as déjà envoyé plusieurs propositions récemment. Laisse passer un moment avant la suivante." };
  }

  const analyse = analyserContribution({ pseudo: envoi.pseudo, titre: envoi.titre, texte: envoi.texte });
  // « Amélioration du site » attend toujours le créateur : c'est lui qui décide de la rendre publique.
  const statut = statutDepart(analyse.verdict, reglages.contributions_validation || envoi.type === "site");

  // Le jeton part dans le navigateur de l'auteur ; la base n'en garde que l'empreinte.
  const jeton = randomBytes(24).toString("base64url");
  const { error } = await dbAdmin().from("contributions").insert({
    type: envoi.type,
    nature: envoi.type === "site" ? envoi.nature : "",
    jeton_hash: empreinteJeton(jeton),
    bloc_id: envoi.blocId,
    article_id: envoi.articleId,
    pseudo: envoi.pseudo,
    titre: envoi.titre,
    texte: envoi.texte,
    statut,
    motif: libelleMotifs(analyse.motifs),
    ip_hash: ipHash,
  });
  if (error) {
    return { ok: false, message: "Enregistrement impossible pour l'instant. Réessaie dans un moment." };
  }

  if (statut === "refusee") {
    return {
      ok: false,
      message:
        "Ta proposition contient des mots que le site n'accepte pas. Reformule-la calmement, sans insulte ni grossièreté, et renvoie-la : elle sera la bienvenue.",
    };
  }
  const suite = " Tu retrouveras ma réponse dans « Mes messages », sur cette page.";
  return statut === "publiee"
    ? { ok: true, statut: "publiee", jeton, message: `Merci ! Ta proposition est en ligne : les autres lecteurs peuvent la voir.${suite}` }
    : { ok: true, statut: "en_attente", jeton, message: `Merci ! Ta proposition a bien été reçue.${suite}` };
}

/** Un lecteur signale une contribution. Une même adresse ne compte qu'une fois. */
export async function signalerContribution(id: string, ipHash: string): Promise<{ ok: boolean; message: string }> {
  const { error } = await dbAdmin().from("contributions_signalements").insert({ contribution_id: id, ip_hash: ipHash });
  if (error) {
    // Déjà signalé par cette adresse, ou contribution inconnue : on répond la même chose, sans rien révéler.
    return { ok: true, message: "C'est noté, merci. Cette proposition va être relue." };
  }
  const { data } = await dbAdmin().from("contributions").select("signalements").eq("id", id).maybeSingle();
  const compte = Number((data as { signalements?: number } | null)?.signalements ?? 0) + 1;
  // Au troisième signalement, la contribution quitte la vue publique en attendant une relecture.
  await dbAdmin()
    .from("contributions")
    .update({ signalements: compte, ...(compte >= SIGNALEMENTS_AVANT_MASQUAGE ? { statut: "masquee" as const } : {}) })
    .eq("id", id);
  return { ok: true, message: "C'est noté, merci. Cette proposition va être relue." };
}

/** Change le statut d'une contribution (espace créateur). */
export async function changerStatut(id: string, statut: StatutContribution): Promise<boolean> {
  const { error } = await dbAdmin()
    .from("contributions")
    .update({ statut, lue: true, ...(statut === "publiee" ? { signalements: 0 } : {}) })
    .eq("id", id);
  return !error;
}

/** Le créateur a lu la contribution et les messages de son auteur. */
export async function marquerLue(id: string, lue = true): Promise<boolean> {
  const { error } = await dbAdmin().from("contributions").update({ lue }).eq("id", id);
  if (lue) await dbAdmin().from("contributions_messages").update({ lu: true }).eq("contribution_id", id).eq("auteur", "lecteur");
  return !error;
}

/** Nombre de contributions qui attendent l'œil du créateur (nouvelles, ou nouveau message de l'auteur). */
export async function compterNonLues(): Promise<number> {
  try {
    const { count, error } = await dbAdmin().from("contributions").select("id", { count: "exact", head: true }).eq("lue", false).neq("statut", "refusee");
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}

/** Réponse du créateur. Elle peut publier la contribution du même geste. */
export async function repondreCreateur(id: string, texte: string, publier: boolean): Promise<{ ok: boolean; message: string }> {
  const propre = texte.trim().slice(0, LIMITES_MESSAGE.texte);
  if (!propre) return { ok: false, message: "Écris ta réponse avant de l'envoyer." };
  const { error } = await dbAdmin().from("contributions_messages").insert({ contribution_id: id, auteur: "createur", texte: propre });
  if (error) return { ok: false, message: "Envoi impossible. As-tu lancé la migration 013_messagerie.sql dans Supabase ?" };
  await dbAdmin()
    .from("contributions")
    .update({ lue: true, derniere_activite: new Date().toISOString(), ...(publier ? { statut: "publiee" as const, signalements: 0 } : {}) })
    .eq("id", id);
  await dbAdmin().from("contributions_messages").update({ lu: true }).eq("contribution_id", id).eq("auteur", "lecteur");
  return { ok: true, message: publier ? "Réponse envoyée et contribution publiée." : "Réponse envoyée." };
}

/** Efface un message du créateur (une faute de frappe, une réponse à reprendre). */
export async function effacerMessage(id: string): Promise<boolean> {
  const { error } = await dbAdmin().from("contributions_messages").delete().eq("id", id).eq("auteur", "createur");
  return !error;
}

/** Les contributions d'un auteur, retrouvées par les jetons gardés dans son navigateur. */
export async function lireSuivies(jetons: string[]): Promise<ContributionSuivie[]> {
  const valides = [...new Set(jetons.filter(jetonValide))].slice(0, SUIVIS_MAX);
  if (valides.length === 0) return [];
  const parEmpreinte = new Map(valides.map((j) => [empreinteJeton(j), j]));
  try {
    const { data, error } = await dbAdmin()
      .from("contributions")
      .select("id, type, nature, titre, texte, statut, created_at, jeton_hash")
      .in("jeton_hash", [...parEmpreinte.keys()])
      .order("derniere_activite", { ascending: false });
    if (error || !data) return [];
    const lignes = data as { id: string; type: TypeContribution; nature: NatureSite | ""; titre: string; texte: string; statut: StatutContribution; created_at: string; jeton_hash: string }[];
    const messages = await messagesDe(lignes.map((l) => l.id), true);
    return lignes.map((l) => ({
      jeton: parEmpreinte.get(l.jeton_hash) ?? "",
      id: l.id,
      type: l.type,
      nature: l.nature,
      titre: l.titre,
      texte: l.texte,
      statut: l.statut,
      created_at: l.created_at,
      messages: messages.get(l.id) ?? [],
    }));
  } catch {
    return [];
  }
}

/** L'auteur a lu les réponses du créateur. */
export async function marquerReponsesLues(jeton: string): Promise<void> {
  if (!jetonValide(jeton)) return;
  const { data } = await dbAdmin().from("contributions").select("id").eq("jeton_hash", empreinteJeton(jeton)).maybeSingle();
  if (!data) return;
  await dbAdmin().from("contributions_messages").update({ lu: true }).eq("contribution_id", (data as { id: string }).id).eq("auteur", "createur");
}

/** L'auteur répond au créateur, dans sa conversation. */
export async function repondreLecteur(jeton: string, texte: string): Promise<{ ok: boolean; message: string }> {
  if (!jetonValide(jeton)) return { ok: false, message: "Conversation introuvable." };
  const propre = texte.trim().slice(0, LIMITES_MESSAGE.texte);
  if (propre.length < 2) return { ok: false, message: "Écris ton message avant de l'envoyer." };
  const { data } = await dbAdmin().from("contributions").select("id").eq("jeton_hash", empreinteJeton(jeton)).maybeSingle();
  if (!data) return { ok: false, message: "Conversation introuvable." };
  const id = (data as { id: string }).id;

  const analyse = analyserContribution({ titre: "", texte: propre });
  if (analyse.verdict === "refuse") {
    return { ok: false, message: "Ton message contient des mots que le site n'accepte pas. Reformule-le calmement, et renvoie-le." };
  }
  const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await dbAdmin()
    .from("contributions_messages")
    .select("id", { count: "exact", head: true })
    .eq("contribution_id", id)
    .eq("auteur", "lecteur")
    .gte("created_at", depuis);
  if ((count ?? 0) >= LIMITES_MESSAGE.parHeure) return { ok: false, message: "Tu as envoyé beaucoup de messages cette heure-ci. Laisse passer un moment." };

  const { error } = await dbAdmin().from("contributions_messages").insert({ contribution_id: id, auteur: "lecteur", texte: propre });
  if (error) return { ok: false, message: "Envoi impossible pour l'instant. Réessaie dans un moment." };
  await dbAdmin().from("contributions").update({ lue: false, derniere_activite: new Date().toISOString() }).eq("id", id);
  return { ok: true, message: "Message envoyé." };
}

export async function supprimerContribution(id: string): Promise<boolean> {
  const { error } = await dbAdmin().from("contributions").delete().eq("id", id);
  return !error;
}

/** Vide la corbeille des contributions refusées par le filtre. */
export async function viderRefusees(): Promise<number> {
  const { data } = await dbAdmin().from("contributions").delete().eq("statut", "refusee").select("id");
  return (data ?? []).length;
}
