"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { journaliser } from "@/lib/audit";
import { lireArticleAdmin, lireCategorieAdmin, type Statut } from "@/lib/contenu-admin";
import { documentVersTexteBrut, documentVide } from "@/lib/document";
import { textesParType } from "@/lib/document-schema";
import { supprimerObjets } from "@/lib/stockage";
import { validerDocument } from "@/lib/editeur/validation-serveur";
import { MODELES_INTEGRES } from "@/lib/modeles-integres";
import type { EtatFormulaire } from "@/lib/form-state";
import { estIcone } from "@/lib/icones";
import { extraireLiens } from "@/lib/liens";
import { enregistrerReferences } from "@/lib/sources-donnees";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { cleEtiquette, estUuid, LIMITES, ligne, lireEtiquettes, slugifier } from "@/lib/validation";

/*
 * Toutes les modifications du contenu passent par ce fichier.
 * Chaque fonction est un point d'entrée public du serveur : elle vérifie donc elle-même,
 * à chaque appel, que la demande vient du créateur connecté.
 */

async function exigerCreateurAction(): Promise<void> {
  if (!(await sessionCreateur())) redirect("/createur/connexion");
}

const erreur = (message: string): EtatFormulaire => ({ statut: "erreur", message });

function champ(formData: FormData, nom: string): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur : "";
}

/** Liste de chemins renvoyée par la fonction SQL chemins_sous_arbre (tableau de textes ou d'objets selon l'API). */
function lireChemins(donnees: unknown): string[] {
  if (!Array.isArray(donnees)) return [];
  return donnees
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? String(Object.values(x)[0] ?? "") : ""))
    .filter(Boolean);
}

/** Colonnes utilisées par la recherche, recalculées à chaque enregistrement d'un article. */
function champsRecherche(contenu: unknown, etiquettes?: string[]) {
  const types = textesParType(contenu);
  return {
    contenu_texte: documentVersTexteBrut(contenu),
    texte_versets: types.versets,
    texte_hadiths: types.hadiths,
    texte_objections: types.objections,
    ...(etiquettes ? { etiquettes_texte: etiquettes.join(" ") } : {}),
  };
}

/** Met à jour la liste des liens [[…]] d'un article (pour les rétroliens et le graphe). */
async function majLiens(articleId: string, contenu: unknown): Promise<void> {
  await dbAdmin().rpc("enregistrer_liens", { p_source: articleId, p_cibles: extraireLiens(documentVersTexteBrut(contenu)) });
  await enregistrerReferences(articleId, contenu);
}

/** Rafraîchit toutes les pages après une modification (les pages sont rendues à la demande). */
function rafraichir(): void {
  revalidatePath("/", "layout");
}

type ErreurBase = { code?: string; message: string } | null;

/** Traduit une erreur de la base en message compréhensible. */
function messageBase(error: ErreurBase, defaut: string): string {
  // Les règles de la base (boucle interdite, destination introuvable…) renvoient déjà un message en français.
  if (error?.code === "P0001") return error.message;
  return defaut;
}

function lireStatut(valeur: string): Statut | null {
  return valeur === "publie" || valeur === "brouillon" ? valeur : null;
}

async function prochainOrdre(table: "categories" | "articles", filtre: { bloc_id?: string; parent_id?: string | null; categorie_id?: string }): Promise<number> {
  let requete = dbAdmin().from(table).select("ordre").is("supprime_le", null);
  if (filtre.bloc_id) requete = requete.eq("bloc_id", filtre.bloc_id);
  if (filtre.categorie_id) requete = requete.eq("categorie_id", filtre.categorie_id);
  if ("parent_id" in filtre) requete = filtre.parent_id ? requete.eq("parent_id", filtre.parent_id) : requete.is("parent_id", null);
  const { data } = await requete.order("ordre", { ascending: false }).limit(1);
  return ((data?.[0]?.ordre as number | undefined) ?? 0) + 1;
}

// ======================================================================
// Catégories
// ======================================================================

