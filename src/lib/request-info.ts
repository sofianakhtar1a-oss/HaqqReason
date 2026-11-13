import "server-only";
import { headers } from "next/headers";
import { hacherIp } from "./crypto";

/** Informations sur la requête en cours, sous forme anonymisée. */
export async function infosRequete(): Promise<{ ipHash: string; userAgent: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  return {
    ipHash: hacherIp(ip),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
}
