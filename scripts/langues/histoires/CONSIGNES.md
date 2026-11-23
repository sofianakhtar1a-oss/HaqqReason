# Consignes : les histoires du Truchement

Le Truchement est le module du site HaqqReason où des **francophones apprennent l'anglais**.
Sa bibliothèque propose des histoires en anglais, du niveau A1 au niveau C2. Dans la liseuse,
**chaque mot touché s'affiche en français instantanément**, avec la traduction de toute la
phrase : tout est donc préparé d'avance, mot par mot, phrase par phrase. Ce que tu écris est
exactement ce que verront les élèves.

## Le format d'un lot

Un lot est un fichier `scripts/langues/histoires/sortie/<id>/pages-NN.json` :

```json
{
  "debut": 1,
  "lexique": {
    "mia": ["Mia (prénom)", "Mia", "np"],
    "lighthouse": ["phare", "lighthouse", "n"]
  },
  "pages": [
    {
      "titre": "Chapter 1 — The island",
      "titreFr": "Chapitre 1 — L'île",
      "p": [
        [
          {
            "en": "Mia lives on a small island with her grandfather.",
            "fr": "Mia vit sur une petite île avec son grand-père.",
            "g": {
              "lives": ["vit", "live", "v", "vivre"],
              "small": ["petite", "small", "a", "petit"],
              "island": ["île", "island", "n"],
              "grandfather": ["grand-père", "grandfather", "n"]
            }
          }
        ]
      ]
    }
  ]
}
```

- `debut` : le numéro de la première page du lot (1 pour le premier lot).
- `pages` : chaque page a sa liste de paragraphes `p` ; chaque paragraphe est une liste de
  phrases. `titre` et `titreFr` (facultatifs) ouvrent un chapitre.
- Une phrase : `en` (la phrase anglaise), `fr` (sa traduction française, naturelle et fidèle),
  `g` (les mots de la phrase, en français, dans **ce** contexte).

## Les gloses : chaque mot, en français

Une glose est un petit tableau : `[sens, lemme, nature, sens de base]`.

1. **sens** : la traduction du mot **dans cette phrase**, en 1 à 5 mots français. Pour un
   verbe conjugué, la forme qui convient (« walked » : « marcha » ou « a marché » selon la
   phrase ; « was running » : « courait » sur « running »). Pour une expression figée de
   plusieurs mots, chaque mot reçoit le sens de l'expression (« gave up » : « gave » →
   « abandonna (gave up) », « up » → « (gave up : abandonna) »).
2. **lemme** : la forme de dictionnaire en anglais (« walked » → « walk », « children » →
   « child », « better » → « good »).
3. **nature** : `n` nom, `v` verbe, `a` adjectif, `d` adverbe, `p` pronom, `r` préposition,
   `c` conjonction, `t` article ou déterminant, `x` particule, `np` nom propre.
4. **sens de base** (seulement si le mot est fléchi) : le sens du lemme, tel qu'on le
   rangerait dans un dictionnaire (« walked » → « marcher », « children » → « enfant »).

Où mettre les gloses :
- **`g` de la phrase** : la clé est le mot tel qu'il apparaît, **en minuscules et sans la
  ponctuation autour** (« “Look!” » → `look` ; « Mia’s » → `mia's` ; « don’t » → `don't`,
  avec une apostrophe droite). Si le même mot revient deux fois dans la phrase avec deux
  sens différents, la deuxième occurrence se note `mot#2`.
