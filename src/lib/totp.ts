import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/*
 * Double authentification par code à 6 chiffres (TOTP, RFC 6238), compatible avec
 * Google Authenticator, Microsoft Authenticator, Aegis, 2FAS, 1Password…
 * Le secret est chiffré (AES-256-GCM) avant d'être enregistré dans la base.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIODE = 30;

function base32(octets: Buffer): string {
  let bits = 0;
  let valeur = 0;
  let sortie = "";
  for (const o of octets) {
    valeur = (valeur << 8) | o;
    bits += 8;
    while (bits >= 5) {
      sortie += ALPHABET[(valeur >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) sortie += ALPHABET[(valeur << (5 - bits)) & 31];
  return sortie;
}

function depuisBase32(texte: string): Buffer {
  let bits = 0;
  let valeur = 0;
  const octets: number[] = [];
  for (const c of texte.replace(/[\s=]/g, "").toUpperCase()) {
    const i = ALPHABET.indexOf(c);
    if (i < 0) continue;
    valeur = (valeur << 5) | i;
    bits += 5;
    if (bits >= 8) {
      octets.push((valeur >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(octets);
}

export function nouveauSecret(): string {
  return base32(randomBytes(20));
}

function code(secret: string, pas: number): string {
  const compteur = Buffer.alloc(8);
  compteur.writeBigUInt64BE(BigInt(pas));
  const h = createHmac("sha1", depuisBase32(secret)).update(compteur).digest();
  const decalage = h[h.length - 1] & 15;
  const nombre = ((h[decalage] & 127) << 24) | (h[decalage + 1] << 16) | (h[decalage + 2] << 8) | h[decalage + 3];
  return String(nombre % 1_000_000).padStart(6, "0");
}

/**
 * Vérifie un code (tolère 30 secondes de décalage d'horloge). Renvoie le pas utilisé,
 * ou null si le code est faux ou a déjà servi (protection contre la réutilisation).
 */
export function verifierCode(saisie: string, secret: string, dernierPas: number, maintenant = Date.now()): number | null {
  const propre = saisie.replace(/\s/g, "");
  if (!/^\d{6}$/.test(propre)) return null;
  const actuel = Math.floor(maintenant / 1000 / PERIODE);
  for (const pas of [actuel - 1, actuel, actuel + 1]) {
    if (pas <= dernierPas) continue;
    const attendu = Buffer.from(code(secret, pas));
    if (timingSafeEqual(attendu, Buffer.from(propre))) return pas;
  }
  return null;
}

export function lienApplication(secret: string): string {
  return `otpauth://totp/HaqqReason:Createur?secret=${secret}&issuer=HaqqReason&algorithm=SHA1&digits=6&period=${PERIODE}`;
}

function cle(): Buffer {
  return Buffer.from(hkdfSync("sha256", env("SESSION_SECRET"), "haqqreason", "totp-secret-v1", 32));
}

export function chiffrer(secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(), iv);
  const chiffre = Buffer.concat([c.update(secret, "utf8"), c.final()]);
  return `v1.${Buffer.concat([iv, c.getAuthTag(), chiffre]).toString("base64")}`;
}

export function dechiffrer(paquet: string | null): string | null {
  if (!paquet?.startsWith("v1.")) return null;
  try {
    const brut = Buffer.from(paquet.slice(3), "base64");
    const d = createDecipheriv("aes-256-gcm", cle(), brut.subarray(0, 12));
    d.setAuthTag(brut.subarray(12, 28));
    return Buffer.concat([d.update(brut.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Pour les tests : code attendu à un instant donné. */
export function codeA(secret: string, instant: number): string {
  return code(secret, Math.floor(instant / 1000 / PERIODE));
}
