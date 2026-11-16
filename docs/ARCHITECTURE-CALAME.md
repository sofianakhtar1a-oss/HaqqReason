# Le Calame — architecture technique

Ce document décrit l'atelier d'écriture intégré à HaqqReason : les choix d'architecture, le moteur de pagination, le schéma de données, et ce qui a été écarté — avec les raisons.

---

## 1. Ce qu'il fallait concilier

Un traitement de texte moderne tire dans deux directions opposées.

D'un côté, **l'édition par blocs** : glisser un paragraphe, replier une section, taper `/` pour insérer, écrire en Markdown sans y penser. C'est souple, c'est rapide, et c'est ce que l'éditeur du mode créateur fait déjà.

De l'autre, **le papier** : une page A4 avec ses marges au millimètre, des en-têtes, une numérotation, un saut de page décidé par l'auteur, et la certitude que ce que l'on voit à l'écran sortira identique de l'imprimante.

Les logiciels classiques (Word, LibreOffice) partent du papier et peinent sur la souplesse. Les éditeurs modernes (Notion) partent des blocs et ignorent le papier. Le Calame tient les deux bouts, et tout le travail d'architecture porte sur ce point précis.

---

## 2. La pile technique

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Interface | React 19 + TypeScript + Tailwind 4 | Déjà la pile du site : un seul vocabulaire, un seul style, zéro duplication |
| Moteur d'édition | TipTap 3 sur ProseMirror | Un modèle de document **structuré et validé**, pas du HTML libre : on peut raisonner dessus, le vérifier et l'exporter |
| Mise en page | CSS pur, variables CSS pilotées par les jetons de style | Aucun moteur de rendu maison à maintenir ; le navigateur fait ce qu'il sait faire |
| Stockage | IndexedDB, sur l'appareil | Aucun compte, aucune latence, aucun quota serveur, fonctionne hors ligne |
| Compression | `fflate` | Déjà présent, minuscule, synchrone |
| Export | Écriture directe de l'OOXML (.docx), du Markdown, et impression navigateur pour le PDF | Pas de dépendance lourde, pas de service distant |

**Ce qui a été écarté, et pourquoi.** Tauri et Rust donneraient une application de bureau légère, mais HaqqReason est un site : il s'ouvre sur un lien, se met à jour tout seul et fonctionne déjà hors ligne grâce au service worker. Encapsuler l'atelier dans Tauri obligerait à maintenir des binaires par système, une chaîne de signature et un canal de mise à jour, pour un gain nul côté usage. Le choix est donc assumé : **web d'abord, installable comme application** (PWA), pas d'exécutable à distribuer.

---

## 3. Le moteur de pagination

C'est la partie la moins évidente, donc celle qui mérite le plus d'explications.

### Le piège à éviter

La solution naïve consiste à découper le texte en autant de zones éditables qu'il y a de pages. Elle casse tout : le curseur ne traverse plus les pages, la sélection ne s'étend plus, l'annulation se fragmente, le glisser-déposer ne franchit plus les frontières, et chaque frappe peut déclencher une cascade de redécoupages. Aucun éditeur sérieux ne fait cela.

### Ce que fait Le Calame

**Un seul document, un seul champ d'édition, et des blancs calculés.**

1. **Mesure.** Après chaque modification, on parcourt les enfants directs du texte et on relève, pour chacun, sa position et sa hauteur. Les blancs déjà posés sont retranchés au passage : on raisonne donc toujours sur le texte « à plat », ce qui rend le calcul stable et idempotent.

2. **Répartition** (`src/lib/atelier/pagination.ts`, fonction pure, testée). On remplit la page courante tant que le bloc suivant y tient. Sinon, il descend entier sur la feuille suivante. Un bloc plus haut qu'une page entière — une grande image, un long tableau — la traverse plutôt que de disparaître. Un saut de page demandé par l'auteur l'emporte sur tout.

3. **Blancs.** Pour chaque changement de page, on calcule la hauteur exacte du blanc à insérer pour que le premier bloc de la page retombe précisément en haut de la feuille suivante :

   ```
   blanc(i) = i × (hauteur_feuille + écart) − début_logique(page i) − somme(blancs précédents)
   ```

   Ces blancs sont des **décorations ProseMirror** (`src/app/ecrire/pages-extension.ts`) : ils ne font pas partie du document, n'entrent jamais dans ce qui est enregistré, et disparaissent de l'export comme de l'impression.

