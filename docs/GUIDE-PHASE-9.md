# Guide Phase 9 — La recherche par le sens

Un lecteur qui tape « les preuves que Muhammad ﷺ était prophète » doit tomber sur ton article « Les signes de la prophétie », même sans un seul mot en commun. C'est ce que fait cette phase.

Compte 3 minutes d'installation, plus 10 minutes si tu veux activer le service.

## Comment ça marche, en une phrase

Chaque article est découpé en morceaux, et chaque morceau est résumé en une suite de nombres qui représente son sens. La question du lecteur est résumée de la même façon, puis comparée. Les articles dont le sens est le plus proche remontent.

**Aucune réponse n'est rédigée par une intelligence artificielle.** Elle ne fait que classer tes articles. Elle ne peut donc inventer ni citation, ni verset, ni référence : c'est tout l'intérêt de ce niveau-là.

## Installer la mise à jour

1. Dans Supabase, **SQL Editor** puis **New query** : copie tout le fichier `supabase/migrations/009_recherche_sens.sql`, colle-le, clique **Run**. (Le fichier `008_reglages.sql` doit avoir été exécuté avant.)
2. Dépose le nouveau `source.zip` sur ton dépôt GitHub. Vercel republie tout seul.
3. Recharge avec **Ctrl+F5**.

À ce stade, tout fonctionne comme avant : la fonction attend sa clé.

## Activer le service

Le calcul de ces nombres se fait chez un fournisseur. Il est payant, mais très bon marché : le modèle courant (text-embedding-3-small) est facturé de l'ordre de 0,02 $ par million de mots traités, soit quelques centimes pour une bibliothèque entière de plusieurs centaines d'articles. Vérifie le tarif du jour au moment de créer ton compte.

1. Crée un compte sur **platform.openai.com**, rubrique **API keys**, et crée une clé (elle commence par `sk-`). Ajoute quelques euros de crédit.
2. Dans Vercel : ton projet → **Settings** → **Environment Variables**. Ajoute :
   - nom : `EMBEDDINGS_CLE`
   - valeur : ta clé
3. **Deployments** → le menu « … » du dernier déploiement → **Redeploy**.
4. Va dans **Espace créateur → Outils → Recherche par le sens**. La page doit afficher « Service configuré ».
5. Clique sur **« Indexer N articles »** pour traiter les articles déjà écrits. L'avancement s'affiche ; tu peux fermer la page une fois terminé.

Trois réglages facultatifs, si tu veux un autre fournisseur (Mistral, Voyage, ou un service compatible) : `EMBEDDINGS_URL`, `EMBEDDINGS_MODELE`, `EMBEDDINGS_DIMENSIONS`.

Ne définis **jamais** `EMBEDDINGS_AUTORISER_LOCAL` en ligne : elle n'existe que pour les tests automatiques.

## Au quotidien

**Les nouveaux articles s'indexent tout seuls**, juste après l'enregistrement. L'indexation se fait en arrière-plan : elle ne ralentit jamais ton écriture, et si le service est en panne, ton article est enregistré quand même, puis rattrapé au prochain enregistrement.

**Seuls les morceaux modifiés sont recalculés.** Corriger une faute de frappe ne coûte rien.

**Les brouillons sont indexés aussi**, pour que tu les retrouves depuis ton espace. Le public ne les voit jamais : la recherche s'exécute avec les droits de celui qui la fait, exactement comme la recherche par mots.

**Un article mis à la corbeille** disparaît immédiatement de la recherche par le sens.

## Pour le lecteur

La recherche par le sens n'intervient **que lorsque la recherche par mots ne suffit pas** : aucun résultat, ou seulement des résultats approchants. C'est volontaire, pour deux raisons : la recherche par mots est plus précise quand elle fonctionne, et chaque appel au service coûte une petite somme.

Dans ce cas, un encadré « Articles proches par le sens » apparaît sous les résultats, avec un bouton **« Je n'ai pas trouvé ma réponse »**.

Ce bouton note la question dans tes statistiques (Outils → Statistiques, « sujets cherchés sans résultat ») : tu sais ainsi quels articles tes lecteurs attendent. Rien d'identifiant n'est conservé, seulement le terme cherché et le jour.

## Garde-fous sur la dépense

- **30 questions par heure et par visiteur** au maximum. Un robot ne peut pas faire grimper la facture.
- **20 signalements par heure et par visiteur** pour le bouton « je n'ai pas trouvé ».
- Tu peux couper la fonction pour les lecteurs à tout moment : **Paramètres → « Proposer les articles proches par le sens »**. L'indexation reste en place, et toi tu continues d'en profiter dans ton espace.
- Sans clé configurée, aucune requête n'est jamais émise.

## Les limites, dites franchement

- **C'est payant.** Peu, mais ce n'est pas gratuit. Surveille ton crédit chez le fournisseur.
- **La qualité dépend de tes articles.** Si un sujet n'est traité nulle part, rien ne le fera apparaître. C'est là que le bouton « je n'ai pas trouvé » prend le relais.
- **La comparaison se fait en SQL, sans extension.** C'est volontaire : pas de dépendance, sauvegarde et restauration inchangées, et c'est largement assez rapide pour quelques centaines à quelques milliers d'articles. Au-delà de plusieurs milliers, il faudra passer à l'extension `pgvector` de Supabase — le code est organisé pour que cette bascule ne touche qu'un fichier SQL.
- **Ce n'est pas un assistant qui répond.** C'est un bibliothécaire qui te tend le bon livre.
