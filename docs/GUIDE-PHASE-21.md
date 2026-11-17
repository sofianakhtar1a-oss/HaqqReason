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

## Ce que tu dois faire, une seule fois

Tant que les étapes 2 et 3 ne sont pas faites, **rien ne change pour les visiteurs** : le mode utilisateur reste ouvert sans compte, comme avant.

### 1. La base de données (Supabase)

Dans Supabase : **SQL Editor → New query**, colle tout le contenu de `supabase/migrations/014_comptes.sql`, puis **Run**. Le script peut être relancé sans risque.

### 2. Créer la connexion Google (gratuit)

1. Ouvre <https://console.cloud.google.com/> avec ton compte Google, et crée un projet (par exemple « HaqqReason »).
2. Menu **API et services → Écran de consentement OAuth** (ou « Google Auth Platform ») :
   - type d'utilisateurs : **Externe** ;
   - nom de l'application : HaqqReason ; e-mail d'assistance : le tien ;
   - ne demande **aucun** accès supplémentaire (les trois de base suffisent : openid, e-mail, profil) ;
   - à la fin, clique **« Publier l'application »** (passer « en production »). Sans cela, seules les adresses que tu ajoutes à la main peuvent se connecter. Avec les seuls accès de base, Google ne demande aucune vérification.
3. Menu **Identifiants → Créer des identifiants → ID client OAuth** :
   - type : **Application Web** ;
   - **URI de redirection autorisés** : ajoute exactement
     - `https://haqqreason.vercel.app/api/compte/google/retour`
     - `https://haqqreason.com/api/compte/google/retour` et `https://www.haqqreason.com/api/compte/google/retour` (si ton domaine est branché)
     - `http://localhost:3000/api/compte/google/retour` (seulement si tu lances le site sur ton ordinateur)
4. Google affiche un **ID client** et un **code secret du client**. Garde la fenêtre ouverte pour l'étape suivante.

### 3. Donner ces deux valeurs au site (Vercel)

Dans Vercel : ton projet → **Settings → Environment Variables**, ajoute :

| Nom | Valeur |
|---|---|
| `GOOGLE_CLIENT_ID` | l'ID client (il finit par `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | le code secret du client |

Puis **Deployments → … → Redeploy** pour que le site les prenne en compte. Le code secret ne doit jamais être mis sur GitHub ni partagé.

### 4. Vérifier

1. Ouvre le site, clique « Mode utilisateur » : la page « Connexion » apparaît.
2. « Continuer avec Google », choisis ton compte : tu arrives sur les espaces, avec ta pastille en haut à droite.
3. Écris une ligne dans Le Calame : « Enregistré sur ton compte » s'affiche.
4. Ouvre le site sur ton téléphone, connecte-toi avec le même compte : le document est là.

Si Google affiche « redirect_uri_mismatch » : l'adresse de l'étape 2.3 n'est pas exactement celle du site (attention au `https`, au `www`, et à l'absence de `/` final).

## À savoir

- Les textes de présentation d'origine ne promettent plus que « tout reste sur ton appareil ». Si tu avais réécrit ces textes dans le mode créateur, pense à les relire (cartes du Calame et du Truchement, description de L'Alambic « Transcrire »).
- Avec des comptes, le site garde des données personnelles (nom, e-mail, documents). Chaque utilisateur peut tout supprimer lui-même depuis « Mon compte ». Pense à le dire dans une page « Confidentialité » si tu en ajoutes une.
- Tests : `npm run test:sql` (base et droits d'accès) et `npm run test:compte` (sessions, retour de connexion, identité Google simulée).
