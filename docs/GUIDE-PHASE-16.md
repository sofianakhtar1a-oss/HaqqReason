# Phase 16 — L'Alambic : Interroger (assistant de recherche sur tes sources)

Un sixième outil dans L'Alambic. Tu rassembles des sources dans un carnet, et un assistant répond uniquement à partir d'elles. Chaque affirmation renvoie à la page ou à la minute exacte.

## Mise en ligne (une seule fois)

1. **Crée une clé Gemini gratuite.** Sur <https://aistudio.google.com/apikey>, connecte-toi avec ton compte Google, clique sur « Create API key » et copie la clé (elle commence par `AIza`).
2. **Donne-la à Vercel.** Dans ton projet Vercel, ouvre Settings, puis Environment Variables. Ajoute `GEMINI_API_KEY` avec la clé comme valeur, puis enregistre.
3. **Dépose `source.zip`** sur GitHub, attends la coche verte, puis recharge avec Ctrl + Maj + R.

Aucune migration SQL. L'outil est gratuit pour tes visiteurs : la clé reste sur ton serveur.

## Ce que fait l'outil

**Les sources** (panneau de gauche). Tu peux en ajouter plusieurs à la fois :
- par glisser-déposer : PDF, Word (.docx), texte, Markdown, CSV, sons et vidéos ;
- en collant des liens YouTube, un ou plusieurs.

Chaque source est lue sur ton appareil :
- les documents gardent leurs numéros de page. Pour Word et le texte brut, les pages sont estimées à 3 000 signes ;
- les sons et les vidéos sont transcrits avec leurs minutages, comme dans « Transcrire ».

Une case à cocher choisit les sources que l'assistant consulte. La jauge du bas indique si tout est lu en entier, ou si l'assistant cherche les passages utiles.

**La conversation** (au centre). Les réponses s'écrivent en direct et suivent la structure imposée : synthèse directe, analyse détaillée, croisement des sources, puis « Pour aller plus loin ». Quatre actions se lancent en un clic : Synthèse exhaustive, Points de divergence, Glossaire, Questions d'approfondissement.

**Les citations.** Chaque pastille dorée, comme « Rapport.pdf p. 14 » ou « Vidéo, 12:45 », ouvre la source dans le panneau de droite :
- un PDF s'ouvre sur l'image de la vraie page ;
- une vidéo YouTube démarre à la seconde citée ;
- le passage exact est encadré.

## Comment l'assistant lit tes sources

- **Jusqu'à 120 000 jetons cochés** (environ 250 pages) : tout est envoyé à Gemini, sans aucune perte.
- **Au-delà, une recherche hybride.** Elle combine les mots (BM25) et le sens (vecteurs Gemini). Chaque source cochée garde une part garantie, et les meilleurs passages arrivent avec leurs voisins.
- **Pour la synthèse, les divergences et le glossaire**, chaque source est couverte régulièrement, du début à la fin.

## Limites du palier gratuit de Gemini

Environ 10 questions par minute et 250 par jour pour tout le site. Chaque visiteur a aussi une limite horaire, pour qu'un robot ne puisse pas épuiser ce quota.

Sur le palier gratuit, Google peut utiliser les échanges pour améliorer ses modèles. Les passages envoyés ne doivent donc pas contenir de données personnelles sensibles.

## Côté technique

- Prompt système (texte du créateur, mot pour mot) : `src/lib/alambic/serveur/prompt-carnet.ts`.
- Routes : `src/app/api/alambic/carnet` (réponse en continu) et `.../carnet/vecteurs`.
- Moteur, sans dépendance à l'interface et testé (`npm run test:carnet`) : `src/lib/alambic/carnet/`.
- Interface : `src/app/alambic/carnet/`.
