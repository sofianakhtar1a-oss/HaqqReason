# Le Vizir · l'assistant IA (Chat général et ChatPDF)

Le sixième espace du mode utilisateur, à l'adresse `/assistant`. Deux onglets :

- **Chat général** : discuter librement avec l'IA de son choix : **Claude** (Anthropic),
  **ChatGPT** (OpenAI) ou **Gemini** (Google). On la choisit en bas de l'écran, et l'on peut en
  changer d'une question à l'autre, dans la même conversation.
- **ChatPDF** : importer un ou plusieurs PDF à la fois, puis demander des résumés, des
  comparaisons, des arguments ou des citations. Chaque réponse cite ses pages sous la forme
  `[Doc 2, p. 14]` ; un clic sur la référence affiche la page sur un « lutrin » pour la vérifier.

Le nom vient de l'arabe *wazīr*, « celui qui aide à porter la charge » (« Donne-moi un aide
(*wazīr*) de ma famille », Ta-Ha, 20:29), comme Calame, Alambic et Truchement, venus de l'arabe.
Il se change dans l'espace créateur (module « Le Vizir »), avec les autres textes de l'espace.

## Le principe : la connexion Google, et rien d'autre

L'utilisateur n'a **aucune clé** à fournir : il lui suffit d'être connecté avec son compte Google.
Le site passe par la **passerelle IA de Vercel** (AI Gateway), son hébergeur : une seule porte
vers Claude, ChatGPT et Gemini, au format « Chat Completions ». Sur Vercel, le site s'y présente
avec le jeton **OIDC** que Vercel lui donne à chaque requête : il n'y a pas non plus de clé côté
site (`src/lib/assistant/passerelle.ts`).

La dépense est prise sur le **crédit gratuit** de la passerelle (5 $ tous les 30 jours pour
l'équipe Vercel, tant qu'aucun crédit n'est acheté), partagé par tous. D'où les quotas de chaque
compte Google (`src/lib/assistant/limites.ts`) :

- **30 questions par jour** (remises à zéro à minuit, heure de Paris) ;
- **0,50 $ d'estimation par mois** (la part du crédit d'un compte ; une centaine de questions
  ordinaires, moins avec de longs PDF) ;
- 12 questions par tranche de 10 minutes au plus.