export async function creerCategorie(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerCreateurAction();
  const blocId = champ(formData, "blocId");
  const parentId = champ(formData, "parentId") || null;
  const titre = ligne(champ(formData, "titre"));

  if (!estUuid(blocId) || (parentId !== null && !estUuid(parentId))) return erreur("Emplacement invalide.");
  if (!titre) return erreur("Donne un titre à la catégorie.");
  if (titre.length > LIMITES.titreCategorie) return erreur(`Le titre ne doit pas dépasser ${LIMITES.titreCategorie} caractères.`);

  const ordre = await prochainOrdre("categories", { bloc_id: blocId, parent_id: parentId });
  const { error } = await dbAdmin()
    .from("categories")
    .insert({ bloc_id: blocId, parent_id: parentId, titre, slug: slugifier(titre), ordre, statut: "brouillon" });
  if (error) return erreur(messageBase(error, "Création impossible. Réessaie."));

  await journaliser("categorie_creee", { titre });
  rafraichir();
  return { statut: "succes", message: `« ${titre} » créée, en brouillon.` };
}

export async function modifierCategorie(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  const titre = ligne(champ(formData, "titre"));
  const description = champ(formData, "description").trim();
  const icone = champ(formData, "icone");

  if (!estUuid(id)) return erreur("Catégorie introuvable.");
  if (!titre) return erreur("Donne un titre à la catégorie.");
  if (titre.length > LIMITES.titreCategorie) return erreur(`Le titre ne doit pas dépasser ${LIMITES.titreCategorie} caractères.`);
  if (description.length > LIMITES.descriptionCategorie) return erreur(`La description ne doit pas dépasser ${LIMITES.descriptionCategorie} caractères.`);
  if (!estIcone(icone)) return erreur("Icône inconnue.");

  const { error } = await dbAdmin()
    .from("categories")
    .update({ titre, slug: slugifier(titre), description, icone })
    .eq("id", id);
  if (error) return erreur(messageBase(error, "Enregistrement impossible. Réessaie."));

  rafraichir();
  return { statut: "succes", message: "Modifications enregistrées." };
}

export async function publierCategorie(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  const statut = lireStatut(champ(formData, "statut"));
  if (!estUuid(id) || !statut) return;
  const { error } = await dbAdmin().from("categories").update({ statut }).eq("id", id);
  if (error) throw new Error("Changement de statut impossible.");
  await journaliser(statut === "publie" ? "categorie_publiee" : "categorie_depubliee", { id });
  rafraichir();
}

export async function deplacerCategorie(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  const destination = champ(formData, "destination");
  const [type, cible] = destination.split(":");
  if (!estUuid(id) || !estUuid(cible) || (type !== "bloc" && type !== "categorie")) return erreur("Choisis une destination.");

  const categorie = await lireCategorieAdmin(id);
  if (!categorie) return erreur("Catégorie introuvable.");
  const memePlace = type === "bloc" ? categorie.parent_id === null && categorie.bloc_id === cible : categorie.parent_id === cible;
  if (memePlace) return erreur("La catégorie est déjà à cet endroit.");

  const { error } = await dbAdmin().rpc("deplacer_categorie", {
    p_categorie: id,
    p_parent: type === "categorie" ? cible : null,
    p_bloc: type === "bloc" ? cible : null,
  });
  if (error) return erreur(messageBase(error, "Déplacement impossible. Réessaie."));

  await journaliser("categorie_deplacee", { id, destination });
  rafraichir();
  return { statut: "succes", message: "Catégorie déplacée avec tout son contenu." };
}

/**
 * Nouvel ordre après un glisser-déposer. Les éléments reçus doivent être des frères et sœurs
 * (même catégorie parente, ou même catégorie pour des articles). Leurs numéros d'ordre actuels sont
 * redistribués dans le nouvel ordre, ce qui préserve leur place par rapport aux pages voisines.
 */
