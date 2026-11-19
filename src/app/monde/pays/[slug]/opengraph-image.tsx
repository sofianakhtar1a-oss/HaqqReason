import { motCapitale, NOM_CONTINENT, urlDrapeau } from "@/lib/monde/atlas";
import { planchePortulan, TAILLE_APERCU_PORTULAN } from "@/lib/monde/apercu-portulan";
import { paysDuSlug } from "@/lib/monde/pages-publiques";

export const size = TAILLE_APERCU_PORTULAN;
export const contentType = "image/png";
export const alt = "Un pays du monde, dans Le Portulan";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = paysDuSlug((await params).slug);
  if (!p) return planchePortulan({ titre: "Les pays du monde", ligne: "Capitales, drapeaux, cartes et chiffres", pied: "Apprendre la géographie en jouant" });
  return planchePortulan({
    titre: p.nom,
    ligne: p.capitale ? `${motCapitale(p)} : ${p.capitale} · ${NOM_CONTINENT[p.continent]}` : NOM_CONTINENT[p.continent],
    pied: "Drapeau, capitale, population, devise et histoire",
    drapeau: urlDrapeau(p),
  });
}
