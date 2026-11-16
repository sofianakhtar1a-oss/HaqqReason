# Guide Phase 13 — Le Calame, l'atelier d'écriture

Le mode utilisateur s'ouvre désormais sur **deux espaces**, et le second est entièrement nouveau : un traitement de texte complet, intégré au site.

Aucune étape en base de données cette fois : il suffit de déposer le nouveau `source.zip` sur GitHub et d'attendre que Vercel republie.

## 1. Le choix à l'entrée

Depuis la page d'accueil, « Mode utilisateur » ne mène plus directement à la bibliothèque : on arrive sur une page qui présente deux cartes.

- **Le Calame — atelier d'écriture.** Pour écrire, prendre des notes, rédiger un mémoire, préparer un cours. C'est le nouveau logiciel.
- **Les preuves de la véracité de l'islam.** La bibliothèque telle qu'elle était : les trois grands ensembles, les articles, les dossiers, les outils de lecture. Rien n'a changé de ce côté.

Le nom « Calame » vient du roseau taillé avec lequel on écrivait, et de la sourate *Al-Qalam* — la Plume. C'est le nom de l'atelier ; tu peux me demander de le changer si tu préfères autre chose.

## 2. Ce que fait l'atelier

### Une vraie page

Au centre de l'écran, une feuille A4 — avec ses marges, son en-tête, son pied de page et sa numérotation. Quand le texte dépasse, **une nouvelle feuille apparaît et le texte repart exactement en haut**, comme dans un traitement de texte classique. Formats disponibles : A4, A5, Lettre US, Legal, en portrait ou en paysage.

Tu peux aussi poser un **saut de page** où tu veux (menu « / », ou Ctrl+K puis « saut »).

### Tout ce qu'on peut écrire

L'atelier reprend **l'intégralité des blocs du mode créateur** : gras, italique, souligné (avec styles et couleurs), barré, exposant, indice, surlignage, couleurs de texte, effets ; titres sur trois niveaux, listes à puces, listes numérotées, cases à cocher ; citations, encadrés, objection/réponse, comparaisons en colonnes, sections repliables ; versets, hadiths, sources, notes ; **frises chronologiques** et **cartes mentales** (les mêmes ateliers graphiques que pour les articles : carte mentale, carte conceptuelle, arbre argumentatif, organigramme, diagramme de flux, de causalité, de Venn, graphique statistique, courbe de fonction, matrice de comparaison) ; démonstrations logiques ; sophismes ; table des matières automatique.

Et une chose que le mode créateur n'a pas : **les vrais tableaux**, avec ajout et suppression de lignes et de colonnes, fusion de cellules et largeurs ajustables à la souris.

### Images, captures et documents, sans limite

- **Ctrl+V d'une capture d'écran** ouvre l'atelier d'image (recadrage, taille, coins arrondis, cadre, ombre), exactement comme en mode créateur.
- **Glisser-déposer** une image ou un fichier dans la page l'ajoute au document.
- Les PDF et autres documents s'attachent au texte et s'ouvrent d'un clic.

Il n'y a pas de quota : la seule limite est la place disponible sur ton appareil. Un fichier unique est plafonné à 64 Mo, pour que l'atelier reste rapide.

### Le plan, à gauche

La colonne de gauche montre **tous tes documents** (recherche, création, suppression) et, sur l'autre onglet, **le plan du document en cours**, construit automatiquement à partir des titres. Un clic sur une ligne du plan t'y emmène.

### L'inspecteur, à droite

Trois onglets :

- **Page** — format, orientation, marges (quatre réglages fins ou quatre réglages tout faits), en-tête, pied de page, numérotation, repères de marges à l'écran, et un mode « papier sombre » pour écrire la nuit. Dans l'en-tête et le pied, `{titre}`, `{page}`, `{pages}` et `{date}` se remplacent tout seuls.
- **Styles** — c'est la grande différence avec Word. Au lieu de formater paragraphe par paragraphe, tu règles **cinq familles** : corps de texte, trois niveaux de titre, citation. Police, taille, interligne, graisse, couleur, espace avant et après. Tu changes un réglage : tout le document suit, et la pagination se recalcule. Plus de document qui part en vrille parce qu'un paragraphe a gardé un vieux formatage.
- **Sortie** — le nombre de mots, de signes, de pages, le temps de lecture, et les quatre exports.

### La barre de commande