- **`lexique` du lot** : pour un mot qui garde le même sens dans tout le lot (un prénom, un
  lieu, un objet de l'histoire), une seule glose suffit. La glose de la phrase l'emporte sur
  celle du lexique.
- **Mots-outils** : environ 300 petits mots courants (the, a, and, of, to, he, she, is, was,
  have, can, not, very…) ont déjà une glose générale dans
  `scripts/langues/histoires/mots-outils.json`. Tu n'as pas à les gloser, sauf si leur sens
  dans la phrase est particulier (« like » = « aimer » et non « comme », « so » = « tellement »,
  « that » = « si » dans « not that big », « back » dans « came back »…) : glose-les alors
  dans `g`.

**Chaque mot** de chaque phrase doit trouver sa glose (phrase, lexique ou mots-outils) : le
contrôle signale tout mot oublié. Les nombres écrits en chiffres n'en ont pas besoin.

La traduction `fr` de la phrase est naturelle, en bon français, fidèle au sens et au ton
(comme dans un livre bilingue de qualité) ; le guillemet anglais “…” devient « … ».

## Le fichier de présentation `meta.json`

```json
{
  "id": "le-chat-du-phare",
  "titre": "The Lighthouse Cat",
  "titreFr": "Le chat du phare",
  "auteur": "HaqqReason",
  "niveau": "A1",
  "genre": "Aventure",
  "resume": "Deux ou trois phrases en français qui donnent envie de lire, sans révéler la fin.",
  "questions": [
    { "q": "Où vit Mia ?", "o": ["Sur une petite île", "À Londres", "Dans une ferme"], "i": "Relis la première page.", "e": "Mia vit sur une petite île avec son grand-père, le gardien du phare." }
  ]
}
```

`questions` : 8 questions de compréhension à choix (2 à 4 options, la bonne en premier),
dans l'ordre de l'histoire, avec indice `i` et correction `e` en phrases complètes. Pour A1 et
A2, questions et options en français ; de B1 à C2, questions et options en anglais (indice
et correction toujours en français).

## Le contrôle

`npx tsx scripts/langues/histoires/valider.mts <id>` (depuis /home/claude/haqqreason) doit
finir sur « 0 problème(s) ». Il vérifie le format, les gloses (aucun mot oublié, clés
existantes), les pages et, pour un texte classique, que l'anglais n'a pas changé.

Contenu sain et familial : pas d'alcool, pas de relation amoureuse, pas de violence gratuite,
pas de jeux d'argent, pas de sujet religieux polémique, rien sur le poids ou les régimes.

## A. Écrire une histoire originale (A1 à C2)

Tu écris toi-même l'histoire, page par page, avec ses traductions et ses gloses.

| Niveau | Pages | Mots par page | Langue |
|---|---|---|---|
| A1 | 12 | 100 à 140 | présent simple et continu, can, there is/are, impératif ; was/were rarement ; phrases de 4 à 10 mots ; vocabulaire très courant |
| A2 | 13 | 150 à 190 | prétérit, going to, comparatifs, should, present perfect simple ; phrases de 15 mots au plus |
| B1 | 14 | 200 à 240 | tous les temps courants, conditionnels 1 et 2, passif simple, discours rapporté ; vocabulaire plus riche |
| B2 | 15 | 230 à 270 | verbes à particule, expressions idiomatiques, conditionnel 3, modaux de déduction, relatives ; style vivant |
| C1 | 15 | 260 à 300 | inversion, phrases clivées, conditionnels mixtes, participiales, verbes à particule et idiomes avancés, vocabulaire précis et nuancé, registres variés (dialogue, récit, ironie légère) |
| C2 | 15 | 280 à 320 | prose littéraire : vocabulaire rare et exact, syntaxe ample et maîtrisée, discours indirect libre, sous-entendus, humour ou ironie fins, images ; le niveau d'une bonne nouvelle publiée |

- Une vraie histoire : des personnages attachants, un problème, des rebondissements, une fin
  qui fait plaisir. Des chapitres (titre en anglais et en français), des dialogues.
- Chaque page se lit seule (une scène, un moment), et donne envie de tourner la page.
- Des personnages aux prénoms variés (français, britanniques, d'ailleurs).
- Écris l'histoire en plusieurs lots si elle est longue (par exemple pages 1 à 5, puis 6 à
  10…) : `pages-01.json`, `pages-02.json`… avec le bon `debut`. Au plus 6 pages par lot en A1
  et A2, 5 en B1 et B2, 4 en C1 et C2.
- En C1 et C2, la langue est celle d'un auteur, pas d'un manuel : un texte qu'un lecteur anglais
  lirait pour le plaisir. Les mots rares et les tournures figurées reçoivent une glose précise.

## B. Traduire un texte classique (domaine public)

Le texte anglais est déjà découpé : `scripts/langues/histoires/entree/<id>/pages-NN.json`
(mêmes pages, mêmes paragraphes ; chaque phrase est une chaîne). Le texte complet est dans
`scripts/langues/histoires/textes/<id>.txt`.

- Recopie **exactement** l'anglais (ne le modernise pas, ne le corrige pas). Tu peux
  seulement fusionner ou couper une phrase mal découpée, si l'anglais du paragraphe, mis bout
  à bout, reste identique.
- La traduction française est littéraire et fidèle (le niveau d'une bonne édition
  bilingue). Les mots anciens ou rares reçoivent leur sens d'époque dans la glose
  (« endeavoured » : « s'efforça », « singular » : « étrange »).
- Le lot que tu traduis peut commencer au milieu de l'histoire : lis le texte complet pour
  comprendre le contexte.
