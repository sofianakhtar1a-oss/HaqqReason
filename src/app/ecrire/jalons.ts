"use client";

import { lireMois, moisLocaux, serieEnCours, totalDuJour } from "@/lib/atelier/journal-ecriture";
import { lirePreferences, modifierPreferences } from "@/lib/atelier/preferences";

/** Les jalons que le Calame fête une fois, avec une petite annonce. */
export const JALONS: { cle: string; libelle: string }[] = [
  { cle: "mots-1000", libelle: "Premiers 1 000 mots écrits" },
  { cle: "mots-10000", libelle: "10 000 mots écrits" },
  { cle: "mots-50000", libelle: "50 000 mots : un livre entier" },
  { cle: "mots-100000", libelle: "100 000 mots écrits" },
  { cle: "pages-100", libelle: "Un document de 100 pages" },
  { cle: "termine-1", libelle: "Un premier document terminé" },
  { cle: "serie-7", libelle: "7 jours d'écriture de suite" },
  { cle: "serie-30", libelle: "30 jours d'écriture de suite" },
];

/** Total des mots écrits, tous les mois connus. */
export function motsEcritsEnTout(): number {
  let total = 0;
  for (const mois of moisLocaux()) {
    const contenu = lireMois(mois);
    for (const jour of Object.keys(contenu)) total += totalDuJour(jour, contenu).mots;
  }
  return total;
}

/** Les jalons atteints à l'instant (et pas encore fêtés). Ils sont aussitôt notés comme fêtés. */
export function nouveauxJalons(contexte: { pages: number; termine: boolean }): { cle: string; libelle: string }[] {
  const prefs = lirePreferences();
  const deja = new Set(prefs.jalons);
  const mots = motsEcritsEnTout();
  const serie = serieEnCours(Math.max(1, prefs.objectifQuotidien));
  const atteints = new Set<string>();
  for (const seuil of [1000, 10_000, 50_000, 100_000]) if (mots >= seuil) atteints.add(`mots-${seuil}`);
  if (contexte.pages >= 100) atteints.add("pages-100");
  if (contexte.termine) atteints.add("termine-1");
  if (serie >= 7) atteints.add("serie-7");
  if (serie >= 30) atteints.add("serie-30");
  const nouveaux = JALONS.filter((j) => atteints.has(j.cle) && !deja.has(j.cle));
  if (nouveaux.length > 0) modifierPreferences((p) => ({ jalons: [...p.jalons, ...nouveaux.map((j) => j.cle)] }));
  return nouveaux;
}