export async function reordonner(donnees: { table: "categories" | "articles"; ids: string[] }): Promise<{ ok: boolean }> {
  if (!(await sessionCreateur())) return { ok: false };
  const table = donnees.table === "categories" ? "categories" : donnees.table === "articles" ? "articles" : null;
  const ids = Array.isArray(donnees.ids) ? donnees.ids.filter(estUuid) : [];
  if (!table || ids.length < 2 || ids.length !== donnees.ids.length || ids.length > 500 || new Set(ids).size !== ids.length) return { ok: false };

  const colonnes = table === "categories" ? "id, ordre, bloc_id, parent_id, supprime_le" : "id, ordre, categorie_id, supprime_le";
  const { data } = await dbAdmin().from(table).select(colonnes).in("id", ids);
  const lignes = (data ?? []) as unknown as { id: string; ordre: number; bloc_id?: string; parent_id?: string | null; categorie_id?: string; supprime_le: string | null }[];
  if (lignes.length !== ids.length || lignes.some((l) => l.supprime_le)) return { ok: false };
  const parent = (l: (typeof lignes)[number]) => (table === "categories" ? `${l.bloc_id}/${l.parent_id ?? ""}` : String(l.categorie_id));
  if (new Set(lignes.map(parent)).size !== 1) return { ok: false };

  // Numéros d'ordre distincts et croissants, redistribués dans le nouvel ordre.
  const valeurs = lignes.map((l) => l.ordre).sort((x, y) => x - y);
  for (let i = 1; i < valeurs.length; i++) if (valeurs[i] <= valeurs[i - 1]) valeurs[i] = valeurs[i - 1] + 1;
  const actuels = new Map(lignes.map((l) => [l.id, l.ordre]));
  for (let i = 0; i < ids.length; i++) {
    if (actuels.get(ids[i]) !== valeurs[i]) await dbAdmin().from(table).update({ ordre: valeurs[i] }).eq("id", ids[i]);
  }
  rafraichir();
  return { ok: true };
}

export async function mettreCategorieALaCorbeille(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  const categorie = await lireCategorieAdmin(id);
  if (!categorie) return;
  await dbAdmin().from("categories").update({ supprime_le: new Date().toISOString() }).eq("id", id);
  await journaliser("categorie_mise_a_la_corbeille", { id, titre: categorie.titre });
  rafraichir();
  if (categorie.parent_id) redirect(`/createur/categorie/${categorie.parent_id}`);
  const { data: bloc } = await dbAdmin().from("blocs").select("slug").eq("id", categorie.bloc_id).single();
  redirect(`/createur/bloc/${bloc?.slug ?? ""}`);
}

export async function restaurerCategorie(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  await dbAdmin().from("categories").update({ supprime_le: null }).eq("id", id);
  await journaliser("categorie_restauree", { id });
  rafraichir();
}

export async function supprimerCategorieDefinitivement(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  const categorie = await lireCategorieAdmin(id);
  if (!categorie?.supprime_le) return;
  const { data: chemins } = await dbAdmin().rpc("chemins_sous_arbre", { p_categorie: id });
  const { error } = await dbAdmin().rpc("supprimer_categorie_definitivement", { p_categorie: id });
  if (error) throw new Error("Suppression impossible.");
  await supprimerObjets(lireChemins(chemins));
  await dbAdmin().rpc("nettoyer_etiquettes");
  await journaliser("categorie_supprimee_definitivement", { titre: categorie.titre });
  rafraichir();
}

// ======================================================================
// Articles
// ======================================================================

/** Contenu de départ d'un nouvel article : vide, modèle intégré ou modèle enregistré. */
async function contenuDeDepart(choix: string): Promise<unknown> {
  if (choix.startsWith("integre:")) {
    return MODELES_INTEGRES.find((m) => m.cle === choix.slice(8))?.contenu ?? documentVide();
  }
  if (choix.startsWith("perso:") && estUuid(choix.slice(6))) {
    const { data } = await dbAdmin().from("modeles").select("contenu").eq("id", choix.slice(6)).maybeSingle();
    return data?.contenu ?? documentVide();
  }
  return documentVide();
}

export async function creerArticle(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerCreateurAction();
  const categorieId = champ(formData, "categorieId");
  const titre = ligne(champ(formData, "titre"));
  if (!estUuid(categorieId)) return erreur("Catégorie introuvable.");
  if (!titre) return erreur("Donne un titre à l'article.");
  if (titre.length > LIMITES.titreArticle) return erreur(`Le titre ne doit pas dépasser ${LIMITES.titreArticle} caractères.`);

  const categorie = await lireCategorieAdmin(categorieId);
  if (!categorie || categorie.supprime_le) return erreur("Catégorie introuvable.");

  const valide = validerDocument(await contenuDeDepart(champ(formData, "modele")));
  const contenu = valide.ok ? valide.document : documentVide();

  const ordre = await prochainOrdre("articles", { categorie_id: categorieId });
  const { data, error } = await dbAdmin()
    .from("articles")
    .insert({
      bloc_id: categorie.bloc_id,
      categorie_id: categorieId,
      titre,
      slug: slugifier(titre),
      ordre,
      statut: "brouillon",
      contenu,
      ...champsRecherche(contenu, []),
    })
    .select("id")
    .single();
  if (error || !data) return erreur(messageBase(error, "Création impossible. Réessaie."));

  await journaliser("article_cree", { titre });
  rafraichir();
  redirect(`/createur/article/${data.id}`);
}

