# Consignes : l'entraînement des Règles (Le Truchement)

Le Truchement est le module du site HaqqReason où des **francophones apprennent l'anglais**.
Ses « Règles » comptent 152 leçons (Conjugaison et Grammaire, du niveau A1 au niveau C2).
Chaque leçon a déjà un cours et un petit défi de 5 ou 6 questions. Tu écris son
**entraînement** : au moins **20 exercices corrigés de plus** par leçon, pour s'exercer
vraiment, du plus facile au plus difficile.

## Ce que tu reçois, ce que tu rends

- Entrée : `scripts/langues/entrainement/entree/<lot>.json`. Pour chaque leçon : son `id`,
  son niveau, son titre, sa notion, la règle expliquée, les formes, les emplois, les pièges
  des francophones, ce qu'il faut retenir, et `defi_deja_pose` (les questions du défi, à ne
  pas répéter).
- Sortie : `scripts/langues/entrainement/sortie/<lot>.json`, un seul objet JSON :
  `{ "<id de la leçon>": [ exercice, exercice, … ], … }` avec **toutes** les leçons du lot.
- Contrôle : `npx tsx scripts/langues/entrainement/valider.mts <lot>` doit finir sur
  « 0 problème(s) ». Corrige et relance jusque-là.
- Ne modifie aucun autre fichier.

## Les cinq types d'exercices

Chaque exercice porte `q` (la consigne), `i` (l'indice), `e` (la correction) et `d`
(la difficulté : 1 échauffement, 2 entraînement, 3 expert). Le reste dépend du type.

1. **Choix** : `o` = 2 à 4 options, **la bonne en premier** (l'écran les mélange).
   `io` (conseillé) : pour un mauvais choix, la remarque affichée quand on le choisit.
   ```json
   { "d": 1, "q": "Every morning, my brother ___ to school by bus.", "o": ["goes", "go", "going"], "io": { "go": "Avec « my brother » (= he), le verbe prend un -s au présent simple." }, "i": "Remplace « my brother » par un pronom : he, she ou it ?", "e": "« goes » : au présent simple, he, she et it ajoutent -s (ici -es, comme do → does)." }
   ```
2. **Écrire** : `r` = toutes les réponses justes. Avec un trou `___` dans la consigne, `r`
   ne contient que le ou les mots du trou. Pour une traduction, `r` contient des phrases
   entières : donne 2 à 6 variantes justes.
   ```json
   { "d": 2, "q": "Traduis en anglais : « Elle ne boit pas de café. »", "r": ["She doesn't drink coffee", "She does not drink coffee"], "i": "À la négative, on appelle le moteur does, puis le verbe à la base.", "e": "« She doesn't drink coffee » : does porte le -s et la négation, drink reste à la base (jamais « doesn't drinks »)." }
   ```
3. **Toucher** : `p` = une phrase anglaise où les mots à trouver portent une étoile.
   ```json
   { "d": 1, "q": "Touche les deux verbes qui ont pris le -s du présent simple.", "p": "Emma *reads a lot and her dad *watches the news.", "i": "Cherche les actions faites par « she » ou « he ».", "e": "« reads » (Emma = she) et « watches » (her dad = he) : -s pour he, she, it." }
   ```
4. **Remettre dans l'ordre** : `m` = les morceaux **dans le bon ordre**, en minuscules (sauf
   « I » et les noms propres ; la majuscule du début est ajoutée à l'écran), **sans la
   ponctuation finale**, qui va dans `fin` (".", "?" ou "!"). Un morceau peut faire plusieurs
   mots. `alt` : les autres ordres justes, s'il y en a (mêmes morceaux).
   ```json
   { "d": 2, "q": "Remets les mots dans l'ordre pour poser la question.", "m": ["does", "your", "sister", "speak", "Spanish"], "fin": "?", "i": "Une question au présent simple commence par le moteur.", "e": "« Does your sister speak Spanish? » : does vient d'abord, puis le sujet, puis le verbe à la base." }
   ```
5. **Corriger la phrase** : `f` = la phrase fautive telle qu'on la montre (aucune étoile :
   l'erreur doit se chercher), `r` = les phrases corrigées acceptées (phrases entières).
   L'écran met `f` dans la case : l'élève la modifie. Une seule erreur, sauf si la consigne
   annonce le contraire. L'erreur est typique d'un francophone et liée à la leçon.
   ```json
   { "d": 3, "q": "Corrige la phrase : il y a une erreur.", "f": "My father don't work on Sundays.", "r": ["My father doesn't work on Sundays.", "My father does not work on Sundays."], "i": "Qui est « my father » : I, you, he… ? Et quel moteur va avec ?", "e": "« My father doesn't work on Sundays. » : avec he (my father), le moteur est does, pas do." }
   ```

## Pour chaque leçon

- **20 à 24 exercices**, rangés du plus facile au plus difficile : environ 6 de difficulté
  1, 8 de difficulté 2, 6 de difficulté 3.
- Un vrai mélange : 6 à 8 choix, 4 à 6 à écrire (dont au moins 2 traductions du français
  vers l'anglais), 2 à 4 à remettre dans l'ordre, 2 à 4 phrases à corriger, 2 ou 3 à
  toucher quand la notion s'y prête (sinon plus de choix et d'écrits). Au moins 4 types.
- Chaque exercice travaille **la notion de la leçon**, au niveau de la leçon (vocabulaire
  simple en A1-A2, plus riche en B, soutenu en C). Pas de notion d'un niveau plus avancé.
- Les pièges des francophones (fournis dans l'entrée) reviennent sous plusieurs formes.
- Ne reprends pas une question de `defi_deja_pose` ; pas de doublon dans l'entraînement.

## Langue et ton

- Consignes, indices et corrections **en français**, simples et bienveillants, tutoiement.
  Ce qu'on étudie est **en anglais**. Dans le français, un mot anglais se met entre
  guillemets : « does ».
- La **correction** `e` donne toujours la bonne réponse **et** la raison (la règle en une ou
  deux phrases), comme un professeur qui corrige une copie. Elle peut nommer le piège.
- L'**indice** `i` met sur la voie sans donner la réponse.
- Une seule bonne réponse possible pour un choix ; pour un écrit, toutes les réponses justes
  sont listées (les contractions sont acceptées d'office dans les deux sens : « don't » vaut
  « do not » ; la casse et la ponctuation finale ne comptent pas ; liste en revanche les
  variantes d'orthographe britannique et américaine, d'ordre des mots ou de synonymes justes).
- Des phrases naturelles, de la vie de tous les jours : école, travail, famille, voyage,
  sport, cuisine, nature, sciences, technologie… Des prénoms variés (Emma, Yusuf, Léa, Omar,
  Sarah, Adam, Inès, Tom, Maryam, Lucas…).
- Contenu sain et familial : pas d'alcool, pas de rendez-vous amoureux, pas de violence, pas
  de jeux d'argent, pas de sujet religieux polémique, rien sur le poids ou les régimes.
- Pas de couleurs `[x:…]` ni de balises : du texte simple.

## Le niveau d'exigence

- Pas de correction télégraphique (« don't + base. ») : une ou deux phrases complètes, par
  exemple « « Don't eat here! » : pour interdire, on met « don't » devant la base du verbe.
  En français on dit « ne… pas », mais en anglais « not » seul ne suffit pas. »
- Relis chaque exercice avant de rendre : une seule bonne réponse par choix, toutes les
  réponses justes listées pour les écrits, un anglais juste et naturel.
