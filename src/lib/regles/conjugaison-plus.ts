import { CONJUGAISON_PLUS_A } from "./conjugaison-plus-a";
import { CONJUGAISON_PLUS_B } from "./conjugaison-plus-b";
import { CONJUGAISON_PLUS_C } from "./conjugaison-plus-c";
import type { Ajout } from "./types";

/* Les leçons de conjugaison ajoutées pour couvrir tout le programme, de A1 à C2 (voir index.ts). */
export const CONJUGAISON_PLUS: Ajout[] = [...CONJUGAISON_PLUS_A, ...CONJUGAISON_PLUS_B, ...CONJUGAISON_PLUS_C];
