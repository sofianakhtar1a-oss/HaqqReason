# Phase 19 · L'Islam authentique

Un nouveau module, ouvert à tous, qui fonctionne exactement comme « Les preuves de la véracité de l'islam » : mêmes blocs, catégories, articles, brouillons, publication, corbeille, historique, recherche et favoris. Seul le contenu change : des vidéos qui expliquent l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.

## Ce qui a été ajouté

- **Base de données** : `supabase/migrations/011_espaces.sql` ajoute la colonne `espace` aux blocs (`preuves` ou `islam`). « L'Islam authentique » n'a pas de blocs prédéfinis : un seul bloc, invisible, accueille directement les catégories que tu crées. `012_islam_un_bloc.sql` retire les trois blocs de la première version (s'ils sont vides). Les deux scripts peuvent être relancés sans risque.
- **Côté lecteur** : la page `/islam` affiche tes catégories publiées. Les catégories et les articles s'ouvrent aux mêmes adresses que la bibliothèque (`/explorer/...`) ; le fil d'Ariane ramène à « L'Islam authentique ».
- **Accueil** : une cinquième carte « L'Islam authentique » (modifiable dans Mode créateur → Page d'accueil, comme les autres cartes).
- **Mode créateur** : une carte « L'Islam authentique » sur l'écran de choix. Elle ouvre `/createur/islam` : la liste de tes catégories et le formulaire « Nouvelle catégorie ».

## Ajouter une vidéo

1. Mode créateur → L'Islam authentique.
2. Crée une catégorie (par exemple « Le tawhid »), puis un article.
3. Dans l'article, tape `/` puis « Vidéo YouTube » et colle le lien. Ajoute un résumé et les références si tu veux.
4. Publie : la vidéo apparaît pour tout le monde.

La corbeille, les modèles et les sources sont communs aux deux modules.
