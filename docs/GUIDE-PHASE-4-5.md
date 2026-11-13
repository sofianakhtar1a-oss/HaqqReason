# Guide Phases 4 et 5 — Fichiers, PDF et recherche avancée

Compte environ 15 minutes d'installation.

## Installer la mise à jour

1. Arrête l'application si elle tourne (Ctrl+C dans le terminal).
2. Décompresse `haqqreason-phase-4-5.zip` dans un **nouveau** dossier.
3. **Copie ton fichier `.env.local`** de l'ancien dossier vers le nouveau.
4. Ouvre un terminal dans le nouveau dossier et tape `npm install`. Cette commande copie aussi le lecteur PDF et la reconnaissance de texte (environ 22 Mo) dans `public/vendor`. Attends la fin.
5. Dans Supabase, ouvre **SQL Editor**, puis **New query**. Copie tout le fichier `supabase/migrations/004_fichiers.sql`, colle-le, puis clique **Run**. Le message « Success » doit s'afficher.
6. Ouvre une **nouvelle** requête et fais de même avec `supabase/migrations/005_recherche.sql`. Respecte l'ordre : 004 puis 005. Chaque fichier ne s'exécute qu'une seule fois.
7. Vérifie dans Supabase, menu **Storage**, qu'un espace nommé `fichiers` existe et porte la mention **Private**. Ne le rends jamais public : l'application distribue elle-même des liens temporaires.
8. Tape `npm run dev`, puis ouvre **http://localhost:3000**.

Tes articles existants sont automatiquement indexés pour la recherche à l'exécution de 005. Ouvre-les et enregistre-les une fois si tu veux que le texte de leurs versets, hadiths et objections soit aussi cherchable séparément.

## Les articles d'exemple

L'application que tu as installée ne contient que les trois grands blocs. Les catégories comme « Le christianisme » ou les articles comme « La Trinité » que tu as vus sur mes captures d'écran n'existaient que dans ma copie de test : ils ne sont pas dans ta base.

Pour supprimer tes propres essais :

- **Un par un** : bouton « Supprimer » sur l'article ou la catégorie (ils vont dans la corbeille), puis **Corbeille → Supprimer définitivement** ou **Vider la corbeille**.
- **Tout d'un coup** : **Espace créateur → Sécurité → Effacer tout le contenu**. Tape ton mot de passe et la phrase `TOUT EFFACER`. Toutes les catégories, articles, documents, étiquettes et l'historique disparaissent définitivement. Les trois blocs, ton accès créateur, tes modèles et tes synonymes restent. Cette action est irréversible.

## Ajouter des documents

- Sur la page d'une **catégorie** (section « Documents ») ou sous l'éditeur d'un **article** (« Documents joints »), dépose tes fichiers dans la zone, ou clique dessus pour les choisir. Plusieurs fichiers à la fois, 50 Mo au plus chacun.
- Formats acceptés : PDF, images (JPEG, PNG, WebP, GIF), Word, Excel, PowerPoint, OpenDocument, EPUB, texte.
- L'application vérifie le contenu réel de chaque fichier : un fichier renommé en `.pdf` qui n'en est pas un est refusé.
- Pour un PDF, le texte de chaque page est extrait juste après l'envoi : il devient cherchable.
- **PDF scanné** (des photos de pages, sans texte) : un bouton **Reconnaître le texte** apparaît. La reconnaissance (français, arabe, anglais) se fait dans ton navigateur, page par page. Compte quelques secondes par page ; garde l'onglet ouvert jusqu'au message « Reconnaissance terminée ».
- Le crayon renomme un fichier ; « Supprimer » l'efface définitivement, avec son texte et ses annotations.
- Un document est visible des lecteurs dès que l'article ou la catégorie qui le porte est publié.

## Dans un article

Dans l'éditeur, tape `/image` ou `/document` :

- **Image** : choisis l'image, elle s'insère dans le texte. Clique dessus pour ajouter une légende, un texte de remplacement et choisir sa largeur.
- **Document PDF** : le PDF est envoyé et un encadré cliquable s'insère. Dans son panneau, tu peux indiquer la page à ouvrir directement.

## Lire un PDF

Clique sur un document. Le lecteur propose :

- les miniatures des pages (bouton à gauche de la barre) ;
- page précédente, suivante, ou un numéro de page à taper ;
- le zoom (de 50 % à 300 %), le plein écran et le téléchargement ;
- sur téléphone, la page s'adapte à la largeur de l'écran.

Quand on arrive depuis une recherche, le lecteur s'ouvre à la bonne page avec les mots trouvés surlignés.

## Annoter un PDF (créateur)

Dans le lecteur de ton espace créateur, la barre propose trois outils :

- **Lire** : sélectionner et copier le texte.
- **Surligner une zone** : choisis la couleur, puis trace un rectangle sur la page.
- **Ajouter une note** : clique à l'endroit voulu.

Clique sur un surlignage ou une note pour écrire un commentaire, le rendre **visible des lecteurs** ou **privé**, ou le supprimer. Les annotations privées ne sont jamais envoyées aux lecteurs.

## Chercher

- **Ctrl+K** (ou la loupe en haut de chaque page) ouvre la recherche rapide. Les résultats arrivent pendant la frappe ; les flèches choisissent, Entrée ouvre, Échap ferme.
- **Recherche avancée** (`/recherche`) ajoute les filtres :
  - **Où chercher** : l'arborescence complète des blocs et des catégories, avec des cases à cocher. Cocher une catégorie inclut toutes ses sous-catégories. Une case à moitié remplie signale qu'une partie seulement de ce qu'elle contient est cochée. Rien de coché : la recherche porte partout.
  - **Quoi chercher** : articles, documents et PDF, dossiers ; ou seulement l'intérieur des blocs Verset, Hadith, Objection.
  - Étiquettes, période, et pour toi seul le statut (brouillons, publiés).
  - Tri par pertinence, date ou titre.
- La recherche ignore les accents et les majuscules, les voyelles arabes et les variantes d'écriture (أ, إ, آ et ا ; ة et ه ; ى et ي). « الرحمن » trouve « الرَّحْمَٰن ».
- Elle cherche dans les titres, résumés, étiquettes, le texte, les sources, les versets, les hadiths et le texte des PDF.
- Opérateurs :
  - `"concile de Nicée"` cherche la phrase exacte ;
  - `trinité -catholique` exclut un mot ;
  - `trinité OU tawhid` accepte l'un ou l'autre.
- Une faute de frappe ? Si rien ne correspond exactement, l'application propose des résultats approchants et le signale.
- Les recherches récentes s'affichent automatiquement. Le bouton **Sauvegarder** garde une recherche avec ses filtres. Elles restent sur l'appareil où tu les as faites (elles ne passent pas d'un ordinateur à un téléphone).

## Synonymes (créateur)

**Espace créateur → Synonymes**. Écris un groupe de mots équivalents, séparés par des virgules, par exemple `Trinité, trois personnes, triade`. Un lecteur qui cherche l'un d'eux trouve les articles qui emploient les autres. Deux à vingt termes par groupe.

## Si quelque chose ne marche pas

- **« L'espace de stockage ne répond pas »** : le fichier 004 n'a pas été exécuté, ou l'espace `fichiers` n'existe pas. Refais l'étape 5.
- **« La recherche n'a pas pu aboutir »** : exécute 005 (étape 6).
- **Le lecteur PDF reste vide** : relance `npm install` dans le dossier du projet, pour recopier `public/vendor`.
- **La reconnaissance de texte échoue** : vérifie que l'onglet est resté ouvert, puis clique de nouveau sur « Reconnaître le texte ».
