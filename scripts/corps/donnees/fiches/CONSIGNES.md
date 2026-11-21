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
   - Gray's Anatomy, 20e édition (1918), domaine public. Bartleby refuse souvent l'accès ; le texte intégral se
     lit sur Internet Archive : https://ia600602.us.archive.org/26/items/anatomyofhumanbo1918gray/anatomyofhumanbo1918gray_djvu.txt
     avec le paramètre de décalage (offset) de l'outil de lecture. Repère : la page p du livre est vers le
     caractère 1 500 000 + (p − 455) × 3 370 (relevés : veines des membres vers 2 190 000-2 290 000,
     plexus lombaire et sacral vers 3 100 000-3 200 000) (ostéologie p. 80-280, articulations p. 280-360, muscles p. 360-545,
     artères p. 545-645, veines p. 645-690, lymphatiques p. 690-720, système nerveux p. 720-1010 dont encéphale
     p. 736-880, nerfs crâniens p. 880-935, nerfs spinaux p. 935-1000 ; organes des sens p. 1010-1080, appareils
     respiratoire, digestif, urinaire et génital p. 1060-1300) ;
   - OpenStax, *Anatomy and Physiology 2e* (tableaux des muscles, chap. 11 ; vaisseaux, chap. 20) : https://openstax.org ;
   - StatPearls, un article par structure : NCBI Bookshelf demande parfois un captcha ; la même page se lit sur
     https://www.statpearls.com/point-of-care/<numéro> (sans « www » si besoin) ;
   - TeachMeAnatomy, Kenhub, Radiopaedia pour recouper ;
   - en français, pour la nomenclature : les cours d'anatomie universitaires en ligne et Wikipédia (jamais seule).
   Inscris dans `sources` (en tête du fichier) chaque référence réellement consultée, et dans la fiche les clés
   des références qui la fondent (au moins deux). Si un site refuse l'accès, prends-en un autre : n'invente
   jamais une source.
   **Économise les recherches** : le nombre de recherches web est limité et partagé entre plusieurs rédacteurs.
   Lis plutôt directement les pages dont tu connais l'adresse (une page Kenhub ou TeachMeAnatomy couvre souvent
   un groupe entier de structures ; le Gray se lit par décalage) et ne lance une recherche que pour trouver une
   adresse.
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

## La fiche d'un ligament (ou d'une capsule, d'un disque, d'une bourse, d'un ménisque, d'un labrum)

```json
{
  "id": "ligament-croise-anterieur",
  "resume": "Le pivot central du genou : il empêche le tibia de partir en avant sous le fémur.",
  "nature": "ligament",
  "articulation": "Genou (articulation fémoro-tibiale)",
  "attaches": [
    { "texte": "Face médiale du condyle latéral du fémur, en arrière", "os": ["femur"] },
    { "texte": "Aire intercondylaire antérieure du tibia", "os": ["tibia"] }
  ],
  "situation": null,
  "role": "Freine la translation antérieure du tibia et la rotation médiale ; guide le roulement-glissement des condyles",
  "tendu": "En extension et en rotation médiale",
  "test": "Test de Lachman (genou fléchi à 20°), tiroir antérieur (genou fléchi à 90°)",
  "clinique": "Rupture lors d'un pivot genou fléchi, pied bloqué (ski, football) : craquement, gonflement rapide (hémarthrose), puis instabilité",
  "memo": "Croisés comme les doigts : l'antérieur part de l'avant du tibia, le postérieur de l'arrière",
  "variantes": null,
  "sources": ["gray1918", "kenhub-lca"]
}
```

- `nature` : `ligament`, `capsule`, `disque`, `noyau` (noyau pulpeux), `bourse`, `menisque`, `labrum`, `membrane`,
  `symphyse`, `cartilage` ou `groupe` (pour un ensemble).
- `articulation` : en clair, l'articulation (ou la région, pour une bourse) à laquelle il appartient.
- `attaches` : ses insertions, avec les identifiants des os (ou tendons, ligaments) de l'index. Pour une bourse,
  liste vide et `situation` dit entre quoi et quoi elle glisse (« entre le tendon du … et … »).
- `role` (obligatoire) ; `tendu` : dans quelle position il est tendu (facultatif) ; `test` : la manœuvre
  d'examen qui l'explore (facultatif).
