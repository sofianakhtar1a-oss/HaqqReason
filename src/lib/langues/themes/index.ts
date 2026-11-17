/* Les thèmes de vocabulaire du Truchement (anglais → français). */
import { ECOLE, NATURE, VILLE } from "./ecole-ville-nature";
import { FAMILLE, TRAVAIL, VOYAGE } from "./famille-voyage-travail";
import { EMOTIONS, MAISON, METEO } from "./maison-emotions-meteo";
import { NOURRITURE, QUOTIDIEN, SANTE } from "./quotidien-nourriture-sante";

export const THEMES = [FAMILLE, QUOTIDIEN, NOURRITURE, MAISON, VOYAGE, VILLE, TRAVAIL, ECOLE, SANTE, EMOTIONS, METEO, NATURE];

export const TOUTES_LES_ENTREES = THEMES.flatMap((t) => t.entrees);
export const themeDe = (id: string) => THEMES.find((t) => t.id === id);
