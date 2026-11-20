"use client";

/*
 * Le Calame — un document verrouillé par un code, pour un appareil partagé.
 *
 * Le code n'est jamais gardé : seulement un sel et une empreinte (PBKDF2, SHA-256). Une fois le bon code
 * donné, le document reste ouvert jusqu'à ce qu'on ferme l'onglet (ou qu'on le reverrouille). C'est une
 * protection contre les regards d'un autre utilisateur de l'appareil, pas un chiffrement du texte.
 */

const ouverts = new Set<string>();
const abonnes = new Set<() => void>();
let version = 0;

const hex = (octets: ArrayBuffer | Uint8Array) => [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");

export async function empreinteDuCode(sel: string, code: string): Promise<string> {
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(code.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(sel), iterations: 150_000 }, cle, 256);
  return hex(bits);
}

export async function creerVerrou(code: string): Promise<{ sel: string; empreinte: string }> {
  const sel = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { sel, empreinte: await empreinteDuCode(sel, code) };
}

export async function codeJuste(verrou: { sel: string; empreinte: string }, code: string): Promise<boolean> {
  return (await empreinteDuCode(verrou.sel, code)) === verrou.empreinte;
}

const prevenir = () => {
  version++;
  abonnes.forEach((f) => f());
};

export const estOuvert = (id: string) => ouverts.has(id);
export function ouvrirVerrou(id: string) {
  ouverts.add(id);
  prevenir();
}
export function refermer(id?: string) {
  if (id) ouverts.delete(id);
  else ouverts.clear();
  prevenir();
}
export function abonnerVerrous(f: () => void): () => void {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}
export const versionVerrous = () => version;