- Pour un disque ou un noyau pulpeux, la `clinique` dit quelle racine une hernie de ce niveau comprime
  (au rachis lombaire, une hernie postéro-latérale L4-L5 comprime la racine L5) et ce qu'on observe.
- `clinique` et `memo` sont obligatoires. Une petite structure (bourse, ligament du carpe) peut avoir une fiche
  brève, mais tous les champs obligatoires y sont.

## La fiche d'une veine (ou d'un sinus veineux)

```json
{
  "id": "veine-jugulaire-interne",
  "resume": "La grande veine du cou : elle ramène le sang de l'encéphale, du visage et du cou.",
  "plan": "profonde",
  "origine": { "veine": null, "texte": "Suit le sinus sigmoïde au foramen jugulaire, dont elle forme le bulbe supérieur" },
  "trajet": "Descend dans la gaine carotidienne, en dehors de la carotide interne puis de la carotide commune, avec le nerf vague en arrière",
  "affluents": [
    { "veine": "sinus-petreux-inferieur", "texte": "Sinus pétreux inférieur" },
    { "veine": null, "texte": "Veine faciale" }
  ],
  "terminaison": { "veine": "veine-brachiocephalique", "texte": "S'unit à la veine subclavière derrière l'articulation sterno-claviculaire pour former la veine brachio-céphalique" },
  "drainage": { "texte": "Encéphale, méninges, face profonde, cou", "structures": [] },
  "rapports": "Dans la gaine carotidienne, avec la carotide en dedans et le nerf vague en arrière",
  "clinique": "Voie d'abord classique du cathéter veineux central ; son pouls veineux, visible à jour frisant, renseigne sur la pression de l'oreillette droite",
  "memo": "Jugulaire interne : dedans la gaine, avec la carotide et le vague",
  "variantes": null,
  "sources": ["gray1918", "kenhub-jugulaire"]
}
```

- `plan` : `superficielle` (sous la peau), `profonde`, `sinus` (sinus veineux de la dure-mère), `pulmonaire`,
  `portale` (système porte), ou `groupe`.
- `origine` : où elle commence (`veine` : l'identifiant de la veine d'amont si elle est dans l'index).
- `affluents` : les principaux, d'amont en aval (facultatif). `terminaison` (obligatoire) : où elle se jette,
  vers le cœur (`veine` : l'identifiant de la veine d'aval, ou `viscere` : l'oreillette où elle aboutit, par
  exemple `atrium-droit` s'il est dans l'index). Ces deux champs servent à un quiz « suis le sang » : ils doivent
  être justes.
- `drainage` : le territoire qu'elle draine, et quelques structures de l'index.
- `clinique` et `memo` sont obligatoires.

## La fiche d'un nerf (ou d'un plexus, d'une branche, d'un ganglion)

```json
{
  "id": "nerf-median",
  "resume": "Le nerf de la pince du pouce : il commande la flexion du poignet et des doigts et sent la paume.",
  "sorte": "branche",
  "origine": { "nerf": null, "texte": "Union d'une racine du faisceau latéral et d'une racine du faisceau médial du plexus brachial", "racines": ["C6", "C7", "C8", "T1"] },
  "trajet": "Descend dans le bras avec l'artère brachiale, passe entre les deux chefs du rond pronateur, chemine sous le fléchisseur superficiel puis traverse le canal carpien",
  "orifices": ["Canal carpien"],
  "branches": [
    { "nerf": "branches-musculaires-du-nerf-median", "texte": "Rameaux musculaires de l'avant-bras, dont le nerf interosseux antérieur" },
    { "nerf": "branche-palmaire-du-nerf-median", "texte": "Branche palmaire" }
  ],
  "moteur": { "texte": "La plupart des fléchisseurs de l'avant-bras et les muscles de l'éminence thénar", "muscles": ["rond-pronateur", "court-abducteur-pouce"] },
  "sensitif": { "texte": "Paume, face palmaire des trois premiers doigts et de la moitié latérale du quatrième" },
  "autonome": null,
  "reflexe": null,
  "atteinte": "Au poignet (canal carpien) : fourmillements des trois premiers doigts, la nuit, puis fonte du thénar et perte de l'opposition du pouce",
  "test": "Pince pouce-index en « O » ; signe de Tinel et manœuvre de Phalen au poignet",
  "clinique": "Le syndrome du canal carpien est la plus fréquente des compressions nerveuses",
  "memo": "Médian : au milieu du poignet, il tient la pince du pouce",
  "variantes": null,
  "sources": ["gray1918", "statpearls-median"]
}
```

- `sorte` : `cranien`, `spinal` (nerf spinal ou ses rameaux), `plexus` (ou une partie de plexus), `branche`,
  `ganglion` ou `groupe`.
- `origine` : d'où il naît (`nerf` : l'identifiant du nerf d'origine dans l'index) et ses racines (C5, T1, L4…,
  ou, pour un nerf crânien, son numéro).
