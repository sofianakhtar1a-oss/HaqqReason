import "server-only";
import { notifier } from "@/lib/monde/notifications";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";
import { echeancesCandidates, lendemain, nettoyerRappel, rappelDu, veilleDue, type RappelEcriture } from "./rappels";

/*
 * Le Calame — l'envoi des rappels d'écriture (appelé tous les quarts d'heure, voir
 * .github/workflows/rappels-calame.yml). Les réglages sont ceux que l'auteur a choisis dans le Calame
 * (ses préférences, rangées sur son compte) ; ce qui est déjà parti est noté ici pour ne jamais
 * prévenir deux fois. Appeler plus souvent n'envoie rien de plus.
 */

const ETAT = "calame-rappels/etat.json";
const INTERVALLE_MIN = 4 * 60_000;

type Etat = { dernier: number; jour: Record<string, string>; veilles: Record<string, string> };

async function lireEtat(): Promise<Etat> {
  try {
    const { data } = await dbAdmin().storage.from(ESPACE).download(ETAT);
    if (data) {
      const o = JSON.parse(await data.text()) as Partial<Etat>;
      return { dernier: Number(o.dernier) || 0, jour: o.jour ?? {}, veilles: o.veilles ?? {} };
    }
  } catch {
    // Premier passage : rien d'envoyé.
  }
  return { dernier: 0, jour: {}, veilles: {} };
}

async function ecrireEtat(etat: Etat): Promise<boolean> {
  const { error } = await dbAdmin()
    .storage.from(ESPACE)
    .upload(ETAT, new Blob([JSON.stringify(etat)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  return !error;
}

type LignePref = { utilisateur_id: string; rappel: unknown; objectif: unknown };
type LigneDoc = { utilisateur_id: string; cle: string; titre: string | null; echeance: string | null; corbeille: string | null; archive: string | null };

const messageDuJour = (objectif: number) => ({
  titre: "Le Calame",
  corps: objectif > 0 ? `C'est l'heure d'écrire : ton objectif du jour est de ${objectif.toLocaleString("fr-FR")} mots.` : "C'est l'heure d'écrire : quelques lignes suffisent pour garder le fil.",
  url: "/ecrire",
  etiquette: "calame-rappel",
});

/** Un passage : envoie ce qui est dû. Renvoie ce qui est parti (ou « deja » si un passage vient d'avoir lieu). */
export async function envoyerRappels(maintenant = new Date()): Promise<{ deja: true } | { jour: number; veilles: number } | { erreur: string }> {
  const etat = await lireEtat();
  if (maintenant.getTime() - etat.dernier < INTERVALLE_MIN) return { deja: true };
  etat.dernier = maintenant.getTime();
  if (!(await ecrireEtat(etat))) return { erreur: "stockage" };

  const { data: prefs, error } = await dbAdmin()
    .from("donnees_utilisateur")
    .select("utilisateur_id, rappel:valeur->rappel, objectif:valeur->objectifQuotidien")
    .eq("magasin", "calame-preferences")
    .eq("cle", "preferences")
    .limit(10_000);
  if (error) return { erreur: "lecture" };
  const reglages = new Map<string, { r: RappelEcriture; objectif: number }>();
  for (const l of (prefs ?? []) as LignePref[]) reglages.set(l.utilisateur_id, { r: nettoyerRappel(l.rappel), objectif: Number(l.objectif) || 0 });

  let jour = 0;
  for (const [compte, { r, objectif }] of reglages) {
    const date = rappelDu(r, maintenant, etat.jour[compte]);
    if (!date) continue;
    etat.jour[compte] = date;
    await notifier(compte, messageDuJour(objectif));
    jour++;
  }

  // La veille d'une échéance : seuls les documents dont l'échéance tombe demain (quelque part) sont lus.
  let veilles = 0;
  const { data: docs } = await dbAdmin()
    .from("donnees_utilisateur")
    .select("utilisateur_id, cle, titre:valeur->>titre, echeance:valeur->>echeance, corbeille:valeur->>corbeille, archive:valeur->>archive")
    .eq("magasin", "calame-documents")
    .in("valeur->>echeance", echeancesCandidates(maintenant))
    .limit(5_000);
  for (const d of (docs ?? []) as LigneDoc[]) {
    if (!d.echeance || (d.corbeille && d.corbeille !== "null") || d.archive === "true") continue;
    const r = reglages.get(d.utilisateur_id)?.r ?? nettoyerRappel({});
    const cle = `${d.utilisateur_id}:${d.cle}`;
    if (!veilleDue(r, maintenant, d.echeance, etat.veilles[cle])) continue;
    etat.veilles[cle] = d.echeance;
    await notifier(d.utilisateur_id, { titre: "Le Calame : échéance demain", corps: `« ${(d.titre || "Document sans titre").slice(0, 80)} » est attendu demain.`, url: "/ecrire", etiquette: `calame-echeance-${d.cle}`.slice(0, 60) });
    veilles++;
  }

  // On oublie les veilles passées.
  const hier = new Date(maintenant.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
  for (const [cle, date] of Object.entries(etat.veilles)) if (lendemain(date) < hier) delete etat.veilles[cle];
  await ecrireEtat(etat);
  return { jour, veilles };
}

/** Un essai : la notification telle qu'elle arrivera. */
export async function essayerRappel(compte: string): Promise<void> {
  await notifier(compte, { titre: "Le Calame", corps: "Les rappels d'écriture arriveront ainsi, à l'heure choisie.", url: "/ecrire", etiquette: "calame-rappel" });
}
