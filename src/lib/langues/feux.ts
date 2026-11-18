/*
 * Les feux du Truchement : un petit moteur de particules sur <canvas>, sans dépendance.
 *
 *   • Un seul calque d'éclats, posé au-dessus de la page et transparent aux clics : il ne tourne
 *     que tant qu'il reste des particules (aucune boucle à vide), et s'arrête quand l'onglet est caché.
 *   • Des calques d'ambiance (derrière le contenu d'une séance) : quelques braises ou étincelles
 *     qui montent du bas de l'écran, selon le palier de série. Jamais au milieu du texte.
 *   • Rien ne bouge si la personne a demandé à réduire les animations.
 *   • 60 images/s : particules plafonnées, résolution plafonnée (2×), seulement des formes simples.
 */

export type Sorte = "etincelle" | "braise" | "fumee" | "lettre" | "comete" | "poussiere";

type Particule = {
  sorte: Sorte;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Âge et durée de vie, en secondes. */
  age: number;
  vie: number;
  taille: number;
  couleur: string;
  rot: number;
  vrot: number;
  glyphe?: string;
  /** Gravité propre (négative : la particule monte). */
  g: number;
  /** Freinage par seconde (0 : aucun). */
  frein: number;
  scintille: number;
};

const MAX = 420;

export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
const themeClair = () => typeof document !== "undefined" && document.documentElement.dataset.theme === "light";
const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const choisir = <T>(t: readonly T[]) => t[Math.floor(Math.random() * t.length)];