4. **Feuilles.** Une couche de rectangles blancs est dessinée derrière le texte, aux mêmes coordonnées, avec les marges, l'en-tête et le pied de page.

Le résultat : un vrai papier à l'écran, et un document unique pour l'éditeur, qui ne sait même pas qu'il est paginé.

### Écran et papier tombent au même endroit

L'impression ne rejoue pas ce calcul : elle confie la pagination au navigateur, en lui donnant **exactement la même géométrie** (`@page { size … ; margin … }` construit depuis les mêmes réglages) **et la même règle** (`break-inside: avoid` sur chaque bloc de premier niveau, `break-after: avoid` sur les titres). Les deux paginations coïncident donc par construction, sans synchronisation à maintenir.

### Et les très gros documents ?

Le coût par frappe est : une boucle sur les enfants directs du texte, deux accès de mise en page par bloc, puis un calcul linéaire. Pour un document de 500 pages, cela représente quelques milliers de blocs — soit quelques millisecondes, une fois par image d'animation au maximum (la mesure est throttlée par `requestAnimationFrame`, avec une seconde passe courte pour rattraper ce qui n'était pas encore en place).

Ce qui coûte vraiment cher dans un très long document, ce n'est pas le calcul : c'est le **nombre de nœuds DOM**. Trois garde-fous sont en place, et un quatrième est prévu :

- les blocs lourds (schémas, cartes, PDF) sont rendus par des vues React montées à la demande ;
- les décorations de page sont recalculées seulement quand elles changent réellement (comparaison avant dépôt) ;
- la liste des documents n'ouvre jamais qu'un seul texte à la fois ;
- **à venir si le besoin se présente** : découper un très long document en chapitres, et ne monter dans l'éditeur que le chapitre courant — le plan servant déjà de table de navigation. Tant qu'un document tient en quelques centaines de pages, ce n'est pas nécessaire, et une optimisation non nécessaire est une dette.

---

## 4. Le schéma de données

### Le document

```ts
type DocumentAtelier = {
  id: string;
  titre: string;
  contenu: unknown;        // document ProseMirror (le même vocabulaire de blocs que les articles)
  reglages: ReglagesPage;  // la page et les styles
  dossier: string;
  cree: string;            // ISO 8601
  modifie: string;
  mots: number;            // tenus à jour à l'enregistrement, pour la liste
  signes: number;
};
```

Le **contenu** est un document ProseMirror : un arbre typé, pas du HTML. Chaque nœud a un type connu et des attributs validés. C'est ce qui permet d'exporter fidèlement vers trois formats très différents sans jamais deviner.

### La page et les styles

```ts
type ReglagesPage = {
  format: "a4" | "a5" | "lettre" | "legal";
  orientation: "portrait" | "paysage";
  marges: { haut; bas; gauche; droite };   // en millimètres
  styles: Styles;                           // les jetons, voir plus bas
  entete: string;  pied: string;            // {titre} {page} {pages} {date}
  numeroter: boolean;  premierePageNue: boolean;
  papierSombre: boolean;  reperes: boolean;
};
```

### Les jetons de style

C'est la réponse aux dérives de mise en page des traitements de texte classiques, où chaque paragraphe finit par porter son propre formatage et où plus personne ne sait d'où vient une taille de police.

```ts
type Jeton = { police; taille; interligne; graisse; couleur; avant; apres };
type Styles = { corps; titre1; titre2; titre3; citation };
```

Ces jetons sont transformés en **variables CSS** (`variablesDeStyle`) posées sur la feuille, et toute la typographie du document les lit. Changer `corps.taille`, c'est changer une variable : tout le document suit, la pagination se recalcule, et aucun paragraphe ne peut diverger puisqu'aucun ne porte de style propre.

Tout ce qui entre — un fichier importé, une version plus ancienne de la base locale — repasse par `nettoyerReglages` : un format inconnu retombe sur A4, une marge démesurée est ramenée dans la page, une taille de police absurde est bornée. L'atelier ne peut pas être cassé par un fichier mal formé.

### Les versions

```ts
type VersionAtelier = { id; documentId; quand; deltaMots; contenu; titre };
```