- `orifices` (facultatif, surtout pour les nerfs crâniens) : les foramens, canaux et fissures qu'il traverse.
- `branches` : dans l'ordre où elles naissent (facultatif). `moteur` : les muscles qu'il commande (identifiants
  de l'index) ou `null` ; `sensitif` : le territoire de peau ou de muqueuse qu'il sent, ou `null` ; `autonome` :
  ses fibres sympathiques ou parasympathiques, s'il y a lieu. Un nerf est au moins l'un des trois.
- `reflexe` : `null` sauf si un réflexe d'examen courant passe par lui. `atteinte` (obligatoire) : ce que donne
  sa lésion, au niveau où elle survient le plus souvent. `test` : comment l'examiner.
- `memo` obligatoire ; `clinique` facultatif.

## La fiche d'un viscère (ou d'une partie de viscère, d'un organe des sens, d'une partie du cœur)

```json
{
  "id": "foie",
  "resume": "La plus grosse glande du corps : elle filtre le sang de l'intestin, fabrique la bile et stocke l'énergie.",
  "systeme": "digestif",
  "situation": "Hypochondre droit et épigastre, sous la coupole droite du diaphragme, protégé par les dernières côtes",
  "fonction": "Transforme et stocke ce que l'intestin absorbe, fabrique la bile, les protéines du sang et les facteurs de coagulation, épure les médicaments et les toxines",
  "parties": [ { "nom": "Lobes droit et gauche", "role": "Séparés en surface par le ligament falciforme" } ],
  "rapports": "En arrière, la veine cave inférieure ; en bas, la vésicule biliaire, le duodénum, le côlon droit et le rein droit",
  "vascularisation": { "texte": "Double arrivée : l'artère hépatique propre (un quart du débit) et la veine porte (trois quarts) ; sortie par les veines hépatiques", "arteres": ["artere-hepatique-propre"], "veines": ["veine-porte-du-foie"] },
  "innervation": { "texte": "Plexus hépatique (fibres sympathiques et nerf vague)", "nerfs": [] },
  "examen": "Son bord inférieur se palpe sous le rebord costal droit à l'inspiration profonde ; sa hauteur se mesure à la percussion",
  "clinique": "Cirrhose, hépatites ; une hypertension portale fait gonfler les anastomoses porto-caves (varices de l'œsophage)",
  "memo": "Le foie a deux entrées (artère et porte) et une sortie (veines hépatiques)",
  "variantes": null,
  "sources": ["gray1918", "statpearls-foie"]
}
```

- `systeme` : `digestif`, `respiratoire`, `circulatoire` (cœur et ses parties), `urinaire`, `genital`,
  `endocrinien`, `lymphatique` (rate, tonsilles), `sensoriel` (œil, oreille et leurs parties), `nerveux`
  ou `tegumentaire`.
- `situation` (obligatoire) : où il est, avec ses repères de surface ou son niveau vertébral.
- `fonction` (obligatoire). `parties` (facultatif) : lobes, segments, cavités, et ce qui les distingue.
- `vascularisation` (obligatoire) : `arteres` et `veines` sont des identifiants de l'index (listes vides
  permises). `innervation` (facultatif) : `nerfs`, identifiants de l'index.
- `examen` : comment on l'explore au lit du malade (palpation, percussion, auscultation, foyer…) ; facultatif.
- Pour une partie (un segment du foie, une bronche segmentaire, une cavité du cœur), la fiche dit ce qui la
  distingue de ses voisines et pourquoi on la nomme (chirurgie, imagerie, endoscopie).
- Par pudeur, l'atlas ne montre pas les organes génitaux externes ; pour les organes génitaux internes, reste
  sobre et factuel.
- `clinique` et `memo` sont obligatoires.

