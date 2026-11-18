import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/*
 * Chiffrement de la clé API Anthropic de chaque compte (AES-256-GCM).
 *   • La clé de chiffrement est dérivée par HKDF d'un secret du serveur, avec un usage propre
 *     à l'assistant : elle ne sert à rien d'autre. Ce secret est ASSISTANT_CLE_SECRET s'il est
 *     réglé (recommandé : il survit à un changement de SESSION_SECRET), sinon SESSION_SECRET.
 *   • Le chiffrement est LIÉ AU COMPTE (donnée authentifiée = identifiant du compte) : une clé
 *     chiffrée recopiée sur la ligne d'un autre compte ne se déchiffre pas.
 *   • Format : « v1. » + base64(iv 12 octets | étiquette 16 octets | texte chiffré).
 * Si le secret change, les clés déjà enregistrées deviennent illisibles : chacun recolle la sienne
 * (l'assistant le lui demande). Une clé chiffrée avec SESSION_SECRET reste lisible après l'ajout
 * d'ASSISTANT_CLE_SECRET.
 */

function secrets(): string[] {
  const liste = [process.env.ASSISTANT_CLE_SECRET?.trim(), process.env.SESSION_SECRET?.trim()].filter((s): s is string => Boolean(s && s.length >= 32));
  if (!liste.length) throw new Error("ASSISTANT_CLE_SECRET ou SESSION_SECRET manquant (32 caractères au moins).");
  return [...new Set(liste)];
}

const deriver = (secret: string) => Buffer.from(hkdfSync("sha256", secret, "haqqreason", "assistant-cle-api-v1", 32));
const aad = (utilisateurId: string) => Buffer.from(`compte:${utilisateurId}`, "utf8");

export function chiffrerCle(cleApi: string, utilisateurId: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", deriver(secrets()[0]), iv);
  c.setAAD(aad(utilisateurId));
  const chiffre = Buffer.concat([c.update(cleApi, "utf8"), c.final()]);
  return `v1.${Buffer.concat([iv, c.getAuthTag(), chiffre]).toString("base64")}`;
}

/** Renvoie la clé en clair, ou null si le paquet est abîmé, falsifié, ou chiffré pour un autre compte. */
export function dechiffrerCle(paquet: string | null | undefined, utilisateurId: string): string | null {
  if (!paquet?.startsWith("v1.")) return null;
  let brut: Buffer;
  try {
    brut = Buffer.from(paquet.slice(3), "base64");
  } catch {
    return null;
  }
  if (brut.length < 29) return null;
  for (const secret of secrets()) {
    try {
      const d = createDecipheriv("aes-256-gcm", deriver(secret), brut.subarray(0, 12));
      d.setAAD(aad(utilisateurId));
      d.setAuthTag(brut.subarray(12, 28));
      return Buffer.concat([d.update(brut.subarray(28)), d.final()]).toString("utf8");
    } catch {
      // Essai suivant : l'ancien secret.
    }
  }
  return null;
}
