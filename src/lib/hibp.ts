import "server-only";
import { createHash } from "node:crypto";

/**
 * Vérifie si un mot de passe figure dans des fuites de données connues (service « Have I Been Pwned »).
 * Le mot de passe n'est jamais envoyé : seuls les 5 premiers caractères de son empreinte SHA-1 le sont.
 * Renvoie le nombre de fuites, ou null si le service est injoignable (on ne bloque pas dans ce cas).
 */
export async function nombreDeFuites(motDePasse: string): Promise<number | null> {
  const sha1 = createHash("sha1").update(motDePasse).digest("hex").toUpperCase();
  const prefixe = sha1.slice(0, 5);
  const suffixe = sha1.slice(5);
  try {
    const reponse = await fetch(`https://api.pwnedpasswords.com/range/${prefixe}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!reponse.ok) return null;
    const texte = await reponse.text();
    for (const ligne of texte.split("\n")) {
      const [fin, compte] = ligne.trim().split(":");
      if (fin === suffixe) return Number.parseInt(compte, 10) || 0;
    }
    return 0;
  } catch {
    return null;
  }
}
