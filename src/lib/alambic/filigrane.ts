/*
 * Filigraner et numéroter : où poser le texte, quelle taille, quel angle.
 * Tout est calculé dans le repère « tel qu'on voit la page » (origine en haut à gauche, y vers le bas,
 * angle compté dans le sens inverse des aiguilles d'une montre). Le même calcul sert à l'aperçu,
 * aux images et au PDF (pages pivotées comprises). Pur : testé dans tests/test-alambic-studio.mts.
 */

export type Disposition = "mosaique" | "centre" | "bas";
export type FormatNumero = "n" | "n/t" | "page-n" | "page-n-sur-t" | "tiret";
export type PositionNumero = "bas-centre" | "bas-droite" | "haut-droite" | "haut-centre";

export type ReglagesFiligrane = {
  texte: string;
  disposition: Disposition;
  /** Couleur #rrggbb. */
  couleur: string;
  /** 0 à 1. */
  opacite: number;
  /** Facteur de taille, 1 = normal. */
  taille: number;
};

export type ReglagesNumeros = {
  format: FormatNumero;
  position: PositionNumero;
  debut: number;
  /** La première page (souvent la couverture) n'est pas numérotée ; la numérotation compte tout de même cette page. */
  sansPremiere: boolean;
};

/** Un texte posé : centre visible (x, y), angle en degrés, taille de la police (unités du repère). */
export type Pose = { texte: string; x: number; y: number; angle: number; taillePolice: number };

/** Largeur d'un texte pour une police de taille 1 (fournie par le navigateur ou par la police du PDF). */
export type Mesure = (texte: string) => number;

export const MOTS_FILIGRANE = ["CONFIDENTIEL", "COPIE", "BROUILLON", "NE PAS DIFFUSER", "SPÉCIMEN", "DOCUMENT DE TRAVAIL"];

/** Le texte recommandé pour une pièce d'identité ou un justificatif envoyé à un tiers. */
export function texteIdentite(destinataire: string, motif: string, date: Date): string {
  const jour = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const morceaux = [`Document exclusivement destiné à ${destinataire.trim() || "…"}`, motif.trim(), `le ${jour}`].filter(Boolean);
  return morceaux.join(" — ");
}

/** Les poses d'un filigrane sur une page de largeur × hauteur (repère visible). */
export function placerFiligrane(largeur: number, hauteur: number, r: ReglagesFiligrane, mesurer: Mesure): Pose[] {
  const texte = r.texte.trim();
  if (!texte) return [];
  const cote = Math.min(largeur, hauteur);
  const unite = Math.max(1e-6, mesurer(texte));
  if (r.disposition === "bas") {
    const marge = cote * 0.05;
    const taillePolice = Math.min(cote * 0.024 * r.taille, (largeur - 2 * marge) / unite);
    return [{ texte, x: largeur / 2, y: hauteur - marge - taillePolice * 0.4, angle: 0, taillePolice }];
  }
  const diagonale = Math.hypot(largeur, hauteur);
  const angle = (Math.atan2(hauteur, largeur) * 180) / Math.PI;
  if (r.disposition === "centre") {
    const taillePolice = Math.min((diagonale * 0.72) / unite, cote * 0.2) * Math.min(1.25, r.taille);
    return [{ texte, x: largeur / 2, y: hauteur / 2, angle, taillePolice }];
  }
  // Mosaïque : des lignes parallèles à 30°, décalées d'une demi-longueur une ligne sur deux.
  const a = 30;
  const taillePolice = cote * 0.034 * r.taille;
  const pasX = unite * taillePolice + taillePolice * 2.2;
  const pasY = taillePolice * 4.2;
  const rad = (a * Math.PI) / 180;
  const [cx, cy] = [largeur / 2, hauteur / 2];
  const n = Math.ceil(diagonale / Math.min(pasX, pasY)) + 1;
  const demi = (unite * taillePolice) / 2;
  const poses: Pose[] = [];
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const u = j * pasX + (i % 2 ? pasX / 2 : 0);
      const v = i * pasY;
      // Repère visible : y vers le bas, donc un angle positif fait monter le texte vers la droite.
      const x = cx + u * Math.cos(rad) + v * Math.sin(rad);
      const y = cy - u * Math.sin(rad) + v * Math.cos(rad);
      if (x < -demi || x > largeur + demi || y < -demi || y > hauteur + demi) continue;
      poses.push({ texte, x, y, angle: a, taillePolice });
      if (poses.length > 600) return poses;
    }
  }
  return poses;
}

