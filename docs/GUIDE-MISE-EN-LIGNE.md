# Mettre HaqqReason en ligne et l'installer sur ton téléphone Android

Ce guide part de zéro. À la fin :
- HaqqReason a sa propre adresse sur Internet (par exemple `https://haqqreason.vercel.app`) ;
- tu écris sur ton ordinateur portable ;
- l'application est installée sur ton téléphone Android, avec son icône, en plein écran, et lisible même sans connexion.

Compte environ 45 minutes la première fois. Tout est gratuit pour démarrer : Supabase (base de données) et Vercel (hébergement) ont chacun une offre gratuite suffisante.

Tu as déjà fait tourner HaqqReason sur ton ordinateur avec les guides des phases 1 à 7 ? Garde ta base Supabase, saute l'étape 2 (exécute seulement les fichiers `006_innovations.sql` puis `007_sources_navigation.sql` s'ils ne le sont pas encore), et commence à l'étape 4.

---

## Étape 1 — Préparer l'ordinateur

1. Installe **Node.js** : sur **nodejs.org**, télécharge la version **LTS** et installe-la en cliquant « Suivant ».
2. Décompresse `haqqreason-complet.zip` (clic droit, puis « Extraire tout »).
3. Ouvre un terminal dans le dossier `haqqreason` :
   - **Windows** : dans l'explorateur, clique dans la barre d'adresse, tape `cmd`, puis Entrée.
   - **Mac** : clic droit sur le dossier, puis « Nouveau terminal au dossier ».
4. Tape `npm install`, puis Entrée. Attends que le curseur revienne : compte 1 à 3 minutes.

## Étape 2 — Créer la base de données (Supabase)

1. Va sur **supabase.com** et crée un compte gratuit.
2. Clique sur **New project** :
   - Nom : `haqqreason`.
   - Région : une région d'Europe.
   - Mot de passe de la base : clique sur « Generate », puis note-le dans un endroit sûr.
3. Quand le projet est prêt, ouvre **SQL Editor** dans le menu de gauche, puis **New query**.
4. Copie le fichier SQL dans Supabase :
   - Sur ton ordinateur, ouvre `supabase/installation-complete.sql` avec le Bloc-notes.
   - Sélectionne tout (Ctrl+A), copie (Ctrl+C), puis colle dans Supabase (Ctrl+V).
5. Clique sur **Run**. Le message « Success » doit s'afficher.

Ce fichier ne s'exécute **qu'une seule fois**. Il crée :
- les tables, les trois blocs et les règles de sécurité ;
- les espaces de stockage privés « fichiers » et « sauvegardes » ;
- le moteur de recherche.

Vérifie dans le menu **Storage** : deux espaces, `fichiers` et `sauvegardes`, apparaissent avec la mention **Private**. Ne les rends jamais publics.

## Étape 3 — Noter les trois informations de Supabase

Dans **Project Settings** :
- Rubrique **Data API** : le **Project URL** (`https://xxxx.supabase.co`).
- Rubrique **API Keys** :
  - la clé **Publishable**, qui commence par `sb_publishable_` ;
  - la clé **Secret**, qui commence par `sb_secret_`.

La clé Secret donne tous les droits sur ta base. Ne l'envoie à personne, ne la colle dans aucune conversation, aucun e-mail, aucune capture d'écran.

## Étape 4 — Générer tes secrets

Dans le terminal, tape :

```
npm run secrets
```

Trois lignes s'affichent :
- `SESSION_SECRET` ;
- `SETUP_TOKEN`, le code d'installation, demandé une seule fois ;
- `CRON_SECRET`, pour la sauvegarde de chaque nuit.

Garde-les dans ton gestionnaire de mots de passe.

Si tu avais déjà une installation, garde ton ancien `SESSION_SECRET`. En changer déconnecte tout et désactive l'effet de ta double authentification.

## Étape 5 — Essayer sur l'ordinateur (conseillé)

1. Fais une copie de `.env.example` et nomme-la exactement `.env.local`.
2. Ouvre-la avec le Bloc-notes et remplis :
   - `SUPABASE_URL` ;
   - `SUPABASE_PUBLISHABLE_KEY` ;
   - `SUPABASE_SECRET_KEY` ;
   - `SESSION_SECRET`, `SETUP_TOKEN` et `CRON_SECRET`.
