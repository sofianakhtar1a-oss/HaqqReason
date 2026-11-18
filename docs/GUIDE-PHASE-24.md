# Phase 24 · Le Vizir, l'assistant IA

Un sixième espace, `/assistant` : **Chat général** et **ChatPDF**, avec Claude, ChatGPT ou Gemini,
au choix. Chaque utilisateur relie sa propre clé pour chaque IA qu'il veut utiliser : toute sa
consommation est facturée sur son compte, jamais sur celui du site. L'architecture complète est décrite dans [ASSISTANT.md](./ASSISTANT.md).

## Installation

- Une seule étape : lancer `supabase/migrations/016_assistant.sql` dans Supabase (SQL Editor →
  Run ; on doit voir « Success. No rows returned »). Tant qu'elle n'est pas lancée, la page indique
  que Le Vizir ouvre bientôt, et le reste du site fonctionne normalement.
- Rien à régler dans Vercel : la clé qui chiffre les clés des utilisateurs est dérivée de
  `SESSION_SECRET`. Facultatif : une variable `ASSISTANT_CLE_SECRET` (32 caractères aléatoires
  au moins) la rend indépendante de `SESSION_SECRET` ; les clés déjà enregistrées restent lisibles.

## Côté utilisateur

1. Ouvrir « Le Vizir » depuis la page des espaces, connecté avec Google.
2. Choisir une IA et coller sa clé : Claude (`platform.claude.com`), ChatGPT
   (`platform.openai.com`) ou Gemini (`aistudio.google.com`, avec un usage gratuit limité).
   Elle est vérifiée, chiffrée, liée au compte, et n'est jamais réaffichée.
3. Poser ses questions, ou importer des PDF dans ChatPDF (plusieurs à la fois).
4. Suivre sa dépense (pastille « Ce mois » en haut), fixer un plafond mensuel, changer de modèle,
   remplacer ou retirer sa clé dans les réglages.

## Dans l'espace créateur

« Le Vizir » apparaît dans la liste des modules : nom, onglets, textes d'accueil et explication
de la clé se modifient comme ceux des autres espaces, avec brouillon puis publication.
