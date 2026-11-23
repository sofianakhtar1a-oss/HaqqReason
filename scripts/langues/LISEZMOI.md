# Les contenus fabriqués du Truchement

Trois chaînes produisent des données relues, contrôlées, puis rangées dans le site.

## L'entraînement des Règles (`entrainement/`)

1. `npx tsx scripts/langues/entrainement/preparer.mts` : écrit `entree/<lot>.json` (ce que chaque
   leçon enseigne et les questions du défi déjà posées).
2. Les exercices s'écrivent dans `sortie/<lot>.json` selon `CONSIGNES.md`, puis se relisent selon
   `RELECTURE.md`.
3. `npx tsx scripts/langues/entrainement/valider.mts [lot]` contrôle ; `ranger.mts` range les lots
   valides dans `src/lib/regles/entrainement/<section>-<niveau>.json`.
4. `npm run test:regles` vérifie que chaque leçon a au moins 20 exercices jouables.

## Les histoires (`histoires/`)

1. Histoire originale : écrite directement dans `sortie/<id>/` (`meta.json`, `pages-NN.json`) selon
   `CONSIGNES.md` (partie A).
2. Texte classique : `python3 -I scripts/langues/histoires/decouper.py <texte.txt> <début> <fin> <id>
   <mots par page> <mots par lot>` découpe le texte en `entree/<id>/pages-NN.json` et
   `textes/<id>.txt` ; la traduction suit la partie B des consignes.
3. Relecture croisée : `RELECTURE.md`.
4. `npx tsx scripts/langues/histoires/valider.mts [id] [pages-NN]` contrôle (chaque mot glosé,
   anglais d'un classique inchangé) ; `construire.mts` écrit `donnees/langues/histoires/<id>.json` (hors du dossier public, servi par `/api/langues/histoires/<id>` après vérification des droits Premium)
   et `src/lib/langues/histoires/catalogue.json` (ordre de la bibliothèque : `ORDRE`).
5. `npm run test:histoires` vérifie tout, y compris que le catalogue connaît la dernière version.

Les gloses générales des petits mots (the, a, to…) sont dans `histoires/mots-outils.json`.

## Les faux amis (`faux-amis/`)

`src/lib/langues/faux-amis.json`, écrit selon `CONSIGNES.md`, contrôlé par `valider.mts` ; les
quiz sont tirés de la liste (`src/lib/langues/faux-amis.ts`).
