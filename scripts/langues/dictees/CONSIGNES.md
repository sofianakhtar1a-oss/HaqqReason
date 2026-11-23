# Consignes : les dictées du Truchement

Le Truchement est le module du site HaqqReason où des **francophones apprennent l'anglais**.
Dans l'onglet Écouter, une dictée est lue phrase par phrase par la voix du navigateur ; l'élève
écrit ce qu'il entend, puis voit chaque mot juste, oublié ou en trop, et la traduction. Il y a
**20 dictées par niveau** (A1 à C2), numérotées de 1 à 20, du plus facile au plus difficile, et
l'élève choisit librement celle qu'il veut faire. Ce que tu écris est exactement ce qu'il entendra.

## Le format

Un fichier par niveau : `scripts/langues/dictees/sortie/<niveau>.json`

```json
{
  "niveau": "A1",
  "dictees": [
    {
      "n": 1,
      "titre": "Ma famille",
      "piege": "« daughter » : le « gh » ne se prononce pas, comme dans « night ».",
      "phrases": [
        { "en": "My family lives in a small house near the sea.", "fr": "Ma famille habite une petite maison près de la mer." }
      ]
    }
  ]
}
```

- `n` : de 1 à 20, dans l'ordre, du plus simple au plus exigeant du niveau.
- `titre` : le sujet, en français, en 1 à 5 mots, sans point final.
- `piege` : **une** phrase en français (160 caractères au plus) qui signale la difficulté
  d'orthographe principale de la dictée, en citant entre « » au moins un mot anglais **qui figure
  dans la dictée** (homophones there/their, its/it's, your/you're ; lettres muettes ; consonnes
  doublées ; -ed, -ies ; ough ; mots proches du français mais écrits autrement…).
- `phrases` : **exactement 8 phrases** qui forment un petit texte suivi sur le sujet (un récit, une
  description, une lettre…), pas une liste de phrases sans lien. Chaque phrase : `en` (l'anglais
  dicté) et `fr` (sa traduction française naturelle et fidèle, ponctuation française).

## L'anglais dicté

| Niveau | Mots par phrase | Mots par dictée | Langue |
|---|---|---|---|
| A1 | 5 à 9 | 45 à 68 | présent simple et continu, can, there is/are, vocabulaire très courant |
| A2 | 6 à 12 | 55 à 90 | prétérit, going to, comparatifs, present perfect simple |
| B1 | 8 à 15 | 75 à 110 | tous les temps courants, conditionnels 1 et 2, passif, discours rapporté |
| B2 | 9 à 17 | 85 à 125 | verbes à particule, idiomes, conditionnel 3, modaux de déduction, relatives |
| C1 | 10 à 19 | 95 à 140 | inversion, phrases clivées, vocabulaire précis et nuancé |
| C2 | 11 à 21 | 105 à 155 | style littéraire ou journalistique soutenu, vocabulaire rare et exact |

Pour qu'une dictée soit juste, seuls ces signes sont permis : les lettres, l'espace, la virgule,
l'apostrophe droite `'` (contractions, possessifs), et un seul signe final `.` `?` ou `!`.
Donc :

- **pas de chiffres** : les nombres s'écrivent en lettres (« seven », « twenty », « third ») ;
- **pas de tirets**, de deux-points, de point-virgule, de parenthèses ni de guillemets (pas de
  dialogue entre guillemets ; un discours rapporté convient) ;
- **pas de nom de personne** : « my sister », « our teacher », « the old man » ; seuls sont
  permis les jours, les mois, les langues, les nationalités, les pays et quelques grandes villes
  (London, Paris…), et Mum, Dad, Grandma, Grandpa ;
- **orthographe britannique**, comme les histoires du module (colour, neighbour, centre,
  realise, travelled, theatre) ;
- chaque phrase commence par une majuscule et se termine par `.` `?` ou `!` ;
- pas deux fois la même phrase dans le niveau.

Les 20 sujets sont variés (famille, école, maison, ville, nature, météo, voyages, métiers,
sciences, sport, cuisine, animaux, technologie, histoire, société…) et adaptés au niveau.
Contenu sain et familial : pas d'alcool, pas de relation amoureuse, pas de violence, pas de jeux
d'argent, pas de sujet religieux polémique, rien sur le poids ou les régimes.

## Le contrôle

`npx tsx scripts/langues/dictees/valider.mts <niveau>` (depuis /home/claude/haqqreason) doit finir
sur « 0 problème(s) ». Il vérifie le format, les 20 dictées de 8 phrases, les longueurs, les signes
permis, les noms propres, le piège, les doublons, et signale (sans bloquer) les mots que les
listes du module rangent au-dessus du niveau.
