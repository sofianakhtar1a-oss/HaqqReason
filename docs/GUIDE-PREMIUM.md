# Guide : mettre en service l'offre Premium

L'offre est construite et en ligne, mais **éteinte** : tant que tu ne l'allumes pas, tout le site reste gratuit, comme avant. Ce guide dit, dans l'ordre, ce qu'il te reste à faire. Compte une heure, en grande partie chez Stripe (vérification de ton identité et de ta banque).

## Ce que tu obtiens

- Deux formules : 4,99 € par mois ou 39,99 € par an (modifiables dans ton espace créateur).
- Le paiement se fait sur la page sécurisée de Stripe : les cartes bancaires ne passent jamais par le site.
- L'argent arrive sur ton compte Stripe, puis sur ton compte bancaire professionnel, par virements automatiques.
- Les abonnés voient « Accès premium » en or sur le site ; ils gèrent leur carte et leurs factures, et résilient en trois clics depuis « Mon compte ».
- Dans ton espace créateur (« L'offre Premium ») : les prix, l'essai gratuit, ce qui est gratuit, limité ou réservé, module par module et partie par partie, les comptes offerts, les chiffres.

## Avant de commencer

- Un statut pour vendre (la micro-entreprise suffit) et ton numéro SIRET.
- Ton compte bancaire professionnel (IBAN).
- Un médiateur de la consommation : obligatoire pour vendre à des particuliers. Tu adhères chez l'un d'eux (la liste officielle est sur le site du ministère de l'Économie, « médiateurs de la consommation référencés »), puis tu notes son nom et son site.

## Étape 1 — Ton compte Stripe et ta banque

1. Crée ton compte sur stripe.com avec ton adresse professionnelle.
2. Active tout de suite la **double authentification** (Paramètres du compte, Sécurité). C'est la meilleure protection contre le piratage.
3. « Activer les paiements » : ton identité, ton SIRET, ton activité, puis l'**IBAN de ton compte professionnel**. Les versements partent ensuite tout seuls (par défaut chaque semaine ou chaque jour, réglable).
4. Paramètres, « Informations publiques » : le nom qui apparaîtra sur le relevé bancaire des abonnés (par exemple HAQQREASON), l'e-mail d'assistance, l'adresse du site, et les liens :
   - conditions de vente : `https://haqqreason.vercel.app/conditions-vente`
   - confidentialité : `https://haqqreason.vercel.app/confidentialite`
5. Paramètres, « E-mails clients » : active les reçus des paiements réussis et les e-mails liés aux abonnements (renouvellement à venir, carte expirée, échec de paiement, résiliation s'il est proposé).
6. Paramètres, Facturation, « Gestion des abonnements et des e-mails » : laisse Stripe retenter les paiements échoués, et choisis « annuler l'abonnement » si tous les essais échouent.

Rien à créer d'autre chez Stripe : le site crée lui-même le produit « HaqqReason Premium », ses deux prix et l'espace d'abonnement des clients.

## Étape 2 — Brancher Stripe au site (une des deux façons)

### Façon A, la plus simple : l'intégration Stripe de Vercel

Dans Vercel, projet HaqqReason, onglet « Integrations » (ou la page Stripe du Marketplace Vercel) : ajoute **Stripe** et relie ton compte existant. Vercel range lui-même la clé dans `STRIPE_SECRET_KEY`. Tu peux commencer en « sandbox » (paiements fictifs) pour tout essayer, puis relier le compte réel.

### Façon B, la plus protégée : une clé restreinte

Une clé restreinte ne peut faire que ce dont le site a besoin : même volée, elle ne permet ni de vider ton solde ni de lire tes virements.

1. Stripe, Développeurs, « Clés API », **« Créer une clé restreinte »**, nom : « Site HaqqReason ».
2. Donne seulement ces droits (tout le reste sur « Aucun ») :
   - Customers : Écriture
   - Checkout Sessions : Écriture
   - Products : Écriture
   - Prices : Écriture
   - Subscriptions : Écriture
   - Customer portal : Écriture
3. Copie la clé (elle commence par `rk_live_`, ou `rk_test_` en mode test).
4. Vercel, projet HaqqReason, Settings, « Environment Variables » : ajoute `STRIPE_SECRET_KEY` avec cette valeur, pour « Production » (et « Preview » si tu veux tester sur les aperçus), en cochant « Sensitive ».

Ne colle jamais une clé ailleurs que dans Vercel : ni dans un e-mail, ni dans une conversation, ni dans le code.

## Étape 3 — Le webhook (les avis de Stripe)

C'est par là que Stripe prévient le site d'un paiement, d'un renouvellement, d'un échec ou d'une résiliation. Sans lui, l'offre ne peut pas s'allumer.

1. Stripe, Développeurs, « Webhooks » (ou « Destinations d'événements ») : **ajouter une destination**.
2. Adresse : `https://haqqreason.vercel.app/api/premium/webhook`
3. Événements à envoyer :
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
   - `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`
4. Copie le **secret de signature** (il commence par `whsec_`) et ajoute-le dans Vercel sous le nom `STRIPE_WEBHOOK_SECRET` (« Sensitive » coché). Si l'intégration Vercel de l'étape 2 l'a déjà créé, ne fais rien.
5. Vercel, « Deployments », dernier déploiement, **Redeploy** : les variables ne s'appliquent qu'au déploiement suivant.

Un webhook en mode test a son propre secret : quand tu passeras au réel, refais cette étape avec le webhook du mode réel.

## Étape 4 — La base de données

Supabase, ton projet, « SQL Editor » : colle tout le contenu de `supabase/migrations/021_premium.sql`, puis « Run ». Le script ne touche à rien d'existant et peut être relancé sans risque. (Tu peux aussi me demander de l'exécuter.)

## Étape 5 — Tes réglages, puis l'essai

Espace créateur, **« L'offre Premium »** :

1. La partie « État » doit être entièrement cochée. Le bouton « Vérifier la connexion à Stripe » essaie la clé pour de vrai.
2. Remplis « Le vendeur » : nom, SIRET, adresse, e-mail, mention de TVA (en franchise : « TVA non applicable, art. 293 B du CGI »), médiateur. Les conditions de vente se remplissent toutes seules.
3. Règle les prix, l'essai gratuit et les accès (les réglages conseillés sont déjà en place).
4. Essaie d'abord en **mode test** (clé `rk_test_`/`sk_test_` et webhook du mode test) : allume l'offre, passe dans la « vue utilisateur », abonne-toi avec la carte d'essai `4242 4242 4242 4242` (date future, code quelconque), vérifie le badge doré, puis résilie depuis « Mon compte ».
5. Remplace ensuite les deux variables par celles du **mode réel**, redéploie, et allume l'offre.

## La sécurité, en résumé

- Double authentification partout : Stripe, Vercel, Supabase, GitHub, ton compte Google.
- Les cartes ne passent jamais par le site ; les deux secrets Stripe ne vivent que dans Vercel.
- Chaque avis de Stripe est vérifié par sa signature ; un faux avis est refusé et noté dans le journal de sécurité.
- Le prix vient toujours de tes réglages, lus par le serveur : personne ne peut payer moins en modifiant la page.
- L'état des abonnements est toujours relu chez Stripe, jamais pris au navigateur.
- Si une clé a pu fuiter : Stripe, Clés API, « Faire pivoter la clé », puis la nouvelle dans Vercel et Redeploy.
- Une fois par mois, jette un œil aux versements et aux litiges dans Stripe.

## Ce que le serveur verrouille, et ce qu'il compte seulement

- **Verrouillé par le serveur** (impossible à contourner) : les histoires et les dictées du Truchement, le paiement, l'abonnement, les compteurs.
- **Compté par le serveur, appliqué sur l'appareil** : les outils qui travaillent dans le navigateur (L'Alambic, les exports du Calame, Le Portulan, L'Écorché, l'immersion et les PDF du Truchement). Le compteur ne se trompe pas, mais une personne très habile pourrait modifier sa page pour passer outre. Le panneau du créateur l'indique partie par partie.

## Des protections en plus, payantes

- **Stripe Managed Payments** : Stripe devient le vendeur officiel ; il collecte et reverse la TVA de chaque pays, gère la fraude et les litiges. En plus des frais habituels. Le site utilise déjà la page de paiement de Stripe : y passer demande très peu de changements.
- **Radar for Fraud Teams** : des règles anti-fraude sur mesure (Radar de base est déjà inclus).
- **Paddle** : lui aussi vendeur officiel, avec ses propres frais par vente.
- À éviter : Lemon Squeezy, qui ferme.

## À faire relire

Les conditions de vente, la résiliation en trois clics et la renonciation au droit de rétractation suivent les règles françaises de la vente en ligne, mais ce guide n'est pas un avis juridique : fais relire les conditions de vente par un juriste, et la question de la TVA (franchise, puis TVA du pays de l'acheteur au-delà des seuils européens) par un comptable.
