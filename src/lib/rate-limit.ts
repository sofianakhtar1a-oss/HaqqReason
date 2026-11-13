import "server-only";
import { dbAdmin } from "./supabase";

export type TypeTentative = "connexion" | "recuperation" | "configuration" | "double_authentification";

/**
 * Seuils d'échecs avant blocage. Chaque palier : [nombre d'échecs, fenêtre en minutes].
 * « parIp » protège contre un attaquant isolé, « global » contre une attaque répartie sur de nombreuses adresses.
 */
const SEUILS: Record<TypeTentative, { parIp: [number, number][]; global: [number, number] }> = {
  connexion: { parIp: [[5, 15], [10, 60]], global: [40, 60] },
  recuperation: { parIp: [[5, 60]], global: [15, 60] },
  configuration: { parIp: [[5, 60]], global: [15, 60] },
  double_authentification: { parIp: [[5, 15], [10, 60]], global: [30, 60] },
};

export type Verdict = { autorise: true } | { autorise: false; minutesRestantes: number };

/** À appeler AVANT de vérifier un secret : refuse si trop d'échecs récents. */
export async function verifierLimite(kind: TypeTentative, ipHash: string): Promise<Verdict> {
  const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await dbAdmin()
    .from("auth_attempts")
    .select("ip_hash, created_at")
    .eq("kind", kind)
    .eq("success", false)
    .gte("created_at", depuis)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    throw new Error(`Contrôle des tentatives impossible : ${error.message}`);
  }

  const maintenant = Date.now();
  const echecs = (data ?? []).map((ligne) => ({
    ip: ligne.ip_hash as string,
    quand: new Date(ligne.created_at as string).getTime(),
  }));
  const seuils = SEUILS[kind];
  let attente = 0;

  const evaluer = (liste: number[], max: number, fenetreMin: number) => {
    const fenetre = fenetreMin * 60 * 1000;
    const recents = liste.filter((quand) => maintenant - quand < fenetre);
    if (recents.length >= max) {
      // Le blocage se lève quand le « max »-ième échec le plus récent sort de la fenêtre.
      const liberation = recents[max - 1] + fenetre;
      attente = Math.max(attente, liberation - maintenant);
    }
  };

  const miens = echecs.filter((e) => e.ip === ipHash).map((e) => e.quand);
  for (const [max, fenetre] of seuils.parIp) evaluer(miens, max, fenetre);
  evaluer(echecs.map((e) => e.quand), seuils.global[0], seuils.global[1]);

  if (attente > 0) {
    return { autorise: false, minutesRestantes: Math.max(1, Math.ceil(attente / 60000)) };
  }
  return { autorise: true };
}

export async function enregistrerTentative(kind: TypeTentative, ipHash: string, success: boolean): Promise<void> {
  await dbAdmin().from("auth_attempts").insert({ kind, ip_hash: ipHash, success });
}