**Ctrl+K** (ou Cmd+K) ouvre une barre de recherche qui contient tout : insérer un bloc, ajouter une ligne au tableau, exporter, changer d'affichage, sauter à une partie du plan. On tape ce qu'on veut faire, on appuie sur Entrée.

Autres raccourcis : **Ctrl+S** enregistre et garde une version datée, **Ctrl+P** imprime.

### Les sorties

| Format | Ce que tu obtiens |
| --- | --- |
| **PDF** | L'impression du navigateur, avec exactement la mise en page de l'écran. Choisis « Enregistrer au format PDF » dans la fenêtre d'impression. |
| **Word (.docx)** | Un vrai fichier Word : titres, gras, listes, citations, tableaux, images, format de page, marges, en-tête, pied et numérotation. Word et LibreOffice l'ouvrent directement. |
| **Markdown** | Le texte structuré, pour le reprendre dans un autre outil. |
| **Sauvegarde complète (.calame)** | Le document entier — texte, mise en page **et images** — dans un seul fichier compressé. C'est ce qui permet de reprendre un document sur un autre appareil : tu exportes ici, tu importes là-bas avec le bouton à côté de « Nouveau ». |

## 3. Où sont gardés tes documents

**Sur ton appareil, dans la mémoire de ton navigateur.** Pas de compte, pas d'adresse e-mail, rien qui parte sur un serveur — c'est vérifié par un test automatique : écrire n'envoie aucune requête.

Les conséquences, qu'il vaut mieux connaître :

- Tes documents **ne suivent pas** d'un appareil à l'autre. Pour passer de l'ordinateur au téléphone : sauvegarde complète ici, import là-bas.
- Si tu vides les données du site dans ton navigateur, **les documents partent avec**. Fais une sauvegarde complète de temps en temps, comme tu le ferais avec un fichier.
- En navigation privée, l'atelier prévient qu'il ne peut pas garder tes documents.

En échange : aucune latence, aucun quota, et tout fonctionne sans connexion.

Le texte s'enregistre tout seul une seconde après la dernière frappe, et une **version datée** est gardée toutes les cinq minutes de travail (les soixante dernières par document).

## 4. Si tu veux aller plus loin

Deux choses ont été laissées de côté volontairement, et peuvent être ajoutées ensuite :

- **La synchronisation entre appareils.** Elle demande un compte par utilisateur et un espace de stockage côté serveur — donc un budget, et des obligations sur les données personnelles. L'export complet fait le pont en attendant. Si tu veux que *tes* documents à toi soient synchronisés, on peut le faire proprement en les rattachant au mode créateur, qui est déjà authentifié.
- **L'assistant d'écriture.** Il demande une clé de service payante. L'emplacement est prévu ; dis-moi si tu veux l'ouvrir, et avec quel budget.

## 5. Si quelque chose ne va pas

**L'atelier dit qu'il ne peut pas garder les documents.** Tu es en navigation privée, ou un réglage de confidentialité bloque le stockage du site. Rouvre la page dans une fenêtre ordinaire.

**Le PDF ne ressemble pas à l'écran.** Dans la fenêtre d'impression, vérifie que les marges sont sur « par défaut » et que « Graphiques d'arrière-plan » est coché. L'échelle doit rester à 100 %.

**Un document a disparu.** Regarde dans la liste de gauche : il est peut-être simplement plus bas. Si tu as vidé les données du navigateur, seule une sauvegarde complète permet de le retrouver.

## Deux espaces cloisonnés

- Qui arrive par l'accueil (l'adresse du site seule, ou « Mode utilisateur ») circule entre Le Calame et la bibliothèque.
- Qui arrive par un lien direct reste dans l'espace de ce lien, en mode utilisateur :
  - un lien vers Le Calame n'affiche ni bouton « Quitter », ni lien vers l'accueil ou la bibliothèque ;
  - un lien vers la bibliothèque (ou un article) : le logo ramène à la bibliothèque, jamais à l'accueil ni au Calame.
- Le passage par l'accueil est retenu sur l'appareil ; rien n'est envoyé au serveur.
- C'est un cloisonnement de la navigation, pas un verrou : quelqu'un qui tape lui-même l'adresse du site arrive sur l'accueil.

## Confidentialité des documents

Les documents du Calame sont enregistrés dans la mémoire du navigateur de l'appareil où ils ont été écrits, jamais sur le serveur. Un autre visiteur, sur un autre appareil ou un autre navigateur, ne peut ni les voir ni les retrouver. Seule précaution : une personne qui utilise le même ordinateur et le même navigateur que toi les verrait.
