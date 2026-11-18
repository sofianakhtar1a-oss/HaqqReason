/*
 * Les plafonds de l'Assistant. La consommation de Claude est payée par chaque utilisateur (sa clé),
 * mais le serveur, la base et le stockage restent ceux du site : ces plafonds les protègent.
 * Module partagé : le navigateur les affiche et les applique avant d'envoyer.
 */

export const LIMITES = {
  /** Une question (ou un texte collé) : environ 40 000 jetons. */
  questionMax: 100_000,
  /** Fichiers lus d'un coup dans ChatPDF. */
  pdfParEnvoi: 20,
  /** Un PDF plus lourd n'est pas ouvert (il est lu dans le navigateur, en mémoire). */
  fichierMaxOctets: 250 * 1024 * 1024,
  /** Documents dans une même conversation. */
  documentsParConversation: 30,
  /** Texte extrait d'un seul PDF (≈ 1 200 000 jetons, plus que la fenêtre de Claude)… */
  texteDocumentMax: 3_000_000,
  /** …et son poids en octets (UTF-8) : comme les plus gros objets que le site range déjà dans la base. */
  texteDocumentOctets: 3_000_000,
  /** Texte de tous les PDF d'un compte. */
  texteCompteMax: 12_000_000,
  /** Pages lues par la reconnaissance de texte (OCR) dans un seul PDF : quelques secondes chacune. */
  pagesOcrMax: 60,
  conversationsMax: 500,
  /** Rythme d'envoi des questions. */
  appelsDixMinutes: 40,
  appelsJour: 500,
  /** Essais de vérification d'une clé par heure. */
  verificationsHeure: 8,
  /** Messages relus pour l'historique d'une conversation. */
  messagesHistorique: 200,
  /** Jetons d'historique renvoyés à Claude à chaque question. */
  jetonsHistorique: 120_000,
} as const;

export function formaterCaracteres(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}
