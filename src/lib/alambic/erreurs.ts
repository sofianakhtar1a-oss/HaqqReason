/*
 * Erreurs que les outils savent reconnaître pour proposer une solution plutôt qu'une impasse.
 */

export const MESSAGE_PDF_PROTEGE = "Ce PDF est protégé par un mot de passe. Si tu le connais, déverrouille-le d'abord : il pourra ensuite être modifié ici.";
export const MESSAGE_ZIP_PROTEGE = "Ce ZIP est protégé par un mot de passe. Si tu le connais, l'outil « Déverrouiller » l'ouvre.";

/** Un PDF qui demande un mot de passe pour s'ouvrir. */
export class PdfProtege extends Error {
  constructor(message = MESSAGE_PDF_PROTEGE) {
    super(message);
    this.name = "PdfProtege";
  }
}

/** Un mot de passe donné qui n'ouvre pas le fichier. */
export class MotDePasseFaux extends Error {
  constructor(message = "Ce mot de passe n'ouvre pas le fichier. Vérifie les majuscules, les accents et la disposition du clavier.") {
    super(message);
    this.name = "MotDePasseFaux";
  }
}

export const estPdfProtege = (e: unknown) => e instanceof PdfProtege || (e as { name?: string } | null)?.name === "PdfProtege";
export const estMotDePasseFaux = (e: unknown) => e instanceof MotDePasseFaux || (e as { name?: string } | null)?.name === "MotDePasseFaux";
export const estZipProtege = (e: unknown) => (e as { message?: string } | null)?.message === MESSAGE_ZIP_PROTEGE;

/** Un PDF sans texte (scanné) : il se lit avec l'outil « Reconnaître ». */
export class PdfScanne extends Error {
  constructor(message = "Ce PDF ne contient pas de texte : c'est sans doute un document scanné (une image de texte). L'outil « Reconnaître » sait le lire.") {
    super(message);
    this.name = "PdfScanne";
  }
}
export const estPdfScanne = (e: unknown) => e instanceof PdfScanne || (e as { name?: string } | null)?.name === "PdfScanne";
