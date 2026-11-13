import "server-only";
import { cookies, headers } from "next/headers";
import { createHmac, randomBytes } from "node:crypto";
import { journaliser } from "./audit";
import { env } from "./env";
import { dbAdmin } from "./supabase";

/*
 * Reconnaissance des appareils du créateur.
 * Chaque appareil reçoit un identifiant aléatoire (cookie). La base n'en garde qu'une empreinte :
 * on peut dire « appareil déjà vu » sans rien savoir de plus. Une connexion depuis un appareil inconnu
 * est signalée dans l'espace créateur et dans le journal de sécurité.
 */

const EN_PRODUCTION = process.env.NODE_ENV === "production";
const NOM = EN_PRODUCTION ? "__Host-hr_appareil" : "hr_appareil";

export function libelleAppareil(ua: string): string {
  const systeme = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone ou iPad" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "appareil inconnu";
  const navigateur = /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return navigateur ? `${navigateur} sur ${systeme}` : systeme;
}

function empreinte(id: string): string {
  return createHmac("sha256", env("SESSION_SECRET")).update(`appareil:${id}`).digest("hex");
}

/** À appeler après chaque connexion réussie. Renvoie true si l'appareil était inconnu. */
export async function noterConnexion(dejaConfirme = false): Promise<boolean> {
  const pot = await cookies();
  let id = pot.get(NOM)?.value ?? "";
  if (!/^[a-f0-9]{64}$/.test(id)) id = randomBytes(32).toString("hex");
  pot.set(NOM, id, { httpOnly: true, secure: EN_PRODUCTION, sameSite: "lax", path: "/", maxAge: 400 * 24 * 60 * 60 });

  const cle = empreinte(id);
  const libelle = libelleAppareil((await headers()).get("user-agent") ?? "");
  const base = dbAdmin();
  const { data } = await base.from("appareils_connus").select("empreinte").eq("empreinte", cle).maybeSingle();
  if (data) {
    await base.from("appareils_connus").update({ derniere_connexion: new Date().toISOString(), libelle }).eq("empreinte", cle);
    return false;
  }
  await base.from("appareils_connus").insert({ empreinte: cle, libelle, confirme: dejaConfirme });
  if (!dejaConfirme) await journaliser("nouvel_appareil", { appareil: libelle });
  return !dejaConfirme;
}

export type Appareil = { empreinte: string; libelle: string; premiere_connexion: string; derniere_connexion: string; confirme: boolean };

export async function listerAppareils(): Promise<(Appareil & { celuiCi: boolean })[]> {
  const id = (await cookies()).get(NOM)?.value ?? "";
  const actuel = /^[a-f0-9]{64}$/.test(id) ? empreinte(id) : "";
  const { data } = await dbAdmin().from("appareils_connus").select("*").order("derniere_connexion", { ascending: false }).limit(50);
  return ((data ?? []) as Appareil[]).map((a) => ({ ...a, celuiCi: a.empreinte === actuel }));
}
