import "server-only";
import webpush from "web-push";
import { dbAdmin } from "@/lib/supabase";

/*
 * Les notifications du téléphone (Web Push). Elles partent seulement si les clés VAPID sont
 * posées dans les variables d'environnement du site :
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (et VAPID_SUJET, une adresse « mailto: » ou le site).
 * Sans elles, rien ne part et le module le dit (« bientôt ») : le reste fonctionne.
 */

export type Message = { titre: string; corps: string; url: string; etiquette?: string };

export const clePubliqueVapid = (): string | null => process.env.VAPID_PUBLIC_KEY?.trim() || null;

let prete: boolean | null = null;
function pret(): boolean {
  if (prete !== null) return prete;
  const publique = clePubliqueVapid();
  const privee = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publique || !privee) return (prete = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUJET?.trim() || "https://haqqreason.vercel.app", publique, privee);
    return (prete = true);
  } catch {
    return (prete = false);
  }
}

/** Prévenir un compte sur tous ses appareils abonnés ; les abonnements morts s'effacent. */
export async function notifier(utilisateur: string, message: Message): Promise<void> {
  if (!pret()) return;
  try {
    const { data, error } = await dbAdmin().rpc("portulan_abonnements_de", { p_utilisateur: utilisateur });
    if (error || !Array.isArray(data)) return;
    const corps = JSON.stringify({ titre: message.titre.slice(0, 80), corps: message.corps.slice(0, 200), url: message.url, etiquette: message.etiquette ?? "portulan" });
    await Promise.allSettled(
      (data as { endpoint: string; cles: { p256dh: string; auth: string } }[]).map(async (a) => {
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: a.cles }, corps, { TTL: 6 * 3600, urgency: "normal" });
        } catch (e) {
          const statut = (e as { statusCode?: number }).statusCode;
          if (statut === 404 || statut === 410) await dbAdmin().rpc("portulan_desabonner", { p_utilisateur: utilisateur, p_endpoint: a.endpoint });
        }
      }),
    );
  } catch {
    // Une notification perdue n'empêche rien.
  }
}

export async function abonner(compte: string, endpoint: string, cles: { p256dh: string; auth: string }): Promise<{ ok: true } | { erreur: "indisponible" | "illisible" }> {
  try {
    const { data, error } = await dbAdmin().rpc("portulan_abonner", { p_utilisateur: compte, p_endpoint: endpoint, p_cles: cles });
    if (error || !data) return { erreur: "indisponible" };
    const r = data as { ok?: boolean; erreur?: string };
    if (r.erreur) return { erreur: r.erreur === "illisible" ? "illisible" : "indisponible" };
    return { ok: true };
  } catch {
    return { erreur: "indisponible" };
  }
}

export async function desabonner(compte: string, endpoint: string): Promise<{ ok: true } | { erreur: "indisponible" }> {
  try {
    const { error } = await dbAdmin().rpc("portulan_desabonner", { p_utilisateur: compte, p_endpoint: endpoint });
    return error ? { erreur: "indisponible" } : { ok: true };
  } catch {
    return { erreur: "indisponible" };
  }
}
