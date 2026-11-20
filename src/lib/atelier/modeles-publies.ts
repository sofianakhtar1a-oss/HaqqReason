import "server-only";
import { randomUUID } from "node:crypto";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";

/*
 * Le Calame — les modèles publiés par le créateur, proposés à tous à la création d'un document.
 * Chacun est un petit fichier JSON rangé dans l'espace de stockage privé (dossier « calame-modeles ») :
 * pas de table à créer, et seul le serveur y écrit, après avoir vérifié la session du créateur.
 */

const DOSSIER = "calame-modeles";
const POIDS_MAX = 600_000;
const NOMBRE_MAX = 60;

export type ModelePublie = { id: string; titre: string; description: string; contenu: unknown; reglages: Record<string, unknown>; publie: string };

type Noeud = { type?: string; attrs?: Record<string, unknown>; content?: Noeud[] };

/** Un modèle ne transporte ni image ni pièce jointe : elles vivent sur l'appareil de celui qui les a ajoutées. */
function sansFichiers(n: Noeud): Noeud | null {
  if (n.type === "image" || n.type === "documentPdf") return null;
  const attrs = n.attrs ? { ...n.attrs } : undefined;
  if (attrs && "fichier" in attrs) attrs.fichier = null;
  return { ...n, ...(attrs ? { attrs } : {}), ...(n.content ? { content: n.content.map(sansFichiers).filter((x): x is Noeud => x !== null) } : {}) };
}

export function nettoyerModele(brut: unknown): Omit<ModelePublie, "id" | "publie"> | null {
  const o = (brut ?? {}) as Record<string, unknown>;
  const titre = typeof o.titre === "string" ? o.titre.trim().slice(0, 80) : "";
  const description = typeof o.description === "string" ? o.description.trim().slice(0, 160) : "";
  const contenu = o.contenu as Noeud | undefined;
  if (!titre || !contenu || contenu.type !== "doc" || !Array.isArray(contenu.content)) return null;
  const propre = sansFichiers(contenu);
  const reglages = o.reglages && typeof o.reglages === "object" && !Array.isArray(o.reglages) ? (o.reglages as Record<string, unknown>) : {};
  if (!propre || JSON.stringify({ propre, reglages }).length > POIDS_MAX) return null;
  return { titre, description, contenu: propre, reglages };
}

let cache: { quand: number; modeles: ModelePublie[] } | null = null;

export async function listerModelesPublies(): Promise<ModelePublie[]> {
  if (cache && Date.now() - cache.quand < 60_000) return cache.modeles;
  const { data, error } = await dbAdmin().storage.from(ESPACE).list(DOSSIER, { limit: NOMBRE_MAX, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return cache?.modeles ?? [];
  const modeles: ModelePublie[] = [];
  for (const f of data.filter((x) => x.name.endsWith(".json"))) {
    const { data: blob } = await dbAdmin().storage.from(ESPACE).download(`${DOSSIER}/${f.name}`);
    if (!blob) continue;
    try {
      const m = JSON.parse(await blob.text()) as ModelePublie;
      const propre = nettoyerModele(m);
      if (propre) modeles.push({ ...propre, id: f.name.replace(/\.json$/, ""), publie: typeof m.publie === "string" ? m.publie : (f.created_at ?? "") });
    } catch {
      // Un fichier abîmé est ignoré : les autres modèles restent proposés.
    }
  }
  cache = { quand: Date.now(), modeles };
  return modeles;
}

export async function publierModele(brut: unknown): Promise<string | "invalide" | null> {
  const propre = nettoyerModele(brut);
  if (!propre) return "invalide";
  const id = randomUUID();
  const contenu = JSON.stringify({ ...propre, id, publie: new Date().toISOString() });
  const { error } = await dbAdmin()
    .storage.from(ESPACE)
    .upload(`${DOSSIER}/${id}.json`, new Blob([contenu], { type: "application/json" }), { upsert: false, contentType: "application/json" });
  if (error) return null;
  cache = null;
  return id;
}

export async function retirerModele(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const { error } = await dbAdmin().storage.from(ESPACE).remove([`${DOSSIER}/${id}.json`]);
  cache = null;
  return !error;
}
