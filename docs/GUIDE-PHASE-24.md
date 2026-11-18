# Phase 24 · Le Vizir, l'assistant IA

Un sixième espace, `/assistant` : **Chat général** et **ChatPDF**, avec Claude, ChatGPT ou Gemini,
au choix. Gratuit pour l'utilisateur : il suffit d'être connecté avec son compte Google, sans
aucune clé. Les questions passent par la passerelle IA de Vercel, sur son crédit gratuit, avec un
quota par compte. L'architecture complète est décrite dans [ASSISTANT.md](./ASSISTANT.md).

## Installation

- La migration `supabase/migrations/016_assistant.sql` est lancée dans Supabase.
- Sur Vercel, aucune clé ni variable à créer : le site se présente à la passerelle avec le jeton
  OIDC que Vercel fournit. Le crédit gratuit de la passerelle demande seulement qu'un moyen de
  paiement soit enregistré dans l'équipe Vercel (aucun prélèvement tant qu'on n'achète pas de
  crédit). S'il manque, le Vizir indique qu'il n'est pas encore activé.

## Côté utilisateur

1. Ouvrir « Le Vizir » depuis la page des espaces, connecté avec Google.
2. Choisir l'IA en bas de l'écran (Claude, ChatGPT ou Gemini) et poser sa question, ou importer
   des PDF dans ChatPDF (plusieurs à la fois).
3. Sous la zone de saisie : les questions gratuites qui restent aujourd'hui (30 par jour).
   Une IA que l'offre gratuite ne sert pas apparaît « (indisponible) », avec un bouton pour en
   prendre une autre.

## Dans l'espace créateur

« Le Vizir » apparaît dans la liste des modules : nom, onglets et textes d'accueil se modifient
comme ceux des autres espaces, avec brouillon puis publication.
