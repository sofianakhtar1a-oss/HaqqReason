/** Icônes proposées pour les catégories (le nom est stocké en base, l'image est choisie à l'affichage). */
export const ICONES_CATEGORIE = [
  { cle: "dossier", libelle: "Dossier" },
  { cle: "livre", libelle: "Livre" },
  { cle: "parchemin", libelle: "Parchemin" },
  { cle: "plume", libelle: "Plume" },
  { cle: "balance", libelle: "Balance" },
  { cle: "bouclier", libelle: "Bouclier" },
  { cle: "lumiere", libelle: "Lumière" },
  { cle: "lune", libelle: "Croissant" },
  { cle: "etoile", libelle: "Étoile" },
  { cle: "sablier", libelle: "Sablier" },
  { cle: "monument", libelle: "Monument" },
  { cle: "globe", libelle: "Monde" },
  { cle: "dialogue", libelle: "Dialogue" },
  { cle: "cle", libelle: "Clé" },
  { cle: "flamme", libelle: "Flamme" },
  { cle: "loupe", libelle: "Enquête" },
] as const;

export type CleIcone = (typeof ICONES_CATEGORIE)[number]["cle"];

export function estIcone(valeur: string): valeur is CleIcone {
  return ICONES_CATEGORIE.some((icone) => icone.cle === valeur);
}