Une version est posée au plus toutes les cinq minutes de travail, et à chaque enregistrement manuel (Ctrl+S). Les soixante dernières sont gardées par document.

### Le stockage local

Trois magasins IndexedDB : `documents`, `fichiers` (les images et les PDF, en binaire), `versions` (indexé par document). Les fichiers que plus aucun texte ne cite sont effacés automatiquement à la suppression d'un document.

**Ce que cela implique, et qu'il faut dire franchement** : le travail ne suit pas d'un appareil à l'autre, et vider les données du site efface les documents. En échange : aucun compte, aucune latence, aucun quota, et tout fonctionne hors connexion. Le pont entre appareils, c'est l'export.

---

## 5. Les sorties

| Format | Comment | Fidélité |
| --- | --- | --- |
| **PDF** | Impression du navigateur, avec la géométrie `@page` du document | Totale : c'est la même mise en page que l'écran |
| **Word (.docx)** | OOXML écrit directement (`src/lib/atelier/docx.ts`), zippé par `fflate` | Titres, gras, italique, souligné, barré, couleurs, listes à puces et numérotées, citations, tableaux, images, format de page, marges, en-tête, pied et numérotation |
| **Markdown** | Sérialiseur maison (`src/lib/atelier/markdown.ts`) | Titres, listes, tableaux, citations, images ; les blocs propres à la bibliothèque sont rendus par la construction la plus proche, étiquette comprise |
| **.calame** | JSON + images en base64, compressé en gzip | Intégrale : c'est le format de transport entre appareils |

Le `.docx` n'est pas une conversion approximative passant par du HTML : c'est un vrai paquet OOXML, avec ses parties `document.xml`, `styles.xml`, `numbering.xml`, ses relations, ses médias et sa section de mise en page. Word et LibreOffice l'ouvrent sans dialogue de conversion.

---

## 6. Ce qui est partagé avec le mode créateur

L'atelier ne réimplémente rien : il réutilise le vocabulaire de blocs (`extensionsDocument`), la barre d'outils, le menu « / », le menu de sélection, les outils de bloc, l'atelier d'image, l'atelier de schéma et l'atelier de logique. Un bloc ajouté d'un côté est disponible de l'autre.

Trois ajouts lui sont propres :

- **les tableaux** (`@tiptap/extension-table`), qui n'ont de sens que sur du papier ;
- **le saut de page**, ajouté au vocabulaire commun (un article imprimé en profite aussi) ;
- **les vues locales** des images et des documents, qui vont chercher le fichier dans la base du navigateur au lieu du serveur.

---

## 7. Sécurité et vie privée

Rien de ce qui est écrit dans l'atelier ne quitte l'appareil : aucune requête réseau n'est émise pendant la frappe — c'est vérifié par un test automatique. Il n'y a ni compte, ni adresse e-mail, ni identifiant. Le site n'a donc aucune donnée personnelle à protéger pour cette partie, ce qui est la meilleure protection possible.

---

## 8. Les fichiers

```
src/lib/atelier/
  modele.ts        géométrie du papier, jetons de style, nettoyage (pur)
  pagination.ts    répartition des blocs en pages (pur)
  markdown.ts      export Markdown (pur)
  docx.ts          écriture du fichier Word (pur)
  depot.ts         base locale du navigateur (IndexedDB)
src/app/ecrire/
  page.tsx         la page
  Calame.tsx       chargement, liste des documents, import
  Atelier.tsx      l'éditeur, l'enregistrement, les raccourcis, les sorties
  Papier.tsx       mesure, feuilles, en-têtes, pieds de page
  pages-extension.ts  les blancs de coupure (décorations ProseMirror)
  BarreLaterale.tsx   documents et plan interactif
  Inspecteur.tsx      page, styles, statistiques, sorties
  PaletteCommandes.tsx  la barre de commande (Ctrl+K)
  VuesLocales.tsx     images et documents lus dans la base locale
  tableaux.ts         les tableaux et leurs commandes
  exporter.ts         PDF, Word, Markdown, sauvegarde complète
src/app/utilisateur/page.tsx   le choix entre les deux espaces
```

Les quatre premiers modules sont purs : ils ne touchent ni au navigateur, ni au réseau, ni à la base. C'est ce qui permet de les éprouver au banc d'essai, cas par cas.
