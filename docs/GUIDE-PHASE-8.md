# Guide Phase 8 — Table des matières, résumé long, Paramètres, sécurité renforcée

Compte environ 3 minutes d'installation.

## Installer la mise à jour

1. Dans Supabase, **SQL Editor** puis **New query** : copie tout le fichier `supabase/migrations/008_reglages.sql`, colle-le, clique **Run**. Le message « Success » doit s'afficher.
2. Envoie le nouveau code sur GitHub (dépose `source.zip` dans ton dépôt) : Vercel republie tout seul en une à deux minutes.
3. Recharge le site avec **Ctrl+F5**.

Aucun nouveau secret n'est nécessaire. Tes articles, tes fichiers et ton mot de passe ne sont pas touchés.

## Table des matières dans un article

Dans l'éditeur, tape `/sommaire` (ou `/table`) à l'endroit où tu veux la placer, en général juste après l'introduction.

- La liste se remplit toute seule à partir des titres de l'article : grands titres, titres moyens, petits titres.
- Elle se met à jour pendant que tu écris : ajoute ou renomme un titre, la liste suit.
- Pour le lecteur, chaque ligne est cliquable et amène directement au bon endroit de l'article.
- Clique sur le bloc pour régler, dans le panneau de droite :
  - le **titre affiché** (« Table des matières » par défaut) ;
  - les **niveaux à inclure** : grands titres seulement, ou aussi les titres moyens, ou tous.

Le **sommaire flottant** à droite de l'écran existe toujours : il apparaît automatiquement dès qu'un article a deux titres, et suit la lecture. La table des matières, elle, est dans le texte, et tu choisis où.

## Résumé plus long

Le résumé accepte maintenant **6 000 caractères** au lieu de 1 200, soit plusieurs paragraphes. Un compteur s'affiche à droite du mot « Résumé ».

Où il apparaît :
- en entier en tête de l'article, en gros caractères, à gauche d'un filet doré ;
- en deux lignes seulement dans les listes d'articles et les résultats de recherche ;
- raccourci à 200 caractères dans les aperçus de partage (WhatsApp, Google), qui ne gardent pas plus.

## Paramètres

Nouvelle page, depuis l'espace créateur : **Paramètres**. Les réglages s'appliquent dès l'enregistrement, sans republier l'application.

**Déconnexion automatique après inactivité** — de 5 minutes à 8 heures. Sans action de ta part pendant cette durée, l'espace créateur se ferme et il faut retaper le mot de passe. Court pour un ordinateur partagé, long pour ton ordinateur personnel.

**Durée maximale d'une session** — de 1 heure à 3 jours. Passé ce délai, la session se ferme même si tu es resté actif.

**Session liée à cet appareil** — à laisser cochée. Explication au paragraphe suivant.

**Taille maximale d'un fichier** — de 5 Mo à 1 Go. Attention : l'offre gratuite de Supabase plafonne à **50 Mo par fichier**, quel que soit ce réglage. Pour aller au-delà, il faut le forfait Supabase Pro (environ 25 $ par mois, 500 Go par fichier) puis relever la limite dans Supabase : **Storage → Settings → Global file size limit**. Sans cela, un fichier plus gros sera refusé par le serveur de stockage, même si le réglage l'autorise ici.

Quand un réglage devient plus strict (durée raccourcie, session liée à l'appareil activée), les autres appareils sont déconnectés : sans cela, ils garderaient l'ancienne règle jusqu'à leur prochaine connexion.

## Sécurité renforcée

**Une adresse de l'espace créateur recopiée ailleurs ne donne plus rien.** Elle renvoie à la page d'accueil, avec les deux modes, et il faut retaper le mot de passe. L'adresse demandée n'est pas gardée : un lien copié ne révèle même pas quel article tu étais en train d'écrire.

**La session est liée à ton navigateur.** Le cookie d'accès est désormais signé avec une empreinte de ton appareil. Recopié dans un autre navigateur ou sur une autre machine, il ne vaut plus rien : la personne est renvoyée à l'accueil. C'est la protection la plus efficace contre le vol de session.

Deux conséquences à connaître :
- une mise à jour de ton navigateur peut demander une nouvelle connexion ;
- dans **ton** navigateur, un nouvel onglet reste connecté. C'est le fonctionnement normal de tous les sites : les cookies sont partagés entre les onglets d'un même navigateur. Pour fermer l'accès, utilise le bouton de déconnexion, ou règle une déconnexion automatique courte.

**Ce qui protégeait déjà le site, et qui reste en place :** mot de passe à 12 caractères minimum vérifié contre les fuites connues, double authentification, clé de récupération, blocage après plusieurs tentatives, cookie `httpOnly` + `SameSite=Strict` + préfixe `__Host-`, Content-Security-Policy avec nonce, en-têtes de sécurité (HSTS, nosniff, anti-cadre), règles de sécurité au niveau de la base (RLS) qui empêchent le public de lire un brouillon, stockage de fichiers privé, journal de sécurité et alerte en cas de connexion depuis un appareil inconnu.

**Ce qu'aucun réglage ne remplace :** un mot de passe unique, la double authentification activée, et la clé de récupération notée sur papier.

## Ajout : confort d'écriture

**La barre d'outils suit le texte.** Elle reste collée en haut de l'écran pendant que tu descends dans l'article : plus besoin de remonter pour mettre un mot en gras ou insérer un bloc.

**Une poubelle sur chaque bloc.** Passe la souris sur un encadré, un verset, un hadith, un schéma, une carte de lien ou une table des matières : une petite poubelle apparaît en haut à droite. Un clic, le bloc disparaît.

À savoir : supprimer un encadré supprime aussi ce qu'il contient, puisque le contenu est à l'intérieur. Pour ne retirer que l'encadré en gardant le texte, sors d'abord le texte, ou utilise l'historique des versions pour revenir en arrière.

Sur téléphone, la poubelle flottante ne s'affiche pas (elle gênerait la frappe) : sélectionne le bloc, le panneau de droite propose « Supprimer ce bloc ».

**La colonne de droite défile pour elle-même.** Les réglages (Publication, bloc en cours, Navigation, Aperçu…) restent à l'écran quand tu descends dans l'article. Si cette colonne est plus haute que l'écran, la molette, souris posée dessus, la fait défiler sans bouger le texte — et inversement, la molette sur le texte ne déplace plus les réglages.

## Correction : les PDF qui refusaient de s'ouvrir

Certains PDF affichaient « Le document n'a pas pu être ouvert », en général des documents scannés. Deux causes, les deux corrigées :

- Le lecteur décode certaines images (JPEG 2000, JBIG2) et les profils de couleur avec de petits modules WebAssembly. La politique de sécurité du site les refusait. Elle les autorise maintenant — uniquement WebAssembly, rien d'autre.
- Le message était toujours le même, quelle que soit la cause. Il dit désormais ce qui se passe vraiment : document protégé par mot de passe, fichier abîmé, document introuvable, ou téléchargement interrompu par une connexion trop lente. Dans tous les cas, le bouton de téléchargement du lecteur permet d'ouvrir le document avec l'application habituelle du téléphone.

Si un document résiste encore sur téléphone alors qu'il s'ouvre sur ordinateur, c'est en général sa taille : un gros scan demande beaucoup de mémoire. Le téléchargement reste la solution.
