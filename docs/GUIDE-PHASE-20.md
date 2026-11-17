# Phase 20 · Messagerie des contributions, Truchement bilingue, Alambic vérifié

## Contributions : boîte de réception et messagerie

- **Nouvel onglet « Amélioration du site »** sur la page Contribuer : le lecteur choisit « Une idée de fonctionnalité » ou « Un bug sur le site », puis explique. Ces envois ne sont jamais publiés automatiquement : ils t'attendent.
- **Boîte de réception** (Mode créateur → Boîte de réception des contributions) : toutes les contributions, avec un filtre « Non lues » et un filtre par type. Pour chacune :
  - « Répondre » : l'auteur lit ta réponse dans « Mes messages » ;
  - « Répondre et publier » : la proposition devient publique, avec ta réponse en dessous ;
  - « Publier sans répondre », « Masquer », « Remettre en attente », « Effacer » ;
  - « Lue » / « Non lue ».
- **« Mes messages »** côté lecteur : ses propositions, tes réponses, et un champ pour te répondre. Sans compte : le navigateur garde une clé secrète (la base n'en garde que l'empreinte). Un nouveau message de l'auteur remet la contribution en « Non lue ».
- Base de données : `supabase/migrations/013_messagerie.sql` (type « site », nature, jeton de suivi, table des messages réservée au serveur). Le script peut être relancé sans risque.

## Le Truchement

- **Écouter** :
  - Avant de préparer une vidéo ou un son, on choisit sa langue : anglais ou français.
  - Pendant la lecture, un curseur « Taille de l'image » va de 35 à 100 %.
  - Les sous-titres ont trois choix : la langue de la vidéo seule (toucher un mot le traduit), la langue de la vidéo avec la traduction dessous, ou uniquement la traduction.
- **Lire** :
  - On choisit la langue du PDF : anglais ou français.
  - Dans la liseuse, « Texte » permet de lire le PDF tel quel, ou sa traduction. Dans les deux cas, toucher un mot donne sa traduction dans l'autre langue, et « en regard » affiche l'autre langue sous chaque paragraphe.
- Le dictionnaire range toujours le mot anglais d'un côté et le français de l'autre, quelle que soit la langue lue.

## L'Alambic

Banc d'essai complet : 333 conversions (chaque format vers chaque destination proposée, puis relecture du résultat) et la fusion des 16 types acceptés.

Corrigé :
- un **SVG** sans type annoncé (glissé depuis certains dossiers ou reçu d'une autre application) ne se convertissait en rien ;
- une **formule Excel** jamais calculée (fichier produit par un programme) donnait « [object Object] ». Elle est maintenant reprise telle quelle (« =C2*D2 »).

Limite connue : dans les conversions de documents, les images d'un Word, d'un ODT ou d'une page web ne sont pas reprises. Un avertissement le signale.
