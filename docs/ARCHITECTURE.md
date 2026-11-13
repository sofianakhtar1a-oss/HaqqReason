# HaqqReason — Architecture, sécurité et design

## 1. Ce que fait l'application

HaqqReason est une bibliothèque en ligne organisée en trois blocs : **La véracité de l'islam**, **La défense de l'islam**, **La réfutation des autres croyances**. Chaque bloc contient des catégories, des sous-catégories sans limite de profondeur, puis des articles.

Deux façons d'y entrer :

- **Mode utilisateur** : tout le monde, sans mot de passe, en lecture seule, contenu publié uniquement.
- **Mode créateur** : Sofian seul, avec mot de passe, pour tout créer, modifier et supprimer.

Une seule application sert l'ordinateur (édition) et le téléphone Android (lecture) : c'est un site web installable, dont les données vivent sur un serveur. Ce qui est écrit sur l'ordinateur apparaît donc aussitôt sur le téléphone.

## 2. Les pièces du système

```
 Téléphone Android ─┐
                    ├─►  Application HaqqReason (Next.js, hébergée sur Vercel)
 Ordinateur ────────┘        │  proxy : en-têtes de sécurité, garde de l'espace créateur
                             │  pages : affichage
                             │  actions serveur : connexion, mot de passe, clé
                             ▼
                      Base de données (Supabase / PostgreSQL)
                             règles RLS : le public ne peut QUE lire le contenu publié
```

- **Next.js 16 + React 19 + TypeScript** : l'application elle-même.
- **Tailwind CSS 4 + Motion** : le style et les animations.
- **Supabase (PostgreSQL + Storage)** : la base de données, et deux espaces de fichiers privés (« fichiers » pour les PDF et images, « sauvegardes » pour les copies quotidiennes).
- **Vercel** : l'hébergement, et la tâche planifiée de sauvegarde de chaque nuit (Vercel Cron).
- **Service hors-ligne** (`public/sw.js`) : garde dans le téléphone les pages publiques consultées et les favoris. Il ne met jamais en cache l'espace créateur, les API ni les fichiers.

Le navigateur ne parle jamais directement à la base : tout passe par le serveur de l'application. Les clés Supabase ne sont donc jamais envoyées aux visiteurs.

## 3. Choix d'authentification

Le cahier des charges demande un mot de passe unique et une clé de récupération, sans adresse e-mail. L'authentification est donc gérée par l'application elle-même plutôt que par le système de comptes de Supabase (qui impose un e-mail) :

