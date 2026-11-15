# HaqqReason

Bibliothèque d'apologétique islamique : la véracité de l'islam, la défense de l'islam, la réfutation des autres croyances.

## Par où commencer

- **Mettre l'application en ligne et l'installer sur ton téléphone Android** : `docs/GUIDE-MISE-EN-LIGNE.md`. Il part de zéro, en une seule fois, avec le fichier `supabase/installation-complete.sql`.
- **Tu as déjà une version en ligne** : `docs/GUIDE-PHASE-11.md` explique la dernière mise à jour (aucun SQL à exécuter). Si tu n'avais pas encore fait les précédentes, `docs/GUIDE-PHASE-9.md` indique les fichiers SQL à passer avant.
- **Découvrir chaque fonction** : `docs/GUIDE-PHASE-1.md` à `docs/GUIDE-PHASE-11.md`.
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

État du chantier : les onze phases sont terminées.
- Phase 1 : socle et sécurité.
- Phase 2 : organisation du contenu.
- Phase 3 : éditeur riche.
- Phase 4 : fichiers et PDF.
- Phase 5 : recherche avancée.
- Phase 6 : fonctions innovantes, hors-ligne, export, sauvegardes, double authentification.
- Phase 7 : ateliers (schémas, logique), sources et navigation.
- Phase 8 : table des matières, résumés longs, paramètres et durcissement des sessions.
- Phase 9 : recherche par le sens.
- Phase 10 : confort d'écriture (barre d'outils collante, poubelle par bloc, colonnes indépendantes).
- Phase 11 : graphe en deux temps et atelier d'image au collage.

Le site est en ligne et le guide de mise en ligne est fourni.
