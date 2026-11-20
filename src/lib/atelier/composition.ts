/**
 * Le Calame — composition des pages, deuxième moteur.
 *
 * Le premier moteur (pagination.ts) envoyait tout bloc qui ne tenait plus à la
 * page suivante : un long paragraphe laissait derrière lui un grand blanc. Celui-ci
 * compose comme un traitement de texte :
 *   • un paragraphe se coupe entre deux lignes, sans laisser une ligne seule en bas
 *     de page (orpheline) ni en haut de la suivante (veuve) ;
 *   • un tableau se coupe entre deux rangées, sa ligne d'en-tête répétée en haut de
 *     la page suivante ;
 *   • un titre reste avec ce qui le suit ;
 *   • les notes de bas de page s'impriment en bas de la page où elles sont appelées,
 *     et la place qu'elles prennent est retirée à cette page ;
 *   • un saut de page ou un changement de section ouvre toujours une page neuve.
 *
 * Tout ici reste pur : les mesures (hauteurs, lignes, notes) viennent du navigateur,
 * passées en argument. Les lignes ne sont lues qu'à la demande — seulement pour les
 * blocs qui chevauchent une fin de page —, ce qui garde la composition rapide.
 */

/** Une ligne (ou une rangée de tableau), bornes de sa boîte, en coordonnées « à plat ». */
export type LigneMesuree = { haut: number; bas: number };

export type UniteMesuree = {
  id: string;
  /** Haut du bloc, dans le flux sans aucun blanc de page. */
  haut: number;
  hauteur: number;
  /** Bloc que l'on ne coupe jamais (image, encadré, verset, schéma…). */
  insecable?: boolean;
  /** Saut de page demandé juste avant ce bloc. */
  sautAvant?: boolean;
  /** Un titre : il ne reste jamais seul en bas d'une page. */
  avecSuivant?: boolean;
  /** Les lignes du bloc, lues seulement s'il faut le couper. */
  lignes?: () => LigneMesuree[];
  /** Lignes minimales en bas de page (orphelines). 2 par défaut. */
  minAvant?: number;
  /** Lignes minimales en haut de la page suivante (veuves). 2 par défaut. */
  minApres?: number;
  /** Hauteur répétée en haut de la page suivante quand le bloc s'y poursuit (ligne d'en-tête d'un tableau). */
  repete?: number;
  /** Les appels de note du bloc : leur identifiant et leur hauteur dans le flux. */
  notes?: { id: string; y: number }[];
  /** Section du document (une page en paysage, d'autres marges) : chaque section commence sur une page neuve. */
  section?: number;
};

/** Ce qui ouvre une page : le début d'un bloc (ligne 0) ou une ligne au milieu. */
export type Ouverture = {
  unite: string;
  ligne: number;
  /** Haut, à plat, de ce qui commence la page (le bloc ou la ligne). */
  y: number;
  /** Hauteur répétée avant le texte (ligne d'en-tête d'un tableau). */
  repete: number;
};

export type PageComposee = {
  numero: number;
  section: number;
  /** Début (à plat) de la place utile de la page — pour le calcul seulement. */
  debut: number;
  /** null : page 1, ou page traversée par un bloc plus haut qu'une page. */
  ouverture: Ouverture | null;
  unites: string[];
  notes: string[];
  /** Place prise en bas de page par les notes (filet compris). */
  hauteurNotes: number;
};

export type OptionsComposition = {
  /** Hauteur utile d'une page de cette section (sans les marges). */
  hauteurUtile: (section: number) => number;
  /** Hauteur d'une note de bas de page composée. */
  hauteurNote?: (id: string) => number;
  /** Filet et blanc au-dessus de la première note. */
  filetNotes?: number;
  /** Éviter veuves et orphelines (sinon, une seule ligne suffit de part et d'autre). */
  veuves?: boolean;
};

export type Composition = { pages: PageComposee[] };

const MAX_TOURS = 100_000;

