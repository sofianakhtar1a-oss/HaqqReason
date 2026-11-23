import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DicteeNumerotee } from "./dictees";
import { ficheHistoire, type Histoire } from "./histoires/catalogue";
import { NIVEAUX, type Niveau } from "./types";

/*
 * Le texte des histoires et des dictées, rangé hors du dossier public (donnees/langues/) : il ne
 * quitte le serveur qu'après vérification des droits (certaines parties sont réservées à Premium).
 * Les fichiers ne changent qu'à chaque mise en ligne : ils sont gardés en mémoire une fois lus.
 */

const DOSSIER = path.join(process.cwd(), "donnees", "langues");
const ID = /^[a-z0-9-]{1,80}$/;
const memoire = new Map<string, Promise<unknown>>();

function lire<T>(fichier: string): Promise<T> {
  let p = memoire.get(fichier) as Promise<T> | undefined;
  if (!p) {
    p = readFile(fichier, "utf8").then((t) => JSON.parse(t) as T);
    p.catch(() => memoire.delete(fichier));
    memoire.set(fichier, p);
  }
  return p;
}

export function estNiveau(n: unknown): n is Niveau {
  return typeof n === "string" && (NIVEAUX as readonly string[]).includes(n);
}

/** La partie Premium dont relève une histoire, selon son niveau. */
export function fonctionHistoire(niveau: Niveau): string {
  return niveau.startsWith("A") ? "truchement.histoires-a" : niveau.startsWith("B") ? "truchement.histoires-b" : "truchement.histoires-c";
}

/** Une histoire du catalogue (jamais un autre fichier : l'identifiant doit y figurer). */
export async function lireHistoire(id: string): Promise<{ histoire: Histoire; niveau: Niveau } | null> {
  if (!ID.test(id)) return null;
  const fiche = ficheHistoire(id);
  if (!fiche) return null;
  try {
    return { histoire: await lire<Histoire>(path.join(DOSSIER, "histoires", `${fiche.id}.json`)), niveau: fiche.niveau };
  } catch {
    return null;
  }
}

export async function lireDictees(niveau: Niveau): Promise<DicteeNumerotee[]> {
  if (!estNiveau(niveau)) return [];
  try {
    const l = await lire<unknown>(path.join(DOSSIER, "dictees", `${niveau}.json`));
    return Array.isArray(l) ? (l as DicteeNumerotee[]) : [];
  } catch {
    return [];
  }
}
