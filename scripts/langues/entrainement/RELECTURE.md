# Relecture croisée de l'entraînement

Tu relis des exercices écrits par un autre rédacteur (format et règles :
`scripts/langues/entrainement/CONSIGNES.md`, à lire d'abord). Ton regard neuf doit attraper
ce qui lui a échappé. Tu corriges **directement** le fichier de sortie du lot
(`scripts/langues/entrainement/sortie/<lot>.json`), en gardant le format, l'ordre et le nombre
d'exercices (tu peux remplacer un exercice irrécupérable par un meilleur, sur la même notion).
L'entrée du lot (`entree/<lot>.json`) dit ce que chaque leçon enseigne.

Pour chaque exercice, vérifie :

1. **L'anglais** : grammaire, orthographe, usage naturel. Aucune faute dans une phrase donnée
   comme juste (options, réponses, phrases corrigées, morceaux remis en ordre).
2. **Choix** : exactement une option juste dans le contexte ; si deux options pourraient
   convenir, change la consigne ou l'option. La bonne est la première de « o ».
3. **Écrire et traduire** : la réponse répond bien à la consigne ; « r » contient toutes les
   réponses justes raisonnables (articles, synonymes simples, ordres possibles, orthographe
   britannique et américaine). Avec un trou, une seule réponse (ou toutes listées) doit
   convenir. Les contractions sont acceptées d'office (« don't » = « do not »), la casse et la
   ponctuation finale ne comptent pas ; les virgules et points-virgules sont ignorés par la
   vérification : une faute qui ne tiendrait qu'à une virgule ne peut pas être demandée.
4. **Corriger** : la phrase « f » contient exactement l'erreur annoncée (une seule par défaut),
   liée à la leçon ; « r » liste les corrections justes ; « f » n'est pas, en réalité, une
   phrase correcte.
5. **Remettre dans l'ordre** : « m » donne un ordre juste ; « alt » liste les autres ordres
   justes (place d'un adverbe, d'un complément de temps…) ; pas de ponctuation finale dans
   les morceaux.
6. **Toucher** : tous les mots qui répondent à la consigne portent l'étoile, et seulement eux.
7. **La correction « e »** : juste (aucune règle fausse ou approximative), cohérente avec la
   réponse attendue, en une ou deux phrases complètes de professeur (la réponse, la règle,
   le piège du francophone si utile). Réécris les corrections télégraphiques.
8. **L'indice « i »** et les remarques « io » : utiles, en phrases claires, sans donner la
   réponse toute faite.
9. **Le français** : orthographe, accords, guillemets « », tutoiement.

Ensuite : `npx tsx scripts/langues/entrainement/valider.mts <lot>` jusqu'à « 0 problème(s) ».
Travaille dans un dossier temporaire à ton nom (par exemple `/tmp/relecture-<lot>`), jamais
dans un dossier partagé. Pas de git, aucun autre fichier du dépôt modifié.
Réponds en trois lignes : le nombre d'exercices corrigés par lot et les problèmes les plus
fréquents trouvés.
