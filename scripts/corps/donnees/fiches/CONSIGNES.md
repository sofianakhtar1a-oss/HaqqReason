# Rédiger un lot de fiches d'anatomie pour L'Écorché

L'Écorché est un atlas d'anatomie en 3D pour apprendre le corps humain, en français. Chaque structure
(muscle, artère, os, tendon…) a une fiche. Ces fiches nourrissent l'affichage **et les quiz** : elles doivent
être exactes, vérifiées, et structurées exactement comme décrit ici.

## Ce qu'on te donne

- `entree/<lot>.json` : les structures de ton lot. Pour chacune : son identifiant (`id`), ses noms (français,
  latin, anglais, numéro TA2) et, sous `connu`, ce qu'on sait déjà : les os d'attache relevés sur l'atlas 3D,
  le nerf, les parties modélisées, et le texte de la première version des fiches quand il existe.
  Ce qui est sous `connu` est un point de départ, pas une vérité : corrige-le s'il est faux ou incomplet.
- `entree/_index.json` : tous les identifiants valides, par couche (`os`, `muscle`, `nerf`, `artere`, `tendon`,
  `ligament`, `veine`, `viscere`, `encephale`, `lymphe`), avec leur nom. **Tout renvoi vers une autre structure
  doit utiliser un identifiant de cet index.** Si la structure à citer n'y est pas, ne mets pas d'identifiant :
  nomme-la dans le texte.
- `vocabulaire.json` : les articulations et les mouvements permis (voir « Les actions »).

## Ce que tu rends

Un seul fichier : `sortie/<lot>.json`, de la forme

```json
{
  "sources": { "gray1918": { "titre": "Gray's Anatomy, 20e éd. (1918)", "url": "https://…" }, "…": { } },
  "fiches": [ { "id": "…", … }, … ]
}
```

avec **une fiche par structure du lot**, dans l'ordre du fichier d'entrée. N'écris dans aucun autre fichier.
Écris le fichier par étapes (par exemple toutes les dix fiches) pour ne rien perdre, et lance le contrôle
souvent : `python3 scripts/corps/valider_fiches.py <lot>` (depuis la racine du dépôt). Le travail est fini quand
il affiche « 0 défaut(s) » et que toutes les fiches y sont.

## Les règles d'or

1. **Exactitude d'abord.** Chaque donnée cardinale (attaches, action, innervation et racines pour un muscle ;
   origine, branches et territoire pour une artère ; articulations et reliefs pour un os) doit être vérifiée dans
   **au moins deux références sérieuses**, que tu consultes réellement. Références conseillées, libres d'accès :
   - Gray's Anatomy, 20e édition (1918), domaine public : https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/
     (ou Wikisource) ;
   - OpenStax, *Anatomy and Physiology 2e* (tableaux des muscles, chap. 11 ; vaisseaux, chap. 20) : https://openstax.org ;
   - StatPearls (NCBI Bookshelf), un article par structure : https://www.ncbi.nlm.nih.gov/books/ ;
   - TeachMeAnatomy, Kenhub, Radiopaedia pour recouper ;
   - en français, pour la nomenclature : les cours d'anatomie universitaires en ligne et Wikipédia (jamais seule).
   Inscris dans `sources` (en tête du fichier) chaque référence réellement consultée, et dans la fiche les clés
   des références qui la fondent (au moins deux). Si un site refuse l'accès, prends-en un autre : n'invente
   jamais une source.
2. **Si les références divergent** (les racines d'un nerf, une attache), donne la version la plus admise et
   signale l'écart dans `divergences`. Ce qui varie d'une personne à l'autre va dans `variantes`.
3. **Tes mots à toi.** Ne recopie aucune phrase : reformule, en français clair. Les faits ne sont à personne,
   les phrases si.
4. **La nomenclature française actuelle** (Terminologia Anatomica) : scapula, patella, fibula, ulna, nerf
   fibulaire commun, muscle sterno-cléido-mastoïdien… Les anciens noms (omoplate, rotule, péroné, cubitus,
   sciatique poplité externe) n'apparaissent que si tu les cites comme tels.
5. **Court et dense.** Une idée par champ, des phrases simples, pas de remplissage. Respecte les longueurs.
   Pas de point final dans les champs d'un seul groupe de mots ; une majuscule au début.
6. **Rien d'inventé.** Un champ facultatif que tu ne peux pas fonder se met à `null` (ou s'omet). Un moyen
   mnémotechnique doit être juste : une image vraie vaut mieux qu'une étymologie douteuse.

## La fiche d'un muscle

