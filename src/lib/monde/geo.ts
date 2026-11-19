import type { Pays } from "./types";

/*
 * Le Portulan : la géographie qu'on calcule (distances, directions, heures), partagée par la
 * fiche, la carte et les jeux. Aucune dépendance au DOM.
 */

export type LatLng = [number, number];

/** La Kaaba, à La Mecque. */
export const KAABA: LatLng = [21.4225, 39.8262];
const RAYON = 6371;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** La distance la plus courte à la surface de la Terre (orthodromie), en km. */
export function distanceKm([la1, lo1]: LatLng, [la2, lo2]: LatLng): number {
  const dLa = rad(la2 - la1);
  const dLo = rad(lo2 - lo1);
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * RAYON * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Le cap initial pour aller de a à b par le plus court chemin, en degrés (0 : nord, 90 : est). */
export function cap([la1, lo1]: LatLng, [la2, lo2]: LatLng): number {
  const f1 = rad(la1);
  const f2 = rad(la2);
  const dl = rad(lo2 - lo1);
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const POINTS = ["nord", "nord-est", "est", "sud-est", "sud", "sud-ouest", "ouest", "nord-ouest"] as const;
/** 92° → « est ». */
export const pointCardinal = (degres: number): (typeof POINTS)[number] => POINTS[Math.round((((degres % 360) + 360) % 360) / 45) % 8];

/** Les points du grand cercle entre a et b (pour tracer une route sur le globe). */
export function grandCercle(a: LatLng, b: LatLng, n = 64): LatLng[] {
  const [f1, l1] = [rad(a[0]), rad(a[1])];
  const [f2, l2] = [rad(b[0]), rad(b[1])];
  const d = distanceKm(a, b) / RAYON;
  if (d < 1e-9) return [a, b];
  const sortie: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const A = Math.sin((1 - t) * d) / Math.sin(d);
    const B = Math.sin(t * d) / Math.sin(d);
    const x = A * Math.cos(f1) * Math.cos(l1) + B * Math.cos(f2) * Math.cos(l2);
    const y = A * Math.cos(f1) * Math.sin(l1) + B * Math.cos(f2) * Math.sin(l2);
    const z = A * Math.sin(f1) + B * Math.sin(f2);
    sortie.push([deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))]);
  }
  return sortie;
}

/** Le point de départ d'un pays : sa capitale, sinon son centre. */
export const pointDe = (p: Pays): { latlng: LatLng; capitale: boolean } => (p.capLatLng ? { latlng: p.capLatLng, capitale: true } : { latlng: p.latlng, capitale: false });

/** La qibla depuis un pays : la direction de la Kaaba et la distance qui l'en sépare. */
export function qibla(p: Pays): { cap: number; km: number; depuis: string } {
  const { latlng, capitale } = pointDe(p);
  return { cap: cap(latlng, KAABA), km: distanceKm(latlng, KAABA), depuis: capitale && p.capitale ? p.capitale : `le centre du pays` };
}

/** La durée d'un vol direct, en gros (850 km/h, plus une demi-heure de décollage et d'atterrissage). */
export function dureeVol(km: number): string {
  const minutes = Math.round((km / 850) * 60 + 30);
  const h = Math.floor(minutes / 60);
  const m = Math.round((minutes % 60) / 5) * 5;
  if (!h) return `${Math.max(m, 30)} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/* ---------- Les heures ---------- */

/** L'heure qu'il est dans un fuseau (« 14:05 »). */
export function heureLocale(fuseau: string, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau, hour: "2-digit", minute: "2-digit" }).format(date);
  } catch {
    return "";
  }
}

/** Le décalage d'un fuseau avec le temps universel, en minutes, à une date donnée. */
export function decalageMinutes(fuseau: string, date = new Date()): number {
  try {
    const parties = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, timeZoneName: "longOffset" }).formatToParts(date);
    const t = parties.find((x) => x.type === "timeZoneName")?.value ?? "GMT";
    const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(t);
    if (!m) return 0;
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
  } catch {
    return 0;
  }
}

/** 60 → « UTC+1 » ; −210 → « UTC−3:30 » ; 0 → « UTC ». */
export function formatDecalage(minutes: number): string {
  if (!minutes) return "UTC";
  const signe = minutes > 0 ? "+" : "−";
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${signe}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** La différence d'heure avec un autre fuseau, en mots : « 2 h de plus qu'à Paris ». */
export function ecartHoraire(fuseau: string, reference = "Europe/Paris", date = new Date()): number {
  return decalageMinutes(fuseau, date) - decalageMinutes(reference, date);
}

/* ---------- Les nombres ---------- */

const fr = (x: string) => x.replace(/[  ]/g, " ");

/** Habitants au km² : « 123 hab./km² », « 0,4 hab./km² ». */
export function formatDensite(population: number | null, superficie: number | null): string | null {
  if (!population || !superficie) return null;
  const d = population / superficie;
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d < 10 ? 1 : 0 }).format(d);
  return `${fr(n)} hab./km²`;
}

/** 1 700 000 → « 1,7 million » ; 470 000 → « 470 000 ». */
export function formatVille(n: number): string {
  if (n >= 1e6) return `${fr(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n / 1e6))} million${n >= 2e6 ? "s" : ""}`;
  return fr(new Intl.NumberFormat("fr-FR").format(n));
}

/** 4 863,2 → « 4 863 km ». */
export const formatKm = (km: number): string => `${fr(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(km))} km`;
