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

## Plan pondéré (total 120)

| # | Tâche | Poids | Fait |
|---|-------|------:|-----:|
| 1 | Socle : menu regroupé (12 outils, téléphone et ordinateur), « Continuer avec… », partager, aperçu, résultats de la visite | 12 | 11 |
| 2 | Organiser un PDF : pivoter, réordonner, retirer, dupliquer, insérer une page blanche, ajouter un autre PDF | 9 | 8 |
| 3 | Alléger : photos, PDF (images recompressées, texte gardé), vidéos, sons, Word/Excel/PowerPoint | 12 | 10 |
| 4 | Filigraner et numéroter : aperçu en direct, préréglage « pièce d'identité », filigrane inséparable | 10 | 8 |
| 5 | Signer et remplir : signature dessinée ou importée, texte, date, coche, champs de formulaire | 10 | 9 |
| 6 | Déverrouiller : PDF et ZIP dont on connaît le mot de passe ; proposé par les autres outils | 6 | 6 |
| 7 | Nettoyer les traces : examiner puis effacer (JPEG, PNG, WebP, PDF, Word/Excel/PowerPoint, OpenDocument, MP3) | 10 | 9 |
| 8 | Reconnaître le texte (OCR) : photos et PDF scannés → texte, Word, PDF cherchable ; dans Convertir aussi | 9 | 8 |
| 9 | Convertir plusieurs fichiers d'un coup, tout télécharger en ZIP | 6 | 6 |
| 10 | « Que veux-tu faire ? » : recherche par intention et recettes | 5 | 4 |
| 11 | Améliorations des outils existants (Découper, Fusionner, Convertir, Protéger) | 10 | 9 |
| 12 | Transcrire : exports Word, PDF, OpenDocument, EPUB, Markdown | 2 | 2 |
| 13 | Aide « Bon à savoir », questions fréquentes, textes du mode créateur | 4 | 4 |
| 14 | Vérification : tests, typage, lint, build, parcours dans le navigateur, captures, relecture | 15 | 6 |
| | **Total** | **120** | **100** |

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
