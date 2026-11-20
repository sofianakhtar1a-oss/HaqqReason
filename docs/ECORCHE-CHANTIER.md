# L'Écorché — le grand chantier (plan et état)

Ce fichier est la mémoire du chantier. Il dit ce qui est fait, ce qui reste, et les décisions prises.
Le pourcentage annoncé à chaque point d'étape est la somme des poids des tâches faites (colonne « fait »).

## Le but

1. Le corps humain le plus réaliste et le plus complet qu'on puisse voir dans un navigateur : de vrais modèles
   anatomiques, toutes les structures, un rendu de pièce de musée, jamais de peau.
2. Un apprentissage qui fait comprendre et retenir à quoi sert chaque structure : fiches riches, quiz sur les
   fonctions, répétition espacée.

## Les sources (vérifiées le 20 novembre 2026)

- **Z-Anatomy** (https://github.com/Z-Anatomy/Models-of-human-anatomy), fichier `Z-Anatomy.zip` → `Startup.blend`
  (version du dépôt : 31b1a7a, 20 novembre 2026). Licence CC BY-SA 4.0. Attribution demandée :
  « Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0 » et
  « BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan ».
- Le même dépôt fournit `TA2.csv` : la Terminologia Anatomica 2 (anglais, latin, français…), notre référence de noms.
- Éléments sous licence non commerciale, **écartés** : l'oreille interne (Université de Dundee, CC BY-NC-SA) et
  le rein (Lissie Cowley, CC BY-NC). Écartés aussi : la peau et les régions de surface, les organes génitaux externes.
- Les modèles dérivés (nos fichiers dans `public/corps/`) sont partagés sous la même licence CC BY-SA 4.0.

## Les décisions

- **Données** : tout vient de Z-Anatomy (7 184 objets : 277 os et cartilages, 683 pièces musculaires, 705 surfaces
  d'insertion, 413 pièces articulaires, 654 vaisseaux, 249 nerfs, encéphale, viscères). Le fichier donne aussi, pour
  chaque muscle : ses faces tendineuses (matière « Tendon »), ses surfaces d'origine et de terminaison posées sur les os,
  son nerf et sa loge (collections), sa famille d'action (matière).
- **Chaîne** : `scripts/corps/01_exporter.py` (Blender en module Python, `bpy` 5.3) sort chaque objet évalué ;
  la suite (nettoyage, niveaux de détail, attributs, paquets) est en TypeScript dans `scripts/corps/`.
  Les données brutes restent hors du dépôt (`~/donnees-corps`), les paquets finis vont dans `public/corps/`.
- **Moteur** : on garde et on pousse le moteur WebGL2 maison (quatre dessins par image, sélection au pixel,
  états par structure) plutôt que three.js : il tient déjà des milliers de structures à 60 images par seconde sur
  téléphone, et les matières des tissus demandent de toute façon des shaders écrits à la main.
- **Repère** : mètres, y vers le haut depuis le sol, x vers la gauche du sujet, z vers l'avant
  (depuis Blender : x = x, y = z, z = −y).

## Les tâches (poids sur 100)

| n° | Tâche | poids | fait |
|----|-------|-------|------|
| 1.1 | Sources, licences, export depuis Blender | 4 | 4 |
| 1.2 | Classement : couches, structures, côtés, noms français et latins (TA2), exclusions | 4 | 4 |
| 1.3 | Géométrie : soudure, normales, vaisseaux retracés, lissage, trois niveaux de détail | 4 | 3 |
| 1.4 | Attributs : occlusion précalculée, sens des fibres, tendon et cartilage, poids d'animation, onde artérielle | 4 | 1 |
| 1.5 | Paquets compressés, noms hachés, chargement progressif | 2 | 2 |
| 2.1 | Moteur : chargement des paquets, détail selon l'appareil, sélection, états | 4 | 2 |
| 2.2 | Matières physiques par tissu (muscle, tendon, os, cartilage, artère, veine, nerf, viscère) | 5 | 2 |
| 2.3 | Lumière de studio, ombres, occlusion, mappage tonal, anticrénelage, profondeur de champ | 5 | 1 |
| 2.4 | Deux rendus (pièce fraîche, pièce plastinée), qualité adaptative | 2 | 0 |
| 3.1 | Catalogue complet des os, muscles, tendons, artères, relié aux modèles | 4 | 1 |
| 3.2 | Nouvelles couches : veines, nerfs, ligaments et cartilages, viscères, encéphale | 4 | 0 |
| 3.3 | Listes de référence TA2, test de couverture, structures manquantes modélisées | 4 | 0 |
| 4.1 | Dissection au geste, isolement avec les attaches, vue éclatée | 3 | 0 |
| 4.2 | Plans de coupe avec surfaces de coupe réalistes | 3 | 0 |
| 4.3 | Squelette articulé : segments, axes, amplitudes | 4 | 0 |
| 4.4 | Contraction des muscles, action de chaque muscle, cœur et pouls | 4 | 0 |
| 5.1 | Schéma des fiches, données tirées de Z-Anatomy (insertions, nerfs, loges) | 3 | 1 |
| 5.2 | Fiches des os | 3 | 0 |
| 5.3 | Fiches des muscles | 5 | 0 |
| 5.4 | Fiches des tendons et aponévroses | 2 | 0 |
| 5.5 | Fiches des artères | 3 | 0 |
| 5.6 | Fiches des autres couches | 2 | 0 |
| 6.1 | Nouvelles méthodes de quiz sur les fonctions | 6 | 0 |
| 6.2 | Répétition espacée FSRS par facette, certitude, reprise de la progression | 4 | 0 |
| 6.3 | Planches exhaustives, examen final, carte de maîtrise par facette | 4 | 0 |
| 7.1 | Interface : couches, coupes, mouvements, fiches enrichies, page « Sources et licences » | 4 | 0 |
| 7.2 | Captures de contrôle, tests, performances, mise en ligne, bilan | 4 | 0 |

**Total fait : 21 / 100.**

## Journal

- 20/11 18:40 — Début. Z-Anatomy récupéré, licence lue, `bpy` installé, les 7 184 objets exportés
  (17 millions de triangles bruts, à ramener à environ 3 millions sur ordinateur et 1 million sur téléphone).

- 20/11 19:45 — Les 1 697 pièces sont classées en 10 couches (`02_classer.py`), allégées en trois niveaux de détail
  (`03_geometrie.py` : 11,7 / 3,7 / 1,05 millions de triangles affichés), l'occlusion et la profondeur des muscles sont
  précalculées (`04_attributs.py`, `rayons.c`), les paquets sont écrits (`05_paquets.py` : 40 / 13 / 4 Mo) et le catalogue
  est généré (`06_catalogue.py` : 1 605 éléments). Le nouveau moteur (`src/app/corps/moteur/reel.ts`) affiche le corps réel
  dans la page d'essai `/tmp/ecorche2` (hors dépôt). Reste avant la bascule : fibres, réglage des matières, intégration.

## Pour reprendre après une interruption

1. Lire ce fichier, puis `scripts/corps/LISEZMOI.md`.
2. Les données brutes : `~/donnees-corps/brut` (les refaire avec `01_exporter.py` si le dossier a disparu).
3. Continuer à la première tâche dont « fait » est inférieur au poids.
