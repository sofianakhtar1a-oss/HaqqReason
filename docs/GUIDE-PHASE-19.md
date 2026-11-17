# Phase 19 · L'Islam authentique

Un nouveau module, ouvert à tous, qui fonctionne exactement comme « Les preuves de la véracité de l'islam » : mêmes blocs, catégories, articles, brouillons, publication, corbeille, historique, recherche et favoris. Seul le contenu change : des vidéos qui expliquent l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.

## Ce qui a été ajouté

- **Base de données** : `supabase/migrations/011_espaces.sql` ajoute la colonne `espace` aux blocs (`preuves` ou `islam`) et crée trois blocs :
  - La croyance
  - Les actes d'adoration
  - La voie des pieux prédécesseurs

  Le script peut être relancé sans risque.
- **Côté lecteur** : la page `/islam` présente les trois portes. Les catégories et les articles s'ouvrent aux mêmes adresses que la bibliothèque (`/explorer/...`) ; le fil d'Ariane ramène à « L'Islam authentique ».
- **Accueil** : une cinquième carte « L'Islam authentique » (modifiable dans Mode créateur → Page d'accueil, comme les autres cartes).
- **Mode créateur** : une carte « L'Islam authentique » sur l'écran de choix. Elle ouvre `/createur/islam`, le même tableau de bord que « Les preuves », limité aux blocs de ce module.

## Ajouter une vidéo

1. Mode créateur → L'Islam authentique → choisis un bloc.
2. Crée une catégorie (par exemple « Le tawhid »), puis un article.
3. Dans l'article, tape `/` puis « Vidéo YouTube » et colle le lien. Ajoute un résumé et les références si tu veux.
4. Publie : la vidéo apparaît pour tout le monde.

La corbeille, les modèles et les sources sont communs aux deux modules.
