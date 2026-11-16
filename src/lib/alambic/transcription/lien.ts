/* Lien YouTube → identifiant de la vidéo (partagé entre le navigateur et le serveur). */

/** Identifiant d'une vidéo à partir de n'importe quelle forme de lien. */
export function idYoutube(lien: string): string | null {
  const s = lien.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const hote = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (hote === "youtu.be") return /^[\w-]{11}/.exec(u.pathname.slice(1))?.[0] ?? null;
    if (hote === "youtube.com" || hote === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = /^\/(?:embed|shorts|live|v)\/([\w-]{11})/.exec(u.pathname);
      return m?.[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
