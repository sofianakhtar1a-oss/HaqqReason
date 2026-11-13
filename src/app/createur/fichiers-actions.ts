"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { lireArticleAdmin, lireCategorieAdmin } from "@/lib/contenu-admin";
import { COULEURS } from "@/lib/document-schema";
import { signatureValide, TAILLE_MAX, TYPES_FICHIERS, typeDepuisNom } from "@/lib/fichiers";
import { sessionCreateur } from "@/lib/session";
import { creerLienEnvoi, lireDebut, supprimerObjets } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";
import { estUuid, ligne } from "@/lib/validation";

/*
 * Envoi, vérification et gestion des fichiers. Chaque fonction revérifie la session du créateur.
 *
 * Parcours d'un envoi :
 * 1. preparerEnvoi : contrôle du nom, du type et de la taille, puis jeton d'envoi à usage unique ;
 * 2. le navigateur envoie le fichier directement dans l'espace de stockage privé ;
 * 3. confirmerEnvoi : le serveur lit les premiers octets et vérifie le TYPE RÉEL du fichier ;
 *    un fichier déguisé est effacé.
 */

type Resultat<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const nonConnecte = { ok: false as const, message: "Ta session a expiré. Reconnecte-toi, puis recommence." };

function rafraichir() {
  revalidatePath("/", "layout");
}

export type Cible = { type: "article" | "categorie"; id: string };

export async function preparerEnvoi(donnees: {
  cible: Cible;
  nom: string;
  typeDeclare: string;
  taille: number;
  dansListe: boolean;
  empreinte?: string;
  forcer?: boolean;
}): Promise<Resultat<{ id: string; url: string; typeMime: string }> | { ok: false; doublon: string; message: string }> {
  if (!(await sessionCreateur())) return nonConnecte;
  const { cible } = donnees;
  if (!cible || (cible.type !== "article" && cible.type !== "categorie") || !estUuid(cible.id)) return { ok: false, message: "Emplacement invalide." };

  const nom = ligne(String(donnees.nom ?? "")).slice(0, 200) || "Fichier";
  const typeMime = typeDepuisNom(nom, String(donnees.typeDeclare ?? ""));
  if (!typeMime) return { ok: false, message: `« ${nom} » : type de fichier non accepté. Formats possibles : PDF, images, Word, Excel, PowerPoint, OpenDocument, EPUB, texte.` };
  const taille = Number(donnees.taille);
  if (!Number.isFinite(taille) || taille <= 0) return { ok: false, message: `« ${nom} » est vide.` };
  if (taille > TAILLE_MAX) return { ok: false, message: `« ${nom} » dépasse 50 Mo. Compresse-le ou découpe-le avant de l'envoyer.` };

  const existe = cible.type === "article" ? await lireArticleAdmin(cible.id) : await lireCategorieAdmin(cible.id);
  if (!existe || existe.supprime_le) return { ok: false, message: "Emplacement introuvable ou dans la corbeille." };

  // Détection des doublons : le même contenu exact a-t-il déjà été envoyé ?
  const empreinte = typeof donnees.empreinte === "string" && /^[0-9a-f]{64}$/.test(donnees.empreinte) ? donnees.empreinte : null;
  if (empreinte && !donnees.forcer) {
    const { data: deja } = await dbAdmin()
      .from("fichiers")
      .select("nom, articles(titre), categories(titre)")
      .eq("empreinte", empreinte)
      .eq("etat", "pret")
      .limit(1);
    const d = (deja ?? [])[0] as unknown as { nom: string; articles: { titre: string } | null; categories: { titre: string } | null } | undefined;
    if (d) {
      const ou = d.articles?.titre ? `l'article « ${d.articles.titre} »` : d.categories?.titre ? `la catégorie « ${d.categories.titre} »` : "la bibliothèque";
      return { ok: false, doublon: d.nom, message: `« ${nom} » est identique à « ${d.nom} », déjà présent dans ${ou}.` };
    }
  }

  const id = randomUUID();
  const chemin = `${cible.type}/${cible.id}/${id}.${TYPES_FICHIERS[typeMime].extension}`;
  const { error } = await dbAdmin()
    .from("fichiers")
    .insert({
      id,
      nom,
      chemin,
      type_mime: typeMime,
      taille,
      etat: "envoi",
      dans_liste: donnees.dansListe !== false,
      statut_texte: typeMime === "application/pdf" ? "en_attente" : "non_applicable",
      empreinte,
      ...(cible.type === "article" ? { article_id: cible.id } : { categorie_id: cible.id }),
    });
  if (error) return { ok: false, message: "Préparation de l'envoi impossible." };

  const lien = await creerLienEnvoi(chemin);
  if (!lien) {
    await dbAdmin().from("fichiers").delete().eq("id", id);
    return { ok: false, message: "L'espace de stockage ne répond pas. Vérifie que le fichier 004_fichiers.sql a bien été exécuté dans Supabase." };
  }
  return { ok: true, id, url: lien.url, typeMime };
}

