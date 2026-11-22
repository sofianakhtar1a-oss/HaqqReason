/*
 * « Que veux-tu faire ? » — les besoins courants, dits avec les mots de tout le monde, et l'outil
 * (avec ses réglages) qui y répond. Pur : testé dans tests/test-alambic-studio.mts.
 */
import type { Outil } from "./outils";

export type Intention = {
  id: string;
  /** Ce que la personne veut faire, en une phrase. */
  titre: string;
  outil: Outil;
  /** Autres façons de le dire (synonymes, formats, fautes courantes). */
  mots: string;
  /** Pour Convertir : le format d'arrivée à proposer. */
  cible?: string;
  /** Réglage particulier de l'outil (préréglage). */
  reglage?: string;
};

export const INTENTIONS: Intention[] = [
  { id: "word-en-pdf", titre: "Transformer un Word en PDF", outil: "convertir", cible: "pdf", mots: "docx doc word convertir enregistrer exporter pdf odt libreoffice" },
  { id: "pdf-en-word", titre: "Transformer un PDF en Word modifiable", outil: "convertir", cible: "docx", mots: "pdf word docx modifier editer convertir texte" },
  { id: "photos-en-pdf", titre: "Réunir des photos ou des scans en un seul PDF", outil: "fusionner", mots: "images photos jpg jpeg png scans tickets factures pdf assembler combiner regrouper rassembler un seul" },
  { id: "fusionner-pdf", titre: "Fusionner plusieurs PDF", outil: "fusionner", mots: "assembler combiner joindre coller regrouper rassembler concatener pdf documents ensemble" },
  { id: "alleger-pdf", titre: "Alléger un PDF pour l'envoyer par e-mail", outil: "alleger", reglage: "pdf", mots: "compresser reduire diminuer taille poids lourd gros mail email courriel envoyer pdf optimiser" },
  { id: "alleger-photo", titre: "Réduire le poids ou la taille d'une photo", outil: "alleger", reglage: "image", mots: "compresser reduire redimensionner diminuer poids taille lourde photo image jpg jpeg png formulaire 1 mo" },
  { id: "alleger-video", titre: "Alléger une vidéo trop lourde", outil: "alleger", reglage: "video", mots: "compresser reduire poids taille video film mp4 mov whatsapp envoyer" },
  { id: "alleger-word", titre: "Alléger un Word ou un PowerPoint plein de photos", outil: "alleger", mots: "compresser reduire poids taille word docx powerpoint pptx excel images" },
  { id: "pivoter-pdf", titre: "Pivoter les pages d'un PDF", outil: "organiser", mots: "tourner rotation pivoter retourner envers paysage portrait scan pages pdf" },
  { id: "supprimer-pages", titre: "Supprimer des pages d'un PDF", outil: "organiser", mots: "retirer enlever effacer supprimer pages page blanche pdf" },
  { id: "ordre-pages", titre: "Remettre les pages d'un PDF dans l'ordre", outil: "organiser", mots: "ordre reordonner deplacer trier classer pages pdf inverser" },
  { id: "extraire-pages", titre: "Extraire ou séparer des pages d'un PDF", outil: "decouper", mots: "extraire diviser separer scinder decouper couper garder pages pdf une par une" },
  { id: "couper-video", titre: "Couper un passage d'une vidéo ou d'un son", outil: "decouper", mots: "couper decouper extrait passage raccourcir rogner trim video son audio musique mp3 mp4" },
  { id: "image-video", titre: "Enregistrer une image d'une vidéo", outil: "decouper", reglage: "image", mots: "capture photo image instant arret sur image video png jpg" },
  { id: "son-video", titre: "Extraire le son d'une vidéo en MP3", outil: "convertir", cible: "mp3", mots: "son audio musique bande son extraire mp3 video mp4 youtube" },
  { id: "gif", titre: "Faire un GIF animé à partir d'une vidéo", outil: "convertir", cible: "gif", mots: "gif anime animation video" },
  { id: "pdf-en-images", titre: "Transformer les pages d'un PDF en images", outil: "convertir", cible: "png", mots: "pdf images png jpg jpeg photo pages capture" },
  { id: "images-en-jpg", titre: "Convertir des images en JPEG", outil: "convertir", cible: "jpg", mots: "png webp bmp tiff image photo jpg jpeg convertir plusieurs" },
  { id: "excel-csv", titre: "Transformer un Excel en CSV ou en JSON", outil: "convertir", cible: "csv", mots: "excel xlsx tableur csv json donnees tableau" },
  { id: "mot-de-passe", titre: "Mettre un mot de passe sur un fichier", outil: "proteger", mots: "mot de passe mdp proteger chiffrer crypter verrouiller securiser code secret confidentiel" },
  { id: "retirer-mot-de-passe", titre: "Retirer le mot de passe d'un PDF", outil: "deverrouiller", mots: "enlever retirer supprimer mot de passe mdp deverrouiller debloquer dechiffrer decrypter pdf protege bulletin de paie releve" },
  { id: "ouvrir-zip-protege", titre: "Ouvrir un ZIP protégé par un mot de passe", outil: "deverrouiller", mots: "zip archive mot de passe ouvrir extraire deverrouiller" },
  { id: "filigrane-identite", titre: "Filigraner une pièce d'identité avant de l'envoyer", outil: "filigraner", reglage: "identite", mots: "filigrane tampon piece identite carte cni passeport titre sejour justificatif domicile location logement proprietaire agence dossier fraude usurpation" },
  { id: "filigrane", titre: "Ajouter un filigrane (« Confidentiel », « Copie »)", outil: "filigraner", mots: "filigrane tampon marque confidentiel copie brouillon logo texte" },
  { id: "numeroter", titre: "Numéroter les pages d'un PDF", outil: "filigraner", reglage: "numeros", mots: "numeroter numeros pagination numero page pied de page" },
  { id: "signer", titre: "Signer un document", outil: "signer", mots: "signer signature parapher paraphe contrat bail devis pdf" },
  { id: "remplir", titre: "Remplir un formulaire PDF (Cerfa…)", outil: "signer", reglage: "formulaire", mots: "remplir formulaire cerfa champs ecrire sur un pdf completer case cocher" },
  { id: "ecrire-pdf", titre: "Écrire du texte ou une date sur un PDF", outil: "signer", mots: "ecrire texte date ajouter annoter pdf" },
  { id: "masquer-numero", titre: "Masquer un numéro ou une adresse sur un document", outil: "masquer", mots: "masquer cacher noircir caviarder barrer occulter numero securite sociale iban rib adresse telephone mail courriel nom document pdf photo confidentiel" },
  { id: "anonymiser", titre: "Anonymiser un document avant de le partager", outil: "masquer", mots: "anonymiser anonyme rgpd donnees personnelles nom prenom caviarder masquer partager publier" },
  { id: "cacher-capture", titre: "Cacher une partie d'une photo ou d'une capture d'écran", outil: "masquer", mots: "cacher masquer flouter noircir partie zone visage plaque capture ecran screenshot photo image" },
  { id: "gps", titre: "Retirer le lieu (GPS) et l'appareil d'une photo", outil: "nettoyer", mots: "gps localisation lieu position exif metadonnees appareil photo vie privee confidentialite" },
  { id: "auteur", titre: "Effacer l'auteur et l'historique d'un Word ou d'un PDF", outil: "nettoyer", mots: "auteur nom metadonnees proprietes traces historique word docx pdf anonymiser anonyme" },
  { id: "ocr", titre: "Copier le texte d'une photo ou d'un scan", outil: "reconnaitre", mots: "ocr texte photo image scan scanner copier recopier extraire lire reconnaitre numeriser" },
  { id: "pdf-cherchable", titre: "Rendre un PDF scanné cherchable", outil: "reconnaitre", reglage: "pdf", mots: "ocr pdf scanne scan cherchable recherche selectionnable texte" },
  { id: "transcrire", titre: "Obtenir le texte ou les sous-titres d'une vidéo", outil: "transcrire", mots: "transcrire transcription retranscrire sous titres srt texte parole video audio youtube cours conference" },
  { id: "compresser-zip", titre: "Ranger un fichier dans un ZIP", outil: "convertir", cible: "zip", mots: "zip compresser archive ranger" },
];