async function enregistrerEtiquettes(articleId: string, noms: string[]): Promise<void> {
  const base = dbAdmin();
  await base.from("articles_etiquettes").delete().eq("article_id", articleId);
  if (noms.length > 0) {
    const lignes = noms.map((nom) => ({ nom, cle: cleEtiquette(nom) }));
    await base.from("etiquettes").upsert(lignes, { onConflict: "cle", ignoreDuplicates: true });
    const { data } = await base.from("etiquettes").select("id").in("cle", lignes.map((l) => l.cle));
    if (data && data.length > 0) {
      await base.from("articles_etiquettes").insert(data.map((e) => ({ article_id: articleId, etiquette_id: e.id })));
    }
  }
  await base.rpc("nettoyer_etiquettes");
}

export type ResultatSauvegarde =
  | { ok: true; misAJour: string; heure: string }
  | { ok: false; message: string; conflit?: boolean; session?: boolean };

/** Intervalle minimal entre deux versions créées automatiquement. */
const INTERVALLE_VERSION_AUTO_MS = 10 * 60 * 1000;
/** Nombre de versions conservées par article. */
const VERSIONS_GARDEES = 200;

async function creerVersion(articleId: string, motif: "automatique" | "enregistrement" | "publication" | "avant-restauration" | "creation") {
  const { data: article } = await dbAdmin().from("articles").select("titre, resume, contenu, contenu_texte").eq("id", articleId).single();
  if (!article) return;
  await dbAdmin().from("versions_articles").insert({ article_id: articleId, motif, ...article });
  await dbAdmin().rpc("elaguer_versions", { p_article: articleId, p_garder: VERSIONS_GARDEES });
}

