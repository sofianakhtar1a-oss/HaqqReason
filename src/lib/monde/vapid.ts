import { createECDH, hkdfSync } from "node:crypto";

/*
 * Les clés VAPID des notifications du téléphone (Web Push), sans rien à saisir.
 *   1. Si VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY sont posées dans les variables du site, ce sont elles.
 *   2. Sinon le serveur tire sa propre paire du secret des sessions (SESSION_SECRET), comme le code
 *      à usage unique du créateur (totp.ts) : HKDF-SHA256 avec une étiquette à part, donc la paire
 *      ne révèle rien du secret. Elle reste la même tant que ce secret ne change pas, n'est écrite
 *      nulle part, et la clé privée ne quitte jamais le serveur. Si la clé change un jour, chaque
 *      téléphone abonné se réabonne seul à sa prochaine visite (Amis.tsx).
 * Ce fichier ne lit que ce qu'on lui donne : il ne sert que côté serveur (notifications.ts).
 */

export type ClesVapid = { publique: string; privee: string; origine: "variables" | "secret" };
export type SourceVapid = { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; SESSION_SECRET?: string };

// L'ordre de la courbe P-256 : une clé privée valable va de 1 à cet ordre moins 1.
const ORDRE_P256 = Buffer.from("ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551", "hex");

/** La paire tirée du secret des sessions (null si le secret manque ou fait moins de 32 caractères). */
export function clesVapidDuSecret(secret: string | undefined): ClesVapid | null {
  const s = secret?.trim() ?? "";
  if (s.length < 32) return null;
  // Une valeur hors de la courbe n'arrive presque jamais (une chance sur quatre milliards) : on retire alors.
  for (let essai = 0; essai < 8; essai++) {
    const brute = Buffer.from(hkdfSync("sha256", s, "haqqreason", essai ? `portulan-vapid-v1-${essai}` : "portulan-vapid-v1", 32));
    if (brute.every((octet) => octet === 0) || Buffer.compare(brute, ORDRE_P256) >= 0) continue;
    const courbe = createECDH("prime256v1");
    courbe.setPrivateKey(brute);
    return { publique: courbe.getPublicKey().toString("base64url"), privee: brute.toString("base64url"), origine: "secret" };
  }
  return null;
}

/** Les paires possibles, dans l'ordre où on les essaie : celles des variables du site, puis celle du secret. */
export function candidatsVapid(source: SourceVapid): ClesVapid[] {
  const candidats: ClesVapid[] = [];
  const publique = source.VAPID_PUBLIC_KEY?.trim();
  const privee = source.VAPID_PRIVATE_KEY?.trim();
  if (publique && privee) candidats.push({ publique, privee, origine: "variables" });
  const tiree = clesVapidDuSecret(source.SESSION_SECRET);
  if (tiree) candidats.push(tiree);
  return candidats;
}
