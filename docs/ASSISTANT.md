# Le Vizir · l'assistant IA (Chat général et ChatPDF)

Le sixième espace du mode utilisateur, à l'adresse `/assistant`. Deux onglets :

- **Chat général** : discuter librement avec l'IA de son choix : **Claude** (Anthropic),
  **ChatGPT** (OpenAI) ou **Gemini** (Google). On la choisit en bas, à côté du modèle, et l'on peut
  en changer d'une question à l'autre, dans la même conversation.
- **ChatPDF** : importer un ou plusieurs PDF à la fois, puis demander des résumés, des
  comparaisons, des arguments ou des citations. Chaque réponse cite ses pages sous la forme
  `[Doc 2, p. 14]` ; un clic sur la référence affiche la page sur un « lutrin » pour la vérifier.

Le nom vient de l'arabe *wazīr*, « celui qui aide à porter la charge » (« Donne-moi un aide
(*wazīr*) de ma famille », Ta-Ha, 20:29), comme Calame, Alambic et Truchement, venus de l'arabe.
Il se change dans l'espace créateur (module « Le Vizir »), avec les autres textes de l'espace.

## Le principe : chacun paie sa propre consommation

Le site **n'a de clé chez aucune IA** et n'en utilise jamais. Chaque utilisateur relie **ses**
clés API à son compte Google, une par IA qu'il veut utiliser : console Anthropic
(`platform.claude.com`), plateforme OpenAI (`platform.openai.com`) ou Google AI Studio
(`aistudio.google.com`, avec un usage gratuit limité). Chaque question part vers l'IA choisie
avec la clé de l'utilisateur pour cette IA : elle est facturée sur son compte, dans ses propres
limites. Sans clé reliée pour l'IA choisie, rien n'est envoyé.

Les appels : Claude par l'API Messages (cache explicite des documents), ChatGPT par l'API
Responses (`store: false`, cache automatique), Gemini par `streamGenerateContent` (clé dans
l'en-tête `x-goog-api-key`, jamais dans l'adresse ; cache implicite). Les trois flux sont
ramenés au même format (`src/lib/assistant/ia.ts`) : le reste du module ne fait pas la différence.

### Pourquoi une clé API, et pas l'abonnement (Claude Pro, ChatGPT Plus, Gemini Advanced)

