# La chaîne de préparation des modèles de L'Écorché

Elle transforme l'atlas libre **Z-Anatomy** (CC BY-SA 4.0, construit sur BodyParts3D) en paquets légers pour le site.
Les sources restent hors du dépôt ; seuls les scripts et les paquets finis sont versionnés.

## Ce qu'il faut

- Python 3.13 avec `numpy` et `scipy`, plus un environnement qui a Blender en module : `uv venv ~/venv-bpy --python 3.13`
  puis `uv pip install --python ~/venv-bpy/bin/python bpy numpy scipy`.
- `gcc` (pour `rayons.c`, compilé à la volée).
- Les sources, côte à côte dans un même dossier (par défaut `/home/claude`, sinon `RACINE_CORPS=…`) :
  - `z-anatomy/models-of-human-anatomy` : `git clone https://github.com/Z-Anatomy/Models-of-human-anatomy`
    (on en tire `Z-Anatomy.zip` → `Startup.blend`, et `TA2.csv`) ;
  - `kevin-mattheus-moerman/bodyparts3d` : `git clone https://github.com/Kevin-Mattheus-Moerman/BodyParts3D`
    (les maillages d'origine de BodyParts3D, pour le rein et quelques muscles absents de Z-Anatomy).
- `donnees-corps/` : le dossier de travail (il se remplit tout seul).

## Les étapes

| Étape | Commande | Ce qu'elle fait |
|-------|----------|-----------------|
| 1 | `~/venv-bpy/bin/python -I 01_exporter.py -- <Startup.blend> ~/donnees-corps/brut <début> <fin>` par tranches de 1 500 objets | Chaque objet évalué par Blender (modificateurs appliqués), sans exécuter les scripts du fichier |
| 2 | `python 02_classer.py` | Couche, sorte, côté, nom officiel TA2, exclusions (peau, pudeur, licences non commerciales) |
| 3 | `~/venv-bpy/bin/python 03_geometrie.py` | Soudure, lissage, trois niveaux de détail, tendon et cartilage par sommet, vaisseaux et nerfs retracés |
| 4 | `python 04_attributs.py` | Profondeur des muscles, occlusion ambiante précalculée (lancer de rayons : `rayons.c`) |
| 5 | `python 05_paquets.py` | Les paquets compressés de `public/corps/` et le manifeste |
| 6 | `python 06_catalogue.py` | Les éléments, les pièces, les insertions et les repères de `src/lib/corps/modele/` |

`apercu.py` rend une image de contrôle avec Cycles (indépendante du moteur du site).

## Le format d'un paquet

`ECO1`, la longueur de l'en-tête, l'en-tête JSON (les pièces, leurs plages, leurs boîtes), puis les flux : positions
quantifiées au 1/32 de millimètre et normales octaédriques, en différences ; douze attributs d'un octet (poids de
matière, occlusion, fibres, animation) ; triangles en entiers à longueur variable. Le tout en gzip. Le décodeur est
`src/lib/corps/modele/paquet.ts`.

## Licence des modèles dérivés

Les fichiers de `public/corps/` dérivent de Z-Anatomy et de BodyParts3D : ils sont partagés sous CC BY-SA 4.0.
Attribution : « Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0 » et
« BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan ».