```json
{
  "id": "biceps-brachial",
  "resume": "Le muscle du devant du bras : il plie le coude et tourne la paume vers le haut.",
  "origine": [
    { "texte": "Chef long : tubercule supra-glénoïdal de la scapula", "os": ["scapula"] },
    { "texte": "Chef court : sommet du processus coracoïde", "os": ["scapula"] }
  ],
  "terminaison": [
    { "texte": "Tubérosité du radius", "os": ["radius"] },
    { "texte": "Fascia de l'avant-bras, par l'aponévrose bicipitale", "os": [] }
  ],
  "action": "Fléchit le coude et met l'avant-bras en supination ; aide à lever le bras vers l'avant",
  "actions": [
    { "articulation": "coude", "mouvement": "flexion", "role": "principal" },
    { "articulation": "radio-ulnaire", "mouvement": "supination", "role": "principal", "precision": "surtout coude fléchi" },
    { "articulation": "epaule", "mouvement": "flexion", "role": "accessoire" }
  ],
  "synergistes": ["brachial", "brachio-radial"],
  "antagonistes": ["triceps-brachial"],
  "innervation": { "nerf": "nerf-musculocutane", "texte": "Nerf musculo-cutané", "racines": ["C5", "C6"] },
  "vascularisation": { "texte": "Rameaux musculaires de l'artère brachiale", "arteres": ["humerale"] },
  "palpation": "Sur le devant du bras, coude fléchi contre résistance ; son tendon se sent au pli du coude",
  "test": "Flexion du coude contre résistance, avant-bras en supination",
  "atteinte": "Lésion du nerf musculo-cutané : flexion du coude et supination affaiblies. Rupture du chef long : le muscle se met en boule (signe de Popeye)",
  "clinique": "Son réflexe (bicipital) explore les racines C5 et C6",
  "memo": "Le tire-bouchon : il visse (supination) puis il tire (flexion)",
  "variantes": "Un troisième chef, huméral, chez environ une personne sur dix",
  "sources": ["gray1918", "statpearls-biceps"],
  "divergences": null
}
```

- `origine`, `terminaison` : une entrée par chef ou par attache. `os` : les identifiants des os (ou tendons,
  ligaments) de l'index où elle se fait ; liste vide si l'attache est une peau, un fascia, un autre muscle.
  Par convention, l'origine est l'attache proximale ou la plus fixe.
- `action` : la phrase de synthèse (elle sert d'indice dans un quiz : n'y nomme pas le muscle).
- `actions` : **toutes** les actions, une par couple articulation-mouvement, avec les clés de
  `vocabulaire.json`. `role` : `principal` (le muscle est moteur de ce mouvement) ou `accessoire`. Pour un
  muscle du rachis ou du cou, `inclinaison`, `rotation-homolaterale` et `rotation-controlaterale` décrivent la
  contraction d'un seul côté ; `extension` ou `flexion`, la contraction des deux. Pour un muscle de la
  mimique : articulation `visage`, mouvement `expression`, et `precision` dit laquelle (« tire le coin de la
  bouche en haut et en dehors : le sourire »). Pour l'œil : articulation `oeil`, mouvements `elevation`,
  `abaissement`, `adduction`, `abduction`, `rotation-mediale` (intorsion), `rotation-laterale` (extorsion).
- `synergistes`, `antagonistes` : des muscles de l'index (3 ou 4 au plus, les plus importants) ; liste vide
  si la question n'a pas de sens (un muscle de la mimique).
- `innervation` : `nerf` est l'identifiant du nerf dans l'index s'il y est, sinon `null` ; `texte` le nomme
  toujours ; `racines` : C5, T1, L4, S1… ou, pour un nerf crânien, son numéro (V3, VII, XI, XII).
