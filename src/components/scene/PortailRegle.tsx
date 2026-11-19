import { lireReglages } from "@/lib/reglages-donnees";
import { Portail } from "./Portail";

/** La porte de lumière, à la durée choisie par le créateur (Paramètres → Animations). */
export async function PortailRegle() {
  const reglages = await lireReglages();
  return <Portail dureeMs={reglages.portail_duree_ms} />;
}
