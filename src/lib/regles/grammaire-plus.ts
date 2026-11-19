import { GRAMMAIRE_PLUS_A } from "./grammaire-plus-a";
import { GRAMMAIRE_PLUS_B } from "./grammaire-plus-b";
import { GRAMMAIRE_PLUS_C } from "./grammaire-plus-c";
import type { Ajout } from "./types";

/* Les leçons de grammaire ajoutées pour couvrir tout le programme, de A1 à C2 (voir index.ts). */
export const GRAMMAIRE_PLUS: Ajout[] = [...GRAMMAIRE_PLUS_A, ...GRAMMAIRE_PLUS_B, ...GRAMMAIRE_PLUS_C];
