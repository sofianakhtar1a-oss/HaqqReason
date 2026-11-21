import { chargerNiveau } from "./entrainement/index";
import { SECTIONS } from "./index";
import { lireRef, refExercice } from "./suivi";
import { type Exercice, type Lecon, type Niveau, type Section, typeExercice } from "./types";

/*
 * La banque d'exercices des Règles : retrouver un exercice par sa référence (carnet d'erreurs), et tirer
 * des exercices d'un niveau (examens, test de positionnement). Les exercices du défi sont toujours là ;
 * ceux de l'entraînement se chargent par fichier (section et niveau).
 */

export type ExerciceRange = { ref: string; exercice: Exercice; lecon: Lecon; section: Section };

/** Les exercices désignés par leurs références, dans le même ordre (ceux qui n'existent plus sont omis). */
export async function exercicesDe(refs: string[]): Promise<ExerciceRange[]> {
  const lues = refs.map((ref) => ({ ref, r: lireRef(ref) })).filter((x) => x.r);
  const aCharger = new Map<string, Promise<Record<string, Exercice[]>>>();
  for (const { r } of lues) {
    const section = SECTIONS.find((s) => s.id === r!.section);
    const lecon = section?.lecons.find((l) => l.id === r!.lecon);
    if (section && lecon && r!.source === "e") {
      const cle = `${section.id}/${lecon.niveau}`;
      if (!aCharger.has(cle)) aCharger.set(cle, chargerNiveau(section.id, lecon.niveau));
    }
  }
  const fichiers = new Map<string, Record<string, Exercice[]>>();
  await Promise.all([...aCharger].map(async ([cle, p]) => fichiers.set(cle, await p.catch(() => ({})))));
  const sortie: ExerciceRange[] = [];
  for (const { ref, r } of lues) {
    const section = SECTIONS.find((s) => s.id === r!.section);
    const lecon = section?.lecons.find((l) => l.id === r!.lecon);
    if (!section || !lecon) continue;
    const exercice = r!.source === "d" ? lecon.defi[r!.rang] : fichiers.get(`${section.id}/${lecon.niveau}`)?.[lecon.id]?.[r!.rang];
    if (exercice) sortie.push({ ref, exercice, lecon, section });
  }
  return sortie;
}

/** Tous les exercices d'un niveau d'une section (défi et entraînement), avec leurs références. */
export async function exercicesDuNiveau(sectionId: Section["id"], niveau: Niveau): Promise<ExerciceRange[]> {
  const section = SECTIONS.find((s) => s.id === sectionId)!;
  const lot = await chargerNiveau(sectionId, niveau);
  const sortie: ExerciceRange[] = [];
  for (const lecon of section.lecons.filter((l) => l.niveau === niveau)) {
    lecon.defi.forEach((exercice, k) => sortie.push({ ref: refExercice(section.id, lecon.id, "d", k), exercice, lecon, section }));
    (lot[lecon.id] ?? []).forEach((exercice, k) => sortie.push({ ref: refExercice(section.id, lecon.id, "e", k), exercice, lecon, section }));
  }
  return sortie;
}

type Alea = () => number;
export function melangerAvec<T>(l: T[], alea: Alea = Math.random): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/**
 * Un examen : au moins un exercice par leçon du niveau, puis des exercices au hasard jusqu'au nombre voulu,
 * de préférence ceux d'entraînement et d'expert, sans « toucher » (moins discriminant), dans l'ordre des leçons.
 */
export function composerExamen(tous: ExerciceRange[], nombre = 30, alea: Alea = Math.random): ExerciceRange[] {
  const utiles = tous.filter((x) => typeExercice(x.exercice) !== "toucher");
  const poids = (x: ExerciceRange) => (x.exercice.d ?? 2) + (/\/e\d+$/.test(x.ref) ? 1 : 0);
  const parLecon = new Map<string, ExerciceRange[]>();
  for (const x of melangerAvec(utiles, alea)) parLecon.set(x.lecon.id, [...(parLecon.get(x.lecon.id) ?? []), x]);
  const choisis = new Set<ExerciceRange>();
  for (const liste of parLecon.values()) {
    const meilleur = [...liste].sort((a, b) => poids(b) - poids(a))[0];
    if (meilleur && choisis.size < nombre) choisis.add(meilleur);
  }
  const reste = melangerAvec(utiles.filter((x) => !choisis.has(x) && (x.exercice.d ?? 2) >= 2), alea);
  for (const x of reste) {
    if (choisis.size >= nombre) break;
    choisis.add(x);
  }
  const ordre = new Map(tous.map((x, i) => [x.ref, i]));
  return [...choisis].sort((a, b) => (ordre.get(a.ref) ?? 0) - (ordre.get(b.ref) ?? 0));
}
