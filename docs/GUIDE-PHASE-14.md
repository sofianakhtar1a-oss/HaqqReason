# Phase 14 — L'Alambic, studio de fichiers

L'Alambic est le troisième espace du mode utilisateur, entre Le Calame et la bibliothèque. Le nom vient de l'arabe *al-anbīq*, le vase où l'on transforme une matière en une autre.

## Ce qu'il fait

**Convertir.** Dépose un fichier (ou colle une capture avec Ctrl+V) : son format est reconnu tout seul et s'affiche à gauche. À droite, tu choisis le format d'arrivée. Le sceau du milieu inverse le sens ; après une conversion, il repart du fichier obtenu, pour faire l'aller-retour d'un clic.

Le sélecteur montre les 36 formats, rangés en six familles. Ceux qui ne donneraient pas un vrai fichier sont grisés : un clic dessus explique pourquoi (un son ne devient pas un tableur, par exemple). Chaque conversion annonce aussi ce qu'elle garde :

- « Conversion fidèle » : rien d'important ne se perd ;
- « Conversion partielle » : elle dit précisément ce qui manquera. Par exemple, d'un PDF vers Word, le texte est repris, mais pas la mise en page.

**Fusionner.** Plusieurs fichiers (PDF, images, Word, OpenDocument, texte, Markdown…) deviennent un seul PDF, dans l'ordre que tu fixes en les faisant glisser.

**Découper.** Garde certaines pages d'un PDF : clique sur les vignettes, ou écris « 1-3, 7, 10-fin ». Tu obtiens un seul PDF, un PDF par page, ou une image par page. Pour un son ou une vidéo, tu places le début et la fin de l'extrait.

**Protéger.** Un mot de passe, chiffré en AES-256.

- Un PDF est chiffré tel quel : n'importe quel lecteur PDF demandera le mot de passe.
- Tout autre fichier est rangé dans un ZIP chiffré. Il s'ouvre avec 7-Zip, WinRAR, Keka ou The Unarchiver, mais pas avec l'explorateur de Windows, qui ne connaît pas ce chiffrement.

La jauge estime en direct le temps qu'il faudrait pour deviner le mot de passe, et le bouton de mélange en crée un très fort.

Cette protection est aussi proposée au moment de convertir, de fusionner ou de découper.

## Les formats

- **Documents** : PDF, Word, OpenDocument, RTF, texte, Markdown, page web, EPUB.
- **Tableurs et données** : Excel, CSV, JSON, XML, YAML, SQL.
- **Images** : PNG, JPEG, WebP, SVG, GIF, BMP, TIFF, ICO.
- **Audio** : MP3, WAV, OGG, FLAC, AAC, M4A.
- **Vidéo** : MP4, WebM, MOV, MKV, AVI.
- **Archives** : ZIP, TAR, TAR.GZ.

## Confidentialité

Tout est calculé par ton appareil : aucun fichier n'est envoyé, aucun n'est gardé. Ferme la page, il ne reste rien.

## Les limites, franchement

- **L'AVI** n'est ni lu ni écrit par aucun navigateur. Il est donc présent dans la liste, mais refusé, avec un conseil (VLC ou HandBrake sur ordinateur).
- **Le PDF produit à partir d'un document** utilise les polices intégrées à tous les lecteurs PDF, qui couvrent le français mais pas l'arabe. Si un texte contient de l'arabe, le nombre de caractères absents est annoncé ; pour un PDF fidèle, utilise « Ouvrir dans Le Calame », puis imprime en PDF.
- **Les images d'un document** ne sont pas reprises d'un format de document à l'autre, et c'est annoncé.
- **Un PDF scanné** (une image de texte) n'a pas de texte à extraire. Convertis-le plutôt en images.
- **L'AAC et le MP4** dépendent du navigateur : Chrome, Edge et Safari savent les produire. Ailleurs, ces choix sont grisés et une alternative est proposée.
- **Les très gros fichiers** passent, avec une limite : la mémoire de l'appareil. Le son et la vidéo sont lus par morceaux. Une vidéo de 30 minutes (232 Mo) a donné son MP3 en 44 secondes, et a changé de format, sans perte d'image, en 43 secondes, sur un ordinateur ordinaire et sans carte graphique. Sur un téléphone, il faut compter plus long, et rester plus modeste.

## Le cloisonnement

Comme pour Le Calame, une personne qui reçoit un lien direct vers L'Alambic y reste : ni bouton « Quitter », ni chemin vers l'accueil ou les autres espaces.

## Mise en ligne

Aucune migration SQL. Dépose `source.zip` sur GitHub comme d'habitude, attends une à deux minutes, puis recharge avec Ctrl + Maj + R.
