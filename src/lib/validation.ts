/** Contrôles des données reçues des formulaires. Module partagé entre le serveur et le navigateur. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function estUuid(valeur: unknown): valeur is string {
  return typeof valeur === "string" && UUID.test(valeur);
}

export const LIMITES = {
  titreCategorie: 200,
  descriptionCategorie: 600,
  titreArticle: 300,
  resume: 6000,
  texte: 300_000,
  etiquette: 60,
  etiquettesParArticle: 20,
} as const;

/** Retire les accents : « Véracité » -> « Veracite ». */
export function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** « La défense de l'islam ! » -> « la-defense-de-l-islam » (ou « sans-titre » si rien ne reste). */
export function slugifier(texte: string): string {
  const slug = sansAccents(texte)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "sans-titre";
}

/** Nettoie un texte sur une ligne : espaces superflus retirés, caractères invisibles supprimés. */
export function ligne(texte: string): string {
  return texte.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

/** Clé de dédoublonnage d'une étiquette : « Trinité », « trinite » et « TRINITÉ » donnent la même clé. */
export function cleEtiquette(nom: string): string {
  return sansAccents(ligne(nom)).toLowerCase().slice(0, LIMITES.etiquette);
}

/** « Trinité, Évangiles ; trinite » -> ["Trinité", "Évangiles"] (doublons retirés, ordre conservé). */
export function lireEtiquettes(saisie: string): string[] {
  const vues = new Set<string>();
  const resultat: string[] = [];
  for (const brut of saisie.split(/[,;\n]/)) {
    const nom = ligne(brut).slice(0, LIMITES.etiquette);
    const cle = cleEtiquette(nom);
    if (!cle || vues.has(cle)) continue;
    vues.add(cle);
    resultat.push(nom);
  }
  return resultat;
}
