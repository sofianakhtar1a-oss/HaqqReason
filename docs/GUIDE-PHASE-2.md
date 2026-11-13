# Guide Phase 2 — Organiser et publier le contenu

Compte environ 20 minutes.

Ce guide suppose que la Phase 1 fonctionne déjà sur ton ordinateur. Si ce n'est pas le cas, commence par `GUIDE-PHASE-1.md`, puis reviens ici à l'étape 3.

## Étape 1 — Remplacer les fichiers du projet

1. Arrête l'application si elle tourne (Ctrl+C dans le terminal).
2. Décompresse `haqqreason-phase-2.zip` dans un **nouveau** dossier.
3. **Copie ton fichier `.env.local`** de l'ancien dossier `haqqreason` vers le nouveau. Sans lui, l'application ne retrouve ni ta base ni ton mot de passe.
4. Tu peux ensuite supprimer l'ancien dossier.

Ton contenu n'est pas dans ces fichiers : il vit dans Supabase. Remplacer le dossier ne fait rien perdre.

## Étape 2 — Installer les composants

Ouvre un terminal dans le nouveau dossier, comme à l'étape 2 de la Phase 1, puis tape :

```
npm install
```

## Étape 3 — Mettre la base à jour

1. Dans Supabase, ouvre **SQL Editor**, puis **New query**.
2. Ouvre le fichier `supabase/migrations/002_structure.sql` avec le Bloc-notes, copie tout, colle dans Supabase.
3. Clique **Run**. Le message « Success. No rows returned » doit s'afficher.

Ce fichier ne s'exécute qu'une seule fois. Si Supabase répond « already exists », c'est qu'il a déjà été exécuté : passe à la suite.

## Étape 4 — Démarrer

```
npm run dev
```

Puis ouvre **http://localhost:3000** et connecte-toi en mode créateur.

## Comment ça marche

**Tout naît en brouillon.** Une catégorie ou un article que tu crées est invisible pour les lecteurs tant que tu ne l'as pas publié. Chaque page du mode créateur te dit en clair si l'élément est visible, et sinon pourquoi.

**Un article n'est visible que si tout son chemin l'est.** Pour qu'un lecteur voie un article, il faut que l'article, sa catégorie et toutes les catégories au-dessus soient publiés. Repasser une catégorie en brouillon cache donc tout ce qu'elle contient, d'un seul geste.

**Ce que tu peux faire :**

- **Créer** une catégorie dans un bloc, puis des sous-catégories sans limite de profondeur, puis des articles.
- **Écrire** un article : titre, résumé, texte, étiquettes, statut. Ctrl+S enregistre. Le navigateur te prévient si tu quittes la page sans avoir enregistré.
- **Voir l'aperçu** d'un article en brouillon, exactement comme un lecteur le verra.
- **Changer l'ordre** des catégories et des articles avec les flèches.
- **Déplacer** une catégorie (avec tout son contenu, même vers un autre bloc) ou un article (vers n'importe quelle catégorie).
- **Personnaliser** une catégorie : titre, description et icône parmi 16.
- **Mettre à la corbeille**, puis restaurer, supprimer définitivement ou vider la corbeille.
- **Modifier depuis la lecture** : quand tu es connecté, un bouton « Modifier » apparaît sur les pages du mode utilisateur.

**Le texte des articles.** Pour l'instant, le texte est simple : laisse une ligne vide entre deux paragraphes. Le gras, les surligneurs fluo, les encadrés et les blocs Verset et Hadith arrivent avec l'éditeur riche de la Phase 3. Tout ce que tu écris maintenant y sera repris tel quel.

## Étape 5 — Vérifier que tout fonctionne

- [ ] L'**Espace créateur** affiche les trois blocs, les derniers articles modifiés et un lien vers la corbeille.
- [ ] Dans un bloc, crée une catégorie : elle apparaît comme un dossier marqué « Brouillon ».
- [ ] Ouvre-la, crée une sous-catégorie, puis un article dans la sous-catégorie : l'éditeur s'ouvre.
- [ ] Écris un résumé et deux paragraphes, ajoute deux étiquettes, choisis « Publié », fais Ctrl+S : « Enregistré à… » s'affiche.
- [ ] Le message au-dessus de l'éditeur indique que l'article est publié mais invisible, car ses catégories sont en brouillon.
- [ ] Clique **Aperçu** : l'article s'affiche comme pour un lecteur.
- [ ] Publie la catégorie, puis la sous-catégorie. Ouvre le **mode utilisateur** dans une fenêtre de navigation privée : le dossier, la sous-catégorie et l'article sont visibles.
- [ ] Crée un second article publié, puis utilise les flèches : l'ordre change aussi côté lecteur.
- [ ] Déplace la sous-catégorie vers un autre bloc : côté lecteur, le fil d'Ariane suit.
- [ ] Mets la sous-catégorie à la corbeille : ses articles disparaissent pour le lecteur. Restaure-la depuis la corbeille : ils reviennent.
- [ ] Dans la corbeille, « Supprimer définitivement » demande une confirmation et indique ce qui sera effacé avec la catégorie.

Vérification automatique des règles de la base (facultatif) :

```
npm run test:sql
```

Toutes les lignes doivent commencer par `OK`.

## En cas de problème

- **« La base de données ne répond pas » ou page d'erreur après la mise à jour** : le fichier `002_structure.sql` n'a probablement pas été exécuté (étape 3).
- **« HaqqReason attend ses réglages »** : le fichier `.env.local` n'a pas été copié dans le nouveau dossier (étape 1).
- **Un article publié reste introuvable pour les lecteurs** : regarde la ligne de visibilité au-dessus de l'éditeur. Elle indique quelle catégorie est encore en brouillon.

## Ce que la Phase 2 ne contient pas encore

- La mise en forme du texte : gras, surligneurs fluo, encadrés, versets, hadiths, sources, objection et réponse (Phase 3).
- L'historique des versions et l'enregistrement automatique (Phase 3).
- Le glisser-déposer : l'ordre se change pour l'instant avec les flèches (Phase 3, avec l'éditeur).
- Les PDF (Phase 4) et la recherche (Phase 5). Les étiquettes saisies dès maintenant serviront à la recherche.
