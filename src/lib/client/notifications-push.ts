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
