/**
 * Le Calame — moteur de pagination.
 *
 * Le texte reste un seul document ProseMirror : on ne le découpe jamais en
 * plusieurs zones éditables, parce qu'on y perdrait le curseur, la sélection,
 * l'annulation et le glisser-déposer. On calcule plutôt, à partir de la hauteur
 * mesurée de chaque bloc, l'endroit exact où le papier se termine ; l'écran
 * dessine les pages derrière le texte, et l'impression applique la même
 * géométrie. Ce que l'on voit est donc ce qui sortira.
 *
 * Tout ici est pur : aucune mesure, aucun DOM. La mesure est faite une fois,
 * côté navigateur, et passée en argument — ce qui rend le calcul testable et
 * permet de le relancer sans toucher à la page.
 */

export type BlocMesure = {
  id: string;
  /** Distance entre le haut du flux de texte et le haut du bloc, en pixels. */
  haut: number;
  hauteur: number;
  /** Ce bloc ne doit pas être coupé par un changement de page (tableau, image, encadré). */
  insecable?: boolean;
  /** Un saut de page a été demandé juste avant ce bloc. */
  sautAvant?: boolean;
};

export type Page = {
  numero: number;
  /** Position, dans le flux, du haut de la zone de texte de cette page. */
  debut: number;
  fin: number;
  blocs: string[];
};

export type Pagination = {
  pages: Page[];
  /** Hauteur utile d'une page, rappelée pour que l'affichage n'ait rien à recalculer. */
  hauteurUtile: number;
  /** Hauteur totale du flux, saut de page compris. */
  hauteurTotale: number;
};

/**
 * Répartit des blocs mesurés en pages.
 *
 * Règle, la même que celle d'un traitement de texte :
 *   • un bloc qui ne tient pas dans ce qui reste part à la page suivante ;
 *   • sauf s'il est à lui seul plus haut qu'une page entière — alors il la
 *     traverse, comme le ferait une longue image ou un très grand tableau ;
 *   • un saut de page demandé par l'auteur l'emporte sur tout le reste.
 */
export function paginer(blocs: BlocMesure[], hauteurUtile: number): Pagination {
  const utile = Math.max(1, hauteurUtile);
  const pages: Page[] = [];
  let debut = 0;
  let courante: Page = { numero: 1, debut: 0, fin: utile, blocs: [] };

  const tourner = (nouveauDebut: number) => {
    pages.push(courante);
    debut = nouveauDebut;
    courante = { numero: pages.length + 1, debut, fin: debut + utile, blocs: [] };
  };

  for (const bloc of blocs) {
    const bas = bloc.haut + bloc.hauteur;

    if (bloc.sautAvant && courante.blocs.length > 0) tourner(bloc.haut);

    if (bas > debut + utile) {
      if (bloc.insecable && bloc.hauteur <= utile && courante.blocs.length > 0) {
        // Un bloc que l'on ne coupe pas (tableau, image, encadré) descend d'une page entière.
        tourner(bloc.haut);
      } else {
        // Un paragraphe ordinaire, lui, se poursuit simplement sur la page suivante.
        courante.blocs.push(bloc.id);
        while (bas > debut + utile) tourner(debut + utile);
        continue;
      }
    }
    courante.blocs.push(bloc.id);
  }

  pages.push(courante);
  const dernier = blocs.length > 0 ? blocs[blocs.length - 1] : null;
  const hauteurTotale = Math.max(dernier ? dernier.haut + dernier.hauteur : 0, pages[pages.length - 1].debut + 1);
  return { pages, hauteurUtile: utile, hauteurTotale };
}

/** Numéro de la page qui contient ce bloc (1 si on ne le trouve pas). */
export function pageDuBloc(pagination: Pagination, id: string): number {
  for (const page of pagination.pages) if (page.blocs.includes(id)) return page.numero;
  return 1;
}

/** Numéro de la page qui contient cette position du flux. */
export function pageAuPoint(pagination: Pagination, y: number): number {
  for (const page of pagination.pages) if (y >= page.debut && y < page.fin) return page.numero;
  return pagination.pages.length;
}

/** Nombre de pages d'un document déjà paginé. */
export function nombreDePages(pagination: Pagination): number {
  return pagination.pages.length;
}

/**
 * Estimation du nombre de pages sans mesurer quoi que ce soit : utile pour la
 * liste des documents, où l'on ne monte pas l'éditeur.
 * Une page A4 à 11,5 points contient environ 500 mots.
 */
export function pagesEstimees(mots: number, motsParPage = 500): number {
  return Math.max(1, Math.ceil(mots / Math.max(50, motsParPage)));
}
