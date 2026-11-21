# Relecture croisée d'une histoire

Tu relis le travail d'un autre traducteur (format et règles : `scripts/langues/histoires/CONSIGNES.md`,
à lire d'abord). Ce que tu corriges sera lu par des milliers d'élèves francophones : chaque mot
touché dans la liseuse affiche sa glose, et la traduction de sa phrase.

Tu corriges **directement** les fichiers `scripts/langues/histoires/sortie/<id>/pages-NN.json`
(et `meta.json` si on te le confie), sans changer l'anglais d'un texte classique ni la structure
(pages, paragraphes, phrases).

Pour chaque phrase, vérifie :

1. **La traduction `fr`** : fidèle (aucun contresens, rien d'oublié, rien d'ajouté), naturelle,
   en bon français (accords, temps, ponctuation française « … »). Pour un texte classique : un
   style littéraire soigné, au passé simple quand le récit l'appelle.
2. **Les gloses des mots qui ont du sens** (noms, verbes, adjectifs, adverbes, verbes à
   particule, expressions) : le sens **dans cette phrase**, accordé à la traduction (temps du
   verbe, genre et nombre), le bon lemme et la bonne nature. Corrige toute glose générique ou
   fausse (« left » = « gauche » alors qu'il « partit », « like » = « comme » alors qu'il
   « aime »…). Les mots-outils ont une glose générale dans `mots-outils.json` : ne les glose dans
   la phrase que si leur sens y est particulier.
3. **Les questions** (`meta.json`, si confié) : une seule bonne réponse (la première), fidèles à
   l'histoire, indices et corrections en phrases complètes.

Ensuite : `npx tsx scripts/langues/histoires/valider.mts <id> <lot>` jusqu'à « 0 problème(s) ».
Travaille dans un dossier temporaire à ton nom, jamais dans un dossier partagé. Pas de git, aucun
autre fichier du dépôt modifié. Réponds en trois lignes : le nombre de phrases dont tu as corrigé
la traduction, le nombre de gloses corrigées, et les erreurs les plus fréquentes.
