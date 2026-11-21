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
  la suite (nettoyage, niveaux de détail, attributs, paquets, catalogue) est en Python dans `scripts/corps/`
  (voir son `LISEZMOI.md`).
  Les données brutes restent hors du dépôt (`~/donnees-corps`), les paquets finis vont dans `public/corps/`.
- **Moteur** : on garde et on pousse le moteur WebGL2 maison (quatre dessins par image, sélection au pixel,
  états par structure) plutôt que three.js : il tient déjà des milliers de structures à 60 images par seconde sur
  téléphone, et les matières des tissus demandent de toute façon des shaders écrits à la main.
- **Zones** : dans Z-Anatomy, un tendon est une partie du maillage de son muscle. Chaque sommet porte un code de
  zone ; le moteur en fait une structure à part entière (on la touche, on l'allume, on la nomme).
- **Voiles** : le platysma et la gaine du droit de l'abdomen couvrent ce qu'un écorché montre ; on ne les affiche
  qu'avec les fascias. La peau de Z-Anatomy ne sert qu'à calculer ce qui couvre chaque muscle : elle n'est jamais affichée.
- **Planches** : la composition des planches publiées est figée (`scripts/corps/donnees/planches-publiees.json`).
  Les nouvelles structures s'explorent tout de suite ; leurs planches s'ajouteront à la suite, une fois les rangs relus.
- **Haute définition** : le niveau le plus fin (45 Mo) reste hors du dépôt tant que les modèles bougent
  (`donnees/publication.json`, `.gitignore`) ; le site sert alors au mieux le niveau standard.
- **Repère** : mètres, y vers le haut depuis le sol, x vers la gauche du sujet, z vers l'avant
  (depuis Blender : x = x, y = z, z = −y).

## Les tâches (poids sur 100)

| n° | Tâche | poids | fait |
|----|-------|-------|------|
| 1.1 | Sources, licences, export depuis Blender | 4 | 4 |
| 1.2 | Classement : couches, structures, côtés, noms français et latins (TA2), exclusions | 4 | 4 |
| 1.3 | Géométrie : soudure, normales, vaisseaux retracés, lissage, trois niveaux de détail | 4 | 3 |
| 1.4 | Attributs : occlusion précalculée, sens des fibres, tendon et cartilage, poids d'animation, onde artérielle | 4 | 4 |
| 1.5 | Paquets compressés, noms hachés, chargement progressif | 2 | 2 |
| 2.1 | Moteur : chargement des paquets, détail selon l'appareil, sélection, états | 4 | 3 |
| 2.2 | Matières physiques par tissu (muscle, tendon, os, cartilage, artère, veine, nerf, viscère) | 5 | 2 |
| 2.3 | Lumière de studio, ombres, occlusion, mappage tonal, anticrénelage, profondeur de champ | 5 | 1 |
| 2.4 | Deux rendus (pièce fraîche, pièce plastinée), qualité adaptative | 2 | 1 |
| 3.1 | Catalogue complet des os, muscles, tendons, artères, relié aux modèles | 4 | 3 |
| 3.2 | Nouvelles couches : veines, nerfs, ligaments et cartilages, viscères, encéphale | 4 | 3 |
| 3.3 | Listes de référence TA2, test de couverture, structures manquantes modélisées | 4 | 1 |
| 4.1 | Dissection au geste, isolement avec les attaches, vue éclatée | 3 | 2 |
| 4.2 | Plans de coupe avec surfaces de coupe réalistes | 3 | 2 |
| 4.3 | Squelette articulé : segments, axes, amplitudes | 4 | 3 |
| 4.4 | Contraction des muscles, action de chaque muscle, cœur et pouls | 4 | 3 |
| 5.1 | Schéma des fiches, données tirées de Z-Anatomy (insertions, nerfs, loges) | 3 | 3 |
| 5.2 | Fiches des os | 3 | 3 |
| 5.3 | Fiches des muscles | 5 | 5 |
| 5.4 | Fiches des tendons et aponévroses | 2 | 2 |
| 5.5 | Fiches des artères | 3 | 3 |
| 5.6 | Fiches des autres couches | 2 | 1.5 |
| 6.1 | Nouvelles méthodes de quiz sur les fonctions | 6 | 0 |
| 6.2 | Répétition espacée FSRS par facette, certitude, reprise de la progression | 4 | 2 |
| 6.3 | Planches exhaustives, examen final, carte de maîtrise par facette | 4 | 1 |
| 7.1 | Interface : couches, coupes, mouvements, fiches enrichies, page « Sources et licences » | 4 | 2 |
| 7.2 | Captures de contrôle, tests, performances, mise en ligne, bilan | 4 | 1 |

**Total fait : 64.5 / 100.**

## Journal

- 20/11 18:40 — Début. Z-Anatomy récupéré, licence lue, `bpy` installé, les 7 184 objets exportés
  (17 millions de triangles bruts, à ramener à environ 3 millions sur ordinateur et 1 million sur téléphone).

- 20/11 19:45 — Les 1 697 pièces sont classées en 10 couches (`02_classer.py`), allégées en trois niveaux de détail
  (`03_geometrie.py` : 11,7 / 3,7 / 1,05 millions de triangles affichés), l'occlusion et la profondeur des muscles sont
  précalculées (`04_attributs.py`, `rayons.c`), les paquets sont écrits (`05_paquets.py` : 40 / 13 / 4 Mo) et le catalogue
  est généré (`06_catalogue.py` : 1 605 éléments). Le nouveau moteur (`src/app/corps/moteur/reel.ts`) affiche le corps réel
  dans la page d'essai `/tmp/ecorche2` (hors dépôt). Reste avant la bascule : fibres, réglage des matières, intégration.

- 20/11 19:57 — Le sens des fibres est calculé pour les muscles, tendons et ligaments (`04b_fibres.py`), et dessiné en
  relief par le moteur. Les tendons, qui sont dans Z-Anatomy des parties du maillage des muscles, deviennent des
  structures à part entière grâce aux zones (`04c_zones.py` : 164 zones, 94 tendons, dont les 22 de la première version).
  Le catalogue compte 1 700 éléments ; 225 des 227 identifiants d'origine sont repris (restent le semi-épineux de la tête
  et l'aponévrose bicipitale, absents des modèles : à modéliser). Les planches déjà jouées gardent leur contenu
  (`donnees/planches-publiees.json`). En cours : le branchement du site sur le nouveau moteur (la bascule).

- 20/11 20:26 — Le site est branché sur le nouveau moteur (`Corps3D.tsx`, `modele/modele.ts`, `moteur/chargement.ts`) :
  le corps réel s'affiche, les dix couches et les enveloppes (fascias, gaines, bourses, séreuses) se montrent à la
  demande et se téléchargent à ce moment-là, les surfaces d'insertion d'un muscle s'allument (origine en rouge,
  terminaison en bleu). Les anciens fichiers du corps fabriqué (`anatomie/`, `geometrie.ts`, `scene.ts`, `rendu.ts`)
  sont retirés. Tests, typage, lint et construction passent. Le platysma et la gaine du droit de l'abdomen deviennent
  des « voiles » qu'on ne montre qu'avec les fascias (`commun.py`). Reste avant la mise en ligne : recalcul de
  l'occlusion sans les voiles (en cours), contrôle sur téléphone, parcours d'une partie.

