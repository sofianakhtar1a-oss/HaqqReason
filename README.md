# HaqqReason

Bibliothèque d'apologétique islamique : la véracité de l'islam, la défense de l'islam, la réfutation des autres croyances.

## Par où commencer

- **Mettre l'application en ligne et l'installer sur ton téléphone Android** : `docs/GUIDE-MISE-EN-LIGNE.md`. Il part de zéro, en une seule fois, avec le fichier `supabase/installation-complete.sql`.
- **Tu as déjà installé une phase précédente** : `docs/GUIDE-PHASE-8.md` explique la mise à jour (exécuter `008_reglages.sql`, précédé des fichiers manquants).
- **Découvrir chaque fonction** : `docs/GUIDE-PHASE-1.md` à `docs/GUIDE-PHASE-8.md`.
- **Liste de vérification de sécurité avant la mise en ligne** : `docs/SECURITE.md`.
- **Comprendre comment c'est construit** : `docs/ARCHITECTURE.md`.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm install` | installe les composants (et copie le lecteur PDF et la reconnaissance de texte) |
| `npm run secrets` | génère les secrets à mettre dans `.env.local` et dans Vercel |
| `npm run dev` | lance l'application sur l'ordinateur (http://localhost:3000) |
| `npx vercel --prod` | publie la dernière version en ligne |
| `npm run test:sql` | vérifie les règles de sécurité de la base |

État du chantier : les six phases sont terminées.
- Phase 1 : socle et sécurité.
- Phase 2 : organisation du contenu.
- Phase 3 : éditeur riche.
- Phase 4 : fichiers et PDF.
- Phase 5 : recherche avancée.
- Phase 6 : fonctions innovantes, hors-ligne, export, sauvegardes, double authentification.

Le guide de mise en ligne est fourni.