export class Moteur {
  private ctx: CanvasRenderingContext2D | null;
  private parts: Particule[] = [];
  private image = 0;
  private dernier = 0;
  private l = 0;
  private h = 0;
  private dpr = 1;
  /** Ambiance : particules à faire naître par seconde, et leur recette. */
  private ambiance: { debit: number; recette: () => Partial<Particule> & { sorte: Sorte } } | null = null;
  private reliquat = 0;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.redimensionner();
    window.addEventListener("resize", this.redimensionner);
    document.addEventListener("visibilitychange", this.surVisibilite);
  }

  detruire() {
    cancelAnimationFrame(this.image);
    this.image = 0;
    window.removeEventListener("resize", this.redimensionner);
    document.removeEventListener("visibilitychange", this.surVisibilite);
    this.parts = [];
  }

  private surVisibilite = () => {
    this.visible = document.visibilityState === "visible";
    if (this.visible) this.demarrer();
  };

  private redimensionner = () => {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.l = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.l * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  };

  /** Coordonnées de l'écran → coordonnées du calque. */
  local(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: x - r.left, y: y - r.top };
  }

  ajouter(p: Partial<Particule> & { sorte: Sorte; x: number; y: number }) {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push({ vx: 0, vy: 0, age: 0, vie: 1, taille: 3, couleur: "#fff", rot: 0, vrot: 0, g: 0, frein: 0, scintille: 0, ...p });
    this.demarrer();
  }

  /** L'ambiance d'un palier : un débit de particules (0 pour arrêter). */
  regler(debit: number, recette?: () => Partial<Particule> & { sorte: Sorte }) {
    this.ambiance = debit > 0 && recette && !mouvementReduit() ? { debit, recette } : null;
    if (this.ambiance) this.demarrer();
  }

  get largeur() {
    return this.l;
  }
  get hauteur() {
    return this.h;
  }

  private demarrer() {
    if (this.image || !this.visible || !this.ctx) return;
    this.dernier = performance.now();
    this.image = requestAnimationFrame(this.tour);
  }

  private tour = (maintenant: number) => {
    // Pendant le tour, this.image reste non nul : une particule ajoutée ici ne relance pas une seconde boucle.
    const ctx = this.ctx;
    if (!ctx || !this.visible) {
      this.image = 0;
      return;
    }
    // Un onglet revenu au premier plan ne doit pas faire « sauter » les particules.
    const dt = Math.min(0.05, (maintenant - this.dernier) / 1000);
    this.dernier = maintenant;

    if (this.ambiance) {
      this.reliquat += this.ambiance.debit * dt;
      while (this.reliquat >= 1) {
        this.reliquat -= 1;
        const p = this.ambiance.recette();
        this.ajouter({ x: hasard(0, this.l), y: this.h + 8, ...p });
      }
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.l, this.h);
    const clair = themeClair();
    ctx.globalCompositeOperation = clair ? "source-over" : "lighter";

    const vivantes: Particule[] = [];
    for (const p of this.parts) {
      p.age += dt;
      if (p.age >= p.vie) continue;
      p.vy += p.g * dt;
      if (p.frein) {
        const f = Math.max(0, 1 - p.frein * dt);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      vivantes.push(p);
      this.dessiner(ctx, p, clair);
    }
    this.parts = vivantes;
    ctx.globalAlpha = 1;
    if (this.parts.length || this.ambiance) this.image = requestAnimationFrame(this.tour);
    else {
      this.image = 0;
      ctx.clearRect(0, 0, this.l, this.h);
    }
  };

  private dessiner(ctx: CanvasRenderingContext2D, p: Particule, clair: boolean) {
    const t = p.age / p.vie;
    // Apparition rapide, extinction douce.
    let alpha = Math.min(1, t * 8) * (1 - t) ** 1.4;
    if (p.scintille) alpha *= 0.65 + 0.35 * Math.sin(p.age * p.scintille + p.rot * 7);
    if (alpha <= 0.01) return;
    ctx.globalAlpha = clair ? Math.min(1, alpha * 0.9) : alpha;
    ctx.fillStyle = p.couleur;
    ctx.strokeStyle = p.couleur;
    switch (p.sorte) {
      case "etincelle": {
        // Un trait dans le sens de la course : plus la particule va vite, plus il s'allonge.
        const v = Math.hypot(p.vx, p.vy) || 1;
        const long = Math.min(26, 3 + v * 0.035) * (1 - t * 0.5);
        ctx.lineWidth = p.taille;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx / v) * long, p.y - (p.vy / v) * long);
        ctx.stroke();
        break;
      }
      case "braise":
      case "poussiere": {
        const r = p.taille * (p.sorte === "braise" ? 1 - t * 0.6 : 1);
        if (!clair && p.sorte === "braise") {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = alpha;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "fumee": {
        const r = p.taille * (1 + t * 2.2);
        ctx.globalAlpha = alpha * 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "lettre": {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `500 ${p.taille}px "Literata Variable", Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyphe ?? "a", 0, 0);
        ctx.restore();
        break;
      }
      case "comete": {
        // Une tête lumineuse et une traîne qui s'amincit.
        const v = Math.hypot(p.vx, p.vy) || 1;
        const ux = p.vx / v;
        const uy = p.vy / v;
        const long = 140;
        const grad = ctx.createLinearGradient(p.x, p.y, p.x - ux * long, p.y - uy * long);
        grad.addColorStop(0, p.couleur);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.taille;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - ux * long, p.y - uy * long);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.taille * 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }
}

/* ---------- Les teintes des paliers (mêmes noms que PALIERS dans points.ts) ---------- */

export const TEINTES: Record<string, readonly string[]> = {
  azur: ["#7cc8ff", "#a9dcff", "#e6f5ff"],
  ambre: ["#ffd27a", "#ffb547", "#fff1c9"],
  braise: ["#ff8a3d", "#ff5a36", "#ffc36b"],
  pourpre: ["#e26bff", "#b44dff", "#ff8ad8"],
  aurore: ["#5ef2c9", "#7aa8ff", "#f2a2ff", "#fff3a8"],
};
const TEINTES_CLAIRES: Record<string, readonly string[]> = {
  azur: ["#1f7fc8", "#0f5f9e", "#3d9be0"],
  ambre: ["#c98400", "#e09a13", "#a86b00"],
  braise: ["#d9480f", "#e8590c", "#c2410c"],
  pourpre: ["#9c36b5", "#862e9c", "#be4bdb"],
  aurore: ["#0ca678", "#3b5bdb", "#ae3ec9", "#f08c00"],
};
export const couleurs = (teinte: string) => (themeClair() ? TEINTES_CLAIRES : TEINTES)[teinte] ?? TEINTES.azur;

/* ---------- Le calque d'éclats, partagé par toute la page ---------- */

let calque: Moteur | null = null;
function eclats(): Moteur | null {
  if (typeof window === "undefined" || mouvementReduit()) return null;
  if (calque) return calque;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.className = "lg-feux";
  document.body.appendChild(c);
  calque = new Moteur(c);
  return calque;
}

/** Un éclat d'étincelles depuis un point de l'écran (une bonne réponse). */
export function eclat(x: number, y: number, teinte = "azur", force = 1) {
  const m = eclats();
  if (!m) return;
  const p = m.local(x, y);
  const cs = couleurs(teinte);
  const n = Math.round(14 * force);
  for (let i = 0; i < n; i++) {
    const a = hasard(0, Math.PI * 2);
    const v = hasard(160, 420) * force ** 0.5;
    m.ajouter({ sorte: "etincelle", x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 520, frein: 2.2, vie: hasard(0.45, 0.8), taille: hasard(1.4, 2.4), couleur: choisir(cs) });
  }
}

/** Le passage d'un palier : une gerbe propre à chaque palier, depuis un élément (le compteur de série). */
export function franchir(el: Element | null, teinte: string) {
  const m = eclats();
  if (!m) return;
  const r = el?.getBoundingClientRect();
  const p = m.local(r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top + r.height / 2 : 80);
  const cs = couleurs(teinte);
  if (teinte === "aurore") {
    // Comète : trois traînées traversent l'écran en diagonale, puis une pluie fine.
    for (let k = 0; k < 3; k++) {
      m.ajouter({ sorte: "comete", x: -60 - k * 120, y: hasard(40, m.hauteur * 0.35), vx: hasard(900, 1200), vy: hasard(120, 260), vie: 1.6, taille: hasard(2.5, 4), couleur: cs[k % cs.length] });
    }
  }
  const n = teinte === "ambre" ? 46 : teinte === "braise" ? 70 : teinte === "pourpre" ? 90 : 110;
  for (let i = 0; i < n; i++) {
    const a = hasard(0, Math.PI * 2);
    const v = hasard(120, 620);
    const braise = teinte === "braise" || teinte === "pourpre";
    m.ajouter({
      sorte: braise && i % 3 === 0 ? "braise" : "etincelle",
      x: p.x,
      y: p.y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v * 0.8 - 120,
      g: braise ? 60 : 380,
      frein: 1.6,
      vie: hasard(0.8, 1.6),
      taille: braise ? hasard(1.6, 3.2) : hasard(1.3, 2.6),
      couleur: choisir(cs),
      scintille: braise ? hasard(10, 22) : 0,
      vrot: hasard(-3, 3),
    });
  }
}

/** Une série perdue : la flamme s'éteint en un filet de fumée (pas de punition, juste un souffle). */
export function souffler(el: Element | null) {
  const m = eclats();
  if (!m || !el) return;
  const r = el.getBoundingClientRect();
  const p = m.local(r.left + r.width / 2, r.top + r.height / 2);
  const gris = themeClair() ? "#8a93a6" : "#9aa4b8";
  for (let i = 0; i < 9; i++) {
    m.ajouter({ sorte: "fumee", x: p.x + hasard(-6, 6), y: p.y, vx: hasard(-14, 14), vy: hasard(-60, -30), vie: hasard(0.9, 1.5), taille: hasard(3, 6), couleur: gris, frein: 0.8 });
  }
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ&'";

/**
 * La pluie de lettres : la célébration d'une montée au classement.
 * Des lettres jaillissent de l'élément, montent, tournoient et retombent comme des confettis.
 */
export function pluieDeLettres(el: Element | null, teinte = "ambre", mot?: string) {
  const m = eclats();
  if (!m) return;
  const r = el?.getBoundingClientRect();
  const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const cy = r ? r.top + r.height / 2 : window.innerHeight / 3;
  const p = m.local(cx, cy);
  const cs = couleurs(teinte);
  const glyphes = (mot && mot.replace(/\s+/g, "")) || ALPHABET;
  for (let i = 0; i < 64; i++) {
    const a = hasard(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = hasard(260, 720);
    m.ajouter({
      sorte: "lettre",
      glyphe: mot ? glyphes[i % glyphes.length] : choisir([...ALPHABET]),
      x: p.x + hasard(-(r?.width ?? 40) / 2, (r?.width ?? 40) / 2),
      y: p.y,
      vx: Math.cos(a) * v * 0.7,
      vy: Math.sin(a) * v,
      g: 640,
      frein: 0.9,
      vie: hasard(1.4, 2.4),
      taille: hasard(13, 26),
      couleur: choisir(cs),
      rot: hasard(-1, 1),
      vrot: hasard(-6, 6),
    });
  }
  for (let i = 0; i < 30; i++) {
    const a = hasard(0, Math.PI * 2);
    const v = hasard(80, 380);
    m.ajouter({ sorte: "etincelle", x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, g: 300, frein: 1.8, vie: hasard(0.6, 1.1), taille: 1.6, couleur: choisir(cs) });
  }
}

/** L'ambiance d'un palier, pour un calque placé derrière le contenu. */
export function recetteAmbiance(teinte: string): { debit: number; recette: () => Partial<Particule> & { sorte: Sorte } } {
  const cs = couleurs(teinte);
  switch (teinte) {
    case "ambre":
      return { debit: 5, recette: () => ({ sorte: "poussiere", vx: hasard(-12, 12), vy: hasard(-90, -50), vie: hasard(3, 5), taille: hasard(0.8, 1.6), couleur: choisir(cs), scintille: hasard(4, 9) }) };
    case "braise":
      return { debit: 9, recette: () => ({ sorte: "braise", vx: hasard(-20, 20), vy: hasard(-120, -70), g: -8, vie: hasard(2.6, 4.2), taille: hasard(1.2, 2.4), couleur: choisir(cs), scintille: hasard(8, 16) }) };
    case "pourpre":
      return { debit: 13, recette: () => ({ sorte: "braise", vx: hasard(-40, 40), vy: hasard(-150, -80), g: -10, vie: hasard(2.4, 4), taille: hasard(1.2, 2.8), couleur: choisir(cs), scintille: hasard(10, 20), vrot: hasard(-2, 2) }) };
    case "aurore":
      return { debit: 16, recette: () => ({ sorte: Math.random() < 0.25 ? "etincelle" : "poussiere", vx: hasard(-30, 30), vy: hasard(-170, -90), vie: hasard(2.2, 3.6), taille: hasard(1, 2), couleur: choisir(cs), scintille: hasard(6, 14) }) };
    default:
      return { debit: 0, recette: () => ({ sorte: "poussiere" }) };
  }
}
