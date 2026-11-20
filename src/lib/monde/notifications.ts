import "server-only";
import webpush from "web-push";
import { dbAdmin } from "@/lib/supabase";
import { candidatsVapid, type ClesVapid } from "./vapid";

/*
 * Les notifications du téléphone (Web Push). Elles marchent sans rien à saisir : si les clés
 * VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY sont posées dans les variables du site, ce sont elles ;
 * sinon le serveur tire sa propre paire du secret des sessions (voir vapid.ts).
 * VAPID_SUJET (une adresse « mailto: » ou « https:// ») reste facultatif : par défaut, le site.
 * Sans aucune clé utilisable, rien ne part et le module le dit (« bientôt ») : le reste fonctionne.
 */

export type Message = { titre: string; corps: string; url: string; etiquette?: string };

const SUJET_PAR_DEFAUT = "https://haqqreason.vercel.app";
function sujetVapid(): string {
  const sujet = process.env.VAPID_SUJET?.trim();
  return sujet && /^(mailto:|https:\/\/)/.test(sujet) ? sujet : SUJET_PAR_DEFAUT;
}

// La première paire que web-push accepte : une paire mal recopiée dans les variables laisse la place à l'autre.
let choisies: ClesVapid | null | undefined;
function clesVapid(): ClesVapid | null {
  if (choisies !== undefined) return choisies;
  const source = { VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY, SESSION_SECRET: process.env.SESSION_SECRET };
  for (const cles of candidatsVapid(source)) {
    try {
      webpush.setVapidDetails(sujetVapid(), cles.publique, cles.privee);
      return (choisies = cles);
    } catch {
      // Paire illisible : la suivante.
    }
  }
  return (choisies = null);
}

export const clePubliqueVapid = (): string | null => clesVapid()?.publique ?? null;

const pret = (): boolean => clesVapid() !== null;

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