export async function confirmerEnvoi(donnees: { id: string }): Promise<Resultat<{ nom: string; typeMime: string }>> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.id)) return { ok: false, message: "Fichier introuvable." };
  const { data: fichier } = await dbAdmin().from("fichiers").select("id, nom, chemin, type_mime, etat").eq("id", donnees.id).maybeSingle();
  if (!fichier) return { ok: false, message: "Fichier introuvable." };

  const octets = await lireDebut(fichier.chemin, 16);
  if (!octets || !signatureValide(octets, fichier.type_mime)) {
    await supprimerObjets([fichier.chemin]);
    await dbAdmin().from("fichiers").delete().eq("id", fichier.id);
    await journaliser("fichier_refuse", { nom: fichier.nom, type: fichier.type_mime });
    return { ok: false, message: `« ${fichier.nom} » a été refusé : son contenu ne correspond pas à un fichier ${TYPES_FICHIERS[fichier.type_mime]?.libelle ?? "valide"}.` };
  }
  await dbAdmin().from("fichiers").update({ etat: "pret" }).eq("id", fichier.id);
  await journaliser("fichier_envoye", { nom: fichier.nom });
  rafraichir();
  return { ok: true, nom: fichier.nom, typeMime: fichier.type_mime };
}

/** Annule un envoi qui a échoué en route (le fichier partiellement envoyé est effacé). */
export async function annulerEnvoi(donnees: { id: string }): Promise<void> {
  if (!(await sessionCreateur()) || !estUuid(donnees.id)) return;
  const { data } = await dbAdmin().from("fichiers").select("chemin, etat").eq("id", donnees.id).maybeSingle();
  if (!data || data.etat !== "envoi") return;
  await supprimerObjets([data.chemin]);
  await dbAdmin().from("fichiers").delete().eq("id", donnees.id);
}

const LIMITE_TEXTE_PAGE = 200_000;

/** Texte des pages d'un PDF, extrait dans le navigateur du créateur (par lots). */
export async function enregistrerTextePages(donnees: {
  id: string;
  pages: { numero: number; texte: string; ocr?: boolean }[];
}): Promise<Resultat> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.id) || !Array.isArray(donnees.pages) || donnees.pages.length > 50) return { ok: false, message: "Données invalides." };
  const lignes = donnees.pages
    .filter((p) => Number.isInteger(p.numero) && p.numero >= 1 && p.numero <= 100000)
    .map((p) => ({
      fichier_id: donnees.id,
      numero: p.numero,
      texte: String(p.texte ?? "").replace(/\u0000/g, "").slice(0, LIMITE_TEXTE_PAGE),
      ocr: p.ocr === true,
    }));
  if (lignes.length === 0) return { ok: true };
  const { error } = await dbAdmin().from("pages_fichiers").upsert(lignes, { onConflict: "fichier_id,numero" });
  if (error) return { ok: false, message: "Enregistrement du texte impossible." };
  return { ok: true };
}

export async function terminerExtraction(donnees: { id: string; pages: number; pagesSansTexte: number; ocr: boolean }): Promise<Resultat> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.id)) return { ok: false, message: "Fichier introuvable." };
  const pages = Math.max(0, Math.min(100000, Math.floor(Number(donnees.pages) || 0)));
  const statut = donnees.ocr ? "ocr" : donnees.pagesSansTexte > 0 ? "scanne" : "extrait";
  await dbAdmin().from("fichiers").update({ pages, statut_texte: statut }).eq("id", donnees.id);
  rafraichir();
  return { ok: true };
}