- La table `creator_auth` ne peut contenir **qu'une seule ligne** (contrainte `id = 1`) : un second compte créateur est impossible, même par erreur de code.
- Le mot de passe et la clé de récupération sont stockés sous forme d'**empreintes Argon2id** (32 Mo de mémoire, 3 passes). Les valeurs réelles ne sont écrites nulle part.
- La **clé de récupération** : 5 groupes de 4 caractères tirés par le générateur cryptographique du serveur, dans un alphabet de 31 signes sans `0/O` ni `1/I/L` (environ 99 bits d'entropie). L'utiliser crée une nouvelle clé et invalide l'ancienne.
- La **session** est un jeton signé, rangé dans un cookie `httpOnly`, `Secure`, `SameSite=Strict`, préfixé `__Host-`. Le JavaScript de la page ne peut pas le lire. Elle expire après 30 minutes d'inactivité (réglable) et 12 heures au maximum.
- Chaque jeton porte un **numéro de version**. Changer le mot de passe ou cliquer « Déconnecter tous les appareils » augmente ce numéro en base : tous les anciens jetons deviennent inutilisables immédiatement.
- La création du compte exige un **code d'installation** (`SETUP_TOKEN`) connu de Sofian seul : un inconnu qui tomberait sur le site avant lui ne pourrait pas s'emparer du rôle de créateur.

## 4. Défense en profondeur

Aucun système n'est inviolable à 100 %. L'objectif est qu'il faille franchir plusieurs barrières indépendantes pour abîmer le travail :

1. **La base refuse d'elle-même toute écriture publique.** Les règles RLS ne donnent au public qu'un droit de lecture sur le contenu publié. Il n'existe aucune règle d'écriture : même une faille dans l'application ne permettrait pas à un visiteur de modifier quoi que ce soit avec la clé publique.
2. **Chaque action sensible revérifie l'identité côté serveur** (jeton valide + version de session identique à la base). Rien ne repose sur ce que le navigateur prétend.
3. **Limitation des tentatives** : 5 échecs de connexion en 15 minutes depuis une même adresse entraînent un blocage, 10 en une heure un blocage plus long ; un plafond global protège contre les attaques réparties. La récupération par clé est encore plus stricte.
4. **Mots de passe compromis refusés** : le serveur vérifie auprès du service Have I Been Pwned (sans jamais transmettre le mot de passe) qu'il ne figure pas dans une fuite connue.
5. **En-têtes de sécurité** : Content-Security-Policy avec nonce unique par page (bloque les scripts injectés), HSTS, interdiction d'affichage dans un cadre, politique de référent stricte.
6. **Journal de sécurité** : chaque connexion, échec, changement de mot de passe ou de clé est enregistré et consultable dans l'espace créateur. Les adresses IP n'y figurent que sous forme d'empreintes anonymes.
7. **Secrets hors du code** : toutes les clés vivent dans des variables d'environnement du serveur.
8. **Double authentification** (Phase 6) : code à 6 chiffres TOTP (RFC 6238), compatible avec toutes les applications d'authentification.
   - Le secret est chiffré en AES-256-GCM, avec une clé dérivée de `SESSION_SECRET`.
   - Un code déjà utilisé est refusé.
   - Après le mot de passe, un jeton de « deuxième étape » valable 5 minutes attend le code, et les essais sont limités comme pour la connexion.
   - La clé de récupération désactive la double authentification, pour le cas d'un téléphone perdu.
9. **Alerte de nouvel appareil** (Phase 6) : chaque appareil reçoit un identifiant aléatoire dans un cookie.
   - La base n'en garde qu'une empreinte HMAC.
   - Une connexion depuis un appareil inconnu est journalisée et affichée en tête de l'espace créateur.
   - « Ce n'est pas moi » ferme aussitôt toutes les autres sessions.
10. **Sauvegardes** (Phase 6) :
   - export complet en ZIP (base et fichiers) à la demande ;
   - copie automatique de la base chaque nuit dans un espace privé, les 30 dernières étant gardées ;
   - la tâche planifiée n'agit que si elle présente `CRON_SECRET` ;
   - restauration protégée par le mot de passe et une phrase de confirmation, qui sert aussi à déménager vers une autre installation (les blocs sont reconnus par leur nom).

## 5. Modèle de données

**Créé en Phase 1** (`supabase/migrations/001_socle.sql`) :

- `blocs` — les trois blocs : slug, titre, description, couleur d'accent, ordre.
- `categories` — rattachée à un bloc ; `parent_id` permet l'imbrication illimitée ; statut `brouillon` ou `publie` ; `supprime_le` pour la corbeille.
- `articles` — rattaché à une catégorie ; titre, résumé, contenu structuré (`jsonb`), version texte pour la recherche, statut, dates.
- `creator_auth` — l'unique compte créateur.
- `auth_attempts` — tentatives de connexion et de récupération.
- `audit_log` — journal de sécurité.

Règles de cohérence appliquées par la base : une sous-catégorie reste dans le bloc de son parent ; un article hérite du bloc de sa catégorie ; une catégorie n'est visible du public que si elle et **tous ses parents** sont publiés.

**Ajouté en Phase 2** (`supabase/migrations/002_structure.sql`) :

- `etiquettes` et `articles_etiquettes` — mots-clés libres. « Trinité », « trinite » et « TRINITÉ » désignent la même étiquette. Le public ne voit une étiquette que si elle est attachée à un article visible.
- `deplacer_categorie` — déplace une catégorie avec tout son contenu, y compris vers un autre bloc.
- `supprimer_categorie_definitivement` — n'accepte qu'une catégorie déjà placée dans la corbeille.
- `compter_contenus`, `ancetres_categorie`, `taille_sous_arbre` — compteurs des dossiers, fil d'Ariane, avertissement avant suppression.
- Une règle de la base interdit de ranger une catégorie dans l'une de ses propres sous-catégories.
- Les adresses des pages utilisent l'identifiant de chaque élément : renommer ou déplacer un article ne casse jamais un lien partagé.

**Ajouté en Phase 3** (`supabase/migrations/003_editeur.sql`) :

- `versions_articles` — historique de chaque article (200 versions gardées), strictement privé.
- `modeles` — modèles d'articles enregistrés par le créateur, strictement privés.

**Ajouté en Phase 4** (`supabase/migrations/004_fichiers.sql`) :

- Espace de stockage privé `fichiers` (Supabase Storage), 50 Mo par fichier, liste fermée de formats. Il n'a **aucune** règle d'accès public : le navigateur ne reçoit que des liens temporaires signés par le serveur (10 minutes en lecture, un seul envoi en écriture).
- `fichiers` — rattaché soit à un article, soit à une catégorie ; nom, type, taille, nombre de pages, état de l'envoi, état du texte (extrait, scanné, reconnu par OCR).
- `pages_fichiers` — le texte de chaque page d'un PDF, pour la recherche et l'accès direct à la bonne page.
- `annotations` — surlignages et notes posés par le créateur sur une page, en coordonnées relatives (0 à 1) pour suivre le zoom. Chaque annotation est visible des lecteurs ou privée.
- `fichier_visible` — un fichier n'est visible du public que si l'article ou la catégorie qui le porte l'est.
- Le type réel de chaque fichier est vérifié par ses premiers octets (« signature ») après l'envoi. Un faux PDF est refusé et effacé.

**Ajouté en Phase 5** (`supabase/migrations/005_recherche.sql`) :

- Extensions `unaccent` et `pg_trgm`, fonction `normaliser` : minuscules, sans accents, sans voyelles arabes (harakat, tatweel), variantes de l'alif, de la ta marbouta et de l'alif maqsura unifiées.
- Index plein texte pondérés (titre > résumé et étiquettes > texte) sur les articles, catégories, documents et pages de PDF ; index trigrammes pour les fautes de frappe.
- `synonymes` — groupes de mots équivalents gérés par le créateur, appliqués à la requête.
- `rechercher` — une seule fonction pour tout : phrase exacte, exclusion, OU, filtres par blocs et catégories (avec leurs sous-catégories), types, étiquettes, dates, statut ; tri par pertinence, date ou titre ; extrait autour des mots trouvés. Si rien ne correspond exactement, elle propose des résultats approchants.
- Elle s'exécute avec les droits de l'appelant : le public ne trouve jamais un brouillon ni un élément dans la corbeille.
- Les recherches récentes et sauvegardées restent dans l'appareil (stockage local du navigateur), rien n'est envoyé au serveur.

**Ajouté en Phase 6** (`supabase/migrations/006_innovations.sql`) :

- `liens_articles` : les liens `[[Titre]]` de chaque article, gardés sous forme de titre normalisé. Un lien vers un article pas encore écrit se répare tout seul le jour où il est créé.
  - `liens_resolus` et `retroliens` donnent les liens et les rétroliens visibles par l'appelant.
  - `graphe_liens` alimente le graphe de connaissances.
  - `liens_casses` sert au contrôle qualité.
- `vues_articles` et `recherches_vides` : statistiques anonymes, sous forme d'un compteur par article (ou par terme cherché) et par jour.
  - Aucune adresse, aucun cookie, aucun identifiant de lecteur.
  - Un an d'historique au plus.
  - Écriture et lecture réservées au serveur.
- `appareils_connus` : empreintes des appareils du créateur.
- `creator_auth` gagne `totp_secret` (chiffré), `totp_actif` et `totp_dernier_pas` (protection contre la réutilisation d'un code).
- Espace de stockage privé `sauvegardes`.

**Ajouté en Phase 7** (`supabase/migrations/007_sources_navigation.sql`) :

- `auteurs`, `ouvrages`, `citations` : la base bibliographique. Chaque ouvrage et chaque citation a un statut de vérification (à vérifier, vérifiée, citation vérifiée, incomplète, secondaire, contestée).
- `references_articles` : quelles sources chaque article cite, à quelle page. Recalculée à chaque enregistrement par `enregistrer_references` (serveur seulement).
  - Le public ne voit un ouvrage, son auteur ou une citation que s'ils sont cités par un article publié.
  - Les colonnes `notes` (notes privées du créateur) ne sont jamais lisibles par le public.
- `ouvrages_semblables` : détection des doublons d'ouvrages par ressemblance du titre (trigrammes).
- `articles_categories` : classement d'un article dans plusieurs catégories.
- `prerequis` : les articles à lire avant un autre, dans l'ordre.
- `articles_lies` : articles proches (mêmes étiquettes, mêmes sources, liens).
- `fichiers.empreinte` : empreinte SHA-256 calculée dans le navigateur pour repérer un fichier déjà envoyé.

Moteurs purs, partagés entre serveur et navigateur (`src/lib/logique`, `src/lib/schemas`) : analyseur de formules, tables de vérité, validité avec contre-exemple, cohérence, syllogismes, vérification de démonstrations ; disposition des cartes mentales et arbres ; compilateur d'expressions mathématiques sans `eval`. Les schémas sont rendus en SVG côté serveur et ne contiennent jamais de HTML brut.

Aperçus de liens (`src/lib/apercu-lien.ts`) : la page est lue par le serveur avec une protection contre les requêtes vers le réseau interne (résolution DNS, adresses privées refusées, ports 80 et 443 seulement, redirections contrôlées une à une, taille et durée limitées). La vignette est copiée dans le stockage privé : le lecteur ne contacte jamais le site d'origine avant d'avoir cliqué.

`supabase/installation-complete.sql` réunit les fichiers 001 à 007 pour une nouvelle installation en une seule fois.

## 6. Arborescence du projet

```
haqqreason/
├─ docs/                      Guides et documentation
├─ supabase/migrations/       Fichiers SQL à exécuter dans Supabase
├─ scripts/secrets.mjs        Génère les deux secrets du serveur
├─ tests/test-sql.mjs         Vérifie le schéma et les règles de sécurité
└─ src/
   ├─ proxy.ts                En-têtes de sécurité + garde de l'espace créateur
   ├─ app/
   │  ├─ page.tsx             Écran d'entrée : choix du mode
   │  ├─ explorer/            Mode utilisateur : blocs, catégories, articles
   │  └─ createur/            Mode créateur
   │     ├─ bloc/ categorie/ article/ corbeille/ modeles/   Gestion du contenu
   │     ├─ _composants/editeur/   L'éditeur riche (barre d'outils, menus, panneau du bloc)
   │     ├─ connexion/ configuration/ recuperation/ securite/
   │     ├─ actions.ts        Connexion, mot de passe, clé (côté serveur)
   │     └─ contenu-actions.ts  Toutes les modifications du contenu (côté serveur)
   ├─ components/             Éléments d'interface réutilisables
   └─ lib/                    Chiffrement, session, limites, journal, accès à la base
```

## 7. Format des articles et sécurité du contenu

Un article est stocké sous forme de document structuré (JSON), jamais sous forme de HTML. Le fichier `src/lib/document-schema.ts` contient la **liste blanche** de tout ce qu'un document peut contenir : types de blocs, marques de mise en forme, valeurs permises (couleurs, styles, degrés de hadith…).

Trois barrières protègent contre l'injection de code :

1. **À l'enregistrement**, le serveur nettoie le document par liste blanche, puis vérifie sa structure avec le moteur de l'éditeur. Un lien `javascript:`, un attribut inconnu ou un type de bloc inventé sont retirés.
2. **À l'affichage**, le lecteur ne reçoit jamais de HTML brut : `RenduDocument` construit la page élément par élément à partir de la même liste blanche. Même un document altéré directement dans la base ne peut rien exécuter (testé).
3. **La politique de sécurité du navigateur** (CSP avec nonce) bloque tout script qui ne vient pas de l'application.

L'éditeur s'appuie sur TipTap (ProseMirror). Ses extensions propres à HaqqReason (verset, hadith, source, note, encadrés, objection et réponse, comparaison, section repliable, frise) sont dans `src/lib/editeur/extensions.ts`, un fichier partagé entre l'éditeur et le serveur.

**Enregistrement automatique.** L'éditeur enregistre deux secondes après la dernière frappe. Chaque envoi contient la date de dernière modification connue : si l'article a changé ailleurs entre-temps (autre onglet, autre appareil), le serveur refuse au lieu d'écraser, et l'éditeur propose de recharger ou de garder sa version.

## 8. Système de design

**Idée directrice.** Deux références propres au sujet : les manuscrits enluminés (bleu lapis-lazuli et feuille d'or) et l'astrolabe, instrument de la raison. D'où la rosace de l'accueil, une étoile à huit branches dans des cercles gradués, qui se trace à l'arrivée puis tourne très lentement. Les trois blocs sont trois **arches** : on entre dans un bloc comme on franchit une porte.

**Couleurs (thème sombre, par défaut).**

- Nuit lapis `#0B1233` — le fond
- Ivoire `#F4EFE1` — le texte
- Or `#E9BE6A` — la marque et le bloc *Véracité*
- Émeraude `#45D3A6` — le bloc *Défense*
- Améthyste `#B49CFF` — le bloc *Réfutation*

Le thème clair reprend les mêmes teintes, assombries pour rester lisibles sur un fond bleu très pâle (`#EDF0FB`).

**Typographies.** Bricolage Grotesque pour les titres, Instrument Sans pour le texte, Amiri pour l'arabe (versets et hadiths). Les polices sont embarquées dans l'application : rien n'est chargé depuis un site tiers.

**Composants.** Surfaces en verre dépoli, boutons en pilule, champs larges adaptés au pouce, messages d'erreur qui disent quoi corriger.

**Mouvement.** Un seul moment animé sans action de l'utilisateur (le tracé de la rosace). Le reste répond à un geste : les arches s'inclinent sous le pointeur. Tout s'arrête si l'appareil demande de réduire les animations.

## 9. Feuille de route

- **Phase 1 — Socle** ✔ : projet, base, sécurité, accès créateur, clé de récupération, mode utilisateur.
- **Phase 2 — Structure** ✔ : catégories et sous-catégories sans limite, articles, publication, ordre, déplacements (même entre blocs), étiquettes, corbeille, aperçu, dossiers visuels, pages de lecture.
- **Phase 3 — Éditeur** ✔ : mise en forme riche, 8 surligneurs fluo, 5 soulignements, couleurs, effets, 10 encadrés, blocs Verset, Hadith, Source, Note, Objection → Réponse, Comparaison, Section repliable, Frise ; menu « / » ; enregistrement automatique ; historique avec comparaison et restauration ; modèles ; duplication ; glisser-déposer ; contrôle qualité.
- **Phase 4 — Fichiers** ✔ : envoi par glisser-déposer (PDF, images, Word, Excel, PowerPoint, OpenDocument, EPUB, texte), vérification du type réel, lecteur PDF intégré (zoom, miniatures, plein écran, mobile), extraction du texte, OCR des PDF scannés (français, arabe, anglais), annotations publiques ou privées, blocs Image et Document dans les articles.
- **Phase 5 — Recherche** ✔ : palette Ctrl+K, page de recherche avancée, filtres en arborescence par cases à cocher à trois états, types, étiquettes, dates, statut, opérateurs, synonymes, tolérance aux fautes, arabe normalisé, recherche dans le texte des PDF avec ouverture à la bonne page, recherches récentes et sauvegardées.
- **Phase 6 — Innovations** ✔ :
  - **Lecture** : liens `[[…]]` et rétroliens, sommaire flottant, barre de progression, mode immersif, favoris lisibles hors ligne, partage avec aperçu soigné, export PDF « livre » d'un article ou d'une catégorie entière.
  - **Outils publics** : Débat express, graphe de connaissances.
  - **Application installable** : application Android installable (manifeste, icônes, raccourcis, service hors-ligne).
  - **Espace créateur** : tableau de bord enrichi, contrôle qualité, statistiques anonymes, import en masse (Markdown, Word, HTML, export Notion).
  - **Sécurité** : sauvegardes ZIP, copies automatiques et restauration ; double authentification ; alerte de nouvel appareil.
- **Phase 7 — Ateliers et sources** ✔ :
  - **Liens** : cartes d'aperçu soignées pour YouTube (vignette, vidéo ou playlist, chaîne) et pour tous les sites ; un lien collé seul devient une carte.
  - **Laboratoire graphique** : cartes mentales, cartes conceptuelles, arbres argumentatifs, organigrammes, classifications, flux, causalité, dépendances logiques, frises, diagrammes de Venn, graphiques statistiques, courbes de fonctions, matrices et tableaux comparatifs ; zoom, branches repliables, plein écran, export PNG, SVG et PDF.
  - **Atelier de logique** : validité avec contre-exemple, démonstrations pas à pas vérifiées, syllogismes, cohérence et contradictions, tables de vérité ; prémisses reliées aux sources, conclusion reliée à un article ; bibliothèque de 37 sophismes.
  - **Sources** : auteurs, ouvrages, citations réutilisables, statuts de vérification, bibliographie automatique, traçabilité, doublons.
  - **Navigation** : multi-classement, prérequis, « Pour aller plus loin », articles liés, collections de favoris, historique de lecture, page Nouveautés ; doublons de fichiers signalés.
- **Mise en ligne** ✔ : guide pas à pas `docs/GUIDE-MISE-EN-LIGNE.md` (Supabase, Vercel, installation Android, Play Store).

**Évolutions possibles ensuite** :
- **Assistant IA** : résumés, suggestions d'objections, détection de sophismes. Laissé de côté pour l'instant : il demande une clé d'API payante et peut inventer des citations, ce qui est dangereux pour un site de sources.
- **Cartes géographiques** et **logique des prédicats** dans les ateliers.
- **Multilingue** : interface et articles en anglais, puis en arabe (avec la mise en page de droite à gauche). Chaque article pourrait avoir des traductions liées.
- **Recherche par le sens** : trouver « les preuves de la prophétie » même si l'article parle de « signes de Muhammad ﷺ ». Cela passe par des représentations numériques du texte (« embeddings ») stockées dans Supabase (extension pgvector). Certains services de calcul de ces représentations sont payants.
- **Clés d'accès (passkeys)** : se connecter avec l'empreinte digitale ou le visage du téléphone, en plus ou à la place du code TOTP.
- **Publication sur le Google Play Store** : étapes déjà décrites dans le guide de mise en ligne (PWABuilder, Trusted Web Activity).
- **Fiches de révision** : à partir des fiches Débat express, un entraînement à répétition espacée pour mémoriser les réponses.
- **Comparaison de versions publiques** : montrer aux lecteurs ce qui a changé dans un article depuis leur dernière lecture.
