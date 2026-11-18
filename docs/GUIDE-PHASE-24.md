# Phase 24 · Le Vizir, l'assistant IA

Un sixième espace, `/assistant` : **Chat général** et **ChatPDF**, avec Claude. Chaque utilisateur
relie sa propre clé API Anthropic : toute sa consommation est facturée sur son compte, jamais
sur celui du site. L'architecture complète est décrite dans [ASSISTANT.md](./ASSISTANT.md).

## À faire une fois

1. Supabase → **SQL Editor** → coller `supabase/migrations/016_assistant.sql` → **Run**.
   On doit voir « Success. No rows returned ».
2. Recommandé : Vercel → Settings → Environment Variables → ajouter `ASSISTANT_CLE_SECRET`
   (32 caractères aléatoires au moins), puis redéployer.

## Côté utilisateur

1. Ouvrir « Le Vizir » depuis la page des espaces, connecté avec Google.
2. Créer une clé dans la console Anthropic (`platform.claude.com` → API keys), avec du crédit,
   et la coller : elle est vérifiée, chiffrée, liée au compte, et n'est jamais réaffichée.
3. Poser ses questions, ou importer des PDF dans ChatPDF (plusieurs à la fois).
4. Suivre sa dépense (pastille « Ce mois » en haut), fixer un plafond mensuel, changer de modèle,
   remplacer ou retirer sa clé dans les réglages.

## Dans l'espace créateur

« Le Vizir » apparaît dans la liste des modules : nom, onglets, textes d'accueil et explication
de la clé se modifient comme ceux des autres espaces, avec brouillon puis publication.