export function composer(unites: UniteMesuree[], options: OptionsComposition): Composition {
  const hNote = options.hauteurNote ?? (() => 0);
  const filet = options.filetNotes ?? 0;
  const veuves = options.veuves !== false;
  const utile = (section: number) => Math.max(1, options.hauteurUtile(section));
  const hauteurNotes = (ids: string[]) => (ids.length === 0 ? 0 : filet + ids.reduce((s, id) => s + Math.max(0, hNote(id)), 0));

  const pages: PageComposee[] = [];
  let page: PageComposee = { numero: 1, section: unites[0]?.section ?? 0, debut: 0, ouverture: null, unites: [], notes: [], hauteurNotes: 0 };
  const limite = (notesEnPlus: string[] = []) => page.debut + utile(page.section) - hauteurNotes(notesEnPlus.length ? [...page.notes, ...notesEnPlus] : page.notes);
  const tourner = (ouverture: Ouverture | null, debut: number, section = page.section) => {
    page.hauteurNotes = hauteurNotes(page.notes);
    pages.push(page);
    page = { numero: pages.length + 1, section, debut, ouverture, unites: [], notes: [], hauteurNotes: 0 };
  };
  const placer = (u: UniteMesuree, notes: string[]) => {
    if (page.unites[page.unites.length - 1] !== u.id) page.unites.push(u.id);
    for (const n of notes) if (!page.notes.includes(n)) page.notes.push(n);
  };
  const lignesDe = new Map<string, LigneMesuree[]>();
  const lire = (u: UniteMesuree): LigneMesuree[] => {
    if (!u.lignes) return [];
    let l = lignesDe.get(u.id);
    if (!l) {
      l = u.lignes().filter((x) => Number.isFinite(x.haut) && Number.isFinite(x.bas) && x.bas >= x.haut);
      lignesDe.set(u.id, l);
    }
    return l;
  };
  /** La ligne qui contient cette hauteur (une note appelée à cet endroit). */
  const ligneDe = (lignes: LigneMesuree[], y: number) => {
    for (let i = 0; i < lignes.length; i++) if (y < lignes[i].bas) return i;
    return lignes.length - 1;
  };

  for (let i = 0; i < unites.length; i++) {
    const u = unites[i];
    const section = u.section ?? page.section;
    const vide = () => page.unites.length === 0;

    if (section !== page.section) {
      if (vide() && pages.length === 0) page.section = section;
      else tourner({ unite: u.id, ligne: 0, y: u.haut, repete: 0 }, u.haut, section);
    } else if (u.sautAvant && !vide()) {
      tourner({ unite: u.id, ligne: 0, y: u.haut, repete: 0 }, u.haut);
    }

    // Un titre ne reste pas seul en bas de page : il emporte avec lui le début de ce qui le suit.
    if (u.avecSuivant && !vide() && i + 1 < unites.length) {
      const v = unites[i + 1];
      const lv = v.insecable ? [] : lire(v);
      const besoin = lv.length >= 2 ? lv[Math.min(lv.length, veuves ? 2 : 1) - 1].bas : v.haut + v.hauteur;
      // Seulement si le titre et ce début tiennent ensemble sur une page neuve.
      const ensembleTient = besoin - u.haut <= utile(page.section);
      if (ensembleTient && Math.max(u.haut + u.hauteur, besoin) > limite()) tourner({ unite: u.id, ligne: 0, y: u.haut, repete: 0 }, u.haut);
    }

    let premiere = 0; // première ligne de u qui reste à placer
    for (let tour = 0; tour < MAX_TOURS; tour++) {
      const bas = u.haut + u.hauteur;
      let lignes = premiere > 0 ? lire(u) : [];
      const hautRestant = premiere > 0 && lignes[premiere] ? lignes[premiere].haut : u.haut;
      const notesRestantes = (u.notes ?? []).filter((n) => premiere === 0 || ligneDe(lignes, n.y) >= premiere).map((n) => n.id);

      if (bas <= limite(notesRestantes)) {
        placer(u, notesRestantes);
        break;
      }
      if (premiere === 0 && u.lignes && !u.insecable) lignes = lire(u);

      const minAvant = veuves ? (u.minAvant ?? 2) : 1;
      const minApres = veuves ? (u.minApres ?? 2) : 1;
      const restantes = lignes.length - premiere;
      if (!u.insecable && restantes >= 2) {
        // Combien de lignes tiennent encore ici, notes appelées dans ces lignes comprises ?
        let k = 0;
        while (k < restantes) {
          const notesK = (u.notes ?? []).filter((n) => {
            const l = ligneDe(lignes, n.y);
            return l >= premiere && l < premiere + k + 1;
          }).map((n) => n.id);
          if (lignes[premiere + k].bas <= limite(notesK)) k++;
          else break;
        }
        if (k >= restantes) {
          // Toutes les lignes tiennent : seul le blanc sous le bloc déborde, il tombe dans la marge.
          placer(u, notesRestantes);
          break;
        }
        // Une ligne seule ne commence pas un bloc en bas de page.
        if (k < minAvant) {
          if (!vide()) {
            tourner({ unite: u.id, ligne: premiere, y: hautRestant, repete: premiere > 0 ? (u.repete ?? 0) : 0 }, hautRestant - (premiere > 0 ? (u.repete ?? 0) : 0));
            continue;
          }
          k = Math.max(1, k);
        }
        // Ni une ligne seule en haut de la page suivante.
        const apres = restantes - k;
        if (apres < minApres) {
          const recul = k - (minApres - apres);
          if (recul >= minAvant) k = recul;
          else if (!vide()) {
            tourner({ unite: u.id, ligne: premiere, y: hautRestant, repete: premiere > 0 ? (u.repete ?? 0) : 0 }, hautRestant - (premiere > 0 ? (u.repete ?? 0) : 0));
            continue;
          }
        }
        const notesK = (u.notes ?? []).filter((n) => {
          const l = ligneDe(lignes, n.y);
          return l >= premiere && l < premiere + k;
        }).map((n) => n.id);
        placer(u, notesK);
        premiere += k;
        const repete = u.repete ?? 0;
        tourner({ unite: u.id, ligne: premiere, y: lignes[premiere].haut, repete }, lignes[premiere].haut - repete);
        continue;
      }

      // Un bloc que l'on ne coupe pas descend à la page suivante, s'il y tient.
      const hauteurRestante = bas - hautRestant;
      if (!vide() && hauteurRestante <= utile(page.section) - hauteurNotes(notesRestantes)) {
        tourner({ unite: u.id, ligne: premiere, y: hautRestant, repete: premiere > 0 ? (u.repete ?? 0) : 0 }, hautRestant - (premiere > 0 ? (u.repete ?? 0) : 0));
        continue;
      }
      // Plus haut qu'une page entière : il la traverse, et les pages suivantes s'ouvrent sur lui.
      placer(u, notesRestantes);
      let garde = 0;
      while (bas > limite() && garde++ < 10_000) {
        tourner(null, limite());
        placer(u, []);
      }
      break;
    }
  }

  page.hauteurNotes = hauteurNotes(page.notes);
  pages.push(page);
  return { pages };
}

