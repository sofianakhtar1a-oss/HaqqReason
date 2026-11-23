import "server-only";
import { dbAdmin } from "@/lib/supabase";

export type ChiffresPremium = {
  actifs: { mois: number; annee: number };
  essais: number;
  resiliations: number;
  impayes: number;
  /** Revenu mensuel estimé (centimes) : abonnés au mois + un douzième des abonnés à l'année. */
  revenuMensuel: number;
  avis: { type: string; recu_le: string }[];
};

/** Les chiffres de l'offre, pour le créateur (lecture seule, aucune donnée personnelle). */
export async function chiffresPremium(): Promise<ChiffresPremium | null> {
  try {
    const base = dbAdmin();
    const [{ data: lignes, error }, { data: avis }] = await Promise.all([
      base.from("abonnements_premium").select("statut, formule, montant, resiliation_fin_periode").in("statut", ["active", "trialing", "past_due"]).limit(100_000),
      base.from("evenements_stripe").select("type, recu_le").order("recu_le", { ascending: false }).limit(8),
    ]);
    if (error) return null;
    const c: ChiffresPremium = { actifs: { mois: 0, annee: 0 }, essais: 0, resiliations: 0, impayes: 0, revenuMensuel: 0, avis: (avis ?? []) as ChiffresPremium["avis"] };
    for (const l of (lignes ?? []) as { statut: string; formule: string | null; montant: number | null; resiliation_fin_periode: boolean }[]) {
      if (l.statut === "trialing") c.essais++;
      if (l.statut === "past_due") c.impayes++;
      if (l.resiliation_fin_periode) c.resiliations++;
      if (l.formule === "annee") c.actifs.annee++;
      else c.actifs.mois++;
      if (l.statut === "active" && l.montant) c.revenuMensuel += l.formule === "annee" ? Math.round(l.montant / 12) : l.montant;
    }
    return c;
  } catch {
    return null;
  }
}