- `vascularisation` : l'artère ou les artères nourricières ; `arteres` : leurs identifiants s'ils existent.
- `palpation`, `test` : où le sentir, comment l'examiner ; `null` si le muscle est hors d'atteinte.
- `atteinte` : ce qui se passe quand il est paralysé ou rompu (obligatoire).
- `clinique` (facultatif) : un fait utile au lit du malade. `memo` : une phrase pour retenir (obligatoire).
- Longueurs : `resume` 200 caractères au plus ; les autres textes 320 ; une attache 220 ; `memo` 220.
- Pour un **ensemble** (la structure a des `membres` : « les intercostaux », « l'érecteur du rachis »), fais la
  fiche du groupe : ce que ses membres ont en commun.

## La fiche d'une artère

```json
{
  "id": "radiale",
  "resume": "L'artère du pouls : elle longe le bord latéral de l'avant-bras jusqu'à la main.",
  "provenance": { "artere": "humerale", "texte": "Branche latérale de bifurcation de l'artère brachiale, au pli du coude" },
  "trajet": "Descend sous le brachio-radial, devient superficielle au poignet dans la gouttière du pouls, contourne le carpe par la tabatière anatomique et gagne la paume",
  "branches": [
    { "artere": null, "texte": "Artère récurrente radiale" },
    { "artere": null, "texte": "Rameau palmaire superficiel" }
  ],
  "terminaison": "Forme l'arcade palmaire profonde en s'unissant au rameau profond de l'artère ulnaire",
  "territoire": { "texte": "Loge latérale de l'avant-bras, pouce, bord latéral de l'index, paume en profondeur", "structures": ["brachio-radial"] },
  "rapports": "Au poignet, entre le tendon du fléchisseur radial du carpe et le radius",
  "pouls": { "ou": "Dans la gouttière du pouls, en dehors du tendon du fléchisseur radial du carpe, contre le radius" },
  "anastomoses": "Avec l'artère ulnaire par les deux arcades palmaires",
  "clinique": "Voie d'abord de la coronarographie ; le test d'Allen vérifie que l'ulnaire peut la suppléer",
  "memo": "Radiale comme radius, du côté du pouce : là où l'on prend le pouls",
  "variantes": "Naissance haute, au bras, chez environ 15 % des personnes",
  "sources": ["gray1918", "statpearls-radiale"]
}
```

- `provenance.artere` : l'identifiant de l'artère mère (ou, pour l'aorte, `null`). `branches` : dans l'ordre où
  elles naissent, de la plus proximale à la plus distale ; `artere` : l'identifiant si la branche est dans
  l'index, sinon `null`. `territoire.structures` : quelques structures de l'index qu'elle irrigue.
- `pouls` : `null` si l'artère ne se palpe pas ; sinon où et comment le prendre.
- `clinique` et `memo` sont obligatoires. Longueurs : `trajet`, `rapports`, `anastomoses`, `clinique` 360 au plus.
- Pour une petite branche (rang 3), la fiche peut être brève, mais tous les champs obligatoires y sont.

## La fiche d'un os (ou d'un cartilage, d'une dent, d'un groupe d'os)

```json
{
  "id": "scapula",
  "resume": "L'os plat de l'épaule : un triangle posé sur les côtes, qui porte le bras.",
  "sorte": "plat",
  "articulations": [
    { "os": "humerus", "nom": "Articulation gléno-humérale", "type": "sphéroïde" },
    { "os": "clavicule", "nom": "Articulation acromio-claviculaire", "type": "plane" }
  ],
  "reliefs": [
    { "nom": "Épine et acromion", "role": "Attache du trapèze et du deltoïde ; l'acromion coiffe l'épaule" },
    { "nom": "Processus coracoïde", "role": "Attache du petit pectoral, du coraco-brachial et du chef court du biceps" }
  ],
  "foramens": [ { "nom": "Incisure scapulaire", "contenu": "Nerf supra-scapulaire (sous le ligament), artère au-dessus" } ],
  "ossification": "Soudure complète vers 20 ans",
  "palpation": "L'épine, l'acromion et l'angle inférieur se sentent sous la peau",
  "clinique": "Scapula alata : le bord médial se décolle quand le dentelé antérieur est paralysé",
  "memo": "Dix-sept muscles s'y attachent : c'est une plate-forme, pas un levier",
  "variantes": null,
  "sources": ["gray1918", "statpearls-scapula"]
}
```

- `sorte` : `long`, `court`, `plat`, `irregulier`, `sesamoide`, `cartilage`, `dent`, ou `groupe` (pour un ensemble).
- `articulations` : chaque articulation avec un autre os de l'index (`type` : sphéroïde, ginglyme, trochoïde,
  condylaire, en selle, plane, suture, syndesmose, symphyse, gomphose…). Liste vide pour l'os hyoïde.
- `reliefs` : les 2 à 8 reliefs qu'il faut connaître, avec ce qui s'y attache ou ce qu'ils font.
- `foramens` (facultatif) : les orifices et gouttières, et ce qui y passe.
- `clinique` et `memo` sont obligatoires.

## La fiche d'un tendon, d'une aponévrose, d'un rétinaculum, d'un fascia, d'une gaine

```json
{
  "id": "tendon-calcaneen",
  "resume": "Le tendon d'Achille : le plus gros et le plus solide du corps, à l'arrière de la cheville.",
  "muscles": ["gastrocnemien", "soleaire"],
  "attache": "Moitié inférieure de la face postérieure du calcanéus",
  "role": "Transmet au talon la force du triceps sural : marcher, courir, sauter, se mettre sur la pointe des pieds",
  "rapports": "Séparé du calcanéus par une bourse ; le tendon du plantaire le longe en dedans",
  "reflexe": { "nom": "Réflexe achilléen", "racines": ["S1", "S2"] },
  "palpation": "Corde saillante derrière la cheville, entre les deux malléoles",
  "clinique": "Rupture : douleur en coup de fouet, impossibilité de monter sur la pointe du pied (signe de Thompson)",
  "memo": "Achille, tenu par le talon lors de son bain dans le Styx : son seul point faible",
  "variantes": null,
  "sources": ["gray1918", "statpearls-achille"]
}
```

- `muscles` : les muscles de l'index que la structure prolonge, sépare ou maintient (liste vide possible).
- `reflexe` : `null` sauf si la percussion du tendon donne un réflexe d'examen courant.
- `attache`, `role`, `clinique`, `memo` sont obligatoires.

## Avant de rendre

- `python3 scripts/corps/valider_fiches.py <lot>` affiche « 0 défaut(s) » et le bon nombre de fiches.
- Relis dix fiches au hasard comme le ferait un professeur d'anatomie : une erreur d'innervation ou d'attache
  est le pire défaut possible. En cas de doute, retourne aux références.
- Dans ta réponse finale, dis en quelques lignes : combien de fiches, quelles références ont servi, les points
  où elles divergeaient, et ce dont tu n'es pas sûr.
