# Décrire les structures à construire (L'Écorché, étape 1 quater)

L'Écorché est un atlas d'anatomie en 3D, en français. Son modèle vient de Z-Anatomy, qui n'a pas toutes les
structures de la nomenclature (Terminologia Anatomica 2). Tu décris ici, une par une, celles de ton lot qui manquent,
pour que le script `01d_ajouts.py` les construise **à leur place exacte** dans le corps : une branche d'artère part
de son artère mère au bon endroit et finit dans l'organe qu'elle irrigue, un ganglion est posé où les manuels le
placent, un ligament relie les bons reliefs des bons os. Le résultat doit être juste anatomiquement : c'est ce que
verront des étudiants.

## Ce qu'on te donne

- ton lot : `/tmp/m1/lot-<lot>.tsv` (numéro TA2, nom anglais, nom français). Tous ses termes sont à traiter.
- `/tmp/m1/objets.txt` : tous les objets du modèle, avec leur nom exact. Un objet « X.l » / « X.r » existe des deux
  côtés : dans une description, écris « X » sans le côté (le script prend celui du tracé). Certains objets d'un seul
  côté s'appellent « Left … » / « Right … » : écris le nom sans « Left »/« Right » si les deux existent, sinon le nom
  exact.
- `/tmp/m1/reliefs.txt` : les reliefs nommés des os et de quelques organes (points d'ancrage précis).
- `/tmp/m1/elements.txt` : les structures déjà présentes dans l'atlas (ne les ajoute pas une seconde fois).
- `scripts/corps/01d_ajouts.py` : le constructeur ; son en-tête décrit le format exact. Lis-le.

## Ce que tu rends

Un seul fichier : `scripts/corps/donnees/ajouts/<lot>.json`, de la forme `{"structures": [ … ]}`, et, si ton lot a
des termes qui désignent un groupe de structures **déjà présentes**, un fichier
`scripts/corps/donnees/ajouts/ensembles-<lot>.json` : `{"Terme anglais exact du lot": ["nom anglais d'un membre", …]}`
(les noms des membres tels qu'ils sont dans `elements.txt`, colonne 3). N'écris dans aucun autre fichier.

Chaque structure :

```json
{"nom": "Lingual artery", "couche": "artere", "forme": "trace", "cotes": "deux", "rayon": [1.4, 0.6],
 "points": [{"objet": "External carotid artery", "a": 0.12},
            {"objet": "Hyoid bone", "rel": [0.55, 0.9, 0.2], "decale": [0, 4, 0]},
            {"objet": "Tongue", "rel": [0.3, -0.4, -0.2]},
            {"objet": "Tongue", "rel": [0.25, -0.2, 0.7]}],
 "texte": "Branche de la carotide externe née en regard de la grande corne de l'os hyoïde ; elle passe sous le muscle hyoglosse et irrigue la langue et le plancher de la bouche.",
 "sources": ["gray1918", "tma"]}
```

- `nom` : le nom anglais **exact** de la colonne 2 du lot (même s'il contient une coquille : c'est la clé).
- `couche` : `artere`, `veine`, `nerf`, `lymphe`, `ligament`, `muscle`, `os`, `viscere` ou `encephale`.
- `cotes` : `deux` (une structure paire : décris le côté gauche du sujet comme le droit, le script fait les deux),
  `milieu` (une structure unique, sur la ligne médiane ou non), `gauche` ou `droite` (une structure d'un seul côté,
  comme l'artère lingulaire du poumon gauche ou la veine surrénale droite).
- `forme` et ses champs : voir l'en-tête de `01d_ajouts.py` (`trace`, `satellite`, `plexus`, `ganglion`, `noeuds`,
  `bande`, `fuseau`). Un terme au pluriel (« Jejunal arteries ») : une seule structure avec plusieurs tracés
  (`"traces": [[points…], [points…]]`, de 3 à 8 selon la réalité).
- `texte` : en français, une ou deux phrases à toi (pas de copie) : d'où elle naît, par où elle passe, ce qu'elle
  irrigue, draine ou innerve (pour un ligament : ce qu'il relie ; pour un noyau : son rôle). Il servira aux fiches.
- `sources` : les clés des références réellement consultées, parmi `gray1918` (Gray's Anatomy 1918, texte intégral :
  https://ia600602.us.archive.org/26/items/anatomyofhumanbo1918gray/anatomyofhumanbo1918gray_djvu.txt),
  `tma` (TeachMeAnatomy), `kenhub`, `radiopaedia`, `statpearls`, `wikipedia`. Économise les recherches web
  (elles sont partagées) : tes connaissances d'anatomie suffisent pour la plupart des trajets ; ne cherche que ce
  dont tu doutes.

## Les points

Chaque point est posé sur un objet du modèle (voir l'en-tête du script) :
- `{"objet": X, "a": t}` : sur l'axe de X (une artère, un nerf : de son origine, t = 0, à sa fin, t = 1 ; vérifie le
  sens avec un aperçu) ; c'est le bon choix pour l'origine d'une branche sur son tronc ;
- `{"objet": X, "rel": [u, v, w]}` : dans la boîte de X ; u de −1 (bord médial) à 1 (bord latéral), v de −1 (bas)
  à 1 (haut), w de −1 (arrière) à 1 (avant) ;
- `{"objet": X, "proche": true}` : le point de X le plus proche du point précédent (pour finir « sur » un muscle) ;
- `{"objet": X, "centre": true}`, `{"objet": X, "bord": "superieur"}` (…`inferieur`, `anterieur`, `posterieur`,
  `medial`, `lateral`) ;
- `{"repere": "Nom d'un relief"}` (voir `reliefs.txt`) ;
- `"decale": [dehors, haut, avant]` en millimètres, ajouté au point.
Un tracé passe par ses points dans l'ordre : mets assez de points intermédiaires pour qu'il contourne les os et les
organes comme le vrai (3 à 6 en général).

## Les mesures (rayons en millimètres)

Artères : branche moyenne 1 à 2 (la linguale 1,4 ; la thyroïdienne supérieure 1,2), petite branche 0,4 à 0,8.
Veines : un peu plus grosses que l'artère voisine. Nerfs : 0,5 à 1,5 ; rameaux 0,3. Plexus : brins de 0,3 à 0,4.
Ganglions : `taille_mm` [largeur, profondeur, longueur] (le cervical supérieur : [5, 4, 25] ; le ciliaire : [2, 1, 2]).
Nœuds lymphatiques : 3 à 8 mm. Ligaments : largeur 2 à 10, épaisseur 1 à 2. Muscles : largeur et épaisseur réelles.
**Pour l'encéphale**, un noyau est un `ganglion` de la couche `encephale` posé dans sa structure (thalamus,
hypothalamus, mésencéphale, pont, moelle allongée, cervelet, moelle spinale) à la bonne place relative ; un faisceau,
un tractus ou une commissure est un `trace` (rayon 0,5 à 1,5) ; un sillon peut être un `trace` fin posé à la surface
(rayon 0,4) entre les gyrus qui le bordent ; un lobe, un groupe de gyrus ou de noyaux déjà présents est un ensemble.

## Contrôler

Depuis `scripts/corps` :

```
python3 -I 01d_ajouts.py --verifier donnees/ajouts/<lot>.json
```

Le travail est fini quand il affiche « 0 erreur(s) » et que **chaque terme du lot** est traité (une structure, ou une
entrée du fichier d'ensembles). Écris le fichier par étapes (toutes les dix structures) et contrôle souvent.

Regarde aussi le résultat : construis tes structures puis fais un aperçu (image PNG que tu peux lire) :

```
python3 -I 01d_ajouts.py && /home/claude/venv-bpy/bin/python /tmp/m1/voir.py /tmp/m1/<lot>-1.png "<motif des noms à montrer>" "<motif des objets du contexte>" <azimut> <élévation> <x> <y> <z> <hauteur visible en m>
```

(repère de Blender, en mètres : x vers la gauche du sujet, y vers l'arrière, z vers le haut ; le corps va de z = 0 aux
pieds à z = 1,75 environ ; azimut 0 = vu de face, 90 = vu de la gauche du sujet ; élévation en degrés). Par exemple,
le cou vu de trois quarts : `60 5 0 -0.02 1.52 0.22`. Vérifie au moins une image par région de ton lot, et corrige ce
qui traverse un os, sort du corps ou finit au mauvais organe. `python3 -I 01d_ajouts.py` sans `--verifier` écrit les
structures de **tous** les lots : ne t'inquiète pas des erreurs des autres lots, seules les tiennes comptent.

## Les règles

1. **Exactitude d'abord** : origine, trajet, terminaison et côté conformes aux manuels. Une structure inconstante
   ou variable se trace dans sa disposition la plus fréquente.
2. **Rien en double** : si une structure du lot existe déjà sous un autre nom dans `elements.txt`, ne la construis
   pas ; signale-le à la fin de ton travail.
3. **Ne modifie aucun autre fichier** du dépôt, ne lance ni git ni npm.
4. À la fin, réponds en quelques lignes : nombre de structures et d'ensembles écrits, termes que tu n'as pas pu
   traiter et pourquoi, doutes anatomiques restants.
