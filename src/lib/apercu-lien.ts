import "server-only";
import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { signatureValide, TYPES_FICHIERS } from "./fichiers";
import { domaine, infosYoutube } from "./liens-web";
import { ESPACE } from "./stockage";
import { dbAdmin } from "./supabase";

/*
 * Aperçu d'un lien collé dans un article (titre, description, vignette), à la manière de Notion.
 * Sécurité : seules les adresses web publiques sont interrogées (les adresses internes du serveur sont refusées),
 * avec un délai maximal, une taille maximale et des redirections contrôlées. La vignette est recopiée dans
 * l'espace de stockage privé : les lecteurs ne contactent jamais le site d'origine pour l'afficher.
 */

export type Apercu = { url: string; titre: string; description: string; site: string; auteur: string; genre: "web" | "youtube"; video: string; liste: string; image: string };

const DELAI_MS = 6000;
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 5_000_000;
// Réservé aux tests automatiques : ne jamais définir cette variable sur le site en ligne.
const LOCAL_AUTORISE = process.env.APERCU_AUTORISER_LOCAL === "1";

function adressePrivee(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const bas = ip.toLowerCase();
  return bas === "::1" || bas === "::" || bas.startsWith("fc") || bas.startsWith("fd") || bas.startsWith("fe80") || bas.startsWith("::ffff:127.") || bas.startsWith("::ffff:10.") || bas.startsWith("::ffff:192.168.");
}

async function adresseAutorisee(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  if (LOCAL_AUTORISE) return true;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const hote = url.hostname.replace(/^\[|\]$/g, "");
  if (hote === "localhost" || hote.endsWith(".local") || hote.endsWith(".internal")) return false;
  try {
    const adresses = isIP(hote) ? [{ address: hote }] : await lookup(hote, { all: true });
    return adresses.length > 0 && adresses.every((a) => !adressePrivee(a.address));
  } catch {
    return false;
  }
}

/** Téléchargement limité en taille et en temps, redirections vérifiées une à une. */
async function telecharger(adresse: string, max: number, accepte: string): Promise<{ octets: Uint8Array; type: string; url: string } | null> {
  let url = new URL(adresse);
  for (let saut = 0; saut < 5; saut++) {
    if (!(await adresseAutorisee(url))) return null;
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
    try {
      const r = await fetch(url, {
        redirect: "manual",
        signal: controle.signal,
        headers: { accept: accepte, "user-agent": "Mozilla/5.0 (compatible; HaqqReasonApercu/1.0)", "accept-language": "fr,en;q=0.8" },
      });
      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
        url = new URL(r.headers.get("location")!, url);
        clearTimeout(minuteur);
        continue;
      }
      if (!r.ok || !r.body) return null;
      const lecteur = r.body.getReader();
      const morceaux: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        total += value.length;
        if (total > max) {
          await lecteur.cancel();
          break;
        }
        morceaux.push(value);
      }
      const octets = new Uint8Array(Math.min(total, max));
      let k = 0;
      for (const m of morceaux) {
        octets.set(m.subarray(0, octets.length - k), k);
        k += m.length;
        if (k >= octets.length) break;
      }
      return { octets, type: (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(), url: url.href };
    } catch {
      return null;
    } finally {
      clearTimeout(minuteur);
    }
  }
  return null;
}

const ENTITES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç" };
function decoder(t: string): string {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, ...noms: string[]): string {
  for (const nom of noms) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${nom}["'][^>]*>`, "i");
    const balise = re.exec(html)?.[0];
    const contenu = balise && /content=["']([^"']*)["']/i.exec(balise)?.[1];
    if (contenu) return decoder(contenu);
  }
  return "";
}

/** Recopie une image distante dans l'espace privé, rattachée à l'article. Renvoie l'identifiant du fichier. */
async function garderImage(adresse: string, articleId: string): Promise<string> {
  if (!adresse) return "";
  const r = await telecharger(adresse, MAX_IMAGE, "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9");
  if (!r) return "";
  const type = ["image/jpeg", "image/png", "image/webp", "image/gif"].find((t) => signatureValide(r.octets, t));
  if (!type) return "";
  const id = randomUUID();
  const chemin = `article/${articleId}/${id}.${TYPES_FICHIERS[type].extension}`;
  const envoi = await dbAdmin().storage.from(ESPACE).upload(chemin, r.octets, { contentType: type, upsert: false });
  if (envoi.error) return "";
  const { error } = await dbAdmin().from("fichiers").insert({
    id,
    article_id: articleId,
    nom: `apercu-${domaine(adresse) || "lien"}.${TYPES_FICHIERS[type].extension}`,
    chemin,
    type_mime: type,
    taille: r.octets.length,
    etat: "pret",
    statut_texte: "non_applicable",
    dans_liste: false,
  });
  return error ? "" : id;
}

export async function apercuLien(adresse: string, articleId: string): Promise<Apercu | null> {
  let url: URL;
  try {
    url = new URL(adresse.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const base: Apercu = { url: url.href, titre: "", description: "", site: domaine(url.href), auteur: "", genre: "web", video: "", liste: "", image: "" };

  const yt = infosYoutube(url.href);
  if (yt) {
    base.genre = "youtube";
    base.video = yt.video;
    base.liste = yt.liste;
    base.site = "YouTube";
    const oembed = process.env.APERCU_OEMBED_YOUTUBE || "https://www.youtube.com/oembed";
    const r = await telecharger(`${oembed}?format=json&url=${encodeURIComponent(url.href)}`, 200_000, "application/json");
    let vignette = yt.video ? `https://i.ytimg.com/vi/${yt.video}/hqdefault.jpg` : "";
    if (r) {
      try {
        const j = JSON.parse(new TextDecoder().decode(r.octets)) as { title?: string; author_name?: string; thumbnail_url?: string };
        base.titre = (j.title ?? "").slice(0, 300);
        base.auteur = (j.author_name ?? "").slice(0, 120);
        if (j.thumbnail_url) vignette = j.thumbnail_url;
      } catch {
        /* réponse inattendue : on garde l'aperçu minimal */
      }
    }
    if (!base.titre) base.titre = yt.liste && !yt.video ? "Playlist YouTube" : "Vidéo YouTube";
    base.image = await garderImage(vignette, articleId);
    return base;
  }

  const page = await telecharger(url.href, MAX_HTML, "text/html,application/xhtml+xml");
  if (page && (page.type.includes("html") || page.type === "")) {
    const html = new TextDecoder("utf-8", { fatal: false }).decode(page.octets);
    const titre = meta(html, "og:title", "twitter:title") || decoder(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? "");
    base.titre = titre.slice(0, 300);
    base.description = meta(html, "og:description", "twitter:description", "description").slice(0, 500);
    base.site = (meta(html, "og:site_name") || domaine(page.url)).slice(0, 120);
    const image = meta(html, "og:image:secure_url", "og:image", "twitter:image", "twitter:image:src");
    if (image) {
      try {
        base.image = await garderImage(new URL(image, page.url).href, articleId);
      } catch {
        /* adresse d'image invalide */
      }
    }
  }
  if (!base.titre) base.titre = domaine(url.href) || url.href;
  return base;
}