3. Tape `npm run dev`, puis ouvre **http://localhost:3000**.

L'accueil HaqqReason s'affiche : tout est bien relié. Arrête avec Ctrl+C.

## Étape 6 — Mettre en ligne (Vercel)

1. Va sur **vercel.com** et crée un compte gratuit (offre **Hobby**).
2. Dans le terminal, connecte-toi :

   ```
   npx vercel login
   ```

   Choisis une méthode, par exemple « Continue with Email », puis valide le lien reçu.
3. Envoie le projet :

   ```
   npx vercel
   ```

   Réponds aux questions :
   - « Set up and deploy? » : **Y**.
   - Choisis ton compte.
   - « Link to existing project? » : **N**.
   - Nom : `haqqreason`.
   - Dossier : appuie sur Entrée.
   - « Modify settings? » : **N**.

   Le fichier `.env.local` n'est jamais envoyé (le fichier `.vercelignore` l'exclut). Ce premier envoi affiche une page de configuration manquante : c'est normal.
4. Sur **vercel.com**, ouvre le projet `haqqreason`, puis **Settings** et **Environment Variables**. Ajoute les six variables une par une (nom, valeur, Save) :

   | Nom | Valeur |
   |---|---|
   | `SUPABASE_URL` | le Project URL |
   | `SUPABASE_PUBLISHABLE_KEY` | la clé Publishable |
   | `SUPABASE_SECRET_KEY` | la clé Secret |
   | `SESSION_SECRET` | généré à l'étape 4 |
   | `SETUP_TOKEN` | généré à l'étape 4 |
   | `CRON_SECRET` | généré à l'étape 4 |

   Laisse cochés les trois environnements (Production, Preview, Development).
5. Dans le terminal, publie la version définitive :

   ```
   npx vercel --prod
   ```

   À la fin, Vercel affiche l'adresse de ton site, par exemple `https://haqqreason.vercel.app`.

**Plus tard, pour publier une mise à jour du code**, il suffit de retaper `npx vercel --prod` dans le dossier du projet.

## Étape 7 — Créer ton accès créateur

1. Sur ton ordinateur, ouvre l'adresse de ton site, puis **Mode créateur**.
2. Tape le **code d'installation** (`SETUP_TOKEN`), puis choisis un mot de passe long : au moins 12 caractères, par exemple une phrase de 4 ou 5 mots.
3. Ta **clé de récupération** s'affiche : 5 groupes de 4 caractères.
   - Imprime-la ou recopie-la sur papier, et range-la à l'abri.
   - Elle est montrée une seule fois.
   - C'est le seul moyen de retrouver l'accès si tu oublies ton mot de passe ou si tu perds ton téléphone.
4. Va dans **Sécurité**, puis active la **double authentification** : scanne le QR code avec Google Authenticator, Microsoft Authenticator, Aegis ou 2FAS.

## Étape 8 — Installer l'application sur ton téléphone Android

1. Sur le téléphone, ouvre **Chrome** et va à l'adresse de ton site.
2. Touche le menu **⋮** en haut à droite, puis **Ajouter à l'écran d'accueil**, puis **Installer**. Selon la version d'Android, Chrome peut aussi proposer de lui-même une bannière « Installer l'application ».
3. L'icône HaqqReason (l'étoile dorée) apparaît sur l'écran d'accueil. Elle s'ouvre en plein écran, sans la barre de Chrome.
4. Un appui long sur l'icône donne trois raccourcis : Rechercher, Débat express, Mes favoris.

**Lecture sans connexion.** Les articles ouverts au moins une fois et tous tes favoris restent lisibles sans réseau. Pour préparer un trajet sans réseau, ajoute à tes favoris les articles dont tu auras besoin.

**Sur ton ordinateur**, Chrome et Edge proposent aussi d'installer l'application : c'est l'icône d'écran avec une flèche, dans la barre d'adresse.

## Étape 9 — Vérifier la sauvegarde automatique

Sur **vercel.com**, ouvre le projet, puis **Settings** et **Cron Jobs** : la tâche `/api/sauvegarde-auto` est listée. Elle tourne chaque nuit vers 3 h (heure UTC).