/** Numéros des pages d'un PDF sans texte (à reconnaître par OCR). */
export async function pagesSansTexte(donnees: { id: string }): Promise<number[]> {
  if (!(await sessionCreateur()) || !estUuid(donnees.id)) return [];
  const { data } = await dbAdmin().from("pages_fichiers").select("numero, texte").eq("fichier_id", donnees.id).order("numero");
  return (data ?? []).filter((p) => String(p.texte).trim().length < 25).map((p) => p.numero as number);
}

export async function renommerFichier(donnees: { id: string; nom: string }): Promise<Resultat> {
  if (!(await sessionCreateur())) return nonConnecte;
  const nom = ligne(String(donnees.nom ?? "")).slice(0, 200);
  if (!estUuid(donnees.id) || !nom) return { ok: false, message: "Donne un nom au fichier." };
  await dbAdmin().from("fichiers").update({ nom }).eq("id", donnees.id);
  rafraichir();
  return { ok: true };
}

export async function supprimerFichier(formData: FormData): Promise<void> {
  if (!(await sessionCreateur())) return;
  const id = formData.get("id");
  if (!estUuid(id)) return;
  const { data } = await dbAdmin().from("fichiers").select("chemin, nom").eq("id", id).maybeSingle();
  if (!data) return;
  await supprimerObjets([data.chemin]);
  await dbAdmin().from("fichiers").delete().eq("id", id);
  await journaliser("fichier_supprime", { nom: data.nom });
  rafraichir();
}

// ======================================================================
// Annotations des PDF
// ======================================================================

export type Annotation = {
  id: string;
  page: number;
  type: "surlignage" | "note";
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  couleur: string;
  texte: string;
  visible: boolean;
};

const borne = (v: unknown) => Math.max(0, Math.min(1, Number(v) || 0));

export async function creerAnnotation(donnees: Omit<Annotation, "id"> & { fichierId: string }): Promise<Resultat<{ annotation: Annotation }>> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.fichierId)) return { ok: false, message: "Fichier introuvable." };
  const type = donnees.type === "note" ? "note" : "surlignage";
  const couleur = COULEURS.some((c) => c.cle === donnees.couleur) ? donnees.couleur : "jaune";
  const { data, error } = await dbAdmin()
    .from("annotations")
    .insert({
      fichier_id: donnees.fichierId,
      page: Math.max(1, Math.floor(Number(donnees.page) || 1)),
      type,
      x: borne(donnees.x),
      y: borne(donnees.y),
      largeur: borne(donnees.largeur),
      hauteur: borne(donnees.hauteur),
      couleur,
      texte: String(donnees.texte ?? "").slice(0, 4000),
      visible: donnees.visible !== false,
    })
    .select("id, page, type, x, y, largeur, hauteur, couleur, texte, visible")
    .single();
  if (error || !data) return { ok: false, message: "Annotation impossible à enregistrer." };
  return { ok: true, annotation: data as Annotation };
}

export async function modifierAnnotation(donnees: { id: string; texte?: string; visible?: boolean; couleur?: string }): Promise<Resultat> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.id)) return { ok: false, message: "Annotation introuvable." };
  const changements: Record<string, unknown> = {};
  if (typeof donnees.texte === "string") changements.texte = donnees.texte.slice(0, 4000);
  if (typeof donnees.visible === "boolean") changements.visible = donnees.visible;
  if (typeof donnees.couleur === "string" && COULEURS.some((c) => c.cle === donnees.couleur)) changements.couleur = donnees.couleur;
  await dbAdmin().from("annotations").update(changements).eq("id", donnees.id);
  return { ok: true };
}

export async function supprimerAnnotation(donnees: { id: string }): Promise<Resultat> {
  if (!(await sessionCreateur())) return nonConnecte;
  if (!estUuid(donnees.id)) return { ok: false, message: "Annotation introuvable." };
  await dbAdmin().from("annotations").delete().eq("id", donnees.id);
  return { ok: true };
}