function heureDe(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

/**
 * Enregistrement de l'éditeur (automatique toutes les deux secondes après une frappe, ou manuel avec Ctrl+S).
 * « base » est la date de dernière modification connue par l'éditeur : si l'article a été modifié ailleurs
 * entre-temps (autre onglet, autre appareil), l'enregistrement est refusé au lieu d'écraser ces changements.
 */
export async function sauvegarderArticle(donnees: {
  id: string;
  base: string | null;
  titre: string;
  resume: string;
  contenu: unknown;
  etiquettes: string;
  manuel: boolean;
}): Promise<ResultatSauvegarde> {
  if (!(await sessionCreateur())) {
    return { ok: false, session: true, message: "Ta session a expiré. Reconnecte-toi dans un autre onglet, puis enregistre à nouveau : ton texte est conservé ici." };
  }
  const titre = ligne(String(donnees.titre ?? ""));
  const resume = String(donnees.resume ?? "").trim();
  const etiquettes = lireEtiquettes(String(donnees.etiquettes ?? ""));
  if (!estUuid(donnees.id)) return { ok: false, message: "Article introuvable." };
  if (!titre) return { ok: false, message: "Donne un titre à l'article pour pouvoir l'enregistrer." };
  if (titre.length > LIMITES.titreArticle) return { ok: false, message: `Le titre ne doit pas dépasser ${LIMITES.titreArticle} caractères.` };
  if (resume.length > LIMITES.resume) return { ok: false, message: `Le résumé ne doit pas dépasser ${LIMITES.resume} caractères.` };
  if (etiquettes.length > LIMITES.etiquettesParArticle) return { ok: false, message: `${LIMITES.etiquettesParArticle} étiquettes au maximum.` };

  const valide = validerDocument(donnees.contenu);
  if (!valide.ok) return { ok: false, message: "Le contenu contient des éléments non autorisés. Recharge la page." };
  const recherche = champsRecherche(valide.document, etiquettes);
  if (recherche.contenu_texte.length > LIMITES.texte) return { ok: false, message: "L'article est trop long. Découpe-le en plusieurs articles." };

  let requete = dbAdmin()
    .from("articles")
    .update({ titre, slug: slugifier(titre), resume, contenu: valide.document, ...recherche })
    .eq("id", donnees.id)
    .is("supprime_le", null);
  if (donnees.base) requete = requete.eq("updated_at", donnees.base);
  const { data, error } = await requete.select("updated_at");
  if (error) return { ok: false, message: "Enregistrement impossible. Vérifie ta connexion : un nouvel essai aura lieu à la prochaine modification." };
  if (!data || data.length === 0) {
    return { ok: false, conflit: true, message: "Cet article a été modifié ailleurs (autre onglet ou autre appareil) depuis l'ouverture de cette page." };
  }

  await enregistrerEtiquettes(donnees.id, etiquettes);
  await majLiens(donnees.id, valide.document);

  if (donnees.manuel) {
    await creerVersion(donnees.id, "enregistrement");
  } else {
    const { data: derniere } = await dbAdmin()
      .from("versions_articles")
      .select("created_at")
      .eq("article_id", donnees.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const age = derniere?.[0] ? Date.now() - new Date(derniere[0].created_at as string).getTime() : Infinity;
    if (age > INTERVALLE_VERSION_AUTO_MS) await creerVersion(donnees.id, "automatique");
  }

  const misAJour = data[0].updated_at as string;
  return { ok: true, misAJour, heure: heureDe(misAJour) };
}

export async function changerStatutArticle(donnees: { id: string; statut: string }): Promise<ResultatSauvegarde> {
  if (!(await sessionCreateur())) return { ok: false, session: true, message: "Ta session a expiré. Reconnecte-toi." };
  const statut = lireStatut(donnees.statut);
  if (!estUuid(donnees.id) || !statut) return { ok: false, message: "Demande invalide." };
  const { data, error } = await dbAdmin().from("articles").update({ statut }).eq("id", donnees.id).is("supprime_le", null).select("updated_at, titre");
  if (error || !data || data.length === 0) return { ok: false, message: "Changement de statut impossible." };
  if (statut === "publie") await creerVersion(donnees.id, "publication");
  await journaliser(statut === "publie" ? "article_publie" : "article_depublie", { id: donnees.id, titre: data[0].titre });
  rafraichir();
  const misAJour = data[0].updated_at as string;
  return { ok: true, misAJour, heure: heureDe(misAJour) };
}

export async function restaurerVersion(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const versionId = champ(formData, "version");
  if (!estUuid(versionId)) return;
  const { data: version } = await dbAdmin().from("versions_articles").select("article_id, titre, resume, contenu, contenu_texte, created_at").eq("id", versionId).maybeSingle();
  if (!version) return;
  await creerVersion(version.article_id, "avant-restauration");
  await dbAdmin()
    .from("articles")
    .update({ titre: version.titre, slug: slugifier(version.titre), resume: version.resume, contenu: version.contenu, ...champsRecherche(version.contenu) })
    .eq("id", version.article_id);
  await majLiens(version.article_id, version.contenu);
  await journaliser("version_restauree", { article: version.article_id, version: versionId });
  rafraichir();
  redirect(`/createur/article/${version.article_id}`);
}

export async function dupliquerArticle(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  const article = await lireArticleAdmin(id);
  if (!article || article.supprime_le) return;
  const titre = `${article.titre} (copie)`.slice(0, LIMITES.titreArticle);
  const ordre = await prochainOrdre("articles", { categorie_id: article.categorie_id });
  const { data } = await dbAdmin()
    .from("articles")
    .insert({
      bloc_id: article.bloc_id,
      categorie_id: article.categorie_id,
      titre,
      slug: slugifier(titre),
      resume: article.resume,
      contenu: article.contenu,
      ...champsRecherche(article.contenu, article.etiquettes),
      statut: "brouillon",
      ordre,
    })
    .select("id")
    .single();
  if (!data) throw new Error("Duplication impossible.");
  await enregistrerEtiquettes(data.id, article.etiquettes);
  await majLiens(data.id, article.contenu);
  await journaliser("article_duplique", { source: id, copie: data.id });
  rafraichir();
  redirect(`/createur/article/${data.id}`);
}

// ======================================================================
// Modèles d'articles
// ======================================================================

export async function enregistrerCommeModele(donnees: { nom: string; description: string; contenu: unknown }): Promise<{ ok: boolean; message: string }> {
  if (!(await sessionCreateur())) return { ok: false, message: "Ta session a expiré. Reconnecte-toi." };
  const nom = ligne(String(donnees.nom ?? "")).slice(0, 120);
  const description = ligne(String(donnees.description ?? "")).slice(0, 400);
  if (!nom) return { ok: false, message: "Donne un nom au modèle." };
  const valide = validerDocument(donnees.contenu);
  if (!valide.ok) return { ok: false, message: "Le contenu contient des éléments non autorisés." };
  const { error } = await dbAdmin().from("modeles").insert({ nom, description, contenu: valide.document });
  if (error) return { ok: false, message: "Enregistrement du modèle impossible." };
  await journaliser("modele_cree", { nom });
  rafraichir();
  return { ok: true, message: `Modèle « ${nom} » enregistré.` };
}

export async function supprimerModele(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  await dbAdmin().from("modeles").delete().eq("id", id);
  await journaliser("modele_supprime", { id });
  rafraichir();
}

export async function deplacerArticle(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  const destination = champ(formData, "destination").replace(/^categorie:/, "");
  if (!estUuid(id) || !estUuid(destination)) return erreur("Choisis une catégorie de destination.");

  const [article, cible] = await Promise.all([lireArticleAdmin(id), lireCategorieAdmin(destination)]);
  if (!article) return erreur("Article introuvable.");
  if (!cible || cible.supprime_le) return erreur("Catégorie de destination introuvable.");
  if (article.categorie_id === destination) return erreur("L'article est déjà dans cette catégorie.");

  const ordre = await prochainOrdre("articles", { categorie_id: destination });
  const { error } = await dbAdmin().from("articles").update({ categorie_id: destination, ordre }).eq("id", id);
  if (error) return erreur(messageBase(error, "Déplacement impossible. Réessaie."));

  await journaliser("article_deplace", { id, destination });
  rafraichir();
  return { statut: "succes", message: `Article déplacé dans « ${cible.titre} ».` };
}

export async function mettreArticleALaCorbeille(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  const article = await lireArticleAdmin(id);
  if (!article) return;
  await dbAdmin().from("articles").update({ supprime_le: new Date().toISOString() }).eq("id", id);
  await journaliser("article_mis_a_la_corbeille", { id, titre: article.titre });
  rafraichir();
  if (champ(formData, "retour") === "categorie") redirect(`/createur/categorie/${article.categorie_id}`);
}

export async function restaurerArticle(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  await dbAdmin().from("articles").update({ supprime_le: null }).eq("id", id);
  await journaliser("article_restaure", { id });
  rafraichir();
}

export async function supprimerArticleDefinitivement(formData: FormData): Promise<void> {
  await exigerCreateurAction();
  const id = champ(formData, "id");
  if (!estUuid(id)) return;
  const article = await lireArticleAdmin(id);
  if (!article?.supprime_le) return;
  const { data: fichiers } = await dbAdmin().from("fichiers").select("chemin").eq("article_id", id);
  await dbAdmin().from("articles").delete().eq("id", id).not("supprime_le", "is", null);
  await supprimerObjets((fichiers ?? []).map((f) => f.chemin as string));
  await dbAdmin().rpc("nettoyer_etiquettes");
  await journaliser("article_supprime_definitivement", { titre: article.titre });
  rafraichir();
}

export async function viderCorbeille(): Promise<void> {
  await exigerCreateurAction();
  const base = dbAdmin();
  const { data: articlesSupprimes } = await base.from("articles").select("id").not("supprime_le", "is", null);
  const idsArticles = (articlesSupprimes ?? []).map((a) => a.id as string);
  const chemins: string[] = [];
  for (let i = 0; i < idsArticles.length; i += 200) {
    const { data } = await base.from("fichiers").select("chemin").in("article_id", idsArticles.slice(i, i + 200));
    chemins.push(...(data ?? []).map((f) => f.chemin as string));
  }
  await base.from("articles").delete().not("supprime_le", "is", null);
  const { data: categories } = await base.from("categories").select("id").not("supprime_le", "is", null);
  for (const c of categories ?? []) {
    const { data } = await base.rpc("chemins_sous_arbre", { p_categorie: c.id });
    chemins.push(...lireChemins(data));
  }
  await supprimerObjets([...new Set(chemins.filter(Boolean))]);
  for (const c of categories ?? []) {
    // Une catégorie déjà effacée avec sa parente renvoie une erreur sans conséquence.
    await base.rpc("supprimer_categorie_definitivement", { p_categorie: c.id });
  }
  await base.rpc("nettoyer_etiquettes");
  await journaliser("corbeille_videe");
  rafraichir();
}
