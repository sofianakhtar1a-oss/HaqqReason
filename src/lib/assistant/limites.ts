/*
 * Les plafonds de l'Assistant. Les réponses sont prises sur le crédit gratuit du site auprès de la
 * passerelle IA, partagé par tous : chaque compte Google a donc son quota de questions par jour et
 * sa part du crédit par mois. Les autres plafonds protègent le serveur, la base et le stockage.
 * Module partagé : le navigateur les affiche et les applique avant d'envoyer.
 */

export const LIMITES = {
  /** Questions gratuites par compte et par jour (remise à zéro à minuit, heure de Paris). */
  questionsJour: 30,
  /** Part du crédit gratuit qu'un compte peut consommer par mois, en dollars (estimation du site). */
  budgetMoisCompte: 0.5,
  /** Rythme d'envoi des questions. */
  appelsDixMinutes: 12,
  /** Une question (ou un texte collé) : environ 16 000 jetons. */
  questionMax: 40_000,
  /** Fichiers lus d'un coup dans ChatPDF. */
  pdfParEnvoi: 20,
  /** Un PDF plus lourd n'est pas ouvert (il est lu dans le navigateur, en mémoire). */
  fichierMaxOctets: 250 * 1024 * 1024,
  /** Documents dans une même conversation. */
  documentsParConversation: 30,
  /** Texte extrait d'un seul PDF… */
  texteDocumentMax: 3_000_000,
  /** …et son poids en octets (UTF-8) : comme les plus gros objets que le site range déjà dans la base. */
  texteDocumentOctets: 3_000_000,
  /** Texte de tous les PDF d'un compte. */
  texteCompteMax: 12_000_000,
  /** Pages lues par la reconnaissance de texte (OCR) dans un seul PDF : quelques secondes chacune. */
  pagesOcrMax: 60,
  conversationsMax: 500,
  /** Messages relus pour l'historique d'une conversation. */
  messagesHistorique: 200,
  /** Jetons d'historique renvoyés à l'IA à chaque question. */
  jetonsHistorique: 30_000,
} as const;

export function formaterCaracteres(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}

/** Ce que le compte a encore aujourd'hui et ce mois-ci (calculé par le serveur, affiché sous la saisie). */
export type Quota = {
  questionsRestantes: number;
  questionsJour: number;
  /** Part du crédit du mois déjà utilisée, de 0 à 1. */
  partMois: number;
};

export function calculerQuota(b: { aujourdhui: number; moisCout: number }): Quota {
  return {
    questionsRestantes: Math.max(0, LIMITES.questionsJour - b.aujourdhui),
    questionsJour: LIMITES.questionsJour,
    partMois: Math.min(1, Math.max(0, b.moisCout / LIMITES.budgetMoisCompte)),
  };
}
