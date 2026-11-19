import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { adresseDuSite } from "@/lib/site";

/*
 * L'image d'aperçu (1200 × 630) des pages publiques du Portulan : ce qu'affichent WhatsApp,
 * Messenger, X ou Google quand on partage la page d'un pays ou une invitation à un duel.
 * Une planche d'atlas : la mer de lapis, la rose des vents, le titre en italique, le drapeau encadré d'or.
 */

export const TAILLE_APERCU_PORTULAN = { width: 1200, height: 630 };

/** La rose des vents du Portulan (la même que son icône), dessinée en SVG. */
const ROSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-180 -180 360 360"><circle r="150" fill="none" stroke="#e9be6a" stroke-opacity="0.6" stroke-width="5"/><g fill="#e9be6a" opacity="0.7"><path d="M0 -112 L16 -16 L0 0 Z" transform="rotate(45)"/><path d="M0 -112 L-16 -16 L0 0 Z" transform="rotate(45)"/><path d="M0 -112 L16 -16 L0 0 Z" transform="rotate(135)"/><path d="M0 -112 L-16 -16 L0 0 Z" transform="rotate(135)"/><path d="M0 -112 L16 -16 L0 0 Z" transform="rotate(225)"/><path d="M0 -112 L-16 -16 L0 0 Z" transform="rotate(225)"/><path d="M0 -112 L16 -16 L0 0 Z" transform="rotate(315)"/><path d="M0 -112 L-16 -16 L0 0 Z" transform="rotate(315)"/></g><path d="M0 -178 L26 -24 L0 0 Z" fill="#ffa65c"/><path d="M0 -178 L-26 -24 L0 0 Z" fill="#d8742f"/><path d="M0 178 L26 24 L0 0 Z" fill="#c99a45"/><path d="M0 178 L-26 24 L0 0 Z" fill="#f3d692"/><path d="M178 0 L24 26 L0 0 Z" fill="#c99a45"/><path d="M178 0 L24 -26 L0 0 Z" fill="#f3d692"/><path d="M-178 0 L-24 26 L0 0 Z" fill="#f3d692"/><path d="M-178 0 L-24 -26 L0 0 Z" fill="#c99a45"/><circle r="14" fill="#0b1233" stroke="#f3d692" stroke-width="5"/></svg>`;
const ROSE_URI = `data:image/svg+xml;base64,${Buffer.from(ROSE).toString("base64")}`;

let police: Promise<ArrayBuffer | null> | null = null;
function lirePolice(): Promise<ArrayBuffer | null> {
  police ??= readFile(join(process.cwd(), "assets/polices/amiri-latin-700-italic.woff"))
    .then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer)
    .catch(() => null);
  return police;
}

/** Le drapeau en image intégrée : lu sur le disque si possible, sinon sur le site ; avec son rapport largeur / hauteur. */
async function lireDrapeau(chemin: string): Promise<{ uri: string; rapport: number } | null> {
  if (!/^\/monde\/(drapeaux|emblemes)\/[0-9a-f]+\.svg$/.test(chemin)) return null;
  let svg: string | null = await readFile(join(process.cwd(), "public", chemin), "utf8").catch(() => null);
  if (!svg) {
    const controle = new AbortController();
    const delai = setTimeout(() => controle.abort(), 4000);
    svg = await fetch(new URL(chemin, adresseDuSite()), { signal: controle.signal })
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null)
      .finally(() => clearTimeout(delai));
  }
  if (!svg) return null;
  const vb = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(svg);
  const l = /\swidth="([\d.]+)(?:px)?"/.exec(svg);
  const h = /\sheight="([\d.]+)(?:px)?"/.exec(svg);
  const rapport = vb ? Number(vb[1]) / Number(vb[2]) : l && h ? Number(l[1]) / Number(h[1]) : 1.5;
  return { uri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, rapport: Number.isFinite(rapport) && rapport > 0 ? rapport : 1.5 };
}

type Planche = {
  /** Le grand titre (le nom du pays, « Un duel t'attend »). */
  titre: string;
  /** La ligne sous le titre (« Capitale : Rabat · Afrique »). */
  ligne: string;
  /** Une dernière ligne, plus discrète. */
  pied: string;
  /** Le drapeau à encadrer : son adresse sur le site (/monde/drapeaux/…svg). */
  drapeau?: string;
  /** Un code à montrer en grand (une invitation). */
  code?: string;
};

export async function planchePortulan({ titre, ligne, pied, drapeau: chemin, code }: Planche): Promise<ImageResponse> {
  const [serif, drapeau] = await Promise.all([lirePolice(), chemin ? lireDrapeau(chemin) : Promise.resolve(null)]);
  // Le drapeau tient dans 400 × 300, sans être coupé.
  const rapport = drapeau?.rapport ?? 1.5;
  const largeurDrapeau = rapport >= 400 / 300 ? 400 : Math.round(300 * rapport);
  const hauteurDrapeau = Math.round(largeurDrapeau / rapport);
  const taille = titre.length > 22 ? 78 : titre.length > 14 ? 96 : 116;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          padding: "64px 72px",
          background: "radial-gradient(circle at 78% 30%, #22327f 0%, #121c4f 48%, #0b1233 100%)",
          color: "#f4efe1",
          fontFamily: "sans-serif",
        }}
      >
        {/* Le cadre d'or, comme une planche d'atlas. */}
        <div style={{ position: "absolute", top: 24, left: 24, right: 24, bottom: 24, border: "2px solid rgba(233, 190, 106, 0.45)", borderRadius: 18, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: drapeau || code ? 40 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ROSE_URI} width={64} height={64} alt="" />
            <div style={{ display: "flex", fontSize: 40, color: "#e9be6a", fontFamily: serif ? "Amiri" : "serif", fontStyle: "italic" }}>Le Portulan</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", fontSize: taille, lineHeight: 1.02, fontFamily: serif ? "Amiri" : "serif", fontStyle: "italic", fontWeight: 700 }}>{titre}</div>
            <div style={{ display: "flex", fontSize: 36, color: "#d9dbef" }}>{ligne}</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#b9bbd3" }}>{pied}</div>
        </div>
        {drapeau && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", padding: 10, borderRadius: 14, background: "rgba(233, 190, 106, 0.18)", border: "2px solid rgba(233, 190, 106, 0.6)", boxShadow: "0 30px 60px rgba(0, 0, 0, 0.45)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={drapeau.uri} width={largeurDrapeau} height={hauteurDrapeau} alt="" style={{ borderRadius: 6 }} />
            </div>
          </div>
        )}
        {code && !drapeau && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "34px 40px", borderRadius: 22, border: "2px solid rgba(255, 166, 92, 0.7)", background: "rgba(255, 166, 92, 0.1)" }}>
              <div style={{ display: "flex", fontSize: 28, color: "#ffd9b5" }}>Le code</div>
              <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: 10, color: "#ffa65c" }}>{code}</div>
            </div>
          </div>
        )}
      </div>
    ),
    { ...TAILLE_APERCU_PORTULAN, fonts: serif ? [{ name: "Amiri", data: serif, style: "italic", weight: 700 }] : undefined },
  );
}
