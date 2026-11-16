# Phase 15 — L'Alambic : Transcrire

Un cinquième outil dans L'Alambic. Un cours, un podcast ou une conférence en anglais, en arabe ou en espagnol devient un texte qu'on lit comme un livre, synchronisé avec le son.

## Mise en ligne (une seule fois)

1. **Crée une clé Groq gratuite.** Sur <https://console.groq.com>, crée un compte (sans carte bancaire), ouvre « API Keys », clique sur « Create API Key » et copie la clé (elle commence par `gsk_`).
2. **Donne-la à Vercel.** Dans ton projet Vercel, va dans Settings, puis Environment Variables. Ajoute `GROQ_API_KEY` avec la clé comme valeur et enregistre.
3. **Dépose `source.zip`** sur GitHub comme d'habitude, attends une à deux minutes, puis recharge avec Ctrl + Maj + R.

Fais l'étape 2 avant l'étape 3 : la nouvelle version lira la clé dès sa mise en ligne. Aucune migration SQL.

## Ce que fait l'outil

**Importer.** Dépose un son ou une vidéo (jusqu'à 6 heures), ou colle un lien YouTube. La langue est détectée toute seule, ou tu la choisis.

- Un fichier est allégé sur ton appareil, puis envoyé à Groq par morceaux de 10 minutes : Whisper le transcrit.
- Une vidéo YouTube : ses sous-titres (écrits par l'auteur ou automatiques) sont lus et synchronisés avec le lecteur officiel. Si la vidéo n'en a pas, ou si YouTube refuse, le message propose de déposer le son à la place.

**Lire.** La liseuse s'ouvre en plein écran.

- La phrase dite s'éclaire d'or, et le mot prononcé est marqué.
- Le texte défile de lui-même. Si tu remontes pour relire, une pastille « Reprendre le fil » te ramène à la voix.
- Un clic sur n'importe quel mot reprend la lecture à cet endroit précis. Le minutage dans la marge, et le sommaire sous le lecteur, font de même pour un paragraphe.
- Clavier : Espace pour lecture ou pause, ← et → pour 5 secondes, Maj + ← et → pour la phrase précédente ou suivante.

**Comprendre.** Survole un mot : une carte donne son sens dans cette phrase, sa nature, sa forme de base et, en arabe, sa racine, avec la traduction de toute la phrase. Sur téléphone, touche le mot : un tiroir s'ouvre en bas. Le bouton « Traduction » affiche la traduction française sous chaque paragraphe.

**Régler et exporter.** « Affichage » règle la taille du texte et le thème (papier ou nuit). Le lecteur se place à côté du texte, flotte dans un coin (on le déplace à la souris ou au doigt) ou se réduit en barre. « Exporter » donne le texte propre, le texte bilingue, les sous-titres SRT ou WebVTT.

**Bibliothèque.** Chaque transcription est gardée sur l'appareil avec son son, ses traductions et ses analyses : elle se rouvre sans rien renvoyer.

## Limites du palier gratuit de Groq

- Transcription : environ 2 heures d'audio par heure, 8 heures par jour.
- Traduction : un millier de demandes par jour pour les phrases, autant pour les mots.

Pour qu'un robot ne puisse pas vider ce quota, chaque visiteur a aussi sa limite horaire. Si Groq est saturé un instant, l'application réessaie toute seule.

## Côté technique

- Routes : `src/app/api/alambic/{transcrire,traduire,analyser,youtube}`. La clé ne quitte jamais le serveur.
- Moteur, sans dépendance à l'interface et testé (`npm run test:transcription`) : `src/lib/alambic/transcription/`.
- Interface : `src/app/alambic/transcription/`.
- Modèles par défaut : `whisper-large-v3`, `openai/gpt-oss-120b` pour les phrases et pour les mots. On peut les changer dans Vercel (voir `.env.example`), sans toucher au code.
