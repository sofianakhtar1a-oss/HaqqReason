"use client";

/*
 * Les notifications du téléphone (Web Push), côté appareil : savoir si cet appareil est abonné,
 * l'abonner, le désabonner. Le même abonnement sert au Portulan et au Calame (un seul par appareil).
 */

export type EtatNotifications = "impossible" | "bientot" | "refuse" | "actif" | "inactif";

function cleBinaire(base64: string): Uint8Array<ArrayBuffer> {
  const propre = base64.replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(propre + "=".repeat((4 - (propre.length % 4)) % 4));
  const sortie = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

function service(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((ok) => setTimeout(() => ok(null), 3000))]);
}

async function cleDuSite(): Promise<string | null> {
  const r = await fetch("/api/monde/notifications", { cache: "no-store" }).catch(() => null);
  return r?.ok ? ((await r.json()) as { cle: string | null }).cle : null;
}

const envoyer = (corps: object) => fetch("/api/monde/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });

export async function etatNotifications(): Promise<EtatNotifications> {
  if (typeof window === "undefined" || !("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) return "impossible";
  const cle = await cleDuSite();
  if (!cle) return "bientot";
  if (Notification.permission === "denied") return "refuse";
  const reg = await service();
  if (!reg) return "impossible";
  const abonnement = await reg.pushManager.getSubscription().catch(() => null);
  return abonnement && Notification.permission === "granted" ? "actif" : "inactif";
}

export async function activerNotifications(): Promise<EtatNotifications> {
  const cle = await cleDuSite();
  if (!cle) return "bientot";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "refuse" : "inactif";
  const reg = await service();
  if (!reg) return "impossible";
  try {
    const abonnement = (await reg.pushManager.getSubscription().catch(() => null)) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleBinaire(cle) }));
    const json = abonnement.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
    const r = await envoyer({ action: "abonner", endpoint: json.endpoint, cles: json.keys });
    return r.ok ? "actif" : "inactif";
  } catch {
    return "inactif";
  }
}

/**
 * Sans rien demander : si cet appareil a déjà accepté les notifications, on s'assure qu'il est bien
 * abonné et connu du serveur (nouvelle clé du site, abonnement perdu). Aucune fenêtre ne s'ouvre.
 */
export async function abonnerEnSilence(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return false;
  return (await activerNotifications()) === "actif";
}

const CLE_DEMANDE = "hr-calame-notifications-demandees";

/**
 * Une seule fois par appareil, au premier geste de l'auteur (le navigateur l'exige) : demander
 * l'autorisation des notifications, pour que les rappels arrivent sans qu'il ait à chercher le bouton.
 */
export function demanderAuPremierGeste(): () => void {
  if (typeof window === "undefined" || !("Notification" in window) || !("PushManager" in window) || Notification.permission !== "default") return () => undefined;
  try {
    if (localStorage.getItem(CLE_DEMANDE)) return () => undefined;
  } catch {
    return () => undefined;
  }
  const auGeste = () => {
    window.removeEventListener("pointerup", auGeste, true);
    window.removeEventListener("keydown", auGeste, true);
    try {
      localStorage.setItem(CLE_DEMANDE, "1");
    } catch {
      // Stockage indisponible : on redemandera, tant pis.
    }
    void activerNotifications();
  };
  window.addEventListener("pointerup", auGeste, true);
  window.addEventListener("keydown", auGeste, true);
  return () => {
    window.removeEventListener("pointerup", auGeste, true);
    window.removeEventListener("keydown", auGeste, true);
  };
}
