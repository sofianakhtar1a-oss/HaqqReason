/*
 * Le Portulan : la forme des données du monde (src/lib/monde/donnees.ts, produit par
 * scripts/monde/construire.mjs). Codes ISO 3166-1 alpha-2 en minuscules.
 */

export type ContinentId = "afrique" | "amerique-nord" | "amerique-sud" | "asie" | "europe" | "oceanie" | "antarctique";

export type Monnaie = { code: string; nom: string; symbole?: string };

/** Les organisations suivies par le Portulan (scripts/monde/curation-plus.mjs). */
export type OrganisationId = "ue" | "ua" | "la" | "oci" | "oif" | "asean" | "mercosur" | "g20" | "commonwealth" | "otan";

/** État membre de l'ONU, État observateur, État à la reconnaissance partielle, ou territoire. */
export type Statut = "etat" | "observateur" | "partiel" | "territoire";

export type Pays = {
  code: string;
  /** Le nom court, celui des questions. */
  nom: string;
  /** Le nom officiel ou long, pour la fiche. */
  complet?: string;
  /** Toutes les réponses écrites acceptées (le nom d'abord). */
  noms: string[];
  /** La capitale (le chef-lieu pour un territoire) ; null : rien à apprendre ici. */
  capitale: string | null;
  /** Autres réponses écrites acceptées pour la capitale. */
  capitales?: string[];
  noteCapitale?: string;
  continent: ContinentId;
  /** Continents qui seraient aussi justes (pays à cheval) : jamais proposés comme faux choix. */
  continents?: ContinentId[];
  sousRegion: string;
  /** La première est celle qu'on apprend. */
  monnaies: Monnaie[];
  quizMonnaie: boolean;
  population: number | null;
  anneePopulation: number | null;
  notePopulation?: string;
  /** En km². */
  superficie: number | null;
  langues: string[];
  voisins: string[];
  /** Sans accès à la mer. */
  enclave: boolean;
  /** Centre approximatif [latitude, longitude]. */
  latlng: [number, number];
  statut: Statut;
  souverain?: string;
  nature?: string;
  /** Du plus connu (0) au moins connu. */
  rang: number;
  rangCapitale: number;
  rangCarte: number;
  /** false : seulement sur la carte et dans l'atlas (l'Antarctique, les îles inhabitées). */
  quiz: boolean;
  /** Le fichier du drapeau (empreinte), dans DRAPEAUX_URL. */
  drapeau: string;
  /** Couleurs moyennes du drapeau (4 × 3 cases, en hexadécimal) : pour les drapeaux qui se ressemblent. */
  teinte: string;
  /** false : le territoire hisse le drapeau d'un autre (drapeauDe) ; pas de question de drapeau. */
  drapeauPropre: boolean;
  drapeauDe?: string;
  /** A une forme sur la carte (sinon : un repère). */
  carte: boolean;
  /** Le gentilé [masculin, féminin]. */
  gentile?: [string, string];
  /** Le nom courant en anglais, et en arabe. */
  nomEn: string;
  nomAr?: string;
  /** L'indicatif téléphonique (« +33 »), le domaine Internet (« .fr »), le code ISO à trois lettres. */
  indicatif?: string;
  tld?: string;
  iso3: string;
  /** Le côté où l'on roule (rien pour les terres sans route publique). */
  conduite?: "gauche" | "droite";
  /** Le fuseau horaire de la capitale (IANA). */
  fuseau?: string;
  orgs?: OrganisationId[];
  /** La capitale sur le globe [latitude, longitude]. */
  capLatLng?: [number, number];
  /** Les grandes villes, hors capitale, de la plus peuplée à la moins peuplée. */
  villes?: string[];
  /** Le point culminant [nom, altitude en m] et le plus long fleuve [nom, longueur en km]. */
  sommet?: [string, number];
  fleuve?: [string, number];
  /** Les couleurs du drapeau (src/lib/monde/couleurs.ts), de la plus présente à la moins présente (5 % de la surface au moins). */
  couleurs?: string[];
  /** Un drapeau simple qu'on peut colorier : la couleur de chaque forme, dans l'ordre du dessin. */
  coloriage?: string[];
  /** Le drapeau découpé en 3 × 2 pièces : la même lettre pour deux pièces identiques (le puzzle). */
  decoupe?: string;
};

/** Ce que raconte la fiche d'un pays (src/lib/monde/recits.ts, chargé à la demande). */
export type Recit = {
  devise?: string;
  hymne?: string;
  auteurs?: string;
  independance?: string;
  fete?: string;
  fleuveNote?: string;
  mers?: string[];
  drapeau?: string;
  etymologie?: string;
  anecdote?: string;
  /** [nom] ou [nom, population arrondie]. */
  villes?: ([string] | [string, number])[];
  anciens?: string[];
};

/* ---------- Les cabinets : les pays vus de l'intérieur (départements, États, wilayas…) ---------- */

export type CabinetId = "fr-regions" | "fr-departements" | "us-etats" | "ca-provinces" | "ma-regions" | "dz-wilayas" | "drapeaux-plus";

/**
 * Les méthodes d'un cabinet : ce qu'on montre, puis ce qu'on trouve.
 * chef : préfecture, capitale ou chef-lieu ; num : le numéro ; groupe : la région d'un département.
 */
export type MethodeCabinet = "nom-chef" | "chef-nom" | "num-nom" | "nom-num" | "nom-groupe" | "drapeau-nom" | "nom-drapeau" | "ville-nom" | "ecrire-chef" | "ecrire-nom" | "ecrire-num";

export type ElementCabinet = {
  id: string;
  nom: string;
  noms?: string[];
  chef?: string;
  chefs?: string[];
  num?: string;
  groupe?: string;
  villes?: string[];
  note?: string;
  /** Le fichier du drapeau (dans /monde/emblemes/) et son rapport largeur / hauteur. */
  drapeau?: string;
  rapport?: number;
  rang: number;
};

export type DonneesCabinet = {
  id: CabinetId;
  nom: string;
  court: string;
  texte: string;
  /** Le pays (code) dont le drapeau représente le cabinet ; « eu » pour les autres drapeaux. */
  pays: string;
  embleme?: string;
  /** Le nombre d'éléments par niveau (à peu près). */
  taille: number;
  mots: { unite: string; unites: string; chef?: string; chefs?: string; num?: string; groupe?: string };
  avertissement?: string;
  consignes: Partial<Record<MethodeCabinet, string>>;
  /** Les méthodes de la première moitié des niveaux, puis celles qui s'y ajoutent. */
  paliers: MethodeCabinet[][];
  groupes?: Record<string, string>;
  elements: ElementCabinet[];
};
