import "server-only";
import { dbAdmin } from "./supabase";
import { infosRequete } from "./request-info";

/** Inscrit une action dans le journal d'audit. Ne bloque jamais l'action elle-même. */
export async function journaliser(action: string, details: Record<string, unknown> = {}): Promise<void> {
  try {
    const { ipHash, userAgent } = await infosRequete();
    await dbAdmin().from("audit_log").insert({ action, details, ip_hash: ipHash, user_agent: userAgent });
  } catch {
    // Le journal est un filet de sécurité : son échec ne doit pas casser l'application.
  }
}