Aucune des trois entreprises ne permet à un autre site de se servir d'un abonnement grand public.
Pour Claude, Anthropic interdit aux applications tierces d'utiliser la connexion d'un abonnement Claude
(jetons « OAuth » d'abonnement), règle appliquée depuis avril 2026. La voie autorisée est la
clé API de la console, payée à l'usage. Deux précisions pour les utilisateurs :

- si leur offre comprend des **crédits API mensuels**, ils s'appliquent à la clé de leur organisation ;
- ils peuvent fixer une **limite de dépense** dans la console (page « Limits ») : c'est la protection
  qui fait foi. Le Vizir ajoute un plafond mensuel facultatif, calculé sur son estimation.

### Et la « liaison de compte » (facturation liée) ?

Anthropic teste depuis novembre 2026 une **facturation liée** : l'utilisateur se connecte à
Anthropic depuis l'application (OAuth), et les appels sont facturés sur son compte sans qu'il
copie de clé. Elle demande au créateur une application OAuth dans la console, une fédération
d'identité de charge de travail, une vérification DNS et une revue d'Anthropic ; en phase
d'essai, elle est réservée à des comptes de test plafonnés, et les abonnements ne s'y relient
pas. Le code est prêt à l'accueillir : seul `src/lib/assistant/anthropic.ts` (les en-têtes de
l'appel) et l'écran de la clé changeraient ; conversations, PDF, flux et suivi restent identiques.

## Vue d'ensemble

```
 Navigateur (React)                       Serveur Next.js (Vercel)                 Services
 ───────────────────                      ────────────────────────                 ────────
 /assistant                               /api/assistant/*                         Supabase (PostgreSQL)
  ├ onglets Chat général / ChatPDF  ──►    1. même origine ? (anti-CSRF)       ◄──►  assistant_cles (chiffrée)
  ├ PDF lus ICI (pdf.js, OCR)              2. session Google valide en base ?         assistant_conversations
  │  → seul le texte part                  3. tout est lu AVEC l'id du compte         assistant_messages
  ├ réponse en direct (NDJSON)      ◄──    4. clé du compte déchiffrée en mémoire     assistant_documents
  └ lutrin : page citée                    5. contexte : historique, PDF, cache       assistant_usage
                                           6. appel en flux, avec SA clé      ───►  api.anthropic.com
                                           7. relais au fil de l'eau                  (facturé à l'utilisateur)
                                           8. réponse + jetons + coût enregistrés
```

## Sécurité et isolation des comptes

- **Session** : chaque route appelle `entree()` (`src/lib/assistant/http.ts`) : requête venue du
  site lui-même (`Sec-Fetch-Site` / `Origin`), cookie de session Google signé, compte toujours
  présent en base avec la même version de session (une déconnexion de tous les appareils coupe
  l'accès aussitôt).
- **Isolation** : chaque requête de `src/lib/assistant/donnees.ts` est filtrée par l'identifiant
  du compte, même quand l'identifiant de l'objet suffirait. Un compte ne peut ni lire, ni
  modifier, ni utiliser la conversation, le PDF ou la clé d'un autre : la réponse est « introuvable ».
- **Base** : les six tables sont en RLS, fermées aux rôles `anon` et `authenticated` ; seul le
  serveur (clé secrète) y accède. Supprimer un compte efface tout ce qui le concerne.
- **Les clés** : une par IA ; chacune contrôlée (format propre à l'IA ; clés d'administration et
  jetons d'abonnement refusés), vérifiée par un appel gratuit (la liste des modèles), puis chiffrée
  en **AES-256-GCM**.
  La clé de chiffrement est dérivée par HKDF de `ASSISTANT_CLE_SECRET` (ou, à défaut, de
  `SESSION_SECRET`), et le chiffrement est **lié au compte** (donnée authentifiée) : recopiée sur
  la ligne d'un autre compte, elle ne se déchiffre pas. Elle n'est jamais renvoyée au navigateur
  (seul l'aperçu `sk-ant-…a1B2` l'est), ni journalisée ; elle ne sort du serveur que vers
  `api.anthropic.com`, dans l'en-tête `x-api-key`.
- **Anti-abus** : 8 essais de clé par heure et par compte (le site ne sert pas à tester des clés
  volées), 40 questions par 10 minutes et 500 par jour (protection du serveur), plafonds de
  stockage des PDF.
- **Contenu** : le texte des PDF est entouré de balises qu'il ne peut pas fermer, et la consigne
  rappelle à Claude que ce texte est une donnée, jamais une instruction. Les réponses sont
  affichées en Markdown nettoyé (DOMPurify) : ni script, ni image distante, liens externes isolés.
- **Coupe-circuit** : la variable `ASSISTANT_FERME=oui` ferme toutes les routes de l'assistant.

## Le trajet d'une question

1. L'interface envoie `{ conversationId, texte, modele, effort }` à `POST /api/assistant/message`.
2. Le serveur lit, en parallèle et pour ce compte seulement : la clé, le bilan (rythme et dépense
   du mois), la conversation. Refus clairs avant tout envoi : pas de clé, clé refusée ou illisible,
   rythme dépassé, plafond mensuel atteint.
3. Il lit l'historique et, dans ChatPDF, le texte des documents cochés ; il enregistre la question.
4. Il construit la demande : consigne (prompt système), documents ou extraits, historique
   (≈ 120 000 jetons au plus, les échanges les plus récents), modèle, effort et longueur maximale.
5. Il ouvre le flux avec la clé de l'utilisateur. Si le modèle refuse le réglage d'effort, il
   réessaie sans lui ; une surcharge passagère est retentée une fois.
6. Les morceaux de texte sont relayés au fil de l'eau en NDJSON (`debut`, `reflexion`, `texte`,
   `erreur`, `fin`). L'arrêt (bouton ou fermeture de la page) coupe aussi l'appel à Anthropic.
7. À la fin, même si le navigateur est parti (`after()`), la réponse est enregistrée — complète,
   interrompue ou en erreur — avec ses jetons (entrée, sortie, cache écrit, cache relu) et son
   coût estimé ; une ligne s'ajoute au journal de consommation. Au-delà de 4 min 30, la réponse
   est arrêtée proprement et gardée (limite de durée des fonctions).

## ChatPDF : du fichier au contexte

- **Lecture dans le navigateur** (`src/app/assistant/extraction.ts`) : empreinte SHA-256 (le même
  PDF n'entre pas deux fois), texte page par page avec pdf.js, et pour un document scanné
  (au moins la moitié des pages sans texte) reconnaissance de caractères en français, arabe et
  anglais (60 pages au plus par document). Le fichier ne quitte jamais l'appareil.
- **Stockage** : le texte, sous la forme `[Page N] …`, son nom, ses pages, ses jetons estimés.
  Chaque document reçoit dans sa conversation un **numéro stable** (Doc 1, Doc 2…) jamais
  redonné : les références des anciennes réponses restent justes même après un retrait.
- **Lecture complète** (documents cochés ≤ 150 000 jetons) : le texte intégral va dans la
  consigne, marqué pour le **cache** de l'API. Les questions suivantes le relisent depuis le cache,
  environ vingt fois moins cher, tant que l'on enchaîne.
- **Lecture par extraits** (au-delà) : passages d'environ mille jetons, classés par BM25 (accents
  et majuscules confondus), ≈ 60 000 jetons par question ; une part pour chaque document quand
  on compare, des passages répartis du début à la fin quand on demande un résumé. Les extraits
  accompagnent la question, et l'historique ne garde que la question : il reste en cache.
- **Lecture intégrale** (réglage de la conversation) : jusqu'à 700 000 jetons lus à chaque
  question — la plus précise et la plus coûteuse.
- **Vérifier** : `GET /api/assistant/documents/{id}?page=N` renvoie le texte d'une seule page
  (fonction SQL `assistant_page`), affiché sur le lutrin, avec pages précédente et suivante.

## Modèles, réglages, coûts

- Claude : Sonnet 5.5 (par défaut), Haiku 5.5, Opus 5.5.
- ChatGPT : GPT-6.2 Sol (conseillé), GPT-6 Luna (économique), GPT-6.2 Astra (approfondi).
- Gemini : 3.8 Flash (conseillé), 3.5 Flash-Lite (économique), 3.1 Pro (approfondi).
- La liste se change dans `src/lib/assistant/modeles.ts` ; à la vérification d'une clé, le site
  regarde quels modèles l'IA lui ouvre réellement.
- Réflexion : Rapide, Équilibré, Approfondi (paramètre `output_config.effort`, avec 8 192,
  16 000 et 32 000 jetons de réponse au plus).
- Le coût affiché est une **estimation** (tarifs publics de novembre 2026,
  `src/lib/assistant/modeles.ts`) ; la facture qui fait foi est celle d'Anthropic.

## Les routes

- `GET /api/assistant/etat` : clés reliées (aperçus), réglages, bilan du mois, limites.
- `PUT /api/assistant/cle` `{ fournisseur, cle }` ; `DELETE /api/assistant/cle?fournisseur=…`.
- `PATCH /api/assistant/reglages` : modèle par défaut, réflexion, plafond mensuel.
- `GET | POST /api/assistant/conversations` ; `GET | PATCH | DELETE /api/assistant/conversations/{id}`.
- `POST /api/assistant/documents` ; `GET ?page=N | PATCH | DELETE /api/assistant/documents/{id}`.
- `POST /api/assistant/message` : la réponse en flux (`{ reessayer: true }` refait la dernière).

## Les fichiers

- `supabase/migrations/016_assistant.sql` : tables, numérotation des PDF, `assistant_bilan`, `assistant_page`.
- `src/lib/assistant/` : `modeles.ts` (IA, modèles, tarifs, formats de clé), `chiffrement.ts`,
  `ia.ts` (la porte commune), `anthropic.ts`, `openai.ts`, `google.ts` (appels, flux, erreurs en français), `contexte.ts` (pages, BM25, budgets,
  historique), `consignes.ts` (prompts), `donnees.ts` (base), `http.ts`, `limites.ts`, `protocole.ts`.
- `src/app/api/assistant/` : les routes ci-dessus.
- `src/app/assistant/` : la page, l'interface (`Assistant.tsx`, `Cle.tsx`, `Documents.tsx`,
  `Lutrin.tsx`, `Reponse.tsx`, `rendu.ts`, `extraction.ts`, `api.ts`) et `assistant.css`.

## Installation

1. Lancer `supabase/migrations/016_assistant.sql` dans Supabase (SQL Editor → Run). Tant que ce
   n'est pas fait, la page indique que Le Vizir ouvre bientôt ; rien d'autre ne change.
2. Rien d'autre : aucune clé Anthropic côté site, aucune variable obligatoire. La clé de
   chiffrement est dérivée de `SESSION_SECRET`. Facultatif : `ASSISTANT_CLE_SECRET` (au moins
   32 caractères aléatoires) la rend indépendante de `SESSION_SECRET` ; une clé déjà enregistrée
   avec l'ancien réglage reste lisible.

## Les essais

- `npm run test:assistant` : format et chiffrement des clés, coûts, lecture du flux, découpage,
  BM25, budgets de contexte, historique, consignes.
- `npm run test:sql` : tables, droits, numérotation, bilan, page d'un PDF, effacements.
- `npm run test:assistant:e2e` (après `npm run build`) : le vrai site, une vraie base PostgreSQL
  locale et une fausse API Anthropic qui note ce qu'elle reçoit — isolation des comptes, clé de
  chaque utilisateur, flux, PDF, cache, erreurs, arrêt en route, aucune clé dans les journaux.
- `npx tsx tests/outils/serveur-essai.mts` : le même montage, pour essayer l'interface dans un
  navigateur sans clé réelle.

Ce qui n'a pas pu être essayé ici : un appel réel à Anthropic (il faut une vraie clé).
Le premier essai réel se fait en reliant sa propre clé sur le site.
