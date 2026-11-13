# Guide Phase 3 — L'éditeur riche

Compte environ 15 minutes d'installation, puis le temps de découvrir l'éditeur.

## Installer la mise à jour

1. Arrête l'application si elle tourne (Ctrl+C dans le terminal).
2. Décompresse `haqqreason-phase-3.zip` dans un **nouveau** dossier.
3. **Copie ton fichier `.env.local`** de l'ancien dossier vers le nouveau.
4. Ouvre un terminal dans le nouveau dossier et tape `npm install`.
5. Dans Supabase, ouvre **SQL Editor**, puis **New query**. Copie tout le fichier `supabase/migrations/003_editeur.sql`, colle-le, puis clique **Run**. Le message « Success » doit s'afficher. Ce fichier ne s'exécute qu'une seule fois.
6. Tape `npm run dev`, puis ouvre **http://localhost:3000**.

Tes articles existants sont repris tels quels dans le nouvel éditeur.

## Écrire

- **Enregistrement automatique** : deux secondes après ta dernière frappe. Le panneau « Publication » affiche « Enregistré à… ».
- **Ctrl+S** enregistre tout de suite et garde une version dans l'historique.
- **Publier** : le bouton « Publier l'article » du panneau de droite. Il enregistre d'abord ce qui est en attente.

## Mettre en valeur le texte

Sélectionne du texte : un petit menu apparaît au-dessus, avec le gras, l'italique, le souligné, les huit surligneurs fluo et le lien. La barre d'outils au-dessus du texte propose en plus :

- les styles de titres (grand, moyen, petit) ;
- le barré, l'exposant et l'indice ;
- cinq soulignements (simple, double, pointillé, tirets, ondulé), avec la couleur du trait ;
- huit surligneurs fluo, huit couleurs de texte ;
- trois effets : dégradé doré, lueur, petites capitales ;
- les listes à puces, numérotées et à cases à cocher, l'alignement, les liens ;
- « Effacer la mise en forme » ;
- annuler et rétablir (Ctrl+Z, Ctrl+Maj+Z).

## Insérer un bloc

Tape **« / »** en début de ligne (ou après une espace), puis quelques lettres : « verset », « hadith », « source », « note », « objection »… Choisis avec les flèches et valide avec Entrée. Le bouton **Insérer** de la barre d'outils donne la même liste.

- **Verset coranique** : texte arabe (de droite à gauche), traduction, référence.
- **Hadith** : texte arabe, traduction, recueil, numéro, degré d'authenticité affiché en badge.
- **Source** : auteur, ouvrage, édition, page, lien ; ajoutée automatiquement à la bibliographie.
- **Note de bas de page** : numérotée automatiquement, listée en fin d'article.
- **Objection → Réponse** : l'objection fidèlement formulée, puis la réponse.
- **Comparaison** : deux colonnes côte à côte.
- **Section repliable** : le lecteur l'ouvre s'il le souhaite.
- **Frise chronologique** : dates et événements.
- **Dix encadrés** : Point clé, Définition, Argument, Objection, Réponse, Attention, Remarque, Conclusion, Citation adverse, À retenir.

**Le panneau du bloc.** Quand le curseur est dans un verset, un hadith, un encadré ou une frise, ou quand tu cliques sur une source ou une note, ses réglages apparaissent à droite : référence, recueil, degré, champs de la source, texte de la note, type d'encadré, « Ajouter un événement », « Supprimer ce bloc ». La touche **Échap** te ramène dans le texte, à l'endroit exact où tu étais.

**Dans un verset ou un hadith**, Entrée passe du texte arabe à la traduction, puis sort du bloc.

## À vérifier

Le panneau « À vérifier » signale ce qui manque pour un article irréprochable : verset sans traduction ou sans référence, hadith sans degré, sans recueil ou sans traduction, source incomplète, objection sans réponse, article sans aucune source.

## Historique des versions

Le bouton **Historique des versions** liste les versions gardées : à chaque Ctrl+S, à chaque publication, et automatiquement toutes les dix minutes pendant l'écriture (les 200 plus récentes). Pour chaque version :

- **Différences avec le texte actuel** : ce qui a été retiré est barré en rouge, ce qui a été ajouté est surligné en vert ;
- **Aperçu de la version** ;
- **Restaurer cette version** : le texte actuel est d'abord gardé dans l'historique, rien n'est perdu.

## Deux onglets ouverts sur le même article

Si tu modifies le même article dans deux onglets ou sur deux appareils, le second enregistrement est refusé au lieu d'écraser le premier. L'éditeur te propose alors de recharger la page ou de garder ta version.

## Modèles et duplication

- À la création d'un article, choisis un **point de départ** : article vide, un des quatre modèles fournis (Réponse à une objection, Démonstration, Étude critique d'une doctrine, Fiche de débat express), ou l'un de tes modèles. Les modèles fournis ne contiennent qu'une structure et des consignes, jamais de contenu religieux.
- **Enregistrer comme modèle**, dans le panneau de droite, transforme la structure de l'article en modèle réutilisable. La page **Modèles** les liste et permet de les supprimer.
- **Dupliquer l'article** crée une copie en brouillon, avec ses étiquettes.

## Réordonner par glisser-déposer

Les flèches ont laissé place à des poignées. **À la souris**, attrape la poignée d'une catégorie ou d'un article et dépose-le à sa nouvelle place. **Au clavier**, va sur la poignée avec Tab, appuie sur Espace pour saisir l'élément, déplace-le avec les flèches, puis appuie sur Espace pour le déposer (ou Échap pour annuler).

## Vérifier que tout fonctionne

- [ ] Crée un article depuis le modèle « Réponse à une objection » : le bloc Objection → Réponse et une source vide apparaissent.
- [ ] Écris un paragraphe, sélectionne un mot et surligne-le en bleu depuis le petit menu.
- [ ] Tape « /verset », Entrée, écris en arabe, Entrée, écris la traduction, puis renseigne la référence dans le panneau de droite.
- [ ] Ajoute un hadith et choisis son degré : le badge s'affiche.
- [ ] Ajoute une source et une note : à la lecture, elles apparaissent en fin d'article, dans « Notes » et « Sources ».
- [ ] « Enregistré à… » s'affiche sans que tu aies rien fait.
- [ ] Publie l'article, ouvre-le en navigation privée : tout est mis en forme comme dans l'éditeur.
- [ ] Ouvre l'historique, compare une version ancienne, restaure-la.
- [ ] Déplace un article par glisser-déposer : l'ordre change aussi côté lecteur.

Vérifications automatiques (facultatif) :

```
npm run test:sql
npm run test:document
```

Toutes les lignes doivent commencer par `OK`.

## En cas de problème

- **Page d'erreur sur l'éditeur ou l'historique** : le fichier `003_editeur.sql` n'a pas été exécuté (étape 5).
- **« Ta session a expiré »** dans le panneau : reconnecte-toi dans un autre onglet, puis reviens et fais Ctrl+S. Ton texte est resté dans l'éditeur.
- **« Connexion perdue »** : tes modifications restent dans l'éditeur ; clique « Réessayer maintenant » quand la connexion revient.

## Ce que la Phase 3 ne contient pas encore

- Les images et les PDF dans les articles (Phase 4).
- La recherche (Phase 5). Le texte de chaque article, arabe compris, est déjà préparé pour elle.
- Les onglets et les cartes mentales dans les articles (Phase 6).