/** Les besoins proposés avant toute recherche. */
export const POPULAIRES = ["alleger-pdf", "word-en-pdf", "photos-en-pdf", "pivoter-pdf", "filigrane-identite", "signer"];

const VIDES = new Set(
  "un une des le la les de du d l en a au aux pour mon ma mes ton ta tes son sa ses je j veux voudrais aimerais comment faire fait et ou sur dans avec sans par qui que quoi est c ce cet cette plusieurs mettre".split(" "),
);

const normaliser = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Les mots utiles d'une recherche. */
export function motsDe(q: string): string[] {
  return normaliser(q)
    .split(" ")
    .filter((m) => m && !VIDES.has(m));
}

/** Deux mots se répondent-ils ? (même mot, début de mot, ou même racine pour les mots longs : « réduire » ~ « réduction ») */
function rapproche(m: string, w: string): 0 | 1 | 2 {
  if (m === w) return 2;
  if (w.startsWith(m) && m.length >= 2) return 1;
  if (m.length >= 5 && w.length >= 5 && m.slice(0, 5) === w.slice(0, 5)) return 1;
  if (w.length >= 4 && m.startsWith(w)) return 1;
  return 0;
}

/** Les besoins qui répondent le mieux à la recherche, du plus proche au moins proche. */
export function chercherIntentions(q: string, max = 8): Intention[] {
  const mots = motsDe(q);
  if (!mots.length) return [];
  const notes = INTENTIONS.map((it, rang) => {
    const titre = normaliser(it.titre).split(" ");
    const autres = normaliser(it.mots).split(" ");
    let note = 0;
    let trouves = 0;
    for (const m of mots) {
      const t = Math.max(0, ...titre.map((w) => rapproche(m, w)));
      const a = Math.max(0, ...autres.map((w) => rapproche(m, w)));
      const meilleur = Math.max(t * 1.5, a);
      if (meilleur > 0) trouves++;
      note += meilleur;
    }
    return { it, rang, note, trouves };
  });
  const seuil = Math.max(1, Math.ceil(mots.length * 0.6));
  return notes
    .filter((n) => n.trouves >= seuil)
    .sort((a, b) => b.trouves - a.trouves || b.note - a.note || a.rang - b.rang)
    .slice(0, max)
    .map((n) => n.it);
}

export const intention = (id: string): Intention | undefined => INTENTIONS.find((i) => i.id === id);
