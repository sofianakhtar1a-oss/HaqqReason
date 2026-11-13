import "server-only";
import { dbAdmin, dbPublic } from "../supabase";
import { lireReglages } from "../reglages-donnees";
import { calculerVecteurs, serviceActif } from "./service";

/*
 * Recherche par le sens, côté lecteur.
 * La question est transformée en vecteur, puis comparée à ceux des articles.
 * La fonction SQL s'exécute avec les droits de l'appelant : un brouillon ne remonte
 * jamais à un lecteur, même si son sens correspond parfaitement.
 */

export type ResultatSens = { id: string; titre: string; resume: string; score: number; extrait: string };

/** Au-dessous, la proximité est trop faible pour être montrée. */
const SEUIL = 0.28;

export async function rechercherParLeSens(question: string, mode: "public" | "createur" = "public", limite = 6): Promise<ResultatSens[]> {
  const propre = question.trim().slice(0, 600);
  if (propre.length < 3 || !serviceActif()) return [];
  if (!(await lireReglages()).recherche_sens) return [];

  const vecteurs = await calculerVecteurs([propre]);
  if (!vecteurs.ok || vecteurs.vecteurs.length === 0) return [];

  const base = mode === "createur" ? dbAdmin() : dbPublic();
  const { data, error } = await base.rpc("rechercher_sens", { p_vecteur: vecteurs.vecteurs[0], p_limite: limite, p_minimum: SEUIL });
  if (error || !Array.isArray(data)) return [];
  return (data as ResultatSens[]).map((r) => ({ ...r, score: Number(r.score) }));
}
