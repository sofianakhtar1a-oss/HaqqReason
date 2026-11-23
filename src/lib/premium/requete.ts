import "server-only";
import { NextResponse } from "next/server";

export const SANS_CACHE = { "Cache-Control": "private, no-store" };

export const refus = (statut: number, erreur: string, extra: Record<string, unknown> = {}) => NextResponse.json({ erreur, ...extra }, { status: statut, headers: SANS_CACHE });

/** Lit un petit corps JSON (quelques champs), sans jamais accepter un envoi démesuré. */
export async function lireJson(requete: Request, max = 4096): Promise<Record<string, unknown> | null> {
  const taille = Number(requete.headers.get("content-length") ?? "0");
  if (taille > max) return null;
  try {
    const texte = await requete.text();
    if (texte.length > max) return null;
    const v = texte ? (JSON.parse(texte) as unknown) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Un frein simple, par compte et par instance : de quoi décourager les clics en rafale. */
const traces = new Map<string, number[]>();
export function tropDeDemandes(cle: string, max: number, fenetreMs: number): boolean {
  const maintenant = Date.now();
  const liste = (traces.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (liste.length >= max) {
    traces.set(cle, liste);
    return true;
  }
  liste.push(maintenant);
  if (traces.size > 10_000) traces.clear();
  traces.set(cle, liste);
  return false;
}