Une question refusée par la passerelle (crédit épuisé, modèle hors de l'offre gratuite…) ne
compte pas dans le quota.

### L'offre gratuite et le choix des modèles

L'offre gratuite de la passerelle ne sert qu'une partie des modèles (aucun modèle d'Anthropic,
d'après les retours publiés en octobre 2026). Pour chaque IA, le Vizir essaie donc une petite
liste de modèles, du meilleur rapport qualité-prix au plus sûr d'être ouvert
(`CANDIDATS`, dans `src/lib/assistant/modeles.ts`) :

- ChatGPT : GPT-6 Luna, puis GPT-5.4 mini ;
- Gemini : Gemini 3.5 Flash-Lite, puis Gemini 2.5 Flash ;
- Claude : Claude Haiku 5.5.

Un modèle refusé (403 « Free tier users do not have access to this model », ou 404) est sauté et
mis de côté six heures ; le modèle qui répond est retenu, et la réponse affiche son nom. Si tous les
modèles d'une IA sont refusés, elle apparaît « (indisponible) » dans le choix, avec un bouton pour
passer à une autre. Après un achat de crédit, Claude s'ouvrira de lui-même (le site réessaie).

### Pourquoi pas l'abonnement de chacun (Claude Pro, ChatGPT Plus, Gemini Advanced)

Aucune des trois entreprises ne permet à un autre site de se servir d'un abonnement grand public
par la connexion de l'utilisateur. Le Vizir ne passe donc ni par les abonnements, ni par des clés
personnelles : il utilise le crédit du site, avec un quota par compte.

## Vue d'ensemble

```
 Navigateur (React)                       Serveur Next.js (Vercel)                 Services
 ───────────────────                      ────────────────────────                 ────────
 /assistant                               /api/assistant/*                         Supabase (PostgreSQL)
  ├ onglets Chat général / ChatPDF  ──►    1. même origine ? (anti-CSRF)       ◄──►  assistant_reglages (IA choisie)
  ├ choix de l'IA, quota du jour           2. session Google valide en base ?         assistant_conversations
  ├ PDF lus ICI (pdf.js, OCR)              3. tout est lu AVEC l'id du compte         assistant_messages
  │  → seul le texte part                  4. quota du compte vérifié                 assistant_documents
  ├ réponse en direct (NDJSON)      ◄──    5. contexte : historique, PDF              assistant_usage (quota)
  └ lutrin : page citée                    6. appel en flux, jeton OIDC du site ───►  ai-gateway.vercel.sh
                                           7. relais au fil de l'eau                  (crédit gratuit du site)
                                           8. réponse + jetons + coût enregistrés
```

## Sécurité et isolation des comptes

- **Session** : chaque route appelle `entree()` (`src/lib/assistant/http.ts`) : requête venue du
  site lui-même (`Sec-Fetch-Site` / `Origin`), cookie de session Google signé, compte toujours
  présent en base avec la même version de session (une déconnexion de tous les appareils coupe
  l'accès aussitôt).
- **Isolation** : chaque requête de `src/lib/assistant/donnees.ts` est filtrée par l'identifiant
  du compte, même quand l'identifiant de l'objet suffirait. Un compte ne peut ni lire, ni
  modifier la conversation ou le PDF d'un autre : la réponse est « introuvable ».
- **Base** : les tables sont en RLS, fermées aux rôles `anon` et `authenticated` ; seul le
  serveur (clé secrète) y accède. Supprimer un compte efface tout ce qui le concerne.
- **Le jeton de la passerelle** : lu à chaque requête (`@vercel/oidc`), jamais journalisé ni renvoyé
  au navigateur. Seuls le statut et le message d'un refus de la passerelle sont notés dans le
  journal du serveur (`[vizir] passerelle 403 …`), pour comprendre une panne.
- **Anciennes clés** : les clés reliées du temps où chacun fournissait la sienne sont effacées de
  la base à la première ouverture du Vizir par leur compte (table `assistant_cles`, devenue inutile).
- **Contenu** : le texte des PDF est entouré de balises qu'il ne peut pas fermer, et la consigne
  rappelle à l'IA que ce texte est une donnée, jamais une instruction. Les réponses sont
  affichées en Markdown nettoyé (DOMPurify) : ni script, ni image distante, liens externes isolés.
- **Coupe-circuit** : la variable `ASSISTANT_FERME=oui` ferme toutes les routes de l'assistant.

## Le trajet d'une question

1. L'interface envoie `{ conversationId, texte, ia }` à `POST /api/assistant/message`.
2. Le serveur lit, en parallèle et pour ce compte seulement : les réglages, le bilan (rythme,
   questions du jour, dépense du mois), la conversation. Refus clairs avant tout envoi : rythme,
   quota du jour, part du mois.
3. Il lit l'historique et, dans ChatPDF, le texte des documents cochés ; il enregistre la question.
4. Il construit la demande : consigne (prompt système), documents ou extraits, historique
   (≈ 30 000 jetons au plus, les échanges les plus récents), 8 000 jetons de réponse au plus.
5. Il ouvre le flux par la passerelle, avec le premier modèle ouvert de l'IA choisie (voir plus
   haut) ; une surcharge passagère est retentée une fois. La passerelle place elle-même les
   marqueurs de cache (`caching: "auto"`).
6. Les morceaux de texte sont relayés au fil de l'eau en NDJSON (`debut` avec le modèle qui répond,
   `reflexion`, `texte`, `erreur`, `fin`). L'arrêt (bouton ou fermeture de la page) coupe aussi
   l'appel à la passerelle.
7. À la fin, même si le navigateur est parti (`after()`), la réponse est enregistrée — complète,
   interrompue ou en erreur — avec ses jetons et son coût (celui que donne la passerelle, sinon
   une estimation) ; une ligne s'ajoute au journal de consommation, qui compte le quota. Au-delà
   de 4 min 30, la réponse est arrêtée proprement et gardée (limite de durée des fonctions).

## ChatPDF : du fichier au contexte

- **Lecture dans le navigateur** (`src/app/assistant/extraction.ts`) : empreinte SHA-256 (le même
  PDF n'entre pas deux fois), texte page par page avec pdf.js, et pour un document scanné
  (au moins la moitié des pages sans texte) reconnaissance de caractères en français, arabe et
  anglais (60 pages au plus par document). Le fichier ne quitte jamais l'appareil.
- **Stockage** : le texte, sous la forme `[Page N] …`, son nom, ses pages, ses jetons estimés.
  Chaque document reçoit dans sa conversation un **numéro stable** (Doc 1, Doc 2…) jamais
  redonné : les références des anciennes réponses restent justes même après un retrait.
- **Lecture complète** (documents cochés ≤ 60 000 jetons, une centaine de pages) : le texte
  intégral suit la consigne ; les IA gardent ce début en cache d'une question à l'autre.
- **Lecture par extraits** (au-delà) : passages d'environ mille jetons, classés par BM25 (accents
  et majuscules confondus), ≈ 25 000 jetons par question ; une part pour chaque document quand
  on compare, des passages répartis du début à la fin quand on demande un résumé. Les extraits
  accompagnent la question, et l'historique ne garde que la question.
- **Lecture intégrale** (réglage de la conversation) : jusqu'à 250 000 jetons lus à chaque
  question — la plus précise, mais elle use plus vite la part du crédit du compte.
- **Vérifier** : `GET /api/assistant/documents/{id}?page=N` renvoie le texte d'une seule page
  (fonction SQL `assistant_page`), affiché sur le lutrin, avec pages précédente et suivante.

## Les routes

- `GET /api/assistant/etat` : IA choisie, quota (questions restantes, part du mois), IA indisponibles, limites.
- `PATCH /api/assistant/reglages` `{ ia }` : l'IA que le compte retrouve en ouvrant le Vizir.
- `GET | POST /api/assistant/conversations` ; `GET | PATCH | DELETE /api/assistant/conversations/{id}`.
- `POST /api/assistant/documents` ; `GET ?page=N | PATCH | DELETE /api/assistant/documents/{id}`.
- `POST /api/assistant/message` : la réponse en flux (`{ reessayer: true }` refait la dernière).

## Les fichiers

- `supabase/migrations/016_assistant.sql` : tables, numérotation des PDF, `assistant_bilan`, `assistant_page`.
  L'IA choisie est rangée dans `assistant_reglages.modele` (« openai », « google », « anthropic »).
- `src/lib/assistant/` : `passerelle.ts` (appel, flux, erreurs en français, choix du modèle),
  `modeles.ts` (IA, modèles, tarifs), `limites.ts` (quotas), `sse.ts` (lecture du flux),
  `contexte.ts` (pages, BM25, budgets, historique), `consignes.ts` (prompts), `donnees.ts` (base),
  `http.ts`, `protocole.ts`.
- `src/app/api/assistant/` : les routes ci-dessus.
- `src/app/assistant/` : la page, l'interface (`Assistant.tsx`, `Documents.tsx`, `Lutrin.tsx`,
  `Reponse.tsx`, `rendu.ts`, `extraction.ts`, `api.ts`) et `assistant.css`.

