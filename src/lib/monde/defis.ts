import { jourDeParis } from "./atlas";
import { deriver } from "./hasard";
import { type Question, questionMelangee } from "./quiz";

/*
 * Le Portulan : le défi du jour et le défi de la semaine. Les mêmes questions pour tout le
 * monde, tirées de la date (de Paris) : le navigateur et le serveur les retrouvent chacun de
 * leur côté. Une seule tentative ; le serveur juge les réponses et garde le score.
 */

export type SorteDefi = "jour" | "semaine";
export const QUESTIONS_DEFI: Record<SorteDefi, number> = { jour: 10, semaine: 20 };
/** Le niveau des faux choix : moyen pour le jour, relevé pour la semaine. */
const NIVEAU_DEFI: Record<SorteDefi, number> = { jour: 7, semaine: 12 };
export const DUREE_DEFI = 15_000;

/** Le lundi de la semaine (à Paris) d'une date AAAA-MM-JJ. */
export function lundiDe(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  const decalage = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - decalage);
  return d.toISOString().slice(0, 10);
}

/** La clé du défi en cours : la date du jour, ou celle du lundi. */
export function cleDefi(sorte: SorteDefi, maintenant = new Date()): string {
  const jour = jourDeParis(maintenant);
  return sorte === "jour" ? jour : lundiDe(jour);
}

function graineDe(texte: string): number {
  let h = 2166136261;
  for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Les questions du défi (toujours à choix, pour qu'il se joue partout de la même façon). */
export function questionsDefi(sorte: SorteDefi, cle: string): Question[] {
  const graine = graineDe(`portulan:defi:${sorte}:${cle}`);
  const sortie: Question[] = [];
  const vus = new Set<string>();
  for (let i = 0; sortie.length < QUESTIONS_DEFI[sorte] && i < 200; i++) {
    const q = questionMelangee(deriver(graine, i), NIVEAU_DEFI[sorte], true);
    if (q && !vus.has(q.cible)) {
      vus.add(q.cible);
      sortie.push(q);
    }
  }
  return sortie;
}

/** Le résultat à partager : des carrés, sans dévoiler les réponses. */
export function texteAPartager(sorte: SorteDefi, cle: string, resultats: boolean[], adresse: string, locale = "fr-FR"): string {
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${cle}T12:00:00Z`));
  const titre = sorte === "jour" ? `Le Portulan, défi du ${date}` : `Le Portulan, défi de la semaine du ${date}`;
  const carre = (x: boolean) => (x ? "🟩" : "🟥");
  // Dix carrés par ligne.
  const lignes: string[] = [];
  for (let i = 0; i < resultats.length; i += 10) lignes.push(resultats.slice(i, i + 10).map(carre).join(""));
  return `${titre} : ${resultats.filter(Boolean).length}/${resultats.length}\n${lignes.join("\n")}\n${adresse}`;
}
