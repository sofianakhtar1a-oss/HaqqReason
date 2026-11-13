# Guide Phase 1 — Installer et tester HaqqReason sur ton ordinateur

Compte environ 30 minutes. Suis les étapes dans l'ordre, sans en sauter.

À la fin, HaqqReason tournera sur ton ordinateur, relié à ta vraie base de données. La mise en ligne (pour l'ouvrir sur ton téléphone) se fait en quelques minutes une fois cette étape réussie.

## Étape 1 — Installer Node.js

Node.js est le moteur qui fait tourner l'application.

1. Va sur **nodejs.org** et télécharge la version marquée **LTS**.
2. Lance l'installateur et clique « Suivant » jusqu'au bout.

## Étape 2 — Ouvrir un terminal dans le dossier du projet

Le terminal est la fenêtre où l'on tape des commandes.

1. Décompresse le fichier `haqqreason-phase-1.zip` (clic droit > Extraire tout).
2. Ouvre le dossier `haqqreason` obtenu.
3. **Sur Windows** : clique dans la barre d'adresse de l'explorateur, tape `cmd`, puis Entrée.
   **Sur Mac** : clic droit sur le dossier > « Nouveau terminal au dossier ».

## Étape 3 — Installer les composants

Dans le terminal, tape cette commande puis Entrée :

```
npm install
```

Elle télécharge les bibliothèques dont l'application a besoin. Attends que le curseur revienne (1 à 3 minutes).

## Étape 4 — Créer la base de données

1. Va sur **supabase.com**, crée un compte gratuit, puis clique **New project**.
2. Nom : `haqqreason`. Région : une région d'Europe. Supabase te demande un mot de passe de base de données : génère-le, note-le, tu n'en auras pas besoin au quotidien.
3. Quand le projet est prêt, ouvre **SQL Editor** dans le menu de gauche, puis **New query**.
4. Sur ton ordinateur, ouvre le fichier `supabase/migrations/001_socle.sql` avec le Bloc-notes. Sélectionne tout (Ctrl+A), copie (Ctrl+C), colle dans Supabase (Ctrl+V).
5. Clique **Run**. Le message « Success. No rows returned » doit s'afficher.

Ce fichier ne s'exécute qu'une seule fois. Il crée les tables, les trois blocs et les règles de sécurité.

## Étape 5 — Récupérer les trois informations Supabase

Dans Supabase, ouvre les réglages du projet (**Project Settings**) :

- Rubrique **Data API** : copie le **Project URL** (il ressemble à `https://xxxx.supabase.co`).
- Rubrique **API Keys** : copie la clé **Publishable** (elle commence par `sb_publishable_`) et la clé **Secret** (elle commence par `sb_secret_`). Si elles n'existent pas encore, clique sur le bouton qui propose de créer les nouvelles clés.

La clé Secret donne tous les droits sur ta base. Ne l'envoie à personne et ne la colle jamais dans une conversation, un e-mail ou une capture d'écran.

## Étape 6 — Régler l'application

1. Dans le dossier `haqqreason`, fais une copie du fichier `.env.example` et nomme la copie exactement `.env.local`.
2. Dans le terminal, tape :

```
npm run secrets
```

   Deux lignes s'affichent : `SESSION_SECRET=...` et `SETUP_TOKEN=...`.
3. Ouvre `.env.local` avec le Bloc-notes et remplis-le : l'URL et les deux clés Supabase de l'étape 5, puis les deux valeurs affichées par la commande. Enregistre.

**Note la valeur de `SETUP_TOKEN`** : c'est le « code d'installation » demandé une seule fois à l'étape 8.

## Étape 7 — Démarrer

```
npm run dev
```

Ouvre ton navigateur à l'adresse **http://localhost:3000**. Pour arrêter l'application : Ctrl+C dans le terminal.

## Étape 8 — Vérifier que tout fonctionne

Coche chaque point :

- [ ] L'accueil affiche **HaqqReason**, la rosace dorée, et les deux choix « Mode utilisateur » et « Mode créateur ».
- [ ] **Mode utilisateur** : les trois arches apparaissent (véracité, défense, réfutation). Cliquer sur une arche ouvre le bloc.
- [ ] Le bouton en haut à droite bascule entre thème sombre et thème clair, et le choix est conservé après rechargement.
- [ ] **Mode créateur** : la première fois, l'écran « Créer ton accès créateur » s'affiche.
- [ ] Avec un mauvais code d'installation, la création est refusée.
- [ ] Avec le bon code et un mot de passe de 12 caractères ou plus, ta **clé de récupération** s'affiche (5 groupes de 4 caractères).
- [ ] **Imprime ou note cette clé maintenant.** Le bouton « Continuer » ne s'active qu'après avoir ressaisi le groupe demandé.
- [ ] Tu arrives dans l'**Espace créateur**. Le bouton « Se déconnecter » te ramène à l'accueil.
- [ ] Reconnecte-toi : un mauvais mot de passe est refusé, le bon est accepté.
- [ ] **Sécurité** : le journal liste tes connexions et tes essais ratés.
- [ ] Test de la clé : déconnecte-toi, clique « Mot de passe oublié », saisis ta clé et un nouveau mot de passe. Une **nouvelle clé** s'affiche : note-la, l'ancienne ne vaut plus rien.

Vérification automatique des règles de sécurité de la base (facultatif) :

```
npm run test:sql
```

Toutes les lignes doivent commencer par `OK`.

## En cas de problème

- **« HaqqReason attend ses réglages »** : le fichier `.env.local` est absent, mal nommé ou incomplet. L'écran indique quelles lignes manquent. Après correction, arrête l'application (Ctrl+C) et relance `npm run dev`.
- **« La base de données ne répond pas »** : l'URL ou une clé Supabase est mal copiée, ou le fichier SQL de l'étape 4 n'a pas été exécuté.
- **« Trop de tentatives »** : la protection contre les essais répétés s'est déclenchée. Attends le délai indiqué.
- **Mot de passe ET clé de récupération perdus** : personne ne peut les retrouver, c'est voulu. En dernier recours, toi seul peux repartir de zéro depuis Supabase : SQL Editor, exécute `delete from creator_auth;`, puis recrée ton accès avec le code d'installation. Ton contenu n'est pas touché.

## Ce que la Phase 1 ne contient pas encore

- La création de catégories et d'articles (Phase 2).
- La double authentification, l'alerte de nouvel appareil et les sauvegardes automatiques (Phase 6). En attendant, Supabase conserve lui-même des sauvegardes selon l'offre choisie.
- Le mode hors-ligne : l'application est déjà installable sur Android une fois en ligne, mais la lecture sans connexion arrive en Phase 6.
