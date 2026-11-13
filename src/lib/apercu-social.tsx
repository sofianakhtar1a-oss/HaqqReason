import { ImageResponse } from "next/og";

/** Image d'aperçu (1200×630) affichée quand un lien HaqqReason est partagé sur un réseau social ou une messagerie. */
export const TAILLE_APERCU = { width: 1200, height: 630 };

const COULEURS: Record<string, string> = { or: "#e9be6a", emeraude: "#45d3a6", amethyste: "#b49cff" };

export function imageApercu({ titre, surtitre, accent = "or" }: { titre: string; surtitre: string; accent?: string }) {
  const couleur = COULEURS[accent] ?? COULEURS.or;
  const court = titre.length > 110 ? `${titre.slice(0, 107)}…` : titre;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `radial-gradient(circle at 85% 0%, ${couleur}55, transparent 55%), linear-gradient(160deg, #16225c, #0b1233 65%)`,
          color: "#f4efe1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 46, height: 46, borderRadius: 999, border: `5px solid ${couleur}`, display: "flex" }} />
          HaqqReason
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 30, color: couleur, display: "flex" }}>{surtitre}</div>
          <div style={{ fontSize: court.length > 60 ? 62 : 78, fontWeight: 800, lineHeight: 1.05, display: "flex", borderLeft: `10px solid ${couleur}`, paddingLeft: 32 }}>
            {court}
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#b9bbd3", display: "flex" }}>Bibliothèque d&apos;apologétique islamique</div>
      </div>
    ),
    TAILLE_APERCU,
  );
}
