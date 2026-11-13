/**
 * Traduit l'échec d'ouverture d'un PDF en message utile.
 * pdf.js nomme ses erreurs : on s'en sert pour dire au lecteur ce qui se passe vraiment,
 * au lieu de lui demander de recharger une page qui échouera pareil.
 */
export function messageDouverture(e: unknown): string {
  const nom = (e as { name?: string })?.name ?? "";
  const texte = String((e as { message?: string })?.message ?? "");
  if (nom === "PasswordException" || /password/i.test(texte)) {
    return "Ce PDF est protégé par un mot de passe : il ne peut pas être affiché ici. Télécharge-le pour l'ouvrir avec ton lecteur habituel.";
  }
  if (nom === "InvalidPDFException" || /invalid pdf/i.test(texte)) {
    return "Ce fichier est abîmé ou n'est pas un vrai PDF. Renvoie-le depuis l'espace créateur.";
  }
  if (nom === "MissingPDFException") {
    return "Le document est introuvable. Il a peut-être été supprimé.";
  }
  if (/WebAssembly|wasm/i.test(texte)) {
    return "Ce PDF utilise un format d'image que ce navigateur refuse de décoder ici. Télécharge-le pour le lire.";
  }
  if (nom === "UnexpectedResponseException" || /fetch|network|load failed|aborted/i.test(texte)) {
    return "Le document n'a pas pu être téléchargé en entier : connexion trop lente ou interrompue. Réessaie, ou télécharge-le pour le lire hors ligne.";
  }
  return "Le document n'a pas pu être ouvert. Réessaie, ou télécharge-le pour le lire avec ton lecteur habituel.";
}
