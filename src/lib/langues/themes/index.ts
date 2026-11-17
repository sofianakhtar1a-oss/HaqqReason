/* Les 33 thèmes de vocabulaire du Truchement (anglais → français), dans l'ordre d'affichage. */
import { ACHATS } from "./achats";
import { ARTS } from "./arts";
import { CAMPAGNE } from "./campagne";
import { COUPLE } from "./couple";
import { CONSOMMATION } from "./consommation";
import { ENERGIE } from "./energie";
import { GENS_LIEUX } from "./gens-lieux";
import { HISTOIRE } from "./histoire";
import { JEUNESSE } from "./jeunesse";
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
import { VACANCES } from "./vacances";
import { ECOLE, NATURE, VILLE } from "./ecole-ville-nature";
import { FAMILLE, TRAVAIL, VOYAGE } from "./famille-voyage-travail";
import { EMOTIONS, MAISON, METEO } from "./maison-emotions-meteo";
import { NOURRITURE, QUOTIDIEN, SANTE } from "./quotidien-nourriture-sante";

export const THEMES = [
  FAMILLE,
  QUOTIDIEN,
  NOURRITURE,
  MANGER_BOIRE,
  MAISON,
  VOYAGE,
  VACANCES,
  VILLE,
  GENS_LIEUX,
  TRAVAIL,
  METIERS,
  ECOLE,
  SCIENCES,
  SANTE,
  EMOTIONS,
  METEO,
  NATURE,
  CAMPAGNE,
  POLLUTION,
  ENERGIE,
  ACHATS,
  CONSOMMATION,
  PRESENTATION,
  COUPLE,
  JEUNESSE,
  LOISIRS,
  ARTS,
  MEDIAS,
  HISTOIRE,
  PHILOSOPHIE,
  SOCIETE,
  SECURITE,
  PROPRETE,
];

export const TOUTES_LES_ENTREES = THEMES.flatMap((t) => t.entrees);
export const themeDe = (id: string) => THEMES.find((t) => t.id === id);
