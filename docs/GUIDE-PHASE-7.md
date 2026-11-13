# Guide Phase 7 — Liens YouTube, schémas, logique, sources, navigation

Compte environ 5 minutes d'installation.

## Installer la mise à jour

1. Arrête l'application si elle tourne (Ctrl+C dans le terminal).
2. Décompresse `haqqreason-complet.zip` dans un **nouveau** dossier.
3. **Copie ton fichier `.env.local`** de l'ancien dossier vers le nouveau. Aucun nouveau secret n'est nécessaire.
4. Tape `npm install`.
5. Dans Supabase, **SQL Editor** puis **New query** : copie tout le fichier `supabase/migrations/007_sources_navigation.sql`, colle-le, clique **Run**. Le message « Success » doit s'afficher. (Si tu n'avais pas encore exécuté `006_innovations.sql`, exécute-le d'abord.)
6. Tape `npm run dev`, puis ouvre **http://localhost:3000**.
7. Si l'application est déjà en ligne : `npx vercel --prod` après l'étape 5.

Tu pars de zéro ? Suis `docs/GUIDE-MISE-EN-LIGNE.md` : le fichier unique `supabase/installation-complete.sql` contient maintenant les fichiers 001 à 007.

## Liens YouTube et liens Internet en cartes

Comme dans Notion, un lien devient une carte : grande vignette, titre, description, nom du site et adresse.

- **Le plus simple** : colle une adresse seule sur une ligne vide. Elle devient une carte toute seule.
- Ou tape `/youtube` ou `/lien` dans l'éditeur, puis colle l'adresse.
- **YouTube** : la carte affiche la vignette de la vidéo avec un bouton lecture rouge, le nom de la chaîne (« … sur YouTube ») et la mention **Playlist** pour une playlist. Les liens qui commencent à un moment précis (`&t=90`) sont conservés.
- **Autres sites** : titre, description et image de la page sont récupérés automatiquement. Tu peux tout modifier dans le panneau à droite de la carte (titre, description, image).
- Un clic sur la carte ouvre le lien **dans un nouvel onglet**.
- La vignette est copiée dans ton stockage : le lecteur ne contacte YouTube ou le site qu'au moment où il clique, et la carte reste belle même si l'image disparaît du site.

## Laboratoire graphique

Dans le menu `/`, groupe **Schémas** : carte mentale, carte conceptuelle, arbre argumentatif, organigramme, classification, schéma de flux, causalité, dépendance logique, diagramme de Venn, graphique statistique (barres, courbe, secteurs, nuage de points), graphique mathématique (`y = x^2`, `sin(x)`…), matrice de comparaison.

L'atelier s'ouvre en grand. Raccourcis dans les schémas en arbre :

| Touche | Effet |
|---|---|
| Tab | ajoute un enfant |
| Entrée | ajoute un frère |
| F2 | renomme |
| Suppr | supprime |
| Ctrl+Z | annule |

Chaque idée peut avoir une couleur, une forme, un rôle (thèse, objection, réponse, preuve…), une note, et un lien vers un article. Les liens entre idées ont une nature (soutient, s'oppose à, cause, implique…). Double-clic sur un schéma dans l'éditeur pour le rouvrir.

Pour les lecteurs : zoom à la molette ou aux doigts, branches repliables d'un clic, plein écran, et export **PNG**, **SVG** ou **PDF**.

## Atelier de logique

Groupe **Logique** du menu `/` :

- **Validité** : tu écris les prémisses et la conclusion (avec `et`, `ou`, `non`, `→`, `↔`). L'application dit si le raisonnement est valide, et sinon donne un **contre-exemple**.
- **Démonstration pas à pas** : chaque étape est vérifiée (modus ponens, modus tollens, syllogisme hypothétique…).
- **Syllogisme** : les trois propositions classiques (tous, aucun, quelques). La validité est calculée.
- **Cohérence** : repère un ensemble d'affirmations contradictoires et montre le plus petit groupe en conflit. Utile pour mettre en évidence une contradiction dans une doctrine.
- **Table de vérité**.

Chaque prémisse peut être reliée à une source, et la conclusion à un article. Le contrôle qualité signale un raisonnement invalide ou une étape fausse.

**Sophismes** : `/sophisme` insère une carte « Sophisme identifié » (homme de paille, pente glissante, appel à l'autorité… 37 au total) avec ton commentaire. La page publique **/sophismes** les présente tous, avec recherche.

## Sources, citations et bibliographie

Menu **Outils → Sources** :

- **Auteurs** : nom, nom original (en arabe par exemple), époque, biographie.
- **Ouvrages** : titre, auteur, éditeur, édition, année, volumes, langue, ISBN, lien, PDF associé.
- **Citations** : le passage exact, le texte original, le tome, la page, le contexte.
- **Statut de vérification** pour chaque ouvrage et chaque citation : à vérifier, vérifiée, citation vérifiée, incomplète, source secondaire, contestée.
- **Doublons** : en ajoutant un ouvrage au titre très proche d'un ouvrage existant, un avertissement apparaît.
- Les notes sur un ouvrage ou un auteur restent privées.

Dans un article :

- `/reference` insère un appel numéroté (¹, ²…) vers un ouvrage, avec tome et page.
- `/citation-ouvrage` insère le passage exact d'une citation enregistrée, avec sa source et son statut.
- La **bibliographie** se construit toute seule en bas de l'article.
- Chaque ouvrage et chaque auteur a une page publique (« Cité dans ») si un article publié le cite.
- Le contrôle qualité liste les **références à vérifier**.

## Navigation

Dans l'éditeur d'un article, section **Navigation** :

- **Autres catégories** : un même article peut apparaître dans plusieurs catégories (« Aussi classés ici »).
- **À lire avant** : les prérequis, affichés en tête de l'article. L'article prérequis propose ensuite « Pour aller plus loin ».

Pour les lecteurs :

- **Articles liés**, calculés d'après les étiquettes, les sources et les liens.
- Page **Favoris** : **collections** (par exemple « Tawhid », « Trinité ») et **historique de lecture**. Tout reste sur l'appareil.
- Page **/nouveautes** : articles récemment publiés ou modifiés.

## Fichiers en double

En envoyant un fichier déjà présent (même contenu exact, même sous un autre nom), l'application demande confirmation avant de l'envoyer une seconde fois.

## Ce qui n'a pas été fait, et pourquoi

- **Assistant IA** : il demande une clé d'API payante, et une IA peut inventer des citations ou des références. Sur un site dont la force est la fiabilité des sources, ce risque est trop grand sans relecture systématique.
- **Cartes géographiques** et **logique des prédicats** : possibles plus tard.

## Sécurité

- La variable `APERCU_AUTORISER_LOCAL` sert uniquement aux tests automatiques. **Ne la mets jamais** dans `.env.local` ni dans Vercel : elle autoriserait le serveur à lire des adresses du réseau interne.
- La lecture des aperçus de liens refuse les adresses privées, les ports inhabituels et les pages trop lourdes.
