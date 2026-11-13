/** Reconnaissance des liens YouTube (partagé serveur / navigateur). */

export type InfosYoutube = { video: string; liste: string; debut: number };

const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_LISTE = /^[A-Za-z0-9_-]{10,64}$/;

export function infosYoutube(adresse: string): InfosYoutube | null {
  let u: URL;
  try {
    u = new URL(adresse.trim());
  } catch {
    return null;
  }
  const hote = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let video = "";
  if (hote === "youtu.be") video = u.pathname.slice(1, 12);
  else if (hote === "youtube.com" || hote === "youtube-nocookie.com") {
    if (u.pathname === "/watch") video = u.searchParams.get("v") ?? "";
    else {
      const m = /^\/(shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/.exec(u.pathname);
      if (m) video = m[2];
    }
  } else return null;
  const liste = u.searchParams.get("list") ?? "";
  const t = u.searchParams.get("t") ?? u.searchParams.get("start") ?? "";
  const debut = /^\d+$/.test(t) ? Number(t) : (() => {
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
  })();
  const v = ID_VIDEO.test(video) ? video : "";
  const l = ID_LISTE.test(liste) ? liste : "";
  if (!v && !l) return null;
  return { video: v, liste: l, debut };
}

export function domaine(adresse: string): string {
  try {
    return new URL(adresse).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