Le lendemain, dans ton espace créateur, ouvre **Outils** puis **Sauvegardes** : une copie datée apparaît.

Cette visite quotidienne a un autre avantage. Sur l'offre gratuite, Supabase met en pause un projet qui reçoit trop peu d'activité pendant une semaine ; la sauvegarde de chaque nuit sollicite la base et l'en préserve. Si un jour ton projet est en pause malgré tout, ouvre Supabase, sélectionne le projet, puis clique **Resume project** : tes données sont intactes.

En plus de cette copie automatique, télécharge chaque mois la **sauvegarde complète** (ZIP avec les PDF). Range-la hors de Supabase : sur une clé USB ou dans ton Google Drive.

## Étape 10 — Avoir ta propre adresse (facultatif)

Tu peux acheter un nom de domaine, par exemple `haqqreason.com` (environ 10 à 15 € par an chez un registraire). Dans Vercel, ouvre **Settings** puis **Domains**, ajoute le domaine et suis les instructions affichées.

Ajoute ensuite dans les variables d'environnement `SITE_URL=https://haqqreason.com`, puis retape `npx vercel --prod`.

---

## Publier sur le Google Play Store (plus tard)

L'application installée depuis Chrome est déjà une vraie application pour les utilisateurs. Si tu veux en plus qu'elle apparaisse dans le Play Store :

1. Crée un compte développeur Google Play sur **play.google.com/console**. Il y a des frais d'inscription uniques : vérifie le montant affiché au moment de l'inscription.
2. Va sur **pwabuilder.com**, colle l'adresse de ton site, puis clique **Start**. PWABuilder vérifie l'application : manifeste, icônes, service hors-ligne, tout est déjà prêt.
3. Choisis **Android**, puis **Generate Package**. Tu obtiens un fichier `.aab` (pour le Play Store) et un fichier de « clés de signature » : garde-le précieusement, il sert à chaque mise à jour.
4. PWABuilder fournit aussi un fichier `assetlinks.json`. Place-le dans le dossier `public/.well-known/` du projet, puis retape `npx vercel --prod`. Il prouve à Android que l'application et le site t'appartiennent ; sans lui, une barre d'adresse resterait visible en haut de l'application.
5. Dans la console Google Play, crée l'application, envoie le fichier `.aab`, puis remplis la fiche :
   - description ;
   - captures d'écran ;
   - politique de confidentialité : l'application ne collecte aucune donnée personnelle des lecteurs.

Le contenu se met à jour tout seul : quand tu publies un article, il apparaît aussi dans l'application du Play Store, sans nouvelle version.

## Ce qui est gratuit, et ce qui pourrait coûter

- **Vercel Hobby** : gratuit pour un usage personnel et non commercial. Si un jour HaqqReason a de très nombreux lecteurs ou devient une activité commerciale, l'offre payante Pro devient nécessaire.
- **Supabase Free** : gratuit, avec des limites en espace de base et de fichiers. Surveille **Settings > Usage** quand ta bibliothèque grandit (surtout les PDF).
  - L'offre Pro supprime la mise en pause et ajoute des sauvegardes quotidiennes gérées par Supabase.
  - Vérifie le prix sur supabase.com/pricing.
- **Nom de domaine** : facultatif, payant chaque année.
- **Play Store** : facultatif, frais d'inscription uniques.

## En cas de problème

- **La page « HaqqReason attend ses réglages » s'affiche en ligne** : une variable d'environnement manque ou est mal recopiée dans Vercel. Corrige-la, puis retape `npx vercel --prod`.
- **« Le compte créateur existe déjà »** alors que tu ne l'as pas créé : quelqu'un t'a devancé avec ton code d'installation. Dans Supabase, ouvre **Table Editor**, puis la table `creator_auth`, et supprime la ligne. Change `SETUP_TOKEN` dans Vercel, publie, puis recommence l'étape 7.
- **Le lecteur PDF reste vide en ligne** : vérifie dans Vercel, onglet **Deployments**, que la dernière publication est « Ready ». Si elle a échoué, ouvre-la pour lire le message, puis retape `npx vercel --prod`.
- **« Installer l'application » n'apparaît pas dans Chrome** : l'adresse doit commencer par `https://`. Recharge la page une fois, attends quelques secondes, puis rouvre le menu ⋮.
