# Phase 17 — Le Truchement : apprendre l'anglais

Un quatrième espace, à côté du Calame, de L'Alambic et de la bibliothèque, à l'adresse `/langues`. On y apprend l'anglais depuis le français.

## Mise en ligne

Dépose `source.zip` sur GitHub, attends la coche verte de Vercel, puis recharge avec Ctrl + Maj + R.

Rien d'autre à faire :
- aucune migration SQL ;
- aucune nouvelle clé. La transcription et les traductions utilisent la clé Groq déjà en place pour L'Alambic.

## Les cinq onglets

**Aujourd'hui.** Le mot du jour, avec sa prononciation et un exemple. À côté :
- l'objectif de 20 révisions par jour ;
- la série de jours d'affilée et les sept derniers jours ;
- le bouton de la séance du jour.

En dessous, la dernière vidéo et la dernière lecture à reprendre, puis les thèmes en cours.

**Vocabulaire.** 600 mots et expressions, en douze thèmes de 50, du niveau A1 au B2 : famille, vie quotidienne, nourriture, maison, voyage, ville, travail, école, santé, émotions, météo, nature. Chaque mot a sa prononciation, une phrase d'exemple et sa traduction. Trois façons de réviser :
- **Séance guidée.** Les mots à revoir passent en premier, puis cinq nouveaux mots. Les exercices changent selon ce que tu sais déjà : découverte, choix de la traduction, écoute, texte à trous, écriture, association de paires.
- **Cartes mémoire.** Tu retournes la carte, puis tu choisis entre quatre réponses (À revoir, Difficile, Bien, Facile). Chaque bouton affiche quand le mot reviendra.
- **Entraînement libre.** Tout le thème, même quand rien n'est à revoir.

**Écouter.** Colle un lien YouTube ou dépose un son ou une vidéo. Tu obtiens :
- la vidéo au centre, la phrase en cours en grand juste dessous, mot par mot, et sa traduction française ;
- un mot touché met la vidéo en pause et donne son sens dans la phrase, avec « Écouter » et « Ajouter au dictionnaire » ;
- des boutons pour la phrase précédente ou suivante, une boucle sur la phrase, et la vitesse 0,75× ou 0,9× ;
- le texte complet à droite, qui suit la voix.

**Lire.** Dépose un PDF en anglais : il devient un livre, page par page. Tu peux :
- toucher un mot pour sa traduction ;
- sélectionner un passage, puis cliquer sur « Traduire ce passage » ;
- afficher la traduction sous chaque paragraphe avec « Traduire la page ».

La page où tu t'arrêtes est retenue.

**Dictionnaire.** Tous les mots que tu as rangés, avec leur origine (vidéo et minute, PDF et page, thème). Tu peux :
- chercher, filtrer, modifier et supprimer ;
- cocher des mots pour une séance sur mesure ;
- exporter en tableur (CSV) ou pour Anki.

« Sauvegarde complète » enregistre toute ta progression dans un fichier, à réimporter sur un autre appareil.

## Où vont les données

Tout reste sur l'appareil (IndexedDB) : progression, dictionnaire, vidéos et PDF. Comme dans L'Alambic, deux choses passent par Groq :
- le son, pour la transcription ;
- les phrases à traduire.

La prononciation utilise la voix de l'appareil : c'est gratuit et ça marche hors ligne.

## La mémoire espacée

Le moteur est FSRS-4.5, l'algorithme d'Anki depuis 2023, réglé pour retenir 90 % des mots. Un mot manqué revient plus loin dans la séance. Un mot su revient juste avant que tu ne l'oublies : quelques jours d'abord, puis des semaines et des mois.

## Vérifications

- `npm run test:langues` : 41 tests (mémoire espacée, correction tolérante aux fautes de frappe, exercices, contenu des thèmes, découpage des PDF, dictionnaire).
- Les tests de L'Alambic passent toujours : la carte de traduction des mots est partagée entre les deux espaces.
