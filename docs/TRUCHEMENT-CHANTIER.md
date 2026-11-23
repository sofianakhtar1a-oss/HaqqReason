# Le Truchement — chantier « super site pour apprendre l'anglais »

Demande du 21 novembre 2026, 20 h 23 : scanner tout le module d'anglais, puis ajouter beaucoup
plus d'exercices corrigés à chaque leçon de conjugaison et de grammaire, une bibliothèque
d'histoires (A1 à C2, plusieurs pages chacune, chaque mot traduit d'un toucher, traductions
enregistrées d'avance) et d'autres fonctionnalités inventées pour aider les francophones.

Règles du chantier : rien n'est supprimé, seulement ajouté ; les modes créateur et utilisateur,
la connexion Google, les mots de passe et la séparation des espaces restent intacts ; mouvement
réduit et accessibilité respectés ; tests, typage, lint et build avant chaque envoi.

## État des lieux (scan du 21 novembre)

- **Onglets** : Aujourd'hui, Vocabulaire (43 fichiers de thèmes, plus de 20 000 mots, répétition
  espacée), Écouter (vidéos, sous-titres karaoké, mot touché traduit), Lire (PDF, mot touché
  traduit à la volée par le serveur), Dictionnaire, Règles.
- **Règles** : 152 leçons (Conjugaison 71, Grammaire 81, de A1 à C2) ; le défi comptait **5 ou
  6 questions** par leçon (842 en tout).
- **Manques** : peu d'entraînement par leçon, aucun texte prêt à lire, pas de carnet d'erreurs,
  pas d'examen ni de test de positionnement, pas de dictée, rien sur les faux amis.

## Ce qui a été ajouté

- **L'entraînement** (6ᵉ étape de chaque leçon) : 3 249 exercices corrigés, 20 à 24 par leçon,
  du plus facile au plus difficile ; deux nouveaux types (remettre dans l'ordre, corriger la
  phrase) ; modes guidé et examen ; bilan avec la correction de chaque question. Écrits puis
  relus lot par lot (`scripts/langues/entrainement/`).
- **Le carnet d'erreurs** : chaque exercice raté (défi, entraînement, examen) revient jusqu'à
  deux réussites du premier coup. Synchronisé avec le compte (magasin `regles-suivi`).
- **Les examens de niveau** : 12 examens (2 sections × 6 niveaux), 30 questions sans indice,
  diplôme à 80 %, leçons à revoir.
- **Le test de positionnement** : adaptatif (départ A2, 4 questions par niveau), il oriente vers
  les leçons du prochain palier et les histoires du niveau.
- **La bibliothèque d'histoires** (onglet Lire) : 60 histoires, 10 par niveau de A1 à C2, 878
  pages, 206 989 mots ; 55 originales et 5 classiques en texte intégral (Kipling ×2, Conan Doyle,
  Poe, Wells). Chaque mot a sa traduction en contexte, préparée d'avance avec celle de chaque
  phrase ; la liseuse propose la traduction sous les paragraphes, la lecture à voix haute, la
  taille du texte, les mots clés de la page, les questions de compréhension ; la page en cours
  est synchronisée (magasin `histoires`) ; une histoire ouverte se relit hors ligne. Relecture
  croisée de chaque histoire (`scripts/langues/histoires/`, outils `apercu.mts` et `accorder.mts`).
- **Les dictées** (onglet Écouter) : 120 dictées numérotées, 20 par niveau, chacune un petit
  texte de 8 phrases traduites, avec son piège d'orthographe ; on choisit librement le niveau et
  la dictée (accès direct, record par dictée, adresse `#ecouter/dictee/B1/5`) ; la dictée surprise
  (six phrases tirées des histoires du niveau) reste. Corrigées mot à mot.
- **Les faux amis** (onglet Vocabulaire) : 127 pièges, leur vrai sens, la traduction du mot
  piège, un exemple, une astuce, un quiz.
- **Aujourd'hui** : « Pour progresser » (l'histoire en cours, le carnet ou le test, la prochaine
  dictée à faire du niveau).

## Plan pondéré

