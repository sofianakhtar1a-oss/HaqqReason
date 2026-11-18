# Phase 21 · Comptes Google des utilisateurs et « Vue utilisateur » du créateur

## Ce qui change

### Le mode utilisateur s'ouvre avec un compte Google

- La page d'entrée du mode utilisateur, Le Calame, L'Alambic, Le Truchement et « Mes favoris » demandent une connexion avec Google.
- **La bibliothèque reste lisible sans compte** (« Les preuves », « L'Islam authentique », la recherche, le débat express, le graphe, « Contribuer »). C'est voulu : Google ne peut référencer que des pages ouvertes, et un lien d'article partagé doit s'ouvrir chez tout le monde. Pour changer la liste des espaces fermés : `src/lib/compte/chemins.ts`.
- Le site ne demande à Google que **le nom et l'adresse e-mail**. Il n'a accès ni aux e-mails ni aux fichiers Google, et ne voit jamais le mot de passe.

### Tout est enregistré sur le compte, plus sur un seul appareil

On écrit toujours d'abord sur l'appareil (c'est instantané, et ça marche hors ligne), puis le site recopie sur le compte en quelques secondes. Sur un autre appareil, tout arrive à la connexion.

| Enregistré sur le compte | Reste sur chaque appareil |
|---|---|
| Documents du Calame, avec leurs images et PDF joints | Fichiers son et vidéo d'origine (trop lourds) |
| Progression des Règles de l'anglais | Historique des versions d'un document |
| Cartes de révision, dictionnaire, jours d'étude | Fichiers joints de plus de 20 Mo |
| Texte des vidéos, sons et PDF du Truchement, et l'endroit où l'on s'est arrêté | Thème clair ou sombre, réglages d'affichage |
| Transcriptions de L'Alambic et leurs traductions | |
| Favoris, collections, historique de lecture, recherches sauvegardées, « Mes messages » | |

- Le Calame affiche « Enregistré sur ton compte », « Envoi sur ton compte… » ou « Enregistré sur cet appareil » (hors ligne : l'envoi reprend tout seul au retour du réseau).
- Si le même document est modifié sur deux appareils, **la modification la plus récente l'emporte**.
- **Le travail fait avant les comptes n'est pas perdu** : à la première connexion sur un appareil, tout ce qui s'y trouvait rejoint le compte.
- Deux personnes sur le même ordinateur ne voient jamais les documents l'une de l'autre.
- Page **« Mon compte »** (la pastille ronde, en haut à droite) : état de l'enregistrement, place utilisée, « Se déconnecter », « Se déconnecter et effacer cet appareil » (ordinateur partagé), « Déconnecter tous mes appareils », « Supprimer mon compte ».
- Plafonds par compte, pour protéger l'hébergement gratuit : 60 Mo de textes, 150 Mo de fichiers joints, 20 Mo par fichier. Ils se règlent dans `src/lib/compte/limites.ts`.

### « Vue utilisateur » pour le créateur

- Dans l'espace créateur : la carte **« Voir le site comme un utilisateur »**, ou l'œil dans la barre du haut.
- Tout le site s'affiche alors exactement comme pour un visiteur : plus de raccourci « Modifier », plus de brouillon visible, et la connexion Google est demandée comme à tout le monde.
- Hors de cette vue, le créateur connecté ouvre les espaces sans compte Google (pour l'aperçu de ses brouillons) ; son travail personnel n'est alors gardé que sur l'appareil.
- Seule différence : une barre dorée tout en haut, avec le bouton **« Revenir au mode créateur »**. Il ramène dans l'espace créateur sans redemander le mot de passe. La carte « Mode créateur » de l'accueil fait la même chose.

## Mise en place (faite le 18 novembre 2026)

Tout est en place : il n'y a plus rien à faire.

1. **Base de données** : le script `supabase/migrations/014_comptes.sql` a été lancé dans Supabase (tables `utilisateurs`, `donnees_utilisateur`, `fichiers_utilisateur`, les 4 fonctions et l'espace de stockage privé `comptes`). Il peut être relancé sans risque.
2. **Google Cloud** : projet **HaqqReason** (identifiant `haqqreason`), compte `sofianakhtar1a@gmail.com`.
   - Google Auth Platform : application « HaqqReason », public **Externe**, accès demandés : openid, e-mail, profil.
   - Client OAuth « Site HaqqReason » (Application Web), identifiant public :
     `696064934563-cjkhusordcton5epskjv7er730236grs.apps.googleusercontent.com`
   - URI de redirection autorisés :
     - `https://haqqreason.vercel.app/api/compte/google/retour`
     - `https://haqqreason.com/api/compte/google/retour`
     - `https://www.haqqreason.com/api/compte/google/retour`
3. **Aucun code secret** : Google renvoie au site un jeton d'identité signé, envoyé par formulaire (`response_type=id_token`, `response_mode=form_post`). Le serveur vérifie la signature avec les clés publiques de Google, l'application destinataire, l'émetteur, l'expiration et le nonce de la demande. L'identifiant public est écrit dans `src/lib/compte/jeton.ts` : **aucune variable à ajouter dans Vercel**. Le code secret créé par Google pour ce client ne sert pas ; il peut rester tel quel.

### Pour changer quelque chose

- Ajouter un domaine : Google Cloud → Google Auth Platform → Clients → « Site HaqqReason » → ajouter `https://<domaine>/api/compte/google/retour` dans « URI de redirection autorisés ».
- Couper la connexion Google : variable Vercel `GOOGLE_CONNEXION` = `non`, puis redéployer.
- Utiliser un autre client Google : variable Vercel `GOOGLE_CLIENT_ID`.

### Vérifier

1. Ouvre le site, clique « Mode utilisateur » : la page « Connexion » apparaît avec « Continuer avec Google ».
2. Choisis ton compte : tu arrives sur les espaces, avec ta pastille en haut à droite.
3. Écris une ligne dans Le Calame : « Enregistré sur ton compte » s'affiche.
4. Ouvre le site sur ton téléphone, connecte-toi avec le même compte : le document est là.

Si Google affiche « redirect_uri_mismatch » : l'adresse du site n'est pas dans la liste de l'étape 2 (attention au `https`, au `www`, et à l'absence de `/` final).

## À savoir

- Les textes de présentation d'origine ne promettent plus que « tout reste sur ton appareil ». Si tu avais réécrit ces textes dans le mode créateur, pense à les relire (cartes du Calame et du Truchement, description de L'Alambic « Transcrire »).
- Avec des comptes, le site garde des données personnelles (nom, e-mail, documents). Chaque utilisateur peut tout supprimer lui-même depuis « Mon compte ». Pense à le dire dans une page « Confidentialité » si tu en ajoutes une.
- Tests : `npm run test:sql` (base et droits d'accès) et `npm run test:compte` (sessions, jeton d'identité Google simulé).
