# L'Alambic — chantier « studio de fichiers complet »

Demande du 22 novembre 2026, 21 h 31 : scanner tout le module « Studio de fichiers » (L'Alambic),
chercher tout ce qui serait cohérent avec lui et améliorerait l'expérience, et l'ajouter, sans rien
supprimer.

Règles du chantier : rien n'est supprimé, seulement ajouté ; les modes créateur et utilisateur, la
connexion Google, les mots de passe et la séparation des espaces restent intacts ; mouvement réduit
et accessibilité respectés ; tout se fait dans le navigateur (seule exception déjà annoncée :
Transcrire) ; tests, typage, lint et build avant chaque envoi.

## État des lieux (scan du 22 novembre)

- **Cinq outils** : Convertir (36 formats en 6 familles, carte des conversions avec raison lisible
  pour chaque impossibilité, sens inversable d'un clic, collage Ctrl+V, ouverture dans Le Calame),
  Fusionner (PDF, images, documents → un PDF, ordre au glisser-déposer), Découper (pages d'un PDF
  avec vignettes ; extrait d'un son ou d'une vidéo), Protéger (PDF chiffré AES-256 ou ZIP chiffré,
  jauge de force, générateur), Transcrire (Groq/Whisper, liseuse synchronisée, traductions,
  bibliothèque synchronisée, exports TXT/SRT/VTT).
- **Moteurs locaux** : pdf.js, pdf-lib (fork Cantoo : chiffrement et déchiffrement), Mediabunny
  (WebCodecs), ExcelJS, Mammoth, zip.js, fflate, gifenc, UTIF. Tesseract (fra, ara, eng) est déjà
  servi par le site pour Le Calame, mais L'Alambic ne s'en sert pas.
- **Manques relevés** : rien pour pivoter ou réordonner les pages d'un PDF, ni pour l'alléger ;
  pas de filigrane (pièces d'identité), pas de numéros de page, pas de signature ; un PDF protégé
  bloque tous les outils sans solution ; aucune façon de retirer les métadonnées (lieu GPS d'une
  photo, auteur d'un Word) ; une photo de document ne devient pas du texte ; un seul fichier à la
  fois dans Convertir ; aucun lien entre les outils (le résultat de l'un ne passe pas à l'autre) ;
  pas d'aperçu, pas de partage sur téléphone ; deux raisons de refus dépassées (« ce studio ne fait
  pas de transcription » alors que Transcrire existe).

## Plan pondéré (total 147)

| # | Tâche | Poids | Fait |
|---|-------|------:|-----:|
| 1 | Socle : menu regroupé (13 outils, téléphone et ordinateur), « Continuer avec… », partager, aperçu, résultats de la visite | 12 | 12 |
| 2 | Organiser un PDF : pivoter, réordonner, retirer, dupliquer, insérer une page blanche, ajouter un autre PDF | 9 | 9 |
| 3 | Alléger : photos, PDF (images recompressées, texte gardé), vidéos, sons, Word/Excel/PowerPoint | 12 | 12 |
| 4 | Filigraner et numéroter : aperçu en direct, préréglage « pièce d'identité », filigrane inséparable | 10 | 10 |
| 5 | Signer et remplir : signature dessinée ou importée, texte, date, coche, champs de formulaire | 10 | 10 |
| 6 | Déverrouiller : PDF et ZIP dont on connaît le mot de passe ; proposé par les autres outils | 6 | 6 |
| 7 | Nettoyer les traces : examiner puis effacer (JPEG, PNG, WebP, PDF, Word/Excel/PowerPoint, OpenDocument, MP3) | 10 | 10 |
| 8 | Reconnaître le texte (OCR) : photos et PDF scannés → texte, Word, PDF cherchable ; dans Convertir aussi | 9 | 9 |
| 9 | Convertir plusieurs fichiers d'un coup, tout télécharger en ZIP | 6 | 6 |
| 10 | « Que veux-tu faire ? » : recherche par intention et recettes | 5 | 5 |
| 11 | Améliorations des outils existants (Découper, Fusionner, Convertir, Protéger) | 10 | 10 |
| 12 | Transcrire : exports Word, PDF, OpenDocument, EPUB, Markdown | 2 | 2 |
| 13 | Aide « Bon à savoir », questions fréquentes, textes du mode créateur | 4 | 4 |
| 14 | Vérification : tests, typage, lint, build, parcours dans le navigateur, captures, relecture | 15 | 15 |
| 15 | Corrections issues de la relecture du code (20 points vérifiés un à un) | 6 | 6 |
| 16 | Masquer des informations : caches tracés ou posés d'un toucher, « Masquer partout », motifs prêts (e-mail, téléphone, IBAN, sécurité sociale, carte), lecture des scans, vérification du fichier produit | 12 | 12 |
| 17 | Découper › « Ses images » : les photos et illustrations d'un PDF à leur qualité d'origine (JPEG tels quels, transparence gardée) | 4 | 4 |
| 18 | Seconde relecture (Masquer, images d'un PDF) : fuite par les liens entre pages, champs de formulaire, motifs élargis, vérification plus stricte | 5 | 5 |
| | **Total** | **147** | **147** |

## Journal

- 22 nov. 21 h 31 — début du scan.
- 22 nov. 22 h 26 — premier envoi : menu regroupé et recherche « Que veux-tu faire ? », « Continuer avec… »,
  aperçu, partage, résultats de la visite, questions fréquentes ; outils Organiser, Alléger, Filigraner,
  Déverrouiller, Nettoyer. Les PDF seulement « restreints » s'ouvrent désormais dans tous les outils.
  Signer et Reconnaître restent masqués jusqu'à leur fin.
- 22 nov. 22 h 47 — deuxième envoi : Reconnaître le texte (Tesseract local, texte corrigeable, Word,
  PDF cherchable ligne à ligne), Signer et remplir (champs de formulaire, signature dessinée ou
  photographiée, texte, date, coches), conversion de plusieurs fichiers d'un coup ; Convertir lit le
  texte des images, oriente les PDF scannés vers Reconnaître et les sons vers Transcrire.
- 22 nov. 22 h 57 — troisième envoi : photos HEIC (lues par Safari) et AVIF ; Convertir règle la netteté
  des pages et la taille des images ; Découper coupe toutes les N pages et enregistre l'image d'un
  instant d'une vidéo ; Fusionner met les photos sur des pages A4, ajoute un signet par fichier et
  numérote ; Protéger exige de retaper un mot de passe caché et règle les autorisations d'un PDF ;
  Transcrire exporte en Word, OpenDocument, PDF et livre numérique ; « Bon à savoir » partout.
- 22 nov. 23 h 15 — relecture complète du code par un second regard : 20 défauts confirmés et corrigés
  (masques de transparence et orientation EXIF dans Alléger, annulation des sons et vidéos, résultats
  retirés qui revenaient, travaux qui se chevauchent, sélection d'Organiser, aplatissement inutile du
  filigrane, fenêtre de signature au clavier, extraction d'un seul fichier d'un ZIP, fuites de mémoire).
- 22 nov. 23 h 37 — nouvel outil Masquer (famille Sécurité) : ce qui est caché disparaît vraiment
  (pages concernées redessinées en images, informations du document retirées), recherche sans
  accents ni majuscules, largeurs des lettres mesurées pour des caches justes, lecture des scans et
  des photos avant d'y chercher, double vérification (chaque texte cherché sous un cache, puis
  relecture du fichier produit). Question fréquente n° 7 sur les rectangles noirs.
- 22 nov. 23 h 42 — Découper sait aussi sortir les images d'un PDF (« Ses images ») : les JPEG à
  l'octet près, les autres en PNG (palette et transparence comprises), chaque image une seule fois.
- 23 nov. 00 h 02 — seconde relecture, sur Masquer et les images d'un PDF. Corrigé : une page gardée
  qui portait un lien vers une page masquée faisait entrer celle-ci, invisible mais lisible, dans le
  fichier (liens, champs partagés et pièces jointes sont désormais retirés, et le fichier écrit est
  contrôlé, sinon tout est redessiné) ; valeurs des champs de formulaire et notes cherchées aussi ;
  cartes suivies d'une date, IBAN groupés comme un RIB ou à la clé fausse, « (+33) », tirets
  insécables, clé de sécurité sociale après un tiret ; vérification par recouvrement réel (97 %) ;
  pages mêlant texte et scan proposées à la lecture ; clavier limité au cache qui a le focus ;
  extraction : /Decode en RVB, doublons, CMJN et transparence signalés.
- 23 nov. 00 h 03 — chantier terminé : 13 outils, 267 vérifications automatiques, parcours complets
  dans le navigateur (ordinateur et téléphone, thèmes clair et sombre), mise en ligne confirmée.
  Limite connue : les photos HEIC ne se lisent qu'avec Safari (aucun décodeur universel ajouté,
  pour ne pas alourdir le site d'une bibliothèque sous licence LGPL).
