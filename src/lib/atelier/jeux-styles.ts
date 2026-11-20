/**
 * Le Calame — jeux de styles : l'allure complète d'un document (polices, tailles, interlignes,
 * et quelques réglages de composition) en un clic.
 */
import { STYLES_PAR_DEFAUT, structuredCloneSimple, type ReglagesPage, type Styles } from "./modele";

export const JEUX_STYLES = [
  { cle: "origine", libelle: "D'origine", description: "Garamond et Bricolage : l'allure du Calame" },
  { cle: "academique", libelle: "Académique", description: "Mémoire ou thèse : Crimson 12 pt, interligne 1,5, titres numérotés" },
  { cle: "livre", libelle: "Livre", description: "Literata justifiée, alinéa, lettrine et césure" },
  { cle: "lettre", libelle: "Lettre", description: "Sans empattement, paragraphes aérés" },
  { cle: "moderne", libelle: "Moderne", description: "Titres affirmés, texte clair et espacé" },
] as const;
export type CleJeu = (typeof JEUX_STYLES)[number]["cle"];

const JEUX: Record<CleJeu, { styles: Styles; reglages: Partial<ReglagesPage> }> = {
  origine: {
    styles: STYLES_PAR_DEFAUT,
    reglages: { numeroterTitres: false, alinea: 0, lettrine: false, cesure: false, justifier: false },
  },
  academique: {
    styles: {
      corps: { police: "crimson", taille: 12, interligne: 1.5, graisse: 400, couleur: "#111320", avant: 0, apres: 6 },
      titre1: { police: "crimson", taille: 17, interligne: 1.25, graisse: 700, couleur: "#111320", avant: 18, apres: 8 },
      titre2: { police: "crimson", taille: 14, interligne: 1.25, graisse: 700, couleur: "#111320", avant: 14, apres: 6 },
      titre3: { police: "crimson", taille: 12.5, interligne: 1.3, graisse: 600, couleur: "#111320", avant: 10, apres: 4 },
      citation: { police: "crimson", taille: 11, interligne: 1.35, graisse: 400, couleur: "#33384f", avant: 8, apres: 8 },
    },
    reglages: { numeroterTitres: true, alinea: 0, lettrine: false, cesure: true, justifier: true },
  },
  livre: {
    styles: {
      corps: { police: "literata", taille: 11, interligne: 1.45, graisse: 400, couleur: "#1d1b18", avant: 0, apres: 0 },
      titre1: { police: "literata", taille: 21, interligne: 1.2, graisse: 600, couleur: "#1d1b18", avant: 28, apres: 14 },
      titre2: { police: "literata", taille: 15, interligne: 1.25, graisse: 600, couleur: "#1d1b18", avant: 18, apres: 8 },
      titre3: { police: "literata", taille: 12, interligne: 1.3, graisse: 600, couleur: "#1d1b18", avant: 12, apres: 4 },
      citation: { police: "literata", taille: 10.5, interligne: 1.4, graisse: 400, couleur: "#4a4540", avant: 8, apres: 8 },
    },
    reglages: { numeroterTitres: false, alinea: 6, lettrine: true, cesure: true, justifier: true },
  },
  lettre: {
    styles: {
      corps: { police: "sans", taille: 11, interligne: 1.45, graisse: 400, couleur: "#1a1d2e", avant: 0, apres: 10 },
      titre1: { police: "sans", taille: 16, interligne: 1.25, graisse: 700, couleur: "#1a1d2e", avant: 16, apres: 8 },
      titre2: { police: "sans", taille: 13, interligne: 1.3, graisse: 700, couleur: "#1a1d2e", avant: 12, apres: 6 },
      titre3: { police: "sans", taille: 11.5, interligne: 1.3, graisse: 600, couleur: "#1a1d2e", avant: 10, apres: 4 },
      citation: { police: "sans", taille: 10.5, interligne: 1.45, graisse: 400, couleur: "#4a5068", avant: 8, apres: 8 },
    },
    reglages: { numeroterTitres: false, alinea: 0, lettrine: false, cesure: false, justifier: false },
  },
  moderne: {
    styles: {
      corps: { police: "sans", taille: 11, interligne: 1.6, graisse: 400, couleur: "#20243a", avant: 0, apres: 9 },
      titre1: { police: "display", taille: 24, interligne: 1.1, graisse: 800, couleur: "#0d1640", avant: 22, apres: 10 },
      titre2: { police: "display", taille: 17, interligne: 1.2, graisse: 700, couleur: "#0d1640", avant: 16, apres: 6 },
      titre3: { police: "display", taille: 13.5, interligne: 1.25, graisse: 700, couleur: "#33407a", avant: 12, apres: 4 },
      citation: { police: "serif", taille: 12, interligne: 1.5, graisse: 400, couleur: "#424a6b", avant: 10, apres: 10 },
    },
    reglages: { numeroterTitres: false, alinea: 0, lettrine: false, cesure: false, justifier: false },
  },
};

/** Ce qu'un jeu change dans les réglages d'un document (styles compris). */
export function reglagesDuJeu(cle: string): Partial<ReglagesPage> | null {
  const jeu = JEUX[cle as CleJeu];
  if (!jeu) return null;
  return { styles: structuredCloneSimple(jeu.styles), ...jeu.reglages };
}

/** Le jeu dont les styles correspondent exactement à ceux du document (pour l'afficher comme choisi). */
export function jeuActuel(reglages: Pick<ReglagesPage, "styles">): CleJeu | null {
  const empreinte = JSON.stringify(reglages.styles);
  for (const j of JEUX_STYLES) if (JSON.stringify(JEUX[j.cle].styles) === empreinte) return j.cle;
  return null;
}
