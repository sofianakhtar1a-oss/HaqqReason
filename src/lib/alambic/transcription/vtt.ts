/* Sous-titres WebVTT (relais YouTube) → fragments horodatés. Code pur, testé à part. */
import type { Fragment } from "./types";

const ENTITES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
export const decoder = (s: string) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (ENTITES[e]) return ENTITES[e];
    if (e.startsWith("#x")) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
    if (e.startsWith("#")) return String.fromCodePoint(Number(e.slice(1)));
    return m;
  });


function horodatageVtt(x: string): number {
  const p = x.trim().split(":").map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

/** WebVTT → fragments. Les sous-titres automatiques portent l'instant de chaque mot (<00:00:12.645>). */
export function depuisVtt(vtt: string): Fragment[] {
  const sortie: Fragment[] = [];
  let derniere = "";
  // Sous-titres automatiques : seules les répliques minutées mot à mot apportent du texte neuf.
  const automatiques = /<\d\d:\d\d:\d\d\.\d{3}>/.test(vtt);
  for (const bloc of vtt.replace(/\r/g, "").split(/\n\n+/)) {
    const lignes = bloc.split("\n");
    const i = lignes.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const [a, b] = lignes[i].split("-->");
    const d = horodatageVtt(a);
    const f = horodatageVtt(b.trim().split(/\s/)[0]);
    const texteBrut = lignes.slice(i + 1).filter((l) => l.trim());
    // Sous-titres automatiques : chaque réplique reprend la ligne précédente ; seule la ligne minutée est neuve.
    const minutee = texteBrut.find((l) => /<\d\d:\d\d/.test(l));
    if (minutee) {
      const mots: { t: string; d: number; f: number }[] = [];
      let instant = d;
      for (const morceau of minutee.split(/(<\d\d:\d\d:\d\d\.\d{3}>)/)) {
        const m = /<(\d\d:\d\d:\d\d\.\d{3})>/.exec(morceau);
        if (m) {
          instant = horodatageVtt(m[1]);
          continue;
        }
        for (const t of decoder(morceau.replace(/<[^>]+>/g, "")).split(/\s+/).filter(Boolean)) mots.push({ t, d: instant, f: instant });
      }
      mots.forEach((m, k) => (m.f = mots[k + 1]?.d ?? f));
      if (mots.length) sortie.push({ texte: mots.map((m) => m.t).join(" "), d: mots[0].d, f, mots });
      continue;
    }
    if (automatiques) continue;
    const texte = decoder(texteBrut.join(" ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (!texte || texte === derniere || /^\[[^\]]*\]$/.test(texte)) continue;
    // Ligne roulante : on ne garde que ce qui s'ajoute à la réplique d'avant.
    const neuf = derniere && texte.startsWith(derniere) ? texte.slice(derniere.length).trim() : texte;
    derniere = texte;
    if (neuf) sortie.push({ texte: neuf, d, f });
  }
  return sortie;
}

