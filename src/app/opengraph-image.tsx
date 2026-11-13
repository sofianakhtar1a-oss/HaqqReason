import { imageApercu, TAILLE_APERCU } from "@/lib/apercu-social";

export const size = TAILLE_APERCU;
export const contentType = "image/png";
export const alt = "HaqqReason";

export default function Image() {
  return imageApercu({ titre: "La véracité de l'islam, sa défense, la réfutation des autres croyances", surtitre: "Bibliothèque" });
}
