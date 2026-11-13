import "server-only";
import { argon2id, argon2Verify } from "hash-wasm";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { ALPHABET_CLE, GROUPES_CLE, TAILLE_GROUPE } from "./recovery-key";

/** Paramètres Argon2id (au-dessus du minimum recommandé par l'OWASP). */
const ARGON2 = { parallelism: 1, iterations: 3, memorySize: 32768, hashLength: 32 } as const;

/** Transforme un secret (mot de passe ou clé) en empreinte irréversible. */
export async function hacherSecret(secret: string): Promise<string> {
  return argon2id({
    password: secret.normalize("NFKC"),
    salt: randomBytes(16),
    ...ARGON2,
    outputType: "encoded",
  });
}

export async function verifierSecret(secret: string, empreinte: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: secret.normalize("NFKC"), hash: empreinte });
  } catch {
    return false;
  }
}

/** Génère une clé de récupération : 5 groupes de 4 caractères, tirés par un générateur cryptographique. */
export function genererCleRecuperation(): string {
  let brute = "";
  for (let i = 0; i < GROUPES_CLE * TAILLE_GROUPE; i++) {
    brute += ALPHABET_CLE[randomInt(ALPHABET_CLE.length)];
  }
  return brute;
}

/** Comparaison à temps constant de deux chaînes. */
export function egaliteSure(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Empreinte anonyme d'une adresse IP : permet de limiter les tentatives sans stocker l'adresse. */
export function hacherIp(ip: string): string {
  return createHmac("sha256", env("SESSION_SECRET")).update(`ip:${ip}`).digest("hex").slice(0, 32);
}
