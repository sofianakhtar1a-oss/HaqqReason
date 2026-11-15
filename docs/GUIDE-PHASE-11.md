# Guide Phase 11 — Explorer le graphe, illustrer en collant

Deux nouveautés, toutes les deux visibles tout de suite. Aucune migration SQL cette fois : il suffit de déposer le nouveau `source.zip` sur GitHub, d'attendre que Vercel republie (une à deux minutes), puis de recharger avec **Ctrl+F5** (sur téléphone : fermer puis rouvrir l'application).

## 1. Le graphe se lit en deux temps

Avant, le graphe affichait beaucoup de titres à la fois et un appui emmenait aussitôt ailleurs. Désormais :

**Premier appui sur un point.** Le point s'allume, **tous les autres titres s'effacent** le temps de l'examen — on voit enfin quelque chose, même au milieu de centaines d'articles — et une bulle s'ouvre sur le côté. Elle indique :

- vers quoi ce point mène : un bloc, une catégorie, un article ou une étiquette ;
- son titre ;
- ce qu'il contient (nombre de catégories, d'articles, de mots) ;
- pour un article, **un aperçu du texte que tu peux faire coulisser dans la bulle** : de quoi juger sans quitter le graphe.

**Deuxième appui sur le même point.** Là, on y va. Le bouton de la bulle (« Lire l'article », « Ouvrir la catégorie »…) fait exactement la même chose.

**Pour refermer** : la croix de la bulle, la touche Échap, ou un appui dans le vide du graphe.

Sur téléphone, la bulle se pose en bas de l'écran, comme un panneau, et ne recouvre jamais le graphe entier.

Un détail de sécurité : si tu es connecté en mode créateur, l'aperçu te montre aussi tes brouillons. Un lecteur, lui, ne reçoit jamais le texte d'un article non publié — même en appelant l'adresse de l'aperçu à la main.

## 2. Coller une capture d'écran ouvre un atelier

Tu fais une capture d'écran, tu te mets dans ton article, tu fais **Ctrl+V** (ou Cmd+V sur Mac) : un petit atelier s'ouvre aussitôt. Rien n'est envoyé avant que tu ne valides.

Ce que tu peux y faire :

- **Couper une partie de l'image** : attrape un des quatre coins pour retailler la zone gardée, ou glisse à l'intérieur pour la déplacer. Le bouton « Garder toute l'image » annule le recadrage.
- **Choisir la largeur finale** en pixels. L'atelier n'agrandit jamais au-delà de l'image d'origine : cela ne ferait que la flouter. Pour une capture d'écran dans un article, 1 000 à 1 200 pixels suffisent largement.
- **Arrondir les coins**, de rien du tout à complètement arrondi.
- **Ajouter un cadre** : épaisseur au choix, puis une couleur parmi huit (or, bleu, vert, rose, orange, violet, noir, blanc). Épaisseur à zéro : pas de cadre.
- **Ajouter une ombre portée**, pour détacher une capture d'un fond clair.
- **La place dans l'article** : normale, large, ou pleine largeur.
- **Une légende** (affichée sous l'image) et **une description** pour les personnes qui lisent le site avec une voix de synthèse.

Sous l'image, **« Ce qui sera inséré »** montre en direct le fichier réellement produit, coins arrondis, cadre et ombre compris : ce que tu vois là est exactement ce qui partira dans l'article.

Juste au-dessus, **la taille et le poids du fichier** sont affichés et tenus à jour. Ces chiffres comptent le cadre et la place de l'ombre : avec une largeur d'image de 640 pixels, un cadre de 6 pixels et une ombre, le fichier fait un peu plus de 640 pixels de large. C'est normal.

Clique sur **« Insérer dans l'article »** : l'image retouchée est envoyée, puis posée à l'endroit exact où tu avais collé. C'est bien la version retouchée qui part, jamais l'originale — ton recadrage est donc définitif pour cette image, mais tu peux toujours recoller la capture et refaire un autre réglage.

**Annuler** referme l'atelier sans rien envoyer ni rien insérer.

À savoir : les images sortent de l'atelier en PNG, le seul format qui garde les coins arrondis transparents. Un PNG est un peu plus lourd qu'un JPEG, d'où l'intérêt de ne pas laisser une largeur inutilement grande.

## Ce qui n'a pas changé

Les autres façons d'ajouter une image continuent de fonctionner à l'identique : le bouton « Insérer » de la barre d'outils, le glisser-déposer d'un fichier, les documents PDF. L'atelier ne s'ouvre que pour une image **collée**, et seulement pour une image : coller du texte ou une adresse se comporte comme avant.

## Si quelque chose ne va pas

**Le Ctrl+V n'ouvre rien.** Vérifie que ton presse-papiers contient bien une image et non un fichier : une capture d'écran faite avec l'outil du système est une image, alors qu'un fichier copié depuis un dossier n'en est pas une. Dans ce dernier cas, utilise le glisser-déposer.

**L'atelier s'ouvre mais l'image reste grise.** Recharge la page avec Ctrl+F5 : l'ancienne version du site est probablement encore en mémoire.

**Le graphe emmène ailleurs dès le premier appui.** Même cause : c'est l'ancienne version. Ctrl+F5, ou fermer et rouvrir l'application sur téléphone.