- 20/11 20:55 — La bascule est prête et mise en ligne. Ce qui couvre chaque muscle est calculé
  (`04d_couvertures.py`) : pour montrer un muscle profond, le site n'ôte plus que ce qui le cache (le petit pectoral
  apparaît sous le seul grand pectoral). Le moteur mesure sa cadence et s'allège de lui-même (résolution, ombres) ;
  la sélection ne dessine plus que le pixel visé. Une page « Sources et licences » cite Z-Anatomy et BodyParts3D.
  Contrôles faits en rendu logiciel, sur ordinateur et téléphone : accueil, planches, explorateur, une partie
  (reconnaître, situer). Non mesuré ici : les images par seconde sur une vraie carte graphique.

- 20/11 21:50 — Le squelette est articulé. `squelette.py` mesure sur les os le centre et les axes de chaque
  articulation (sphère ajustée sur les têtes du fémur et de l'humérus, noyau de chaque disque intervertébral, axe du
  col de chaque côte, charnières affinées par le jeu des surfaces) ; `04e_squelette.py` donne à chaque sommet du corps
  les deux segments qu'il suit (attributs BA, BB, BW) ; `04f_pouls.py`, à chaque sommet d'artère sa distance au cœur.
  Côté site : `mouvement/articulations.ts` (les degrés de liberté et leurs amplitudes), `mouvement/squelette.ts`
  (des angles aux matrices ; rythme scapulo-huméral, patella, sternum porté par les côtes), `mouvement/gestes.ts`
  (du vocabulaire des fiches au geste : « coude, flexion » → un programme d'animation). Le moteur déplace os, muscles,
  tendons, vaisseaux et nerfs sur la carte graphique, fait gonfler le ventre d'un muscle qui travaille, battre les
  artères, et sait couper le corps par un plan (la tranche prend le grain du tissu). `Corps3D` reçoit la pose, le plan
  de coupe, la vue éclatée et le scalpel ; l'interface de ces outils reste à poser. Les fiches enrichies : cadre en
  place (`donnees/fiches/`), onze lots confiés à des sous-agents, deux rendus (muscles des membres).

- 21/11 10:35 — Fiches : os, muscles, tendons, artères, ligaments, veines, nerfs, lymphonœuds et encéphale complets
  (1 601 fiches, deux sources au moins chacune) ; viscères de la tête et du cou faits, ceux du tronc en cours. Planches
  exhaustives : 222 planches couvrent les 1 702 structures (viscères par système, encéphale par partie, vaisseaux et
  nerfs par tronc), les planches déjà publiées n'ont pas bougé. L'atelier (poses, curseurs, coupe, éclaté, scalpel,
  cœur et poumons vivants) et la mémoire par facette (FSRS) sont en ligne.

## Pour reprendre après une interruption

1. Lire ce fichier, puis `scripts/corps/LISEZMOI.md`.
2. Les données brutes : `~/donnees-corps/brut` (les refaire avec `01_exporter.py` si le dossier a disparu).
3. Continuer à la première tâche dont « fait » est inférieur au poids.