// ---------------------------------------------------------------------------
// Numérotation et jetons des en-têtes
// ---------------------------------------------------------------------------

const ROMAINS: [number, string][] = [
  [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
  [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

/** 4 → « iv ». Zéro et les nombres négatifs n'ont pas de chiffre romain : on garde le chiffre arabe. */
export function enRomain(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n >= 4000) return String(n);
  let reste = n;
  let s = "";
  for (const [valeur, chiffre] of ROMAINS) {
    while (reste >= valeur) {
      s += chiffre;
      reste -= valeur;
    }
  }
  return s;
}

export type StyleNumero = "arabe" | "romain" | "ROMAIN";

/**
 * Le numéro affiché sur la page physique `indice` (1 pour la première page) :
 * les pages liminaires sont numérotées i, ii, iii…, puis le corps repart à `premier`.
 */
export function numeroAffiche(indice: number, options: { style: StyleNumero; premier: number; liminaires: number }): string {
  if (options.liminaires > 0 && indice <= options.liminaires) return enRomain(indice);
  const n = indice - Math.max(0, options.liminaires) + (options.premier - 1);
  if (options.style === "romain") return enRomain(n);
  if (options.style === "ROMAIN") return enRomain(n).toUpperCase();
  return String(n);
}

/** La date du jour selon le calendrier de l'Hégire (Umm al-Qura), en français : « 10 joumada ath-thania 1448 H ». */
export function dateHegirienne(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).formatToParts(date);
    const jour = parts.find((p) => p.type === "day")?.value ?? "";
    const mois = parts.find((p) => p.type === "month")?.value ?? "";
    const annee = parts.find((p) => p.type === "year")?.value ?? "";
    if (!annee) return "";
    return `${jour} ${mois} ${annee} H`.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

export type ContexteLigne = {
  titre: string;
  /** Numéro tel qu'affiché (arabe ou romain). */
  page: string;
  pages: number;
  /** Titre de la partie en cours sur cette page. */
  partie?: string;
  auteur?: string;
  date?: Date;
};

/** Remplit un gabarit d'en-tête ou de pied : {titre} {page} {pages} {date} {hégire} {partie} {auteur}. */
export function remplirGabarit(gabarit: string, c: ContexteLigne): string {
  if (!gabarit) return "";
  const d = c.date ?? new Date();
  return gabarit
    .replace(/\{titre\}/g, c.titre)
    .replace(/\{page\}/g, c.page)
    .replace(/\{pages\}/g, String(c.pages))
    .replace(/\{date\}/g, d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }))
    .replace(/\{h[ée]gire\}/g, dateHegirienne(d))
    .replace(/\{partie\}/g, c.partie ?? "")
    .replace(/\{auteur\}/g, c.auteur ?? "");
}

/** Le titre de la partie pour une page : celle qui s'ouvre sur la page, sinon la dernière ouverte avant. */
export function partieDeLaPage(titres: { y: number; texte: string }[], debut: number, fin: number): string {
  let derniere = "";
  for (const t of titres) {
    if (t.y < debut) derniere = t.texte;
    else if (t.y < fin) return t.texte;
    else break;
  }
  return derniere;
}