## La fiche d'une structure de l'encéphale ou de la moelle (lobe, gyrus, sillon, noyau, voie, ventricule…)

```json
{
  "id": "hippocampe",
  "resume": "Le replié de cortex du lobe temporal qui enregistre les souvenirs nouveaux.",
  "partie": "telencephale",
  "situation": "Sur le plancher de la corne temporale du ventricule latéral, à la face médiale du lobe temporal",
  "fonction": "Inscrit les souvenirs des faits et des événements (mémoire déclarative) et la carte des lieux",
  "connexions": { "texte": "Reçoit du cortex entorhinal ; projette par le fornix vers les corps mamillaires", "structures": ["fornix", "corps-mamillaire"] },
  "vascularisation": { "texte": "Artères choroïdienne antérieure et cérébrale postérieure", "arteres": [] },
  "atteinte": "Une lésion des deux hippocampes empêche de former de nouveaux souvenirs (amnésie antérograde) ; c'est une des premières régions touchées par la maladie d'Alzheimer",
  "clinique": "Siège fréquent du foyer des épilepsies du lobe temporal",
  "memo": "Hippocampe, en grec « cheval de mer » : il en a la forme, recourbée",
  "variantes": null,
  "sources": ["gray1918", "kenhub-hippocampe"]
}
```

- `partie` : `telencephale` (cortex, lobes, gyrus, sillons, noyaux gris centraux, substance blanche des
  hémisphères), `diencephale`, `tronc-cerebral` (mésencéphale, pont, moelle allongée et leurs noyaux),
  `cervelet`, `moelle-spinale`, `ventricules`, `meninges` ou `voies` (faisceaux et tractus).
- `situation` et `fonction` sont obligatoires. Pour un sillon, la fonction est d'abord celle d'un repère :
  ce qu'il sépare, et le cortex fonctionnel qui le borde.
- `connexions` (facultatif) : d'où viennent et où vont ses fibres. Pour une voie (tractus, faisceau) : son
  origine, son trajet (croisement compris) et sa terminaison, avec ce qu'elle transporte.
- `atteinte` (obligatoire) : ce que donne sa lésion (déficit, signe d'examen, syndrome), avec le côté par
  rapport à la lésion quand il compte.
- `memo` obligatoire ; `clinique` facultatif.

## La fiche d'un groupe de nœuds lymphatiques (lymphonœuds)

```json
{
  "id": "lymphonoeuds-axillaires-centraux",
  "resume": "Les nœuds du centre de l'aisselle, que l'on palpe dans le creux axillaire.",
  "situation": "Dans la graisse du creux axillaire, contre sa paroi médiale, au centre de la pyramide axillaire",
  "recoit": { "texte": "La lymphe des groupes huméral, pectoral et subscapulaire, donc du membre supérieur, du sein et de la paroi thoracique", "structures": [] },
  "draine_vers": { "lymphe": null, "texte": "Vers les nœuds apicaux de l'aisselle, puis le tronc subclavier" },
  "palpation": "Le bout des doigts remonte haut dans le creux de l'aisselle, bras du patient détendu",
  "clinique": "Un ganglion dur et fixé dans l'aisselle fait chercher un cancer du sein ; le ganglion sentinelle guide l'étendue du curage axillaire",
  "memo": "Aisselle : cinq groupes, et le central au milieu, celui qu'on sent",
  "variantes": null,
  "sources": ["gray1918", "kenhub-noeuds-axillaires"]
}
```

- `situation`, `recoit`, `draine_vers` (obligatoires) : où ils sont, ce qu'ils reçoivent (le territoire, et
  quelques structures de l'index), où va leur lymphe (`lymphe` : l'identifiant du groupe suivant dans l'index,
  ou `veine` : la veine où un tronc lymphatique se jette).
- `palpation` : si on peut les sentir, et comment (facultatif).
- `clinique` et `memo` sont obligatoires.

## Avant de rendre

- `python3 scripts/corps/valider_fiches.py <lot>` affiche « 0 défaut(s) » et le bon nombre de fiches.
- Relis dix fiches au hasard comme le ferait un professeur d'anatomie : une erreur d'innervation ou d'attache
  est le pire défaut possible. En cas de doute, retourne aux références.
- Dans ta réponse finale, dis en quelques lignes : combien de fiches, quelles références ont servi, les points
  où elles divergeaient, et ce dont tu n'es pas sûr.
