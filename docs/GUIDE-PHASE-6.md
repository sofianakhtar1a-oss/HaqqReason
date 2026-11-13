# Guide Phase 6 — Fonctions innovantes, hors-ligne, export, sécurité renforcée

Compte environ 10 minutes d'installation.

## Installer la mise à jour

1. Arrête l'application si elle tourne (Ctrl+C dans le terminal).
2. Décompresse `haqqreason-complet.zip` dans un **nouveau** dossier.
3. **Copie ton fichier `.env.local`** de l'ancien dossier vers le nouveau.
4. Dans le terminal, tape `npm run secrets`. Copie seulement la ligne `CRON_SECRET=…` à la fin de ton `.env.local`. Garde tes anciens `SESSION_SECRET` et `SETUP_TOKEN` : ne les remplace pas, sinon tu serais déconnecté et ta double authentification ne fonctionnerait plus.
5. Tape `npm install`.
6. Dans Supabase, **SQL Editor** puis **New query** : copie tout le fichier `supabase/migrations/006_innovations.sql`, colle-le, clique **Run**. Le message « Success » doit s'afficher.
7. Tape `npm run dev`, puis ouvre **http://localhost:3000**.

Tu pars de zéro, sans aucune phase installée ? Suis plutôt `docs/GUIDE-MISE-EN-LIGNE.md` : il utilise le fichier unique `supabase/installation-complete.sql`.

## Pour les lecteurs

**Liens entre articles.** Dans l'éditeur, écris le titre d'un autre article entre doubles crochets : `[[La Trinité]]`. Pour afficher un autre texte : `[[La Trinité|le dogme trinitaire]]`. Les majuscules et les accents ne comptent pas. Si l'article n'existe pas encore, le texte est souligné en pointillés ; le lien s'active tout seul le jour où tu crées l'article.

**Articles qui citent celui-ci.** En bas de chaque article, la liste des articles qui pointent vers lui apparaît automatiquement.

**Sommaire, progression, mode immersif.**
- Dès qu'un article a au moins deux titres, un sommaire apparaît. Sur grand écran il reste à droite et suit la lecture. Sur téléphone, il se replie sous le résumé.
- Une fine barre dorée en haut de l'écran montre la progression de la lecture.
- **Mode immersif** : le texte seul, plus grand, sans menu. Échap ou le bouton en bas à droite pour sortir.

**Favoris et hors-ligne.**
- « Ajouter aux favoris » garde l'article sur l'appareil, et la page **Favoris** les rassemble.
- Les favoris et les articles déjà ouverts restent lisibles **sans connexion** (dans le métro, en avion).
- Les favoris sont propres à chaque appareil.

**Partager.** Le bouton ouvre le menu de partage du téléphone (WhatsApp, SMS, e-mail…). Sur ordinateur, il copie le lien. Un lien partagé affiche un bel aperçu avec le titre et la couleur du bloc.

**Exporter en PDF.**
- Sur un article ou sur une catégorie entière (bouton « Exporter toute la catégorie en PDF »), une mise en page soignée s'ouvre : page de titre, sommaire, puis un article par page, avec les numéros de page.
- Dans la fenêtre d'impression, choisis **Enregistrer au format PDF**. Sur Android, choisis l'imprimante « Enregistrer en PDF ».

**Débat express** (`/debat`).
- Chaque bloc « Objection → Réponse » de tes articles publiés devient une fiche.
- Tape un mot de l'objection qu'on te fait : la fiche apparaît. Touche-la pour révéler la réponse, avec un lien vers l'article complet.
- Filtre par bloc, ou tire une fiche au hasard pour t'entraîner.

**Graphe de connaissances** (`/graphe`).
- Une carte de toute la bibliothèque : blocs, catégories, articles, étiquettes. Les traits dorés relient les articles qui se citent.
- Survole un point pour voir ses voisins, clique pour l'ouvrir.
- Molette ou pincement pour zoomer, glisser pour te déplacer.

## Pour toi (espace créateur)

**Tableau de bord**. Il montre désormais :
- le nombre d'articles par bloc ;
- les brouillons en attente ;
- l'état de la double authentification ;
- l'accès direct au contrôle qualité, aux statistiques et aux outils.

**Contrôle qualité** (`Outils > Contrôle qualité`). Il liste :
- tous les articles sans source ;
- les hadiths sans degré d'authenticité ;
- les versets sans traduction ou sans référence ;
- les objections sans réponse ;
- les liens `[[…]]` qui ne mènent à aucun article.

