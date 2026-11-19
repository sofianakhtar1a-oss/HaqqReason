"use client";

/*
 * L'image d'un résultat (duel, salon, campagne), à partager : une carte marine de lapis, des lignes
 * de rhumb à l'encre d'or, le verdict en Literata, les deux scores. Partagée comme fichier quand le
 * téléphone le permet, téléchargée sinon.
 */

import { enLangue, langueInterface, localeInterface } from "./traduction";

export type CarteResultat = {
  /** « Victoire ! », « Égalité », « 2e sur 6 »… */
  verdict: string;
  /** Une ligne sous le titre : « Duel, drapeaux, 10 questions ». */
  sousTitre: string;
  /** Les joueurs et leurs points (un seul : un résultat sans adversaire). */
  joueurs: { nom: string; points: number; moi?: boolean }[];
  /** Une ligne au pied de l'image (la date, par exemple). */
  pied?: string;
};

const SERIF = "'Literata Variable', Georgia, serif";
const ARABE = "'Noto Sans Arabic Variable'";
const SANS = "'Instrument Sans Variable', system-ui, sans-serif";
const fr = (n: number) => new Intl.NumberFormat(localeInterface()).format(n).replace(/[  ]/g, " ");

export async function imageResultat(c: CarteResultat): Promise<Blob | null> {
  const L = 1080;
  const H = 1080;
  const toile = document.createElement("canvas");
  toile.width = L;
  toile.height = H;
  const ctx = toile.getContext("2d");
  if (!ctx) return null;
  try {
    await document.fonts?.ready;
  } catch {
    // Les polices de secours feront l'affaire.
  }
  // La mer de lapis.
  const fond = ctx.createRadialGradient(L * 0.35, H * 0.3, 40, L / 2, H / 2, L * 0.85);
  fond.addColorStop(0, "#22388a");
  fond.addColorStop(1, "#0a1340");
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, L, H);
  // Les lignes de rhumb, depuis une rose des vents.
  const [rx, ry] = [L * 0.78, H * 0.2];
  ctx.strokeStyle = "rgba(233, 190, 106, 0.16)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(a) * 1600, ry + Math.sin(a) * 1600);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(233, 190, 106, 0.45)";
  ctx.lineWidth = 2;
  for (const r of [46, 62]) {
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(233, 190, 106, 0.85)";
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(rx + Math.cos(a) * 58, ry + Math.sin(a) * 58);
    ctx.lineTo(rx + Math.cos(a + Math.PI / 2) * 9, ry + Math.sin(a + Math.PI / 2) * 9);
    ctx.lineTo(rx + Math.cos(a - Math.PI / 2) * 9, ry + Math.sin(a - Math.PI / 2) * 9);
    ctx.closePath();
    ctx.fill();
  }
  // Un cadre d'or.
  ctx.strokeStyle = "rgba(233, 190, 106, 0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, L - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, L - 96, H - 96);

  // En arabe : de droite à gauche, sans italique, dans une police qui a ses lettres.
  const ar = langueInterface() === "ar";
  ctx.direction = ar ? "rtl" : "ltr";
  const serif = ar ? `${ARABE}, ${SERIF}` : SERIF;
  const sans = ar ? `${ARABE}, ${SANS}` : SANS;
  const italique = ar ? "" : "italic ";
  const debut = ar ? L - 96 : 96;
  const fin = ar ? 96 : L - 96;
  const verdict = enLangue(c.verdict);

  ctx.textAlign = "start";
  ctx.fillStyle = "#e9be6a";
  ctx.font = `${italique}600 52px ${serif}`;
  ctx.fillText(enLangue("Le Portulan"), debut, 150);
  ctx.fillStyle = "rgba(251, 244, 226, 0.78)";
  ctx.font = `500 30px ${sans}`;
  ctx.fillText(enLangue(c.sousTitre), debut, 200);

  ctx.fillStyle = "#ffa65c";
  ctx.font = `${italique}700 ${verdict.length > 14 ? 92 : 120}px ${serif}`;
  ctx.fillText(verdict, debut, 380);

  // Les joueurs : un rang, un nom, des points (les miens en safran).
  const joueurs = c.joueurs.slice(0, 6);
  const haut = 470;
  const pas = joueurs.length > 3 ? 82 : 110;
  joueurs.forEach((j, i) => {
    const y = haut + i * pas;
    ctx.fillStyle = j.moi ? "rgba(255, 166, 92, 0.16)" : "rgba(251, 244, 226, 0.06)";
    ctx.beginPath();
    ctx.roundRect(88, y, L - 176, pas - 18, 22);
    ctx.fill();
    ctx.fillStyle = j.moi ? "#ffd9b5" : "#fbf4e2";
    ctx.font = `600 ${joueurs.length > 3 ? 36 : 44}px ${sans}`;
    ctx.textBaseline = "middle";
    // Seuls « Moi » et « Adversaire » se traduisent : les autres noms sont ceux des joueurs.
    ctx.fillText((j.moi || j.nom === "Adversaire" ? enLangue(j.nom) : j.nom).slice(0, 26), ar ? L - 124 : 124, y + (pas - 18) / 2);
    ctx.textAlign = "end";
    ctx.fillStyle = j.moi ? "#ffa65c" : "#e9be6a";
    ctx.font = `${italique}700 ${joueurs.length > 3 ? 40 : 52}px ${serif}`;
    ctx.fillText(`${fr(j.points)} ${ar ? "نقطة" : "pts"}`, ar ? 124 : L - 124, y + (pas - 18) / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  });

  ctx.fillStyle = "rgba(251, 244, 226, 0.6)";
  ctx.font = `500 26px ${sans}`;
  ctx.fillText(c.pied ? enLangue(c.pied) : new Intl.DateTimeFormat(localeInterface(), { dateStyle: "long" }).format(new Date()), debut, H - 96);
  ctx.textAlign = "end";
  ctx.fillText("HaqqReason", fin, H - 96);
  return new Promise((ok) => toile.toBlob((b) => ok(b), "image/png"));
}

/** Partager l'image (le téléphone propose ses applications), ou la télécharger. */
export async function partagerImage(blob: Blob, nom: string, texte: string): Promise<"partage" | "telecharge" | "annule"> {
  const fichier = new File([blob], nom, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [fichier] })) {
      await navigator.share({ files: [fichier], text: enLangue(texte) });
      return "partage";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "annule";
  }
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(lien.href), 4000);
  return "telecharge";
}
