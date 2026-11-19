# Les récits des fiches du Portulan

Ces fichiers donnent, pour chaque pays et territoire, ce que la fiche raconte en plus des
chiffres : la devise, l'hymne et ses auteurs, l'indépendance, la fête nationale, le point
culminant, le plus long fleuve, les mers, l'histoire du drapeau, l'origine du nom, une
anecdote (« Le savais-tu ? ») et les grandes villes.

Ils sont écrits à la main, en français, à partir des connaissances générales (encyclopédies,
sites officiels des États) ; `scripts/monde/construire.mjs` les vérifie et les range dans
`src/lib/monde/recits.ts` (chargé à la demande) et, pour ce qui sert aux questions (point
culminant, fleuve, grandes villes), dans `src/lib/monde/donnees.ts`.

Les clés, toutes facultatives :

| clé | contenu |
| --- | --- |
| `d` | la devise (traduite ; l'original entre parenthèses quand il s'écrit en alphabet latin) |
| `h`, `ha` | l'hymne (son titre, et sa traduction entre parenthèses) ; ses auteurs et sa date |
| `i` | l'indépendance (date, et de qui) |
| `f` | la fête nationale |
| `s` | `[point culminant, altitude en mètres]` |
| `r`, `rn` | `[le plus long fleuve, longueur totale en km]` ; une précision |
| `m` | les mers et océans qui le bordent |
| `dr` | l'histoire du drapeau |
| `e` | l'origine du nom |
| `a` | une anecdote |
| `v` | les grandes villes (hors capitale), de la plus peuplée à la moins peuplée. `Nom=Autre|Autre` : le nom français, puis les noms sous lesquels GeoNames la connaît, pour en trouver la population |

Une erreur, un oubli ? Le créateur peut corriger une fiche depuis son espace (les corrections
s'ajoutent par-dessus ces fichiers, sans les modifier), ou proposer la correction ici.