**Statistiques** (`Outils > Statistiques`).
- Ce que tu vois : lectures par jour, articles les plus lus, et surtout les sujets **cherchés sans résultat**, c'est-à-dire les articles que tes lecteurs attendent.
- Ce qui est enregistré : un simple compteur par article et par jour. Aucune adresse, aucun cookie, aucun identifiant de lecteur.
- Tes propres visites ne sont pas comptées.

**Importer** (`Outils > Importer des contenus`).
1. Choisis la catégorie de destination.
2. Dépose tes fichiers : Markdown (`.md`), Word (`.docx`), texte, HTML, ou l'export complet de Notion (`.zip`). Pour Notion : Paramètres, puis Exporter tout l'espace de travail, au format « Markdown & CSV ».
3. Vérifie les titres proposés.
4. Clique sur **Importer**.

Chaque document devient un **brouillon** :
- le premier grand titre devient le titre de l'article ;
- les gras, italiques, listes, titres et citations sont conservés ;
- avec la case « Recréer les dossiers », la structure de Notion devient des sous-catégories.

Les images ne sont pas importées : ajoute-les ensuite avec `/image`.

**Sauvegardes** (`Outils > Sauvegardes`).
- **Télécharger la sauvegarde complète** : un fichier ZIP avec absolument tout (articles, catégories, étiquettes, historique, modèles, synonymes, PDF et images). Fais-le chaque mois, et range le fichier sur une clé USB ou dans ton Google Drive.
- **Sauvegardes automatiques** :
  - une fois l'application en ligne, une copie de la base est rangée chaque nuit dans Supabase, et les 30 dernières sont gardées ;
  - « Faire une copie maintenant » en crée une tout de suite.
- **Restaurer** : choisis un ZIP ou une copie automatique, tape ton mot de passe et le mot `RESTAURER`. Tout le contenu actuel est remplacé.

La restauration sert aussi à **déménager** : sauvegarde sur l'ancienne installation, restaure sur la nouvelle.

**Double authentification** (`Sécurité`). Fortement recommandée.
1. Installe sur ton téléphone une application d'authentification : Google Authenticator, Microsoft Authenticator, Aegis ou 2FAS.
2. Sur la page Sécurité, tape ton mot de passe, puis clique sur **Activer la double authentification**.
3. Scanne le QR code avec l'application.
4. Tape le code à 6 chiffres qu'elle affiche.

Ensuite, chaque connexion demande ton mot de passe **et** le code du moment. Même avec ton mot de passe, personne ne peut entrer sans ton téléphone.

Si tu perds ton téléphone : sur la page de connexion, clique sur « Mot de passe oublié » et utilise ta clé de récupération. Elle désactive la double authentification, et tu pourras la réactiver avec ton nouveau téléphone.

**Alerte de nouvel appareil.**
- Quand quelqu'un se connecte depuis un appareil jamais vu (un nouvel ordinateur, un autre navigateur), une alerte apparaît en haut de ton espace créateur.
- **C'est bien moi** : l'appareil est mémorisé.
- **Ce n'est pas moi** : cet appareil est immédiatement déconnecté. Change alors ton mot de passe et active la double authentification.
- La liste de tes appareils est sur la page Sécurité.

## Vérifier que tout fonctionne

1. Crée deux articles. Dans le premier, écris `[[` suivi du titre exact du second, puis `]]`. Publie les deux. Côté lecteur, le lien mène au second article, et le second affiche « Articles qui citent celui-ci ».
2. Ajoute deux titres dans un article : le sommaire apparaît à droite.
3. Ajoute un bloc Objection → Réponse, publie, ouvre **Débat express** : la fiche y est.
4. Ouvre **Graphe** : tes articles apparaissent, reliés.
5. Sur un article, clique **Exporter en PDF**, puis choisis « Enregistrer au format PDF ».
6. Sur la page Sécurité, active la double authentification, déconnecte-toi, reconnecte-toi : le code est demandé.
7. Dans `Outils > Sauvegardes`, télécharge la sauvegarde complète et ouvre le ZIP : tu y trouves `bibliotheque.json` et un dossier `fichiers`.

Le mode hors-ligne ne fonctionne que sur l'application en ligne (pas avec `npm run dev`) : tu le vérifieras après la mise en ligne.
