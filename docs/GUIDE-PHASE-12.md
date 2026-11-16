# Guide Phase 12 — Les lecteurs participent

Deux nouvelles sections ouvertes au public, sur une page « Contribuer » : proposer un sujet à traiter, et proposer un argument de plus pour un article déjà publié. Avec, dans les deux cas, un filtre automatique qui arrête les insultes et les grossièretés.

**Attention : cette mise à jour demande une étape en base de données.** Le fichier `supabase/migrations/010_contributions.sql` doit être exécuté une fois dans Supabase, sinon la page Contribuer s'ouvrira mais rien ne pourra être enregistré. La marche à suivre est à la fin de ce guide.

## 1. La page « Contribuer »

Elle est accessible à tout le monde, sans compte et sans adresse e-mail à donner, depuis le menu du haut et depuis la page d'accueil. Elle présente deux sections, chacune introduite par un texte qui explique à quoi elle sert.

### Section « Idées de sujet »

Un lecteur propose un sujet qui manque. Il choisit d'abord le module concerné — la véracité de l'islam, la défense de l'islam, ou la réfutation des autres croyances — puis écrit son idée en une phrase et l'explique en quelques lignes. Il peut signer d'un prénom ou rester anonyme.

Il peut aussi rattacher son idée à un article déjà publié, si elle en découle.

### Section « Renforcer un article »

Un lecteur propose un argument, un verset, un hadith, une référence ou un fait historique qui rendrait un article plus solide. **La première question est celle que tu voulais** : son apport se rattache-t-il à l'un de tes articles, oui ou non ?

- **Oui** → il choisit l'article dans une liste. Il peut filtrer par module (les trois modules, ou l'un d'eux) et chercher par le titre. Seuls les articles **publiés** apparaissent : jamais un brouillon.
- **Non** → il choisit simplement le module auquel son apport se rattache.

### L'encadré qui renvoie à l'article

Quand une proposition cite un article, elle s'affiche avec un encadré « EN LIEN AVEC L'ARTICLE » suivi du titre. **En appuyant dessus, on arrive directement sur l'article.** Quand aucun article n'est cité, c'est le module qui est indiqué à la place.

Et dans l'autre sens : en bas de chaque article, une section « Proposé par les lecteurs » rassemble les apports qui le concernent, avec un bouton pour en proposer un à son tour.

### Qui voit quoi

Les propositions publiées sont visibles de **tout le monde**, sans être connecté, dans la section correspondante. Chacun peut aussi signaler une proposition qui lui paraît déplacée : à partir de trois signalements venant de personnes différentes, elle quitte automatiquement la vue publique et t'attend.

## 2. Le filtre de politesse

Tout ce qui est envoyé passe d'abord par un filtre, avant le moindre enregistrement. Il examine le texte, le titre **et** le pseudo.

**Refusé sur-le-champ, jamais publié** : les insultes et les grossièretés, y compris déguisées. Le filtre remet d'aplomb les accents, les chiffres mis à la place des lettres (« p0rt4il »), les lettres répétées (« puuutain ») et les lettres espacées (« c o n n a r d »). L'auteur reçoit un message qui l'invite à reformuler calmement.

**Mis de côté pour que tu relises** : ce qui n'est pas une insulte mais mérite un œil — un lien, une adresse e-mail, un numéro de téléphone, un texte tout en majuscules, une ponctuation excessive, un ton agressif (« stupide », « menteur », « ridicule »…). Ces propositions ne paraissent pas tant que tu ne les as pas publiées.

**Publié aussitôt** : le reste.

Le filtre a été réglé pour ne pas se tromper sur le vocabulaire propre au site. « La viande de porc », « les singes et les porcs », « le hadith du chien », « un mécréant m'a posé cette question », « la connaissance du contexte », « la conclusion de l'article » passent tous sans problème.

Un champ invisible piège les robots, et une même adresse ne peut pas envoyer plus de trois propositions par heure ni plus de dix par jour.

## 3. Ta page de gestion

Dans l'espace créateur, une nouvelle tuile : **Contributions des lecteurs**. Elle indique combien de propositions attendent ta relecture, combien sont en ligne, combien ont été arrêtées par le filtre.

Les propositions se filtrent par état : en attente, publiées, masquées, refusées par le filtre, tout. Sur chacune, tu peux **publier**, **masquer**, **remettre en attente** ou **effacer**. Pour celles que le filtre a refusées, le motif relevé est affiché — tu peux donc vérifier qu'il n'a pas été trop sévère, et les vider toutes d'un coup quand tu as regardé.

Les propositions signalées par des lecteurs portent un badge rouge avec le nombre de signalements.

## 4. Deux réglages

Dans **Paramètres** :

- **Accepter les contributions des lecteurs.** Décoché, les formulaires se ferment ; la page reste visible et les propositions déjà publiées restent lisibles.
- **Tout relire avant publication.** Décoché (réglage de départ), ce qui passe le filtre paraît aussitôt et le reste t'attend. Coché, rien ne paraît sans ton accord. Dans les deux cas, une grossièreté n'est jamais publiée.

## 5. La mise à jour, pas à pas

1. **Dépose `source.zip`** à la racine de ton dépôt GitHub, comme d'habitude : <https://github.com/sofianakhtar1a-oss/HaqqReason/upload/main>
2. **Exécute le fichier SQL.** Ouvre <https://supabase.com/dashboard/project/hszbpgpthfhdrjghkelg/sql/new>, ouvre `supabase/migrations/010_contributions.sql` depuis l'archive, copie tout son contenu, colle-le dans la fenêtre, puis clique sur **Run**. Le message « Success. No rows returned » signifie que c'est fait. Ce fichier ne s'exécute qu'une fois.
3. **Attends une à deux minutes** que Vercel republie, puis recharge avec Ctrl + Maj + R (sur téléphone : ferme et rouvre l'application).

Si tu ouvres la page Contribuer avant d'avoir exécuté le SQL, elle s'affichera, mais tout envoi répondra qu'il est impossible d'enregistrer : c'est le signe que l'étape 2 n'a pas encore été faite.

## Si quelque chose ne va pas

**« Enregistrement impossible pour l'instant. »** Le fichier SQL n'a pas été exécuté, ou l'a été à moitié. Reprends l'étape 2 : la relancer en entier ne casse rien.

**Une proposition correcte a été refusée.** Va dans Contributions → Refusées par le filtre : le motif est écrit sous l'état. Tu peux la publier d'un clic. Dis-moi quel mot a déclenché le refus, j'ajusterai la liste.

**La page d'un article n'affiche pas les apports.** Il n'y en a aucun de publié pour cet article : la section n'apparaît que s'il y a quelque chose à montrer.
