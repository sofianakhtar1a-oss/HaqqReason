# Phase 22 · Le Truchement : karaoké bilingue, points, classement et animations

## Ce qui change

### Écouter : le karaoké dans les deux langues

- Pendant la lecture, chaque mot se remplit de lumière au rythme de la voix (un front lumineux le traverse de gauche à droite, une barre fine grandit dessous, le mot garde une lueur un instant après avoir été dit).
- Nouveau réglage **« Karaoké »** sous les sous-titres : la langue de la vidéo, la traduction, **les deux** (par défaut) ou aucun.
- La traduction n'a pas de voix : le site calcule l'instant de chacun de ses mots (`src/lib/langues/karaoke.ts`). Quand l'analyse de la phrase a donné le sens des mots, un mot traduit s'allume avec son mot d'origine (« maisons » avec « houses ») ; entre ces repères, le temps se partage selon les syllabes, avec une petite pause après une virgule ou un point.
- Les horodatages gardent le format de la transcription : `{ "t": "houses.", "d": 11.2, "f": 12.4 }` (mot, début et fin en secondes). Rien de nouveau n'est enregistré : tout se calcule à l'affichage.

### Vocabulaire : des points et un classement

| Exercice | Points de base |
|---|---|
| Choix (traduction) | 10 |
| Écoute, texte à trous | 12 |
| Écrire le mot | 15 |
| Association de paires | 5 par paire |
| Carte mémoire | 4 |

- **Série** de bonnes réponses : ×1,5 dès 5 (Étincelle), ×2 dès 10 (Flamme), ×2,5 dès 20 (Brasier), ×3 dès 40 (Comète).
- **Presque** (une petite faute) : la moitié des points, la série continue. **Erreur** : 0 point, jamais de malus, la série repart de zéro.
- **Jours d'affilée** : la première bonne réponse du jour rapporte 5 points par jour de suite (50 au plus).
- **Contre la triche** : le navigateur n'envoie que ses réponses, jamais des points. Le serveur les juge avec ses propres données, puis la base compte les points dans une transaction verrouillée. Un même mot ne rapporte qu'une fois par jour, 600 ms au moins entre deux envois, 2 500 points et 2 000 réponses par jour au plus. Les mots du dictionnaire personnel ne comptent pas.
- **Le classement** (page Vocabulaire) : les 10 premiers et ta place, « Cette semaine » (depuis lundi) ou « Depuis toujours ». Il se met à jour toutes les 20 secondes et juste après tes propres points.
- **On n'y apparaît qu'en le rejoignant** (bouton « Rejoindre ») : les autres voient le prénom, l'initiale du nom, la photo Google et les points, jamais l'adresse e-mail. « Quitter le classement » se trouve sous « Comment gagner des points ? ». La page Confidentialité l'explique.
- La photo Google est enregistrée à la connexion : les comptes déjà connectés affichent leur initiale jusqu'à leur prochaine connexion.

### Des animations qui changent avec toi

- **En séance**, le fond suit ton palier de série : aura bleue qui respire, poussières d'or (Étincelle), braises (Flamme), foyer pourpre qui tourne (Brasier), aurore boréale (Comète). Les particules restent dans le bas de l'écran, loin du mot à lire.
- Chaque bonne réponse jette des étincelles depuis la réponse ; le nom du palier se frappe comme un tampon quand tu le franchis ; une série perdue s'éteint en un filet de fumée ; les points gagnés s'envolent du compteur.
- **Fin de séance réussie** : les lettres d'un mot que tu viens de réussir jaillissent de l'anneau.
- **Montée au classement** : les lignes glissent à leur nouvelle place, les points défilent, et une pluie de lettres part de ta ligne.
- **Entre les modules**, la nouvelle page s'ouvre en cercle depuis l'onglet touché ; sur ordinateur, une lueur douce suit la souris, teintée selon le module.
- Tout respecte le réglage « réduire les animations » de l'appareil : plus aucun mouvement, seulement les changements de couleur.

## Mise en place

1. Dans Supabase, **SQL Editor** puis **New query** : copie tout le fichier `supabase/migrations/015_classement.sql`, colle-le, clique **Run**. Le message « Success » doit s'afficher. (Le fichier `014_comptes.sql` doit avoir été exécuté avant. Celui-ci peut être relancé sans risque.)
2. C'est tout : le site est déjà en ligne. Tant que l'étape 1 n'est pas faite, les séances fonctionnent normalement, sans points, et le classement affiche « pas disponible pour l'instant ».

## Vérifier

- Page Vocabulaire : la carte « Classement » apparaît sous « Composer ma séance ». Clique « Rejoindre », lance une séance : le compteur de série s'allume dans l'en-tête, les points s'affichent en fin de séance, puis ta ligne apparaît au classement.
- Écouter : ouvre une vidéo, choisis « Karaoké : Les deux » : les mots anglais et français s'allument ensemble.