## Installation

1. `supabase/migrations/016_assistant.sql` lancée dans Supabase (fait le 18 novembre 2026).
2. Sur Vercel, rien à créer : le jeton OIDC est fourni d'office aux déploiements. Deux conditions
   côté compte Vercel, que le Vizir signale s'il les rencontre :
   - le crédit gratuit de la passerelle demande un **moyen de paiement enregistré** dans l'équipe
     (sans achat ni prélèvement) ; sinon la passerelle répond `customer_verification_required` et
     le Vizir affiche qu'il n'est pas encore activé ;
   - la fédération OIDC doit être active pour le projet (réglage par défaut) ; sinon il affiche
     qu'il n'arrive pas à joindre son service d'IA.
3. Facultatif : `AI_GATEWAY_API_KEY` remplace le jeton OIDC (essais hors de Vercel).

## Les essais

- `npm run test:assistant` : modèles et coûts, quotas, erreurs et flux de la passerelle, repli sur
  le modèle suivant, découpage, BM25, budgets de contexte, historique, consignes.
- `npm run test:sql` : tables, droits, numérotation, bilan, page d'un PDF, effacements.
- `npm run test:assistant:e2e` (après `npm run build`) : le vrai site, une vraie base PostgreSQL
  locale et une fausse passerelle qui note ce qu'elle reçoit — aucune clé demandée, repli quand
  l'offre gratuite refuse un modèle, quotas, isolation des comptes, flux, PDF, erreurs, arrêt en
  route, jeton jamais dans les journaux.
- `npx tsx tests/outils/serveur-essai.mts` : le même montage, pour essayer l'interface dans un
  navigateur.
