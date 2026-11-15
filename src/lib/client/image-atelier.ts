/**
 * Retouche d'une image collée : recadrage, taille, coins arrondis, cadre, ombre.
 * La partie calcul est séparée du dessin pour pouvoir être vérifiée par des tests.
 */

export type Recadrage = { x: number; y: number; largeur: number; hauteur: number };

export type Reglages = {
  /** Zone gardée, en proportions de l'image d'origine (0 à 1). */
  recadrage: Recadrage;
  /** Largeur finale en pixels. */
  largeur: number;
  /** Arrondi des coins, en pourcentage du plus petit côté (0 à 50). */
  arrondi: number;
  /** Épaisseur du cadre en pixels (0 = aucun cadre). */
  cadre: number;
  /** Couleur du cadre. */
  couleurCadre: string;
  /** Ombre portée. */
  ombre: boolean;
};

export const RECADRAGE_ENTIER: Recadrage = { x: 0, y: 0, largeur: 1, hauteur: 1 };

export const REGLAGES_PAR_DEFAUT: Reglages = {
  recadrage: RECADRAGE_ENTIER,
  largeur: 1000,
  arrondi: 0,
  cadre: 0,
  couleurCadre: "#c9a227",
  ombre: false,
};

/** Au-delà, le fichier devient lourd pour rien : un article n'affiche jamais plus large. */
export const LARGEUR_MAX = 2400;
export const LARGEUR_MIN = 80;

/** Ramène un recadrage dans l'image, en gardant une zone utilisable. */
export function bornerRecadrage(r: Recadrage): Recadrage {
  const taille = (v: number) => Math.min(1, Math.max(0.02, v));
  const largeur = taille(r.largeur);
  const hauteur = taille(r.hauteur);
  const place = (v: number, t: number) => Math.min(1 - t, Math.max(0, v));
  return { x: place(r.x, largeur), y: place(r.y, hauteur), largeur, hauteur };
}

/** Taille de l'image produite, à partir de la source, du recadrage et de la largeur voulue. */
export function tailleFinale(source: { largeur: number; hauteur: number }, reglages: Reglages): { largeur: number; hauteur: number } {
  const r = bornerRecadrage(reglages.recadrage);
  const coupeLargeur = Math.max(1, Math.round(source.largeur * r.largeur));
  const coupeHauteur = Math.max(1, Math.round(source.hauteur * r.hauteur));
  // On n'agrandit jamais au-delà de la source : cela ne ferait que flouter.
  const largeur = Math.min(Math.max(LARGEUR_MIN, Math.round(reglages.largeur)), LARGEUR_MAX, coupeLargeur);
  const hauteur = Math.max(1, Math.round((largeur * coupeHauteur) / coupeLargeur));
  return { largeur, hauteur };
}

/** Marge laissée autour de l'image pour que l'ombre portée ait la place d'exister. */
export function margeOmbre(largeur: number, ombre: boolean): number {
  return ombre ? Math.round(Math.max(8, largeur * 0.02)) : 0;
}

/**
 * Taille du fichier produit : l'image, plus le cadre et la place de l'ombre.
 * C'est ce nombre-là qu'on annonce, puisque c'est lui qui sera enregistré.
 */
export function tailleFichier(source: { largeur: number; hauteur: number }, reglages: Reglages): { largeur: number; hauteur: number } {
  const image = tailleFinale(source, reglages);
  const cadre = Math.max(0, Math.round(reglages.cadre));
  const marge = margeOmbre(image.largeur, reglages.ombre);
  const autour = (cadre + marge) * 2;
  return { largeur: image.largeur + autour, hauteur: image.hauteur + autour };
}

/** Rayon des coins en pixels, à partir du pourcentage choisi. */
export function rayonCoins(taille: { largeur: number; hauteur: number }, arrondi: number): number {
  const pourcentage = Math.min(50, Math.max(0, arrondi));
  return Math.round((Math.min(taille.largeur, taille.hauteur) * pourcentage) / 100);
}

/** Poids approximatif du fichier produit, pour prévenir avant d'envoyer. */
export function poidsLisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Nom de fichier lisible et daté, pour s'y retrouver dans les documents joints. */
export function nomPourCapture(dateur: () => Date = () => new Date()): string {
  const d = dateur();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `capture-${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}-${deux(d.getHours())}${deux(d.getMinutes())}${deux(d.getSeconds())}.png`;
}

/**
 * Dessine l'image retouchée sur un canevas et renvoie le résultat.
 * L'ombre et les coins arrondis demandent de la transparence : le résultat est donc un PNG.
 */
export function dessiner(source: CanvasImageSource & { width: number; height: number }, reglages: Reglages): HTMLCanvasElement {
  const r = bornerRecadrage(reglages.recadrage);
  const dimensions = tailleFinale({ largeur: source.width, hauteur: source.height }, reglages);
  const cadre = Math.max(0, Math.round(reglages.cadre));
  const marge = margeOmbre(dimensions.largeur, reglages.ombre);

  const canevas = document.createElement("canvas");
  canevas.width = dimensions.largeur + cadre * 2 + marge * 2;
  canevas.height = dimensions.hauteur + cadre * 2 + marge * 2;
  const ctx = canevas.getContext("2d");
  if (!ctx) return canevas;

  const x = marge;
  const y = marge;
  const l = dimensions.largeur + cadre * 2;
  const h = dimensions.hauteur + cadre * 2;
  const rayon = rayonCoins({ largeur: l, hauteur: h }, reglages.arrondi);

  const contour = (gauche: number, haut: number, large: number, haute: number, coin: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(gauche, haut, large, haute, coin);
    else ctx.rect(gauche, haut, large, haute);
    ctx.closePath();
  };

  if (reglages.ombre) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = marge;
    ctx.shadowOffsetY = Math.round(marge / 3);
    ctx.fillStyle = cadre > 0 ? reglages.couleurCadre : "#000";
    contour(x, y, l, h, rayon);
    ctx.fill();
    ctx.restore();
  }

  if (cadre > 0) {
    ctx.fillStyle = reglages.couleurCadre;
    contour(x, y, l, h, rayon);
    ctx.fill();
  }

  // L'image est découpée à l'intérieur du cadre, avec le même arrondi, en plus serré.
  ctx.save();
  contour(x + cadre, y + cadre, dimensions.largeur, dimensions.hauteur, Math.max(0, rayon - cadre));
  ctx.clip();
  ctx.drawImage(
    source,
    Math.round(source.width * r.x),
    Math.round(source.height * r.y),
    Math.max(1, Math.round(source.width * r.largeur)),
    Math.max(1, Math.round(source.height * r.hauteur)),
    x + cadre,
    y + cadre,
    dimensions.largeur,
    dimensions.hauteur,
  );
  ctx.restore();
  return canevas;
}
