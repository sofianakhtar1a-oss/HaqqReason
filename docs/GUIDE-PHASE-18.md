# Phase 18 — Le mode créateur pour tous les modules

## Mise en ligne

Dépose `source.zip` sur GitHub, attends la coche verte, puis recharge avec Ctrl + Maj + R. Aucune migration SQL : le contenu des modules est rangé dans la table `reglages`, qui existe déjà.

## Ce qui change

**L'entrée du mode créateur** (`/createur`) demande d'abord : « Quel module veux-tu modifier ? »
- **Les preuves de la véracité de l'islam** ouvre l'éditeur de la bibliothèque, inchangé (il est maintenant à `/createur/bibliotheque`).
- **Le Calame**, **L'Alambic** et **Le Truchement** ouvrent l'éditeur de modules.
- Un lien ouvre aussi la page « Par où veux-tu commencer ? ».

Paramètres, Sécurité, Statistiques, Outils et Contributions restent sur cette page d'entrée.

**L'éditeur de modules :**
- **Les textes** : chaque texte affiché se modifie dans son champ. « Remettre l'original » rend le texte d'origine.
- **Les listes** (outils de L'Alambic, onglets du Truchement, cartes de la page d'accueil) : renommer, changer l'ordre, masquer ou supprimer.
- **Thèmes et mots** (Le Truchement) : ajouter, modifier ou supprimer un thème ou un mot (anglais, français, nature, niveau, prononciation, exemple). Une recherche trouve un mot dans tous les thèmes.

## Rien n'est perdu

- **Brouillon.** Tout s'enregistre seul. Les visiteurs ne voient rien avant le clic sur « Publier ».
- **Aperçu.** Ouvre la vraie page avec le brouillon. Toi seul la vois ainsi.
- **Corbeille.** Ce que tu supprimes y arrive. « Remettre » le replace à sa place d'avant.
- **Annuler les modifications.** Le brouillon revient à la version publiée.
- **Historique.** Chaque publication garde la précédente (les 15 dernières). « Restaurer » la remet dans le brouillon.
- **Revenir à l'origine.** Repart des textes et du vocabulaire d'origine, dans le brouillon seulement.

Une publication est visible des visiteurs en 15 secondes au plus.
