"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { annoncer, choisirPaysDuJour, classerSignalement, corrigerFiche, editionPortulan, mettreAJourPopulations, oublierPaysDuJour, retirerNouveaute } from "@/lib/monde/atelier";
import { PAR_CODE } from "@/lib/monde/atlas";
import { CHAMPS_FICHE, type ChampFiche } from "@/lib/monde/edition";
import { RECITS } from "@/lib/monde/recits";
import { sessionCreateur } from "@/lib/session";

export type Reponse = { ok: true; message?: string } | { ok: false; erreur: string };
const SESSION = "Ta session a expiré. Reconnecte-toi, puis recommence.";
const echec = (e: unknown): Reponse => ({ ok: false, erreur: e instanceof Error ? e.message : "L'opération a échoué." });

function rafraichir() {
  revalidatePath("/createur/portulan");
}

/** Le texte d'origine d'une fiche et les corrections déjà faites, pour le formulaire. */
export async function lireFiche(code: string): Promise<{ ok: true; origine: Partial<Record<ChampFiche, string>>; corrections: Partial<Record<ChampFiche, string>> } | { ok: false; erreur: string }> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  if (!PAR_CODE.has(code)) return { ok: false, erreur: "Pays inconnu." };
  const r = RECITS[code] ?? {};
  const origine: Partial<Record<ChampFiche, string>> = {};
  for (const c of CHAMPS_FICHE) if (typeof r[c] === "string") origine[c] = r[c];
  const edition = await editionPortulan();
  return { ok: true, origine, corrections: edition.fiches[code] ?? {} };
}

export async function enregistrerFiche(code: string, champs: Record<string, string>): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await corrigerFiche(code, champs);
    await journaliser("portulan.fiche", { code });
    rafraichir();
    return { ok: true, message: "La fiche est corrigée : les joueurs la voient d'ici une minute." };
  } catch (e) {
    return echec(e);
  }
}

export async function enregistrerPaysDuJour(jour: string, code: string, anecdote: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await choisirPaysDuJour(jour, code, anecdote);
    await journaliser("portulan.pays-du-jour", { jour, code });
    rafraichir();
    return { ok: true, message: "C'est noté pour ce jour-là." };
  } catch (e) {
    return echec(e);
  }
}

export async function retirerPaysDuJour(jour: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await oublierPaysDuJour(jour);
    rafraichir();
    return { ok: true };
  } catch (e) {
    return echec(e);
  }
}

export async function publierNouveaute(titre: string, texte: string, le: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await annoncer(titre, texte, le);
    await journaliser("portulan.nouveaute", { titre });
    rafraichir();
    return { ok: true, message: "La nouveauté est publiée." };
  } catch (e) {
    return echec(e);
  }
}

export async function effacerNouveaute(id: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await retirerNouveaute(id);
    rafraichir();
    return { ok: true };
  } catch (e) {
    return echec(e);
  }
}

export async function marquerSignalement(id: string, traite: boolean): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    await classerSignalement(id, traite);
    rafraichir();
    return { ok: true };
  } catch (e) {
    return echec(e);
  }
}

export async function actualiserPopulations(): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    const r = await mettreAJourPopulations(true);
    await journaliser("portulan.population", { pays: r.faits });
    rafraichir();
    return { ok: true, message: `${r.faits} pays mis à jour depuis la Banque mondiale.` };
  } catch (e) {
    return echec(e);
  }
}
