# Chantier « Premium » : paiement, parties payantes, page d'entrée

Demande du 23 novembre 2026, 18 h 10. Le pourcentage du bilan horaire se lit ici : chaque tâche cochée compte pour son poids.

## Plan pondéré (100 points)

### A. Page d'entrée et éditeurs — 10 points (fait, commit 68af8c7)
- [x] Sous-titre modifiable dans le mode créateur (« Pour toute personne qui cherche la vérité… ») — 3
- [x] Accès créateur discret : un petit lien au pied de page — 3
- [x] Texte sous le trait doré modifiable et supprimable — 2
- [x] Le Calame et les autres éditeurs : seulement la petite poubelle, plus le grand bouton — 2

### B. Socle du paiement — 25 points
- [x] Migration 021 : abonnements, compteurs, avis de Stripe, fonction de comptage sans course — 4
- [x] Catalogue des parties (modules, fonctions, réglages par défaut) et périodes — 4
- [x] Configuration du créateur (prix, essai, accès, vendeur, comptes offerts), validée côté serveur — 3
- [x] Client Stripe : produit, prix (changement de prix sans toucher aux abonnés), portail — 4
- [x] Abonnements : recopie depuis Stripe, statuts, période de grâce, revérification — 3
- [x] Droits et compteurs côté serveur, routes API (droits, utiliser, paiement, portail, résilier, reprendre) — 4
- [x] Webhook signé (signature, idempotence, désordre des avis) — 3

### C. Pages Premium — 15 points
- [x] Page /premium : offres, comparatif, consentements (CGV, renonciation au droit de rétractation) — 4
- [x] Retour de paiement /premium/merci, vérifié auprès de Stripe — 2
- [x] Résiliation en trois clics, confirmation à garder — 3
- [x] Conditions générales de vente générées depuis les informations du vendeur, confidentialité — 2
- [x] Badge doré « Accès premium », section « Mon abonnement », suppression de compte qui résilie — 4

### D. Panneau créateur « L'offre Premium » — 15 points
- [x] État de la configuration (clés, mode test ou réel, webhook, base) et interrupteur — 3
- [x] Prix mensuel et annuel, essai gratuit — 2
- [x] Accès par module et par partie : gratuit, premium, limité N fois par période — 5
- [x] Informations du vendeur (CGV), comptes offerts — 3
- [x] Chiffres : abonnés, revenu mensuel estimé, derniers avis de Stripe — 2

### E. Verrous dans les modules — 20 points
- [x] Le Truchement : histoires et dictées servies par le serveur, verrous, compteurs — 7
- [x] L'Alambic : outils et compteurs — 5
- [x] Le Calame : export Word et outils — 3
- [x] Le Portulan et L'Écorché — 5

### F. Vérifier, documenter, mettre en ligne — 15 points
- [x] Tests (droits, périodes, consommation, signature du webhook, configuration) — 4
- [x] Guide de mise en route (compte Stripe, banque, clé restreinte, webhook, Vercel, SQL, double authentification) — 4
- [x] Essais bureau et mobile, clair et sombre (paiement, panneau, badge, fenêtre Premium) — 4
- [x] Typage, lint, build, commit, déploiement vérifié — 3

## Décisions

- Prestataire : Stripe (sans abonnement mensuel ; 1,5 % + 0,25 € par carte européenne standard). Les numéros de carte ne passent jamais par le site : Stripe les saisit sur sa propre page.
- Plus protecteur, payant : Stripe Managed Payments (+3,5 %, Stripe devient vendeur officiel : TVA, fraude, litiges), Radar for Fraud Teams, Paddle (5 % + 0,50 $). Lemon Squeezy est écarté : il ferme.
- L'offre reste éteinte tant que le créateur ne l'allume pas, et ne peut s'allumer que si Stripe est réglé : rien ne change pour les visiteurs d'ici là.
- Les abonnements en cours gardent leur prix quand le créateur le change ; le nouveau prix vaut pour les nouveaux abonnés.
- Le créateur connecté voit tout ; dans la vue utilisateur, il voit les verrous comme un visiteur.

## Journal

- 23 nov. 18 h 31 — Phase A en ligne (68af8c7).
- 23 nov. 19 h 05 — Socle écrit : migration 021 (testée dans PGlite : comptage sans dépassement, périodes, droits refusés à anon et authenticated), catalogue (41 parties), configuration, Stripe (produit et prix créés par le site, portail réglé par le site), webhook signé, routes API.
- 23 nov. 19 h 15 — Pages : /premium, /premium/merci (vérifié auprès de Stripe), /premium/resiliation (trois clics, confirmation téléchargeable), /conditions-vente (générées), confidentialité, « Mon abonnement », badge doré, suppression de compte qui résilie d'abord.
- 23 nov. 19 h 20 — Verrous : Le Truchement (histoires et dictées déplacées dans donnees/langues/ et servies par le serveur après vérification ; dictée surprise tirée par le serveur), L'Alambic (14 outils), Le Calame (Word, PDF, relecture, nouveau document), Le Portulan (niveaux, duels, fiches), L'Écorché (jeux, explorateur, fiches).
- 23 nov. 19 h 30 — Essais Playwright sur le site d'essai (offre allumée avec une clé factice, puis éteinte) : fenêtre Premium, 3 dictées puis refus, rouvrir une dictée gratuite, histoires C1 refusées puis ouvertes pour un abonné, badge doré (bureau, mobile, clair, sombre), panneau du créateur, résiliation ; offre éteinte : aucune marque, aucun verrou. Webhook : signature fausse refusée, avis rejoué reconnu.
- 23 nov. 19 h 37 — En ligne (2949fca, déploiement réussi) ; en production, /premium annonce « L'offre Premium ouvre bientôt » : rien ne change pour les visiteurs tant que l'offre n'est pas allumée. Reste à faire par Sofian : docs/GUIDE-PREMIUM.md.
