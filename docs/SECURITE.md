# Liste de vérification de sécurité

À cocher avant la mise en ligne, puis à relire une fois par trimestre.

## Avant la mise en ligne

- [ ] Les fichiers SQL ont été exécutés dans l'ordre : `001` à `006`, ou `installation-complete.sql` en une fois.
- [ ] Dans Supabase, menu **Storage** : les espaces `fichiers` et `sauvegardes` sont **Private**.
- [ ] Dans Supabase, menu **Authentication** : rien à activer. HaqqReason n'utilise pas les comptes Supabase, et aucun lecteur n'a de compte.
- [ ] Les six variables sont dans Vercel : `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET`, `SETUP_TOKEN` et `CRON_SECRET`.
- [ ] `SESSION_SECRET`, `SETUP_TOKEN` et `CRON_SECRET` ont été générés par `npm run secrets`, et non inventés à la main.
- [ ] Le fichier `.env.local` n'a jamais été envoyé à quelqu'un, ni mis dans un dossier partagé ou un dépôt en ligne.
- [ ] L'adresse du site commence par `https://`, ce que Vercel fait d'office.

## Juste après la mise en ligne

- [ ] Tu as créé ton accès créateur **toi-même**, immédiatement après la publication.
- [ ] Ton mot de passe fait au moins 12 caractères, et il n'est utilisé nulle part ailleurs. Une phrase de 4 ou 5 mots convient très bien.
- [ ] Ta clé de récupération est écrite **sur papier** et rangée à l'abri, ailleurs que ton ordinateur et ton téléphone.
- [ ] La **double authentification** est active (page Sécurité).
- [ ] Tu as testé une connexion avec le code de ton application d'authentification.
- [ ] Dans le **journal de sécurité** (page Sécurité), seules tes propres actions apparaissent.
- [ ] En tant que lecteur (fenêtre de navigation privée), un brouillon est introuvable.
- [ ] En tant que lecteur, l'adresse `/createur` renvoie vers la page de connexion.

## Chaque mois

- [ ] **Sauvegarde complète** (Outils > Sauvegardes > Télécharger), rangée hors de Supabase (clé USB, Google Drive).
- [ ] Une copie automatique datée d'hier figure dans la liste des sauvegardes.
- [ ] Aucune alerte « nouvel appareil » que tu ne reconnais pas.
- [ ] Coup d'œil au journal de sécurité : pas de série de « Tentative de connexion échouée ».

## Si tu as un doute

- **Tu penses que quelqu'un connaît ton mot de passe** : change-le (page Sécurité). Tous les autres appareils sont déconnectés aussitôt.
- **Ta clé de récupération a pu être vue** : crée-en une nouvelle (page Sécurité). L'ancienne cesse aussitôt de fonctionner.
- **Un appareil inconnu apparaît** : clique sur « Ce n'est pas moi », change ton mot de passe, vérifie que la double authentification est active.
- **La clé Secret de Supabase a pu fuiter** :
  1. Dans Supabase, ouvre **Project Settings > API Keys**, crée une nouvelle clé Secret et supprime l'ancienne.
  2. Remplace la valeur dans Vercel.
  3. Retape `npx vercel --prod`.
- **`SESSION_SECRET` a pu fuiter** : génère-en un nouveau, mets-le dans Vercel, retape `npx vercel --prod`, puis reconnecte-toi. La double authentification sera à réactiver : utilise ta clé de récupération si la connexion la demande.

## Ce qui protège HaqqReason (résumé)

- **Le public ne peut que lire le contenu publié.** C'est la base de données elle-même qui l'impose (règles RLS), pas seulement l'application.
- **Un seul compte créateur possible**, protégé par :
  - un mot de passe stocké sous forme d'empreinte Argon2id ;
  - une clé de récupération ;
  - la double authentification ;
  - la limitation des tentatives ;
  - un refus des mots de passe ayant déjà fuité.
- **Sessions** : jeton signé, illisible par le JavaScript de la page, expirant après 30 minutes d'inactivité et 12 heures au plus. Elles peuvent être révoquées à distance.
- **En-têtes de sécurité stricts** : Content-Security-Policy avec nonce, HSTS, interdiction d'affichage dans un cadre.
- **Contenu des articles** : enregistré sous forme de données structurées et vérifié par le serveur, sans aucun HTML brut, ce qui exclut toute injection de script.
- **Fichiers envoyés** : leur type réel est vérifié par leur contenu. Ils restent dans un espace privé, servi par des liens temporaires de 10 minutes.
- **Journal** de toutes les actions sensibles, et alerte de nouvel appareil.
- **Sauvegardes** : une copie automatique chaque nuit, plus un export complet à la demande.
- **Statistiques anonymes** : aucune donnée personnelle des lecteurs n'est collectée.