| # | Tâche | Poids | Fait |
|---|-------|------:|-----:|
| 1 | Scan complet et plan | 3 | 3 |
| 2 | Entraînement : moteur et écran | 10 | 10 |
| 3 | Entraînement : 20 exercices corrigés de plus par leçon, relus | 20 | 20 |
| 4 | Carnet d'erreurs | 5 | 5 |
| 5 | Examens de niveau et test de positionnement | 6 | 6 |
| 6 | Histoires : chaîne de fabrication | 6 | 6 |
| 7 | Histoires : 12 histoires traduites mot à mot | 22 | 22 |
| 8 | Histoires : la liseuse | 14 | 14 |
| 9 | Dictées | 5 | 5 |
| 10 | Accueil, textes modifiables, documentation | 3 | 3 |
| 11 | Vérifications et mise en ligne | 6 | 6 |
| 12 | Relecture croisée des histoires | 8 | 8 |
| 13 | Six histoires de plus | 6 | 6 |
| 14 | Les faux amis | 6 | 6 |
| | **Total** | **120** | **120** |

## Journal

- 21 nov. 20 h 25 — scan terminé, plan écrit.
- 21 nov. 20 h 48 — 3 249 exercices écrits (22 lots), puis relus ; écran de l'entraînement.
- 21 nov. 21 h 10 — entraînement en ligne (commit d355e8a).
- 21 nov. 21 h 50 — 12 histoires traduites, liseuse ; en ligne (7730575).
- 21 nov. 22 h 07 — carnet, examens, test de positionnement, dictées, accueil (6f62f89).
- 21 nov. 22 h 46 — 6 histoires de plus, relecture de toutes les histoires, faux amis (f4e907f).
- En attente d'une réponse : la relecture du lot d'exercices Conjugaison B1 est prête dans
  /tmp, mais la copie dans le projet a été refusée au sous-agent par le système de permissions ;
  elle n'a pas été contournée.

## Demande du 23 novembre, 11 h 42

Au moins 10 histoires par niveau (A1 à C2) ; 20 dictées par niveau, un peu plus longues ; choisir
librement sa dictée (faire la n° 5 sans avoir fait les quatre premières). Rien n'est supprimé : la
dictée tirée des histoires reste, sous le nom de « dictée surprise ».

| # | Tâche | Poids | Fait |
|---|-------|------:|-----:|
| 15 | Dictées : 120 dictées numérotées de 8 phrases, traduites, avec un piège d'orthographe | 12 | 12 |
| 16 | Choisir sa dictée : liste par niveau, accès direct, record par dictée, accueil | 6 | 6 |
| 17 | Histoires A1 (+6) | 6 | 6 |
| 18 | Histoires A2 (+6) | 7 | 7 |
| 19 | Histoires B1 (+7) | 9 | 9 |
| 20 | Histoires B2 (+7) | 11 | 11 |
| 21 | Histoires C1 (+8, originales) | 13 | 13 |
| 22 | Histoires C2 (+8, originales) | 14 | 14 |
| 23 | Relecture croisée des nouvelles histoires et des dictées | 14 | 14 |
| 24 | Vérification et mise en ligne | 8 | 8 |
| | **Total** | **100** | **100** |

Fiches des 42 histoires : `scripts/langues/histoires/A-ECRIRE.md`. Consignes des dictées :
`scripts/langues/dictees/CONSIGNES.md`.

### Journal

- 23 nov. 11 h 55 — plan écrit ; consignes C1 et C2 pour les histoires originales ; chaîne des
  dictées (consignes, contrôle, construction) ; écriture lancée : 8 histoires C1, 120 dictées.
- 23 nov. 12 h 53 — les 42 histoires écrites (6 A1, 6 A2, 7 B1, 7 B2, 8 C1, 8 C2) et les 120
  dictées, toutes au contrôle ; choix libre de la dictée.
- 23 nov. 13 h 40 — outils de relecture (`apercu.mts` : pistes de gloses à vérifier ;
  `accorder.mts` : 403 adjectifs accordés d'office) ; relecture croisée des 42 histoires et des
  120 dictées par d'autres relecteurs (gloses en contexte, traductions, questions, incohérences de
  récit corrigées au plus court) ; tests (10 histoires par niveau, 20 dictées par niveau), build,
  essais bureau et mobile, thèmes clair et sombre ; en ligne.