export function texteNumero(format: FormatNumero, n: number, total: number): string {
  switch (format) {
    case "n":
      return String(n);
    case "n/t":
      return `${n} / ${total}`;
    case "page-n":
      return `Page ${n}`;
    case "page-n-sur-t":
      return `Page ${n} sur ${total}`;
    case "tiret":
      return `– ${n} –`;
  }
}

/** Le numéro d'une page (index à partir de 0), ou null si elle n'est pas numérotée. */
export function poseNumero(largeur: number, hauteur: number, index: number, total: number, r: ReglagesNumeros, mesurer: Mesure): Pose | null {
  if (r.sansPremiere && index === 0) return null;
  const n = r.debut + index;
  const dernier = r.debut + total - 1;
  const texte = texteNumero(r.format, n, dernier);
  const cote = Math.min(largeur, hauteur);
  const taillePolice = Math.max(6, cote * 0.0175);
  const marge = cote * 0.045;
  const w = mesurer(texte) * taillePolice;
  const bas = r.position.startsWith("bas");
  const y = bas ? hauteur - marge - taillePolice * 0.35 : marge + taillePolice * 0.35;
  const x = r.position.endsWith("droite") ? largeur - marge - w / 2 : largeur / 2;
  return { texte, x, y, angle: 0, taillePolice };
}

/**
 * Filigrane et numéro d'une même page, sans qu'ils se chevauchent : un filigrane « en bas » remonte
 * au-dessus d'un numéro placé en bas.
 */
export function posesMarquage(largeur: number, hauteur: number, index: number, total: number, filigrane: ReglagesFiligrane | null, numeros: ReglagesNumeros | null, mesurer: Mesure): { filigrane: Pose[]; numero: Pose | null } {
  const numero = numeros ? poseNumero(largeur, hauteur, index, total, numeros, mesurer) : null;
  let poses = filigrane ? placerFiligrane(largeur, hauteur, filigrane, mesurer) : [];
  if (filigrane?.disposition === "bas" && numeros?.position.startsWith("bas")) {
    const ecart = Math.max(6, Math.min(largeur, hauteur) * 0.0175) * 2.2;
    poses = poses.map((p) => ({ ...p, y: p.y - ecart }));
  }
  return { filigrane: poses, numero };
}

/** Taille visible d'une page pivotée (90° ou 270° : largeur et hauteur s'échangent). */
export function tailleVisible(largeur: number, hauteur: number, rotation: number): [number, number] {
  const r = ((rotation % 360) + 360) % 360;
  return r === 90 || r === 270 ? [hauteur, largeur] : [largeur, hauteur];
}

/**
 * Passe d'un point du repère visible au repère du PDF (origine en bas à gauche, y vers le haut),
 * pour une page de largeur × hauteur (non pivotée) affichée avec la rotation `rotation`.
 */
export function versRepereePdf(vx: number, vy: number, largeur: number, hauteur: number, rotation: number): [number, number] {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return [vy, vx];
    case 180:
      return [largeur - vx, vy];
    case 270:
      return [largeur - vy, hauteur - vx];
    default:
      return [vx, hauteur - vy];
  }
}

/**
 * Où commencer à écrire dans le PDF (pdf-lib écrit depuis le début de la ligne de base, en tournant autour de ce point)
 * pour que le texte soit centré sur la pose et apparaisse à son angle une fois la page affichée.
 */
export function departPdf(p: Pose, largeurTexte: number, largeur: number, hauteur: number, rotation: number): { x: number; y: number; angle: number } {
  const [cx, cy] = versRepereePdf(p.x, p.y, largeur, hauteur, rotation);
  const angle = (((p.angle + rotation) % 360) + 360) % 360;
  const t = (angle * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const nrm = [-Math.sin(t), Math.cos(t)];
  const montee = p.taillePolice * 0.35;
  return { x: cx - (u[0] * largeurTexte) / 2 - nrm[0] * montee, y: cy - (u[1] * largeurTexte) / 2 - nrm[1] * montee, angle };
}

/** #rrggbb → [r, g, b] entre 0 et 1. */
export function couleurRvb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0.35, 0.38, 0.45];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}
