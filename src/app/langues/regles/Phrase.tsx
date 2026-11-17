"use client";

import { Fragment } from "react";
import type { Role } from "@/lib/regles/conjugueur";
import { type Code, LEGENDE_DEFAUT } from "@/lib/regles/types";

/** Les morceaux d'une phrase colorée : [code:texte]. */
export function decouperPhrase(p: string): { code: Code | null; texte: string }[] {
  const sortie: { code: Code | null; texte: string }[] = [];
  const re = /\[([a-z]):([^\]]*)\]/g;
  let dernier = 0;
  for (let m = re.exec(p); m; m = re.exec(p)) {
    if (m.index > dernier) sortie.push({ code: null, texte: p.slice(dernier, m.index) });
    sortie.push({ code: m[1] as Code, texte: m[2] });
    dernier = m.index + m[0].length;
  }
  if (dernier < p.length) sortie.push({ code: null, texte: p.slice(dernier) });
  return sortie;
}

export const codesDe = (phrases: string[]) => {
  const vus: Code[] = [];
  for (const p of phrases) for (const m of decouperPhrase(p)) if (m.code && !vus.includes(m.code)) vus.push(m.code);
  return vus;
};

/**
 * Collé à gauche ou à droite : un morceau qui touche son voisin sans espace (chant|e, l'|aime)
 * perd sa marge de ce côté, pour que les deux couleurs forment un seul mot.
 */
export function collage(textes: string[], i: number) {
  const avant = textes[i - 1];
  const apres = textes[i + 1];
  return {
    "data-colle-g": avant && !/\s$/.test(avant) && !/^\s/.test(textes[i]) ? true : undefined,
    "data-colle-d": apres && !/^\s/.test(apres) && !/\s$/.test(textes[i]) ? true : undefined,
  };
}

/** Une phrase dont les mots colorés entrent l'un après l'autre. */
export function Phrase({ p, anime = false }: { p: string; anime?: boolean }) {
  let k = 0;
  const parts = decouperPhrase(p);
  const textes = parts.map((m) => m.texte);
  return (
    <span className="rg-phrase" data-anime={anime || undefined}>
      {parts.map((m, i) =>
        m.code ? (
          <span key={i} className="rg-mot" data-code={m.code} {...collage(textes, i)} style={{ "--i": k++ } as React.CSSProperties}>
            {m.texte}
          </span>
        ) : (
          <Fragment key={i}>{m.texte}</Fragment>
        ),
      )}
    </span>
  );
}

export function Legende({ codes, libelles }: { codes: Code[]; libelles?: Partial<Record<Code, string>> }) {
  if (!codes.length) return null;
  return (
    <ul className="rg-legende" aria-label="Les couleurs">
      {codes.map((c) => (
        <li key={c}>
          <span className="rg-pastille" data-code={c} aria-hidden="true" />
          {libelles?.[c] ?? LEGENDE_DEFAUT[c]}
        </li>
      ))}
    </ul>
  );
}

/** Les rôles de la Machine, dans les couleurs des leçons. */
export const CODE_DU_ROLE: Record<Role, Code> = {
  pronom: "s",
  que: "k",
  reflexif: "o",
  auxiliaire: "a",
  radical: "r",
  terminaison: "t",
  participe: "p",
  lien: "k",
  infinitif: "v",
};
