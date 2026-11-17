/* Les 45 thèmes de vocabulaire du Truchement (anglais → français), dans l'ordre d'affichage. */
import { ACHATS } from "./achats";
import { ANIMAUX } from "./animaux";
import { ARTS } from "./arts";
import { CAMPAGNE } from "./campagne";
import { CARACTERE } from "./caractere";
import { CONSOMMATION } from "./consommation";
import { CORPS } from "./corps";
import { COUPLE } from "./couple";
import { DROIT } from "./droit";
import { ECONOMIE } from "./economie";
import { ENERGIE } from "./energie";
import { EXPRESSIONS } from "./expressions";
import { GENS_LIEUX } from "./gens-lieux";
import { GEOGRAPHIE } from "./geographie";
import { HISTOIRE } from "./histoire";
import { JEUNESSE } from "./jeunesse";
import { LIAISON } from "./liaison";
import { LOISIRS } from "./loisirs";
import { MANGER_BOIRE } from "./manger-boire";
import { MEDIAS } from "./medias";
import { METIERS } from "./metiers";
import { PHILOSOPHIE } from "./philosophie";
import { POLLUTION } from "./pollution";
import { PRESENTATION } from "./presentation";
import { PROPRETE } from "./proprete";
import { SCIENCES } from "./sciences";
import { SECURITE } from "./securite";
import { SOCIETE } from "./societe";
import { SPORT } from "./sport";
import { TEMPS_MESURES } from "./temps-mesures";
import { VACANCES } from "./vacances";
import { VERBES_PARTICULE } from "./verbes-particule";
import { VETEMENTS } from "./vetements";
import { ECOLE, NATURE, VILLE } from "./ecole-ville-nature";
import { FAMILLE, TRAVAIL, VOYAGE } from "./famille-voyage-travail";
import { EMOTIONS, MAISON, METEO } from "./maison-emotions-meteo";
import { NOURRITURE, QUOTIDIEN, SANTE } from "./quotidien-nourriture-sante";

export const THEMES = [
  // Soi et les autres
  FAMILLE,
  COUPLE,
  JEUNESSE,
  PRESENTATION,
  CARACTERE,
  EMOTIONS,
  CORPS,
  SANTE,
  // La vie de tous les jours
  QUOTIDIEN,
  MAISON,
  PROPRETE,
  VETEMENTS,
  NOURRITURE,
  MANGER_BOIRE,
  ACHATS,
  CONSOMMATION,
  TEMPS_MESURES,
  // Travail et savoir
  TRAVAIL,
  METIERS,
  ECONOMIE,
  ECOLE,
  SCIENCES,
  // Ailleurs
  VOYAGE,
  VACANCES,
  VILLE,
  GENS_LIEUX,
  GEOGRAPHIE,
  // Le monde naturel
  METEO,
  NATURE,
  ANIMAUX,
  CAMPAGNE,
  POLLUTION,
  ENERGIE,
  // Loisirs et culture
  LOISIRS,
  SPORT,
  ARTS,
  MEDIAS,
  HISTOIRE,
  // Idées et société
  PHILOSOPHIE,
  SOCIETE,
  DROIT,
  SECURITE,
  // La langue elle-même
  LIAISON,
  VERBES_PARTICULE,
  EXPRESSIONS,
];

export const TOUTES_LES_ENTREES = THEMES.flatMap((t) => t.entrees);
export const themeDe = (id: string) => THEMES.find((t) => t.id === id);
